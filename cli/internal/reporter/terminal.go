package reporter

import (
	"fmt"
	"io"
	"strings"

	"github.com/charmbracelet/lipgloss"
	"github.com/guardianmcp/guardianmcp/internal/scanner"
)

// TerminalReporter outputs scan results to the terminal with color support.
type TerminalReporter struct {
	color bool
}

// NewTerminalReporter creates a new terminal reporter.
func NewTerminalReporter(color bool) *TerminalReporter {
	return &TerminalReporter{color: color}
}

func (t *TerminalReporter) severityStyle(sev scanner.Severity) lipgloss.Style {
	if !t.color {
		return lipgloss.NewStyle()
	}

	switch sev {
	case scanner.SeverityCritical:
		return lipgloss.NewStyle().Foreground(lipgloss.Color("#dc2626")).Bold(true)
	case scanner.SeverityHigh:
		return lipgloss.NewStyle().Foreground(lipgloss.Color("#ea580c")).Bold(true)
	case scanner.SeverityMedium:
		return lipgloss.NewStyle().Foreground(lipgloss.Color("#d97706")).Bold(true)
	case scanner.SeverityLow:
		return lipgloss.NewStyle().Foreground(lipgloss.Color("#2563eb"))
	case scanner.SeverityInfo:
		return lipgloss.NewStyle().Foreground(lipgloss.Color("#6b7280"))
	default:
		return lipgloss.NewStyle()
	}
}

func (t *TerminalReporter) scoreColor(score int) lipgloss.Style {
	if !t.color {
		return lipgloss.NewStyle()
	}
	switch {
	case score >= 90:
		return lipgloss.NewStyle().Foreground(lipgloss.Color("#16a34a")).Bold(true)
	case score >= 70:
		return lipgloss.NewStyle().Foreground(lipgloss.Color("#0d9488")).Bold(true)
	case score >= 50:
		return lipgloss.NewStyle().Foreground(lipgloss.Color("#d97706")).Bold(true)
	default:
		return lipgloss.NewStyle().Foreground(lipgloss.Color("#dc2626")).Bold(true)
	}
}

// Report generates terminal output for scan results.
func (t *TerminalReporter) Report(result *scanner.ScanResult, w io.Writer) error {
	if len(result.Findings) == 0 {
		fmt.Fprintf(w, "  No security findings detected. Score: %s\n\n",
			t.scoreColor(result.SecurityScore).Render(fmt.Sprintf("%d/100", result.SecurityScore)))

		t.printSummaryLine(w, result)
		return nil
	}

	fmt.Fprintf(w, "  Scanning %d files...\n\n", result.FilesScanned)

	for _, f := range result.Findings {
		sevStyle := t.severityStyle(f.Severity)
		sevLabel := sevStyle.Render(fmt.Sprintf("%-10s", f.Severity))

		fmt.Fprintf(w, "  %s [%s] %s\n", sevLabel, f.RuleID, f.RuleName)
		fmt.Fprintf(w, "            File: %s:%d\n", f.File, f.Line)

		if f.Snippet != "" {
			// Show only first line of snippet
			snippetLine := strings.Split(f.Snippet, "\n")[0]
			if len(snippetLine) > 80 {
				snippetLine = snippetLine[:77] + "..."
			}
			fmt.Fprintf(w, "            Code: %s\n", strings.TrimSpace(snippetLine))
		}

		if f.Remediation != "" {
			fmt.Fprintf(w, "            Fix:  %s\n", f.Remediation)
		}

		fmt.Fprintln(w)
	}

	// Summary separator
	if t.color {
		separator := lipgloss.NewStyle().Foreground(lipgloss.Color("#6b7280"))
		fmt.Fprintf(w, "  %s\n", separator.Render(strings.Repeat("─", 45)))
	} else {
		fmt.Fprintf(w, "  %s\n", strings.Repeat("-", 45))
	}

	// Results summary
	s := result.Summary
	fmt.Fprintf(w, "  Results: %s critical, %s high, %s medium, %s low, %s info\n",
		t.severityStyle(scanner.SeverityCritical).Render(fmt.Sprintf("%d", s.Critical)),
		t.severityStyle(scanner.SeverityHigh).Render(fmt.Sprintf("%d", s.High)),
		t.severityStyle(scanner.SeverityMedium).Render(fmt.Sprintf("%d", s.Medium)),
		t.severityStyle(scanner.SeverityLow).Render(fmt.Sprintf("%d", s.Low)),
		t.severityStyle(scanner.SeverityInfo).Render(fmt.Sprintf("%d", s.Info)),
	)

	t.printSummaryLine(w, result)

	fmt.Fprintf(w, "\n  Run with --format html to generate a shareable report.\n")

	return nil
}

func (t *TerminalReporter) printSummaryLine(w io.Writer, result *scanner.ScanResult) {
	durationStr := fmt.Sprintf("%.1fs", result.Duration.Seconds())
	fmt.Fprintf(w, "  Files scanned: %d  |  Rules checked: %d  |  Time: %s  |  Score: %s\n",
		result.FilesScanned,
		result.RulesChecked,
		durationStr,
		t.scoreColor(result.SecurityScore).Render(fmt.Sprintf("%d/100", result.SecurityScore)),
	)
}
