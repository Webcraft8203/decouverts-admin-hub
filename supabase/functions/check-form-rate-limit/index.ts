import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

Deno.serve(async (req) => {
  // Handle CORS preflight
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { form_type } = await req.json();
    
    if (!form_type) {
      return new Response(
        JSON.stringify({ error: "form_type is required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Extract client IP from headers
    const forwardedFor = req.headers.get("x-forwarded-for");
    const realIp = req.headers.get("x-real-ip");
    const cfConnectingIp = req.headers.get("cf-connecting-ip");
    
    const clientIp = forwardedFor?.split(",")[0]?.trim() || realIp || cfConnectingIp || "unknown";
    
    console.log(`[Rate Limit] Checking form submission for IP: ${clientIp}, form: ${form_type}`);

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Check if IP is rate limited (3 submissions per 10 minutes for forms)
    const { data: throttleResult, error: throttleError } = await supabase.rpc(
      "check_ip_throttle",
      {
        _ip_address: clientIp,
        _portal_type: `form_${form_type}`,
        _max_attempts: 3,
        _window_minutes: 10,
      }
    );

    if (throttleError) {
      console.error("[Rate Limit] Throttle check error:", throttleError);
      // Allow submission if throttle check fails (fail open for forms)
      return new Response(
        JSON.stringify({ allowed: true }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    console.log(`[Rate Limit] Throttle result for ${clientIp}:`, throttleResult);

    if (throttleResult?.blocked) {
      const waitSeconds = Math.ceil(throttleResult.wait_seconds || 600);
      console.log(`[Rate Limit] IP ${clientIp} is rate limited for ${waitSeconds}s`);
      
      return new Response(
        JSON.stringify({
          allowed: false,
          blocked: true,
          wait_seconds: waitSeconds,
          message: `Too many submissions. Please wait ${Math.ceil(waitSeconds / 60)} minutes before trying again.`,
        }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    return new Response(
      JSON.stringify({
        allowed: true,
        blocked: false,
        remaining: throttleResult?.remaining || 3,
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("[Rate Limit] Error:", error);
    // Fail open - allow submission if there's an error
    return new Response(
      JSON.stringify({ allowed: true, error: "Rate limit check failed" }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
