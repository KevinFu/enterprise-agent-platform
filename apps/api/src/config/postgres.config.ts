import { registerAs } from '@nestjs/config';

export interface PostgresConfig {
  type: 'postgres';
  host: string;
  port: number;
  username: string;
  password: string;
  database: string;
}

export default registerAs('postgres', (): PostgresConfig => ({
  type: 'postgres',
  host: process.env.POSTGRES_HOST || 'postgres',
  port: Number(process.env.POSTGRES_PORT) || 5432,
  username: process.env.POSTGRES_USER || 'postgres',
  password: process.env.POSTGRES_PASSWORD || '123456',
  database: process.env.POSTGRES_DB || 'knowledge_hub',
}));
