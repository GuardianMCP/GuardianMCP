package rules

import (
	"testing"
)

func TestOAuthInjectionRule_Check(t *testing.T) {
	rule := &OAuthInjectionRule{}

	tests := []struct {
		name         string
		path         string
		code         string
		wantFindings int
		description  string
	}{
		// --- Positive cases ---
		{
			name: "authorization_endpoint near exec call",
			path: "src/oauth.ts",
			code: `const endpoint = metadata.authorization_endpoint;
const args = buildArgs(endpoint);
exec(args);`,
			wantFindings: 1,
			description: "Should detect authorization_endpoint value used near shell exec call",
		},
		{
			name: "dynamic authorizationUrl from request",
			path: "src/auth.js",
			code: `const authorizationUrl = req.body.authUrl;`,
			wantFindings: 1,
			description: "Should detect dynamic OAuth authorization URL sourced from request body",
		},
		{
			name: "redirect_uri from user params",
			path: "src/callback.ts",
			code: `const redirect_uri = req.query.redirect_uri;`,
			wantFindings: 1,
			description: "Should detect redirect_uri taking value from user-provided query params",
		},
		{
			name: "authorization_endpoint with xdg-open",
			path: "auth/flow.py",
			code: `url = discovery["authorization_endpoint"]
# open in browser
xdg-open(url)`,
			wantFindings: 1,
			description: "Should detect authorization_endpoint used near xdg-open shell command",
		},
		// --- Negative cases ---
		{
			name: "static hardcoded OAuth URL - no hit",
			path: "src/config.ts",
			code: `const authorizationUrl = "https://accounts.google.com/o/oauth2/auth";`,
			wantFindings: 0,
			description: "Should not flag hardcoded static OAuth URLs without external source indicators",
		},
		{
			name: "authorization_endpoint without exec - no hit",
			path: "src/discovery.js",
			code: `const endpoint = metadata.authorization_endpoint;
console.log("Discovered endpoint:", endpoint);
return endpoint;`,
			wantFindings: 0,
			description: "Should not flag authorization_endpoint when no exec/open is nearby",
		},
		{
			name: "unsupported file extension - no hit",
			path: "config/oauth.yaml",
			code: `authorization_endpoint: https://example.com/auth
exec: true`,
			wantFindings: 0,
			description: "Should not scan unsupported file extensions like .yaml for this rule",
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			fc := makeFileContext(tt.path, tt.code)
			findings := rule.Check(fc)

			if len(findings) != tt.wantFindings {
				t.Errorf("%s: got %d findings, want %d.\nCode: %s\nFindings: %+v",
					tt.description, len(findings), tt.wantFindings, tt.code, findings)
			}

			// Verify rule metadata on findings
			for _, f := range findings {
				if f.RuleID != "MCP-007" {
					t.Errorf("expected RuleID MCP-007, got %s", f.RuleID)
				}
				if f.File != tt.path {
					t.Errorf("expected File %s, got %s", tt.path, f.File)
				}
			}
		})
	}
}
