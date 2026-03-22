package rules

import (
	"encoding/json"
	"regexp"
	"strings"

	"github.com/guardianmcp/guardianmcp/internal/types"
)

// SupplyChainRule detects dependencies with known vulnerabilities or suspicious patterns.
type SupplyChainRule struct{}

func (r *SupplyChainRule) ID() string   { return "MCP-010" }
func (r *SupplyChainRule) Name() string { return "Supply Chain / Dependency Risk" }
func (r *SupplyChainRule) Description() string {
	return "Detect dependencies with known vulnerabilities or suspicious patterns"
}
func (r *SupplyChainRule) Severity() types.Severity { return types.SeverityLow }

var (
	githubDepPattern = regexp.MustCompile(`"github:[^"]+"|'github:[^']+'`)
	wildcardVersion  = regexp.MustCompile(`"(\*|latest)"`)
	goCommitHash     = regexp.MustCompile(`\bv0\.0\.0-\d{14}-[a-f0-9]{12}\b`)
)

type packageJSON struct {
	Dependencies    map[string]string `json:"dependencies"`
	DevDependencies map[string]string `json:"devDependencies"`
}

func (r *SupplyChainRule) Check(file types.FileContext) []types.Finding {
	if IsTestFile(file.Path) {
		return nil
	}

	var findings []types.Finding

	switch file.Filename {
	case "package.json":
		findings = append(findings, r.checkPackageJSON(file)...)
	case "package-lock.json":
		findings = append(findings, r.checkPackageLock(file)...)
	case "go.mod":
		findings = append(findings, r.checkGoMod(file)...)
	}

	return findings
}

func (r *SupplyChainRule) checkPackageJSON(file types.FileContext) []types.Finding {
	var findings []types.Finding

	var pkg packageJSON
	if err := json.Unmarshal(file.Content, &pkg); err != nil {
		return nil
	}

	allDeps := make(map[string]string)
	for k, v := range pkg.Dependencies {
		allDeps[k] = v
	}
	for k, v := range pkg.DevDependencies {
		allDeps[k] = v
	}

	// Check for mcp-remote below v1.0.5
	if ver, ok := allDeps["mcp-remote"]; ok {
		if isVersionBelow(ver, "1.0.5") {
			findings = append(findings, r.findingAtDep(file, "mcp-remote", ver,
				types.SeverityCritical,
				"mcp-remote below v1.0.5 is affected by CVE-2025-6514.",
				"Upgrade mcp-remote to v1.0.5 or later.",
				"HIGH",
				[]string{"CVE-2025-6514"},
			))
		}
	}

	// Check for @anthropic-ai/mcp-server-git below v0.2.1
	if ver, ok := allDeps["@anthropic-ai/mcp-server-git"]; ok {
		if isVersionBelow(ver, "0.2.1") {
			findings = append(findings, r.findingAtDep(file, "@anthropic-ai/mcp-server-git", ver,
				types.SeverityHigh,
				"@anthropic-ai/mcp-server-git below v0.2.1 is affected by CVE-2025-68143/44/45.",
				"Upgrade @anthropic-ai/mcp-server-git to v0.2.1 or later.",
				"HIGH",
				[]string{"CVE-2025-68143", "CVE-2025-68144", "CVE-2025-68145"},
			))
		}
	}

	// Check for GitHub URL dependencies
	for name, ver := range allDeps {
		if strings.HasPrefix(ver, "github:") || strings.HasPrefix(ver, "git://") || strings.HasPrefix(ver, "git+") {
			findings = append(findings, r.findingAtDep(file, name, ver,
				types.SeverityLow,
				"Dependency pulled from GitHub URL — not from npm registry.",
				"Use npm-published packages when possible. If using GitHub, pin to a specific commit hash or tag.",
				"LOW",
				nil,
			))
		}
	}

	// Check for wildcard/latest versions
	for name, ver := range allDeps {
		if ver == "*" || ver == "latest" {
			findings = append(findings, r.findingAtDep(file, name, ver,
				types.SeverityLow,
				"Dependency '"+name+"' has no version pin ("+ver+").",
				"Pin dependencies to specific versions. Use npm shrinkwrap or a lockfile.",
				"LOW",
				nil,
			))
		}
	}

	return findings
}

func (r *SupplyChainRule) checkPackageLock(file types.FileContext) []types.Finding {
	// Check for vulnerable versions in lock file too
	var findings []types.Finding

	if strings.Contains(string(file.Content), `"mcp-remote"`) {
		for i, line := range file.Lines {
			if strings.Contains(line, `"mcp-remote"`) {
				// Look for version in next few lines
				for j := i; j < i+5 && j < len(file.Lines); j++ {
					if strings.Contains(file.Lines[j], `"version"`) {
						ver := extractJSONValue(file.Lines[j])
						if ver != "" && isVersionBelow(ver, "1.0.5") {
							findings = append(findings, MakeFinding(
								r, file, j+1,
								GetSnippet(file.Lines, j+1, 1),
								"Locked version of mcp-remote ("+ver+") is affected by CVE-2025-6514.",
								"Run npm update mcp-remote to upgrade to v1.0.5+.",
								"HIGH",
								[]string{"CVE-2025-6514"},
								[]string{"MCP08"},
							))
						}
					}
				}
			}
		}
	}

	return findings
}

func (r *SupplyChainRule) checkGoMod(file types.FileContext) []types.Finding {
	var findings []types.Finding

	// Check for commit hash versions (pseudo-versions)
	matches := MatchAllRegex(goCommitHash, file.Lines)
	for _, m := range matches {
		findings = append(findings, MakeFinding(
			r, file, m.Line,
			GetSnippet(file.Lines, m.Line, 1),
			"Go module uses a commit hash instead of a tagged version.",
			"Use tagged versions when available for better reproducibility and security auditing.",
			"LOW",
			nil,
			[]string{"MCP08"},
		))
	}

	return findings
}

func (r *SupplyChainRule) findingAtDep(file types.FileContext, name, ver string, sev types.Severity, msg, fix, confidence string, cves []string) types.Finding {
	line := findDepLine(file.Lines, name)
	return types.Finding{
		RuleID:      r.ID(),
		RuleName:    r.Name(),
		Severity:    sev,
		File:        file.Path,
		Line:        line,
		Column:      1,
		Snippet:     GetSnippet(file.Lines, line, 1),
		Message:     msg,
		Remediation: fix,
		CVERefs:     cves,
		OWASPRefs:   []string{"MCP08"},
		Confidence:  confidence,
	}
}

func findDepLine(lines []string, depName string) int {
	for i, line := range lines {
		if strings.Contains(line, depName) {
			return i + 1
		}
	}
	return 1
}

// isVersionBelow checks if semver version is below target.
// Handles common prefixes like ^, ~, >=.
func isVersionBelow(ver, target string) bool {
	ver = strings.TrimLeft(ver, "^~>=<! ")
	parts := strings.SplitN(ver, ".", 3)
	targetParts := strings.SplitN(target, ".", 3)

	for len(parts) < 3 {
		parts = append(parts, "0")
	}
	for len(targetParts) < 3 {
		targetParts = append(targetParts, "0")
	}

	for i := 0; i < 3; i++ {
		a := parseNum(parts[i])
		b := parseNum(targetParts[i])
		if a < b {
			return true
		}
		if a > b {
			return false
		}
	}
	return false // equal
}

func parseNum(s string) int {
	n := 0
	for _, ch := range s {
		if ch >= '0' && ch <= '9' {
			n = n*10 + int(ch-'0')
		} else {
			break
		}
	}
	return n
}

func extractJSONValue(line string) string {
	// Extract value from "version": "1.0.4"
	idx := strings.Index(line, ":")
	if idx < 0 {
		return ""
	}
	val := strings.TrimSpace(line[idx+1:])
	val = strings.Trim(val, `",`)
	return val
}
