package reporter

import (
	"io"

	"github.com/guardianmcp/guardianmcp/internal/scanner"
)

// Reporter defines the interface for outputting scan results.
type Reporter interface {
	Report(result *scanner.ScanResult, w io.Writer) error
}
