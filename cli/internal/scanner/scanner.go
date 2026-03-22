package scanner

import (
	"sort"

	"github.com/guardianmcp/guardianmcp/internal/scanner/rules"
)

// Options configures the scanner.
type Options struct {
	Path           string
	IsDir          bool
	Rules          []rules.Rule
	Extensions     []string
	IgnorePatterns []string
}

// Scanner orchestrates file walking and rule execution.
type Scanner struct {
	opts Options
}

// New creates a new scanner.
func New(opts Options) *Scanner {
	return &Scanner{opts: opts}
}

// Scan runs all rules against all eligible files.
func (s *Scanner) Scan() (*ScanResult, error) {
	walker := NewWalker(WalkerOptions{
		Path:           s.opts.Path,
		IsDir:          s.opts.IsDir,
		Extensions:     s.opts.Extensions,
		IgnorePatterns: s.opts.IgnorePatterns,
	})

	files, err := walker.Walk()
	if err != nil {
		return nil, err
	}

	var allFindings []Finding

	for _, file := range files {
		for _, rule := range s.opts.Rules {
			findings := rule.Check(file)
			allFindings = append(allFindings, findings...)
		}
	}

	// Sort findings by severity (highest first), then by file path
	sort.Slice(allFindings, func(i, j int) bool {
		ri := SeverityRank(allFindings[i].Severity)
		rj := SeverityRank(allFindings[j].Severity)
		if ri != rj {
			return ri > rj
		}
		if allFindings[i].File != allFindings[j].File {
			return allFindings[i].File < allFindings[j].File
		}
		return allFindings[i].Line < allFindings[j].Line
	})

	return &ScanResult{
		Findings:     allFindings,
		FilesScanned: len(files),
	}, nil
}
