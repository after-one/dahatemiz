import { StyleSheet, Text, View } from 'react-native';
import { ReportStatus, type ReporterReportView } from '@dahamiz/shared-types';
import { fontSizes, fontWeights, radii, spacing } from '@dahamiz/design-tokens';
import { useLocale, type TranslationKey } from '../../lib/locale';
import { useTheme } from '../../theme/ThemeProvider';
import { ActionButton } from '../../components/ui/ActionButton';
import { Surface } from '../../components/ui/Surface';

const statusLabels: Record<ReportStatus, TranslationKey> = {
  [ReportStatus.SUBMITTED]: 'reportStatusSubmitted',
  [ReportStatus.UNDER_REVIEW]: 'reportStatusUnderReview',
  [ReportStatus.FORWARDED_TO_AUTHORITY]: 'reportStatusForwarded',
  [ReportStatus.UNDER_INVESTIGATION]: 'reportStatusInvestigation',
  [ReportStatus.RESOLVED]: 'reportStatusResolved',
  [ReportStatus.CLOSED]: 'reportStatusClosed',
  [ReportStatus.REJECTED]: 'reportStatusRejected',
  [ReportStatus.WITHDRAWN]: 'reportStatusWithdrawn',
};

export function ReporterReportCard({
  report,
  withdrawing,
  onWithdraw,
}: {
  report: ReporterReportView;
  withdrawing: boolean;
  onWithdraw: () => void;
}) {
  const { colors } = useTheme();
  const { t, locale } = useLocale();

  return (
    <Surface style={styles.card}>
      {report.statusHistory.map((event, index) => (
        <View key={`${event.status}-${event.timestamp}-${index}`} style={styles.event}>
          <View style={[styles.marker, { backgroundColor: colors.brandPrimary }]} />
          <View style={styles.eventCopy}>
            <Text style={[styles.status, { color: colors.textPrimary }]}>
              {t(statusLabels[event.status])}
            </Text>
            <Text style={[styles.date, { color: colors.textSecondary }]}>
              {new Date(event.timestamp).toLocaleDateString(locale === 'tr' ? 'tr-TR' : 'en-US')}
            </Text>
            {event.publicMessage ? (
              <Text style={[styles.message, { color: colors.textSecondary }]}>
                {event.publicMessage}
              </Text>
            ) : null}
          </View>
        </View>
      ))}
      {report.canWithdraw ? (
        <View style={[styles.action, { borderTopColor: colors.borderDefault }]}>
          <ActionButton
            label={withdrawing ? t('reportWithdrawing') : t('reportWithdrawAction')}
            variant="secondary"
            disabled={withdrawing}
            onPress={onWithdraw}
          />
        </View>
      ) : null}
    </Surface>
  );
}

const styles = StyleSheet.create({
  card: { gap: spacing[3] },
  event: { flexDirection: 'row', gap: spacing[2] },
  marker: { width: 8, height: 8, borderRadius: radii.full, marginTop: 6 },
  eventCopy: { flex: 1, gap: spacing[1] },
  status: { fontSize: fontSizes.sm, fontWeight: fontWeights.semibold },
  date: { fontSize: fontSizes.xs },
  message: { fontSize: fontSizes.sm, lineHeight: 20 },
  action: { borderTopWidth: StyleSheet.hairlineWidth, paddingTop: spacing[3] },
});
