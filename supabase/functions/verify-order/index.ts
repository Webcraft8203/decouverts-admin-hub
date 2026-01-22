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
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const url = new URL(req.url);
    const orderId = url.searchParams.get("id");

    // Also accept POST body
    let orderIdFromBody: string | null = null;
    if (req.method === "POST") {
      try {
        const body = await req.json();
        orderIdFromBody = body.orderId || body.id;
      } catch {
        // Ignore JSON parse errors
      }
    }

    const finalOrderId = orderId || orderIdFromBody;

    if (!finalOrderId) {
      return new Response(
        JSON.stringify({
          success: false,
          error: "Order ID is required",
        }),
        {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
          status: 400,
        }
      );
    }

    console.log("Verifying order:", finalOrderId);

    // Fetch order with limited details (privacy-safe)
    const { data: order, error: orderError } = await supabase
      .from("orders")
      .select(`
        id,
        order_number,
        status,
        order_type,
        payment_status,
        courier_name,
        tracking_id,
        tracking_url,
        expected_delivery_date,
        shipped_at,
        delivered_at,
        created_at,
        shipment_id,
        shipping_address,
        total_amount,
        order_items(product_name, quantity)
      `)
      .eq("id", finalOrderId)
      .single();

    if (orderError || !order) {
      console.error("Order fetch error:", orderError);
      return new Response(
        JSON.stringify({
          success: false,
          error: "Order not found or invalid QR code",
        }),
        {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
          status: 404,
        }
      );
    }

    // Mask customer name for privacy (show only first name + first letter of last name)
    const shippingAddress = order.shipping_address as any;
    let maskedCustomerName = "Customer";
    if (shippingAddress?.full_name) {
      const nameParts = shippingAddress.full_name.split(" ");
      if (nameParts.length > 1) {
        maskedCustomerName = `${nameParts[0]} ${nameParts[1].charAt(0)}.`;
      } else {
        maskedCustomerName = nameParts[0];
      }
    }

    // Get delivery city/state only (no full address)
    const deliveryLocation = shippingAddress 
      ? `${shippingAddress.city || ""}, ${shippingAddress.state || ""}`
      : "Not available";

    // Build product summary
    const productSummary = order.order_items?.map((item: any) => ({
      name: item.product_name,
      quantity: item.quantity,
    })) || [];

    // Status display mapping
    const statusDisplayMap: Record<string, { label: string; color: string; icon: string }> = {
      "pending": { label: "Order Placed", color: "#f59e0b", icon: "⏳" },
      "confirmed": { label: "Order Confirmed", color: "#3b82f6", icon: "✅" },
      "packing": { label: "Packing", color: "#8b5cf6", icon: "📦" },
      "waiting-for-pickup": { label: "Ready for Pickup", color: "#f97316", icon: "🏪" },
      "shipped": { label: "Shipped", color: "#6366f1", icon: "🚚" },
      "out-for-delivery": { label: "Out for Delivery", color: "#06b6d4", icon: "🛵" },
      "delivered": { label: "Delivered", color: "#22c55e", icon: "✅" },
      "cancelled": { label: "Cancelled", color: "#ef4444", icon: "❌" },
    };

    const statusInfo = statusDisplayMap[order.status] || { 
      label: order.status, 
      color: "#6b7280", 
      icon: "📋" 
    };

    // Build response with privacy-safe data
    const verificationData = {
      success: true,
      verified: true,
      order: {
        id: order.id,
        orderNumber: order.order_number,
        shipmentId: order.shipment_id || null,
        status: {
          code: order.status,
          label: statusInfo.label,
          color: statusInfo.color,
          icon: statusInfo.icon,
        },
        isCustomDesign: order.order_type === "custom_design",
        paymentMode: order.payment_status === "paid" ? "Prepaid" : "Cash on Delivery",
        courier: {
          name: order.courier_name || null,
          trackingId: order.tracking_id || null,
          trackingUrl: order.tracking_url || null,
        },
        dates: {
          ordered: order.created_at,
          shipped: order.shipped_at || null,
          expectedDelivery: order.expected_delivery_date || null,
          delivered: order.delivered_at || null,
        },
        customer: {
          name: maskedCustomerName,
          location: deliveryLocation,
        },
        products: productSummary,
        totalItems: productSummary.reduce((sum: number, p: any) => sum + p.quantity, 0),
      },
      verifiedAt: new Date().toISOString(),
    };

    console.log("Order verified successfully:", order.order_number);

    return new Response(
      JSON.stringify(verificationData),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      }
    );

  } catch (error) {
    console.error("Error verifying order:", error);
    return new Response(
      JSON.stringify({
        success: false,
        error: "Failed to verify order",
      }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 500,
      }
    );
  }
});
