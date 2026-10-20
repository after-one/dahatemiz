import { Pressable, StyleSheet, Text, View } from 'react-native';
import { router } from 'expo-router';
import { ArrowRight, Leaf } from 'lucide-react-native';
import { fontSizes, fontWeights, radii, spacing } from '@dahamiz/design-tokens';
import { ActionButton } from '../src/components/ui/ActionButton';
import { Surface } from '../src/components/ui/Surface';
import { AppScreen, Stack } from '../src/components/screen/AppScreen';
import { LocaleToggle } from '../src/components/screen/LocaleToggle';
import { MascotSlot } from '../src/features/brand/MascotSlot';
import { useLocale } from '../src/lib/locale';
import { useAuthStore } from '../src/features/auth/auth-store';
import { useTheme } from '../src/theme/ThemeProvider';

export default function WelcomeScreen() {
  const { colors } = useTheme();
  const { t } = useLocale();
  const profile = useAuthStore((state) => state.profile);

  return (
    <AppScreen>
      <Stack>
        <View style={styles.topbar}>
          <View style={styles.brand}>
            <View style={[styles.mark, { backgroundColor: colors.brandPrimary }]}>
              <Leaf size={19} color={colors.textOnBrand} />
            </View>
            <Text style={[styles.brandName, { color: colors.textPrimary }]}>{t('appName')}</Text>
          </View>
          <LocaleToggle />
        </View>

        <Surface style={[styles.hero, { backgroundColor: colors.brandHero }]}>
          <Text style={[styles.eyebrow, { color: colors.brandPrimary }]}>
            {t('welcomeEyebrow')}
          </Text>
          <Text accessibilityRole="header" style={[styles.title, { color: colors.textPrimary }]}>
            {t('welcomeTitle')}
          </Text>
          <Text style={[styles.body, { color: colors.textSecondary }]}>{t('welcomeBody')}</Text>
          <View style={styles.mascot}>
            <MascotSlot
              state="welcome"
              size="xl"
              accessibleDescription="Fatih Abi, DahaMiz’in mahalle dostu maskotu"
            />
          </View>
          <View style={styles.heroFoot}>
            <Text style={[styles.footnote, { color: colors.textPrimary }]}>
              {t('welcomeFootnote')}
            </Text>
          </View>
        </Surface>

        <ActionButton
          label={profile ? t('onboardingStart') : t('welcomeCta')}
          onPress={() => router.push(profile ? '/(tabs)/home' : '/onboarding')}
          icon={<ArrowRight size={18} color={colors.textOnBrand} />}
          style={styles.cta}
        />
        <Pressable
          accessibilityRole="link"
          onPress={() => router.push('/brand-preview')}
          style={styles.previewLink}
        >
          <Text style={[styles.previewText, { color: colors.textSecondary }]}>
            {t('designCatalog')}
          </Text>
        </Pressable>
      </Stack>
    </AppScreen>
  );
}

const styles = StyleSheet.create({
  topbar: {
    minHeight: 48,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  brand: { flexDirection: 'row', alignItems: 'center', gap: spacing[2] },
  mark: {
    width: 36,
    height: 36,
    borderRadius: radii.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  brandName: { fontSize: fontSizes.lg, fontWeight: fontWeights.bold, letterSpacing: -0.3 },
  hero: { minHeight: 570, padding: spacing[5], overflow: 'hidden' },
  eyebrow: { fontSize: fontSizes.xs, fontWeight: fontWeights.bold, letterSpacing: 1.4 },
  title: {
    marginTop: spacing[3],
    maxWidth: 290,
    fontSize: 34,
    lineHeight: 40,
    fontWeight: fontWeights.bold,
    letterSpacing: -1,
  },
  body: { marginTop: spacing[3], maxWidth: 280, fontSize: fontSizes.md, lineHeight: 23 },
  mascot: { position: 'absolute', right: -12, bottom: 48 },
  heroFoot: {
    position: 'absolute',
    bottom: spacing[5],
    left: spacing[5],
    right: spacing[5],
    paddingTop: spacing[3],
    borderTopWidth: 1,
    borderColor: 'rgba(49,90,67,0.22)',
  },
  footnote: { fontSize: fontSizes.sm, fontWeight: fontWeights.semibold },
  cta: { minHeight: 56 },
  previewLink: { minHeight: 44, alignItems: 'center', justifyContent: 'center' },
  previewText: { fontSize: fontSizes.xs, textDecorationLine: 'underline' },
});
