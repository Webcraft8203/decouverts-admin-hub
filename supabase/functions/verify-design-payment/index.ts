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

    // Verify the design request belongs to the user and get details
    const { data: request, error: requestError } = await supabase
      .from("design_requests")
      .select("*")
      .eq("id", design_request_id)
      .eq("user_id", user.id)
      .single();

    if (requestError || !request) {
      throw new Error("Design request not found");
    }

    // Validate that price is locked and final amount is set
    if (!request.price_locked || !request.final_amount) {
      throw new Error("Price not locked or final amount not set");
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

    // Generate order number
    const { data: orderNumberData, error: orderNumberError } = await supabase
      .rpc("generate_order_number");

    if (orderNumberError) {
      console.error("Failed to generate order number:", orderNumberError);
      throw new Error("Failed to generate order number");
    }

    const orderNumber = orderNumberData;

    // Get user's default address for shipping
    const { data: userAddress } = await supabase
      .from("user_addresses")
      .select("*")
      .eq("user_id", user.id)
      .eq("is_default", true)
      .single();

    // Create shipping address JSON from user address or use placeholder
    const shippingAddress = userAddress ? {
      full_name: userAddress.full_name,
      phone: userAddress.phone,
      address_line1: userAddress.address_line1,
      address_line2: userAddress.address_line2,
      city: userAddress.city,
      state: userAddress.state,
      postal_code: userAddress.postal_code,
      country: userAddress.country,
    } : null;

    // Create order from design request
    const { data: newOrder, error: orderError } = await supabase
      .from("orders")
      .insert({
        user_id: user.id,
        order_number: orderNumber,
        order_type: "custom_design",
        design_request_id: design_request_id,
        status: "confirmed",
        payment_status: "paid",
        payment_id: razorpay_payment_id,
        subtotal: request.final_amount,
        tax_amount: 0,
        shipping_amount: 0,
        total_amount: request.final_amount,
        shipping_address: shippingAddress,
        address_id: userAddress?.id || null,
        notes: `Custom Print Order - ${request.file_name || 'Design'} | Qty: ${request.quantity} | Size: ${request.size || 'Standard'}`,
      })
      .select()
      .single();

    if (orderError) {
      console.error("Failed to create order:", orderError);
      throw new Error("Failed to create order");
    }

    console.log("Order created:", newOrder.id);

    // Create order item for the custom design
    const { error: orderItemError } = await supabase
      .from("order_items")
      .insert({
        order_id: newOrder.id,
        product_name: `Custom Print - ${request.file_name || 'Design'}`,
        product_price: request.final_amount,
        quantity: request.quantity || 1,
        total_price: request.final_amount,
        product_id: null, // No linked product for custom designs
      });

    if (orderItemError) {
      console.error("Failed to create order item:", orderItemError);
    }

    // Update design request status and mark as converted
    const { error: requestUpdateError } = await supabase
      .from("design_requests")
      .update({
        status: "paid",
        converted_to_order: true,
        updated_at: new Date().toISOString(),
      })
      .eq("id", design_request_id);

    if (requestUpdateError) {
      console.error("Failed to update request status:", requestUpdateError);
      throw new Error("Failed to update request status");
    }

    // Log activity
    try {
      await supabase.from("activity_logs").insert({
        admin_id: user.id,
        action_type: "custom_design_order_created",
        entity_type: "order",
        entity_id: newOrder.id,
        description: `Custom design order ${orderNumber} created after payment of ₹${request.final_amount}`,
        metadata: {
          payment_id: razorpay_payment_id,
          razorpay_order_id: razorpay_order_id,
          amount: request.final_amount,
          design_request_id: design_request_id,
        },
      });
    } catch {
      // Ignore activity log errors
    }

    console.log("Design payment verified and order created successfully");

    return new Response(
      JSON.stringify({ 
        success: true, 
        order_id: newOrder.id,
        order_number: orderNumber,
      }),
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