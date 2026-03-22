package cmd

import (
	"fmt"

	"github.com/spf13/cobra"
)

var reportCmd = &cobra.Command{
	Use:   "report [scan-id]",
	Short: "Download and display a report from the GuardianMCP dashboard",
	Args:  cobra.ExactArgs(1),
	RunE: func(cmd *cobra.Command, args []string) error {
		apiKey := apiKeyFlag
		if apiKey == "" {
			return fmt.Errorf("--api-key is required for the report command")
		}

		// TODO: Implement dashboard report download
		fmt.Printf("Downloading report for scan %s...\n", args[0])
		return nil
	},
}

func init() {
	reportCmd.Flags().StringVar(&apiKeyFlag, "api-key", "", "GuardianMCP dashboard API key (required)")
	reportCmd.Flags().StringVar(&formatFlag, "format", "terminal", "output format: terminal, json, html")
	rootCmd.AddCommand(reportCmd)
}
