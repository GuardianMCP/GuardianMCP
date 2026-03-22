package rules

import (
	"testing"

	"github.com/guardianmcp/guardianmcp/internal/types"
)

func TestHardcodedSecretsRule_Check(t *testing.T) {
	rule := &HardcodedSecretsRule{}

	tests := []struct {
		name         string
		path         string
		code         string
		wantFindings int
	}{
		// --- Positive cases: should detect secrets ---
		{
			name: "GitHub Personal Access Token",
			path: "src/config.ts",
			code: `const token = "ghp_ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghij";
export default { token };`,
			wantFindings: 1,
		},
		{
			name: "AWS Access Key ID",
			path: "deploy/config.js",
			code: `const awsKey = "AKIAIOSFODNN7EXAMPLE";
module.exports = { awsKey };`,
			wantFindings: 1,
		},
		{
			name: "Private Key Block",
			path: "server/certs.ts",
			code: `const tls = require('tls');
const key = "-----BEGIN RSA PRIVATE KEY-----";
export default key;`,
			wantFindings: 1,
		},
		{
			name: "Multiple secrets in one file",
			path: "src/app.js",
			code: `const githubToken = "ghp_ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghij";
const awsAccessKey = "AKIAIOSFODNN7EXAMPLE";
const key = "-----BEGIN RSA PRIVATE KEY-----";`,
			wantFindings: 3,
		},

		// --- Negative cases: should NOT detect secrets ---
		{
			name: "Environment variable reference (no hardcoded secret)",
			path: "src/config.ts",
			code: `const token = process.env.GITHUB_TOKEN;
const awsKey = process.env.AWS_ACCESS_KEY_ID;
export default { token, awsKey };`,
			wantFindings: 0,
		},
		{
			name: "Nosec comment suppresses detection",
			path: "src/config.ts",
			code: `const token = "ghp_ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghij"; // nosec
const awsKey = "AKIAIOSFODNN7EXAMPLE"; // nosec`,
			wantFindings: 0,
		},
		{
			name: "Placeholder value is ignored",
			path: "src/config.ts",
			code: `api_key = "your-api-key"
api_token = "INSERT_KEY_HERE"
password = "changeme"`,
			wantFindings: 0,
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			fc := makeFileContext(tt.path, tt.code)
			findings := rule.Check(fc)
			if len(findings) != tt.wantFindings {
				t.Errorf("HardcodedSecretsRule.Check() returned %d findings, want %d", len(findings), tt.wantFindings)
				for i, f := range findings {
					t.Logf("  finding[%d]: line=%d message=%q", i, f.Line, f.Message)
				}
			}
			// Verify metadata on findings that are returned
			for _, f := range findings {
				if f.RuleID != "MCP-001" {
					t.Errorf("expected RuleID MCP-001, got %s", f.RuleID)
				}
				if f.Severity != types.SeverityCritical {
					t.Errorf("expected severity CRITICAL, got %s", f.Severity)
				}
			}
		})
	}
}
