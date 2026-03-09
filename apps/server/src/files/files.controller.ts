/* eslint-disable @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-call */
import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Post,
  Query,
  Request,
  UseGuards,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { AuthenticatedRequest } from '../types/auth.request';
import { FilesService } from './files.service';
// For simplicity in this environment, I will use a custom storage handler or assume standard interceptor works if compat package installed.
// Actually, standard FileInterceptor is for Express. Fastify requires different handling.
// Let's implement a custom interceptor or just use a raw request handler for upload if standard fails.
// However, 'fastify-multipart' is the standard way.

@Controller('files')
export class FilesController {
  constructor(private filesService: FilesService) {}

  @Get()
  @UseGuards(AuthGuard('jwt'))
  async list(
    @Request() req: AuthenticatedRequest,
    @Query('folderId') folderId?: string,
  ) {
    return this.filesService.listFiles(req.user.userId, folderId);
  }

  @Get('shared')
  async listShared(@Query('folderId') folderId?: string) {
    return this.filesService.listPublicFiles(folderId);
  }

  @Get('shared/download/:id')
  async downloadPublic(@Request() req: any, @Param('id') id: string) {
    // Use X-Forwarded-Host if available (when behind proxy), otherwise fallback to Host header
    const host =
      req.headers?.['x-forwarded-host'] || req.headers?.host || req.hostname;
    const url = await this.filesService.getPublicDownloadUrl(id, host);
    return { url };
  }

  @Get('storage')
  @UseGuards(AuthGuard('jwt'))
  async getStorage() {
    return this.filesService.getStorageInfo();
  }

  @Post('upload')
  @UseGuards(AuthGuard('jwt'))
  // @UseInterceptors(FileInterceptor('file')) // This won't work out of box with Fastify without registerMultipart
  async upload(@Request() req: AuthenticatedRequest) {
    // Fastify multipart handling manually for robustness
    const parts = req.parts();
    let fileBuffer: Buffer | null = null;
    let fileName = '';
    let mimeType = '';
    let parentId: string | undefined;
    let isPublic = false;

    for await (const part of parts) {
      const typedPart = part;
      if (typedPart.file) {
        fileName = typedPart.filename;
        mimeType = typedPart.mimetype;
        fileBuffer = await typedPart.toBuffer();
      } else {
        if (typedPart.fieldname === 'parentId') {
          parentId = typedPart.value as string;
        } else if (typedPart.fieldname === 'isPublic') {
          isPublic = typedPart.value === 'true';
        }
      }
    }

    if (!fileBuffer) {
      throw new Error('No file uploaded');
    }

    return this.filesService.uploadFile(
      req.user.userId,
      {
        originalname: fileName,
        buffer: fileBuffer,
        mimetype: mimeType,
        size: fileBuffer.length,
      },
      parentId,
      isPublic,
    );
  }

  @Post('folder')
  @UseGuards(AuthGuard('jwt'))
  async createFolder(
    @Request() req: AuthenticatedRequest,
    @Body() body: { name: string; parentId?: string; isPublic?: boolean },
  ) {
    return this.filesService.createFolder(
      req.user.userId,
      body.name,
      body.parentId,
      body.isPublic,
    );
  }

  @Get('download/:id')
  @UseGuards(AuthGuard('jwt'))
  async download(
    @Request() req: AuthenticatedRequest,
    @Param('id') id: string,
  ) {
    // Use X-Forwarded-Host if available (when behind proxy), otherwise fallback to Host header
    const host =
      (req as any).headers?.['x-forwarded-host'] ||
      (req as any).headers?.host ||
      (req as any).hostname;
    const url = await this.filesService.getDownloadUrl(
      req.user.userId,
      id,
      host,
    );
    return { url };
  }

  @Post('share/:id')
  @UseGuards(AuthGuard('jwt'))
  async share(@Request() req: AuthenticatedRequest, @Param('id') id: string) {
    return this.filesService.createShareLink(req.user.userId, id);
  }

  // ========== STARRED (Favoritos) ==========

  @Get('starred')
  @UseGuards(AuthGuard('jwt'))
  async listStarred(@Request() req: AuthenticatedRequest) {
    return this.filesService.listStarredFiles(req.user.userId);
  }

  @Post('starred/:id')
  @UseGuards(AuthGuard('jwt'))
  async toggleStarred(
    @Request() req: AuthenticatedRequest,
    @Param('id') id: string,
  ) {
    return this.filesService.toggleStarred(req.user.userId, id);
  }

  // ========== TRASH (Lixeira) ==========

  @Get('trash')
  @UseGuards(AuthGuard('jwt'))
  async listTrash(@Request() req: AuthenticatedRequest) {
    return this.filesService.listTrash(req.user.userId);
  }

  @Post('trash/:id/restore')
  @UseGuards(AuthGuard('jwt'))
  async restoreFromTrash(
    @Request() req: AuthenticatedRequest,
    @Param('id') id: string,
  ) {
    return this.filesService.restoreFromTrash(req.user.userId, id);
  }

  @Delete('trash')
  @UseGuards(AuthGuard('jwt'))
  async emptyTrash(@Request() req: AuthenticatedRequest) {
    return this.filesService.emptyTrash(req.user.userId);
  }

  @Delete('trash/:id')
  @UseGuards(AuthGuard('jwt'))
  async permanentDelete(
    @Request() req: AuthenticatedRequest,
    @Param('id') id: string,
  ) {
    return this.filesService.permanentDelete(req.user.userId, id);
  }

  // ========== RECENT (Recentes) ==========

  @Get('recent')
  @UseGuards(AuthGuard('jwt'))
  async listRecent(@Request() req: AuthenticatedRequest) {
    return this.filesService.listRecent(req.user.userId);
  }

  // ========== THUMBNAILS ==========

  @Get('thumbnail/:id')
  @UseGuards(AuthGuard('jwt'))
  async getThumbnail(
    @Request() req: AuthenticatedRequest,
    @Param('id') id: string,
  ) {
    const url = await this.filesService.getThumbnailUrl(req.user.userId, id);
    return { url };
  }

  @Post('thumbnails')
  @UseGuards(AuthGuard('jwt'))
  async getThumbnails(
    @Request() req: AuthenticatedRequest,
    @Body() body: { ids: string[] },
  ) {
    const urls = await this.filesService.getThumbnailUrls(
      req.user.userId,
      body.ids,
    );
    return urls;
  }

  @Post('public/thumbnails')
  async getPublicThumbnails(@Body() body: { ids: string[] }) {
    const urls = await this.filesService.getPublicThumbnailUrls(body.ids);
    return urls;
  }

  @Delete('shared/:id')
  @UseGuards(AuthGuard('jwt'))
  async deleteShared(@Param('id') id: string) {
    return this.filesService.deleteSharedItem(id);
  }

  @Delete(':id')
  @UseGuards(AuthGuard('jwt'))
  async delete(@Request() req: AuthenticatedRequest, @Param('id') id: string) {
    return this.filesService.deleteItem(req.user.userId, id);
  }
}
