package rules

import (
	"regexp"
	"strings"

	"github.com/guardianmcp/guardianmcp/internal/types"
)

// MissingAuthRule detects MCP tool endpoints exposed without authentication.
type MissingAuthRule struct{}

func (r *MissingAuthRule) ID() string   { return "MCP-002" }
func (r *MissingAuthRule) Name() string { return "Missing Authentication" }
func (r *MissingAuthRule) Description() string {
	return "Detect MCP tool endpoints exposed without authentication checks"
}
func (r *MissingAuthRule) Severity() types.Severity { return types.SeverityHigh }

var (
	// Express route patterns with mcp
	expressRouteMCP = regexp.MustCompile(`app\.(post|get|put|delete|patch)\s*\(['"].*mcp.*['"]`)
	// NestJS decorator with mcp
	nestMCPDecorator = regexp.MustCompile(`@(Post|Get|Put|Delete|Patch)\(.*mcp.*\)`)
	// Go HTTP handler with mcp
	goHandlerMCP = regexp.MustCompile(`(?:http\.HandleFunc|r\.(Post|Get|Put|Delete))\s*\(.*mcp.*,`)

	// Auth middleware indicators
	authIndicators = []string{
		"authMiddleware", "AuthMiddleware", "auth_middleware",
		"authenticate", "Authenticate",
		"UseGuards", "@UseGuards",
		"jwt", "JWT", "JwtAuth", "jwtAuth",
		"requireAuth", "RequireAuth", "require_auth",
		"isAuthenticated", "IsAuthenticated",
		"passport.authenticate",
		"verifyToken", "VerifyToken", "verify_token",
		"AuthGuard", "authGuard",
	}
)

func (r *MissingAuthRule) Check(file types.FileContext) []types.Finding {
	if IsTestFile(file.Path) {
		return nil
	}

	ext := strings.ToLower(file.Extension)
	var findings []types.Finding

	switch ext {
	case ".ts", ".js":
		findings = append(findings, r.checkJavaScript(file)...)
	case ".go":
		findings = append(findings, r.checkGo(file)...)
	}

	return findings
}

func (r *MissingAuthRule) checkJavaScript(file types.FileContext) []types.Finding {
	var findings []types.Finding
	content := string(file.Content)

	// Check Express routes
	matches := MatchAllRegex(expressRouteMCP, file.Lines)
	for _, m := range matches {
		if HasNosecComment(m.LineStr) {
			continue
		}
		if !hasAuthNearby(content, m.Line, file.Lines) {
			findings = append(findings, MakeFinding(
				r, file, m.Line,
				GetSnippet(file.Lines, m.Line, 3),
				"MCP endpoint exposed without authentication middleware.",
				"Add authentication middleware before this route handler. Example: app.use('/mcp', authMiddleware)",
				"MEDIUM",
				nil,
				[]string{"MCP02"},
			))
		}
	}

	// Check NestJS decorators
	matches = MatchAllRegex(nestMCPDecorator, file.Lines)
	for _, m := range matches {
		if HasNosecComment(m.LineStr) {
			continue
		}
		// Check if @UseGuards is nearby (within 5 lines above)
		hasGuard := false
		start := m.Line - 6
		if start < 0 {
			start = 0
		}
		for i := start; i < m.Line-1 && i < len(file.Lines); i++ {
			if strings.Contains(file.Lines[i], "@UseGuards") {
				hasGuard = true
				break
			}
		}
		if !hasGuard {
			findings = append(findings, MakeFinding(
				r, file, m.Line,
				GetSnippet(file.Lines, m.Line, 3),
				"NestJS MCP endpoint without @UseGuards() decorator.",
				"Add @UseGuards(AuthGuard) to this endpoint or controller class.",
				"MEDIUM",
				nil,
				[]string{"MCP02"},
			))
		}
	}

	return findings
}

func (r *MissingAuthRule) checkGo(file types.FileContext) []types.Finding {
	var findings []types.Finding

	matches := MatchAllRegex(goHandlerMCP, file.Lines)
	for _, m := range matches {
		if HasNosecComment(m.LineStr) {
			continue
		}
		// Check first 10 lines of handler for auth check
		hasAuth := false
		end := m.Line + 10
		if end > len(file.Lines) {
			end = len(file.Lines)
		}
		for i := m.Line - 1; i < end; i++ {
			for _, indicator := range authIndicators {
				if strings.Contains(file.Lines[i], indicator) {
					hasAuth = true
					break
				}
			}
			if hasAuth {
				break
			}
		}

		if !hasAuth {
			findings = append(findings, MakeFinding(
				r, file, m.Line,
				GetSnippet(file.Lines, m.Line, 3),
				"Go MCP HTTP handler without JWT/token validation.",
				"Add authentication middleware or token validation in the handler.",
				"MEDIUM",
				nil,
				[]string{"MCP02"},
			))
		}
	}

	return findings
}

func hasAuthNearby(content string, lineNum int, lines []string) bool {
	// Check for auth middleware in the file
	for _, indicator := range authIndicators {
		if strings.Contains(content, indicator) {
			// Check if it appears before the route definition (global middleware)
			for i := 0; i < lineNum-1 && i < len(lines); i++ {
				if strings.Contains(lines[i], indicator) {
					return true
				}
			}
		}
	}
	return false
}
