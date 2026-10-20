import { fireEvent, render, screen } from '@testing-library/react-native';
import { ReportStatus, IncidentCategory, type ReporterReportView } from '@dahamiz/shared-types';
import { ReporterReportCard } from './ReporterReportCard';
import { LocaleProvider } from '../../lib/locale';
import { ThemeProvider } from '../../theme/ThemeProvider';

const report: ReporterReportView = {
  id: 'private-report-id',
  category: IncidentCategory.LITTERING,
  status: ReportStatus.UNDER_REVIEW,
  location: { country: 'TR', city: 'İstanbul', district: 'Kadıköy' },
  description: 'Private description must not be shown here',
  statusHistory: [
    {
      status: ReportStatus.SUBMITTED,
      timestamp: '2026-10-20T10:00:00.000Z',
      publicMessage: 'Bildirimin alındı.',
    },
    { status: ReportStatus.UNDER_REVIEW, timestamp: '2026-10-20T11:00:00.000Z' },
  ],
  createdAt: '2026-10-20T10:00:00.000Z',
  updatedAt: '2026-10-20T11:00:00.000Z',
  canWithdraw: true,
};

function renderCard(props: Partial<React.ComponentProps<typeof ReporterReportCard>> = {}) {
  return render(
    <ThemeProvider>
      <LocaleProvider>
        <ReporterReportCard report={report} withdrawing={false} onWithdraw={jest.fn()} {...props} />
      </LocaleProvider>
    </ThemeProvider>,
  );
}

describe('ReporterReportCard', () => {
  it('shows only reporter-safe statuses and public messages, not private report fields', () => {
    renderCard();

    expect(screen.getByText('Alındı')).toBeTruthy();
    expect(screen.getByText('İnceleniyor')).toBeTruthy();
    expect(screen.getByText('Bildirimin alındı.')).toBeTruthy();
    expect(screen.queryByText('Private description must not be shown here')).toBeNull();
    expect(screen.queryByText('Kadıköy')).toBeNull();
    expect(screen.queryByText('private-report-id')).toBeNull();
  });

  it('offers withdrawal only when allowed and reports activation to the caller', () => {
    const onWithdraw = jest.fn();
    renderCard({ onWithdraw });

    fireEvent.press(screen.getByRole('button', { name: 'Geri çekme isteği gönder' }));
    expect(onWithdraw).toHaveBeenCalledTimes(1);

    renderCard({ report: { ...report, canWithdraw: false } });
    expect(screen.queryByRole('button', { name: 'Geri çekme isteği gönder' })).toBeNull();
  });

  it('announces an in-flight server withdrawal and disables repeat submission', () => {
    renderCard({ withdrawing: true });

    expect(screen.getByRole('button', { name: 'Gönderiliyor…', disabled: true })).toBeTruthy();
  });
});
