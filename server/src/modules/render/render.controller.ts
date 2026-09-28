import {
  Controller,
  Post,
  Get,
  Delete,
  Put,
  Body,
  Param,
  Query,
  Headers,
  UseGuards,
  UploadedFiles,
  UseInterceptors,
  ParseIntPipe,
  BadRequestException,
  UnauthorizedException,
  Logger,
} from '@nestjs/common';
import { Throttle, SkipThrottle } from '@nestjs/throttler';
import { FilesInterceptor } from '@nestjs/platform-express';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiCookieAuth,
  ApiConsumes,
  ApiBody,
} from '@nestjs/swagger';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { Public } from '../../common/decorators/public.decorator';
import { RenderService } from './render.service';
import { CreateRenderJobDto } from './dto/create-render-job.dto';
import { ConfigService } from '@nestjs/config';

@ApiTags('Render')
@Controller('render')
@UseGuards(JwtAuthGuard, RolesGuard)
export class RenderController {
  private readonly logger = new Logger(RenderController.name);
  constructor(
    private readonly renderService: RenderService,
    private readonly configService: ConfigService,
  ) {}

  @Throttle({ default: { limit: 15, ttl: 60000 } })
  @Post('upload-asset')
  @UseInterceptors(
    FilesInterceptor('files', 10, {
      limits: { fileSize: 50 * 1024 * 1024 }, // 50MB max per file
    }),
  )
  @ApiOperation({ summary: 'Upload user images/videos to Cloudinary' })
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        files: {
          type: 'array',
          items: {
            type: 'string',
            format: 'binary',
          },
        },
      },
    },
  })
  @ApiCookieAuth()
  @ApiResponse({ status: 200, description: 'Files uploaded successfully' })
  async uploadAsset(
    @CurrentUser('userId') userId: string,
    @UploadedFiles() files: Express.Multer.File[],
  ) {
    if (!files || files.length === 0) {
      throw new BadRequestException('No files uploaded');
    }

    const uploadResults = await Promise.all(
      files.map((file) => {
        // Detect asset type based on magic bytes inspection
        const assetType = this.getAssetType(file);
        return this.renderService.uploadAsset(file, userId, assetType);
      }),
    );

    // uploadResults are already secure_url strings from the service
    return {
      urls: uploadResults,
    };
  }

  @Post('upload-video')
  @UseInterceptors(
    FilesInterceptor('files', 5, {
      limits: { fileSize: 50 * 1024 * 1024 }, // 50MB max per file
    }),
  )
  @ApiOperation({ summary: 'Upload user videos to Cloudinary' })
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        files: {
          type: 'array',
          items: {
            type: 'string',
            format: 'binary',
          },
        },
      },
    },
  })
  @ApiCookieAuth()
  @ApiResponse({ status: 200, description: 'Videos uploaded successfully' })
  async uploadVideo(
    @CurrentUser('userId') userId: string,
    @UploadedFiles() files: Express.Multer.File[],
  ) {
    if (!files || files.length === 0) {
      throw new BadRequestException('No files uploaded');
    }

    // Validate that all files are videos via magic bytes
    for (const file of files) {
      if (!this.isVideoBuffer(file.buffer)) {
        throw new BadRequestException(
          `Invalid file type: ${file.originalname}. Only verified video files (MP4, MOV, WEBM) are allowed.`,
        );
      }
    }

    const uploadResults = await Promise.all(
      files.map((file) =>
        this.renderService.uploadAsset(file, userId, 'video'),
      ),
    );

    // uploadResults are already secure_url strings from the service
    return {
      urls: uploadResults,
    };
  }

  /**
   * Magic bytes verification helper methods
   */
  private isImageBuffer(buffer: Buffer): boolean {
    if (!buffer || buffer.length < 12) return false;
    // JPEG: FF D8 FF
    if (buffer[0] === 0xff && buffer[1] === 0xd8 && buffer[2] === 0xff) {
      return true;
    }
    // PNG: 89 50 4E 47
    if (
      buffer[0] === 0x89 &&
      buffer[1] === 0x50 &&
      buffer[2] === 0x4e &&
      buffer[3] === 0x47
    ) {
      return true;
    }
    // WEBP: RIFF....WEBP
    if (
      buffer[0] === 0x52 &&
      buffer[1] === 0x49 &&
      buffer[2] === 0x46 &&
      buffer[3] === 0x46 &&
      buffer[8] === 0x57 &&
      buffer[9] === 0x45 &&
      buffer[10] === 0x42 &&
      buffer[11] === 0x50
    ) {
      return true;
    }
    // GIF: GIF8
    if (
      buffer[0] === 0x47 &&
      buffer[1] === 0x49 &&
      buffer[2] === 0x46 &&
      buffer[3] === 0x38
    ) {
      return true;
    }
    return false;
  }

  private isVideoBuffer(buffer: Buffer): boolean {
    if (!buffer || buffer.length < 12) return false;
    // WebM / MKV: 1A 45 DF A3
    if (
      buffer[0] === 0x1a &&
      buffer[1] === 0x45 &&
      buffer[2] === 0xdf &&
      buffer[3] === 0xa3
    ) {
      return true;
    }
    // MP4 / MOV ISO Base Media File Format box signatures at offset 4..7
    const boxType = buffer.toString('ascii', 4, 8);
    if (
      boxType === 'ftyp' ||
      boxType === 'moov' ||
      boxType === 'mdat' ||
      boxType === 'wide'
    ) {
      return true;
    }
    return false;
  }

  private isFontBuffer(buffer: Buffer): boolean {
    if (!buffer || buffer.length < 4) return false;
    // TrueType: 00 01 00 00 or 74 72 75 65 ('true')
    if (
      (buffer[0] === 0x00 &&
        buffer[1] === 0x01 &&
        buffer[2] === 0x00 &&
        buffer[3] === 0x00) ||
      (buffer[0] === 0x74 &&
        buffer[1] === 0x72 &&
        buffer[2] === 0x75 &&
        buffer[3] === 0x65)
    ) {
      return true;
    }
    // OpenType: 4F 54 54 4F ('OTTO')
    if (
      buffer[0] === 0x4f &&
      buffer[1] === 0x54 &&
      buffer[2] === 0x54 &&
      buffer[3] === 0x4f
    ) {
      return true;
    }
    // WOFF: 77 4F 46 46 ('wOFF')
    if (
      buffer[0] === 0x77 &&
      buffer[1] === 0x4f &&
      buffer[2] === 0x46 &&
      buffer[3] === 0x46
    ) {
      return true;
    }
    // WOFF2: 77 4F 46 32 ('wOF2')
    if (
      buffer[0] === 0x77 &&
      buffer[1] === 0x4f &&
      buffer[2] === 0x46 &&
      buffer[3] === 0x32
    ) {
      return true;
    }
    return false;
  }

  /**
   * Detect asset type based on magic bytes inspection
   */
  private getAssetType(file: Express.Multer.File): 'image' | 'video' {
    if (this.isVideoBuffer(file.buffer)) {
      return 'video';
    }
    if (this.isImageBuffer(file.buffer)) {
      return 'image';
    }
    throw new BadRequestException(
      `Invalid file type: ${file.originalname}. Only verified image (PNG, JPG, WEBP) and video (MP4, MOV, WEBM) files are allowed.`,
    );
  }

  @Delete('delete-asset')
  @ApiOperation({ summary: 'Delete user asset from Cloudinary' })
  @ApiCookieAuth()
  @ApiResponse({ status: 200, description: 'Asset deleted successfully' })
  async deleteAsset(
    @CurrentUser('userId') userId: string,
    @Body() body: { publicId: string; resourceType?: 'image' | 'video' },
  ) {
    if (!body.publicId) {
      throw new BadRequestException('publicId is required');
    }

    const resourceType = body.resourceType || 'image';

    // Verify the asset belongs to the user (public_id should contain userId)
    if (!body.publicId.includes(userId)) {
      throw new BadRequestException('You can only delete your own assets');
    }

    await this.renderService.deleteAsset(body.publicId, resourceType);

    return {
      message: 'Asset deleted successfully',
      publicId: body.publicId,
    };
  }

  @Get('fonts')
  @ApiOperation({ summary: 'List all fonts uploaded to Nexrender Cloud' })
  @ApiCookieAuth()
  @ApiResponse({
    status: 200,
    description: 'Fonts retrieved successfully',
    schema: {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          id: { type: 'string', description: 'Unique font identifier' },
          familyName: {
            type: 'string',
            description: 'Font family name (e.g., Arial, Helvetica Neue)',
          },
          fileName: {
            type: 'string',
            description:
              'Original font file name as uploaded (TTF only). This is the file name referenced in render jobs.',
          },
          createdAt: {
            type: 'string',
            description: 'ISO timestamp when the font was uploaded',
          },
        },
      },
    },
  })
  async listFonts() {
    const fonts = await this.renderService.listNexrenderFonts();
    return {
      total: fonts.length,
      fonts,
    };
  }

  @Roles('ADMIN')
  @Post('fonts')
  @UseInterceptors(
    FilesInterceptor('files', 10, {
      limits: { fileSize: 20 * 1024 * 1024 }, // 20MB max per font file
    }),
  )
  @ApiOperation({ summary: 'Upload fonts to Nexrender Cloud (admin only)' })
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        files: {
          type: 'array',
          items: {
            type: 'string',
            format: 'binary',
          },
          description: 'Font files to upload (TTF format only)',
        },
      },
      required: ['files'],
    },
  })
  @ApiCookieAuth()
  @ApiResponse({
    status: 201,
    description: 'Fonts uploaded successfully',
    schema: {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          id: { type: 'string' },
          familyName: { type: 'string' },
          fileName: { type: 'string' },
          createdAt: { type: 'string' },
        },
      },
    },
  })
  async uploadFonts(
    @CurrentUser('userId') userId: string,
    @UploadedFiles() files: Express.Multer.File[],
  ) {
    if (!files || files.length === 0) {
      throw new BadRequestException('No files uploaded');
    }

    // Validate that all files are authentic font files via magic bytes and extension
    for (const file of files) {
      if (
        !file.originalname.toLowerCase().endsWith('.ttf') ||
        !this.isFontBuffer(file.buffer)
      ) {
        throw new BadRequestException(
          `Invalid file type: ${file.originalname}. Only verified TTF font files are allowed.`,
        );
      }
    }

    const uploadResults =
      await this.renderService.uploadFontsToNexrender(files);

    return {
      total: uploadResults.length,
      fonts: uploadResults,
    };
  }

  @Roles('ADMIN')
  @Delete('fonts/:fontId')
  @ApiOperation({ summary: 'Delete a font from Nexrender Cloud (admin only)' })
  @ApiCookieAuth()
  @ApiResponse({
    status: 200,
    description: 'Font deleted successfully',
    schema: {
      type: 'object',
      properties: {
        message: { type: 'string' },
        fontId: { type: 'string' },
      },
    },
  })
  @ApiResponse({
    status: 404,
    description: 'Font not found',
  })
  async deleteFont(
    @CurrentUser('userId') userId: string,
    @Param('fontId') fontId: string,
  ) {
    await this.renderService.deleteFontFromNexrender(fontId);

    return {
      message: 'Font deleted successfully',
      fontId,
    };
  }

  @Roles('ADMIN')
  @Post('fonts/upload-local')
  @ApiOperation({
    summary: 'Upload all fonts from server animations/fonts directory (admin only)',
  })
  @ApiCookieAuth()
  @ApiResponse({
    status: 200,
    description: 'Local fonts upload completed',
    schema: {
      type: 'object',
      properties: {
        message: { type: 'string' },
        uploaded: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              id: { type: 'string' },
              familyName: { type: 'string' },
              fileName: { type: 'string' },
            },
          },
        },
        skipped: { type: 'array', items: { type: 'string' } },
        errors: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              fileName: { type: 'string' },
              error: { type: 'string' },
            },
          },
        },
      },
    },
  })
  async uploadLocalFonts(@CurrentUser('userId') userId: string) {
    const result = await this.renderService.uploadAllLocalFonts();

    return {
      message: 'Font upload process completed',
      ...result,
    };
  }

  @Get('templates')
  @ApiOperation({ summary: 'Get all templates' })
  @ApiCookieAuth()
  @ApiResponse({
    status: 200,
    description: 'Templates retrieved successfully',
  })
  async getTemplates() {
    const templates = await this.renderService.getAllTemplates();
    return templates;
  }

  @Get('templates/:templateId')
  @ApiOperation({ summary: 'Get template by ID' })
  @ApiCookieAuth()
  @ApiResponse({
    status: 200,
    description: 'Template retrieved successfully',
  })
  async getTemplate(@Param('templateId', ParseIntPipe) templateId: number) {
    const template = await this.renderService.getTemplate(templateId);
    return template;
  }

  @Throttle({ default: { limit: 5, ttl: 60000 } })
  @Post('create-job/:templateId')
  @ApiOperation({ summary: 'Create render job' })
  @ApiCookieAuth()
  @ApiResponse({
    status: 201,
    description: 'Render job created successfully',
  })
  async createJob(
    @Param('templateId', ParseIntPipe) templateId: number,
    @CurrentUser('userId') userId: string,
    @Body() dto: CreateRenderJobDto,
  ) {
    const nodeEnv = this.configService.get<string>('NODE_ENV', 'development');

    let webhookUrl: string | null = null;

    if (nodeEnv === 'production') {
      const backendUrl =
        this.configService.get<string>('BACKEND_URL') ||
        this.configService.get<string>('RENDER_EXTERNAL_URL');
      const webhookSecret = this.configService.get<string>('RENDER_WEBHOOK_SECRET');
      const secretQuery = webhookSecret ? `?secret=${encodeURIComponent(webhookSecret)}` : '';
      webhookUrl = backendUrl ? `${backendUrl}/render/webhook${secretQuery}` : null;
    }
    // In development: webhookUrl stays null — job completion is handled via polling in getJobStatus()

    this.logger.log(
      `Using webhook URL: ${webhookUrl ?? 'none (polling mode)'}`,
    );

    const job = await this.renderService.createRenderJob(
      userId,
      templateId,
      dto,
      webhookUrl,
    );

    return job;
  }

  @Get('job/:id')
  @ApiOperation({ summary: 'Get render job status' })
  @ApiCookieAuth()
  @ApiResponse({
    status: 200,
    description: 'Job status retrieved successfully',
  })
  async getJobStatus(
    @Param('id') jobId: string,
    @CurrentUser('userId') userId: string,
  ) {
    const job = await this.renderService.getJobStatus(jobId, userId);
    return job;
  }

  @Get('jobs')
  @ApiOperation({ summary: 'Get current user render jobs' })
  @ApiCookieAuth()
  @ApiResponse({
    status: 200,
    description: 'Render jobs retrieved successfully',
  })
  async getJobs(@CurrentUser('userId') userId: string) {
    return this.renderService.getUserRenderJobs(userId);
  }

  @Delete('job/:id')
  @ApiOperation({ summary: 'Delete a render job' })
  @ApiCookieAuth()
  @ApiResponse({ status: 200, description: 'Render job deleted successfully' })
  async deleteJob(
    @Param('id') jobId: string,
    @CurrentUser('userId') userId: string,
  ) {
    return this.renderService.deleteRenderJob(jobId, userId);
  }

  @Public()
  @SkipThrottle()
  @Post('webhook')
  @ApiOperation({ summary: 'Nexrender Cloud webhook handler' })
  @ApiResponse({ status: 200, description: 'Webhook processed successfully' })
  async handleWebhook(
    @Query('secret') secretQuery: string | undefined,
    @Headers('x-webhook-secret') secretHeader: string | undefined,
    @Body()
    body: {
      id?: string;
      jobId?: string;
      state?: string;
      status?: string;
      output?: { url?: string };
      outputUrl?: string;
      error?: string;
    },
  ) {
    const configuredSecret = this.configService.get<string>('RENDER_WEBHOOK_SECRET');
    if (configuredSecret) {
      const providedSecret = secretQuery || secretHeader;
      if (!providedSecret || providedSecret !== configuredSecret) {
        this.logger.warn('Unauthorized render webhook attempt detected');
        throw new UnauthorizedException('Invalid webhook secret');
      }
    }

    this.logger.log('=== NEXRENDER WEBHOOK RECEIVED ===');
    this.logger.log('Full webhook body:', JSON.stringify(body, null, 2));

    // Handle multiple possible formats from Nexrender
    const jobId = body.id || body.jobId;
    const state = body.state || body.status || '';
    const outputUrl = body.output?.url || body.outputUrl || '';
    const error = body.error;

    this.logger.log('Extracted values:', {
      jobId,
      state,
      outputUrl,
      error,
    });

    if (!jobId) {
      this.logger.error('Missing job ID in webhook');
      throw new BadRequestException('Missing job ID in webhook');
    }

    const result = await this.renderService.handleRenderComplete(
      jobId,
      outputUrl,
      state,
      error,
    );

    this.logger.log('Webhook processed successfully:', result);
    this.logger.log('========================');

    return { success: true, jobId, result };
  }

  @Get('job/:id/video')
  @ApiOperation({ summary: 'Get optimized video URL' })
  @ApiCookieAuth()
  @ApiResponse({
    status: 200,
    description: 'Video URL retrieved successfully',
  })
  async getVideoUrl(
    @Param('id') jobId: string,
    @CurrentUser('userId') userId: string,
  ) {
    const url = await this.renderService.getOptimizedVideoUrl(jobId, userId);
    return { url };
  }

  @Get('templates/:templateId/layers')
  @ApiOperation({
    summary: 'Get template layer names (for debugging layer mapping)',
  })
  @ApiCookieAuth()
  @ApiResponse({
    status: 200,
    description: 'Template layers retrieved successfully',
  })
  async getTemplateLayers(
    @Param('templateId', ParseIntPipe) templateId: number,
  ) {
    const template = await this.renderService.getTemplate(templateId);

    // Get layer mapping from database
    const dbRecord = await this.renderService.getTemplateRecord(templateId);
    const layerMapping =
      (dbRecord as { layerMapping?: Record<string, string> })?.layerMapping ||
      {};

    // Log to console for easy debugging
    this.logger.log(`=== Template ${templateId} Layer Information ===`);
    this.logger.log('Compositions:', template.compositions);
    this.logger.log('Layers:', template.layers);
    this.logger.log('Current Layer Mapping:', layerMapping);
    this.logger.log('===============================================');

    return {
      templateId,
      compositions: template.compositions,
      layers: template.layers,
      layerMapping,
      message:
        'Layer mapping is auto-generated and stored in database. Check server logs for details.',
    };
  }

  @Roles('ADMIN')
  @Put('templates/:templateId/layer-mapping')
  @ApiOperation({
    summary: 'Manually update layer mapping for a template (admin only)',
  })
  @ApiCookieAuth()
  @ApiResponse({
    status: 200,
    description: 'Layer mapping updated successfully',
  })
  async updateLayerMapping(
    @Param('templateId', ParseIntPipe) templateId: number,
    @Body()
    body: {
      layerMapping: Record<string, string>;
    },
  ) {
    const result = await this.renderService.updateLayerMapping(
      templateId,
      body.layerMapping,
    );
    return {
      message: 'Layer mapping updated successfully',
      ...result,
    };
  }

  @Roles('ADMIN')
  @Post('templates/:templateId/regenerate-mapping')
  @ApiOperation({
    summary: 'Regenerate layer mapping for a template using auto-detection (admin only)',
  })
  @ApiCookieAuth()
  @ApiResponse({
    status: 200,
    description: 'Layer mapping regenerated successfully',
  })
  async regenerateLayerMapping(
    @Param('templateId', ParseIntPipe) templateId: number,
  ) {
    const result = await this.renderService.regenerateLayerMapping(templateId);
    return {
      message: 'Layer mapping regenerated successfully',
      ...result,
    };
  }

  @Roles('ADMIN')
  @Post('templates/regenerate-all-mappings')
  @ApiOperation({
    summary: 'Regenerate layer mappings for all templates (admin only)',
  })
  @ApiCookieAuth()
  @ApiResponse({
    status: 200,
    description: 'All layer mappings regenerated successfully',
  })
  async regenerateAllLayerMappings() {
    const results = await this.renderService.regenerateAllLayerMappings();
    return {
      message: 'Layer mapping regeneration completed',
      results,
    };
  }

  @Roles('ADMIN')
  @Post('templates/upload/:templateId')
  @ApiOperation({
    summary: 'Upload a single template to Nexrender Cloud (admin only)',
  })
  @ApiCookieAuth()
  @ApiResponse({
    status: 200,
    description: 'Template uploaded successfully',
  })
  async uploadTemplate(@Param('templateId', ParseIntPipe) templateId: number) {
    try {
      const nexrenderId =
        await this.renderService.ensureTemplateUploaded(templateId);
      return {
        message: 'Template uploaded successfully',
        templateId,
        nexrenderId,
      };
    } catch (error) {
      throw new BadRequestException(
        error instanceof Error ? error.message : 'Failed to upload template',
      );
    }
  }

  @Roles('ADMIN')
  @Post('templates/upload-all')
  @ApiOperation({
    summary: 'Upload all templates to Nexrender Cloud (admin only)',
  })
  @ApiCookieAuth()
  @ApiResponse({
    status: 200,
    description: 'All templates uploaded successfully',
  })
  async uploadAllTemplates() {
    const results = await this.renderService.uploadAllTemplates();
    return {
      message: 'Template upload process completed',
      results,
    };
  }

  @Roles('ADMIN')
  @Delete('templates/:templateId')
  @ApiOperation({
    summary: 'Delete a template from Nexrender and database (admin only)',
  })
  @ApiCookieAuth()
  @ApiResponse({
    status: 200,
    description: 'Template deleted successfully',
  })
  async deleteTemplate(@Param('templateId', ParseIntPipe) templateId: number) {
    const result = await this.renderService.deleteTemplate(templateId);
    return {
      message: result.success
        ? 'Template deleted successfully'
        : 'Template deletion failed',
      ...result,
    };
  }

  @Roles('ADMIN')
  @Delete('templates')
  @ApiOperation({
    summary: 'Delete ALL templates from Nexrender and database (admin only)',
  })
  @ApiCookieAuth()
  @ApiResponse({
    status: 200,
    description: 'All templates deletion process completed',
  })
  async deleteAllTemplates() {
    this.logger.warn(
      '⚠️ DELETE ALL TEMPLATES REQUESTED - This will remove all templates!',
    );
    const results = await this.renderService.deleteAllTemplates();
    return {
      message: 'Template deletion process completed',
      results,
      summary: {
        total: results.length,
        successful: results.filter((r) => r.success).length,
        failed: results.filter((r) => !r.success).length,
      },
    };
  }
}
