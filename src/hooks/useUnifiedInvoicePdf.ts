import { useCallback, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { jsPDF } from "jspdf";
import { toast } from "sonner";

// ==================== UNIFIED DECOUVERTES INVOICE TEMPLATE ====================
// This template matches the edge function (generate-invoice) exactly.
// Both admin and user downloads produce identical professional invoices.

const COLORS = {
  primary: [28, 28, 28] as [number, number, number],       // Charcoal
  accent: [212, 175, 55] as [number, number, number],       // Brand Gold
  orange: [230, 126, 34] as [number, number, number],       // Tagline orange
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

const fetchLogoAsBase64 = async (): Promise<string | null> => {
  try {
    const logoUrl = `${import.meta.env.VITE_SUPABASE_URL}/storage/v1/object/public/customer-partner-images/email-logo.png`;
    const response = await fetch(logoUrl);
    if (!response.ok) return null;
    const blob = await response.blob();
    return new Promise((resolve) => {
      const reader = new FileReader();
      reader.onloadend = () => resolve(reader.result as string);
      reader.readAsDataURL(blob);
    });
  } catch {
    return null;
  }
};

export interface InvoiceItem {
  description?: string;
  name?: string;
  product_name?: string;
  quantity: number;
  price?: number;
  rate?: number;
  product_price?: number;
  gst_rate?: number;
  taxable_value?: number;
  cgst_amount?: number;
  sgst_amount?: number;
  igst_amount?: number;
  total?: number;
  sku?: string;
  hsn_code?: string;
  hsn?: string;
}

export interface Invoice {
  id: string;
  invoice_number: string;
  invoice_type: string;
  is_final: boolean;
  client_name: string;
  client_email?: string | null;
  client_address?: string | null;
  total_amount: number;
  subtotal: number;
  tax_amount: number;
  items: InvoiceItem[];
  notes?: string | null;
  pdf_url?: string | null;
  created_at: string;
  delivery_date?: string | null;
  order_id?: string | null;
  buyer_state?: string | null;
  seller_state?: string | null;
  is_igst?: boolean | null;
  cgst_amount?: number | null;
  sgst_amount?: number | null;
  igst_amount?: number | null;
  buyer_gstin?: string | null;
  platform_fee?: number | null;
  platform_fee_tax?: number | null;
  order?: {
    order_number: string;
    payment_status: string;
    payment_id: string | null;
    status: string;
    order_type?: string;
  } | null;
}

interface NormalizedItem {
  sno: number;
  name: string;
  sku: string;
  hsn: string;
  qty: number;
  rate: number;
  taxableValue: number;
  gstRate: number;
  gstAmount: number;
  total: number;
}

function normalizeItem(item: InvoiceItem, index: number, isIgst: boolean): NormalizedItem {
  const qty = Number(item.quantity) || 1;
  const rate = Number(item.price) || Number(item.rate) || Number(item.product_price) || 0;
  const taxableValue = Number(item.taxable_value) || qty * rate;
  const gstRate = Number(item.gst_rate) || 18;
  const cgst = Number(item.cgst_amount) || 0;
  const sgst = Number(item.sgst_amount) || 0;
  const igst = Number(item.igst_amount) || 0;
  const gstAmount = isIgst ? igst : cgst + sgst;

  return {
    sno: index + 1,
    name: item.name || item.description || item.product_name || "Item",
    sku: item.sku || `DEC-PRD-${String(index + 1).padStart(5, '0')}`,
    hsn: item.hsn_code || item.hsn || "8471",
    qty,
    rate,
    taxableValue,
    gstRate,
    gstAmount,
    total: Number(item.total) || taxableValue + gstAmount,
  };
}

// ==================== SHARED PDF RENDERER ====================
function renderInvoicePdf(
  doc: jsPDF,
  invoice: Invoice,
  items: NormalizedItem[],
  isIgst: boolean,
  totalCgst: number,
  totalSgst: number,
  totalIgst: number,
  logoBase64: string | null,
) {
  const { width: pw, height: ph, margin: M } = PAGE;
  const CW = pw - 2 * M; // content width = 182
  const safeZone = ph - PAGE.footerHeight - 4;
  let y = M;
  let currentPage = 1;

  const platformFee = Number(invoice.platform_fee) || 0;
  const platformFeeTax = Number(invoice.platform_fee_tax) || 0;
  const isFinal = invoice.is_final || invoice.invoice_type === "final";

  // ---------- HELPERS ----------
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

  // Invoice type label – top right
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

  // Company details – single line
  doc.setFontSize(6.5);
  doc.setTextColor(...COLORS.secondary);
  doc.setFont("helvetica", "normal");
  doc.text(`${COMPANY.address}, ${COMPANY.city}, ${COMPANY.state} - ${COMPANY.pincode}`, M, y);
  y += 3.5;
  doc.text(`Phone: ${COMPANY.phone}  |  Email: ${COMPANY.email}  |  GSTIN: ${COMPANY.gstin}  |  PAN: ${COMPANY.pan}`, M, y);
  y += 5;

  // Gold divider
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
  const metaPairs = [
    ["Invoice No.", invoice.invoice_number],
    ["Date", fmtDate(invoice.created_at)],
    ["Order No.", invoice.order?.order_number || "N/A"],
    ["Delivery Date", invoice.delivery_date ? fmtDate(invoice.delivery_date) : (isFinal ? "—" : "Pending")],
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
    // Vertical separator
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

  // Helper to draw party box
  const drawPartyBox = (x: number, title: string, titleBg: [number, number, number], titleFg: [number, number, number], lines: string[]) => {
    doc.setFillColor(...COLORS.white);
    doc.setDrawColor(...COLORS.border);
    doc.setLineWidth(0.3);
    doc.roundedRect(x, y, boxW, boxH, 1.5, 1.5, "FD");
    // Title bar
    doc.setFillColor(...titleBg);
    doc.rect(x, y, boxW, 7, "F");
    // Round top corners manually
    doc.roundedRect(x, y, boxW, 7, 1.5, 1.5, "F");
    doc.rect(x, y + 3, boxW, 4, "F");
    doc.setFontSize(7);
    doc.setTextColor(...titleFg);
    doc.setFont("helvetica", "bold");
    doc.text(title, x + boxPad, y + 5);
    // Content lines
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

  const clientName = (invoice.client_name || "Customer").toUpperCase();
  const billedToLines = [clientName];
  if (invoice.client_address) {
    const addrParts = invoice.client_address.split(", ").filter(Boolean);
    billedToLines.push(...addrParts.slice(0, 3));
  }
  if (invoice.buyer_state) billedToLines.push(`State: ${invoice.buyer_state}`);
  if (invoice.buyer_gstin) billedToLines.push(`GSTIN: ${invoice.buyer_gstin}`);

  drawPartyBox(M, "BILLED BY", COLORS.primary, COLORS.white, billedByLines);
  drawPartyBox(M + boxW + 6, "BILLED TO", COLORS.accent, COLORS.primary, billedToLines);

  y += boxH + 6;

  // ==================== 4. ITEMS TABLE ====================
  // Column layout – total = CW (182)
  const cols = {
    sno:    8,
    item:   42, // Name + SKU
    hsn:    14,
    qty:    10,
    rate:   22,
    taxable:22,
    gstPct: 12,
    gstAmt: 24,
    total:  28,
  };
  const tableX = M;
  const tableW = CW;
  const hdrH = 8;
  const rowH = 11;

  // Header
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

  // Rows
  items.forEach((item, idx) => {
    checkBreak(rowH + 1);
    doc.setFillColor(...(idx % 2 === 0 ? COLORS.white : COLORS.tableAlt));
    doc.rect(tableX, y, tableW, rowH, "F");
    doc.setDrawColor(...COLORS.border);
    doc.setLineWidth(0.08);
    doc.line(tableX, y + rowH, tableX + tableW, y + rowH);

    cx = tableX;
    const ty1 = y + 4.5;
    const ty2 = y + 8.5;

    // S.No
    doc.setFontSize(6);
    doc.setTextColor(...COLORS.secondary);
    doc.setFont("helvetica", "normal");
    doc.text(String(item.sno), cx + cols.sno / 2, y + 6, { align: "center" });
    cx += cols.sno;

    // Item name + SKU
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

    // HSN
    doc.text(item.hsn, cx + cols.hsn / 2, y + 6, { align: "center" });
    cx += cols.hsn;

    // Qty
    doc.text(String(item.qty), cx + cols.qty / 2, y + 6, { align: "center" });
    cx += cols.qty;

    // Rate
    doc.text(fmt(item.rate), cx + cols.rate - 2, y + 6, { align: "right" });
    cx += cols.rate;

    // Taxable
    doc.text(fmt(item.taxableValue), cx + cols.taxable - 2, y + 6, { align: "right" });
    cx += cols.taxable;

    // GST %
    doc.setTextColor(...COLORS.accent);
    doc.setFont("helvetica", "bold");
    doc.text(`${item.gstRate}%`, cx + cols.gstPct / 2, y + 6, { align: "center" });
    cx += cols.gstPct;

    // GST Amount
    doc.setTextColor(...COLORS.secondary);
    doc.setFont("helvetica", "normal");
    doc.text(fmt(item.gstAmount), cx + cols.gstAmt - 2, y + 6, { align: "right" });
    cx += cols.gstAmt;

    // Total
    doc.setTextColor(...COLORS.primary);
    doc.setFont("helvetica", "bold");
    doc.text(fmt(item.total), cx + cols.total - 2, y + 6, { align: "right" });

    y += rowH;
  });

  // Table bottom
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
  const wordsText = numberToWords(invoice.total_amount);
  const truncWords = wordsText.length > 90 ? wordsText.substring(0, 90) + "…" : wordsText;
  doc.text(truncWords, M + 4, y + 8);
  y += 14;

  // ==================== 6. SUMMARY SECTION (side by side) ====================
  const sumRightW = 86;
  const sumLeftW = CW - sumRightW - 6;
  // Calculate dynamic height
  const taxLines = isIgst ? 1 : 2;
  const pfLines = platformFee > 0 ? 1 : 0;
  const summaryH = 42 + (taxLines - 1) * 5 + pfLines * 5;

  // ---- TAX SUMMARY (left) ----
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
  taxRow("Place of Supply", invoice.buyer_state || COMPANY.state);

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

  sumRow("Subtotal", fmt(invoice.subtotal));

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

  // Grand Total bar
  ty += 3;
  doc.setFillColor(...COLORS.accent);
  doc.roundedRect(rx + 3, ty - 2, sumRightW - 6, 13, 2, 2, "F");
  doc.setFontSize(8);
  doc.setTextColor(...COLORS.primary);
  doc.setFont("helvetica", "bold");
  doc.text("GRAND TOTAL", lx + 1, ty + 6);
  doc.setFontSize(10);
  doc.text(fmt(invoice.total_amount), vx - 1, ty + 6, { align: "right" });

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

  // ==================== FOOTERS ====================
  const pageCount = doc.getNumberOfPages();
  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i);
    addFooter(i, pageCount);
  }
}

// ==================== HOOK ====================
export function useUnifiedInvoicePdf() {
  const [isGenerating, setIsGenerating] = useState(false);

  const generateInvoicePdf = useCallback(async (invoice: Invoice): Promise<Blob> => {
    const doc = new jsPDF({ orientation: "portrait", unit: "mm", format: "a4" });
    const isIgst = invoice.is_igst || (invoice.buyer_state?.toLowerCase() !== COMPANY.state.toLowerCase());
    const items = (invoice.items || []).map((item, idx) => normalizeItem(item, idx, isIgst));

    let totalCgst = invoice.cgst_amount || 0;
    let totalSgst = invoice.sgst_amount || 0;
    let totalIgst = invoice.igst_amount || 0;
    if (!totalCgst && !totalSgst && !totalIgst) {
      items.forEach((item) => {
        const cgst = isIgst ? 0 : item.gstAmount / 2;
        const sgst = isIgst ? 0 : item.gstAmount / 2;
        const igst = isIgst ? item.gstAmount : 0;
        totalCgst += cgst;
        totalSgst += sgst;
        totalIgst += igst;
      });
    }

    const logoBase64 = await fetchLogoAsBase64();
    renderInvoicePdf(doc, invoice, items, isIgst, totalCgst, totalSgst, totalIgst, logoBase64);
    return doc.output("blob");
  }, []);

  const downloadInvoicePdf = useCallback(async (invoice: Invoice) => {
    setIsGenerating(true);
    try {
      const blob = await generateInvoicePdf(invoice);
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `${invoice.invoice_number}.pdf`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
      toast.success("Invoice PDF downloaded!");
    } catch (e: unknown) {
      console.error("Error generating invoice PDF:", e);
      toast.error(e instanceof Error ? e.message : "Failed to generate PDF");
    } finally {
      setIsGenerating(false);
    }
  }, [generateInvoicePdf]);

  const generateAndUploadPdf = useCallback(async (invoice: Invoice): Promise<string | null> => {
    setIsGenerating(true);
    try {
      const blob = await generateInvoicePdf(invoice);
      const arrayBuffer = await blob.arrayBuffer();
      const uint8Array = new Uint8Array(arrayBuffer);
      const prefix = invoice.is_final ? "final-invoices" : "proforma-invoices";
      const fileName = `${prefix}/${invoice.invoice_number}.pdf`;
      const { error: uploadError } = await supabase.storage
        .from("invoices")
        .upload(fileName, uint8Array, { contentType: "application/pdf", upsert: true });
      if (uploadError) throw new Error("Failed to upload PDF");
      await supabase.from("invoices").update({ pdf_url: fileName }).eq("id", invoice.id);
      toast.success("Invoice PDF generated and uploaded!");
      return fileName;
    } catch (e: unknown) {
      console.error("Error uploading invoice PDF:", e);
      toast.error(e instanceof Error ? e.message : "Failed to upload PDF");
      return null;
    } finally {
      setIsGenerating(false);
    }
  }, [generateInvoicePdf]);

  return {
    generateInvoicePdf,
    downloadInvoicePdf,
    downloadInvoice: downloadInvoicePdf,
    generateAndUploadPdf,
    isGenerating,
  };
}
