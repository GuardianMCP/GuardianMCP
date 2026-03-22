package rules

import (
	"testing"

	"github.com/guardianmcp/guardianmcp/internal/types"
)

func TestNetworkBindingRule_Check(t *testing.T) {
	rule := &NetworkBindingRule{}

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
			name: "JS listen on 0.0.0.0",
			path: "src/server.js",
			code: `app.listen(3000, '0.0.0.0', () => {
  console.log('Server running');
});`,
			wantFindings: 1,
			wantSeverity: types.SeverityMedium,
			description:  "Should detect JS server listening on 0.0.0.0",
		},
		{
			name: "Go ListenAndServe on 0.0.0.0",
			path: "cmd/server.go",
			code: `func main() {
	http.ListenAndServe("0.0.0.0:8080", handler)
}`,
			wantFindings: 1,
			wantSeverity: types.SeverityMedium,
			description:  "Should detect Go ListenAndServe bound to 0.0.0.0",
		},
		{
			name: "YAML config host 0.0.0.0",
			path: "config/server.yaml",
			code: `server:
  host: 0.0.0.0
  port: 8080`,
			wantFindings: 1,
			wantSeverity: types.SeverityMedium,
			description:  "Should detect YAML configuration binding to 0.0.0.0",
		},
		{
			name: "JS host config object with 0.0.0.0",
			path: "src/app.ts",
			code: `const config = {
  host: '0.0.0.0',
  port: 4000,
};`,
			wantFindings: 1,
			wantSeverity: types.SeverityMedium,
			description:  "Should detect host config set to 0.0.0.0 in JS/TS files",
		},
		// --- Negative cases ---
		{
			name: "localhost binding 127.0.0.1 - no hit",
			path: "src/server.js",
			code: `app.listen(3000, '127.0.0.1', () => {
  console.log('Server running on localhost');
});`,
			wantFindings: 0,
			description:  "Should not flag servers bound to 127.0.0.1 (localhost)",
		},
		{
			name: "Docker file downgrades to INFO severity",
			path: "docker/docker-compose.yaml",
			code: `services:
  app:
    host: 0.0.0.0
    port: 8080
    expose: ["8080"]
    container: app`,
			wantFindings: 1,
			wantSeverity: types.SeverityInfo,
			description:  "Should downgrade severity to INFO for Docker-related files",
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
				if f.RuleID != "MCP-009" {
					t.Errorf("expected RuleID MCP-009, got %s", f.RuleID)
				}
				if f.File != tt.path {
					t.Errorf("expected File %s, got %s", tt.path, f.File)
				}
			}
		})
	}
}
