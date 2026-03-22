package rules

import "github.com/guardianmcp/guardianmcp/internal/types"

// Rule defines the interface that all security rules must implement.
type Rule interface {
	ID() string
	Name() string
	Description() string
	Severity() types.Severity
	Check(file types.FileContext) []types.Finding
}
