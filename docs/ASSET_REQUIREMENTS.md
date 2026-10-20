# Asset Requirements — DahaMiz Brand Assets

**For Codex: This document specifies all visual asset requirements.**

All placeholder slots are defined in code as `MascotSlot`, `IllustrationSlot`, and `IconAsset` components. Real assets
can be plugged in by updating the asset registry without changing any consumer code.

---

## 1. Fatih Abi — Mascot Character

### Character Brief

**Name:** Fatih Abi ("Elder Brother Fatih" — affectionate Turkish address) **Archetype:** Warm, sincere neighborhood
sanitation worker **Personality:** Trustworthy, encouraging, practically wise, community-oriented **Tone:** Approachable
and human — not cartoonish or childish

He represents environmental care, civic responsibility, and positive community action. He should feel like a real person
from the neighborhood — familiar, warm, and genuine.

**Do not:**

- Make him look like a superhero
- Give him exaggerated proportions (not a chibi character)
- Use childish eco-game aesthetics
- Portray sanitation work as unpleasant or low-status

**Do:**

- Show warmth through expression and posture
- Include subtle environmental workplace details (hat, vest, maybe gloves)
- Create approachable, clean linework appropriate for a mobile product

### Asset Format Requirements

| Property        | Requirement                                                |
| --------------- | ---------------------------------------------------------- |
| Primary format  | Lottie JSON (animated) or static SVG (Phase 1 placeholder) |
| Rive support    | Optional — provide .riv file if Rive workflow is available |
| Static fallback | PNG at 3x resolution for each state                        |
| Aspect ratio    | Portrait, approximately 3:4                                |
| Background      | Transparent                                                |

### Mascot States Required

Each state must have a distinct pose/expression that communicates the emotion clearly in a small format.

| State         | Usage Context                      | Description                                |
| ------------- | ---------------------------------- | ------------------------------------------ |
| `welcome`     | Welcome screen, first launch       | Waving, friendly, open body language       |
| `happy`       | Positive feedback, streak achieved | Smile, thumbs up or similar                |
| `proud`       | Report submitted successfully      | Arms crossed, satisfied, nodding           |
| `celebrating` | Achievement unlocked, milestone    | Arms up, celebratory pose                  |
| `thinking`    | Tips screen, educational content   | Chin-on-hand thinking pose                 |
| `explaining`  | Onboarding, tutorial               | Pointing at something, presenting          |
| `encouraging` | Empty states, motivation           | Encouraging gesture, forward lean          |
| `concerned`   | Environmental problem shown        | Slightly furrowed brow, serious but caring |
| `neutral`     | Default / idle fallback            | Standing relaxed, small smile              |

### Size Variants

| Variant | Usage                       | Dimensions |
| ------- | --------------------------- | ---------- |
| `sm`    | Inline chips, notifications | 48×64 pt   |
| `md`    | Cards, tips popups          | 80×107 pt  |
| `lg`    | Full onboarding screens     | 160×213 pt |
| `xl`    | Hero welcome screen         | 240×320 pt |

### MascotSlot Component API (implemented in Phase 1)

```tsx
<MascotSlot
  state="welcome" // MascotState enum
  size="lg" // 'sm' | 'md' | 'lg' | 'xl'
  speechBubble="Hoş geldin! Birlikte güzel işler yapacağız."
  accessibleDescription="Fatih Abi seni selamlıyor"
/>
```

### Asset Registry Location

Assets are registered in:

```
apps/mobile/src/features/brand/
├── mascotRegistry.ts    # Maps each state to a bundled image
├── MascotSlot.tsx       # Stable consumer API and accessible image frame
├── illustrationRegistry.ts
└── IllustrationSlot.tsx
```

To plug in real assets: add the files and update `registry.ts` — no other changes needed.

---

## 2. Environmental Illustrations

These appear in empty states, onboarding, and educational content.

### Required Illustrations

| Key                    | Usage                         | Description                            |
| ---------------------- | ----------------------------- | -------------------------------------- |
| `empty-feed`           | Home feed empty state         | Clean neighborhood scene, sunlight     |
| `empty-reports`        | My reports empty state        | Person looking at phone, outdoor scene |
| `empty-map`            | Map with no nearby reports    | Clean city/nature view from above      |
| `empty-challenges`     | No active challenges          | Starting line or trophy scene          |
| `onboarding-reporting` | Report flow explanation       | Person capturing a photo outdoors      |
| `onboarding-community` | Community tab explanation     | Group of people, neighborhood          |
| `onboarding-impact`    | Impact/tracking explanation   | Map pins, growth visualization         |
| `success-report`       | Report submitted successfully | Checkmark with environmental elements  |
| `resolved-report`      | Report resolved               | Clean area, transformation             |

### Illustration Style Requirements

- **Style:** Clean, modern editorial illustration — not flat 2D icons, not detailed realism
- **Color palette:** Matches design tokens (green, sage, amber, warm neutrals)
- **Lines:** Confident, clean strokes
- **Diversity:** Show diverse urban environments and people where relevant
- **Environmental motifs:** Nature elements integrated into urban scenes
- **Avoid:** Stock illustration look, excessive gradients, clipart aesthetic

### Format

| Property     | Requirement                                 |
| ------------ | ------------------------------------------- |
| Format       | SVG preferred, Lottie for animated versions |
| PNG fallback | 3x resolution, transparent background       |
| Size         | Designed for 320×240 display minimum        |

---

## 3. Environmental Icon Set

The app uses Lucide icons for functional UI elements. A custom environmental icon set is needed for:

| Icon                   | Usage                |
| ---------------------- | -------------------- |
| `cigarette-butt`       | Incident category    |
| `illegal-dump`         | Incident category    |
| `construction-debris`  | Incident category    |
| `vehicle-discharge`    | Incident category    |
| `overflowing-bin`      | Incident category    |
| `water-pollution`      | Incident category    |
| `street-litter`        | Incident category    |
| `environmental-impact` | Impact visualization |
| `fatih-abi-badge`      | Mascot-themed badge  |

### Icon Format

| Property        | Requirement                            |
| --------------- | -------------------------------------- |
| Format          | SVG, 24×24 viewBox                     |
| Style           | Line icons, 1.5px stroke, rounded caps |
| Consistent with | Lucide icon style                      |
| Exportable as   | Expo vector component or PNG sprite    |

---

## 4. App Icon

| Property      | Requirement                                                    |
| ------------- | -------------------------------------------------------------- |
| Concept       | Environmental identity — leaf, lens (camera), or combined mark |
| Adaptive icon | Android foreground: transparent background, centered mark      |
| iOS icon      | Solid background, rounded corners applied by system            |
| Sizes         | Follow Apple/Google guidelines: 1024×1024 master               |
| Colors        | Brand green (#3A7D44) primary, warm neutral secondary          |

---

## 5. Phase 1 Implementation

The Phase 1 app bundles the ten PNG mascot states and two original editorial environmental scenes listed in
`docs/ASSET_MANIFEST.md`. `MascotSlot` and `IllustrationSlot` read the registry so artwork can be replaced without
changing screen consumers. Mascot display supports static images now; Rive/Lottie animation remains a later enhancement.
