import { Navigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Loader2 } from "lucide-react";

interface ProtectedRouteProps {
  children: React.ReactNode;
  requireAdmin?: boolean;
}

export function ProtectedRoute({ children, requireAdmin = false }: ProtectedRouteProps) {
  const { user, isAdmin, isLoading, isAdminResolved } = useAuth();
  const [hasAdminAccess, setHasAdminAccess] = useState<boolean | null>(null);
  const [checkingAccess, setCheckingAccess] = useState(false);

  useEffect(() => {
    const checkAndLinkEmployee = async () => {
      if (!user || !requireAdmin) {
        setHasAdminAccess(null);
        return;
      }

      // CRITICAL: Wait for admin status to be fully resolved before making decisions
      if (!isAdminResolved) {
        return;
      }

      // If user is confirmed as admin, grant access immediately
      if (isAdmin) {
        console.log("[ProtectedRoute] User is admin - granting access");
        setHasAdminAccess(true);
        return;
      }

      // Only check employee status if user is NOT an admin
      console.log("[ProtectedRoute] User is not admin - checking employee status");
      setCheckingAccess(true);
      
      try {
        const { data: sessionData } = await supabase.auth.getSession();
        const token = sessionData.session?.access_token;

        if (!token) {
          setHasAdminAccess(false);
          setCheckingAccess(false);
          return;
        }

        // First check if already linked as active employee
        const response = await fetch(
          `${import.meta.env.VITE_SUPABASE_URL}/rest/v1/employees?user_id=eq.${user.id}&is_active=eq.true&select=id`,
          {
            headers: {
              'apikey': import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY,
              'Authorization': `Bearer ${token}`,
            },
          }
        );
        const employees = await response.json();

        if (employees && employees.length > 0) {
          // Already linked as active employee
          console.log("[ProtectedRoute] User is active employee - granting access");
          setHasAdminAccess(true);
        } else if (user.email) {
          // Try to link by email
          console.log("[ProtectedRoute] Attempting to link employee account for:", user.email);
          const { data: linkData, error: linkError } = await supabase.functions.invoke("link-employee-account", {
            body: { email: user.email, userId: user.id },
          });

          if (linkError) {
            console.error("[ProtectedRoute] Error linking employee:", linkError);
            setHasAdminAccess(false);
          } else if (linkData?.linked) {
            console.log("[ProtectedRoute] Employee account linked successfully");
            setHasAdminAccess(true);
          } else {
            console.log("[ProtectedRoute] Could not link employee account:", linkData?.error);
            setHasAdminAccess(false);
          }
        } else {
          setHasAdminAccess(false);
        }
      } catch (error) {
        console.error("[ProtectedRoute] Error checking admin access:", error);
        setHasAdminAccess(false);
      } finally {
        setCheckingAccess(false);
      }
    };

    // Only run when auth is fully loaded AND admin status is resolved
    if (!isLoading && isAdminResolved && user && requireAdmin) {
      checkAndLinkEmployee();
    }
  }, [user, isAdmin, isLoading, isAdminResolved, requireAdmin]);

  // Show loading while auth is initializing OR admin status is being resolved
  if (isLoading || !isAdminResolved || (requireAdmin && checkingAccess)) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <p className="text-muted-foreground">
            {!isAdminResolved ? "Verifying identity..." : "Loading..."}
          </p>
        </div>
      </div>
    );
  }

  if (!user) {
    return <Navigate to={requireAdmin ? "/auth" : "/login"} replace />;
  }

  // For admin routes: admin users get immediate access
  if (requireAdmin && isAdmin) {
    return <>{children}</>;
  }

  // For admin routes: non-admin users need employee access check
  if (requireAdmin && !isAdmin && hasAdminAccess === false) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center space-y-4">
          <h1 className="text-2xl font-bold text-destructive">Access Denied</h1>
          <p className="text-muted-foreground">
            You do not have admin privileges to access this area.
          </p>
        </div>
      </div>
    );
  }

  // Still waiting for employee check
  if (requireAdmin && !isAdmin && hasAdminAccess === null) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <p className="text-muted-foreground">Verifying access...</p>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}
