import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

type PlaceOrderBody =
  | {
      checkoutMode: "cart";
      addressId: string;
      promoCodeId?: string | null;
      discountAmount?: number;
      payment: {
        method: "razorpay" | "cod";
        status: "paid" | "pending";
        paymentId: string | null;
      };
    }
  | {
      checkoutMode: "single";
      addressId: string;
      productId: string;
      quantity: number;
      promoCodeId?: string | null;
      discountAmount?: number;
      payment: {
        method: "razorpay" | "cod";
        status: "paid" | "pending";
        paymentId: string | null;
      };
    };

serve(async (req) => {
  console.log("place-order function invoked, method:", req.method);
  
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL");
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");

    if (!supabaseUrl || !supabaseServiceKey) {
      console.error("Missing Supabase environment variables");
      throw new Error("Server configuration error");
    }

    const authHeader = req.headers.get("authorization") || "";
    const token = authHeader.replace("Bearer ", "");
    
    console.log("Auth header present:", !!authHeader, "Token length:", token.length);

    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Verify end-user using the token
    const { data: userData, error: userError } = await supabase.auth.getUser(token);
    console.log("User lookup result:", userError ? userError.message : "success", userData?.user?.id);
    
    if (userError || !userData?.user) {
      console.error("Auth failed:", userError?.message);
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 401,
      });
    }

    const user = userData.user;
    
    let body: PlaceOrderBody;
    try {
      body = (await req.json()) as PlaceOrderBody;
      console.log("Request body received:", JSON.stringify(body));
    } catch (parseError) {
      console.error("Failed to parse request body:", parseError);
      throw new Error("Invalid request body");
    }

    if (!body?.addressId) throw new Error("Address ID is required");

    // Load address (must belong to the user)
    const { data: address, error: addressError } = await supabase
      .from("user_addresses")
      .select("*")
      .eq("id", body.addressId)
      .eq("user_id", user.id)
      .maybeSingle();

    if (addressError) throw addressError;
    if (!address) throw new Error("Address not found");

    // Load items
    let items: Array<{ product_id: string; quantity: number }> = [];

    if (body.checkoutMode === "cart") {
      const { data: cartItems, error: cartError } = await supabase
        .from("cart_items")
        .select("product_id, quantity")
        .eq("user_id", user.id);

      if (cartError) throw cartError;

      items = (cartItems || []).map((i) => ({ product_id: i.product_id, quantity: i.quantity }));
      if (items.length === 0) throw new Error("Your cart is empty");
    } else {
      if (!body.productId) throw new Error("Product ID is required");
      if (!body.quantity || body.quantity < 1) throw new Error("Quantity must be at least 1");
      items = [{ product_id: body.productId, quantity: body.quantity }];
    }

    // Fetch products + validate stock
    const productIds = [...new Set(items.map((i) => i.product_id))];

    const { data: products, error: productsError } = await supabase
      .from("products")
      .select("id, name, price, stock_quantity, availability_status")
      .in("id", productIds);

    if (productsError) throw productsError;

    const productsById = new Map((products || []).map((p) => [p.id, p]));

    let subtotal = 0;
    for (const item of items) {
      const p = productsById.get(item.product_id);
      if (!p) throw new Error("Product not found");
      if (p.availability_status === "out_of_stock") throw new Error(`${p.name} is out of stock`);
      if (p.stock_quantity < item.quantity) throw new Error(`Only ${p.stock_quantity} of ${p.name} available`);
      subtotal += Number(p.price) * item.quantity;
    }

    // Handle promo code
    let promoCodeId = body.promoCodeId || null;
    let discountAmount = body.discountAmount || 0;

    // Validate and update promo code usage if provided
    if (promoCodeId) {
      const { data: promoCode, error: promoError } = await supabase
        .from("promo_codes")
        .select("*")
        .eq("id", promoCodeId)
        .eq("is_active", true)
        .maybeSingle();

      if (promoError) {
        console.error("Promo code lookup error:", promoError);
        promoCodeId = null;
        discountAmount = 0;
      } else if (!promoCode) {
        console.log("Promo code not found or inactive");
        promoCodeId = null;
        discountAmount = 0;
      } else {
        // Validate promo code
        const now = new Date();
        const isExpired = promoCode.expires_at && new Date(promoCode.expires_at) < now;
        const isExhausted = promoCode.used_count >= promoCode.max_uses;
        const belowMinOrder = promoCode.min_order_amount && subtotal < promoCode.min_order_amount;

        if (isExpired || isExhausted || belowMinOrder) {
          console.log("Promo code invalid:", { isExpired, isExhausted, belowMinOrder });
          promoCodeId = null;
          discountAmount = 0;
        } else {
          // Calculate and validate discount
          let calculatedDiscount = 0;
          if (promoCode.discount_type === "percentage") {
            calculatedDiscount = (subtotal * promoCode.discount_value) / 100;
            if (promoCode.max_discount_amount && calculatedDiscount > promoCode.max_discount_amount) {
              calculatedDiscount = promoCode.max_discount_amount;
            }
          } else {
            calculatedDiscount = promoCode.discount_value;
          }
          
          // Use the minimum of calculated and provided discount for security
          discountAmount = Math.min(calculatedDiscount, discountAmount, subtotal);

          // Increment promo code usage
          const { error: updateError } = await supabase
            .from("promo_codes")
            .update({ used_count: promoCode.used_count + 1 })
            .eq("id", promoCodeId);

          if (updateError) {
            console.error("Failed to update promo code usage:", updateError);
          }
        }
      }
    }

    const totalAmount = subtotal - discountAmount;

    // Create order
    const { data: orderNumberRow, error: orderNumberError } = await supabase.rpc("generate_order_number");
    if (orderNumberError) throw orderNumberError;

    const orderNumber = orderNumberRow as unknown as string;

    const { data: newOrder, error: orderError } = await supabase
      .from("orders")
      .insert({
        user_id: user.id,
        order_number: orderNumber,
        address_id: address.id,
        shipping_address: {
          full_name: address.full_name,
          phone: address.phone,
          address_line1: address.address_line1,
          address_line2: address.address_line2,
          city: address.city,
          state: address.state,
          postal_code: address.postal_code,
          country: address.country,
        },
        subtotal,
        tax_amount: 0,
        shipping_amount: 0,
        discount_amount: discountAmount,
        promo_code_id: promoCodeId,
        total_amount: totalAmount,
        status: "pending",
        payment_status: body.payment?.status ?? "pending",
        payment_id: body.payment?.paymentId ?? null,
      })
      .select("id, order_number")
      .single();

    if (orderError) throw orderError;

    // Create order_items
    const orderItems = items.map((i) => {
      const p = productsById.get(i.product_id)!;
      return {
        order_id: newOrder.id,
        product_id: p.id,
        product_name: p.name,
        product_price: p.price,
        quantity: i.quantity,
        total_price: Number(p.price) * i.quantity,
      };
    });

    const { error: itemsError } = await supabase.from("order_items").insert(orderItems);
    if (itemsError) throw itemsError;

    // Decrement stock
    for (const item of items) {
      const p = productsById.get(item.product_id)!;
      const newStock = p.stock_quantity - item.quantity;
      const newStatus = newStock <= 0 ? "out_of_stock" : newStock < 10 ? "low_stock" : "in_stock";

      const { error: stockError } = await supabase
        .from("products")
        .update({ stock_quantity: newStock, availability_status: newStatus })
        .eq("id", p.id);

      if (stockError) throw stockError;
    }

    // Clear cart if cart checkout
    if (body.checkoutMode === "cart") {
      const { error: clearError } = await supabase.from("cart_items").delete().eq("user_id", user.id);
      if (clearError) throw clearError;
    }

    console.log("Order placed successfully:", newOrder.order_number, "Discount:", discountAmount);

    return new Response(JSON.stringify({ orderId: newOrder.id, orderNumber: newOrder.order_number }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    });
  } catch (error: any) {
    console.error("place-order error:", error);
    return new Response(JSON.stringify({ error: error?.message || "Unknown error" }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 400,
    });
  }
});
