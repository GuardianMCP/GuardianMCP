package rules

import (
	"testing"

	"github.com/guardianmcp/guardianmcp/internal/types"
)

func TestCommandInjectionRule_Check(t *testing.T) {
	rule := &CommandInjectionRule{}

	tests := []struct {
		name         string
		path         string
		code         string
		wantFindings int
	}{
		// --- Positive cases: should detect command injection ---
		{
			name: "exec with template literal interpolation",
			path: "src/tools/runner.ts",
			code: "import { exec } from 'child_process';\n" +
				"function run(userInput: string) {\n" +
				"    exec(`ls -la ${userInput}`);\n" +
				"}\n",
			wantFindings: 1,
		},
		{
			name: "execSync with template literal interpolation",
			path: "src/tools/runner.js",
			code: "const { execSync } = require('child_process');\n" +
				"function runSync(cmd) {\n" +
				"    const result = execSync(`git clone ${cmd}`);\n" +
				"    return result;\n" +
				"}\n",
			wantFindings: 1,
		},
		{
			name: "eval usage detected",
			path: "src/handler.js",
			code: `function processInput(input) {
    const result = eval(input);
    return result;
}`,
			wantFindings: 1,
		},
		{
			name: "Python subprocess with f-string",
			path: "tools/runner.py",
			code: `import subprocess

def run_command(user_input):
    subprocess.run(f"echo {user_input}", shell=True)
    return "done"
`,
			wantFindings: 1,
		},

		// --- Negative cases: should NOT detect command injection ---
		{
			name: "execFile with args array (safe usage)",
			path: "src/tools/safe_runner.ts",
			code: `import { execFile } from 'child_process';

function safeRun(userInput: string) {
    execFile('/usr/bin/git', ['clone', userInput], (err, stdout) => {
        console.log(stdout);
    });
}`,
			wantFindings: 0,
		},
		{
			name: "exec with nosec comment suppresses detection",
			path: "src/tools/runner.ts",
			code: "import { exec } from 'child_process';\n" +
				"function run(userInput: string) {\n" +
				"    exec(`ls -la ${userInput}`); // nosec\n" +
				"}\n",
			wantFindings: 0,
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			fc := makeFileContext(tt.path, tt.code)
			findings := rule.Check(fc)
			if len(findings) != tt.wantFindings {
				t.Errorf("CommandInjectionRule.Check() returned %d findings, want %d", len(findings), tt.wantFindings)
				for i, f := range findings {
					t.Logf("  finding[%d]: line=%d message=%q", i, f.Line, f.Message)
				}
			}
			for _, f := range findings {
				if f.RuleID != "MCP-003" {
					t.Errorf("expected RuleID MCP-003, got %s", f.RuleID)
				}
				if f.Severity != types.SeverityCritical {
					t.Errorf("expected severity CRITICAL, got %s", f.Severity)
				}
			}
		})
	}
}
