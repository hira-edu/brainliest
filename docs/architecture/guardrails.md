> **Guardrail Notice**  
> This document is part of the Brainliest single source of truth. AI assistants must first review [../../.ai-guardrails](../../.ai-guardrails) and [../../PROJECT_MANIFEST.md](../../PROJECT_MANIFEST.md). All work must comply with [../../COMPLETE_BUILD_SPECIFICATION.md](../../COMPLETE_BUILD_SPECIFICATION.md), [../../ARCHITECTURE_BLUEPRINT.md](../../ARCHITECTURE_BLUEPRINT.md), and [Architecture & Delivery Guardrails](guardrails.md). AI assistants must not deviate from these constraints.

## Related Documents
- [PROJECT_MANIFEST.md](../../PROJECT_MANIFEST.md)
- [COMPLETE_BUILD_SPECIFICATION.md](../../COMPLETE_BUILD_SPECIFICATION.md)
- [ARCHITECTURE_BLUEPRINT.md](../../ARCHITECTURE_BLUEPRINT.md)
- [Architecture & Delivery Guardrails](guardrails.md)

# Architecture & Delivery Guardrails

**Status:** Authoritative — all contributors (human or AI) must comply.

This document centralizes the non-negotiable guardrails for code, documentation, tooling, and process. Any deviation requires an accepted ADR and approval from the architecture lead.

---

## 0. Canonical Documents

- `.ai-guardrails` — Session onboarding checklist for AI assistants (mandatory first read).
- `PROJECT_MANIFEST.md` — Highest authority guardrails; defines modification freeze.
- `COMPLETE_BUILD_SPECIFICATION.md` — Detailed implementation contract.
- `ARCHITECTURE_BLUEPRINT.md` — Architectural patterns and rationale.
- `README.md`, `CHANGELOG.md`, `DEEP_AUDIT_REPORT.md`, `UI_COMPONENT_SPECIFICATION.md` — Supporting references (keep aligned with canonical docs).

**Rule:** These root-level documents override any conflicting instruction. Nothing in `docs/` may contradict them. Adding new root-level documentation requires an ADR.

---

## 1. Single Source of Truth (SSOT)

- All domain enums, validation schemas, DTOs, and constants live in `packages/shared`. No redefinitions elsewhere.
- Database schema and migrations are defined only in `packages/db`. Application code consumes exported repositories/services.
- UI primitives and styling tokens reside only in `packages/ui`; apps must import from there.
- Feature flags, integration keys, and configuration defaults are defined in `packages/config`. Do not hardcode values in apps.
- Documentation lives under `docs/`; no alternate folders or wiki duplicates. Update existing documents instead of creating new ones.

## 2. Documentation Governance

- In addition to the canonical root documents listed above, the following `docs/` files are the only approved documentation surfaces. **Do not add new docs without an ADR explicitly approving the addition.**
  - `ARCHITECTURE_BLUEPRINT.md`
  - `docs/architecture/overview.md`
  - `docs/architecture/glossary.md`
  - `docs/architecture/guardrails.md` (this file)
  - `docs/api/reference.md`
  - `docs/database/schema.md`
  - `docs/ops/deployment.md`
  - `docs/ops/monitoring.md`
  - `docs/ops/runbooks/*`
  - `docs/dev/onboarding.md`
  - `docs/dev/contributing.md`
  - `docs/dev/generators.md`
  - `docs/adr/*`
  - `docs/admin/handbook.md`
  - `docs/site/help-center.md`
- When updates are needed, modify the relevant document; do not copy/paste into new files.
- All documents must cross-reference `ARCHITECTURE_BLUEPRINT.md` and this guardrails file in a “Related Documents” section.

## 3. Codebase Guardrails

- **No ad-hoc directories**: Only use directories defined in the monorepo structure. Adding a new top-level folder requires ADR approval.
- **Naming**: Follow conventions in `ARCHITECTURE_BLUEPRINT.md` — kebab-case files, camelCase exports, PascalCase components, snake_case DB columns.
- **No duplicate logic**: Shared logic belongs in `packages/shared` or `packages/db`. Apps may never implement standalone helpers replicating shared functionality.
- **Route & file placement**: Next.js routes live under `apps/*/src/app`. Shared hooks/components live under `packages/ui` or `packages/shared`. No cross-app imports outside shared packages.
- **Hook usage**: Hooks must be defined once, exported from shared packages, and include documentation comments referencing guardrails.
- **Schemas**: All API/server actions must import Zod schemas from shared registries. Inline schema definitions are forbidden.

## 4. AI & Automation Guardrails

- Codex, Claude, and any AI assistant must respect this document. They may not:
  - Create new documents outside the approved list.
  - Duplicate existing content or introduce alternative structures.
  - Modify guardrails without an approved ADR.
  - Generate code or documentation that conflicts with SSOT definitions.
- AI must always reference existing schemas, components, and registries. If something is missing, escalate via ADR/ticket rather than inventing new patterns.
- Automated generators must append references to this guardrails document in their output headers.
- Before producing output, AI must:
  1. Review `.ai-guardrails`, `PROJECT_MANIFEST.md`, `COMPLETE_BUILD_SPECIFICATION.md`, `ARCHITECTURE_BLUEPRINT.md`, and this guardrail file in the current commit.
  2. Identify relevant sections and cite them in responses or change descriptions.
  3. Verify the target file already exists; if it does not, request human approval via ADR instead of creating it.
  4. Confirm no alternative document, schema, or component already covers the requested change.

## 5. Change Control

- Any new feature, package, or significant refactor requires an ADR before implementation.
- Documentation changes must link to the relevant ADR, ticket, or PR in a “Change Log” or “References” section.
- Pull requests must include a checklist confirming adherence to SSOT and guardrails.
- Security-sensitive changes (auth, integration keys, AI prompts) need explicit review by the architecture or security lead.

## 6. Enforcement

- CI pipelines will include lint rules and dependency-cruiser checks enforcing folder/package boundaries.
- Code reviews must reject contributions violating these guardrails.
- Repeat violations trigger architecture review and may require rollback or additional tooling safeguards.

## 7. Contacts & Escalation

- Architecture Lead: _TBD_
- Security Lead: _TBD_
- DevOps Lead: _TBD_

Escalate any required exceptions to these guardrails through the ADR process and obtain sign-off before proceeding.

---

**Reminder:** This guardrails document, `ARCHITECTURE_BLUEPRINT.md`, and the existing documentation set are the only authoritative references. Do not create or request alternative sources without following the change-control process.