import type { OnModuleDestroy } from '@nestjs/common';
import { Inject, Injectable, ServiceUnavailableException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import type { PoolClient, QueryResultRow } from 'pg';
import { Pool } from 'pg';
import type { AuthenticatedUser } from '../auth/auth.types';
import type { UserRole } from '@dahamiz/shared-types';

@Injectable()
export class DatabaseService implements OnModuleDestroy {
  private readonly pool: Pool | undefined;

  constructor(@Inject(ConfigService) config: ConfigService) {
    const connectionString = config.get<string>('DATABASE_URL');
    if (connectionString) {
      this.pool = new Pool({
        connectionString,
        ssl:
          config.get<string>('DATABASE_SSL') === 'true' ? { rejectUnauthorized: true } : undefined,
        max: 10,
        connectionTimeoutMillis: 3_000,
        idleTimeoutMillis: 30_000,
      });
    }
  }

  async query<T extends QueryResultRow>(text: string, values: readonly unknown[] = []) {
    if (!this.pool) throw new ServiceUnavailableException('Database is not configured.');
    return this.pool.query<T>(text, [...values]);
  }

  async transaction<T>(operation: (client: PoolClient) => Promise<T>): Promise<T> {
    if (!this.pool) throw new ServiceUnavailableException('Database is not configured.');
    const client = await this.pool.connect();
    try {
      await client.query('BEGIN');
      const result = await operation(client);
      await client.query('COMMIT');
      return result;
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  }

  async upsertUser(input: {
    uid: string;
    email?: string;
    displayName?: string;
  }): Promise<AuthenticatedUser> {
    const result = await this.query<{
      firebase_uid: string;
      email: string | null;
      display_name: string | null;
      role: UserRole;
    }>(
      `INSERT INTO users (firebase_uid, email, display_name)
       VALUES ($1, $2, $3)
       ON CONFLICT (firebase_uid) DO UPDATE SET
         email = COALESCE(EXCLUDED.email, users.email),
         display_name = COALESCE(EXCLUDED.display_name, users.display_name),
         updated_at = NOW()
       RETURNING firebase_uid, email, display_name, role`,
      [input.uid, input.email ?? null, input.displayName ?? null],
    );
    const row = result.rows[0];
    if (!row) throw new ServiceUnavailableException('User profile could not be loaded.');
    return {
      uid: row.firebase_uid,
      ...(row.email ? { email: row.email } : {}),
      ...(row.display_name ? { displayName: row.display_name } : {}),
      role: row.role,
    };
  }

  async onModuleDestroy(): Promise<void> {
    await this.pool?.end();
  }
}
