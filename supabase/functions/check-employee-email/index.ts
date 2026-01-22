import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-forwarded-for, x-real-ip",
};

interface CheckEmployeeRequest {
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

    const { email }: CheckEmployeeRequest = await req.json();
    const clientIP = getClientIP(req);

    console.log("Employee login attempt from IP:", clientIP, "for email:", email);

    if (!email) {
      return new Response(
        JSON.stringify({ error: "Email is required", isEmployee: false }),
        { status: 400, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    // Check if IP is throttled (5 attempts per 15 minutes)
    const { data: throttleCheck, error: throttleError } = await supabase.rpc(
      "check_ip_throttle",
      { _ip_address: clientIP, _portal_type: "employee", _max_attempts: 5, _window_minutes: 15 }
    );

    if (throttleError) {
      console.error("Error checking throttle:", throttleError);
    } else if (throttleCheck?.blocked) {
      console.log("IP blocked due to too many attempts:", clientIP);
      const waitMinutes = Math.ceil((throttleCheck.wait_seconds || 900) / 60);
      return new Response(
        JSON.stringify({ 
          error: `Too many login attempts. Please try again in ${waitMinutes} minutes.`,
          isEmployee: false,
          blocked: true,
          waitSeconds: throttleCheck.wait_seconds
        }),
        { status: 429, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    console.log("Checking employee status for email:", email);

    // Check if email exists in employees table and is active
    const { data: employeeData, error: employeeError } = await supabase
      .from("employees")
      .select("id, employee_name, is_active")
      .eq("employee_email", email.toLowerCase())
      .maybeSingle();

    if (employeeError) {
      console.error("Error checking employee:", employeeError);
      // Record failed attempt
      await supabase.rpc("record_login_attempt", {
        _ip_address: clientIP,
        _email: email,
        _portal_type: "employee",
        _success: false
      });
      return new Response(
        JSON.stringify({ error: "Failed to verify employee status", isEmployee: false }),
        { status: 500, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    if (!employeeData) {
      console.log("Employee not found with email:", email);
      // Record failed attempt
      await supabase.rpc("record_login_attempt", {
        _ip_address: clientIP,
        _email: email,
        _portal_type: "employee",
        _success: false
      });
      return new Response(
        JSON.stringify({ isEmployee: false, message: "Email not registered as an employee" }),
        { status: 200, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    if (!employeeData.is_active) {
      console.log("Employee account is deactivated:", email);
      // Record failed attempt for deactivated account
      await supabase.rpc("record_login_attempt", {
        _ip_address: clientIP,
        _email: email,
        _portal_type: "employee",
        _success: false
      });
      return new Response(
        JSON.stringify({ isEmployee: false, isDeactivated: true, message: "Employee account is deactivated" }),
        { status: 200, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    console.log("Found active employee:", employeeData.employee_name);

    // Record successful verification and clear previous failures
    await supabase.rpc("record_login_attempt", {
      _ip_address: clientIP,
      _email: email,
      _portal_type: "employee",
      _success: true
    });
    await supabase.rpc("clear_login_attempts", {
      _ip_address: clientIP,
      _portal_type: "employee"
    });

    return new Response(
      JSON.stringify({ 
        isEmployee: true, 
        employeeName: employeeData.employee_name 
      }),
      { status: 200, headers: { "Content-Type": "application/json", ...corsHeaders } }
    );

  } catch (error: any) {
    console.error("Error in check-employee-email function:", error);
    return new Response(
      JSON.stringify({ error: error.message, isEmployee: false }),
      { status: 500, headers: { "Content-Type": "application/json", ...corsHeaders } }
    );
  }
});
