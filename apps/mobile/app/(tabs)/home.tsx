import { StyleSheet, Text, View } from 'react-native';
import { fontSizes, fontWeights, radii } from '@dahamiz/design-tokens';
import { AppScreen, Stack } from '../../src/components/screen/AppScreen';
import { useAuthStore } from '../../src/features/auth/auth-store';
import { PublicFeed } from '../../src/features/feed/PublicFeed';
import { useLocale } from '../../src/lib/locale';
import { useTheme } from '../../src/theme/ThemeProvider';

export default function HomeScreen() {
  const profile = useAuthStore((state) => state.profile);
  const { colors } = useTheme();
  const { t } = useLocale();
  const name = profile?.displayName ?? t('fallbackName');
  return (
    <AppScreen>
      <Stack>
        <View style={styles.greeting}>
          <View>
            <Text style={[styles.kicker, { color: colors.brandPrimary }]}>
              {t('appName').toUpperCase()}
            </Text>
            <Text style={[styles.hello, { color: colors.textPrimary }]}>
              {t('homeGreeting', { name })}
            </Text>
          </View>
          <View style={[styles.avatar, { backgroundColor: colors.statusSuccessBackground }]}>
            <Text style={[styles.avatarText, { color: colors.brandPrimary }]}>
              {name.slice(0, 1).toLocaleUpperCase()}
            </Text>
          </View>
        </View>

        <PublicFeed />
      </Stack>
    </AppScreen>
  );
}

const styles = StyleSheet.create({
  greeting: {
    minHeight: 54,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  kicker: { fontSize: 10, fontWeight: fontWeights.bold, letterSpacing: 1.3 },
  hello: { marginTop: 3, fontSize: fontSizes.xl, fontWeight: fontWeights.bold },
  avatar: {
    width: 44,
    height: 44,
    borderRadius: radii.full,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: { fontSize: fontSizes.lg, fontWeight: fontWeights.bold },
});
