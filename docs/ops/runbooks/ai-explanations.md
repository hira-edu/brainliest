> **Guardrail Notice**  
> This document is part of the Brainliest single source of truth. AI assistants must first review [../../../.ai-guardrails](../../../.ai-guardrails) and [../../../PROJECT_MANIFEST.md](../../../PROJECT_MANIFEST.md). All work must comply with [../../../COMPLETE_BUILD_SPECIFICATION.md](../../../COMPLETE_BUILD_SPECIFICATION.md), [../../../ARCHITECTURE_BLUEPRINT.md](../../../ARCHITECTURE_BLUEPRINT.md), and [Architecture & Delivery Guardrails](../../architecture/guardrails.md). AI assistants must not deviate from these constraints.

## Related Documents
- [PROJECT_MANIFEST.md](../../../PROJECT_MANIFEST.md)
- [COMPLETE_BUILD_SPECIFICATION.md](../../../COMPLETE_BUILD_SPECIFICATION.md)
- [ARCHITECTURE_BLUEPRINT.md](../../../ARCHITECTURE_BLUEPRINT.md)
- [Architecture & Delivery Guardrails](../../architecture/guardrails.md)

# Runbook: AI Explanation Failures

## Summary

Handles incidents where OpenAI-powered question explanations fail, degrade, or exceed cost thresholds.

## Alerts & Detection

- Alert: `AI_EXPLANATION_FAILURE_RATE` > 5% over 10 minutes (PagerDuty/S lack).
- Alert: `AI_EXPLANATION_LATENCY_P95` > 8s.
- Alert: `AI_COST_DAILY` exceeds configured budget.
- Manual reports from support channels.

## Triage Steps

1. Confirm incident via monitoring dashboard (OpenAI status, Sentry issues).
2. Check Redis rate-limit keys to ensure we are not throttling excessively.
3. Inspect recent deploys affecting `AIExplanationService` or prompt templates.

## Mitigation

- **Partial outage**: Switch feature flag `ai.explanations.enabled` to `false` (admin panel) to gracefully disable explanations.
- **Rate limit**: Increase bucket size in Redis if within budget or reduce concurrency in application layer.
- **OpenAI outage**: Switch to backup model/region if configured or surface fallback UI apologizing for temporary unavailability.
- **Cost spike**: Enforce stricter rate limits / disable auto explanation.

## Diagnostics

- Logs: `packages/shared/ai` logger output for errors.
- Cached responses: Inspect Redis keys `ai:explanation:*` for hit/miss patterns.
- Queue backlog (if using workers) for pending explanation jobs.

## Post-Mitigation

- Re-enable explanations once stability confirmed.
- Create incident report (Confluence/Notion) with timestamps, impact, remedial actions.
- Raise ADR or tech-debt ticket if permanent change required (e.g., new fallback provider).

## Contacts

- AI Feature Owner: _TBD_
- Infrastructure On-call: _TBD_
- Product Stakeholder: _TBD_

Update contact list once team assignments are finalized.