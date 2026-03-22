package rules

import (
	"regexp"
	"strings"

	"github.com/guardianmcp/guardianmcp/internal/types"
)

// CommandInjectionRule detects OS command execution with user-controlled input.
type CommandInjectionRule struct{}

func (r *CommandInjectionRule) ID() string   { return "MCP-003" }
func (r *CommandInjectionRule) Name() string { return "Command Injection" }
func (r *CommandInjectionRule) Description() string {
	return "Detect use of OS command execution with potentially user-controlled input"
}
func (r *CommandInjectionRule) Severity() types.Severity { return types.SeverityCritical }

var (
	// TypeScript/JavaScript
	jsExecTemplateLiteral = regexp.MustCompile("exec\\(`[^`]*\\$\\{[^}]+\\}[^`]*`\\)")
	jsExecSync            = regexp.MustCompile("execSync\\(`[^`]*\\$\\{[^}]+\\}[^`]*`\\)")
	jsSpawnConcat         = regexp.MustCompile(`spawn\([^)]*\+`)
	jsChildProcess        = regexp.MustCompile(`child_process\.exec\(`)
	jsEval                = regexp.MustCompile(`\beval\s*\(`)

	// Python
	pySubprocessF = regexp.MustCompile(`subprocess\.(run|call|Popen)\(.*f["']`)
	pyOsSystem    = regexp.MustCompile(`os\.system\(.*\+`)
	pyOsPopen     = regexp.MustCompile(`os\.popen\(`)

	// Go
	goExecConcat  = regexp.MustCompile(`exec\.Command\(.*\+`)
	goExecSprintf = regexp.MustCompile(`exec\.Command\(fmt\.Sprintf`)
)

func (r *CommandInjectionRule) Check(file types.FileContext) []types.Finding {
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

func (r *CommandInjectionRule) checkJS(file types.FileContext) []types.Finding {
	var findings []types.Finding

	patterns := []struct {
		re         *regexp.Regexp
		msg        string
		confidence string
	}{
		{jsExecTemplateLiteral, "exec() called with template literal containing interpolation.", "HIGH"},
		{jsExecSync, "execSync() called with template literal containing interpolation.", "HIGH"},
		{jsSpawnConcat, "spawn() called with string concatenation — potential injection vector.", "MEDIUM"},
		{jsChildProcess, "child_process.exec() used — prefer execFile() with args array.", "MEDIUM"},
		{jsEval, "eval() used — this can execute arbitrary code.", "HIGH"},
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
				"Validate and sanitize input. Use execFile() with an args array instead of exec() with string interpolation.",
				pat.confidence,
				[]string{"CVE-2025-6514", "CVE-2025-68143"},
				[]string{"MCP07"},
			))
		}
	}

	return findings
}

func (r *CommandInjectionRule) checkPython(file types.FileContext) []types.Finding {
	var findings []types.Finding

	patterns := []struct {
		re         *regexp.Regexp
		msg        string
		confidence string
	}{
		{pySubprocessF, "subprocess called with f-string — potential command injection.", "HIGH"},
		{pyOsSystem, "os.system() called with string concatenation.", "HIGH"},
		{pyOsPopen, "os.popen() used — prefer subprocess with args list.", "MEDIUM"},
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
				"Use subprocess.run() with a list of arguments instead of string interpolation.",
				pat.confidence,
				[]string{"CVE-2025-6514", "CVE-2025-68143"},
				[]string{"MCP07"},
			))
		}
	}

	return findings
}

func (r *CommandInjectionRule) checkGo(file types.FileContext) []types.Finding {
	var findings []types.Finding

	patterns := []struct {
		re         *regexp.Regexp
		msg        string
		confidence string
	}{
		{goExecConcat, "exec.Command() with string concatenation — potential injection.", "HIGH"},
		{goExecSprintf, "exec.Command() with fmt.Sprintf — potential injection.", "HIGH"},
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
				"Pass command arguments as separate strings to exec.Command() instead of concatenation.",
				pat.confidence,
				[]string{"CVE-2025-6514", "CVE-2025-68143"},
				[]string{"MCP07"},
			))
		}
	}

	return findings
}
