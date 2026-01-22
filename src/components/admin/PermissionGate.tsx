import { ReactNode } from "react";
import { usePermissions, EmployeePermission } from "@/hooks/useEmployeePermissions";

interface PermissionGateProps {
  children: ReactNode;
  /** Required permission(s) - if array, user needs ANY of them */
  permission: EmployeePermission | EmployeePermission[];
  /** If true, requires ALL permissions instead of ANY */
  requireAll?: boolean;
  /** Fallback content to show when permission is denied (optional, defaults to null) */
  fallback?: ReactNode;
}

/**
 * A component that conditionally renders children based on user permissions.
 * Use this to hide buttons, actions, and UI elements based on permissions.
 * 
 * @example
 * // Single permission
 * <PermissionGate permission="manage_products">
 *   <Button>Add Product</Button>
 * </PermissionGate>
 * 
 * @example
 * // Multiple permissions (ANY)
 * <PermissionGate permission={["view_orders", "update_orders"]}>
 *   <OrdersTable />
 * </PermissionGate>
 * 
 * @example
 * // Multiple permissions (ALL required)
 * <PermissionGate permission={["generate_invoices", "download_invoices"]} requireAll>
 *   <InvoiceActions />
 * </PermissionGate>
 */
export function PermissionGate({ 
  children, 
  permission, 
  requireAll = false,
  fallback = null 
}: PermissionGateProps) {
  const { isSuperAdmin, hasPermission, hasAnyPermission } = usePermissions();

  // Super admins always have access
  if (isSuperAdmin) {
    return <>{children}</>;
  }

  const permissions = Array.isArray(permission) ? permission : [permission];

  let hasAccess: boolean;
  
  if (requireAll) {
    // User needs ALL permissions
    hasAccess = permissions.every(p => hasPermission(p));
  } else {
    // User needs ANY permission
    hasAccess = hasAnyPermission(permissions);
  }

  if (hasAccess) {
    return <>{children}</>;
  }

  return <>{fallback}</>;
}

/**
 * Hook to check if user has permission (for conditional logic outside JSX)
 */
export function useHasPermission(
  permission: EmployeePermission | EmployeePermission[],
  requireAll = false
): boolean {
  const { isSuperAdmin, hasPermission, hasAnyPermission } = usePermissions();

  if (isSuperAdmin) return true;

  const permissions = Array.isArray(permission) ? permission : [permission];

  if (requireAll) {
    return permissions.every(p => hasPermission(p));
  }

  return hasAnyPermission(permissions);
}
