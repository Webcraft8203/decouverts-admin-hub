import { ReactNode } from "react";

/**
 * RBAC shim - permission system removed. Admin auth gating is handled
 * upstream by <ProtectedRoute requireAdmin>, so this is now a pass-through.
 */
export function PermissionProtectedRoute({ children }: { children: ReactNode }) {
  return <>{children}</>;
}
