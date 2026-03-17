import {
  BadRequestException,
  Injectable,
  Logger,
} from '@nestjs/common';
import { S3Service } from '../s3/s3.service';
import { v4 as uuidv4 } from 'uuid';

export type AssetType = 'logo' | 'background' | 'watermark' | 'media';

export interface UploadedAsset {
  assetType: AssetType;
  s3Key: string;
  url: string;         // presigned URL — passed to Remotion
  contentType: string;
  sizeBytes: number;
}

const ALLOWED_MIME_TYPES = new Set([
  'image/png',
  'image/jpeg',
  'image/jpg',
  'image/webp',
  'image/svg+xml',
  'video/mp4',
  'video/webm',
]);

const MAX_SIZE_BYTES = 5 * 1024 * 1024; // 5MB

@Injectable()
export class AssetsService {
  private readonly logger = new Logger(AssetsService.name);

  constructor(private readonly s3Service: S3Service) {}

  async uploadAsset(
    userId: string,
    assetType: AssetType,
    buffer: Buffer,
    originalName: string,
    mimeType: string,
  ): Promise<UploadedAsset> {
    // ── Validate mime type ──
    if (!ALLOWED_MIME_TYPES.has(mimeType)) {
      throw new BadRequestException(
        `Invalid file type "${mimeType}". Allowed: PNG, JPEG, WEBP, SVG.`,
      );
    }

    // ── Validate size ──
    if (buffer.byteLength > MAX_SIZE_BYTES) {
      throw new BadRequestException(
        `File too large (${(buffer.byteLength / 1024 / 1024).toFixed(1)}MB). Maximum is 5MB.`,
      );
    }

    // ── Build S3 key ──
    const ext    = this.extFromMime(mimeType);
    const uuid   = uuidv4();
    const s3Key  = `assets/${userId}/${assetType}/${uuid}.${ext}`;

    // ── Upload to S3 ──
    await this.s3Service.uploadBuffer(buffer, s3Key, mimeType);
    this.logger.log(`Asset uploaded: ${s3Key} (${assetType}, ${buffer.byteLength} bytes)`);

    // ── Generate presigned URL — 24hr expiry (long enough for render) ──
    const url = await this.s3Service.generatePresignedUrl(s3Key, 86400);

    return {
      assetType,
      s3Key,
      url,
      contentType: mimeType,
      sizeBytes:   buffer.byteLength,
    };
  }

  private extFromMime(mime: string): string {
    const map: Record<string, string> = {
      'image/png':     'png',
      'image/jpeg':    'jpg',
      'image/jpg':     'jpg',
      'image/webp':    'webp',
      'image/svg+xml': 'svg',
      'video/mp4':     'mp4',
      'video/webm':    'webm',
    };
    return map[mime] ?? 'png';
  }
}