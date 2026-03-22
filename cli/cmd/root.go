package cmd

import (
	"fmt"
	"os"

	"github.com/spf13/cobra"
)

const version = "0.2.0"

var (
	cfgFile string
	noColor bool
	quiet   bool
)

var rootCmd = &cobra.Command{
	Use:   "guardianmcp",
	Short: "MCP Security Scanner — find vulnerabilities in MCP servers",
	Long: `GuardianMCP is a security scanner for Model Context Protocol (MCP) servers.
It checks your codebase against the OWASP MCP Top 10 and known CVE patterns.

Usage:
  guardianmcp scan [path]     Scan a directory or file
  guardianmcp init            Create a .guardianmcp.yml config file
  guardianmcp version         Print version information`,
	SilenceUsage:  true,
	SilenceErrors: true,
}

// Execute runs the root command.
func Execute() {
	if err := rootCmd.Execute(); err != nil {
		fmt.Fprintln(os.Stderr, err)
		os.Exit(2)
	}
}

func init() {
	rootCmd.PersistentFlags().StringVar(&cfgFile, "config", ".guardianmcp.yml", "config file path")
	rootCmd.PersistentFlags().BoolVar(&noColor, "no-color", false, "disable color output")
	rootCmd.PersistentFlags().BoolVar(&quiet, "quiet", false, "suppress all output except errors")

	// Respect NO_COLOR env var
	if os.Getenv("NO_COLOR") != "" {
		noColor = true
	}
}
