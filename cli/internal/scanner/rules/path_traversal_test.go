package rules

import (
	"testing"

	"github.com/guardianmcp/guardianmcp/internal/types"
)

func TestPathTraversalRule_Check(t *testing.T) {
	rule := &PathTraversalRule{}

	tests := []struct {
		name         string
		path         string
		code         string
		wantFindings int
	}{
		// --- Positive cases: should detect path traversal ---
		{
			name: "fs.readFile with req parameter",
			path: "src/server.ts",
			code: `import fs from 'fs';
import express from 'express';

app.get('/download', (req, res) => {
    fs.readFile(req.query.path, (err, data) => {
        res.send(data);
    });
});`,
			wantFindings: 1,
		},
		{
			name: "Go os.Open with string concatenation",
			path: "cmd/server/handler.go",
			code: `package handler

import "os"

func readUserFile(basePath, userFile string) ([]byte, error) {
	f, err := os.Open(basePath + "/" + userFile)
	if err != nil {
		return nil, err
	}
	defer f.Close()
	return io.ReadAll(f)
}`,
			wantFindings: 1,
		},
		{
			name: "Config with root path in YAML",
			path: "config/mcp.yaml",
			code: `server:
  host: localhost
  port: 8080
  repository: "/"
  logLevel: info`,
			wantFindings: 1,
		},
		{
			name: "Go filepath.Join without HasPrefix guard",
			path: "internal/files/reader.go",
			code: `package files

import "path/filepath"

func buildPath(base, user string) string {
	return filepath.Join(base, user)
}`,
			wantFindings: 1,
		},

		// --- Negative cases: should NOT detect path traversal ---
		{
			name: "Go filepath.Join with HasPrefix validation",
			path: "internal/files/safe_reader.go",
			code: `package files

import (
	"path/filepath"
	"strings"
	"errors"
)

func safeBuildPath(base, user string) (string, error) {
	full := filepath.Join(base, user)
	if !strings.HasPrefix(full, base) {
		return "", errors.New("path traversal attempt")
	}
	return full, nil
}`,
			wantFindings: 0,
		},
		{
			name: "Static file read without user input",
			path: "src/config.ts",
			code: `import fs from 'fs';

const configData = fs.readFileSync('./config.json', 'utf-8');
const parsed = JSON.parse(configData);
export default parsed;`,
			wantFindings: 0,
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			fc := makeFileContext(tt.path, tt.code)
			findings := rule.Check(fc)
			if len(findings) != tt.wantFindings {
				t.Errorf("PathTraversalRule.Check() returned %d findings, want %d", len(findings), tt.wantFindings)
				for i, f := range findings {
					t.Logf("  finding[%d]: line=%d message=%q", i, f.Line, f.Message)
				}
			}
			for _, f := range findings {
				if f.RuleID != "MCP-004" {
					t.Errorf("expected RuleID MCP-004, got %s", f.RuleID)
				}
				if f.Severity != types.SeverityHigh {
					t.Errorf("expected severity HIGH, got %s", f.Severity)
				}
			}
		})
	}
}
