package cmd

import (
	"fmt"
	"os"
	"time"

	"github.com/guardianmcp/guardianmcp/internal/config"
	"github.com/guardianmcp/guardianmcp/internal/reporter"
	"github.com/guardianmcp/guardianmcp/internal/scanner"
	"github.com/guardianmcp/guardianmcp/internal/scanner/rules"
	"github.com/guardianmcp/guardianmcp/internal/uploader"
	"github.com/spf13/cobra"
)

var (
	formatFlag   string
	outputFlag   string
	severityFlag string
	rulesFlag    string
	ignoreFlag   string
	exitCodeFlag bool
	apiKeyFlag   string
	serverIDFlag string
)

var scanCmd = &cobra.Command{
	Use:   "scan [path]",
	Short: "Scan an MCP server codebase for security vulnerabilities",
	Long:  `Scan a directory or file for security vulnerabilities against the OWASP MCP Top 10.`,
	Args:  cobra.MaximumNArgs(1),
	RunE:  runScan,
}

func init() {
	scanCmd.Flags().StringVar(&formatFlag, "format", "terminal", "output format: terminal, json, html")
	scanCmd.Flags().StringVar(&outputFlag, "output", "", "file path for report output")
	scanCmd.Flags().StringVar(&severityFlag, "severity", "", "minimum severity to report: info, low, medium, high, critical")
	scanCmd.Flags().StringVar(&rulesFlag, "rules", "", "comma-separated rule IDs to run, or 'all'")
	scanCmd.Flags().StringVar(&ignoreFlag, "ignore", "", "comma-separated file glob patterns to ignore")
	scanCmd.Flags().BoolVar(&exitCodeFlag, "exit-code", false, "exit with code 1 if findings above severity threshold")
	scanCmd.Flags().StringVar(&apiKeyFlag, "api-key", "", "GuardianMCP dashboard API key")
	scanCmd.Flags().StringVar(&serverIDFlag, "server-id", "", "server ID in GuardianMCP dashboard")

	rootCmd.AddCommand(scanCmd)
}

func runScan(cmd *cobra.Command, args []string) error {
	scanPath := "."
	if len(args) > 0 {
		scanPath = args[0]
	}

	// Validate path exists
	info, err := os.Stat(scanPath)
	if err != nil {
		return fmt.Errorf("invalid path: %w", err)
	}

	// Load config
	cfg, err := config.Load(cfgFile)
	if err != nil {
		return fmt.Errorf("failed to load config: %w", err)
	}

	// CLI flags override config
	if severityFlag != "" {
		cfg.Scan.Severity = severityFlag
	}
	if rulesFlag != "" {
		cfg.Scan.Rules = rulesFlag
	}
	if apiKeyFlag != "" {
		cfg.Dashboard.APIKey = apiKeyFlag
	}
	if serverIDFlag != "" {
		cfg.Dashboard.ServerID = serverIDFlag
	}

	minSeverity := scanner.ParseSeverity(cfg.Scan.Severity)

	// Build ignore patterns
	var ignorePatterns []string
	ignorePatterns = append(ignorePatterns, cfg.Scan.Ignore...)
	if ignoreFlag != "" {
		for _, p := range splitCSV(ignoreFlag) {
			ignorePatterns = append(ignorePatterns, p)
		}
	}

	// Get rules to run
	allRules := rules.DefaultRules()
	enabledRules := filterRules(allRules, cfg.Scan.Rules)

	if !quiet {
		fmt.Fprintf(os.Stderr, "guardianmcp v%s — scanning %s\n\n", version, scanPath)
	}

	// Create and run scanner
	s := scanner.New(scanner.Options{
		Path:           scanPath,
		IsDir:          info.IsDir(),
		Rules:          enabledRules,
		Extensions:     cfg.Scan.Extensions,
		IgnorePatterns: ignorePatterns,
	})

	start := time.Now()
	result, err := s.Scan()
	if err != nil {
		return fmt.Errorf("scan failed: %w", err)
	}

	result.Duration = time.Since(start)
	result.DurationMs = result.Duration.Milliseconds()
	result.ScanPath = scanPath
	result.CLIVersion = version
	result.RulesChecked = len(enabledRules)
	result.SecurityScore = scanner.CalculateSecurityScore(result.Findings)
	result.Summary = scanner.CalculateSummary(result.Findings)

	// Filter findings by minimum severity
	result.Findings = filterBySeverity(result.Findings, minSeverity)

	// Select reporter
	var rep reporter.Reporter
	switch formatFlag {
	case "json":
		rep = &reporter.JSONReporter{}
	case "html":
		rep = &reporter.HTMLReporter{}
	default:
		rep = reporter.NewTerminalReporter(!noColor)
	}

	// Determine output destination
	var out *os.File
	if outputFlag != "" {
		out, err = os.Create(outputFlag)
		if err != nil {
			return fmt.Errorf("failed to create output file: %w", err)
		}
		defer out.Close()
	} else if formatFlag == "html" && outputFlag == "" {
		out, err = os.Create("guardianmcp-report.html")
		if err != nil {
			return fmt.Errorf("failed to create HTML report: %w", err)
		}
		defer out.Close()
		if !quiet {
			fmt.Fprintf(os.Stderr, "  Writing HTML report to guardianmcp-report.html\n")
		}
	} else {
		out = os.Stdout
	}

	// Generate report
	if !quiet {
		if err := rep.Report(result, out); err != nil {
			return fmt.Errorf("failed to generate report: %w", err)
		}
	}

	// Upload to dashboard if configured
	apiKey := cfg.GetAPIKey()
	serverID := cfg.GetServerID()
	if apiKey != "" && serverID != "" {
		if !quiet {
			fmt.Fprintf(os.Stderr, "\n  Uploading results to GuardianMCP dashboard...\n")
		}
		u := uploader.New(config.GetAPIURL(), apiKey)
		resp, err := u.Upload(serverID, result)
		if err != nil {
			fmt.Fprintf(os.Stderr, "  Warning: failed to upload results: %v\n", err)
		} else if !quiet {
			fmt.Fprintf(os.Stderr, "  Uploaded! View at: %s\n", resp.DashboardURL)
		}
	}

	// Exit with code 1 if findings above threshold and --exit-code set
	if exitCodeFlag && hasFindings(result.Findings, minSeverity) {
		os.Exit(1)
	}

	return nil
}

func filterBySeverity(findings []scanner.Finding, minSeverity scanner.Severity) []scanner.Finding {
	minRank := scanner.SeverityRank(minSeverity)
	var filtered []scanner.Finding
	for _, f := range findings {
		if scanner.SeverityRank(f.Severity) >= minRank {
			filtered = append(filtered, f)
		}
	}
	return filtered
}

func hasFindings(findings []scanner.Finding, minSeverity scanner.Severity) bool {
	minRank := scanner.SeverityRank(minSeverity)
	for _, f := range findings {
		if scanner.SeverityRank(f.Severity) >= minRank {
			return true
		}
	}
	return false
}

func filterRules(allRules []rules.Rule, rulesConfig string) []rules.Rule {
	if rulesConfig == "" || rulesConfig == "all" {
		return allRules
	}

	enabled := make(map[string]bool)
	for _, id := range splitCSV(rulesConfig) {
		enabled[id] = true
	}

	var filtered []rules.Rule
	for _, r := range allRules {
		if enabled[r.ID()] {
			filtered = append(filtered, r)
		}
	}
	return filtered
}

func splitCSV(s string) []string {
	var parts []string
	for _, p := range splitString(s, ",") {
		trimmed := trimSpace(p)
		if trimmed != "" {
			parts = append(parts, trimmed)
		}
	}
	return parts
}

func splitString(s, sep string) []string {
	result := []string{}
	for s != "" {
		idx := indexOf(s, sep)
		if idx < 0 {
			result = append(result, s)
			break
		}
		result = append(result, s[:idx])
		s = s[idx+len(sep):]
	}
	return result
}

func indexOf(s, substr string) int {
	for i := 0; i <= len(s)-len(substr); i++ {
		if s[i:i+len(substr)] == substr {
			return i
		}
	}
	return -1
}

func trimSpace(s string) string {
	start := 0
	end := len(s)
	for start < end && (s[start] == ' ' || s[start] == '\t') {
		start++
	}
	for end > start && (s[end-1] == ' ' || s[end-1] == '\t') {
		end--
	}
	return s[start:end]
}
