> **Guardrail Notice**  
> This document is part of the Brainliest single source of truth. AI assistants must first review [../../.ai-guardrails](../../.ai-guardrails) and [../../PROJECT_MANIFEST.md](../../PROJECT_MANIFEST.md). All work must comply with [../../COMPLETE_BUILD_SPECIFICATION.md](../../COMPLETE_BUILD_SPECIFICATION.md), [../../ARCHITECTURE_BLUEPRINT.md](../../ARCHITECTURE_BLUEPRINT.md), and [Architecture & Delivery Guardrails](../architecture/guardrails.md). AI assistants must not deviate from these constraints.

## Related Documents
- [PROJECT_MANIFEST.md](../../PROJECT_MANIFEST.md)
- [COMPLETE_BUILD_SPECIFICATION.md](../../COMPLETE_BUILD_SPECIFICATION.md)
- [ARCHITECTURE_BLUEPRINT.md](../../ARCHITECTURE_BLUEPRINT.md)
- [Architecture & Delivery Guardrails](../architecture/guardrails.md)

# API Reference

This document tracks HTTP and RPC-style endpoints exposed by the Brainliest platform. All endpoints must adhere to the schemas defined in `packages/shared/domain` and `packages/shared/services`.

## Conventions

- Base path for REST endpoints: `/api/v1/...`
- All responses follow `{ data: T | null, error?: ApiError, meta?: Meta }`
- Authenticated endpoints require appropriate session cookies or bearer tokens.
- Request/response payloads validated with shared Zod schemas.

## Authentication

### Student Auth (NextAuth)
- `/api/auth/[...nextauth]` — OAuth/email providers (NextAuth built-ins)
- Server actions: `signIn`, `signOut`, `requestPasswordReset`

### Admin Auth
- `POST /api/v1/admin/auth/login`
- `POST /api/v1/admin/auth/logout`
- `POST /api/v1/admin/auth/totp/verify`
- Future: WebAuthn registration/verification routes

## Taxonomy Management (Admin)

| Endpoint | Method | Description |
| --- | --- | --- |
| `/api/v1/admin/categories` | GET | List categories with filters |
| `/api/v1/admin/categories` | POST | Create category |
| `/api/v1/admin/categories/:slug` | PATCH | Update category |
| `/api/v1/admin/categories/:slug` | DELETE | Soft-delete category |
| Similar endpoints exist for subcategories and subjects |

## Exam & Question Management (Admin)

- `GET /api/v1/admin/exams`
- `POST /api/v1/admin/exams`
- `PATCH /api/v1/admin/exams/:slug`
- `POST /api/v1/admin/exams/:slug/clone`
- `GET /api/v1/admin/questions`
- `POST /api/v1/admin/questions`
- `PATCH /api/v1/admin/questions/:id`
- `DELETE /api/v1/admin/questions/:id`
- `POST /api/v1/admin/questions/import`
- `POST /api/v1/admin/questions/export`

## Integration Keys & Feature Flags

- `GET /api/v1/admin/integration-keys`
- `POST /api/v1/admin/integration-keys`
- `PATCH /api/v1/admin/integration-keys/:id`
- `DELETE /api/v1/admin/integration-keys/:id`
- `GET /api/v1/admin/feature-flags`
- `PATCH /api/v1/admin/feature-flags/:key`

## Student-Facing Endpoints & Actions

### Discovery
- `GET /api/v1/subjects`
- `GET /api/v1/subjects/:slug`
- `GET /api/v1/exams?subjectSlug=`
- `GET /api/v1/search?q=&filters=`

### Practice Flow
- `POST /api/v1/exams/:slug/start` — create exam session
- `POST /api/v1/exam-sessions/:id/answer` — record answer
- `POST /api/v1/exam-sessions/:id/reveal` — log answer reveal
- `POST /api/v1/exam-sessions/:id/explain` — request AI explanation
- `POST /api/v1/exam-sessions/:id/complete` — finalize session

### Profile & History
- `GET /api/v1/me`
- `GET /api/v1/me/exam-sessions`
- `GET /api/v1/me/bookmarks`
- `POST /api/v1/me/bookmarks`
- `DELETE /api/v1/me/bookmarks/:questionId`

## Error Handling

- Errors implement `{ code: string; message: string; details?: unknown }`
- Common codes: `UNAUTHORIZED`, `FORBIDDEN`, `NOT_FOUND`, `VALIDATION_FAILED`, `RATE_LIMITED`, `INTERNAL_ERROR`
- Admin actions always emit audit events on failure and success.

## Change Log

Track endpoint additions/updates here with links to ADRs or PRs.

| Date | Endpoint | Change | Reference |
| --- | --- | --- | --- |
| _TBD_ | | | |

## To-Do

- Flesh out request/response examples once schemas are implemented.
- Link to Postman/Insomnia collections (if used).
- Document server action signatures alongside REST endpoints.