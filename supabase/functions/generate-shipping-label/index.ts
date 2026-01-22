import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { jsPDF } from "https://esm.sh/jspdf@2.5.1";
// CHANGED: Replaced 'qrcode' with 'qr-image' to fix the Canvas error
import qr from "https://esm.sh/qr-image@3.2.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const formatDate = (dateStr: string): string => {
  return new Date(dateStr).toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
};

const formatDateTime = (dateStr: string): string => {
  return new Date(dateStr).toLocaleString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
};

// Function to fetch and convert image to base64
const fetchImageAsBase64 = async (url: string): Promise<string | null> => {
  try {
    console.log("Fetching logo from:", url);
    const response = await fetch(url);
    if (!response.ok) {
      console.error("Failed to fetch logo:", response.status);
      return null;
    }
    const arrayBuffer = await response.arrayBuffer();
    const uint8Array = new Uint8Array(arrayBuffer);
    let binary = "";
    for (let i = 0; i < uint8Array.byteLength; i++) {
      binary += String.fromCharCode(uint8Array[i]);
    }
    const base64 = btoa(binary);
    const contentType = response.headers.get("content-type") || "image/png";
    return `data:${contentType};base64,${base64}`;
  } catch (error) {
    console.error("Error fetching logo:", error);
    return null;
  }
};

interface ShippingLabelRequest {
  orderId: string;
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const { orderId }: ShippingLabelRequest = await req.json();

    if (!orderId) {
      throw new Error("Order ID is required");
    }

    console.log("Generating shipping label for order:", orderId);

    // Fetch order with items
    const { data: order, error: orderError } = await supabase
      .from("orders")
      .select("*, order_items(*, products(name, images)), design_requests(file_url, file_name, size, quantity)")
      .eq("id", orderId)
      .single();

    if (orderError || !order) {
      console.error("Order fetch error:", orderError);
      throw new Error("Order not found");
    }

    // Ensure order has shipping details
    if (!order.courier_name || !order.tracking_id) {
      throw new Error("Shipping details not available. Please add courier and tracking information first.");
    }

    // Fetch invoice settings for company info
    const { data: settings } = await supabase.from("invoice_settings").select("*").single();

    const companySettings = settings || {
      business_name: "Decouverts",
      business_address: "Innovation Hub, Tech Park",
      business_city: "Pune",
      business_state: "Maharashtra",
      business_pincode: "411001",
      business_country: "India",
      business_phone: "+91 98765 43210",
      business_email: "info@decouverts.com",
      business_gstin: "27XXXXX1234X1ZX",
      business_logo_url: null,
    };

    console.log("Order found:", order.order_number);

    const shippingAddress = order.shipping_address as any;
    const shipmentId = order.shipment_id || `SHP-${Date.now()}`;

    // Generate QR code data
    const qrData = {
      orderId: order.id,
      orderNumber: order.order_number,
      shipmentId: shipmentId,
      courier: order.courier_name,
      trackingId: order.tracking_id,
      timestamp: new Date().toISOString(),
    };

    // --- FIXED QR GENERATION SECTION ---
    // Generate QR code as PNG Buffer using qr-image (Pure JS, server-compatible)
    const qrPngBuffer = qr.imageSync(JSON.stringify(qrData), { type: "png", margin: 2 });

    // Safely convert Buffer to Base64 string for jsPDF
    const qrBytes = new Uint8Array(qrPngBuffer);
    let qrBinary = "";
    for (let i = 0; i < qrBytes.byteLength; i++) {
      qrBinary += String.fromCharCode(qrBytes[i]);
    }
    const qrCodeDataUrl = `data:image/png;base64,${btoa(qrBinary)}`;
    // --- END FIX ---

    // Create PDF
    const doc = new jsPDF({
      orientation: "portrait",
      unit: "mm",
      format: "a4",
    });

    const pageWidth = doc.internal.pageSize.getWidth();
    const pageHeight = doc.internal.pageSize.getHeight();
    const margin = 15;
    let y = 15;

    // Colors
    const primaryColor: [number, number, number] = [234, 171, 28]; // #EAAB1C
    const textDark: [number, number, number] = [33, 33, 33];
    const textGray: [number, number, number] = [102, 102, 102];
    const accentBlue: [number, number, number] = [59, 130, 246];
    const borderColor: [number, number, number] = [200, 200, 200];

    // ==================== HEADER ====================
    // Fetch logo if available
    let logoBase64: string | null = null;
    if (companySettings.business_logo_url) {
      logoBase64 = await fetchImageAsBase64(companySettings.business_logo_url);
    }

    // Add logo if available
    const logoWidth = 30;
    const logoHeight = 15;
    if (logoBase64) {
      try {
        doc.addImage(logoBase64, "PNG", margin, y, logoWidth, logoHeight);
      } catch (logoError) {
        console.error("Failed to add logo to PDF:", logoError);
      }
    }

    // Company Name
    const textStartX = logoBase64 ? margin + logoWidth + 5 : margin;
    doc.setFontSize(20);
    doc.setTextColor(...primaryColor);
    doc.setFont("helvetica", "bold");
    doc.text(companySettings.business_name, textStartX, y + 8);

    // SHIPPING LABEL title on the right
    doc.setFontSize(16);
    doc.setTextColor(...accentBlue);
    doc.text("SHIPPING LABEL", pageWidth - margin, y + 6, { align: "right" });

    y += logoBase64 ? Math.max(logoHeight + 2, 10) : 8;

    // Company tagline
    doc.setFontSize(9);
    doc.setTextColor(...textGray);
    doc.setFont("helvetica", "normal");
    doc.text("Discovering Future Technologies", textStartX, y);

    y += 5;

    // Company contact
    doc.setFontSize(8);
    doc.text(`${companySettings.business_phone} | ${companySettings.business_email}`, margin, y);

    y += 8;

    // Header separator
    doc.setDrawColor(...primaryColor);
    doc.setLineWidth(1);
    doc.line(margin, y, pageWidth - margin, y);

    y += 10;

    // ==================== ORDER & SHIPMENT INFO ====================
    const colWidth = (pageWidth - 2 * margin - 10) / 2;

    // Left column - Order Info
    doc.setFontSize(10);
    doc.setTextColor(...primaryColor);
    doc.setFont("helvetica", "bold");
    doc.text("ORDER DETAILS", margin, y);

    // Right column - Shipment Info
    doc.text("SHIPMENT DETAILS", margin + colWidth + 10, y);

    y += 6;

    // Order details
    doc.setFontSize(9);
    doc.setTextColor(...textDark);
    doc.setFont("helvetica", "normal");

    const orderDetails = [
      { label: "Order No:", value: order.order_number },
      { label: "Order Date:", value: formatDate(order.created_at) },
      { label: "Payment:", value: order.payment_status === "paid" ? "Prepaid" : "Cash on Delivery" },
      { label: "Amount:", value: `₹${Number(order.total_amount).toLocaleString()}` },
    ];

    const shipmentDetails = [
      { label: "Shipment ID:", value: shipmentId },
      { label: "Courier:", value: order.courier_name },
      { label: "AWB/Tracking:", value: order.tracking_id },
      { label: "Expected:", value: order.expected_delivery_date ? formatDate(order.expected_delivery_date) : "TBD" },
    ];

    orderDetails.forEach((detail, i) => {
      doc.setFont("helvetica", "bold");
      doc.text(detail.label, margin, y + i * 5);
      doc.setFont("helvetica", "normal");
      doc.text(detail.value, margin + 28, y + i * 5);
    });

    shipmentDetails.forEach((detail, i) => {
      doc.setFont("helvetica", "bold");
      doc.text(detail.label, margin + colWidth + 10, y + i * 5);
      doc.setFont("helvetica", "normal");
      doc.text(detail.value, margin + colWidth + 38, y + i * 5);
    });

    y += 25;

    // Separator
    doc.setDrawColor(...borderColor);
    doc.setLineWidth(0.5);
    doc.line(margin, y, pageWidth - margin, y);

    y += 8;

    // ==================== ADDRESSES ====================
    // FROM Address (Seller/Pickup)
    doc.setFillColor(248, 248, 248);
    doc.roundedRect(margin, y, colWidth, 45, 3, 3, "F");

    doc.setFontSize(10);
    doc.setTextColor(...accentBlue);
    doc.setFont("helvetica", "bold");
    doc.text("📦 FROM (Pickup)", margin + 5, y + 7);

    doc.setFontSize(9);
    doc.setTextColor(...textDark);
    doc.setFont("helvetica", "bold");
    doc.text(companySettings.business_name, margin + 5, y + 14);

    doc.setFont("helvetica", "normal");
    doc.setTextColor(...textGray);
    const fromAddressLines = [
      companySettings.business_address,
      `${companySettings.business_city}, ${companySettings.business_state}`,
      `PIN: ${companySettings.business_pincode}`,
      `Phone: ${companySettings.business_phone}`,
    ];
    fromAddressLines.forEach((line, i) => {
      doc.text(line, margin + 5, y + 20 + i * 5);
    });

    // TO Address (Customer/Delivery)
    doc.setFillColor(254, 243, 199); // Light yellow
    doc.roundedRect(margin + colWidth + 10, y, colWidth, 45, 3, 3, "F");

    doc.setFontSize(10);
    doc.setTextColor(180, 83, 9); // Amber
    doc.setFont("helvetica", "bold");
    doc.text("📍 TO (Delivery)", margin + colWidth + 15, y + 7);

    doc.setFontSize(9);
    doc.setTextColor(...textDark);
    doc.setFont("helvetica", "bold");
    doc.text(shippingAddress?.full_name || "Customer", margin + colWidth + 15, y + 14);

    doc.setFont("helvetica", "normal");
    doc.setTextColor(...textGray);
    const toAddressLines = [
      shippingAddress?.address_line1 || "",
      shippingAddress?.address_line2 || "",
      `${shippingAddress?.city || ""}, ${shippingAddress?.state || ""}`,
      `PIN: ${shippingAddress?.postal_code || ""}`,
      `Phone: ${shippingAddress?.phone || "N/A"}`,
    ].filter(Boolean);
    toAddressLines.forEach((line, i) => {
      if (line) {
        doc.text(line.toString(), margin + colWidth + 15, y + 20 + i * 5);
      }
    });

    y += 55;

    // ==================== PRODUCT SUMMARY ====================
    doc.setFontSize(10);
    doc.setTextColor(...primaryColor);
    doc.setFont("helvetica", "bold");
    doc.text("PACKAGE CONTENTS", margin, y);

    y += 6;

    // Table header
    doc.setFillColor(248, 248, 248);
    doc.rect(margin, y, pageWidth - 2 * margin, 8, "F");

    doc.setFontSize(8);
    doc.setTextColor(...textGray);
    doc.setFont("helvetica", "bold");
    doc.text("Product", margin + 3, y + 5.5);
    doc.text("Qty", pageWidth - margin - 30, y + 5.5);
    doc.text("Weight", pageWidth - margin - 15, y + 5.5);

    y += 10;

    // Product rows
    doc.setFont("helvetica", "normal");
    doc.setTextColor(...textDark);

    if (order.order_type === "custom_design" && order.design_requests) {
      doc.text(`Custom Print - ${order.design_requests.file_name || "Design"}`, margin + 3, y + 3);
      doc.text(String(order.design_requests.quantity || 1), pageWidth - margin - 30, y + 3);
      doc.text("-", pageWidth - margin - 15, y + 3);
      y += 8;
    } else {
      order.order_items?.forEach((item: any) => {
        const productName =
          item.product_name.length > 45 ? item.product_name.substring(0, 42) + "..." : item.product_name;
        doc.text(productName, margin + 3, y + 3);
        doc.text(String(item.quantity), pageWidth - margin - 30, y + 3);
        doc.text("-", pageWidth - margin - 15, y + 3);
        y += 7;
      });
    }

    y += 5;

    // ==================== QR CODE SECTION ====================
    doc.setDrawColor(...borderColor);
    doc.setLineWidth(0.5);
    doc.line(margin, y, pageWidth - margin, y);

    y += 8;

    // QR Code
    const qrSize = 40;
    try {
      doc.addImage(qrCodeDataUrl, "PNG", margin, y, qrSize, qrSize);
    } catch (qrError) {
      console.error("Failed to add QR code:", qrError);
    }

    // QR Code description
    doc.setFontSize(10);
    doc.setTextColor(...primaryColor);
    doc.setFont("helvetica", "bold");
    doc.text("Scan to Verify", margin + qrSize + 10, y + 8);

    doc.setFontSize(8);
    doc.setTextColor(...textGray);
    doc.setFont("helvetica", "normal");
    doc.text("Scan this QR code to verify order", margin + qrSize + 10, y + 15);
    doc.text("authenticity and track delivery status.", margin + qrSize + 10, y + 20);

    doc.setTextColor(...accentBlue);
    doc.text("Order ID: " + order.id.substring(0, 8) + "...", margin + qrSize + 10, y + 28);

    // Dispatch info on right
    doc.setFontSize(9);
    doc.setTextColor(...textDark);
    doc.setFont("helvetica", "bold");
    doc.text("Dispatched:", pageWidth - margin - 50, y + 10);
    doc.setFont("helvetica", "normal");
    doc.text(
      order.shipped_at ? formatDateTime(order.shipped_at) : formatDateTime(new Date().toISOString()),
      pageWidth - margin - 50,
      y + 16,
    );

    y += qrSize + 10;

    // ==================== DELIVERY INSTRUCTIONS ====================
    if (order.notes || order.delivery_notes) {
      doc.setFillColor(254, 249, 195); // Light yellow
      doc.roundedRect(margin, y, pageWidth - 2 * margin, 20, 3, 3, "F");

      doc.setFontSize(9);
      doc.setTextColor(161, 98, 7); // Amber dark
      doc.setFont("helvetica", "bold");
      doc.text("📝 Delivery Instructions:", margin + 5, y + 7);
      doc.setFont("helvetica", "normal");
      doc.text(order.delivery_notes || order.notes || "Handle with care", margin + 5, y + 14);

      y += 25;
    }

    // ==================== FOOTER ====================
    // COD Amount Box (if applicable)
    if (order.payment_status !== "paid") {
      doc.setFillColor(254, 226, 226); // Light red
      doc.roundedRect(margin, y, pageWidth - 2 * margin, 18, 3, 3, "F");

      doc.setFontSize(12);
      doc.setTextColor(185, 28, 28); // Red
      doc.setFont("helvetica", "bold");
      doc.text("💰 COLLECT ON DELIVERY", margin + 5, y + 8);
      doc.text(`₹${Number(order.total_amount).toLocaleString()}`, pageWidth - margin - 5, y + 8, { align: "right" });

      doc.setFontSize(8);
      doc.setTextColor(127, 29, 29);
      doc.setFont("helvetica", "normal");
      doc.text("Please collect this amount before handing over the package", margin + 5, y + 14);

      y += 22;
    }

    // Bottom bar
    y = pageHeight - 20;
    doc.setFillColor(248, 248, 248);
    doc.rect(0, y - 5, pageWidth, 25, "F");

    doc.setFontSize(8);
    doc.setTextColor(...textGray);
    doc.setFont("helvetica", "normal");
    doc.text(
      `Generated: ${formatDateTime(new Date().toISOString())} | ${companySettings.business_name}`,
      pageWidth / 2,
      y + 2,
      { align: "center" },
    );
    doc.text("Verify this shipment at: decouverts.com/verify-order", pageWidth / 2, y + 7, { align: "center" });

    // Generate PDF as array buffer
    const pdfArrayBuffer = doc.output("arraybuffer");
    const pdfUint8Array = new Uint8Array(pdfArrayBuffer);

    // Upload to storage
    const fileName = `shipping-labels/${order.order_number}-${shipmentId}.pdf`;

    const { data: uploadData, error: uploadError } = await supabase.storage
      .from("invoices")
      .upload(fileName, pdfUint8Array, {
        contentType: "application/pdf",
        upsert: true,
      });

    if (uploadError) {
      console.error("Upload error:", uploadError);
      throw new Error("Failed to upload shipping label");
    }

    console.log("Shipping label uploaded:", fileName);

    // Update order with shipping label URL
    const { error: updateError } = await supabase
      .from("orders")
      .update({
        shipping_label_url: fileName,
        shipment_id: shipmentId,
      })
      .eq("id", orderId);

    if (updateError) {
      console.error("Update error:", updateError);
    }

    return new Response(
      JSON.stringify({
        success: true,
        message: "Shipping label generated successfully",
        labelPath: fileName,
        shipmentId: shipmentId,
      }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      },
    );
  } catch (error) {
    console.error("Error generating shipping label:", error);
    return new Response(
      JSON.stringify({
        success: false,
        error: error instanceof Error ? error.message : "Failed to generate shipping label",
      }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 400,
      },
    );
  }
});
