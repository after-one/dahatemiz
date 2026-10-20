import { IncidentCategory } from '@dahamiz/shared-types';
import * as SecureStore from 'expo-secure-store';
import {
  clearReportDraft,
  emptyReportDraft,
  loadReportDraft,
  saveReportDraft,
} from './report-storage';

jest.mock('expo-secure-store', () => ({
  getItemAsync: jest.fn(),
  setItemAsync: jest.fn(),
  deleteItemAsync: jest.fn(),
}));

const secureStoreMock = jest.mocked(SecureStore);

describe('report draft secure storage', () => {
  beforeEach(() => jest.clearAllMocks());

  it('round-trips a valid draft through secure storage and clears it on request', async () => {
    const draft = {
      ...emptyReportDraft(),
      category: IncidentCategory.LITTERING,
      evidence: [{ uri: 'file:///private/evidence.jpg', type: 'image' as const, fileName: null }],
      latitude: 38.42,
      longitude: 27.14,
      consent: true,
    };
    secureStoreMock.getItemAsync.mockResolvedValueOnce(JSON.stringify(draft));

    await expect(loadReportDraft()).resolves.toEqual(draft);
    await saveReportDraft(draft);
    expect(secureStoreMock.setItemAsync).toHaveBeenCalledWith(
      'dahamiz.report.draft.v1',
      JSON.stringify(draft),
    );
    await clearReportDraft();
    expect(secureStoreMock.deleteItemAsync).toHaveBeenCalledWith('dahamiz.report.draft.v1');
  });

  it('rejects malformed or out-of-range location data instead of hydrating an unsafe draft', async () => {
    const invalidDraft = { ...emptyReportDraft(), latitude: 95, longitude: 27.14 };
    secureStoreMock.getItemAsync.mockResolvedValueOnce(JSON.stringify(invalidDraft));

    await expect(loadReportDraft()).rejects.toThrow('Saved report draft is invalid.');
  });

  it('rejects evidence records with missing local file references', async () => {
    const invalidDraft = {
      ...emptyReportDraft(),
      evidence: [{ uri: '', type: 'image', fileName: null }],
    };
    secureStoreMock.getItemAsync.mockResolvedValueOnce(JSON.stringify(invalidDraft));

    await expect(loadReportDraft()).rejects.toThrow('Saved report draft is invalid.');
  });
});
