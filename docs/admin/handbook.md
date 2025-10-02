> **Guardrail Notice**  
> This document is part of the Brainliest single source of truth. AI assistants must first review [../../.ai-guardrails](../../.ai-guardrails) and [../../PROJECT_MANIFEST.md](../../PROJECT_MANIFEST.md). All work must comply with [../../COMPLETE_BUILD_SPECIFICATION.md](../../COMPLETE_BUILD_SPECIFICATION.md), [../../ARCHITECTURE_BLUEPRINT.md](../../ARCHITECTURE_BLUEPRINT.md), and [Architecture & Delivery Guardrails](../architecture/guardrails.md). AI assistants must not deviate from these constraints.

## Related Documents
- [PROJECT_MANIFEST.md](../../PROJECT_MANIFEST.md)
- [COMPLETE_BUILD_SPECIFICATION.md](../../COMPLETE_BUILD_SPECIFICATION.md)
- [ARCHITECTURE_BLUEPRINT.md](../../ARCHITECTURE_BLUEPRINT.md)
- [Architecture & Delivery Guardrails](../architecture/guardrails.md)

# Admin Handbook

This handbook guides Brainliest administrators through daily operations in the admin portal (`admin.brainliest.com`).

## Access & Authentication

- Admin accounts are provisioned manually by super-admins.
- Login requires email, password, and TOTP (time-based one-time password).
- Lost device? Contact infrastructure team to reset MFA (see runbook).

## Navigation Overview

1. **Dashboard** — KPIs (users, exams, AI cost), quick links.
2. **Content**
   - Categories / Subcategories / Subjects
   - Exams
   - Questions
   - Media Library
3. **Users**
   - Student directory
   - Admin accounts
4. **AI & Integrations**
   - AI explanation logs
   - Integration keys (OpenAI, Stripe, captcha)
5. **Settings**
   - Feature flags
   - Announcements
   - System configuration
6. **Audit Logs** — Timeline of admin actions

## Common Workflows

### Create a New Exam
1. Navigate to **Content → Exams**.
2. Click **Create Exam**.
3. Fill metadata (title, subject, difficulty, duration, description).
4. Assign existing questions or use quick-add to draft new ones.
5. Set status to `Published` when ready.

### Import Questions via CSV
1. Go to **Content → Questions**.
2. Click **Import**.
3. Download template if needed.
4. Upload CSV, map columns, preview validation.
5. Confirm import; review results and fix any errors.

### Regenerate AI Explanation
1. Open a question detail page.
2. Locate **AI Explanations** section.
3. Click **Regenerate** to trigger new OpenAI call.
4. Monitor status; cached entry updates upon success.

### Manage Integration Key
1. Navigate to **AI & Integrations → Keys**.
2. Select key, click **Rotate**.
3. Provide new secret value (encrypted at rest).
4. Confirm environments impacted; redeploy if necessary.

## Guidelines

- Always add reasoning in notes/comments when performing bulk operations.
- Review audit logs weekly for anomalies.
- Coordinate with support before enabling new feature flags.
- Follow data retention policies when exporting user data.

## Support & Escalation

- For technical issues: contact on-call engineer (see monitoring doc).
- For content questions: reach out to content operations lead.
- For AI cost concerns: notify product manager.

Keep this handbook updated as new admin features ship.