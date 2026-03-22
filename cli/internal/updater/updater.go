package updater

import (
	"encoding/json"
	"fmt"
	"net/http"
	"os"
	"strings"
	"time"

	"github.com/charmbracelet/lipgloss"
)

const (
	repoOwner = "GuardianMCP"
	repoName  = "GuardianMCP"
)

type githubRelease struct {
	TagName string `json:"tag_name"`
	HTMLURL string `json:"html_url"`
}

// CheckForUpdate checks GitHub for a newer release. Returns empty strings if up to date.
func CheckForUpdate(currentVersion string) (latestVersion, releaseURL string) {
	client := &http.Client{Timeout: 3 * time.Second}
	url := fmt.Sprintf("https://api.github.com/repos/%s/%s/releases/latest", repoOwner, repoName)

	resp, err := client.Get(url)
	if err != nil || resp.StatusCode != 200 {
		return "", ""
	}
	defer resp.Body.Close()

	var release githubRelease
	if err := json.NewDecoder(resp.Body).Decode(&release); err != nil {
		return "", ""
	}

	latest := strings.TrimPrefix(release.TagName, "v")
	current := strings.TrimPrefix(currentVersion, "v")

	if latest != current && isNewer(latest, current) {
		return latest, release.HTMLURL
	}

	return "", ""
}

// PrintUpdateNotice prints a styled update notification to stderr.
func PrintUpdateNotice(currentVersion, latestVersion string) {
	border := lipgloss.NewStyle().
		Border(lipgloss.RoundedBorder()).
		BorderForeground(lipgloss.Color("#f59e0b")).
		Padding(0, 1)

	title := lipgloss.NewStyle().
		Foreground(lipgloss.Color("#f59e0b")).
		Bold(true).
		Render("Update available!")

	current := lipgloss.NewStyle().
		Foreground(lipgloss.Color("#6b7280")).
		Render(currentVersion)

	arrow := lipgloss.NewStyle().
		Foreground(lipgloss.Color("#6b7280")).
		Render(" → ")

	latest := lipgloss.NewStyle().
		Foreground(lipgloss.Color("#16a34a")).
		Bold(true).
		Render(latestVersion)

	cmd := lipgloss.NewStyle().
		Foreground(lipgloss.Color("#38bdf8")).
		Render("npm update -g @guardianmcp/cli")

	msg := fmt.Sprintf("%s  %s%s%s\n  Run: %s", title, current, arrow, latest, cmd)
	fmt.Fprintf(os.Stderr, "\n%s\n\n", border.Render(msg))
}

// isNewer returns true if version a is newer than version b (simple semver comparison).
func isNewer(a, b string) bool {
	aParts := strings.Split(a, ".")
	bParts := strings.Split(b, ".")

	for i := 0; i < len(aParts) && i < len(bParts); i++ {
		if aParts[i] > bParts[i] {
			return true
		}
		if aParts[i] < bParts[i] {
			return false
		}
	}
	return len(aParts) > len(bParts)
}
