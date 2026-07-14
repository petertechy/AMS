import { Pool, type QueryResultRow } from "pg";

declare global {
  var __amsPool: Pool | undefined;
  var __amsSchemaReady: Promise<void> | undefined;
}

function createPool(): Pool {
  const connectionString = process.env.DATABASE_URL;
  if (!connectionString) {
    throw new Error(
      "DATABASE_URL is not set. Add your Neon connection string to .env (see .env.example)."
    );
  }
  return new Pool({
    connectionString,
    // Neon requires SSL; a small max keeps us well within serverless connection limits
    // when using Neon's pooled ("-pooler") connection string.
    ssl: { rejectUnauthorized: false },
    max: 5,
  });
}

export const pool = globalThis.__amsPool ?? createPool();
globalThis.__amsPool = pool;

/** Run a parameterised query and return the rows. */
export async function query<T extends QueryResultRow = QueryResultRow>(
  text: string,
  params: unknown[] = []
): Promise<T[]> {
  const result = await pool.query<T>(text, params);
  return result.rows;
}

/** Run a parameterised query and return the first row (or undefined). */
export async function queryOne<T extends QueryResultRow = QueryResultRow>(
  text: string,
  params: unknown[] = []
): Promise<T | undefined> {
  const rows = await query<T>(text, params);
  return rows[0];
}

const SCHEMA_SQL = `
  CREATE TABLE IF NOT EXISTS users (
    id SERIAL PRIMARY KEY,
    name TEXT NOT NULL,
    email TEXT NOT NULL UNIQUE,
    password_hash TEXT NOT NULL,
    role TEXT NOT NULL DEFAULT 'STAFF' CHECK(role IN ('ADMIN','STAFF')),
    department TEXT,
    reset_token TEXT,
    reset_token_expires BIGINT,
    created_at BIGINT NOT NULL
  );

  CREATE TABLE IF NOT EXISTS assets (
    id SERIAL PRIMARY KEY,
    name TEXT NOT NULL,
    category TEXT NOT NULL,
    department TEXT NOT NULL,
    location TEXT NOT NULL,
    serial_number TEXT,
    specifications TEXT,
    condition TEXT NOT NULL DEFAULT 'GOOD' CHECK(condition IN ('NEW','GOOD','FAIR','POOR','DAMAGED')),
    status TEXT NOT NULL DEFAULT 'AVAILABLE' CHECK(status IN ('AVAILABLE','ALLOCATED','IN_MAINTENANCE','RETIRED')),
    purchase_date TEXT,
    value DOUBLE PRECISION,
    created_at BIGINT NOT NULL,
    updated_at BIGINT NOT NULL
  );

  CREATE TABLE IF NOT EXISTS allocations (
    id SERIAL PRIMARY KEY,
    asset_id INTEGER NOT NULL REFERENCES assets(id) ON DELETE CASCADE,
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    allocated_by INTEGER NOT NULL REFERENCES users(id),
    allocated_at BIGINT NOT NULL,
    returned_at BIGINT,
    notes TEXT
  );

  CREATE TABLE IF NOT EXISTS reassignment_requests (
    id SERIAL PRIMARY KEY,
    asset_id INTEGER NOT NULL REFERENCES assets(id) ON DELETE CASCADE,
    requested_by INTEGER NOT NULL REFERENCES users(id),
    reason TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'PENDING' CHECK(status IN ('PENDING','APPROVED','REJECTED')),
    requested_at BIGINT NOT NULL,
    resolved_at BIGINT,
    resolved_by INTEGER REFERENCES users(id),
    resolution_notes TEXT
  );

  CREATE INDEX IF NOT EXISTS idx_assets_department ON assets(department);
  CREATE INDEX IF NOT EXISTS idx_assets_status ON assets(status);
  CREATE INDEX IF NOT EXISTS idx_allocations_asset ON allocations(asset_id);
  CREATE INDEX IF NOT EXISTS idx_allocations_user ON allocations(user_id);

  CREATE TABLE IF NOT EXISTS settings (
    key TEXT PRIMARY KEY,
    value TEXT NOT NULL
  );
`;

/** Creates tables/indexes if they don't already exist. Safe to call repeatedly. */
export function ensureSchema(): Promise<void> {
  if (!globalThis.__amsSchemaReady) {
    globalThis.__amsSchemaReady = pool.query(SCHEMA_SQL).then(() => undefined);
  }
  return globalThis.__amsSchemaReady;
}

export default pool;
