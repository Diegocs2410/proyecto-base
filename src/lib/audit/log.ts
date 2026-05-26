import { createAdminClient } from "@/lib/supabase/admin";
import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database, Json } from "@/lib/supabase/database.types";

export type AuditAction =
  | "create"
  | "update"
  | "delete"
  | "invite"
  | "accept"
  | "login"
  | "logout";

export interface AuditEntry {
  tenantId: string | null;
  actorUserId: string;
  action: AuditAction | string;
  entityType: string;
  entityId?: string | null;
  metadata?: Json;
}

export async function logAudit(
  entry: AuditEntry,
  client?: SupabaseClient<Database>,
): Promise<void> {
  const admin = client ?? createAdminClient();
  await admin.from("audit_logs").insert({
    tenant_id: entry.tenantId,
    actor_user_id: entry.actorUserId,
    action: entry.action,
    entity_type: entry.entityType,
    entity_id: entry.entityId ?? null,
    metadata: entry.metadata ?? {},
  });
}
