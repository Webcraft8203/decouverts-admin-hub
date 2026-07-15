import { useCallback, useState } from "react";
import { jsPDF } from "jspdf";
import { toast } from "sonner";

export interface QuotationItem {
  product_name: string;
  description?: string | null;
  quantity: number;
  unit?: string | null;
  rate: number;
  discount?: number | null;
  gst?: number | null;
  total: number;
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

const COLORS = {
  primary: [28, 28, 28] as [number, number, number],
  accent: [212, 175, 55] as [number, number, number],
  muted: [130, 130, 130] as [number, number, number],
  light: [245, 245, 245] as [number, number, number],
  border: [218, 218, 218] as [number, number, number],
  white: [255, 255, 255] as [number, number, number],
  dark: [38, 38, 38] as [number, number, number],
};

const COMPANY = {
  name: "DECOUVERTES",
  fullName: "DECOUVERTES FUTURE TECH PRIVATE LIMITED",
  tagline: "Discovering Future Technologies",
  address: "A-414, Gera's Imperium Gateway, Near Nashik Phata Flyover, Opp. Bhosari Metro Station, Kasarwadi, Pimpri-Chinchwad",
  city: "Pune",
  state: "Maharashtra",
  pincode: "411034",
  phone: "+91 9561103435",
  email: "hello@decouvertes.in",
  gstin: "27AAKCD1492N1Z4",
  website: "www.decouvertes.in",
};

const PAGE = { width: 210, height: 297, margin: 14 };
const fmt = (n: number) =>
  `Rs. ${Number(n || 0).toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
const fmtDate = (d?: string | null) =>
  d ? new Date(d).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" }) : "-";

function drawHeader(doc: jsPDF) {
  doc.setFillColor(...COLORS.primary);
  doc.rect(0, 0, PAGE.width, 32, "F");
  doc.setFillColor(...COLORS.accent);
  doc.rect(0, 32, PAGE.width, 1.2, "F");

  doc.setTextColor(...COLORS.white);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(20);
  doc.text(COMPANY.name, PAGE.margin, 14);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(8);
  doc.setTextColor(212, 175, 55);
  doc.text(COMPANY.tagline, PAGE.margin, 19);
  doc.setTextColor(...COLORS.white);
  doc.setFontSize(7);
  doc.text(COMPANY.fullName, PAGE.margin, 24);
  doc.text(`GSTIN: ${COMPANY.gstin}  |  ${COMPANY.email}  |  ${COMPANY.phone}`, PAGE.margin, 28);

  doc.setFont("helvetica", "bold");
  doc.setFontSize(18);
  doc.text("QUOTATION", PAGE.width - PAGE.margin, 16, { align: "right" });
  doc.setFont("helvetica", "normal");
  doc.setFontSize(8);
  doc.text(COMPANY.website, PAGE.width - PAGE.margin, 22, { align: "right" });
}

function drawFooter(doc: jsPDF, pageNum: number, total: number) {
  const y = PAGE.height - 10;
  doc.setDrawColor(...COLORS.border);
  doc.setLineWidth(0.2);
  doc.line(PAGE.margin, y - 4, PAGE.width - PAGE.margin, y - 4);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(7);
  doc.setTextColor(...COLORS.muted);
  doc.text(`${COMPANY.fullName}  •  ${COMPANY.city}, ${COMPANY.state}`, PAGE.margin, y);
  doc.text(`Page ${pageNum} of ${total}`, PAGE.width - PAGE.margin, y, { align: "right" });
}

function ensureSpace(doc: jsPDF, y: number, needed: number): number {
  if (y + needed > PAGE.height - 18) {
    doc.addPage();
    drawHeader(doc);
    return 40;
  }
  return y;
}

function drawSectionTitle(doc: jsPDF, y: number, title: string): number {
  doc.setFillColor(...COLORS.dark);
  doc.rect(PAGE.margin, y, PAGE.width - PAGE.margin * 2, 6, "F");
  doc.setTextColor(...COLORS.white);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(9);
  doc.text(title, PAGE.margin + 3, y + 4.2);
  return y + 8;
}

export function generateQuotationPdf(q: Quotation): jsPDF {
  const doc = new jsPDF({ unit: "mm", format: "a4" });
  drawHeader(doc);
  let y = 40;

  // Meta strip
  doc.setFillColor(...COLORS.light);
  doc.rect(PAGE.margin, y, PAGE.width - PAGE.margin * 2, 18, "F");
  doc.setDrawColor(...COLORS.border);
  doc.rect(PAGE.margin, y, PAGE.width - PAGE.margin * 2, 18);

  doc.setFont("helvetica", "bold");
  doc.setFontSize(8);
  doc.setTextColor(...COLORS.muted);
  doc.text("QUOTATION NO.", PAGE.margin + 3, y + 5);
  doc.text("DATE", PAGE.margin + 55, y + 5);
  doc.text("VALID UNTIL", PAGE.margin + 95, y + 5);
  doc.text("REFERENCE", PAGE.margin + 135, y + 5);

  doc.setFont("helvetica", "bold");
  doc.setFontSize(10);
  doc.setTextColor(...COLORS.primary);
  doc.text(q.quotation_number, PAGE.margin + 3, y + 12);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(9);
  doc.text(fmtDate(q.quotation_date), PAGE.margin + 55, y + 12);
  doc.text(fmtDate(q.valid_until), PAGE.margin + 95, y + 12);
  doc.text(q.reference_number || "-", PAGE.margin + 135, y + 12);
  y += 22;

  // Bill To / Ship To
  const boxW = (PAGE.width - PAGE.margin * 2 - 4) / 2;
  const boxH = 38;
  doc.setDrawColor(...COLORS.border);
  doc.rect(PAGE.margin, y, boxW, boxH);
  doc.rect(PAGE.margin + boxW + 4, y, boxW, boxH);

  doc.setFillColor(...COLORS.dark);
  doc.rect(PAGE.margin, y, boxW, 5, "F");
  doc.rect(PAGE.margin + boxW + 4, y, boxW, 5, "F");
  doc.setTextColor(...COLORS.white);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(8);
  doc.text("BILL TO", PAGE.margin + 2, y + 3.7);
  doc.text("SHIP TO", PAGE.margin + boxW + 6, y + 3.7);

  const renderParty = (x: number, addr: string | null | undefined) => {
    doc.setTextColor(...COLORS.primary);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(9);
    doc.text(q.company_name || q.customer_name, x, y + 10);
    doc.setFont("helvetica", "normal");
    doc.setFontSize(8);
    let yy = y + 14;
    if (q.contact_person) { doc.text(`Attn: ${q.contact_person}`, x, yy); yy += 4; }
    const addrLines = doc.splitTextToSize(addr || "-", boxW - 4);
    doc.text(addrLines, x, yy);
    yy += addrLines.length * 3.5;
    if (q.mobile) { doc.text(`Phone: ${q.mobile}`, x, yy); yy += 3.5; }
    if (q.email) { doc.text(`Email: ${q.email}`, x, yy); yy += 3.5; }
    if (q.gst_number) { doc.text(`GSTIN: ${q.gst_number}`, x, yy); }
  };
  renderParty(PAGE.margin + 2, q.billing_address);
  renderParty(PAGE.margin + boxW + 6, q.shipping_address || q.billing_address);
  y += boxH + 5;

  if (q.subject) {
    y = ensureSpace(doc, y, 12);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(9);
    doc.setTextColor(...COLORS.primary);
    doc.text("Subject:", PAGE.margin, y);
    doc.setFont("helvetica", "normal");
    const sub = doc.splitTextToSize(q.subject, PAGE.width - PAGE.margin * 2 - 18);
    doc.text(sub, PAGE.margin + 18, y);
    y += sub.length * 4 + 4;
  }

  // Items table
  y = ensureSpace(doc, y, 20);
  y = drawSectionTitle(doc, y, "SCOPE OF SUPPLY");

  const cols = [
    { key: "sr", label: "#", w: 8, align: "center" as const },
    { key: "desc", label: "Product / Description", w: 78, align: "left" as const },
    { key: "qty", label: "Qty", w: 16, align: "center" as const },
    { key: "rate", label: "Rate", w: 24, align: "right" as const },
    { key: "gst", label: "GST%", w: 14, align: "center" as const },
    { key: "total", label: "Amount", w: 42, align: "right" as const },
  ];
  const tableW = cols.reduce((s, c) => s + c.w, 0);
  const startX = PAGE.margin + (PAGE.width - PAGE.margin * 2 - tableW) / 2;

  const drawTableHeader = (yy: number) => {
    doc.setFillColor(...COLORS.primary);
    doc.rect(startX, yy, tableW, 7, "F");
    doc.setTextColor(...COLORS.white);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(8);
    let x = startX;
    for (const c of cols) {
      const tx = c.align === "center" ? x + c.w / 2 : c.align === "right" ? x + c.w - 2 : x + 2;
      doc.text(c.label, tx, yy + 4.7, { align: c.align });
      x += c.w;
    }
    return yy + 7;
  };
  y = drawTableHeader(y);

  q.items.forEach((it, i) => {
    const descLines = doc.splitTextToSize(
      `${it.product_name}${it.description ? `\n${it.description}` : ""}`,
      cols[1].w - 4
    );
    const rowH = Math.max(7, descLines.length * 3.6 + 3);
    y = ensureSpace(doc, y, rowH);
    if (y === 40) y = drawTableHeader(y);

    if (i % 2 === 1) {
      doc.setFillColor(250, 250, 250);
      doc.rect(startX, y, tableW, rowH, "F");
    }
    doc.setDrawColor(...COLORS.border);
    doc.rect(startX, y, tableW, rowH);

    doc.setTextColor(...COLORS.primary);
    doc.setFont("helvetica", "normal");
    doc.setFontSize(8);
    let x = startX;
    const values = [
      String(i + 1),
      "", // desc handled separately
      `${it.quantity} ${it.unit || ""}`.trim(),
      fmt(it.rate),
      String(it.gst ?? 18),
      fmt(it.total),
    ];
    cols.forEach((c, ci) => {
      if (ci === 1) {
        doc.text(descLines, x + 2, y + 4);
      } else {
        const tx = c.align === "center" ? x + c.w / 2 : c.align === "right" ? x + c.w - 2 : x + 2;
        doc.text(values[ci], tx, y + 4.5, { align: c.align });
      }
      x += c.w;
    });
    y += rowH;
  });

  y += 4;

  // Totals block
  y = ensureSpace(doc, y, 50);
  const totW = 80;
  const totX = PAGE.width - PAGE.margin - totW;
  const rows: [string, string, boolean?][] = [
    ["Subtotal", fmt(q.subtotal)],
    ["Discount", `- ${fmt(q.discount)}`],
    ["Taxable Amount", fmt(q.taxable_amount)],
  ];
  if (q.is_igst) rows.push([`IGST`, fmt(q.igst)]);
  else {
    rows.push([`CGST`, fmt(q.cgst)]);
    rows.push([`SGST`, fmt(q.sgst)]);
  }
  if (q.round_off) rows.push(["Round Off", fmt(q.round_off)]);

  rows.forEach(([l, v]) => {
    doc.setDrawColor(...COLORS.border);
    doc.line(totX, y, totX + totW, y);
    doc.setFont("helvetica", "normal");
    doc.setFontSize(9);
    doc.setTextColor(...COLORS.muted);
    doc.text(l, totX + 2, y + 4);
    doc.setTextColor(...COLORS.primary);
    doc.text(v, totX + totW - 2, y + 4, { align: "right" });
    y += 5;
  });
  doc.setFillColor(...COLORS.primary);
  doc.rect(totX, y, totW, 8, "F");
  doc.setTextColor(...COLORS.white);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(10);
  doc.text("GRAND TOTAL", totX + 2, y + 5.2);
  doc.text(fmt(q.grand_total), totX + totW - 2, y + 5.2, { align: "right" });
  y += 14;

  // Commercial terms
  const terms: [string, string | null | undefined][] = [
    ["Delivery Time", q.delivery_time],
    ["Installation", q.installation],
    ["Training", q.training],
    ["Warranty", q.warranty],
    ["Payment Terms", q.payment_terms],
    ["Dispatch From", q.dispatch_location],
  ].filter(([, v]) => v && String(v).trim()) as [string, string][];

  if (terms.length) {
    y = ensureSpace(doc, y, 12 + terms.length * 5);
    y = drawSectionTitle(doc, y, "COMMERCIAL TERMS");
    terms.forEach(([label, val]) => {
      doc.setFont("helvetica", "bold");
      doc.setFontSize(8);
      doc.setTextColor(...COLORS.muted);
      doc.text(label, PAGE.margin, y);
      doc.setFont("helvetica", "normal");
      doc.setTextColor(...COLORS.primary);
      const lines = doc.splitTextToSize(String(val), PAGE.width - PAGE.margin * 2 - 40);
      doc.text(lines, PAGE.margin + 40, y);
      y += Math.max(5, lines.length * 4);
    });
    y += 3;
  }

  const longSections: [string, string | null | undefined][] = [
    ["EXCLUSIONS", q.exclusions],
    ["TERMS & CONDITIONS", q.terms_conditions],
    ["NOTES", q.notes],
  ].filter(([, v]) => v && String(v).trim()) as [string, string][];

  longSections.forEach(([title, body]) => {
    const lines = doc.splitTextToSize(String(body), PAGE.width - PAGE.margin * 2 - 4);
    y = ensureSpace(doc, y, 10 + lines.length * 4);
    y = drawSectionTitle(doc, y, title);
    doc.setFont("helvetica", "normal");
    doc.setFontSize(8);
    doc.setTextColor(...COLORS.primary);
    doc.text(lines, PAGE.margin + 2, y);
    y += lines.length * 4 + 4;
  });

  // Signature
  y = ensureSpace(doc, y, 30);
  y += 4;
  doc.setDrawColor(...COLORS.border);
  doc.line(PAGE.width - PAGE.margin - 60, y + 14, PAGE.width - PAGE.margin, y + 14);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(8);
  doc.setTextColor(...COLORS.primary);
  doc.text(`For ${COMPANY.fullName}`, PAGE.width - PAGE.margin, y + 4, { align: "right" });
  doc.setFont("helvetica", "normal");
  doc.setTextColor(...COLORS.muted);
  doc.text("Authorised Signatory", PAGE.width - PAGE.margin, y + 18, { align: "right" });
  if (q.prepared_by) doc.text(`Prepared by: ${q.prepared_by}`, PAGE.margin, y + 18);

  const totalPages = doc.getNumberOfPages();
  for (let p = 1; p <= totalPages; p++) {
    doc.setPage(p);
    drawFooter(doc, p, totalPages);
  }
  return doc;
}

export function useQuotationPdf() {
  const [isBusy, setIsBusy] = useState(false);
  const download = useCallback(async (q: Quotation) => {
    setIsBusy(true);
    try {
      const doc = generateQuotationPdf(q);
      doc.save(`${q.quotation_number}.pdf`);
      toast.success("Quotation downloaded");
    } catch (e: any) {
      toast.error(e?.message || "Failed to generate PDF");
    } finally {
      setIsBusy(false);
    }
  }, []);
  const preview = useCallback((q: Quotation) => {
    const doc = generateQuotationPdf(q);
    window.open(doc.output("bloburl"), "_blank");
  }, []);
  return { download, preview, isBusy };
}
