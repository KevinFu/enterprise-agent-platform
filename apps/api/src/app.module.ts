import { Module } from '@nestjs/common';
import { ConfigService, ConfigModule } from '@nestjs/config';
import * as path from 'path';
import postgresConfig, { PostgresConfig } from './config/postgres.config';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { HealthModule } from './health/health.module';
import { DocumentsController } from './documents/documents.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { HealthController } from './health/health.controller';

@Module({
  imports: [
    HealthModule,
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: path.resolve(__dirname, '../../../.env'),
      load: [postgresConfig],
    }),
    TypeOrmModule.forRootAsync({
      inject: [ConfigService],
      useFactory: (config: ConfigService) => {
        const postgres = config.get<PostgresConfig>('postgres');
        if (!postgres) {
          throw new Error('Postgres config not found');
        }
        return {
          type: 'postgres' as const,
          host: postgres.host,
          port: postgres.port || 5432,
          username: postgres.username,
          password: postgres.password,
          database: postgres.database,
          autoLoadEntities: true,
          synchronize: false,
        };
      },
    }),
  ],
  controllers: [AppController, HealthController, DocumentsController],
  providers: [AppService],
})
export class AppModule {}
