package rules

import (
	"testing"

	"github.com/guardianmcp/guardianmcp/internal/types"
)

func TestSSRFRule_Check(t *testing.T) {
	rule := &SSRFRule{}

	tests := []struct {
		name         string
		path         string
		code         string
		wantFindings int
	}{
		// --- Positive cases: should detect SSRF ---
		{
			name: "fetch with req parameter",
			path: "src/proxy.ts",
			code: `import express from 'express';

app.get('/proxy', async (req, res) => {
    const response = await fetch(req.query.url);
    const data = await response.json();
    res.json(data);
});`,
			wantFindings: 1,
		},
		{
			name: "axios.get with req parameter",
			path: "src/fetcher.js",
			code: `const axios = require('axios');

app.post('/fetch', async (req, res) => {
    const result = await axios.get(req.body.endpoint);
    res.json(result.data);
});`,
			wantFindings: 1,
		},
		{
			name: "Go http.Get with string concatenation",
			path: "internal/client/fetch.go",
			code: `package client

import "net/http"

func fetchRemote(baseURL, userPath string) (*http.Response, error) {
	return http.Get(baseURL + "/api/" + userPath)
}`,
			wantFindings: 1,
		},
		{
			name: "Go url.Parse without host validation",
			path: "internal/proxy/handler.go",
			code: `package proxy

import (
	"net/http"
	"net/url"
)

func proxyRequest(target string) (*http.Response, error) {
	u, err := url.Parse(target)
	if err != nil {
		return nil, err
	}
	return http.Get(u.String())
}`,
			wantFindings: 1,
		},

		// --- Negative cases: should NOT detect SSRF ---
		{
			name: "url.Parse with host validation",
			path: "internal/proxy/safe_handler.go",
			code: `package proxy

import (
	"errors"
	"net/http"
	"net/url"
)

var allowedHosts = map[string]bool{"api.example.com": true}

func safeProxy(target string) (*http.Response, error) {
	u, err := url.Parse(target)
	if err != nil {
		return nil, err
	}
	if !allowedHosts[u.Host] {
		return nil, errors.New("host not in allowlist")
	}
	return http.Get(u.String())
}`,
			wantFindings: 0,
		},
		{
			name: "Static URL fetch (no user input)",
			path: "src/health.ts",
			code: `async function checkHealth() {
    const response = await fetch("https://api.example.com/health");
    return response.ok;
}`,
			wantFindings: 0,
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			fc := makeFileContext(tt.path, tt.code)
			findings := rule.Check(fc)
			if len(findings) != tt.wantFindings {
				t.Errorf("SSRFRule.Check() returned %d findings, want %d", len(findings), tt.wantFindings)
				for i, f := range findings {
					t.Logf("  finding[%d]: line=%d message=%q", i, f.Line, f.Message)
				}
			}
			for _, f := range findings {
				if f.RuleID != "MCP-005" {
					t.Errorf("expected RuleID MCP-005, got %s", f.RuleID)
				}
				if f.Severity != types.SeverityHigh {
					t.Errorf("expected severity HIGH, got %s", f.Severity)
				}
			}
		})
	}
}
