import * as SecureStore from 'expo-secure-store';
import { IncidentCategory } from '@dahamiz/shared-types';

const DRAFT_KEY = 'dahamiz.report.draft.v1';
const HISTORY_KEY = 'dahamiz.report.demo-history.v1';

export interface ReportEvidence {
  uri: string;
  type: 'image' | 'video';
  fileName: string | null;
}

export interface ReportDraft {
  category: IncidentCategory | null;
  evidence: ReportEvidence[];
  description: string;
  eventDate: string;
  district: string;
  latitude: number | null;
  longitude: number | null;
  consent: boolean;
  updatedAt: string;
}

export interface DemoReportRecord {
  id: string;
  category: IncidentCategory;
  createdAt: string;
  status: 'DEMO_RECEIVED';
}

export const emptyReportDraft = (): ReportDraft => ({
  category: null,
  evidence: [],
  description: '',
  eventDate: '',
  district: '',
  latitude: null,
  longitude: null,
  consent: false,
  updatedAt: new Date().toISOString(),
});

export async function loadReportDraft(): Promise<ReportDraft | null> {
  const stored = await SecureStore.getItemAsync(DRAFT_KEY);
  if (!stored) return null;
  const value: unknown = JSON.parse(stored);
  if (!isReportDraft(value)) throw new Error('Saved report draft is invalid.');
  return value;
}

export async function saveReportDraft(draft: ReportDraft): Promise<void> {
  await SecureStore.setItemAsync(DRAFT_KEY, JSON.stringify(draft));
}

export async function clearReportDraft(): Promise<void> {
  await SecureStore.deleteItemAsync(DRAFT_KEY);
}

export async function loadDemoReportHistory(): Promise<DemoReportRecord[]> {
  const stored = await SecureStore.getItemAsync(HISTORY_KEY);
  if (!stored) return [];
  const value: unknown = JSON.parse(stored);
  if (!Array.isArray(value)) throw new Error('Saved report history is invalid.');
  return value.filter(isDemoReportRecord).slice(0, 5);
}

export async function saveDemoReportRecord(record: DemoReportRecord): Promise<void> {
  const history = await loadDemoReportHistory();
  await SecureStore.setItemAsync(HISTORY_KEY, JSON.stringify([record, ...history].slice(0, 5)));
}

function isReportDraft(value: unknown): value is ReportDraft {
  if (!value || typeof value !== 'object') return false;
  const draft = value as Partial<ReportDraft>;
  const hasValidLocation =
    (draft.latitude === null && draft.longitude === null) ||
    (typeof draft.latitude === 'number' &&
      Number.isFinite(draft.latitude) &&
      draft.latitude >= -90 &&
      draft.latitude <= 90 &&
      typeof draft.longitude === 'number' &&
      Number.isFinite(draft.longitude) &&
      draft.longitude >= -180 &&
      draft.longitude <= 180);
  return (
    (draft.category === null || isIncidentCategory(draft.category)) &&
    Array.isArray(draft.evidence) &&
    draft.evidence.length <= 3 &&
    draft.evidence.every(
      (item) =>
        typeof item === 'object' &&
        item !== null &&
        typeof item.uri === 'string' &&
        item.uri.length > 0 &&
        (item.type === 'image' || item.type === 'video') &&
        (item.fileName === null || typeof item.fileName === 'string'),
    ) &&
    typeof draft.description === 'string' &&
    typeof draft.eventDate === 'string' &&
    typeof draft.district === 'string' &&
    hasValidLocation &&
    typeof draft.consent === 'boolean' &&
    typeof draft.updatedAt === 'string' &&
    Number.isFinite(Date.parse(draft.updatedAt))
  );
}

function isDemoReportRecord(value: unknown): value is DemoReportRecord {
  if (!value || typeof value !== 'object') return false;
  const record = value as Partial<DemoReportRecord>;
  return (
    typeof record.id === 'string' &&
    isIncidentCategory(record.category) &&
    typeof record.createdAt === 'string' &&
    Number.isFinite(Date.parse(record.createdAt)) &&
    record.status === 'DEMO_RECEIVED'
  );
}

function isIncidentCategory(value: unknown): value is IncidentCategory {
  return typeof value === 'string' && (Object.values(IncidentCategory) as string[]).includes(value);
}
