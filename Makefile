# Thin wrappers over npm scripts. Run `make help` for the list.
.PHONY: help install check lint lint-fix arch test e2e build fmt fmt-check dev clean

help: ## Show this help
	@grep -E '^[a-z-]+:.*## ' $(MAKEFILE_LIST) | awk 'BEGIN {FS = ":.*## "}; {printf "  %-10s %s\n", $$1, $$2}'

install: ## Install dependencies from the lockfile
	npm ci

check: lint arch test build ## Lint + architecture guards + tests + build (typecheck is N/A: plain JavaScript)

lint: ## ESLint (read-only); FILE=<path> lints one file (used by the agent-kit post-edit hook)
	$(if $(FILE),npx --no-install eslint --no-warn-ignored $(FILE),npm run lint)

arch: ## Architecture guards: process boundaries (dependency-cruiser) + preload exposes only window.api
	npm run arch

lint-fix: ## ESLint with autofix
	npm run lint:fix

test: ## Unit tests (Vitest, offline)
	npm test --if-present

e2e: ## Playwright E2E smoke on the built app (needs a display, or: xvfb-run -a make e2e)
	npm run test:e2e

build: ## Bundle main, preload and renderer into out/ (no packaging)
	npm run build

fmt: ## Format with Prettier; FILE=<path> formats one file
	$(if $(FILE),npx --no-install prettier --write --ignore-unknown $(FILE),npm run format)

fmt-check: ## Check formatting with Prettier (not yet part of check, see #43)
	npm run format:check

dev: ## Run the launcher in dev mode (needs a display)
	npm run dev

clean: ## Remove build output
	rm -rf out dist test-results playwright-report
