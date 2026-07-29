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

export type MaintenancePriority = "LOW" | "MEDIUM" | "HIGH" | "CRITICAL";
export type MaintenanceRequestStatus = "OPEN" | "IN_PROGRESS" | "RESOLVED" | "CLOSED" | "CANCELLED";

export interface MaintenanceRequestRow {
  id: number;
  asset_id: number;
  reporter_id: number;
  assignee_id: number | null;
  title: string;
  issue_type: string | null;
  priority: MaintenancePriority;
  status: MaintenanceRequestStatus;
  description: string;
  notes: string | null;
  resolution_notes: string | null;
  opened_at: number;
  started_at: number | null;
  resolved_at: number | null;
  closed_at: number | null;
  cancelled_at: number | null;
}

export interface MaintenanceRequestWithNames extends MaintenanceRequestRow {
  asset_name: string;
  asset_tag: string | null;
  reporter_name: string;
  reporter_email: string;
  assignee_name: string | null;
}

const MAINTENANCE_SELECT = `
  SELECT m.*, a.name as asset_name, a.serial_number as asset_tag,
         r.name as reporter_name, r.email as reporter_email, ass.name as assignee_name
  FROM maintenance_requests m
  JOIN assets a ON a.id = m.asset_id
  JOIN users r ON r.id = m.reporter_id
  LEFT JOIN users ass ON ass.id = m.assignee_id
`;

async function maybeRevertAssetToAvailable(assetId: number): Promise<void> {
  const asset = await getAssetById(assetId);
  if (asset && asset.status === "IN_MAINTENANCE") {
    await updateAssetStatus(assetId, "AVAILABLE");
  }
}

export async function createMaintenanceRequest(input: {
  assetId: number;
  reporterId: number;
  title: string;
  issueType?: string | null;
  priority?: MaintenancePriority;
  description: string;
  notes?: string | null;
}): Promise<MaintenanceRequestRow> {
  const row = await queryOne<MaintenanceRequestRow>(
    `INSERT INTO maintenance_requests (asset_id, reporter_id, title, issue_type, priority, status, description, notes, opened_at)
     VALUES ($1, $2, $3, $4, $5, 'OPEN', $6, $7, $8)
     RETURNING *`,
    [
      input.assetId,
      input.reporterId,
      input.title,
      input.issueType ?? null,
      input.priority ?? "MEDIUM",
      input.description,
      input.notes ?? null,
      Date.now(),
    ]
  );
  return row!;
}

export async function getMaintenanceRequestById(id: number): Promise<MaintenanceRequestWithNames | undefined> {
  return queryOne<MaintenanceRequestWithNames>(`${MAINTENANCE_SELECT} WHERE m.id = $1`, [id]);
}

export async function updateMaintenanceRequest(
  id: number,
  input: {
    title: string;
    issueType?: string | null;
    priority: MaintenancePriority;
    description: string;
    notes?: string | null;
  }
): Promise<void> {
  await query(
    `UPDATE maintenance_requests SET title = $1, issue_type = $2, priority = $3, description = $4, notes = $5 WHERE id = $6`,
    [input.title, input.issueType ?? null, input.priority, input.description, input.notes ?? null, id]
  );
}

export async function assignMaintenanceHandler(id: number, assigneeId: number | null): Promise<void> {
  await query("UPDATE maintenance_requests SET assignee_id = $1 WHERE id = $2", [assigneeId, id]);
}

export async function startMaintenanceRequest(id: number): Promise<MaintenanceRequestRow | undefined> {
  const row = await queryOne<MaintenanceRequestRow>(
    `UPDATE maintenance_requests SET status = 'IN_PROGRESS', started_at = $1 WHERE id = $2 RETURNING *`,
    [Date.now(), id]
  );
  if (row) {
    const asset = await getAssetById(row.asset_id);
    if (asset && asset.status === "AVAILABLE") {
      await updateAssetStatus(row.asset_id, "IN_MAINTENANCE");
    }
  }
  return row;
}

export async function resolveMaintenanceRequest(
  id: number,
  resolutionNotes: string | null
): Promise<MaintenanceRequestRow | undefined> {
  const row = await queryOne<MaintenanceRequestRow>(
    `UPDATE maintenance_requests SET status = 'RESOLVED', resolved_at = $1, resolution_notes = $2 WHERE id = $3 RETURNING *`,
    [Date.now(), resolutionNotes, id]
  );
  if (row) await maybeRevertAssetToAvailable(row.asset_id);
  return row;
}

export async function closeMaintenanceRequest(id: number): Promise<MaintenanceRequestRow | undefined> {
  const row = await queryOne<MaintenanceRequestRow>(
    `UPDATE maintenance_requests SET status = 'CLOSED', closed_at = $1 WHERE id = $2 RETURNING *`,
    [Date.now(), id]
  );
  if (row) await maybeRevertAssetToAvailable(row.asset_id);
  return row;
}

export async function cancelMaintenanceRequest(id: number): Promise<MaintenanceRequestRow | undefined> {
  const row = await queryOne<MaintenanceRequestRow>(
    `UPDATE maintenance_requests SET status = 'CANCELLED', cancelled_at = $1 WHERE id = $2 RETURNING *`,
    [Date.now(), id]
  );
  if (row) await maybeRevertAssetToAvailable(row.asset_id);
  return row;
}

export async function deleteMaintenanceRequest(id: number): Promise<void> {
  await query("DELETE FROM maintenance_requests WHERE id = $1", [id]);
}

export interface MaintenanceRequestFilters {
  q?: string;
  assetId?: number;
  status?: string;
  priority?: string;
  assigneeId?: number;
  reporterId?: number;
  openedFrom?: number;
  openedTo?: number;
}

export async function listMaintenanceRequests(
  filters: MaintenanceRequestFilters = {},
  pagination: { limit: number; offset: number } = { limit: 15, offset: 0 }
): Promise<{ rows: MaintenanceRequestWithNames[]; total: number }> {
  const clauses: string[] = [];
  const params: unknown[] = [];

  const add = (clause: string, value: unknown) => {
    params.push(value);
    clauses.push(clause.replace("?", `$${params.length}`));
  };

  if (filters.assetId) add("m.asset_id = ?", filters.assetId);
  if (filters.status) add("m.status = ?", filters.status);
  if (filters.priority) add("m.priority = ?", filters.priority);
  if (filters.assigneeId) add("m.assignee_id = ?", filters.assigneeId);
  if (filters.reporterId) add("m.reporter_id = ?", filters.reporterId);
  if (filters.openedFrom) add("m.opened_at >= ?", filters.openedFrom);
  if (filters.openedTo) add("m.opened_at <= ?", filters.openedTo);
  if (filters.q) {
    const like = `%${filters.q}%`;
    const start = params.length;
    params.push(like, like, like, like, like);
    clauses.push(
      `(m.title ILIKE $${start + 1} OR m.description ILIKE $${start + 2} OR a.name ILIKE $${start + 3} OR a.serial_number ILIKE $${start + 4} OR ass.name ILIKE $${start + 5})`
    );
  }

  const where = clauses.length ? `WHERE ${clauses.join(" AND ")}` : "";
  const fromJoin = `FROM maintenance_requests m
     JOIN assets a ON a.id = m.asset_id
     JOIN users r ON r.id = m.reporter_id
     LEFT JOIN users ass ON ass.id = m.assignee_id`;

  const totalRow = await queryOne<{ c: number }>(`SELECT COUNT(*)::int as c ${fromJoin} ${where}`, params);
  const total = Number(totalRow?.c ?? 0);

  const limitIdx = params.length + 1;
  const offsetIdx = params.length + 2;
  const rows = await query<MaintenanceRequestWithNames>(
    `SELECT m.*, a.name as asset_name, a.serial_number as asset_tag,
            r.name as reporter_name, r.email as reporter_email, ass.name as assignee_name
     ${fromJoin}
     ${where}
     ORDER BY m.opened_at DESC
     LIMIT $${limitIdx} OFFSET $${offsetIdx}`,
    [...params, pagination.limit, pagination.offset]
  );

  return { rows, total };
}

export interface MaintenanceStats {
  total: number;
  open: number;
  inProgress: number;
  resolved: number;
  closed: number;
  cancelled: number;
  critical: number;
  highPriority: number;
}

export async function getMaintenanceStats(): Promise<MaintenanceStats> {
  const rows = await query<{ status: MaintenanceRequestStatus; priority: MaintenancePriority; c: number }>(
    `SELECT status, priority, COUNT(*)::int as c FROM maintenance_requests GROUP BY status, priority`
  );
  const stats: MaintenanceStats = {
    total: 0,
    open: 0,
    inProgress: 0,
    resolved: 0,
    closed: 0,
    cancelled: 0,
    critical: 0,
    highPriority: 0,
  };
  for (const row of rows) {
    stats.total += row.c;
    if (row.status === "OPEN") stats.open += row.c;
    if (row.status === "IN_PROGRESS") stats.inProgress += row.c;
    if (row.status === "RESOLVED") stats.resolved += row.c;
    if (row.status === "CLOSED") stats.closed += row.c;
    if (row.status === "CANCELLED") stats.cancelled += row.c;
    if (row.priority === "CRITICAL") stats.critical += row.c;
    if (row.priority === "HIGH") stats.highPriority += row.c;
  }
  return stats;
}

export async function listMaintenanceForAsset(assetId: number): Promise<MaintenanceRequestWithNames[]> {
  return query<MaintenanceRequestWithNames>(
    `${MAINTENANCE_SELECT} WHERE m.asset_id = $1 ORDER BY m.opened_at DESC`,
    [assetId]
  );
}

export async function listMaintenanceRequestsReportedBy(userId: number): Promise<MaintenanceRequestWithNames[]> {
  return query<MaintenanceRequestWithNames>(
    `${MAINTENANCE_SELECT} WHERE m.reporter_id = $1 ORDER BY m.opened_at DESC`,
    [userId]
  );
}

export async function listMaintenanceRequestsForUserAssets(
  userId: number
): Promise<MaintenanceRequestWithNames[]> {
  return query<MaintenanceRequestWithNames>(
    `${MAINTENANCE_SELECT}
     WHERE m.asset_id IN (SELECT asset_id FROM allocations WHERE user_id = $1 AND returned_at IS NULL)
     ORDER BY m.opened_at DESC`,
    [userId]
  );
}

// ---------- Maintenance attachments ----------

export interface MaintenanceAttachmentMeta {
  id: number;
  request_id: number;
  filename: string;
  mime_type: string;
  size_bytes: number;
  uploaded_by: number;
  uploaded_by_name: string;
  uploaded_at: number;
}

export interface MaintenanceAttachmentRow extends MaintenanceAttachmentMeta {
  data: Buffer;
}

export async function createMaintenanceAttachment(input: {
  requestId: number;
  filename: string;
  mimeType: string;
  sizeBytes: number;
  data: Buffer;
  uploadedBy: number;
}): Promise<void> {
  await query(
    `INSERT INTO maintenance_attachments (request_id, filename, mime_type, size_bytes, data, uploaded_by, uploaded_at)
     VALUES ($1, $2, $3, $4, $5, $6, $7)`,
    [input.requestId, input.filename, input.mimeType, input.sizeBytes, input.data, input.uploadedBy, Date.now()]
  );
}

export async function listMaintenanceAttachments(requestId: number): Promise<MaintenanceAttachmentMeta[]> {
  return query<MaintenanceAttachmentMeta>(
    `SELECT ma.id, ma.request_id, ma.filename, ma.mime_type, ma.size_bytes, ma.uploaded_by, u.name as uploaded_by_name, ma.uploaded_at
     FROM maintenance_attachments ma
     JOIN users u ON u.id = ma.uploaded_by
     WHERE ma.request_id = $1
     ORDER BY ma.uploaded_at ASC`,
    [requestId]
  );
}

export async function getMaintenanceAttachmentById(id: number): Promise<MaintenanceAttachmentRow | undefined> {
  return queryOne<MaintenanceAttachmentRow>("SELECT * FROM maintenance_attachments WHERE id = $1", [id]);
}

// ---------- Maintenance discussions ----------

export interface MaintenanceCommentRow {
  id: number;
  request_id: number;
  author_id: number;
  author_name: string;
  parent_id: number | null;
  body: string;
  created_at: number;
}

export async function createMaintenanceComment(input: {
  requestId: number;
  authorId: number;
  parentId?: number | null;
  body: string;
}): Promise<void> {
  await query(
    `INSERT INTO maintenance_comments (request_id, author_id, parent_id, body, created_at)
     VALUES ($1, $2, $3, $4, $5)`,
    [input.requestId, input.authorId, input.parentId ?? null, input.body, Date.now()]
  );
}

export async function listMaintenanceComments(requestId: number): Promise<MaintenanceCommentRow[]> {
  return query<MaintenanceCommentRow>(
    `SELECT mc.id, mc.request_id, mc.author_id, u.name as author_name, mc.parent_id, mc.body, mc.created_at
     FROM maintenance_comments mc
     JOIN users u ON u.id = mc.author_id
     WHERE mc.request_id = $1
     ORDER BY mc.created_at ASC`,
    [requestId]
  );
}
