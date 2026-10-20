import { useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { router } from 'expo-router';
import { Bell, Camera, ShieldCheck, MapPin } from 'lucide-react-native';
import { fontSizes, fontWeights, radii, spacing } from '@dahamiz/design-tokens';
import { ActionButton } from '../src/components/ui/ActionButton';
import { Surface } from '../src/components/ui/Surface';
import { AppScreen, Stack } from '../src/components/screen/AppScreen';
import { ScreenHeader } from '../src/components/screen/ScreenHeader';
import { useLocale } from '../src/lib/locale';
import { useTheme } from '../src/theme/ThemeProvider';

const steps = [
  { icon: ShieldCheck, title: 'onboardingPrivacyTitle', body: 'onboardingPrivacyBody' },
  { icon: Camera, title: 'onboardingCameraTitle', body: 'onboardingCameraBody' },
  { icon: MapPin, title: 'onboardingLocationTitle', body: 'onboardingLocationBody' },
] as const;

export default function OnboardingScreen() {
  const [step, setStep] = useState(0);
  const { colors } = useTheme();
  const { t } = useLocale();
  const current = steps[step]!;
  const Icon = current.icon;
  const last = step === steps.length - 1;

  return (
    <AppScreen>
      <Stack>
        <ScreenHeader title={t('onboardingTitle')} back />
        <Text style={[styles.intro, { color: colors.textSecondary }]}>{t('onboardingBody')}</Text>
        <View accessibilityLabel={`${step + 1} / ${steps.length}`} style={styles.progress}>
          {steps.map((item, index) => (
            <View
              key={item.title}
              style={[
                styles.progressStep,
                { backgroundColor: index <= step ? colors.brandPrimary : colors.borderDefault },
              ]}
            />
          ))}
        </View>
        <Surface style={[styles.card, { backgroundColor: colors.brandHero }]}>
          <View style={[styles.icon, { backgroundColor: colors.backgroundCard }]}>
            <Icon size={30} color={colors.brandPrimary} />
            {step === 2 ? <Bell size={15} color={colors.brandAccent} style={styles.bell} /> : null}
          </View>
          <Text accessibilityRole="header" style={[styles.title, { color: colors.textPrimary }]}>
            {t(current.title)}
          </Text>
          <Text style={[styles.body, { color: colors.textSecondary }]}>{t(current.body)}</Text>
          {last ? (
            <Text style={[styles.noPermission, { color: colors.statusSuccess }]}>
              ✓ {t('permissionNotRequested')}
            </Text>
          ) : null}
        </Surface>
        <ActionButton
          label={last ? t('onboardingStart') : t('onboardingNext')}
          onPress={() => (last ? router.push('/auth') : setStep((value) => value + 1))}
          style={styles.button}
        />
        <Pressable
          accessibilityRole="button"
          onPress={() => router.push('/auth')}
          style={styles.skip}
        >
          <Text style={[styles.skipText, { color: colors.textSecondary }]}>
            {t('onboardingStart')}
          </Text>
        </Pressable>
      </Stack>
    </AppScreen>
  );
}

const styles = StyleSheet.create({
  intro: { fontSize: fontSizes.md, lineHeight: 23 },
  progress: { flexDirection: 'row', gap: spacing[2], marginTop: spacing[2] },
  progressStep: { flex: 1, height: 4, borderRadius: radii.full },
  card: {
    minHeight: 365,
    justifyContent: 'center',
    alignItems: 'flex-start',
    gap: spacing[4],
    padding: spacing[6],
  },
  icon: {
    width: 68,
    height: 68,
    borderRadius: radii.lg,
    alignItems: 'center',
    justifyContent: 'center',
  },
  bell: { position: 'absolute', right: -4, top: -4 },
  title: { fontSize: fontSizes.xl, lineHeight: 27, fontWeight: fontWeights.bold },
  body: { fontSize: fontSizes.md, lineHeight: 24 },
  noPermission: { fontSize: fontSizes.sm, fontWeight: fontWeights.semibold },
  button: { minHeight: 54 },
  skip: { minHeight: 44, alignItems: 'center', justifyContent: 'center' },
  skipText: { fontSize: fontSizes.sm, textDecorationLine: 'underline' },
});
