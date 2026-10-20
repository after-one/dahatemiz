import { darkTheme, lightTheme, type ColorTheme } from '@dahamiz/design-tokens';

type Rgb = [number, number, number];

const parseColor = (color: string): Rgb => {
  const hex = color.match(/^#([\da-f]{6})$/i);
  if (hex) {
    const value = hex[1] ?? '';
    return [
      Number.parseInt(value.slice(0, 2), 16),
      Number.parseInt(value.slice(2, 4), 16),
      Number.parseInt(value.slice(4, 6), 16),
    ];
  }

  const rgba = color.match(/^rgba\((\d+),\s*(\d+),\s*(\d+),\s*([\d.]+)\)$/i);
  if (rgba) {
    const [, red, green, blue, alpha] = rgba;
    return [
      Number(red) * Number(alpha),
      Number(green) * Number(alpha),
      Number(blue) * Number(alpha),
    ];
  }

  throw new Error(`Unsupported color token: ${color}`);
};

const composite = (foreground: string, background: string): Rgb => {
  const foregroundRgba = foreground.match(/^rgba\((\d+),\s*(\d+),\s*(\d+),\s*([\d.]+)\)$/i);
  if (!foregroundRgba) return parseColor(foreground);

  const [, red, green, blue, alpha] = foregroundRgba;
  const opacity = Number(alpha);
  const backgroundRgb = parseColor(background);
  return [
    Number(red) * opacity + backgroundRgb[0] * (1 - opacity),
    Number(green) * opacity + backgroundRgb[1] * (1 - opacity),
    Number(blue) * opacity + backgroundRgb[2] * (1 - opacity),
  ];
};

const luminance = (color: Rgb): number => {
  const linearize = (channel: number): number => {
    const normalized = channel / 255;
    return normalized <= 0.04045 ? normalized / 12.92 : ((normalized + 0.055) / 1.055) ** 2.4;
  };
  return linearize(color[0]) * 0.2126 + linearize(color[1]) * 0.7152 + linearize(color[2]) * 0.0722;
};

const contrastRatio = (foreground: string, background: string): number => {
  const foregroundLuminance = luminance(parseColor(foreground));
  const backgroundLuminance = luminance(parseColor(background));
  const lighter = Math.max(foregroundLuminance, backgroundLuminance);
  const darker = Math.min(foregroundLuminance, backgroundLuminance);
  return (lighter + 0.05) / (darker + 0.05);
};

const expectReadable = (foreground: string, background: string, label: string): void => {
  const backgroundColor = composite(background, '#FFFFFF');
  const backgroundHex = `#${backgroundColor
    .map((channel) => Math.round(channel).toString(16).padStart(2, '0'))
    .join('')}`;
  const ratio = contrastRatio(foreground, backgroundHex);
  if (ratio < 4.5) {
    throw new Error(`${label} contrast ratio ${ratio.toFixed(2)}:1 is below 4.5:1`);
  }
};

const reportStatusKeys: Array<keyof ColorTheme> = [
  'reportSubmitted',
  'reportUnderReview',
  'reportForwarded',
  'reportInvestigating',
  'reportResolved',
  'reportClosed',
  'reportRejected',
  'reportWithdrawn',
];

describe('semantic color contrast', () => {
  it.each([
    ['light', lightTheme],
    ['dark', darkTheme],
  ] as const)('%s theme keeps secondary text and report statuses readable', (_name, theme) => {
    for (const background of [
      theme.backgroundBase,
      theme.backgroundElevated,
      theme.backgroundCard,
    ]) {
      expectReadable(theme.textTertiary, background, 'tertiary text');
    }

    for (const key of reportStatusKeys) {
      expectReadable(theme[key], theme.backgroundCard, key);
    }
  });

  it.each([
    ['light', lightTheme],
    ['dark', darkTheme],
  ] as const)('%s theme keeps status labels readable on their tinted surfaces', (_name, theme) => {
    const statusPairs: Array<[string, string]> = [
      [theme.statusSuccess, theme.statusSuccessBackground],
      [theme.statusWarning, theme.statusWarningBackground],
      [theme.statusError, theme.statusErrorBackground],
      [theme.statusInfo, theme.statusInfoBackground],
    ];

    for (const [foreground, background] of statusPairs) {
      const blendedBackground = composite(background, theme.backgroundCard);
      const backgroundHex = `#${blendedBackground
        .map((channel) => Math.round(channel).toString(16).padStart(2, '0'))
        .join('')}`;
      expect(contrastRatio(foreground, backgroundHex)).toBeGreaterThanOrEqual(4.5);
    }
  });
});
