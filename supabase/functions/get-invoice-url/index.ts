import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseAnonKey = Deno.env.get("SUPABASE_ANON_KEY")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

    const authHeader = req.headers.get("authorization") || "";

    // Verify the caller (end-user)
    const authClient = createClient(supabaseUrl, supabaseAnonKey, {
      global: {
        headers: { authorization: authHeader },
      },
    });

    const { data: userData, error: userError } = await authClient.auth.getUser();
    if (userError || !userData?.user) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 401,
      });
    }

    const user = userData.user;

    const { orderId } = await req.json();
    if (!orderId) throw new Error("Order ID is required");

    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const { data: order, error: orderError } = await supabase
      .from("orders")
      .select("id, user_id, invoice_url")
      .eq("id", orderId)
      .single();

    if (orderError || !order) throw new Error("Order not found");
    if (!order.invoice_url) throw new Error("Invoice not generated yet");

    const isOwner = order.user_id === user.id;

    if (!isOwner) {
      const { data: roleRow } = await supabase
        .from("user_roles")
        .select("id")
        .eq("user_id", user.id)
        .eq("role", "admin")
        .maybeSingle();

      if (!roleRow) {
        return new Response(JSON.stringify({ error: "Forbidden" }), {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
          status: 403,
        });
      }
    }

    const { data: signed, error: signError } = await supabase.storage
      .from("invoices")
      .createSignedUrl(order.invoice_url, 60 * 15); // 15 minutes

    if (signError || !signed?.signedUrl) {
      throw new Error("Failed to create invoice link");
    }

    return new Response(JSON.stringify({ signedUrl: signed.signedUrl }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    });
  } catch (error: any) {
    console.error("Error getting invoice URL:", error);
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 400,
    });
  }
});
