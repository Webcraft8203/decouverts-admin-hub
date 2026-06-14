import { createContext, useContext, useEffect, useRef, useState, ReactNode } from "react";
import { User, Session } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";

interface AuthContextType {
  user: User | null;
  session: Session | null;
  isAdmin: boolean;
  isLoading: boolean;
  isAdminResolved: boolean;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const INACTIVITY_LIMIT_MS = 10 * 60 * 1000; // 10 minutes
const ACTIVITY_KEY = "auth:lastActivity";
const ADMIN_CACHE_KEY = "auth:isAdminCache"; // { userId, isAdmin, ts }
const ADMIN_CACHE_TTL_MS = 30 * 60 * 1000; // 30 minutes

const readActivity = (): number => {
  try {
    const v = localStorage.getItem(ACTIVITY_KEY);
    return v ? parseInt(v, 10) : Date.now();
  } catch {
    return Date.now();
  }
};

const writeActivity = (ts: number) => {
  try {
    localStorage.setItem(ACTIVITY_KEY, String(ts));
  } catch {}
};

const readAdminCache = (userId: string): boolean | null => {
  try {
    const raw = localStorage.getItem(ADMIN_CACHE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as { userId: string; isAdmin: boolean; ts: number };
    if (parsed.userId !== userId) return null;
    if (Date.now() - parsed.ts > ADMIN_CACHE_TTL_MS) return null;
    return !!parsed.isAdmin;
  } catch {
    return null;
  }
};

const writeAdminCache = (userId: string, isAdmin: boolean) => {
  try {
    localStorage.setItem(
      ADMIN_CACHE_KEY,
      JSON.stringify({ userId, isAdmin, ts: Date.now() })
    );
  } catch {}
};

const clearAdminCache = () => {
  try {
    localStorage.removeItem(ADMIN_CACHE_KEY);
  } catch {}
};

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isAdminResolved, setIsAdminResolved] = useState(false);
  const lastVerifiedUserIdRef = useRef<string | null>(null);

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

    // Activity tracking — survives tab switches via localStorage
    const bump = () => writeActivity(Date.now());
    const activityEvents: (keyof WindowEventMap)[] = [
      "mousemove",
      "mousedown",
      "keydown",
      "scroll",
      "touchstart",
      "click",
    ];
    activityEvents.forEach((e) =>
      window.addEventListener(e, bump, { passive: true })
    );
    // Seed activity timestamp on mount
    bump();

    const initializeAuth = async () => {
      const { data: { session: initialSession } } = await supabase.auth.getSession();
      if (!isMounted) return;

      if (initialSession?.user) {
        setSession(initialSession);
        setUser(initialSession.user);

        // Try cache first to avoid the spinner
        const cached = readAdminCache(initialSession.user.id);
        if (cached !== null) {
          setIsAdmin(cached);
          setIsAdminResolved(true);
          setIsLoading(false);
          lastVerifiedUserIdRef.current = initialSession.user.id;
          // Refresh in background
          checkAdminStatus(initialSession.user.id).then((status) => {
            if (!isMounted) return;
            writeAdminCache(initialSession.user.id, status);
            setIsAdmin(status);
          });
          return;
        }

        const adminStatus = await checkAdminStatus(initialSession.user.id);
        if (!isMounted) return;
        writeAdminCache(initialSession.user.id, adminStatus);
        setIsAdmin(adminStatus);
        setIsAdminResolved(true);
        setIsLoading(false);
        lastVerifiedUserIdRef.current = initialSession.user.id;
      } else {
        setSession(null);
        setUser(null);
        setIsAdmin(false);
        setIsAdminResolved(true);
        setIsLoading(false);
      }
    };

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, newSession) => {
        if (!isMounted) return;

        if (event === "SIGNED_OUT") {
          clearAdminCache();
          lastVerifiedUserIdRef.current = null;
          setSession(null);
          setUser(null);
          setIsAdmin(false);
          setIsAdminResolved(true);
          return;
        }

        if (event === "SIGNED_IN" || event === "TOKEN_REFRESHED" || event === "USER_UPDATED") {
          setSession(newSession);
          setUser(newSession?.user ?? null);

          if (!newSession?.user) {
            setIsAdmin(false);
            setIsAdminResolved(true);
            return;
          }

          const userId = newSession.user.id;

          // If we've already verified this same user, do NOT flip resolved off.
          // Token refreshes / tab focus must not trigger the verifying spinner.
          if (lastVerifiedUserIdRef.current === userId && isAdminResolved) {
            return;
          }

          // Use cache if available — instant, no spinner
          const cached = readAdminCache(userId);
          if (cached !== null) {
            setIsAdmin(cached);
            setIsAdminResolved(true);
            lastVerifiedUserIdRef.current = userId;
            setTimeout(async () => {
              if (!isMounted) return;
              const status = await checkAdminStatus(userId);
              if (!isMounted) return;
              writeAdminCache(userId, status);
              setIsAdmin(status);
            }, 0);
            return;
          }

          // First time seeing this user this session — verify
          setTimeout(async () => {
            if (!isMounted) return;
            const status = await checkAdminStatus(userId);
            if (!isMounted) return;
            writeAdminCache(userId, status);
            setIsAdmin(status);
            setIsAdminResolved(true);
            lastVerifiedUserIdRef.current = userId;
          }, 0);
        }
      }
    );

    // Visibility handler: only re-verify after >10 min of inactivity
    const onVisibility = async () => {
      if (document.visibilityState !== "visible") return;
      const inactive = Date.now() - readActivity();
      if (inactive < INACTIVITY_LIMIT_MS) return; // skip — keep session as-is

      // Inactive too long — validate session
      const { data: { session: current } } = await supabase.auth.getSession();
      if (!isMounted) return;

      if (!current?.user) {
        clearAdminCache();
        lastVerifiedUserIdRef.current = null;
        setSession(null);
        setUser(null);
        setIsAdmin(false);
        setIsAdminResolved(true);
        return;
      }

      // Refresh admin status silently (no spinner flip)
      const status = await checkAdminStatus(current.user.id);
      if (!isMounted) return;
      writeAdminCache(current.user.id, status);
      setSession(current);
      setUser(current.user);
      setIsAdmin(status);
      setIsAdminResolved(true);
      lastVerifiedUserIdRef.current = current.user.id;
      bump();
    };
    document.addEventListener("visibilitychange", onVisibility);

    initializeAuth();

    return () => {
      isMounted = false;
      subscription.unsubscribe();
      document.removeEventListener("visibilitychange", onVisibility);
      activityEvents.forEach((e) => window.removeEventListener(e, bump));
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const signOut = async () => {
    clearAdminCache();
    lastVerifiedUserIdRef.current = null;
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
