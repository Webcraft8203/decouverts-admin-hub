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
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const { orderId } = await req.json();

    if (!orderId) {
      throw new Error("Order ID is required");
    }

    console.log("Generating invoice for order:", orderId);

    // Fetch order details
    const { data: order, error: orderError } = await supabase
      .from("orders")
      .select("*, order_items(*, products(name, images))")
      .eq("id", orderId)
      .single();

    if (orderError || !order) {
      console.error("Order fetch error:", orderError);
      throw new Error("Order not found");
    }

    console.log("Order found:", order.order_number);

    // Generate invoice number
    const invoiceNumber = `INV-${order.order_number.replace("DP-", "")}`;

    // Prepare invoice items
    const items = order.order_items.map((item: any) => ({
      name: item.product_name,
      quantity: item.quantity,
      price: item.product_price,
      total: item.total_price,
    }));

    // Get shipping address
    const shippingAddress = order.shipping_address as any;
    const clientAddress = shippingAddress
      ? `${shippingAddress.address_line1}${shippingAddress.address_line2 ? ", " + shippingAddress.address_line2 : ""}, ${shippingAddress.city}, ${shippingAddress.state} - ${shippingAddress.postal_code}, ${shippingAddress.country}`
      : "";

    // Fetch user profile for email
    const { data: profile } = await supabase
      .from("profiles")
      .select("email, full_name")
      .eq("id", order.user_id)
      .single();

    // Create invoice in database
    const { data: invoice, error: invoiceError } = await supabase
      .from("invoices")
      .insert({
        invoice_number: invoiceNumber,
        client_name: shippingAddress?.full_name || profile?.full_name || "Customer",
        client_email: profile?.email || null,
        client_address: clientAddress,
        items: items,
        subtotal: order.subtotal,
        tax_amount: order.tax_amount,
        total_amount: order.total_amount,
        created_by: order.user_id,
        notes: `Order: ${order.order_number}\nPayment ID: ${order.payment_id || "N/A"}`,
      })
      .select()
      .single();

    if (invoiceError) {
      console.error("Invoice creation error:", invoiceError);
      throw new Error("Failed to create invoice");
    }

    console.log("Invoice created:", invoice.invoice_number);

    const invoiceHtml = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <title>Invoice ${invoiceNumber}</title>
  <style>
    body { font-family: Arial, sans-serif; margin: 40px; color: #333; }
    .header { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 40px; }
    .company { font-size: 24px; font-weight: bold; color: #EAAB1C; }
    .invoice-title { font-size: 32px; font-weight: bold; color: #333; }
    .invoice-number { color: #666; margin-top: 5px; }
    .details { display: flex; justify-content: space-between; margin-bottom: 30px; }
    .bill-to h3 { margin: 0 0 10px 0; color: #666; font-size: 14px; }
    .bill-to p { margin: 5px 0; }
    table { width: 100%; border-collapse: collapse; margin: 30px 0; }
    th { background: #f5f5f5; padding: 12px; text-align: left; border-bottom: 2px solid #ddd; }
    td { padding: 12px; border-bottom: 1px solid #eee; }
    .text-right { text-align: right; }
    .summary { margin-left: auto; width: 300px; }
    .summary-row { display: flex; justify-content: space-between; padding: 8px 0; }
    .summary-total { border-top: 2px solid #333; font-weight: bold; font-size: 18px; }
    .footer { margin-top: 60px; text-align: center; color: #666; font-size: 12px; }
  </style>
</head>
<body>
  <div class="header">
    <div>
      <div class="company">Decouverts Plus</div>
      <p style="color: #666; margin-top: 5px;">Premium 3D Printing Solutions</p>
    </div>
    <div style="text-align: right;">
      <div class="invoice-title">INVOICE</div>
      <div class="invoice-number">${invoiceNumber}</div>
      <div style="color: #666; margin-top: 10px;">Date: ${new Date(order.created_at).toLocaleDateString()}</div>
    </div>
  </div>

  <div class="details">
    <div class="bill-to">
      <h3>BILL TO:</h3>
      <p><strong>${shippingAddress?.full_name || "Customer"}</strong></p>
      <p>${shippingAddress?.address_line1 || ""}</p>
      ${shippingAddress?.address_line2 ? `<p>${shippingAddress.address_line2}</p>` : ""}
      <p>${shippingAddress?.city || ""}, ${shippingAddress?.state || ""} - ${shippingAddress?.postal_code || ""}</p>
      <p>Phone: ${shippingAddress?.phone || "N/A"}</p>
    </div>
    <div style="text-align: right;">
      <p><strong>Order Number:</strong> ${order.order_number}</p>
      <p><strong>Payment Status:</strong> ${order.payment_status === "paid" ? "Paid" : "Pending"}</p>
      ${order.payment_id ? `<p><strong>Payment ID:</strong> ${order.payment_id}</p>` : ""}
    </div>
  </div>

  <table>
    <thead>
      <tr>
        <th>Item</th>
        <th class="text-right">Qty</th>
        <th class="text-right">Price</th>
        <th class="text-right">Total</th>
      </tr>
    </thead>
    <tbody>
      ${items
        .map(
          (item: any) => `
        <tr>
          <td>${item.name}</td>
          <td class="text-right">${item.quantity}</td>
          <td class="text-right">₹${Number(item.price).toLocaleString()}</td>
          <td class="text-right">₹${Number(item.total).toLocaleString()}</td>
        </tr>
      `
        )
        .join("")}
    </tbody>
  </table>

  <div class="summary">
    <div class="summary-row">
      <span>Subtotal:</span>
      <span>₹${Number(order.subtotal).toLocaleString()}</span>
    </div>
    <div class="summary-row">
      <span>Tax:</span>
      <span>₹${Number(order.tax_amount).toLocaleString()}</span>
    </div>
    <div class="summary-row">
      <span>Shipping:</span>
      <span>${Number(order.shipping_amount) === 0 ? "Free" : `₹${Number(order.shipping_amount).toLocaleString()}`}</span>
    </div>
    <div class="summary-row summary-total">
      <span>Total:</span>
      <span>₹${Number(order.total_amount).toLocaleString()}</span>
    </div>
  </div>

  <div class="footer">
    <p>Thank you for your business!</p>
    <p>Decouverts Plus - Premium 3D Printing Solutions</p>
  </div>
</body>
</html>`;

    // Store invoice HTML in storage bucket (private bucket; user_id folder)
    const fileName = `${invoiceNumber}.html`;
    const invoicePath = `${order.user_id}/${fileName}`;

    const { error: uploadError } = await supabase.storage
      .from("invoices")
      .upload(invoicePath, invoiceHtml, {
        contentType: "text/html",
        upsert: true,
      });

    if (uploadError) {
      console.error("Upload error:", uploadError);
      throw new Error("Failed to upload invoice");
    }

    // Store the storage path in DB (not a public URL)
    await supabase.from("orders").update({ invoice_url: invoicePath }).eq("id", orderId);
    await supabase.from("invoices").update({ pdf_url: invoicePath }).eq("id", invoice.id);

    console.log("Invoice generation complete:", invoicePath);

    return new Response(
      JSON.stringify({
        success: true,
        invoiceId: invoice.id,
        invoiceNumber: invoice.invoice_number,
        invoicePath,
      }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      }
    );
  } catch (error: any) {
    console.error("Error generating invoice:", error);
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 400,
    });
  }
});
