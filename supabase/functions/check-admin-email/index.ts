import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-forwarded-for, x-real-ip",
};

interface CheckAdminRequest {
  email: string;
}

// Extract client IP from request headers
function getClientIP(req: Request): string {
  // Try various headers that might contain the real IP
  const forwardedFor = req.headers.get("x-forwarded-for");
  if (forwardedFor) {
    // x-forwarded-for can contain multiple IPs, take the first one
    return forwardedFor.split(",")[0].trim();
  }
  
  const realIP = req.headers.get("x-real-ip");
  if (realIP) {
    return realIP.trim();
  }
  
  const cfConnectingIP = req.headers.get("cf-connecting-ip");
  if (cfConnectingIP) {
    return cfConnectingIP.trim();
  }
  
  // Fallback - this shouldn't happen in production
  return "unknown";
}

serve(async (req: Request): Promise<Response> => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const { email }: CheckAdminRequest = await req.json();
    const clientIP = getClientIP(req);

    console.log("Login attempt from IP:", clientIP, "for email:", email);

    if (!email) {
      return new Response(
        JSON.stringify({ error: "Email is required", isAdmin: false }),
        { status: 400, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    // Check if IP is throttled (5 attempts per 15 minutes)
    const { data: throttleCheck, error: throttleError } = await supabase.rpc(
      "check_ip_throttle",
      { _ip_address: clientIP, _portal_type: "admin", _max_attempts: 5, _window_minutes: 15 }
    );

    if (throttleError) {
      console.error("Error checking throttle:", throttleError);
    } else if (throttleCheck?.blocked) {
      console.log("IP blocked due to too many attempts:", clientIP);
      const waitMinutes = Math.ceil((throttleCheck.wait_seconds || 900) / 60);
      return new Response(
        JSON.stringify({ 
          error: `Too many login attempts. Please try again in ${waitMinutes} minutes.`,
          isAdmin: false,
          blocked: true,
          waitSeconds: throttleCheck.wait_seconds
        }),
        { status: 429, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    console.log("Checking admin status for email:", email);

    // First, find the user by email
    const { data: userData, error: userError } = await supabase.auth.admin.listUsers();

    if (userError) {
      console.error("Error fetching users:", userError);
      // Record failed attempt
      await supabase.rpc("record_login_attempt", {
        _ip_address: clientIP,
        _email: email,
        _portal_type: "admin",
        _success: false
      });
      return new Response(
        JSON.stringify({ error: "Failed to verify email", isAdmin: false }),
        { status: 500, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    // Find user with matching email
    const user = userData.users.find(u => u.email?.toLowerCase() === email.toLowerCase());

    if (!user) {
      console.log("User not found with email:", email);
      // Record failed attempt
      await supabase.rpc("record_login_attempt", {
        _ip_address: clientIP,
        _email: email,
        _portal_type: "admin",
        _success: false
      });
      return new Response(
        JSON.stringify({ isAdmin: false, message: "Email not registered" }),
        { status: 200, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    console.log("Found user with id:", user.id);

    // Check if user has admin role
    const { data: roleData, error: roleError } = await supabase
      .from("user_roles")
      .select("role")
      .eq("user_id", user.id)
      .eq("role", "admin")
      .maybeSingle();

    if (roleError) {
      console.error("Error checking role:", roleError);
      // Record failed attempt
      await supabase.rpc("record_login_attempt", {
        _ip_address: clientIP,
        _email: email,
        _portal_type: "admin",
        _success: false
      });
      return new Response(
        JSON.stringify({ error: "Failed to verify admin status", isAdmin: false }),
        { status: 500, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    const isAdmin = !!roleData;
    console.log("User is admin:", isAdmin);

    if (!isAdmin) {
      // Record failed attempt for non-admin trying to access admin portal
      await supabase.rpc("record_login_attempt", {
        _ip_address: clientIP,
        _email: email,
        _portal_type: "admin",
        _success: false
      });
    } else {
      // Record successful verification and clear previous failures
      await supabase.rpc("record_login_attempt", {
        _ip_address: clientIP,
        _email: email,
        _portal_type: "admin",
        _success: true
      });
      await supabase.rpc("clear_login_attempts", {
        _ip_address: clientIP,
        _portal_type: "admin"
      });
    }

    return new Response(
      JSON.stringify({ isAdmin }),
      { status: 200, headers: { "Content-Type": "application/json", ...corsHeaders } }
    );

  } catch (error: any) {
    console.error("Error in check-admin-email function:", error);
    return new Response(
      JSON.stringify({ error: error.message, isAdmin: false }),
      { status: 500, headers: { "Content-Type": "application/json", ...corsHeaders } }
    );
  }
});
