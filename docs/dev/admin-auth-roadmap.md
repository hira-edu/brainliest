# Admin Authentication Roadmap

> This addendum outlines the next steps for hardening the admin authentication stack. It complements the guardrails already documented in `docs/dev/worklog.md`.

## Password reset flow
- Expose a secure `/forgot-password` endpoint that issues single-use, short-lived tokens. Tokens should be signed and encrypted using the existing AES utilities.
- Store reset events in `admin_users_reset_tokens` (token hash, admin id, issued/expiry, IP). Invalidate on redeem or expiry.
- Update the sign-in screen to link to the reset flow once the endpoint is live.
- Add admin notifications (email/SMS) describing the reset attempt.

## MFA / TOTP rollout ✅
- `admin_users` now tracks `totp_secret`, `totp_enabled_at`, `totp_last_used_at`, recovery codes, and trusted-device metadata.
- Security settings page exposes QR-code enrollment, verification, recovery-code regeneration, and trusted-device revocation.
- Sign-in action issues redis-backed TOTP challenges, honours recovery codes, and manages remember-device cookies so trusted browsers skip MFA.
- All MFA events are logged via `AuditLogRepository`, and Vitest coverage guards repository behaviour.

## Session hygiene
- Replace the plain AES payload with an HMAC-signed session envelope (prevent tampering) and include a rolling `lastSeenAt` timestamp.
- Issue refresh on privileged routes if a session is nearing expiry.
- Instrument audit logs for sign-in/out, failed attempts, reset attempts, and MFA events via `AuditLogRepository`.

## Open tasks
1. Build the password reset experience (request/confirm endpoints, UI, notifications) once prioritised.
2. Integrate the updated auth guard + MFA path into Playwright/CI smoke tests when a browser runner is available.
3. Extend monitoring to surface MFA enrolment/remember-device activity in the security dashboard.
