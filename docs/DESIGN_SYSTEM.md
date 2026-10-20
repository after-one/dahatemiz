# Design System — DahaMiz

The design system is the single source of truth for all visual decisions. It lives in `packages/design-tokens/` and is
consumed by the mobile app through `ThemeProvider` and semantic tokens.

---

## Design Philosophy

**Nature-inspired, not nature-themed.** The visual identity is grounded in environmental awareness without being an "eco
game" or government form.

Core qualities:

- **Restrained** — curated color usage, not rainbow palette
- **Warm** — organic shapes, warm neutral surfaces, approachable type
- **Modern** — confident typography, meaningful whitespace, clean layouts
- **Premium** — every component feels considered and crafted
- **Trustworthy** — clarity, honesty, no dark patterns

## Visual Direction

Three directions were compared before implementation:

| Direction              | Character                                                           | Decision                                                                                                          |
| ---------------------- | ------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------- |
| **Mahalle Editoryali** | Warm stone, forest ink, muted saffron, human editorial illustration | **Selected:** feels locally grounded and warm while retaining the restraint needed for civic trust.               |
| Civic Cartography      | Chalk, navy and lime; map grids and technical annotation            | Rejected for the first identity: it overemphasizes institutional mapping and feels less personal.                 |
| Urban Botanics         | Graphite, olive and coral; tactile plant forms                      | Rejected for the first identity: memorable, but less clear at small mobile sizes and weaker for reporting states. |

The selected direction uses forest `#315A43`, warm stone `#F5F2EA`, and ochre `#D89A32` in light mode. Dark mode uses
warm graphite `#171A17`, layered charcoal green surfaces, and softened sage and saffron accents. The preview screen is
the current reference implementation; the selected palette can still be tuned before Phase 2 screens.

---

## Color System

### Palette Overview

The palette uses three primary color families:

| Family  | Role                                          | Base Value       |
| ------- | --------------------------------------------- | ---------------- |
| Forest  | Brand primary, success, environmental         | `#315A43`        |
| Sage    | Secondary, muted environmental accent         | `#5A9652`        |
| Ochre   | Positive reinforcement, achievements, accents | `#D89A32`        |
| Neutral | Surfaces, text, dividers                      | Warm stone scale |
| Red     | Errors, destructive, warnings                 | Muted red scale  |

### Semantic Token Usage

**Always use semantic tokens in components — never hard-code hex values.**

```typescript
// ✅ Correct
style={{ backgroundColor: colors.backgroundCard, color: colors.textPrimary }}

// ❌ Wrong
style={{ backgroundColor: '#FFFFFF', color: '#1C1917' }}
```

### Light Theme

| Token            | Value     | Usage                                          |
| ---------------- | --------- | ---------------------------------------------- |
| `brandPrimary`   | `#315A43` | Primary buttons, active states, brand elements |
| `brandAccent`    | `#D89A32` | Achievement highlights, accent dots            |
| `backgroundBase` | `#F5F2EA` | Screen backgrounds                             |
| `backgroundCard` | `#FFFFFF` | Cards, elevated surfaces                       |
| `textPrimary`    | `#1C1917` | Body text, headlines                           |
| `textSecondary`  | `#665D54` | Captions, labels, secondary info               |
| `borderDefault`  | `#E0DBD4` | Card borders, input borders                    |
| `statusSuccess`  | `#2F6438` | Success states                                 |
| `statusError`    | `#E8392E` | Errors, destructive                            |
| `reportResolved` | `#2F6438` | Resolved report badge                          |

### Dark Theme

Dark theme uses layered warm graphite surfaces, with base background `#171A17`, elevated surface `#20251F`, and card
surface `#282E27`.

---

## Typography

### Font Family

**Primary:** platform system sans (used by the Phase 1 preview for native legibility). Inter remains the preferred brand
face for a later bundled font pass. **Monospace:** JetBrains Mono for report IDs and technical strings when custom fonts
are introduced.

Fallback: System default sans-serif (appears before font loads)

### Type Scale

| Token | Size | Usage                             |
| ----- | ---- | --------------------------------- |
| `xs`  | 11px | Caption, legal text, badges       |
| `sm`  | 13px | Secondary labels, metadata        |
| `md`  | 15px | Body text baseline                |
| `lg`  | 17px | Emphasized body, primary labels   |
| `xl`  | 20px | Card titles                       |
| `2xl` | 24px | Screen titles                     |
| `3xl` | 30px | Hero text                         |
| `4xl` | 38px | Large display numerics, XP counts |

### Font Weights

| Token       | Value | Usage                          |
| ----------- | ----- | ------------------------------ |
| `regular`   | 400   | Body text, descriptions        |
| `medium`    | 500   | Labels, navigation items       |
| `semibold`  | 600   | Card titles, section headers   |
| `bold`      | 700   | Screen titles, primary CTAs    |
| `extrabold` | 800   | Hero text, achievement numbers |

---

## Spacing

4px base grid. All layout values must be multiples of 4.

| Token         | Value | Usage                       |
| ------------- | ----- | --------------------------- |
| `spacing[1]`  | 4px   | Tiny gap (icon to label)    |
| `spacing[2]`  | 8px   | Element padding (tight)     |
| `spacing[3]`  | 12px  | Small component padding     |
| `spacing[4]`  | 16px  | Standard horizontal padding |
| `spacing[5]`  | 20px  | Screen horizontal margin    |
| `spacing[6]`  | 24px  | Section spacing             |
| `spacing[8]`  | 32px  | Large section gap           |
| `spacing[12]` | 48px  | Screen vertical padding     |

---

## Border Radius

| Token        | Value  | Usage                           |
| ------------ | ------ | ------------------------------- |
| `radii.xs`   | 4px    | Chips, small badges             |
| `radii.sm`   | 8px    | Inputs, small cards             |
| `radii.md`   | 12px   | Standard cards, modals          |
| `radii.lg`   | 16px   | Prominent cards                 |
| `radii.xl`   | 24px   | Large feature panels            |
| `radii.full` | 9999px | Pills, avatars, circular badges |

---

## Elevation / Shadow

Prefer subtle shadows that suggest depth without being heavy.

| Token          | Elevation | Usage               |
| -------------- | --------- | ------------------- |
| `shadows.none` | 0         | Flat surfaces       |
| `shadows.sm`   | 2         | Subtle card lift    |
| `shadows.md`   | 4         | Standard card       |
| `shadows.lg`   | 8         | Modal, bottom sheet |

---

## Motion

Animations should be purposeful and brief.

| Token               | Duration | Usage                            |
| ------------------- | -------- | -------------------------------- |
| `durations.instant` | 100ms    | Micro-interactions, press states |
| `durations.fast`    | 200ms    | Button animations, icon changes  |
| `durations.normal`  | 300ms    | Standard transitions, modals     |
| `durations.slow`    | 450ms    | Page transitions                 |

Standard easing: `[0.4, 0.0, 0.2, 1.0]` (Material standard)

---

## Icons

**Library:** Lucide via `lucide-react-native`

Custom environmental icons specified in `docs/ASSET_REQUIREMENTS.md`.

| Size Token         | Value | Usage                     |
| ------------------ | ----- | ------------------------- |
| `iconSizes.xs`     | 14px  | Inline with small text    |
| `iconSizes.sm`     | 18px  | Secondary UI icons        |
| `iconSizes.md`     | 22px  | Standard nav/action icons |
| `iconSizes.lg`     | 28px  | Section icons             |
| `iconSizes.xl`     | 36px  | Feature hero icons        |
| `iconSizes['2xl']` | 48px  | Empty states              |

## Illustration Frames

Use `illustrationSizes` to keep editorial scenes consistent across preview and product screens:

| Token      | Frame      | Usage                                  |
| ---------- | ---------- | -------------------------------------- |
| `compact`  | 280×160 pt | Inline scene in a content card         |
| `standard` | 280×180 pt | Community and supporting story scene   |
| `large`    | 320×240 pt | Empty-state or onboarding illustration |

---

## Component Patterns

The Phase 1 preview is the root app route. `ThemeProvider` follows the system appearance until the user toggles the
catalog control. `Surface`, `ActionButton`, `StatusBadge`, `MascotSlot`, and `IllustrationSlot` consume semantic theme
tokens and expose accessible names where applicable. Route files should remain thin as feature screens are added.

### Hierarchy

Components are organized in three layers:

1. **Primitives** (`components/`) — Button, Text, Card, Icon, Input, Badge, Avatar
   - No feature logic
   - Fully token-driven styling
   - Accessibility labels mandatory

2. **Feature Components** (`features/*/components/`) — ReportCard, FeedItem, MissionCard
   - Import primitives
   - May contain feature-specific logic
   - Still no API calls (those live in hooks/api.ts)

3. **Screens** (`app/`) — Assemble feature components
   - Minimal logic
   - Navigation only
   - Pass data down from query hooks

### Card Component Pattern

All cards use:

- `backgroundCard` background
- `borderDefault` border (1px)
- `radii.md` border radius
- `shadows.sm` shadow
- `spacing[5]` padding

### Empty State Pattern

Every list/screen with data must have an empty state:

- `IllustrationSlot` for illustration
- Short Turkish headline (e.g., "Henüz bildirim yok")
- Secondary text with actionable suggestion
- Optional CTA button

### Loading State Pattern

- Skeleton loaders (not spinners) for content lists
- Spinner for actions (form submit, file upload)
- Skeleton matches the approximate shape of real content

---

## ThemeContext (Phase 1)

```typescript
// Usage in any component:
const { colors, fontSizes, spacing, shadows } = useTokens();

// Returns the correct light or dark theme values based on system setting
```

`ThemeContext` provides:

- `colors: ColorTheme` — current theme colors
- `fontSizes`, `fontWeights`, `fontFamilies`
- `spacing`, `radii`, `shadows`, `borders`
- `durations`, `easings`, `iconSizes`
- `colorScheme: 'light' | 'dark'`

---

## Turkish Brand Voice in UI Copy

All visible text defaults to Turkish.

Tone: warm, casual but respectful, encouraging, concise.

| Context          | Example                                                                   |
| ---------------- | ------------------------------------------------------------------------- |
| Welcome          | "Hoş geldin! Birlikte güzel işler yapacağız."                             |
| Report submitted | "Bildirimin alındı. İnceleme sürecini buradan takip edebilirsin."         |
| Success          | "Güzel iş çıkardın!"                                                      |
| XP earned        | "+50 XP kazandın!"                                                        |
| Empty reports    | "Henüz bildirim yapmadın. Çevrende bir sorun fark ettin mi?"              |
| Error            | "Bir sorun oluştu. Lütfen tekrar dene."                                   |
| Privacy          | "Bildirimin yalnızca yetkili mercilere iletilir. Kamuoyuyla paylaşılmaz." |
| Report status    | "Bildirimin inceleme aşamasında." (neutral, not "violation confirmed")    |

**Critical copy rule:** A submitted report is NEVER described as a "confirmed violation" or evidence of guilt. Use
neutral language: "bildirim alındı", "inceleme sürecinde", "yetkililere iletildi".
