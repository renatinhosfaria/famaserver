import { Module } from '@nestjs/common';
import { DatabaseModule } from '../database/database.module';
import { StorageModule } from '../storage/storage.module';
import { FilesController } from './files.controller';
import { FilesService } from './files.service';

import { QueueModule } from '../queue/queue.module';
import { PublicShareController } from './public-share.controller';

@Module({
  imports: [StorageModule, DatabaseModule, QueueModule],
  controllers: [FilesController, PublicShareController],
  providers: [FilesService],
})
export class FilesModule {}
