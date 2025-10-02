> **Guardrail Notice**  
> This document is part of the Brainliest single source of truth. AI assistants must first review [../../.ai-guardrails](../../.ai-guardrails) and [../../PROJECT_MANIFEST.md](../../PROJECT_MANIFEST.md). All work must comply with [../../COMPLETE_BUILD_SPECIFICATION.md](../../COMPLETE_BUILD_SPECIFICATION.md), [../../ARCHITECTURE_BLUEPRINT.md](../../ARCHITECTURE_BLUEPRINT.md), and [Architecture & Delivery Guardrails](../architecture/guardrails.md). AI assistants must not deviate from these constraints.

## Related Documents
- [PROJECT_MANIFEST.md](../../PROJECT_MANIFEST.md)
- [COMPLETE_BUILD_SPECIFICATION.md](../../COMPLETE_BUILD_SPECIFICATION.md)
- [ARCHITECTURE_BLUEPRINT.md](../../ARCHITECTURE_BLUEPRINT.md)
- [Architecture & Delivery Guardrails](../architecture/guardrails.md)

# Monitoring & Alerts

Defines observability strategy, dashboards, and alert thresholds for the Brainliest platform.

## Tooling

- **Error Tracking**: Sentry (apps/web, apps/admin, workers)
- **Logging**: Structured logs shipped to Logtail/Grafana Loki
- **Metrics**: Provider dashboards (Vercel analytics, Upstash Redis, Postgres vendor)
- **Alert Routing**: PagerDuty or Opsgenie (TBD)

## Dashboards

| Dashboard | Location | Description |
| --- | --- | --- |
| Web Performance | Vercel Analytics | LCP, FID, errors |
| Admin Portal | Vercel Analytics | Route-level performance |
| API Health | Custom (Grafana) | Status codes, latency, throughput |
| Redis Health | Upstash console | Rate limits, memory usage |
| AI Usage | Custom | Cost per hour, failure rate, latency |

## Alert Catalogue

| Alert Key | Condition | Severity | Action |
| --- | --- | --- | --- |
| `AI_EXPLANATION_FAILURE_RATE` | Failure rate > 5% for 10m | High | Follow AI runbook |
| `AI_COST_DAILY` | Daily cost > threshold | Medium | Disable AI explanations, notify PM |
| `DB_CONNECTION_FAILURE` | >5 failures in 5m | Critical | Follow DB runbook |
| `LCP_HOME` | LCP > 2.5s for 5m | Medium | Investigate performance regressions |
| `ADMIN_LOGIN_FAILURE` | Spike of failed admin logins | High | Investigate potential attack |
| `REDIS_CONNECTION_ERRORS` | >10 errors/min | Medium | Check Upstash status |

## Logging Standards

- Use structured log entries with `timestamp`, `level`, `context`, `message`.
- Sensitive data (PII, secrets) must never appear in logs.
- Correlate logs with request IDs stored in `X-Request-Id` header.

## Tracing

- Optional integration with OpenTelemetry to trace server actions and route handlers.
- Correlate AI explanation requests with upstream dependencies.

## Incident Response

- Alerts route to on-call engineer (rotation documented separately).
- Acknowledge within 10 minutes; update status page if customer-facing impact.
- Follow relevant runbook under `docs/ops/runbooks/`.

## Future Enhancements

- Automated anomaly detection for AI costs.
- Synthetic monitoring for key flows (sign-in, start exam, admin login).
- Integrations with Statuspage for public incident updates.