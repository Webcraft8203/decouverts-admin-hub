import { createContext, useContext, useEffect, useState, ReactNode } from "react";
import { User, Session } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";

interface AuthContextType {
  user: User | null;
  session: Session | null;
  isAdmin: boolean;
  isLoading: boolean;
  isAdminResolved: boolean; // New flag to indicate admin check is complete
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isAdminResolved, setIsAdminResolved] = useState(false);

  const checkAdminStatus = async (userId: string): Promise<boolean> => {
    try {
      const { data, error } = await supabase
        .from("user_roles")
        .select("role")
        .eq("user_id", userId)
        .eq("role", "admin")
        .maybeSingle();

      if (error) {
        console.error("Error checking admin status:", error);
        return false;
      }
      return !!data;
    } catch (error) {
      console.error("Error in checkAdminStatus:", error);
      return false;
    }
  };

  useEffect(() => {
    let isMounted = true;

    const initializeAuth = async () => {
      // Get the initial session first
      const { data: { session: initialSession } } = await supabase.auth.getSession();
      
      if (!isMounted) return;

      if (initialSession?.user) {
        setSession(initialSession);
        setUser(initialSession.user);
        
        // CRITICAL: Check admin status BEFORE setting isLoading to false
        const adminStatus = await checkAdminStatus(initialSession.user.id);
        if (isMounted) {
          setIsAdmin(adminStatus);
          setIsAdminResolved(true);
          setIsLoading(false);
        }
      } else {
        setSession(null);
        setUser(null);
        setIsAdmin(false);
        setIsAdminResolved(true);
        setIsLoading(false);
      }
    };

    // Set up auth state listener
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, newSession) => {
        if (!isMounted) return;

        // For auth state changes after initial load
        if (event === 'SIGNED_IN' || event === 'TOKEN_REFRESHED') {
          setSession(newSession);
          setUser(newSession?.user ?? null);
          
          if (newSession?.user) {
            // Reset resolved state while checking
            setIsAdminResolved(false);
            
            // Use setTimeout(0) to avoid Supabase deadlock
            setTimeout(async () => {
              if (!isMounted) return;
              const adminStatus = await checkAdminStatus(newSession.user.id);
              if (isMounted) {
                setIsAdmin(adminStatus);
                setIsAdminResolved(true);
              }
            }, 0);
          }
        } else if (event === 'SIGNED_OUT') {
          setSession(null);
          setUser(null);
          setIsAdmin(false);
          setIsAdminResolved(true);
        }
      }
    );

    // Initialize on mount
    initializeAuth();

    return () => {
      isMounted = false;
      subscription.unsubscribe();
    };
  }, []);

  const signOut = async () => {
    await supabase.auth.signOut();
    setUser(null);
    setSession(null);
    setIsAdmin(false);
    setIsAdminResolved(true);
  };

  return (
    <AuthContext.Provider value={{ user, session, isAdmin, isLoading, isAdminResolved, signOut }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
