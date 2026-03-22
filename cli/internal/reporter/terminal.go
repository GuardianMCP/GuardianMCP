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

func (t *TerminalReporter) severityIcon(sev scanner.Severity) string {
	if !t.color {
		return ""
	}
	switch sev {
	case scanner.SeverityCritical:
		return "● "
	case scanner.SeverityHigh:
		return "▲ "
	case scanner.SeverityMedium:
		return "■ "
	case scanner.SeverityLow:
		return "◆ "
	default:
		return "○ "
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

func (t *TerminalReporter) scoreBar(score int) string {
	if !t.color {
		return fmt.Sprintf("[%d/100]", score)
	}

	filled := score / 5 // 20 chars max
	empty := 20 - filled

	var barColor lipgloss.Color
	switch {
	case score >= 90:
		barColor = lipgloss.Color("#16a34a")
	case score >= 70:
		barColor = lipgloss.Color("#0d9488")
	case score >= 50:
		barColor = lipgloss.Color("#d97706")
	default:
		barColor = lipgloss.Color("#dc2626")
	}

	filledStyle := lipgloss.NewStyle().Foreground(barColor)
	emptyStyle := lipgloss.NewStyle().Foreground(lipgloss.Color("#374151"))

	bar := filledStyle.Render(strings.Repeat("█", filled)) +
		emptyStyle.Render(strings.Repeat("░", empty))

	scoreStr := t.scoreColor(score).Render(fmt.Sprintf(" %d/100", score))
	return bar + scoreStr
}

func (t *TerminalReporter) scoreLabel(score int) string {
	switch {
	case score >= 80:
		return "Excellent"
	case score >= 60:
		return "Good"
	case score >= 40:
		return "Needs Work"
	default:
		return "Critical"
	}
}

// Report generates terminal output for scan results.
func (t *TerminalReporter) Report(result *scanner.ScanResult, w io.Writer) error {
	dim := lipgloss.NewStyle().Foreground(lipgloss.Color("#6b7280"))

	if len(result.Findings) == 0 {
		if t.color {
			checkmark := lipgloss.NewStyle().Foreground(lipgloss.Color("#16a34a")).Bold(true).Render("✓")
			fmt.Fprintf(w, "\n  %s No security findings detected!\n\n", checkmark)
		} else {
			fmt.Fprintf(w, "\n  No security findings detected.\n\n")
		}
		fmt.Fprintf(w, "  %s\n", t.scoreBar(result.SecurityScore))
		fmt.Fprintln(w)
		t.printSummaryLine(w, result)
		return nil
	}

	// Findings header
	total := len(result.Findings)
	if t.color {
		header := lipgloss.NewStyle().Foreground(lipgloss.Color("#f87171")).Bold(true)
		fmt.Fprintf(w, "  %s\n\n", header.Render(fmt.Sprintf("Found %d security issue%s:", total, pluralize(total))))
	} else {
		fmt.Fprintf(w, "  Found %d security issue%s:\n\n", total, pluralize(total))
	}

	for i, f := range result.Findings {
		sevStyle := t.severityStyle(f.Severity)
		icon := t.severityIcon(f.Severity)
		sevLabel := sevStyle.Render(icon + fmt.Sprintf("%-10s", f.Severity))

		// Rule info
		ruleID := dim.Render(fmt.Sprintf("[%s]", f.RuleID))
		fmt.Fprintf(w, "  %s %s %s\n", sevLabel, ruleID, f.RuleName)

		// File location
		fileStyle := lipgloss.NewStyle().Foreground(lipgloss.Color("#38bdf8"))
		if t.color {
			fmt.Fprintf(w, "             %s %s\n", dim.Render("→"), fileStyle.Render(fmt.Sprintf("%s:%d", f.File, f.Line)))
		} else {
			fmt.Fprintf(w, "             File: %s:%d\n", f.File, f.Line)
		}

		if f.Snippet != "" {
			snippetLine := strings.Split(f.Snippet, "\n")[0]
			if len(snippetLine) > 80 {
				snippetLine = snippetLine[:77] + "..."
			}
			if t.color {
				codeStyle := lipgloss.NewStyle().Foreground(lipgloss.Color("#a78bfa"))
				fmt.Fprintf(w, "             %s %s\n", dim.Render("│"), codeStyle.Render(strings.TrimSpace(snippetLine)))
			} else {
				fmt.Fprintf(w, "             Code: %s\n", strings.TrimSpace(snippetLine))
			}
		}

		if f.Remediation != "" {
			if t.color {
				fixStyle := lipgloss.NewStyle().Foreground(lipgloss.Color("#34d399"))
				fmt.Fprintf(w, "             %s %s\n", fixStyle.Render("⚡"), dim.Render(f.Remediation))
			} else {
				fmt.Fprintf(w, "             Fix:  %s\n", f.Remediation)
			}
		}

		if i < len(result.Findings)-1 {
			fmt.Fprintln(w)
		}
	}

	fmt.Fprintln(w)

	// Separator
	if t.color {
		separator := lipgloss.NewStyle().Foreground(lipgloss.Color("#374151"))
		fmt.Fprintf(w, "  %s\n\n", separator.Render(strings.Repeat("─", 50)))
	} else {
		fmt.Fprintf(w, "  %s\n\n", strings.Repeat("-", 50))
	}

	// Score bar
	fmt.Fprintf(w, "  Security Score: %s  %s\n\n",
		t.scoreBar(result.SecurityScore),
		dim.Render("("+t.scoreLabel(result.SecurityScore)+")"),
	)

	// Results summary with icons
	s := result.Summary
	fmt.Fprintf(w, "  %s  %s  %s  %s  %s\n",
		t.severityStyle(scanner.SeverityCritical).Render(fmt.Sprintf("● %d critical", s.Critical)),
		t.severityStyle(scanner.SeverityHigh).Render(fmt.Sprintf("▲ %d high", s.High)),
		t.severityStyle(scanner.SeverityMedium).Render(fmt.Sprintf("■ %d medium", s.Medium)),
		t.severityStyle(scanner.SeverityLow).Render(fmt.Sprintf("◆ %d low", s.Low)),
		t.severityStyle(scanner.SeverityInfo).Render(fmt.Sprintf("○ %d info", s.Info)),
	)

	t.printSummaryLine(w, result)

	if t.color {
		fmt.Fprintf(w, "\n  %s\n", dim.Render("Run with --format html to generate a shareable report."))
	} else {
		fmt.Fprintf(w, "\n  Run with --format html to generate a shareable report.\n")
	}

	return nil
}

func (t *TerminalReporter) printSummaryLine(w io.Writer, result *scanner.ScanResult) {
	dim := lipgloss.NewStyle().Foreground(lipgloss.Color("#6b7280"))
	durationStr := fmt.Sprintf("%.1fs", result.Duration.Seconds())

	if t.color {
		fmt.Fprintf(w, "  %s\n",
			dim.Render(fmt.Sprintf("Files: %d  |  Rules: %d  |  Time: %s",
				result.FilesScanned, result.RulesChecked, durationStr)))
	} else {
		fmt.Fprintf(w, "  Files scanned: %d  |  Rules checked: %d  |  Time: %s  |  Score: %d/100\n",
			result.FilesScanned, result.RulesChecked, durationStr, result.SecurityScore)
	}
}

func pluralize(n int) string {
	if n == 1 {
		return ""
	}
	return "s"
}
