import { drizzle } from 'drizzle-orm/node-postgres';
import { migrate } from 'drizzle-orm/node-postgres/migrator';
import pg from 'pg';

async function runMigrations() {
  const pool = new pg.Pool({
    connectionString:
      process.env.DATABASE_URL ??
      'postgres://skyharmony:skyharmony_dev@localhost:5432/skyharmony',
    connectionTimeoutMillis: 10_000,
  });

  try {
    const client = await pool.connect();
    await client.query('SELECT 1');
    console.log('[migrate] Connected to database');

    // One-time squash fixup: drizzle-kit CLI used public.__drizzle_migrations,
    // but drizzle-orm's migrate() uses drizzle.__drizzle_migrations.
    // If the old public table exists (from pre-squash NAS deploys), drop it
    // so the programmatic migrator starts clean with IF NOT EXISTS init.
    const { rows: oldTable } = await client.query(
      `SELECT 1 FROM information_schema.tables
       WHERE table_schema = 'public' AND table_name = '__drizzle_migrations'`
    );
    if (oldTable.length > 0) {
      console.log('[migrate] Dropping legacy public.__drizzle_migrations table');
      await client.query('DROP TABLE public."__drizzle_migrations"');
    }

    // If the drizzle schema tracker has stale entries from a previous squash
    // attempt, reset it so the squashed IF NOT EXISTS init replays cleanly
    const { rows } = await client
      .query('SELECT COUNT(*)::int AS c FROM drizzle."__drizzle_migrations"')
      .catch(() => ({ rows: [{ c: 0 }] }));

    if (rows[0].c > 1) {
      console.log('[migrate] Detected pre-squash migration history, resetting tracker');
      await client.query('TRUNCATE drizzle."__drizzle_migrations"');
    }

    client.release();

    const db = drizzle(pool);
    await migrate(db, { migrationsFolder: './drizzle' });
    console.log('[migrate] Migrations complete');
  } catch (err) {
    console.error('[migrate] FAILED:', err);
    process.exit(1);
  } finally {
    await pool.end();
  }
}

runMigrations();
