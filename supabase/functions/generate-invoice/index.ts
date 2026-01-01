import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { jsPDF } from "https://esm.sh/jspdf@2.5.1";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// Company details
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
  gst: "27XXXXX1234X1ZX",
};

const formatCurrency = (amount: number): string => {
  return `Rs. ${Number(amount).toLocaleString("en-IN")}`;
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

    console.log("Generating PDF invoice for order:", orderId);

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

    // Create invoice record
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

    console.log("Invoice record created:", invoice.invoice_number);

    // Generate PDF using jsPDF
    const doc = new jsPDF({
      orientation: "portrait",
      unit: "mm",
      format: "a4",
    });

    const pageWidth = doc.internal.pageSize.getWidth();
    const margin = 20;
    let y = 20;

    // Colors
    const primaryColor: [number, number, number] = [234, 171, 28]; // #EAAB1C
    const textDark: [number, number, number] = [51, 51, 51];
    const textGray: [number, number, number] = [102, 102, 102];
    const textLight: [number, number, number] = [136, 136, 136];

    // Header - Company Name
    doc.setFontSize(24);
    doc.setTextColor(...primaryColor);
    doc.setFont("helvetica", "bold");
    doc.text(COMPANY.name, margin, y);

    // Invoice title on the right
    doc.setFontSize(28);
    doc.setTextColor(...textDark);
    doc.text("INVOICE", pageWidth - margin, y, { align: "right" });

    y += 8;

    // Company tagline
    doc.setFontSize(10);
    doc.setTextColor(...textGray);
    doc.setFont("helvetica", "normal");
    doc.text(COMPANY.tagline, margin, y);

    // Invoice number & date on right
    doc.setFontSize(10);
    doc.text(invoiceNumber, pageWidth - margin, y, { align: "right" });
    y += 5;
    doc.setTextColor(...textLight);
    doc.text(`Date: ${invoiceDate}`, pageWidth - margin, y, { align: "right" });

    y += 3;

    // Company details
    doc.setFontSize(9);
    doc.setTextColor(...textGray);
    const companyLines = [
      COMPANY.address,
      `${COMPANY.city}, ${COMPANY.state} - ${COMPANY.pincode}`,
      COMPANY.country,
      `Phone: ${COMPANY.phone}`,
      `Email: ${COMPANY.email}`,
      `GSTIN: ${COMPANY.gst}`,
    ];
    companyLines.forEach((line) => {
      doc.text(line, margin, y);
      y += 4;
    });

    y += 5;

    // Yellow line separator
    doc.setDrawColor(...primaryColor);
    doc.setLineWidth(1);
    doc.line(margin, y, pageWidth - margin, y);

    y += 15;

    // Bill To section
    doc.setFontSize(9);
    doc.setTextColor(...primaryColor);
    doc.setFont("helvetica", "bold");
    doc.text("BILL TO", margin, y);

    doc.text("ORDER DETAILS", pageWidth / 2 + 10, y);

    y += 6;

    // Customer name
    doc.setFontSize(12);
    doc.setTextColor(...textDark);
    doc.text(shippingAddress?.full_name || "Customer", margin, y);

    // Order info on right
    doc.setFontSize(10);
    doc.setFont("helvetica", "normal");
    doc.setTextColor(...textGray);
    doc.text(`Order No: ${order.order_number}`, pageWidth / 2 + 10, y);

    y += 5;

    // Customer address
    doc.setFontSize(9);
    doc.setFont("helvetica", "normal");
    doc.setTextColor(...textGray);

    if (shippingAddress) {
      const addressLines = [
        shippingAddress.address_line1 || "",
        shippingAddress.address_line2 || "",
        `${shippingAddress.city || ""}, ${shippingAddress.state || ""} - ${shippingAddress.postal_code || ""}`,
        shippingAddress.country || "India",
        `Phone: ${shippingAddress.phone || "N/A"}`,
      ].filter(Boolean);

      addressLines.forEach((line) => {
        doc.text(line, margin, y);
        y += 4;
      });
    }

    // Order date and payment status on right
    const orderY = y - 16;
    doc.text(`Order Date: ${invoiceDate}`, pageWidth / 2 + 10, orderY);
    doc.text(`Payment: ${order.payment_status === "paid" ? "Paid" : "Pending"}`, pageWidth / 2 + 10, orderY + 5);
    if (order.payment_id) {
      doc.setFontSize(8);
      doc.text(`Payment ID: ${order.payment_id}`, pageWidth / 2 + 10, orderY + 10);
    }

    y += 10;

    // Items table header
    const tableTop = y;
    const colWidths = [90, 25, 30, 30];
    const colX = [margin, margin + 90, margin + 115, margin + 145];

    // Table header background
    doc.setFillColor(248, 248, 248);
    doc.rect(margin, tableTop, pageWidth - 2 * margin, 8, "F");

    // Header border bottom
    doc.setDrawColor(...primaryColor);
    doc.setLineWidth(0.5);
    doc.line(margin, tableTop + 8, pageWidth - margin, tableTop + 8);

    // Table headers
    doc.setFontSize(9);
    doc.setTextColor(...textGray);
    doc.setFont("helvetica", "bold");
    doc.text("DESCRIPTION", colX[0] + 2, tableTop + 5);
    doc.text("QTY", colX[1] + 2, tableTop + 5);
    doc.text("UNIT PRICE", colX[2] + 2, tableTop + 5);
    doc.text("AMOUNT", colX[3] + 2, tableTop + 5);

    y = tableTop + 14;

    // Table rows
    doc.setFont("helvetica", "normal");
    doc.setTextColor(...textDark);

    items.forEach((item: any, index: number) => {
      doc.setFontSize(10);
      
      // Truncate long names
      let itemName = `${index + 1}. ${item.name}`;
      if (itemName.length > 45) {
        itemName = itemName.substring(0, 42) + "...";
      }
      
      doc.text(itemName, colX[0] + 2, y);
      doc.text(String(item.quantity), colX[1] + 12, y, { align: "center" });
      doc.text(formatCurrency(item.price), colX[2] + 2, y);
      doc.text(formatCurrency(item.total), colX[3] + 2, y);

      // Row separator
      doc.setDrawColor(238, 238, 238);
      doc.setLineWidth(0.2);
      doc.line(margin, y + 4, pageWidth - margin, y + 4);

      y += 10;
    });

    y += 10;

    // Summary section (right aligned)
    const summaryX = pageWidth - margin - 70;
    const summaryValueX = pageWidth - margin;

    doc.setFontSize(10);
    doc.setTextColor(...textGray);

    // Subtotal
    doc.text("Subtotal", summaryX, y);
    doc.setTextColor(...textDark);
    doc.text(formatCurrency(order.subtotal), summaryValueX, y, { align: "right" });
    y += 6;

    // Discount (if any)
    if (Number(order.discount_amount) > 0) {
      doc.setTextColor(...textGray);
      doc.text("Discount", summaryX, y);
      doc.setTextColor(...textDark);
      doc.text(`-${formatCurrency(order.discount_amount)}`, summaryValueX, y, { align: "right" });
      y += 6;
    }

    // Tax
    doc.setTextColor(...textGray);
    doc.text("Tax (GST)", summaryX, y);
    doc.setTextColor(...textDark);
    doc.text(formatCurrency(order.tax_amount), summaryValueX, y, { align: "right" });
    y += 6;

    // Shipping
    doc.setTextColor(...textGray);
    doc.text("Shipping", summaryX, y);
    doc.setTextColor(...textDark);
    doc.text(Number(order.shipping_amount) === 0 ? "FREE" : formatCurrency(order.shipping_amount), summaryValueX, y, { align: "right" });
    y += 8;

    // Total line
    doc.setDrawColor(...textDark);
    doc.setLineWidth(0.5);
    doc.line(summaryX, y, pageWidth - margin, y);
    y += 6;

    // Total
    doc.setFontSize(12);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(...textDark);
    doc.text("Total", summaryX, y);
    doc.setTextColor(...primaryColor);
    doc.text(formatCurrency(order.total_amount), summaryValueX, y, { align: "right" });

    y += 20;

    // GST Box
    doc.setFillColor(249, 249, 249);
    doc.setDrawColor(238, 238, 238);
    doc.roundedRect(margin, y, pageWidth - 2 * margin, 15, 2, 2, "FD");

    doc.setFontSize(9);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(...textGray);
    doc.text("Tax Invoice", margin + 5, y + 6);
    doc.setFontSize(11);
    doc.setTextColor(...textDark);
    doc.text(`GSTIN: ${COMPANY.gst}`, margin + 5, y + 11);

    y += 25;

    // Footer
    doc.setDrawColor(238, 238, 238);
    doc.setLineWidth(0.3);
    doc.line(margin, y, pageWidth - margin, y);

    y += 8;

    doc.setFontSize(11);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(...textDark);
    doc.text("Thank you for your business!", pageWidth / 2, y, { align: "center" });

    y += 6;

    doc.setFontSize(9);
    doc.setFont("helvetica", "normal");
    doc.setTextColor(...textLight);
    doc.text(`${COMPANY.name} | ${COMPANY.website}`, pageWidth / 2, y, { align: "center" });

    y += 5;
    doc.setFontSize(8);
    doc.text("This is a computer-generated invoice and does not require a signature.", pageWidth / 2, y, { align: "center" });

    // Generate PDF as ArrayBuffer
    const pdfArrayBuffer = doc.output("arraybuffer");
    const pdfUint8Array = new Uint8Array(pdfArrayBuffer);

    const fileName = `${invoiceNumber}.pdf`;
    const invoicePath = `${order.user_id}/${fileName}`;

    console.log("Uploading PDF to storage:", invoicePath);

    const { error: uploadError } = await supabase.storage
      .from("invoices")
      .upload(invoicePath, pdfUint8Array, {
        contentType: "application/pdf",
        upsert: true,
      });

    if (uploadError) {
      console.error("Upload error:", uploadError);
      throw new Error("Failed to upload invoice PDF");
    }

    await supabase.from("orders").update({ invoice_url: invoicePath }).eq("id", orderId);
    await supabase.from("invoices").update({ pdf_url: invoicePath }).eq("id", invoice.id);

    console.log("PDF invoice generation complete:", invoicePath);

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
