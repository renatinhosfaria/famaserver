import { Processor, WorkerHost } from '@nestjs/bullmq';
import { Inject, Logger } from '@nestjs/common';
import { Job } from 'bullmq';
import sharp from 'sharp';
import { NodePgDatabase } from 'drizzle-orm/node-postgres';
import { eq } from 'drizzle-orm';
import { DRIZZLE } from '../database/database.module';
import * as schema from '../database/schema';
import { files } from '../database/schema';
import { StorageService } from '../storage/storage.service';

@Processor('file-processing')
export class FileProcessor extends WorkerHost {
  private readonly logger = new Logger(FileProcessor.name);

  constructor(
    private storageService: StorageService,
    @Inject(DRIZZLE) private db: NodePgDatabase<typeof schema>,
  ) {
    super();
  }

  async process(job: Job<any, any, string>): Promise<any> {
    this.logger.log(`Processing job ${job.id} of type ${job.name}...`);
    this.logger.log(`Data: ${JSON.stringify(job.data)}`);

    const { fileId, userId, mimeType, s3Key } = job.data;

    // Only generate thumbnails for image files
    if (mimeType && mimeType.startsWith('image/')) {
      try {
        // 1. Download original from S3
        const originalBuffer = await this.storageService.getFileBuffer(s3Key);

        // 2. Generate 256x256 thumbnail
        const thumbnailBuffer = await sharp(originalBuffer)
          .resize(256, 256, { fit: 'cover', withoutEnlargement: true })
          .jpeg({ quality: 80 })
          .toBuffer();

        // 3. Upload thumbnail to S3
        const thumbKey = `thumbnails/${userId}/${fileId}.jpg`;
        await this.storageService.uploadFile(
          thumbKey,
          thumbnailBuffer,
          'image/jpeg',
        );

        // 4. Update DB record with thumbnail key
        await this.db
          .update(files)
          .set({ thumbnailS3Key: thumbKey })
          .where(eq(files.id, fileId));

        this.logger.log(`Thumbnail generated for file ${fileId}: ${thumbKey}`);
      } catch (error) {
        this.logger.error(
          `Failed to generate thumbnail for file ${fileId}:`,
          error,
        );
        // Don't rethrow - thumbnail failure should not fail the job
      }
    } else {
      this.logger.log(
        `Skipping thumbnail generation for non-image file ${fileId} (${mimeType})`,
      );
    }

    this.logger.log(`Job ${job.id} completed!`);
    return {};
  }
}
