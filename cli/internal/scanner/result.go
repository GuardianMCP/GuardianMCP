package scanner

import "github.com/guardianmcp/guardianmcp/internal/types"

// Re-export types from the types package to avoid import cycles.
// The scanner package uses these types, and rules also use them directly from types.
type Severity = types.Severity
type Confidence = types.Confidence
type FileContext = types.FileContext
type Finding = types.Finding
type ScanSummary = types.ScanSummary
type ScanResult = types.ScanResult

const (
	SeverityCritical = types.SeverityCritical
	SeverityHigh     = types.SeverityHigh
	SeverityMedium   = types.SeverityMedium
	SeverityLow      = types.SeverityLow
	SeverityInfo     = types.SeverityInfo
)

var (
	SeverityRank           = types.SeverityRank
	ParseSeverity          = types.ParseSeverity
	CalculateSecurityScore = types.CalculateSecurityScore
	CalculateSummary       = types.CalculateSummary
)
