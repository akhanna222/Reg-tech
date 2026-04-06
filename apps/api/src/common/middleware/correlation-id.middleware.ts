import { Injectable, NestMiddleware } from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';
import { randomUUID } from 'crypto';

const CORRELATION_HEADER = 'x-correlation-id';

@Injectable()
export class CorrelationIdMiddleware implements NestMiddleware {
  use(req: Request, res: Response, next: NextFunction): void {
    const incoming = req.headers[CORRELATION_HEADER] as string | undefined;
    const correlationId = incoming ?? randomUUID();

    // Attach to the request object so downstream handlers can read it
    (req as any).correlationId = correlationId;

    // Echo back in the response header
    res.setHeader(CORRELATION_HEADER, correlationId);

    next();
  }
}
