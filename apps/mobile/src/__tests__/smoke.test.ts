import { darkTheme, illustrationSizes, lightTheme, spacing } from '@dahamiz/design-tokens';
import { IncidentCategory, MediaType, ReportStatus } from '@dahamiz/shared-types';
import { createSecureAuthStorage } from '../features/auth/secure-auth-storage';
import {
  loadAuthenticatedProfile,
  createEvidenceUploadAuthorization,
  createReport,
  loadCommunityEvents,
  loadCommunityTeams,
  loadEngagementSummary,
  loadPublicFeed,
  loadPublicMap,
  loadMyReport,
  loadMyReports,
  loadLeaderboard,
  loadTeamLeaderboard,
  joinCommunityTeam,
  leaveCommunityTeam,
  reportPublicPost,
  withdrawMyReport,
} from '../lib/api-client';
import { PublicContentReportReason } from '@dahamiz/shared-types';

describe('Mobile Foundation Smoke Tests', () => {
  it('should import design tokens correctly', () => {
    expect(lightTheme).toBeDefined();
    expect(lightTheme.brandPrimary).toBe('#315A43');
    expect(darkTheme.brandPrimary).toBe('#8EAF94');
    expect(darkTheme.textOnBrand).toBe('#1C1917');
    expect(darkTheme.statusSuccess).toBe('#A8D8B0');
    expect(spacing[4]).toBe(16);
    expect(illustrationSizes.standard).toEqual({ width: 280, height: 180 });
  });

  it('should import shared types and enums correctly', () => {
    expect(IncidentCategory.LITTERING).toBe('LITTERING');
    expect(ReportStatus.SUBMITTED).toBe('SUBMITTED');
  });

  it('persists and clears Firebase auth state using chunked secure storage', async () => {
    const values = new Map<string, string>();
    const storage = createSecureAuthStorage({
      getItemAsync: async (key) => values.get(key) ?? null,
      setItemAsync: async (key, value) => {
        values.set(key, value);
      },
      deleteItemAsync: async (key) => {
        values.delete(key);
      },
    });
    const serializedAuthState = JSON.stringify({ uid: 'user-1', token: 'ž'.repeat(1200) });

    await storage.setItem('firebase:authUser:demo-dahamiz:[DEFAULT]', serializedAuthState);
    expect(await storage.getItem('firebase:authUser:demo-dahamiz:[DEFAULT]')).toBe(
      serializedAuthState,
    );
    await storage.removeItem('firebase:authUser:demo-dahamiz:[DEFAULT]');
    expect(await storage.getItem('firebase:authUser:demo-dahamiz:[DEFAULT]')).toBeNull();
  });

  it('sends Firebase tokens as bearer headers when syncing the profile with the API', async () => {
    const fetchMock = jest.spyOn(globalThis, 'fetch').mockResolvedValue(
      new Response(JSON.stringify({ id: 'user-1', email: 'test@example.test', role: 'CITIZEN' }), {
        status: 200,
        headers: { 'content-type': 'application/json' },
      }),
    );

    try {
      await expect(
        loadAuthenticatedProfile('local-id-token', 'http://localhost:3001/api/v1/'),
      ).resolves.toEqual({
        id: 'user-1',
        email: 'test@example.test',
        role: 'CITIZEN',
      });
      expect(fetchMock).toHaveBeenCalledWith('http://localhost:3001/api/v1/users/me', {
        headers: { Authorization: 'Bearer local-id-token' },
      });
    } finally {
      fetchMock.mockRestore();
    }
  });

  it('loads public feed and map with filters and no authentication headers', async () => {
    const fetchMock = jest
      .spyOn(globalThis, 'fetch')
      .mockImplementation(
        async () =>
          new Response(JSON.stringify({ data: [], pagination: { total: 0 } }), { status: 200 }),
      );
    try {
      await loadPublicFeed(
        { category: 'LITTERING', city: 'İzmir', page: 2, limit: 10 },
        'http://localhost:3001/api/v1',
      );
      await loadPublicMap({ district: 'Konak' }, 'http://localhost:3001/api/v1');
      expect(fetchMock).toHaveBeenNthCalledWith(
        1,
        'http://localhost:3001/api/v1/public/feed?category=LITTERING&city=%C4%B0zmir&page=2&limit=10',
        undefined,
      );
      expect(fetchMock).toHaveBeenNthCalledWith(
        2,
        'http://localhost:3001/api/v1/public/map?district=Konak',
        undefined,
      );
    } finally {
      fetchMock.mockRestore();
    }
  });

  it('submits public content reports with a Firebase bearer token', async () => {
    const fetchMock = jest
      .spyOn(globalThis, 'fetch')
      .mockResolvedValue(
        new Response(JSON.stringify({ id: 'report-1', status: 'OPEN' }), { status: 201 }),
      );
    try {
      await expect(
        reportPublicPost(
          'local-id-token',
          'post-1',
          PublicContentReportReason.INACCURATE,
          'Incorrect location',
          'http://localhost:3001/api/v1',
        ),
      ).resolves.toEqual({ id: 'report-1', status: 'OPEN' });
      expect(fetchMock).toHaveBeenCalledWith(
        'http://localhost:3001/api/v1/public/posts/post-1/reports',
        {
          method: 'POST',
          headers: {
            Authorization: 'Bearer local-id-token',
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            reason: PublicContentReportReason.INACCURATE,
            details: 'Incorrect location',
          }),
        },
      );
    } finally {
      fetchMock.mockRestore();
    }
  });

  it('uses the authenticated private-report and signed-upload API contracts', async () => {
    const report = {
      id: 'report-1',
      category: IncidentCategory.LITTERING,
      status: ReportStatus.SUBMITTED,
      location: { district: 'Konak', city: 'İzmir', country: 'TR' },
      statusHistory: [{ status: ReportStatus.SUBMITTED, timestamp: '2026-01-01T00:00:00.000Z' }],
      createdAt: '2026-01-01T00:00:00.000Z',
      updatedAt: '2026-01-01T00:00:00.000Z',
      canWithdraw: true,
    };
    const fetchMock = jest.spyOn(globalThis, 'fetch').mockImplementation(
      async () =>
        new Response(
          JSON.stringify({
            ...report,
            data: [report],
            uploadId: 'upload-1',
            signedUrl: 'https://storage.example.test/upload',
            expiresAt: '2026-01-01T00:15:00.000Z',
          }),
          {
            status: 200,
          },
        ),
    );
    const baseUrl = 'http://localhost:3001/api/v1';
    const token = 'local-id-token';
    const reportInput = {
      category: IncidentCategory.LITTERING,
      latitude: 38.42,
      longitude: 27.14,
      city: 'İzmir',
      district: 'Konak',
      mediaUploadIds: [],
      privacyConsentGiven: true as const,
    };

    try {
      await createEvidenceUploadAuthorization(
        token,
        { mediaType: MediaType.IMAGE, fileSizeBytes: 1200, mimeType: 'image/jpeg' },
        baseUrl,
      );
      await createReport(token, reportInput, baseUrl);
      await loadMyReports(token, baseUrl);
      await loadMyReport(token, 'report-1', baseUrl);
      await withdrawMyReport(token, 'report-1', baseUrl);

      expect(fetchMock.mock.calls.map(([url]) => url)).toEqual([
        `${baseUrl}/media/upload-authorizations`,
        `${baseUrl}/reports`,
        `${baseUrl}/reports`,
        `${baseUrl}/reports/report-1`,
        `${baseUrl}/reports/report-1/withdraw`,
      ]);
      expect(fetchMock).toHaveBeenNthCalledWith(2, `${baseUrl}/reports`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
        body: JSON.stringify(reportInput),
      });
      expect(fetchMock).toHaveBeenNthCalledWith(1, `${baseUrl}/media/upload-authorizations`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({
          mediaType: MediaType.IMAGE,
          fileSizeBytes: 1200,
          mimeType: 'image/jpeg',
        }),
      });
    } finally {
      fetchMock.mockRestore();
    }
  });

  it('loads engagement data with authentication and city leaderboard filters', async () => {
    const fetchMock = jest
      .spyOn(globalThis, 'fetch')
      .mockImplementation(async () => new Response(JSON.stringify({ data: [] }), { status: 200 }));
    try {
      await loadCommunityEvents('community-token', 'http://localhost:3001/api/v1');
      await loadEngagementSummary('community-token', 'http://localhost:3001/api/v1');
      await loadLeaderboard('İzmir', 'Konak', 'http://localhost:3001/api/v1');
      expect(fetchMock).toHaveBeenNthCalledWith(
        1,
        'http://localhost:3001/api/v1/engagement/events',
        {
          headers: { Authorization: 'Bearer community-token' },
        },
      );
      expect(fetchMock).toHaveBeenNthCalledWith(2, 'http://localhost:3001/api/v1/engagement/me', {
        headers: { Authorization: 'Bearer community-token' },
      });
      expect(fetchMock).toHaveBeenNthCalledWith(
        3,
        'http://localhost:3001/api/v1/engagement/leaderboard?city=%C4%B0zmir&district=Konak',
        undefined,
      );
    } finally {
      fetchMock.mockRestore();
    }
  });

  it('loads teams and team scores while keeping membership actions authenticated', async () => {
    const fetchMock = jest
      .spyOn(globalThis, 'fetch')
      .mockImplementation(async () => new Response(JSON.stringify({ data: [] }), { status: 200 }));
    try {
      await loadCommunityTeams('team-token', 'İzmir', 'Konak', 'http://localhost:3001/api/v1');
      await joinCommunityTeam('team-token', 'team-1', 'http://localhost:3001/api/v1');
      await leaveCommunityTeam('team-token', 'team-1', 'http://localhost:3001/api/v1');
      await loadTeamLeaderboard('İzmir', 'Konak', 'http://localhost:3001/api/v1');

      expect(fetchMock).toHaveBeenNthCalledWith(
        1,
        'http://localhost:3001/api/v1/engagement/teams?city=%C4%B0zmir&district=Konak',
        { headers: { Authorization: 'Bearer team-token' } },
      );
      expect(fetchMock).toHaveBeenNthCalledWith(
        2,
        'http://localhost:3001/api/v1/engagement/teams/team-1/join',
        {
          method: 'POST',
          headers: { Authorization: 'Bearer team-token' },
        },
      );
      expect(fetchMock).toHaveBeenNthCalledWith(
        3,
        'http://localhost:3001/api/v1/engagement/teams/team-1/leave',
        {
          method: 'POST',
          headers: { Authorization: 'Bearer team-token' },
        },
      );
      expect(fetchMock).toHaveBeenNthCalledWith(
        4,
        'http://localhost:3001/api/v1/engagement/teams/leaderboard?city=%C4%B0zmir&district=Konak',
        undefined,
      );
    } finally {
      fetchMock.mockRestore();
    }
  });
});
