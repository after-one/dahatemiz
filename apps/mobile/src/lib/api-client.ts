import type { PublicContentReportReason } from '@dahamiz/shared-types';
import {
  UserRole,
  type ApiCreateReportRequest,
  type ApiPaginatedResponse,
  type ApiUploadTokenRequest,
  type ApiUploadTokenResponse,
  type CommunityEventSummary,
  type CommunityTeamSummary,
  type EngagementPreferences,
  type EngagementSummary,
  type InAppNotification,
  type LeaderboardEntry,
  type TeamLeaderboardEntry,
  type PublicMapMarker,
  type PublicPostSummary,
  type ReporterReportView,
} from '@dahamiz/shared-types';

export interface ApiUserProfile {
  id: string;
  email?: string;
  displayName?: string;
  role: UserRole;
}

export interface PublicContentFilters {
  category?: string;
  city?: string;
  district?: string;
}

export class ApiRequestError extends Error {
  constructor(
    readonly statusCode: number,
    message: string,
  ) {
    super(message);
    this.name = 'ApiRequestError';
  }
}

function getApiBaseUrl(baseUrl = process.env.EXPO_PUBLIC_API_URL): string {
  if (!baseUrl) throw new Error('API URL is not configured.');
  return baseUrl.replace(/\/$/, '');
}

async function requestJson<T>(path: string, init?: RequestInit, baseUrl?: string): Promise<T> {
  const response = await fetch(`${getApiBaseUrl(baseUrl)}${path}`, init);
  if (!response.ok)
    throw new ApiRequestError(response.status, `API request returned ${response.status}.`);
  return (await response.json()) as T;
}

function isUserRole(value: unknown): value is UserRole {
  return (
    value === UserRole.CITIZEN ||
    value === UserRole.MODERATOR ||
    value === UserRole.AUTHORITY_OFFICIAL ||
    value === UserRole.ADMIN
  );
}

function isApiUserProfile(value: unknown): value is ApiUserProfile {
  if (typeof value !== 'object' || value === null || !('id' in value) || !('role' in value)) {
    return false;
  }
  return (
    typeof value.id === 'string' &&
    isUserRole(value.role) &&
    (!('email' in value) || typeof value.email === 'string') &&
    (!('displayName' in value) || typeof value.displayName === 'string')
  );
}

export async function loadAuthenticatedProfile(
  token: string,
  baseUrl = process.env.EXPO_PUBLIC_API_URL,
): Promise<ApiUserProfile> {
  const body = await requestJson<unknown>(
    '/users/me',
    {
      headers: { Authorization: `Bearer ${token}` },
    },
    baseUrl,
  );
  if (!isApiUserProfile(body)) throw new Error('Profile service returned an invalid response.');
  return body;
}

function queryString(filters: PublicContentFilters & { page?: number; limit?: number }): string {
  const query = new URLSearchParams();
  if (filters.category) query.set('category', filters.category);
  if (filters.city?.trim()) query.set('city', filters.city.trim());
  if (filters.district?.trim()) query.set('district', filters.district.trim());
  if (filters.page) query.set('page', String(filters.page));
  if (filters.limit) query.set('limit', String(filters.limit));
  const value = query.toString();
  return value ? `?${value}` : '';
}

export function loadPublicFeed(
  filters: PublicContentFilters & { page?: number; limit?: number } = {},
  baseUrl?: string,
): Promise<ApiPaginatedResponse<PublicPostSummary>> {
  return requestJson(`/public/feed${queryString(filters)}`, undefined, baseUrl);
}

export function loadPublicMap(
  filters: PublicContentFilters = {},
  baseUrl?: string,
): Promise<{ data: PublicMapMarker[]; hasMore: boolean }> {
  return requestJson(`/public/map${queryString(filters)}`, undefined, baseUrl);
}

export function createReport(
  token: string,
  report: ApiCreateReportRequest,
  baseUrl?: string,
): Promise<ReporterReportView> {
  return requestJson(
    '/reports',
    {
      method: 'POST',
      headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
      body: JSON.stringify(report),
    },
    baseUrl,
  );
}

export function loadMyReports(
  token: string,
  baseUrl?: string,
): Promise<{ data: ReporterReportView[] }> {
  return requestJson('/reports', { headers: { Authorization: `Bearer ${token}` } }, baseUrl);
}

export function loadMyReport(
  token: string,
  reportId: string,
  baseUrl?: string,
): Promise<ReporterReportView> {
  return requestJson(
    `/reports/${encodeURIComponent(reportId)}`,
    { headers: { Authorization: `Bearer ${token}` } },
    baseUrl,
  );
}

export function withdrawMyReport(
  token: string,
  reportId: string,
  baseUrl?: string,
): Promise<ReporterReportView> {
  return requestJson(
    `/reports/${encodeURIComponent(reportId)}/withdraw`,
    { method: 'POST', headers: { Authorization: `Bearer ${token}` } },
    baseUrl,
  );
}

export function createEvidenceUploadAuthorization(
  token: string,
  input: ApiUploadTokenRequest,
  baseUrl?: string,
): Promise<ApiUploadTokenResponse> {
  return requestJson(
    '/media/upload-authorizations',
    {
      method: 'POST',
      headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
      body: JSON.stringify(input),
    },
    baseUrl,
  );
}

export function reportPublicPost(
  token: string,
  postId: string,
  reason: PublicContentReportReason,
  details?: string,
  baseUrl?: string,
): Promise<{ id: string; status: 'OPEN' }> {
  return requestJson(
    `/public/posts/${postId}/reports`,
    {
      method: 'POST',
      headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ reason, ...(details?.trim() ? { details: details.trim() } : {}) }),
    },
    baseUrl,
  );
}

export function loadEngagementSummary(token: string, baseUrl?: string): Promise<EngagementSummary> {
  return requestJson('/engagement/me', { headers: { Authorization: `Bearer ${token}` } }, baseUrl);
}

export function loadCommunityEvents(
  token: string,
  baseUrl?: string,
): Promise<{ data: CommunityEventSummary[] }> {
  return requestJson(
    '/engagement/events',
    { headers: { Authorization: `Bearer ${token}` } },
    baseUrl,
  );
}

export function joinCommunityEvent(
  token: string,
  eventId: string,
  baseUrl?: string,
): Promise<{ participantId: string; status: 'RSVP' }> {
  return requestJson(
    `/engagement/events/${eventId}/join`,
    { method: 'POST', headers: { Authorization: `Bearer ${token}` } },
    baseUrl,
  );
}

export function loadLeaderboard(
  city: string,
  district?: string,
  baseUrl?: string,
): Promise<{ data: LeaderboardEntry[] }> {
  const query = new URLSearchParams({ city: city.trim() });
  if (district?.trim()) query.set('district', district.trim());
  return requestJson(`/engagement/leaderboard?${query.toString()}`, undefined, baseUrl);
}

export function loadCommunityTeams(
  token: string,
  city: string,
  district?: string,
  baseUrl?: string,
): Promise<{ data: CommunityTeamSummary[] }> {
  const query = new URLSearchParams({ city: city.trim() });
  if (district?.trim()) query.set('district', district.trim());
  return requestJson(
    `/engagement/teams?${query.toString()}`,
    { headers: { Authorization: `Bearer ${token}` } },
    baseUrl,
  );
}

export function joinCommunityTeam(
  token: string,
  teamId: string,
  baseUrl?: string,
): Promise<{ teamId: string; joined: true }> {
  return requestJson(
    `/engagement/teams/${teamId}/join`,
    { method: 'POST', headers: { Authorization: `Bearer ${token}` } },
    baseUrl,
  );
}

export function leaveCommunityTeam(
  token: string,
  teamId: string,
  baseUrl?: string,
): Promise<{ teamId: string; joined: false }> {
  return requestJson(
    `/engagement/teams/${teamId}/leave`,
    { method: 'POST', headers: { Authorization: `Bearer ${token}` } },
    baseUrl,
  );
}

export function loadTeamLeaderboard(
  city: string,
  district?: string,
  baseUrl?: string,
): Promise<{ data: TeamLeaderboardEntry[] }> {
  const query = new URLSearchParams({ city: city.trim() });
  if (district?.trim()) query.set('district', district.trim());
  return requestJson(`/engagement/teams/leaderboard?${query.toString()}`, undefined, baseUrl);
}

export function loadEngagementPreferences(
  token: string,
  baseUrl?: string,
): Promise<EngagementPreferences> {
  return requestJson(
    '/engagement/preferences',
    { headers: { Authorization: `Bearer ${token}` } },
    baseUrl,
  );
}

export function updateEngagementPreferences(
  token: string,
  preferences: EngagementPreferences,
  baseUrl?: string,
): Promise<EngagementPreferences> {
  return requestJson(
    '/engagement/preferences',
    {
      method: 'PATCH',
      headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
      body: JSON.stringify(preferences),
    },
    baseUrl,
  );
}

export function loadEngagementNotifications(
  token: string,
  baseUrl?: string,
): Promise<{ data: InAppNotification[] }> {
  return requestJson(
    '/engagement/notifications',
    { headers: { Authorization: `Bearer ${token}` } },
    baseUrl,
  );
}

export function markEngagementNotificationRead(
  token: string,
  notificationId: string,
  baseUrl?: string,
): Promise<{ id: string; read: true }> {
  return requestJson(
    `/engagement/notifications/${notificationId}/read`,
    { method: 'POST', headers: { Authorization: `Bearer ${token}` } },
    baseUrl,
  );
}
