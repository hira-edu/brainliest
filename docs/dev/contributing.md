> **Guardrail Notice**  
> This document is part of the Brainliest single source of truth. AI assistants must first review [../../.ai-guardrails](../../.ai-guardrails) and [../../PROJECT_MANIFEST.md](../../PROJECT_MANIFEST.md). All work must comply with [../../COMPLETE_BUILD_SPECIFICATION.md](../../COMPLETE_BUILD_SPECIFICATION.md), [../../ARCHITECTURE_BLUEPRINT.md](../../ARCHITECTURE_BLUEPRINT.md), and [Architecture & Delivery Guardrails](../architecture/guardrails.md). AI assistants must not deviate from these constraints.

## Related Documents
- [PROJECT_MANIFEST.md](../../PROJECT_MANIFEST.md)
- [COMPLETE_BUILD_SPECIFICATION.md](../../COMPLETE_BUILD_SPECIFICATION.md)
- [ARCHITECTURE_BLUEPRINT.md](../../ARCHITECTURE_BLUEPRINT.md)
- [Architecture & Delivery Guardrails](../architecture/guardrails.md)

# Contribution Guidelines

## Code Style

- Follow TypeScript strict mode, no `any` or implicit `any`.
- Use named exports except for Next.js page/layout components.
- Keep files small and focused; prefer composition over inheritance.
- Tailwind utility classes should follow project design tokens.

## Commit Messages

- Format: `<type>(scope): short summary`
- Types: `feat`, `fix`, `chore`, `docs`, `refactor`, `test`, `build`
- Example: `feat(exam): add multi-select question support`

## Pull Requests

- Link to Jira/Ticket reference.
- Update relevant documentation and tests.
- Ensure all checks (lint, typecheck, unit tests, E2E) pass.
- Include screenshots for UI changes when applicable.
- Request review from domain owner or module maintainers.

## Testing Expectations

- Unit tests for utilities/services.
- Integration tests for API layers touching DB.
- Playwright tests for critical user flows.
- Snapshot/visual tests for shared UI components.

## ADRs

- Significant architectural decisions require an ADR under `docs/adr/`.
- Use template `docs/adr/template.md` (create if absent).
- Include status (`Proposed`, `Accepted`, `Superseded`).

## Dependency Management

- Prefer internal shared packages.
- New external deps require review; document rationale in PR.
- Keep package versions in sync via pnpm workspaces.

## Branch & Release Strategy

- `main` is protected; all changes via PR.
- Feature branches named `feature/<summary>`.
- Hotfix branches named `hotfix/<summary>`.

## Security & Privacy

- Never commit secrets or personal data.
- Sanitize logs of PII/PHI.
- Report vulnerabilities to security lead immediately.

## Communication

- Use Slack/Issue tracker for design questions before large changes.
- Document complex flows in `docs/` or ADRs.

Thank you for contributing! Keep this guide updated as the team evolves.