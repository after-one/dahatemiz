# Phase Plan — DahaMiz Development Roadmap

This roadmap follows the user's master prompt. Phases run in order; complete and verify each phase before starting the
next. Do not provision or deploy paid infrastructure without explicit approval.

## Phase 0 — Product Foundation and Architecture ✅ COMPLETE

**Goal:** Establish a reliable, documented project foundation.

**Deliverables:** pnpm/Turborepo monorepo; Expo mobile and NestJS API; strict TypeScript, lint, formatting and tests;
shared types and design tokens; local development setup; health endpoint; minimal running mobile screen; product,
architecture, backlog, phase, design, asset and security documentation.

**Acceptance criteria:** workspace installs and builds; mobile bundles and opens in a simulator; API health endpoint
works; typecheck, lint and relevant tests pass; environment examples contain no secrets; roadmap and security decisions
are documented. No production cloud resources.

## Phase 1 — Brand Identity, Mascot and Design System

**Goal:** Establish an original, coherent visual identity before implementing the full product UI.

**Deliverables:** compare 2–3 visual directions; select and document one; define semantic color, typography, spacing,
radius, border, elevation, icon, illustration and motion tokens for light and dark appearances; build reusable UI
primitives and preview screens; create original Fatih Abi reference artwork and consistent expression/pose assets; add
environmental illustrations, asset manifest and usage guidance. No municipal branding or implied endorsement.

**Acceptance criteria:** assets are original, reusable and consistent; the mascot reads clearly at mobile sizes; tokens
cover light and dark themes; components use semantic tokens; screenshots have been reviewed for layout, safe areas,
contrast and legibility. No mascot artwork is created before this phase.

## Phase 2 — Onboarding, Authentication and Navigation

**Goal:** Deliver a polished first-use experience and the five primary destinations.

**Deliverables:** splash, welcome and onboarding; permission education; sign-in/sign-up and profile setup; auth-state
architecture with an explicitly labeled development mock when the real backend is unavailable; Turkish localization with
English-ready structure; Home, Map, Report, Challenges and Profile navigation; loading, empty and error states.

**Acceptance criteria:** first-use path is navigable; all five destinations work; Turkish is the default; no screen
implies that mocked identity or data is real; layouts respect safe areas and accessible text/tap targets.

## Phase 3 — Environmental Reporting Experience

**Goal:** Make private environmental reporting clear, respectful and recoverable.

**Deliverables:** camera/gallery selection; incident category; location; optional context and time; draft recovery;
privacy explanation and explicit consent; preview; development submission adapter if the secure backend is not ready;
upload progress and failure states; success acknowledgement; report status and history.

**Acceptance criteria:** flow works end-to-end with clear mock labeling where applicable; consent is explicit; failures
preserve recoverable drafts; success never claims a violation was proven or a government institution received a mock
report; original evidence is never publicly exposed.

## Phase 4 — Backend, Database and GCP Readiness

**Goal:** Build secure, auditable service foundations and prepare deployment without provisioning cloud resources.

**Deliverables:** PostgreSQL/PostGIS schema and migrations; Firebase token verification; user and report APIs; scoped,
short-lived media upload authorization; private evidence/public derivative separation; input validation, RBAC, rate
limiting, audit logging and structured logs; an internal advisory image privacy-transform worker whose outputs require
human review; local containers and Terraform definitions.

**Acceptance criteria:** API integration tests cover authorization and report lifecycle; evidence access is controlled
and auditable; no original evidence has a public URL; local development works without GCP; deployment and paid resources
remain unapplied pending explicit approval and legal/institutional decisions.

## Phase 5 — Social Feed, Media and Map

**Goal:** Enable community discovery while protecting reporters and reported people.

**Deliverables:** approved-public-content model and feed; stories and before/after content; efficient photo/video
rendering; map markers and filters; local discovery; human moderation and content reporting.

**Acceptance criteria:** only separately reviewed public derivatives appear in the feed; public map locations are
approximate; feed and map have loading, empty and error states; media scrolling performs smoothly on supported devices.

## Phase 6 — Gamification, Community and Retention

**Goal:** Encourage sustained positive participation and make verified community impact visible.

**Deliverables:** server-calculated XP and levels; missions, achievements, community teams and leaderboards; push and
in-app notifications; impact views; anti-abuse protections.

**Acceptance criteria:** rewards recognize positive, verified participation; no reward is tied to accusation volume,
surveillance, confrontation, offender identification or punishment; users control notification preferences.

## Phase 7 — Government Dashboard and Moderation

**Goal:** Support authorized institutional review with strict organizational boundaries.

**Deliverables:** separate government and admin dashboards; institutional authentication; organization-scoped roles;
case assignment and timeline; controlled evidence review; moderation queues; audit trail; carefully limited reporter
status updates and permitted reports/exports.

**Acceptance criteria:** sensitive access is authenticated, authorized and audited; organizations cannot access another
organization's cases; public visibility stays separate from evidence access; legal agreements and institutional approval
are prerequisites to real institutional use.

## Phase 8 — Production Polish and Launch Preparation

**Goal:** Assess readiness for a controlled pilot using real-device evidence.

**Deliverables:** accessibility and performance reviews; real-device and end-to-end QA; security testing; crash/error
monitoring; media performance; release configuration; cost review; legal/institutional launch checklist; pilot readiness
report.

**Acceptance criteria:** findings are resolved or clearly documented with owners; device, accessibility, performance and
security evidence is available; no production/legal readiness is claimed without verification and required approvals.

## Phase sequencing rules

1. Start a phase only after the previous phase's acceptance criteria pass and the user explicitly instructs the agent to
   start the next phase.
2. Re-read `AGENTS.md`, `docs/PROGRESS.md` and this document before each phase.
3. Update `docs/PROGRESS.md`, `docs/FEATURE_BACKLOG.md`, and relevant architecture/design decisions after each phase.
4. Never compromise privacy or security to meet a deadline. Never claim a mock, integration or legal status is real
   without evidence.
