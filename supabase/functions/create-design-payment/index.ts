import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const RAZORPAY_KEY_ID = Deno.env.get("RAZORPAY_KEY_ID");
    const RAZORPAY_KEY_SECRET = Deno.env.get("RAZORPAY_KEY_SECRET");
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

    if (!RAZORPAY_KEY_ID || !RAZORPAY_KEY_SECRET) {
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
    const { designRequestId } = await req.json();

    console.log("Creating design payment for request:", designRequestId, "user:", user.id);

    // Fetch the design request and validate
    const { data: request, error: requestError } = await supabase
      .from("design_requests")
      .select("*")
      .eq("id", designRequestId)
      .eq("user_id", user.id)
      .single();

    if (requestError || !request) {
      throw new Error("Design request not found");
    }

    // Security checks
    if (!request.price_locked) {
      throw new Error("Price has not been locked by admin");
    }

    if (!request.final_amount) {
      throw new Error("No final amount set");
    }

    if (request.status !== "payment_pending") {
      throw new Error("Request is not in payment pending status");
    }

    // Amount in paise (multiply by 100)
    const amountInPaise = Math.round(Number(request.final_amount) * 100);

    if (amountInPaise < 100) {
      throw new Error("Payment amount must be at least ₹1");
    }

    console.log("Creating Razorpay order for amount:", request.final_amount, "paise:", amountInPaise);

    // Create order with Razorpay
    const auth = btoa(`${RAZORPAY_KEY_ID}:${RAZORPAY_KEY_SECRET}`);
    
    const orderResponse = await fetch("https://api.razorpay.com/v1/orders", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Basic ${auth}`,
      },
      body: JSON.stringify({
        amount: amountInPaise,
        currency: "INR",
        receipt: `design_${designRequestId.substring(0, 8)}`,
        notes: {
          designRequestId,
          userId: user.id,
          type: "custom_design_payment",
        },
      }),
    });

    if (!orderResponse.ok) {
      const errorText = await orderResponse.text();
      console.error("Razorpay error:", errorText);
      throw new Error("Failed to create Razorpay order");
    }

    const order = await orderResponse.json();

    console.log("Razorpay order created:", order.id);

    // Create payment record
    const { error: paymentError } = await supabase.from("design_payments").insert({
      design_request_id: designRequestId,
      razorpay_order_id: order.id,
      amount: request.final_amount,
      payment_status: "pending",
    });

    if (paymentError) {
      console.error("Failed to create payment record:", paymentError);
    }

    return new Response(
      JSON.stringify({
        orderId: order.id,
        amount: order.amount,
        currency: order.currency,
        keyId: RAZORPAY_KEY_ID,
      }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      }
    );
  } catch (error: any) {
    console.error("Error creating design payment:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 400,
      }
    );
  }
});
