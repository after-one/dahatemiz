import { ConflictException, Inject, Injectable, NotFoundException } from '@nestjs/common';
import type {
  ApiPaginatedResponse,
  IncidentCategory,
  PublicMapMarker,
  PublicPostSummary,
} from '@dahamiz/shared-types';
import type { AuthenticatedUser } from '../auth/auth.types';
import { DatabaseService } from '../database/database.service';
import { StorageService } from '../media/storage.service';
import type {
  CreatePublicContentReportDto,
  PublicContentQueryDto,
  PublicFeedQueryDto,
} from './public-content.dto';

interface PublicPostRow {
  id: string;
  category: IncidentCategory;
  title: string;
  body: string | null;
  derivative_object_key: string | null;
  district: string | null;
  city: string;
  published_at: Date;
}

interface MarkerRow extends Omit<PublicPostRow, 'body' | 'derivative_object_key'> {
  latitude: number;
  longitude: number;
}

@Injectable()
export class PublicContentService {
  constructor(
    @Inject(DatabaseService) private readonly database: DatabaseService,
    @Inject(StorageService) private readonly storage: StorageService,
  ) {}

  async listFeed(query: PublicFeedQueryDto): Promise<ApiPaginatedResponse<PublicPostSummary>> {
    const { where, values } = this.filters(query);
    const count = await this.database.query<{ total: string }>(
      `SELECT count(*)::text AS total FROM public_posts p JOIN reports r ON r.id = p.source_report_id
       WHERE ${where}`,
      values,
    );
    const page = query.page ?? 1;
    const limit = query.limit ?? 20;
    const offset = (page - 1) * limit;
    const rows = await this.database.query<PublicPostRow>(
      `SELECT p.id, p.category, p.title, p.body, p.derivative_object_key, r.district, r.city,
              p.published_at
       FROM public_posts p JOIN reports r ON r.id = p.source_report_id
       WHERE ${where} ORDER BY p.published_at DESC, p.id DESC LIMIT $${values.length + 1} OFFSET $${values.length + 2}`,
      [...values, limit, offset],
    );
    const data = await Promise.all(rows.rows.map((row) => this.toPostSummary(row)));
    const total = Number(count.rows[0]?.total ?? 0);
    return { data, pagination: { total, page, limit, hasNextPage: offset + data.length < total } };
  }

  async listMapMarkers(
    query: PublicContentQueryDto,
  ): Promise<{ data: PublicMapMarker[]; hasMore: boolean }> {
    const { where, values } = this.filters(query);
    const result = await this.database.query<MarkerRow>(
      `SELECT p.id, p.category, p.title, r.district, r.city, p.published_at,
              ST_Y(p.approximate_location::geometry) AS latitude,
              ST_X(p.approximate_location::geometry) AS longitude
       FROM public_posts p JOIN reports r ON r.id = p.source_report_id
       WHERE ${where} AND p.approximate_location IS NOT NULL
       ORDER BY p.published_at DESC, p.id DESC LIMIT 201`,
      values,
    );
    return {
      data: result.rows.slice(0, 200).map((row) => ({
        id: row.id,
        category: row.category,
        title: row.title,
        location: {
          ...(row.district ? { district: row.district } : {}),
          city: row.city,
          country: 'TR',
        },
        coordinates: { latitude: row.latitude, longitude: row.longitude },
        publishedAt: row.published_at.toISOString(),
      })),
      hasMore: result.rows.length > 200,
    };
  }

  async reportContent(
    user: AuthenticatedUser,
    postId: string,
    input: CreatePublicContentReportDto,
    requestId?: string,
  ) {
    try {
      return await this.database.transaction(async (client) => {
        const result = await client.query<{ id: string }>(
          `INSERT INTO public_content_reports (post_id, reporter_id, reason, details)
           SELECT p.id, u.id, $3, $4 FROM public_posts p CROSS JOIN users u
           WHERE p.id = $1 AND p.published_at IS NOT NULL AND p.approved_by IS NOT NULL
             AND p.approved_at IS NOT NULL AND p.source_report_id IN
               (SELECT id FROM reports WHERE withdrawn_at IS NULL)
             AND u.firebase_uid = $2 AND u.deleted_at IS NULL
           RETURNING id`,
          [postId, user.uid, input.reason, input.details ?? null],
        );
        const report = result.rows[0];
        if (!report) throw new NotFoundException('Published content not found.');
        await client.query(
          `INSERT INTO audit_logs (actor_id, action, resource_type, resource_id, request_id)
           SELECT id, 'PUBLIC_CONTENT_REPORTED', 'PUBLIC_POST', $2, $3 FROM users WHERE firebase_uid = $1`,
          [user.uid, postId, requestId ?? null],
        );
        return { id: report.id, status: 'OPEN' as const };
      });
    } catch (error) {
      if (isUniqueViolation(error))
        throw new ConflictException('You have already reported this content.');
      throw error;
    }
  }

  private filters(query: PublicContentQueryDto) {
    const conditions = [
      'p.published_at IS NOT NULL',
      'p.approved_by IS NOT NULL',
      'p.approved_at IS NOT NULL',
      'r.withdrawn_at IS NULL',
    ];
    const values: unknown[] = [];
    if (query.category) {
      values.push(query.category);
      conditions.push(`p.category = $${values.length}`);
    }
    if (query.city?.trim()) {
      values.push(query.city.trim());
      conditions.push(`r.city ILIKE $${values.length}`);
    }
    if (query.district?.trim()) {
      values.push(query.district.trim());
      conditions.push(`r.district ILIKE $${values.length}`);
    }
    return {
      where: conditions.join(' AND '),
      values,
    };
  }

  private async toPostSummary(row: PublicPostRow): Promise<PublicPostSummary> {
    let mediaUrl: string | undefined;
    if (row.derivative_object_key && this.storage.hasPublicBucket()) {
      mediaUrl = await this.storage.createDerivativeReadUrl(
        row.derivative_object_key,
        new Date(Date.now() + 15 * 60 * 1000),
      );
    }
    return {
      id: row.id,
      category: row.category,
      title: row.title,
      ...(row.body ? { body: row.body } : {}),
      ...(mediaUrl ? { mediaUrl } : {}),
      location: {
        ...(row.district ? { district: row.district } : {}),
        city: row.city,
        country: 'TR',
      },
      publishedAt: row.published_at.toISOString(),
    };
  }
}

function isUniqueViolation(error: unknown): boolean {
  return typeof error === 'object' && error !== null && 'code' in error && error.code === '23505';
}
