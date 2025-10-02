> **Guardrail Notice**  
> This document is part of the Brainliest single source of truth. AI assistants must first review [../../.ai-guardrails](../../.ai-guardrails) and [../../PROJECT_MANIFEST.md](../../PROJECT_MANIFEST.md). All work must comply with [../../COMPLETE_BUILD_SPECIFICATION.md](../../COMPLETE_BUILD_SPECIFICATION.md), [../../ARCHITECTURE_BLUEPRINT.md](../../ARCHITECTURE_BLUEPRINT.md), and [Architecture & Delivery Guardrails](../architecture/guardrails.md). AI assistants must not deviate from these constraints.

## Related Documents
- [PROJECT_MANIFEST.md](../../PROJECT_MANIFEST.md)
- [COMPLETE_BUILD_SPECIFICATION.md](../../COMPLETE_BUILD_SPECIFICATION.md)
- [ARCHITECTURE_BLUEPRINT.md](../../ARCHITECTURE_BLUEPRINT.md)
- [Architecture & Delivery Guardrails](../architecture/guardrails.md)

# Developer Onboarding Guide

Welcome to the Brainliest platform rebuild. This guide walks you through environment setup and core workflows.

## Prerequisites

- Node.js 20+
- pnpm 8+
- Docker (optional, for local Postgres/Redis)
- Git, VS Code (recommended) with ESLint, Prettier, Tailwind, and Prisma/SQL extensions

## Initial Setup

1. Clone the repository:
   ```bash
   git clone <repo-url>
   cd brainliest
   ```
2. Install dependencies:
   ```bash
   pnpm install
   ```
3. Copy environment template and fill secrets (request from DevOps):
   ```bash
   cp .env.example .env.local
   ```
4. Validate environment variables:
   ```bash
   pnpm env:check
   ```

## Running the Apps

- Launch student app:
  ```bash
  pnpm dev:web
  ```
- Launch admin app:
  ```bash
  pnpm dev:admin
  ```
- Start all concurrently:
  ```bash
  pnpm dev
  ```

## Database

- Generate migrations:
  ```bash
  pnpm db:generate
  ```
- Apply migrations locally:
  ```bash
  pnpm db:migrate
  ```
- Seed base data:
  ```bash
  pnpm db:seed
  ```

## Code Quality

- Lint & type-check:
  ```bash
  pnpm lint
  pnpm typecheck
  ```
- Run unit tests:
  ```bash
  pnpm test
  ```
- Run E2E tests:
  ```bash
  pnpm test:e2e
  ```

## Storybook

- Preview shared UI components:
  ```bash
  pnpm storybook
  ```

## Git Workflow

- Branch naming: `feature/<ticket>`, `chore/<description>`, `fix/<description>`
- Follow PR template, ensure checks pass before requesting review.

## Useful Scripts

| Command | Description |
| --- | --- |
| `pnpm generate:component` | Scaffold new UI component |
| `pnpm generate:service` | Scaffold new domain service |
| `pnpm graph` | View dependency graph |
| `pnpm format` | Run Prettier across workspace |

## Support

- Engineering Slack channel: `#brainliest-dev`
- Ops contact: see `docs/ops/monitoring.md`
- Architecture questions: open ADR or reach out to architecture lead

Keep this guide updated as tooling or processes evolve.