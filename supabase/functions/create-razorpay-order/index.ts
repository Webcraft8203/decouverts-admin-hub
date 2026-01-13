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
  addressId?: string; // Required for GST calculation
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

    // Fetch products from database to get ACTUAL prices and GST percentages
    const productIds = [...new Set(items.map((i) => i.product_id))];
    
    const { data: products, error: productsError } = await supabase
      .from("products")
      .select("id, name, price, stock_quantity, availability_status, gst_percentage")
      .in("id", productIds);

    if (productsError) throw productsError;
    if (!products || products.length === 0) {
      throw new Error("Products not found");
    }

    const productsById = new Map(products.map((p) => [p.id, p]));

    // Get buyer state from address (if provided)
    let buyerState = "";
    if (body.addressId) {
      const { data: address, error: addressError } = await supabase
        .from("user_addresses")
        .select("state")
        .eq("id", body.addressId)
        .eq("user_id", user.id)
        .maybeSingle();

      if (!addressError && address) {
        buyerState = address.state || "";
      }
    }

    const isIgst = buyerState && buyerState.toLowerCase() !== sellerState.toLowerCase();

    // Validate stock and calculate subtotal + GST from DATABASE prices
    let subtotal = 0;
    let totalGstAmount = 0;
    const orderItems: Array<{ name: string; qty: number; price: number; gst: number }> = [];
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
      if (p.availability_status === "out_of_stock") {
        throw new Error(`${p.name} is out of stock`);
      }
      if (p.stock_quantity < item.quantity) {
        throw new Error(`Only ${p.stock_quantity} of ${p.name} available`);
      }
      
      const taxableValue = Number(p.price) * item.quantity;
      const gstRate = Number(p.gst_percentage) || 18;
      const gstAmount = (taxableValue * gstRate) / 100;
      
      subtotal += taxableValue;
      totalGstAmount += gstAmount;
      
      orderItems.push({ 
        name: p.name, 
        qty: item.quantity, 
        price: Number(p.price),
        gst: gstAmount
      });

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
    
    // Amount in paise (multiply by 100)
    const amountInPaise = Math.round(grandTotal * 100);

    if (amountInPaise < 100) {
      throw new Error("Order amount must be at least ₹1");
    }

    console.log("Calculation breakdown:", {
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
      amountInPaise
    });

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
          subtotal: subtotal.toFixed(2),
          discount: discountAmount.toFixed(2),
          gst: totalGstAmount.toFixed(2),
          cgst: totalCgst.toFixed(2),
          sgst: totalSgst.toFixed(2),
          igst: totalIgst.toFixed(2),
          platformFee: platformFee.toFixed(2),
          platformFeeTax: platformFeeTax.toFixed(2),
          grandTotal: grandTotal.toFixed(2),
          isIgst: isIgst ? "true" : "false",
        },
      }),
    });

    if (!orderResponse.ok) {
      const errorText = await orderResponse.text();
      console.error("Razorpay error:", errorText);
      throw new Error("Failed to create Razorpay order");
    }

    const order = await orderResponse.json();

    console.log("Razorpay order created:", order.id, "Amount:", amountInPaise);

    return new Response(
      JSON.stringify({
        orderId: order.id,
        amount: order.amount,
        currency: order.currency,
        keyId: RAZORPAY_KEY_ID,
        // Return calculated values for frontend display
        calculatedSubtotal: subtotal,
        calculatedDiscount: discountAmount,
        calculatedTax: totalGstAmount,
        calculatedCgst: totalCgst,
        calculatedSgst: totalSgst,
        calculatedIgst: totalIgst,
        calculatedPlatformFee: platformFee,
        calculatedPlatformFeeTax: platformFeeTax,
        calculatedTotal: grandTotal,
        isIgst: isIgst,
        gstBreakdown: gstBreakdown,
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
