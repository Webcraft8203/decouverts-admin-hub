import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { jsPDF } from "https://esm.sh/jspdf@2.5.1";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// ==================== UNIFIED DECOUVERTES INVOICE TEMPLATE ====================
// Synchronized with client hook (useUnifiedInvoicePdf.ts)

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
  pan: "AAKCD1492N",
  website: "www.decouvertes.com",
  terms: [
    "1. Goods once sold will only be taken back or exchanged as per company policy.",
    "2. Payment is due within 30 days of invoice date unless otherwise specified.",
    "3. All disputes are subject to Pune jurisdiction.",
    "4. Warranty as per product terms and conditions.",
  ],
};

const PAGE = { width: 210, height: 297, margin: 14, footerHeight: 16 };

const fmt = (amount: number): string =>
  `₹${Number(amount || 0).toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

const fmtDate = (d: string): string =>
  new Date(d).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" });

const numberToWords = (num: number): string => {
  const ones = ['', 'One', 'Two', 'Three', 'Four', 'Five', 'Six', 'Seven', 'Eight', 'Nine', 'Ten',
    'Eleven', 'Twelve', 'Thirteen', 'Fourteen', 'Fifteen', 'Sixteen', 'Seventeen', 'Eighteen', 'Nineteen'];
  const tens = ['', '', 'Twenty', 'Thirty', 'Forty', 'Fifty', 'Sixty', 'Seventy', 'Eighty', 'Ninety'];
  if (num === 0) return 'Zero';
  const convert = (n: number): string => {
    if (n < 20) return ones[n];
    if (n < 100) return tens[Math.floor(n / 10)] + (n % 10 ? ' ' + ones[n % 10] : '');
    if (n < 1000) return ones[Math.floor(n / 100)] + ' Hundred' + (n % 100 ? ' And ' + convert(n % 100) : '');
    if (n < 100000) return convert(Math.floor(n / 1000)) + ' Thousand' + (n % 1000 ? ' ' + convert(n % 1000) : '');
    if (n < 10000000) return convert(Math.floor(n / 100000)) + ' Lakh' + (n % 100000 ? ' ' + convert(n % 100000) : '');
    return convert(Math.floor(n / 10000000)) + ' Crore' + (n % 10000000 ? ' ' + convert(n % 10000000) : '');
  };
  const rupees = Math.floor(num);
  const paise = Math.round((num - rupees) * 100);
  let result = convert(rupees) + ' Rupees';
  if (paise > 0) result += ' And ' + convert(paise) + ' Paise';
  return result + ' Only';
};

const fetchImageAsBase64 = async (url: string): Promise<string | null> => {
  try {
    const response = await fetch(url, { headers: { 'Accept': 'image/*' } });
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
  } catch (error) {
    console.error("Error fetching logo:", error);
    return null;
  }
};

interface InvoiceRequest {
  orderId: string;
  invoiceType?: "proforma" | "final" | "offline";
}

// ==================== SHARED PDF RENDERER ====================
function renderInvoicePdf(
  doc: any,
  invoiceData: {
    invoice_number: string;
    created_at: string;
    delivery_date?: string | null;
    is_final: boolean;
    client_name: string;
    client_address: string;
    buyer_state: string;
    buyer_gstin?: string | null;
    subtotal: number;
    total_amount: number;
    platform_fee: number;
    platform_fee_tax: number;
    order_number: string;
  },
  items: any[],
  isIgst: boolean,
  totalCgst: number,
  totalSgst: number,
  totalIgst: number,
  logoBase64: string | null,
) {
  const { width: pw, height: ph, margin: M } = PAGE;
  const CW = pw - 2 * M;
  const safeZone = ph - PAGE.footerHeight - 4;
  let y = M;
  let currentPage = 1;

  const platformFee = invoiceData.platform_fee;
  const platformFeeTax = invoiceData.platform_fee_tax;
  const isFinal = invoiceData.is_final;

  const addFooter = (pageNum: number, total: number) => {
    const fy = ph - 10;
    doc.setDrawColor(...COLORS.border);
    doc.setLineWidth(0.4);
    doc.line(M, fy - 5, pw - M, fy - 5);
    doc.setFontSize(6);
    doc.setTextColor(...COLORS.muted);
    doc.setFont("helvetica", "normal");
    doc.text("This is a computer-generated document and does not require a signature.", M, fy - 1);
    doc.text(`Page ${pageNum} of ${total}`, pw - M, fy - 1, { align: "right" });
    doc.text(`Generated: ${new Date().toLocaleString("en-IN")} | ${COMPANY.website}`, pw / 2, fy + 3, { align: "center" });
  };

  const checkBreak = (h: number) => {
    if (y + h > safeZone) { doc.addPage(); currentPage++; y = M + 6; return true; }
    return false;
  };

  // ==================== 1. HEADER ====================
  const headerRight = pw - M;
  if (logoBase64) {
    try { doc.addImage(logoBase64, 'PNG', M, y, 24, 12); } catch { /* ignore */ }
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

  const typeLabel = isFinal ? "TAX INVOICE" : "PROFORMA INVOICE";
  doc.setFontSize(11);
  doc.setTextColor(...(isFinal ? COLORS.primary : COLORS.secondary));
  doc.setFont("helvetica", "bold");
  doc.text(typeLabel, headerRight, y + 8, { align: "right" });
  if (!isFinal) {
    doc.setFontSize(6);
    doc.setTextColor(...COLORS.muted);
    doc.setFont("helvetica", "normal");
    doc.text("Not valid for tax purposes", headerRight, y + 12, { align: "right" });
  }

  y += 17;
  doc.setFontSize(6.5);
  doc.setTextColor(...COLORS.secondary);
  doc.setFont("helvetica", "normal");
  doc.text(`${COMPANY.address}, ${COMPANY.city}, ${COMPANY.state} - ${COMPANY.pincode}`, M, y);
  y += 3.5;
  doc.text(`Phone: ${COMPANY.phone}  |  Email: ${COMPANY.email}  |  GSTIN: ${COMPANY.gstin}  |  PAN: ${COMPANY.pan}`, M, y);
  y += 5;

  doc.setFillColor(...COLORS.accent);
  doc.rect(M, y, CW, 1.5, "F");
  y += 5;

  // ==================== 2. INVOICE META ROW ====================
  doc.setFillColor(...COLORS.light);
  doc.rect(M, y, CW, 14, "F");
  doc.setDrawColor(...COLORS.border);
  doc.setLineWidth(0.2);
  doc.rect(M, y, CW, 14, "S");

  const metaColW = CW / 4;
  const metaPairs: [string, string][] = [
    ["Invoice No.", invoiceData.invoice_number],
    ["Date", fmtDate(invoiceData.created_at)],
    ["Order No.", invoiceData.order_number],
    ["Delivery Date", invoiceData.delivery_date ? fmtDate(invoiceData.delivery_date) : (isFinal ? "—" : "Pending")],
  ];
  metaPairs.forEach(([label, value], i) => {
    const x = M + metaColW * i + 5;
    doc.setFontSize(6);
    doc.setTextColor(...COLORS.muted);
    doc.setFont("helvetica", "normal");
    doc.text(label, x, y + 5);
    doc.setFontSize(8);
    doc.setTextColor(...COLORS.primary);
    doc.setFont("helvetica", "bold");
    doc.text(value, x, y + 10.5);
    if (i > 0) {
      doc.setDrawColor(...COLORS.border);
      doc.line(M + metaColW * i, y + 2, M + metaColW * i, y + 12);
    }
  });

  y += 18;

  // ==================== 3. BILLED BY / BILLED TO ====================
  const boxW = (CW - 6) / 2;
  const boxH = 38;
  const boxPad = 4;

  const drawPartyBox = (x: number, title: string, titleBg: [number, number, number], titleFg: [number, number, number], lines: string[]) => {
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
        doc.setFontSize(8.5);
        doc.setTextColor(...COLORS.primary);
        doc.setFont("helvetica", "bold");
      } else if (line.startsWith("GSTIN:") || line.startsWith("PAN:")) {
        doc.setFontSize(6.5);
        doc.setTextColor(...COLORS.accent);
        doc.setFont("helvetica", "bold");
      } else {
        doc.setFontSize(6.5);
        doc.setTextColor(...COLORS.secondary);
        doc.setFont("helvetica", "normal");
      }
      const truncated = line.length > 48 ? line.substring(0, 48) + "…" : line;
      doc.text(truncated, x + boxPad, ly);
      ly += idx === 0 ? 5 : 3.8;
    });
  };

  const billedByLines = [
    COMPANY.name,
    COMPANY.address,
    `${COMPANY.city}, ${COMPANY.state} - ${COMPANY.pincode}`,
    `Phone: ${COMPANY.phone}`,
    `Email: ${COMPANY.email}`,
    `GSTIN: ${COMPANY.gstin}`,
    `PAN: ${COMPANY.pan}`,
  ];

  const clientName = (invoiceData.client_name || "Customer").toUpperCase();
  const billedToLines = [clientName];
  if (invoiceData.client_address) {
    const addrParts = invoiceData.client_address.split(", ").filter(Boolean);
    billedToLines.push(...addrParts.slice(0, 3));
  }
  if (invoiceData.buyer_state) billedToLines.push(`State: ${invoiceData.buyer_state}`);
  if (invoiceData.buyer_gstin) billedToLines.push(`GSTIN: ${invoiceData.buyer_gstin}`);

  drawPartyBox(M, "BILLED BY", COLORS.primary, COLORS.white, billedByLines);
  drawPartyBox(M + boxW + 6, "BILLED TO", COLORS.accent, COLORS.primary, billedToLines);

  y += boxH + 6;

  // ==================== 4. ITEMS TABLE ====================
  const cols = { sno: 8, item: 42, hsn: 14, qty: 10, rate: 22, taxable: 22, gstPct: 12, gstAmt: 24, total: 28 };
  const tableX = M;
  const tableW = CW;
  const hdrH = 8;
  const rowH = 11;

  doc.setFillColor(...COLORS.tableHeader);
  doc.rect(tableX, y, tableW, hdrH, "F");
  doc.setFontSize(6);
  doc.setTextColor(...COLORS.white);
  doc.setFont("helvetica", "bold");

  let cx = tableX;
  const hdrY = y + 5.5;
  const hdr = (label: string, w: number, align: "left" | "right" | "center" = "left") => {
    if (align === "right") doc.text(label, cx + w - 2, hdrY, { align: "right" });
    else if (align === "center") doc.text(label, cx + w / 2, hdrY, { align: "center" });
    else doc.text(label, cx + 2, hdrY);
    cx += w;
  };
  hdr("#", cols.sno, "center");
  hdr("Item Description", cols.item);
  hdr("HSN", cols.hsn, "center");
  hdr("Qty", cols.qty, "center");
  hdr("Rate (₹)", cols.rate, "right");
  hdr("Taxable (₹)", cols.taxable, "right");
  hdr("GST %", cols.gstPct, "center");
  hdr("GST Amt (₹)", cols.gstAmt, "right");
  hdr("Total (₹)", cols.total, "right");

  y += hdrH;

  items.forEach((item: any, idx: number) => {
    checkBreak(rowH + 1);
    doc.setFillColor(...(idx % 2 === 0 ? COLORS.white : COLORS.tableAlt));
    doc.rect(tableX, y, tableW, rowH, "F");
    doc.setDrawColor(...COLORS.border);
    doc.setLineWidth(0.08);
    doc.line(tableX, y + rowH, tableX + tableW, y + rowH);

    cx = tableX;
    const ty1 = y + 4.5;
    const ty2 = y + 8.5;

    doc.setFontSize(6);
    doc.setTextColor(...COLORS.secondary);
    doc.setFont("helvetica", "normal");
    doc.text(String(item.sno), cx + cols.sno / 2, y + 6, { align: "center" });
    cx += cols.sno;

    doc.setTextColor(...COLORS.primary);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(6.5);
    const itemName = item.name.length > 28 ? item.name.substring(0, 28) + "…" : item.name;
    doc.text(itemName, cx + 2, ty1);
    doc.setFontSize(5.5);
    doc.setTextColor(...COLORS.muted);
    doc.setFont("helvetica", "normal");
    doc.text(`SKU: ${item.sku}`, cx + 2, ty2);
    cx += cols.item;

    doc.setFontSize(6);
    doc.setTextColor(...COLORS.secondary);
    doc.setFont("helvetica", "normal");
    doc.text(item.hsn, cx + cols.hsn / 2, y + 6, { align: "center" });
    cx += cols.hsn;

    doc.text(String(item.quantity), cx + cols.qty / 2, y + 6, { align: "center" });
    cx += cols.qty;

    doc.text(fmt(item.rate), cx + cols.rate - 2, y + 6, { align: "right" });
    cx += cols.rate;

    doc.text(fmt(item.taxable_value), cx + cols.taxable - 2, y + 6, { align: "right" });
    cx += cols.taxable;

    doc.setTextColor(...COLORS.accent);
    doc.setFont("helvetica", "bold");
    doc.text(`${item.gst_rate}%`, cx + cols.gstPct / 2, y + 6, { align: "center" });
    cx += cols.gstPct;

    const gstAmt = isIgst ? Number(item.igst_amount || 0) : Number(item.cgst_amount || 0) + Number(item.sgst_amount || 0);
    doc.setTextColor(...COLORS.secondary);
    doc.setFont("helvetica", "normal");
    doc.text(fmt(gstAmt), cx + cols.gstAmt - 2, y + 6, { align: "right" });
    cx += cols.gstAmt;

    doc.setTextColor(...COLORS.primary);
    doc.setFont("helvetica", "bold");
    doc.text(fmt(item.total), cx + cols.total - 2, y + 6, { align: "right" });

    y += rowH;
  });

  doc.setDrawColor(...COLORS.primary);
  doc.setLineWidth(0.5);
  doc.line(tableX, y, tableX + tableW, y);
  y += 8;

  // ==================== 5. AMOUNT IN WORDS ====================
  checkBreak(55);
  doc.setFillColor(...COLORS.light);
  doc.rect(M, y, CW, 10, "F");
  doc.setFontSize(6);
  doc.setTextColor(...COLORS.muted);
  doc.setFont("helvetica", "normal");
  doc.text("Amount in Words:", M + 4, y + 4);
  doc.setFontSize(7);
  doc.setTextColor(...COLORS.primary);
  doc.setFont("helvetica", "bold");
  const wordsText = numberToWords(invoiceData.total_amount);
  const truncWords = wordsText.length > 90 ? wordsText.substring(0, 90) + "…" : wordsText;
  doc.text(truncWords, M + 4, y + 8);
  y += 14;

  // ==================== 6. SUMMARY SECTION ====================
  const sumRightW = 86;
  const sumLeftW = CW - sumRightW - 6;
  const taxLines = isIgst ? 1 : 2;
  const pfLines = platformFee > 0 ? 1 : 0;
  const summaryH = 42 + (taxLines - 1) * 5 + pfLines * 5;

  doc.setFillColor(...COLORS.light);
  doc.setDrawColor(...COLORS.border);
  doc.setLineWidth(0.2);
  doc.roundedRect(M, y, sumLeftW, summaryH, 2, 2, "FD");

  doc.setFontSize(7.5);
  doc.setTextColor(...COLORS.primary);
  doc.setFont("helvetica", "bold");
  doc.text("TAX SUMMARY", M + 4, y + 7);

  let gy = y + 13;
  doc.setFontSize(6.5);
  doc.setFont("helvetica", "normal");

  const taxRow = (label: string, value: string) => {
    doc.setTextColor(...COLORS.muted);
    doc.text(label, M + 4, gy);
    doc.setTextColor(...COLORS.primary);
    doc.setFont("helvetica", "bold");
    doc.text(value, M + sumLeftW - 4, gy, { align: "right" });
    doc.setFont("helvetica", "normal");
    gy += 5;
  };

  taxRow("Supply Type", isIgst ? "Inter-State" : "Intra-State");
  taxRow("Place of Supply", invoiceData.buyer_state || COMPANY.state);

  gy += 1;
  doc.setDrawColor(...COLORS.border);
  doc.line(M + 4, gy, M + sumLeftW - 4, gy);
  gy += 4;

  if (isIgst) {
    taxRow("IGST", fmt(totalIgst));
  } else {
    taxRow("CGST", fmt(totalCgst));
    taxRow("SGST", fmt(totalSgst));
  }

  gy += 1;
  doc.setDrawColor(...COLORS.accent);
  doc.setLineWidth(0.5);
  doc.line(M + 4, gy, M + sumLeftW - 4, gy);
  gy += 4;

  doc.setFontSize(7);
  doc.setTextColor(...COLORS.primary);
  doc.setFont("helvetica", "bold");
  doc.text("Total Tax", M + 4, gy);
  doc.setTextColor(...COLORS.accent);
  doc.text(fmt(totalCgst + totalSgst + totalIgst), M + sumLeftW - 4, gy, { align: "right" });

  // ---- CHARGES & TOTAL (right) ----
  const rx = M + sumLeftW + 6;
  doc.setFillColor(...COLORS.darkBox);
  doc.roundedRect(rx, y, sumRightW, summaryH, 2, 2, "F");

  let ty = y + 9;
  const lx = rx + 6;
  const vx = rx + sumRightW - 6;
  doc.setFontSize(7);
  doc.setTextColor(200, 200, 200);
  doc.setFont("helvetica", "normal");

  const sumRow = (label: string, value: string) => {
    doc.text(label, lx, ty);
    doc.text(value, vx, ty, { align: "right" });
    ty += 5.5;
  };

  sumRow("Subtotal", fmt(invoiceData.subtotal));

  if (platformFee > 0) {
    sumRow("Platform Fee (2%)", fmt(platformFee));
    if (platformFeeTax > 0) {
      sumRow("Fee Tax (18% GST)", fmt(platformFeeTax));
    }
  }

  if (isIgst) {
    sumRow("IGST", fmt(totalIgst));
  } else {
    sumRow("CGST", fmt(totalCgst));
    sumRow("SGST", fmt(totalSgst));
  }

  ty += 3;
  doc.setFillColor(...COLORS.accent);
  doc.roundedRect(rx + 3, ty - 2, sumRightW - 6, 13, 2, 2, "F");
  doc.setFontSize(8);
  doc.setTextColor(...COLORS.primary);
  doc.setFont("helvetica", "bold");
  doc.text("GRAND TOTAL", lx + 1, ty + 6);
  doc.setFontSize(10);
  doc.text(fmt(invoiceData.total_amount), vx - 1, ty + 6, { align: "right" });

  y += summaryH + 8;

  // ==================== 7. TERMS ====================
  if (y + 22 < safeZone) {
    doc.setFontSize(7);
    doc.setTextColor(...COLORS.primary);
    doc.setFont("helvetica", "bold");
    doc.text("Terms & Conditions", M, y);
    y += 4;
    doc.setFontSize(5.5);
    doc.setTextColor(...COLORS.muted);
    doc.setFont("helvetica", "normal");
    COMPANY.terms.forEach((t) => { doc.text(t, M, y); y += 3.2; });
  }

  const pageCount = doc.getNumberOfPages();
  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i);
    addFooter(i, pageCount);
  }
}

// ==================== EDGE FUNCTION ====================
serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const { orderId, invoiceType = "proforma" }: InvoiceRequest = await req.json();
    if (!orderId) throw new Error("Order ID is required");

    const isFinalInvoice = invoiceType === "final";
    const isOfflineInvoice = invoiceType === "offline";
    console.log(`Generating ${invoiceType.toUpperCase()} invoice for order:`, orderId);

    const { data: order, error: orderError } = await supabase
      .from("orders")
      .select("*, order_items(*, products(name, images, gst_percentage, sku, hsn_code))")
      .eq("id", orderId)
      .single();

    if (orderError || !order) throw new Error("Order not found");
    if (isFinalInvoice && order.status !== "delivered") throw new Error("Final invoice can only be generated for delivered orders");

    if (isFinalInvoice && order.final_invoice_url) {
      return new Response(JSON.stringify({ success: true, message: "Final invoice already exists", invoicePath: order.final_invoice_url, invoiceType: "final" }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 200 });
    }

    const { data: settings } = await supabase.from("invoice_settings").select("*").single();
    const company = settings || {
      business_name: COMPANY.name, business_address: COMPANY.address, business_city: COMPANY.city,
      business_state: COMPANY.state, business_pincode: COMPANY.pincode, business_country: COMPANY.country,
      business_phone: COMPANY.phone, business_email: COMPANY.email, business_gstin: COMPANY.gstin,
      business_pan: COMPANY.pan, business_logo_url: null, invoice_prefix: "INV",
      default_gst_rate: 18, platform_fee_percentage: 2, platform_fee_taxable: false,
      terms_and_conditions: COMPANY.terms.join("\n"),
    };

    const orderSuffix = order.order_number.replace("DP-", "").replace(/-/g, "");
    const invoiceNumber = isFinalInvoice ? `${company.invoice_prefix}-${orderSuffix}` : isOfflineInvoice ? `OFF-${orderSuffix}` : `PRO-${orderSuffix}`;
    const invoiceDate = isFinalInvoice ? fmtDate(order.delivered_at || new Date().toISOString()) : fmtDate(order.created_at);

    const shippingAddress = order.shipping_address as any;
    const buyerState = shippingAddress?.state || "";
    const sellerState = company.business_state || COMPANY.state;
    const isIgst = buyerState.toLowerCase() !== sellerState.toLowerCase();

    const { data: profile } = await supabase.from("profiles").select("email, full_name").eq("id", order.user_id).single();

    const gstBreakdown = order.gst_breakdown as any;
    const gstItems = gstBreakdown?.items || [];

    let items: any[] = [];
    let totalCgst = 0, totalSgst = 0, totalIgst = 0;

    if (gstItems.length > 0) {
      items = order.order_items.map((item: any, index: number) => {
        const gst = gstItems.find((g: any) => g.product_id === item.product_id) || gstItems[index] || {};
        totalCgst += Number(gst.cgst_amount || 0);
        totalSgst += Number(gst.sgst_amount || 0);
        totalIgst += Number(gst.igst_amount || 0);
        return {
          sno: index + 1, name: item.product_name,
          sku: item.products?.sku || `DEC-PRD-${String(index + 1).padStart(5, '0')}`,
          hsn: item.products?.hsn_code || "8471", quantity: item.quantity, rate: item.product_price,
          taxable_value: item.total_price, gst_rate: gst.gst_rate || 18,
          cgst_amount: gst.cgst_amount || 0, sgst_amount: gst.sgst_amount || 0,
          igst_amount: gst.igst_amount || 0, total: item.total_price + (gst.total_gst || 0),
        };
      });
    } else {
      items = order.order_items.map((item: any, index: number) => {
        const gstRate = item.products?.gst_percentage || 18;
        const taxableValue = Number(item.total_price);
        const gstAmount = (taxableValue * gstRate) / 100;
        const cgstAmount = isIgst ? 0 : gstAmount / 2;
        const sgstAmount = isIgst ? 0 : gstAmount / 2;
        const igstAmount = isIgst ? gstAmount : 0;
        totalCgst += cgstAmount; totalSgst += sgstAmount; totalIgst += igstAmount;
        return {
          sno: index + 1, name: item.product_name,
          sku: item.products?.sku || `DEC-PRD-${String(index + 1).padStart(5, '0')}`,
          hsn: item.products?.hsn_code || "8471", quantity: item.quantity, rate: item.product_price,
          taxable_value: taxableValue, gst_rate: gstRate,
          cgst_amount: cgstAmount, sgst_amount: sgstAmount, igst_amount: igstAmount,
          total: taxableValue + cgstAmount + sgstAmount + igstAmount,
        };
      });
    }

    const gstTotals = gstBreakdown?.totals || {};
    const platformFee = gstTotals.platform_fee || (Number(order.subtotal) * (company.platform_fee_percentage || 2)) / 100;
    const platformFeeTax = gstTotals.platform_fee_tax || (company.platform_fee_taxable ? (platformFee * 18) / 100 : 0);

    const clientAddress = shippingAddress
      ? `${shippingAddress.address_line1}${shippingAddress.address_line2 ? ", " + shippingAddress.address_line2 : ""}, ${shippingAddress.city}, ${shippingAddress.state} - ${shippingAddress.postal_code}`
      : "";

    const { data: invoice, error: invoiceError } = await supabase.from("invoices").insert({
      invoice_number: invoiceNumber, invoice_type: invoiceType, is_final: isFinalInvoice,
      order_id: orderId, delivery_date: isFinalInvoice ? order.delivered_at : null,
      client_name: shippingAddress?.full_name || profile?.full_name || "Customer",
      client_email: profile?.email || null, client_address: clientAddress, items: items,
      subtotal: order.subtotal, tax_amount: order.tax_amount, total_amount: order.total_amount,
      cgst_amount: totalCgst, sgst_amount: totalSgst, igst_amount: totalIgst, is_igst: isIgst,
      platform_fee: platformFee, platform_fee_tax: platformFeeTax,
      buyer_gstin: order.buyer_gstin || null, buyer_state: buyerState, seller_state: sellerState,
      gst_breakdown: items, created_by: order.user_id,
      notes: `Order: ${order.order_number}\nPayment ID: ${order.payment_id || "N/A"}\nInvoice Type: ${invoiceType.toUpperCase()}`,
    }).select().single();

    if (invoiceError) throw new Error("Failed to create invoice");

    // ==================== GENERATE PDF ====================
    const doc = new jsPDF({ orientation: "portrait", unit: "mm", format: "a4" });

    let logoBase64: string | null = null;
    const storedLogoUrl = `${supabaseUrl}/storage/v1/object/public/customer-partner-images/email-logo.png`;
    logoBase64 = await fetchImageAsBase64(storedLogoUrl);
    if (!logoBase64 && company.business_logo_url) logoBase64 = await fetchImageAsBase64(company.business_logo_url);

    renderInvoicePdf(doc, {
      invoice_number: invoiceNumber,
      created_at: order.created_at,
      delivery_date: isFinalInvoice ? order.delivered_at : null,
      is_final: isFinalInvoice,
      client_name: shippingAddress?.full_name || profile?.full_name || "Customer",
      client_address: clientAddress,
      buyer_state: buyerState,
      buyer_gstin: order.buyer_gstin,
      subtotal: order.subtotal,
      total_amount: order.total_amount,
      platform_fee: platformFee,
      platform_fee_tax: platformFeeTax,
      order_number: order.order_number,
    }, items, isIgst, totalCgst, totalSgst, totalIgst, logoBase64);

    const pdfArrayBuffer = doc.output("arraybuffer");
    const pdfUint8Array = new Uint8Array(pdfArrayBuffer);

    let prefix = "proforma-invoices";
    if (isFinalInvoice) prefix = "final-invoices";
    else if (isOfflineInvoice) prefix = "offline-invoices";
    const fileName = `${prefix}/${invoiceNumber}.pdf`;

    const { error: uploadError } = await supabase.storage.from("invoices").upload(fileName, pdfUint8Array, { contentType: "application/pdf", upsert: true });
    if (uploadError) throw new Error("Failed to upload invoice PDF");

    await supabase.from("invoices").update({ pdf_url: fileName }).eq("id", invoice.id);
    if (isFinalInvoice) {
      await supabase.from("orders").update({ final_invoice_url: fileName }).eq("id", orderId);
    } else {
      await supabase.from("orders").update({ proforma_invoice_url: fileName, invoice_url: fileName }).eq("id", orderId);
    }

    console.log(`Invoice ${invoiceNumber} generated successfully at ${fileName}`);

    return new Response(JSON.stringify({
      success: true, message: `${invoiceType.toUpperCase()} Invoice generated successfully`,
      invoiceId: invoice.id, invoiceNumber, invoicePath: fileName, invoiceType,
    }), { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 200 });

  } catch (error) {
    console.error("Error generating invoice:", error);
    return new Response(JSON.stringify({
      success: false, error: error instanceof Error ? error.message : "Failed to generate invoice",
    }), { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 400 });
  }
});
