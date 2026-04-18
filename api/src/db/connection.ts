import pg from 'pg';
import { drizzle } from 'drizzle-orm/node-postgres';
import * as schema from './schema.js';

const pool = new pg.Pool({
  connectionString:
    process.env.DATABASE_URL ??
    'postgres://skyharmony:skyharmony_dev@localhost:5432/skyharmony',
});

export const db = drizzle(pool, { schema });
export { pool };
