import type { PoolConnection } from 'mysql2/promise';

export async function writeAdminAudit(
  conn: Pick<PoolConnection, 'execute'>,
  input: {
    requestId: string;
    action: string;
    resourceType?: string | null;
    resourceId?: string | null;
    outcome: 'success' | 'failure';
  },
): Promise<void> {
  await conn.execute(
    `INSERT INTO admin_audit_logs
      (request_id, action, resource_type, resource_id, outcome)
     VALUES (?, ?, ?, ?, ?)`,
    [input.requestId, input.action.slice(0, 100), input.resourceType || null, input.resourceId || null, input.outcome],
  );
}
