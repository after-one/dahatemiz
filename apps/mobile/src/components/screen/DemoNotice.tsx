import { StyleSheet, Text, View } from 'react-native';
import { Info } from 'lucide-react-native';
import { fontSizes, fontWeights, radii, spacing } from '@dahamiz/design-tokens';
import { useTheme } from '../../theme/ThemeProvider';
import { useLocale } from '../../lib/locale';

export function DemoNotice({ compact = false }: { compact?: boolean }) {
  const { colors } = useTheme();
  const { t } = useLocale();
  return (
    <View style={[styles.box, { backgroundColor: colors.statusInfoBackground }]}>
      <Info size={16} color={colors.statusInfo} />
      <Text style={[styles.text, { color: colors.textPrimary }, compact && styles.compact]}>
        {compact ? t('demoData') : t('demoNotice')}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  box: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: spacing[2],
    padding: spacing[3],
    borderRadius: radii.md,
  },
  text: { flex: 1, fontSize: fontSizes.xs, lineHeight: 17, fontWeight: fontWeights.medium },
  compact: { fontSize: 10, letterSpacing: 0.8, fontWeight: fontWeights.bold },
});
