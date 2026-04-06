import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Filing } from '../database/entities/filing.entity';
import { RawStorageService } from './raw-storage.service';
import { ProcessedStorageService } from './processed-storage.service';

@Module({
  imports: [TypeOrmModule.forFeature([Filing])],
  providers: [RawStorageService, ProcessedStorageService],
  exports: [RawStorageService, ProcessedStorageService],
})
export class StorageModule {}
