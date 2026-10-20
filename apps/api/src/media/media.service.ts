import { BadRequestException, Inject, Injectable } from '@nestjs/common';
import { randomUUID } from 'node:crypto';
import { MediaType } from '@dahamiz/shared-types';
import type { AuthenticatedUser } from '../auth/auth.types';
import { DatabaseService } from '../database/database.service';
import { StorageService } from './storage.service';

const UPLOAD_TTL_MS = 15 * 60 * 1000;
const MAX_IMAGE_BYTES = 20 * 1024 * 1024;
const MAX_VIDEO_BYTES = 75 * 1024 * 1024;
const MIME_TYPES: Readonly<Record<MediaType, readonly string[]>> = {
  [MediaType.IMAGE]: ['image/jpeg', 'image/png', 'image/webp', 'image/heic'],
  [MediaType.VIDEO]: ['video/mp4', 'video/quicktime'],
};

@Injectable()
export class MediaService {
  constructor(
    @Inject(DatabaseService) private readonly database: DatabaseService,
    @Inject(StorageService) private readonly storage: StorageService,
  ) {}

  async createUploadAuthorization(
    user: AuthenticatedUser,
    input: { mediaType: MediaType; fileSizeBytes: number; mimeType: string },
    requestId?: string,
  ) {
    const maxBytes = input.mediaType === MediaType.IMAGE ? MAX_IMAGE_BYTES : MAX_VIDEO_BYTES;
    if (
      !MIME_TYPES[input.mediaType].includes(input.mimeType) ||
      input.fileSizeBytes < 1 ||
      input.fileSizeBytes > maxBytes
    ) {
      throw new BadRequestException('Unsupported media type or file size.');
    }
    this.storage.assertConfigured();
    const uploadId = randomUUID();
    const objectKey = `evidence/${randomUUID()}`;
    const expiresAt = new Date(Date.now() + UPLOAD_TTL_MS);
    const result = await this.database.query<{ upload_id: string }>(
      `INSERT INTO media_upload_intents (upload_id, owner_id, object_key, media_type, mime_type, max_file_size_bytes, expires_at)
       SELECT $1, id, $3, $4, $5, $6, $7 FROM users WHERE firebase_uid = $2 AND deleted_at IS NULL
       RETURNING upload_id`,
      [
        uploadId,
        user.uid,
        objectKey,
        input.mediaType,
        input.mimeType,
        input.fileSizeBytes,
        expiresAt,
      ],
    );
    if (!result.rowCount) throw new BadRequestException('User profile is unavailable.');
    const signedUrl = await this.storage.createUploadUrl(objectKey, input.mimeType, expiresAt);
    await this.database.query(
      `INSERT INTO audit_logs (actor_id, action, resource_type, resource_id, request_id)
       SELECT id, 'EVIDENCE_UPLOAD_AUTHORIZED', 'MEDIA_UPLOAD', $2, $3 FROM users WHERE firebase_uid = $1`,
      [user.uid, uploadId, requestId ?? null],
    );
    return { uploadId, signedUrl, expiresAt: expiresAt.toISOString() };
  }

  async assertUploadsReady(
    user: AuthenticatedUser,
    uploadIds: readonly string[],
    requestId?: string,
  ) {
    if (!uploadIds.length) return;
    const result = await this.database.query<{
      upload_id: string;
      object_key: string;
      mime_type: string;
      max_file_size_bytes: string;
    }>(
      `SELECT i.upload_id, i.object_key, i.mime_type, i.max_file_size_bytes
       FROM media_upload_intents i JOIN users u ON u.id = i.owner_id
       WHERE i.upload_id = ANY($1::uuid[]) AND u.firebase_uid = $2 AND i.used_at IS NULL AND i.expires_at > NOW()`,
      [uploadIds, user.uid],
    );
    if (result.rowCount !== uploadIds.length)
      throw new BadRequestException('One or more media uploads are invalid or expired.');
    await this.database.query(
      `INSERT INTO audit_logs (actor_id, action, resource_type, resource_id, request_id)
       SELECT u.id, 'EVIDENCE_METADATA_VALIDATED', 'MEDIA_UPLOAD', requested.upload_id::text, $3
       FROM users u CROSS JOIN unnest($1::uuid[]) AS requested(upload_id) WHERE u.firebase_uid = $2`,
      [uploadIds, user.uid, requestId ?? null],
    );
    await Promise.all(
      result.rows.map((row) =>
        this.storage.assertUploadedObject(
          row.object_key,
          row.mime_type,
          Number(row.max_file_size_bytes),
        ),
      ),
    );
  }
}
