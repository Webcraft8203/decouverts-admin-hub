import { useCallback, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { jsPDF } from "jspdf";
import { toast } from "sonner";
import invoiceLogo from "@/assets/invoice-logo.png";

// Intrinsic aspect ratio of the bundled invoice logo (width / height)
// Trimmed source: 313 x 257 px
const LOGO_ASPECT = 313 / 257;

// ==================== UNIFIED DECOUVERTES INVOICE TEMPLATE ====================

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
  fullName: "DECOUVERTES FUTURE TECH PRIVATE LIMITED",
  tagline: "Discovering Future Technologies",
  address: "A-414, Gera's Imperium Gateway,\nNear Nashik Phata Flyover, Opp. Bhosari Metro Station,\nKasarwadi, Pimpri-Chinchwad",
  city: "Pune",
  state: "Maharashtra",
  pincode: "411034",
  country: "India",
  phone: "+91 9561103435",
  email: "hello@decouvertes.in",
  gstin: "27AAKCD1492N1Z4",
  pan: "AAKCD1492N",
  website: "www.decouvertes.in",
  bank: {
    accountName: "DECOUVERTES FUTURE TECH PRIVATE LIMITED",
    accountNumber: "50200084298316",
    bankName: "HDFC Bank",
    branch: "Hinjawadi, Pune",
    ifsc: "HDFC0000794",
    accountType: "Current Account",
  },
  terms: [
    "1. Goods once sold will only be taken back or exchanged as per company policy.",
    "2. Payment is due within 30 days of invoice date unless otherwise specified.",
    "3. All disputes are subject to Pune jurisdiction.",
    "4. Warranty as per product terms and conditions.",
  ],
};

const PAGE = { width: 210, height: 297, margin: 14, footerHeight: 16 };

const fmt = (amount: number): string =>
  `Rs. ${Number(amount || 0).toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

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
  // Always prefer the bundled, pre-trimmed invoice logo for consistent header alignment
  const sources = [invoiceLogo, '/logo.png'];
  for (const src of sources) {
    try {
      const response = await fetch(src);
      if (!response.ok) continue;
      const blob = await response.blob();
      if (blob.size < 100) continue;
      return await new Promise<string | null>((resolve) => {
        const reader = new FileReader();
        reader.onloadend = () => resolve(reader.result as string);
        reader.onerror = () => resolve(null);
        reader.readAsDataURL(blob);
      });
    } catch { continue; }
  }
  return null;
};

const fetchUpiQr = async (): Promise<string | null> => {
  try {
    const res = await fetch('/upiqr.png');
    if (!res.ok) return null;
    const blob = await res.blob();
    return await new Promise((resolve) => {
      const reader = new FileReader();
      reader.onloadend = () => resolve(reader.result as string);
      reader.onerror = () => resolve(null);
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
    hsn: item.hsn_code || item.hsn || "N/A",
    qty,
    rate,
    taxableValue,
    gstRate,
    gstAmount,
    total: Number(item.total) || taxableValue + gstAmount,
  };
}

// ==================== HELPERS ====================

/** Parse a possibly concatenated address into clean multi-line form */
function parseAddress(raw: string): string[] {
  // Fix common concatenation issues: "LIMITEDloor" → "LIMITED, Floor"
  let cleaned = raw
    .replace(/([a-z])([A-Z])/g, '$1, $2')  // camelCase breaks
    .replace(/(\w)(Floor|Building|Plot|Flat|Office|Room|Unit|Suite|Wing|Tower|Block|Sector)/g, '$1, $2')
    .replace(/,\s*,/g, ',')  // double commas
    .replace(/\s{2,}/g, ' ') // multiple spaces
    .trim();

  // Split on common delimiters
  const parts = cleaned.split(/[,\n]+/).map(s => s.trim()).filter(Boolean);
  
  // Group into logical lines (max ~50 chars per line)
  const lines: string[] = [];
  let current = '';
  for (const part of parts) {
    if (current && (current.length + part.length > 50)) {
      lines.push(current.trim());
      current = part;
    } else {
      current = current ? `${current}, ${part}` : part;
    }
  }
  if (current) lines.push(current.trim());
  return lines;
}

// ==================== PDF RENDERER ====================
// 8px grid system → in mm: 1 unit = 2mm. Spacings: 2/4/6/8/10/12/16
function renderInvoicePdf(
  doc: jsPDF,
  invoice: Invoice,
  items: NormalizedItem[],
  isIgst: boolean,
  totalCgst: number,
  totalSgst: number,
  totalIgst: number,
  logoBase64: string | null,
  qrBase64: string | null
) {
  const isManual = !invoice.order_id;
  const { width: pw, height: ph, margin: M } = PAGE;
  const CW = pw - 2 * M;
  const FOOTER_RESERVE = 12; // reserved space at bottom for footer (always)
  const safeZone = ph - FOOTER_RESERVE;
  let y = M;

  const platformFee = Number(invoice.platform_fee) || 0;
  const platformFeeTax = Number(invoice.platform_fee_tax) || 0;
  const isFinal = invoice.is_final || invoice.invoice_type === "final";
  const genTime = new Date().toLocaleString("en-IN", {
    day: "2-digit", month: "2-digit", year: "numeric",
    hour: "2-digit", minute: "2-digit", hour12: true,
  });

  // ---------- FOOTER (3-column, pixel-aligned, repeats on every page) ----------
  const addFooter = (pageNum: number, total: number) => {
    const fy = ph - 12;
    // Top divider
    doc.setDrawColor(...COLORS.border);
    doc.setLineWidth(0.25);
    doc.line(M, fy, pw - M, fy);

    const lineY1 = fy + 4.5;
    const lineY2 = fy + 8.5;

    doc.setFont("helvetica", "normal");
    doc.setFontSize(6.2);
    doc.setTextColor(...COLORS.muted);

    // LEFT — disclaimer (wrapped, max ~60mm)
    const leftMaxW = 60;
    const disclaimer = doc.splitTextToSize(
      "This is a computer-generated document and does not require a signature.",
      leftMaxW
    ) as string[];
    disclaimer.forEach((l, i) => doc.text(l, M, lineY1 + i * 3.4));

    // CENTER — generated timestamp + website
    doc.text(`Generated: ${genTime}`, pw / 2, lineY1, { align: "center" });
    doc.setTextColor(...COLORS.accent);
    doc.setFont("helvetica", "bold");
    doc.text(COMPANY.website, pw / 2, lineY2, { align: "center" });

    // RIGHT — page X of Y
    doc.setFont("helvetica", "normal");
    doc.setTextColor(...COLORS.secondary);
    doc.setFontSize(6.5);
    doc.text(`Page ${pageNum} of ${total}`, pw - M, lineY1, { align: "right" });
    doc.setFontSize(5.8);
    doc.setTextColor(...COLORS.muted);
    doc.text(invoice.invoice_number, pw - M, lineY2, { align: "right" });
  };

  const checkBreak = (h: number) => {
    if (y + h > safeZone) { doc.addPage(); y = M; return true; }
    return false;
  };

  // ==================== 1. HEADER ====================
  // Optical alignment baseline system
  const headerTop = y;
  const headerRight = pw - M;

  // Logo sized by HEIGHT (16mm ≈ 48px @ 72dpi), width derived from intrinsic aspect.
  // Pre-trimmed source removes transparent padding so bounding box hugs the mark.
  const logoH = 12; // reduced size
  const logoW = logoH * LOGO_ASPECT;
  const logoX = M;

  // Optical alignment logic for logo
  const logoCenterOffset = 0.64; // tuned for this logo shape
  const opticalAdjust = 2;
  const logoY = (headerTop + 10) - (logoH * logoCenterOffset) + opticalAdjust;

  if (logoBase64) {
    try {
      doc.addImage(logoBase64, "PNG", logoX, logoY, logoW, logoH);
    } catch { /* ignore */ }
  }

  // 12-16px gap between logo and text → ~4mm in PDF
  const textX = logoBase64 ? logoX + logoW + 4 : M;

  const logoCenterY = logoY + (logoH / 2);

  const titleFontSize = 18;
  const taglineFontSize = 7.8;
  const gapBetween = 3.5;

  const textBlockHeight = titleFontSize * 0.35 + gapBetween + taglineFontSize * 0.35;

  // Compute starting Y so text block is vertically centered to logo
  // Adjusted to point to the text baseline instead of the bounding box top
  const textStartY = logoCenterY - (textBlockHeight / 2) + (titleFontSize * 0.35);

  // Company name aligned exactly to baseline
  doc.setFontSize(titleFontSize);
  doc.setTextColor(...COLORS.primary);
  doc.setFont("helvetica", "bold");
  const titleWidth = doc.getTextWidth(COMPANY.name);
  doc.text(COMPANY.name, textX, textStartY);

  // Place tagline directly below name
  doc.setFontSize(taglineFontSize);
  doc.setTextColor(...COLORS.muted);
  doc.setFont("helvetica", "normal");
  const taglineWidth = doc.getTextWidth(COMPANY.tagline);
  
  const taglineY = textStartY + 6; // controlled spacing
  const taglineX = textX + (titleWidth / 2) - (taglineWidth / 2);
  doc.text(COMPANY.tagline, taglineX, taglineY);

  // Invoice type – right side, perfectly aligned with company name
  const typeLabel = isFinal ? "TAX INVOICE" : "PROFORMA INVOICE";
  doc.setFontSize(13);
  doc.setTextColor(...(isFinal ? COLORS.primary : COLORS.secondary));
  doc.setFont("helvetica", "bold");
  doc.text(typeLabel, headerRight, textStartY, { align: "right" });
  doc.setFontSize(6.8);
  doc.setTextColor(...COLORS.muted);
  doc.setFont("helvetica", "normal");
  doc.text(
    isFinal ? "GST-Compliant Tax Invoice" : "Not valid for tax purposes",
    headerRight, textStartY + 5.5, { align: "right" }
  );

  // Reserve consistent header height (logo height + small breathing room)
  y = headerTop + logoH + 9;

  // ---------- COMPANY DETAILS ROW (inline w/ "|" separators) ----------
  doc.setFontSize(6.8);
  doc.setTextColor(...COLORS.muted);
  doc.setFont("helvetica", "normal");
  const addrFlat = `${COMPANY.address.replace(/\n/g, ', ')}, ${COMPANY.city}, ${COMPANY.state} - ${COMPANY.pincode}`;
  const addrLines = doc.splitTextToSize(addrFlat, CW) as string[];
  addrLines.forEach((line) => { doc.text(line, M, y); y += 3.4; });
  y += 2;
  // Contact / tax info row with "|" separators
  doc.setTextColor(...COLORS.secondary);
  const contactRow = `Phone: ${COMPANY.phone}  |  Email: ${COMPANY.email}  |  GSTIN: ${COMPANY.gstin}  |  PAN: ${COMPANY.pan}`;
  doc.text(contactRow, M, y);
  y += 4;

  // Bottom divider (gold accent)
  doc.setDrawColor(...COLORS.accent);
  doc.setLineWidth(0.5);
  doc.line(M, y, pw - M, y);
  y += 4;

  // ==================== 2. INVOICE META ROW (3-col responsive grid) ====================
  // Auto-skip Order No on manual invoices to keep grid balanced
  const metaPairs: [string, string][] = [
    ["INVOICE NO.", invoice.invoice_number],
    ["INVOICE DATE", fmtDate(invoice.created_at)],
  ];
  if (!isManual && invoice.order?.order_number) {
    metaPairs.push(["ORDER NO.", invoice.order.order_number]);
  }
  if (!isManual) {
    metaPairs.push(["DELIVERY DATE", invoice.delivery_date ? fmtDate(invoice.delivery_date) : (isFinal ? "-" : "Pending")]);
  }
  const metaH = 14;
  doc.setFillColor(...COLORS.light);
  doc.rect(M, y, CW, metaH, "F");
  doc.setDrawColor(...COLORS.border);
  doc.setLineWidth(0.2);
  doc.rect(M, y, CW, metaH, "S");
  const metaColW = CW / metaPairs.length;


  metaPairs.forEach(([label, value], i) => {
    const x = M + metaColW * i + 5;
    doc.setFontSize(6);
    doc.setTextColor(...COLORS.muted);
    doc.setFont("helvetica", "normal");
    doc.text(label, x, y + 5.5);
    doc.setFontSize(8.5);
    doc.setTextColor(...COLORS.primary);
    doc.setFont("helvetica", "bold");
    const valueLines = doc.splitTextToSize(value || "-", metaColW - 10) as string[];
    doc.text(valueLines[0], x, y + 10.5);
    if (i > 0) {
      doc.setDrawColor(...COLORS.border);
      doc.setLineWidth(0.2);
      doc.line(M + metaColW * i, y + 2.5, M + metaColW * i, y + metaH - 2.5);
    }
  });

  y += metaH + 6;

  // ==================== 3. BILLED BY / BILLED TO ====================
  const boxW = (CW - 8) / 2;
  const boxPad = 5;
  const lineH = 3.8;
  const titleBarH = 8;

  // Prepare Billed By lines
  const billedByContentLines = [
    COMPANY.fullName,
    ...COMPANY.address.split('\n'),
    `${COMPANY.city}, ${COMPANY.state} - ${COMPANY.pincode}`,
    `Phone: ${COMPANY.phone}`,
    `Email: ${COMPANY.email}`,
    `GSTIN: ${COMPANY.gstin}`,
    `PAN: ${COMPANY.pan}`,
  ];

  // Prepare Billed To lines with proper address parsing
  const clientName = (invoice.client_name || "Customer").toUpperCase();
  const billedToContentLines = [clientName];
  if (invoice.client_address) {
    const addressLines = parseAddress(invoice.client_address);
    billedToContentLines.push(...addressLines);
  }
  if (invoice.client_email) billedToContentLines.push(`Email: ${invoice.client_email}`);
  if (invoice.buyer_state) billedToContentLines.push(`State: ${invoice.buyer_state}`);
  if (invoice.buyer_gstin) billedToContentLines.push(`GSTIN: ${invoice.buyer_gstin}`);

  // Pre-wrap all lines to measure height
  const maxTextW = boxW - boxPad * 2;
  const wrapLines = (lines: string[]): string[][] => {
    doc.setFontSize(6.5);
    return lines.map(l => doc.splitTextToSize(l, maxTextW) as string[]);
  };
  const wrappedBy = wrapLines(billedByContentLines);
  const wrappedTo = wrapLines(billedToContentLines);

  const countWrappedH = (wrapped: string[][]): number => {
    let h = titleBarH + boxPad; // title bar + top padding
    wrapped.forEach((wl, idx) => {
      const extra = idx === 0 ? 5.5 : lineH; // first line (name) is larger
      h += extra;
      if (wl.length > 1) h += (wl.length - 1) * lineH;
    });
    return h + boxPad; // bottom padding
  };

  const boxH = Math.max(countWrappedH(wrappedBy), countWrappedH(wrappedTo));

  const drawPartyBox = (
    x: number, title: string, 
    titleBg: [number, number, number], titleFg: [number, number, number], 
    contentLines: string[], wrappedContent: string[][]
  ) => {
    // Box background
    doc.setFillColor(...COLORS.white);
    doc.setDrawColor(...COLORS.border);
    doc.setLineWidth(0.3);
    doc.roundedRect(x, y, boxW, boxH, 2, 2, "FD");

    // Title bar
    doc.setFillColor(...titleBg);
    doc.roundedRect(x, y, boxW, titleBarH, 2, 2, "F");
    doc.rect(x, y + 4, boxW, titleBarH - 4, "F"); // fill rounded gap
    doc.setFontSize(7);
    doc.setTextColor(...titleFg);
    doc.setFont("helvetica", "bold");
    doc.text(title, x + boxPad, y + 5.5);

    // Content
    let ly = y + titleBarH + boxPad + 1;
    wrappedContent.forEach((wl, idx) => {
      const originalLine = contentLines[idx] || '';
      if (idx === 0) {
        // Name – bold, slightly larger
        doc.setFontSize(7.5);
        doc.setTextColor(...COLORS.primary);
        doc.setFont("helvetica", "bold");
      } else if (originalLine.startsWith("GSTIN:") || originalLine.startsWith("PAN:")) {
        doc.setFontSize(6.5);
        doc.setTextColor(...COLORS.accent);
        doc.setFont("helvetica", "bold");
      } else if (originalLine.startsWith("Email:") || originalLine.startsWith("Phone:") || originalLine.startsWith("State:")) {
        doc.setFontSize(6.5);
        doc.setTextColor(...COLORS.secondary);
        doc.setFont("helvetica", "normal");
      } else {
        doc.setFontSize(6.5);
        doc.setTextColor(...COLORS.secondary);
        doc.setFont("helvetica", "normal");
      }

      wl.forEach((segment: string, si: number) => {
        doc.text(segment, x + boxPad, ly);
        if (si < wl.length - 1) ly += lineH;
      });
      ly += (idx === 0 ? 5.5 : lineH);
    });
  };

  drawPartyBox(M, "BILLED BY", COLORS.primary, COLORS.white, billedByContentLines, wrappedBy);
  drawPartyBox(M + boxW + 8, "BILLED TO", COLORS.accent, COLORS.primary, billedToContentLines, wrappedTo);

  y += boxH + 6;

  // ==================== 4. ITEMS TABLE ====================
  // Column layout – total = CW (182)
  const cols = { sno: 8, item: 40, hsn: 14, qty: 10, rate: 22, taxable: 24, gstPct: 12, gstAmt: 24, total: 28 };
  const tableX = M;
  const tableW = CW;
  const hdrH = 9;

  // Header
  doc.setFillColor(...COLORS.tableHeader);
  doc.rect(tableX, y, tableW, hdrH, "F");
  doc.setFontSize(6);
  doc.setTextColor(...COLORS.white);
  doc.setFont("helvetica", "bold");

  let cx = tableX;
  const hdrY = y + 6;
  const hdr = (label: string, w: number, align: "left" | "right" | "center" = "left") => {
    if (w === 0) return;
    if (align === "right") doc.text(label, cx + w - 3, hdrY, { align: "right" });
    else if (align === "center") doc.text(label, cx + w / 2, hdrY, { align: "center" });
    else doc.text(label, cx + 3, hdrY);
    cx += w;
  };
  hdr("#", cols.sno, "center");
  hdr("Item Description", cols.item);
  hdr("HSN", cols.hsn, "center");
  hdr("Qty", cols.qty, "center");
  hdr("Rate (Rs.)", cols.rate, "right");
  hdr("Taxable (Rs.)", cols.taxable, "right");
  hdr("GST %", cols.gstPct, "center");
  hdr("GST Amt (Rs.)", cols.gstAmt, "right");
  hdr("Total (Rs.)", cols.total, "right");

  y += hdrH;

  // Rows – dynamic height based on text wrapping
  items.forEach((item, idx) => {
    // Pre-calculate row height based on item name wrapping
    const maxItemW = cols.item - 6;
    doc.setFontSize(6.5);
    const itemNameLines: string[] = doc.splitTextToSize(item.name, maxItemW);
    const nameBlockH = itemNameLines.length * 3.5;
    const skuLineH = 4;
    const minRowH = 10;
    const rowH = Math.max(minRowH, nameBlockH + skuLineH + 4);

    checkBreak(rowH + 1);

    // Row background
    doc.setFillColor(...(idx % 2 === 0 ? COLORS.white : COLORS.tableAlt));
    doc.rect(tableX, y, tableW, rowH, "F");
    doc.setDrawColor(...COLORS.border);
    doc.setLineWidth(0.08);
    doc.line(tableX, y + rowH, tableX + tableW, y + rowH);

    cx = tableX;
    const numCenterY = y + rowH / 2 + 1;

    // S.No
    doc.setFontSize(6);
    doc.setTextColor(...COLORS.secondary);
    doc.setFont("helvetica", "normal");
    doc.text(String(item.sno), cx + cols.sno / 2, numCenterY, { align: "center" });
    cx += cols.sno;

    // Item name – wrapped multi-line
    doc.setTextColor(...COLORS.primary);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(6.5);
    const nameStartY = y + 4;
    itemNameLines.forEach((il: string, ilIdx: number) => {
      doc.text(il, cx + 3, nameStartY + ilIdx * 3.5);
    });
    // SKU & HSN below name
    const skuY = nameStartY + itemNameLines.length * 3.5 + 1;
    doc.setFontSize(5.5);
    doc.setTextColor(...COLORS.muted);
    doc.setFont("helvetica", "normal");
    if (!isManual) {
      doc.text(`SKU: ${item.sku}`, cx + 3, skuY);
    }
    cx += cols.item;

    // HSN column – always shown
    doc.setFontSize(6);
    doc.setTextColor(...COLORS.secondary);
    doc.setFont("helvetica", "normal");
    doc.text(item.hsn || "N/A", cx + cols.hsn / 2, numCenterY, { align: "center" });
    cx += cols.hsn;

    doc.text(String(item.qty), cx + cols.qty / 2, numCenterY, { align: "center" });
    cx += cols.qty;

    doc.text(fmt(item.rate), cx + cols.rate - 3, numCenterY, { align: "right" });
    cx += cols.rate;

    doc.text(fmt(item.taxableValue), cx + cols.taxable - 3, numCenterY, { align: "right" });
    cx += cols.taxable;

    doc.setTextColor(...COLORS.accent);
    doc.setFont("helvetica", "bold");
    doc.text(`${item.gstRate}%`, cx + cols.gstPct / 2, numCenterY, { align: "center" });
    cx += cols.gstPct;

    doc.setTextColor(...COLORS.secondary);
    doc.setFont("helvetica", "normal");
    doc.text(fmt(item.gstAmount), cx + cols.gstAmt - 3, numCenterY, { align: "right" });
    cx += cols.gstAmt;

    doc.setTextColor(...COLORS.primary);
    doc.setFont("helvetica", "bold");
    doc.text(fmt(item.total), cx + cols.total - 3, numCenterY, { align: "right" });

    y += rowH;
  });

  // Table bottom
  doc.setDrawColor(...COLORS.primary);
  doc.setLineWidth(0.5);
  doc.line(tableX, y, tableX + tableW, y);
  y += 5;

  // ==================== 5. AMOUNT IN WORDS ====================
  checkBreak(55);
  const wordsBoxH = 14;
  doc.setFillColor(...COLORS.light);
  doc.setDrawColor(...COLORS.border);
  doc.setLineWidth(0.15);
  doc.roundedRect(M, y, CW, wordsBoxH, 1, 1, "FD");
  doc.setFontSize(6);
  doc.setTextColor(...COLORS.muted);
  doc.setFont("helvetica", "normal");
  doc.text("Amount in Words:", M + 5, y + 5);
  doc.setFontSize(7);
  doc.setTextColor(...COLORS.primary);
  doc.setFont("helvetica", "bold");
  const wordsText = numberToWords(invoice.total_amount);
  const wrappedWords: string[] = doc.splitTextToSize(wordsText, CW - 10);
  wrappedWords.forEach((wl: string, wi: number) => {
    doc.text(wl, M + 5, y + 10 + wi * 3.5);
  });
  y += wordsBoxH + 3;

  // ==================== 6. SUMMARY SECTION & BANK DETAILS ====================
  const sumRightW = CW * 0.38;
  const sumLeftW = CW - sumRightW - 10;
  const taxLines = isIgst ? 1 : 2;
  const pfLines = platformFee > 0 ? (platformFeeTax > 0 ? 2 : 1) : 0;

  // Calculate Box Heights for a balanced grid
  const taxBoxH = 28 + (taxLines * 5); // Dynamically sizes based on tax rows

  // Bank Details Config
  const bankRows: [string, string][] = [
    ["Account Name", COMPANY.bank.accountName],
    ["Account Number", COMPANY.bank.accountNumber],
    ["Bank Name", COMPANY.bank.bankName],
    ["Branch", COMPANY.bank.branch],
    ["IFSC Code", COMPANY.bank.ifsc],
    ["Account Type", COMPANY.bank.accountType],
  ];
  const bankTitleH = 6;
  const bankRowH = 3.2;
  const bankBlockH = bankTitleH + 6 + bankRows.length * bankRowH;

  const rightBoxH = 10 + (pfLines * 5) + (taxLines * 5) + 6 + 12 + 6;

  // ==================== TWO-COLUMN RESPONSIVE LAYOUT ====================
  const upiBlockHeight = 54;

  doc.setFontSize(5.5);
  const termsLines: string[] = [];
  COMPANY.terms.forEach((term) => {
    const wrapped = doc.splitTextToSize(term, sumLeftW) as string[];
    termsLines.push(...wrapped);
  });
  const termsLineHeight = 3.2;
  const termsHeight = 5 + (termsLines.length * termsLineHeight);

  // Layout State
  let leftY = y;
  let rightY = y;
  let currentPage = doc.getNumberOfPages();

  const ensurePage = (targetY: number, height: number): number => {
    if (targetY + height > safeZone) {
      doc.addPage();
      currentPage = doc.getNumberOfPages();
      leftY = M;
      rightY = M;
      return M;
    }
    // ensure we are on the correct page if the other column triggered a new page
    doc.setPage(currentPage);
    return targetY;
  };

  const renderLeft = (height: number, drawFn: (startY: number) => void) => {
    leftY = ensurePage(leftY, height);
    drawFn(leftY);
    leftY += height + 6;
  };

  const renderRight = (height: number, drawFn: (startY: number) => void) => {
    rightY = ensurePage(rightY, height);
    drawFn(rightY);
    rightY += height + 6;
  };

  // --- 1. TAX SUMMARY (LEFT) ---
  renderLeft(taxBoxH, (startY) => {
    doc.setFillColor(...COLORS.light);
    doc.setDrawColor(...COLORS.border);
    doc.setLineWidth(0.2);
    doc.roundedRect(M, startY, sumLeftW, taxBoxH, 2, 2, "FD");

    doc.setFontSize(7.5);
    doc.setTextColor(...COLORS.primary);
    doc.setFont("helvetica", "bold");
    doc.text("TAX SUMMARY", M + 5, startY + 8);

    let gy = startY + 12;
    doc.setFontSize(6.5);

    const labelX = M + 5;
    const valueX = M + sumLeftW - 5;
    const taxRowGap = 4.5;

    const taxRow = (label: string, value: string) => {
      doc.setTextColor(...COLORS.muted);
      doc.setFont("helvetica", "normal");
      doc.text(label, labelX, gy);
      doc.setTextColor(...COLORS.primary);
      doc.setFont("helvetica", "bold");
      doc.text(value, valueX, gy, { align: "right" });
      gy += taxRowGap;
    };

    taxRow("Supply Type", isIgst ? "Inter-State" : "Intra-State");
    taxRow("Place of Supply", invoice.buyer_state || COMPANY.state);

    doc.setDrawColor(...COLORS.border);
    doc.line(labelX, gy, valueX, gy);
    gy += 3;

    if (isIgst) {
      taxRow("IGST", fmt(totalIgst));
    } else {
      taxRow("CGST", fmt(totalCgst));
      taxRow("SGST", fmt(totalSgst));
    }

    doc.setDrawColor(...COLORS.accent);
    doc.setLineWidth(0.5);
    doc.line(labelX, gy, valueX, gy);
    gy += 3;

    doc.setFontSize(7);
    doc.setTextColor(...COLORS.primary);
    doc.setFont("helvetica", "bold");
    doc.text("Total Tax", labelX, gy);
    doc.setTextColor(...COLORS.accent);
    doc.text(fmt(totalCgst + totalSgst + totalIgst), valueX, gy, { align: "right" });
  });

  // --- 2. SUMMARY BLACK BOX (RIGHT) ---
  renderRight(rightBoxH, (startY) => {
    const rx = M + sumLeftW + 10;
    doc.setFillColor(45, 45, 45); // slightly lighter
    doc.roundedRect(rx, startY, sumRightW, rightBoxH, 2, 2, "F");

    const lx = rx + 7;
    const vx = rx + sumRightW - 7;
    
    doc.setFontSize(7);
    doc.setTextColor(180, 180, 180);
    doc.text("SUMMARY", lx, startY + 6);

    let ty = startY + 11; // 5 units below summary title
    doc.setFontSize(7);
    doc.setTextColor(200, 200, 200);
    doc.setFont("helvetica", "normal");

    const sumRow = (label: string, value: string) => {
      doc.text(label, lx, ty);
      doc.text(value, vx, ty, { align: "right" });
      ty += 5;
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
    const grandTotalBarH = 12;
    const grandTotalY = ty + 3;
    
    doc.setFillColor(...COLORS.accent);
    doc.roundedRect(rx + 4, grandTotalY, sumRightW - 8, grandTotalBarH, 2, 2, "F");
    
    doc.setFontSize(8);
    doc.setTextColor(...COLORS.primary);
    doc.setFont("helvetica", "bold");
    doc.text("GRAND TOTAL", lx + 1, grandTotalY + grandTotalBarH / 2 + 1.5);
    
    doc.setFontSize(10);
    doc.text(fmt(invoice.total_amount), vx - 1, grandTotalY + grandTotalBarH / 2 + 1.5, { align: "right" });
  });

  // --- 3. BANK DETAILS (LEFT) ---
  renderLeft(bankBlockH, (startY) => {
    doc.setDrawColor(...COLORS.border);
    doc.setLineWidth(0.2);
    doc.line(M, startY - 3, M + sumLeftW, startY - 3);
    
    doc.setFontSize(7.5);
    doc.setTextColor(...COLORS.primary);
    doc.setFont("helvetica", "bold");
    doc.text("Bank Details", M, startY + 6);

    let by = startY + 6 + 3.2 + 2; // +2 for baseline text alignment
    const bankLabelX = M;
    const bankValueX = M + sumLeftW;
    
    bankRows.forEach(([label, value]) => {
      doc.setFontSize(6.5);
      doc.setTextColor(...COLORS.muted);
      doc.setFont("helvetica", "normal");
      doc.text(label, bankLabelX, by);
      
      doc.setTextColor(...COLORS.primary);
      doc.setFont("helvetica", "bold");
      doc.text(value, bankValueX, by, { align: "right" });
      by += bankRowH;
    });
  });

  // --- 4. UPI PAYMENT (RIGHT) ---
  renderRight(upiBlockHeight, (startY) => {
    const rx = M + sumLeftW + 10;
    const centerX = rx + (sumRightW / 2);

    doc.setFontSize(7.5);
    doc.setTextColor(...COLORS.primary);
    doc.setFont("helvetica", "bold");
    doc.text("Scan to Pay via UPI", centerX, startY + 6, { align: "center" });

    let uy = startY + 10;
    doc.setFontSize(6.5);
    doc.setTextColor(...COLORS.muted);
    doc.setFont("helvetica", "normal");
    doc.text("Maximum of 1 lakh can", centerX, uy, { align: "center" });
    uy += 3.5;
    doc.text("be transferred via UPI in a", centerX, uy, { align: "center" });
    uy += 3.5;
    doc.text("single day", centerX, uy, { align: "center" });

    const qrSize = 26;
    const qrX = centerX - (qrSize / 2);
    const qrY = uy + 6;

    doc.setDrawColor(...COLORS.border);
    doc.setLineWidth(0.2);
    if (qrBase64) {
      try {
        doc.addImage(qrBase64, "PNG", qrX, qrY, qrSize, qrSize);
      } catch {
        doc.roundedRect(qrX, qrY, qrSize, qrSize, 2, 2, "S");
      }
    } else {
      doc.roundedRect(qrX, qrY, qrSize, qrSize, 2, 2, "S");
    }

    doc.setFontSize(7.5);
    doc.setTextColor(...COLORS.accent);
    doc.setFont("helvetica", "bold");
    doc.text("natashasoni0529-2@okhdfcbank", centerX, qrY + qrSize + 6, { align: "center" });
  });

  // --- 5. TERMS & CONDITIONS (LEFT) ---
  renderLeft(termsHeight, (startY) => {
    let ty = startY;
    doc.setFontSize(7);
    doc.setTextColor(...COLORS.primary);
    doc.setFont("helvetica", "bold");
    doc.text("Terms & Conditions", M, ty);
    ty += 5;

    doc.setFontSize(5.5);
    doc.setTextColor(...COLORS.muted);
    doc.setFont("helvetica", "normal");
    termsLines.forEach((line) => { 
      doc.text(line, M, ty); 
      ty += termsLineHeight; 
    });
  });

  y = Math.max(leftY, rightY);

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
    const qrBase64 = await fetchUpiQr();
    renderInvoicePdf(doc, invoice, items, isIgst, totalCgst, totalSgst, totalIgst, logoBase64, qrBase64);
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
