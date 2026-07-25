import { query, queryOne } from "@/lib/db";

export type Role = "ADMIN" | "STAFF";
export type AssetCondition = "NEW" | "GOOD" | "FAIR" | "POOR" | "DAMAGED";
export type AssetStatus = "AVAILABLE" | "ALLOCATED" | "IN_MAINTENANCE" | "RETIRED";
export type RequestStatus = "PENDING" | "APPROVED" | "REJECTED";

export interface UserRow {
  id: number;
  name: string;
  email: string;
  password_hash: string;
  role: Role;
  department: string | null;
  reset_token: string | null;
  reset_token_expires: number | null;
  created_at: number;
}

export interface AssetRow {
  id: number;
  name: string;
  category: string;
  department: string;
  location: string;
  serial_number: string | null;
  specifications: string | null;
  condition: AssetCondition;
  status: AssetStatus;
  purchase_date: string | null;
  value: number | null;
  created_at: number;
  updated_at: number;
}

export interface AllocationRow {
  id: number;
  asset_id: number;
  user_id: number;
  allocated_by: number;
  allocated_at: number;
  returned_at: number | null;
  notes: string | null;
}

export interface AllocationWithNames extends AllocationRow {
  asset_name: string;
  user_name: string;
  user_email: string;
  allocated_by_name: string;
}

export interface ReassignmentRequestRow {
  id: number;
  asset_id: number;
  requested_by: number;
  reason: string;
  status: RequestStatus;
  requested_at: number;
  resolved_at: number | null;
  resolved_by: number | null;
  resolution_notes: string | null;
}

export interface ReassignmentRequestWithNames extends ReassignmentRequestRow {
  asset_name: string;
  requested_by_name: string;
  resolved_by_name: string | null;
}

// ---------- Users ----------

export async function createUser(input: {
  name: string;
  email: string;
  passwordHash: string;
  role?: Role;
  department?: string | null;
}): Promise<UserRow> {
  const row = await queryOne<UserRow>(
    `INSERT INTO users (name, email, password_hash, role, department, created_at)
     VALUES ($1, $2, $3, $4, $5, $6)
     RETURNING *`,
    [
      input.name,
      input.email.toLowerCase(),
      input.passwordHash,
      input.role ?? "STAFF",
      input.department ?? null,
      Date.now(),
    ]
  );
  return row!;
}

export async function getUserByEmail(email: string): Promise<UserRow | undefined> {
  return queryOne<UserRow>("SELECT * FROM users WHERE email = $1", [email.toLowerCase()]);
}

export async function getUserById(id: number): Promise<UserRow | undefined> {
  return queryOne<UserRow>("SELECT * FROM users WHERE id = $1", [id]);
}

export async function listUsers(): Promise<UserRow[]> {
  return query<UserRow>("SELECT * FROM users ORDER BY name");
}

export async function setResetToken(userId: number, token: string, expiresAt: number): Promise<void> {
  await query("UPDATE users SET reset_token = $1, reset_token_expires = $2 WHERE id = $3", [
    token,
    expiresAt,
    userId,
  ]);
}

export async function getUserByResetToken(token: string): Promise<UserRow | undefined> {
  return queryOne<UserRow>("SELECT * FROM users WHERE reset_token = $1", [token]);
}

export async function updatePasswordAndClearToken(userId: number, passwordHash: string): Promise<void> {
  await query(
    "UPDATE users SET password_hash = $1, reset_token = NULL, reset_token_expires = NULL WHERE id = $2",
    [passwordHash, userId]
  );
}

// ---------- Assets ----------

export interface AssetFilters {
  department?: string;
  category?: string;
  condition?: string;
  status?: string;
  location?: string;
  q?: string;
}

export async function listAssets(filters: AssetFilters = {}): Promise<AssetRow[]> {
  const clauses: string[] = [];
  const params: unknown[] = [];

  const add = (clause: string, value: unknown) => {
    params.push(value);
    clauses.push(clause.replace("?", `$${params.length}`));
  };

  if (filters.department) add("department = ?", filters.department);
  if (filters.category) add("category = ?", filters.category);
  if (filters.condition) add("condition = ?", filters.condition);
  if (filters.status) add("status = ?", filters.status);
  if (filters.location) add("location = ?", filters.location);
  if (filters.q) {
    const like = `%${filters.q}%`;
    params.push(like, like, like);
    clauses.push(
      `(name ILIKE $${params.length - 2} OR serial_number ILIKE $${params.length - 1} OR specifications ILIKE $${params.length})`
    );
  }

  const where = clauses.length ? `WHERE ${clauses.join(" AND ")}` : "";
  return query<AssetRow>(`SELECT * FROM assets ${where} ORDER BY name`, params);
}

export async function getAssetById(id: number): Promise<AssetRow | undefined> {
  return queryOne<AssetRow>("SELECT * FROM assets WHERE id = $1", [id]);
}

export async function createAsset(input: {
  name: string;
  category: string;
  department: string;
  location: string;
  serialNumber?: string | null;
  specifications?: string | null;
  condition?: AssetCondition;
  purchaseDate?: string | null;
  value?: number | null;
}): Promise<AssetRow> {
  const now = Date.now();
  const row = await queryOne<AssetRow>(
    `INSERT INTO assets (name, category, department, location, serial_number, specifications, condition, status, purchase_date, value, created_at, updated_at)
     VALUES ($1, $2, $3, $4, $5, $6, $7, 'AVAILABLE', $8, $9, $10, $11)
     RETURNING *`,
    [
      input.name,
      input.category,
      input.department,
      input.location,
      input.serialNumber ?? null,
      input.specifications ?? null,
      input.condition ?? "GOOD",
      input.purchaseDate ?? null,
      input.value ?? null,
      now,
      now,
    ]
  );
  return row!;
}

export async function updateAsset(
  id: number,
  input: Partial<{
    name: string;
    category: string;
    department: string;
    location: string;
    serialNumber: string | null;
    specifications: string | null;
    purchaseDate: string | null;
    value: number | null;
  }>
): Promise<void> {
  const fields: string[] = [];
  const params: unknown[] = [];
  const map: Record<string, string> = {
    name: "name",
    category: "category",
    department: "department",
    location: "location",
    serialNumber: "serial_number",
    specifications: "specifications",
    purchaseDate: "purchase_date",
    value: "value",
  };
  for (const [key, column] of Object.entries(map)) {
    if (key in input) {
      params.push((input as Record<string, unknown>)[key] ?? null);
      fields.push(`${column} = $${params.length}`);
    }
  }
  if (fields.length === 0) return;
  params.push(Date.now());
  fields.push(`updated_at = $${params.length}`);
  params.push(id);
  await query(`UPDATE assets SET ${fields.join(", ")} WHERE id = $${params.length}`, params);
}

export async function updateAssetCondition(id: number, condition: AssetCondition): Promise<void> {
  await query("UPDATE assets SET condition = $1, updated_at = $2 WHERE id = $3", [
    condition,
    Date.now(),
    id,
  ]);
}

export async function updateAssetStatus(id: number, status: AssetStatus): Promise<void> {
  await query("UPDATE assets SET status = $1, updated_at = $2 WHERE id = $3", [
    status,
    Date.now(),
    id,
  ]);
}

export async function distinctAssetValues(
  column: "department" | "category" | "location"
): Promise<string[]> {
  const rows = await query<{ v: string }>(`SELECT DISTINCT ${column} as v FROM assets ORDER BY ${column}`);
  return rows.map((r) => r.v);
}

// ---------- Allocations ----------

export async function getActiveAllocationForAsset(assetId: number): Promise<AllocationRow | undefined> {
  return queryOne<AllocationRow>(
    "SELECT * FROM allocations WHERE asset_id = $1 AND returned_at IS NULL",
    [assetId]
  );
}

export async function createAllocation(input: {
  assetId: number;
  userId: number;
  allocatedBy: number;
  notes?: string | null;
}): Promise<AllocationRow> {
  const now = Date.now();
  const row = await queryOne<AllocationRow>(
    `INSERT INTO allocations (asset_id, user_id, allocated_by, allocated_at, notes)
     VALUES ($1, $2, $3, $4, $5)
     RETURNING *`,
    [input.assetId, input.userId, input.allocatedBy, now, input.notes ?? null]
  );
  await updateAssetStatus(input.assetId, "ALLOCATED");
  return row!;
}

export async function returnAllocation(allocationId: number): Promise<void> {
  const allocation = await queryOne<AllocationRow>("SELECT * FROM allocations WHERE id = $1", [
    allocationId,
  ]);
  if (!allocation) return;
  await query("UPDATE allocations SET returned_at = $1 WHERE id = $2", [Date.now(), allocationId]);
  await updateAssetStatus(allocation.asset_id, "AVAILABLE");
}

export async function listAllocationsForUser(userId: number): Promise<AllocationWithNames[]> {
  return query<AllocationWithNames>(
    `SELECT al.*, a.name as asset_name, u.name as user_name, u.email as user_email, ab.name as allocated_by_name
     FROM allocations al
     JOIN assets a ON a.id = al.asset_id
     JOIN users u ON u.id = al.user_id
     JOIN users ab ON ab.id = al.allocated_by
     WHERE al.user_id = $1
     ORDER BY al.allocated_at DESC`,
    [userId]
  );
}

export async function listAllocationsForAsset(assetId: number): Promise<AllocationWithNames[]> {
  return query<AllocationWithNames>(
    `SELECT al.*, a.name as asset_name, u.name as user_name, u.email as user_email, ab.name as allocated_by_name
     FROM allocations al
     JOIN assets a ON a.id = al.asset_id
     JOIN users u ON u.id = al.user_id
     JOIN users ab ON ab.id = al.allocated_by
     WHERE al.asset_id = $1
     ORDER BY al.allocated_at DESC`,
    [assetId]
  );
}

export async function listAllAllocations(): Promise<AllocationWithNames[]> {
  return query<AllocationWithNames>(
    `SELECT al.*, a.name as asset_name, u.name as user_name, u.email as user_email, ab.name as allocated_by_name
     FROM allocations al
     JOIN assets a ON a.id = al.asset_id
     JOIN users u ON u.id = al.user_id
     JOIN users ab ON ab.id = al.allocated_by
     ORDER BY al.allocated_at DESC`
  );
}

// ---------- Reassignment requests ----------

export async function createReassignmentRequest(input: {
  assetId: number;
  requestedBy: number;
  reason: string;
}): Promise<ReassignmentRequestRow> {
  const row = await queryOne<ReassignmentRequestRow>(
    `INSERT INTO reassignment_requests (asset_id, requested_by, reason, status, requested_at)
     VALUES ($1, $2, $3, 'PENDING', $4)
     RETURNING *`,
    [input.assetId, input.requestedBy, input.reason, Date.now()]
  );
  return row!;
}

export async function listReassignmentRequests(
  filters: { status?: RequestStatus; requestedBy?: number } = {}
): Promise<ReassignmentRequestWithNames[]> {
  const clauses: string[] = [];
  const params: unknown[] = [];
  if (filters.status) {
    params.push(filters.status);
    clauses.push(`rr.status = $${params.length}`);
  }
  if (filters.requestedBy) {
    params.push(filters.requestedBy);
    clauses.push(`rr.requested_by = $${params.length}`);
  }
  const where = clauses.length ? `WHERE ${clauses.join(" AND ")}` : "";
  return query<ReassignmentRequestWithNames>(
    `SELECT rr.*, a.name as asset_name, u.name as requested_by_name, ru.name as resolved_by_name
     FROM reassignment_requests rr
     JOIN assets a ON a.id = rr.asset_id
     JOIN users u ON u.id = rr.requested_by
     LEFT JOIN users ru ON ru.id = rr.resolved_by
     ${where}
     ORDER BY rr.requested_at DESC`,
    params
  );
}

export async function getReassignmentRequestById(id: number): Promise<ReassignmentRequestRow | undefined> {
  return queryOne<ReassignmentRequestRow>("SELECT * FROM reassignment_requests WHERE id = $1", [id]);
}

export async function resolveReassignmentRequest(
  id: number,
  status: "APPROVED" | "REJECTED",
  resolvedBy: number,
  notes?: string | null
): Promise<void> {
  await query(
    `UPDATE reassignment_requests
     SET status = $1, resolved_at = $2, resolved_by = $3, resolution_notes = $4
     WHERE id = $5`,
    [status, Date.now(), resolvedBy, notes ?? null, id]
  );
}

// ---------- Settings (feature flags) ----------

export async function getSetting(key: string): Promise<string | undefined> {
  const row = await queryOne<{ value: string }>("SELECT value FROM settings WHERE key = $1", [key]);
  return row?.value;
}

export async function getAllSettings(): Promise<Record<string, string>> {
  const rows = await query<{ key: string; value: string }>("SELECT key, value FROM settings");
  return Object.fromEntries(rows.map((r) => [r.key, r.value]));
}

export async function setSetting(key: string, value: string): Promise<void> {
  await query(
    `INSERT INTO settings (key, value) VALUES ($1, $2)
     ON CONFLICT (key) DO UPDATE SET value = EXCLUDED.value`,
    [key, value]
  );
}

export async function updateUserRoleAndDepartment(
  id: number,
  role: Role,
  department: string | null
): Promise<void> {
  await query("UPDATE users SET role = $1, department = $2 WHERE id = $3", [role, department, id]);
}

// ---------- Departments ----------

export interface DepartmentRow {
  id: number;
  name: string;
  created_at: number;
}

export async function listDepartments(): Promise<DepartmentRow[]> {
  return query<DepartmentRow>("SELECT * FROM departments ORDER BY name");
}

export async function createDepartment(name: string): Promise<DepartmentRow> {
  const row = await queryOne<DepartmentRow>(
    `INSERT INTO departments (name, created_at) VALUES ($1, $2)
     ON CONFLICT (name) DO UPDATE SET name = EXCLUDED.name
     RETURNING *`,
    [name, Date.now()]
  );
  return row!;
}

export async function renameDepartment(id: number, name: string): Promise<void> {
  await query("UPDATE departments SET name = $1 WHERE id = $2", [name, id]);
}

export async function countDepartmentUsage(name: string): Promise<{ assets: number; users: number }> {
  const [assetRow, userRow] = await Promise.all([
    queryOne<{ c: string }>("SELECT COUNT(*)::int as c FROM assets WHERE department = $1", [name]),
    queryOne<{ c: string }>("SELECT COUNT(*)::int as c FROM users WHERE department = $1", [name]),
  ]);
  return { assets: Number(assetRow?.c ?? 0), users: Number(userRow?.c ?? 0) };
}

export async function getDepartmentById(id: number): Promise<DepartmentRow | undefined> {
  return queryOne<DepartmentRow>("SELECT * FROM departments WHERE id = $1", [id]);
}

export async function deleteDepartmentIfUnused(id: number): Promise<boolean> {
  const dept = await getDepartmentById(id);
  if (!dept) return false;
  const usage = await countDepartmentUsage(dept.name);
  if (usage.assets > 0 || usage.users > 0) return false;
  await query("DELETE FROM departments WHERE id = $1", [id]);
  return true;
}

// ---------- Activity log (audit trail) ----------

export interface ActivityLogRow {
  id: number;
  actor_id: number | null;
  actor_name: string;
  action: string;
  summary: string;
  entity_type: string | null;
  entity_id: number | null;
  created_at: number;
}

export async function logActivity(input: {
  actorId: number | null;
  actorName: string;
  action: string;
  summary: string;
  entityType?: string | null;
  entityId?: number | null;
}): Promise<void> {
  await query(
    `INSERT INTO activity_log (actor_id, actor_name, action, summary, entity_type, entity_id, created_at)
     VALUES ($1, $2, $3, $4, $5, $6, $7)`,
    [
      input.actorId,
      input.actorName,
      input.action,
      input.summary,
      input.entityType ?? null,
      input.entityId ?? null,
      Date.now(),
    ]
  );
}

export async function listActivityLog(limit = 100): Promise<ActivityLogRow[]> {
  return query<ActivityLogRow>("SELECT * FROM activity_log ORDER BY created_at DESC LIMIT $1", [limit]);
}

// ---------- Notifications ----------

export interface NotificationRow {
  id: number;
  user_id: number;
  message: string;
  link: string | null;
  read_at: number | null;
  created_at: number;
}

export async function createNotification(input: {
  userId: number;
  message: string;
  link?: string | null;
}): Promise<void> {
  await query(
    `INSERT INTO notifications (user_id, message, link, created_at) VALUES ($1, $2, $3, $4)`,
    [input.userId, input.message, input.link ?? null, Date.now()]
  );
}

export async function listNotificationsForUser(userId: number, limit = 10): Promise<NotificationRow[]> {
  return query<NotificationRow>(
    "SELECT * FROM notifications WHERE user_id = $1 ORDER BY created_at DESC LIMIT $2",
    [userId, limit]
  );
}

export async function countUnreadNotifications(userId: number): Promise<number> {
  const row = await queryOne<{ c: string }>(
    "SELECT COUNT(*)::int as c FROM notifications WHERE user_id = $1 AND read_at IS NULL",
    [userId]
  );
  return Number(row?.c ?? 0);
}

export async function markAllNotificationsRead(userId: number): Promise<void> {
  await query("UPDATE notifications SET read_at = $1 WHERE user_id = $2 AND read_at IS NULL", [
    Date.now(),
    userId,
  ]);
}

// ---------- Maintenance ----------

export type MaintenanceStatus = "IN_PROGRESS" | "COMPLETED";

export interface MaintenanceRecordRow {
  id: number;
  asset_id: number;
  opened_by: number;
  description: string;
  status: MaintenanceStatus;
  opened_at: number;
  completed_at: number | null;
  completion_notes: string | null;
  cost: number | null;
}

export interface MaintenanceRecordWithNames extends MaintenanceRecordRow {
  asset_name: string;
  opened_by_name: string;
}

export async function createMaintenanceRecord(input: {
  assetId: number;
  openedBy: number;
  description: string;
}): Promise<MaintenanceRecordRow> {
  const row = await queryOne<MaintenanceRecordRow>(
    `INSERT INTO maintenance_records (asset_id, opened_by, description, status, opened_at)
     VALUES ($1, $2, $3, 'IN_PROGRESS', $4)
     RETURNING *`,
    [input.assetId, input.openedBy, input.description, Date.now()]
  );
  await updateAssetStatus(input.assetId, "IN_MAINTENANCE");
  return row!;
}

export async function getMaintenanceRecordById(id: number): Promise<MaintenanceRecordRow | undefined> {
  return queryOne<MaintenanceRecordRow>("SELECT * FROM maintenance_records WHERE id = $1", [id]);
}

export async function completeMaintenanceRecord(
  id: number,
  input: { notes?: string | null; cost?: number | null }
): Promise<void> {
  const record = await getMaintenanceRecordById(id);
  if (!record) return;
  await query(
    `UPDATE maintenance_records SET status = 'COMPLETED', completed_at = $1, completion_notes = $2, cost = $3 WHERE id = $4`,
    [Date.now(), input.notes ?? null, input.cost ?? null, id]
  );
  await updateAssetStatus(record.asset_id, "AVAILABLE");
}

export async function listOpenMaintenanceRecords(): Promise<MaintenanceRecordWithNames[]> {
  return query<MaintenanceRecordWithNames>(
    `SELECT m.*, a.name as asset_name, u.name as opened_by_name
     FROM maintenance_records m
     JOIN assets a ON a.id = m.asset_id
     JOIN users u ON u.id = m.opened_by
     WHERE m.status = 'IN_PROGRESS'
     ORDER BY m.opened_at DESC`
  );
}

export async function listMaintenanceHistory(): Promise<MaintenanceRecordWithNames[]> {
  return query<MaintenanceRecordWithNames>(
    `SELECT m.*, a.name as asset_name, u.name as opened_by_name
     FROM maintenance_records m
     JOIN assets a ON a.id = m.asset_id
     JOIN users u ON u.id = m.opened_by
     WHERE m.status = 'COMPLETED'
     ORDER BY m.completed_at DESC`
  );
}

export async function listMaintenanceForAsset(assetId: number): Promise<MaintenanceRecordWithNames[]> {
  return query<MaintenanceRecordWithNames>(
    `SELECT m.*, a.name as asset_name, u.name as opened_by_name
     FROM maintenance_records m
     JOIN assets a ON a.id = m.asset_id
     JOIN users u ON u.id = m.opened_by
     WHERE m.asset_id = $1
     ORDER BY m.opened_at DESC`,
    [assetId]
  );
}
