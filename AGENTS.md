# AGENTS.md — DahaMiz Platform Agent Handbook

**This is the canonical entry point for any AI coding agent working on this project.** Read this file before touching
any code.

---

## Quick Context

**DahaMiz** is a mobile-first environmental accountability and community platform for Turkey (initial market) with
global ambitions. Citizens report environmental violations through photos/videos. The platform connects community
participation with real-world environmental impact through a polished consumer app experience.

**Stack:** React Native (Expo) · NestJS · TypeScript strict · pnpm + Turborepo · PostgreSQL + PostGIS · GCP · Firebase
Auth

---

## Repository Structure

```
dahamiz/
├── apps/
│   ├── mobile/          # @dahamiz/mobile — Expo React Native, Expo Router
│   ├── api/             # @dahamiz/api — NestJS REST API
│   ├── government-web/  # Phase 7: institution case dashboard
│   └── admin-web/       # Phase 7: moderation and admin dashboard
├── packages/
│   ├── shared-types/    # @dahamiz/shared-types — domain types shared across all apps
│   └── design-tokens/   # @dahamiz/design-tokens — semantic design token primitives
├── services/
│   └── media-worker/    # Local authenticated Python image privacy-transform service (Phase 4)
├── infrastructure/
│   ├── docker/          # Local dev Docker Compose (PostgreSQL + PostGIS)
│   └── terraform/       # Future: GCP Terraform IaC (Phase 4, approval-gated)
├── docs/                # All project documentation
└── scripts/             # Monorepo utility scripts
```

---

## Current Phase

**PHASES 0–7 — COMPLETE · PHASE 8 — PILOT READINESS ASSESSED; PILOT NOT READY**

See `docs/PROGRESS.md` for verification and `docs/PHASE8_READINESS.md` for launch gates. Do not claim production
readiness or process real user/institutional data until P0 gates are closed and approvals are documented.

See `docs/PROGRESS.md` for detailed status.

---

## Before You Start

1. **Read `docs/PROGRESS.md`** — current phase, completed work, blockers, next steps.
2. **Read `docs/PHASE_PLAN.md`** — development phase definitions and acceptance criteria.
3. **Check the current phase** — never skip ahead without explicit instruction.
4. **Inspect the current codebase** — don't assume it matches old documentation.

---

## Agent Responsibilities

### This agent (Antigravity / Gemini / Claude / etc.)

- Technical architecture and decisions
- Repository maintenance and monorepo hygiene
- Mobile app implementation (Expo, Expo Router, TypeScript)
- API implementation (NestJS, PostgreSQL)
- Shared packages and type safety
- Testing and verification
- Build configuration and tooling
- Documentation updates (mandatory at end of each phase)

Phase 1 includes original brand, mascot and illustration production as specified in `docs/PHASE_PLAN.md` and
`docs/ASSET_REQUIREMENTS.md`. Do not create these assets during Phase 0.

---

## Immutable Rules

### Privacy and Security (never negotiate these)

- **Never expose original evidence media to public URLs.** Signed URLs only, short-lived, access-controlled.
- **Never automatically publish newly submitted reports.** Human moderation required.
- **Never implement facial recognition or individual identification.** Explicitly prohibited.
- **Never make automated enforcement decisions.** AI findings are advisory only.
- **Never hard-code secrets.** All secrets via environment variables; production secrets in GCP Secret Manager.
- **Never commit .env files.** Only .env.example files with safe placeholders.
- **Never present AI findings as legal proof.**
- **Report status shared with the reporting user must be legally appropriate** — no investigation details, no personal
  data about third parties.

### Code Quality

- **TypeScript strict mode is non-negotiable.** Never add `// @ts-ignore` or `as any` to work around type errors.
- **No circular dependencies** between packages or modules.
- **Feature-oriented module structure** — group by domain (auth, reports, map, etc.), not by technical layer.
- **No misleading mock data** presented as real institutional or government data.
- **Error states, loading states, and empty states** must be handled explicitly — no silent failures.

### Infrastructure

- **No real cloud resources without explicit approval.** Terraform is prepared but never applied without confirmation.
- **No paid cloud resources committed.** Local development works without GCP.
- **KVKK compliance** must be designed from the start — see `docs/SECURITY_AND_PRIVACY.md`.

---

## Development Commands

```bash
# Install all dependencies
pnpm install

# Start all apps in dev mode
pnpm dev

# Start only the API
pnpm api:dev

# Start only the mobile app
pnpm mobile:start

# Type check all packages
pnpm typecheck

# Lint all packages
pnpm lint

# Run API tests
cd apps/api && pnpm test

# Start local database
docker compose -f infrastructure/docker/docker-compose.yml up -d
```

---

## Mobile App Architecture

**Expo SDK 58 · React Native 0.88 · React 19**

```
apps/mobile/
├── app/                 # Expo Router file-based routes
│   ├── _layout.tsx      # Root layout (providers, splash)
│   ├── index.tsx        # Root entry alias to the welcome route
│   ├── welcome.tsx      # First-use welcome; sign-out destination
│   ├── brand-preview.tsx # Phase 1 design catalog
│   ├── (tabs)/          # Phase 2: Main 5-tab navigation
│   │   ├── _layout.tsx
│   │   ├── home.tsx     # Home (/home avoids a root index route collision)
│   │   ├── map.tsx
│   │   ├── report.tsx
│   │   ├── challenges.tsx
│   │   └── profile.tsx
│   ├── onboarding.tsx   # Permission education and privacy basics
│   ├── auth.tsx         # Explicit development demo authentication
│   ├── profile-setup.tsx
│   └── report/          # Phase 3: Report creation flow
├── src/
│   ├── features/        # Feature domain modules
│   │   ├── auth/
│   │   ├── home/
│   │   ├── reports/
│   │   ├── map/
│   │   ├── missions/
│   │   ├── profile/
│   │   └── settings/
│   ├── components/      # Reusable UI primitives
│   ├── hooks/           # Shared hooks
│   ├── lib/             # API client, i18n, store
│   └── theme/           # Theme context and token consumers
└── assets/              # Static assets (images, fonts)
```

**Feature domains (created in Phase 2):** auth · onboarding · home · feed · reports · map · missions · gamification ·
profile · notifications · settings

---

## API Architecture

**NestJS 10 · TypeScript · REST · OpenAPI**

```
apps/api/
└── src/
    ├── config/          # Environment-based configuration
    ├── health/          # Health check endpoint
    ├── auth/            # Phase 4: Firebase token verification
    ├── reports/         # Phase 4: Report CRUD and lifecycle
    ├── users/           # Phase 4: User profile management
    ├── media/           # Phase 4: Signed upload URL generation
    └── common/          # Guards, filters, decorators, pipes
```

API versioning: `/api/v1/` Swagger docs (dev only): `/api/v1/docs`

---

## Shared Packages

### @dahamiz/shared-types

TypeScript types shared between mobile and API:

- Domain enums (IncidentCategory, ReportStatus, UserRole, etc.)
- API request/response shapes (ApiHealthResponse, etc.)
- Domain model interfaces (UserProfile, PublicReportSummary, etc.)

**Never import business logic here — types only.**

### @dahamiz/design-tokens

Semantic design primitives:

- `lightTheme` and `darkTheme` — complete color token objects
- `fontSizes`, `fontWeights`, `fontFamilies`
- `spacing`, `radii`, `shadows`, `borders`
- `durations`, `easings`
- `iconSizes`

**The mobile app wraps these in `ThemeProvider`.**

---

## Mascot Architecture (Phase 1)

The "Fatih Abi" mascot is a warm neighborhood sanitation worker character.

A `MascotSlot` component must:

- Accept `state` prop (welcome, happy, proud, celebrating, thinking, explaining, encouraging, concerned, neutral)
- Accept `size` prop (sm, md, lg, xl)
- Accept optional `speechBubble` text prop
- Show a tasteful neutral placeholder until real Codex art is plugged in
- Support Rive/Lottie/static image swap without changing consumer code
- Include accessible description string

See `docs/ASSET_REQUIREMENTS.md` for full asset specifications.

---

## Documentation Files

| File                           | Purpose                                          |
| ------------------------------ | ------------------------------------------------ |
| `AGENTS.md`                    | **This file** — canonical agent entry point      |
| `docs/PRODUCT_VISION.md`       | Full product vision and goals                    |
| `docs/FEATURE_BACKLOG.md`      | All features by domain, phase, and status        |
| `docs/PHASE_PLAN.md`           | Phase definitions and acceptance criteria        |
| `docs/PROGRESS.md`             | Current phase status, completed work, next steps |
| `docs/ARCHITECTURE.md`         | Technical architecture decisions                 |
| `docs/DESIGN_SYSTEM.md`        | Design system documentation                      |
| `docs/ASSET_REQUIREMENTS.md`   | Asset specifications for Codex                   |
| `docs/SECURITY_AND_PRIVACY.md` | Privacy/security constraints and KVKK notes      |
| `docs/DECISIONS.md`            | Architecture decision records                    |
| `README.md`                    | Developer onboarding guide                       |
