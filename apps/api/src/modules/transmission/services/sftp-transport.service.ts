import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as SftpClient from 'ssh2-sftp-client';
import * as fs from 'fs/promises';

interface SftpConnectionConfig {
  host: string;
  port: number;
  username: string;
  privateKey: string;
}

@Injectable()
export class SftpTransportService {
  private readonly logger = new Logger(SftpTransportService.name);

  constructor(private readonly configService: ConfigService) {}

  /**
   * Create and connect an SFTP client for a given jurisdiction.
   */
  async connect(jurisdiction: string): Promise<SftpClient> {
    const config = await this.getConnectionConfig(jurisdiction);
    const client = new SftpClient(`cts-sftp-${jurisdiction}`);

    await client.connect({
      host: config.host,
      port: config.port,
      username: config.username,
      privateKey: config.privateKey,
    });

    this.logger.log(
      `SFTP connected to ${config.host}:${config.port} for jurisdiction ${jurisdiction}`,
    );

    return client;
  }

  /**
   * Upload an encrypted package to the destination jurisdiction's CTS outbox.
   * Returns the remote file path.
   */
  async uploadToOutbox(
    jurisdiction: string,
    filename: string,
    data: Buffer,
  ): Promise<string> {
    const jur = jurisdiction.toUpperCase();
    const outboxPath = this.configService.get<string>(
      `CTS_SFTP_${jur}_OUTBOX_PATH`,
      this.configService.get<string>('CTS_SFTP_DEFAULT_OUTBOX_PATH', '/outbox'),
    );
    const remotePath = `${outboxPath}/${filename}`;

    let client: SftpClient | null = null;
    try {
      client = await this.connect(jurisdiction);
      await this.ensureDirectoryExists(client, outboxPath);
      await client.put(data, remotePath);

      this.logger.log(
        `Uploaded package to outbox: ${remotePath} for jurisdiction ${jur}`,
      );

      return remotePath;
    } catch (error) {
      this.logger.error(
        `Failed to upload to outbox for jurisdiction ${jur}: ${remotePath}`,
        error,
      );
      throw error;
    } finally {
      if (client) {
        await client.end().catch((err) => {
          this.logger.warn('Error closing SFTP connection', err);
        });
      }
    }
  }

  /**
   * Download all files from the inbox for a given jurisdiction.
   * Moves processed files to /inbox/processed/ after download.
   */
  async downloadFromInbox(
    jurisdiction: string,
  ): Promise<Array<{ filename: string; data: Buffer }>> {
    const jur = jurisdiction.toUpperCase();
    const inboxPath = this.configService.get<string>(
      `CTS_SFTP_${jur}_INBOX_PATH`,
      this.configService.get<string>('CTS_SFTP_DEFAULT_INBOX_PATH', '/inbox'),
    );
    const processedPath = `${inboxPath}/processed`;

    let client: SftpClient | null = null;
    try {
      client = await this.connect(jurisdiction);
      await this.ensureDirectoryExists(client, processedPath);

      const listing = await client.list(inboxPath);
      const files = listing.filter((entry) => entry.type === '-');

      const results: Array<{ filename: string; data: Buffer }> = [];

      for (const file of files) {
        const remotePath = `${inboxPath}/${file.name}`;
        try {
          const data = (await client.get(remotePath)) as Buffer;
          results.push({ filename: file.name, data });

          // Move to processed directory
          const destPath = `${processedPath}/${file.name}`;
          await client.rename(remotePath, destPath);

          this.logger.debug(
            `Downloaded and moved to processed: ${file.name}`,
          );
        } catch (fileError) {
          this.logger.error(
            `Failed to download file ${file.name} from inbox`,
            fileError,
          );
          // Continue processing remaining files
        }
      }

      this.logger.log(
        `Downloaded ${results.length} files from inbox for jurisdiction ${jur}`,
      );

      return results;
    } catch (error) {
      this.logger.error(
        `Failed to download from inbox for jurisdiction ${jur}`,
        error,
      );
      throw error;
    } finally {
      if (client) {
        await client.end().catch((err) => {
          this.logger.warn('Error closing SFTP connection', err);
        });
      }
    }
  }

  /**
   * Upload a status message (ACK/NACK) to the source jurisdiction's CTS status outbox.
   * Returns the remote file path.
   */
  async uploadStatusMessage(
    jurisdiction: string,
    filename: string,
    data: Buffer,
  ): Promise<string> {
    const jur = jurisdiction.toUpperCase();
    const statusOutboxPath = this.configService.get<string>(
      `CTS_SFTP_${jur}_STATUS_OUTBOX_PATH`,
      this.configService.get<string>(
        'CTS_SFTP_DEFAULT_STATUS_OUTBOX_PATH',
        '/status/outbox',
      ),
    );
    const remotePath = `${statusOutboxPath}/${filename}`;

    let client: SftpClient | null = null;
    try {
      client = await this.connect(jurisdiction);
      await this.ensureDirectoryExists(client, statusOutboxPath);
      await client.put(data, remotePath);

      this.logger.log(
        `Uploaded status message to ${remotePath} for jurisdiction ${jur}`,
      );

      return remotePath;
    } catch (error) {
      this.logger.error(
        `Failed to upload status message for jurisdiction ${jur}: ${remotePath}`,
        error,
      );
      throw error;
    } finally {
      if (client) {
        await client.end().catch((err) => {
          this.logger.warn('Error closing SFTP connection', err);
        });
      }
    }
  }

  /**
   * Resolve SFTP connection configuration for a jurisdiction.
   * Jurisdiction-specific env vars take precedence over defaults.
   */
  private async getConnectionConfig(
    jurisdiction: string,
  ): Promise<SftpConnectionConfig> {
    const jur = jurisdiction.toUpperCase();

    const host = this.configService.get<string>(
      `CTS_SFTP_${jur}_HOST`,
      this.configService.get<string>('CTS_SFTP_DEFAULT_HOST', ''),
    );

    const port = this.configService.get<number>(
      `CTS_SFTP_${jur}_PORT`,
      this.configService.get<number>('CTS_SFTP_DEFAULT_PORT', 22),
    );

    const username = this.configService.get<string>(
      `CTS_SFTP_${jur}_USER`,
      this.configService.get<string>('CTS_SFTP_DEFAULT_USER', ''),
    );

    const keyPath = this.configService.get<string>(
      `CTS_SFTP_${jur}_KEY_PATH`,
      this.configService.get<string>('CTS_SFTP_DEFAULT_KEY_PATH', ''),
    );

    if (!host) {
      throw new Error(
        `SFTP host not configured for jurisdiction ${jur}. Set CTS_SFTP_${jur}_HOST or CTS_SFTP_DEFAULT_HOST.`,
      );
    }

    if (!keyPath) {
      throw new Error(
        `SFTP key path not configured for jurisdiction ${jur}. Set CTS_SFTP_${jur}_KEY_PATH or CTS_SFTP_DEFAULT_KEY_PATH.`,
      );
    }

    const privateKey = await fs.readFile(keyPath, 'utf-8');

    return { host, port, username, privateKey };
  }

  /**
   * Ensure a remote directory exists, creating it if necessary.
   */
  private async ensureDirectoryExists(
    client: SftpClient,
    dirPath: string,
  ): Promise<void> {
    try {
      await client.mkdir(dirPath, true);
    } catch {
      // Directory may already exist; ignore
    }
  }
}
