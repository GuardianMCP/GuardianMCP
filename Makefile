.PHONY: dev-deps migrate seed backend frontend cli-build cli-install test-backend test-cli build-all clean

# ─── Local Development ───────────────────────────────────────

dev-deps: ## Start Postgres and Redis via Docker Compose
	docker-compose up -d

dev-deps-down: ## Stop Postgres and Redis
	docker-compose down

# ─── Backend ─────────────────────────────────────────────────

migrate: ## Run TypeORM migrations
	cd backend && npm run migration:run

seed: ## Seed development database
	cd backend && npm run seed

backend: ## Start NestJS in watch mode
	cd backend && npm run start:dev

test-backend: ## Run backend tests
	cd backend && npm run test

test-backend-e2e: ## Run backend e2e tests
	cd backend && npm run test:e2e

# ─── Frontend ────────────────────────────────────────────────

frontend: ## Start Vite dev server
	cd frontend && npm run dev

test-frontend: ## Run frontend tests
	cd frontend && npm run test

# ─── CLI ─────────────────────────────────────────────────────

cli-build: ## Build Go CLI binary for current platform
	cd cli && go build -o guardianmcp .

cli-install: ## Build and install CLI to /usr/local/bin
	cd cli && go build -o guardianmcp . && sudo mv guardianmcp /usr/local/bin/guardianmcp

test-cli: ## Run Go CLI tests
	cd cli && go test ./... -v

test-cli-coverage: ## Run Go CLI tests with coverage
	cd cli && go test ./... -v -coverprofile=coverage.out && go tool cover -html=coverage.out

# ─── Build All ───────────────────────────────────────────────

build-all: cli-build ## Build everything for production
	cd backend && npm run build
	cd frontend && npm run build

# ─── Utilities ───────────────────────────────────────────────

clean: ## Clean build artifacts
	rm -f cli/guardianmcp
	rm -rf backend/dist
	rm -rf frontend/dist

help: ## Show this help
	@grep -E '^[a-zA-Z_-]+:.*?## .*$$' $(MAKEFILE_LIST) | sort | awk 'BEGIN {FS = ":.*?## "}; {printf "\033[36m%-20s\033[0m %s\n", $$1, $$2}'

.DEFAULT_GOAL := help
