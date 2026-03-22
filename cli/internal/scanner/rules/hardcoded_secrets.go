package rules

import (
	"regexp"

	"github.com/guardianmcp/guardianmcp/internal/types"
)

// HardcodedSecretsRule detects hardcoded credentials, API keys, tokens, and passwords.
type HardcodedSecretsRule struct{}

func (r *HardcodedSecretsRule) ID() string   { return "MCP-001" }
func (r *HardcodedSecretsRule) Name() string { return "Hardcoded Secrets" }
func (r *HardcodedSecretsRule) Description() string {
	return "Detect hardcoded credentials, API keys, tokens, and passwords"
}
func (r *HardcodedSecretsRule) Severity() types.Severity { return types.SeverityCritical }

type secretPattern struct {
	name       string
	re         *regexp.Regexp
	confidence string
}

var secretPatterns = []secretPattern{
	{
		name:       "GitHub Personal Access Token",
		re:         regexp.MustCompile(`ghp_[a-zA-Z0-9]{36}`),
		confidence: "HIGH",
	},
	{
		name:       "AWS Access Key ID",
		re:         regexp.MustCompile(`AKIA[0-9A-Z]{16}`),
		confidence: "HIGH",
	},
	{
		name:       "AWS Secret Access Key",
		re:         regexp.MustCompile(`(?i)aws[_\-]?secret[_\-]?access[_\-]?key\s*[:=]\s*["'][^"']{20,}["']`),
		confidence: "HIGH",
	},
	{
		name:       "Stripe Secret Key",
		re:         regexp.MustCompile(`sk_live_[a-zA-Z0-9]{24,}`),
		confidence: "HIGH",
	},
	{
		name:       "Stripe Publishable Key (Live)",
		re:         regexp.MustCompile(`pk_live_[a-zA-Z0-9]{24,}`),
		confidence: "HIGH",
	},
	{
		name:       "Private Key Block",
		re:         regexp.MustCompile(`-----BEGIN (RSA|EC|OPENSSH|DSA) PRIVATE KEY-----`),
		confidence: "HIGH",
	},
	{
		name:       "SendGrid API Key",
		re:         regexp.MustCompile(`SG\.[a-zA-Z0-9_\-]{22}\.[a-zA-Z0-9_\-]{43}`),
		confidence: "HIGH",
	},
	{
		name:       "Generic API Key Assignment",
		re:         regexp.MustCompile(`(?i)(api[_\-]?key|apikey|api[_\-]?token)\s*[:=]\s*["'][a-zA-Z0-9_\-]{16,}["']`),
		confidence: "MEDIUM",
	},
	{
		name:       "Generic Password Assignment",
		re:         regexp.MustCompile(`(?i)(password|passwd|pwd)\s*[:=]\s*["'][^"']{6,}["']`),
		confidence: "MEDIUM",
	},
	{
		name:       "Bearer Token in Code",
		re:         regexp.MustCompile(`(?i)bearer\s+[a-zA-Z0-9\-._~+/]{20,}`),
		confidence: "MEDIUM",
	},
}

func (r *HardcodedSecretsRule) Check(file types.FileContext) []types.Finding {
	if IsTestFile(file.Path) {
		return nil
	}

	var findings []types.Finding

	for _, pat := range secretPatterns {
		// Skip most patterns in .env.example files
		if IsEnvExampleFile(file.Path) && pat.confidence != "HIGH" {
			continue
		}
		// For specific tokens like GitHub, AWS, Stripe — still flag in .env.example
		if IsEnvExampleFile(file.Path) && (pat.name == "Generic API Key Assignment" ||
			pat.name == "Generic Password Assignment" || pat.name == "Bearer Token in Code") {
			continue
		}

		matches := MatchAllRegex(pat.re, file.Lines)
		for _, m := range matches {
			if HasNosecComment(m.LineStr) {
				continue
			}

			if IsPlaceholderValue(m.Text) {
				continue
			}

			findings = append(findings, MakeFinding(
				r, file, m.Line,
				GetSnippet(file.Lines, m.Line, 1),
				pat.name+" detected: "+truncate(m.Text, 60),
				"Remove this secret from the codebase. Move to environment variable. Rotate immediately.",
				pat.confidence,
				[]string{"CVE-2025-6514"},
				[]string{"MCP01"},
			))
		}
	}

	return findings
}

func truncate(s string, maxLen int) string {
	if len(s) <= maxLen {
		return s
	}
	return s[:maxLen-3] + "..."
}
