import { Image, StyleSheet, Text, View } from 'react-native';
import { fontSizes, fontWeights, radii, spacing } from '@dahamiz/design-tokens';
import { useTheme } from '../../theme/ThemeProvider';
import { mascotAssets, type MascotState } from './mascotRegistry';

const dimensions = {
  sm: { width: 48, height: 64 },
  md: { width: 80, height: 107 },
  lg: { width: 160, height: 213 },
  xl: { width: 240, height: 320 },
} as const;

interface MascotSlotProps {
  state: MascotState;
  size: keyof typeof dimensions;
  speechBubble?: string;
  accessibleDescription: string;
}

export function MascotSlot({ state, size, speechBubble, accessibleDescription }: MascotSlotProps) {
  const { colors } = useTheme();
  return (
    <View style={styles.container}>
      <Image
        source={mascotAssets[state]}
        resizeMode="contain"
        accessibilityRole="image"
        accessibilityLabel={accessibleDescription}
        style={dimensions[size]}
      />
      {speechBubble ? (
        <View
          style={[
            styles.bubble,
            { backgroundColor: colors.backgroundCard, borderColor: colors.borderDefault },
          ]}
        >
          <Text style={[styles.speech, { color: colors.textPrimary }]}>{speechBubble}</Text>
        </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { alignItems: 'center', gap: spacing[2] },
  bubble: {
    maxWidth: 280,
    borderWidth: 1,
    borderRadius: radii.lg,
    paddingHorizontal: spacing[4],
    paddingVertical: spacing[3],
  },
  speech: {
    fontSize: fontSizes.sm,
    fontWeight: fontWeights.medium,
    textAlign: 'center',
    lineHeight: 20,
  },
});
