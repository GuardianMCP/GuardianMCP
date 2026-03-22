<p align="center">
  <img src="https://img.shields.io/badge/Go-1.24-00ADD8?logo=go&logoColor=white" alt="Go">
  <img src="https://img.shields.io/badge/NestJS-10-E0234E?logo=nestjs&logoColor=white" alt="NestJS">
  <img src="https://img.shields.io/badge/React-19-61DAFB?logo=react&logoColor=black" alt="React">
  <img src="https://img.shields.io/badge/TypeScript-5.9-3178C6?logo=typescript&logoColor=white" alt="TypeScript">
  <img src="https://img.shields.io/badge/PostgreSQL-15-4169E1?logo=postgresql&logoColor=white" alt="PostgreSQL">
  <img src="https://img.shields.io/badge/Redis-7-DC382D?logo=redis&logoColor=white" alt="Redis">
  <img src="https://img.shields.io/badge/License-MIT-green" alt="License">
</p>

<h1 align="center">GuardianMCP</h1>

<p align="center">
  <strong>Security scanner for Model Context Protocol (MCP) servers</strong><br>
  Detect vulnerabilities, enforce best practices, and protect your MCP infrastructure.
</p>

<p align="center">
  <a href="#quick-start">Quick Start</a> &bull;
  <a href="#security-rules">Security Rules</a> &bull;
  <a href="#cli-reference">CLI Reference</a> &bull;
  <a href="#web-dashboard">Web Dashboard</a> &bull;
  <a href="#api-reference">API Reference</a> &bull;
  <a href="#contributing">Contributing</a>
</p>

---

## What is GuardianMCP?

GuardianMCP is an open-source security scanner purpose-built for the **Model Context Protocol (MCP)** ecosystem. It scans MCP server codebases against the **OWASP MCP Top 10** security risks and known CVE patterns.

It ships as three components:

| Component | Description |
|-----------|-------------|
| **`guardianmcp` CLI** | A fast Go binary you run locally or in CI to scan code and produce reports |
| **Backend API** | NestJS REST API with BullMQ job queue for remote scanning, SSE streaming, and data persistence |
| **Web Dashboard** | React SPA for teams to manage servers, trigger remote scans, track findings, and monitor security posture |

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

---

## Quick Start

### Scan with the CLI (no install needed)

```bash
npx @guardianmcp/cli scan .
```

### Or install globally

```bash
npm install -g @guardianmcp/cli
guardianmcp scan ./my-mcp-server
```

### Or build from source

```bash
git clone https://github.com/guardianmcp/guardianmcp.git
cd guardianmcp/cli
go build -o guardianmcp .
./guardianmcp scan ./path-to-mcp-server
```

---

## Security Rules

GuardianMCP checks your MCP server code against **10 security rules** aligned with the OWASP MCP Top 10:

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

### Supported Languages

| Language | Extensions | Rule Coverage |
|----------|-----------|---------------|
| TypeScript | `.ts` | All 10 rules |
| JavaScript | `.js` | All 10 rules |
| Python | `.py` | MCP-001, MCP-003, MCP-009 |
| Go | `.go` | MCP-001, MCP-002, MCP-003, MCP-004, MCP-005, MCP-009 |
| Java | `.java` | MCP-001, MCP-003 |
| Ruby | `.rb` | MCP-001, MCP-003 |
| Config files | `.json` `.yaml` `.yml` `.env` `.toml` `.ini` `.conf` | MCP-001, MCP-008, MCP-009, MCP-010 |

### Security Score

The security score is calculated on a 100-point scale with capped penalties per severity:

| Severity | Penalty per finding | Cap |
|----------|-------------------|-----|
| Critical | -25 | -50 |
| High | -10 | -30 |
| Medium | -3 | -15 |
| Low | -1 | -5 |

**Score = 100 - total penalties** (minimum 0)

| Range | Rating |
|-------|--------|
| 80-100 | Excellent |
| 60-79 | Good |
| 40-59 | Needs Work |
| 0-39 | Critical |

---

## CLI Reference

### `guardianmcp scan [path]`

Scan a directory or file for security vulnerabilities.

```bash
# Scan current directory
guardianmcp scan .

# Scan with JSON output
guardianmcp scan ./src --format json

# Generate an HTML report
guardianmcp scan . --format html --output report.html

# Only show critical and high findings
guardianmcp scan . --severity high

# Run specific rules only
guardianmcp scan . --rules MCP-001,MCP-003,MCP-006

# Fail CI if critical findings exist
guardianmcp scan . --severity critical --exit-code

# Upload results to dashboard
guardianmcp scan . --api-key gmcp_live_xxx --server-id your-server-uuid
```

**Flags:**

| Flag | Default | Description |
|------|---------|-------------|
| `--format` | `terminal` | Output format: `terminal`, `json`, `html` |
| `--output` | — | File path for report output |
| `--severity` | `info` | Minimum severity: `info`, `low`, `medium`, `high`, `critical` |
| `--rules` | `all` | Comma-separated rule IDs or `all` |
| `--ignore` | — | Comma-separated glob patterns to ignore |
| `--exit-code` | `false` | Exit with code 1 if findings exceed severity threshold |
| `--api-key` | — | Dashboard API key for uploading results |
| `--server-id` | — | Server ID in the dashboard |
| `--config` | `.guardianmcp.yml` | Path to config file |
| `--no-color` | `false` | Disable colored output |
| `--quiet` | `false` | Suppress all output except errors |

### `guardianmcp init`

Generate a `.guardianmcp.yml` config file with defaults.

### `guardianmcp version`

Print the CLI version.

### Configuration File

```yaml
# .guardianmcp.yml
min-severity: LOW

ignore:
  - "node_modules/**"
  - "vendor/**"
  - "dist/**"
  - "**/*.test.*"

disable-rules: []

format: terminal

# Dashboard integration (optional)
# api-url: https://app.guardianmcp.dev
# api-key: gmcp_live_xxxxx
# server-id: your-server-uuid
```

### CI/CD Integration

```yaml
# .github/workflows/security.yml
name: MCP Security Scan

on: [push, pull_request]

jobs:
  scan:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - run: npx @guardianmcp/cli scan . --severity high --exit-code
```

---

## Web Dashboard

The dashboard provides a team-oriented UI for managing MCP server security across your organization.

### Features

| Feature | Description |
|---------|-------------|
| **Dashboard** | Security posture overview with score trends, severity breakdown charts, and top risks |
| **Servers** | Register MCP servers with GitHub repository URLs, view security scores |
| **Remote Scanning** | Scan GitHub repos directly from the dashboard — select branch, trigger scan, watch real-time progress via SSE |
| **Scans** | Full scan history with branch, trigger source (CLI/Dashboard), duration, and score |
| **Findings** | Filterable table with severity, status, code snippets, remediation, and OWASP references |
| **Alerts** | Configurable rules for email and Slack notifications on new findings |
| **Reports** | Downloadable HTML security reports |
| **Settings** | Team management, API keys, billing, and organization settings |

### How Scanning Works

GuardianMCP supports two scanning modes:

**1. CLI Scan (Local)**
```bash
guardianmcp scan ./my-mcp-server --api-key gmcp_live_xxx --server-id <uuid>
```
Run the CLI locally or in CI. Results are uploaded to the dashboard via the `/cli/upload` endpoint.

**2. Remote Scan (Dashboard)**

From the server detail page:
1. Select a branch from the dropdown (fetched from GitHub API)
2. Click **Scan Now**
3. The backend queues a BullMQ job that:
   - Clones the repo (`git clone --depth 1 --branch <branch>`)
   - Runs the CLI scanner (`guardianmcp scan <dir> --format json`)
   - Parses results and saves findings to the database
   - Streams real-time progress via Server-Sent Events (SSE)
4. Watch the live progress panel with step indicators and finding count

### Tech Stack

| Layer | Technology |
|-------|-----------|
| **CLI** | Go 1.24, Cobra, Lipgloss |
| **Backend** | NestJS 10, TypeORM, PostgreSQL 15, Redis 7, BullMQ |
| **Frontend** | React 19, TypeScript, Vite 5, Tailwind CSS, Zustand, React Query, Recharts |
| **Auth** | JWT (access + refresh) with Redis blacklist, API key auth |
| **Queue** | BullMQ with Redis — async scan job processing with SSE streaming |
| **Infra** | Docker, GitHub Actions CI/CD |

---

## Running Locally

### Prerequisites

- **Node.js** >= 20
- **Go** >= 1.22
- **PostgreSQL** 15+
- **Redis** 7+

### 1. Clone and install

```bash
git clone https://github.com/guardianmcp/guardianmcp.git
cd guardianmcp
```

### 2. Start dependencies

If using Docker:
```bash
docker-compose up -d
```

Or use locally installed Postgres and Redis.

### 3. Set up the backend

```bash
cd backend
cp .env.example .env
# Edit .env with your database credentials
npm install
npm run start:dev
```

The API starts at `http://localhost:3001/api/v1`.

### 4. Start the frontend

```bash
cd frontend
npm install
npm run dev
```

The app opens at `http://localhost:5173`.

### 5. Build the CLI

```bash
cd cli
go build -o guardianmcp .
./guardianmcp scan ./path-to-mcp-server
```

### Makefile shortcuts

```bash
make dev-deps        # Start Postgres + Redis (Docker)
make backend         # Start NestJS in watch mode
make frontend        # Start Vite dev server
make cli-build       # Build CLI binary
make test-cli        # Run Go tests
make test-backend    # Run backend tests
make build-all       # Production build everything
```

---

## API Reference

All endpoints are prefixed with `/api/v1`. Authentication is via `Authorization: Bearer <jwt>` or `X-API-Key` header.

### Auth

| Method | Endpoint | Description |
|--------|----------|-------------|
| `POST` | `/auth/register` | Create account + organization |
| `POST` | `/auth/login` | Get access + refresh tokens |
| `POST` | `/auth/refresh` | Rotate refresh token |
| `POST` | `/auth/logout` | Blacklist refresh token |

### Servers

| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/servers` | List servers (paginated) |
| `POST` | `/servers` | Create a server |
| `GET` | `/servers/:id` | Get server details |
| `PATCH` | `/servers/:id` | Update server |
| `DELETE` | `/servers/:id` | Soft-delete server |
| `GET` | `/servers/:id/branches` | List GitHub branches for a server |
| `POST` | `/servers/:id/scans` | Trigger a remote scan (accepts `{ branch }`) |

### Scans & Findings

| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/scans` | List scans (filterable by serverId, status) |
| `GET` | `/scans/:id` | Scan details with findings |
| `GET` | `/scans/:id/stream` | SSE real-time scan progress |
| `GET` | `/findings` | List findings (filterable by severity, status, server) |
| `PATCH` | `/findings/:id` | Update finding status |
| `POST` | `/findings/bulk` | Bulk update findings |

### CLI Upload

| Method | Endpoint | Description |
|--------|----------|-------------|
| `POST` | `/cli/upload` | Upload scan results from CLI |

### Other

| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/health` | Health check |
| `POST` | `/alerts` | Create alert rule |
| `POST` | `/billing/checkout` | Start Stripe checkout |
| `POST` | `/reports/:scanId/generate` | Generate HTML report |

---

## Project Structure

```
guardianmcp/
├── cli/                           # Go CLI binary
│   ├── cmd/                       # Cobra commands (scan, init, version)
│   ├── internal/
│   │   ├── scanner/               # File walker + rule engine
│   │   │   └── rules/            # 10 OWASP MCP security rules
│   │   ├── reporter/              # Terminal, JSON, HTML output
│   │   ├── config/                # .guardianmcp.yml parser
│   │   └── uploader/              # Dashboard API client
│   └── templates/                 # HTML report template
├── backend/                       # NestJS API
│   └── src/
│       ├── auth/                  # JWT + API key authentication
│       ├── users/                 # User management
│       ├── organizations/         # Org + team + API keys
│       ├── servers/               # MCP server registry + GitHub branches
│       ├── scans/                 # Scan CRUD + SSE streaming
│       ├── queue/                 # BullMQ scan job processor
│       ├── findings/              # Vulnerability findings
│       ├── cli/                   # CLI upload endpoint
│       ├── alerts/                # Alert rules + notifications
│       ├── billing/               # Stripe integration
│       ├── reports/               # HTML report generation
│       └── common/                # Shared entities, DTOs, enums, utils
├── frontend/                      # React SPA
│   └── src/
│       ├── pages/                 # Page components (auth, dashboard, servers, scans, etc.)
│       ├── components/            # Layout, charts, BranchSelector, ScanProgressPanel
│       ├── hooks/                 # React Query hooks (useServers, useScans, useBranches, useScanSSE)
│       ├── stores/                # Zustand (auth, UI)
│       ├── lib/                   # Axios client, utils, constants
│       └── types/                 # TypeScript interfaces
├── guardianmcp-npm/               # NPM wrapper for npx support
├── docker-compose.yml             # Local dev (Postgres + Redis)
├── docker-compose.prod.yml        # Production compose
├── Makefile                       # Dev shortcuts
└── .github/workflows/             # CI + Release pipelines
```

---

## Contributing

Contributions are welcome! Here's how to get started:

1. **Fork** the repository
2. **Create a branch** for your feature (`git checkout -b feat/my-feature`)
3. **Make your changes** and add tests
4. **Run the tests**:
   ```bash
   cd cli && go test ./...          # CLI tests
   cd backend && npx tsc --noEmit   # Backend type check
   cd frontend && npm run build     # Frontend build
   ```
5. **Submit a pull request**

### Adding a new security rule

1. Create `cli/internal/scanner/rules/your_rule.go` implementing the `Rule` interface
2. Create `cli/internal/scanner/rules/your_rule_test.go` with table-driven tests
3. Register it in `cli/internal/scanner/rules/registry.go`

---

## License

MIT License. See [LICENSE](LICENSE) for details.

---

<p align="center">
  <strong>GuardianMCP</strong> — Securing the MCP ecosystem, one scan at a time.
</p>
