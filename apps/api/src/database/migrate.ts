import 'reflect-metadata';
import { ConfigModule } from '@nestjs/config';
import { Client } from 'pg';
import { readdir, readFile } from 'node:fs/promises';
import { join } from 'node:path';

ConfigModule.forRoot({ envFilePath: ['.env.local', '.env'] });

async function migrate(): Promise<void> {
  const connectionString = process.env['DATABASE_URL'];
  if (!connectionString) throw new Error('DATABASE_URL must be set to run migrations.');
  const client = new Client({ connectionString });
  await client.connect();
  try {
    await client.query('SELECT pg_advisory_lock(78124401)');
    await client.query(
      'CREATE TABLE IF NOT EXISTS schema_migrations (name TEXT PRIMARY KEY, applied_at TIMESTAMPTZ NOT NULL DEFAULT NOW())',
    );
    const migrationsPath = join(__dirname, 'migrations');
    const migrations = (await readdir(migrationsPath))
      .filter((name) => /^\d+_.+\.sql$/.test(name))
      .sort();
    for (const name of migrations) {
      const found = await client.query('SELECT 1 FROM schema_migrations WHERE name = $1', [name]);
      if (found.rowCount !== 0) continue;
      const sql = await readFile(join(migrationsPath, name), 'utf8');
      await client.query('BEGIN');
      try {
        await client.query(sql);
        await client.query('INSERT INTO schema_migrations (name) VALUES ($1)', [name]);
        await client.query('COMMIT');
        process.stdout.write(`Applied ${name}.\n`);
      } catch (error) {
        await client.query('ROLLBACK');
        throw error;
      }
    }
    process.stdout.write('Database migrations are up to date.\n');
  } finally {
    await client.query('SELECT pg_advisory_unlock(78124401)');
    await client.end();
  }
}

void migrate().catch((error: unknown) => {
  process.stderr.write(
    `${error instanceof Error ? error.message : 'Database migration failed.'}\n`,
  );
  process.exitCode = 1;
});
