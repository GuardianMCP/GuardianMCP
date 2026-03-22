package rules

import (
	"regexp"
	"strings"

	"github.com/guardianmcp/guardianmcp/internal/types"
)

// SSRFRule detects HTTP requests with user-controlled URLs.
type SSRFRule struct{}

func (r *SSRFRule) ID() string   { return "MCP-005" }
func (r *SSRFRule) Name() string { return "Server-Side Request Forgery (SSRF)" }
func (r *SSRFRule) Description() string {
	return "Detect HTTP requests made with user-controlled URLs without validation"
}
func (r *SSRFRule) Severity() types.Severity { return types.SeverityHigh }

var (
	// TypeScript/JavaScript
	jsFetchReq = regexp.MustCompile(`fetch\(.*req\.`)
	jsAxiosReq = regexp.MustCompile(`axios\.(get|post|put|delete|patch)\(.*req\.`)
	jsHTTPGet  = regexp.MustCompile(`https?\.get\(`)
	jsNewURL   = regexp.MustCompile(`new URL\(`)

	// Go
	goHTTPGetConcat = regexp.MustCompile(`http\.(Get|Post)\(.*\+`)
	goURLParse      = regexp.MustCompile(`url\.Parse\(`)
)

func (r *SSRFRule) Check(file types.FileContext) []types.Finding {
	if IsTestFile(file.Path) {
		return nil
	}

	ext := strings.ToLower(file.Extension)
	var findings []types.Finding

	switch ext {
	case ".ts", ".js":
		findings = append(findings, r.checkJS(file)...)
	case ".go":
		findings = append(findings, r.checkGo(file)...)
	}

	return findings
}

const ssrfRemediation = "Validate the URL against an allowlist of permitted hosts. Use a URL parser to extract the hostname before validation. Block requests to private IP ranges (10.0.0.0/8, 172.16.0.0/12, 192.168.0.0/16, 127.0.0.0/8)."

func (r *SSRFRule) checkJS(file types.FileContext) []types.Finding {
	var findings []types.Finding

	// fetch/axios with request params
	patterns := []struct {
		re  *regexp.Regexp
		msg string
	}{
		{jsFetchReq, "fetch() called with value derived from request parameters — potential SSRF."},
		{jsAxiosReq, "axios called with value derived from request parameters — potential SSRF."},
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
				ssrfRemediation,
				"MEDIUM",
				[]string{"CVE-2026-23947"},
				[]string{"MCP07"},
			))
		}
	}

	return findings
}

func (r *SSRFRule) checkGo(file types.FileContext) []types.Finding {
	var findings []types.Finding

	matches := MatchAllRegex(goHTTPGetConcat, file.Lines)
	for _, m := range matches {
		if HasNosecComment(m.LineStr) {
			continue
		}
		findings = append(findings, MakeFinding(
			r, file, m.Line,
			GetSnippet(file.Lines, m.Line, 2),
			"http.Get/Post with string concatenation — potential SSRF.",
			ssrfRemediation,
			"MEDIUM",
			[]string{"CVE-2026-23947"},
			[]string{"MCP07"},
		))
	}

	// url.Parse without host validation
	parseMatches := MatchAllRegex(goURLParse, file.Lines)
	for _, m := range parseMatches {
		if HasNosecComment(m.LineStr) {
			continue
		}
		// Check for host validation nearby
		hasValidation := false
		end := m.Line + 10
		if end > len(file.Lines) {
			end = len(file.Lines)
		}
		for i := m.Line; i < end; i++ {
			if strings.Contains(file.Lines[i], ".Host") || strings.Contains(file.Lines[i], "Hostname") || strings.Contains(file.Lines[i], "allowlist") || strings.Contains(file.Lines[i], "whitelist") {
				hasValidation = true
				break
			}
		}
		if !hasValidation {
			findings = append(findings, MakeFinding(
				r, file, m.Line,
				GetSnippet(file.Lines, m.Line, 2),
				"url.Parse() without subsequent host validation — potential SSRF.",
				ssrfRemediation,
				"MEDIUM",
				[]string{"CVE-2026-23947"},
				[]string{"MCP07"},
			))
		}
	}

	return findings
}
