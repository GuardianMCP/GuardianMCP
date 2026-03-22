package config

import (
	"os"
	"strings"

	"gopkg.in/yaml.v3"
)

// Config represents the .guardianmcp.yml configuration file.
type Config struct {
	Version string      `yaml:"version"`
	Scan    ScanConfig  `yaml:"scan"`
	Dashboard DashboardConfig `yaml:"dashboard"`
	CI      CIConfig    `yaml:"ci"`
}

// ScanConfig holds scan-related configuration.
type ScanConfig struct {
	Severity   string   `yaml:"severity"`
	Ignore     []string `yaml:"ignore"`
	Rules      string   `yaml:"rules"`
	Extensions []string `yaml:"extensions"`
}

// DashboardConfig holds dashboard integration settings.
type DashboardConfig struct {
	APIKey   string `yaml:"api_key"`
	ServerID string `yaml:"server_id"`
}

// CIConfig holds CI-specific settings.
type CIConfig struct {
	FailOn string `yaml:"fail_on"`
}

// DefaultConfig returns the default configuration.
func DefaultConfig() *Config {
	return &Config{
		Version: "1",
		Scan: ScanConfig{
			Severity: "info",
			Ignore:   []string{},
			Rules:    "all",
			Extensions: []string{
				".go", ".ts", ".js", ".py", ".rb", ".java",
				".json", ".yaml", ".yml", ".env", ".env.example",
				".toml", ".ini", ".conf",
			},
		},
		Dashboard: DashboardConfig{},
		CI: CIConfig{
			FailOn: "high",
		},
	}
}

// Load reads a .guardianmcp.yml config file and returns the parsed config.
// If the file doesn't exist, returns default config with no error.
func Load(path string) (*Config, error) {
	cfg := DefaultConfig()

	data, err := os.ReadFile(path)
	if err != nil {
		if os.IsNotExist(err) {
			return cfg, nil
		}
		return nil, err
	}

	if err := yaml.Unmarshal(data, cfg); err != nil {
		return nil, err
	}

	return cfg, nil
}

// DefaultConfigYAML returns the default config as YAML string for `guardianmcp init`.
func DefaultConfigYAML() string {
	return `# .guardianmcp.yml — GuardianMCP configuration
version: "1"

scan:
  # Minimum severity to include in reports (info | low | medium | high | critical)
  severity: info

  # Files/directories to ignore (glob patterns)
  ignore:
    - "**/*.test.ts"
    - "**/fixtures/**"
    - "**/mocks/**"

  # Rules to enable. "all" enables everything. List rule IDs to restrict.
  rules: all

  # File extensions to scan
  extensions:
    - .go
    - .ts
    - .js
    - .py
    - .json
    - .yaml
    - .yml
    - .env

# Dashboard integration (optional)
dashboard:
  api_key: ""      # Or set GUARDIANMCP_API_KEY env var
  server_id: ""    # Or set GUARDIANMCP_SERVER_ID env var

# CI mode: exit 1 if findings at or above this severity exist
ci:
  fail_on: high    # info | low | medium | high | critical | none
`
}

// HasExtension checks if an extension is in the configured list.
func (c *Config) HasExtension(ext string) bool {
	ext = strings.ToLower(ext)
	for _, e := range c.Scan.Extensions {
		if strings.ToLower(e) == ext {
			return true
		}
	}
	return false
}

// GetAPIKey returns the API key from config or environment.
func (c *Config) GetAPIKey() string {
	if c.Dashboard.APIKey != "" {
		return c.Dashboard.APIKey
	}
	return os.Getenv("GUARDIANMCP_API_KEY")
}

// GetServerID returns the server ID from config or environment.
func (c *Config) GetServerID() string {
	if c.Dashboard.ServerID != "" {
		return c.Dashboard.ServerID
	}
	return os.Getenv("GUARDIANMCP_SERVER_ID")
}

// GetAPIURL returns the dashboard API URL.
func GetAPIURL() string {
	url := os.Getenv("GUARDIANMCP_API_URL")
	if url != "" {
		return url
	}
	return "https://api.guardianmcp.dev"
}
