import { ConfigService } from '@nestjs/config';
import {
  DeleteObjectCommand,
  GetObjectCommand,
  HeadObjectCommand,
  S3Client,
} from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';

import { SIGNED_URL_EXPIRATION_SECONDS } from './storage.constants';
import { StorageService } from './storage.service';

jest.mock('@aws-sdk/s3-request-presigner', () => ({
  getSignedUrl: jest.fn(),
}));

describe('StorageService', () => {
  const send = jest.fn();
  const s3Client = { send } as unknown as S3Client;
  const configService = {
    getOrThrow: jest.fn().mockReturnValue('zest-recipes'),
  } as unknown as ConfigService;
  let service: StorageService;

  beforeEach(() => {
    jest.clearAllMocks();
    service = new StorageService(s3Client, configService);
  });

  it('checks whether an object exists in the configured bucket', async () => {
    send.mockResolvedValueOnce({});

    await expect(service.objectExists('recipes/image.webp')).resolves.toBe(
      true,
    );
    expect(send).toHaveBeenCalledWith(expect.any(HeadObjectCommand));
  });

  it('returns false when S3 reports that the object does not exist', async () => {
    send.mockRejectedValueOnce({
      name: 'NotFound',
      $metadata: { httpStatusCode: 404 },
    });

    await expect(service.objectExists('recipes/missing.webp')).resolves.toBe(
      false,
    );
  });

  it('does not hide unexpected S3 errors', async () => {
    const error = new Error('S3 unavailable');
    send.mockRejectedValueOnce(error);

    await expect(service.objectExists('recipes/image.webp')).rejects.toBe(
      error,
    );
  });

  it('deletes an object from the configured bucket', async () => {
    send.mockResolvedValueOnce({});

    await expect(
      service.deleteObject('recipes/image.webp'),
    ).resolves.toBeUndefined();
    expect(send).toHaveBeenCalledWith(expect.any(DeleteObjectCommand));
  });

  it('generates a temporary signed URL for reading an object', async () => {
    jest.mocked(getSignedUrl).mockResolvedValueOnce('https://signed-url.test');

    await expect(service.getSignedReadUrl('recipes/image.webp')).resolves.toBe(
      'https://signed-url.test',
    );
    expect(getSignedUrl).toHaveBeenCalledWith(
      s3Client,
      expect.any(GetObjectCommand),
      { expiresIn: SIGNED_URL_EXPIRATION_SECONDS },
    );
  });
});
