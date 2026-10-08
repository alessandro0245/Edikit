import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import {
  S3Client,
  PutObjectCommand,
  GetObjectCommand,
  DeleteObjectCommand,
} from '@aws-sdk/client-s3';
import { Upload } from '@aws-sdk/lib-storage';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { Readable } from 'stream';

@Injectable()
export class S3Service {
  private readonly logger = new Logger(S3Service.name);
  private _s3Client: S3Client | null = null;
  private readonly bucketName: string;

  constructor(private readonly configService: ConfigService) {
    this.bucketName = this.configService.get<string>(
      'S3_OUTPUT_BUCKET',
      'edikit-ai-videos-prod',
    );

    const accessKeyId = this.configService.get<string>('AWS_ACCESS_KEY_ID');
    const secretAccessKey = this.configService.get<string>(
      'AWS_SECRET_ACCESS_KEY',
    );

    if (accessKeyId && secretAccessKey) {
      this._s3Client = new S3Client({
        region: this.configService.get<string>('AWS_REGION', 'us-east-1'),
        credentials: { accessKeyId, secretAccessKey },
      });
      this.logger.log('S3 client initialized');
    } else {
      this.logger.warn(
        'AWS credentials not configured — S3 features disabled (local mode)',
      );
    }
  }

  private get s3Client(): S3Client {
    if (!this._s3Client) {
      throw new Error(
        'S3 is not configured. Set AWS_ACCESS_KEY_ID and AWS_SECRET_ACCESS_KEY in .env',
      );
    }
    return this._s3Client;
  }

  isConfigured(): boolean {
    return this._s3Client !== null;
  }

  async uploadBuffer(
    buffer: Buffer,
    key: string,
    contentType: string,
  ): Promise<string> {
    const command = new PutObjectCommand({
      Bucket: this.bucketName,
      Key: key,
      Body: buffer,
      ContentType: contentType,
    });

    await this.s3Client.send(command);
    this.logger.log(`Uploaded ${key} to S3 bucket ${this.bucketName}`);

    return key;
  }

  /**
   * Stream a Node.js Readable directly to S3 via multipart upload.
   * Uses ~0 extra RAM — no full-file buffer needed.
   */
  async uploadStream(
    stream: Readable,
    key: string,
    contentType: string,
  ): Promise<string> {
    const upload = new Upload({
      client: this.s3Client,
      params: {
        Bucket: this.bucketName,
        Key: key,
        Body: stream,
        ContentType: contentType,
      },
      queueSize: 4,        // 4 parallel part uploads
      partSize: 10 * 1024 * 1024, // 10 MB parts
    });

    await upload.done();
    this.logger.log(`Stream-uploaded ${key} to S3 bucket ${this.bucketName}`);

    return key;
  }

  async generatePresignedUrl(
    key: string,
    expiresIn: number = 3600,
    filename?: string,
  ): Promise<string> {
    const downloadFilename = filename || key.split('/').pop() || 'video.mp4';
    const command = new GetObjectCommand({
      Bucket: this.bucketName,
      Key: key,
      ResponseContentDisposition: `attachment; filename="${downloadFilename}"`,
    });

    const url = await getSignedUrl(this.s3Client, command, { expiresIn });
    this.logger.debug(`Generated presigned URL for ${key}`);

    return url;
  }

  async deleteObject(key: string, bucketName?: string): Promise<void> {
    const targetBucket = bucketName || this.bucketName;
    const command = new DeleteObjectCommand({
      Bucket: targetBucket,
      Key: key,
    });

    await this.s3Client.send(command);
    this.logger.log(`Deleted ${key} from S3 bucket ${targetBucket}`);
  }

  getBucketName(): string {
    return this.bucketName;
  }
}
