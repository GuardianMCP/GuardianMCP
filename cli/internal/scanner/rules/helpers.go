package rules

import (
	"path/filepath"
	"regexp"
	"strings"

	"github.com/guardianmcp/guardianmcp/internal/types"
)

// HasNosecComment checks if a line contains a nosec suppression comment.
func HasNosecComment(line string) bool {
	return strings.Contains(line, "// nosec") || strings.Contains(line, "# nosec") || strings.Contains(line, "/* nosec */")
}

// IsTestFile checks if a file path matches common test file patterns.
func IsTestFile(path string) bool {
	base := filepath.Base(path)
	patterns := []string{
		"*.test.*",
		"*.spec.*",
		"*_test.go",
		"*_test.py",
		"test_*.py",
	}
	for _, p := range patterns {
		if matched, _ := filepath.Match(p, base); matched {
			return true
		}
	}
	return false
}

// IsEnvExampleFile checks if a file is an .env.example file.
func IsEnvExampleFile(path string) bool {
	base := filepath.Base(path)
	return base == ".env.example" || base == ".env.sample" || base == ".env.template"
}

// IsPlaceholderValue checks if a value is a common test/placeholder.
var placeholders = []string{
	"your-api-key", "<API_KEY>", "INSERT_KEY_HERE", "xxxx",
	"test", "example", "placeholder", "changeme", "TODO",
	"your_api_key", "your_secret", "YOUR_API_KEY", "YOUR_SECRET",
	"<token>", "<secret>", "REPLACE_ME",
}

func IsPlaceholderValue(val string) bool {
	lower := strings.ToLower(strings.Trim(val, `"'`))
	for _, p := range placeholders {
		if strings.EqualFold(lower, p) {
			return true
		}
		// Check if the matched text contains a placeholder value inside quotes
		if strings.Contains(lower, `"`+strings.ToLower(p)+`"`) || strings.Contains(lower, `'`+strings.ToLower(p)+`'`) {
			return true
		}
	}
	// Extract value from assignment patterns like: key = "value" or key: "value"
	for _, sep := range []string{"=", ":"} {
		if idx := strings.Index(val, sep); idx >= 0 {
			assignedVal := strings.TrimSpace(val[idx+1:])
			assignedVal = strings.Trim(assignedVal, `"'`)
			assignedLower := strings.ToLower(assignedVal)
			for _, p := range placeholders {
				if strings.EqualFold(assignedLower, p) {
					return true
				}
			}
		}
	}
	return false
}

// GetSnippet extracts up to maxLines lines around the given line number.
func GetSnippet(lines []string, lineNum int, maxLines int) string {
	if lineNum < 1 || lineNum > len(lines) {
		return ""
	}

	start := lineNum - 1
	end := start + maxLines
	if end > len(lines) {
		end = len(lines)
	}

	snippetLines := lines[start:end]
	return strings.Join(snippetLines, "\n")
}

// RegexMatch holds data about a single regex match in a line.
type RegexMatch struct {
	Line    int
	Column  int
	Text    string
	LineStr string
}

// MatchAllRegex finds all matches of a compiled regex in a set of lines.
func MatchAllRegex(re *regexp.Regexp, lines []string) []RegexMatch {
	var matches []RegexMatch
	for i, line := range lines {
		locs := re.FindAllStringIndex(line, -1)
		for _, loc := range locs {
			matches = append(matches, RegexMatch{
				Line:    i + 1,
				Column:  loc[0] + 1,
				Text:    line[loc[0]:loc[1]],
				LineStr: line,
			})
		}
	}
	return matches
}

// MakeFinding is a helper to create a Finding with common fields.
func MakeFinding(rule Rule, file types.FileContext, line int, snippet, message, remediation string, confidence string, cveRefs, owaspRefs []string) types.Finding {
	return types.Finding{
		RuleID:      rule.ID(),
		RuleName:    rule.Name(),
		Severity:    rule.Severity(),
		File:        file.Path,
		Line:        line,
		Column:      1,
		Snippet:     snippet,
		Message:     message,
		Remediation: remediation,
		CVERefs:     cveRefs,
		OWASPRefs:   owaspRefs,
		Confidence:  confidence,
	}
}
