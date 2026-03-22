package rules

import (
	"path/filepath"
	"strings"
	"testing"

	"github.com/guardianmcp/guardianmcp/internal/types"
)

func makeFileContext(path, code string) types.FileContext {
	lines := strings.Split(code, "\n")
	ext := filepath.Ext(path)
	return types.FileContext{
		Path:      path,
		AbsPath:   path,
		Content:   []byte(code),
		Lines:     lines,
		Extension: ext,
		Filename:  filepath.Base(path),
	}
}

func TestSQLInjectionRule_Check(t *testing.T) {
	rule := &SQLInjectionRule{}

	tests := []struct {
		name         string
		path         string
		code         string
		wantFindings int
		description  string
	}{
		// --- Positive cases ---
		{
			name:         "JS template literal SQL injection",
			path:         "src/db.ts",
			code:         "const result = db.query(`SELECT * FROM users WHERE id = ${userId}`);",
			wantFindings: 1,
			description:  "Should detect SQL query built with JS template literal interpolation",
		},
		{
			name:         "Python cursor.execute with f-string",
			path:         "app/db.py",
			code:         `cursor.execute(f"DELETE FROM users WHERE name = '{name}'")`,
			wantFindings: 1,
			description:  "Should detect cursor.execute with f-string interpolation",
		},
		{
			name:         "Go db.Query with fmt.Sprintf",
			path:         "handlers/user.go",
			code:         `rows, err := db.Query(fmt.Sprintf("SELECT * FROM users WHERE id = %s", id))`,
			wantFindings: 1,
			description:  "Should detect db.Query with fmt.Sprintf string building",
		},
		{
			name:         "JS query method with string concatenation",
			path:         "src/repo.js",
			code:         `db.query("SELECT * FROM users WHERE name = '" + userName + "' LIMIT 1");`,
			wantFindings: 1,
			description:  "Should detect .query() with string concatenation",
		},
		{
			name:         "Python f-string SQL outside execute",
			path:         "app/query.py",
			code:         `query = f"SELECT * FROM orders WHERE status = '{status}'"`,
			wantFindings: 1,
			description:  "Should detect f-string SQL query even outside cursor.execute",
		},
		// --- Negative cases ---
		{
			name:         "ORM safe method - no hit",
			path:         "src/user-service.ts",
			code:         `const user = await userRepo.findOne({ where: { id: userId } });`,
			wantFindings: 0,
			description:  "Should not flag ORM safe methods like findOne",
		},
		{
			name:         "nosec comment suppresses finding",
			path:         "src/legacy.ts",
			code:         "const result = db.query(`SELECT * FROM users WHERE id = ${userId}`); // nosec",
			wantFindings: 0,
			description:  "Should not flag lines with nosec suppression comment",
		},
		{
			name:         "Parameterized query in Go - no hit",
			path:         "handlers/safe.go",
			code:         `rows, err := db.Query("SELECT * FROM users WHERE id = $1", id)`,
			wantFindings: 0,
			description:  "Should not flag parameterized queries",
		},
		{
			name:         "Test file is skipped",
			path:         "src/db_test.go",
			code:         `rows, err := db.Query(fmt.Sprintf("SELECT * FROM users WHERE id = %s", id))`,
			wantFindings: 0,
			description:  "Should skip test files entirely",
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
				if f.RuleID != "MCP-006" {
					t.Errorf("expected RuleID MCP-006, got %s", f.RuleID)
				}
				if f.File != tt.path {
					t.Errorf("expected File %s, got %s", tt.path, f.File)
				}
			}
		})
	}
}
