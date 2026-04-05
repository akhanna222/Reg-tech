import { Injectable, Logger } from '@nestjs/common';
import * as path from 'path';
import * as fs from 'fs/promises';

export interface XsdValidationError {
  line: number | null;
  column: number | null;
  message: string;
}

export interface XsdValidationResult {
  valid: boolean;
  errors: XsdValidationError[];
  schemaType: string;
}

@Injectable()
export class XsdValidatorService {
  private readonly logger = new Logger(XsdValidatorService.name);
  private readonly schemasDir = path.join(process.cwd(), 'schemas');
  private readonly schemaCache = new Map<string, string>();

  /**
   * Validate XML content against the appropriate XSD schema.
   * Uses libxmljs2 for W3C XML Schema validation.
   */
  async validateXsd(
    xmlContent: string,
    schemaType: 'CRS' | 'FATCA',
  ): Promise<XsdValidationResult> {
    const errors: XsdValidationError[] = [];

    try {
      // Dynamic import of libxmljs2 (native module)
      const libxmljs = await import('libxmljs2');

      const schemaContent = await this.loadSchema(schemaType);
      const xsdDoc = libxmljs.parseXml(schemaContent);
      const xmlDoc = libxmljs.parseXml(xmlContent);

      const isValid = xmlDoc.validate(xsdDoc);

      if (!isValid) {
        const validationErrors = xmlDoc.validationErrors || [];
        for (const err of validationErrors) {
          errors.push({
            line: (err as any).line ?? null,
            column: (err as any).column ?? null,
            message: String(err),
          });
        }
      }

      this.logger.debug(
        `XSD validation for ${schemaType}: valid=${isValid}, errors=${errors.length}`,
      );

      return { valid: isValid, errors, schemaType };
    } catch (error) {
      this.logger.error(`XSD validation failed for schema ${schemaType}`, error);
      errors.push({
        line: null,
        column: null,
        message: `XSD validation engine error: ${(error as Error).message}`,
      });
      return { valid: false, errors, schemaType };
    }
  }

  private async loadSchema(schemaType: 'CRS' | 'FATCA'): Promise<string> {
    if (this.schemaCache.has(schemaType)) {
      return this.schemaCache.get(schemaType)!;
    }

    const schemaFileName =
      schemaType === 'CRS' ? 'CrsXML_v2.0.xsd' : 'FatcaXML_v2.0.xsd';
    const schemaPath = path.join(this.schemasDir, schemaFileName);

    const content = await fs.readFile(schemaPath, 'utf-8');
    this.schemaCache.set(schemaType, content);

    return content;
  }
}
