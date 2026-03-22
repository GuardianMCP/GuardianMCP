package rules

import (
	"regexp"
	"strings"

	"github.com/guardianmcp/guardianmcp/internal/types"
)

// PathTraversalRule detects file system operations with unvalidated user input.
type PathTraversalRule struct{}

func (r *PathTraversalRule) ID() string   { return "MCP-004" }
func (r *PathTraversalRule) Name() string { return "Path Traversal" }
func (r *PathTraversalRule) Description() string {
	return "Detect file system operations using unvalidated user input"
}
func (r *PathTraversalRule) Severity() types.Severity { return types.SeverityHigh }

var (
	// TypeScript/JavaScript
	jsFSReadReq   = regexp.MustCompile(`fs\.(readFile|readFileSync|writeFile|writeFileSync)\(.*req\.`)
	jsPathJoinReq = regexp.MustCompile(`path\.join\(.*req\.`)

	// Go
	goOsOpenConcat = regexp.MustCompile(`os\.(Open|ReadFile)\(.*\+`)
	goIoutilConcat = regexp.MustCompile(`ioutil\.ReadFile\(.*\+`)
	goFilepathJoin = regexp.MustCompile(`filepath\.Join\(`)

	// Config: dangerous paths
	configDangerPath = regexp.MustCompile(`(?i)(repository|basePath|allowedPath|root_path)\s*[:=]\s*["'](/|\.\./)["']`)
)

func (r *PathTraversalRule) Check(file types.FileContext) []types.Finding {
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
	case ".yaml", ".yml", ".json", ".toml":
		findings = append(findings, r.checkConfig(file)...)
	}

	return findings
}

func (r *PathTraversalRule) checkJS(file types.FileContext) []types.Finding {
	var findings []types.Finding

	patterns := []struct {
		re         *regexp.Regexp
		msg        string
		confidence string
	}{
		{jsFSReadReq, "File system operation with request parameter — potential path traversal.", "HIGH"},
		{jsPathJoinReq, "path.join() with request parameter — validate and restrict the base directory.", "HIGH"},
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
				"Use path.resolve() and verify the resolved path starts with the expected base directory. Never pass user input directly to file system operations.",
				pat.confidence,
				[]string{"CVE-2025-68143", "CVE-2025-68145"},
				[]string{"MCP07"},
			))
		}
	}

	return findings
}

func (r *PathTraversalRule) checkGo(file types.FileContext) []types.Finding {
	var findings []types.Finding

	// Check for os.Open/ReadFile with concatenation
	concatPatterns := []struct {
		re  *regexp.Regexp
		msg string
	}{
		{goOsOpenConcat, "os.Open() with string concatenation — potential path traversal."},
		{goIoutilConcat, "ioutil.ReadFile() with string concatenation — potential path traversal."},
	}

	for _, pat := range concatPatterns {
		matches := MatchAllRegex(pat.re, file.Lines)
		for _, m := range matches {
			if HasNosecComment(m.LineStr) {
				continue
			}
			findings = append(findings, MakeFinding(
				r, file, m.Line,
				GetSnippet(file.Lines, m.Line, 2),
				pat.msg,
				"Use filepath.Join() with a base directory, then verify with strings.HasPrefix() that the result is within the expected directory.",
				"HIGH",
				[]string{"CVE-2025-68143", "CVE-2025-68145"},
				[]string{"MCP07"},
			))
		}
	}

	// Check filepath.Join without HasPrefix guard
	joinMatches := MatchAllRegex(goFilepathJoin, file.Lines)
	for _, m := range joinMatches {
		if HasNosecComment(m.LineStr) {
			continue
		}
		// Check if HasPrefix appears within 5 lines after
		hasGuard := false
		end := m.Line + 5
		if end > len(file.Lines) {
			end = len(file.Lines)
		}
		for i := m.Line; i < end; i++ {
			if strings.Contains(file.Lines[i], "HasPrefix") || strings.Contains(file.Lines[i], "strings.HasPrefix") {
				hasGuard = true
				break
			}
		}
		if !hasGuard {
			findings = append(findings, MakeFinding(
				r, file, m.Line,
				GetSnippet(file.Lines, m.Line, 2),
				"filepath.Join() without subsequent HasPrefix check — may allow path traversal.",
				"After filepath.Join(), use strings.HasPrefix() to verify the path stays within the base directory.",
				"MEDIUM",
				[]string{"CVE-2025-68143", "CVE-2025-68145"},
				[]string{"MCP07"},
			))
		}
	}

	return findings
}

func (r *PathTraversalRule) checkConfig(file types.FileContext) []types.Finding {
	var findings []types.Finding

	matches := MatchAllRegex(configDangerPath, file.Lines)
	for _, m := range matches {
		findings = append(findings, MakeFinding(
			r, file, m.Line,
			GetSnippet(file.Lines, m.Line, 1),
			"Configuration allows root path or parent traversal — restrict to a specific directory.",
			"Set an explicit, restricted base directory instead of '/' or '../'.",
			"HIGH",
			nil,
			[]string{"MCP07"},
		))
	}

	return findings
}
