# Brainliest — AI-Powered Exam Preparation Platform

> **🎓 Professional certification and academic exam practice with AI-powered explanations**

[![Status](https://img.shields.io/badge/status-specification-blue.svg)](./PROJECT_MANIFEST.md)
[![Version](https://img.shields.io/badge/version-2.0.0-green.svg)](./CHANGELOG.md)
[![License](https://img.shields.io/badge/license-proprietary-red.svg)]()

---

## ⚠️ IMPORTANT: For AI Assistants

**If you are an AI assistant (Claude, Codex, GPT, Cursor, etc.) working on this project:**

### 🔴 MANDATORY READING ORDER (DO NOT SKIP)

1. **[`.ai-guardrails`](./.ai-guardrails)** — Quick reference (2 min read)
2. **[`PROJECT_MANIFEST.md`](./PROJECT_MANIFEST.md)** — Master index & enforcement rules (REQUIRED)
3. **[`COMPLETE_BUILD_SPECIFICATION.md`](./COMPLETE_BUILD_SPECIFICATION.md)** — Implementation contract
4. **[`ARCHITECTURE_BLUEPRINT.md`](./ARCHITECTURE_BLUEPRINT.md)** — Architecture guide

**Failure to read these documents before starting work constitutes a critical violation.**

### 🚫 Forbidden Actions

- ❌ Create new architectural documents
- ❌ Duplicate existing schemas/types/constants
- ❌ Modify locked documents without approval
- ❌ Use TypeScript `any` type
- ❌ Violate dependency rules
- ❌ Create README files in individual packages

**See [`PROJECT_MANIFEST.md`](./PROJECT_MANIFEST.md) for complete guardrails.**

---

## 📚 Documentation Structure

### Canonical Specifications (🔒 LOCKED)

| Document | Purpose | Status |
|----------|---------|--------|
| **[PROJECT_MANIFEST.md](./PROJECT_MANIFEST.md)** | Master index, AI guardrails, cross-references | 🔒 LOCKED |
| **[COMPLETE_BUILD_SPECIFICATION.md](./COMPLETE_BUILD_SPECIFICATION.md)** | Line-by-line implementation contract | 🔒 LOCKED |
| **[ARCHITECTURE_BLUEPRINT.md](./ARCHITECTURE_BLUEPRINT.md)** | High-level architecture & patterns | 🔒 LOCKED |

### Supporting Documentation

| Document | Purpose |
|----------|---------|
| **[CHANGELOG.md](./CHANGELOG.md)** | Version history & changes |
| **[.ai-guardrails](./.ai-guardrails)** | Quick reference for AI assistants |
| **README.md** | This file — project overview |

### Future Documentation (To Be Created)

- `/docs/adr/` — Architecture Decision Records
- `/docs/api/` — Auto-generated API documentation
- `/docs/ops/` — Operational runbooks
- `/docs/dev/` — Developer onboarding guides

---

## 🎯 Project Overview

**Brainliest** is a modern exam preparation platform built with Next.js 14, offering:

- 🎓 **Curated Practice Questions** — Past exam questions for professional certifications and academic subjects
- 🤖 **AI-Powered Explanations** — Instant, contextual explanations using OpenAI GPT-4
- 📊 **Smart Analytics** — Track progress, identify weak areas, optimize study plans
- 🏆 **Exam Simulations** — Timed practice sessions mimicking real exam conditions
- 🔐 **Secure Admin Portal** — Content management with audit logging and role-based access

---

## 🏗️ Architecture Highlights

### Monorepo Structure (Turborepo + pnpm)

```
brainliest/
├── apps/
│   ├── web/              # Student-facing app (brainliest.com)
│   ├── admin/            # Admin portal (admin.brainliest.com)
│   └── workers/          # Background jobs & cron
├── packages/
│   ├── ui/               # Shared component library (shadcn/ui)
│   ├── shared/           # Domain logic, schemas, services
│   ├── db/               # Drizzle ORM, migrations, repositories
│   ├── config/           # Environment & configuration
│   ├── testing/          # Test utilities & fixtures
│   └── tooling/          # Dev tools & generators
└── docs/                 # Documentation
```

### Technology Stack

- **Framework:** Next.js 14 (App Router, RSC)
- **Language:** TypeScript (strict mode, no `any`)
- **UI:** Tailwind CSS + shadcn/ui (Radix primitives)
- **Database:** PostgreSQL 15+ via Drizzle ORM
- **Cache:** Redis (Upstash)
- **Auth:** NextAuth v5 (students), Custom (admin with TOTP)
- **AI:** OpenAI GPT-4 (structured outputs)
- **Deployment:** Vercel
- **Testing:** Vitest + Playwright + Testing Library

### Core Principles

1. **Zero Duplication** — Single Source of Truth (SSOT) via shared registries
2. **Zero Drift** — Strict adherence to specifications
3. **Schema-First** — Zod validation at all boundaries
4. **Type Safety** — No `any`, strict TypeScript everywhere
5. **Layered Architecture** — Clear separation of concerns
6. **Security by Default** — Encrypted secrets, audit logs, rate limiting

---

## 🚀 Quick Start (For Developers)

> **⚠️ Prerequisites:** Node.js 20+, pnpm 9+, PostgreSQL 15+, Redis

### 1. Clone & Install

```bash
git clone <repository-url> brainliest
cd brainliest
pnpm install
```

### 2. Environment Setup

```bash
# Copy example env files
cp .env.example .env

# Configure required variables (see COMPLETE_BUILD_SPECIFICATION.md §5)
# - DATABASE_URL
# - REDIS_URL
# - NEXTAUTH_SECRET
# - OPENAI_API_KEY
# - SITE_PRIMARY_DOMAIN
# - SITE_KMS_MASTER_KEY
```

### 3. Database Setup

```bash
# Run migrations
pnpm --filter @brainliest/db migrate:apply

# Seed initial data
pnpm --filter @brainliest/db seed
```

### 4. Development

```bash
# Start all apps in dev mode
pnpm dev

# Or start individually
pnpm dev:web    # http://localhost:3000
pnpm dev:admin  # http://localhost:3001
```

### 5. Quality Checks

```bash
# Type check
pnpm typecheck

# Lint
pnpm lint

# Test
pnpm test

# Build
pnpm build
```

---

## 📋 Implementation Status

> **Current Phase:** Specification Complete, Implementation Pending

### Completed ✅

- [x] Complete architectural specifications
- [x] Database schema design (40+ tables)
- [x] API route definitions
- [x] Type system & interfaces
- [x] Security & compliance guidelines
- [x] Testing strategy
- [x] Deployment procedures
- [x] AI guardrails & cross-references

### In Progress 🚧

- [ ] Monorepo scaffolding
- [ ] Shared packages implementation
- [ ] Database migrations
- [ ] Authentication setup
- [ ] Core UI components

### Upcoming 📅

- [ ] Student app (web)
- [ ] Admin portal
- [ ] AI integration
- [ ] Search & analytics
- [ ] E2E testing
- [ ] Production deployment

**See [Implementation Phases](./COMPLETE_BUILD_SPECIFICATION.md#19-implementation-phases) for detailed roadmap.**

---

## 🤝 Contributing

> **⚠️ IMPORTANT:** All contributors (human and AI) must follow the specifications exactly.

### Before Contributing

1. Read **[PROJECT_MANIFEST.md](./PROJECT_MANIFEST.md)** thoroughly
2. Understand the **[COMPLETE_BUILD_SPECIFICATION.md](./COMPLETE_BUILD_SPECIFICATION.md)**
3. Review **[ARCHITECTURE_BLUEPRINT.md](./ARCHITECTURE_BLUEPRINT.md)** for patterns
4. Check existing issues/PRs to avoid duplication

### Development Workflow

```bash
# 1. Create feature branch
git checkout -b feature/your-feature-name

# 2. Implement following specifications exactly
# - Verify against PROJECT_MANIFEST.md
# - Follow naming conventions
# - Check SSOT registry before creating types
# - Run quality gates

# 3. Run all checks
pnpm typecheck && pnpm lint && pnpm test && pnpm build

# 4. Commit with conventional commits
git commit -m "feat(web): add exam session flow"

# 5. Push and create PR
git push origin feature/your-feature-name
```

### Commit Convention

```
<type>(<scope>): <description>

Types: feat, fix, docs, style, refactor, test, chore
Scopes: web, admin, ui, db, shared, config, testing
```

### Pull Request Checklist

- [ ] Follows specifications exactly (zero drift)
- [ ] No duplicate code/types/schemas (SSOT verified)
- [ ] TypeScript strict mode (no `any`)
- [ ] All tests passing
- [ ] Dependency Cruiser passing (no forbidden imports)
- [ ] Documentation updated if API changed
- [ ] Reviewed by maintainer

---

## 📖 Learning Resources

### For New Developers

1. **[PROJECT_MANIFEST.md](./PROJECT_MANIFEST.md)** — Understand the rules
2. **[ARCHITECTURE_BLUEPRINT.md](./ARCHITECTURE_BLUEPRINT.md)** — Learn the architecture
3. **[COMPLETE_BUILD_SPECIFICATION.md](./COMPLETE_BUILD_SPECIFICATION.md)** — Reference for implementation

### For AI Assistants

1. **[.ai-guardrails](./.ai-guardrails)** — Mandatory quick reference
2. **[PROJECT_MANIFEST.md](./PROJECT_MANIFEST.md)** — Complete enforcement rules
3. **Decision Framework** — Always check specs before implementing

---

## 🔐 Security

- **Secret Management:** All secrets managed via typed env (`packages/config`)
- **Encryption:** Integration keys encrypted at rest (AES-GCM)
- **Audit Logging:** All admin actions logged with diff tracking
- **Rate Limiting:** Redis-backed token bucket algorithm
- **CSP:** Strict Content Security Policy enforced
- **CSRF:** Double-submit cookie pattern on admin forms

**Report vulnerabilities:** [security@brainliest.com](mailto:security@brainliest.com)

---

## 📜 License

Proprietary — All Rights Reserved

Copyright © 2025 Brainliest. Unauthorized copying, distribution, or use is strictly prohibited.

---

## 🆘 Support & Contact

- **Documentation Issues:** Open an issue in this repository
- **Implementation Questions:** Check specifications first, then ask
- **Security Concerns:** Email security@brainliest.com
- **General Inquiries:** contact@brainliest.com

---

## 📊 Project Stats

- **Specification Lines:** ~30,000+
- **Planned Tables:** 40+
- **Planned Routes:** 50+
- **Target Lighthouse Score:** 90+
- **Target Test Coverage:** 80%+

---

## 🎯 Success Criteria

- ✅ Zero TypeScript errors
- ✅ Zero ESLint warnings
- ✅ 100% passing tests
- ✅ Lighthouse ≥90 (Performance, A11y, Best Practices, SEO)
- ✅ WCAG 2.1 AA compliant
- ✅ Zero specification drift
- ✅ Zero code duplication

---

**Built with 💙 by the Brainliest team**

*Last Updated: 2025-10-02*
