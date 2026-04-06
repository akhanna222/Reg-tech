import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { DataSource } from 'typeorm';
import { AppModule } from '../../src/app.module';

export interface TestApp {
  app: INestApplication;
  module: TestingModule;
  dataSource: DataSource;
  configService: ConfigService;
}

/**
 * Bootstrap a full NestJS application for integration/e2e testing.
 *
 * When DATABASE_URL is set in the environment it is used directly (useful for
 * CI with a dedicated test Postgres instance).  Otherwise the TypeORM root
 * module is overridden to use an SQLite in-memory database so tests can run
 * without any external dependencies.
 */
export async function createTestApp(): Promise<TestApp> {
  const useSqlite = !process.env.DATABASE_URL;

  const moduleBuilder = Test.createTestingModule({
    imports: [AppModule],
  });

  if (useSqlite) {
    // Override the TypeORM root connection with a lightweight SQLite in-memory
    // database.  `autoLoadEntities` ensures every entity registered via
    // `TypeOrmModule.forFeature()` in sub-modules is picked up automatically.
    moduleBuilder.overrideModule(TypeOrmModule).useModule(
      TypeOrmModule.forRoot({
        type: 'better-sqlite3',
        database: ':memory:',
        autoLoadEntities: true,
        synchronize: true,
        dropSchema: true,
      }),
    );
  }

  // Relax the Joi validation schema so optional external services (Redis,
  // MinIO) do not block test bootstrap.
  moduleBuilder.overrideProvider(ConfigService).useFactory({
    factory: () => {
      const defaults: Record<string, string | number | boolean> = {
        NODE_ENV: 'test',
        PORT: 3333,
        DATABASE_URL: process.env.DATABASE_URL ?? 'sqlite://:memory:',
        REDIS_URL: process.env.REDIS_URL ?? 'redis://localhost:6379',
        MINIO_ENDPOINT: process.env.MINIO_ENDPOINT ?? 'localhost',
        MINIO_PORT: 9000,
        MINIO_ACCESS_KEY: 'minioadmin',
        MINIO_SECRET_KEY: 'minioadmin',
        MINIO_USE_SSL: false,
        JWT_SECRET: 'test-jwt-secret-for-e2e-tests',
        JWT_REFRESH_SECRET: 'test-jwt-refresh-secret-for-e2e-tests',
        JWT_EXPIRATION: '15m',
        CORS_ORIGINS: '*',
      };

      return {
        get: <T = string>(key: string): T | undefined =>
          (process.env[key] ?? defaults[key]) as unknown as T | undefined,
        getOrThrow: <T = string>(key: string): T => {
          const val = process.env[key] ?? defaults[key];
          if (val === undefined) {
            throw new Error(`Missing config key: ${key}`);
          }
          return val as unknown as T;
        },
      };
    },
  });

  const module = await moduleBuilder.compile();

  const app = module.createNestApplication();

  // Mirror the production pipeline setup
  app.setGlobalPrefix('api');
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
      transformOptions: { enableImplicitConversion: true },
    }),
  );

  await app.init();

  const dataSource = module.get(DataSource);
  const configService = module.get(ConfigService);

  return { app, module, dataSource, configService };
}

/**
 * Gracefully tear down the test application and its database connections.
 */
export async function closeTestApp(testApp: TestApp): Promise<void> {
  if (testApp.dataSource?.isInitialized) {
    await testApp.dataSource.destroy();
  }
  await testApp.app.close();
}
