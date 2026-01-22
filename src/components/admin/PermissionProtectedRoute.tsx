import { ReactNode } from "react";
import { Navigate, useLocation } from "react-router-dom";
import { usePermissions } from "@/hooks/useEmployeePermissions";
import { Loader2 } from "lucide-react";

interface PermissionProtectedRouteProps {
  children: ReactNode;
}

/**
 * A wrapper component that checks if the user has permission to access the current route.
 * If not, redirects to the admin dashboard.
 * 
 * This works in conjunction with ProtectedRoute (which handles auth) and 
 * uses the ROUTE_PERMISSIONS mapping from useEmployeePermissions.
 */
export function PermissionProtectedRoute({ children }: PermissionProtectedRouteProps) {
  const { isLoading, canAccessRoute, isSuperAdmin, isEmployee } = usePermissions();
  const location = useLocation();

  // Show loading state while checking permissions
  // This ensures we don't make routing decisions with stale data
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <p className="text-muted-foreground">Checking permissions...</p>
        </div>
      </div>
    );
  }

  // CRITICAL: Super admins ALWAYS have access - no further checks needed
  if (isSuperAdmin) {
    console.log("[PermissionProtectedRoute] Super Admin - full access granted");
    return <>{children}</>;
  }

  // For employees, check route-level permissions
  const currentPath = location.pathname;
  
  // Handle dynamic routes (e.g., /admin/design-requests/:id)
  const basePath = currentPath.replace(/\/[^/]+$/, '').replace(/\/[a-f0-9-]{36}$/, '');
  
  // First try exact path, then base path for dynamic routes
  const hasAccess = canAccessRoute(currentPath) || 
                   (currentPath !== basePath && canAccessRoute(basePath));

  if (!hasAccess) {
    console.log("[PermissionProtectedRoute] Access denied for path:", currentPath);
    // Redirect to admin dashboard with access denied message
    return <Navigate to="/admin" state={{ accessDenied: true, attemptedPath: currentPath }} replace />;
  }

  return <>{children}</>;
}
