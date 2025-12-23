import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// Company details - update these as needed
const COMPANY = {
  name: "Decouverts Plus",
  tagline: "Premium 3D Printing Solutions",
  address: "123 Innovation Hub, Tech Park",
  city: "Pune",
  state: "Maharashtra",
  pincode: "411001",
  country: "India",
  phone: "+91 98765 43210",
  email: "info@decouvertsplus.com",
  website: "www.decouvertsplus.com",
  gst: "27XXXXX1234X1ZX", // GST Number
};

serve(async (req) => {
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

    const invoiceNumber = `INV-${order.order_number.replace("DP-", "")}`;
    const invoiceDate = new Date(order.created_at).toLocaleDateString("en-IN", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });

    const items = order.order_items.map((item: any) => ({
      name: item.product_name,
      quantity: item.quantity,
      price: item.product_price,
      total: item.total_price,
    }));

    const shippingAddress = order.shipping_address as any;
    const clientAddress = shippingAddress
      ? `${shippingAddress.address_line1}${shippingAddress.address_line2 ? ", " + shippingAddress.address_line2 : ""}, ${shippingAddress.city}, ${shippingAddress.state} - ${shippingAddress.postal_code}, ${shippingAddress.country}`
      : "";

    const { data: profile } = await supabase
      .from("profiles")
      .select("email, full_name")
      .eq("id", order.user_id)
      .single();

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
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; color: #333; background: #fff; padding: 20px; }
    .invoice-container { max-width: 800px; margin: 0 auto; border: 1px solid #e0e0e0; padding: 40px; }
    
    /* Header */
    .header { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 30px; padding-bottom: 20px; border-bottom: 3px solid #EAAB1C; }
    .company-info { max-width: 50%; }
    .company-name { font-size: 28px; font-weight: bold; color: #EAAB1C; margin-bottom: 5px; }
    .company-tagline { color: #666; font-size: 12px; margin-bottom: 10px; }
    .company-details { font-size: 11px; color: #555; line-height: 1.6; }
    .invoice-meta { text-align: right; }
    .invoice-title { font-size: 36px; font-weight: bold; color: #333; letter-spacing: 2px; }
    .invoice-number { font-size: 14px; color: #666; margin-top: 5px; }
    .invoice-date { font-size: 12px; color: #888; margin-top: 5px; }
    
    /* Billing Section */
    .billing-section { display: flex; justify-content: space-between; margin: 30px 0; }
    .bill-to, .order-info { width: 48%; }
    .section-title { font-size: 11px; font-weight: bold; color: #EAAB1C; text-transform: uppercase; letter-spacing: 1px; margin-bottom: 10px; }
    .customer-name { font-size: 16px; font-weight: bold; color: #333; margin-bottom: 5px; }
    .customer-details { font-size: 12px; color: #555; line-height: 1.6; }
    .order-info { text-align: right; }
    .order-info p { font-size: 12px; color: #555; margin-bottom: 5px; }
    .order-info strong { color: #333; }
    
    /* Items Table */
    table { width: 100%; border-collapse: collapse; margin: 30px 0; }
    th { background: #f8f8f8; padding: 12px 15px; text-align: left; font-size: 11px; font-weight: bold; text-transform: uppercase; letter-spacing: 0.5px; color: #555; border-bottom: 2px solid #EAAB1C; }
    td { padding: 15px; border-bottom: 1px solid #eee; font-size: 13px; }
    .text-right { text-align: right; }
    .text-center { text-align: center; }
    tr:last-child td { border-bottom: none; }
    
    /* Summary */
    .summary-section { display: flex; justify-content: flex-end; margin-top: 20px; }
    .summary { width: 280px; }
    .summary-row { display: flex; justify-content: space-between; padding: 8px 0; font-size: 13px; }
    .summary-row span:first-child { color: #666; }
    .summary-row span:last-child { color: #333; font-weight: 500; }
    .summary-total { border-top: 2px solid #333; margin-top: 10px; padding-top: 10px; font-size: 16px; font-weight: bold; }
    .summary-total span:last-child { color: #EAAB1C; }
    
    /* Footer */
    .footer { margin-top: 40px; padding-top: 20px; border-top: 1px solid #eee; text-align: center; }
    .footer-text { font-size: 11px; color: #888; margin-bottom: 5px; }
    .footer-thanks { font-size: 14px; font-weight: 500; color: #333; margin-bottom: 10px; }
    
    /* GST Box */
    .gst-box { background: #f9f9f9; border: 1px solid #eee; padding: 15px; margin-top: 20px; border-radius: 5px; }
    .gst-title { font-size: 11px; font-weight: bold; color: #555; margin-bottom: 5px; }
    .gst-number { font-size: 14px; font-weight: bold; color: #333; letter-spacing: 1px; }
    
    @media print {
      body { padding: 0; }
      .invoice-container { border: none; padding: 20px; }
    }
  </style>
</head>
<body>
  <div class="invoice-container">
    <div class="header">
      <div class="company-info">
        <div class="company-name">${COMPANY.name}</div>
        <div class="company-tagline">${COMPANY.tagline}</div>
        <div class="company-details">
          ${COMPANY.address}<br>
          ${COMPANY.city}, ${COMPANY.state} - ${COMPANY.pincode}<br>
          ${COMPANY.country}<br>
          Phone: ${COMPANY.phone}<br>
          Email: ${COMPANY.email}<br>
          <strong>GSTIN: ${COMPANY.gst}</strong>
        </div>
      </div>
      <div class="invoice-meta">
        <div class="invoice-title">INVOICE</div>
        <div class="invoice-number">${invoiceNumber}</div>
        <div class="invoice-date">Date: ${invoiceDate}</div>
      </div>
    </div>

    <div class="billing-section">
      <div class="bill-to">
        <div class="section-title">Bill To</div>
        <div class="customer-name">${shippingAddress?.full_name || "Customer"}</div>
        <div class="customer-details">
          ${shippingAddress?.address_line1 || ""}<br>
          ${shippingAddress?.address_line2 ? shippingAddress.address_line2 + "<br>" : ""}
          ${shippingAddress?.city || ""}, ${shippingAddress?.state || ""} - ${shippingAddress?.postal_code || ""}<br>
          ${shippingAddress?.country || "India"}<br>
          Phone: ${shippingAddress?.phone || "N/A"}<br>
          Email: ${profile?.email || "N/A"}
        </div>
      </div>
      <div class="order-info">
        <div class="section-title">Order Details</div>
        <p><strong>Order No:</strong> ${order.order_number}</p>
        <p><strong>Order Date:</strong> ${invoiceDate}</p>
        <p><strong>Payment Status:</strong> ${order.payment_status === "paid" ? "✓ Paid" : "Pending"}</p>
        ${order.payment_id ? `<p><strong>Payment ID:</strong> ${order.payment_id}</p>` : ""}
      </div>
    </div>

    <table>
      <thead>
        <tr>
          <th style="width: 50%">Description</th>
          <th class="text-center" style="width: 15%">Qty</th>
          <th class="text-right" style="width: 17%">Unit Price</th>
          <th class="text-right" style="width: 18%">Amount</th>
        </tr>
      </thead>
      <tbody>
        ${items
          .map(
            (item: any, index: number) => `
          <tr>
            <td>${index + 1}. ${item.name}</td>
            <td class="text-center">${item.quantity}</td>
            <td class="text-right">₹${Number(item.price).toLocaleString("en-IN")}</td>
            <td class="text-right">₹${Number(item.total).toLocaleString("en-IN")}</td>
          </tr>
        `
          )
          .join("")}
      </tbody>
    </table>

    <div class="summary-section">
      <div class="summary">
        <div class="summary-row">
          <span>Subtotal</span>
          <span>₹${Number(order.subtotal).toLocaleString("en-IN")}</span>
        </div>
        ${Number(order.discount_amount) > 0 ? `
        <div class="summary-row">
          <span>Discount</span>
          <span>-₹${Number(order.discount_amount).toLocaleString("en-IN")}</span>
        </div>
        ` : ""}
        <div class="summary-row">
          <span>Tax (GST)</span>
          <span>₹${Number(order.tax_amount).toLocaleString("en-IN")}</span>
        </div>
        <div class="summary-row">
          <span>Shipping</span>
          <span>${Number(order.shipping_amount) === 0 ? "FREE" : `₹${Number(order.shipping_amount).toLocaleString("en-IN")}`}</span>
        </div>
        <div class="summary-row summary-total">
          <span>Total</span>
          <span>₹${Number(order.total_amount).toLocaleString("en-IN")}</span>
        </div>
      </div>
    </div>

    <div class="gst-box">
      <div class="gst-title">Tax Invoice</div>
      <div class="gst-number">GSTIN: ${COMPANY.gst}</div>
    </div>

    <div class="footer">
      <div class="footer-thanks">Thank you for your business!</div>
      <div class="footer-text">${COMPANY.name} | ${COMPANY.website}</div>
      <div class="footer-text">This is a computer-generated invoice and does not require a signature.</div>
    </div>
  </div>
</body>
</html>`;

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
