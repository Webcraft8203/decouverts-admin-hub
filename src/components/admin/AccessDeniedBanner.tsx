import { useLocation } from "react-router-dom";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { ShieldX } from "lucide-react";

interface AccessDeniedBannerProps {
  className?: string;
}

/**
 * Shows an access denied message when a user was redirected due to insufficient permissions.
 */
export function AccessDeniedBanner({ className }: AccessDeniedBannerProps) {
  const location = useLocation();
  const state = location.state as { accessDenied?: boolean; attemptedPath?: string } | null;

  if (!state?.accessDenied) {
    return null;
  }

  return (
    <Alert variant="destructive" className={className}>
      <ShieldX className="h-4 w-4" />
      <AlertTitle>Access Denied</AlertTitle>
      <AlertDescription>
        You don't have permission to access {state.attemptedPath || "that page"}.
        Please contact your administrator if you believe this is an error.
      </AlertDescription>
    </Alert>
  );
}

/**
 * Permissions info card removed along with the employee/RBAC system.
 * Kept as a no-op export for backward compatibility with existing imports.
 */
export function PermissionsInfoCard() {
  return null;
}
