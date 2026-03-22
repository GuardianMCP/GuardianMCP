package rules

// DefaultRules returns all built-in security rules.
func DefaultRules() []Rule {
	return []Rule{
		&HardcodedSecretsRule{},
		&MissingAuthRule{},
		&CommandInjectionRule{},
		&PathTraversalRule{},
		&SSRFRule{},
		&SQLInjectionRule{},
		&OAuthInjectionRule{},
		&ToolPoisoningRule{},
		&NetworkBindingRule{},
		&SupplyChainRule{},
	}
}
