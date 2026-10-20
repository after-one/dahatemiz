import { useCallback, useState } from 'react';
import { ActivityIndicator, Pressable, StyleSheet, Text, View } from 'react-native';
import { router, useFocusEffect } from 'expo-router';
import { Bell, LogOut, Moon, Sun, Trophy, UserRound } from 'lucide-react-native';
import type { EngagementPreferences, EngagementSummary } from '@dahamiz/shared-types';
import { fontSizes, fontWeights, radii, spacing } from '@dahamiz/design-tokens';
import { ActionButton } from '../../src/components/ui/ActionButton';
import { AppScreen, Stack } from '../../src/components/screen/AppScreen';
import { LocaleToggle } from '../../src/components/screen/LocaleToggle';
import { Surface } from '../../src/components/ui/Surface';
import { useAuthStore } from '../../src/features/auth/auth-store';
import { getFirebaseAuth } from '../../src/features/auth/firebase';
import { useLocale } from '../../src/lib/locale';
import {
  loadEngagementPreferences,
  loadEngagementSummary,
  updateEngagementPreferences,
} from '../../src/lib/api-client';
import { useTheme } from '../../src/theme/ThemeProvider';

export default function ProfileScreen() {
  const profile = useAuthStore((state) => state.profile);
  const signOut = useAuthStore((state) => state.signOut);
  const { colors, mode, toggleMode } = useTheme();
  const { t } = useLocale();
  const name = profile?.displayName ?? t('fallbackName');
  const [summary, setSummary] = useState<EngagementSummary | null>(null);
  const [preferences, setPreferences] = useState<EngagementPreferences | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [savingPreference, setSavingPreference] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    setError(false);
    try {
      const user = getFirebaseAuth().currentUser;
      if (!user) throw new Error('Sign-in required.');
      const token = await user.getIdToken();
      const [nextSummary, nextPreferences] = await Promise.all([
        loadEngagementSummary(token),
        loadEngagementPreferences(token),
      ]);
      setSummary(nextSummary);
      setPreferences(nextPreferences);
    } catch {
      setError(true);
    } finally {
      setLoading(false);
    }
  }, []);

  useFocusEffect(useCallback(() => void load(), [load]));

  async function updatePreference(key: 'inAppNotificationsEnabled' | 'leaderboardOptIn') {
    if (!preferences || savingPreference) return;
    setSavingPreference(true);
    setError(false);
    try {
      const user = getFirebaseAuth().currentUser;
      if (!user) throw new Error('Sign-in required.');
      const next = { ...preferences, [key]: !preferences[key] };
      setPreferences(await updateEngagementPreferences(await user.getIdToken(), next));
    } catch {
      setError(true);
    } finally {
      setSavingPreference(false);
    }
  }

  function endSession() {
    void signOut();
    router.replace('/welcome');
  }

  return (
    <AppScreen>
      <Stack>
        <Text accessibilityRole="header" style={[styles.title, { color: colors.textPrimary }]}>
          {t('profileTitle')}
        </Text>
        <Surface style={[styles.profileCard, { backgroundColor: colors.brandHero }]}>
          <View style={[styles.avatar, { backgroundColor: colors.backgroundCard }]}>
            <UserRound size={28} color={colors.brandPrimary} />
          </View>
          <View style={styles.profileCopy}>
            <Text style={[styles.name, { color: colors.textPrimary }]}>{name}</Text>
            <Text style={[styles.demoLabel, { color: colors.brandPrimary }]}>
              {t('profileDemo')}
            </Text>
            <Text style={[styles.email, { color: colors.textSecondary }]}>{profile?.email}</Text>
          </View>
        </Surface>
        <Text style={[styles.body, { color: colors.textSecondary }]}>{t('profileBody')}</Text>

        <Surface style={styles.activity}>
          <View style={styles.sectionHeading}>
            <Text style={[styles.sectionTitle, { color: colors.textPrimary }]}>
              {t('profileActivityTitle')}
            </Text>
            <Trophy size={20} color={colors.brandPrimary} />
          </View>
          {loading ? (
            <ActivityIndicator color={colors.brandPrimary} />
          ) : error ? (
            <View style={styles.gap}>
              <Text style={[styles.empty, { color: colors.statusError }]}>
                {t('profileLoadError')}
              </Text>
              <ActionButton
                label={t('feedRetry')}
                variant="secondary"
                onPress={() => void load()}
              />
            </View>
          ) : summary ? (
            <>
              <View style={styles.stats}>
                <Stat label={t('profileXp')} value={`${summary.totalXp} XP`} />
                <Stat label={t('profileLevel')} value={String(summary.level)} />
                <Stat
                  label={t('profileVerifiedEvents')}
                  value={String(summary.verifiedEventCount)}
                />
              </View>
              {summary.achievements.length ? (
                <View style={styles.achievements}>
                  {summary.achievements.map((achievement) => (
                    <View
                      key={achievement.key}
                      style={[
                        styles.achievement,
                        { backgroundColor: colors.statusSuccessBackground },
                      ]}
                    >
                      <Trophy size={15} color={colors.brandPrimary} />
                      <Text style={[styles.achievementText, { color: colors.textPrimary }]}>
                        {t(achievementKey(achievement.key))}
                      </Text>
                    </View>
                  ))}
                </View>
              ) : (
                <Text style={[styles.empty, { color: colors.textSecondary }]}>
                  {t('profileActivityEmpty')}
                </Text>
              )}
            </>
          ) : null}
        </Surface>

        <ActionButton
          label={t('notificationsTitle')}
          variant="secondary"
          icon={<Bell size={18} color={colors.brandPrimary} />}
          onPress={() => router.push('../notifications')}
        />

        <Surface style={styles.preferenceCard}>
          <Text style={[styles.sectionTitle, { color: colors.textPrimary }]}>
            {t('profilePreferences')}
          </Text>
          {preferences ? (
            <>
              <PreferenceRow
                label={t('profileInAppNotifications')}
                value={preferences.inAppNotificationsEnabled}
                disabled={savingPreference}
                colors={colors}
                onPress={() => void updatePreference('inAppNotificationsEnabled')}
              />
              <PreferenceRow
                label={t('profileLeaderboardOptIn')}
                value={preferences.leaderboardOptIn}
                disabled={savingPreference}
                colors={colors}
                onPress={() => void updatePreference('leaderboardOptIn')}
              />
              <Text style={[styles.preferenceNote, { color: colors.textTertiary }]}>
                {t('profilePushUnavailable')}
              </Text>
            </>
          ) : (
            <Text style={[styles.empty, { color: colors.textSecondary }]}>
              {t('profileLoadError')}
            </Text>
          )}
        </Surface>

        <Surface style={styles.settingRow}>
          <Text style={[styles.settingLabel, { color: colors.textPrimary }]}>{t('language')}</Text>
          <LocaleToggle />
        </Surface>
        <Pressable
          accessibilityRole="button"
          onPress={toggleMode}
          style={[
            styles.settingRow,
            { backgroundColor: colors.backgroundCard, borderColor: colors.borderDefault },
          ]}
        >
          <View style={styles.settingName}>
            {mode === 'dark' ? (
              <Sun size={19} color={colors.brandPrimary} />
            ) : (
              <Moon size={19} color={colors.brandPrimary} />
            )}
            <Text style={[styles.settingLabel, { color: colors.textPrimary }]}>{t('theme')}</Text>
          </View>
          <Text style={[styles.settingValue, { color: colors.textSecondary }]}>
            {mode === 'dark' ? t('themeDark') : t('themeLight')}
          </Text>
        </Pressable>
        <Text style={[styles.signOutNote, { color: colors.textSecondary }]}>
          {t('signOutNote')}
        </Text>
        <ActionButton
          label={t('signOut')}
          variant="secondary"
          icon={<LogOut size={17} color={colors.brandPrimary} />}
          onPress={endSession}
        />
      </Stack>
    </AppScreen>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  const { colors } = useTheme();
  return (
    <View style={styles.stat}>
      <Text style={[styles.statValue, { color: colors.brandPrimary }]}>{value}</Text>
      <Text style={[styles.statLabel, { color: colors.textSecondary }]}>{label}</Text>
    </View>
  );
}

function PreferenceRow({
  label,
  value,
  disabled,
  colors,
  onPress,
}: {
  label: string;
  value: boolean;
  disabled: boolean;
  colors: ReturnType<typeof useTheme>['colors'];
  onPress: () => void;
}) {
  const { t } = useLocale();
  return (
    <Pressable
      accessibilityRole="switch"
      accessibilityState={{ checked: value, disabled }}
      disabled={disabled}
      onPress={onPress}
      style={styles.preferenceRow}
    >
      <Text style={[styles.preferenceLabel, { color: colors.textPrimary }]}>{label}</Text>
      <Text
        style={[styles.settingValue, { color: value ? colors.brandPrimary : colors.textTertiary }]}
      >
        {value ? t('profileEnabled') : t('profileDisabled')}
      </Text>
    </Pressable>
  );
}

function achievementKey(
  key: string,
): 'achievementFirstEvent' | 'achievementFiveEvents' | 'achievementTenEvents' {
  if (key === 'fiveVerifiedEvents') return 'achievementFiveEvents';
  if (key === 'tenVerifiedEvents') return 'achievementTenEvents';
  return 'achievementFirstEvent';
}

const styles = StyleSheet.create({
  title: { fontSize: fontSizes['2xl'], fontWeight: fontWeights.bold },
  profileCard: { flexDirection: 'row', alignItems: 'center', gap: spacing[4] },
  avatar: {
    width: 62,
    height: 62,
    borderRadius: radii.full,
    alignItems: 'center',
    justifyContent: 'center',
  },
  profileCopy: { gap: spacing[1] },
  name: { fontSize: fontSizes.xl, fontWeight: fontWeights.bold },
  demoLabel: { fontSize: 10, fontWeight: fontWeights.bold, letterSpacing: 1.1 },
  email: { fontSize: fontSizes.xs },
  body: { fontSize: fontSizes.sm, lineHeight: 21 },
  activity: { gap: spacing[3] },
  sectionHeading: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  sectionTitle: { fontSize: fontSizes.md, fontWeight: fontWeights.bold },
  stats: { flexDirection: 'row', justifyContent: 'space-between', gap: spacing[2] },
  stat: { flex: 1, alignItems: 'center', gap: spacing[1] },
  statValue: { fontSize: fontSizes.lg, fontWeight: fontWeights.bold },
  statLabel: { fontSize: fontSizes.xs, textAlign: 'center' },
  achievements: { gap: spacing[2] },
  achievement: {
    minHeight: 38,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing[2],
    padding: spacing[2],
    borderRadius: radii.md,
  },
  achievementText: { fontSize: fontSizes.xs, fontWeight: fontWeights.semibold },
  empty: { fontSize: fontSizes.sm, lineHeight: 21 },
  gap: { gap: spacing[2] },
  preferenceCard: { gap: spacing[2] },
  preferenceRow: {
    minHeight: 48,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: spacing[3],
  },
  preferenceLabel: { flex: 1, fontSize: fontSizes.sm },
  preferenceNote: { fontSize: fontSizes.xs, lineHeight: 18 },
  settingRow: {
    minHeight: 56,
    borderWidth: 1,
    borderColor: 'transparent',
    borderRadius: radii.lg,
    paddingHorizontal: spacing[4],
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  settingName: { flexDirection: 'row', alignItems: 'center', gap: spacing[3] },
  settingLabel: { fontSize: fontSizes.sm, fontWeight: fontWeights.semibold },
  settingValue: { fontSize: fontSizes.sm },
  signOutNote: { fontSize: fontSizes.xs, textAlign: 'center' },
});
