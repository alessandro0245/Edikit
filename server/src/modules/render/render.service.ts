import {
  Injectable,
  NotFoundException,
  BadRequestException,
  Logger,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { HttpService } from '@nestjs/axios';
import { PrismaService } from '../../common/prisma/prisma.service';
import { CloudinaryService } from '../cloudinary/cloudinary.service';
import { S3Service } from '../s3/s3.service';
import { CreateRenderJobDto } from './dto/create-render-job.dto';
import { RenderStatus } from '@generated/prisma/enums';
import { firstValueFrom } from 'rxjs';
import * as path from 'path';
import * as os from 'os';
import * as crypto from 'crypto';
import * as fs from 'fs/promises';
import { createReadStream, createWriteStream, existsSync, chmodSync } from 'fs';
import { execFile } from 'child_process';
import { pipeline as streamPipeline } from 'stream/promises';
import { CreditsService } from '../credits/credits.service';
import FormData from 'form-data';
import {
  calculateExpirationDate,
  isJobExpired,
} from '../video-cleanup/video-expiration.util';

interface NexrenderTemplate {
  id: string;
  displayName: string;
  status: string;
  compositions?: string[];
  layers?: Array<{
    layerName: string;
    composition: string;
  }>;
  uploadInfo?: {
    url: string;
    method: string;
    expiresIn: number;
  };
}

interface NexrenderJobResponse {
  id: string;
  state: string;
  progress?: number;
  output?: {
    url: string;
  };
  renderDuration?: number;
  error?: string;
}

export interface NexrenderFont {
  id: string;
  familyName: string;
  fileName: string;
  styleName?: string;
  createdAt: string;
}

@Injectable()
export class RenderService {
  private readonly logger = new Logger(RenderService.name);
  private static readonly TEMPLATE_CREDIT_COST = 5;
  private readonly nexrenderApiUrl: string;
  private readonly nexrenderApiKey: string;
  private readonly animationsPath: string;
  private readonly animationsFontsPath: string;
  private readonly activeUploads = new Set<string>();

  constructor(
    private readonly prisma: PrismaService,
    private readonly configService: ConfigService,
    private readonly httpService: HttpService,
    private readonly cloudinaryService: CloudinaryService,
    private readonly creditsService: CreditsService,
    private readonly s3Service: S3Service,
  ) {
    this.nexrenderApiUrl = 'https://api.nexrender.com/api/v2';
    this.nexrenderApiKey =
      this.configService.get<string>('NEXRENDER_CLOUD_API_KEY') || '';
    this.animationsPath = path.join(process.cwd(), 'animations');
    this.animationsFontsPath = path.join(this.animationsPath, 'fonts');

    if (!this.nexrenderApiKey) {
      this.logger.warn('NEXRENDER_CLOUD_API_KEY is not set');
    }
  }

  /**
   * Get Nexrender template ID from database
   */
  async getTemplateId(templateId: number): Promise<string | null> {
    const template = await this.prisma.nexrenderTemplate.findUnique({
      where: { templateId },
    });
    return template?.nexrenderId || null;
  }

  /**
   * List font files available in animations/fonts directory
   */
  private async listLocalFonts(): Promise<
    Array<{ fileName: string; fullPath: string }>
  > {
    if (!existsSync(this.animationsFontsPath)) {
      this.logger.warn(
        `Fonts directory not found: ${this.animationsFontsPath}`,
      );
      return [];
    }

    const entries = await fs.readdir(this.animationsFontsPath, {
      withFileTypes: true,
    });

    return entries
      .filter(
        (entry) =>
          entry.isFile() && entry.name.match(/\.(ttf|otf|woff2?|woff)$/i),
      )
      .map((entry) => ({
        fileName: entry.name,
        fullPath: path.join(this.animationsFontsPath, entry.name),
      }));
  }

  /**
   * List fonts already uploaded to Nexrender Cloud
   */
  async listNexrenderFonts(): Promise<NexrenderFont[]> {
    try {
      const response = await firstValueFrom(
        this.httpService.get<NexrenderFont[]>(`${this.nexrenderApiUrl}/fonts`, {
          headers: {
            Authorization: `Bearer ${this.nexrenderApiKey}`,
          },
        }),
      );

      return response.data || [];
    } catch (error) {
      this.logger.error('Failed to list Nexrender fonts', error);
      throw new BadRequestException(
        `Failed to list fonts: ${
          error instanceof Error ? error.message : 'Unknown error'
        }`,
      );
    }
  }

  /**
   * Upload a single font file to Nexrender Cloud
   */
  private async uploadFontToNexrender(
    fontPath: string,
  ): Promise<NexrenderFont> {
    const formData = new FormData();
    formData.append('font', createReadStream(fontPath));

    const headers = {
      ...formData.getHeaders(),
      Authorization: `Bearer ${this.nexrenderApiKey}`,
    };

    const response = await firstValueFrom(
      this.httpService.post<NexrenderFont>(
        `${this.nexrenderApiUrl}/fonts`,
        formData,
        { headers },
      ),
    );

    this.logger.log(`Uploaded font to Nexrender: ${fontPath}`);
    return response.data;
  }

  /**
   * Upload multiple font files from Express Multer files to Nexrender Cloud
   */
  async uploadFontsToNexrender(
    files: Express.Multer.File[],
  ): Promise<NexrenderFont[]> {
    const uploadedFonts: NexrenderFont[] = [];

    for (const file of files) {
      try {
        const formData = new FormData();
        formData.append('font', file.buffer, file.originalname);

        const headers = {
          ...formData.getHeaders(),
          Authorization: `Bearer ${this.nexrenderApiKey}`,
        };

        const response = await firstValueFrom(
          this.httpService.post<NexrenderFont>(
            `${this.nexrenderApiUrl}/fonts`,
            formData,
            { headers },
          ),
        );

        uploadedFonts.push(response.data);
        this.logger.log(
          `Font uploaded successfully: ${file.originalname} (ID: ${response.data.id})`,
        );
      } catch (error) {
        this.logger.error(`Failed to upload font ${file.originalname}`, error);
        throw new BadRequestException(
          `Failed to upload font ${file.originalname}: ${
            error instanceof Error ? error.message : 'Unknown error'
          }`,
        );
      }
    }

    return uploadedFonts;
  }

  /**
   * Delete a font from Nexrender Cloud
   */
  async deleteFontFromNexrender(fontId: string): Promise<void> {
    try {
      await firstValueFrom(
        this.httpService.delete(`${this.nexrenderApiUrl}/fonts/${fontId}`, {
          headers: {
            Authorization: `Bearer ${this.nexrenderApiKey}`,
          },
        }),
      );

      this.logger.log(`Deleted font from Nexrender: ${fontId}`);
    } catch (error) {
      this.logger.error(`Failed to delete font ${fontId}`, error);
      throw new BadRequestException(
        `Failed to delete font: ${
          error instanceof Error ? error.message : 'Unknown error'
        }`,
      );
    }
  }

  /**
   * Upload all fonts from local animations/fonts directory to Nexrender Cloud
   */
  async uploadAllLocalFonts(): Promise<{
    uploaded: NexrenderFont[];
    skipped: string[];
    errors: Array<{ fileName: string; error: string }>;
  }> {
    const localFonts = await this.listLocalFonts();

    if (localFonts.length === 0) {
      this.logger.warn('No local fonts found to upload.');
      return { uploaded: [], skipped: [], errors: [] };
    }

    this.logger.log(`Found ${localFonts.length} local font(s) to process`);

    const existingFonts = await this.listNexrenderFonts();
    const existingNames = new Set(
      existingFonts.map((font) => font.fileName.toLowerCase()),
    );

    const uploaded: NexrenderFont[] = [];
    const skipped: string[] = [];
    const errors: Array<{ fileName: string; error: string }> = [];

    for (const font of localFonts) {
      try {
        // Check if already uploaded
        if (existingNames.has(font.fileName.toLowerCase())) {
          this.logger.log(`Font already exists: ${font.fileName}`);
          skipped.push(font.fileName);
          continue;
        }

        // Upload the font
        const uploadedFont = await this.uploadFontToNexrender(font.fullPath);
        uploaded.push(uploadedFont);
        this.logger.log(
          `✓ Uploaded: ${uploadedFont.fileName} (Family: "${uploadedFont.familyName}", Style: "${uploadedFont.styleName || 'Regular'}")`,
        );
      } catch (error) {
        const errorMessage =
          error instanceof Error ? error.message : 'Unknown error';
        this.logger.error(`Failed to upload font ${font.fileName}`, error);
        errors.push({ fileName: font.fileName, error: errorMessage });
      }
    }

    return { uploaded, skipped, errors };
  }

  /**
   * Ensure local fonts are uploaded to Nexrender Cloud and return the file names to reference in jobs
   */
  private async ensureFontsUploaded(): Promise<string[]> {
    if (!this.nexrenderApiKey) {
      this.logger.warn(
        'NEXRENDER_CLOUD_API_KEY is missing; skipping font upload',
      );
      return [];
    }

    const localFonts = await this.listLocalFonts();
    if (localFonts.length === 0) {
      this.logger.warn('No local fonts found to upload.');
      return [];
    }

    const existingFonts = await this.listNexrenderFonts();
    const existingNames = new Set(
      existingFonts.map((font) => font.fileName.toLowerCase()),
    );

    const fontsToReference: string[] = [];

    for (const font of localFonts) {
      const alreadyUploaded = existingNames.has(font.fileName.toLowerCase());
      if (alreadyUploaded) {
        this.logger.log(`Font already uploaded: ${font.fileName}`);
        fontsToReference.push(font.fileName);

        // Find the uploaded font and log its family name for debugging
        const uploadedFont = existingFonts.find(
          (f) => f.fileName.toLowerCase() === font.fileName.toLowerCase(),
        );
        if (uploadedFont) {
          this.logger.log(
            `  ↳ Family: "${uploadedFont.familyName}", Style: "${uploadedFont.styleName || 'Regular'}"`,
          );
        }
        continue;
      }

      try {
        const uploaded = await this.uploadFontToNexrender(font.fullPath);
        fontsToReference.push(uploaded.fileName);
        existingNames.add(uploaded.fileName.toLowerCase());
        this.logger.log(
          `Uploaded font: ${uploaded.fileName} (Family: "${uploaded.familyName}", Style: "${uploaded.styleName || 'Regular'}")`,
        );
      } catch (error) {
        this.logger.error(`Failed to upload font ${font.fileName}`, error);
        throw new BadRequestException(
          `Unable to upload font ${font.fileName}. Please try again later.`,
        );
      }
    }

    this.logger.log(
      `Fonts ready for render job: ${JSON.stringify(fontsToReference)}`,
    );
    return fontsToReference;
  }

  /**
   * Check if template already uploaded in Nexrender Cloud
   */
  async checkTemplateExists(
    displayName: string,
  ): Promise<NexrenderTemplate | null> {
    try {
      const response = await firstValueFrom(
        this.httpService.get<NexrenderTemplate[]>(
          `${this.nexrenderApiUrl}/templates`,
          {
            headers: {
              Authorization: `Bearer ${this.nexrenderApiKey}`,
            },
          },
        ),
      );

      const template = response.data.find(
        (t) => t.displayName === displayName && t.status === 'uploaded',
      );
      return template || null;
    } catch (error) {
      this.logger.error('Failed to check template existence', error);
      return null;
    }
  }

  /**
   * Register template in Nexrender Cloud
   */
  async registerTemplate(
    templateId: number,
    displayName: string,
    templateFilePath: string,
  ): Promise<NexrenderTemplate> {
    try {
      this.logger.log(`Registering template with Nexrender: ${displayName}`);

      // Determine file type from extension
      const fileExtension = path.extname(templateFilePath).toLowerCase();
      const templateType = fileExtension === '.zip' ? 'zip' : 'aep';

      this.logger.log(
        `Registering template as type: ${templateType} (file: ${path.basename(templateFilePath)})`,
      );

      const response = await firstValueFrom(
        this.httpService.post<NexrenderTemplate>(
          `${this.nexrenderApiUrl}/templates`,
          {
            type: templateType,
            displayName,
          },
          {
            headers: {
              Authorization: `Bearer ${this.nexrenderApiKey}`,
              'Content-Type': 'application/json',
            },
          },
        ),
      );

      // Log full response for debugging
      this.logger.log(
        `Nexrender API response for template ${templateId}:`,
        JSON.stringify(response.data, null, 2),
      );

      // According to Nexrender API docs, response is direct template object
      const template = response.data;

      // Handle different possible response structures
      if (!template) {
        this.logger.error('Empty response from Nexrender');
        throw new BadRequestException('Empty response from Nexrender');
      }

      // Check if response has nested structure
      const templateIdValue =
        template.id ||
        (template as any).template?.id ||
        (template as any).data?.id;
      const uploadInfoValue =
        template.uploadInfo ||
        (template as any).template?.uploadInfo ||
        (template as any).data?.uploadInfo;

      if (!templateIdValue) {
        this.logger.error('No template ID in response:', {
          fullResponse: template,
          responseKeys: Object.keys(template),
        });
        throw new BadRequestException(
          'Invalid template response from Nexrender - no ID found',
        );
      }

      if (!uploadInfoValue) {
        this.logger.error('No uploadInfo in response:', {
          fullResponse: template,
          responseKeys: Object.keys(template),
        });
        throw new BadRequestException(
          'No upload information received from Nexrender',
        );
      }

      // Normalize template object
      const normalizedTemplate: NexrenderTemplate = {
        id: templateIdValue,
        displayName: template.displayName || displayName,
        status: template.status || 'awaiting_upload',
        compositions: template.compositions || [],
        layers: template.layers || [],
        uploadInfo: uploadInfoValue,
      };

      this.logger.log(`Template registered successfully:`, {
        id: normalizedTemplate.id,
        displayName: normalizedTemplate.displayName,
        status: normalizedTemplate.status,
        hasUploadUrl: !!normalizedTemplate.uploadInfo?.url,
      });

      return normalizedTemplate;
    } catch (error: unknown) {
      const errorResponse = (error as any)?.response;
      this.logger.error('Failed to register template', {
        templateId,
        displayName,
        error: error instanceof Error ? error.message : 'Unknown error',
        response: errorResponse?.data,
        status: errorResponse?.status,
        statusText: errorResponse?.statusText,
      });

      // Provide more specific error message
      if (errorResponse?.status === 401) {
        throw new BadRequestException(
          'Authentication failed - check your Nexrender API key',
        );
      } else if (errorResponse?.status === 429) {
        throw new BadRequestException(
          'Rate limit exceeded - please wait and try again',
        );
      } else if (errorResponse?.data) {
        throw new BadRequestException(
          `Failed to register template: ${JSON.stringify(errorResponse.data)}`,
        );
      }

      throw new BadRequestException(
        `Failed to register template: ${
          error instanceof Error ? error.message : 'Unknown error'
        }`,
      );
    }
  }

  /**
   * Upload .aep file to presigned URL
   */
  async uploadTemplateFile(filePath: string, uploadUrl: string): Promise<void> {
    try {
      const fileBuffer = await fs.readFile(filePath);

      await firstValueFrom(
        this.httpService.put(uploadUrl, fileBuffer, {
          headers: {
            'Content-Type': 'application/octet-stream',
          },
          maxBodyLength: Infinity,
          maxContentLength: Infinity,
        }),
      );

      this.logger.log(`Template file uploaded successfully: ${filePath}`);
    } catch (error: unknown) {
      this.logger.error('Failed to upload template file', error);
      throw new BadRequestException(
        `Failed to upload template file: ${
          error instanceof Error ? error.message : 'Unknown error'
        }`,
      );
    }
  }

  /**
   * Check template status until uploaded
   */
  async checkTemplateStatus(nexrenderId: string): Promise<NexrenderTemplate> {
    const maxAttempts = 30; // 30 attempts with 2 second intervals = 60 seconds max
    const delay = 2000; // 2 seconds

    for (let attempt = 0; attempt < maxAttempts; attempt++) {
      try {
        const response = await firstValueFrom(
          this.httpService.get<NexrenderTemplate>(
            `${this.nexrenderApiUrl}/templates/${nexrenderId}`,
            {
              headers: {
                Authorization: `Bearer ${this.nexrenderApiKey}`,
              },
            },
          ),
        );

        const template = response.data;

        if (template.status === 'uploaded') {
          return template;
        }

        if (template.status === 'error') {
          throw new BadRequestException('Template upload failed');
        }

        // Wait before next attempt
        if (attempt < maxAttempts - 1) {
          await new Promise((resolve) => setTimeout(resolve, delay));
        }
      } catch (error: unknown) {
        if (error instanceof BadRequestException) {
          throw error;
        }
        const errorMessage =
          error instanceof Error ? error.message : 'Unknown error';
        const errorStatus = (error as { response?: { status?: number } })
          ?.response?.status;
        this.logger.warn(
          `Template status check attempt ${attempt + 1} failed: ${errorMessage}${
            errorStatus ? ` (Status: ${errorStatus})` : ''
          }`,
        );
        // Continue to next attempt
        if (attempt < maxAttempts - 1) {
          await new Promise((resolve) => setTimeout(resolve, delay));
        }
      }
    }

    throw new BadRequestException('Template upload timeout');
  }

  /**
   * Ensure template is uploaded to Nexrender Cloud
   */
  async ensureTemplateUploaded(templateId: number): Promise<string> {
    // Check if template ID exists in database
    let nexrenderId = await this.getTemplateId(templateId);
    if (nexrenderId) {
      // Verify it's still uploaded
      try {
        const template = await this.checkTemplateStatus(nexrenderId);
        if (template.status === 'uploaded') {
          return nexrenderId;
        }
      } catch (error) {
        this.logger.warn('Template status check failed, re-uploading');
      }
    }

    const displayName = `Animation ${templateId}`;

    // Try .zip first (recommended for bundled projects), then .aep
    let templateFilePath = path.join(
      this.animationsPath,
      `Animation_${templateId}.zip`,
    );

    if (!existsSync(templateFilePath)) {
      // Try with space
      templateFilePath = path.join(
        this.animationsPath,
        `Animation ${templateId}.zip`,
      );
    }

    if (!existsSync(templateFilePath)) {
      // Fallback to .aep
      templateFilePath = path.join(
        this.animationsPath,
        `Animation ${templateId}.aep`,
      );
    }

    if (!existsSync(templateFilePath)) {
      // Try Animation_X format
      templateFilePath = path.join(
        this.animationsPath,
        `Animation_${templateId}.aep`,
      );
    }

    // Check if template file exists
    if (!existsSync(templateFilePath)) {
      throw new NotFoundException(
        `Template file not found: Animation ${templateId}.aep or Animation_${templateId}.zip`,
      );
    }

    // Check if template already exists in Nexrender Cloud
    const existingTemplate = await this.checkTemplateExists(displayName);
    if (existingTemplate) {
      nexrenderId = existingTemplate.id;
      // Store in database
      await this.prisma.nexrenderTemplate.upsert({
        where: { templateId },
        update: {
          nexrenderId: existingTemplate.id,
          status: existingTemplate.status,
          compositions: existingTemplate.compositions || [],
          layers: existingTemplate.layers || [],
        },
        create: {
          templateId,
          nexrenderId: existingTemplate.id,
          displayName,
          status: existingTemplate.status,
          compositions: existingTemplate.compositions || [],
          layers: existingTemplate.layers || [],
        },
      });
      return nexrenderId;
    }

    // Register template
    const registeredTemplate = await this.registerTemplate(
      templateId,
      displayName,
      templateFilePath,
    );

    if (!registeredTemplate.uploadInfo) {
      throw new BadRequestException('No upload info received from Nexrender');
    }

    // Upload file
    await this.uploadTemplateFile(
      templateFilePath,
      registeredTemplate.uploadInfo.url,
    );

    // Wait for template to be processed
    const uploadedTemplate = await this.checkTemplateStatus(
      registeredTemplate.id,
    );

    // Auto-generate layer mapping from layers
    const layers = uploadedTemplate.layers || [];
    const layerMapping =
      Array.isArray(layers) && layers.length > 0
        ? this.autoGenerateLayerMapping(layers, templateId)
        : {};

    // Store in database with auto-generated mapping
    await this.prisma.nexrenderTemplate.upsert({
      where: { templateId },
      update: {
        nexrenderId: uploadedTemplate.id,
        status: uploadedTemplate.status,
        compositions: uploadedTemplate.compositions || [],
        layers: uploadedTemplate.layers || [],
        layerMapping: layerMapping as any, // JSON field - type is correct
      },
      create: {
        templateId,
        nexrenderId: uploadedTemplate.id,
        displayName,
        status: uploadedTemplate.status,
        compositions: uploadedTemplate.compositions || [],
        layers: uploadedTemplate.layers || [],
        layerMapping: layerMapping as any, // JSON field - type is correct
      },
    });

    this.logger.log(
      `Template ${templateId} uploaded and layer mapping generated:`,
      layerMapping,
    );

    return uploadedTemplate.id;
  }

  /**
   * Get template compositions and layers
   */
  async getTemplateCompositions(templateId: number): Promise<{
    compositions: string[];
    layers: Array<{ layerName: string; composition: string }>;
  }> {
    const nexrenderId = await this.getTemplateId(templateId);
    if (!nexrenderId) {
      throw new NotFoundException('Template not found in database');
    }

    try {
      const response = await firstValueFrom(
        this.httpService.get<NexrenderTemplate>(
          `${this.nexrenderApiUrl}/templates/${nexrenderId}`,
          {
            headers: {
              Authorization: `Bearer ${this.nexrenderApiKey}`,
            },
          },
        ),
      );

      return {
        compositions: response.data.compositions || [],
        layers: (response.data.layers || []) as Array<{
          layerName: string;
          composition: string;
        }>,
      };
    } catch (error: unknown) {
      this.logger.error('Failed to get template compositions', error);
      throw new BadRequestException(
        `Failed to get template compositions: ${
          error instanceof Error ? error.message : 'Unknown error'
        }`,
      );
    }
  }

  /**
   * Get all templates from database
   */
  async getAllTemplates() {
    const templates = await this.prisma.nexrenderTemplate.findMany({
      orderBy: { templateId: 'asc' },
      select: {
        id: true,
        templateId: true,
        displayName: true,
        status: true,
        compositions: true,
        layers: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    return templates;
  }

  /**
   * Get template record from database (raw)
   */
  async getTemplateRecord(templateId: number) {
    return await this.prisma.nexrenderTemplate.findUnique({
      where: { templateId },
    });
  }

  /**
   * Get template by ID
   */
  async getTemplate(templateId: number) {
    const template = await this.prisma.nexrenderTemplate.findUnique({
      where: { templateId },
    });

    if (!template) {
      throw new NotFoundException(`Template with ID ${templateId} not found`);
    }

    // Get compositions and layers from Nexrender if available
    let compositions: string[] = [];
    let layers: Array<{ layerName: string; composition: string }> = [];

    if (template.nexrenderId) {
      try {
        const compData = await this.getTemplateCompositions(templateId);
        compositions = compData.compositions;
        layers = compData.layers;
      } catch {
        this.logger.warn(
          `Failed to fetch compositions for template ${templateId}`,
        );
        // Use stored data if available
        compositions = (template.compositions as string[]) || [];
        layers =
          (template.layers as Array<{
            layerName: string;
            composition: string;
          }>) || [];
      }
    }

    return {
      id: template.id,
      templateId: template.templateId,
      displayName: template.displayName,
      status: template.status,
      nexrenderId: template.nexrenderId,
      compositions,
      layers,
      createdAt: template.createdAt,
      updatedAt: template.updatedAt,
    };
  }

  /**
   * Upload user asset to Cloudinary
   */
  async uploadAsset(
    file: Express.Multer.File,
    userId: string,
    assetType: 'image' | 'video' = 'image',
  ): Promise<string> {
    const result = await this.cloudinaryService.uploadAsset(
      file,
      userId,
      assetType,
    );
    return result.secure_url;
  }

  async deleteAsset(
    publicId: string,
    resourceType: 'image' | 'video' = 'image',
  ): Promise<void> {
    await this.cloudinaryService.deleteFile(publicId, resourceType);
  }

  /**
   * Submit render job to Nexrender Cloud
   */
  async submitNexrenderJob(
    nexrenderTemplateId: string,
    composition: string,
    assets: Array<{
      type: string;
      layerName?: string;
      property?: string;
      value?: string | number | number[] | Record<string, any>;
      src?: string;
      name?: string;
      params?: Record<string, any>;
      keyword?: string;
    }>,
    webhookUrl: string | null,
    fonts: string[] = [],
    settings?: Record<string, any>,
  ): Promise<NexrenderJobResponse> {
    try {
      const response = await firstValueFrom(
        this.httpService.post<NexrenderJobResponse>(
          `${this.nexrenderApiUrl}/jobs`,
          {
            template: {
              id: nexrenderTemplateId,
              composition,
            },
            assets,
            fonts: fonts.length > 0 ? fonts : undefined,
            ...(webhookUrl
              ? { webhook: { url: webhookUrl, method: 'POST' } }
              : {}),
            ...(settings ? { settings } : {}),
            preview: false,
          },
          {
            headers: {
              Authorization: `Bearer ${this.nexrenderApiKey}`,
              'Content-Type': 'application/json',
            },
          },
        ),
      );

      return response.data;
    } catch (error: unknown) {
      this.logger.error('Failed to submit Nexrender job', error);
      throw new BadRequestException(
        `Failed to submit render job: ${
          error instanceof Error ? error.message : 'Unknown error'
        }`,
      );
    }
  }

  /**
   * Get layer mapping for a template from database
   * Falls back to auto-generating from Nexrender layers if not stored
   */
  private async getLayerMapping(
    templateId: number,
  ): Promise<Record<string, string>> {
    // First check for hardcoded predefined mappings (highest priority)
    const predefined = this.getPredefinedLayerMapping(templateId);
    if (predefined) {
      this.logger.log(
        `Using predefined layer mapping for template ${templateId}:`,
        JSON.stringify(predefined),
      );
      return predefined;
    }

    // Try to get from database
    const template = await this.prisma.nexrenderTemplate.findUnique({
      where: { templateId },
    });

    // Check if layerMapping exists in database
    const layerMapping = (template as any)?.layerMapping;
    if (layerMapping) {
      this.logger.log(
        `Using database layer mapping for template ${templateId}:`,
        JSON.stringify(layerMapping),
      );
      return layerMapping as Record<string, string>;
    }

    // Auto-generate mapping from layers if available
    if (template?.layers) {
      const layers = template.layers as Array<{
        layerName: string;
        composition: string;
      }>;
      return this.autoGenerateLayerMapping(layers, templateId);
    }

    // Fallback to empty mapping (will use defaults)
    this.logger.warn(
      `No layer mapping found for template ${templateId}, using defaults`,
    );
    return {};
  }

  /**
   * Get predefined layer mapping for a specific template
   * These are manually configured based on actual AE layer names
   */
  private getPredefinedLayerMapping(
    templateId: number,
  ): Record<string, string> | null {
    const predefinedMappings: Record<number, Record<string, string>> = {
      // Animation 1 — 2x dual-media (img/video) + 2x text
      1: {
        text1: 'txt_1',
        text2: 'txt_2',
        media1_image: 'img_1',
        media1_video: 'video_1.mp4',
        media2_image: 'img_2',
        media2_video: 'video_2.mp4',
        background: 'background',
      },

      // Animation 2 — 4x dual-media + 4x text
      2: {
        text1: 'txt_1',
        text2: 'txt_2',
        text3: 'txt_3',
        text4: 'txt_4',
        media1_image: 'img_1',
        media1_video: 'video_1.mp4',
        media2_image: 'img_2',
        media2_video: 'video_2.mp4',
        media3_image: 'img_3',
        media3_video: 'video_3.mp4',
        media4_image: 'img_4',
        media4_video: 'video_4.mp4',
        background: 'background',
      },

      // Animation 3 — 3x image-only + 1x dual-media (img_3/video_1) + 4x text
      3: {
        text1: 'txt_1',
        text2: 'txt_2',
        text3: 'txt_3',
        text4: 'txt_4',
        image1: 'img_1.png',
        image2: 'img_2.png',
        image4: 'img_4.png',
        media3_image: 'img_3.png',
        media3_video: 'video_1.mp4',
        background: 'background.png',
      },

      // Animation 4 — article name + price + image
      4: {
        text1: 'txt_1',
        text2: 'txt_2',
        image1: 'img_1',
        background: 'background',
      },

      // Animation 5 — 5x text (txt_1-5) + 2x image (img_2→image1, img_3→image2)
      5: {
        text1: 'txt_1',
        text2: 'txt_2',
        text3: 'txt_3',
        text4: 'txt_4',
        text5: 'txt_5',
        image1: 'img_2',
        image2: 'img_3',
        background: 'background',
      },

      // Animation 6 — 2x text + 3x image (inside nested_sequence_2 ×3)
      6: {
        text1: 'txt_1',
        text2: 'txt_2',
        image1: 'img_2',
        image2: 'img_3',
        image3: 'img_4',
        background: 'background',
      },

      // Animation 7 — 1x text (txt_5) only
      7: {
        text1: 'txt_5',
        background: 'background',
      },

      // Animation 8 — 3x text (txt_2-4) + image + button color via colors
      8: {
        text1: 'txt_2',
        text2: 'txt_3',
        text3: 'txt_4',
        image1: 'img_1',
        buttonColor: 'shape_3',
        background: 'background',
      },

      // Animation 9 — 5x messages + sender name (txt_2 + 4 siblings) + profile pic (img_1 + 4 siblings)
      9: {
        text1: 'txt_1',
        text2: 'txt_4',
        text3: 'txt_7',
        text4: 'txt_10',
        text5: 'txt_13',
        text6: 'txt_2', // sender name — buildNexrenderAssets also writes txt_5/8/11/14
        image1: 'img_1', // profile pic — buildNexrenderAssets also writes img_2-5
        background: 'background',
      },

      // Animation 10 — 3x dual-media + 3x text
      10: {
        text1: 'txt_1',
        text2: 'txt_2',
        text3: 'txt_3',
        media1_image: 'img_1',
        media1_video: 'video_1',
        media2_image: 'img_2',
        media2_video: 'video_2',
        media3_image: 'img_3',
        media3_video: 'video_3',
        background: 'background',
      },

      // Animation 11 — video-only + profile pic + 4x text (txt_3, txt_2, txt_6, txt_10)
      11: {
        text1: 'txt_3',
        text2: 'txt_2',
        text3: 'txt_6',
        text4: 'txt_10',
        image1: 'img_6',
        video1: 'video_1',
        background: 'background',
      },

      // Animation 12 — channel name + username + subscribers + profile pic (×2 nested_sequence_1)
      12: {
        text1: 'txt_1',
        text2: 'txt_2',
        text3: 'txt_3',
        image1: 'img_1',
        background: 'background',
      },

      // Animation 13 — month (txt_23) + year (txt_24) + text1 (txt_25) + image
      13: {
        text1: 'txt_23',
        text2: 'txt_24',
        text3: 'txt_25',
        image1: 'img_3',
        background: 'background',
      },

      // Animation 14 — single text + gradient color via colors
      14: {
        text1: 'txt_1',
        text2: 'txt_2',
        background: 'background.png',
      },

      // Animation 15 — 6x text + 1x dual-media post (img_4/video_1) + 2x profile pics
      15: {
        text1: 'txt_4',
        text2: 'txt_5',
        text3: 'txt_6',
        text4: 'txt_1',
        text5: 'txt_3',
        text6: 'txt_2',
        media1_image: 'img_4',
        media1_video: 'video_1',
        image2: 'img_2',
        image3: 'img_5',
        background: 'background',
      },

      // Animation 16 — video + profile pic + 4x text (likes, username, views, title)
      16: {
        text1: 'txt_1',
        text2: 'txt_2',
        text3: 'txt_3',
        text4: 'txt_4',
        image1: 'img_1',
        video1: 'video_1',
        background: 'background',
      },
    };

    return predefinedMappings[templateId] || null;
  }

  /**
   * Auto-generate layer mapping from Nexrender layers
   * First checks for predefined mappings, then falls back to pattern matching
   */
  private autoGenerateLayerMapping(
    layers: Array<{ layerName: string; composition: string }>,
    templateId: number,
  ): Record<string, string> {
    // Check for predefined mapping first
    const predefined = this.getPredefinedLayerMapping(templateId);
    if (predefined) {
      this.logger.log(
        `Using predefined layer mapping for template ${templateId}:`,
        predefined,
      );
      return predefined;
    }

    // Fall back to auto-generation for unknown templates
    const mapping: Record<string, string> = {};

    this.logger.log(
      `Auto-generating layer mapping for template ${templateId} from ${layers.length} layers`,
    );
    this.logger.log(
      'Available layers:',
      layers.map((l) => `${l.layerName} (${l.composition})`),
    );

    // Priority-ordered patterns - more specific patterns first
    // Patterns are designed to match common After Effects layer naming conventions
    const patterns: Record<string, RegExp[]> = {
      // Text layers - match numbered text layers (txt_1, text_1, Text 1, etc.)
      text1: [
        /^txt[_\s-]?1$/i, // txt_1, txt-1, txt 1
        /^text[_\s-]?1$/i, // text_1, text-1, text 1
        /^headline$/i,
        /^title$/i,
        /^main[_\s-]?text$/i,
        /prova\s*scena\s*6/i, // Legacy pattern
      ],
      text2: [
        /^txt[_\s-]?2$/i,
        /^text[_\s-]?2$/i,
        /^subtitle$/i,
        /^subheadline$/i,
        /prova\s*scena\s*5/i,
      ],
      text3: [/^txt[_\s-]?3$/i, /^text[_\s-]?3$/i, /^description$/i, /^body$/i],
      text4: [/^txt[_\s-]?4$/i, /^text[_\s-]?4$/i],

      // Image layers - match img_1.png, image_1.png, product.png, etc.
      // Note: Exclude icon and box patterns from image matching
      image1: [
        /^img[_\s-]?1\.png$/i, // img_1.png
        /^image[_\s-]?1\.png$/i,
        /^img[_\s-]?1$/i, // img_1 (without extension)
        /^image[_\s-]?1$/i,
        /^logo\.png$/i,
        /^product[_\s-]?1?\.png$/i,
        /images\s*and\s*videos/i,
      ],
      image2: [
        /^img[_\s-]?2\.png$/i,
        /^image[_\s-]?2\.png$/i,
        /^img[_\s-]?2$/i,
        /^image[_\s-]?2$/i,
        /^product[_\s-]?2\.png$/i,
      ],
      image3: [
        /^img[_\s-]?3\.png$/i,
        /^image[_\s-]?3\.png$/i,
        /^img[_\s-]?3$/i,
        /^image[_\s-]?3$/i,
      ],
      image4: [
        /^img[_\s-]?4\.png$/i,
        /^image[_\s-]?4\.png$/i,
        /^img[_\s-]?4$/i,
        /^image[_\s-]?4$/i,
      ],
      image5: [
        /^img[_\s-]?5\.png$/i,
        /^image[_\s-]?5\.png$/i,
        /^img[_\s-]?5$/i,
        /^image[_\s-]?5$/i,
      ],

      // Icon layers - explicitly match icon patterns
      icon1: [
        /^icon[_\s-]?1\.png$/i, // icon_1.png
        /^icon[_\s-]?1$/i, // icon_1
        /^social[_\s-]?icon[_\s-]?1/i,
      ],
      icon2: [
        /^icon[_\s-]?2\.png$/i,
        /^icon[_\s-]?2$/i,
        /^social[_\s-]?icon[_\s-]?2/i,
      ],
      icon3: [/^icon[_\s-]?3\.png$/i, /^icon[_\s-]?3$/i],
      icon4: [/^icon[_\s-]?4\.png$/i, /^icon[_\s-]?4$/i],

      // Video layers
      video1: [
        /^video[_\s-]?1\.(mp4|mov|avi)$/i, // video_1.mp4
        /^video[_\s-]?1$/i, // video_1
        /^vid[_\s-]?1/i,
        /^main[_\s-]?video/i,
      ],
      video2: [
        /^video[_\s-]?2\.(mp4|mov|avi)$/i,
        /^video[_\s-]?2$/i,
        /^vid[_\s-]?2/i,
      ],

      // Background layer
      background: [
        /^background\.png$/i, // background.png
        /^background$/i, // background
        /^bg\.png$/i, // bg.png
        /^bg$/i, // bg
        /^backdrop/i,
      ],

      // Product image (special case for e-commerce templates)
      productImage: [/^product[_\s-]?image/i, /^product\.png$/i, /^product$/i],

      // Generic image field (used by template 8 with "image" field)
      image: [/^image\.png$/i, /^main[_\s-]?image$/i],
    };

    // Match layers to patterns with priority ordering
    for (const [fieldName, regexPatterns] of Object.entries(patterns)) {
      if (mapping[fieldName]) continue; // Skip if already mapped
      for (const pattern of regexPatterns) {
        for (const layer of layers) {
          if (pattern.test(layer.layerName)) {
            mapping[fieldName] = layer.layerName;
            this.logger.log(
              `✓ Matched ${fieldName} → "${layer.layerName}" (composition: ${layer.composition})`,
            );
            break;
          }
        }
        if (mapping[fieldName]) break;
      }
    }

    // Fallback: Find unmapped text layers (layers without file extensions that look like text)
    const mappedTextLayers = [
      mapping.text1,
      mapping.text2,
      mapping.text3,
      mapping.text4,
    ].filter(Boolean);
    const textSlots = ['text1', 'text2', 'text3', 'text4'];

    const potentialTextLayers = layers.filter(
      (l) =>
        // No file extension
        !l.layerName.match(/\.(png|jpg|jpeg|mp4|mov|mp3|wav|gif|webp)$/i) &&
        // Not already mapped
        !mappedTextLayers.includes(l.layerName) &&
        // Not a known non-text layer type
        !l.layerName
          .toLowerCase()
          .match(
            /^(background|bg|backdrop|adjustment|camera|shape|null|comp|precomp|sfx|audio|music|mod_item|box)/i,
          ) &&
        // Looks like a text layer (contains txt, text, or is a simple name)
        (l.layerName.toLowerCase().includes('txt') ||
          l.layerName.toLowerCase().includes('text') ||
          /^[a-z_\s-]+$/i.test(l.layerName)),
    );

    // Sort potential text layers by their number suffix if present
    potentialTextLayers.sort((a, b) => {
      const numA = a.layerName.match(/(\d+)/)?.[1];
      const numB = b.layerName.match(/(\d+)/)?.[1];
      if (numA && numB) return parseInt(numA) - parseInt(numB);
      return 0;
    });

    // Assign unmapped text layers to empty text slots
    for (const layer of potentialTextLayers) {
      const emptySlot = textSlots.find((slot) => !mapping[slot]);
      if (emptySlot) {
        mapping[emptySlot] = layer.layerName;
        this.logger.log(
          `✓ Auto-assigned ${emptySlot} → "${layer.layerName}" (fallback)`,
        );
      }
    }

    // Log any unmapped layers that might need manual mapping
    const allMappedLayers = Object.values(mapping);
    const unmappedLayers = layers.filter(
      (l) =>
        !allMappedLayers.includes(l.layerName) &&
        // Skip known system layers
        !l.layerName
          .toLowerCase()
          .match(
            /^(adjustment|camera|camera_ctrl|shape|null|sfx|audio|music|mod_item|box)/i,
          ),
    );

    if (unmappedLayers.length > 0) {
      this.logger.warn(
        `⚠ Unmapped layers for template ${templateId}:`,
        unmappedLayers.map((l) => `${l.layerName} (${l.composition})`),
      );
    }

    this.logger.log(
      `Final auto-generated layer mapping for template ${templateId}:`,
      mapping,
    );

    return mapping;
  }

  /**
   * Build assets array for Nexrender job
   * Only includes assets if frontend provides them (uses .aep defaults otherwise)
   */
  private async buildNexrenderAssets(
    dto: CreateRenderJobDto,
    templateId: number,
  ): Promise<
    Array<{
      type: string;
      layerName?: string;
      composition?: string;
      property?: string;
      value?: string | number | number[] | Record<string, any>;
      src?: string;
      name?: string;
      params?: Record<string, any>;
      keyword?: string;
    }>
  > {
    type Asset = {
      type: string;
      layerName?: string;
      composition?: string;
      property?: string;
      value?: string | number | number[] | Record<string, any>;
      src?: string;
      name?: string;
      params?: Record<string, any>;
      keyword?: string;
    };
    const assets: Asset[] = [];
    const layerMapping = await this.getLayerMapping(templateId);

    this.logger.log(
      `Building assets for template ${templateId}`,
      `Layer mapping: ${JSON.stringify(layerMapping)}`,
    );
    this.logger.log(
      `DTO fields:`,
      `text1=${dto.text1} text2=${dto.text2} text3=${dto.text3} text4=${dto.text4} text5=${dto.text5} text6=${dto.text6} ` +
        `image1=${dto.image1} image2=${dto.image2} image3=${dto.image3} image4=${dto.image4} image5=${dto.image5} ` +
        `video1=${dto.video1} video2=${dto.video2} video3=${dto.video3} video4=${dto.video4} background=${dto.background}`,
    );

    const text1 = dto.text1 || dto.headline;
    let text2 = dto.text2 || dto.subheadline;
    const text3 = dto.text3 || dto.description;
    const image1 = dto.image1 || dto.logo;

    if (templateId === 6 && text2) {
      let isOpening = true;
      text2 = text2.replace(/"/g, () => {
        const q = isOpening ? '“' : '”';
        isOpening = !isOpening;
        return q;
      });
    }

    // Check if user selected a non-default font
    const isCustomFont =
      dto.fontFamily &&
      dto.fontFamily.toLowerCase().trim() !== 'google-sans' &&
      dto.fontFamily.toLowerCase().trim() !== 'googlesans' &&
      dto.fontFamily.toLowerCase().trim() !== 'default';

    const pushText = (key: string, value: string) => {
      const layerName = layerMapping[key];
      if (!layerName) return;

      if (isCustomFont) {
        const weight = this.getLayerFontWeight(templateId, key);
        const font = this.getFontPostScriptName(dto.fontFamily!, weight);
        assets.push({
          type: 'function',
          name: 'nx:text-params-set',
          params: {
            layerName,
            textValue: value,
            font,
          },
        });
      } else {
        assets.push({
          type: 'data',
          layerName,
          property: 'Source Text',
          value,
        });
      }
    };
    const pushImage = (key: string, url: string) => {
      const layerName = layerMapping[key];
      if (layerName) assets.push({ type: 'image', src: url, layerName });
    };
    // Whether to strip audio from uploaded video assets
    const shouldMuteAudio = dto.muteAudio !== false;

    /**
     * Strip audio from a Cloudinary video URL by injecting the `ac_none`
     * transformation (audio-codec = none).
     * Pattern: .../video/upload/v123/... → .../video/upload/ac_none/v123/...
     * Non-Cloudinary URLs are returned unchanged.
     */
    const stripAudioFromUrl = (url: string): string => {
      return url.replace(
        /\/video\/upload\/(v\d+\/)/,
        '/video/upload/ac_none/$1',
      );
    };

    const resolveVideoUrl = (url: string): string =>
      shouldMuteAudio ? stripAudioFromUrl(url) : url;

    const pushVideo = (key: string, url: string) => {
      const layerName = layerMapping[key];
      if (layerName) {
        assets.push({ type: 'video', src: resolveVideoUrl(url), layerName });
      }
    };
    const hideLayer = (layerName: string) =>
      assets.push({ type: 'data', layerName, property: 'Opacity', value: 0 });

    // ── Text slots ──────────────────────────────────────────────────────────
    if (text1) pushText('text1', text1);
    if (text2) pushText('text2', text2);
    if (text3) pushText('text3', text3);
    if (dto.text4) pushText('text4', dto.text4);
    if (dto.text5) pushText('text5', dto.text5);
    if (dto.text6) {
      pushText('text6', dto.text6);
      // Template 9: sender's name propagates to all sibling text layers
      if (templateId === 9) {
        for (const ln of ['txt_5', 'txt_8', 'txt_11', 'txt_14']) {
          if (isCustomFont) {
            const weight = this.getLayerFontWeight(templateId, ln);
            const font = this.getFontPostScriptName(dto.fontFamily!, weight);
            assets.push({
              type: 'function',
              name: 'nx:text-params-set',
              params: {
                layerName: ln,
                textValue: dto.text6,
                font,
              },
            });
          } else {
            assets.push({
              type: 'data',
              layerName: ln,
              property: 'Source Text',
              value: dto.text6,
            });
          }
        }
      }
    }

    // If a custom font is selected, apply it to any text layers that were not overridden with custom text
    if (isCustomFont) {
      const updatedLayers = new Set(
        assets
          .filter((a) => a.name === 'nx:text-params-set' && a.params?.layerName)
          .map((a) => a.params!.layerName),
      );

      for (const [key, layerName] of Object.entries(layerMapping)) {
        if (key.startsWith('text') && layerName && !updatedLayers.has(layerName)) {
          const weight = this.getLayerFontWeight(templateId, key);
          const font = this.getFontPostScriptName(dto.fontFamily!, weight);
          assets.push({
            type: 'function',
            name: 'nx:text-params-set',
            params: {
              layerName,
              font,
            },
          });
          updatedLayers.add(layerName);
        }
      }
    }

    // ── Dual-media slots (image OR video — video wins, other layer hidden) ──
    // Slot N uses dto.imageN for the image layer and dto.videoN for the video layer.
    // The layer mapping expresses this via media{N}_image / media{N}_video keys.
    const dualSlots: Array<{ n: number; imgUrl?: string; vidUrl?: string }> = [
      { n: 1, imgUrl: image1, vidUrl: dto.video1 },
      { n: 2, imgUrl: dto.image2, vidUrl: dto.video2 },
      { n: 3, imgUrl: dto.image3, vidUrl: dto.video3 },
      { n: 4, imgUrl: dto.image4, vidUrl: dto.video4 },
    ];

    const isDual: Record<number, boolean> = {};
    for (const { n, imgUrl, vidUrl } of dualSlots) {
      const imgLayer = layerMapping[`media${n}_image`];
      const vidLayer = layerMapping[`media${n}_video`];
      if (!imgLayer && !vidLayer) continue;
      isDual[n] = true;
      if (vidUrl) {
        if (vidLayer)
          assets.push({ type: 'video', src: resolveVideoUrl(vidUrl), layerName: vidLayer });
        if (imgLayer) hideLayer(imgLayer);
      } else if (imgUrl) {
        if (imgLayer)
          assets.push({ type: 'image', src: imgUrl, layerName: imgLayer });
        if (vidLayer) hideLayer(vidLayer);
      }
    }

    // ── Pure image slots (only when NOT handled as dual-media above) ────────
    if (image1 && !isDual[1]) {
      pushImage('image1', image1);
      // Template 9: profile picture goes to all 5 img layers
      if (templateId === 9) {
        for (const ln of ['img_2', 'img_3', 'img_4', 'img_5']) {
          assets.push({ type: 'image', src: image1, layerName: ln });
        }
      }
    }
    if (dto.image2 && !isDual[2]) pushImage('image2', dto.image2);
    if (dto.image3 && !isDual[3]) pushImage('image3', dto.image3);
    if (dto.image4 && !isDual[4]) pushImage('image4', dto.image4);
    if (dto.image5) pushImage('image5', dto.image5);

    // ── Icons ────────────────────────────────────────────────────────────────
    if (dto.icon1) pushImage('icon1', dto.icon1);
    if (dto.icon2) pushImage('icon2', dto.icon2);
    if (dto.icon3) pushImage('icon3', dto.icon3);
    if (dto.icon4) pushImage('icon4', dto.icon4);
    if (dto.icon5) pushImage('icon5', dto.icon5);

    // ── Pure video slots (only when NOT handled as dual-media above) ─────────
    if (dto.video1 && !isDual[1]) pushVideo('video1', dto.video1);
    if (dto.video2 && !isDual[2]) pushVideo('video2', dto.video2);
    if (dto.video3 && !isDual[3]) pushVideo('video3', dto.video3);
    if (dto.video4 && !isDual[4]) pushVideo('video4', dto.video4);

    // ── Generic product image ─────────────────────────────────────────────
    if (dto.image) {
      const layerName = layerMapping.productImage || layerMapping.image;
      if (layerName) assets.push({ type: 'image', src: dto.image, layerName });
    }

    // ── Background ───────────────────────────────────────────────────────────
    if (dto.background) {
      const layerName = layerMapping.background;
      if (layerName)
        assets.push({ type: 'image', src: dto.background, layerName });
    }

    // ── Template 14: Accent Color (Animator 2 -> Expression Selector -> Fill Color on txt_1 & txt_2)
    const accentColorHex =
      dto.colors?.accent || dto.colors?.accentColor || dto.accentColor;

    if (templateId === 14 && accentColorHex) {
      const rgb = this.hexToRgb(accentColorHex);
      assets.push({
        type: 'data',
        layerName: 'txt_1',
        property:
          'ADBE Text Properties.ADBE Text Animators.Animatore 2.ADBE Text Animator Properties.ADBE Text Fill Color',
        value: rgb,
      });
      assets.push({
        type: 'data',
        layerName: 'txt_2',
        property:
          'ADBE Text Properties.ADBE Text Animators.Animatore 2.ADBE Text Animator Properties.ADBE Text Fill Color',
        value: rgb,
      });
    }
    // ── Template 6: Keyword Color, Particles Color, Decoration Color ───────────
    const keywordStartHex =
      dto.keywordColorStart ||
      dto.colors?.keywordColorStart ||
      dto.colors?.primary;
    const keywordEndHex =
      dto.keywordColorEnd ||
      dto.colors?.keywordColorEnd ||
      dto.colors?.secondary;
    const particlesColorHex =
      dto.particlesColor ||
      dto.colors?.particlesColor;
    const decorationColorHex =
      dto.decorationColor ||
      dto.colors?.decorationColor;

    if (templateId === 6) {
      if (keywordStartHex) {
        const rgbStart = this.hexToRgb(keywordStartHex);
        assets.push({
          type: 'data',
          layerName: 'txt_2',
          property: 'ADBE Effect Parade.ADBE Ramp.ADBE Ramp-0002',
          value: rgbStart,
        });
      }
      if (keywordEndHex) {
        const rgbEnd = this.hexToRgb(keywordEndHex);
        assets.push({
          type: 'data',
          layerName: 'txt_2',
          property: 'ADBE Effect Parade.ADBE Ramp.ADBE Ramp-0004',
          value: rgbEnd,
        });
      }
      if (particlesColorHex) {
        const rgbParticles = this.hexToRgb(particlesColorHex);
        assets.push({
          type: 'data',
          layerName: 'img_1',
          property: 'ADBE Effect Parade.ADBE Tint.ADBE Tint-0001',
          value: rgbParticles,
        });
        assets.push({
          type: 'data',
          layerName: 'img_1',
          property: 'ADBE Effect Parade.ADBE Tint.ADBE Tint-0002',
          value: rgbParticles,
        });
      }
      if (decorationColorHex) {
        const rgbDecoration = this.hexToRgb(decorationColorHex);
        assets.push({
          type: 'data',
          layerName: 'img_5',
          property: 'ADBE Effect Parade.ADBE Ramp.ADBE Ramp-0002',
          value: rgbDecoration,
        });
        assets.push({
          type: 'data',
          layerName: 'img_5',
          property: 'ADBE Effect Parade.ADBE Ramp.ADBE Ramp-0004',
          value: rgbDecoration,
        });
      }
    }

    // ── Template 7: Banner Gradient Color on img_1 (Gradient Ramp: Start Color & End Color)
    const bannerStartHex =
      dto.bannerColorStart ||
      dto.colors?.bannerColorStart ||
      dto.colors?.primary;
    const bannerEndHex =
      dto.bannerColorEnd ||
      dto.colors?.bannerColorEnd ||
      dto.colors?.secondary;

    if (templateId === 7) {
      const bannerLayer = 'img_1';
      if (bannerStartHex) {
        const rgbStart = this.hexToRgb(bannerStartHex);
        assets.push({
          type: 'data',
          layerName: bannerLayer,
          property: 'ADBE Effect Parade.ADBE Ramp.ADBE Ramp-0002',
          value: rgbStart,
        });
      }
      if (bannerEndHex) {
        const rgbEnd = this.hexToRgb(bannerEndHex);
        assets.push({
          type: 'data',
          layerName: bannerLayer,
          property: 'ADBE Effect Parade.ADBE Ramp.ADBE Ramp-0004',
          value: rgbEnd,
        });
      }
    }

    // ── Template 8: Button Color (Change to Color effect "A" / "To" on shape_3) ──
    const buttonColorHex =
      dto.buttonColor ||
      dto.colors?.buttonColor ||
      dto.colors?.primary;

    if (templateId === 8 && buttonColorHex) {
      const buttonLayer = layerMapping.buttonColor || 'shape_3';
      const rgbButton = this.hexToRgb(buttonColorHex);
      assets.push({
        type: 'data',
        layerName: buttonLayer,
        composition: 'nested_sequence_2',
        property:
          'ADBE Effect Parade.ADBE Change To Color.ADBE Change To Color-0002',
        value: rgbButton,
      });
    }

    if (dto.colors || accentColorHex) {
      if (dto.colors?.primary) {
        const layerName = layerMapping.colorPrimary;
        if (layerName)
          assets.push({
            type: 'data',
            layerName,
            property: 'Color',
            value: this.hexToRgb(dto.colors.primary),
          });
      }
      if (dto.colors?.secondary) {
        const layerName = layerMapping.colorSecondary;
        if (layerName)
          assets.push({
            type: 'data',
            layerName,
            property: 'Color',
            value: this.hexToRgb(dto.colors.secondary),
          });
      }
      if (accentColorHex && templateId !== 14) {
        const layerName = layerMapping.colorAccent;
        if (layerName)
          assets.push({
            type: 'data',
            layerName,
            property: 'Color',
            value: this.hexToRgb(accentColorHex),
          });
      }
      if (dto.colors?.background) {
        const layerName = layerMapping.colorBackground;
        if (layerName)
          assets.push({
            type: 'data',
            layerName,
            property: 'Color',
            value: this.hexToRgb(dto.colors.background),
          });
      }
      if (dto.colors?.text) {
        const layerName = layerMapping.colorText;
        if (layerName)
          assets.push({
            type: 'data',
            layerName,
            property: 'Color',
            value: this.hexToRgb(dto.colors.text),
          });
      }
    }

    if (dto.useBackgroundColor === false) {
      const bgLayerName = layerMapping.background || 'background';
      assets.push({
        type: 'function',
        name: 'nx:layer-state-set',
        params: {
          layerName: bgLayerName,
          visible: false,
        },
      });
    }

    if (dto.useBlurEffect === false && templateId !== 6 && templateId !== 14) {
      assets.push({
        type: 'function',
        name: 'nx:layer-state-set',
        params: {
          layerName: 'adjustment_1',
          visible: false,
        },
      });
    }

    if (dto.useBlurEffect === false && templateId === 6) {
      assets.push({
        type: 'function',
        name: 'nx:layer-state-set',
        params: {
          layerName: 'adjustment_2',
          visible: false,
        },
      });
    }
    return assets;
  }

  /**
   * Get the font weight for a specific text layer in a template.
   * Based on the actual AE template designs from Text_Properties_by_Animation.md.
   * Accepts either slot keys (text1, text2...) or layer names (txt_1, txt_2...).
   */
  private getLayerFontWeight(
    templateId: number,
    slotOrLayer: string,
  ): 'semibold' | 'medium' | 'regular' | 'light' {
    // Map of templateId -> { slotOrLayer -> weight }
    // Default is 'regular' if not specified.
    const weightMap: Record<number, Record<string, 'semibold' | 'medium' | 'regular' | 'light'>> = {
      // Animation 1: txt_1=Regular, txt_2=Regular
      1: {},

      // Animation 2: all Medium
      2: {
        text1: 'medium', text2: 'medium', text3: 'medium', text4: 'medium',
        txt_1: 'medium', txt_2: 'medium', txt_3: 'medium', txt_4: 'medium',
      },

      // Animation 3: txt_1=Regular, txt_2=Regular, txt_3=Medium, txt_4=Regular
      3: {
        text3: 'medium', txt_3: 'medium',
      },

      // Animation 4: txt_1=Medium, txt_2=Regular
      4: {
        text1: 'medium', txt_1: 'medium',
      },

      // Animation 5: txt_1=Light, txt_2-5=Regular
      5: {
        text1: 'light', txt_1: 'light',
      },

      // Animation 6: txt_1=Regular, txt_2=SemiBold
      6: {
        text2: 'semibold', txt_2: 'semibold',
      },

      // Animation 7: txt_5=Regular (only customizable layer)
      7: {},

      // Animation 8: txt_2=Medium, txt_3=Light, txt_4=Regular
      8: {
        text1: 'medium', txt_2: 'medium',
        text2: 'light', txt_3: 'light',
      },

      // Animation 9: messages=Regular, sender names (txt_2/5/8/11/14)=SemiBold
      9: {
        text6: 'semibold', txt_2: 'semibold',
        txt_5: 'semibold', txt_8: 'semibold', txt_11: 'semibold', txt_14: 'semibold',
      },

      // Animation 10: all Regular
      10: {},

      // Animation 11: txt_3=Regular, txt_2=Regular, txt_6=Medium, txt_10=Medium
      11: {
        text3: 'medium', txt_6: 'medium',
        text4: 'medium', txt_10: 'medium',
      },

      // Animation 12: txt_1=SemiBold, txt_2=Medium, txt_3=Regular
      12: {
        text1: 'semibold', txt_1: 'semibold',
        text2: 'medium', txt_2: 'medium',
      },

      // Animation 13: txt_23=Regular, txt_24=Regular, txt_25=Medium
      13: {
        text3: 'medium', txt_25: 'medium',
      },

      // Animation 14: txt_1=SemiBold, txt_2=Regular
      14: {
        text1: 'semibold', txt_1: 'semibold',
      },

      // Animation 15: txt_4=Regular, txt_5=Medium, txt_6=Light, txt_1=Regular, txt_3=Medium, txt_2=Light
      15: {
        text2: 'medium', txt_5: 'medium',
        text3: 'light', txt_6: 'light',
        text5: 'medium', txt_3: 'medium',
        text6: 'light', txt_2: 'light',
      },

      // Animation 16: txt_1=Medium, txt_2=Regular, txt_3=Regular, txt_4=Medium
      16: {
        text1: 'medium', txt_1: 'medium',
        text4: 'medium', txt_4: 'medium',
      },
    };

    const templateWeights = weightMap[templateId];
    if (templateWeights && templateWeights[slotOrLayer]) {
      return templateWeights[slotOrLayer];
    }
    return 'regular';
  }

  /**
   * Map font family + weight to the exact PostScript font name for After Effects.
   * This is only called for non-default (custom) fonts.
   */
  private getFontPostScriptName(
    fontFamily: string,
    weight: 'semibold' | 'medium' | 'regular' | 'light' = 'regular',
  ): string {
    const normalized = fontFamily.toLowerCase().trim();

    const fontFamilies: Record<
      string,
      { regular: string; semibold: string; medium: string; light: string }
    > = {
      roboto: {
        light: 'Roboto-Light', regular: 'Roboto-Regular',
        medium: 'Roboto-Medium', semibold: 'Roboto-SemiBold',
      },
      montserrat: {
        light: 'Montserrat-Light', regular: 'Montserrat-Regular',
        medium: 'Montserrat-Medium', semibold: 'Montserrat-SemiBold',
      },
      poppins: {
        light: 'Poppins-Light', regular: 'Poppins-Regular',
        medium: 'Poppins-Medium', semibold: 'Poppins-SemiBold',
      },
      'dm-sans': {
        light: 'DMSans-Light', regular: 'DMSans-Regular',
        medium: 'DMSans-Medium', semibold: 'DMSans-SemiBold',
      },
      dmsans: {
        light: 'DMSans-Light', regular: 'DMSans-Regular',
        medium: 'DMSans-Medium', semibold: 'DMSans-SemiBold',
      },
      manrope: {
        light: 'Manrope-Light', regular: 'Manrope-Regular',
        medium: 'Manrope-Medium', semibold: 'Manrope-SemiBold',
      },
      figtree: {
        light: 'Figtree-Light', regular: 'Figtree-Regular',
        medium: 'Figtree-Medium', semibold: 'Figtree-SemiBold',
      },
      rubik: {
        light: 'Rubik-Light', regular: 'Rubik-Regular',
        medium: 'Rubik-Medium', semibold: 'Rubik-SemiBold',
      },
      assistant: {
        light: 'Assistant-Light', regular: 'Assistant-Regular',
        medium: 'Assistant-Medium', semibold: 'Assistant-SemiBold',
      },
      'hanken-grotesk': {
        light: 'HankenGrotesk-Light', regular: 'HankenGrotesk-Regular',
        medium: 'HankenGrotesk-Medium', semibold: 'HankenGrotesk-SemiBold',
      },
      hankengrotesk: {
        light: 'HankenGrotesk-Light', regular: 'HankenGrotesk-Regular',
        medium: 'HankenGrotesk-Medium', semibold: 'HankenGrotesk-SemiBold',
      },
      'noto-sans': {
        light: 'NotoSans-Light', regular: 'NotoSans-Regular',
        medium: 'NotoSans-Medium', semibold: 'NotoSans-SemiBold',
      },
      notosans: {
        light: 'NotoSans-Light', regular: 'NotoSans-Regular',
        medium: 'NotoSans-Medium', semibold: 'NotoSans-SemiBold',
      },
      onest: {
        light: 'Onest-Light', regular: 'Onest-Regular',
        medium: 'Onest-Medium', semibold: 'Onest-SemiBold',
      },
    };

    const familyEntry = fontFamilies[normalized];
    if (familyEntry) {
      return familyEntry[weight];
    }

    // Unknown font family — pass through as-is
    return fontFamily;
  }

  /**
   * Convert hex color to RGB array for After Effects
   * After Effects expects colors as [R, G, B] where values are 0-1
   */
  private hexToRgb(hex: string): number[] {
    // Remove # if present
    const cleanHex = hex.replace('#', '');

    // Parse hex to RGB
    const r = parseInt(cleanHex.substring(0, 2), 16) / 255;
    const g = parseInt(cleanHex.substring(2, 4), 16) / 255;
    const b = parseInt(cleanHex.substring(4, 6), 16) / 255;

    return [r, g, b];
  }

  /**
   * Create render job
   */
  async createRenderJob(
    userId: string,
    templateId: number,
    dto: CreateRenderJobDto,
    webhookUrl: string | null,
  ) {
    // Log incoming DTO for debugging
    this.logger.log(
      `Creating render job for template ${templateId}`,
      `DTO received: ${JSON.stringify(dto, null, 2)}`,
    );

    // Ensure template is uploaded
    const hasCredits = await this.creditsService.hasEnoughCredits(
      userId,
      RenderService.TEMPLATE_CREDIT_COST,
    );

    if (!hasCredits) {
      throw new BadRequestException(
        'Insufficient credits. Please upgrade your plan.',
      );
    }

    const nexrenderTemplateId = await this.ensureTemplateUploaded(templateId);

    // Get template info to fetch actual composition name
    const template = await this.getTemplate(templateId);
    const compositions = template.compositions || [];

    if (compositions.length === 0) {
      throw new BadRequestException(
        `Template ${templateId} has no compositions. Please ensure the template is properly uploaded.`,
      );
    }

    // Use first composition (or you can allow user to select)
    // For MVP, we'll use the first composition
    const composition = compositions[0];
    this.logger.log(
      `Using composition "${composition}" for template ${templateId}`,
    );

    // Build assets array (only includes assets if frontend provides them)
    const assets = await this.buildNexrenderAssets(dto, templateId);

    // Ensure fonts are uploaded to Nexrender Cloud
    // Note: Nexrender automatically adds fonts as static assets when referenced in the fonts array
    const fonts = await this.ensureFontsUploaded();

    // Log assets being sent for debugging
    this.logger.log(
      `Submitting render job with ${assets.length} assets and ${fonts.length} fonts`,
    );
    this.logger.log(`Fonts: ${JSON.stringify(fonts)}`);
    this.logger.log(`Assets:`, JSON.stringify(assets, null, 2));

    // Submit job to Nexrender
    const settings = dto.useBackgroundColor === false 
      ? { type: 'video', quality: 'full', codec: 'video_prores_4444' } 
      : undefined;

    const nexrenderJob = await this.submitNexrenderJob(
      nexrenderTemplateId,
      composition,
      assets,
      webhookUrl,
      fonts,
      settings,
    );

    // Create job in database
    const job = await this.prisma.renderJob.create({
      data: {
        userId,
        templateId,
        nexrenderJobId: nexrenderJob.id,
        status: RenderStatus.PENDING,
        customizations: dto as any,
        creditsUsed: RenderService.TEMPLATE_CREDIT_COST,
      },
    });

    // Deduct credit
    try {
      await this.creditsService.deductCredits(
        userId,
        RenderService.TEMPLATE_CREDIT_COST,
        job.id,
      );
      this.logger.log(
        `Deducted ${RenderService.TEMPLATE_CREDIT_COST} credits from user ${userId} for job ${job.id}`,
      );
    } catch (error) {
      await this.prisma.renderJob.delete({ where: { id: job.id } });
      throw error;
    }

    return job;
  }

  /**
   * Get job status
   */
  /**
   * Helper to determine whether a render output is a transparent ProRes MOV.
   * Priority:
   * 1. Job customization settings: useBackgroundColor === false triggers ProRes 4444 MOV
   * 2. Customization codec explicitly set to video_prores_4444
   * 3. S3 keys or outputUrl containing .mov
   */
  private isMovOutput(
    job?: {
      customizations?: any;
      s3OutputKey?: string | null;
      nexrenderOutputUrl?: string | null;
      outputUrl?: string | null;
    } | null,
    outputUrl?: string | null,
  ): boolean {
    if (job?.customizations) {
      let cust = job.customizations;
      if (typeof cust === 'string') {
        try {
          cust = JSON.parse(cust);
        } catch {}
      }
      if (typeof cust === 'object' && cust !== null) {
        if (
          cust.useBackgroundColor === false ||
          cust.settings?.codec === 'video_prores_4444' ||
          cust.codec === 'video_prores_4444'
        ) {
          return true;
        }
      }
    }

    if (job?.s3OutputKey && job.s3OutputKey.toLowerCase().endsWith('.mov')) {
      return true;
    }

    const candidateUrls = [outputUrl, job?.outputUrl, job?.nexrenderOutputUrl].filter(Boolean);
    for (const rawUrl of candidateUrls) {
      if (typeof rawUrl !== 'string') continue;
      const pathOnly = rawUrl.split('?')[0].toLowerCase();
      if (pathOnly.endsWith('.mov') || pathOnly.includes('.mov')) {
        return true;
      }
    }

    return false;
  }

  /**
   * Safe helper to get a web-playable preview URL.
   * Browsers (Chrome, Edge, Firefox) cannot decode Apple ProRes 4444 MOV files.
   * Never feed a .mov file as a previewUrl to the client.
   */
  getBrowserPlayablePreviewUrl(
    job: {
      customizations?: any;
      s3OutputKey?: string | null;
      nexrenderOutputUrl?: string | null;
      outputUrl?: string | null;
      previewUrl?: string | null;
    } | null,
    previewUrl?: string | null,
    outputUrl?: string | null,
  ): string | null {
    const rawPreview = previewUrl ?? job?.previewUrl;
    if (rawPreview && !rawPreview.split('?')[0].toLowerCase().endsWith('.mov')) {
      return rawPreview;
    }
    const rawOutput = outputUrl ?? job?.outputUrl;
    if (
      rawOutput &&
      !this.isMovOutput(job, rawOutput) &&
      !rawOutput.split('?')[0].toLowerCase().endsWith('.mov')
    ) {
      return rawOutput;
    }
    return null;
  }

  /**
   * Helper to resolve the FFmpeg executable path.
   * 1. @ffmpeg-installer/ffmpeg with chmod 0o755 permission check on Linux/macOS
   * 2. @remotion/renderer bundled FFmpeg
   * 3. System 'ffmpeg'
   */
  private getFfmpegPath(): string {
    try {
      // eslint-disable-next-line @typescript-eslint/no-require-imports
      const ffmpegInstaller = require('@ffmpeg-installer/ffmpeg');
      if (ffmpegInstaller?.path && existsSync(ffmpegInstaller.path)) {
        if (process.platform !== 'win32') {
          try {
            chmodSync(ffmpegInstaller.path, 0o755);
          } catch {}
        }
        return ffmpegInstaller.path;
      }
    } catch {}

    try {
      // eslint-disable-next-line @typescript-eslint/no-require-imports
      const { RenderInternals } = require('@remotion/renderer');
      const bundledPath = RenderInternals?.getExecutablePath?.({ type: 'ffmpeg' });
      if (bundledPath && existsSync(bundledPath)) {
        if (process.platform !== 'win32') {
          try {
            chmodSync(bundledPath, 0o755);
          } catch {}
        }
        return bundledPath;
      }
    } catch {}

    return 'ffmpeg';
  }

  /**
   * Fast FFmpeg transcode: converts a transparent ProRes MOV into a web-optimized MP4 preview.
   * Runs in 2-4 seconds using fast preset and timeout guard.
   */
  private async transcodeMovToMp4Preview(
    inputMovPath: string,
    outputMp4Path: string,
  ): Promise<void> {
    const ffmpegPath = this.getFfmpegPath();
    this.logger.log(`Using FFmpeg binary at: ${ffmpegPath}`);

    return new Promise<void>((resolve, reject) => {
      const args = [
        '-y',
        '-threads',
        '1',
        '-i',
        inputMovPath,
        '-vf',
        'scale=-2:720',
        '-c:v',
        'libx264',
        '-pix_fmt',
        'yuv420p',
        '-preset',
        'veryfast',
        '-crf',
        '26',
        '-maxrate',
        '1.5M',
        '-bufsize',
        '2M',
        '-movflags',
        '+faststart',
        '-c:a',
        'aac',
        '-b:a',
        '128k',
        outputMp4Path,
      ];

      execFile(
        ffmpegPath,
        args,
        {
          timeout: 60000, // 60-second execution cap to prevent hang
          maxBuffer: 10 * 1024 * 1024,
          windowsHide: true,
        },
        (error, _stdout, stderr) => {
          if (error) {
            this.logger.error(`FFmpeg transcode failed: ${error.message}`, stderr);
            reject(error);
          } else {
            resolve();
          }
        },
      );
    });
  }

  /**
   * Get job status
   * Production-safe: Non-blocking HTTP GET handler.
   * Responds in < 20ms to prevent proxy timeouts (Cloudflare 100s, ALB 60s).
   */
  async getJobStatus(jobId: string, userId: string) {
    const job = await this.prisma.renderJob.findFirst({
      where: { id: jobId, userId },
    });

    if (!job) {
      throw new NotFoundException('Job not found');
    }

    // 1. Fast path: if already COMPLETED and outputUrl is set, return immediately in < 2ms
    if (job.status === RenderStatus.COMPLETED && job.outputUrl) {
      const expired = isJobExpired(job);
      return {
        id: job.id,
        userId: job.userId,
        templateId: job.templateId,
        status: RenderStatus.COMPLETED,
        outputUrl: expired ? null : job.outputUrl,
        previewUrl: expired ? null : this.getBrowserPlayablePreviewUrl(job),
        nexrenderOutputUrl: expired ? null : job.nexrenderOutputUrl,
        progress: 100,
        isExpired: expired,
        createdAt: job.createdAt,
        updatedAt: job.updatedAt,
      };
    }

    // 2. If already FAILED, return immediately
    if (job.status === RenderStatus.FAILED) {
      return {
        id: job.id,
        userId: job.userId,
        templateId: job.templateId,
        status: RenderStatus.FAILED,
        error: job.error,
        outputUrl: null,
        previewUrl: null,
        progress: 0,
        createdAt: job.createdAt,
        updatedAt: job.updatedAt,
      };
    }

    // 3. Query Nexrender Cloud API for latest render state
    if (job.nexrenderJobId) {
      try {
        this.logger.log(
          `Checking Nexrender status for job: ${job.nexrenderJobId}`,
        );

        const response = await firstValueFrom(
          this.httpService.get(
            `${this.nexrenderApiUrl}/jobs/${job.nexrenderJobId}`,
            {
              headers: {
                Authorization: `Bearer ${this.nexrenderApiKey}`,
              },
            },
          ),
        );

        const jobData = response.data;
        const state = jobData.state || jobData.status || jobData.renderStatus;
        const rawProgress = jobData.progress || jobData.renderProgress || 0;
        const outputUrl =
          jobData.output?.url || jobData.outputUrl || jobData.result?.url;
        const errorMessage =
          jobData.error || jobData.renderError || jobData.stats?.error;

        this.logger.log(`Nexrender job details:`, {
          state,
          rawProgress,
          hasOutputUrl: !!outputUrl,
          ...(errorMessage ? { error: errorMessage } : {}),
        });

        const stateMap: Record<string, RenderStatus> = {
          pending: RenderStatus.PENDING,
          queued: RenderStatus.PENDING,
          processing: RenderStatus.PROCESSING,
          rendering: RenderStatus.PROCESSING,
          finished: RenderStatus.COMPLETED,
          completed: RenderStatus.COMPLETED,
          done: RenderStatus.COMPLETED,
          error: RenderStatus.FAILED,
          failed: RenderStatus.FAILED,
        };

        const normalizedState = (state || '').toLowerCase();
        let status: RenderStatus = job.status;

        if (stateMap[normalizedState]) {
          status = stateMap[normalizedState];
        } else if (rawProgress !== undefined) {
          if (rawProgress === 100 && outputUrl) {
            status = RenderStatus.COMPLETED;
          } else if (rawProgress > 0 && rawProgress < 100) {
            status = RenderStatus.PROCESSING;
          } else if (rawProgress === 0) {
            status = RenderStatus.PENDING;
          }
        }

        // --- SCENARIO A: Nexrender finished rendering ---
        if (status === RenderStatus.COMPLETED && outputUrl) {
          // If already in memory upload Set, it's currently processing on this server instance
          if (this.activeUploads.has(job.id)) {
            return {
              id: job.id,
              userId: job.userId,
              templateId: job.templateId,
              status: RenderStatus.PROCESSING,
              outputUrl: null,
              previewUrl: null,
              progress: 99,
              createdAt: job.createdAt,
              updatedAt: job.updatedAt,
            };
          }

          // Check if another instance claimed it recently (within 3 minutes)
          const isRecentClaim =
            job.nexrenderOutputUrl &&
            Date.now() - new Date(job.updatedAt).getTime() < 180000;

          if (isRecentClaim) {
            return {
              id: job.id,
              userId: job.userId,
              templateId: job.templateId,
              status: RenderStatus.PROCESSING,
              outputUrl: null,
              previewUrl: null,
              progress: 99,
              createdAt: job.createdAt,
              updatedAt: job.updatedAt,
            };
          }

          // Not actively processing, or lock expired (> 3 mins) -> Claim and launch background worker!
          this.activeUploads.add(job.id);
          this.logger.log(
            `Initiating asynchronous S3 post-processing for job ${job.id} (fire-and-forget)...`,
          );

          await this.prisma.renderJob.update({
            where: { id: job.id },
            data: {
              nexrenderOutputUrl: outputUrl,
              updatedAt: new Date(),
            },
          });

          // Run in background WITHOUT awaiting inside this HTTP request
          this.processAndUploadNexrenderResult(job, outputUrl)
            .catch((uploadErr) => {
              this.logger.error(
                `Background post-processing failed for job ${job.id}:`,
                uploadErr,
              );
            })
            .finally(() => {
              this.activeUploads.delete(job.id);
            });

          // Return immediately (< 15ms) with progress 99%
          return {
            id: job.id,
            userId: job.userId,
            templateId: job.templateId,
            status: RenderStatus.PROCESSING,
            outputUrl: null,
            previewUrl: null,
            progress: 99,
            createdAt: job.createdAt,
            updatedAt: job.updatedAt,
          };
        }

        // --- SCENARIO B: Render failed on Nexrender ---
        if (status === RenderStatus.FAILED) {
          await this.prisma.renderJob.update({
            where: { id: job.id },
            data: {
              status: RenderStatus.FAILED,
              error: errorMessage || 'Render failed on Nexrender Cloud',
            },
          });

          try {
            await this.creditsService.refundCredits(
              job.userId,
              job.creditsUsed,
              job.id,
            );
          } catch (refundErr) {
            this.logger.error('Failed to refund credits:', refundErr);
          }

          return {
            id: job.id,
            userId: job.userId,
            templateId: job.templateId,
            status: RenderStatus.FAILED,
            error: errorMessage || 'Render failed on Nexrender Cloud',
            outputUrl: null,
            previewUrl: null,
            progress: 0,
            createdAt: job.createdAt,
            updatedAt: job.updatedAt,
          };
        }

        // --- SCENARIO C: Render is actively in progress or pending ---
        const displayProgress = Math.min(98, Math.max(0, Math.round(rawProgress)));
        if (status !== job.status) {
          await this.prisma.renderJob.update({
            where: { id: job.id },
            data: { status },
          });
        }

        return {
          id: job.id,
          userId: job.userId,
          templateId: job.templateId,
          status,
          outputUrl: null,
          previewUrl: null,
          nexrenderOutputUrl: null,
          nexrenderState: state,
          progress: displayProgress,
          expiresAt: job.expiresAt,
          isExpired: false,
          createdAt: job.createdAt,
          updatedAt: job.updatedAt,
        };
      } catch (error) {
        this.logger.error('Failed to get Nexrender job status:', error);
      }
    }

    const isExpiredJob = isJobExpired(job);
    return {
      ...job,
      outputUrl: isExpiredJob ? null : job.outputUrl,
      previewUrl: isExpiredJob ? null : this.getBrowserPlayablePreviewUrl(job),
      nexrenderOutputUrl: isExpiredJob ? null : job.nexrenderOutputUrl,
      isExpired: isExpiredJob,
      progress: job.outputUrl ? 100 : 0,
    };
  }

  async getUserRenderJobs(userId: string) {
    // Automatically refresh up to 3 active jobs to ensure dashboard reflects finished renders
    const activeJobs = await this.prisma.renderJob.findMany({
      where: {
        userId,
        status: { in: [RenderStatus.PROCESSING, RenderStatus.PENDING] },
      },
      select: { id: true },
      take: 3,
    });

    if (activeJobs.length > 0) {
      await Promise.allSettled(
        activeJobs.map((job) => this.getJobStatus(job.id, userId)),
      );
    }

    const jobs = await this.prisma.renderJob.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        templateId: true,
        renderType: true,
        status: true,
        outputUrl: true,
        previewUrl: true,
        nexrenderOutputUrl: true,
        error: true,
        promptText: true,
        expiresAt: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    return jobs.map((job) => {
      const expired = isJobExpired(job);
      return {
        ...job,
        outputUrl: expired ? null : job.outputUrl,
        previewUrl: expired ? null : this.getBrowserPlayablePreviewUrl(job),
        nexrenderOutputUrl: expired ? null : job.nexrenderOutputUrl,
        isExpired: expired,
      };
    });
  }

  /**
   * Handle render completion webhook
   */
  async handleRenderComplete(
    nexrenderJobId: string,
    outputUrl: string,
    state: string,
    error?: string,
  ) {
    const job = await this.prisma.renderJob.findUnique({
      where: { nexrenderJobId },
    });

    if (!job) {
      this.logger.warn(`Job not found for Nexrender job ID: ${nexrenderJobId}`);
      return null;
    }

    const normalizedState = (state || '').toLowerCase();
    const isCompleted =
      normalizedState === 'finished' ||
      normalizedState === 'completed' ||
      normalizedState === 'done';

    if (isCompleted && outputUrl) {
      if (job.status === RenderStatus.COMPLETED && job.outputUrl) {
        this.logger.log(`Job ${job.id} already completed, returning existing output.`);
        return {
          jobId: job.id,
          outputUrl: job.outputUrl,
          previewUrl: job.previewUrl,
          expiresAt: job.expiresAt,
        };
      }

      if (this.activeUploads.has(job.id)) {
        this.logger.log(`Job ${job.id} is already actively being processed.`);
        return { jobId: job.id, status: 'PROCESSING' };
      }

      this.activeUploads.add(job.id);
      try {
        this.logger.log(
          `Processing completed render job ${job.id} from webhook, streaming from: ${outputUrl}`,
        );
        const result = await this.processAndUploadNexrenderResult(job, outputUrl);
        return {
          jobId: job.id,
          outputUrl: result.outputUrl,
          previewUrl: result.previewUrl,
          expiresAt: result.expiresAt,
        };
      } catch (err: unknown) {
        this.logger.error('Failed to process render completion from webhook', {
          error: err instanceof Error ? err.message : 'Unknown error',
          jobId: job.id,
          nexrenderJobId,
        });
        throw err;
      } finally {
        this.activeUploads.delete(job.id);
      }
    } else if (normalizedState === 'error' || normalizedState === 'failed') {
      this.logger.error(`Render job failed: ${nexrenderJobId}`, { error });

      await this.prisma.renderJob.update({
        where: { id: job.id },
        data: {
          status: RenderStatus.FAILED,
          error: error || 'Render failed',
        },
      });

      try {
        await this.creditsService.refundCredits(
          job.userId,
          job.creditsUsed,
          job.id,
        );
        this.logger.log(
          `Refunded ${job.creditsUsed} credit(s) for failed render on job ${job.id}`,
        );
      } catch (refundError) {
        this.logger.error('Failed to refund credits:', refundError);
      }
    } else {
      this.logger.log(
        `Render job ${nexrenderJobId} state: ${state} (not completed yet)`,
      );
    }

    return null;
  }

  /**
   * Process completed Nexrender video output and upload to S3.
   * If MOV (transparent export):
   * 1. Saves MOV to a local temporary file with unique randomized filename.
   * 2. Uploads pristine MOV to S3 (used for user download).
   * 3. Runs a fast FFmpeg pass to create a web-playable MP4 preview.
   * 4. Uploads preview MP4 to S3 (used for browser preview player).
   * 5. Cleans up temp files.
   * If MP4:
   * Streams directly to S3.
   */
  private async processAndUploadNexrenderResult(
    job: {
      id: string;
      userId: string;
      nexrenderJobId: string | null;
      templateId: number | null;
      customizations?: any;
      s3OutputKey?: string | null;
      createdAt: Date;
      updatedAt: Date;
    },
    outputUrl: string,
  ) {
    const isMov = this.isMovOutput(job, outputUrl);
    const ext = isMov ? 'mov' : 'mp4';
    const s3Key = `renders/${job.userId}/${job.nexrenderJobId}.${ext}`;
    const previewS3Key = isMov
      ? `renders/${job.userId}/${job.nexrenderJobId}-preview.mp4`
      : s3Key;

    let presignedUrl: string;
    let presignedPreviewUrl: string | null = null;
    let finalPreviewKey: string | null = null;

    try {
      if (isMov) {
        const rand = crypto.randomBytes(4).toString('hex');
        const tmpMovPath = path.join(
          os.tmpdir(),
          `edikit-${job.id}-${Date.now()}-${rand}.mov`,
        );
        const tmpMp4Path = path.join(
          os.tmpdir(),
          `edikit-${job.id}-${Date.now()}-${rand}-preview.mp4`,
        );

        let bufferedComplete = false;
        let masterUploaded = false;

        try {
          this.logger.log(`Downloading MOV stream to temp file: ${tmpMovPath}`);
          const videoResponse = await firstValueFrom(
            this.httpService.get(outputUrl, {
              responseType: 'stream',
              maxBodyLength: Infinity,
              maxContentLength: Infinity,
              timeout: 180000,
            }),
          );

          await streamPipeline(videoResponse.data, createWriteStream(tmpMovPath));
          bufferedComplete = true;
          this.logger.log(`Downloaded MOV successfully, uploading master to S3: ${s3Key}`);

          // 1. Upload master MOV to S3
          await this.s3Service.uploadStream(
            createReadStream(tmpMovPath),
            s3Key,
            'video/quicktime',
          );
          masterUploaded = true;
          presignedUrl = await this.s3Service.generatePresignedUrl(s3Key, 7 * 24 * 3600);
          this.logger.log(`Master MOV uploaded to S3: ${s3Key}`);

          // Early checkpoint: Mark job COMPLETED with pristine MOV immediately
          // Guarantees user is never stuck at 99% if preview pass encounters an issue
          try {
            const user = await this.prisma.user.findUnique({
              where: { id: job.userId },
              select: { planType: true },
            });
            const expiresAt = calculateExpirationDate(user?.planType);
            await this.prisma.renderJob.update({
              where: { id: job.id },
              data: {
                status: RenderStatus.COMPLETED,
                outputUrl: presignedUrl,
                previewUrl: null,
                nexrenderOutputUrl: s3Key,
                s3OutputKey: s3Key,
                expiresAt,
              },
            });
          } catch (checkpointErr) {
            this.logger.warn(`Failed to write early completion checkpoint:`, checkpointErr);
          }

          // 2. Transcode preview MP4
          try {
            this.logger.log(`Transcoding MOV to MP4 preview using FFmpeg...`);
            await this.transcodeMovToMp4Preview(tmpMovPath, tmpMp4Path);

            this.logger.log(`Uploading MP4 preview to S3: ${previewS3Key}`);
            await this.s3Service.uploadStream(
              createReadStream(tmpMp4Path),
              previewS3Key,
              'video/mp4',
            );
            presignedPreviewUrl = await this.s3Service.generatePresignedUrl(
              previewS3Key,
              7 * 24 * 3600,
              undefined,
              'inline',
            );
            finalPreviewKey = previewS3Key;
            this.logger.log(`Preview MP4 uploaded successfully: ${previewS3Key}`);
          } catch (transcodeErr) {
            this.logger.warn(
              `Preview transcode failed, continuing with master MOV only:`,
              transcodeErr,
            );
            presignedPreviewUrl = null;
            finalPreviewKey = null;
          }
        } catch (movErr) {
          if (bufferedComplete && !masterUploaded && existsSync(tmpMovPath)) {
            try {
              await this.s3Service.uploadStream(
                createReadStream(tmpMovPath),
                s3Key,
                'video/quicktime',
              );
              presignedUrl = await this.s3Service.generatePresignedUrl(s3Key, 7 * 24 * 3600);
              presignedPreviewUrl = null;
              finalPreviewKey = null;
            } catch {
              throw movErr;
            }
          } else {
            throw movErr;
          }
        } finally {
          await fs.unlink(tmpMovPath).catch(() => {});
          await fs.unlink(tmpMp4Path).catch(() => {});
        }
      } else {
        // Direct stream for standard MP4
        const videoResponse = await firstValueFrom(
          this.httpService.get(outputUrl, {
            responseType: 'stream',
            maxBodyLength: Infinity,
            maxContentLength: Infinity,
            timeout: 180000,
          }),
        );

        this.logger.log(`Streaming MP4 to S3 key: ${s3Key}`);
        await this.s3Service.uploadStream(videoResponse.data, s3Key, 'video/mp4');
        presignedUrl = await this.s3Service.generatePresignedUrl(s3Key, 7 * 24 * 3600);
        presignedPreviewUrl = await this.s3Service.generatePresignedUrl(
          s3Key,
          7 * 24 * 3600,
          undefined,
          'inline',
        );
        finalPreviewKey = s3Key;
        this.logger.log(`Streamed MP4 to S3 successfully: ${s3Key}`);
      }
    } catch (uploadPipelineError) {
      this.logger.error(
        `Failed to stream/upload video to S3 for job ${job.id}, falling back to direct Nexrender URL:`,
        uploadPipelineError,
      );

      const user = await this.prisma.user.findUnique({
        where: { id: job.userId },
        select: { planType: true },
      });
      const expiresAt = calculateExpirationDate(user?.planType);

      await this.prisma.renderJob.update({
        where: { id: job.id },
        data: {
          status: RenderStatus.COMPLETED,
          outputUrl: outputUrl,
          previewUrl: isMov ? null : outputUrl,
          nexrenderOutputUrl: outputUrl,
          expiresAt,
        },
      });

      return {
        id: job.id,
        userId: job.userId,
        templateId: job.templateId,
        status: RenderStatus.COMPLETED,
        outputUrl: outputUrl,
        previewUrl: isMov ? null : outputUrl,
        nexrenderOutputUrl: outputUrl,
        expiresAt,
        isExpired: false,
        progress: 100,
        createdAt: job.createdAt,
        updatedAt: job.updatedAt,
      };
    }

    const user = await this.prisma.user.findUnique({
      where: { id: job.userId },
      select: { planType: true },
    });
    const expiresAt = calculateExpirationDate(user?.planType);

    await this.prisma.renderJob.update({
      where: { id: job.id },
      data: {
        status: RenderStatus.COMPLETED,
        outputUrl: presignedUrl,
        previewUrl: presignedPreviewUrl,
        nexrenderOutputUrl: s3Key,
        s3OutputKey: s3Key,
        s3PreviewKey: finalPreviewKey,
        expiresAt,
      },
    });

    return {
      id: job.id,
      userId: job.userId,
      templateId: job.templateId,
      status: RenderStatus.COMPLETED,
      outputUrl: presignedUrl,
      previewUrl: presignedPreviewUrl,
      nexrenderOutputUrl: s3Key,
      expiresAt,
      isExpired: false,
      progress: 100,
      createdAt: job.createdAt,
      updatedAt: job.updatedAt,
    };
  }

  /**
   * Get optimized video URL — regenerates a fresh presigned URL for S3-backed videos
   */
  async getOptimizedVideoUrl(jobId: string, userId: string): Promise<string> {
    const job = await this.prisma.renderJob.findFirst({
      where: { id: jobId, userId },
    });

    if (!job || (!job.outputUrl && !job.previewUrl)) {
      throw new NotFoundException('Video not ready');
    }

    if (isJobExpired(job)) {
      throw new BadRequestException(
        'This video has expired and is no longer available for playback.',
      );
    }

    const keyToStream =
      job.s3PreviewKey ||
      job.s3OutputKey ||
      (job.nexrenderOutputUrl?.startsWith('renders/') ? job.nexrenderOutputUrl : null);

    if (keyToStream && this.s3Service.isConfigured()) {
      return this.s3Service.generatePresignedUrl(
        keyToStream,
        7 * 24 * 3600, // Fresh 7-day presigned URL
        undefined,
        'inline',
      );
    }

    return this.getBrowserPlayablePreviewUrl(job) || '';
  }

  /**
   * Stream download for a render job.
   * For S3-backed jobs: generates a fresh presigned URL and returns it (permanent, works months later).
   * For legacy/fallback jobs: returns the stored URL directly.
   * The controller will redirect the browser to this URL, forcing a file download.
   */
  async getJobDownloadUrl(jobId: string, userId: string): Promise<{ url: string; filename: string }> {
    const job = await this.prisma.renderJob.findFirst({
      where: { id: jobId, userId },
    });

    if (!job) throw new NotFoundException('Render job not found');

    if (isJobExpired(job)) {
      throw new BadRequestException(
        'This video has expired and is no longer available for download.',
      );
    }

    const isMov = this.isMovOutput(job, job.outputUrl);
    const ext = isMov ? 'mov' : 'mp4';
    const filename = `edikit-${job.templateId || 'render'}-${job.id.slice(0, 8)}.${ext}`;

    const keyToDownload =
      job.s3OutputKey ||
      (job.nexrenderOutputUrl?.startsWith('renders/') ? job.nexrenderOutputUrl : null);

    // S3-backed: regenerate a fresh presigned URL with Content-Disposition: attachment
    if (keyToDownload && this.s3Service.isConfigured()) {
      const presignedUrl = await this.s3Service.generatePresignedUrl(
        keyToDownload,
        3600, // 1-hour download link
        filename,
        'attachment',
      );
      return { url: presignedUrl, filename };
    }

    const downloadUrl = job.outputUrl || job.nexrenderOutputUrl;
    if (!downloadUrl) throw new BadRequestException('Render job does not have an output URL yet');

    return { url: downloadUrl, filename };
  }

  async deleteRenderJob(jobId: string, userId: string) {
    const job = await this.prisma.renderJob.findFirst({
      where: { id: jobId, userId },
    });

    if (!job) {
      throw new NotFoundException('Render job not found');
    }

    // Clean up AWS S3 storage if configured
    const s3Key =
      job.s3OutputKey ||
      (job.nexrenderOutputUrl?.startsWith('renders/') ? job.nexrenderOutputUrl : null);

    if (s3Key && this.s3Service.isConfigured()) {
      try {
        await this.s3Service.deleteObject(s3Key);
      } catch (s3Err) {
        this.logger.warn(
          `Failed to delete S3 object ${s3Key} on manual delete for job ${job.id}:`,
          s3Err,
        );
      }
    }

    if (job.s3PreviewKey && job.s3PreviewKey !== s3Key && this.s3Service.isConfigured()) {
      try {
        await this.s3Service.deleteObject(job.s3PreviewKey);
      } catch (s3Err) {
        this.logger.warn(
          `Failed to delete preview S3 object ${job.s3PreviewKey} on manual delete for job ${job.id}:`,
          s3Err,
        );
      }
    }

    await this.prisma.renderJob.delete({ where: { id: job.id } });

    return {
      message: 'Render job deleted successfully',
      jobId: job.id,
    };
  }

  /**
   * Manually update layer mapping for a template
   */
  async updateLayerMapping(
    templateId: number,
    layerMapping: Record<string, string>,
  ): Promise<{
    templateId: number;
    layerMapping: Record<string, string>;
  }> {
    await this.prisma.nexrenderTemplate.update({
      where: { templateId },
      data: {
        layerMapping: layerMapping as any,
      },
    });

    this.logger.log(
      `Layer mapping updated for template ${templateId}:`,
      layerMapping,
    );

    return {
      templateId,
      layerMapping,
    };
  }

  /**
   * Regenerate layer mapping for a template using auto-detection
   */
  async regenerateLayerMapping(templateId: number): Promise<{
    templateId: number;
    layerMapping: Record<string, string>;
    layers: Array<{ layerName: string; composition: string }>;
  }> {
    const template = await this.prisma.nexrenderTemplate.findUnique({
      where: { templateId },
    });

    if (!template) {
      throw new NotFoundException(`Template ${templateId} not found`);
    }

    const layers =
      (template.layers as Array<{
        layerName: string;
        composition: string;
      }>) || [];

    if (layers.length === 0) {
      throw new BadRequestException(
        `Template ${templateId} has no layers to generate mapping from`,
      );
    }

    // Regenerate mapping using the updated auto-detection logic
    const newMapping = this.autoGenerateLayerMapping(layers, templateId);

    // Update in database
    await this.prisma.nexrenderTemplate.update({
      where: { templateId },
      data: {
        layerMapping: newMapping as any,
      },
    });

    this.logger.log(
      `✓ Layer mapping regenerated for template ${templateId}:`,
      newMapping,
    );

    return {
      templateId,
      layerMapping: newMapping,
      layers,
    };
  }

  /**
   * Regenerate layer mappings for all templates
   */
  async regenerateAllLayerMappings(): Promise<
    Array<{
      templateId: number;
      success: boolean;
      layerMapping?: Record<string, string>;
      error?: string;
    }>
  > {
    const templates = await this.prisma.nexrenderTemplate.findMany({
      orderBy: { templateId: 'asc' },
    });

    const results: Array<{
      templateId: number;
      success: boolean;
      layerMapping?: Record<string, string>;
      error?: string;
    }> = [];

    for (const template of templates) {
      try {
        const result = await this.regenerateLayerMapping(template.templateId);
        results.push({
          templateId: template.templateId,
          success: true,
          layerMapping: result.layerMapping,
        });
      } catch (error) {
        results.push({
          templateId: template.templateId,
          success: false,
          error: error instanceof Error ? error.message : 'Unknown error',
        });
      }
    }

    this.logger.log(
      `Layer mapping regeneration completed for ${results.length} templates`,
    );

    return results;
  }

  /**
   * Delete a template from Nexrender Cloud
   */
  async deleteTemplateFromNexrender(nexrenderId: string): Promise<boolean> {
    try {
      this.logger.log(`Deleting template from Nexrender: ${nexrenderId}`);

      await firstValueFrom(
        this.httpService.delete(
          `${this.nexrenderApiUrl}/templates/${nexrenderId}`,
          {
            headers: {
              Authorization: `Bearer ${this.nexrenderApiKey}`,
            },
          },
        ),
      );

      this.logger.log(`✅ Template ${nexrenderId} deleted from Nexrender`);
      return true;
    } catch (error: unknown) {
      const errorResponse = (error as any)?.response;
      this.logger.error('Failed to delete template from Nexrender', {
        nexrenderId,
        error: error instanceof Error ? error.message : 'Unknown error',
        status: errorResponse?.status,
        data: errorResponse?.data,
      });

      // If template not found (404), consider it already deleted
      if (errorResponse?.status === 404) {
        this.logger.warn(
          `Template ${nexrenderId} not found in Nexrender (may already be deleted)`,
        );
        return true;
      }

      throw new BadRequestException(
        `Failed to delete template: ${
          error instanceof Error ? error.message : 'Unknown error'
        }`,
      );
    }
  }

  /**
   * Delete a template by templateId (from both Nexrender and database)
   */
  async deleteTemplate(templateId: number): Promise<{
    success: boolean;
    deletedFromNexrender: boolean;
    deletedFromDatabase: boolean;
    error?: string;
  }> {
    try {
      // Get template from database
      const template = await this.prisma.nexrenderTemplate.findUnique({
        where: { templateId },
      });

      let deletedFromNexrender = false;
      let deletedFromDatabase = false;

      // Delete from Nexrender if nexrenderId exists
      if (template?.nexrenderId) {
        try {
          await this.deleteTemplateFromNexrender(template.nexrenderId);
          deletedFromNexrender = true;
        } catch (error) {
          this.logger.warn(
            `Failed to delete template ${templateId} from Nexrender, continuing with database deletion`,
          );
        }
      }

      // Delete from database
      if (template) {
        await this.prisma.nexrenderTemplate.delete({
          where: { templateId },
        });
        deletedFromDatabase = true;
        this.logger.log(`✅ Template ${templateId} deleted from database`);
      } else {
        this.logger.warn(`Template ${templateId} not found in database`);
      }

      return {
        success: true,
        deletedFromNexrender,
        deletedFromDatabase,
      };
    } catch (error: unknown) {
      const errorMessage =
        error instanceof Error ? error.message : 'Unknown error';
      this.logger.error(
        `Failed to delete template ${templateId}:`,
        errorMessage,
      );
      return {
        success: false,
        deletedFromNexrender: false,
        deletedFromDatabase: false,
        error: errorMessage,
      };
    }
  }

  /**
   * Delete all templates from Nexrender Cloud and database
   */
  async deleteAllTemplates(): Promise<
    Array<{
      templateId: number;
      success: boolean;
      deletedFromNexrender: boolean;
      deletedFromDatabase: boolean;
      error?: string;
    }>
  > {
    const results: Array<{
      templateId: number;
      success: boolean;
      deletedFromNexrender: boolean;
      deletedFromDatabase: boolean;
      error?: string;
    }> = [];

    // Get all templates from database
    const templates = await this.prisma.nexrenderTemplate.findMany({
      select: {
        templateId: true,
        nexrenderId: true,
      },
    });

    this.logger.log(`Found ${templates.length} templates to delete`);

    for (const template of templates) {
      try {
        this.logger.log(`Deleting template ${template.templateId}...`);

        const result = await this.deleteTemplate(template.templateId);
        results.push({
          templateId: template.templateId,
          ...result,
        });

        // Small delay between deletions to avoid rate limiting
        await new Promise((resolve) => setTimeout(resolve, 1000));
      } catch (error) {
        const errorMessage =
          error instanceof Error ? error.message : 'Unknown error';
        this.logger.error(
          `Failed to delete template ${template.templateId}: ${errorMessage}`,
        );
        results.push({
          templateId: template.templateId,
          success: false,
          deletedFromNexrender: false,
          deletedFromDatabase: false,
          error: errorMessage,
        });
      }
    }

    return results;
  }

  /**
   * Upload all templates to Nexrender Cloud
   * This should be called once to initialize all templates
   */
  async uploadAllTemplates(): Promise<
    Array<{
      templateId: number;
      success: boolean;
      nexrenderId?: string;
      error?: string;
    }>
  > {
    const results: Array<{
      templateId: number;
      success: boolean;
      nexrenderId?: string;
      error?: string;
    }> = [];

    // Find all .aep and .zip files in animations folder
    const files = await fs.readdir(this.animationsPath);
    const templateFiles = files.filter(
      (f) => f.endsWith('.aep') || f.endsWith('.zip'),
    );

    this.logger.log(
      `Found ${templateFiles.length} template files (.aep/.zip) to upload`,
    );

    for (const file of templateFiles) {
      // Extract template ID from filename
      // Matches: "Animation 1.aep", "Animation_1.zip", "Animation1.aep", etc.
      const match = file.match(/Animation[_\s]*(\d+)\.(aep|zip)/i);
      if (!match) {
        this.logger.warn(`Skipping file with unexpected name: ${file}`);
        continue;
      }

      const templateId = parseInt(match[1], 10);

      try {
        this.logger.log(`Uploading template ${templateId} (${file})...`);

        // Check if already uploaded
        const existing = await this.getTemplateId(templateId);
        if (existing) {
          this.logger.log(
            `Template ${templateId} already uploaded, skipping...`,
          );
          results.push({
            templateId,
            success: true,
            nexrenderId: existing,
          });
          continue;
        }

        // Upload template
        const nexrenderId = await this.ensureTemplateUploaded(templateId);

        results.push({
          templateId,
          success: true,
          nexrenderId,
        });

        this.logger.log(
          `✅ Template ${templateId} uploaded successfully: ${nexrenderId}`,
        );
      } catch (error) {
        const errorMessage =
          error instanceof Error ? error.message : 'Unknown error';
        this.logger.error(
          `❌ Failed to upload template ${templateId}: ${errorMessage}`,
        );
        results.push({
          templateId,
          success: false,
          error: errorMessage,
        });
      }

      // Small delay between uploads to avoid rate limiting
      await new Promise((resolve) => setTimeout(resolve, 1000));
    }

    return results;
  }
}
