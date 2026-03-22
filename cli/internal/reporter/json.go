package reporter

import (
	"encoding/json"
	"io"

	"github.com/guardianmcp/guardianmcp/internal/scanner"
)

// JSONReporter outputs scan results as JSON.
type JSONReporter struct{}

// Report generates JSON output for scan results.
func (j *JSONReporter) Report(result *scanner.ScanResult, w io.Writer) error {
	encoder := json.NewEncoder(w)
	encoder.SetIndent("", "  ")
	return encoder.Encode(result)
}
