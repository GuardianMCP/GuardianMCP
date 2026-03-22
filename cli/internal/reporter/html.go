package reporter

import (
	"embed"
	"html/template"
	"io"
	"strings"
	"time"

	"github.com/guardianmcp/guardianmcp/internal/scanner"
)

//go:embed templates/report.html.tmpl
var templateFS embed.FS

// HTMLReporter generates a self-contained HTML report.
type HTMLReporter struct{}

// HTMLReportData holds data passed to the HTML template.
type HTMLReportData struct {
	ScanPath      string
	Date          string
	CLIVersion    string
	FilesScanned  int
	RulesChecked  int
	Duration      string
	SecurityScore int
	ScoreColor    string
	ScoreLabel    string
	Summary       scanner.ScanSummary
	Findings      []scanner.Finding
	RuleSummary   []RuleSummaryEntry
}

// RuleSummaryEntry shows how many findings each rule produced.
type RuleSummaryEntry struct {
	RuleID   string
	RuleName string
	Count    int
	Severity scanner.Severity
}

// Report generates an HTML report.
func (h *HTMLReporter) Report(result *scanner.ScanResult, w io.Writer) error {
	tmpl, err := template.New("report.html.tmpl").Funcs(template.FuncMap{
		"lower":         strings.ToLower,
		"severityColor": severityColor,
		"trimSnippet":   trimSnippet,
	}).ParseFS(templateFS, "templates/report.html.tmpl")
	if err != nil {
		return err
	}

	// Build rule summary
	ruleMap := make(map[string]*RuleSummaryEntry)
	for _, f := range result.Findings {
		entry, ok := ruleMap[f.RuleID]
		if !ok {
			entry = &RuleSummaryEntry{
				RuleID:   f.RuleID,
				RuleName: f.RuleName,
				Severity: f.Severity,
			}
			ruleMap[f.RuleID] = entry
		}
		entry.Count++
	}

	var ruleSummary []RuleSummaryEntry
	for _, entry := range ruleMap {
		ruleSummary = append(ruleSummary, *entry)
	}

	data := HTMLReportData{
		ScanPath:      result.ScanPath,
		Date:          time.Now().Format("2006-01-02 15:04:05"),
		CLIVersion:    result.CLIVersion,
		FilesScanned:  result.FilesScanned,
		RulesChecked:  result.RulesChecked,
		Duration:      result.Duration.String(),
		SecurityScore: result.SecurityScore,
		ScoreColor:    scoreColor(result.SecurityScore),
		ScoreLabel:    scoreLabel(result.SecurityScore),
		Summary:       result.Summary,
		Findings:      result.Findings,
		RuleSummary:   ruleSummary,
	}

	return tmpl.Execute(w, data)
}

func severityColor(sev scanner.Severity) string {
	switch sev {
	case scanner.SeverityCritical:
		return "#dc2626"
	case scanner.SeverityHigh:
		return "#ea580c"
	case scanner.SeverityMedium:
		return "#d97706"
	case scanner.SeverityLow:
		return "#2563eb"
	case scanner.SeverityInfo:
		return "#6b7280"
	default:
		return "#6b7280"
	}
}

func scoreColor(score int) string {
	switch {
	case score >= 90:
		return "#16a34a"
	case score >= 70:
		return "#0d9488"
	case score >= 50:
		return "#d97706"
	default:
		return "#dc2626"
	}
}

func scoreLabel(score int) string {
	switch {
	case score >= 90:
		return "Excellent"
	case score >= 70:
		return "Good"
	case score >= 50:
		return "Needs Attention"
	case score >= 30:
		return "At Risk"
	default:
		return "Critical Risk"
	}
}

func trimSnippet(s string) string {
	lines := strings.Split(s, "\n")
	if len(lines) > 5 {
		lines = lines[:5]
	}
	return strings.Join(lines, "\n")
}
