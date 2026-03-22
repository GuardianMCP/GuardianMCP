package rules

import (
	"regexp"
	"strings"

	"github.com/guardianmcp/guardianmcp/internal/types"
)

// OAuthInjectionRule detects CVE-2025-6514 pattern: OAuth authorization endpoints used in shell execution.
type OAuthInjectionRule struct{}

func (r *OAuthInjectionRule) ID() string   { return "MCP-007" }
func (r *OAuthInjectionRule) Name() string { return "OAuth/Authorization Endpoint Injection" }
func (r *OAuthInjectionRule) Description() string {
	return "Detect OAuth authorization endpoint URLs used in shell execution without sanitization"
}
func (r *OAuthInjectionRule) Severity() types.Severity { return types.SeverityCritical }

var (
	authEndpointRead   = regexp.MustCompile(`(?i)authorization_endpoint`)
	authURLDynamic     = regexp.MustCompile(`(?i)(authorizationUrl|auth_url|authorize_url|authorization_url)\s*[:=]`)
	redirectURIMissing = regexp.MustCompile(`(?i)redirect_uri.*(?:req\.|params\.|query\.)`)

	execPatterns = regexp.MustCompile(`(?i)(exec|spawn|execSync|child_process|open|xdg-open|start)\s*\(`)
)

func (r *OAuthInjectionRule) Check(file types.FileContext) []types.Finding {
	if IsTestFile(file.Path) {
		return nil
	}

	ext := strings.ToLower(file.Extension)
	if ext != ".ts" && ext != ".js" && ext != ".go" && ext != ".py" {
		return nil
	}

	var findings []types.Finding

	// Check for authorization_endpoint read + exec usage within 20 lines
	authMatches := MatchAllRegex(authEndpointRead, file.Lines)
	for _, am := range authMatches {
		if HasNosecComment(am.LineStr) {
			continue
		}

		// Look for exec within 20 lines
		end := am.Line + 20
		if end > len(file.Lines) {
			end = len(file.Lines)
		}
		for i := am.Line - 1; i < end; i++ {
			if execPatterns.MatchString(file.Lines[i]) {
				findings = append(findings, MakeFinding(
					r, file, am.Line,
					GetSnippet(file.Lines, am.Line, 5),
					"OAuth authorization_endpoint value used near shell execution — CVE-2025-6514 pattern.",
					"Never pass OAuth endpoint URLs to exec/open without strict URL validation. Validate the URL scheme is https:// and the host is from a known allowlist.",
					"HIGH",
					[]string{"CVE-2025-6514"},
					[]string{"MCP01"},
				))
				break
			}
		}
	}

	// Check for dynamic authorizationUrl from external source
	dynMatches := MatchAllRegex(authURLDynamic, file.Lines)
	for _, m := range dynMatches {
		if HasNosecComment(m.LineStr) {
			continue
		}
		// If the value seems to come from an external source
		if containsExternalSource(m.LineStr) {
			findings = append(findings, MakeFinding(
				r, file, m.Line,
				GetSnippet(file.Lines, m.Line, 3),
				"OAuth authorization URL from dynamic/external source — validate before use.",
				"Validate the authorization URL against a known allowlist of OAuth providers.",
				"MEDIUM",
				[]string{"CVE-2025-6514"},
				[]string{"MCP01"},
			))
		}
	}

	// Check for unvalidated redirect_uri
	redirectMatches := MatchAllRegex(redirectURIMissing, file.Lines)
	for _, m := range redirectMatches {
		if HasNosecComment(m.LineStr) {
			continue
		}
		findings = append(findings, MakeFinding(
			r, file, m.Line,
			GetSnippet(file.Lines, m.Line, 2),
			"OAuth redirect_uri uses user-provided value — validate against registered allowlist.",
			"Always validate redirect_uri against a pre-registered allowlist of callback URLs.",
			"MEDIUM",
			[]string{"CVE-2025-6514"},
			[]string{"MCP01"},
		))
	}

	return findings
}

func containsExternalSource(line string) bool {
	indicators := []string{
		"req.", "request.", "params.", "query.", "body.",
		"fetch(", "axios.", "http.", "response.",
		"config.", "metadata.", "discovery.",
	}
	for _, ind := range indicators {
		if strings.Contains(line, ind) {
			return true
		}
	}
	return false
}
