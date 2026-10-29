# Thin wrappers over npm scripts. Run `make help` for the list.
.PHONY: help install check lint lint-fix test build fmt fmt-check dev clean

help: ## Show this help
	@grep -E '^[a-z-]+:.*## ' $(MAKEFILE_LIST) | awk 'BEGIN {FS = ":.*## "}; {printf "  %-10s %s\n", $$1, $$2}'

install: ## Install dependencies from the lockfile
	npm ci

check: lint test build ## Lint + tests + build (typecheck is N/A: plain JavaScript)

lint: ## ESLint (read-only)
	npm run lint

lint-fix: ## ESLint with autofix
	npm run lint:fix

test: ## Unit tests (Vitest, offline)
	npm test --if-present

build: ## Bundle main, preload and renderer into out/ (no packaging)
	npm run build

fmt: ## Format with Prettier
	npm run format

fmt-check: ## Check formatting with Prettier (not yet part of check, see #43)
	npm run format:check

dev: ## Run the launcher in dev mode (needs a display)
	npm run dev

clean: ## Remove build output
	rm -rf out dist
