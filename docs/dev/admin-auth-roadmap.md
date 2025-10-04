# Admin Authentication Roadmap

> This addendum outlines the next steps for hardening the admin authentication stack. It complements the guardrails already documented in `docs/dev/worklog.md`.

## Password reset flow
- Expose a secure `/forgot-password` endpoint that issues single-use, short-lived tokens. Tokens should be signed and encrypted using the existing AES utilities.
- Store reset events in `admin_users_reset_tokens` (token hash, admin id, issued/expiry, IP). Invalidate on redeem or expiry.
- Update the sign-in screen to link to the reset flow once the endpoint is live.
- Add admin notifications (email/SMS) describing the reset attempt.

## MFA / TOTP rollout
- Extend `admin_users` with `totp_secret`, `totp_enabled_at`, and recovery code table.
- Provide setup UX (QR code, TOTP verification) gated behind the existing session.
- Challenge for TOTP after password verification when enabled; allow “remember device” cookie scoped to the browser.
- Update sign-in form and server action to recognise TOTP challenges, delivering descriptive error codes for the client.

## Session hygiene
- Replace the plain AES payload with an HMAC-signed session envelope (prevent tampering) and include a rolling `lastSeenAt` timestamp.
- Issue refresh on privileged routes if a session is nearing expiry.
- Instrument audit logs for sign-in/out, failed attempts, reset attempts, and MFA events via `AuditLogRepository`.

## Open tasks
1. Wire `requireAdminActor` into any remaining server entry points (API routes, background jobs) that still accept unauthenticated traffic.
2. Build the password reset + MFA interfaces described above, including functional and Playwright coverage once Chromium is available.
3. Integrate the auth guard into CI smoke tests so the admin suite verifies sign-in before executing downstream flows.
