import { Inject, Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import {
  DeleteObjectCommand,
  GetObjectCommand,
  HeadObjectCommand,
  PutObjectCommand,
  S3Client,
} from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';

import { S3_CLIENT, SIGNED_URL_EXPIRATION_SECONDS } from './storage.constants';

@Injectable()
export class StorageService {
  private readonly bucket: string;

  constructor(
    @Inject(S3_CLIENT) private readonly s3Client: S3Client,
    configService: ConfigService,
  ) {
    this.bucket = configService.getOrThrow<string>('AWS_S3_BUCKET');
  }

  async objectExists(key: string): Promise<boolean> {
    try {
      await this.s3Client.send(
        new HeadObjectCommand({ Bucket: this.bucket, Key: key }),
      );
      return true;
    } catch (error) {
      if (this.isUnavailableObjectError(error)) {
        return false;
      }
      throw error;
    }
  }

  async deleteObject(key: string): Promise<void> {
    await this.s3Client.send(
      new DeleteObjectCommand({ Bucket: this.bucket, Key: key }),
    );
  }

  getSignedReadUrl(key: string): Promise<string> {
    return getSignedUrl(
      this.s3Client,
      new GetObjectCommand({ Bucket: this.bucket, Key: key }),
      { expiresIn: SIGNED_URL_EXPIRATION_SECONDS },
    );
  }

  getSignedUploadUrl(key: string, contentType: string): Promise<string> {
    return getSignedUrl(
      this.s3Client,
      new PutObjectCommand({
        Bucket: this.bucket,
        Key: key,
        ContentType: contentType,
      }),
      { expiresIn: SIGNED_URL_EXPIRATION_SECONDS },
    );
  }

  private isUnavailableObjectError(error: unknown): boolean {
    if (typeof error !== 'object' || error === null) {
      return false;
    }

    const s3Error = error as {
      name?: string;
      $metadata?: { httpStatusCode?: number };
    };

    return (
      s3Error.name === 'NotFound' ||
      s3Error.name === 'NoSuchKey' ||
      s3Error.$metadata?.httpStatusCode === 403 ||
      s3Error.$metadata?.httpStatusCode === 404
    );
  }
}
