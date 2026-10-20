/**
 * @dahamiz/design-tokens
 *
 * Semantic design token foundation for the DahaMiz environmental platform.
 *
 * Design rationale:
 * - Nature-inspired but restrained — earthy greens, warm neutrals, not childish eco-game colors.
 * - Dark mode is a first-class concern.
 * - All colors use semantic names (brand.primary, not '#3A7D44').
 * - These values can be replaced as branding evolves — all components reference tokens, not hex values.
 *
 * Color palette inspiration:
 * - Mossy greens and forest deep tones for environmental identity.
 * - Warm sand/stone neutrals for surfaces.
 * - Amber/ochre for accents and positive reinforcement.
 * - Clean whites and near-blacks for legibility.
 *
 * Usage:
 *   import { colors, typography, spacing } from '@dahamiz/design-tokens';
 */

// ─── Primitive Color Scale ──────────────────────────────────────────────────
// These are raw values. Use semantic tokens (below) in components — not these directly.

const primitiveColors = {
  // Greens — Environmental identity
  green: {
    50: '#F0F7F0',
    100: '#D6EEDA',
    200: '#A8D8B0',
    300: '#72BC7D',
    400: '#4EA05A',
    500: '#3A7D44', // Base brand green
    600: '#2F6438',
    700: '#234C2A',
    800: '#183520',
    900: '#0D1E12',
  },
  // Sage — Muted, sophisticated secondary green
  sage: {
    50: '#F3F7F2',
    100: '#E2EDE0',
    200: '#BFDBBB',
    300: '#97C491',
    400: '#72AE6A',
    500: '#5A9652',
    600: '#477941',
    700: '#355B30',
    800: '#233D1F',
    900: '#121F10',
  },
  // Amber — Positive reinforcement, achievements, warm accents
  amber: {
    50: '#FFF8E7',
    100: '#FFEFC3',
    200: '#FFD97A',
    300: '#FFC33A',
    400: '#FFAD00',
    500: '#E09600',
    600: '#B87B00',
    700: '#8A5C00',
    800: '#5C3D00',
    900: '#2E1E00',
  },
  // Red — Errors, warnings, destructive actions
  red: {
    50: '#FFF2F0',
    100: '#FFE1DC',
    200: '#FFBCB5',
    300: '#FF9188',
    400: '#FF6259',
    500: '#E8392E',
    600: '#C22921',
    700: '#991E18',
    800: '#6B1410',
    900: '#3D0A08',
  },
  // Neutral — Surfaces, text, dividers
  neutral: {
    0: '#FFFFFF',
    50: '#F8F7F5',
    100: '#F0EDE9',
    200: '#E0DBD4',
    300: '#C8C1B8',
    400: '#A89F95',
    500: '#857C72',
    600: '#665D54',
    700: '#4A4240',
    800: '#312D2B',
    900: '#1C1917',
    950: '#0F0D0C',
    1000: '#000000',
  },
} as const;

// ─── Semantic Color Tokens ──────────────────────────────────────────────────

export interface ColorTheme {
  // Brand
  brandPrimary: string;
  brandPrimaryLight: string;
  brandPrimaryDark: string;
  brandSecondary: string;
  brandAccent: string;
  brandHero: string;

  // Surfaces & Backgrounds
  backgroundBase: string;
  backgroundElevated: string;
  backgroundCard: string;
  backgroundOverlay: string;
  backgroundInputField: string;

  // Text
  textPrimary: string;
  textSecondary: string;
  textTertiary: string;
  textOnBrand: string;
  textOnDark: string;
  textLink: string;
  textDisabled: string;

  // Borders & Dividers
  borderDefault: string;
  borderStrong: string;
  borderFocus: string;

  // Status
  statusSuccess: string;
  statusSuccessBackground: string;
  statusWarning: string;
  statusWarningBackground: string;
  statusError: string;
  statusErrorBackground: string;
  statusInfo: string;
  statusInfoBackground: string;

  // Report Status Colors
  reportSubmitted: string;
  reportUnderReview: string;
  reportForwarded: string;
  reportInvestigating: string;
  reportResolved: string;
  reportClosed: string;
  reportRejected: string;
  reportWithdrawn: string;

  // Gamification
  xpGold: string;
  xpBronze: string;
  xpSilver: string;
  levelBadge: string;
}

export const lightTheme: ColorTheme = {
  // Brand
  brandPrimary: '#315A43',
  brandPrimaryLight: '#52775F',
  brandPrimaryDark: '#244432',
  brandSecondary: primitiveColors.sage[500],
  brandAccent: '#D89A32',
  brandHero: '#E9E4D8',

  // Surfaces
  backgroundBase: '#F5F2EA',
  backgroundElevated: primitiveColors.neutral[0],
  backgroundCard: primitiveColors.neutral[0],
  backgroundOverlay: 'rgba(0,0,0,0.5)',
  backgroundInputField: '#EEE9DF',

  // Text
  textPrimary: primitiveColors.neutral[900],
  textSecondary: primitiveColors.neutral[600],
  textTertiary: primitiveColors.neutral[600],
  textOnBrand: primitiveColors.neutral[0],
  textOnDark: primitiveColors.neutral[0],
  textLink: primitiveColors.green[600],
  textDisabled: primitiveColors.neutral[300],

  // Borders
  borderDefault: primitiveColors.neutral[200],
  borderStrong: primitiveColors.neutral[400],
  borderFocus: primitiveColors.green[500],

  // Status
  statusSuccess: primitiveColors.green[600],
  statusSuccessBackground: primitiveColors.green[50],
  statusWarning: primitiveColors.amber[700],
  statusWarningBackground: primitiveColors.amber[50],
  statusError: primitiveColors.red[600],
  statusErrorBackground: primitiveColors.red[50],
  statusInfo: '#2563EB',
  statusInfoBackground: '#EFF6FF',

  // Report Statuses
  reportSubmitted: '#6B7280',
  reportUnderReview: '#2563EB',
  reportForwarded: '#7C3AED',
  reportInvestigating: primitiveColors.amber[700],
  reportResolved: primitiveColors.green[600],
  reportClosed: primitiveColors.neutral[600],
  reportRejected: primitiveColors.red[700],
  reportWithdrawn: primitiveColors.neutral[600],

  // Gamification
  xpGold: primitiveColors.amber[400],
  xpBronze: '#CD7F32',
  xpSilver: '#A0A0A0',
  levelBadge: primitiveColors.green[500],
};

export const darkTheme: ColorTheme = {
  // Brand
  brandPrimary: '#8EAF94',
  brandPrimaryLight: '#AFC8B2',
  brandPrimaryDark: '#52775F',
  brandSecondary: primitiveColors.sage[400],
  brandAccent: '#E5B65F',
  brandHero: '#30372F',

  // Surfaces
  backgroundBase: '#171A17',
  backgroundElevated: '#20251F',
  backgroundCard: '#282E27',
  backgroundOverlay: 'rgba(0,0,0,0.7)',
  backgroundInputField: '#30372F',

  // Text
  textPrimary: primitiveColors.neutral[50],
  textSecondary: primitiveColors.neutral[300],
  textTertiary: primitiveColors.neutral[300],
  textOnBrand: primitiveColors.neutral[900],
  textOnDark: primitiveColors.neutral[0],
  textLink: primitiveColors.green[300],
  textDisabled: primitiveColors.neutral[600],

  // Borders
  borderDefault: primitiveColors.neutral[700],
  borderStrong: primitiveColors.neutral[500],
  borderFocus: primitiveColors.green[400],

  // Status
  statusSuccess: primitiveColors.green[200],
  statusSuccessBackground: 'rgba(58,125,68,0.15)',
  statusWarning: primitiveColors.amber[300],
  statusWarningBackground: 'rgba(255,173,0,0.12)',
  statusError: primitiveColors.red[300],
  statusErrorBackground: 'rgba(232,57,46,0.12)',
  statusInfo: '#60A5FA',
  statusInfoBackground: 'rgba(37,99,235,0.12)',

  // Report Statuses
  reportSubmitted: '#9CA3AF',
  reportUnderReview: '#60A5FA',
  reportForwarded: '#A78BFA',
  reportInvestigating: primitiveColors.amber[300],
  reportResolved: primitiveColors.green[300],
  reportClosed: primitiveColors.neutral[300],
  reportRejected: primitiveColors.red[300],
  reportWithdrawn: primitiveColors.neutral[300],

  // Gamification
  xpGold: primitiveColors.amber[300],
  xpBronze: '#C4783A',
  xpSilver: '#B8B8B8',
  levelBadge: primitiveColors.green[400],
};

// ─── Typography Tokens ──────────────────────────────────────────────────────

export const fontFamilies = {
  /**
   * Primary display and UI font.
   * Target: 'Inter' (loaded via Expo Google Fonts in mobile, CSS variable in web).
   * Fallback chain ensures legible text before font loads.
   */
  sans: 'Inter',
  /**
   * Monospace font for technical strings (report IDs, coordinates, etc.).
   */
  mono: 'JetBrains Mono',
} as const;

export const fontSizes = {
  /** 11px — caption, legal text, badges */
  xs: 11,
  /** 13px — secondary labels, metadata */
  sm: 13,
  /** 15px — body text baseline */
  md: 15,
  /** 17px — emphasized body, primary labels */
  lg: 17,
  /** 20px — card titles, section headers */
  xl: 20,
  /** 24px — screen titles */
  '2xl': 24,
  /** 30px — hero text, achievement titles */
  '3xl': 30,
  /** 38px — large display numerics */
  '4xl': 38,
} as const;

export const fontWeights = {
  regular: '400',
  medium: '500',
  semibold: '600',
  bold: '700',
  extrabold: '800',
} as const;

export const lineHeights = {
  tight: 1.2,
  snug: 1.35,
  normal: 1.5,
  relaxed: 1.65,
  loose: 1.8,
} as const;

export const letterSpacings = {
  tighter: -0.5,
  tight: -0.25,
  normal: 0,
  wide: 0.25,
  wider: 0.5,
  widest: 1.5,
} as const;

// ─── Spacing Tokens ─────────────────────────────────────────────────────────

/**
 * 4px base grid spacing system.
 * All layout measurements should be multiples of these values.
 */
export const spacing = {
  /** 2px */
  '0.5': 2,
  /** 4px */
  1: 4,
  /** 6px */
  '1.5': 6,
  /** 8px */
  2: 8,
  /** 10px */
  '2.5': 10,
  /** 12px */
  3: 12,
  /** 14px */
  '3.5': 14,
  /** 16px */
  4: 16,
  /** 20px */
  5: 20,
  /** 24px */
  6: 24,
  /** 28px */
  7: 28,
  /** 32px */
  8: 32,
  /** 40px */
  10: 40,
  /** 48px */
  12: 48,
  /** 56px */
  14: 56,
  /** 64px */
  16: 64,
  /** 80px */
  20: 80,
  /** 96px */
  24: 96,
  /** 128px */
  32: 128,
} as const;

// ─── Border Radius Tokens ───────────────────────────────────────────────────

export const radii = {
  /** 4px — inline chips, small badges */
  xs: 4,
  /** 8px — inputs, small cards */
  sm: 8,
  /** 12px — standard cards, modal sheets */
  md: 12,
  /** 16px — prominent cards, feature panels */
  lg: 16,
  /** 24px — large modals, feature cards */
  xl: 24,
  /** 9999px — pills, circular elements */
  full: 9999,
} as const;

// ─── Elevation / Shadow Tokens ──────────────────────────────────────────────

export interface ShadowToken {
  readonly shadowColor: string;
  readonly shadowOffset: { readonly width: number; readonly height: number };
  readonly shadowOpacity: number;
  readonly shadowRadius: number;
  readonly elevation: number; // Android
}

export const shadows = {
  none: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0,
    shadowRadius: 0,
    elevation: 0,
  },
  sm: {
    shadowColor: '#1C1917',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 2,
  },
  md: {
    shadowColor: '#1C1917',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 4,
  },
  lg: {
    shadowColor: '#1C1917',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.12,
    shadowRadius: 16,
    elevation: 8,
  },
} as const satisfies Record<string, ShadowToken>;

// ─── Motion / Animation Tokens ──────────────────────────────────────────────

export const durations = {
  /** 100ms — micro-interactions, hover states */
  instant: 100,
  /** 200ms — button presses, icon state changes */
  fast: 200,
  /** 300ms — standard transitions, modal show/hide */
  normal: 300,
  /** 450ms — page transitions */
  slow: 450,
  /** 600ms — elaborate reveals */
  slower: 600,
} as const;

export const easings = {
  /** Standard ease in/out — most interactions */
  standard: [0.4, 0.0, 0.2, 1.0] as const,
  /** Deceleration — elements entering from outside */
  decelerate: [0.0, 0.0, 0.2, 1.0] as const,
  /** Acceleration — elements leaving */
  accelerate: [0.4, 0.0, 1.0, 1.0] as const,
  /** Spring — celebrate actions */
  spring: [0.175, 0.885, 0.32, 1.275] as const,
} as const;

// ─── Icon Size Tokens ───────────────────────────────────────────────────────

export const iconSizes = {
  /** 14px — inline with small text */
  xs: 14,
  /** 18px — secondary UI icons */
  sm: 18,
  /** 22px — standard nav/action icons */
  md: 22,
  /** 28px — prominent section icons */
  lg: 28,
  /** 36px — feature hero icons */
  xl: 36,
  /** 48px — empty states, large illustrations */
  '2xl': 48,
  /** 64px — mascot frames and achievement display */
  '3xl': 64,
} as const;

// ─── Illustration Frame Tokens ──────────────────────────────────────────────

export const illustrationSizes = {
  compact: { width: 280, height: 160 },
  standard: { width: 280, height: 180 },
  large: { width: 320, height: 240 },
} as const;

// ─── Border Tokens ──────────────────────────────────────────────────────────

export const borders = {
  none: 0,
  thin: 1,
  medium: 1.5,
  thick: 2,
} as const;

// ─── Exported Token Collections ─────────────────────────────────────────────

export const tokens = {
  colors: {
    light: lightTheme,
    dark: darkTheme,
  },
  fontFamilies,
  fontSizes,
  fontWeights,
  lineHeights,
  letterSpacings,
  spacing,
  radii,
  shadows,
  durations,
  easings,
  iconSizes,
  illustrationSizes,
  borders,
} as const;

export type Tokens = typeof tokens;
export type SpacingKey = keyof typeof spacing;
export type RadiiKey = keyof typeof radii;
export type FontSizeKey = keyof typeof fontSizes;
export type IconSizeKey = keyof typeof iconSizes;
export type DurationKey = keyof typeof durations;
