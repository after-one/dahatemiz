# Technical Architecture — DahaMiz Platform

---

## System Overview

```
┌─────────────────────────────────────────────────────────────────┐
│                    DahaMiz Platform                              │
│                                                                   │
│  ┌──────────────┐    ┌──────────────────────────────────────┐    │
│  │ Mobile App   │    │           Backend                     │    │
│  │ (Expo RN)    │◄──►│  NestJS API (Cloud Run)               │    │
│  │              │    │                                       │    │
│  │ Expo Router  │    │  ┌──────────┐  ┌─────────────────┐   │    │
│  │ TanStack Q   │    │  │ AuthGuard│  │ Reports Module  │   │    │
│  │ Zustand      │    │  │(Firebase)│  │ Users Module    │   │    │
│  │ RHF + Zod    │    │  │          │  │ Media Module    │   │    │
│  └──────────────┘    │  └──────────┘  └─────────────────┘   │    │
│                      │                                       │    │
│  ┌──────────────┐    │  ┌─────────────────────────────────┐ │    │
│  │ Gov Dashboard│    │  │       PostgreSQL + PostGIS       │ │    │
│  │ (Next.js)    │◄──►│  │       (Cloud SQL)                │ │    │
│  └──────────────┘    │  └─────────────────────────────────┘ │    │
│                      └──────────────────────────────────────┘    │
│  ┌──────────────┐                                                 │
│  │ Admin Panel  │    ┌──────────────────────────────────────┐    │
│  │ (Next.js)    │    │  Cross-cutting Services               │    │
│  └──────────────┘    │  Firebase Auth · Cloud Storage        │    │
│                      │  Cloud Tasks · Pub/Sub · Secret Mgr   │    │
│                      └──────────────────────────────────────┘    │
└─────────────────────────────────────────────────────────────────┘
```

---

## Mobile Application Architecture

### Technology Decisions

| Concern              | Solution                         | Rationale                                  |
| -------------------- | -------------------------------- | ------------------------------------------ |
| Framework            | Expo SDK 58 / React Native 0.88  | Managed workflow, faster iteration         |
| Navigation           | Expo Router (file-based)         | Type-safe routes, code splitting ready     |
| Server state         | TanStack Query v5                | Caching, background refetch, offline       |
| Client state         | Zustand v5                       | Minimal, simple, TypeScript-first          |
| Forms                | React Hook Form + Zod            | Performance, validation composability      |
| Animation            | React Native Reanimated 3        | Smooth 60fps animations on UI thread       |
| Secure storage       | Expo SecureStore                 | Keychain/Keystore backed, not AsyncStorage |
| Internationalization | i18next + react-i18next          | Mature, tree-shakeable, namespace support  |
| Icons                | Lucide (via lucide-react-native) | Consistent, maintained, customizable       |

### Feature-Oriented Directory Structure

```
apps/mobile/
├── app/                    # Expo Router routes (keep lightweight)
│   ├── _layout.tsx         # Root: providers, splash, theme
│   ├── index.tsx           # Entry / redirect
│   ├── (auth)/             # Unauthenticated: login, onboarding
│   │   ├── _layout.tsx
│   │   ├── welcome.tsx
│   │   ├── onboarding.tsx
│   │   └── sign-in.tsx
│   ├── (tabs)/             # Authenticated: main 5-tab navigation
│   │   ├── _layout.tsx
│   │   ├── index.tsx       # Home feed
│   │   ├── map.tsx
│   │   ├── report.tsx
│   │   ├── challenges.tsx
│   │   └── profile.tsx
│   └── report/             # Report creation flow (modal/stack)
│       ├── _layout.tsx
│       ├── media.tsx
│       ├── category.tsx
│       ├── location.tsx
│       ├── description.tsx
│       ├── privacy.tsx
│       ├── preview.tsx
│       └── success.tsx
│
├── src/
│   ├── features/           # Domain-specific feature modules
│   │   ├── auth/
│   │   │   ├── api.ts      # Auth API calls
│   │   │   ├── store.ts    # Auth Zustand store
│   │   │   ├── hooks.ts    # useAuth, useUser
│   │   │   └── types.ts    # Feature-local types (if any)
│   │   ├── reports/
│   │   │   ├── api.ts
│   │   │   ├── store.ts    # Draft persistence
│   │   │   ├── hooks.ts
│   │   │   └── types.ts
│   │   ├── home/
│   │   ├── map/
│   │   ├── missions/
│   │   ├── gamification/
│   │   ├── profile/
│   │   ├── notifications/
│   │   └── settings/
│   │
│   ├── components/         # Reusable UI primitives (no feature logic)
│   │   ├── Button.tsx
│   │   ├── Card.tsx
│   │   ├── Text.tsx
│   │   ├── TextInput.tsx
│   │   ├── Icon.tsx
│   │   ├── Badge.tsx
│   │   ├── Avatar.tsx
│   │   ├── Skeleton.tsx
│   │   ├── LoadingSpinner.tsx
│   │   ├── ErrorBoundary.tsx
│   │   ├── MascotSlot.tsx  # Fatih Abi asset slot
│   │   └── IllustrationSlot.tsx
│   │
│   ├── hooks/              # Shared hooks (not feature-specific)
│   │   ├── useTheme.ts
│   │   ├── useColorScheme.ts
│   │   └── useSafeInsets.ts
│   │
│   ├── lib/                # Infrastructure
│   │   ├── api-client.ts   # TanStack Query + axios setup
│   │   ├── i18n.ts         # i18next configuration
│   │   └── query-client.ts # QueryClient singleton
│   │
│   ├── theme/              # Theme consumption layer
│   │   ├── ThemeContext.tsx
│   │   └── useTokens.ts    # Access design tokens with theme
│   │
│   └── assets/             # Asset registries
│       ├── mascot/
│       │   └── registry.ts
│       └── illustrations/
│           └── registry.ts
│
└── assets/                 # Static assets (processed by Expo)
    ├── icon.png
    ├── splash-icon.png
    ├── adaptive-icon.png
    └── favicon.png
```

### State Management Strategy

| State Type                  | Tool                  | Example                               |
| --------------------------- | --------------------- | ------------------------------------- |
| Server data (reports, feed) | TanStack Query        | `useQuery(['reports'], fetchReports)` |
| Authentication state        | Zustand               | `useAuthStore().user`                 |
| Report draft                | Zustand + SecureStore | Persisted on device                   |
| UI state (modals, forms)    | Local React state     | `useState(false)`                     |
| Theme                       | React Context         | `useTheme().colors.brandPrimary`      |
| Navigation state            | Expo Router           | File-based, no manual state           |

**Rule:** Never put server data in Zustand. Always use TanStack Query for server data.

---

## API Architecture

### Module Structure

```
apps/api/src/
├── config/              # Configuration factories (NestJS registerAs)
├── common/              # Cross-cutting concerns
│   ├── guards/          # AuthGuard, RolesGuard
│   ├── decorators/      # @CurrentUser, @Roles, @Public
│   ├── filters/         # Global exception filter
│   ├── interceptors/    # Logging, response transform
│   └── pipes/           # Custom validation pipes
├── health/              # Health check (✅ implemented)
├── auth/                # Firebase Admin ID-token verification
├── users/               # Authenticated profile route
├── reports/             # Private report create, history, detail, withdrawal
├── media/               # Short-lived private GCS upload authorization
├── database/            # pg pool, transaction helper, SQL migrations
└── common/              # Request IDs, structured logs, sanitized errors
└── app.module.ts
```

### API Contract Principles

- All endpoints versioned under `/api/v1/`
- Input validated with class-validator DTOs (strict, no unknown properties)
- Output filtered by response DTOs — never return raw database entities
- Errors follow `ApiErrorResponse` shape (from @dahamiz/shared-types)
- OpenAPI documentation generated from decorators (Swagger)
- Authentication: Bearer JWT (Firebase) in Authorization header

### Response Envelope

```typescript
// Success
{ data: T }  // or direct T for single resource

// Paginated
{
  data: T[];
  pagination: { total, page, limit, hasNextPage }
}

// Error (always)
{
  statusCode: number;
  message: string;
  code?: string;
  errors?: Record<string, string[]>;
  requestId?: string;
  timestamp: string;
}
```

---

## Database Architecture

### Technology

- PostgreSQL 16 (local via Docker, Cloud SQL in production)
- PostGIS extension (geographic queries)
- Driver: node-postgres (`pg`) with parameterized SQL and explicit transactions
- Migrations: committed SQL files, serialized by a PostgreSQL advisory lock

### Core Schema (Phase 4)

```sql
-- Users
users (
  id UUID PRIMARY KEY,
  firebase_uid TEXT UNIQUE NOT NULL,
  display_name TEXT NOT NULL,
  avatar_url TEXT,
  role user_role DEFAULT 'CITIZEN',
  xp_points INT DEFAULT 0,
  level INT DEFAULT 1,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  deleted_at TIMESTAMPTZ  -- soft delete
)

-- Reports (private data)
reports (
  id UUID PRIMARY KEY,
  reporter_id UUID REFERENCES users(id),
  category incident_category NOT NULL,
  status report_status NOT NULL DEFAULT 'SUBMITTED',
  description TEXT,
  precise_location GEOGRAPHY(POINT, 4326) NOT NULL, -- PRIVATE
  approximate_location GEOGRAPHY(POINT, 4326),      -- PUBLIC (offset)
  district TEXT,
  city TEXT NOT NULL,
  country TEXT DEFAULT 'TR',
  privacy_consent_given BOOLEAN NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
)

-- Report media (evidence files — private)
report_media (
  id UUID PRIMARY KEY,
  report_id UUID REFERENCES reports(id),
  upload_id TEXT UNIQUE NOT NULL, -- matches Cloud Storage object path
  media_type media_type NOT NULL,
  file_size_bytes BIGINT,
  mime_type TEXT,
  status media_status DEFAULT 'UPLOADED',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
)

-- Report status history
report_status_events (
  id UUID PRIMARY KEY,
  report_id UUID REFERENCES reports(id),
  status report_status NOT NULL,
  public_message TEXT, -- legally appropriate message for reporter
  changed_by UUID REFERENCES users(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
)

-- Public community posts (approved derivatives — separate from evidence)
public_posts (
  id UUID PRIMARY KEY,
  source_report_id UUID REFERENCES reports(id),
  title TEXT,
  body TEXT,
  derivative_object_key TEXT, -- separate bucket key, only after human approval
  approximate_location GEOGRAPHY(POINT, 4326),
  published_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
)
```

---

## Cloud Architecture (Phase 4+, Approval-Gated)

### GCP Services

| Service                  | Purpose                         | Phase |
| ------------------------ | ------------------------------- | ----- |
| Cloud Run                | API container, media worker     | 3     |
| Cloud SQL (PostgreSQL)   | Primary database                | 3     |
| Cloud Storage            | Evidence + public media buckets | 3     |
| Firebase Auth            | User authentication             | 3     |
| Firebase Cloud Messaging | Push notifications              | 5     |
| Cloud Tasks              | Retryable background jobs       | 3     |
| Secret Manager           | All secrets                     | 3     |
| Cloud Logging            | Structured log aggregation      | 3     |
| Cloud Monitoring         | Alerting, dashboards            | 7     |
| Artifact Registry        | Container images                | 3     |
| Pub/Sub                  | Async domain events (future)    | TBD   |

### Deployment Pattern

```
Docker image → Artifact Registry → Cloud Run (staging) → Cloud Run (production)
```

Infrastructure is defined as Terraform IaC — never manually provisioned. Apply requires explicit approval — never
automated without human confirmation.

---

## Shared Packages

### @dahamiz/shared-types

- Location: `packages/shared-types/src/index.ts`
- Contains: Domain enums, API interfaces, gamification types
- Rule: No runtime logic, no framework imports, no circular deps

### @dahamiz/design-tokens

- Location: `packages/design-tokens/src/index.ts`
- Contains: Complete color themes, typography, spacing, motion, shadow tokens
- Rule: Pure JavaScript values — no React, no React Native imports

---

## Security Architecture

See `docs/SECURITY_AND_PRIVACY.md` for detailed security constraints.

Key principles:

1. No public access to original evidence (signed URLs only, short-lived)
2. API verifies Firebase JWTs on every request
3. RBAC enforced server-side — mobile app never makes authorization decisions
4. Audit log for all evidence access
5. No secrets in mobile app bundle
6. Separate storage buckets for evidence vs. public media
