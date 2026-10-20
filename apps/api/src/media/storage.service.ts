import { Inject, Injectable, ServiceUnavailableException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Storage } from '@google-cloud/storage';

@Injectable()
export class StorageService {
  private readonly storage: Storage | undefined;
  private readonly evidenceBucket: string | undefined;
  private readonly publicBucket: string | undefined;
  private readonly bucketsMustBeSeparate: boolean;

  constructor(@Inject(ConfigService) config: ConfigService) {
    const projectId = config.get<string>('GCS_PROJECT_ID');
    this.evidenceBucket = config.get<string>('GCS_BUCKET_EVIDENCE');
    this.publicBucket = config.get<string>('GCS_BUCKET_PUBLIC');
    this.bucketsMustBeSeparate =
      Boolean(this.evidenceBucket && this.publicBucket) &&
      this.evidenceBucket === this.publicBucket;
    if (projectId && (this.evidenceBucket || this.publicBucket))
      this.storage = new Storage({ projectId });
  }

  async createUploadUrl(objectKey: string, mimeType: string, expiresAt: Date): Promise<string> {
    const file = this.getFile(objectKey);
    const [url] = await file.getSignedUrl({
      version: 'v4',
      action: 'write',
      expires: expiresAt,
      contentType: mimeType,
      queryParams: { ifGenerationMatch: '0' },
    });
    return url;
  }

  assertConfigured(): void {
    this.getFile('configuration-check');
  }

  async assertUploadedObject(objectKey: string, mimeType: string, maxBytes: number): Promise<void> {
    const [metadata] = await this.getFile(objectKey).getMetadata();
    const size = Number(metadata.size ?? 0);
    if (metadata.contentType !== mimeType || size <= 0 || size > maxBytes) {
      throw new ServiceUnavailableException(
        'Uploaded media does not match its authorized type or size.',
      );
    }
  }

  async createDerivativeReadUrl(objectKey: string, expiresAt: Date): Promise<string> {
    const file = this.getDerivativeFile(objectKey);
    const [url] = await file.getSignedUrl({ version: 'v4', action: 'read', expires: expiresAt });
    return url;
  }

  async createEvidenceReadUrl(objectKey: string, expiresAt: Date): Promise<string> {
    const file = this.getFile(objectKey);
    const [url] = await file.getSignedUrl({ version: 'v4', action: 'read', expires: expiresAt });
    return url;
  }

  async assertDerivativeUploadedObject(objectKey: string): Promise<void> {
    const [metadata] = await this.getDerivativeFile(objectKey).getMetadata();
    const size = Number(metadata.size ?? 0);
    const contentType = metadata.contentType ?? '';
    if (
      size <= 0 ||
      size > 50 * 1024 * 1024 ||
      !['image/jpeg', 'image/png', 'image/webp', 'video/mp4'].includes(contentType)
    ) {
      throw new ServiceUnavailableException(
        'Public derivative does not match an approved media type or size.',
      );
    }
  }

  hasPublicBucket(): boolean {
    return Boolean(this.storage && this.publicBucket && !this.bucketsMustBeSeparate);
  }

  private getFile(objectKey: string) {
    if (this.bucketsMustBeSeparate)
      throw new ServiceUnavailableException(
        'Private evidence and reviewed derivatives must use separate buckets.',
      );
    if (!this.storage || !this.evidenceBucket)
      throw new ServiceUnavailableException('Private evidence storage is not configured.');
    return this.storage.bucket(this.evidenceBucket).file(objectKey);
  }

  private getDerivativeFile(objectKey: string) {
    if (!objectKey.startsWith('derivatives/') || objectKey.startsWith('evidence/')) {
      throw new ServiceUnavailableException(
        'Only reviewed derivative objects can be served publicly.',
      );
    }
    if (this.bucketsMustBeSeparate)
      throw new ServiceUnavailableException(
        'Private evidence and reviewed derivatives must use separate buckets.',
      );
    if (!this.storage || !this.publicBucket) {
      throw new ServiceUnavailableException('Reviewed derivative storage is not configured.');
    }
    return this.storage.bucket(this.publicBucket).file(objectKey);
  }
}
