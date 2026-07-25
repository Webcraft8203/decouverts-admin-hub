import { useCallback, useState } from "react";
import { jsPDF } from "jspdf";
import { toast } from "sonner";

// ==================== TYPES ====================
export interface QuotationItem {
  product_name: string;
  description?: string | null;
  quantity: number;
  unit?: string | null;
  rate: number;
  discount?: number | null;
  gst?: number | null;
  total: number;
  hsn?: string | null;
  sku?: string | null;
}

export interface Quotation {
  id: string;
  quotation_number: string;
  quotation_date: string;
  valid_until?: string | null;
  reference_number?: string | null;
  subject?: string | null;
  prepared_by?: string | null;
  customer_name: string;
  company_name?: string | null;
  contact_person?: string | null;
  mobile?: string | null;
  email?: string | null;
  gst_number?: string | null;
  billing_address?: string | null;
  shipping_address?: string | null;
  delivery_time?: string | null;
  installation?: string | null;
  training?: string | null;
  warranty?: string | null;
  payment_terms?: string | null;
  dispatch_location?: string | null;
  subtotal: number;
  discount: number;
  taxable_amount: number;
  cgst: number;
  sgst: number;
  igst: number;
  round_off: number;
  grand_total: number;
  is_igst: boolean;
  scope_of_supply?: string | null;
  exclusions?: string | null;
  terms_conditions?: string | null;
  notes?: string | null;
  status: string;
  items: QuotationItem[];
}

// ==================== BRAND CONSTANTS (aligned with Invoice) ====================
const COLORS = {
  primary: [28, 28, 28] as [number, number, number],
  accent: [212, 175, 55] as [number, number, number],
  secondary: [68, 68, 68] as [number, number, number],
  muted: [130, 130, 130] as [number, number, number],
  light: [245, 245, 245] as [number, number, number],
  border: [218, 218, 218] as [number, number, number],
  white: [255, 255, 255] as [number, number, number],
  tableHeader: [28, 28, 28] as [number, number, number],
  tableAlt: [250, 250, 250] as [number, number, number],
};

const COMPANY = {
  name: "DECOUVERTES",
  fullName: "DECOUVERTES FUTURE TECH PRIVATE LIMITED",
  tagline: "Discovering Future Technologies",
  address:
    "A-414, Gera's Imperium Gateway,\nNear Nashik Phata Flyover, Opp. Bhosari Metro Station,\nKasarwadi, Pimpri-Chinchwad",
  city: "Pune",
  state: "Maharashtra",
  pincode: "411034",
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
  defaultTerms: [
    "1. This quotation is valid for 30 days from the date of issue unless otherwise stated.",
    "2. Prices are exclusive of GST unless explicitly mentioned. Freight, insurance and unloading extra at actuals.",
    "3. Delivery timelines commence only after receipt of confirmed Purchase Order and advance payment.",
    "4. Any change in scope, specifications or quantities will be quoted separately.",
    "5. Warranty and after-sales support as per individual product terms and conditions.",
    "6. All disputes are subject to Pune jurisdiction only.",
  ],
};

const PAGE = { width: 210, height: 297, margin: 14 };

const fmt = (n: number) =>
  `Rs. ${Number(n || 0).toLocaleString("en-IN", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;

const fmtDate = (d?: string | null) =>
  d
    ? new Date(d).toLocaleDateString("en-IN", {
        day: "2-digit",
        month: "short",
        year: "numeric",
      })
    : "-";

const numberToWords = (num: number): string => {
  const ones = [
    "", "One", "Two", "Three", "Four", "Five", "Six", "Seven", "Eight", "Nine",
    "Ten", "Eleven", "Twelve", "Thirteen", "Fourteen", "Fifteen", "Sixteen",
    "Seventeen", "Eighteen", "Nineteen",
  ];
  const tens = ["", "", "Twenty", "Thirty", "Forty", "Fifty", "Sixty", "Seventy", "Eighty", "Ninety"];
  if (!num) return "Zero Rupees Only";
  const convert = (n: number): string => {
    if (n < 20) return ones[n];
    if (n < 100) return tens[Math.floor(n / 10)] + (n % 10 ? " " + ones[n % 10] : "");
    if (n < 1000) return ones[Math.floor(n / 100)] + " Hundred" + (n % 100 ? " And " + convert(n % 100) : "");
    if (n < 100000) return convert(Math.floor(n / 1000)) + " Thousand" + (n % 1000 ? " " + convert(n % 1000) : "");
    if (n < 10000000) return convert(Math.floor(n / 100000)) + " Lakh" + (n % 100000 ? " " + convert(n % 100000) : "");
    return convert(Math.floor(n / 10000000)) + " Crore" + (n % 10000000 ? " " + convert(n % 10000000) : "");
  };
  const rupees = Math.floor(num);
  const paise = Math.round((num - rupees) * 100);
  let result = convert(rupees) + " Rupees";
  if (paise > 0) result += " And " + convert(paise) + " Paise";
  return result + " Only";
};

const fetchImage = async (path: string): Promise<string | null> => {
  try {
    const res = await fetch(path);
    if (!res.ok) return null;
    const blob = await res.blob();
    if (blob.size < 100) return null;
    return await new Promise<string | null>((resolve) => {
      const r = new FileReader();
      r.onloadend = () => resolve(r.result as string);
      r.onerror = () => resolve(null);
      r.readAsDataURL(blob);
    });
  } catch {
    return null;
  }
};

// ==================== RENDERER ====================
async function renderQuotationPdf(doc: jsPDF, q: Quotation) {
  const logo = await fetchImage("/invoice-logo.png");
  const signature = await fetchImage("/signature.png");

  const { width: pw, height: ph, margin: M } = PAGE;
  const CW = pw - 2 * M;
  const FOOTER_RESERVE = 12;
  const safeZone = ph - FOOTER_RESERVE;
  let y = M;

  const genTime = new Date().toLocaleString("en-IN", {
    day: "2-digit", month: "2-digit", year: "numeric",
    hour: "2-digit", minute: "2-digit", hour12: true,
  });

  // ---------- FOOTER ----------
  const addFooter = (pageNum: number, total: number) => {
    const fy = ph - 12;
    doc.setDrawColor(...COLORS.border);
    doc.setLineWidth(0.25);
    doc.line(M, fy, pw - M, fy);
    const lineY1 = fy + 4.5;
    const lineY2 = fy + 8.5;

    doc.setFont("helvetica", "normal");
    doc.setFontSize(6.2);
    doc.setTextColor(...COLORS.muted);
    doc.text(
      "This is a computer-generated quotation. E&OE. Subject to terms overleaf.",
      M, lineY1
    );

    doc.text(`Generated: ${genTime}`, pw / 2, lineY1, { align: "center" });
    doc.setTextColor(...COLORS.accent);
    doc.setFont("helvetica", "bold");
    doc.text(COMPANY.website, pw / 2, lineY2, { align: "center" });

    doc.setFont("helvetica", "normal");
    doc.setTextColor(...COLORS.secondary);
    doc.setFontSize(6.5);
    doc.text(`Page ${pageNum} of ${total}`, pw - M, lineY1, { align: "right" });
    doc.setFontSize(5.8);
    doc.setTextColor(...COLORS.muted);
    doc.text(q.quotation_number, pw - M, lineY2, { align: "right" });
  };

  const checkBreak = (h: number) => {
    if (y + h > safeZone) {
      doc.addPage();
      y = M;
      return true;
    }
    return false;
  };

  // ==================== 1. HEADER ====================
  const headerTop = y;
  if (logo) {
    try { doc.addImage(logo, "PNG", M, headerTop, 60, 0); } catch {}
  } else {
    doc.setFont("helvetica", "bold");
    doc.setFontSize(18);
    doc.setTextColor(...COLORS.primary);
    doc.text(COMPANY.name, M, headerTop + 10);
    doc.setFont("helvetica", "normal");
    doc.setFontSize(7);
    doc.setTextColor(...COLORS.accent);
    doc.text(COMPANY.tagline, M, headerTop + 15);
  }

  // Right — QUOTATION title
  doc.setFontSize(13);
  doc.setTextColor(...COLORS.primary);
  doc.setFont("helvetica", "bold");
  doc.text("QUOTATION", pw - M, headerTop + 10, { align: "right" });
  doc.setFontSize(6.8);
  doc.setTextColor(...COLORS.muted);
  doc.setFont("helvetica", "normal");
  doc.text("Commercial Offer / Estimate", pw - M, headerTop + 15.5, { align: "right" });

  y = headerTop + 22;

  // Company address / contact line
  doc.setFontSize(6.8);
  doc.setTextColor(...COLORS.muted);
  doc.setFont("helvetica", "normal");
  const addrFlat = `${COMPANY.address.replace(/\n/g, ", ")}, ${COMPANY.city}, ${COMPANY.state} - ${COMPANY.pincode}`;
  const addrLines = doc.splitTextToSize(addrFlat, CW) as string[];
  addrLines.forEach((l) => { doc.text(l, M, y); y += 3.4; });
  y += 2;
  doc.setTextColor(...COLORS.secondary);
  doc.text(
    `Phone: ${COMPANY.phone}  |  Email: ${COMPANY.email}  |  GSTIN: ${COMPANY.gstin}  |  PAN: ${COMPANY.pan}`,
    M, y
  );
  y += 4;

  doc.setDrawColor(...COLORS.accent);
  doc.setLineWidth(0.5);
  doc.line(M, y, pw - M, y);
  y += 4;

  // ==================== 2. META STRIP ====================
  const metaPairs: [string, string][] = [
    ["QUOTATION NO.", q.quotation_number],
    ["DATE", fmtDate(q.quotation_date)],
    ["VALID UNTIL", fmtDate(q.valid_until)],
    ["REFERENCE", q.reference_number || "-"],
  ];
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
    const vLines = doc.splitTextToSize(value || "-", metaColW - 10) as string[];
    doc.text(vLines[0], x, y + 10.5);
    if (i > 0) {
      doc.setDrawColor(...COLORS.border);
      doc.setLineWidth(0.2);
      doc.line(M + metaColW * i, y + 2.5, M + metaColW * i, y + metaH - 2.5);
    }
  });
  y += metaH + 6;

  // ==================== 3. FROM / TO BOXES ====================
  const boxW = (CW - 8) / 2;
  const boxPad = 5;
  const lineH = 3.8;
  const titleBarH = 8;

  const fromLines = [
    COMPANY.fullName,
    ...COMPANY.address.split("\n"),
    `${COMPANY.city}, ${COMPANY.state} - ${COMPANY.pincode}`,
    `Phone: ${COMPANY.phone}`,
    `Email: ${COMPANY.email}`,
    `GSTIN: ${COMPANY.gstin}`,
    `PAN: ${COMPANY.pan}`,
  ];

  const toName = (q.company_name || q.customer_name || "Customer").toUpperCase();
  const toLines: string[] = [toName];
  if (q.company_name && q.customer_name && q.company_name !== q.customer_name)
    toLines.push(`Attn: ${q.customer_name}`);
  if (q.contact_person) toLines.push(`Contact: ${q.contact_person}`);
  if (q.mobile) toLines.push(`Phone: ${q.mobile}`);
  if (q.email) toLines.push(`Email: ${q.email}`);
  if (q.billing_address) toLines.push(...q.billing_address.split("\n"));
  if (q.gst_number) toLines.push(`GSTIN: ${q.gst_number}`);

  const wrap = (lines: string[]) => {
    doc.setFontSize(6.5);
    return lines.map((l) => doc.splitTextToSize(l, boxW - boxPad * 2) as string[]);
  };
  const wFrom = wrap(fromLines);
  const wTo = wrap(toLines);
  const countH = (wl: string[][]) => {
    let h = titleBarH + boxPad;
    wl.forEach((w, idx) => {
      h += idx === 0 ? 5.5 : lineH;
      if (w.length > 1) h += (w.length - 1) * lineH;
    });
    return h + boxPad;
  };
  const boxH = Math.max(countH(wFrom), countH(wTo));

  const drawBox = (
    x: number, title: string,
    titleBg: [number, number, number], titleFg: [number, number, number],
    originals: string[], wrapped: string[][]
  ) => {
    doc.setFillColor(...COLORS.white);
    doc.setDrawColor(...COLORS.border);
    doc.setLineWidth(0.3);
    doc.roundedRect(x, y, boxW, boxH, 2, 2, "FD");
    doc.setFillColor(...titleBg);
    doc.roundedRect(x, y, boxW, titleBarH, 2, 2, "F");
    doc.rect(x, y + 4, boxW, titleBarH - 4, "F");
    doc.setFontSize(7);
    doc.setTextColor(...titleFg);
    doc.setFont("helvetica", "bold");
    doc.text(title, x + boxPad, y + 5.5);

    let ly = y + titleBarH + boxPad + 1;
    wrapped.forEach((w, idx) => {
      const orig = originals[idx] || "";
      if (idx === 0) {
        doc.setFontSize(7.5);
        doc.setTextColor(...COLORS.primary);
        doc.setFont("helvetica", "bold");
      } else if (/^(GSTIN|PAN):/.test(orig)) {
        doc.setFontSize(6.5);
        doc.setTextColor(...COLORS.accent);
        doc.setFont("helvetica", "bold");
      } else if (/^(Email|Phone|Contact|Attn):/.test(orig)) {
        doc.setFontSize(6.5);
        doc.setTextColor(...COLORS.secondary);
        doc.setFont("helvetica", "normal");
      } else {
        doc.setFontSize(6.5);
        doc.setTextColor(...COLORS.secondary);
        doc.setFont("helvetica", "normal");
      }
      w.forEach((seg, si) => {
        doc.text(seg, x + boxPad, ly);
        if (si < w.length - 1) ly += lineH;
      });
      ly += idx === 0 ? 5.5 : lineH;
    });
  };
  drawBox(M, "FROM", COLORS.primary, COLORS.white, fromLines, wFrom);
  drawBox(M + boxW + 8, "QUOTATION TO", COLORS.accent, COLORS.primary, toLines, wTo);
  y += boxH + 6;

  // ==================== 4. SUBJECT ====================
  if (q.subject) {
    checkBreak(14);
    doc.setFillColor(...COLORS.light);
    doc.setDrawColor(...COLORS.border);
    doc.setLineWidth(0.2);
    const sLines = doc.splitTextToSize(q.subject, CW - 30) as string[];
    const sh = Math.max(10, 6 + sLines.length * 3.8);
    doc.roundedRect(M, y, CW, sh, 1.5, 1.5, "FD");
    doc.setFont("helvetica", "bold");
    doc.setFontSize(7);
    doc.setTextColor(...COLORS.muted);
    doc.text("SUBJECT", M + 4, y + 5);
    doc.setFont("helvetica", "normal");
    doc.setFontSize(8);
    doc.setTextColor(...COLORS.primary);
    doc.text(sLines, M + 26, y + 5);
    y += sh + 5;
  }

  // ==================== 5. ITEMS TABLE ====================
  checkBreak(24);
  const cols = { sno: 8, item: 62, hsn: 16, qty: 14, rate: 24, gstPct: 12, gstAmt: 22, total: 24 };
  const tableW = Object.values(cols).reduce((a, b) => a + b, 0);
  const tableX = M + (CW - tableW) / 2;

  const drawTableHeader = (yy: number) => {
    doc.setFillColor(...COLORS.tableHeader);
    doc.rect(tableX, yy, tableW, 9, "F");
    doc.setFontSize(6.5);
    doc.setTextColor(...COLORS.white);
    doc.setFont("helvetica", "bold");
    let cx = tableX;
    const hdrY = yy + 6;
    const hdr = (label: string, w: number, align: "left" | "right" | "center" = "left") => {
      if (align === "right") doc.text(label, cx + w - 3, hdrY, { align: "right" });
      else if (align === "center") doc.text(label, cx + w / 2, hdrY, { align: "center" });
      else doc.text(label, cx + 3, hdrY);
      cx += w;
    };
    hdr("#", cols.sno, "center");
    hdr("Product / Description", cols.item);
    hdr("HSN", cols.hsn, "center");
    hdr("Qty", cols.qty, "center");
    hdr("Rate (Rs.)", cols.rate, "right");
    hdr("GST %", cols.gstPct, "center");
    hdr("GST Amt", cols.gstAmt, "right");
    hdr("Amount (Rs.)", cols.total, "right");
    return yy + 9;
  };
  y = drawTableHeader(y);

  q.items.forEach((it, idx) => {
    const gstPct = Number(it.gst) || 0;
    const qty = Number(it.quantity) || 0;
    const rate = Number(it.rate) || 0;
    const disc = Number(it.discount) || 0;
    const taxable = Math.max(0, qty * rate - disc);
    const gstAmt = +(taxable * gstPct / 100).toFixed(2);

    doc.setFontSize(6.5);
    const nameLines = doc.splitTextToSize(it.product_name || "Item", cols.item - 6) as string[];
    const descLines = it.description
      ? (doc.splitTextToSize(it.description, cols.item - 6) as string[])
      : [];
    const rowH = Math.max(10, 4 + nameLines.length * 3.5 + descLines.length * 3 + 2);

    if (y + rowH > safeZone) {
      doc.addPage();
      y = M;
      y = drawTableHeader(y);
    }

    doc.setFillColor(...(idx % 2 === 0 ? COLORS.white : COLORS.tableAlt));
    doc.rect(tableX, y, tableW, rowH, "F");
    doc.setDrawColor(...COLORS.border);
    doc.setLineWidth(0.08);
    doc.line(tableX, y + rowH, tableX + tableW, y + rowH);

    let cx = tableX;
    const midY = y + rowH / 2 + 1;

    // #
    doc.setFontSize(6);
    doc.setTextColor(...COLORS.secondary);
    doc.setFont("helvetica", "normal");
    doc.text(String(idx + 1), cx + cols.sno / 2, midY, { align: "center" });
    cx += cols.sno;

    // Product name + description
    doc.setFont("helvetica", "bold");
    doc.setFontSize(6.5);
    doc.setTextColor(...COLORS.primary);
    let ny = y + 4;
    nameLines.forEach((l) => { doc.text(l, cx + 3, ny); ny += 3.5; });
    if (descLines.length) {
      doc.setFont("helvetica", "normal");
      doc.setFontSize(5.8);
      doc.setTextColor(...COLORS.muted);
      descLines.forEach((l) => { doc.text(l, cx + 3, ny); ny += 3; });
    }
    cx += cols.item;

    doc.setFont("helvetica", "normal");
    doc.setFontSize(6);
    doc.setTextColor(...COLORS.secondary);
    doc.text(it.hsn || "-", cx + cols.hsn / 2, midY, { align: "center" });
    cx += cols.hsn;

    doc.text(`${qty} ${it.unit || ""}`.trim(), cx + cols.qty / 2, midY, { align: "center" });
    cx += cols.qty;

    doc.text(fmt(rate), cx + cols.rate - 3, midY, { align: "right" });
    cx += cols.rate;

    doc.setTextColor(...COLORS.accent);
    doc.setFont("helvetica", "bold");
    doc.text(`${gstPct}%`, cx + cols.gstPct / 2, midY, { align: "center" });
    cx += cols.gstPct;

    doc.setFont("helvetica", "normal");
    doc.setTextColor(...COLORS.secondary);
    doc.text(fmt(gstAmt), cx + cols.gstAmt - 3, midY, { align: "right" });
    cx += cols.gstAmt;

    doc.setFont("helvetica", "bold");
    doc.setTextColor(...COLORS.primary);
    doc.text(fmt(it.total), cx + cols.total - 3, midY, { align: "right" });

    y += rowH;
  });

  doc.setDrawColor(...COLORS.primary);
  doc.setLineWidth(0.5);
  doc.line(tableX, y, tableX + tableW, y);
  y += 6;

  // ==================== 6. AMOUNT IN WORDS ====================
  checkBreak(18);
  const wBoxH = 14;
  doc.setFillColor(...COLORS.light);
  doc.setDrawColor(...COLORS.border);
  doc.setLineWidth(0.15);
  doc.roundedRect(M, y, CW, wBoxH, 1, 1, "FD");
  doc.setFontSize(6);
  doc.setTextColor(...COLORS.muted);
  doc.setFont("helvetica", "normal");
  doc.text("Amount in Words:", M + 5, y + 5);
  doc.setFontSize(7);
  doc.setTextColor(...COLORS.primary);
  doc.setFont("helvetica", "bold");
  const wt = numberToWords(q.grand_total);
  const wLines = doc.splitTextToSize(wt, CW - 10) as string[];
  wLines.forEach((l, i) => doc.text(l, M + 5, y + 10 + i * 3.5));
  y += wBoxH + 4;

  // ==================== 7. TAX SUMMARY (LEFT) + TOTALS BOX (RIGHT) ====================
  const sumRightW = CW * 0.4;
  const sumLeftW = CW - sumRightW - 10;

  const taxLines = q.is_igst ? 1 : 2;
  const taxBoxH = 28 + taxLines * 5;

  const bankRows: [string, string][] = [
    ["Account Name", COMPANY.bank.accountName],
    ["Account Number", COMPANY.bank.accountNumber],
    ["Bank Name", COMPANY.bank.bankName],
    ["Branch", COMPANY.bank.branch],
    ["IFSC Code", COMPANY.bank.ifsc],
    ["Account Type", COMPANY.bank.accountType],
  ];
  const bankBlockH = 6 + 6 + bankRows.length * 3.2;

  const rightBoxRows =
    2 + // subtotal, discount
    1 + // taxable
    taxLines +
    (q.round_off ? 1 : 0);
  const rightBoxH = 10 + rightBoxRows * 5 + 6 + 12 + 6;

  let leftY = y;
  let rightY = y;
  let currentPage = doc.getNumberOfPages();
  const ensurePage = (target: number, h: number): number => {
    if (target + h > safeZone) {
      doc.addPage();
      currentPage = doc.getNumberOfPages();
      leftY = M;
      rightY = M;
      return M;
    }
    doc.setPage(currentPage);
    return target;
  };
  const renderLeft = (h: number, fn: (sy: number) => void) => {
    leftY = ensurePage(leftY, h); fn(leftY); leftY += h + 6;
  };
  const renderRight = (h: number, fn: (sy: number) => void) => {
    rightY = ensurePage(rightY, h); fn(rightY); rightY += h + 6;
  };

  // TAX SUMMARY
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
    const lx = M + 5;
    const vx = M + sumLeftW - 5;
    const row = (l: string, v: string) => {
      doc.setTextColor(...COLORS.muted);
      doc.setFont("helvetica", "normal");
      doc.text(l, lx, gy);
      doc.setTextColor(...COLORS.primary);
      doc.setFont("helvetica", "bold");
      doc.text(v, vx, gy, { align: "right" });
      gy += 4.5;
    };
    row("Supply Type", q.is_igst ? "Inter-State" : "Intra-State");
    row("Place of Supply", COMPANY.state);
    doc.setDrawColor(...COLORS.border);
    doc.line(lx, gy, vx, gy); gy += 3;
    if (q.is_igst) row("IGST", fmt(q.igst));
    else {
      row("CGST", fmt(q.cgst));
      row("SGST", fmt(q.sgst));
    }
    doc.setDrawColor(...COLORS.accent);
    doc.setLineWidth(0.5);
    doc.line(lx, gy, vx, gy); gy += 3;
    doc.setFontSize(7);
    doc.setTextColor(...COLORS.primary);
    doc.setFont("helvetica", "bold");
    doc.text("Total Tax", lx, gy);
    doc.setTextColor(...COLORS.accent);
    doc.text(fmt(q.cgst + q.sgst + q.igst), vx, gy, { align: "right" });
  });

  // TOTALS BLACK BOX
  renderRight(rightBoxH, (startY) => {
    const rx = M + sumLeftW + 10;
    doc.setFillColor(45, 45, 45);
    doc.roundedRect(rx, startY, sumRightW, rightBoxH, 2, 2, "F");
    const lx = rx + 7;
    const vx = rx + sumRightW - 7;

    doc.setFontSize(7);
    doc.setTextColor(180, 180, 180);
    doc.setFont("helvetica", "bold");
    doc.text("SUMMARY", lx, startY + 6);

    let ty = startY + 11;
    doc.setFontSize(7);
    doc.setTextColor(200, 200, 200);
    doc.setFont("helvetica", "normal");
    const row = (l: string, v: string) => {
      doc.text(l, lx, ty);
      doc.text(v, vx, ty, { align: "right" });
      ty += 5;
    };
    row("Subtotal", fmt(q.subtotal));
    row("Discount", `- ${fmt(q.discount)}`);
    row("Taxable Amount", fmt(q.taxable_amount));
    if (q.is_igst) row("IGST", fmt(q.igst));
    else { row("CGST", fmt(q.cgst)); row("SGST", fmt(q.sgst)); }
    if (q.round_off) row("Round Off", fmt(q.round_off));

    const barH = 12;
    const barY = ty + 3;
    doc.setFillColor(...COLORS.accent);
    doc.roundedRect(rx + 4, barY, sumRightW - 8, barH, 2, 2, "F");
    doc.setFontSize(8);
    doc.setTextColor(...COLORS.primary);
    doc.setFont("helvetica", "bold");
    doc.text("GRAND TOTAL", lx + 1, barY + barH / 2 + 1.5);
    doc.setFontSize(10);
    doc.text(fmt(q.grand_total), vx - 1, barY + barH / 2 + 1.5, { align: "right" });
  });

  // BANK DETAILS (LEFT)
  renderLeft(bankBlockH, (startY) => {
    doc.setDrawColor(...COLORS.border);
    doc.setLineWidth(0.2);
    doc.line(M, startY - 3, M + sumLeftW, startY - 3);
    doc.setFontSize(7.5);
    doc.setTextColor(...COLORS.primary);
    doc.setFont("helvetica", "bold");
    doc.text("Bank Details", M, startY + 6);
    let by = startY + 11.2;
    bankRows.forEach(([l, v]) => {
      doc.setFontSize(6.5);
      doc.setTextColor(...COLORS.muted);
      doc.setFont("helvetica", "normal");
      doc.text(l, M, by);
      doc.setTextColor(...COLORS.primary);
      doc.setFont("helvetica", "bold");
      doc.text(v, M + sumLeftW, by, { align: "right" });
      by += 3.2;
    });
  });

  // SIGNATURE (RIGHT)
  const sigH = 50;
  renderRight(sigH, (startY) => {
    const rx = M + sumLeftW + 10;
    const cx = rx + sumRightW / 2;
    let sy = startY + 5;
    if (signature) {
      try {
        const p = doc.getImageProperties(signature);
        const iw = 33;
        const ih = (p.height / p.width) * iw;
        doc.addImage(signature, "PNG", cx - iw / 2, sy, iw, ih);
        sy += ih;
      } catch {
        doc.addImage(signature, "PNG", cx - 16.5, sy, 33, 0);
        sy += 20;
      }
    } else {
      sy += 18;
    }
    sy += 4;
    doc.setDrawColor(...COLORS.border);
    doc.setLineWidth(0.3);
    doc.line(cx - 25, sy, cx + 25, sy);
    sy += 4;
    doc.setFontSize(7);
    doc.setTextColor(85, 85, 85);
    doc.setFont("helvetica", "bold");
    doc.text(`For ${COMPANY.fullName}`, cx, sy, { align: "center" });
    sy += 4;
    doc.setFont("helvetica", "normal");
    doc.setTextColor(...COLORS.muted);
    doc.text("Authorized Signatory", cx, sy, { align: "center" });
    if (q.prepared_by) {
      sy += 3.5;
      doc.text(`Prepared by: ${q.prepared_by}`, cx, sy, { align: "center" });
    }
  });

  y = Math.max(leftY, rightY);

  // ==================== 8. COMMERCIAL TERMS ====================
  const commercial: [string, string | null | undefined][] = [
    ["Delivery Time", q.delivery_time],
    ["Installation", q.installation],
    ["Training", q.training],
    ["Warranty", q.warranty],
    ["Payment Terms", q.payment_terms],
    ["Dispatch From", q.dispatch_location],
  ].filter(([, v]) => v && String(v).trim()) as [string, string][];

  if (commercial.length) {
    const rowsPerCol = Math.ceil(commercial.length / 2);
    const colW = (CW - 6) / 2;
    const rowH = 9;
    const blockH = 10 + rowsPerCol * rowH;
    checkBreak(blockH + 4);

    // Section title bar
    doc.setFillColor(...COLORS.primary);
    doc.rect(M, y, CW, 6, "F");
    doc.setFontSize(7.5);
    doc.setTextColor(...COLORS.white);
    doc.setFont("helvetica", "bold");
    doc.text("COMMERCIAL TERMS", M + 3, y + 4.2);
    y += 8;

    commercial.forEach(([label, value], i) => {
      const col = i % 2;
      const row = Math.floor(i / 2);
      const cx = M + col * (colW + 6);
      const cy = y + row * rowH;
      doc.setFillColor(...(row % 2 === 0 ? COLORS.light : COLORS.white));
      doc.setDrawColor(...COLORS.border);
      doc.setLineWidth(0.15);
      doc.roundedRect(cx, cy, colW, rowH - 1, 1, 1, "FD");
      doc.setFontSize(6);
      doc.setTextColor(...COLORS.muted);
      doc.setFont("helvetica", "bold");
      doc.text(label.toUpperCase(), cx + 3, cy + 3);
      doc.setFontSize(7);
      doc.setTextColor(...COLORS.primary);
      doc.setFont("helvetica", "normal");
      const vLines = doc.splitTextToSize(String(value), colW - 6) as string[];
      doc.text(vLines[0], cx + 3, cy + 6.5);
    });
    y += rowsPerCol * rowH + 2;
  }

  // ==================== 9. LONG SECTIONS: SCOPE / EXCLUSIONS / NOTES ====================
  const longSections: [string, string | null | undefined][] = [
    ["SCOPE OF SUPPLY", q.scope_of_supply],
    ["EXCLUSIONS", q.exclusions],
    ["NOTES", q.notes],
  ].filter(([, v]) => v && String(v).trim()) as [string, string][];

  longSections.forEach(([title, body]) => {
    doc.setFontSize(6.5);
    const lines = doc.splitTextToSize(String(body), CW - 6) as string[];
    checkBreak(10 + lines.length * 3.4);
    doc.setFillColor(...COLORS.primary);
    doc.rect(M, y, CW, 6, "F");
    doc.setFontSize(7.5);
    doc.setTextColor(...COLORS.white);
    doc.setFont("helvetica", "bold");
    doc.text(title, M + 3, y + 4.2);
    y += 8;
    doc.setFontSize(6.5);
    doc.setTextColor(...COLORS.secondary);
    doc.setFont("helvetica", "normal");
    lines.forEach((l) => { doc.text(l, M + 3, y); y += 3.4; });
    y += 3;
  });

  // ==================== 10. TERMS & CONDITIONS ====================
  const tcBody = (q.terms_conditions && q.terms_conditions.trim())
    ? q.terms_conditions.split(/\r?\n/).filter(Boolean)
    : COMPANY.defaultTerms;
  doc.setFontSize(5.8);
  const tcLines: string[] = [];
  tcBody.forEach((t) => {
    const w = doc.splitTextToSize(t, CW - 6) as string[];
    tcLines.push(...w);
  });
  const tcH = 8 + tcLines.length * 3.2 + 3;
  checkBreak(tcH);
  doc.setFillColor(...COLORS.primary);
  doc.rect(M, y, CW, 6, "F");
  doc.setFontSize(7.5);
  doc.setTextColor(...COLORS.white);
  doc.setFont("helvetica", "bold");
  doc.text("TERMS & CONDITIONS", M + 3, y + 4.2);
  y += 8;
  doc.setFontSize(5.8);
  doc.setTextColor(...COLORS.muted);
  doc.setFont("helvetica", "normal");
  tcLines.forEach((l) => { doc.text(l, M + 3, y); y += 3.2; });
  y += 3;

  // ==================== 11. THANK YOU STRIP ====================
  checkBreak(14);
  doc.setFillColor(...COLORS.accent);
  doc.roundedRect(M, y, CW, 10, 1.5, 1.5, "F");
  doc.setFontSize(8);
  doc.setTextColor(...COLORS.primary);
  doc.setFont("helvetica", "bold");
  doc.text(
    "Thank you for the opportunity. We look forward to serving you.",
    pw / 2, y + 6.5, { align: "center" }
  );
  y += 14;

  // ==================== FOOTERS ====================
  const total = doc.getNumberOfPages();
  for (let i = 1; i <= total; i++) {
    doc.setPage(i);
    addFooter(i, total);
  }
}

// ==================== HOOK ====================
export function useQuotationPdf() {
  const [isBusy, setIsBusy] = useState(false);

  const build = useCallback(async (q: Quotation) => {
    const doc = new jsPDF({ unit: "mm", format: "a4", orientation: "portrait" });
    await renderQuotationPdf(doc, q);
    return doc;
  }, []);

  const download = useCallback(async (q: Quotation) => {
    setIsBusy(true);
    try {
      const doc = await build(q);
      doc.save(`${q.quotation_number}.pdf`);
      toast.success("Quotation downloaded");
    } catch (e: any) {
      console.error(e);
      toast.error(e?.message || "Failed to generate PDF");
    } finally {
      setIsBusy(false);
    }
  }, [build]);

  const preview = useCallback(async (q: Quotation) => {
    setIsBusy(true);
    try {
      const doc = await build(q);
      window.open(doc.output("bloburl"), "_blank");
    } catch (e: any) {
      toast.error(e?.message || "Failed to preview PDF");
    } finally {
      setIsBusy(false);
    }
  }, [build]);

  return { download, preview, isBusy };
}
