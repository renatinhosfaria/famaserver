import { Controller, Get, Param } from '@nestjs/common';
import { StorageService } from '../storage/storage.service';
import { FilesService } from './files.service';

@Controller('public/share')
export class PublicShareController {
  constructor(
    private filesService: FilesService,
    private storageService: StorageService,
  ) {}

  @Get(':token')
  async getSharedFile(@Param('token') token: string) {
    const file = await this.filesService.getFileByShareToken(token);
    if (!file.s3Key) throw new Error('File invalid');

    const url = await this.storageService.getDownloadUrl(file.s3Key);
    return {
      file: { name: file.name, size: file.size, mimeType: file.mimeType },
      url,
    };
  }
}
