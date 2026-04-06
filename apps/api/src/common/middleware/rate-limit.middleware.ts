import {
  Injectable,
  NestMiddleware,
  HttpException,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';

interface RateLimitEntry {
  count: number;
  resetAt: number;
}

/**
 * Simple in-memory sliding-window rate limiter.
 *
 * For production deployments behind multiple API replicas, replace the
 * in-memory store with a Redis-backed implementation (e.g. ioredis +
 * a sliding window Lua script) so that limits are shared across instances.
 */
@Injectable()
export class RateLimitMiddleware implements NestMiddleware {
  private readonly logger = new Logger(RateLimitMiddleware.name);

  /** Maximum requests allowed within the window */
  private readonly maxRequests: number;
  /** Window size in milliseconds */
  private readonly windowMs: number;
  /** In-memory store keyed by client IP */
  private readonly store = new Map<string, RateLimitEntry>();

  constructor() {
    this.maxRequests = parseInt(process.env.RATE_LIMIT_MAX ?? '100', 10);
    this.windowMs = parseInt(process.env.RATE_LIMIT_WINDOW_MS ?? '60000', 10);
  }

  use(req: Request, res: Response, next: NextFunction): void {
    const clientIp =
      (req.headers['x-forwarded-for'] as string)?.split(',')[0]?.trim() ??
      req.ip ??
      'unknown';

    const now = Date.now();
    let entry = this.store.get(clientIp);

    if (!entry || now >= entry.resetAt) {
      entry = { count: 0, resetAt: now + this.windowMs };
      this.store.set(clientIp, entry);
    }

    entry.count += 1;

    // Set standard rate-limit response headers
    const remaining = Math.max(0, this.maxRequests - entry.count);
    res.setHeader('X-RateLimit-Limit', this.maxRequests);
    res.setHeader('X-RateLimit-Remaining', remaining);
    res.setHeader('X-RateLimit-Reset', Math.ceil(entry.resetAt / 1000));

    if (entry.count > this.maxRequests) {
      this.logger.warn(
        `Rate limit exceeded for ${clientIp} — ${entry.count}/${this.maxRequests}`,
      );
      throw new HttpException(
        {
          statusCode: HttpStatus.TOO_MANY_REQUESTS,
          message: 'Too many requests. Please try again later.',
          retryAfterMs: entry.resetAt - now,
        },
        HttpStatus.TOO_MANY_REQUESTS,
      );
    }

    next();
  }
}
