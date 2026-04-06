import {
  ExceptionFilter,
  Catch,
  ArgumentsHost,
  HttpException,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import { Request, Response } from 'express';

interface ErrorResponseBody {
  statusCode: number;
  message: string;
  error: string;
  correlationId?: string;
  timestamp: string;
  path: string;
  /** Field-level validation errors, when present */
  errors?: Record<string, string[]>;
}

/**
 * Global exception filter that normalises every error response into a
 * consistent JSON shape and ensures that unhandled / unexpected errors never
 * leak stack traces or internal details to the client.
 */
@Catch()
export class GlobalExceptionFilter implements ExceptionFilter {
  private readonly logger = new Logger(GlobalExceptionFilter.name);

  catch(exception: unknown, host: ArgumentsHost): void {
    const ctx = host.switchToHttp();
    const request = ctx.getRequest<Request>();
    const response = ctx.getResponse<Response>();

    const correlationId = (request as any).correlationId as string | undefined;

    let status: number;
    let message: string;
    let error: string;
    let validationErrors: Record<string, string[]> | undefined;

    if (exception instanceof HttpException) {
      status = exception.getStatus();
      const exceptionResponse = exception.getResponse();

      if (typeof exceptionResponse === 'string') {
        message = exceptionResponse;
        error = HttpStatus[status] ?? 'Error';
      } else {
        const res = exceptionResponse as Record<string, any>;
        message = res.message ?? exception.message;
        error = res.error ?? HttpStatus[status] ?? 'Error';
        validationErrors = res.errors;
      }
    } else {
      // Unexpected / unhandled errors — never leak details
      status = HttpStatus.INTERNAL_SERVER_ERROR;
      message = 'An unexpected error occurred';
      error = 'Internal Server Error';

      // Log the full error for operators
      this.logger.error(
        `Unhandled exception on ${request.method} ${request.url}`,
        exception instanceof Error ? exception.stack : String(exception),
      );
    }

    const body: ErrorResponseBody = {
      statusCode: status,
      message,
      error,
      timestamp: new Date().toISOString(),
      path: request.url,
    };

    if (correlationId) {
      body.correlationId = correlationId;
    }

    if (validationErrors) {
      body.errors = validationErrors;
    }

    response.status(status).json(body);
  }
}
