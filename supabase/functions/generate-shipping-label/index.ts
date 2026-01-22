import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { jsPDF } from "https://esm.sh/jspdf@2.5.1";
import QRCode from "https://esm.sh/qrcode-svg@1.1.0";
import { Canvg } from "https://esm.sh/canvg@4.0.1";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const formatDate = (date: string) =>
  new Date(date).toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });

const formatDateTime = (date: string) =>
  new Date(date).toLocaleString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });

async function fetchImageAsBase64(url: string) {
  const res = await fetch(url);
  if (!res.ok) return null;
  const buffer = new Uint8Array(await res.arrayBuffer());
  return buffer;
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { orderId } = await req.json();
    if (!orderId) throw new Error("orderId required");

    const supabase = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!);

    /* ================= FETCH DATA ================= */

    const { data: order, error } = await supabase
      .from("orders")
      .select("*, order_items(*), design_requests(*)")
      .eq("id", orderId)
      .single();

    if (error || !order) throw new Error("Order not found");

    if (!order.courier_name || !order.tracking_id) throw new Error("Courier & Tracking ID required");

    const { data: settings } = await supabase.from("invoice_settings").select("*").single();

    const company = settings!;

    const shipping = order.shipping_address;

    /* ================= QR CODE (EDGE SAFE) ================= */

    const verifyUrl = `https://www.decouvertes.in/verify-order?id=${order.id}`;

    const qr = new QRCode({
      content: verifyUrl,
      padding: 2,
      width: 200,
      height: 200,
      ecl: "M",
    });

    const qrSvg = qr.svg();

    const canvas = new OffscreenCanvas(200, 200);
    const ctx = canvas.getContext("2d")!;
    const v = await Canvg.fromString(ctx, qrSvg);
    await v.render();
    const blob = await canvas.convertToBlob();
    const qrBuffer = new Uint8Array(await blob.arrayBuffer());

    /* ================= PDF ================= */

    const doc = new jsPDF({ unit: "mm", format: "a4" });
    const pageW = doc.internal.pageSize.getWidth();
    let y = 15;
    const margin = 15;

    /* ================= HEADER ================= */

    const logo = company.business_logo_url ? await fetchImageAsBase64(company.business_logo_url) : null;

    if (logo) doc.addImage(logo, "PNG", margin, y, 28, 14);

    doc.setFont("helvetica", "bold");
    doc.setFontSize(20);
    doc.setTextColor(234, 171, 28);
    doc.text(company.business_name, pageW / 2, y + 7, { align: "center" });

    doc.setFontSize(9);
    doc.setTextColor(120);
    doc.text("Discovering Future Technologies", pageW / 2, y + 13, { align: "center" });

    y += 20;

    doc.setFontSize(14);
    doc.setTextColor(59, 130, 246);
    doc.text("SHIPPING LABEL", pageW / 2, y, { align: "center" });

    y += 10;
    doc.setDrawColor(234, 171, 28);
    doc.line(margin, y, pageW - margin, y);
    y += 10;

    /* ================= ORDER DETAILS ================= */

    doc.setFontSize(10);
    doc.setTextColor(0);
    doc.setFont("helvetica", "bold");
    doc.text("ORDER DETAILS", margin, y);

    doc.setFont("helvetica", "normal");
    y += 6;
    doc.text(`Order No: ${order.order_number}`, margin, y);
    doc.text(`Order Date: ${formatDate(order.created_at)}`, margin, y + 5);
    doc.text(`Courier: ${order.courier_name}`, margin, y + 10);
    doc.text(`Tracking ID: ${order.tracking_id}`, margin, y + 15);

    /* ================= ADDRESSES ================= */

    y += 25;

    doc.setFillColor(245, 245, 245);
    doc.roundedRect(margin, y, 85, 40, 3, 3, "F");

    doc.setFont("helvetica", "bold");
    doc.text("FROM", margin + 5, y + 7);
    doc.setFont("helvetica", "normal");
    doc.text(company.business_name, margin + 5, y + 14);
    doc.text(company.business_address, margin + 5, y + 19);
    doc.text(`${company.business_city}, ${company.business_state}`, margin + 5, y + 24);
    doc.text(`PIN: ${company.business_pincode}`, margin + 5, y + 29);

    doc.setFillColor(254, 243, 199);
    doc.roundedRect(margin + 95, y, 85, 40, 3, 3, "F");

    doc.setFont("helvetica", "bold");
    doc.text("TO", margin + 100, y + 7);
    doc.setFont("helvetica", "normal");
    doc.text(shipping.full_name, margin + 100, y + 14);
    doc.text(shipping.address_line1, margin + 100, y + 19);
    doc.text(`${shipping.city}, ${shipping.state}`, margin + 100, y + 24);
    doc.text(`PIN: ${shipping.postal_code}`, margin + 100, y + 29);

    /* ================= QR ================= */

    y += 50;

    doc.addImage(qrBuffer, "PNG", margin, y, 40, 40);

    doc.setFont("helvetica", "bold");
    doc.setFontSize(10);
    doc.text("Scan to Verify Shipment", margin + 50, y + 10);

    doc.setFont("helvetica", "normal");
    doc.setFontSize(8);
    doc.text(verifyUrl, margin + 50, y + 18);

    /* ================= FOOTER ================= */

    y = doc.internal.pageSize.getHeight() - 20;
    doc.setFontSize(8);
    doc.setTextColor(120);
    doc.text(`Generated on ${formatDateTime(new Date().toISOString())}`, pageW / 2, y, { align: "center" });

    /* ================= UPLOAD ================= */

    const pdf = new Uint8Array(doc.output("arraybuffer"));
    const path = `shipping-labels/${order.order_number}.pdf`;

    await supabase.storage.from("invoices").upload(path, pdf, {
      contentType: "application/pdf",
      upsert: true,
    });

    await supabase.from("orders").update({ shipping_label_url: path }).eq("id", orderId);

    return new Response(JSON.stringify({ success: true, path }), { headers: corsHeaders });
  } catch (err: any) {
    console.error(err);
    return new Response(JSON.stringify({ error: err.message }), { headers: corsHeaders, status: 400 });
  }
});
