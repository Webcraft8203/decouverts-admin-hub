import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { jsPDF } from "https://esm.sh/jspdf@2.5.1";
import { qrcode } from "https://deno.land/x/qrcode@v2.0.0/mod.ts";

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

const fetchImageAsBase64 = async (url: string): Promise<string | null> => {
  try {
    const response = await fetch(url);
    if (!response.ok) return null;
    const arrayBuffer = await response.arrayBuffer();
    const uint8Array = new Uint8Array(arrayBuffer);
    let binary = '';
    for (let i = 0; i < uint8Array.byteLength; i++) {
      binary += String.fromCharCode(uint8Array[i]);
    }
    const base64 = btoa(binary);
    const contentType = response.headers.get('content-type') || 'image/png';
    return `data:${contentType};base64,${base64}`;
  } catch {
    return null;
  }
};

// Enterprise color palette
const colors = {
  brand: [45, 62, 80] as [number, number, number],
  primary: [30, 41, 59] as [number, number, number],
  secondary: [71, 85, 105] as [number, number, number],
  accent: [16, 185, 129] as [number, number, number],
  muted: [148, 163, 184] as [number, number, number],
  border: [226, 232, 240] as [number, number, number],
  light: [248, 250, 252] as [number, number, number],
  white: [255, 255, 255] as [number, number, number],
  warning: [245, 158, 11] as [number, number, number],
  success: [34, 197, 94] as [number, number, number],
  error: [220, 38, 38] as [number, number, number],
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

    // Fetch order with items
    const { data: order, error: orderError } = await supabase
      .from("orders")
      .select("*, order_items(*, products(name, images)), design_requests(file_url, file_name, size, quantity)")
      .eq("id", orderId)
      .single();

    if (orderError || !order) {
      throw new Error("Order not found");
    }

    if (!order.courier_name || !order.tracking_id) {
      throw new Error("Shipping details not available. Please add courier and tracking information first.");
    }

    // Fetch invoice settings
    const { data: settings } = await supabase.from("invoice_settings").select("*").single();

    const company = settings || {
      business_name: "Decouverts",
      business_address: "Innovation Hub, Tech Park",
      business_city: "Pune",
      business_state: "Maharashtra",
      business_pincode: "411001",
      business_phone: "+91 98765 43210",
      business_email: "info@decouverts.com",
      business_logo_url: null,
    };

    const shippingAddress = order.shipping_address as any;
    const shipmentId = order.shipment_id || `SHP-${Date.now()}`;
    
    // Generate QR code
    const qrData = JSON.stringify({
      orderId: order.id,
      orderNumber: order.order_number,
      shipmentId: shipmentId,
      courier: order.courier_name,
      trackingId: order.tracking_id,
      verify: `https://admin-craft-engine.lovable.app/verify-order?id=${order.id}`,
    });
    
    const qrCodeDataUrl = await qrcode(qrData);

    // Create PDF - Modern courier label format
    const doc = new jsPDF({ orientation: "portrait", unit: "mm", format: "a4" });

    const pageWidth = doc.internal.pageSize.getWidth();
    const margin = 12;
    let y = margin;

    // Fetch logo
    let logoBase64: string | null = null;
    const storedLogoUrl = `${supabaseUrl}/storage/v1/object/public/customer-partner-images/email-logo.png`;
    logoBase64 = await fetchImageAsBase64(storedLogoUrl);

    // ==================== HEADER SECTION ====================
    // Top brand bar
    doc.setFillColor(...colors.brand);
    doc.rect(0, 0, pageWidth, 4, "F");

    y = 8;

    // Company logo and branding
    if (logoBase64) {
      try { doc.addImage(logoBase64, 'PNG', margin, y, 26, 13); } catch {}
    }

    // Company name in CAPITALS
    doc.setFontSize(16);
    doc.setTextColor(...colors.brand);
    doc.setFont("helvetica", "bold");
    doc.text("DECOUVERTS", margin + (logoBase64 ? 30 : 0), y + 7);

    doc.setFontSize(7);
    doc.setTextColor(...colors.secondary);
    doc.setFont("helvetica", "normal");
    doc.text("Shipping Label", margin + (logoBase64 ? 30 : 0), y + 12);

    // Shipment badge on right
    const badgeWidth = 55;
    const badgeX = pageWidth - margin - badgeWidth;
    
    doc.setFillColor(...colors.accent);
    doc.roundedRect(badgeX, y, badgeWidth, 16, 2, 2, "F");
    
    doc.setFontSize(7);
    doc.setTextColor(255, 255, 255);
    doc.setFont("helvetica", "bold");
    doc.text("SHIPMENT ID", badgeX + badgeWidth / 2, y + 5, { align: "center" });
    
    doc.setFontSize(9);
    doc.text(shipmentId, badgeX + badgeWidth / 2, y + 12, { align: "center" });

    y = 28;

    // Separator
    doc.setDrawColor(...colors.brand);
    doc.setLineWidth(0.8);
    doc.line(margin, y, pageWidth - margin, y);

    y += 5;

    // ==================== ORDER DETAILS BAR ====================
    doc.setFillColor(...colors.light);
    doc.setDrawColor(...colors.border);
    doc.roundedRect(margin, y, pageWidth - 2 * margin, 14, 2, 2, "FD");

    const detailsY = y + 4;
    const colWidth = (pageWidth - 2 * margin) / 4;

    // Order number
    doc.setFontSize(6);
    doc.setTextColor(...colors.muted);
    doc.setFont("helvetica", "bold");
    doc.text("ORDER NO", margin + 5, detailsY);
    doc.setFontSize(8);
    doc.setTextColor(...colors.primary);
    doc.setFont("helvetica", "bold");
    doc.text(order.order_number, margin + 5, detailsY + 5);

    // Order date
    doc.setFontSize(6);
    doc.setTextColor(...colors.muted);
    doc.text("DATE", margin + colWidth + 5, detailsY);
    doc.setFontSize(8);
    doc.setTextColor(...colors.primary);
    doc.setFont("helvetica", "normal");
    doc.text(formatDate(order.created_at), margin + colWidth + 5, detailsY + 5);

    // Courier
    doc.setFontSize(6);
    doc.setTextColor(...colors.muted);
    doc.setFont("helvetica", "bold");
    doc.text("COURIER", margin + colWidth * 2 + 5, detailsY);
    doc.setFontSize(8);
    doc.setTextColor(...colors.primary);
    doc.setFont("helvetica", "normal");
    doc.text(order.courier_name || "N/A", margin + colWidth * 2 + 5, detailsY + 5);

    // Tracking ID
    doc.setFontSize(6);
    doc.setTextColor(...colors.muted);
    doc.setFont("helvetica", "bold");
    doc.text("AWB / TRACKING", margin + colWidth * 3 + 5, detailsY);
    doc.setFontSize(8);
    doc.setTextColor(...colors.accent);
    doc.setFont("helvetica", "bold");
    doc.text(order.tracking_id || "N/A", margin + colWidth * 3 + 5, detailsY + 5);

    y += 20;

    // ==================== ADDRESS BLOCKS ====================
    const addressWidth = (pageWidth - 2 * margin - 8) / 2;
    const addressHeight = 50;

    // FROM ADDRESS
    doc.setFillColor(...colors.light);
    doc.setDrawColor(...colors.border);
    doc.setLineWidth(0.5);
    doc.roundedRect(margin, y, addressWidth, addressHeight, 3, 3, "FD");

    // FROM badge
    doc.setFillColor(...colors.brand);
    doc.roundedRect(margin + 5, y + 4, 22, 7, 1, 1, "F");
    doc.setFontSize(7);
    doc.setTextColor(255, 255, 255);
    doc.setFont("helvetica", "bold");
    doc.text("FROM", margin + 16, y + 9, { align: "center" });

    // Sender details
    doc.setFontSize(10);
    doc.setTextColor(...colors.primary);
    doc.setFont("helvetica", "bold");
    doc.text("DECOUVERTS", margin + 6, y + 18);

    doc.setFontSize(8);
    doc.setTextColor(...colors.secondary);
    doc.setFont("helvetica", "normal");
    doc.text(company.business_address, margin + 6, y + 24);
    doc.text(`${company.business_city}, ${company.business_state}`, margin + 6, y + 30);
    doc.text(`PIN: ${company.business_pincode}`, margin + 6, y + 36);
    doc.text(`Ph: ${company.business_phone}`, margin + 6, y + 42);

    // TO ADDRESS (highlighted)
    const toX = margin + addressWidth + 8;
    doc.setFillColor(240, 253, 244); // Light green background
    doc.setDrawColor(...colors.accent);
    doc.setLineWidth(1.5);
    doc.roundedRect(toX, y, addressWidth, addressHeight, 3, 3, "FD");

    // TO badge
    doc.setFillColor(...colors.accent);
    doc.roundedRect(toX + 5, y + 4, 16, 7, 1, 1, "F");
    doc.setFontSize(7);
    doc.setTextColor(255, 255, 255);
    doc.setFont("helvetica", "bold");
    doc.text("TO", toX + 13, y + 9, { align: "center" });

    // Recipient details
    doc.setFontSize(11);
    doc.setTextColor(...colors.primary);
    doc.setFont("helvetica", "bold");
    doc.text((shippingAddress?.full_name || "Customer").toUpperCase(), toX + 6, y + 18);

    doc.setFontSize(8);
    doc.setTextColor(...colors.primary);
    doc.setFont("helvetica", "normal");
    
    let addrY = y + 25;
    if (shippingAddress?.address_line1) {
      doc.text(shippingAddress.address_line1, toX + 6, addrY);
      addrY += 5;
    }
    if (shippingAddress?.address_line2) {
      doc.text(shippingAddress.address_line2, toX + 6, addrY);
      addrY += 5;
    }
    doc.text(`${shippingAddress?.city || ""}, ${shippingAddress?.state || ""}`, toX + 6, addrY);

    // Prominent PIN code
    addrY += 8;
    doc.setFillColor(...colors.brand);
    doc.roundedRect(toX + 6, addrY - 4, 32, 10, 2, 2, "F");
    doc.setFontSize(10);
    doc.setTextColor(255, 255, 255);
    doc.setFont("helvetica", "bold");
    doc.text(shippingAddress?.postal_code || "000000", toX + 22, addrY + 3, { align: "center" });

    // Phone
    doc.setFontSize(8);
    doc.setTextColor(...colors.secondary);
    doc.setFont("helvetica", "normal");
    doc.text(`Ph: ${shippingAddress?.phone || "N/A"}`, toX + 42, addrY + 3);

    y += addressHeight + 8;

    // ==================== PACKAGE CONTENTS ====================
    doc.setFontSize(9);
    doc.setTextColor(...colors.brand);
    doc.setFont("helvetica", "bold");
    doc.text("PACKAGE CONTENTS", margin, y);

    y += 5;

    // Contents table
    doc.setFillColor(...colors.light);
    doc.setDrawColor(...colors.border);
    
    const itemCount = order.order_type === "custom_design" ? 1 : (order.order_items?.length || 0);
    const tableHeight = Math.min(8 + itemCount * 7, 35);
    
    doc.roundedRect(margin, y, pageWidth - 2 * margin, tableHeight, 2, 2, "FD");

    // Table header
    doc.setFillColor(...colors.brand);
    doc.rect(margin, y, pageWidth - 2 * margin, 7, "F");
    doc.setFontSize(7);
    doc.setTextColor(255, 255, 255);
    doc.setFont("helvetica", "bold");
    doc.text("ITEM DESCRIPTION", margin + 5, y + 5);
    doc.text("QTY", pageWidth - margin - 15, y + 5, { align: "center" });

    y += 7;
    doc.setTextColor(...colors.primary);
    doc.setFont("helvetica", "normal");

    if (order.order_type === "custom_design" && order.design_requests) {
      doc.text(`Custom Print - ${order.design_requests.file_name || "Design"}`, margin + 5, y + 5);
      doc.text(String(order.design_requests.quantity || 1), pageWidth - margin - 15, y + 5, { align: "center" });
    } else {
      const maxItems = 4;
      order.order_items?.slice(0, maxItems).forEach((item: any, idx: number) => {
        const name = item.product_name.length > 60 ? item.product_name.substring(0, 57) + "..." : item.product_name;
        doc.text(name, margin + 5, y + 5 + idx * 6);
        doc.text(String(item.quantity), pageWidth - margin - 15, y + 5 + idx * 6, { align: "center" });
      });
      if (order.order_items?.length > maxItems) {
        doc.setTextColor(...colors.muted);
        doc.setFont("helvetica", "italic");
        doc.text(`+ ${order.order_items.length - maxItems} more items`, margin + 5, y + 5 + maxItems * 6);
      }
    }

    y += tableHeight + 8;

    // ==================== QR CODE & VERIFICATION ====================
    const qrBoxWidth = pageWidth - 2 * margin;
    doc.setFillColor(...colors.light);
    doc.setDrawColor(...colors.border);
    doc.roundedRect(margin, y, qrBoxWidth, 45, 3, 3, "FD");

    // QR Code
    const qrSize = 35;
    try {
      doc.addImage(qrCodeDataUrl, 'PNG', margin + 5, y + 5, qrSize, qrSize);
    } catch {}

    // QR border
    doc.setDrawColor(...colors.border);
    doc.setLineWidth(0.5);
    doc.rect(margin + 4, y + 4, qrSize + 2, qrSize + 2, "S");

    // Verification info
    const infoX = margin + qrSize + 15;
    doc.setFontSize(10);
    doc.setTextColor(...colors.brand);
    doc.setFont("helvetica", "bold");
    doc.text("SCAN TO VERIFY SHIPMENT", infoX, y + 12);

    doc.setFontSize(7);
    doc.setTextColor(...colors.secondary);
    doc.setFont("helvetica", "normal");
    doc.text("Scan this QR code to verify order authenticity", infoX, y + 18);
    doc.text("and track real-time delivery status.", infoX, y + 23);

    // Dispatch & delivery dates
    doc.setFontSize(7);
    doc.setTextColor(...colors.muted);
    doc.setFont("helvetica", "bold");
    doc.text("DISPATCHED:", infoX, y + 32);
    doc.setTextColor(...colors.primary);
    doc.setFont("helvetica", "normal");
    doc.text(order.shipped_at ? formatDate(order.shipped_at) : formatDate(new Date().toISOString()), infoX + 25, y + 32);

    if (order.expected_delivery_date) {
      doc.setTextColor(...colors.muted);
      doc.setFont("helvetica", "bold");
      doc.text("EXPECTED BY:", infoX, y + 38);
      doc.setTextColor(...colors.success);
      doc.setFont("helvetica", "bold");
      doc.text(formatDate(order.expected_delivery_date), infoX + 25, y + 38);
    }

    y += 52;

    // ==================== COD NOTICE ====================
    if (order.payment_status !== "paid") {
      doc.setFillColor(254, 242, 242);
      doc.setDrawColor(...colors.error);
      doc.setLineWidth(1.5);
      doc.roundedRect(margin, y, pageWidth - 2 * margin, 20, 3, 3, "FD");

      // COD Badge
      doc.setFillColor(...colors.error);
      doc.roundedRect(margin + 5, y + 4, 12, 12, 2, 2, "F");
      doc.setFontSize(8);
      doc.setTextColor(255, 255, 255);
      doc.setFont("helvetica", "bold");
      doc.text("₹", margin + 11, y + 12, { align: "center" });

      // COD text
      doc.setFontSize(11);
      doc.setTextColor(...colors.error);
      doc.setFont("helvetica", "bold");
      doc.text("CASH ON DELIVERY", margin + 22, y + 9);
      
      doc.setFontSize(7);
      doc.setFont("helvetica", "normal");
      doc.text("Collect amount before handing over package", margin + 22, y + 14);

      // Amount box
      doc.setFillColor(...colors.error);
      doc.roundedRect(pageWidth - margin - 50, y + 4, 45, 12, 2, 2, "F");
      doc.setFontSize(11);
      doc.setTextColor(255, 255, 255);
      doc.setFont("helvetica", "bold");
      doc.text(`₹${Number(order.total_amount).toLocaleString()}`, pageWidth - margin - 27.5, y + 12, { align: "center" });

      y += 26;
    }

    // ==================== FOOTER ====================
    doc.setDrawColor(...colors.border);
    doc.setLineWidth(0.3);
    doc.line(margin, y, pageWidth - margin, y);

    y += 5;
    doc.setFontSize(6);
    doc.setTextColor(...colors.muted);
    doc.setFont("helvetica", "normal");
    doc.text(`Generated: ${new Date().toLocaleString("en-IN")}`, margin, y);
    doc.text("DECOUVERTS | www.decouverts.com", pageWidth - margin, y, { align: "right" });

    y += 4;
    doc.text("Handle with care. For verification: decouverts.com/verify-order", pageWidth / 2, y, { align: "center" });

    // Generate and upload PDF
    const pdfArrayBuffer = doc.output("arraybuffer");
    const pdfUint8Array = new Uint8Array(pdfArrayBuffer);

    const fileName = `shipping-labels/${order.order_number}-${shipmentId}.pdf`;
    
    const { error: uploadError } = await supabase.storage
      .from("invoices")
      .upload(fileName, pdfUint8Array, { contentType: "application/pdf", upsert: true });

    if (uploadError) {
      throw new Error("Failed to upload shipping label");
    }

    // Update order
    await supabase
      .from("orders")
      .update({ shipping_label_url: fileName, shipment_id: shipmentId })
      .eq("id", orderId);

    return new Response(
      JSON.stringify({
        success: true,
        message: "Shipping label generated successfully",
        labelPath: fileName,
        shipmentId: shipmentId,
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 200 }
    );

  } catch (error) {
    console.error("Error generating shipping label:", error);
    return new Response(
      JSON.stringify({
        success: false,
        error: error instanceof Error ? error.message : "Failed to generate shipping label",
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 400 }
    );
  }
});
