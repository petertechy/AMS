import { Pool } from "pg";
import bcrypt from "bcryptjs";

const connectionString = process.env.DATABASE_URL;
if (!connectionString) {
  console.error("DATABASE_URL is not set. Add your Neon connection string to .env first.");
  process.exit(1);
}

const pool = new Pool({ connectionString, ssl: { rejectUnauthorized: false } });

await pool.query(`
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
`);
await pool.query(`
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
`);
await pool.query(`
  CREATE TABLE IF NOT EXISTS allocations (
    id SERIAL PRIMARY KEY,
    asset_id INTEGER NOT NULL REFERENCES assets(id) ON DELETE CASCADE,
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    allocated_by INTEGER NOT NULL REFERENCES users(id),
    allocated_at BIGINT NOT NULL,
    returned_at BIGINT,
    notes TEXT
  );
`);
await pool.query(`
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
`);
await pool.query(`CREATE INDEX IF NOT EXISTS idx_assets_department ON assets(department);`);
await pool.query(`CREATE INDEX IF NOT EXISTS idx_assets_status ON assets(status);`);
await pool.query(`CREATE INDEX IF NOT EXISTS idx_allocations_asset ON allocations(asset_id);`);
await pool.query(`CREATE INDEX IF NOT EXISTS idx_allocations_user ON allocations(user_id);`);
await pool.query(`
  CREATE TABLE IF NOT EXISTS settings (
    key TEXT PRIMARY KEY,
    value TEXT NOT NULL
  );
`);
await pool.query(`
  CREATE TABLE IF NOT EXISTS departments (
    id SERIAL PRIMARY KEY,
    name TEXT NOT NULL UNIQUE,
    created_at BIGINT NOT NULL
  );
`);
await pool.query(`
  CREATE TABLE IF NOT EXISTS activity_log (
    id SERIAL PRIMARY KEY,
    actor_id INTEGER REFERENCES users(id),
    actor_name TEXT NOT NULL,
    action TEXT NOT NULL,
    summary TEXT NOT NULL,
    entity_type TEXT,
    entity_id INTEGER,
    created_at BIGINT NOT NULL
  );
`);
await pool.query(`CREATE INDEX IF NOT EXISTS idx_activity_log_created ON activity_log(created_at DESC);`);
await pool.query(`
  CREATE TABLE IF NOT EXISTS notifications (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    message TEXT NOT NULL,
    link TEXT,
    read_at BIGINT,
    created_at BIGINT NOT NULL
  );
`);
await pool.query(`CREATE INDEX IF NOT EXISTS idx_notifications_user ON notifications(user_id, read_at);`);
await pool.query(`
  CREATE TABLE IF NOT EXISTS maintenance_records (
    id SERIAL PRIMARY KEY,
    asset_id INTEGER NOT NULL REFERENCES assets(id) ON DELETE CASCADE,
    opened_by INTEGER NOT NULL REFERENCES users(id),
    description TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'IN_PROGRESS' CHECK(status IN ('IN_PROGRESS','COMPLETED')),
    opened_at BIGINT NOT NULL,
    completed_at BIGINT,
    completion_notes TEXT,
    cost DOUBLE PRECISION
  );
`);
await pool.query(`CREATE INDEX IF NOT EXISTS idx_maintenance_asset ON maintenance_records(asset_id);`);

// Backfill the departments registry from any existing free-text values on assets/users.
// Idempotent (ON CONFLICT DO NOTHING) and safe to re-run, same as the rest of this script.
await pool.query(
  `INSERT INTO departments (name, created_at)
   SELECT DISTINCT department, $1::bigint FROM (
     SELECT department FROM assets WHERE department IS NOT NULL AND department <> ''
     UNION
     SELECT department FROM users WHERE department IS NOT NULL AND department <> ''
   ) d
   ON CONFLICT (name) DO NOTHING`,
  [Date.now()]
);

const { rows: countRows } = await pool.query("SELECT COUNT(*)::int as c FROM users");
if (countRows[0].c > 0) {
  console.log("Database already contains data. Skipping seed. (Truncate tables to reseed.)");
  await pool.end();
  process.exit(0);
}

const now = Date.now();
const hash = (pw) => bcrypt.hashSync(pw, 10);

const insertUser = async (name, email, role, department) => {
  const { rows } = await pool.query(
    `INSERT INTO users (name, email, password_hash, role, department, created_at)
     VALUES ($1, $2, $3, $4, $5, $6) RETURNING id`,
    [name, email, hash("Password123!"), role, department, now]
  );
  return rows[0].id;
};

const adminId = await insertUser("Ada Admin", "admin@acme.org", "ADMIN", "IT");
const staff1Id = await insertUser("Sam Staff", "sam@acme.org", "STAFF", "Operations");
const staff2Id = await insertUser("Priya Patel", "priya@acme.org", "STAFF", "Finance");

const insertAsset = async (a) => {
  const { rows } = await pool.query(
    `INSERT INTO assets (name, category, department, location, serial_number, specifications, condition, status, purchase_date, value, created_at, updated_at)
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12) RETURNING id`,
    [...a, now, now]
  );
  return rows[0].id;
};

const laptopId = await insertAsset(["Dell Latitude 5540 Laptop", "IT Device", "Operations", "London HQ - 2nd Floor", "SN-LT-1001", "Intel i7, 16GB RAM, 512GB SSD, Windows 11 Pro", "GOOD", "AVAILABLE", "2024-02-10", 950.0]);
await insertAsset(["Ford Transit Custom Van", "Vehicle", "Logistics", "Manchester Depot", "REG-MC24XYZ", "2.0L Diesel, 6-seater, GPS tracker fitted", "GOOD", "AVAILABLE", "2023-06-01", 28500.0]);
await insertAsset(["Bosch Cordless Drill Set", "Tool", "Facilities", "Manchester Depot - Store Room", "SN-TL-3321", "18V, 2 batteries, carry case", "FAIR", "AVAILABLE", "2022-11-15", 180.0]);
const printerId = await insertAsset(["HP LaserJet Pro Printer", "Equipment", "Finance", "London HQ - 3rd Floor", "SN-PR-4410", "Duplex, network-enabled, colour laser", "NEW", "AVAILABLE", "2025-01-20", 340.0]);
await insertAsset(["Microsoft 365 E3 License", "Digital License", "IT", "N/A - Cloud", "LIC-M365-88213", "Annual subscription, includes Teams, Exchange, SharePoint", "NEW", "AVAILABLE", "2025-04-01", 240.0]);
await insertAsset(["CNC Milling Machine", "Machinery", "Production", "Birmingham Plant - Bay 3", "SN-MC-7789", "3-axis, requires certified operator, annual service contract", "GOOD", "IN_MAINTENANCE", "2021-09-05", 42000.0]);
const phoneId = await insertAsset(["iPhone 15", "IT Device", "Operations", "London HQ - 2nd Floor", "SN-PH-5541", "128GB, company mobile plan", "GOOD", "AVAILABLE", "2024-10-12", 699.0]);

const monthAgo = now - 1000 * 60 * 60 * 24 * 30;
await pool.query(
  `INSERT INTO allocations (asset_id, user_id, allocated_by, allocated_at, notes) VALUES ($1, $2, $3, $4, $5)`,
  [laptopId, staff1Id, adminId, monthAgo, "Standard issue for new starter"]
);
await pool.query(`UPDATE assets SET status = 'ALLOCATED', updated_at = $1 WHERE id = $2`, [now, laptopId]);

await pool.query(
  `INSERT INTO allocations (asset_id, user_id, allocated_by, allocated_at, notes) VALUES ($1, $2, $3, $4, $5)`,
  [phoneId, staff1Id, adminId, monthAgo, "Company mobile"]
);
await pool.query(`UPDATE assets SET status = 'ALLOCATED', updated_at = $1 WHERE id = $2`, [now, phoneId]);

await pool.query(
  `INSERT INTO reassignment_requests (asset_id, requested_by, reason, status, requested_at) VALUES ($1, $2, $3, 'PENDING', $4)`,
  [printerId, staff2Id, "Need a printer closer to the Finance desks for month-end reporting.", now - 1000 * 60 * 60 * 5]
);

console.log("Seed complete.");
console.log("Demo accounts (password: Password123!):");
console.log("  Admin: admin@acme.org");
console.log("  Staff: sam@acme.org");
console.log("  Staff: priya@acme.org");

await pool.end();
