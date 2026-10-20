import { Pressable, StyleSheet, Text, View } from 'react-native';
import { ArrowLeft } from 'lucide-react-native';
import { fontSizes, fontWeights, spacing } from '@dahamiz/design-tokens';
import { router } from 'expo-router';
import { useTheme } from '../../theme/ThemeProvider';
import { useLocale } from '../../lib/locale';

interface ScreenHeaderProps {
  title: string;
  back?: boolean;
  action?: React.ReactNode;
}

export function ScreenHeader({ title, back = false, action }: ScreenHeaderProps) {
  const { colors } = useTheme();
  const { t } = useLocale();
  return (
    <View style={styles.row}>
      {back ? (
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={t('navBack')}
          onPress={() => router.back()}
          hitSlop={10}
          style={styles.back}
        >
          <ArrowLeft size={20} color={colors.textPrimary} />
        </Pressable>
      ) : null}
      <Text accessibilityRole="header" style={[styles.title, { color: colors.textPrimary }]}>
        {title}
      </Text>
      {action}
    </View>
  );
}

const styles = StyleSheet.create({
  row: { minHeight: 44, flexDirection: 'row', alignItems: 'center', gap: spacing[3] },
  back: { width: 44, height: 44, borderRadius: 22, alignItems: 'center', justifyContent: 'center' },
  title: { flex: 1, fontSize: fontSizes['2xl'], fontWeight: fontWeights.bold, letterSpacing: -0.5 },
});
