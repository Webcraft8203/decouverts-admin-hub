/**
 * RBAC shim - Employee/permission system has been removed.
 *
 * Admin access is now super-admin only. This file is preserved as a
 * compatibility shim so existing imports do not break. All permission
 * checks resolve from `isSuperAdmin` only; there are no employees.
 */
import { ReactNode, createContext, useContext } from "react";
import { useAuth } from "@/hooks/useAuth";

// Permission strings are no longer enforced. Kept as `string` for type compat.
export type EmployeePermission = string;

interface PermissionsContextValue {
  isLoading: boolean;
  isSuperAdmin: boolean;
  isEmployee: false;
  employeeInfo: null;
  permissions: EmployeePermission[];
  hasPermission: (_p: EmployeePermission) => boolean;
  hasAnyPermission: (_p: EmployeePermission[]) => boolean;
  hasAllPermissions: (_p: EmployeePermission[]) => boolean;
  canAccessRoute: (_path: string) => boolean;
}

const PermissionsContext = createContext<PermissionsContextValue | null>(null);

export function PermissionsProvider({ children }: { children: ReactNode }) {
  const { isAdmin, isLoading, isAdminResolved } = useAuth();
  const isSuperAdmin = !!isAdmin;

  const value: PermissionsContextValue = {
    isLoading: isLoading || !isAdminResolved,
    isSuperAdmin,
    isEmployee: false,
    employeeInfo: null,
    permissions: [],
    hasPermission: () => isSuperAdmin,
    hasAnyPermission: () => isSuperAdmin,
    hasAllPermissions: () => isSuperAdmin,
    canAccessRoute: () => isSuperAdmin,
  };

  return (
    <PermissionsContext.Provider value={value}>
      {children}
    </PermissionsContext.Provider>
  );
}

export function usePermissions(): PermissionsContextValue {
  const ctx = useContext(PermissionsContext);
  if (ctx) return ctx;
  // Fallback when used outside provider — assume not super admin.
  return {
    isLoading: false,
    isSuperAdmin: false,
    isEmployee: false,
    employeeInfo: null,
    permissions: [],
    hasPermission: () => false,
    hasAnyPermission: () => false,
    hasAllPermissions: () => false,
    canAccessRoute: () => false,
  };
}
