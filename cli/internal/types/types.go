package types

import (
	"encoding/json"
	"time"
)

// Severity represents the severity level of a finding.
type Severity string

const (
	SeverityCritical Severity = "CRITICAL"
	SeverityHigh     Severity = "HIGH"
	SeverityMedium   Severity = "MEDIUM"
	SeverityLow      Severity = "LOW"
	SeverityInfo     Severity = "INFO"
)

// SeverityRank returns a numeric rank for sorting (higher = more severe).
func SeverityRank(s Severity) int {
	switch s {
	case SeverityCritical:
		return 5
	case SeverityHigh:
		return 4
	case SeverityMedium:
		return 3
	case SeverityLow:
		return 2
	case SeverityInfo:
		return 1
	default:
		return 0
	}
}

// ParseSeverity converts a string to a Severity, case-insensitive.
func ParseSeverity(s string) Severity {
	switch s {
	case "critical", "CRITICAL":
		return SeverityCritical
	case "high", "HIGH":
		return SeverityHigh
	case "medium", "MEDIUM":
		return SeverityMedium
	case "low", "LOW":
		return SeverityLow
	case "info", "INFO":
		return SeverityInfo
	default:
		return SeverityInfo
	}
}

// Confidence represents how confident a rule is in its finding.
type Confidence string

const (
	ConfidenceHigh   Confidence = "HIGH"
	ConfidenceMedium Confidence = "MEDIUM"
	ConfidenceLow    Confidence = "LOW"
)

// FileContext holds all information about a file being scanned.
type FileContext struct {
	Path      string   // Relative path from scan root
	AbsPath   string   // Absolute path
	Content   []byte   // Raw file content
	Lines     []string // Lines split from content
	Extension string   // File extension (e.g. ".go", ".ts")
	Filename  string   // Base filename (e.g. "server.ts")
}

// Finding represents a single security finding detected by a rule.
type Finding struct {
	RuleID      string   `json:"ruleId"`
	RuleName    string   `json:"ruleName"`
	Severity    Severity `json:"severity"`
	File        string   `json:"file"`
	Line        int      `json:"line"`
	Column      int      `json:"column"`
	Snippet     string   `json:"snippet"`
	Message     string   `json:"message"`
	Remediation string   `json:"remediation"`
	CVERefs     []string `json:"cveRefs,omitempty"`
	OWASPRefs   []string `json:"owaspRefs,omitempty"`
	Confidence  string   `json:"confidence"`
}

// ScanSummary holds counts per severity level.
type ScanSummary struct {
	Critical int `json:"critical"`
	High     int `json:"high"`
	Medium   int `json:"medium"`
	Low      int `json:"low"`
	Info     int `json:"info"`
}

// ScanResult holds the complete result of a scan.
type ScanResult struct {
	Findings      []Finding     `json:"findings"`
	FilesScanned  int           `json:"filesScanned"`
	RulesChecked  int           `json:"rulesChecked"`
	Duration      time.Duration `json:"-"`
	DurationMs    int64         `json:"durationMs"`
	ScanPath      string        `json:"scanPath"`
	CLIVersion    string        `json:"cliVersion"`
	SecurityScore int           `json:"securityScore"`
	Summary       ScanSummary   `json:"summary"`
}

// CalculateSecurityScore computes a 0-100 security score from findings.
func CalculateSecurityScore(findings []Finding) int {
	criticalPenalty := 0
	highPenalty := 0
	mediumPenalty := 0
	lowPenalty := 0

	for _, f := range findings {
		switch f.Severity {
		case SeverityCritical:
			criticalPenalty += 25
			if criticalPenalty > 50 {
				criticalPenalty = 50
			}
		case SeverityHigh:
			highPenalty += 10
			if highPenalty > 30 {
				highPenalty = 30
			}
		case SeverityMedium:
			mediumPenalty += 3
			if mediumPenalty > 15 {
				mediumPenalty = 15
			}
		case SeverityLow:
			lowPenalty += 1
			if lowPenalty > 5 {
				lowPenalty = 5
			}
		}
	}

	score := 100 - criticalPenalty - highPenalty - mediumPenalty - lowPenalty
	if score < 0 {
		score = 0
	}
	return score
}

// CalculateSummary counts findings by severity.
func CalculateSummary(findings []Finding) ScanSummary {
	var s ScanSummary
	for _, f := range findings {
		switch f.Severity {
		case SeverityCritical:
			s.Critical++
		case SeverityHigh:
			s.High++
		case SeverityMedium:
			s.Medium++
		case SeverityLow:
			s.Low++
		case SeverityInfo:
			s.Info++
		}
	}
	return s
}

// MarshalJSON customizes JSON serialization for ScanResult.
func (r ScanResult) MarshalJSON() ([]byte, error) {
	type Alias ScanResult
	return json.Marshal(&struct {
		Alias
		DurationMs int64 `json:"durationMs"`
	}{
		Alias:      Alias(r),
		DurationMs: r.Duration.Milliseconds(),
	})
}
