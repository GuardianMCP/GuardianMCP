package cmd

import (
	"fmt"
	"os"

	"github.com/guardianmcp/guardianmcp/internal/config"
	"github.com/spf13/cobra"
)

var initCmd = &cobra.Command{
	Use:   "init",
	Short: "Create a .guardianmcp.yml config file in the current directory",
	RunE: func(cmd *cobra.Command, args []string) error {
		filename := ".guardianmcp.yml"

		if _, err := os.Stat(filename); err == nil {
			return fmt.Errorf("%s already exists. Remove it first to regenerate", filename)
		}

		if err := os.WriteFile(filename, []byte(config.DefaultConfigYAML()), 0644); err != nil {
			return fmt.Errorf("failed to write config file: %w", err)
		}

		fmt.Printf("Created %s with default configuration.\n", filename)
		return nil
	},
}

func init() {
	rootCmd.AddCommand(initCmd)
}
