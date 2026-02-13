import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { jsPDF } from "https://esm.sh/jspdf@2.5.1";
import { qrcode } from "https://deno.land/x/qrcode@v2.0.0/mod.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// ==================== UNIFIED DECOUVERTES TEMPLATE ====================
// Synchronized with invoice template (generate-invoice/index.ts)

const COLORS = {
  primary: [28, 28, 28] as [number, number, number],
  accent: [212, 175, 55] as [number, number, number],
  orange: [230, 126, 34] as [number, number, number],
  secondary: [68, 68, 68] as [number, number, number],
  muted: [130, 130, 130] as [number, number, number],
  light: [245, 245, 245] as [number, number, number],
  border: [218, 218, 218] as [number, number, number],
  white: [255, 255, 255] as [number, number, number],
  tableHeader: [28, 28, 28] as [number, number, number],
  tableAlt: [250, 250, 250] as [number, number, number],
  darkBox: [38, 38, 38] as [number, number, number],
  success: [34, 139, 34] as [number, number, number],
  error: [178, 34, 34] as [number, number, number],
  codBg: [255, 240, 240] as [number, number, number],
};

const COMPANY = {
  name: "DECOUVERTES",
  tagline: "Discovering Future Technologies",
  address: "Megapolis Springs, Phase 3, Hinjawadi Rajiv Gandhi Infotech Park",
  city: "Pune",
  state: "Maharashtra",
  pincode: "411057",
  country: "India",
  phone: "+91 9561103435",
  email: "hello@decouvertes.com",
  gstin: "27AAKCD1492N1Z4",
  website: "www.decouvertes.com",
};

const PAGE = { width: 210, height: 297, margin: 14 };

const fmtDate = (d: string): string =>
  new Date(d).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" });

const fmt = (amount: number): string =>
  `₹${Number(amount || 0).toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

const fetchImageAsBase64 = async (url: string): Promise<string | null> => {
  try {
    const response = await fetch(url, { headers: { Accept: "image/*" } });
    if (!response.ok) return null;
    const arrayBuffer = await response.arrayBuffer();
    const uint8Array = new Uint8Array(arrayBuffer);
    let binary = "";
    for (let i = 0; i < uint8Array.byteLength; i++) {
      binary += String.fromCharCode(uint8Array[i]);
    }
    const base64 = btoa(binary);
    const contentType = response.headers.get("content-type") || "image/png";
    return `data:${contentType};base64,${base64}`;
  } catch {
    return null;
  }
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
    if (!orderId) throw new Error("Order ID is required");

    // Fetch order with items
    const { data: order, error: orderError } = await supabase
      .from("orders")
      .select("*, order_items(*, products(name, images, sku, weight)), design_requests(file_url, file_name, size, quantity)")
      .eq("id", orderId)
      .single();

    if (orderError || !order) throw new Error("Order not found");
    if (!order.courier_name || !order.tracking_id) {
      throw new Error("Shipping details not available. Please add courier and tracking information first.");
    }

    // Fetch invoice settings for company info
    const { data: settings } = await supabase.from("invoice_settings").select("*").single();
    const company = settings || {
      business_name: COMPANY.name,
      business_address: COMPANY.address,
      business_city: COMPANY.city,
      business_state: COMPANY.state,
      business_pincode: COMPANY.pincode,
      business_phone: COMPANY.phone,
      business_email: COMPANY.email,
      business_logo_url: null,
    };

    // Fetch customer profile
    const { data: profile } = await supabase.from("profiles").select("email, full_name, phone").eq("id", order.user_id).single();

    const shippingAddress = order.shipping_address as any;
    const shipmentId = order.shipment_id || `SHP-${Date.now()}`;

    // Generate QR code
    const qrData = JSON.stringify({
      orderId: order.id,
      orderNumber: order.order_number,
      shipmentId,
      courier: order.courier_name,
      trackingId: order.tracking_id,
      verify: `https://admin-craft-engine.lovable.app/verify-order?id=${order.id}`,
    });
    const qrCodeDataUrl = await qrcode(qrData);

    // Fetch logo
    const storedLogoUrl = `${supabaseUrl}/storage/v1/object/public/customer-partner-images/email-logo.png`;
    let logoBase64 = await fetchImageAsBase64(storedLogoUrl);
    if (!logoBase64 && company.business_logo_url) logoBase64 = await fetchImageAsBase64(company.business_logo_url);

    // Calculate totals
    const totalItems = order.order_type === "custom_design"
      ? (order.design_requests?.quantity || 1)
      : (order.order_items?.reduce((sum: number, i: any) => sum + i.quantity, 0) || 0);
    const totalWeight = order.order_items?.reduce((sum: number, i: any) => sum + ((i.products?.weight || 0.5) * i.quantity), 0) || 0;

    // ==================== CREATE PDF ====================
    const doc = new jsPDF({ orientation: "portrait", unit: "mm", format: "a4" });
    const { width: pw, margin: M } = PAGE;
    const CW = pw - 2 * M;
    let y = M;

    // ==================== 1. HEADER (matches invoice) ====================
    if (logoBase64) {
      try { doc.addImage(logoBase64, "PNG", M, y, 24, 12); } catch { /* ignore */ }
    }
    const logoTextX = logoBase64 ? M + 28 : M;
    doc.setFontSize(20);
    doc.setTextColor(...COLORS.primary);
    doc.setFont("helvetica", "bold");
    doc.text(COMPANY.name, logoTextX, y + 8);
    doc.setFontSize(8);
    doc.setTextColor(...COLORS.orange);
    doc.setFont("helvetica", "italic");
    doc.text(COMPANY.tagline, logoTextX, y + 13);

    // Label type on right
    doc.setFontSize(11);
    doc.setTextColor(...COLORS.primary);
    doc.setFont("helvetica", "bold");
    doc.text("SHIPPING LABEL", pw - M, y + 8, { align: "right" });
    doc.setFontSize(6);
    doc.setTextColor(...COLORS.muted);
    doc.setFont("helvetica", "normal");
    doc.text("Print and affix to package", pw - M, y + 12, { align: "right" });

    y += 17;
    doc.setFontSize(6.5);
    doc.setTextColor(...COLORS.secondary);
    doc.setFont("helvetica", "normal");
    doc.text(`${COMPANY.address}, ${COMPANY.city}, ${COMPANY.state} - ${COMPANY.pincode}`, M, y);
    y += 3.5;
    doc.text(`Phone: ${COMPANY.phone}  |  Email: ${COMPANY.email}  |  GSTIN: ${COMPANY.gstin}`, M, y);
    y += 5;

    // Gold accent bar
    doc.setFillColor(...COLORS.accent);
    doc.rect(M, y, CW, 1.5, "F");
    y += 5;

    // ==================== 2. SHIPMENT META ROW (matches invoice meta row) ====================
    doc.setFillColor(...COLORS.light);
    doc.rect(M, y, CW, 14, "F");
    doc.setDrawColor(...COLORS.border);
    doc.setLineWidth(0.2);
    doc.rect(M, y, CW, 14, "S");

    const metaColW = CW / 5;
    const metaPairs: [string, string][] = [
      ["Order No.", order.order_number],
      ["Shipment ID", shipmentId],
      ["Order Date", fmtDate(order.created_at)],
      ["Courier", order.courier_name || "N/A"],
      ["AWB / Tracking", order.tracking_id || "N/A"],
    ];
    metaPairs.forEach(([label, value], i) => {
      const x = M + metaColW * i + 4;
      doc.setFontSize(5.5);
      doc.setTextColor(...COLORS.muted);
      doc.setFont("helvetica", "normal");
      doc.text(label, x, y + 5);
      doc.setFontSize(7.5);
      const metaColor = i === 4 ? COLORS.accent : COLORS.primary;
      doc.setTextColor(...metaColor);
      doc.setFont("helvetica", "bold");
      const truncVal = value.length > 14 ? value.substring(0, 14) + "…" : value;
      doc.text(truncVal, x, y + 10.5);
      if (i > 0) {
        doc.setDrawColor(...COLORS.border);
        doc.line(M + metaColW * i, y + 2, M + metaColW * i, y + 12);
      }
    });

    y += 18;

    // ==================== 3. FROM / TO ADDRESS (matches invoice Billed By/To) ====================
    const boxW = (CW - 6) / 2;
    const boxH = 42;
    const boxPad = 4;

    const drawAddressBox = (
      x: number, title: string, titleBg: [number, number, number],
      titleFg: [number, number, number], lines: string[]
    ) => {
      doc.setFillColor(...COLORS.white);
      doc.setDrawColor(...COLORS.border);
      doc.setLineWidth(0.3);
      doc.roundedRect(x, y, boxW, boxH, 1.5, 1.5, "FD");
      doc.setFillColor(...titleBg);
      doc.roundedRect(x, y, boxW, 7, 1.5, 1.5, "F");
      doc.rect(x, y + 3, boxW, 4, "F");
      doc.setFontSize(7);
      doc.setTextColor(...titleFg);
      doc.setFont("helvetica", "bold");
      doc.text(title, x + boxPad, y + 5);
      let ly = y + 12;
      lines.forEach((line, idx) => {
        if (idx === 0) {
          doc.setFontSize(9);
          doc.setTextColor(...COLORS.primary);
          doc.setFont("helvetica", "bold");
        } else if (line.startsWith("GSTIN:") || line.startsWith("PIN:")) {
          doc.setFontSize(7);
          doc.setTextColor(...COLORS.accent);
          doc.setFont("helvetica", "bold");
        } else {
          doc.setFontSize(6.5);
          doc.setTextColor(...COLORS.secondary);
          doc.setFont("helvetica", "normal");
        }
        const truncated = line.length > 48 ? line.substring(0, 48) + "…" : line;
        doc.text(truncated, x + boxPad, ly);
        ly += idx === 0 ? 5 : 4;
      });
    };

    // FROM (Sender)
    const fromLines = [
      COMPANY.name,
      company.business_address || COMPANY.address,
      `${company.business_city || COMPANY.city}, ${company.business_state || COMPANY.state}`,
      `PIN: ${company.business_pincode || COMPANY.pincode}`,
      `Phone: ${company.business_phone || COMPANY.phone}`,
      `GSTIN: ${COMPANY.gstin}`,
    ];

    // TO (Recipient)
    const recipientName = (shippingAddress?.full_name || profile?.full_name || "Customer").toUpperCase();
    const toLines: string[] = [recipientName];
    if (shippingAddress?.address_line1) toLines.push(shippingAddress.address_line1);
    if (shippingAddress?.address_line2) toLines.push(shippingAddress.address_line2);
    toLines.push(`${shippingAddress?.city || ""}, ${shippingAddress?.state || ""}`);
    toLines.push(`PIN: ${shippingAddress?.postal_code || "000000"}`);
    toLines.push(`Phone: ${shippingAddress?.phone || profile?.phone || "N/A"}`);

    drawAddressBox(M, "FROM (SENDER)", COLORS.primary, COLORS.white, fromLines);
    drawAddressBox(M + boxW + 6, "SHIP TO (RECEIVER)", COLORS.accent, COLORS.primary, toLines);

    y += boxH + 6;

    // ==================== 4. PACKAGE CONTENTS TABLE ====================
    doc.setFontSize(9);
    doc.setTextColor(...COLORS.primary);
    doc.setFont("helvetica", "bold");
    doc.text("PACKAGE CONTENTS", M, y + 4);
    y += 7;

    // Table header
    const tblW = CW;
    const colSno = 10;
    const colItem = tblW - 10 - 16 - 20 - 22; // remaining
    const colQty = 16;
    const colSku = 20;
    const colWeight = 22;
    const hdrH = 8;

    doc.setFillColor(...COLORS.tableHeader);
    doc.rect(M, y, tblW, hdrH, "F");
    doc.setFontSize(6);
    doc.setTextColor(...COLORS.white);
    doc.setFont("helvetica", "bold");

    let cx = M;
    doc.text("#", cx + colSno / 2, y + 5.5, { align: "center" }); cx += colSno;
    doc.text("Item Description", cx + 3, y + 5.5); cx += colItem;
    doc.text("SKU", cx + colSku / 2, y + 5.5, { align: "center" }); cx += colSku;
    doc.text("Qty", cx + colQty / 2, y + 5.5, { align: "center" }); cx += colQty;
    doc.text("Wt (kg)", cx + colWeight / 2, y + 5.5, { align: "center" });

    y += hdrH;

    const rowH = 9;
    if (order.order_type === "custom_design" && order.design_requests) {
      doc.setFillColor(...COLORS.white);
      doc.rect(M, y, tblW, rowH, "F");
      doc.setDrawColor(...COLORS.border);
      doc.setLineWidth(0.08);
      doc.line(M, y + rowH, M + tblW, y + rowH);
      cx = M;
      doc.setFontSize(6);
      doc.setTextColor(...COLORS.secondary);
      doc.text("1", cx + colSno / 2, y + 6, { align: "center" }); cx += colSno;
      doc.setTextColor(...COLORS.primary);
      doc.setFont("helvetica", "bold");
      doc.text(`Custom Print - ${order.design_requests.file_name || "Design"}`, cx + 3, y + 6); cx += colItem;
      doc.setTextColor(...COLORS.muted);
      doc.setFont("helvetica", "normal");
      doc.text("CUSTOM", cx + colSku / 2, y + 6, { align: "center" }); cx += colSku;
      doc.setTextColor(...COLORS.primary);
      doc.setFont("helvetica", "bold");
      doc.text(String(order.design_requests.quantity || 1), cx + colQty / 2, y + 6, { align: "center" }); cx += colQty;
      doc.text("—", cx + colWeight / 2, y + 6, { align: "center" });
      y += rowH;
    } else {
      const maxItems = 6;
      order.order_items?.slice(0, maxItems).forEach((item: any, idx: number) => {
        doc.setFillColor(...(idx % 2 === 0 ? COLORS.white : COLORS.tableAlt));
        doc.rect(M, y, tblW, rowH, "F");
        doc.setDrawColor(...COLORS.border);
        doc.setLineWidth(0.08);
        doc.line(M, y + rowH, M + tblW, y + rowH);

        cx = M;
        doc.setFontSize(6);
        doc.setTextColor(...COLORS.secondary);
        doc.setFont("helvetica", "normal");
        doc.text(String(idx + 1), cx + colSno / 2, y + 6, { align: "center" }); cx += colSno;

        doc.setTextColor(...COLORS.primary);
        doc.setFont("helvetica", "bold");
        doc.setFontSize(6.5);
        const name = item.product_name.length > 40 ? item.product_name.substring(0, 37) + "…" : item.product_name;
        doc.text(name, cx + 3, y + 6); cx += colItem;

        doc.setFontSize(5.5);
        doc.setTextColor(...COLORS.muted);
        doc.setFont("helvetica", "normal");
        const sku = item.products?.sku || "—";
        doc.text(sku.length > 10 ? sku.substring(0, 10) : sku, cx + colSku / 2, y + 6, { align: "center" }); cx += colSku;

        doc.setFontSize(6);
        doc.setTextColor(...COLORS.primary);
        doc.setFont("helvetica", "bold");
        doc.text(String(item.quantity), cx + colQty / 2, y + 6, { align: "center" }); cx += colQty;

        doc.setTextColor(...COLORS.secondary);
        doc.setFont("helvetica", "normal");
        const wt = item.products?.weight ? (item.products.weight * item.quantity).toFixed(2) : "—";
        doc.text(wt, cx + colWeight / 2, y + 6, { align: "center" });

        y += rowH;
      });
      if (order.order_items?.length > maxItems) {
        doc.setFillColor(...COLORS.light);
        doc.rect(M, y, tblW, 6, "F");
        doc.setFontSize(5.5);
        doc.setTextColor(...COLORS.muted);
        doc.setFont("helvetica", "italic");
        doc.text(`+ ${order.order_items.length - maxItems} more items`, M + 5, y + 4);
        y += 6;
      }
    }

    // Table bottom border
    doc.setDrawColor(...COLORS.primary);
    doc.setLineWidth(0.5);
    doc.line(M, y, M + tblW, y);
    y += 4;

    // ==================== 5. SHIPMENT SUMMARY & QR CODE ====================
    const summaryBoxW = CW - 50;
    const qrBoxW = 44;
    const summaryH = 52;

    // Left: Shipment summary dark box (matches invoice total box)
    doc.setFillColor(...COLORS.darkBox);
    doc.roundedRect(M, y, summaryBoxW, summaryH, 2, 2, "F");

    let sy = y + 8;
    const lx = M + 6;
    const vx = M + summaryBoxW - 6;

    doc.setFontSize(8);
    doc.setTextColor(...COLORS.accent);
    doc.setFont("helvetica", "bold");
    doc.text("SHIPMENT DETAILS", lx, sy);
    sy += 8;

    const detailRow = (label: string, value: string, valColor: [number, number, number] = [200, 200, 200]) => {
      doc.setFontSize(6.5);
      doc.setTextColor(180, 180, 180);
      doc.setFont("helvetica", "normal");
      doc.text(label, lx, sy);
      doc.setTextColor(...valColor);
      doc.setFont("helvetica", "bold");
      doc.text(value, vx, sy, { align: "right" });
      sy += 5.5;
    };

    detailRow("Total Items", String(totalItems));
    detailRow("Total Weight", totalWeight > 0 ? `${totalWeight.toFixed(2)} kg` : "N/A");
    detailRow("Payment Method", order.payment_status === "paid" ? "PREPAID" : "COD", order.payment_status === "paid" ? COLORS.success : COLORS.error);
    detailRow("Order Value", fmt(order.total_amount));

    sy += 2;
    doc.setFillColor(...COLORS.accent);
    doc.roundedRect(lx - 2, sy - 2, summaryBoxW - 8, 11, 2, 2, "F");
    doc.setFontSize(7);
    doc.setTextColor(...COLORS.primary);
    doc.setFont("helvetica", "bold");
    doc.text("DISPATCH DATE", lx, sy + 5);
    doc.setFontSize(8);
    doc.text(order.shipped_at ? fmtDate(order.shipped_at) : fmtDate(new Date().toISOString()), vx - 2, sy + 5, { align: "right" });

    // Right: QR Code box
    const qrX = M + summaryBoxW + 6;
    doc.setFillColor(...COLORS.light);
    doc.setDrawColor(...COLORS.border);
    doc.setLineWidth(0.3);
    doc.roundedRect(qrX, y, qrBoxW, summaryH, 2, 2, "FD");

    // QR code image
    const qrSize = 30;
    const qrImgX = qrX + (qrBoxW - qrSize) / 2;
    try {
      doc.addImage(qrCodeDataUrl, "PNG", qrImgX, y + 4, qrSize, qrSize);
    } catch { /* ignore */ }

    // Gold border around QR
    doc.setDrawColor(...COLORS.accent);
    doc.setLineWidth(0.8);
    doc.rect(qrImgX - 1, y + 3, qrSize + 2, qrSize + 2, "S");

    doc.setFontSize(5.5);
    doc.setTextColor(...COLORS.muted);
    doc.setFont("helvetica", "bold");
    doc.text("SCAN TO VERIFY", qrX + qrBoxW / 2, y + qrSize + 9, { align: "center" });
    doc.setFontSize(4.5);
    doc.setFont("helvetica", "normal");
    doc.text("Verify order authenticity", qrX + qrBoxW / 2, y + qrSize + 13, { align: "center" });
    doc.text("& track delivery status", qrX + qrBoxW / 2, y + qrSize + 17, { align: "center" });

    y += summaryH + 6;

    // ==================== 6. EXPECTED DELIVERY ====================
    if (order.expected_delivery_date) {
      doc.setFillColor(...COLORS.light);
      doc.setDrawColor(...COLORS.border);
      doc.setLineWidth(0.2);
      doc.roundedRect(M, y, CW, 12, 2, 2, "FD");

      doc.setFontSize(7);
      doc.setTextColor(...COLORS.muted);
      doc.setFont("helvetica", "bold");
      doc.text("EXPECTED DELIVERY BY:", M + 6, y + 7.5);
      doc.setFontSize(9);
      doc.setTextColor(...COLORS.success);
      doc.setFont("helvetica", "bold");
      doc.text(fmtDate(order.expected_delivery_date), M + 55, y + 7.5);

      if (order.tracking_url) {
        doc.setFontSize(6);
        doc.setTextColor(...COLORS.accent);
        doc.setFont("helvetica", "normal");
        doc.text(`Track: ${order.tracking_url}`, pw - M - 4, y + 7.5, { align: "right" });
      }

      y += 16;
    }

    // ==================== 7. COD NOTICE (if applicable) ====================
    if (order.payment_status !== "paid") {
      doc.setFillColor(...COLORS.codBg);
      doc.setDrawColor(...COLORS.error);
      doc.setLineWidth(1.5);
      doc.roundedRect(M, y, CW, 18, 2, 2, "FD");

      // COD badge
      doc.setFillColor(...COLORS.error);
      doc.roundedRect(M + 5, y + 3.5, 12, 11, 2, 2, "F");
      doc.setFontSize(10);
      doc.setTextColor(255, 255, 255);
      doc.setFont("helvetica", "bold");
      doc.text("₹", M + 11, y + 11, { align: "center" });

      // COD text
      doc.setFontSize(11);
      doc.setTextColor(...COLORS.error);
      doc.setFont("helvetica", "bold");
      doc.text("CASH ON DELIVERY", M + 22, y + 9);
      doc.setFontSize(6.5);
      doc.setFont("helvetica", "normal");
      doc.text("Collect payment before handing over package", M + 22, y + 14);

      // Amount pill with gold accent
      doc.setFillColor(...COLORS.accent);
      doc.roundedRect(pw - M - 50, y + 4, 46, 11, 2, 2, "F");
      doc.setFontSize(10);
      doc.setTextColor(...COLORS.primary);
      doc.setFont("helvetica", "bold");
      doc.text(fmt(order.total_amount), pw - M - 27, y + 11.5, { align: "center" });

      y += 22;
    }

    // ==================== 8. DELIVERY NOTES ====================
    if (order.delivery_notes || order.notes) {
      const note = order.delivery_notes || order.notes;
      doc.setFillColor(...COLORS.light);
      doc.roundedRect(M, y, CW, 12, 2, 2, "F");
      doc.setFontSize(6);
      doc.setTextColor(...COLORS.muted);
      doc.setFont("helvetica", "bold");
      doc.text("DELIVERY INSTRUCTIONS:", M + 4, y + 5);
      doc.setFontSize(6.5);
      doc.setTextColor(...COLORS.secondary);
      doc.setFont("helvetica", "normal");
      const truncNote = note.length > 100 ? note.substring(0, 97) + "…" : note;
      doc.text(truncNote, M + 4, y + 9.5);
      y += 16;
    }

    // ==================== 9. FOOTER (matches invoice) ====================
    const fy = PAGE.height - 14;
    doc.setDrawColor(...COLORS.border);
    doc.setLineWidth(0.4);
    doc.line(M, fy - 5, pw - M, fy - 5);
    doc.setFontSize(6);
    doc.setTextColor(...COLORS.muted);
    doc.setFont("helvetica", "normal");
    doc.text(`Generated: ${new Date().toLocaleString("en-IN")}`, M, fy - 1);
    doc.text(`${COMPANY.name} | ${COMPANY.website}`, pw - M, fy - 1, { align: "right" });
    doc.text("Handle with care  •  For verification: decouvertes.com/verify-order  •  This is an auto-generated shipping label", pw / 2, fy + 3, { align: "center" });

    // ==================== UPLOAD PDF ====================
    const pdfArrayBuffer = doc.output("arraybuffer");
    const pdfUint8Array = new Uint8Array(pdfArrayBuffer);
    const fileName = `shipping-labels/${order.order_number}-${shipmentId}.pdf`;

    const { error: uploadError } = await supabase.storage
      .from("invoices")
      .upload(fileName, pdfUint8Array, { contentType: "application/pdf", upsert: true });

    if (uploadError) throw new Error("Failed to upload shipping label");

    await supabase
      .from("orders")
      .update({ shipping_label_url: fileName, shipment_id: shipmentId })
      .eq("id", orderId);

    return new Response(
      JSON.stringify({ success: true, message: "Shipping label generated successfully", labelPath: fileName, shipmentId }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 200 }
    );
  } catch (error) {
    console.error("Error generating shipping label:", error);
    return new Response(
      JSON.stringify({ success: false, error: error instanceof Error ? error.message : "Failed to generate shipping label" }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 400 }
    );
  }
});
