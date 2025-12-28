import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { createHmac } from "https://deno.land/std@0.168.0/node/crypto.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const RAZORPAY_KEY_SECRET = Deno.env.get("RAZORPAY_KEY_SECRET");
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

    if (!RAZORPAY_KEY_SECRET) {
      throw new Error("Razorpay credentials not configured");
    }

    // Verify user authentication
    const authHeader = req.headers.get("authorization") || "";
    const token = authHeader.replace("Bearer ", "");
    
    const supabase = createClient(supabaseUrl, supabaseServiceKey);
    
    const { data: userData, error: userError } = await supabase.auth.getUser(token);
    
    if (userError || !userData?.user) {
      console.error("Auth failed:", userError?.message);
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 401,
      });
    }

    const user = userData.user;
    const {
      razorpay_order_id,
      razorpay_payment_id,
      razorpay_signature,
      design_request_id,
    } = await req.json();

    console.log("Verifying design payment:", razorpay_order_id, "for request:", design_request_id);

    // Verify signature
    const body = razorpay_order_id + "|" + razorpay_payment_id;
    const expectedSignature = createHmac("sha256", RAZORPAY_KEY_SECRET)
      .update(body)
      .digest("hex");

    if (expectedSignature !== razorpay_signature) {
      console.error("Signature mismatch");
      throw new Error("Payment verification failed - invalid signature");
    }

    console.log("Payment signature verified");

    // Verify the design request belongs to the user
    const { data: request, error: requestError } = await supabase
      .from("design_requests")
      .select("*")
      .eq("id", design_request_id)
      .eq("user_id", user.id)
      .single();

    if (requestError || !request) {
      throw new Error("Design request not found");
    }

    // Update payment record
    const { error: paymentUpdateError } = await supabase
      .from("design_payments")
      .update({
        razorpay_payment_id,
        payment_status: "success",
        updated_at: new Date().toISOString(),
      })
      .eq("razorpay_order_id", razorpay_order_id);

    if (paymentUpdateError) {
      console.error("Failed to update payment:", paymentUpdateError);
    }

    // Update design request status
    const { error: requestUpdateError } = await supabase
      .from("design_requests")
      .update({
        status: "paid",
        updated_at: new Date().toISOString(),
      })
      .eq("id", design_request_id);

    if (requestUpdateError) {
      console.error("Failed to update request status:", requestUpdateError);
      throw new Error("Failed to update request status");
    }

    // Log activity (don't fail if this fails)
    try {
      await supabase.from("activity_logs").insert({
        admin_id: user.id,
        action_type: "payment_received",
        entity_type: "design_request",
        entity_id: design_request_id,
        description: `Payment of ₹${request.final_amount} received for design request`,
        metadata: {
          payment_id: razorpay_payment_id,
          order_id: razorpay_order_id,
          amount: request.final_amount,
        },
      });
    } catch {
      // Ignore activity log errors
    }

    console.log("Design payment verified successfully");

    return new Response(
      JSON.stringify({ success: true }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      }
    );
  } catch (error: any) {
    console.error("Error verifying design payment:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 400,
      }
    );
  }
});
