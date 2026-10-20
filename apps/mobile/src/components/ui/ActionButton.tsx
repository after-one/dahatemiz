import {
  Pressable,
  StyleSheet,
  Text,
  type PressableProps,
  type StyleProp,
  type ViewStyle,
} from 'react-native';
import type { ReactNode } from 'react';
import { fontSizes, fontWeights, radii, spacing } from '@dahamiz/design-tokens';
import { useTheme } from '../../theme/ThemeProvider';

interface ActionButtonProps extends Omit<PressableProps, 'children' | 'style'> {
  label: string;
  variant?: 'primary' | 'secondary' | 'quiet';
  icon?: ReactNode;
  style?: StyleProp<ViewStyle>;
}

export function ActionButton({
  label,
  variant = 'primary',
  icon,
  style,
  ...props
}: ActionButtonProps) {
  const { colors } = useTheme();
  const backgroundColor =
    variant === 'primary'
      ? colors.brandPrimary
      : variant === 'secondary'
        ? colors.statusSuccessBackground
        : 'transparent';
  const color = variant === 'primary' ? colors.textOnBrand : colors.brandPrimary;

  return (
    <Pressable
      accessibilityRole="button"
      style={({ pressed }) => [
        styles.button,
        { backgroundColor, opacity: pressed ? 0.82 : 1 },
        style,
      ]}
      {...props}
    >
      {icon}
      <Text style={[styles.label, { color }]}>{label}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  button: {
    minHeight: 48,
    paddingHorizontal: spacing[5],
    paddingVertical: spacing[3],
    borderRadius: radii.full,
    justifyContent: 'center',
    alignItems: 'center',
    flexDirection: 'row',
    gap: spacing[2],
  },
  label: { fontSize: fontSizes.sm, fontWeight: fontWeights.semibold, letterSpacing: 0.2 },
});
