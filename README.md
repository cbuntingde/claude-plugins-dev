# Claude Plugins Development Repository

A comprehensive collection of 58 Claude Code plugins for development workflows, covering API development, security, testing, code quality, and more.

> **Status:** Development repository. Plugins are actively developed and tested. Production-ready plugins are promoted to the main marketplace repository.

---

## Quick Start

### Installation via Marketplace

1. Open Claude Code
2. Navigate to `/plugins`
3. Select **Marketplace**
4. Click **Add new** and enter:
   ```
   https://github.com/cbuntingde/claude-plugins-dev
   ```

### Manual Installation

```bash
git clone https://github.com/cbuntingde/claude-plugins-dev.git
cd claude-plugins-dev
```

---

## Plugin Catalog

| Plugin | Description | Category |
|--------|-------------|----------|
| [**api-doc-generator-plugin**](plugins/api-doc-generator-plugin/) | Generate API documentation from source code and OpenAPI specifications | API Development |
| [**api-integration-generator**](plugins/api-integration-generator/) | Generate fully-typed, error-handled API client code from OpenAPI specs | API Development |
| [**api-security-hardening**](plugins/api-security-hardening/) | API security hardening with CORS, CSRF, XSS protection, JWT flows | Security |
| [**openapi-generator**](plugins/openapi-generator/) | Generate OpenAPI/Swagger specifications from code across frameworks | API Development |
| [**architecture-advisor**](plugins/architecture-advisor/) | Architecture advisor for design patterns and improvement suggestions | Code Quality |
| [**architecture-gatekeeper**](plugins/architecture-gatekeeper/) | Prevent commits violating architecture patterns or circular dependencies | Code Quality |
| [**aria-improver**](plugins/aria-improver/) | Suggest ARIA labels and semantic HTML improvements for accessibility | Accessibility |
| [**audit-trail-logger**](plugins/audit-trail-logger/) | Comprehensive audit trail logging for compliance reporting | Compliance |
| [**auto-doc-updater**](plugins/auto-doc-updater-plugin/) | Automatically detect code changes and suggest documentation updates | Documentation |
| [**auto-quality-gates**](plugins/auto-quality-gates/) | Automated testing and quality gates configuration for CI/CD | CI/CD |
| [**bug-catcher-plugin**](plugins/bug-catcher-plugin/) | Capture tool failures and display collected bugs in formatted tables | Debugging |
| [**bundle-size-analyzer**](plugins/bundle-size-analyzer/) | Analyze bundle sizes and identify tree-shaking opportunities | Performance |
| [**claude-code-api-doc-plugin**](plugins/claude-code-api-doc-plugin/) | Generate static API documentation sites and interactive explorers | Documentation |
| [**claude-code-circular-deps-plugin**](plugins/claude-code-circular-deps-plugin/) | Detect circular dependencies and suggest fixes | Code Quality |
| [**claude-crud-generator**](plugins/claude-crud-generator/) | Generate CRUD operations from database schemas | Database |
| [**claude-md-hook**](plugins/claude-md-hook/) | Automatically include CLAUDE.md project rules with every prompt | Workflow |
| [**claude-migration-generator**](plugins/claude-migration-generator/) | Generate database migrations from schema descriptions | Database |
| [**code-complexity-analyzer**](plugins/code-complexity-analyzer/) | Analyze code complexity and provide refactoring suggestions | Code Quality |
| [**code-migration-assistant**](plugins/code-migration-assistant/) | Intelligent code migration for framework upgrades and language translation | Migration |
| [**compliance-assistant-plugin**](plugins/compliance-assistant-plugin/) | Comprehensive compliance scanner for GDPR, HIPAA, SOC2 violations | Compliance |
| [**cross-repo-knowledge-navigator**](plugins/cross-repo-knowledge-navigator/) | Search across repos, Slack, Jira, and Confluence for answers | Knowledge |
| [**dead-code-hunter**](plugins/dead-code-hunter/) | Find truly unused code and zombie config with safe removal | Code Quality |
| [**dependency-safety-scanner**](plugins/dependency-safety-scanner/) | Check package acquisitions, maintainer abandonment, dependency bloat | Security |
| [**diagram-generator-plugin**](plugins/diagram-generator-plugin/) | Generate architectural diagrams (Mermaid, PlantUML, DOT) from code | Documentation |
| [**doc-onboarding-plugin**](plugins/doc-onboarding-plugin/) | Generate onboarding documentation and developer guides | Documentation |
| [**env-generator-plugin**](plugins/env-generator-plugin/) | Automatically generate .env files from environment variable usage | Configuration |
| [**env-var-detect**](plugins/env-var-detect/) | Automatically detect missing environment variables in your codebase | Configuration |
| [**error-explainer**](plugins/error-explainer/) | Provide context and solutions for cryptic error messages | Debugging |
| [**gdpr-privacy-scanner**](plugins/gdpr-privacy-scanner/) | GDPR/Privacy compliance scanner with PII detection and consent management | Compliance |
| [**hook-test-plugin**](plugins/hook-test-plugin/) | Test plugin to verify hooks are working | Development |
| [**intelligent-refactoring-assistant**](plugins/intelligent-refactoring-assistant/) | Safe, context-aware refactoring tools for modernizing legacy code | Code Quality |
| [**memory-leak-detector-plugin**](plugins/memory-leak-detector-plugin/) | Detect memory leaks and provide remediation suggestions | Performance |
| [**mock-api-server**](plugins/mock-api-server/) | Mock API servers for testing | Testing |
| [**multi-agent-orchestrator**](plugins/multi-agent-orchestrator/) | Orchestrate multiple AI agents for complex development tasks | Workflow |
| [**optimization-suggester**](plugins/optimization-suggester/) | Suggest code optimizations for caching, memoization, and async patterns | Performance |
| [**orm-sql-converter**](plugins/orm-sql-converter/) | Convert between ORM queries and raw SQL across frameworks | Database |
| [**performance-profiler**](plugins/performance-profiler/) | Intelligent performance profiler identifying bottlenecks and optimizations | Performance |
| [**pr-review-enforcer**](plugins/pr-review-enforcer/) | Comprehensive PR review enforcement for descriptions, tests, docs | Code Quality |
| [**production-debugging-assistant**](plugins/production-debugging-assistant/) | Correlate errors across logs, metrics, and traces during incidents | Debugging |
| [**review-squad-coordinator**](plugins/review-squad-coordinator/) | Coordinate multiple specialized agents for comprehensive code reviews | Code Quality |
| [**secrets-detection-hook**](plugins/secrets-detection-hook/) | Detect and block commands/files containing API keys, passwords, or PII | Security |
| [**security-scanner-plugin**](plugins/security-scanner-plugin/) | Detect OWASP Top 10 vulnerabilities and security issues | Security |
| [**semantic-code-search**](plugins/semantic-code-search/) | Context-aware semantic code search plugin | Search |
| [**sql-query-optimizer**](plugins/sql-query-optimizer/) | Analyze, refactor, and optimize complex SQL queries | Database |
| [**style-guide-enforcer**](plugins/style-guide-enforcer/) | Maintain consistency with team conventions | Code Quality |
| [**style-guide-plugin**](plugins/style-guide-plugin/) | Get programming style guides and best practices for any language | Code Quality |
| [**tech-debt-tracker**](plugins/tech-debt-tracker/) | Identify and prioritize technical debt needing refactoring | Code Quality |
| [**testing-assistant-plugin**](plugins/testing-assistant-plugin/) | Find edge cases, generate tests, and improve test coverage | Testing |
| [**ticket-sync-hook**](plugins/ticket-sync-hook/) | Automatically update Jira/Linear tickets based on git commit activity | Workflow |
| [**qa-assistant**](plugins/qa-assistant/) | Comprehensive quality assurance and production readiness checks | QA |
| [**wcag-scanner-plugin**](plugins/wcag-scanner-plugin/) | Scan for WCAG 2.2 compliance issues in HTML, CSS, and frameworks | Accessibility |

---

## Plugin Categories

### API Development
Tools for API design, documentation generation, client code generation, and specification creation.

### Code Quality
Architecture review, pattern enforcement, complexity analysis, refactoring assistance, and style guide enforcement.

### Security & Compliance
Vulnerability scanning, secrets detection, compliance checking (GDPR, HIPAA, SOC2), and API security hardening.

### Testing & Debugging
Test generation, edge case detection, mock API servers, bug catching, and production debugging assistance.

### Performance
Bundle analysis, memory leak detection, SQL optimization, performance profiling, and optimization suggestions.

### Database
CRUD generation, migration creation, ORM/SQL conversion, and query optimization.

### Documentation
Auto-generated docs, onboarding guides, API documentation sites, and diagram generation.

### CI/CD & DevOps
Pipeline generation, quality gates, deployment strategies, and workflow automation.

### QA & Testing
Quality assurance workflows, production readiness checks, and comprehensive testing support.

### Accessibility
ARIA improvements, WCAG 2.2 scanning, and semantic HTML suggestions.

---

## Usage

After installation, plugins integrate with Claude Code's command interface. Each plugin provides specialized commands accessible through natural language prompts.

### Example Commands

```bash
# API Development
"Generate an OpenAPI spec for my Express API"
"Validate my API design against REST best practices"

# Code Quality
"Review my architecture for design patterns"
"Find circular dependencies in my codebase"

# Security
"Scan my code for OWASP Top 10 vulnerabilities"
"Check for exposed secrets in my commits"

# Testing
"Find edge cases I haven't tested"
"Generate unit tests for this function"
```

---

## Repository Structure

```
claude-plugins-dev/
├── plugins/                    # Individual plugin directories
│   ├── plugin-name/
│   │   ├── .claude-plugin/     # Plugin metadata
│   │   ├── commands/           # Command documentation
│   │   ├── scripts/            # Implementation scripts
│   │   ├── hooks/              # Hook configurations
│   │   ├── index.js/ts         # Entry point
│   │   ├── package.json        # Plugin metadata
│   │   └── README.md           # Plugin documentation
├── .claude/                    # Repository configuration
├── shared-utils/               # Shared utilities
└── README.md                   # This file
```

---

## Contributing

This is a development repository for experimental and work-in-progress plugins. Plugins are thoroughly tested before being promoted to production repositories.

## License

MIT License - see [LICENSE](LICENSE) for details.

---

**Author:** [Chris Bunting](https://github.com/cbuntingde)
