import { useCallback, useState } from 'react';
import { ActivityIndicator, Alert, StyleSheet, Text, View } from 'react-native';
import { router, useFocusEffect } from 'expo-router';
import { Camera, CircleAlert, Clock3, LockKeyhole } from 'lucide-react-native';
import type { ReporterReportView } from '@dahamiz/shared-types';
import { fontSizes, fontWeights, radii, spacing } from '@dahamiz/design-tokens';
import { AppScreen, Stack } from '../../src/components/screen/AppScreen';
import { DemoNotice } from '../../src/components/screen/DemoNotice';
import { ActionButton } from '../../src/components/ui/ActionButton';
import { Surface } from '../../src/components/ui/Surface';
import {
  loadDemoReportHistory,
  loadReportDraft,
  type DemoReportRecord,
} from '../../src/features/reports/report-storage';
import { useLocale } from '../../src/lib/locale';
import { getFirebaseAuth } from '../../src/features/auth/firebase';
import { useAuthStore } from '../../src/features/auth/auth-store';
import { loadMyReports, withdrawMyReport } from '../../src/lib/api-client';
import { useTheme } from '../../src/theme/ThemeProvider';
import { ReporterReportCard } from '../../src/features/reports/ReporterReportCard';

export default function ReportScreen() {
  const { colors } = useTheme();
  const { t } = useLocale();
  const profile = useAuthStore((state) => state.profile);
  const [hasDraft, setHasDraft] = useState(false);
  const [history, setHistory] = useState<DemoReportRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState(false);
  const [serverReports, setServerReports] = useState<ReporterReportView[]>([]);
  const [serverLoading, setServerLoading] = useState(true);
  const [serverError, setServerError] = useState(false);
  const [withdrawingId, setWithdrawingId] = useState<string | null>(null);
  const [withdrawError, setWithdrawError] = useState(false);

  const loadServerHistory = useCallback(async () => {
    setServerLoading(true);
    setServerError(false);
    setWithdrawError(false);
    try {
      if (!profile) {
        setServerReports([]);
        return;
      }
      const user = getFirebaseAuth().currentUser;
      if (!user) {
        setServerReports([]);
        return;
      }
      const { data } = await loadMyReports(await user.getIdToken());
      setServerReports(data);
    } catch {
      setServerError(true);
    } finally {
      setServerLoading(false);
    }
  }, [profile]);

  useFocusEffect(
    useCallback(() => {
      let active = true;
      setLoading(true);
      void Promise.all([loadReportDraft(), loadDemoReportHistory()])
        .then(([draft, reports]) => {
          if (!active) return;
          setHasDraft(Boolean(draft));
          setHistory(reports);
          setLoadError(false);
        })
        .catch(() => {
          if (active) setLoadError(true);
        })
        .finally(() => {
          if (active) setLoading(false);
        });
      return () => {
        active = false;
      };
    }, []),
  );

  useFocusEffect(useCallback(() => void loadServerHistory(), [loadServerHistory]));

  const requestWithdrawal = useCallback(
    (report: ReporterReportView) => {
      Alert.alert(t('reportWithdrawConfirmTitle'), t('reportWithdrawConfirmBody'), [
        { text: t('feedCancel'), style: 'cancel' },
        {
          text: t('reportWithdrawAction'),
          style: 'destructive',
          onPress: () => {
            void (async () => {
              setWithdrawingId(report.id);
              setWithdrawError(false);
              try {
                const user = getFirebaseAuth().currentUser;
                if (!user) throw new Error('Sign-in required.');
                const updated = await withdrawMyReport(await user.getIdToken(), report.id);
                setServerReports((current) =>
                  current.map((item) => (item.id === updated.id ? updated : item)),
                );
                Alert.alert(t('reportWithdrawSuccessTitle'), t('reportWithdrawSuccess'));
              } catch {
                setWithdrawError(true);
              } finally {
                setWithdrawingId(null);
              }
            })();
          },
        },
      ]);
    },
    [t],
  );

  return (
    <AppScreen>
      <Stack>
        <Text accessibilityRole="header" style={[styles.title, { color: colors.textPrimary }]}>
          {t('reportTitle')}
        </Text>
        <Text style={[styles.body, { color: colors.textSecondary }]}>{t('reportBody')}</Text>
        <Surface style={[styles.hero, { backgroundColor: colors.brandHero }]}>
          <View style={[styles.icon, { backgroundColor: colors.backgroundCard }]}>
            <Camera size={28} color={colors.brandPrimary} />
          </View>
          <Text style={[styles.coming, { color: colors.brandPrimary }]}>
            {t('reportUnavailable')}
          </Text>
          <ActionButton
            label={hasDraft ? t('reportResume') : t('reportStart')}
            onPress={() => router.push('/report-flow')}
          />
        </Surface>
        <Surface style={styles.safety}>
          <LockKeyhole size={22} color={colors.statusSuccess} />
          <View style={styles.copy}>
            <Text style={[styles.safetyTitle, { color: colors.textPrimary }]}>
              {t('reportPrivacyTitle')}
            </Text>
            <Text style={[styles.safetyBody, { color: colors.textSecondary }]}>
              {t('reportPrivacyBody')}
            </Text>
          </View>
        </Surface>
        {loadError ? (
          <Surface style={[styles.notice, { backgroundColor: colors.statusWarningBackground }]}>
            <CircleAlert size={18} color={colors.statusWarning} />
            <Text style={[styles.noticeText, { color: colors.textPrimary }]}>
              {t('reportDraftLoadError')}
            </Text>
          </Surface>
        ) : null}
        <View style={styles.historyHeading}>
          <Clock3 size={18} color={colors.brandPrimary} />
          <Text style={[styles.historyTitle, { color: colors.textPrimary }]}>
            {t('reportHistory')}
          </Text>
        </View>
        {loading ? (
          <ActivityIndicator color={colors.brandPrimary} />
        ) : history.length === 0 ? (
          <Text style={[styles.historyEmpty, { color: colors.textSecondary }]}>
            {t('reportHistoryEmpty')}
          </Text>
        ) : (
          history.map((record) => (
            <Surface key={record.id} style={styles.historyCard}>
              <Text style={[styles.historyStatus, { color: colors.brandPrimary }]}>
                {t('reportStatusDemo')}
              </Text>
              <Text style={[styles.historyDate, { color: colors.textSecondary }]}>
                {new Date(record.createdAt).toLocaleDateString()}
              </Text>
            </Surface>
          ))
        )}
        <View style={styles.historyHeading}>
          <Clock3 size={18} color={colors.brandPrimary} />
          <Text style={[styles.historyTitle, { color: colors.textPrimary }]}>
            {t('reportServerHistory')}
          </Text>
        </View>
        {serverLoading ? (
          <ActivityIndicator color={colors.brandPrimary} />
        ) : serverError ? (
          <View style={styles.serverError}>
            <Text style={[styles.historyEmpty, { color: colors.statusError }]}>
              {t('reportServerHistoryError')}
            </Text>
            <ActionButton
              label={t('feedRetry')}
              variant="secondary"
              onPress={() => void loadServerHistory()}
            />
          </View>
        ) : !profile ? (
          <Text style={[styles.historyEmpty, { color: colors.textSecondary }]}>
            {t('reportServerHistorySignIn')}
          </Text>
        ) : serverReports.length === 0 ? (
          <Text style={[styles.historyEmpty, { color: colors.textSecondary }]}>
            {t('reportServerHistoryEmpty')}
          </Text>
        ) : (
          serverReports.map((report) => (
            <ReporterReportCard
              key={report.id}
              report={report}
              withdrawing={withdrawingId === report.id}
              onWithdraw={() => requestWithdrawal(report)}
            />
          ))
        )}
        {withdrawError ? (
          <Text style={[styles.historyEmpty, { color: colors.statusError }]}>
            {t('reportWithdrawError')}
          </Text>
        ) : null}
        <DemoNotice />
      </Stack>
    </AppScreen>
  );
}

const styles = StyleSheet.create({
  title: { fontSize: fontSizes['2xl'], fontWeight: fontWeights.bold },
  body: { fontSize: fontSizes.md, lineHeight: 23 },
  hero: { minHeight: 215, alignItems: 'center', justifyContent: 'center', gap: spacing[4] },
  icon: {
    width: 62,
    height: 62,
    borderRadius: radii.full,
    alignItems: 'center',
    justifyContent: 'center',
  },
  coming: { textAlign: 'center', fontSize: fontSizes.md, fontWeight: fontWeights.bold },
  safety: { flexDirection: 'row', gap: spacing[3] },
  copy: { flex: 1, gap: spacing[2] },
  safetyTitle: { fontSize: fontSizes.md, fontWeight: fontWeights.bold },
  safetyBody: { fontSize: fontSizes.sm, lineHeight: 21 },
  notice: { flexDirection: 'row', gap: spacing[2], padding: spacing[3], borderRadius: radii.md },
  noticeText: { flex: 1, fontSize: fontSizes.xs, lineHeight: 18 },
  historyHeading: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing[2],
    marginTop: spacing[2],
  },
  historyTitle: { fontSize: fontSizes.md, fontWeight: fontWeights.bold },
  historyEmpty: { fontSize: fontSizes.sm, lineHeight: 21 },
  historyCard: { gap: spacing[1] },
  historyStatus: { fontSize: fontSizes.sm, fontWeight: fontWeights.semibold },
  historyDate: { fontSize: fontSizes.xs },
  serverError: { gap: spacing[2] },
});
