import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import * as Joi from 'joi';
import { databaseConfig } from './config/database.config';
import { HealthModule } from './modules/health/health.module';
import { AuthModule } from './modules/auth/auth.module';
import { FiPortalModule } from './modules/fi-portal/fi-portal.module';
import { ValidationModule } from './modules/validation/validation.module';
import { TaxAuthorityModule } from './modules/tax-authority/tax-authority.module';
import { AnalyticsModule } from './modules/analytics/analytics.module';
import { TransmissionModule } from './modules/transmission/transmission.module';
import { StorageModule } from './modules/storage/storage.module';
import { CryptoModule } from './modules/crypto/crypto.module';
import { EventStoreModule } from './modules/event-store/event-store.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: ['.env', '../../.env'],
      validationSchema: Joi.object({
        NODE_ENV: Joi.string()
          .valid('development', 'production', 'test')
          .default('development'),
        PORT: Joi.number().default(3000),
        DATABASE_URL: Joi.string().required(),
        REDIS_URL: Joi.string().required(),
        MINIO_ENDPOINT: Joi.string().required(),
        MINIO_PORT: Joi.number().default(9000),
        MINIO_ACCESS_KEY: Joi.string().optional(),
        MINIO_SECRET_KEY: Joi.string().optional(),
        MINIO_USE_SSL: Joi.boolean().default(false),
        JWT_SECRET: Joi.string().required(),
        JWT_EXPIRATION: Joi.string().default('1h'),
        CORS_ORIGINS: Joi.string().optional(),
      }),
    }),
    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: databaseConfig,
    }),
    HealthModule,
    AuthModule,
    FiPortalModule,
    ValidationModule,
    TaxAuthorityModule,
    AnalyticsModule,
    TransmissionModule,
    StorageModule,
    EventStoreModule,
  ],
})
export class AppModule {}
