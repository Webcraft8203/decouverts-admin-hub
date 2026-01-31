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

// Function to fetch and convert image to base64
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
    });
    
    const qrCodeDataUrl = await qrcode(qrData);

    // Create PDF - Professional courier label format
    const doc = new jsPDF({ orientation: "portrait", unit: "mm", format: "a4" });

    const pageWidth = doc.internal.pageSize.getWidth();
    const margin = 10;
    let y = margin;

    // Colors - Professional courier palette
    const colors = {
      dark: [15, 23, 42] as [number, number, number],
      medium: [71, 85, 105] as [number, number, number],
      light: [148, 163, 184] as [number, number, number],
      border: [203, 213, 225] as [number, number, number],
      bg: [248, 250, 252] as [number, number, number],
      accent: [59, 130, 246] as [number, number, number],
      danger: [220, 38, 38] as [number, number, number],
      success: [34, 197, 94] as [number, number, number],
    };

    // Fetch logo
    let logoBase64: string | null = null;
    const storedLogoUrl = `${supabaseUrl}/storage/v1/object/public/customer-partner-images/email-logo.png`;
    logoBase64 = await fetchImageAsBase64(storedLogoUrl);

    // ==================== HEADER - COURIER STYLE ====================
    // Top border bar
    doc.setFillColor(...colors.dark);
    doc.rect(0, 0, pageWidth, 4, "F");

    y = 8;

    // Company logo and name
    if (logoBase64) {
      try { doc.addImage(logoBase64, 'PNG', margin, y, 24, 12); } catch {}
    }
    
    doc.setFontSize(14);
    doc.setTextColor(...colors.dark);
    doc.setFont("helvetica", "bold");
    doc.text(company.business_name, margin + (logoBase64 ? 28 : 0), y + 7);

    // SHIPPING LABEL title - right side
    doc.setFontSize(12);
    doc.setTextColor(...colors.accent);
    doc.text("SHIPPING LABEL", pageWidth - margin, y + 5, { align: "right" });

    // Shipment ID below title
    doc.setFontSize(8);
    doc.setTextColor(...colors.medium);
    doc.setFont("helvetica", "normal");
    doc.text(`ID: ${shipmentId}`, pageWidth - margin, y + 10, { align: "right" });

    y = 28;

    // Separator
    doc.setDrawColor(...colors.border);
    doc.setLineWidth(0.3);
    doc.line(margin, y, pageWidth - margin, y);

    y += 4;

    // ==================== ORDER INFO BAR ====================
    doc.setFillColor(...colors.bg);
    doc.rect(margin, y, pageWidth - 2 * margin, 12, "F");

    doc.setFontSize(7);
    doc.setTextColor(...colors.light);
    doc.text("ORDER", margin + 4, y + 4);
    doc.text("DATE", margin + 50, y + 4);
    doc.text("COURIER", margin + 90, y + 4);
    doc.text("AWB/TRACKING", margin + 130, y + 4);

    doc.setFontSize(8);
    doc.setTextColor(...colors.dark);
    doc.setFont("helvetica", "bold");
    doc.text(order.order_number, margin + 4, y + 9);
    doc.setFont("helvetica", "normal");
    doc.text(formatDate(order.created_at), margin + 50, y + 9);
    doc.text(order.courier_name || "N/A", margin + 90, y + 9);
    doc.setTextColor(...colors.accent);
    doc.setFont("helvetica", "bold");
    doc.text(order.tracking_id || "N/A", margin + 130, y + 9);

    y += 18;

    // ==================== ADDRESS BOXES ====================
    const boxWidth = (pageWidth - 2 * margin - 6) / 2;
    const boxHeight = 42;

    // FROM Box
    doc.setDrawColor(...colors.border);
    doc.setLineWidth(0.5);
    doc.roundedRect(margin, y, boxWidth, boxHeight, 2, 2, "S");

    doc.setFillColor(...colors.dark);
    doc.roundedRect(margin, y, 24, 6, 2, 2, "F");
    doc.setFontSize(7);
    doc.setTextColor(255, 255, 255);
    doc.setFont("helvetica", "bold");
    doc.text("FROM", margin + 3, y + 4.5);

    doc.setFontSize(9);
    doc.setTextColor(...colors.dark);
    doc.setFont("helvetica", "bold");
    doc.text(company.business_name, margin + 4, y + 12);

    doc.setFontSize(7.5);
    doc.setTextColor(...colors.medium);
    doc.setFont("helvetica", "normal");
    doc.text(company.business_address, margin + 4, y + 18);
    doc.text(`${company.business_city}, ${company.business_state}`, margin + 4, y + 23);
    doc.text(`PIN: ${company.business_pincode}`, margin + 4, y + 28);
    doc.text(`Ph: ${company.business_phone}`, margin + 4, y + 33);

    // TO Box (highlighted)
    const toX = margin + boxWidth + 6;
    doc.setFillColor(...colors.bg);
    doc.setDrawColor(...colors.accent);
    doc.setLineWidth(1);
    doc.roundedRect(toX, y, boxWidth, boxHeight, 2, 2, "FD");

    doc.setFillColor(...colors.accent);
    doc.roundedRect(toX, y, 16, 6, 2, 2, "F");
    doc.setFontSize(7);
    doc.setTextColor(255, 255, 255);
    doc.setFont("helvetica", "bold");
    doc.text("TO", toX + 3, y + 4.5);

    doc.setFontSize(10);
    doc.setTextColor(...colors.dark);
    doc.setFont("helvetica", "bold");
    doc.text(shippingAddress?.full_name || "Customer", toX + 4, y + 13);

    doc.setFontSize(8);
    doc.setTextColor(...colors.dark);
    doc.setFont("helvetica", "normal");
    const toLines = [
      shippingAddress?.address_line1 || "",
      shippingAddress?.address_line2 || "",
      `${shippingAddress?.city || ""}, ${shippingAddress?.state || ""}`,
    ].filter(Boolean);
    let toY = y + 19;
    toLines.forEach(line => {
      doc.text(line.toString(), toX + 4, toY);
      toY += 4.5;
    });

    // PIN code highlighted
    doc.setFillColor(...colors.dark);
    doc.roundedRect(toX + 4, toY - 2, 28, 7, 1, 1, "F");
    doc.setFontSize(9);
    doc.setTextColor(255, 255, 255);
    doc.setFont("helvetica", "bold");
    doc.text(shippingAddress?.postal_code || "000000", toX + 7, toY + 3);

    // Phone
    doc.setFontSize(7.5);
    doc.setTextColor(...colors.medium);
    doc.setFont("helvetica", "normal");
    doc.text(`Ph: ${shippingAddress?.phone || "N/A"}`, toX + 36, toY + 3);

    y += boxHeight + 6;

    // ==================== PACKAGE CONTENTS ====================
    doc.setFontSize(8);
    doc.setTextColor(...colors.dark);
    doc.setFont("helvetica", "bold");
    doc.text("PACKAGE CONTENTS", margin, y);

    y += 4;

    // Simple item list
    doc.setDrawColor(...colors.border);
    doc.setFillColor(255, 255, 255);
    doc.roundedRect(margin, y, pageWidth - 2 * margin, 24, 2, 2, "FD");

    doc.setFontSize(7);
    doc.setTextColor(...colors.light);
    doc.text("ITEM", margin + 4, y + 4);
    doc.text("QTY", pageWidth - margin - 20, y + 4);

    y += 7;
    doc.setTextColor(...colors.dark);
    doc.setFont("helvetica", "normal");

    if (order.order_type === "custom_design" && order.design_requests) {
      doc.text(`Custom Print - ${order.design_requests.file_name || "Design"}`, margin + 4, y + 3);
      doc.text(String(order.design_requests.quantity || 1), pageWidth - margin - 18, y + 3);
    } else {
      const maxItems = 3;
      order.order_items?.slice(0, maxItems).forEach((item: any, idx: number) => {
        const name = item.product_name.length > 50 ? item.product_name.substring(0, 47) + "..." : item.product_name;
        doc.text(name, margin + 4, y + 3 + idx * 4.5);
        doc.text(String(item.quantity), pageWidth - margin - 18, y + 3 + idx * 4.5);
      });
      if (order.order_items?.length > maxItems) {
        doc.setTextColor(...colors.light);
        doc.text(`+ ${order.order_items.length - maxItems} more items`, margin + 4, y + 3 + maxItems * 4.5);
      }
    }

    y += 30;

    // ==================== QR CODE & VERIFICATION ====================
    const qrSize = 32;
    const infoWidth = pageWidth - 2 * margin - qrSize - 10;

    // QR Code
    try {
      doc.addImage(qrCodeDataUrl, 'PNG', margin, y, qrSize, qrSize);
    } catch {}

    // Verification info
    const infoX = margin + qrSize + 8;
    doc.setFontSize(9);
    doc.setTextColor(...colors.dark);
    doc.setFont("helvetica", "bold");
    doc.text("SCAN TO VERIFY", infoX, y + 6);

    doc.setFontSize(7);
    doc.setTextColor(...colors.medium);
    doc.setFont("helvetica", "normal");
    doc.text("Scan QR code to verify order authenticity", infoX, y + 12);
    doc.text("and track delivery status.", infoX, y + 16);

    // Dispatch info
    doc.setFontSize(7);
    doc.setTextColor(...colors.light);
    doc.text("DISPATCHED", infoX, y + 24);
    doc.setTextColor(...colors.dark);
    doc.setFont("helvetica", "bold");
    doc.text(order.shipped_at ? formatDate(order.shipped_at) : formatDate(new Date().toISOString()), infoX + 26, y + 24);

    if (order.expected_delivery_date) {
      doc.setTextColor(...colors.light);
      doc.setFont("helvetica", "normal");
      doc.text("EXPECTED", infoX, y + 29);
      doc.setTextColor(...colors.success);
      doc.setFont("helvetica", "bold");
      doc.text(formatDate(order.expected_delivery_date), infoX + 26, y + 29);
    }

    y += qrSize + 8;

    // ==================== COD NOTICE ====================
    if (order.payment_status !== "paid") {
      doc.setFillColor(254, 242, 242);
      doc.setDrawColor(...colors.danger);
      doc.setLineWidth(0.8);
      doc.roundedRect(margin, y, pageWidth - 2 * margin, 14, 2, 2, "FD");

      doc.setFontSize(10);
      doc.setTextColor(...colors.danger);
      doc.setFont("helvetica", "bold");
      doc.text("COD - COLLECT ON DELIVERY", margin + 6, y + 6);
      
      doc.setFontSize(12);
      doc.text(`₹${Number(order.total_amount).toLocaleString()}`, pageWidth - margin - 6, y + 7, { align: "right" });
      
      doc.setFontSize(7);
      doc.setFont("helvetica", "normal");
      doc.text("Collect this amount before handing over the package", margin + 6, y + 11);

      y += 18;
    }

    // ==================== FOOTER ====================
    doc.setDrawColor(...colors.border);
    doc.setLineWidth(0.3);
    doc.line(margin, y, pageWidth - margin, y);

    y += 4;
    doc.setFontSize(6);
    doc.setTextColor(...colors.light);
    doc.text(`Generated: ${new Date().toLocaleString("en-IN")} | ${company.business_name}`, pageWidth / 2, y, { align: "center" });
    doc.text("Verify at: decouverts.com/verify-order", pageWidth / 2, y + 3.5, { align: "center" });

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
