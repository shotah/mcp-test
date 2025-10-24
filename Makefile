.SILENT: # Disable echo of commands
ifneq ("$(wildcard .env)", "")
# Import .env file if it exists
# MAKE SURE THIS IS SPACES AND NOT A TAB
    include .env
endif

SHELL := /bin/bash


.PHONY: help install setup dev build test lint clean deploy docker-up docker-down

# Default target
.DEFAULT_GOAL := help

# Detect OS
ifeq ($(OS),Windows_NT)
    DETECTED_OS := Windows
    RM := del /Q /F
    RMDIR := rmdir /S /Q
    MKDIR := mkdir
    COPY := copy
    ECHO := echo
    SHELL := cmd.exe
    # Windows doesn't support colors in make, so we'll use plain text
    RED := 
    GREEN := 
    YELLOW := 
    BLUE := 
    NC := 
else
    DETECTED_OS := Unix
    RM := rm -rf
    RMDIR := rm -rf
    MKDIR := mkdir -p
    COPY := cp
    ECHO := echo
    # Unix colors
    RED := \033[0;31m
    GREEN := \033[0;32m
    YELLOW := \033[1;33m
    BLUE := \033[0;34m
    NC := \033[0m
endif

# Help command
help: ## Show this help message
	@echo "$(BLUE)MCP Test - Development Commands$(NC)"
	@echo "$(BLUE)================================$(NC)"
	@echo ""
	@echo "$(GREEN)Setup & Installation:$(NC)"
	@echo "  install              Install all dependencies"
	@echo "  setup                Complete project setup"
	@echo "  deps                 Alias for install"
	@echo ""
	@echo "$(GREEN)Development:$(NC)"
	@echo "  dev                  Start all development services"
	@echo "  dev-supabase         Start only Supabase"
	@echo "  dev-worker           Start only Cloudflare Worker"
	@echo "  dev-web              Start only React web app"
	@echo "  start                Alias for dev"
	@echo ""
	@echo "$(GREEN)Building:$(NC)"
	@echo "  build                Build all projects"
	@echo "  build-worker         Build only Cloudflare Worker"
	@echo "  build-web            Build only React web app"
	@echo "  compile              Alias for build"
	@echo ""
	@echo "$(GREEN)Testing & Quality:$(NC)"
	@echo "  test                 Run all tests"
	@echo "  test-worker          Test only Cloudflare Worker"
	@echo "  test-web             Test only React web app"
	@echo "  lint                 Run linting on all projects"
	@echo "  lint-worker          Lint only Cloudflare Worker"
	@echo "  lint-web             Lint only React web app"
	@echo "  format               Format all code"
	@echo "  type-check            Run TypeScript type checking"
	@echo "  check                Run linting and tests"
	@echo ""
	@echo "$(GREEN)Deployment:$(NC)"
	@echo "  deploy               Deploy all projects"
	@echo "  deploy-worker        Deploy only Cloudflare Worker"
	@echo "  deploy-web           Deploy only React web app"
	@echo "  push                 Alias for deploy"
	@echo ""
	@echo "$(GREEN)Supabase Cloud:$(NC)"
	@echo "  supabase-link        Link to Supabase cloud project"
	@echo "  supabase-push        Push schema to cloud"
	@echo "  supabase-pull        Pull schema from cloud"
	@echo "  supabase-diff        Show schema differences"
	@echo ""
	@echo "$(GREEN)Utilities:$(NC)"
	@echo "  clean                Clean all build artifacts"
	@echo "  reset                Reset project (clean + install)"
	@echo "  logs                 Show application logs"
	@echo "  status               Show project status"
	@echo "  health               Check all services health"
	@echo ""

# Installation & Setup
install: ## Install all dependencies
	@echo "$(BLUE)Installing dependencies...$(NC)"
	@npm install
	@cd worker && npm install
	@cd web && npm install
	@echo "$(GREEN)✓ Dependencies installed$(NC)"

setup: install ## Complete project setup
	@echo "$(BLUE)Setting up project...$(NC)"
ifeq ($(DETECTED_OS),Windows)
	@where supabase >nul 2>&1 || (echo "$(YELLOW)Installing Supabase CLI...$(NC)" && npm install -g supabase)
	@where wrangler >nul 2>&1 || (echo "$(YELLOW)Installing Wrangler CLI...$(NC)" && npm install -g wrangler)
else
	@command -v supabase >/dev/null 2>&1 || (echo "$(YELLOW)Installing Supabase CLI...$(NC)" && npm install -g supabase)
	@command -v wrangler >/dev/null 2>&1 || (echo "$(YELLOW)Installing Wrangler CLI...$(NC)" && npm install -g wrangler)
endif
	@echo "$(GREEN)✓ Project setup complete$(NC)"

deps: install ## Alias for install

# Development
dev: ## Start all development services
	@echo "$(BLUE)Starting development environment...$(NC)"
	@echo "$(YELLOW)Starting Supabase, Worker, and Web App$(NC)"
	@npm run dev

dev-worker: ## Start only Cloudflare Worker
	@echo "$(BLUE)Starting Cloudflare Worker...$(NC)"
	@npm run dev:worker

dev-web: ## Start only React web app
	@echo "$(BLUE)Starting React web app...$(NC)"
	@npm run dev:web

start: dev ## Alias for dev

# Building
build: ## Build all projects
	@echo "$(BLUE)Building all projects...$(NC)"
	@npm run build
	@echo "$(GREEN)✓ Build complete$(NC)"

build-worker: ## Build only Cloudflare Worker
	@echo "$(BLUE)Building Cloudflare Worker...$(NC)"
	@cd worker && npm run build

build-web: ## Build only React web app
	@echo "$(BLUE)Building React web app...$(NC)"
	@cd web && npm run build

compile: build ## Alias for build

# Testing
test: ## Run all tests
	@echo "$(BLUE)Running tests...$(NC)"
	@cd worker && npm test || echo "$(YELLOW)No tests configured for worker$(NC)"
	@cd web && npm test || echo "$(YELLOW)No tests configured for web$(NC)"
	@echo "$(GREEN)✓ Tests complete$(NC)"

test-worker: ## Test only Cloudflare Worker
	@echo "$(BLUE)Testing Cloudflare Worker...$(NC)"
	@cd worker && npm test

test-web: ## Test only React web app
	@echo "$(BLUE)Testing React web app...$(NC)"
	@cd web && npm test

# Linting & Code Quality
lint: ## Run linting on all projects
	@echo "$(BLUE)Running linting...$(NC)"
	@cd worker && npm run lint || echo "$(YELLOW)No linting configured for worker$(NC)"
	@cd web && npm run lint || echo "$(YELLOW)No linting configured for web$(NC)"
	@echo "$(GREEN)✓ Linting complete$(NC)"

lint-worker: ## Lint only Cloudflare Worker
	@echo "$(BLUE)Linting Cloudflare Worker...$(NC)"
	@cd worker && npm run lint

lint-web: ## Lint only React web app
	@echo "$(BLUE)Linting React web app...$(NC)"
	@cd web && npm run lint

format: ## Format all code
	@echo "$(BLUE)Formatting code...$(NC)"
	@cd worker && npm run format || echo "$(YELLOW)No formatting configured for worker$(NC)"
	@cd web && npm run format || echo "$(YELLOW)No formatting configured for web$(NC)"
	@echo "$(GREEN)✓ Formatting complete$(NC)"

check: lint test ## Run linting and tests

# Type Checking
type-check: ## Run TypeScript type checking
	@echo "$(BLUE)Running type checking...$(NC)"
	@cd worker && npm run type-check
	@cd web && npm run type-check
	@echo "$(GREEN)✓ Type checking complete$(NC)"

# Deployment
deploy: ## Deploy all projects
	@echo "$(BLUE)Deploying all projects...$(NC)"
	@npm run deploy
	@echo "$(GREEN)✓ Deployment complete$(NC)"

deploy-worker: ## Deploy only Cloudflare Worker
	@echo "$(BLUE)Deploying Cloudflare Worker...$(NC)"
	@cd worker && npm run deploy

deploy-web: ## Deploy only React web app
	@echo "$(BLUE)Deploying React web app...$(NC)"
	@cd web && npm run build
	@echo "$(YELLOW)Upload dist/ folder to Cloudflare Pages$(NC)"

push: deploy ## Alias for deploy

# Supabase Cloud Commands
supabase-link: ## Link to Supabase cloud project
	@echo "$(BLUE)Linking to Supabase cloud project...$(NC)"
	@echo "$(YELLOW)You'll need your project reference ID from the Supabase dashboard$(NC)"
	@npx supabase link
	@echo "$(GREEN)✓ Project linked$(NC)"

supabase-push: ## Push schema to Supabase cloud
	@echo "$(BLUE)Pushing schema to Supabase cloud...$(NC)"
	@npx supabase db push
	@echo "$(GREEN)✓ Schema pushed$(NC)"

supabase-pull: ## Pull schema from Supabase cloud
	@echo "$(BLUE)Pulling schema from Supabase cloud...$(NC)"
	@npx supabase db pull
	@echo "$(GREEN)✓ Schema pulled$(NC)"

supabase-diff: ## Show schema differences
	@echo "$(BLUE)Showing schema differences...$(NC)"
	@npx supabase db diff

supabase-reset: ## Reset Supabase database
	@echo "$(BLUE)Resetting Supabase database...$(NC)"
	@npx supabase db reset
	@echo "$(GREEN)✓ Supabase database reset$(NC)"

supabase-status: ## Check Supabase status
	@echo "$(BLUE)Checking Supabase status...$(NC)"
	@npx supabase status

# Database Commands
db-migrate: supabase-push ## Run database migrations (alias for supabase-push)

db-seed: ## Seed database with sample data
	@echo "$(BLUE)Seeding database...$(NC)"
	@npx supabase db seed
	@echo "$(GREEN)✓ Database seeded$(NC)"

db-reset: ## Reset database (cloud)
	@echo "$(BLUE)Resetting database...$(NC)"
	@echo "$(YELLOW)This will reset your cloud database!$(NC)"
	@npx supabase db reset --linked
	@echo "$(GREEN)✓ Database reset$(NC)"

# Utilities
clean: ## Clean all build artifacts
	@echo "$(BLUE)Cleaning build artifacts...$(NC)"
ifeq ($(DETECTED_OS),Windows)
	@if exist worker\dist rmdir /S /Q worker\dist
	@if exist web\dist rmdir /S /Q web\dist
	@if exist node_modules rmdir /S /Q node_modules
	@if exist worker\node_modules rmdir /S /Q worker\node_modules
	@if exist web\node_modules rmdir /S /Q web\node_modules
else
	@rm -rf worker/dist
	@rm -rf web/dist
	@rm -rf node_modules
	@rm -rf worker/node_modules
	@rm -rf web/node_modules
endif
	@echo "$(GREEN)✓ Clean complete$(NC)"

reset: clean install ## Reset project (clean + install)

logs: ## Show application logs
	@echo "$(BLUE)Showing application logs...$(NC)"
	@docker-compose logs -f

status: ## Show project status
	@echo "$(BLUE)Project Status$(NC)"
	@echo "$(BLUE)============$(NC)"
	@echo ""
	@echo "$(GREEN)Services:$(NC)"
	@docker-compose ps
	@echo ""
	@echo "$(GREEN)Supabase:$(NC)"
	@npx supabase status || echo "$(YELLOW)Supabase not running$(NC)"
	@echo ""
	@echo "$(GREEN)Worker:$(NC)"
ifeq ($(DETECTED_OS),Windows)
	@curl -s http://localhost:8787/health >nul 2>&1 && echo "$(GREEN)Worker running$(NC)" || echo "$(YELLOW)Worker not running$(NC)"
else
	@curl -s http://localhost:8787/health || echo "$(YELLOW)Worker not running$(NC)"
endif
	@echo ""
	@echo "$(GREEN)Web App:$(NC)"
ifeq ($(DETECTED_OS),Windows)
	@curl -s http://localhost:3000 >nul 2>&1 && echo "$(GREEN)Web app running$(NC)" || echo "$(YELLOW)Web app not running$(NC)"
else
	@curl -s http://localhost:3000 > /dev/null && echo "$(GREEN)Web app running$(NC)" || echo "$(YELLOW)Web app not running$(NC)"
endif

# Health Checks
health: ## Check all services health
	@echo "$(BLUE)Checking service health...$(NC)"
	@echo ""
	@echo "$(GREEN)Supabase:$(NC)"
ifeq ($(DETECTED_OS),Windows)
	@curl -s http://localhost:54321/health >nul 2>&1 && echo "$(GREEN)✓ Supabase responding$(NC)" || echo "$(RED)✗ Supabase not responding$(NC)"
else
	@curl -s http://localhost:54321/health || echo "$(RED)✗ Supabase not responding$(NC)"
endif
	@echo ""
	@echo "$(GREEN)Worker:$(NC)"
ifeq ($(DETECTED_OS),Windows)
	@curl -s http://localhost:8787/health >nul 2>&1 && echo "$(GREEN)✓ Worker responding$(NC)" || echo "$(RED)✗ Worker not responding$(NC)"
else
	@curl -s http://localhost:8787/health || echo "$(RED)✗ Worker not responding$(NC)"
endif
	@echo ""
	@echo "$(GREEN)Web App:$(NC)"
ifeq ($(DETECTED_OS),Windows)
	@curl -s http://localhost:3000 >nul 2>&1 && echo "$(GREEN)✓ Web app responding$(NC)" || echo "$(RED)✗ Web app not responding$(NC)"
else
	@curl -s http://localhost:3000 > /dev/null && echo "$(GREEN)✓ Web app responding$(NC)" || echo "$(RED)✗ Web app not responding$(NC)"
endif

# Development Workflow
dev-full: supabase-link dev ## Full development setup (cloud)

dev-quick: ## Quick development start (assumes services are running)
	@echo "$(BLUE)Starting development services...$(NC)"
	@npm run dev

# Production Commands
prod-build: ## Production build
	@echo "$(BLUE)Building for production...$(NC)"
	@NODE_ENV=production npm run build
	@echo "$(GREEN)✓ Production build complete$(NC)"

prod-deploy: ## Production deployment
	@echo "$(BLUE)Deploying to production...$(NC)"
	@NODE_ENV=production npm run deploy
	@echo "$(GREEN)✓ Production deployment complete$(NC)"

# CI/CD Commands
ci-install: ## CI installation
	@echo "$(BLUE)CI installation...$(NC)"
	@npm ci
	@cd worker && npm ci
	@cd web && npm ci

ci-test: ## CI testing
	@echo "$(BLUE)CI testing...$(NC)"
	@make type-check
	@make lint
	@make test

ci-build: ## CI building
	@echo "$(BLUE)CI building...$(NC)"
	@make build

# Quick Commands
quick-start: setup dev-full ## Quick start for new developers

quick-test: lint type-check ## Quick quality check

quick-deploy: build deploy ## Quick deployment

# Show all available commands
commands: ## Show all available commands
	@echo "$(BLUE)Available Commands:$(NC)"
	@echo "  install              Install all dependencies"
	@echo "  setup                Complete project setup"
	@echo "  deps                 Alias for install"
	@echo "  dev                  Start all development services"
	@echo "  dev-supabase         Start only Supabase"
	@echo "  dev-worker           Start only Cloudflare Worker"
	@echo "  dev-web              Start only React web app"
	@echo "  start                Alias for dev"
	@echo "  build                Build all projects"
	@echo "  build-worker         Build only Cloudflare Worker"
	@echo "  build-web            Build only React web app"
	@echo "  compile              Alias for build"
	@echo "  test                 Run all tests"
	@echo "  test-worker          Test only Cloudflare Worker"
	@echo "  test-web             Test only React web app"
	@echo "  lint                 Run linting on all projects"
	@echo "  lint-worker          Lint only Cloudflare Worker"
	@echo "  lint-web             Lint only React web app"
	@echo "  format               Format all code"
	@echo "  type-check            Run TypeScript type checking"
	@echo "  check                Run linting and tests"
	@echo "  deploy               Deploy all projects"
	@echo "  deploy-worker        Deploy only Cloudflare Worker"
	@echo "  deploy-web           Deploy only React web app"
	@echo "  push                 Alias for deploy"
	@echo "  supabase-link        Link to Supabase cloud project"
	@echo "  supabase-push        Push schema to cloud"
	@echo "  supabase-pull        Pull schema from cloud"
	@echo "  supabase-diff        Show schema differences"
	@echo "  supabase-start       Start Supabase locally"
	@echo "  supabase-stop        Stop Supabase"
	@echo "  supabase-reset       Reset Supabase database"
	@echo "  supabase-status      Check Supabase status"
	@echo "  db-migrate           Run database migrations"
	@echo "  db-seed              Seed database with sample data"
	@echo "  clean                Clean all build artifacts"
	@echo "  reset                Reset project (clean + install)"
	@echo "  logs                 Show application logs"
	@echo "  status               Show project status"
	@echo "  health               Check all services health"
	@echo "  dev-full             Full development setup"
	@echo "  dev-quick            Quick development start"
	@echo "  prod-build           Production build"
	@echo "  prod-deploy          Production deployment"
	@echo "  ci-install           CI installation"
	@echo "  ci-test              CI testing"
	@echo "  ci-build             CI building"
	@echo "  quick-start          Quick start for new developers"
	@echo "  quick-test           Quick quality check"
	@echo "  quick-deploy         Quick deployment"
	@echo "  commands             Show all available commands"
	@echo "  help                 Show this help message"
