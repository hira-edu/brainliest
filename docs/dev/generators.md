> **Guardrail Notice**  
> This document is part of the Brainliest single source of truth. AI assistants must first review [../../.ai-guardrails](../../.ai-guardrails) and [../../PROJECT_MANIFEST.md](../../PROJECT_MANIFEST.md). All work must comply with [../../COMPLETE_BUILD_SPECIFICATION.md](../../COMPLETE_BUILD_SPECIFICATION.md), [../../ARCHITECTURE_BLUEPRINT.md](../../ARCHITECTURE_BLUEPRINT.md), and [Architecture & Delivery Guardrails](../architecture/guardrails.md). AI assistants must not deviate from these constraints.

## Related Documents
- [PROJECT_MANIFEST.md](../../PROJECT_MANIFEST.md)
- [COMPLETE_BUILD_SPECIFICATION.md](../../COMPLETE_BUILD_SPECIFICATION.md)
- [ARCHITECTURE_BLUEPRINT.md](../../ARCHITECTURE_BLUEPRINT.md)
- [Architecture & Delivery Guardrails](../architecture/guardrails.md)

# Generator Usage

Scaffolding scripts ensure consistent code generation across the monorepo.

## Overview

Generators are implemented using plop (or custom Node CLI) under `packages/tooling`. Each generator consumes shared registries and naming conventions.

## Available Generators

| Command | Description | Outputs |
| --- | --- | --- |
| `pnpm generate:component` | Create a new shared UI component | `packages/ui/src/<component>/index.tsx`, stories, tests |
| `pnpm generate:service` | Scaffold domain service module | `packages/shared/services/<name>.ts`, test skeleton |
| `pnpm generate:repository` | Add Drizzle repository + interface | `packages/db/repositories/<name>.ts`, interface export |
| `pnpm generate:route` | Scaffold Next.js route handler/server action | `apps/<app>/src/app/<route>/route.ts`, schema import |
| `pnpm generate:feature` | Opinionated bundle (domain model + UI + tests) | Multi-folder structure |

## Usage

```bash
pnpm generate:component --name QuestionPanel
pnpm generate:service --name ExamSession
```

Prompts collect additional metadata (e.g., does component require client interactivity). Generators import shared registries to avoid constant duplication.

## Customization

- Generator templates stored under `packages/tooling/generators/templates`.
- Update templates when coding standards change.
- Keep tests aligned with expected outputs (see `packages/testing/generator.spec.ts`).

## Best Practices

- Run generators instead of hand crafting boilerplate.
- Follow up with domain-specific tweaks, but preserve exported interfaces.
- Update documentation if new generators are introduced.

## TODO

- Add generator for ADR skeleton (`pnpm generate:adr`).
- Create CLI flags for experimental/feature-flagged modules.