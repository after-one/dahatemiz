import { StyleSheet, Text, View } from 'react-native';
import { fontSizes, fontWeights, radii, spacing } from '@dahamiz/design-tokens';
import { useTheme } from '../../theme/ThemeProvider';

export function StatusBadge({ label }: { label: string }) {
  const { colors } = useTheme();
  return (
    <View style={[styles.badge, { backgroundColor: colors.statusSuccessBackground }]}>
      <View style={[styles.dot, { backgroundColor: colors.statusSuccess }]} />
      <Text style={[styles.label, { color: colors.statusSuccess }]}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing[2],
    paddingHorizontal: spacing[3],
    paddingVertical: spacing[2],
    borderRadius: radii.full,
    alignSelf: 'flex-start',
  },
  dot: { width: 7, height: 7, borderRadius: radii.full },
  label: { fontSize: fontSizes.xs, fontWeight: fontWeights.semibold },
});
