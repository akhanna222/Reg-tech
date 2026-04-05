import { Module } from '@nestjs/common';
import { EncryptionService } from './encryption.service';
import { SigningService } from './signing.service';
import { KeyManagementService } from './key-management.service';

@Module({
  providers: [EncryptionService, SigningService, KeyManagementService],
  exports: [EncryptionService, SigningService, KeyManagementService],
})
export class CryptoModule {}
