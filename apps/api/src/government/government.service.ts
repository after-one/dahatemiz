import {
  ConflictException,
  ForbiddenException,
  Inject,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { ReportStatus } from '@dahamiz/shared-types';
import type { AuthenticatedUser } from '../auth/auth.types';
import { DatabaseService } from '../database/database.service';
import { StorageService } from '../media/storage.service';
import type {
  AddCaseNoteDto,
  AddOrganizationMemberDto,
  AssignCaseDto,
  CreateOrganizationDto,
  EvidenceAccessDto,
  UpdateCaseStatusDto,
} from './government.dto';

const REPORTER_STATUS_MESSAGES: Partial<Record<ReportStatus, string>> = {
  [ReportStatus.UNDER_INVESTIGATION]:
    'Raporunuz ilgili kurum tarafından değerlendiriliyor. Bu bilgi bir karar veya ihlal tespiti anlamına gelmez.',
  [ReportStatus.RESOLVED]:
    'Raporunuz için kurum sürecinde bir güncelleme yapıldı. Bu durum tek başına hukuki bir tespit anlamına gelmez.',
  [ReportStatus.CLOSED]:
    'Raporunuzun kurum süreci tamamlandı. Bu durum tek başına hukuki bir tespit anlamına gelmez.',
};

const EVIDENCE_URL_TTL_MS = 5 * 60 * 1000;

@Injectable()
export class GovernmentService {
  constructor(
    @Inject(DatabaseService) private readonly database: DatabaseService,
    @Inject(StorageService) private readonly storage: StorageService,
  ) {}

  async createOrganization(user: AuthenticatedUser, input: CreateOrganizationDto) {
    const result = await this.database.query<{
      id: string;
      name: string;
      slug: string;
      city: string;
    }>(
      `INSERT INTO organizations (name, slug, city, created_by)
       SELECT $2, $3, $4, id FROM users WHERE firebase_uid = $1 AND role = 'ADMIN' AND deleted_at IS NULL
       RETURNING id, name, slug, city`,
      [user.uid, input.name.trim(), input.slug, input.city.trim()],
    );
    const organization = result.rows[0];
    if (!organization) throw new ForbiddenException('Platform administrator access is required.');
    await this.audit(user.uid, 'ORGANIZATION_CREATED', 'ORGANIZATION', organization.id);
    return organization;
  }

  async addOrganizationMember(
    user: AuthenticatedUser,
    organizationId: string,
    input: AddOrganizationMemberDto,
  ) {
    return this.database.transaction(async (client) => {
      const result = await client.query<{ user_id: string; firebase_uid: string; role: string }>(
        `INSERT INTO organization_memberships (organization_id, user_id, role, created_by)
         SELECT o.id, target.id, $3, actor.id
         FROM organizations o CROSS JOIN users actor JOIN users target ON target.firebase_uid = $2
         WHERE o.id = $1 AND o.active = TRUE AND actor.firebase_uid = $4
           AND actor.role = 'ADMIN' AND actor.deleted_at IS NULL AND target.deleted_at IS NULL
         ON CONFLICT (organization_id, user_id) DO UPDATE SET role = EXCLUDED.role
         RETURNING user_id, $2::text AS firebase_uid, role`,
        [organizationId, input.firebaseUid.trim(), input.role, user.uid],
      );
      const member = result.rows[0];
      if (!member) throw new NotFoundException('Organization or user profile not found.');
      await client.query(
        "UPDATE users SET role = 'AUTHORITY_OFFICIAL', updated_at = NOW() WHERE id = $1",
        [member.user_id],
      );
      await client.query(
        `INSERT INTO audit_logs (actor_id, action, resource_type, resource_id)
         SELECT id, 'ORGANIZATION_MEMBER_PROVISIONED', 'ORGANIZATION', $2
         FROM users WHERE firebase_uid = $1`,
        [user.uid, organizationId],
      );
      return { organizationId, firebaseUid: member.firebase_uid, role: member.role };
    });
  }

  async listOrganizations(user: AuthenticatedUser) {
    const result = await this.database.query<{
      id: string;
      name: string;
      slug: string;
      city: string;
      role: 'ORG_ADMIN' | 'OFFICER';
    }>(
      `SELECT o.id, o.name, o.slug, o.city, m.role
       FROM organizations o JOIN organization_memberships m ON m.organization_id = o.id
       JOIN users u ON u.id = m.user_id
       WHERE u.firebase_uid = $1 AND u.deleted_at IS NULL AND o.active = TRUE
       ORDER BY o.name`,
      [user.uid],
    );
    return { data: result.rows };
  }

  async listAvailableOrganizations() {
    const result = await this.database.query<{
      id: string;
      name: string;
      slug: string;
      city: string;
    }>(
      `SELECT id, name, slug, city FROM organizations WHERE active = TRUE ORDER BY name LIMIT 200`,
    );
    return { data: result.rows };
  }

  async forwardCase(user: AuthenticatedUser, organizationId: string, reportId: string) {
    try {
      return await this.database.transaction(async (client) => {
        const result = await client.query<{ case_id: string; report_id: string }>(
          `WITH changed AS (
             UPDATE reports r SET status = 'FORWARDED_TO_AUTHORITY', updated_at = NOW()
             FROM organizations o, users actor
             WHERE r.id = $2 AND o.id = $1 AND o.active = TRUE
               AND o.city ILIKE r.city
               AND r.status IN ('SUBMITTED', 'UNDER_REVIEW') AND r.withdrawn_at IS NULL
               AND actor.firebase_uid = $3 AND actor.role IN ('MODERATOR', 'ADMIN') AND actor.deleted_at IS NULL
             RETURNING r.id
           ), inserted AS (
             INSERT INTO institution_cases (organization_id, report_id, forwarded_by)
             SELECT $1, changed.id, actor.id FROM changed CROSS JOIN users actor WHERE actor.firebase_uid = $3
             RETURNING id, report_id
           )
           SELECT id AS case_id, report_id FROM inserted`,
          [organizationId, reportId, user.uid],
        );
        const row = result.rows[0];
        if (!row) {
          const report = await client.query('SELECT 1 FROM reports WHERE id = $1', [reportId]);
          if (!report.rowCount) throw new NotFoundException('Report not found.');
          throw new ConflictException('Report cannot be forwarded in its current state.');
        }
        await client.query(
          `INSERT INTO report_status_events (report_id, status, public_message, changed_by)
           SELECT $1, 'FORWARDED_TO_AUTHORITY', $2, id FROM users WHERE firebase_uid = $3`,
          [
            row.report_id,
            'Raporunuz ilgili kuruma iletildi. Bu adım bir ihlal tespiti veya karar anlamına gelmez.',
            user.uid,
          ],
        );
        await client.query(
          `INSERT INTO audit_logs (actor_id, action, resource_type, resource_id)
           SELECT id, 'CASE_FORWARDED_TO_ORGANIZATION', 'INSTITUTION_CASE', $2 FROM users WHERE firebase_uid = $1`,
          [user.uid, row.case_id],
        );
        return {
          caseId: row.case_id,
          reportId: row.report_id,
          status: ReportStatus.FORWARDED_TO_AUTHORITY,
        };
      });
    } catch (error) {
      if (isUniqueViolation(error))
        throw new ConflictException('Report has already been forwarded.');
      throw error;
    }
  }

  async listCases(user: AuthenticatedUser, organizationId: string) {
    const result = await this.database.query<CaseListRow>(
      `SELECT c.id AS case_id, r.id AS report_id, r.category, r.status, r.city, r.district,
              r.created_at, c.forwarded_at, assigned.display_name AS assigned_to
       FROM institution_cases c
       JOIN reports r ON r.id = c.report_id
       JOIN organization_memberships m ON m.organization_id = c.organization_id
       JOIN users actor ON actor.id = m.user_id AND actor.firebase_uid = $2 AND actor.deleted_at IS NULL
       LEFT JOIN users assigned ON assigned.id = c.assigned_to
       WHERE c.organization_id = $1
       ORDER BY c.forwarded_at DESC LIMIT 200`,
      [organizationId, user.uid],
    );
    if (result.rows.length)
      await this.audit(user.uid, 'INSTITUTION_CASE_LISTED', 'ORGANIZATION', organizationId);
    else await this.assertOrganizationMember(user.uid, organizationId);
    return { data: result.rows.map(toCaseListItem) };
  }

  async exportCases(user: AuthenticatedUser, organizationId: string) {
    return this.database.transaction(async (client) => {
      const membership = await client.query(
        `SELECT 1 FROM organization_memberships m JOIN users u ON u.id = m.user_id
         JOIN organizations o ON o.id = m.organization_id
         WHERE u.firebase_uid = $1 AND u.deleted_at IS NULL AND m.organization_id = $2 AND o.active = TRUE`,
        [user.uid, organizationId],
      );
      if (!membership.rowCount) throw new NotFoundException('Organization not found.');
      const result = await client.query<CaseListRow>(
        `SELECT c.id AS case_id, r.id AS report_id, r.category, r.status, r.city, r.district,
                r.created_at, c.forwarded_at, assigned.display_name AS assigned_to
         FROM institution_cases c JOIN reports r ON r.id = c.report_id
         JOIN organization_memberships m ON m.organization_id = c.organization_id
         JOIN users actor ON actor.id = m.user_id AND actor.firebase_uid = $2 AND actor.deleted_at IS NULL
         LEFT JOIN users assigned ON assigned.id = c.assigned_to
         WHERE c.organization_id = $1 ORDER BY c.forwarded_at DESC LIMIT 200`,
        [organizationId, user.uid],
      );
      await client.query(
        `INSERT INTO audit_logs (actor_id, action, resource_type, resource_id)
         SELECT id, 'INSTITUTION_CASES_EXPORTED', 'ORGANIZATION', $2 FROM users WHERE firebase_uid = $1`,
        [user.uid, organizationId],
      );
      const fields = [
        'caseId',
        'reportId',
        'category',
        'status',
        'city',
        'district',
        'createdAt',
        'forwardedAt',
        'assignedTo',
      ];
      const csvCell = (value: string | number | null | undefined) =>
        `"${String(value ?? '').replaceAll('"', '""')}"`;
      const rows = result.rows.map((row) => {
        const item = toCaseListItem(row);
        return [
          item.id,
          item.reportId,
          item.category,
          item.status,
          item.location.city,
          item.location.district,
          item.createdAt,
          item.forwardedAt,
          item.assignedTo,
        ]
          .map(csvCell)
          .join(',');
      });
      return `\uFEFF${fields.map(csvCell).join(',')}\r\n${rows.join('\r\n')}`;
    });
  }

  async getCase(user: AuthenticatedUser, organizationId: string, caseId: string) {
    return this.database.transaction(async (client) => {
      const result = await client.query<CaseDetailRow>(
        `SELECT c.id AS case_id, r.id AS report_id, r.category, r.status, r.description,
                r.city, r.district, ST_Y(r.precise_location::geometry) AS latitude,
                ST_X(r.precise_location::geometry) AS longitude, r.created_at, c.forwarded_at,
                assigned.display_name AS assigned_to
         FROM institution_cases c JOIN reports r ON r.id = c.report_id
         JOIN organization_memberships m ON m.organization_id = c.organization_id
         JOIN users actor ON actor.id = m.user_id AND actor.firebase_uid = $3 AND actor.deleted_at IS NULL
         LEFT JOIN users assigned ON assigned.id = c.assigned_to
         WHERE c.organization_id = $1 AND c.id = $2`,
        [organizationId, caseId, user.uid],
      );
      const row = result.rows[0];
      if (!row) throw new NotFoundException('Institution case not found.');
      await client.query(
        `INSERT INTO audit_logs (actor_id, action, resource_type, resource_id)
         SELECT id, 'INSTITUTION_CASE_VIEWED', 'INSTITUTION_CASE', $2 FROM users WHERE firebase_uid = $1`,
        [user.uid, caseId],
      );
      const timeline = await client.query<{
        status: ReportStatus;
        public_message: string | null;
        created_at: Date;
      }>(
        `SELECT status, public_message, created_at FROM report_status_events WHERE report_id = $1 ORDER BY created_at`,
        [row.report_id],
      );
      const notes = await client.query<{
        id: string;
        body: string;
        created_at: Date;
        author: string | null;
      }>(
        `SELECT n.id, n.body, n.created_at, u.display_name AS author
         FROM institution_case_notes n JOIN users u ON u.id = n.author_id
         WHERE n.case_id = $1 ORDER BY n.created_at`,
        [caseId],
      );
      const media = await client.query<{ upload_id: string; media_type: string; created_at: Date }>(
        `SELECT i.upload_id, i.media_type, rm.created_at
         FROM report_media rm JOIN media_upload_intents i ON i.upload_id = rm.upload_id
         WHERE rm.report_id = $1 ORDER BY rm.created_at`,
        [row.report_id],
      );
      return {
        ...toCaseListItem(row),
        description: row.description ?? undefined,
        preciseLocation: { latitude: Number(row.latitude), longitude: Number(row.longitude) },
        statusHistory: timeline.rows.map((event) => ({
          status: event.status,
          ...(event.public_message ? { publicMessage: event.public_message } : {}),
          createdAt: event.created_at.toISOString(),
        })),
        internalNotes: notes.rows.map((note) => ({
          id: note.id,
          body: note.body,
          author: note.author ?? 'Kurum görevlisi',
          createdAt: note.created_at.toISOString(),
        })),
        evidence: media.rows.map((item) => ({
          uploadId: item.upload_id,
          mediaType: item.media_type,
          attachedAt: item.created_at.toISOString(),
        })),
      };
    });
  }

  async assignCase(
    user: AuthenticatedUser,
    organizationId: string,
    caseId: string,
    input: AssignCaseDto,
  ) {
    return this.database.transaction(async (client) => {
      const result = await client.query<{ assigned_to: string }>(
        `UPDATE institution_cases c SET assigned_to = target.id, assigned_at = NOW()
         FROM organization_memberships manager
         JOIN users actor ON actor.id = manager.user_id AND actor.firebase_uid = $4
         JOIN organization_memberships target_membership ON target_membership.organization_id = manager.organization_id
         JOIN users target ON target.id = target_membership.user_id AND target.firebase_uid = $3
         WHERE c.id = $2 AND c.organization_id = $1 AND manager.organization_id = $1
           AND manager.role = 'ORG_ADMIN' AND actor.deleted_at IS NULL
           AND target_membership.role = 'OFFICER' AND target.deleted_at IS NULL
         RETURNING c.assigned_to`,
        [organizationId, caseId, input.firebaseUid.trim(), user.uid],
      );
      const row = result.rows[0];
      if (!row) throw new NotFoundException('Case or organization officer not found.');
      await client.query(
        `INSERT INTO audit_logs (actor_id, action, resource_type, resource_id)
         SELECT id, 'INSTITUTION_CASE_ASSIGNED', 'INSTITUTION_CASE', $2 FROM users WHERE firebase_uid = $1`,
        [user.uid, caseId],
      );
      return { caseId, assigned: true };
    });
  }

  async addNote(
    user: AuthenticatedUser,
    organizationId: string,
    caseId: string,
    input: AddCaseNoteDto,
  ) {
    return this.database.transaction(async (client) => {
      const result = await client.query<{ id: string; created_at: Date }>(
        `INSERT INTO institution_case_notes (case_id, author_id, body)
         SELECT c.id, actor.id, $4 FROM institution_cases c
         JOIN organization_memberships m ON m.organization_id = c.organization_id
         JOIN users actor ON actor.id = m.user_id AND actor.firebase_uid = $3 AND actor.deleted_at IS NULL
         WHERE c.id = $2 AND c.organization_id = $1 RETURNING id, created_at`,
        [organizationId, caseId, user.uid, input.body.trim()],
      );
      const note = result.rows[0];
      if (!note) throw new NotFoundException('Institution case not found.');
      await client.query(
        `INSERT INTO audit_logs (actor_id, action, resource_type, resource_id)
         SELECT id, 'INSTITUTION_CASE_NOTE_ADDED', 'INSTITUTION_CASE', $2 FROM users WHERE firebase_uid = $1`,
        [user.uid, caseId],
      );
      return { id: note.id, createdAt: note.created_at.toISOString() };
    });
  }

  async updateCaseStatus(
    user: AuthenticatedUser,
    organizationId: string,
    caseId: string,
    input: UpdateCaseStatusDto,
  ) {
    const publicMessage = REPORTER_STATUS_MESSAGES[input.status];
    if (!publicMessage)
      throw new ForbiddenException('This status cannot be set by an institution.');
    return this.database.transaction(async (client) => {
      const result = await client.query<{ report_id: string }>(
        `UPDATE reports r SET status = $4, updated_at = NOW()
         FROM institution_cases c JOIN organization_memberships m ON m.organization_id = c.organization_id
         JOIN users actor ON actor.id = m.user_id AND actor.firebase_uid = $3 AND actor.deleted_at IS NULL
         WHERE c.id = $2 AND c.organization_id = $1 AND c.report_id = r.id
           AND r.status IN ('FORWARDED_TO_AUTHORITY', 'UNDER_INVESTIGATION')
         RETURNING r.id AS report_id`,
        [organizationId, caseId, user.uid, input.status],
      );
      const row = result.rows[0];
      if (!row) throw new NotFoundException('Case not found or no longer active.');
      await client.query(
        `INSERT INTO report_status_events (report_id, status, public_message, changed_by)
         SELECT $1, $2, $3, id FROM users WHERE firebase_uid = $4`,
        [row.report_id, input.status, publicMessage, user.uid],
      );
      await client.query(
        `INSERT INTO audit_logs (actor_id, action, resource_type, resource_id)
         SELECT id, 'INSTITUTION_CASE_STATUS_UPDATED', 'INSTITUTION_CASE', $2 FROM users WHERE firebase_uid = $1`,
        [user.uid, caseId],
      );
      return { caseId, status: input.status, reporterMessage: publicMessage };
    });
  }

  async createEvidenceReadUrl(
    user: AuthenticatedUser,
    organizationId: string,
    caseId: string,
    input: EvidenceAccessDto,
    requestId?: string,
  ) {
    const objectResult = await this.database.transaction(async (client) => {
      const result = await client.query<{ upload_id: string; object_key: string }>(
        `SELECT i.upload_id, i.object_key FROM institution_cases c
         JOIN organization_memberships m ON m.organization_id = c.organization_id
         JOIN users actor ON actor.id = m.user_id AND actor.firebase_uid = $3 AND actor.deleted_at IS NULL
         JOIN report_media rm ON rm.report_id = c.report_id
         JOIN media_upload_intents i ON i.upload_id = rm.upload_id
         WHERE c.id = $2 AND c.organization_id = $1 AND i.upload_id = $4`,
        [organizationId, caseId, user.uid, input.uploadId],
      );
      const row = result.rows[0];
      if (!row) throw new NotFoundException('Case evidence not found.');
      await client.query(
        `INSERT INTO audit_logs (actor_id, action, resource_type, resource_id, request_id, context)
         SELECT id, 'INSTITUTION_EVIDENCE_READ_AUTHORIZED', 'MEDIA_UPLOAD', $2, $3, $4
         FROM users WHERE firebase_uid = $1`,
        [user.uid, row.upload_id, requestId ?? null, input.purpose.trim()],
      );
      return row;
    });
    const url = await this.storage.createEvidenceReadUrl(
      objectResult.object_key,
      new Date(Date.now() + EVIDENCE_URL_TTL_MS),
    );
    return { url, expiresInSeconds: EVIDENCE_URL_TTL_MS / 1000 };
  }

  private async assertOrganizationMember(firebaseUid: string, organizationId: string) {
    const result = await this.database.query(
      `SELECT 1 FROM organization_memberships m JOIN users u ON u.id = m.user_id
       JOIN organizations o ON o.id = m.organization_id
       WHERE u.firebase_uid = $1 AND u.deleted_at IS NULL AND m.organization_id = $2 AND o.active = TRUE`,
      [firebaseUid, organizationId],
    );
    if (!result.rowCount) throw new NotFoundException('Organization not found.');
  }

  private async audit(
    firebaseUid: string,
    action: string,
    resourceType: string,
    resourceId: string,
  ) {
    await this.database.query(
      `INSERT INTO audit_logs (actor_id, action, resource_type, resource_id)
       SELECT id, $2, $3, $4 FROM users WHERE firebase_uid = $1`,
      [firebaseUid, action, resourceType, resourceId],
    );
  }
}

interface CaseListRow {
  case_id: string;
  report_id: string;
  category: string;
  status: ReportStatus;
  city: string;
  district: string | null;
  created_at: Date;
  forwarded_at: Date;
  assigned_to: string | null;
}

interface CaseDetailRow extends CaseListRow {
  description: string | null;
  latitude: number | string;
  longitude: number | string;
}

function toCaseListItem(row: CaseListRow) {
  return {
    id: row.case_id,
    reportId: row.report_id,
    category: row.category,
    status: row.status,
    location: { city: row.city, ...(row.district ? { district: row.district } : {}) },
    createdAt: row.created_at.toISOString(),
    forwardedAt: row.forwarded_at.toISOString(),
    assignedTo: row.assigned_to ?? undefined,
  };
}

function isUniqueViolation(error: unknown): boolean {
  return typeof error === 'object' && error !== null && 'code' in error && error.code === '23505';
}
