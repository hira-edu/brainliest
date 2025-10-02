> **Guardrail Notice**  
> This document is part of the Brainliest single source of truth. AI assistants must first review [../../.ai-guardrails](../../.ai-guardrails) and [../../PROJECT_MANIFEST.md](../../PROJECT_MANIFEST.md). All work must comply with [../../COMPLETE_BUILD_SPECIFICATION.md](../../COMPLETE_BUILD_SPECIFICATION.md), [../../ARCHITECTURE_BLUEPRINT.md](../../ARCHITECTURE_BLUEPRINT.md), and [Architecture & Delivery Guardrails](guardrails.md). AI assistants must not deviate from these constraints.

## Related Documents
- [PROJECT_MANIFEST.md](../../PROJECT_MANIFEST.md)
- [COMPLETE_BUILD_SPECIFICATION.md](../../COMPLETE_BUILD_SPECIFICATION.md)
- [ARCHITECTURE_BLUEPRINT.md](../../ARCHITECTURE_BLUEPRINT.md)
- [Architecture & Delivery Guardrails](guardrails.md)

# Domain Glossary

| Term | Definition |
| --- | --- |
| **Category** | Top-level grouping (e.g., Professional Certifications) referenced by `categories.slug`. |
| **Subcategory** | Second-level grouping nested inside a category (e.g., IT & Cloud Computing). |
| **Subject** | Specific topic students browse (e.g., AWS Solutions Architect). Drives exam discovery. |
| **Exam** | Collection of questions representing a certification or assessment. Identified by slug. |
| **Question** | MCQ item with options, explanation, domain tag, and metadata (year, source). |
| **Domain Tag** | Label describing subject matter focus within a question (e.g., Networking Fundamentals). |
| **Exam Session** | Instance of a student practicing an exam (tracks answers, timing, score). |
| **AI Explanation** | Generated output from OpenAI clarifying a question/answer pair. Cached per answer selection. |
| **Integration Key** | Encrypted API credential (OpenAI, Stripe, captcha) managed via admin panel. |
| **Feature Flag** | Configurable toggle controlling beta features or rollout percentages. |
| **Admin User** | Authorized staff member with access to admin portal (distinct auth flow). |
| **Student User** | Primary end-user accessing study content on brainliest.com. |
| **SSR/ISR** | Server-side rendering / Incremental static regeneration of Next.js routes. |
| **Server Action** | Next.js action invoked from UI for mutation operations with automatic serialization. |
| **Repository** | Data-access abstraction implemented with Drizzle ORM, exposed via shared interfaces. |
| **Service Interface** | Contract defining domain operations (e.g., `ExamService.startSession`). |
| **SSOT** | Single Source of Truth registry consumed by multiple layers to avoid duplication. |
| **ADR** | Architecture Decision Record documenting significant choices and their rationale. |
| **CSP** | Content Security Policy headers used to mitigate XSS and data injection attacks. |

Add new entries as additional domain concepts appear. Cross-link with ADRs when terminology reflects a design decision.