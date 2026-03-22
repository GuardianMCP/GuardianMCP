package uploader

import (
	"bytes"
	"encoding/json"
	"fmt"
	"io"
	"mime/multipart"
	"net/http"

	"github.com/guardianmcp/guardianmcp/internal/scanner"
)

// UploadResponse contains the response from the dashboard API.
type UploadResponse struct {
	ScanID       string `json:"scanId"`
	DashboardURL string `json:"dashboardUrl"`
}

// Uploader uploads scan results to the GuardianMCP dashboard.
type Uploader struct {
	apiURL string
	apiKey string
	client *http.Client
}

// New creates a new uploader.
func New(apiURL, apiKey string) *Uploader {
	return &Uploader{
		apiURL: apiURL,
		apiKey: apiKey,
		client: &http.Client{},
	}
}

// Upload sends scan results to the dashboard.
func (u *Uploader) Upload(serverID string, result *scanner.ScanResult) (*UploadResponse, error) {
	resultJSON, err := json.Marshal(result)
	if err != nil {
		return nil, fmt.Errorf("failed to marshal scan result: %w", err)
	}

	var buf bytes.Buffer
	writer := multipart.NewWriter(&buf)

	// Add scan result JSON
	part, err := writer.CreateFormFile("scanResult", "scan-result.json")
	if err != nil {
		return nil, err
	}
	if _, err := part.Write(resultJSON); err != nil {
		return nil, err
	}

	// Add server ID
	if err := writer.WriteField("serverId", serverID); err != nil {
		return nil, err
	}

	if err := writer.Close(); err != nil {
		return nil, err
	}

	req, err := http.NewRequest("POST", u.apiURL+"/api/v1/cli/upload", &buf)
	if err != nil {
		return nil, err
	}
	req.Header.Set("Content-Type", writer.FormDataContentType())
	req.Header.Set("X-API-Key", u.apiKey)

	resp, err := u.client.Do(req)
	if err != nil {
		return nil, fmt.Errorf("API request failed: %w", err)
	}
	defer resp.Body.Close()

	body, err := io.ReadAll(resp.Body)
	if err != nil {
		return nil, fmt.Errorf("failed to read response: %w", err)
	}

	if resp.StatusCode != http.StatusCreated {
		return nil, fmt.Errorf("API returned status %d: %s", resp.StatusCode, string(body))
	}

	var uploadResp UploadResponse
	if err := json.Unmarshal(body, &uploadResp); err != nil {
		return nil, fmt.Errorf("failed to parse response: %w", err)
	}

	return &uploadResp, nil
}
