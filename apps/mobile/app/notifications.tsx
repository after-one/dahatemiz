import { useCallback, useState } from 'react';
import { ActivityIndicator, Pressable, StyleSheet, Text, View } from 'react-native';
import { useFocusEffect } from 'expo-router';
import { Bell, CircleAlert, Check } from 'lucide-react-native';
import type { InAppNotification } from '@dahamiz/shared-types';
import { fontSizes, fontWeights, spacing } from '@dahamiz/design-tokens';
import { ActionButton } from '../src/components/ui/ActionButton';
import { AppScreen, Stack } from '../src/components/screen/AppScreen';
import { Surface } from '../src/components/ui/Surface';
import { getFirebaseAuth } from '../src/features/auth/firebase';
import { loadEngagementNotifications, markEngagementNotificationRead } from '../src/lib/api-client';
import { useLocale } from '../src/lib/locale';
import { useTheme } from '../src/theme/ThemeProvider';

export default function NotificationsScreen() {
  const { colors } = useTheme();
  const { locale, t } = useLocale();
  const [notifications, setNotifications] = useState<InAppNotification[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    setError(false);
    try {
      const user = getFirebaseAuth().currentUser;
      if (!user) throw new Error('Sign-in required.');
      setNotifications((await loadEngagementNotifications(await user.getIdToken())).data);
    } catch {
      setError(true);
    } finally {
      setLoading(false);
    }
  }, []);

  useFocusEffect(useCallback(() => void load(), [load]));

  async function markRead(id: string) {
    try {
      const user = getFirebaseAuth().currentUser;
      if (!user) throw new Error('Sign-in required.');
      await markEngagementNotificationRead(await user.getIdToken(), id);
      setNotifications((current) =>
        current.map((notification) =>
          notification.id === id
            ? { ...notification, readAt: new Date().toISOString() }
            : notification,
        ),
      );
    } catch {
      setError(true);
    }
  }

  return (
    <AppScreen>
      <Stack>
        <View style={styles.heading}>
          <Text accessibilityRole="header" style={[styles.title, { color: colors.textPrimary }]}>
            {t('notificationsTitle')}
          </Text>
          <Bell size={22} color={colors.brandPrimary} />
        </View>
        {loading ? (
          <ActivityIndicator accessibilityLabel={t('feedLoading')} color={colors.brandPrimary} />
        ) : error ? (
          <Surface style={styles.state}>
            <CircleAlert size={22} color={colors.statusWarning} />
            <Text style={[styles.body, { color: colors.textSecondary }]}>
              {t('notificationsError')}
            </Text>
            <ActionButton label={t('feedRetry')} variant="secondary" onPress={() => void load()} />
          </Surface>
        ) : notifications.length === 0 ? (
          <Surface style={styles.state}>
            <Bell size={22} color={colors.brandPrimary} />
            <Text style={[styles.body, { color: colors.textSecondary }]}>
              {t('notificationsEmpty')}
            </Text>
          </Surface>
        ) : (
          <View style={styles.list}>
            {notifications.map((notification) => (
              <Surface key={notification.id} style={styles.card}>
                <View style={styles.copy}>
                  <Text style={[styles.cardTitle, { color: colors.textPrimary }]}>
                    {t('notificationAttendanceTitle')}
                  </Text>
                  <Text style={[styles.body, { color: colors.textSecondary }]}>
                    {t('notificationAttendanceBody', { event: notification.eventTitle })}
                  </Text>
                  <Text style={[styles.date, { color: colors.textTertiary }]}>
                    {new Date(notification.createdAt).toLocaleString(
                      locale === 'tr' ? 'tr-TR' : 'en-US',
                    )}
                  </Text>
                </View>
                {notification.readAt ? (
                  <Check size={18} color={colors.statusSuccess} />
                ) : (
                  <Pressable
                    accessibilityRole="button"
                    accessibilityLabel={t('notificationMarkRead')}
                    onPress={() => void markRead(notification.id)}
                    style={styles.readButton}
                  >
                    <Text style={[styles.readText, { color: colors.brandPrimary }]}>
                      {t('notificationMarkRead')}
                    </Text>
                  </Pressable>
                )}
              </Surface>
            ))}
          </View>
        )}
      </Stack>
    </AppScreen>
  );
}

const styles = StyleSheet.create({
  heading: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  title: { fontSize: fontSizes['2xl'], fontWeight: fontWeights.bold },
  list: { gap: spacing[3] },
  card: { flexDirection: 'row', alignItems: 'center', gap: spacing[3] },
  copy: { flex: 1, gap: spacing[2] },
  cardTitle: { fontSize: fontSizes.md, fontWeight: fontWeights.bold },
  body: { fontSize: fontSizes.sm, lineHeight: 21 },
  date: { fontSize: fontSizes.xs },
  readButton: { minHeight: 44, justifyContent: 'center', paddingHorizontal: spacing[2] },
  readText: { fontSize: fontSizes.xs, fontWeight: fontWeights.semibold },
  state: { alignItems: 'center', gap: spacing[3] },
});
