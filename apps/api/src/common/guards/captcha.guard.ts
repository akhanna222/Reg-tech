import {
  Injectable,
  CanActivate,
  ExecutionContext,
  BadRequestException,
  Logger,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class CaptchaGuard implements CanActivate {
  private readonly logger = new Logger(CaptchaGuard.name);

  constructor(private readonly configService: ConfigService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    const captchaToken = request.headers['x-captcha-token'] as string;

    if (!captchaToken) {
      throw new BadRequestException('CAPTCHA token is required');
    }

    const secretKey = this.configService.get<string>('CAPTCHA_SECRET_KEY');
    if (!secretKey) {
      this.logger.warn('CAPTCHA_SECRET_KEY not configured; skipping verification');
      return true;
    }

    const verifyUrl = this.configService.get<string>(
      'CAPTCHA_VERIFY_URL',
      'https://www.google.com/recaptcha/api/siteverify',
    );

    try {
      const params = new URLSearchParams({
        secret: secretKey,
        response: captchaToken,
      });

      const response = await fetch(`${verifyUrl}?${params.toString()}`, {
        method: 'POST',
      });

      const result = (await response.json()) as { success: boolean; score?: number };

      if (!result.success) {
        throw new BadRequestException('CAPTCHA verification failed');
      }

      // For reCAPTCHA v3, enforce a minimum score
      if (result.score !== undefined && result.score < 0.5) {
        throw new BadRequestException('CAPTCHA score too low');
      }

      return true;
    } catch (error) {
      if (error instanceof BadRequestException) {
        throw error;
      }
      this.logger.error('CAPTCHA verification error', error);
      throw new BadRequestException('CAPTCHA verification failed');
    }
  }
}
