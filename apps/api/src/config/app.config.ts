import { registerAs } from '@nestjs/config';

export interface AppConfig {
  nodeEnv: string;
  port: number;
  apiPrefix: string;
  corsOrigins: string[];
}

/**
 * Application configuration factory.
 * All environment variables are read here — never read process.env directly in business logic.
 */
export const appConfig = registerAs('app', (): AppConfig => {
  const port = parseInt(process.env['PORT'] ?? '3001', 10);
  if (isNaN(port) || port < 1 || port > 65535) {
    throw new Error(`Invalid PORT environment variable: ${process.env['PORT']}`);
  }

  return {
    nodeEnv: process.env['NODE_ENV'] ?? 'development',
    port,
    apiPrefix: process.env['API_PREFIX'] ?? 'api/v1',
    corsOrigins: (process.env['CORS_ORIGINS'] ?? 'http://localhost:8081')
      .split(',')
      .map((o) => o.trim())
      .filter(Boolean),
  };
});
