import type { Bucket } from '@google-cloud/storage';
import { Storage } from '@google-cloud/storage';
import { ServiceUnavailableException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { StorageService } from './storage.service';

describe('StorageService', () => {
  afterEach(() => jest.restoreAllMocks());

  it('signs a private, content-type-bound, create-only V4 upload for 15 minutes', async () => {
    const file = {
      getSignedUrl: jest.fn().mockResolvedValue(['https://storage.test/private-upload']),
    };
    const bucket = { file: jest.fn().mockReturnValue(file) };
    jest.spyOn(Storage.prototype, 'bucket').mockReturnValue(bucket as unknown as Bucket);
    const service = new StorageService(
      new ConfigService({ GCS_PROJECT_ID: 'local-test', GCS_BUCKET_EVIDENCE: 'private-evidence' }),
    );
    const expiresAt = new Date('2026-10-20T12:15:00.000Z');

    await expect(
      service.createUploadUrl('evidence/opaque-id', 'image/jpeg', expiresAt),
    ).resolves.toBe('https://storage.test/private-upload');
    expect(bucket.file).toHaveBeenCalledWith('evidence/opaque-id');
    expect(file.getSignedUrl).toHaveBeenCalledWith({
      version: 'v4',
      action: 'write',
      expires: expiresAt,
      contentType: 'image/jpeg',
      queryParams: { ifGenerationMatch: '0' },
    });
  });

  it('does not fabricate a signed URL when private storage is unavailable', () => {
    const service = new StorageService(new ConfigService({}));

    expect(() => service.assertConfigured()).toThrow(ServiceUnavailableException);
  });

  it('fails closed when private evidence and public derivatives are configured to share a bucket', async () => {
    const bucket = { file: jest.fn() };
    jest.spyOn(Storage.prototype, 'bucket').mockReturnValue(bucket as unknown as Bucket);
    const service = new StorageService(
      new ConfigService({
        GCS_PROJECT_ID: 'local-test',
        GCS_BUCKET_EVIDENCE: 'shared-media',
        GCS_BUCKET_PUBLIC: 'shared-media',
      }),
    );

    expect(service.hasPublicBucket()).toBe(false);
    expect(() => service.assertConfigured()).toThrow(ServiceUnavailableException);
    await expect(
      service.createDerivativeReadUrl('derivatives/approved.webp', new Date()),
    ).rejects.toThrow(ServiceUnavailableException);
    expect(bucket.file).not.toHaveBeenCalled();
  });
});
