package rules

import (
	"regexp"
	"strings"

	"github.com/guardianmcp/guardianmcp/internal/types"
)

// SQLInjectionRule detects SQL queries built with string concatenation or interpolation.
type SQLInjectionRule struct{}

func (r *SQLInjectionRule) ID() string   { return "MCP-006" }
func (r *SQLInjectionRule) Name() string { return "SQL Injection" }
func (r *SQLInjectionRule) Description() string {
	return "Detect SQL queries built with string concatenation or interpolation"
}
func (r *SQLInjectionRule) Severity() types.Severity { return types.SeverityHigh }

var (
	// TypeScript/JavaScript — template literals with SQL keywords
	jsSQLTemplate = regexp.MustCompile("`(?:SELECT|INSERT|UPDATE|DELETE).*\\$\\{")
	jsQueryConcat = regexp.MustCompile(`\.(query|execute)\(.*\+`)

	// Python
	pyExecuteFormat = regexp.MustCompile(`cursor\.execute\(.*%.*%`)
	pyExecuteFStr   = regexp.MustCompile(`cursor\.execute\(f["']`)
	pySQLFormat     = regexp.MustCompile(`["']SELECT.*%s.*%.*format\(`)
	pyFStringSQL    = regexp.MustCompile(`f"SELECT`)

	// Go
	goDBQuerySprintf = regexp.MustCompile(`db\.(Query|Exec)\(fmt\.Sprintf\(`)
)

// ORM safe patterns that should not be flagged
var ormSafePatterns = []string{
	".findOne(", ".findBy(", ".where({", ".findAndCount(",
	".createQueryBuilder(", ".getRepository(",
}

func (r *SQLInjectionRule) Check(file types.FileContext) []types.Finding {
	if IsTestFile(file.Path) {
		return nil
	}

	ext := strings.ToLower(file.Extension)
	var findings []types.Finding

	switch ext {
	case ".ts", ".js":
		findings = append(findings, r.checkJS(file)...)
	case ".py":
		findings = append(findings, r.checkPython(file)...)
	case ".go":
		findings = append(findings, r.checkGo(file)...)
	}

	return findings
}

func (r *SQLInjectionRule) checkJS(file types.FileContext) []types.Finding {
	var findings []types.Finding

	// Check template literal SQL
	matches := MatchAllRegex(jsSQLTemplate, file.Lines)
	for _, m := range matches {
		if HasNosecComment(m.LineStr) || hasORMPattern(m.LineStr) {
			continue
		}
		findings = append(findings, MakeFinding(
			r, file, m.Line,
			GetSnippet(file.Lines, m.Line, 2),
			"SQL query with template literal interpolation — potential SQL injection.",
			"Use parameterized queries or prepared statements. Never interpolate user input into SQL strings.",
			"HIGH",
			nil,
			[]string{"MCP07"},
		))
	}

	// Check .query()/.execute() with concatenation
	matches = MatchAllRegex(jsQueryConcat, file.Lines)
	for _, m := range matches {
		if HasNosecComment(m.LineStr) || hasORMPattern(m.LineStr) {
			continue
		}
		findings = append(findings, MakeFinding(
			r, file, m.Line,
			GetSnippet(file.Lines, m.Line, 2),
			"Raw query method with string concatenation — potential SQL injection.",
			"Use parameterized queries: .query('SELECT * FROM users WHERE id = $1', [id])",
			"MEDIUM",
			nil,
			[]string{"MCP07"},
		))
	}

	return findings
}

func (r *SQLInjectionRule) checkPython(file types.FileContext) []types.Finding {
	var findings []types.Finding

	patterns := []struct {
		re         *regexp.Regexp
		msg        string
		confidence string
	}{
		{pyExecuteFormat, "cursor.execute() with % formatting — use parameterized query.", "HIGH"},
		{pyExecuteFStr, "cursor.execute() with f-string — potential SQL injection.", "HIGH"},
		{pySQLFormat, "SQL string with .format() — potential SQL injection.", "HIGH"},
		{pyFStringSQL, "f-string SQL query — potential SQL injection.", "HIGH"},
	}

	for _, pat := range patterns {
		matches := MatchAllRegex(pat.re, file.Lines)
		for _, m := range matches {
			if HasNosecComment(m.LineStr) {
				continue
			}
			findings = append(findings, MakeFinding(
				r, file, m.Line,
				GetSnippet(file.Lines, m.Line, 2),
				pat.msg,
				"Use parameterized queries: cursor.execute('SELECT * FROM users WHERE id = %s', (id,))",
				pat.confidence,
				nil,
				[]string{"MCP07"},
			))
		}
	}

	return findings
}

func (r *SQLInjectionRule) checkGo(file types.FileContext) []types.Finding {
	var findings []types.Finding

	matches := MatchAllRegex(goDBQuerySprintf, file.Lines)
	for _, m := range matches {
		if HasNosecComment(m.LineStr) {
			continue
		}
		findings = append(findings, MakeFinding(
			r, file, m.Line,
			GetSnippet(file.Lines, m.Line, 2),
			"db.Query/Exec with fmt.Sprintf — potential SQL injection.",
			"Use parameterized queries: db.Query(\"SELECT * FROM users WHERE id = $1\", id)",
			"HIGH",
			nil,
			[]string{"MCP07"},
		))
	}

	return findings
}

func hasORMPattern(line string) bool {
	for _, pattern := range ormSafePatterns {
		if strings.Contains(line, pattern) {
			return true
		}
	}
	return false
}
