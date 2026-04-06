import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as fs from 'fs/promises';
import * as path from 'path';

@Injectable()
export class KeyManagementService implements OnModuleInit {
  private readonly logger = new Logger(KeyManagementService.name);
  private readonly keyBasePath: string;
  private readonly keyCache = new Map<string, string>();

  constructor(private readonly configService: ConfigService) {
    this.keyBasePath = this.configService.get<string>(
      'CRYPTO_KEY_PATH',
      '/etc/reg-tech/keys',
    );
  }

  async onModuleInit(): Promise<void> {
    this.logger.log(`Key management initialized with base path: ${this.keyBasePath}`);
  }

  /**
   * Load the public key for a given jurisdiction.
   * Keys are expected at: {basePath}/{jurisdiction}/public.pem
   */
  async loadPublicKey(jurisdiction: string): Promise<string> {
    const cacheKey = `pub:${jurisdiction}`;
    const cached = this.keyCache.get(cacheKey);
    if (cached) {
      return cached;
    }

    const keyPath = path.join(this.keyBasePath, jurisdiction.toUpperCase(), 'public.pem');
    try {
      const key = await fs.readFile(keyPath, 'utf-8');
      this.keyCache.set(cacheKey, key);
      this.logger.debug(`Loaded public key for jurisdiction: ${jurisdiction}`);
      return key;
    } catch (error) {
      this.logger.error(`Failed to load public key for jurisdiction ${jurisdiction} at ${keyPath}`, error);
      throw new Error(`Public key not available for jurisdiction: ${jurisdiction}`);
    }
  }

  /**
   * Load the private key for a given jurisdiction (our signing/decryption key).
   * Keys are expected at: {basePath}/{jurisdiction}/private.pem
   */
  async loadPrivateKey(jurisdiction: string): Promise<string> {
    const cacheKey = `priv:${jurisdiction}`;
    const cached = this.keyCache.get(cacheKey);
    if (cached) {
      return cached;
    }

    const keyPath = path.join(this.keyBasePath, jurisdiction.toUpperCase(), 'private.pem');
    try {
      const key = await fs.readFile(keyPath, 'utf-8');
      this.keyCache.set(cacheKey, key);
      this.logger.debug(`Loaded private key for jurisdiction: ${jurisdiction}`);
      return key;
    } catch (error) {
      this.logger.error(`Failed to load private key for jurisdiction ${jurisdiction} at ${keyPath}`, error);
      throw new Error(`Private key not available for jurisdiction: ${jurisdiction}`);
    }
  }

  /**
   * Load the certificate for a given jurisdiction.
   * Certificates are expected at: {basePath}/{jurisdiction}/cert.pem
   */
  async loadCertificate(jurisdiction: string): Promise<string> {
    const cacheKey = `cert:${jurisdiction}`;
    const cached = this.keyCache.get(cacheKey);
    if (cached) {
      return cached;
    }

    const keyPath = path.join(this.keyBasePath, jurisdiction.toUpperCase(), 'cert.pem');
    try {
      const cert = await fs.readFile(keyPath, 'utf-8');
      this.keyCache.set(cacheKey, cert);
      this.logger.debug(`Loaded certificate for jurisdiction: ${jurisdiction}`);
      return cert;
    } catch (error) {
      this.logger.error(`Failed to load certificate for jurisdiction ${jurisdiction} at ${keyPath}`, error);
      throw new Error(`Certificate not available for jurisdiction: ${jurisdiction}`);
    }
  }

  /**
   * Clear the key cache (e.g., after key rotation).
   */
  clearCache(): void {
    this.keyCache.clear();
    this.logger.log('Key cache cleared');
  }
}
