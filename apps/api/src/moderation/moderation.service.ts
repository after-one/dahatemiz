import { ConflictException, Inject, Injectable, NotFoundException } from '@nestjs/common';
import { ReportStatus } from '@dahamiz/shared-types';
import type { PublicContentReportStatus } from '@dahamiz/shared-types';
import type { AuthenticatedUser } from '../auth/auth.types';
import { DatabaseService } from '../database/database.service';
import { StorageService } from '../media/storage.service';
import type { PublishReportDto, ReviewContentReportDto, ReviewReportDto } from './moderation.dto';

@Injectable()
export class ModerationService {
  constructor(
    @Inject(DatabaseService) private readonly database: DatabaseService,
    @Inject(StorageService) private readonly storage: StorageService,
  ) {}

  async listReportsForReview(user: AuthenticatedUser) {
    return this.database.transaction(async (client) => {
      const result = await client.query<{
        id: string;
        category: string;
        status: ReportStatus;
        description: string | null;
        city: string;
        district: string | null;
        created_at: Date;
        media_count: number;
      }>(
        `SELECT r.id, r.category, r.status, r.description, r.city, r.district, r.created_at,
                count(rm.id)::int AS media_count
         FROM reports r LEFT JOIN report_media rm ON rm.report_id = r.id
         WHERE r.status IN ('SUBMITTED', 'UNDER_REVIEW') AND r.withdrawn_at IS NULL
         GROUP BY r.id ORDER BY r.created_at ASC LIMIT 200`,
      );
      if (result.rows.length) {
        await client.query(
          `INSERT INTO audit_logs (actor_id, action, resource_type, resource_id)
           SELECT u.id, 'REPORT_REVIEW_QUEUE_VIEWED', 'REPORT', queued.id
           FROM users u CROSS JOIN unnest($2::uuid[]) AS queued(id) WHERE u.firebase_uid = $1`,
          [user.uid, result.rows.map((row) => row.id)],
        );
      }
      return {
        data: result.rows.map((row) => ({
          id: row.id,
          category: row.category,
          status: row.status,
          ...(row.description ? { description: row.description } : {}),
          location: { city: row.city, ...(row.district ? { district: row.district } : {}) },
          createdAt: row.created_at.toISOString(),
          hasMedia: row.media_count > 0,
        })),
      };
    });
  }

  async reviewReport(user: AuthenticatedUser, reportId: string, input: ReviewReportDto) {
    const publicMessage =
      input.status === ReportStatus.UNDER_REVIEW
        ? 'Raporunuz ön incelemeye alındı. Bu adım bir ihlal tespiti anlamına gelmez.'
        : 'Raporunuz platform ilkelerine göre yayınlanamadı. Bu karar bir kişi hakkında hukuki tespit değildir.';
    return this.database.transaction(async (client) => {
      const result = await client.query<{ id: string; status: ReportStatus }>(
        `UPDATE reports r SET status = $2, updated_at = NOW()
         FROM users actor WHERE r.id = $1 AND r.status IN ('SUBMITTED', 'UNDER_REVIEW')
           AND r.withdrawn_at IS NULL AND actor.firebase_uid = $3
           AND actor.role IN ('MODERATOR', 'ADMIN') AND actor.deleted_at IS NULL
         RETURNING r.id, r.status`,
        [reportId, input.status, user.uid],
      );
      const report = result.rows[0];
      if (!report) throw new NotFoundException('Report not found or no longer reviewable.');
      await client.query(
        `INSERT INTO report_status_events (report_id, status, public_message, changed_by)
         SELECT $1, $2, $3, id FROM users WHERE firebase_uid = $4`,
        [report.id, input.status, publicMessage, user.uid],
      );
      await client.query(
        `INSERT INTO audit_logs (actor_id, action, resource_type, resource_id)
         SELECT id, $2, 'REPORT', $3 FROM users WHERE firebase_uid = $1`,
        [
          user.uid,
          input.status === ReportStatus.REJECTED ? 'REPORT_REJECTED' : 'REPORT_ACCEPTED_FOR_REVIEW',
          report.id,
        ],
      );
      return { id: report.id, status: report.status, reporterMessage: publicMessage };
    });
  }

  async publishReport(user: AuthenticatedUser, reportId: string, input: PublishReportDto) {
    const derivativeKey = input.derivativeObjectKey?.trim();
    if (derivativeKey) await this.storage.assertDerivativeUploadedObject(derivativeKey);

    try {
      return await this.database.transaction(async (client) => {
        const result = await client.query<{
          id: string;
          category: string;
          title: string;
          body: string | null;
          city: string;
          district: string | null;
          published_at: Date;
        }>(
          `INSERT INTO public_posts (
           source_report_id, category, title, body, derivative_object_key, approximate_location,
           approved_by, approved_at, published_at
         )
         SELECT r.id, r.category, $2, $3, $4,
                CASE WHEN r.precise_location IS NULL THEN NULL ELSE
                  ST_Project(r.precise_location::geography, 400 + random() * 200, random() * 2 * pi())
                END,
                u.id, NOW(), NOW()
         FROM reports r CROSS JOIN users u
         WHERE r.id = $1 AND r.withdrawn_at IS NULL AND r.status <> 'WITHDRAWN'
           AND u.firebase_uid = $5 AND u.role IN ('MODERATOR', 'ADMIN') AND u.deleted_at IS NULL
         RETURNING id, category, title, body, published_at,
           (SELECT city FROM reports WHERE id = source_report_id) AS city,
           (SELECT district FROM reports WHERE id = source_report_id) AS district`,
          [
            reportId,
            input.title.trim(),
            input.body?.trim() || null,
            derivativeKey ?? null,
            user.uid,
          ],
        );
        const post = result.rows[0];
        if (!post) throw new NotFoundException('Report not found or unavailable for publication.');
        await client.query(
          `INSERT INTO audit_logs (actor_id, action, resource_type, resource_id)
         SELECT id, 'PUBLIC_POST_PUBLISHED', 'PUBLIC_POST', $2 FROM users WHERE firebase_uid = $1`,
          [user.uid, post.id],
        );
        return {
          id: post.id,
          category: post.category,
          title: post.title,
          ...(post.body ? { body: post.body } : {}),
          location: {
            ...(post.district ? { district: post.district } : {}),
            city: post.city,
            country: 'TR',
          },
          publishedAt: post.published_at.toISOString(),
        };
      });
    } catch (error) {
      if (isUniqueViolation(error)) {
        throw new ConflictException('A public post already exists for this report.');
      }
      throw error;
    }
  }

  async listContentReports(status?: PublicContentReportStatus) {
    const result = await this.database.query<{
      id: string;
      post_id: string;
      reason: string;
      details: string | null;
      status: PublicContentReportStatus;
      created_at: Date;
      title: string;
      category: string;
    }>(
      `SELECT c.id, c.post_id, c.reason, c.details, c.status, c.created_at, p.title, p.category
       FROM public_content_reports c JOIN public_posts p ON p.id = c.post_id
       WHERE ($1::public_content_report_status IS NULL OR c.status = $1)
       ORDER BY c.created_at ASC LIMIT 200`,
      [status ?? null],
    );
    return {
      data: result.rows.map((row) => ({
        id: row.id,
        postId: row.post_id,
        reason: row.reason,
        ...(row.details ? { details: row.details } : {}),
        status: row.status,
        title: row.title,
        category: row.category,
        createdAt: row.created_at.toISOString(),
      })),
    };
  }

  async reviewContentReport(
    user: AuthenticatedUser,
    reportId: string,
    input: ReviewContentReportDto,
  ) {
    return this.database.transaction(async (client) => {
      const result = await client.query<{ post_id: string; status: PublicContentReportStatus }>(
        `UPDATE public_content_reports c SET status = $2, reviewed_by = u.id, reviewed_at = NOW()
         FROM users u WHERE c.id = $1 AND c.status = 'OPEN' AND u.firebase_uid = $3
           AND u.role IN ('MODERATOR', 'ADMIN') AND u.deleted_at IS NULL
         RETURNING c.post_id, c.status`,
        [reportId, input.status, user.uid],
      );
      const reviewed = result.rows[0];
      if (!reviewed) {
        const existing = await client.query('SELECT 1 FROM public_content_reports WHERE id = $1', [
          reportId,
        ]);
        if (!existing.rowCount) throw new NotFoundException('Content report not found.');
        throw new ConflictException('Content report has already been reviewed.');
      }
      if (input.status === 'ACTIONED') {
        await client.query('UPDATE public_posts SET published_at = NULL WHERE id = $1', [
          reviewed.post_id,
        ]);
      }
      await client.query(
        `INSERT INTO audit_logs (actor_id, action, resource_type, resource_id)
         SELECT id, $2, 'PUBLIC_CONTENT_REPORT', $3 FROM users WHERE firebase_uid = $1`,
        [
          user.uid,
          input.status === 'ACTIONED' ? 'CONTENT_REPORT_ACTIONED' : 'CONTENT_REPORT_DISMISSED',
          reportId,
        ],
      );
      return { id: reportId, status: reviewed.status };
    });
  }
}

function isUniqueViolation(error: unknown): boolean {
  return typeof error === 'object' && error !== null && 'code' in error && error.code === '23505';
}
