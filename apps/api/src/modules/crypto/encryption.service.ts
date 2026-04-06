import { Injectable, Logger } from '@nestjs/common';
import * as crypto from 'crypto';

@Injectable()
export class EncryptionService {
  private readonly logger = new Logger(EncryptionService.name);

  /**
   * Encrypt data for a target jurisdiction using their public key.
   * Uses RSA-OAEP with AES-256-CBC hybrid encryption (PKCS#7 compatible).
   */
  encryptForJurisdiction(data: Buffer, jurisdictionPublicKey: string): Buffer {
    // Generate a random AES-256 key and IV for symmetric encryption
    const aesKey = crypto.randomBytes(32);
    const iv = crypto.randomBytes(16);

    // Encrypt the data with AES-256-CBC
    const cipher = crypto.createCipheriv('aes-256-cbc', aesKey, iv);
    const encryptedData = Buffer.concat([cipher.update(data), cipher.final()]);

    // Encrypt the AES key with RSA public key
    const encryptedKey = crypto.publicEncrypt(
      {
        key: jurisdictionPublicKey,
        padding: crypto.constants.RSA_PKCS1_OAEP_PADDING,
        oaepHash: 'sha256',
      },
      aesKey,
    );

    // Package: [encryptedKeyLength (4 bytes)][encryptedKey][iv (16 bytes)][encryptedData]
    const keyLengthBuffer = Buffer.alloc(4);
    keyLengthBuffer.writeUInt32BE(encryptedKey.length, 0);

    this.logger.debug('Data encrypted successfully for jurisdiction');

    return Buffer.concat([keyLengthBuffer, encryptedKey, iv, encryptedData]);
  }

  /**
   * Decrypt data received from a jurisdiction using our private key.
   */
  decryptFromJurisdiction(encryptedPackage: Buffer, privateKey: string): Buffer {
    // Parse the package
    const keyLength = encryptedPackage.readUInt32BE(0);
    const encryptedKey = encryptedPackage.subarray(4, 4 + keyLength);
    const iv = encryptedPackage.subarray(4 + keyLength, 4 + keyLength + 16);
    const encryptedData = encryptedPackage.subarray(4 + keyLength + 16);

    // Decrypt the AES key with RSA private key
    const aesKey = crypto.privateDecrypt(
      {
        key: privateKey,
        padding: crypto.constants.RSA_PKCS1_OAEP_PADDING,
        oaepHash: 'sha256',
      },
      encryptedKey,
    );

    // Decrypt the data with AES-256-CBC
    const decipher = crypto.createDecipheriv('aes-256-cbc', aesKey, iv);
    const decryptedData = Buffer.concat([decipher.update(encryptedData), decipher.final()]);

    this.logger.debug('Data decrypted successfully from jurisdiction');

    return decryptedData;
  }
}
