import {
  ForbiddenException,
  Inject,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { and, desc, eq, inArray, isNull, not, or, sql } from 'drizzle-orm';
import { NodePgDatabase } from 'drizzle-orm/node-postgres';
import { v4 as uuidv4 } from 'uuid';
import { DRIZZLE } from '../database/database.module';
import * as schema from '../database/schema';
import { files } from '../database/schema';
import { StorageService } from '../storage/storage.service';

import { InjectQueue } from '@nestjs/bullmq';
import { Queue } from 'bullmq';

@Injectable()
export class FilesService {
  constructor(
    @Inject(DRIZZLE) private db: NodePgDatabase<typeof schema>,
    private storageService: StorageService,
    @InjectQueue('file-processing') private fileQueue: Queue,
  ) {}

  async listFiles(userId: number, folderId?: string) {
    const parentId = folderId || null;
    // Fix: drizzle isNull usage might need explicit null check if types are strict, but let's try standard way
    const whereClause = parentId
      ? and(
          eq(files.userId, userId),
          eq(files.parentId, parentId),
          isNull(files.deletedAt),
        )
      : and(
          eq(files.userId, userId),
          isNull(files.parentId),
          isNull(files.deletedAt),
        );

    return this.db
      .select()
      .from(files)
      .where(whereClause)
      .orderBy(desc(files.createdAt)); // Folders first logic can be added later
  }

  async listPublicFiles(folderId?: string) {
    const parentId = folderId || undefined;
    // If folderId provided, we browse INSIDE that folder (which must be public or contain public files).
    // If NOT set, show only ROOT public files (parentId is null).

    if (parentId) {
      return this.db
        .select()
        .from(files)
        .where(
          and(
            eq(files.isPublic, true),
            eq(files.parentId, parentId),
            isNull(files.deletedAt),
          ),
        )
        .orderBy(desc(files.createdAt));
    }

    // Return only root-level public files (no parent)
    return this.db
      .select()
      .from(files)
      .where(
        and(
          eq(files.isPublic, true),
          isNull(files.parentId),
          isNull(files.deletedAt),
        ),
      )
      .orderBy(desc(files.createdAt));
  }

  async uploadFile(
    userId: number,
    file: {
      originalname: string;
      buffer: Buffer;
      mimetype: string;
      size: number;
    },
    parentId?: string,
    isPublic: boolean = false,
  ) {
    const key = `${userId}/${uuidv4()}-${file.originalname}`;

    // Upload to S3
    await this.storageService.uploadFile(key, file.buffer, file.mimetype);

    // Save metadata
    const [record] = await this.db
      .insert(files)
      .values({
        userId,
        parentId: parentId || null,
        name: file.originalname,
        size: file.size,
        mimeType: file.mimetype,
        type: 'file',
        s3Key: key,
        isPublic,
      })
      .returning();

    // Add to processing queue
    await this.fileQueue.add('process-file', {
      fileId: record.id,
      userId: record.userId,
      mimeType: record.mimeType,
      s3Key: record.s3Key,
    });

    return record;
  }

  async createFolder(
    userId: number,
    name: string,
    parentId?: string,
    isPublic: boolean = false,
  ) {
    const [record] = await this.db
      .insert(files)
      .values({
        userId,
        parentId: parentId || null,
        name,
        size: 0,
        mimeType: 'application/folder',
        type: 'folder',
        isPublic,
        s3Key: null,
      })
      .returning();
    return record;
  }

  async createShareLink(userId: number, fileId: string) {
    // Check ownership
    const [file] = await this.db
      .select()
      .from(files)
      .where(and(eq(files.id, fileId), eq(files.userId, userId)));
    if (!file) throw new Error('File not found');

    const token = uuidv4();
    const [share] = await this.db
      .insert(schema.shares)
      .values({
        fileId,
        token,
        expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days default
      })
      .returning();

    return share;
  }

  async getFileByShareToken(token: string) {
    const [share] = await this.db
      .select()
      .from(schema.shares)
      .where(eq(schema.shares.token, token));
    if (!share) throw new Error('Invalid or expired link');

    const [file] = await this.db
      .select()
      .from(files)
      .where(eq(files.id, share.fileId));
    if (!file) throw new Error('File not found');

    return file;
  }

  async getDownloadUrl(userId: number, fileId: string, requestHost?: string) {
    const fileRecord = await this.db.query.files.findFirst({
      where: and(eq(files.id, fileId), eq(files.userId, userId)),
    });

    if (!fileRecord || !fileRecord.s3Key) {
      throw new Error('File not found');
    }

    return this.storageService.getDownloadUrl(fileRecord.s3Key, requestHost);
  }

  async getPublicDownloadUrl(fileId: string, _requestHost?: string) {
    const fileRecord = await this.db.query.files.findFirst({
      where: and(eq(files.id, fileId), eq(files.isPublic, true)),
    });

    if (!fileRecord || !fileRecord.s3Key) {
      throw new Error('File not found or not public');
    }

    // Use simple public URL for public files (bucket has public download policy)
    return this.storageService.getPublicUrl(fileRecord.s3Key);
  }

  // ========== THUMBNAILS ==========

  async getThumbnailUrl(
    userId: number,
    fileId: string,
  ): Promise<string | null> {
    const file = await this.db.query.files.findFirst({
      where: and(
        eq(files.id, fileId),
        or(eq(files.userId, userId), eq(files.isPublic, true)),
        isNull(files.deletedAt),
      ),
    });
    if (!file?.thumbnailS3Key) return null;
    return this.storageService.getDownloadUrl(file.thumbnailS3Key);
  }

  async getThumbnailUrls(
    userId: number,
    fileIds: string[],
  ): Promise<Record<string, string>> {
    const result: Record<string, string> = {};
    if (!fileIds.length) return result;

    const userFiles = await this.db
      .select({ id: files.id, thumbnailS3Key: files.thumbnailS3Key })
      .from(files)
      .where(
        and(
          inArray(files.id, fileIds),
          or(eq(files.userId, userId), eq(files.isPublic, true)),
          isNull(files.deletedAt),
        ),
      );

    await Promise.all(
      userFiles
        .filter((f) => f.thumbnailS3Key)
        .map(async (f) => {
          result[f.id] = await this.storageService.getDownloadUrl(
            f.thumbnailS3Key!,
          );
        }),
    );

    return result;
  }

  async getPublicThumbnailUrls(
    fileIds: string[],
  ): Promise<Record<string, string>> {
    const result: Record<string, string> = {};
    if (!fileIds.length) return result;

    const publicFiles = await this.db
      .select({ id: files.id, thumbnailS3Key: files.thumbnailS3Key })
      .from(files)
      .where(
        and(
          inArray(files.id, fileIds),
          eq(files.isPublic, true),
          isNull(files.deletedAt),
        ),
      );

    await Promise.all(
      publicFiles
        .filter((f) => f.thumbnailS3Key)
        .map(async (f) => {
          result[f.id] = await this.storageService.getDownloadUrl(
            f.thumbnailS3Key!,
          );
        }),
    );

    return result;
  }

  async deleteItem(userId: number, fileId: string) {
    const [file] = await this.db
      .select({ id: files.id, userId: files.userId })
      .from(files)
      .where(eq(files.id, fileId));

    if (!file) {
      throw new NotFoundException('Item not found');
    }

    if (file.userId !== userId) {
      throw new ForbiddenException(
        'You do not have permission to delete this item',
      );
    }

    // Soft delete (owner scope)
    await this.db
      .update(files)
      .set({ deletedAt: new Date(), updatedAt: new Date() })
      .where(and(eq(files.id, fileId), eq(files.userId, userId)));

    return { deleted: true };
  }

  async deleteSharedItem(fileId: string) {
    const [file] = await this.db
      .select({ id: files.id, isPublic: files.isPublic })
      .from(files)
      .where(eq(files.id, fileId));

    if (!file) {
      throw new NotFoundException('Item not found');
    }

    if (!file.isPublic) {
      throw new ForbiddenException(
        'You do not have permission to delete this item',
      );
    }

    // Shared page can delete only public items
    await this.db
      .update(files)
      .set({ deletedAt: new Date(), updatedAt: new Date() })
      .where(eq(files.id, fileId));

    return { deleted: true };
  }

  async getStorageInfo() {
    const { execSync } = require('child_process');
    try {
      // Execute df command to get disk usage
      const output = execSync('df -B1 / | tail -1').toString();
      const parts = output.trim().split(/\s+/);

      // Format: Filesystem 1B-blocks Used Available Use% Mounted
      const totalBytes = parseInt(parts[1], 10);
      const usedBytes = parseInt(parts[2], 10);
      const availableBytes = parseInt(parts[3], 10);
      const usePercent = parseInt(parts[4].replace('%', ''), 10);

      return {
        totalBytes,
        usedBytes,
        availableBytes,
        usePercent,
        totalFormatted: this.formatBytes(totalBytes),
        usedFormatted: this.formatBytes(usedBytes),
        availableFormatted: this.formatBytes(availableBytes),
      };
    } catch (error) {
      return {
        totalBytes: 0,
        usedBytes: 0,
        availableBytes: 0,
        usePercent: 0,
        totalFormatted: '0 B',
        usedFormatted: '0 B',
        availableFormatted: '0 B',
      };
    }
  }

  private formatBytes(bytes: number): string {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
  }

  // ========== STARRED (Favoritos) ==========

  async listStarredFiles(userId: number) {
    return this.db
      .select()
      .from(files)
      .where(
        and(
          eq(files.userId, userId),
          eq(files.isStarred, true),
          isNull(files.deletedAt),
        ),
      )
      .orderBy(desc(files.updatedAt));
  }

  async toggleStarred(userId: number, fileId: string) {
    // Primeiro busca o arquivo para verificar estado atual
    const [file] = await this.db
      .select()
      .from(files)
      .where(and(eq(files.id, fileId), eq(files.userId, userId)));

    if (!file) throw new Error('File not found');

    const newStarredState = !file.isStarred;

    await this.db
      .update(files)
      .set({ isStarred: newStarredState, updatedAt: new Date() })
      .where(and(eq(files.id, fileId), eq(files.userId, userId)));

    return { isStarred: newStarredState };
  }

  // ========== TRASH (Lixeira) ==========

  async listTrash(userId: number) {
    return this.db
      .select()
      .from(files)
      .where(
        and(
          not(isNull(files.deletedAt)),
          or(eq(files.userId, userId), eq(files.isPublic, true)),
        ),
      )
      .orderBy(desc(files.deletedAt));
  }

  async restoreFromTrash(userId: number, fileId: string) {
    const [file] = await this.db
      .select({ id: files.id, userId: files.userId, isPublic: files.isPublic })
      .from(files)
      .where(eq(files.id, fileId));

    if (!file) {
      throw new NotFoundException('File not found');
    }

    // Allow restoring own files OR public shared files
    if (file.userId !== userId && !file.isPublic) {
      throw new ForbiddenException(
        'You do not have permission to restore this item',
      );
    }

    await this.db
      .update(files)
      .set({ deletedAt: null, updatedAt: new Date() })
      .where(eq(files.id, fileId));

    return { restored: true };
  }

  async permanentDelete(userId: number, fileId: string) {
    // Fetch file to get s3Key and validate permissions
    const [file] = await this.db
      .select()
      .from(files)
      .where(eq(files.id, fileId));

    if (!file) {
      throw new NotFoundException('File not found');
    }

    // Allow permanent delete for own files OR public shared files
    if (file.userId !== userId && !file.isPublic) {
      throw new ForbiddenException(
        'You do not have permission to permanently delete this item',
      );
    }

    // If it's a file (not folder), delete from object storage
    if (file.s3Key) {
      await this.storageService.deleteFile(file.s3Key);
    }

    // Delete metadata from database
    await this.db.delete(files).where(eq(files.id, fileId));

    return { deleted: true };
  }

  async emptyTrash(userId: number) {
    const filesToDelete = await this.db
      .select({ id: files.id, s3Key: files.s3Key })
      .from(files)
      .where(and(eq(files.userId, userId), not(isNull(files.deletedAt))));

    if (filesToDelete.length === 0) {
      return { deleted: 0 };
    }

    // Removendo os arquivos do S3
    for (const file of filesToDelete) {
      if (file.s3Key) {
        await this.storageService.deleteFile(file.s3Key);
      }
    }

    // Deletando os registros do banco de dados
    const fileIds = filesToDelete.map((f) => f.id);
    await this.db.delete(files).where(inArray(files.id, fileIds));

    return { deleted: filesToDelete.length };
  }

  // ========== RECENT (Recentes) ==========

  async listRecent(userId: number, limit: number = 50) {
    return this.db
      .select()
      .from(files)
      .where(
        and(
          eq(files.userId, userId),
          eq(files.type, 'file'), // Apenas arquivos, não pastas
          isNull(files.deletedAt),
          sql`${files.updatedAt} >= now() - interval '30 days'`,
        ),
      )
      .orderBy(desc(files.updatedAt))
      .limit(limit);
  }
}
