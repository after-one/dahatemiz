import { ForbiddenException } from '@nestjs/common';
import { ReportStatus, UserRole } from '@dahamiz/shared-types';
import type { AuthenticatedUser } from '../auth/auth.types';
import type { DatabaseService } from '../database/database.service';
import type { StorageService } from '../media/storage.service';
import { GovernmentService } from './government.service';

const authority: AuthenticatedUser = { uid: 'officer-uid', role: UserRole.AUTHORITY_OFFICIAL };

describe('GovernmentService', () => {
  it('does not let institutions set internal or submission statuses', async () => {
    const database = { transaction: jest.fn() } as unknown as DatabaseService;
    const storage = {} as StorageService;
    const service = new GovernmentService(database, storage);

    await expect(
      service.updateCaseStatus(authority, 'org-1', 'case-1', { status: ReportStatus.REJECTED }),
    ).rejects.toBeInstanceOf(ForbiddenException);
    expect(database.transaction).not.toHaveBeenCalled();
  });

  it('audits the stated purpose before requesting a short-lived private evidence URL', async () => {
    const client = {
      query: jest
        .fn()
        .mockResolvedValueOnce({
          rows: [{ upload_id: 'upload-1', object_key: 'evidence/object-1' }],
        })
        .mockResolvedValueOnce({ rows: [], rowCount: 1 }),
    };
    const database = {
      transaction: jest.fn((operation: (connection: typeof client) => Promise<unknown>) =>
        operation(client),
      ),
    } as unknown as DatabaseService;
    const storage = {
      createEvidenceReadUrl: jest.fn().mockResolvedValue('https://signed.invalid/private-object'),
    } as unknown as StorageService;
    const service = new GovernmentService(database, storage);

    const response = await service.createEvidenceReadUrl(
      authority,
      'organization-1',
      'case-1',
      { uploadId: 'upload-1', purpose: 'Review report material' },
      'request-1',
    );

    expect(client.query).toHaveBeenNthCalledWith(
      1,
      expect.stringContaining('m.organization_id = c.organization_id'),
      ['organization-1', 'case-1', 'officer-uid', 'upload-1'],
    );
    expect(client.query).toHaveBeenNthCalledWith(
      2,
      expect.stringContaining('INSTITUTION_EVIDENCE_READ_AUTHORIZED'),
      ['officer-uid', 'upload-1', 'request-1', 'Review report material'],
    );
    expect(storage.createEvidenceReadUrl).toHaveBeenCalledWith(
      'evidence/object-1',
      expect.any(Date),
    );
    const expiry = (storage.createEvidenceReadUrl as jest.Mock).mock.calls[0]?.[1] as Date;
    expect(expiry.getTime() - Date.now()).toBeLessThanOrEqual(5 * 60 * 1000);
    expect(response.expiresInSeconds).toBe(300);
  });

  it('exports only the requesting organization summary and records the export audit', async () => {
    const client = {
      query: jest
        .fn()
        .mockResolvedValueOnce({ rows: [], rowCount: 1 })
        .mockResolvedValueOnce({
          rows: [
            {
              case_id: 'case-1',
              report_id: 'report-1',
              category: 'LITTERING',
              status: ReportStatus.FORWARDED_TO_AUTHORITY,
              city: 'İzmir',
              district: 'Konak',
              created_at: new Date('2026-10-20T10:00:00Z'),
              forwarded_at: new Date('2026-10-20T11:00:00Z'),
              assigned_to: null,
            },
          ],
        })
        .mockResolvedValueOnce({ rows: [], rowCount: 1 }),
    };
    const database = {
      transaction: jest.fn((operation: (connection: typeof client) => Promise<unknown>) =>
        operation(client),
      ),
    } as unknown as DatabaseService;
    const service = new GovernmentService(database, {} as StorageService);

    const csv = await service.exportCases(authority, 'organization-1');

    expect(csv).toContain(
      '"caseId","reportId","category","status","city","district","createdAt","forwardedAt","assignedTo"',
    );
    expect(csv).toContain('LITTERING');
    expect(csv).not.toContain('latitude');
    expect(csv).not.toContain('internalNotes');
    expect(client.query).toHaveBeenNthCalledWith(
      3,
      expect.stringContaining('INSTITUTION_CASES_EXPORTED'),
      ['officer-uid', 'organization-1'],
    );
  });
});
