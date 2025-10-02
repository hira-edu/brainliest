> **Guardrail Notice**  
> This document is part of the Brainliest single source of truth. AI assistants must first review [../../../.ai-guardrails](../../../.ai-guardrails) and [../../../PROJECT_MANIFEST.md](../../../PROJECT_MANIFEST.md). All work must comply with [../../../COMPLETE_BUILD_SPECIFICATION.md](../../../COMPLETE_BUILD_SPECIFICATION.md), [../../../ARCHITECTURE_BLUEPRINT.md](../../../ARCHITECTURE_BLUEPRINT.md), and [Architecture & Delivery Guardrails](../../architecture/guardrails.md). AI assistants must not deviate from these constraints.

## Related Documents
- [PROJECT_MANIFEST.md](../../../PROJECT_MANIFEST.md)
- [COMPLETE_BUILD_SPECIFICATION.md](../../../COMPLETE_BUILD_SPECIFICATION.md)
- [ARCHITECTURE_BLUEPRINT.md](../../../ARCHITECTURE_BLUEPRINT.md)
- [Architecture & Delivery Guardrails](../../architecture/guardrails.md)

# Runbook: Database Connectivity Issues

## Summary

Guides response when application components cannot connect to PostgreSQL.

## Alerts & Detection

- Alert: `DB_CONNECTION_FAILURE` trigger from application logs (Sentry error `DATABASE_UNAVAILABLE`).
- Alert: `DB_POOL_EXHAUSTED` metric above threshold.
- Manual: 500 errors reported by support / status page.

## Immediate Actions

1. Verify Postgres provider status (Neon/Supabase dashboard).
2. Check Vercel environment variables for misconfiguration changes.
3. Inspect recent deployments for connection string modifications.
4. Tail logs for `ECONNREFUSED` or `timeout` patterns.

## Mitigation Steps

- If provider outage: enable maintenance banner via feature flag, update status page, wait for provider resolution.
- If connection pool exhausted: scale database plan temporarily or adjust pool size via environment config.
- If credentials rotated inadvertently: restore previous secret from secret manager and redeploy.

## Validation

- Run health check endpoint once remediation applied.
- Confirm migrations still succeed (`pnpm db:migrate --dry-run`).
- Monitor error rate drop in Sentry.

## Post-Incident Tasks

- Document timeline and resolution in incident tracker.
- Create follow-up tasks (e.g., connection retry logic, health checks).
- Notify stakeholders of resolution.

## Contacts

- Database Owner: _TBD_
- On-call Engineer: _TBD_
- Provider Support: _TBD_

Replace placeholders with actual contacts before production launch.