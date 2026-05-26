import type { TenantContext } from "@/lib/auth/tenant-context";

export type Permission = "tenant.read" | "tenant.manage" | "members.manage" | "billing.manage" | "audit.read";

const rolePermissions: Record<string, Permission[]> = {
  platform_admin: ["tenant.read", "tenant.manage", "members.manage", "billing.manage", "audit.read"],
  tenant_owner: ["tenant.read", "tenant.manage", "members.manage", "billing.manage", "audit.read"],
  tenant_admin: ["tenant.read", "members.manage", "audit.read"],
  member: ["tenant.read"],
  viewer: ["tenant.read"],
};

export function can(context: TenantContext | null, permission: Permission) {
  if (!context) {
    return false;
  }

  return rolePermissions[context.role]?.includes(permission) ?? false;
}
