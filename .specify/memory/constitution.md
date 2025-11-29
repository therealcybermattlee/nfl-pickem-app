<!--
Sync Impact Report
==================
Version change: 0.0.0 → 1.0.0 (Initial constitution)
Modified principles: N/A (new document)
Added sections:
  - Core Principles (5 principles)
  - Technology Standards
  - Development Workflow
  - Governance
Removed sections: N/A
Templates requiring updates:
  - .specify/templates/plan-template.md ✅ (no updates needed - generic)
  - .specify/templates/spec-template.md ✅ (no updates needed - generic)
  - .specify/templates/tasks-template.md ✅ (no updates needed - generic)
Follow-up TODOs: None
-->

# NFL Pick'em App Constitution

## Core Principles

### I. Production-First Testing (NON-NEGOTIABLE)

All features MUST be validated through end-user testing with Playwright before being declared operational, working, or deployed. Testing requirements:
- Test on production site (https://pickem.cyberlees.dev), NEVER on preview URLs
- Validate complete user journeys, not just API endpoints
- Verify both desktop and mobile experiences
- Document test results before declaring success
- This rule applies to ALL deployments and feature releases

**Rationale**: Preview URLs have different CORS configurations and mislead debugging. Production is the source of truth.

### II. Specialized Agent Delegation

Development tasks MUST be delegated to specialized agents when the task matches an agent's specialty. Available specialists include frontend-developer, backend-architect, ui-ux-designer, typescript-pro, deployment-engineer, code-reviewer, architect-review, api-documenter, and test-automator.

**Rule**: If the task matches an agent's specialty, use the agent immediately. Do not attempt manual work first.

**Rationale**: Specialized agents have focused expertise and solve problems more efficiently than general approaches.

### III. Data Preservation

All production deployments MUST preserve existing database data. Requirements:
- Verify pre-deployment data counts before any deployment
- Verify post-deployment data counts match pre-deployment
- Code-only deployments preferred (no destructive migrations without explicit approval)
- Database changes MUST be additive when possible

**Rationale**: Production data represents real user picks and cannot be recreated.

### IV. Type Safety & Code Quality

All code MUST use TypeScript with strict mode enabled. Requirements:
- No implicit `any` types
- Proper error handling with typed error responses
- Prepared statements for all database queries (SQL injection prevention)
- JWT token validation on protected routes
- Password hashing with bcryptjs

**Rationale**: Type safety prevents runtime errors; security measures protect user data.

### V. Task Transparency

Multi-step or complex tasks MUST use TodoWrite for task tracking. Requirements:
- Break down large tasks into manageable steps
- Track progress transparently for the user
- Mark tasks complete immediately after finishing (no batching)
- Only one task should be in_progress at a time

**Rationale**: Transparent task management ensures completeness and gives users visibility into progress.

## Technology Standards

**Frontend Stack**:
- Vite + React with React Router
- TypeScript with strict mode
- Tailwind CSS for styling
- Mobile-first responsive design

**Backend Stack**:
- Cloudflare Workers with D1 database
- JWT authentication (custom implementation)
- Direct SQL queries (no ORM)
- ESPN API for NFL data integration

**Deployment**:
- Cloudflare Pages for frontend
- Cloudflare Workers for API
- Wrangler CLI for deployments
- Production URL: https://pickem.cyberlees.dev

**External Integrations**:
- ESPN API (primary NFL data source)
- The Odds API (supplementary betting data)

## Development Workflow

**Local Development**:
1. `npm install` - Install dependencies
2. `npm run dev` - Start Vite dev server
3. `npm run workers:dev` - Start Workers dev server

**Production Deployment**:
1. Pre-deployment database count verification
2. `npm run build` - Build frontend
3. `wrangler deploy --config wrangler-workers.toml --env production` - Deploy API
4. `wrangler pages deploy dist` - Deploy frontend
5. Post-deployment database count verification
6. Playwright production testing

**Code Review Requirements**:
- Use code-reviewer agent after significant code changes
- Use architect-review agent after structural changes
- Security review for authentication or data access changes

**Testing Hierarchy**:
1. Unit tests for utility functions
2. Integration tests for API endpoints
3. E2E Playwright tests for user journeys (REQUIRED before deployment)

## Governance

This constitution supersedes all other development practices for the NFL Pick'em App project.

**Amendment Process**:
1. Proposed changes MUST be documented with rationale
2. Changes MUST maintain backward compatibility when possible
3. Breaking changes require migration plan and user notification
4. Constitution version MUST be updated using semantic versioning

**Compliance**:
- All PRs/reviews MUST verify compliance with these principles
- Non-compliance MUST be flagged and resolved before merge
- Exceptions require documented justification

**Version Policy**:
- MAJOR: Backward incompatible principle changes or removals
- MINOR: New principles added or materially expanded guidance
- PATCH: Clarifications, wording, or non-semantic refinements

**Runtime Guidance**: See `CLAUDE.md` for detailed development guidelines and agent-specific instructions.

**Version**: 1.0.0 | **Ratified**: 2025-11-22 | **Last Amended**: 2025-11-22
