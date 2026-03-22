# GuardianMCP

**Security scanner for Model Context Protocol (MCP) servers**

Detect vulnerabilities, enforce best practices, and protect your MCP infrastructure. Scans against the **OWASP MCP Top 10** security risks and known CVE patterns.

## Quick Start

```bash
npx @seenasingh30/guardianmcp scan .
```

### Or install globally

```bash
npm install -g @seenasingh30/guardianmcp
guardianmcp scan ./my-mcp-server
```

## Example Output

```
$ guardianmcp scan .

guardianmcp v0.1.0 — scanning .

  CRITICAL   [MCP-001] Hardcoded Secrets
             File: src/config.ts:12
             Code: const API_KEY = "sk-proj-abc123..."
             Fix:  Move to environment variable. Rotate immediately.

  HIGH       [MCP-003] Command Injection
             File: src/tools/exec.ts:28
             Code: exec(`git log --author=${req.body.author}`)
             Fix:  Use execFile() with an args array instead of exec().

  Results: 2 critical, 1 high, 0 medium, 0 low
  Files scanned: 18  |  Rules checked: 10  |  Score: 65/100
```

## Security Rules

| ID | Rule | Severity | What it detects |
|----|------|----------|-----------------|
| MCP-001 | Hardcoded Secrets | **CRITICAL** | API keys, passwords, tokens, AWS credentials committed in code |
| MCP-002 | Missing Authentication | **HIGH** | MCP tool endpoints exposed without auth middleware |
| MCP-003 | Command Injection | **CRITICAL** | `exec()` / `execSync()` with unsanitized user input |
| MCP-004 | Path Traversal | **HIGH** | File operations with user-controlled paths without validation |
| MCP-005 | SSRF | **HIGH** | HTTP requests to user-controlled URLs |
| MCP-006 | SQL Injection | **HIGH** | Template literals and string concatenation in SQL queries |
| MCP-007 | OAuth Injection | **CRITICAL** | Authorization endpoints passed to `exec()`/`open()` without validation |
| MCP-008 | Tool Poisoning | **MEDIUM** | Prompt injection phrases in MCP tool descriptions |
| MCP-009 | Network Binding | **MEDIUM** | Servers binding to `0.0.0.0` instead of `127.0.0.1` |
| MCP-010 | Supply Chain | **LOW-CRITICAL** | Vulnerable dependency versions (e.g., `mcp-remote` < 1.0.5) |

## Supported Languages

| Language | Extensions |
|----------|-----------|
| TypeScript | `.ts` |
| JavaScript | `.js` |
| Python | `.py` |
| Go | `.go` |
| Java | `.java` |
| Ruby | `.rb` |
| Config files | `.json` `.yaml` `.yml` `.env` `.toml` `.ini` `.conf` |

## CLI Usage

```bash
# Scan current directory
guardianmcp scan .

# JSON output
guardianmcp scan ./src --format json

# HTML report
guardianmcp scan . --format html --output report.html

# Only critical and high findings
guardianmcp scan . --severity high

# Specific rules only
guardianmcp scan . --rules MCP-001,MCP-003,MCP-006

# Fail CI if critical findings exist
guardianmcp scan . --severity critical --exit-code

# Upload results to dashboard
guardianmcp scan . --api-key gmcp_live_xxx --server-id your-server-uuid
```

## CI/CD Integration

```yaml
# .github/workflows/security.yml
name: MCP Security Scan

on: [push, pull_request]

jobs:
  scan:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - run: npx @seenasingh30/guardianmcp scan . --severity high --exit-code
```

## How It Works

This NPM package is a thin wrapper that downloads the pre-built Go binary for your platform from [GitHub Releases](https://github.com/GuardianMCP/GuardianMCP/releases) on first run. Subsequent runs use the cached binary.

Supported platforms: **Linux** (amd64, arm64), **macOS** (amd64, arm64), **Windows** (amd64).

## Links

- [GitHub Repository](https://github.com/GuardianMCP/GuardianMCP)
- [Security Rules Documentation](https://github.com/GuardianMCP/GuardianMCP#security-rules)
- [Web Dashboard](https://github.com/GuardianMCP/GuardianMCP#web-dashboard)

## License

MIT
