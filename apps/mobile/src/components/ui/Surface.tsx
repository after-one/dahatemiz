import { View, type ViewProps, StyleSheet } from 'react-native';
import { radii, spacing } from '@dahamiz/design-tokens';
import { useTheme } from '../../theme/ThemeProvider';

export function Surface({ style, ...props }: ViewProps) {
  const { colors } = useTheme();
  return (
    <View
      {...props}
      style={[
        styles.surface,
        { backgroundColor: colors.backgroundCard, borderColor: colors.borderDefault },
        style,
      ]}
    />
  );
}

const styles = StyleSheet.create({
  surface: {
    borderWidth: 1,
    borderRadius: radii.xl,
    padding: spacing[5],
  },
});
