import {
  PipeTransform,
  Injectable,
  BadRequestException,
  ArgumentMetadata,
} from '@nestjs/common';
import { ZodSchema, ZodError } from 'zod';

/**
 * Generic NestJS pipe that validates the incoming body (or param / query)
 * against a Zod schema.
 *
 * Usage — at the controller level:
 *
 *   @Post()
 *   create(@Body(new ZodValidationPipe(CreateFilingSchema)) body: CreateFiling) { ... }
 *
 * Or applied globally in main.ts for DTOs that carry a static `schema` property.
 */
@Injectable()
export class ZodValidationPipe implements PipeTransform {
  constructor(private readonly schema?: ZodSchema) {}

  transform(value: unknown, metadata: ArgumentMetadata): unknown {
    // If a schema was supplied in the constructor, use it directly
    const schema = this.schema ?? this.resolveSchema(metadata);

    if (!schema) {
      // No schema to validate against — pass through
      return value;
    }

    const result = schema.safeParse(value);

    if (!result.success) {
      const formatted = this.formatErrors(result.error);
      throw new BadRequestException({
        message: 'Validation failed',
        errors: formatted,
      });
    }

    return result.data;
  }

  /**
   * Attempt to read a static `schema` property from the metatype (DTO class).
   * This enables a convention-based approach where each DTO exports its own
   * Zod schema:
   *
   *   export class CreateFilingDto {
   *     static schema = CreateFilingSchema;
   *     ...
   *   }
   */
  private resolveSchema(metadata: ArgumentMetadata): ZodSchema | undefined {
    const metatype = metadata.metatype as any;
    if (metatype && typeof metatype.schema !== 'undefined') {
      return metatype.schema as ZodSchema;
    }
    return undefined;
  }

  private formatErrors(error: ZodError): Record<string, string[]> {
    const fieldErrors: Record<string, string[]> = {};

    for (const issue of error.issues) {
      const path = issue.path.length > 0 ? issue.path.join('.') : '_root';
      if (!fieldErrors[path]) {
        fieldErrors[path] = [];
      }
      fieldErrors[path].push(issue.message);
    }

    return fieldErrors;
  }
}
