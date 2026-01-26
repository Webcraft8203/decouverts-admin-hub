import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { crypto } from "https://deno.land/std@0.168.0/crypto/mod.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface VerifyPaymentBody {
  razorpay_order_id: string;
  razorpay_payment_id: string;
  razorpay_signature: string;
  addressId: string;
  checkoutMode: "cart" | "single";
  productId?: string;
  quantity?: number;
  promoCodeId?: string | null;
  buyerGstin?: string | null;
}

async function verifySignature(
  orderId: string,
  paymentId: string,
  signature: string,
  secret: string
): Promise<boolean> {
  const body = `${orderId}|${paymentId}`;
  const encoder = new TextEncoder();
  const key = await crypto.subtle.importKey(
    "raw",
    encoder.encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"]
  );
  const signatureBuffer = await crypto.subtle.sign("HMAC", key, encoder.encode(body));
  const expectedSignature = Array.from(new Uint8Array(signatureBuffer))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
  
  return expectedSignature === signature;
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const razorpaySecret = Deno.env.get("RAZORPAY_KEY_SECRET");

    if (!razorpaySecret) {
      throw new Error("Razorpay secret not configured");
    }

    const authHeader = req.headers.get("authorization") || "";
    const token = authHeader.replace("Bearer ", "");

    console.log("Auth header present:", !!authHeader);

    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Verify end-user
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
    const body = (await req.json()) as VerifyPaymentBody;

    // Validate required fields
    if (!body.razorpay_order_id || !body.razorpay_payment_id || !body.razorpay_signature) {
      throw new Error("Missing payment verification details");
    }

    if (!body.addressId) {
      throw new Error("Address ID is required");
    }

    // Verify Razorpay signature
    console.log("Verifying Razorpay signature...");
    const isValid = await verifySignature(
      body.razorpay_order_id,
      body.razorpay_payment_id,
      body.razorpay_signature,
      razorpaySecret
    );

    if (!isValid) {
      console.error("Invalid Razorpay signature");
      return new Response(JSON.stringify({ error: "Payment verification failed - invalid signature" }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 400,
      });
    }

    console.log("Signature verified successfully");

    // SECURITY: Check for duplicate payment to prevent replay attacks
    const { data: existingOrder, error: duplicateCheckError } = await supabase
      .from("orders")
      .select("id, order_number")
      .eq("payment_id", body.razorpay_payment_id)
      .maybeSingle();

    if (duplicateCheckError) {
      console.error("Error checking for duplicate payment:", duplicateCheckError);
    }

    if (existingOrder) {
      console.log("Duplicate payment detected, returning existing order:", existingOrder.order_number);
      return new Response(JSON.stringify({ 
        orderId: existingOrder.id, 
        orderNumber: existingOrder.order_number,
        message: "Order already processed" 
      }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      });
    }

    // Fetch invoice settings for platform fee and seller state
    const { data: invoiceSettings, error: settingsError } = await supabase
      .from("invoice_settings")
      .select("platform_fee_percentage, platform_fee_taxable, business_state")
      .limit(1)
      .single();

    if (settingsError) {
      console.error("Error fetching invoice settings:", settingsError);
    }

    const platformFeePercentage = invoiceSettings?.platform_fee_percentage ?? 2;
    const platformFeeTaxable = invoiceSettings?.platform_fee_taxable ?? false;
    const sellerState = invoiceSettings?.business_state || "Maharashtra";

    // Load address (must belong to the user)
    const { data: address, error: addressError } = await supabase
      .from("user_addresses")
      .select("*")
      .eq("id", body.addressId)
      .eq("user_id", user.id)
      .maybeSingle();

    if (addressError) throw addressError;
    if (!address) throw new Error("Address not found");

    const buyerState = address.state || "";
    const isIgst = buyerState.toLowerCase() !== sellerState.toLowerCase();

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
      .select("id, name, price, stock_quantity, availability_status, gst_percentage")
      .in("id", productIds);

    if (productsError) throw productsError;

    const productsById = new Map((products || []).map((p) => [p.id, p]));

    let subtotal = 0;
    let totalGstAmount = 0;
    const gstBreakdown: Array<{
      product_id: string;
      product_name: string;
      taxable_value: number;
      gst_rate: number;
      cgst_rate: number;
      sgst_rate: number;
      igst_rate: number;
      cgst_amount: number;
      sgst_amount: number;
      igst_amount: number;
      total_gst: number;
    }> = [];

    for (const item of items) {
      const p = productsById.get(item.product_id);
      if (!p) throw new Error("Product not found");
      if (p.availability_status === "out_of_stock") throw new Error(`${p.name} is out of stock`);
      if (p.stock_quantity < item.quantity) throw new Error(`Only ${p.stock_quantity} of ${p.name} available`);
      
      const taxableValue = Number(p.price) * item.quantity;
      const gstRate = Number(p.gst_percentage) || 18;
      const gstAmount = (taxableValue * gstRate) / 100;
      
      subtotal += taxableValue;
      totalGstAmount += gstAmount;

      gstBreakdown.push({
        product_id: p.id,
        product_name: p.name,
        taxable_value: taxableValue,
        gst_rate: gstRate,
        cgst_rate: isIgst ? 0 : gstRate / 2,
        sgst_rate: isIgst ? 0 : gstRate / 2,
        igst_rate: isIgst ? gstRate : 0,
        cgst_amount: isIgst ? 0 : gstAmount / 2,
        sgst_amount: isIgst ? 0 : gstAmount / 2,
        igst_amount: isIgst ? gstAmount : 0,
        total_gst: gstAmount,
      });
    }

    // Handle promo code discount (if provided)
    let promoCodeId: string | null = body.promoCodeId || null;
    let discountAmount = 0;

    if (promoCodeId) {
      const { data: promoCode, error: promoError } = await supabase
        .from("promo_codes")
        .select("*")
        .eq("id", promoCodeId)
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

          // Increment promo code usage
          await supabase
            .from("promo_codes")
            .update({ used_count: promoCode.used_count + 1 })
            .eq("id", promoCodeId);
        } else {
          promoCodeId = null;
        }
      } else {
        promoCodeId = null;
      }
    }

    // Calculate platform fee (2% of subtotal after discount)
    const subtotalAfterDiscount = subtotal - discountAmount;
    const platformFee = Math.round((subtotalAfterDiscount * platformFeePercentage) / 100 * 100) / 100;
    
    // Platform fee tax (if taxable)
    const platformFeeTax = platformFeeTaxable ? Math.round(platformFee * 0.18 * 100) / 100 : 0;

    // Calculate totals
    const totalCgst = gstBreakdown.reduce((sum, item) => sum + item.cgst_amount, 0);
    const totalSgst = gstBreakdown.reduce((sum, item) => sum + item.sgst_amount, 0);
    const totalIgst = gstBreakdown.reduce((sum, item) => sum + item.igst_amount, 0);

    // Grand Total = Subtotal - Discount + GST + Platform Fee + Platform Fee Tax
    const grandTotal = subtotalAfterDiscount + totalGstAmount + platformFee + platformFeeTax;

    console.log("Order calculation:", {
      subtotal,
      discountAmount,
      subtotalAfterDiscount,
      totalGstAmount,
      totalCgst,
      totalSgst,
      totalIgst,
      platformFee,
      platformFeeTax,
      grandTotal,
    });

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
        subtotal: subtotal,
        tax_amount: totalGstAmount,
        shipping_amount: 0,
        discount_amount: discountAmount,
        promo_code_id: promoCodeId,
        total_amount: grandTotal,
        status: "pending",
        payment_status: "paid",
        payment_id: body.razorpay_payment_id,
        buyer_gstin: body.buyerGstin || null,
        gst_breakdown: {
          items: gstBreakdown,
          totals: {
            cgst: totalCgst,
            sgst: totalSgst,
            igst: totalIgst,
            total_gst: totalGstAmount,
            platform_fee: platformFee,
            platform_fee_tax: platformFeeTax,
            is_igst: isIgst,
          }
        },
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

    console.log("Order created successfully:", newOrder.order_number, "Total:", grandTotal);

    // Generate proforma invoice in the background
    console.log("Triggering proforma invoice generation for order:", newOrder.id);
    try {
      const invoiceResponse = await fetch(`${supabaseUrl}/functions/v1/generate-invoice`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${supabaseServiceKey}`,
        },
        body: JSON.stringify({ 
          orderId: newOrder.id, 
          invoiceType: "proforma" 
        }),
      });
      
      if (invoiceResponse.ok) {
        console.log("Proforma invoice generated successfully");
        
        // Now trigger order confirmation email with invoice attached
        console.log("Triggering order confirmation email for:", newOrder.id);
        fetch(`${supabaseUrl}/functions/v1/send-order-email`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${supabaseServiceKey}`,
          },
          body: JSON.stringify({
            orderId: newOrder.id,
            emailType: "order_placed",
          }),
        }).catch((emailErr) => {
          console.error("Error triggering order email:", emailErr);
        });
      } else {
        console.error("Failed to generate proforma invoice:", await invoiceResponse.text());
      }
    } catch (invoiceError) {
      console.error("Error generating proforma invoice:", invoiceError);
      // Don't throw - order was successful, invoice can be regenerated
    }

    return new Response(JSON.stringify({ orderId: newOrder.id, orderNumber: newOrder.order_number }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    });
  } catch (error: any) {
    console.error("verify-razorpay-payment error:", error);
    return new Response(JSON.stringify({ error: error?.message || "Unknown error" }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 400,
    });
  }
});
