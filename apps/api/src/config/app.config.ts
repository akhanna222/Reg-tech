import * as Joi from 'joi';

export const appValidationSchema = Joi.object({
  NODE_ENV: Joi.string()
    .valid('development', 'production', 'test')
    .default('development'),
  PORT: Joi.number().default(3000),

  // Database
  DATABASE_URL: Joi.string().uri().required().description('PostgreSQL connection URL'),

  // Redis
  REDIS_URL: Joi.string().uri().required().description('Redis connection URL'),

  // MinIO / Object Storage
  MINIO_ENDPOINT: Joi.string().required().description('MinIO server hostname'),
  MINIO_PORT: Joi.number().default(9000).description('MinIO server port'),
  MINIO_ACCESS_KEY: Joi.string().optional().description('MinIO access key'),
  MINIO_SECRET_KEY: Joi.string().optional().description('MinIO secret key'),
  MINIO_USE_SSL: Joi.boolean().default(false).description('Use SSL for MinIO'),

  // JWT / Authentication
  JWT_SECRET: Joi.string().min(16).required().description('JWT signing secret'),
  JWT_EXPIRATION: Joi.string().default('1h').description('JWT token expiration'),

  // CORS
  CORS_ORIGINS: Joi.string().optional().description('Comma-separated allowed CORS origins'),
});
