import { ReactNode } from "react";
import { usePermissions, EmployeePermission } from "@/hooks/useEmployeePermissions";

interface PermissionGateProps {
  children: ReactNode;
  permission: EmployeePermission | EmployeePermission[];
  requireAll?: boolean;
  fallback?: ReactNode;
}

/**
 * RBAC shim - permission system removed. Only super admins ever see gated UI.
 */
export function PermissionGate({ children, fallback = null }: PermissionGateProps) {
  const { isSuperAdmin } = usePermissions();
  return <>{isSuperAdmin ? children : fallback}</>;
}

export function useHasPermission(
  _permission: EmployeePermission | EmployeePermission[],
  _requireAll = false
): boolean {
  const { isSuperAdmin } = usePermissions();
  return isSuperAdmin;
}
