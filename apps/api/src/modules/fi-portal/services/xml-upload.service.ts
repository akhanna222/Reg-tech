import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import * as crypto from 'crypto';
import { FilingDocument } from '../../database/entities/filing-document.entity';
import { Filing } from '../../database/entities/filing.entity';
import { RawStorageService } from '../../storage/raw-storage.service';

export interface UploadedFile {
  buffer: Buffer;
  originalname: string;
  mimetype: string;
  size: number;
}

@Injectable()
export class XmlUploadService {
  private readonly logger = new Logger(XmlUploadService.name);

  constructor(
    @InjectRepository(FilingDocument)
    private readonly filingDocumentRepository: Repository<FilingDocument>,
    @InjectRepository(Filing)
    private readonly filingRepository: Repository<Filing>,
    private readonly rawStorageService: RawStorageService,
  ) {}

  async uploadXml(
    file: UploadedFile,
    filingId: string,
    userId: string,
  ): Promise<FilingDocument> {
    // Verify the filing exists
    const filing = await this.filingRepository.findOne({
      where: { id: filingId },
    });
    if (!filing) {
      throw new NotFoundException(`Filing not found: ${filingId}`);
    }

    // Compute SHA-256 hash of the file content
    const fileHash = crypto
      .createHash('sha256')
      .update(file.buffer)
      .digest('hex');

    // Build the storage key: {orgId}/{filingId}/{timestamp}-{originalname}
    const timestamp = Date.now();
    const storageKey = `${filing.organizationId}/${filingId}/${timestamp}-${file.originalname}`;

    // Upload to MinIO via storage service
    await this.rawStorageService.upload(storageKey, file.buffer, file.mimetype);

    // Create the FilingDocument record
    const document = this.filingDocumentRepository.create({
      filingId,
      storageKey,
      fileHash,
      fileSize: String(file.size),
      contentType: file.mimetype,
      uploadedBy: userId,
    });

    const saved = await this.filingDocumentRepository.save(document);

    this.logger.log(
      `XML uploaded: doc=${saved.id}, filing=${filingId}, hash=${fileHash}, size=${file.size}`,
    );

    return saved;
  }
}
