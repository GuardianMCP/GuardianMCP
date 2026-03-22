package rules

import (
	"testing"

	"github.com/guardianmcp/guardianmcp/internal/types"
)

func TestSupplyChainRule_Check(t *testing.T) {
	rule := &SupplyChainRule{}

	tests := []struct {
		name         string
		path         string
		code         string
		wantFindings int
		wantSeverity types.Severity // expected severity of first finding (if any)
		description  string
	}{
		// --- Positive cases ---
		{
			name: "mcp-remote below 1.0.5",
			path: "package.json",
			code: `{
  "name": "my-mcp-project",
  "dependencies": {
    "mcp-remote": "^1.0.3",
    "express": "^4.18.0"
  }
}`,
			wantFindings: 1,
			wantSeverity: types.SeverityCritical,
			description:  "Should flag mcp-remote below v1.0.5 as CRITICAL (CVE-2025-6514)",
		},
		{
			name: "anthropic mcp-server-git below 0.2.1",
			path: "package.json",
			code: `{
  "name": "git-server",
  "dependencies": {
    "@anthropic-ai/mcp-server-git": "0.1.9"
  }
}`,
			wantFindings: 1,
			wantSeverity: types.SeverityHigh,
			description:  "Should flag @anthropic-ai/mcp-server-git below v0.2.1 as HIGH",
		},
		{
			name: "GitHub URL dependency",
			path: "package.json",
			code: `{
  "name": "my-project",
  "dependencies": {
    "custom-tool": "github:user/repo#main"
  }
}`,
			wantFindings: 1,
			wantSeverity: types.SeverityLow,
			description:  "Should flag dependencies sourced from GitHub URLs instead of npm registry",
		},
		{
			name: "wildcard version dependency",
			path: "package.json",
			code: `{
  "name": "loose-project",
  "dependencies": {
    "some-package": "*"
  }
}`,
			wantFindings: 1,
			wantSeverity: types.SeverityLow,
			description:  "Should flag dependencies with wildcard (*) version",
		},
		{
			name: "latest version dependency",
			path: "package.json",
			code: `{
  "name": "unpinned-project",
  "dependencies": {
    "risky-lib": "latest"
  }
}`,
			wantFindings: 1,
			wantSeverity: types.SeverityLow,
			description:  "Should flag dependencies with 'latest' as version",
		},
		// --- Negative cases ---
		{
			name: "safe mcp-remote version - no hit",
			path: "package.json",
			code: `{
  "name": "safe-project",
  "dependencies": {
    "mcp-remote": "^1.0.5",
    "express": "^4.18.0"
  }
}`,
			wantFindings: 0,
			description:  "Should not flag mcp-remote at version 1.0.5 or above",
		},
		{
			name: "safe anthropic package version - no hit",
			path: "package.json",
			code: `{
  "name": "safe-git-server",
  "dependencies": {
    "@anthropic-ai/mcp-server-git": "^0.2.1"
  }
}`,
			wantFindings: 0,
			description:  "Should not flag @anthropic-ai/mcp-server-git at version 0.2.1 or above",
		},
		{
			name: "pinned npm dependencies - no hit",
			path: "package.json",
			code: `{
  "name": "well-pinned",
  "dependencies": {
    "express": "^4.18.2",
    "lodash": "~4.17.21"
  }
}`,
			wantFindings: 0,
			description:  "Should not flag properly pinned npm dependencies",
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			fc := makeFileContext(tt.path, tt.code)
			findings := rule.Check(fc)

			if len(findings) != tt.wantFindings {
				t.Errorf("%s: got %d findings, want %d.\nCode: %s\nFindings: %+v",
					tt.description, len(findings), tt.wantFindings, tt.code, findings)
				return
			}

			// Verify severity when findings are expected
			if tt.wantFindings > 0 && tt.wantSeverity != "" {
				if findings[0].Severity != tt.wantSeverity {
					t.Errorf("%s: got severity %s, want %s",
						tt.description, findings[0].Severity, tt.wantSeverity)
				}
			}

			// Verify rule metadata on findings
			for _, f := range findings {
				if f.RuleID != "MCP-010" {
					t.Errorf("expected RuleID MCP-010, got %s", f.RuleID)
				}
				if f.File != tt.path {
					t.Errorf("expected File %s, got %s", tt.path, f.File)
				}
			}
		})
	}
}
