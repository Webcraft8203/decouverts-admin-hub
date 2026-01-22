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
    const { form_type, success } = await req.json();
    
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
    
    console.log(`[Rate Limit] Recording form submission for IP: ${clientIp}, form: ${form_type}, success: ${success}`);

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Record the submission attempt
    const { error: recordError } = await supabase.rpc("record_login_attempt", {
      _ip_address: clientIp,
      _email: null,
      _portal_type: `form_${form_type}`,
      _success: success ?? true,
    });

    if (recordError) {
      console.error("[Rate Limit] Record error:", recordError);
    }

    return new Response(
      JSON.stringify({ recorded: true }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("[Rate Limit] Error:", error);
    return new Response(
      JSON.stringify({ recorded: false, error: "Failed to record submission" }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
