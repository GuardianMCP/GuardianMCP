package rules

import (
	"testing"

	"github.com/guardianmcp/guardianmcp/internal/types"
)

func TestMissingAuthRule_Check(t *testing.T) {
	rule := &MissingAuthRule{}

	tests := []struct {
		name         string
		path         string
		code         string
		wantFindings int
	}{
		// --- Positive cases: should detect missing auth ---
		{
			name: "Express route without auth middleware",
			path: "src/routes.ts",
			code: `import express from 'express';
const app = express();
app.post('/mcp/tools', (req, res) => {
    res.json({ tools: listTools() });
});`,
			wantFindings: 1,
		},
		{
			name: "NestJS endpoint without UseGuards",
			path: "src/mcp.controller.ts",
			code: `import { Controller, Post } from '@nestjs/common';

@Controller()
export class McpController {
    @Post('/mcp/execute')
    async executeTool() {
        return { result: 'ok' };
    }
}`,
			wantFindings: 1,
		},
		{
			name: "Go HTTP handler without auth check",
			path: "cmd/server/main.go",
			code: `package main

import "net/http"

func main() {
	http.HandleFunc("/mcp/run", func(w http.ResponseWriter, r *http.Request) {
		w.Write([]byte("executed"))
	})
	http.ListenAndServe(":8080", nil)
}`,
			wantFindings: 1,
		},

		// --- Negative cases: should NOT detect missing auth ---
		{
			name: "Express route with auth middleware before it",
			path: "src/routes.ts",
			code: `import express from 'express';
const app = express();
app.use(authMiddleware);
app.post('/mcp/tools', (req, res) => {
    res.json({ tools: listTools() });
});`,
			wantFindings: 0,
		},
		{
			name: "NestJS endpoint with UseGuards decorator",
			path: "src/mcp.controller.ts",
			code: `import { Controller, Post, UseGuards } from '@nestjs/common';
import { AuthGuard } from './auth.guard';

@Controller()
export class McpController {
    @UseGuards(AuthGuard)
    @Post('/mcp/execute')
    async executeTool() {
        return { result: 'ok' };
    }
}`,
			wantFindings: 0,
		},
		{
			name: "Go handler with authentication check inside",
			path: "cmd/server/main.go",
			code: `package main

import "net/http"

func main() {
	http.HandleFunc("/mcp/run", func(w http.ResponseWriter, r *http.Request) {
		token := r.Header.Get("Authorization")
		if !verifyToken(token) {
			http.Error(w, "unauthorized", 401)
			return
		}
		w.Write([]byte("executed"))
	})
}`,
			wantFindings: 0,
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			fc := makeFileContext(tt.path, tt.code)
			findings := rule.Check(fc)
			if len(findings) != tt.wantFindings {
				t.Errorf("MissingAuthRule.Check() returned %d findings, want %d", len(findings), tt.wantFindings)
				for i, f := range findings {
					t.Logf("  finding[%d]: line=%d message=%q", i, f.Line, f.Message)
				}
			}
			for _, f := range findings {
				if f.RuleID != "MCP-002" {
					t.Errorf("expected RuleID MCP-002, got %s", f.RuleID)
				}
				if f.Severity != types.SeverityHigh {
					t.Errorf("expected severity HIGH, got %s", f.Severity)
				}
			}
		})
	}
}
