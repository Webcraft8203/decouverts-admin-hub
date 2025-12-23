import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface CreateOrderBody {
  checkoutMode: "cart" | "single";
  productId?: string;
  quantity?: number;
  promoCodeId?: string | null;
}

serve(async (req) => {
  // Handle CORS preflight requests
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
    const body = (await req.json()) as CreateOrderBody;

    console.log("Creating Razorpay order for user:", user.id, "mode:", body.checkoutMode);

    // SECURITY: Calculate amount server-side from database prices
    let items: Array<{ product_id: string; quantity: number }> = [];
    
    if (body.checkoutMode === "cart") {
      const { data: cartItems, error: cartError } = await supabase
        .from("cart_items")
        .select("product_id, quantity")
        .eq("user_id", user.id);

      if (cartError) throw cartError;
      items = (cartItems || []).map((i) => ({ product_id: i.product_id, quantity: i.quantity }));
      
      if (items.length === 0) {
        throw new Error("Your cart is empty");
      }
    } else {
      if (!body.productId) throw new Error("Product ID is required");
      const quantity = body.quantity && body.quantity >= 1 ? body.quantity : 1;
      items = [{ product_id: body.productId, quantity }];
    }

    // Fetch products from database to get ACTUAL prices
    const productIds = [...new Set(items.map((i) => i.product_id))];
    
    const { data: products, error: productsError } = await supabase
      .from("products")
      .select("id, name, price, stock_quantity, availability_status")
      .in("id", productIds);

    if (productsError) throw productsError;
    if (!products || products.length === 0) {
      throw new Error("Products not found");
    }

    const productsById = new Map(products.map((p) => [p.id, p]));

    // Validate stock and calculate subtotal from DATABASE prices
    let subtotal = 0;
    const orderItems: Array<{ name: string; qty: number; price: number }> = [];
    
    for (const item of items) {
      const p = productsById.get(item.product_id);
      if (!p) throw new Error("Product not found");
      if (p.availability_status === "out_of_stock") {
        throw new Error(`${p.name} is out of stock`);
      }
      if (p.stock_quantity < item.quantity) {
        throw new Error(`Only ${p.stock_quantity} of ${p.name} available`);
      }
      
      const itemTotal = Number(p.price) * item.quantity;
      subtotal += itemTotal;
      orderItems.push({ name: p.name, qty: item.quantity, price: Number(p.price) });
    }

    // Handle promo code discount (if provided)
    let discountAmount = 0;
    if (body.promoCodeId) {
      const { data: promoCode, error: promoError } = await supabase
        .from("promo_codes")
        .select("*")
        .eq("id", body.promoCodeId)
        .eq("is_active", true)
        .maybeSingle();

      if (!promoError && promoCode) {
        const now = new Date();
        const isExpired = promoCode.expires_at && new Date(promoCode.expires_at) < now;
        const isExhausted = promoCode.used_count >= promoCode.max_uses;
        const belowMinOrder = promoCode.min_order_amount && subtotal < promoCode.min_order_amount;

        if (!isExpired && !isExhausted && !belowMinOrder) {
          if (promoCode.discount_type === "percentage") {
            discountAmount = (subtotal * promoCode.discount_value) / 100;
            if (promoCode.max_discount_amount && discountAmount > promoCode.max_discount_amount) {
              discountAmount = promoCode.max_discount_amount;
            }
          } else {
            discountAmount = promoCode.discount_value;
          }
          discountAmount = Math.min(discountAmount, subtotal);
        }
      }
    }

    const totalAmount = subtotal - discountAmount;
    
    // Amount in paise (multiply by 100)
    const amountInPaise = Math.round(totalAmount * 100);

    if (amountInPaise < 100) {
      throw new Error("Order amount must be at least ₹1");
    }

    console.log("Calculated amount:", subtotal, "Discount:", discountAmount, "Total:", totalAmount, "Paise:", amountInPaise);

    // Create order with Razorpay using SERVER-CALCULATED amount
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
        receipt: `order_${Date.now()}`,
        notes: {
          userId: user.id,
          checkoutMode: body.checkoutMode,
          itemCount: items.length,
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

    return new Response(
      JSON.stringify({
        orderId: order.id,
        amount: order.amount,
        currency: order.currency,
        keyId: RAZORPAY_KEY_ID,
        // Return calculated values for frontend display
        calculatedSubtotal: subtotal,
        calculatedDiscount: discountAmount,
        calculatedTotal: totalAmount,
      }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      }
    );
  } catch (error: any) {
    console.error("Error creating Razorpay order:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 400,
      }
    );
  }
});
