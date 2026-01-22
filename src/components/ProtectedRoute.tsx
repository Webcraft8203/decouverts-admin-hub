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
  const { user, isAdmin, isLoading } = useAuth();
  const [hasAdminAccess, setHasAdminAccess] = useState<boolean | null>(null);
  const [checkingAccess, setCheckingAccess] = useState(false);

  useEffect(() => {
    const checkAdminAccess = async () => {
      if (!user || !requireAdmin) {
        setHasAdminAccess(null);
        return;
      }

      // If already admin, no need to check further
      if (isAdmin) {
        setHasAdminAccess(true);
        return;
      }

      setCheckingAccess(true);
      try {
        // Check if user is an active employee
        const { data: sessionData } = await supabase.auth.getSession();
        const token = sessionData.session?.access_token;

        if (!token) {
          setHasAdminAccess(false);
          setCheckingAccess(false);
          return;
        }

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
        setHasAdminAccess(employees && employees.length > 0);
      } catch (error) {
        console.error("Error checking admin access:", error);
        setHasAdminAccess(false);
      } finally {
        setCheckingAccess(false);
      }
    };

    if (!isLoading && user && requireAdmin) {
      checkAdminAccess();
    }
  }, [user, isAdmin, isLoading, requireAdmin]);

  if (isLoading || (requireAdmin && checkingAccess)) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <p className="text-muted-foreground">Loading...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return <Navigate to={requireAdmin ? "/auth" : "/login"} replace />;
  }

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

  // Allow access if admin OR active employee
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