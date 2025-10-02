> **Guardrail Notice**  
> This document is part of the Brainliest single source of truth. AI assistants must first review [../../.ai-guardrails](../../.ai-guardrails) and [../../PROJECT_MANIFEST.md](../../PROJECT_MANIFEST.md). All work must comply with [../../COMPLETE_BUILD_SPECIFICATION.md](../../COMPLETE_BUILD_SPECIFICATION.md), [../../ARCHITECTURE_BLUEPRINT.md](../../ARCHITECTURE_BLUEPRINT.md), and [Architecture & Delivery Guardrails](../architecture/guardrails.md). AI assistants must not deviate from these constraints.

## Related Documents
- [PROJECT_MANIFEST.md](../../PROJECT_MANIFEST.md)
- [COMPLETE_BUILD_SPECIFICATION.md](../../COMPLETE_BUILD_SPECIFICATION.md)
- [ARCHITECTURE_BLUEPRINT.md](../../ARCHITECTURE_BLUEPRINT.md)
- [Architecture & Delivery Guardrails](../architecture/guardrails.md)

# Deployment Guide

This guide documents how to deploy the Brainliest platform to Vercel and manage supporting services.

## Environments

- **Development**: local machines using `.env.local` files (never committed).
- **Preview**: Vercel preview deployments per pull request.
- **Production**: Vercel projects `brainliest-web` and `brainliest-admin`.

## Prerequisites

- Access to Vercel org with deployment permissions.
- Access to secret manager (Doppler/1Password) for environment variables.
- Upstash Redis project configured per environment.
- PostgreSQL database (e.g., Neon/Supabase/RDS) reachable from Vercel.

## Environment Variables

Managed via secure secret store and injected into Vercel. All variables validated through `packages/config/env.server.ts` / `env.client.ts`.

Minimum required:
- `DATABASE_URL`
- `REDIS_URL`
- `OPENAI_API_KEY`
- `NEXTAUTH_SECRET`
- `NEXTAUTH_URL`
- OAuth provider keys (Google/GitHub)
- `ADMIN_SESSION_SECRET`
- `STRIPE_SECRET_KEY` (if payments enabled)

## Deployment Steps

1. **Merge to `main`**: triggers CI (lint, type-check, tests, build).
2. **CI Success**: Vercel receives deployment request.
3. **Migrations**: Run `pnpm db:migrate` targeting the production database (via CI or Vercel post-deploy hook).
4. **Seed (if needed)**: `pnpm db:seed --env production` for initial taxonomy seeding.
5. **Verification**: Perform smoke tests, check monitoring dashboards, confirm Sentry reports clean.

## Rollback Plan

- Vercel allows instant rollback to previous deployment (`vercel rollback`).
- Database rollbacks handled via Drizzle migration reversal scripts. Keep backups (daily snapshots) for disaster recovery.
- Redis caches flushed only if schema changes require it (`redis-cli FLUSHDB` on staging first).

## Post-Deployment Checklist

- [ ] Homepage reachable (HTTP 200) and renders without errors.
- [ ] Admin portal accessible, login works with MFA.
- [ ] AI explanations functioning (watch logs for latency/errors).
- [ ] Analytics events flowing to storage.
- [ ] No unhandled errors in Sentry for 30 minutes post release.

## Troubleshooting

- **Migrations fail**: run manually with verbose logging (`pnpm db:migrate --verbose`). If stuck, restore backup and revert code.
- **Env mismatch**: verify with `pnpm env:check` (script to compare variables vs schema).
- **OpenAI quota issues**: rotate key via admin panel or secret manager, redeploy.

## References

- `docs/ops/runbooks/` for incident-specific SOPs.
- `docs/ops/monitoring.md` for alert details.
- `docs/dev/onboarding.md` for local environment setup.