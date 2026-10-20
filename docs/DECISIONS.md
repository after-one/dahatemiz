# Architecture Decision Records (ADR)

Architectural decisions are recorded here for multi-agent continuity. When changing an ADR, keep the original and add a
"superseded by" note.

Format: Status can be ACCEPTED, REJECTED, SUPERSEDED, DEPRECATED.

---

## ADR-001: pnpm + Turborepo as Monorepo Tooling

**Date:** 2026-10-18 **Status:** ACCEPTED

**Context:** Need a monorepo solution that handles workspace linking, build caching, and parallel execution across
mobile, API, web dashboards, and shared packages.

**Decision:** Use **pnpm workspaces** for package management and **Turborepo** for build orchestration.

**Rationale:**

- pnpm is faster than npm/yarn, uses content-addressable storage, avoids phantom dependencies
- Turborepo provides build caching and parallel execution with minimal configuration
- Both are stable, widely adopted, and work well with both Node.js and React Native toolchains
- pnpm v10 available on the developer's machine (verified)

**Alternatives considered:**

- Nx: More complex configuration, heavier abstraction
- Yarn Workspaces + Lerna: Legacy, more fragile
- npm workspaces: Slower, less efficient storage

**Trade-offs:**

- pnpm has some quirks with Expo (handled via `.npmrc` hoisting if needed)
- Turborepo remote caching requires a token for full CI benefit (not blocking for Phase 0)

---

## ADR-002: Expo SDK 58 (React Native 0.88, React 19)

**Date:** 2026-10-18 **Status:** ACCEPTED

**Context:** Need to pick an Expo SDK version for the mobile app foundation.

**Decision:** Use **Expo SDK 58** (latest stable as of 2026-10-18), which includes React Native 0.88 and React 19.

**Rationale:**

- Latest SDK = longest support window
- React Native 0.88 includes the New Architecture enabled by default
- React 19 brings concurrent features useful for future performance work
- Starting fresh — no legacy code to migrate

**Alternatives considered:**

- SDK 57 (for Expo Go compatibility): Rejected — development build workflow is preferable; Expo Go is for demos only
- SDK 52 / older: Rejected — outdated, fewer features, shorter support window

**Trade-offs:**

- SDK 58 is very new — some third-party libraries may not have updated yet
- Peer dependency warnings may appear during install (acceptable, logged in PROGRESS.md)
- React 19 + React Native may have edge-case issues (monitor during Phase 1)

---

## ADR-003: Modular Monolith Before Microservices

**Date:** 2026-10-18 **Status:** ACCEPTED

**Context:** Need a backend architecture for an early-stage startup.

**Decision:** Start with a **modular NestJS monolith**. Feature domains are separated as NestJS modules but run in a
single process.

**Rationale:**

- Early-stage startups rarely need the operational complexity of microservices
- Easier to reason about, debug, and deploy
- NestJS modules provide clean domain separation that can be extracted later
- Single Cloud Run service is cheaper and simpler to operate

**Boundaries for reconsideration:**

- Media processing worker (already planned as a separate service — CPU-intensive workloads justify isolation)
- AI inference (separate Python service — language boundary justifies isolation)
- Extract a specific domain only when concrete operational evidence demands it

**Never extract prematurely:**

- Don't create microservices speculatively
- Don't add Kafka, gRPC, or service meshes without documented evidence of need

---

## ADR-004: NestJS with CommonJS Output

**Date:** 2026-10-18 **Status:** ACCEPTED

**Context:** NestJS uses decorators which require `emitDecoratorMetadata: true` and `experimentalDecorators: true`.
These work best with CommonJS output in Node.js.

**Decision:** API `tsconfig.build.json` targets **CommonJS** (`"module": "CommonJS"`).

**Rationale:**

- NestJS decorator-based DI is designed for CommonJS
- ESM support for NestJS decorators is still experimental and has known issues
- Node.js 20+ handles CommonJS well
- `tsx` is used for dev server — it handles TypeScript transpilation directly

**Note:** Shared packages (design-tokens, shared-types) use `moduleResolution: "bundler"` and ESM-compatible exports —
they work with both CommonJS and ESM consumers.

---

## ADR-005: Design Tokens as a Separate Package

**Date:** 2026-10-18 **Status:** ACCEPTED

**Context:** Design tokens need to be available in the mobile app. Options: inline in mobile, shared package, or
generated from a design tool.

**Decision:** Create a dedicated `@dahamiz/design-tokens` package in the monorepo.

**Rationale:**

- Phase 7 will add web dashboards — they need the same tokens
- Keeps design system changes isolated to one place
- Makes Codex's design handoff work cleaner (Codex updates the package, consumers automatically get the changes)
- No circular dependencies (packages never import apps)

**Future:** If the design evolves to use a tool like Style Dictionary, the package structure supports it without
changing consumers.

---

## ADR-006: Shared Types Package Strategy

**Date:** 2026-10-18 **Status:** ACCEPTED

**Context:** API and mobile app need to share type definitions for API request/response shapes and domain models.

**Decision:** Create `@dahamiz/shared-types` as a **types-only** package. No runtime logic. No class implementations.
Pure TypeScript interfaces, types, and enums.

**Rationale:**

- Prevents drift between what the API returns and what the mobile app expects
- Single source of truth for domain vocabulary
- Enums (IncidentCategory, ReportStatus, etc.) compile to runtime values — safely shareable
- Can be used by web dashboards in Phase 7 too

**Rules:**

- No imports from NestJS, React, or React Native in this package
- No business logic
- No class decorators
- Only `interface`, `type`, `enum`, and `const` declarations

---

## ADR-007: Firebase Authentication

**Date:** 2026-10-18 **Status:** ACCEPTED; API and mobile implementation in Phase 4

**Context:** Platform needs user authentication. Options: custom auth, Auth0, Firebase Auth, Supabase Auth.

**Decision:** Use **Firebase Authentication** as the identity provider.

**Rationale:**

- Managed service — no auth infrastructure to maintain
- Excellent React Native SDK (expo-firebase or Firebase JS SDK)
- Firebase Admin SDK verifies and revocation-checks ID tokens in the NestJS API
- Supports phone number auth (important for Turkish market)
- Social logins available for future expansion
- Firebase Auth Emulator can support local development without a real cloud project

**Security model:**

- Firebase issues JWTs to mobile clients
- NestJS API verifies JWTs using Firebase Admin SDK
- No custom token implementation required
- Only Firebase client configuration may use `EXPO_PUBLIC_*`; service-account credentials stay server-side

**Current status:** The mobile app uses Firebase JS Auth email/password flows with SecureStore-backed persistence; the
NestJS API verifies and revocation-checks ID tokens. Local development uses the Auth Emulator. A real Firebase project
is not configured, and phone/SMS authentication remains future work.

---

## ADR-008: Evidence Storage Strategy

**Date:** 2026-10-18 **Status:** ACCEPTED; API signing implementation in Phase 4

**Context:** Platform must store potentially sensitive evidence media. Privacy and legal compliance are critical.

**Decision:** Use **GCP Cloud Storage with short-lived signed URLs**. Two separate buckets:

1. Private evidence bucket — never publicly accessible, audit-logged
2. Public media bucket — only approved/transformed derivatives, never originals

**Rules:**

- Mobile app never receives a permanent public URL to original evidence
- Authenticated API returns a 15-minute V4 PUT URL scoped to one private object, content type and create-only generation
  precondition
- API verifies the upload completed before associating media with a report
- Original evidence only accessible by authorized backend processes
- File-type, size, and content validation before acceptance
- Separate access control policies per bucket

**KVKK note:**

- Bucket region must be confirmed after legal review; Terraform requires a region input and has no default
- See `docs/SECURITY_AND_PRIVACY.md`

**Current status:** Signed URL creation and uploaded-object metadata checks are implemented behind configuration. No
bucket exists yet; local API tests verify that upload authorization fails closed when private storage is unavailable.

---

## ADR-009: No Facial Recognition or Individual Identification

**Date:** 2026-10-18 **Status:** ACCEPTED (immutable)

**Context:** AI/ML could theoretically identify individuals in uploaded media.

**Decision:** **Prohibit facial recognition, license plate-based identification for enforcement, and any automated
identification of alleged offenders.** This is a hard architectural constraint, not a deferred feature decision.

**Rationale:**

- Turkish KVKK prohibits biometric data processing without explicit consent
- Platform is not designed to be a surveillance tool
- AI findings must be advisory only — not proof of guilt
- Automated identification would create significant legal liability

**This decision cannot be reversed without explicit legal review and documented regulatory authorization.**

---

## ADR-010: AI findings are Advisory Only

**Date:** 2026-10-18 **Status:** ACCEPTED (immutable)

**Context:** AI/ML will be used for media quality analysis and environmental classification.

**Decision:** **AI findings are advisory and must not be used as the sole basis for legal enforcement decisions.** Human
review is required for any consequential action.

**This applies to:**

- Content classification (what type of violation it is)
- Image/video quality scoring
- Content moderation decisions
- Privacy transformation results

**Rationale:**

- Legal liability protection
- Ethical obligation
- Turkish legal framework for AI-assisted decisions
- Platform mission (accountability, not automated punishment)

---

## ADR-011: Mahalle Editoryali Visual Identity

**Date:** 2026-10-19 **Status:** ACCEPTED

**Context:** Phase 1 compared three visual directions for a consumer environmental accountability platform in Türkiye.

**Decision:** Adopt **Mahalle Editoryali** for the initial product identity: warm limestone surfaces, forest-green ink,
muted saffron accents, clear system sans typography, and original editorial illustrations of neighborhood life.

**Rationale:** It balances warmth and dignity with the clarity needed for civic reporting. Its restrained palette and
human scenes avoid generic eco-game conventions and official-looking government interfaces.

**Alternatives considered:** Civic Cartography (too technical and map-led for the first-use experience) and Urban
Botanics (less legible at small mobile sizes and less suited to neutral reporting states).

**Trade-offs:** The identity relies on careful contrast and restrained use of saffron; future product screens must
continue to use semantic tokens rather than pulling values directly from the palette.
