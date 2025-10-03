> **Guardrail Notice**  
> This changelog supplements the canonical specifications. Consult [.ai-guardrails](.ai-guardrails), [PROJECT_MANIFEST.md](PROJECT_MANIFEST.md), [COMPLETE_BUILD_SPECIFICATION.md](COMPLETE_BUILD_SPECIFICATION.md), and [ARCHITECTURE_BLUEPRINT.md](ARCHITECTURE_BLUEPRINT.md) before documenting changes. See [docs/architecture/guardrails.md](docs/architecture/guardrails.md) for governance.

## Related Documents
- [.ai-guardrails](.ai-guardrails)
- [PROJECT_MANIFEST.md](PROJECT_MANIFEST.md)
- [COMPLETE_BUILD_SPECIFICATION.md](COMPLETE_BUILD_SPECIFICATION.md)
- [ARCHITECTURE_BLUEPRINT.md](ARCHITECTURE_BLUEPRINT.md)
- [docs/architecture/guardrails.md](docs/architecture/guardrails.md)

# Changelog

All notable changes to the Brainliest project specifications and implementation will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

---

## [2.2.5] - 2025-10-03

### Added
- Admin API route `/api/explanations` and the accompanying log page in `apps/admin` so operators can review recently generated AI explanations backed by Drizzle.

### Changed
- Replaced the AI explanation stub pipeline with the Drizzle repository, propagating language/version metadata through the shared adapters, web bootstrap, and server helper.
- Extended the explanation repository contract with a `listRecent` helper for reporting, refreshed exports, and updated unit tests to cover the new shape.
- Added pagination metadata to `/api/explanations`, updating the admin activity view to consume the endpoint and paginate results from the shared repository.

### Tests
- `pnpm lint --filter @brainliest/db`
- `pnpm --filter @brainliest/db typecheck`
- `pnpm test --filter @brainliest/db`

## [2.2.4] - 2025-10-02

### Added
- Introduced `@brainliest/db` workspace package with Drizzle ORM schema covering taxonomy, assessment, user, and admin tables with enums and relations.
- Added Drizzle CLI configuration, migration scaffolding, and Vitest coverage to validate enum/default mappings.
- Exported repository interfaces and pagination helpers so services can adopt the new database layer immediately.
- Hooked the AI explanation API into demo flows by sourcing questions from the Drizzle repository and wiring the Searchable Select/Command Palette demos to `/api/ai/explanations`.
- Added practice server action scaffolding that reuses the shared AI service configuration for upcoming session flows.
- Extended Playwright composite specs to assert the explanation summaries produced by the new demos.
- Created a reusable practice UI kit (`PracticeLayout`, `PracticeExamCard`, `PracticeQuestionCard`, `PracticeOptionList`, `PracticeFillBlank`, `PracticeExplanationCard`, `PracticeNavigation`, `PracticePageHeader`) and adopted it in the new `/practice/[examSlug]` scaffold.
- Practice page now resolves exam/question data through Drizzle repositories with graceful fallbacks so the session shell runs ahead of full backend integration.

## [2.2.3] - 2025-10-02

### Added
- Shared AI explanation orchestration (`packages/shared/src/services/ai-explanation.ts`) with configurable rate limiting, question lookup, and analytics tracking hooks.
- Zod schemas for AI explanation requests/responses published via `@brainliest/shared` for consistent validation across apps.
- Next.js API route `/api/ai/explanations` in the web app, backed by the shared service with fixture-driven question lookup for local development.
- Admin API route `/api/cache/invalidate` bridging to shared cache invalidation helpers for exams and categories.

### Changed
- Bootstrapped web-side AI configuration helper to ensure Radix-driven composites can call the shared service without duplicating setup logic.
- Added schema unit tests to keep `@brainliest/shared` coverage aligned with new exports.

## [2.2.2] - 2025-10-02

### Added
- Cleanup utility `scripts/cleanup-tests-demos.js` with dry-run safety to remove demo routes and test/story files for production-only deployments.
- Workspace script alias `pnpm cleanup:tests-demos` documented in contributing guide.
- Bootstrapped `@brainliest/config` (env schemas, redis keys, feature flags, routes) and `@brainliest/shared` (domain enums/models, analytics registry) with initial unit coverage.

### Changed
- Rebuilt `SearchableSelect` with Radix Popover + `cmdk`, delivering accessible filtering, looping keyboard navigation, and updated stories/tests.
- Refined `CommandPalette` to stabilize layout via `cmdk` best practices (stable grouping, min-height list, consistent keyboard handling).
- Migrated primitive `Select` to Radix Select with keyboard navigation, menu virtualization, and form-friendly hidden input support.
- Added semantic toast variants (success, warning, error, info) with styled actions/close affordances and updated stories/tests.
- Updated `Tooltip` to export `TooltipProvider` and removed the per-instance provider overhead; demos/tests now wrap multiple tooltips with a shared provider.

## [2.2.1] - 2025-10-02

### Fixed
- **Button component** — Improved implementation
  - Changed default `type` from implicit to explicit `type="button"`
  - Enhanced spinner integration with proper size mapping (sm→xs, md→sm, lg→md)
  - Added `aria-busy` attribute for loading states
  - Improved disabled state handling with `resolvedDisabled` boolean
  - Wrapped icon/spinner content in semantic spans for better layout control
  - Exported `buttonVariants` for potential composition patterns
  - Updated gap from variant-specific to base class `gap-2`

- **Checkbox component** — Enhanced accessibility
  - Replaced `Math.random()` ID generation with React's `useId()` hook (SSR-safe)
  - Added proper `aria-describedby` linking description to input
  - Used nullish coalescing (`??`) instead of OR operator for ID fallback
  - Changed `label` and `description` types from `string` to `React.ReactNode` for flexibility
  - Improved spacing from `ml-3` to `gap-3` on flex container
  - Added `mt-1` margin to description for better visual hierarchy

- **Radio component** — Enhanced accessibility and SSR safety
  - Replaced `Math.random()` ID generation with React's `useId()` hook
  - Added proper `aria-describedby` for description linking
  - Ensured `name` prop is properly passed through for radio grouping
  - Changed `label` and `description` to `React.ReactNode` type
  - Consistent spacing improvements matching Checkbox component

- **Switch component** — Complete Radix UI rewrite
  - Migrated from custom button implementation to `@radix-ui/react-switch`
  - Uses `SwitchPrimitive.Root` and `SwitchPrimitive.Thumb` for proper semantics
  - Correct ref type changed to `HTMLButtonElement` (Radix switch renders button)
  - Proper state management via `data-[state=checked]` and `data-[state=unchecked]`
  - Enhanced accessibility with `aria-labelledby` and `aria-describedby`
  - Integrated `@radix-ui/react-label` for proper label association
  - Removed manual state tracking - delegated to Radix primitive
  - Improved disabled state styling with `opacity-60`

- **Card component** — Major restructuring
  - Renamed `cardVariants` to `cardContainerVariants` for clarity
  - Split styling concerns: container variants (border, shadow) vs. padding
  - Created `paddingMap` and `sectionPaddingMap` constant objects with type safety
  - Introduced `sectionPadding` prop for independent header/footer padding control
  - Enhanced default variant with better shadow: `shadow-sm` → `hover:shadow-md`
  - Updated border radius from `rounded-lg` to `rounded-xl` for modern look
  - Proper TypeScript typing with `PaddingKey` and `SectionPaddingKey` types
  - Improved conditional rendering with ternary expressions instead of `&&`
  - Exported `cardContainerVariants` for potential composition

- **useClipboard hook** — Enhanced implementation
  - Added explicit `UseClipboardOptions` and `UseClipboardResult` interfaces
  - Proper return type: `UseClipboardResult` with typed `copy` function
  - Memory leak prevention with `timeoutRef` and cleanup in `useEffect`
  - Clear previous timeout before setting new one to prevent multiple timeouts
  - Explicit parameter type `value: string` in copy function
  - Returns `Promise<boolean>` for success/failure feedback

- **useDisclosure hook** — Added proper typing
  - Created `UseDisclosureReturn` interface documenting all return values
  - Explicit return type annotation for better IDE support
  - Consistent naming: `open`, `close`, `toggle` plus legacy `onOpen`, `onClose`, `onToggle` aliases

- **Input component** — Enhanced accessibility
  - Added `aria-invalid={isError}` for error states
  - Exported `inputVariants` for composition
  - Reordered addon div classes for consistency

- **Select component** — Enhanced accessibility
  - Added `aria-invalid={isError}` for error states
  - Exported `selectVariants` for composition

- **Textarea component** — Enhanced accessibility
  - Added `aria-invalid={isError}` for error states
  - Exported `textareaVariants` for composition

- **Grid component** — Improved TypeScript strictness
  - Changed variant keys from numbers to strings ('1', '2', etc.) for proper CVA typing
  - Prevents TypeScript errors with numeric property keys

- **Stack component** — Improved TypeScript strictness
  - Changed gap variant keys from numbers to strings for proper CVA typing

- **Icon component** — NEW primitive component
  - Built with lucide-react for consistent icon system
  - Type-safe icon names with `IconName` type export
  - Supports all CVA sizes (xs, sm, md, lg, xl)
  - Accessible with proper aria-hidden and role attributes
  - Fully typed and exported from package index

- **useFocusTrap hook** — NEW accessibility hook
  - Traps focus within a container (modals, dialogs)
  - Exported from package index

### Added
- **Dependencies**
  - Radix primitives (`@radix-ui/react-dialog`, `@radix-ui/react-dropdown-menu`, `@radix-ui/react-popover`, `@radix-ui/react-tooltip`, `@radix-ui/react-command`, `@radix-ui/react-switch`) adopted as the standard UI foundation
  - `lucide-react` ^0.368.0 for Icon component
  - Fixed `dependency-cruiser` package name (was incorrectly `depcruise`)
- **Storybook coverage** — Added CSF stories for primitives, layout, and feedback components to aid visual regression and design review
- **Unit tests** — Added Vitest coverage for primitives, layout, and feedback components to satisfy >80% coverage requirement for new UI modules
- **Form library** — Implemented `Form`, `FormField`, `FormLabel`, `FormError`, and `FormSection` with full accessibility wiring, tests, and stories
- **Navigation suite** — Added `Breadcrumbs`, `Sidebar`, `Header`, `Footer`, `Menu`, and `MenuButton` with co-located tests and Storybook demos
- **Composite refresh** — Rebuilt `Modal`, `Dialog`, `Dropdown`, `Tooltip` using Radix primitives with exhaustive tests, stories, and demos
- **Interactive controls** — Delivered `Pagination`, `SearchableSelect`, and `CommandPalette` composites with typed APIs, stories, tests, and demo routes
- **Navigation & layout demos** — Added Radix-backed Tabs, Accordion, Popover with co-located tests/stories and new demo pages
- **Feedback** — Introduced Radix Toast primitives (provider, viewport, actions) with tests, Storybook story, and dedicated demo route
- **Testing** — Added Playwright configuration and demo-route E2E coverage for composites and toast

### Changed
- Standardised composite implementations on Radix UI primitives (`Dialog`, `DropdownMenu`, `Popover`, `Tooltip`, `Command`) to unify accessibility behaviour.

### Removed
- `@headlessui/react` dependency (all components migrated to Radix equivalents).

### Fixed (TypeScript)
- **Input & Select components** — Resolved `size` property conflict with native HTML attributes
  - Used `Omit<React.InputHTMLAttributes, 'size'>` to prevent conflict
  - CVA size variants now work properly without TypeScript errors
- **tsconfig.json** — Removed conflicting `@testing-library/jest-dom` from types array
  - Prevents conflict between Jest and Vitest global types
- **turbo.json** — Updated from deprecated `pipeline` to `tasks` field
- **package.json** — Fixed `depcruise` → `dependency-cruiser` package name

### Changed
- All updated components maintain backward compatibility with existing API
- Improved SSR safety across Checkbox, Radio, and Switch with `useId()`
- Enhanced accessibility attributes across all form components
- Better TypeScript strictness with explicit types instead of implicit inference
- **Dependencies installed successfully** — 769 packages installed with pnpm

---

## [2.2.0] - 2025-10-02

### Added
- **UI Component Library Implementation** (`packages/ui/`)
  - Monorepo structure with pnpm workspaces
  - Design system tokens at `packages/ui/src/theme/tokens.ts` (SSOT)
  - Primitive components: Button, Input, Textarea, Select, Checkbox, Radio, Switch, Badge, Avatar, Spinner, Link
  - Layout components: Container, Grid, Stack, Divider, Card, Section
  - Feedback components: Alert, Progress, Skeleton, EmptyState
  - Custom hooks: useMediaQuery, useBreakpoint, useClipboard, usePagination, useDisclosure, useKeyboardShortcut
  - Utility functions: cn (className merger with tailwind-merge)
  - Full TypeScript support with strict mode, zero `any` usage
  - Class Variance Authority (CVA) for type-safe variant management
  - Mobile-first responsive design with breakpoints (sm, md, lg, xl, 2xl)
  - Accessibility features: ARIA labels, keyboard navigation, focus management
  - Component exports at `packages/ui/src/index.ts`

- **Next.js 15 Applications**
  - `apps/web` — Student-facing app with App Router (port 3000)
  - `apps/admin` — Admin portal with App Router (port 3001)
  - Shared Tailwind config extending UI package tokens
  - Global CSS with design system variables

- **Demo Page** (`apps/web/src/app/demo/`)
  - Comprehensive component showcase with interactive examples
  - All primitives, layouts, and feedback components demonstrated
  - Responsive design examples
  - Isolated in `/demo` folder for easy removal

- **Dependencies**
  - @tailwindcss/forms plugin for consistent form styling
  - class-variance-authority for variant management
  - tailwind-merge + clsx for className merging
  - Radix UI primitives (accordion, dialog, dropdown, tabs, toast, tooltip, etc.)

### Fixed
- **Card component** — Corrected `cardVariants` usage (was incorrectly passing `className` as variant argument)
  - Line 40: Changed from `cn(cardVariants({ variant, className }))` to `cn(cardVariants({ variant }), className)`
  - Line 47: Removed incorrect `cardVariants({ padding })` usage, replaced with conditional padding classes
  - Now correctly separates variant styling from padding and custom className

### Changed
- Updated `packages/ui/package.json` with correct build configuration and dependencies
- Added @tailwindcss/forms to devDependencies
- Configured tsup for ESM/CJS dual bundle output

### Verified
- All components follow correct cn/cva pattern: `className={cn(componentVariants({ ...variantProps }), className)}`
- Button, Input, Progress, Spinner, Badge, Divider components verified as correct
- Zero SSOT violations — all design tokens centralized in `tokens.ts`
- Zero TypeScript errors in component implementations
- All exports properly typed and documented

---

## [2.1.0] - 2025-10-02

### Added
- **UI_COMPONENT_SPECIFICATION.md** — Complete UI component library specification
  - 100% modular, reusable component architecture
  - Design system tokens (colors, spacing, typography, shadows)
  - Component registry (SSOT for all UI components)
  - Primitive components (Button, Input, Card, etc.)
  - Composite components (Modal, SearchableSelect, DataGrid)
  - Responsive patterns (mobile-first approach)
  - Accessibility requirements (WCAG 2.1 AA)
  - Component testing requirements (>80% coverage)
  - Storybook story templates
  - Pre-creation checklist (search existing before creating)
  - Forbidden component patterns (with correct alternatives)
  - Component location rules by type

### Changed
- Updated `PROJECT_MANIFEST.md` to include UI_COMPONENT_SPECIFICATION.md in canonical documents
- Updated `.ai-guardrails` with UI component creation rules
- Added UI Components to Specification Coverage Matrix
- Enhanced forbidden/required actions for component creation

---

## [2.0.0] - 2025-10-02

### Added
- **PROJECT_MANIFEST.md** — Master index with comprehensive AI guardrails and cross-reference system
- **COMPLETE_BUILD_SPECIFICATION.md** — Line-by-line implementation contract with extensive technical details
- **ARCHITECTURE_BLUEPRINT.md** — High-level architecture guide with diagrams and patterns
- **.ai-guardrails** — Quick reference file for AI assistants (mandatory reading order)
- **CHANGELOG.md** — This file, tracking all specification changes
- **README.md** — Project overview with prominent AI warnings
- Cross-reference headers in all canonical documents pointing to PROJECT_MANIFEST.md
- Document authority hierarchy (MANIFEST → SPECIFICATION → BLUEPRINT)
- Zero-drift enforcement rules for AI assistants
- Zero-duplication enforcement with SSOT registry
- Forbidden document creation list
- Allowed documentation activities list
- Security guardrails for secret management
- Forbidden code pattern examples
- File creation registry with allowed/forbidden extensions
- Quality gate automation checklist
- Escalation protocol for AI decision-making
- Schema & Type Registry with canonical locations
- Document Coverage Matrix mapping topics to sections
- Dependency rule enforcement table
- Testing guardrails with coverage requirements
- Version control and change management process
- **DEEP AUDIT CHECKLIST** — Comprehensive pre-implementation audit (60+ items)
- **PERMANENT PROJECT MEMORY** section in PROJECT_MANIFEST.md
- **Session Start/End Protocols** for AI assistants
- **Automated Audit Commands** (madge, jscpd, ts-prune, depcruise)
- **Severity Levels** for audit findings (Critical/High/Medium/Low)
- **Zero Tolerance Violations** list (immediate task failure conditions)
- **Working Memory Checklist** for every implementation session
- **Forbidden Patterns** code examples (with correct alternatives)
- Deep audit requirements covering:
  - Logic issues and code quality
  - Architecture and dependencies
  - Type safety (zero `any` usage)
  - Schema validation
  - URL and route handling
  - Performance and security
  - Documentation and exports
  - Circular dependencies
  - Code duplication
  - Race conditions
  - SSOT violations
  - Unwanted coupling

### Changed
- Updated all document versions to 2.0.0 LOCKED
- Added 🔒 LOCKED status indicators to all canonical documents
- Standardized document headers with cross-reference blocks
- Enhanced naming conventions with explicit examples

### Security
- Added encryption guardrails for integration keys
- Defined secret management rules (never hardcode, always use typed env)
- Specified forbidden security patterns

---

## [1.0.0] - 2025-10-02

### Added
- Initial ARCHITECTURE_BLUEPRINT.md with complete system design
- Database schema definitions (40+ tables)
- Redis keyspace strategy
- API route specifications
- AI integration architecture
- Security & compliance guidelines
- Testing strategy
- Deployment procedures

---

## Notes

- **Version 2.0.0** represents the establishment of the comprehensive governance framework
- All documents are now LOCKED and require explicit user approval for modifications
- AI assistants MUST follow the guardrails defined in PROJECT_MANIFEST.md
- Future changes will be tracked in this changelog with proper version increments
