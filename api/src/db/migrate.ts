import { drizzle } from 'drizzle-orm/node-postgres';
import { migrate } from 'drizzle-orm/node-postgres/migrator';
import fs from 'node:fs';
import path from 'node:path';
import pg from 'pg';

function getExpectedMigrationTags(): Set<string> {
  try {
    const journalPath = path.resolve(process.cwd(), 'drizzle/meta/_journal.json');
    const raw = fs.readFileSync(journalPath, 'utf8');
    const journal = JSON.parse(raw) as { entries?: Array<{ tag?: string }> };
    const tags = (journal.entries ?? [])
      .map((e) => e.tag)
      .filter((t): t is string => typeof t === 'string' && t.length > 0);
    return new Set(tags);
  } catch {
    return new Set();
  }
}

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
    const expectedTags = getExpectedMigrationTags();
    const { rows } = await client
      .query('SELECT id FROM drizzle."__drizzle_migrations"')
      .catch(() => ({ rows: [] as Array<{ id?: unknown }> }));

    const appliedIds = rows
      .map((r) => r.id)
      .filter((id): id is string => typeof id === 'string' && id.length > 0);

    const hasStaleEntries =
      expectedTags.size > 0 && appliedIds.some((id) => !expectedTags.has(id));

    if (hasStaleEntries) {
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
