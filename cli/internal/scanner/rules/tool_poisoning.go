package rules

import (
	"regexp"
	"strings"

	"github.com/guardianmcp/guardianmcp/internal/types"
)

// ToolPoisoningRule detects MCP tool descriptions that may manipulate agent behavior.
type ToolPoisoningRule struct{}

func (r *ToolPoisoningRule) ID() string   { return "MCP-008" }
func (r *ToolPoisoningRule) Name() string { return "Tool Poisoning Risk" }
func (r *ToolPoisoningRule) Description() string {
	return "Detect MCP tool descriptions that contain executable-style instructions or prompt injection"
}
func (r *ToolPoisoningRule) Severity() types.Severity { return types.SeverityMedium }

var injectionPhrases = []string{
	"ignore previous",
	"disregard",
	"do not tell",
	"system:",
	"[INST]",
	"<|im_start|>",
	"you are now",
	"your new instructions",
	"forget your instructions",
	"override your",
	"act as",
}

var (
	descriptionField = regexp.MustCompile(`(?i)["']?description["']?\s*[:=]\s*["'](.+)["']`)
	toolDefPattern   = regexp.MustCompile(`(?i)(tools?\s*[:=]|inputSchema|tool_definition|name\s*[:=])`)

	// MCP config loaded from URL
	configFromURL  = regexp.MustCompile(`(?i)(fetch|axios|http\.get|requests\.get)\(.*(?:mcp|tool|config)`)
	dynamicToolReg = regexp.MustCompile(`(?i)(register|add)Tool\(.*(?:req\.|body\.|params\.)`)
)

func (r *ToolPoisoningRule) Check(file types.FileContext) []types.Finding {
	if IsTestFile(file.Path) {
		return nil
	}

	ext := strings.ToLower(file.Extension)
	if ext != ".ts" && ext != ".js" && ext != ".json" && ext != ".yaml" && ext != ".yml" {
		return nil
	}

	var findings []types.Finding

	// Check for injection phrases in descriptions
	for i, line := range file.Lines {
		lower := strings.ToLower(line)

		// Only check lines that look like descriptions
		if !strings.Contains(lower, "description") {
			continue
		}

		for _, phrase := range injectionPhrases {
			if strings.Contains(lower, strings.ToLower(phrase)) {
				findings = append(findings, MakeFinding(
					r, file, i+1,
					GetSnippet(file.Lines, i+1, 2),
					"Tool description contains suspicious prompt injection phrase: \""+phrase+"\"",
					"Remove prompt injection phrases from tool descriptions. Descriptions should only contain factual information about the tool's purpose.",
					"HIGH",
					[]string{"CVE-2025-54136"},
					[]string{"MCP03"},
				))
				break
			}
		}

		// Check for overly long descriptions (>500 chars)
		matches := descriptionField.FindStringSubmatch(line)
		if len(matches) > 1 && len(matches[1]) > 500 {
			findings = append(findings, MakeFinding(
				r, file, i+1,
				GetSnippet(file.Lines, i+1, 1),
				"Tool description is unusually long (>500 characters) — a potential vector for hidden instructions.",
				"Keep tool descriptions concise. Long descriptions may hide malicious instructions.",
				"LOW",
				[]string{"CVE-2025-54136"},
				[]string{"MCP03"},
			))
		}

		// Check for markdown in descriptions
		if strings.Contains(lower, "description") &&
			(strings.Contains(line, "```") || strings.Contains(line, "## ") || strings.Contains(line, "# ")) {
			findings = append(findings, MakeFinding(
				r, file, i+1,
				GetSnippet(file.Lines, i+1, 1),
				"Tool description contains Markdown formatting — may be used to inject structured instructions.",
				"Avoid complex formatting in tool descriptions.",
				"LOW",
				[]string{"CVE-2025-54136"},
				[]string{"MCP03"},
			))
		}
	}

	// Check for config loaded from external URL
	matches := MatchAllRegex(configFromURL, file.Lines)
	for _, m := range matches {
		if HasNosecComment(m.LineStr) {
			continue
		}
		findings = append(findings, MakeFinding(
			r, file, m.Line,
			GetSnippet(file.Lines, m.Line, 2),
			"MCP server config appears to be loaded from an external URL — verify integrity.",
			"Pin MCP server configurations locally. If loading remotely, verify checksums or use signed configurations.",
			"MEDIUM",
			[]string{"CVE-2025-54136"},
			[]string{"MCP03"},
		))
	}

	// Check for dynamic tool registration
	dynMatches := MatchAllRegex(dynamicToolReg, file.Lines)
	for _, m := range dynMatches {
		if HasNosecComment(m.LineStr) {
			continue
		}
		findings = append(findings, MakeFinding(
			r, file, m.Line,
			GetSnippet(file.Lines, m.Line, 2),
			"Dynamic tool registration from user input — tools should require re-validation.",
			"Do not allow tool definitions to be modified after initial approval. Require explicit re-validation for dynamic registrations.",
			"MEDIUM",
			[]string{"CVE-2025-54136"},
			[]string{"MCP03"},
		))
	}

	return findings
}
