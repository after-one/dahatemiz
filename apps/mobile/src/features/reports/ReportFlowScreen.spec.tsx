import { fireEvent, render, screen, waitFor } from '@testing-library/react-native';
import * as ImagePicker from 'expo-image-picker';
import { router } from 'expo-router';
import ReportFlowScreen from '../../../app/report-flow';
import { loadReportDraft, saveDemoReportRecord, saveReportDraft } from '../reports/report-storage';
import { LocaleProvider } from '../../lib/locale';
import { ThemeProvider } from '../../theme/ThemeProvider';

jest.mock('expo-router', () => ({ router: { back: jest.fn() } }));
jest.mock('expo-image-picker', () => ({
  launchImageLibraryAsync: jest.fn(),
  requestCameraPermissionsAsync: jest.fn(),
  launchCameraAsync: jest.fn(),
}));
jest.mock('expo-location', () => ({
  requestForegroundPermissionsAsync: jest.fn(),
  getCurrentPositionAsync: jest.fn(),
  Accuracy: { Balanced: 3 },
}));
jest.mock('lucide-react-native', () => new Proxy({}, { get: () => () => null }));
jest.mock('react-native-maps', () => jest.requireActual('../../test-mocks/react-native-maps'));
jest.mock('../brand/MascotSlot', () => ({ MascotSlot: () => null }));
jest.mock('./report-storage', () => ({
  emptyReportDraft: () => ({
    category: null,
    evidence: [],
    description: '',
    eventDate: '',
    district: '',
    latitude: null,
    longitude: null,
    consent: false,
    updatedAt: '2026-10-20T00:00:00.000Z',
  }),
  loadReportDraft: jest.fn(),
  saveReportDraft: jest.fn(),
  saveDemoReportRecord: jest.fn(),
  clearReportDraft: jest.fn(),
}));

function renderScreen() {
  return render(
    <ThemeProvider>
      <LocaleProvider>
        <ReportFlowScreen />
      </LocaleProvider>
    </ThemeProvider>,
  );
}

describe('ReportFlowScreen media draft', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    jest.mocked(loadReportDraft).mockResolvedValue(null);
    jest.mocked(saveReportDraft).mockResolvedValue();
    jest.mocked(ImagePicker.launchImageLibraryAsync).mockResolvedValue({
      canceled: false,
      assets: [
        {
          uri: 'file:///simulator/sample-flower.jpg',
          type: 'image',
          fileName: 'sample-flower.jpg',
          width: 1280,
          height: 960,
          assetId: 'simulator-sample',
          fileSize: 2048,
          mimeType: 'image/jpeg',
          duration: null,
          base64: null,
        },
      ],
    });
  });

  it('adds a picked image to the local draft and exits without submitting a report', async () => {
    renderScreen();

    const chooseMedia = await screen.findByRole('button', { name: 'Fotoğraf veya video seç' });
    fireEvent.press(chooseMedia);

    expect(await screen.findByText('1 dosya eklendi')).toBeTruthy();
    fireEvent.press(screen.getByRole('button', { name: 'Taslağı kaydet ve çık' }));

    await waitFor(() => {
      expect(saveReportDraft).toHaveBeenCalledWith(
        expect.objectContaining({
          evidence: [
            {
              uri: 'file:///simulator/sample-flower.jpg',
              type: 'image',
              fileName: 'sample-flower.jpg',
            },
          ],
        }),
      );
      expect(router.back).toHaveBeenCalledTimes(1);
    });
    expect(saveDemoReportRecord).not.toHaveBeenCalled();
  });

  it('restores a saved image and persists its removal from the draft', async () => {
    jest.mocked(loadReportDraft).mockResolvedValue({
      category: null,
      evidence: [
        {
          uri: 'file:///simulator/restored-sample.jpg',
          type: 'image',
          fileName: 'restored-sample.jpg',
        },
      ],
      description: '',
      eventDate: '',
      district: '',
      latitude: null,
      longitude: null,
      consent: false,
      updatedAt: '2026-10-20T00:00:00.000Z',
    });
    renderScreen();

    expect(await screen.findByText('1 dosya eklendi')).toBeTruthy();
    fireEvent.press(screen.getByRole('button', { name: 'Dosyayı kaldır' }));
    expect(
      await screen.findByText(
        'Henüz dosya eklenmedi. Devam etmek için en az bir fotoğraf veya video seç.',
      ),
    ).toBeTruthy();
    fireEvent.press(screen.getByRole('button', { name: 'Taslağı kaydet ve çık' }));

    await waitFor(() => {
      expect(saveReportDraft).toHaveBeenCalledWith(expect.objectContaining({ evidence: [] }));
      expect(router.back).toHaveBeenCalledTimes(1);
    });
    expect(saveDemoReportRecord).not.toHaveBeenCalled();
  });
});
