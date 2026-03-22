package rules

import (
	"regexp"
	"strings"

	"github.com/guardianmcp/guardianmcp/internal/types"
)

// NetworkBindingRule detects servers bound to all interfaces (0.0.0.0).
type NetworkBindingRule struct{}

func (r *NetworkBindingRule) ID() string   { return "MCP-009" }
func (r *NetworkBindingRule) Name() string { return "Insecure Network Binding" }
func (r *NetworkBindingRule) Description() string {
	return "Detect servers bound to all interfaces (0.0.0.0) when they should be localhost-only"
}
func (r *NetworkBindingRule) Severity() types.Severity { return types.SeverityMedium }

var (
	// TypeScript/JavaScript
	jsListenAll  = regexp.MustCompile(`listen\(\d+,\s*['"]0\.0\.0\.0['"]`)
	jsListenIPv6 = regexp.MustCompile(`listen\(\d+,\s*['"]::['"]`)
	jsHostConfig = regexp.MustCompile(`host:\s*['"]0\.0\.0\.0['"]`)

	// Go
	goListenServe = regexp.MustCompile(`ListenAndServe\("0\.0\.0\.0:`)
	goNetListen   = regexp.MustCompile(`net\.Listen\("tcp",\s*"0\.0\.0\.0:`)
	goEmptyHost   = regexp.MustCompile(`ListenAndServe\(":\d+`)

	// Config files
	configBindAll = regexp.MustCompile(`(?i)(host|bind|address):\s*["']?0\.0\.0\.0["']?`)
)

func (r *NetworkBindingRule) Check(file types.FileContext) []types.Finding {
	if IsTestFile(file.Path) {
		return nil
	}

	ext := strings.ToLower(file.Extension)
	isDocker := isDockerFile(file)

	var findings []types.Finding

	switch ext {
	case ".ts", ".js":
		findings = append(findings, r.checkJS(file, isDocker)...)
	case ".go":
		findings = append(findings, r.checkGo(file, isDocker)...)
	case ".yaml", ".yml", ".json", ".toml", ".conf", ".ini":
		findings = append(findings, r.checkConfig(file, isDocker)...)
	}

	return findings
}

func (r *NetworkBindingRule) checkJS(file types.FileContext, isDocker bool) []types.Finding {
	var findings []types.Finding

	patterns := []*regexp.Regexp{jsListenAll, jsListenIPv6, jsHostConfig}
	for _, re := range patterns {
		matches := MatchAllRegex(re, file.Lines)
		for _, m := range matches {
			if HasNosecComment(m.LineStr) {
				continue
			}
			sev := types.SeverityMedium
			if isDocker {
				sev = types.SeverityInfo
			}
			findings = append(findings, types.Finding{
				RuleID:      r.ID(),
				RuleName:    r.Name(),
				Severity:    sev,
				File:        file.Path,
				Line:        m.Line,
				Column:      m.Column,
				Snippet:     GetSnippet(file.Lines, m.Line, 1),
				Message:     "Server bound to 0.0.0.0 — accessible from all network interfaces.",
				Remediation: "Bind to 127.0.0.1 unless external access is required.",
				Confidence:  "HIGH",
				OWASPRefs:   []string{"MCP05"},
			})
		}
	}

	return findings
}

func (r *NetworkBindingRule) checkGo(file types.FileContext, isDocker bool) []types.Finding {
	var findings []types.Finding

	patterns := []struct {
		re  *regexp.Regexp
		msg string
	}{
		{goListenServe, "ListenAndServe bound to 0.0.0.0 — accessible from all interfaces."},
		{goNetListen, "net.Listen bound to 0.0.0.0 — accessible from all interfaces."},
		{goEmptyHost, "ListenAndServe with empty host binds to all interfaces."},
	}

	for _, pat := range patterns {
		matches := MatchAllRegex(pat.re, file.Lines)
		for _, m := range matches {
			if HasNosecComment(m.LineStr) {
				continue
			}
			sev := types.SeverityMedium
			if isDocker {
				sev = types.SeverityInfo
			}
			findings = append(findings, types.Finding{
				RuleID:      r.ID(),
				RuleName:    r.Name(),
				Severity:    sev,
				File:        file.Path,
				Line:        m.Line,
				Column:      m.Column,
				Snippet:     GetSnippet(file.Lines, m.Line, 1),
				Message:     pat.msg,
				Remediation: "Bind to 127.0.0.1:PORT unless external access is required.",
				Confidence:  "HIGH",
				OWASPRefs:   []string{"MCP05"},
			})
		}
	}

	return findings
}

func (r *NetworkBindingRule) checkConfig(file types.FileContext, isDocker bool) []types.Finding {
	var findings []types.Finding

	matches := MatchAllRegex(configBindAll, file.Lines)
	for _, m := range matches {
		if HasNosecComment(m.LineStr) {
			continue
		}
		sev := types.SeverityMedium
		if isDocker {
			sev = types.SeverityInfo
		}
		findings = append(findings, types.Finding{
			RuleID:      r.ID(),
			RuleName:    r.Name(),
			Severity:    sev,
			File:        file.Path,
			Line:        m.Line,
			Column:      m.Column,
			Snippet:     GetSnippet(file.Lines, m.Line, 1),
			Message:     "Configuration binds to 0.0.0.0 — accessible from all interfaces.",
			Remediation: "Set host to 127.0.0.1 unless container deployment requires 0.0.0.0.",
			Confidence:  "HIGH",
			OWASPRefs:   []string{"MCP05"},
		})
	}

	return findings
}

func isDockerFile(file types.FileContext) bool {
	lower := strings.ToLower(file.Filename)
	if strings.Contains(lower, "docker") || strings.Contains(lower, "dockerfile") {
		return true
	}
	content := strings.ToLower(string(file.Content))
	return strings.Contains(content, "expose") && strings.Contains(content, "container")
}
