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

// DECOUVERTES Brand Color Palette
const colors = {
  primary: [28, 28, 28] as [number, number, number],        // Deep charcoal/black
  brand: [35, 35, 35] as [number, number, number],          // Charcoal for headers
  accent: [212, 175, 55] as [number, number, number],       // Gold/yellow accent
  secondary: [85, 85, 85] as [number, number, number],      // Dark gray for text
  muted: [130, 130, 130] as [number, number, number],       // Medium gray for metadata
  border: [220, 220, 220] as [number, number, number],      // Light gray border
  light: [248, 248, 248] as [number, number, number],       // Off-white background
  white: [255, 255, 255] as [number, number, number],
  success: [34, 139, 34] as [number, number, number],       // Forest green
  warning: [205, 133, 63] as [number, number, number],      // Peru/bronze
  error: [178, 34, 34] as [number, number, number],         // Firebrick red
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
      business_name: "Decouvertes",
      business_address: "Innovation Hub, Tech Park",
      business_city: "Pune",
      business_state: "Maharashtra",
      business_pincode: "411001",
      business_phone: "+91 98765 43210",
      business_email: "info@decouvertes.com",
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

    // Create PDF - Professional courier label format
    const doc = new jsPDF({ orientation: "portrait", unit: "mm", format: "a4" });

    const pageWidth = doc.internal.pageSize.getWidth();
    const margin = 12;
    let y = margin;

    // Fetch logo
    let logoBase64: string | null = null;
    const storedLogoUrl = `${supabaseUrl}/storage/v1/object/public/customer-partner-images/email-logo.png`;
    logoBase64 = await fetchImageAsBase64(storedLogoUrl);

    // ==================== HEADER SECTION ====================
    // Top brand bar with gold accent
    doc.setFillColor(...colors.primary);
    doc.rect(0, 0, pageWidth, 5, "F");
    doc.setFillColor(...colors.accent);
    doc.rect(0, 5, pageWidth, 1.5, "F");

    y = 10;

    // Company logo and branding
    if (logoBase64) {
      try { doc.addImage(logoBase64, 'PNG', margin, y, 28, 14); } catch {}
    }

    // Company name in CAPITALS
    doc.setFontSize(18);
    doc.setTextColor(...colors.primary);
    doc.setFont("helvetica", "bold");
    doc.text("DECOUVERTES", margin + (logoBase64 ? 32 : 0), y + 8);

    doc.setFontSize(8);
    doc.setTextColor(...colors.muted);
    doc.setFont("helvetica", "normal");
    doc.text("Shipping Label", margin + (logoBase64 ? 32 : 0), y + 13);

    // Shipment badge on right with gold
    const badgeWidth = 58;
    const badgeX = pageWidth - margin - badgeWidth;
    
    doc.setFillColor(...colors.accent);
    doc.roundedRect(badgeX, y, badgeWidth, 18, 2, 2, "F");
    
    doc.setFontSize(7);
    doc.setTextColor(...colors.primary);
    doc.setFont("helvetica", "bold");
    doc.text("SHIPMENT ID", badgeX + badgeWidth / 2, y + 6, { align: "center" });
    
    doc.setFontSize(10);
    doc.text(shipmentId, badgeX + badgeWidth / 2, y + 13, { align: "center" });

    y = 32;

    // Gold separator
    doc.setDrawColor(...colors.accent);
    doc.setLineWidth(1);
    doc.line(margin, y, pageWidth - margin, y);

    y += 6;

    // ==================== ORDER DETAILS BAR ====================
    doc.setFillColor(...colors.light);
    doc.setDrawColor(...colors.border);
    doc.setLineWidth(0.3);
    doc.roundedRect(margin, y, pageWidth - 2 * margin, 16, 2, 2, "FD");

    const detailsY = y + 5;
    const colWidth = (pageWidth - 2 * margin) / 4;

    // Order number
    doc.setFontSize(6);
    doc.setTextColor(...colors.muted);
    doc.setFont("helvetica", "bold");
    doc.text("ORDER NO", margin + 5, detailsY);
    doc.setFontSize(9);
    doc.setTextColor(...colors.primary);
    doc.setFont("helvetica", "bold");
    doc.text(order.order_number, margin + 5, detailsY + 6);

    // Order date
    doc.setFontSize(6);
    doc.setTextColor(...colors.muted);
    doc.text("DATE", margin + colWidth + 5, detailsY);
    doc.setFontSize(9);
    doc.setTextColor(...colors.primary);
    doc.setFont("helvetica", "normal");
    doc.text(formatDate(order.created_at), margin + colWidth + 5, detailsY + 6);

    // Courier
    doc.setFontSize(6);
    doc.setTextColor(...colors.muted);
    doc.setFont("helvetica", "bold");
    doc.text("COURIER", margin + colWidth * 2 + 5, detailsY);
    doc.setFontSize(9);
    doc.setTextColor(...colors.primary);
    doc.setFont("helvetica", "normal");
    doc.text(order.courier_name || "N/A", margin + colWidth * 2 + 5, detailsY + 6);

    // Tracking ID
    doc.setFontSize(6);
    doc.setTextColor(...colors.muted);
    doc.setFont("helvetica", "bold");
    doc.text("AWB / TRACKING", margin + colWidth * 3 + 5, detailsY);
    doc.setFontSize(9);
    doc.setTextColor(...colors.accent);
    doc.setFont("helvetica", "bold");
    doc.text(order.tracking_id || "N/A", margin + colWidth * 3 + 5, detailsY + 6);

    y += 22;

    // ==================== ADDRESS BLOCKS ====================
    const addressWidth = (pageWidth - 2 * margin - 10) / 2;
    const addressHeight = 52;

    // FROM ADDRESS
    doc.setFillColor(...colors.light);
    doc.setDrawColor(...colors.border);
    doc.setLineWidth(0.5);
    doc.roundedRect(margin, y, addressWidth, addressHeight, 3, 3, "FD");

    // FROM header bar
    doc.setFillColor(...colors.primary);
    doc.roundedRect(margin, y, addressWidth, 9, 3, 3, "F");
    doc.setFillColor(...colors.light);
    doc.rect(margin, y + 6, addressWidth, 3, "F");
    
    doc.setFontSize(8);
    doc.setTextColor(255, 255, 255);
    doc.setFont("helvetica", "bold");
    doc.text("FROM", margin + 5, y + 6);

    // Sender details
    doc.setFontSize(11);
    doc.setTextColor(...colors.primary);
    doc.setFont("helvetica", "bold");
    doc.text("DECOUVERTES", margin + 6, y + 18);

    doc.setFontSize(8);
    doc.setTextColor(...colors.secondary);
    doc.setFont("helvetica", "normal");
    doc.text(company.business_address, margin + 6, y + 24);
    doc.text(`${company.business_city}, ${company.business_state}`, margin + 6, y + 30);
    doc.text(`PIN: ${company.business_pincode}`, margin + 6, y + 36);
    doc.text(`Ph: ${company.business_phone}`, margin + 6, y + 42);

    // TO ADDRESS (highlighted with gold)
    const toX = margin + addressWidth + 10;
    doc.setFillColor(255, 251, 235); // Light gold background
    doc.setDrawColor(...colors.accent);
    doc.setLineWidth(1.5);
    doc.roundedRect(toX, y, addressWidth, addressHeight, 3, 3, "FD");

    // TO header bar with gold
    doc.setFillColor(...colors.accent);
    doc.roundedRect(toX, y, addressWidth, 9, 3, 3, "F");
    doc.setFillColor(255, 251, 235);
    doc.rect(toX, y + 6, addressWidth, 3, "F");
    
    doc.setFontSize(8);
    doc.setTextColor(...colors.primary);
    doc.setFont("helvetica", "bold");
    doc.text("SHIP TO", toX + 5, y + 6);

    // Recipient details
    doc.setFontSize(12);
    doc.setTextColor(...colors.primary);
    doc.setFont("helvetica", "bold");
    doc.text((shippingAddress?.full_name || "Customer").toUpperCase(), toX + 6, y + 18);

    doc.setFontSize(8);
    doc.setTextColor(...colors.secondary);
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

    // Prominent PIN code with gold background
    addrY += 8;
    doc.setFillColor(...colors.primary);
    doc.roundedRect(toX + 6, addrY - 4, 35, 11, 2, 2, "F");
    doc.setFontSize(11);
    doc.setTextColor(255, 255, 255);
    doc.setFont("helvetica", "bold");
    doc.text(shippingAddress?.postal_code || "000000", toX + 23.5, addrY + 4, { align: "center" });

    // Phone
    doc.setFontSize(8);
    doc.setTextColor(...colors.secondary);
    doc.setFont("helvetica", "normal");
    doc.text(`Ph: ${shippingAddress?.phone || "N/A"}`, toX + 45, addrY + 4);

    y += addressHeight + 8;

    // ==================== PACKAGE CONTENTS ====================
    doc.setFontSize(10);
    doc.setTextColor(...colors.primary);
    doc.setFont("helvetica", "bold");
    doc.text("PACKAGE CONTENTS", margin, y);

    y += 5;

    // Contents table
    doc.setFillColor(...colors.light);
    doc.setDrawColor(...colors.border);
    
    const itemCount = order.order_type === "custom_design" ? 1 : (order.order_items?.length || 0);
    const tableHeight = Math.min(9 + itemCount * 7, 38);
    
    doc.roundedRect(margin, y, pageWidth - 2 * margin, tableHeight, 2, 2, "FD");

    // Table header
    doc.setFillColor(...colors.primary);
    doc.rect(margin, y, pageWidth - 2 * margin, 8, "F");
    doc.setFontSize(7);
    doc.setTextColor(255, 255, 255);
    doc.setFont("helvetica", "bold");
    doc.text("ITEM DESCRIPTION", margin + 5, y + 5.5);
    doc.text("QTY", pageWidth - margin - 18, y + 5.5, { align: "center" });

    y += 8;
    doc.setTextColor(...colors.primary);
    doc.setFont("helvetica", "normal");

    if (order.order_type === "custom_design" && order.design_requests) {
      doc.text(`Custom Print - ${order.design_requests.file_name || "Design"}`, margin + 5, y + 5);
      doc.setFont("helvetica", "bold");
      doc.text(String(order.design_requests.quantity || 1), pageWidth - margin - 18, y + 5, { align: "center" });
    } else {
      const maxItems = 4;
      order.order_items?.slice(0, maxItems).forEach((item: any, idx: number) => {
        const name = item.product_name.length > 60 ? item.product_name.substring(0, 57) + "..." : item.product_name;
        doc.setFont("helvetica", "normal");
        doc.text(name, margin + 5, y + 5 + idx * 7);
        doc.setFont("helvetica", "bold");
        doc.text(String(item.quantity), pageWidth - margin - 18, y + 5 + idx * 7, { align: "center" });
      });
      if (order.order_items?.length > maxItems) {
        doc.setTextColor(...colors.muted);
        doc.setFont("helvetica", "italic");
        doc.text(`+ ${order.order_items.length - maxItems} more items`, margin + 5, y + 5 + maxItems * 7);
      }
    }

    y += tableHeight + 8;

    // ==================== QR CODE & VERIFICATION ====================
    const qrBoxWidth = pageWidth - 2 * margin;
    doc.setFillColor(...colors.light);
    doc.setDrawColor(...colors.border);
    doc.roundedRect(margin, y, qrBoxWidth, 48, 3, 3, "FD");

    // QR Code
    const qrSize = 38;
    try {
      doc.addImage(qrCodeDataUrl, 'PNG', margin + 5, y + 5, qrSize, qrSize);
    } catch {}

    // QR border with gold
    doc.setDrawColor(...colors.accent);
    doc.setLineWidth(1);
    doc.rect(margin + 4, y + 4, qrSize + 2, qrSize + 2, "S");

    // Verification info
    const infoX = margin + qrSize + 15;
    doc.setFontSize(11);
    doc.setTextColor(...colors.primary);
    doc.setFont("helvetica", "bold");
    doc.text("SCAN TO VERIFY SHIPMENT", infoX, y + 14);

    doc.setFontSize(8);
    doc.setTextColor(...colors.secondary);
    doc.setFont("helvetica", "normal");
    doc.text("Scan this QR code to verify order authenticity", infoX, y + 21);
    doc.text("and track real-time delivery status.", infoX, y + 27);

    // Dispatch & delivery dates
    doc.setFontSize(8);
    doc.setTextColor(...colors.muted);
    doc.setFont("helvetica", "bold");
    doc.text("DISPATCHED:", infoX, y + 36);
    doc.setTextColor(...colors.primary);
    doc.setFont("helvetica", "normal");
    doc.text(order.shipped_at ? formatDate(order.shipped_at) : formatDate(new Date().toISOString()), infoX + 28, y + 36);

    if (order.expected_delivery_date) {
      doc.setTextColor(...colors.muted);
      doc.setFont("helvetica", "bold");
      doc.text("EXPECTED BY:", infoX, y + 43);
      doc.setTextColor(...colors.success);
      doc.setFont("helvetica", "bold");
      doc.text(formatDate(order.expected_delivery_date), infoX + 28, y + 43);
    }

    y += 55;

    // ==================== COD NOTICE ====================
    if (order.payment_status !== "paid") {
      doc.setFillColor(255, 245, 238); // Light salmon
      doc.setDrawColor(...colors.error);
      doc.setLineWidth(2);
      doc.roundedRect(margin, y, pageWidth - 2 * margin, 22, 3, 3, "FD");

      // COD Badge
      doc.setFillColor(...colors.error);
      doc.roundedRect(margin + 5, y + 5, 14, 12, 2, 2, "F");
      doc.setFontSize(10);
      doc.setTextColor(255, 255, 255);
      doc.setFont("helvetica", "bold");
      doc.text("₹", margin + 12, y + 13, { align: "center" });

      // COD text
      doc.setFontSize(12);
      doc.setTextColor(...colors.error);
      doc.setFont("helvetica", "bold");
      doc.text("CASH ON DELIVERY", margin + 24, y + 10);
      
      doc.setFontSize(8);
      doc.setFont("helvetica", "normal");
      doc.text("Collect amount before handing over package", margin + 24, y + 16);

      // Amount box with gold
      doc.setFillColor(...colors.accent);
      doc.roundedRect(pageWidth - margin - 52, y + 5, 47, 12, 2, 2, "F");
      doc.setFontSize(12);
      doc.setTextColor(...colors.primary);
      doc.setFont("helvetica", "bold");
      doc.text(`₹${Number(order.total_amount).toLocaleString()}`, pageWidth - margin - 28.5, y + 13, { align: "center" });

      y += 28;
    }

    // ==================== FOOTER ====================
    doc.setDrawColor(...colors.accent);
    doc.setLineWidth(0.5);
    doc.line(margin, y, pageWidth - margin, y);

    y += 5;
    doc.setFontSize(6);
    doc.setTextColor(...colors.muted);
    doc.setFont("helvetica", "normal");
    doc.text(`Generated: ${new Date().toLocaleString("en-IN")}`, margin, y);
    doc.text("DECOUVERTES | www.decouvertes.com", pageWidth - margin, y, { align: "right" });

    y += 4;
    doc.text("Handle with care. For verification: decouvertes.com/verify-order", pageWidth / 2, y, { align: "center" });

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
