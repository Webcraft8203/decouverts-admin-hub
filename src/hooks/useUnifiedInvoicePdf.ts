import { useCallback, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { jsPDF } from "jspdf";
import { toast } from "sonner";

// Professional DECOUVERTES Brand Colors
const COLORS = {
  black: [20, 20, 20] as [number, number, number],
  charcoal: [45, 45, 45] as [number, number, number],
  gold: [198, 158, 47] as [number, number, number],
  darkGray: [80, 80, 80] as [number, number, number],
  gray: [120, 120, 120] as [number, number, number],
  lightGray: [200, 200, 200] as [number, number, number],
  background: [250, 250, 250] as [number, number, number],
  white: [255, 255, 255] as [number, number, number],
  green: [39, 174, 96] as [number, number, number],
  red: [192, 57, 43] as [number, number, number],
};

const COMPANY = {
  name: "DECOUVERTES",
  tagline: "Precision Engineering & Innovation",
  address: "Innovation Hub, Tech Park",
  city: "Pune",
  state: "Maharashtra",
  pincode: "411001",
  phone: "+91 98765 43210",
  email: "info@decouvertes.com",
  gstin: "27XXXXX1234X1ZX",
  terms: [
    "1. Goods once sold will only be taken back or exchanged as per company policy.",
    "2. Payment is due within 30 days of invoice date.",
    "3. Warranty as per product terms and conditions.",
  ],
};

const PAGE = {
  width: 210,
  height: 297,
  margin: 12,
  footerHeight: 20,
};

const formatCurrency = (amount: number): string => {
  return `₹${Number(amount || 0).toLocaleString("en-IN", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
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
  order?: {
    order_number: string;
    payment_status: string;
    payment_id: string | null;
    status: string;
  } | null;
}

interface NormalizedItem {
  sku: string;
  description: string;
  hsn: string;
  qty: number;
  rate: number;
  taxableValue: number;
  gstRate: number;
  cgst: number;
  sgst: number;
  igst: number;
  total: number;
}

function normalizeItem(item: any): NormalizedItem {
  const qty = Number(item.quantity) || 1;
  const rate = Number(item.price) || Number(item.rate) || Number(item.product_price) || 0;
  const taxableValue = Number(item.taxable_value) || qty * rate;
  const gstRate = Number(item.gst_rate) || 18;
  
  return {
    sku: item.sku || "N/A",
    description: item.description || item.name || item.product_name || "Item",
    hsn: item.hsn_code || item.hsn || "8471",
    qty,
    rate,
    taxableValue,
    gstRate,
    cgst: Number(item.cgst_amount) || 0,
    sgst: Number(item.sgst_amount) || 0,
    igst: Number(item.igst_amount) || 0,
    total: Number(item.total) || taxableValue,
  };
}

export function useUnifiedInvoicePdf() {
  const [isGenerating, setIsGenerating] = useState(false);

  const generateInvoicePdf = useCallback(async (invoice: Invoice): Promise<Blob> => {
    const doc = new jsPDF({ orientation: "portrait", unit: "mm", format: "a4" });
    const contentWidth = PAGE.width - 2 * PAGE.margin;
    let y = PAGE.margin;
    let currentPage = 1;
    let totalPages = 1;

    const isFinal = invoice.is_final || invoice.invoice_type === "final";
    const isIgst = invoice.is_igst || (invoice.buyer_state?.toLowerCase() !== COMPANY.state.toLowerCase());
    const items = (invoice.items || []).map(normalizeItem);
    
    let totalCgst = invoice.cgst_amount || 0;
    let totalSgst = invoice.sgst_amount || 0;
    let totalIgst = invoice.igst_amount || 0;
    if (!totalCgst && !totalSgst && !totalIgst) {
      items.forEach((item) => {
        totalCgst += item.cgst;
        totalSgst += item.sgst;
        totalIgst += item.igst;
      });
    }

    const logoBase64 = await fetchLogoAsBase64();
    const safeZone = PAGE.height - PAGE.footerHeight - 5;

    // ========== HELPER FUNCTIONS ==========
    const addFooter = (pageNum: number, total: number) => {
      const footerY = PAGE.height - 12;
      doc.setDrawColor(...COLORS.gold);
      doc.setLineWidth(0.4);
      doc.line(PAGE.margin, footerY - 4, PAGE.width - PAGE.margin, footerY - 4);
      
      doc.setFontSize(6);
      doc.setTextColor(...COLORS.gray);
      doc.setFont("helvetica", "normal");
      doc.text("This is a computer-generated invoice. No signature required.", PAGE.margin, footerY);
      doc.text(`Page ${pageNum} of ${total}`, PAGE.width - PAGE.margin, footerY, { align: "right" });
      doc.text(`Generated: ${new Date().toLocaleString("en-IN")}`, PAGE.width / 2, footerY + 4, { align: "center" });
    };

    const checkPageBreak = (neededHeight: number): boolean => {
      if (y + neededHeight > safeZone) {
        totalPages++;
        doc.addPage();
        currentPage++;
        y = PAGE.margin + 8;
        return true;
      }
      return false;
    };

    const drawText = (
      text: string,
      x: number,
      yPos: number,
      options?: { align?: "left" | "center" | "right"; maxWidth?: number }
    ) => {
      const align = options?.align || "left";
      const maxWidth = options?.maxWidth;
      
      if (maxWidth) {
        const truncated = doc.splitTextToSize(text, maxWidth)[0] || text;
        doc.text(truncated, x, yPos, { align });
      } else {
        doc.text(text, x, yPos, { align });
      }
    };

    // ========== HEADER SECTION ==========
    // Top gold accent bar
    doc.setFillColor(...COLORS.charcoal);
    doc.rect(0, 0, PAGE.width, 3, "F");
    doc.setFillColor(...COLORS.gold);
    doc.rect(0, 3, PAGE.width, 1.5, "F");

    y = 10;

    // Logo
    if (logoBase64) {
      try {
        doc.addImage(logoBase64, "PNG", PAGE.margin, y, 28, 14);
      } catch {}
    }

    // Company Name
    const companyX = PAGE.margin + (logoBase64 ? 32 : 0);
    doc.setFontSize(20);
    doc.setTextColor(...COLORS.charcoal);
    doc.setFont("helvetica", "bold");
    doc.text(COMPANY.name, companyX, y + 8);
    
    doc.setFontSize(7);
    doc.setTextColor(...COLORS.gray);
    doc.setFont("helvetica", "normal");
    doc.text(COMPANY.tagline, companyX, y + 13);

    // Invoice Type Badge (right side)
    const badgeWidth = 55;
    const badgeX = PAGE.width - PAGE.margin - badgeWidth;
    
    doc.setFillColor(...(isFinal ? COLORS.gold : COLORS.charcoal));
    doc.roundedRect(badgeX, y, badgeWidth, 9, 1.5, 1.5, "F");
    
    doc.setFontSize(10);
    doc.setTextColor(...(isFinal ? COLORS.charcoal : COLORS.white));
    doc.setFont("helvetica", "bold");
    doc.text(isFinal ? "TAX INVOICE" : "PROFORMA INVOICE", badgeX + badgeWidth / 2, y + 6.5, { align: "center" });

    // Invoice Details Box
    y += 13;
    doc.setFillColor(...COLORS.background);
    doc.setDrawColor(...COLORS.lightGray);
    doc.setLineWidth(0.3);
    doc.roundedRect(badgeX, y, badgeWidth, 22, 1.5, 1.5, "FD");

    const detailY = y + 5;
    doc.setFontSize(7);
    
    doc.setTextColor(...COLORS.gray);
    doc.setFont("helvetica", "normal");
    doc.text("Invoice No:", badgeX + 3, detailY);
    doc.setTextColor(...COLORS.charcoal);
    doc.setFont("helvetica", "bold");
    doc.text(invoice.invoice_number, badgeX + badgeWidth - 3, detailY, { align: "right" });

    doc.setTextColor(...COLORS.gray);
    doc.setFont("helvetica", "normal");
    doc.text("Date:", badgeX + 3, detailY + 5);
    doc.setTextColor(...COLORS.charcoal);
    doc.text(new Date(invoice.created_at).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" }), badgeX + badgeWidth - 3, detailY + 5, { align: "right" });

    if (invoice.order?.order_number) {
      doc.setTextColor(...COLORS.gray);
      doc.text("Order No:", badgeX + 3, detailY + 10);
      doc.setTextColor(...COLORS.charcoal);
      doc.text(invoice.order.order_number, badgeX + badgeWidth - 3, detailY + 10, { align: "right" });
    }

    // Payment Status Badge
    const paymentStatus = invoice.order?.payment_status || "paid";
    const statusColor = paymentStatus === "paid" ? COLORS.green : paymentStatus === "cod" ? COLORS.gold : COLORS.red;
    doc.setFillColor(...statusColor);
    doc.roundedRect(badgeX + 3, detailY + 13, badgeWidth - 6, 5, 1, 1, "F");
    doc.setFontSize(6);
    doc.setTextColor(...COLORS.white);
    doc.setFont("helvetica", "bold");
    doc.text(paymentStatus.toUpperCase(), badgeX + badgeWidth / 2, detailY + 16.5, { align: "center" });

    // Gold divider line
    y = 42;
    doc.setDrawColor(...COLORS.gold);
    doc.setLineWidth(0.8);
    doc.line(PAGE.margin, y, PAGE.width - PAGE.margin, y);

    y += 6;

    // ========== BILLING SECTION ==========
    const boxWidth = (contentWidth - 8) / 2;
    const boxHeight = 38;

    // FROM Box
    doc.setFillColor(...COLORS.background);
    doc.setDrawColor(...COLORS.lightGray);
    doc.setLineWidth(0.2);
    doc.roundedRect(PAGE.margin, y, boxWidth, boxHeight, 2, 2, "FD");

    // FROM Header
    doc.setFillColor(...COLORS.charcoal);
    doc.roundedRect(PAGE.margin, y, boxWidth, 7, 2, 2, "F");
    doc.rect(PAGE.margin, y + 4, boxWidth, 3, "F"); // Square off bottom corners
    
    doc.setFontSize(7);
    doc.setTextColor(...COLORS.white);
    doc.setFont("helvetica", "bold");
    doc.text("FROM", PAGE.margin + 4, y + 5);

    let fromY = y + 12;
    doc.setFontSize(9);
    doc.setTextColor(...COLORS.charcoal);
    doc.setFont("helvetica", "bold");
    doc.text(COMPANY.name, PAGE.margin + 4, fromY);
    
    fromY += 5;
    doc.setFontSize(7);
    doc.setTextColor(...COLORS.darkGray);
    doc.setFont("helvetica", "normal");
    doc.text(COMPANY.address, PAGE.margin + 4, fromY);
    fromY += 4;
    doc.text(`${COMPANY.city}, ${COMPANY.state} - ${COMPANY.pincode}`, PAGE.margin + 4, fromY);
    fromY += 4;
    doc.text(`Phone: ${COMPANY.phone}`, PAGE.margin + 4, fromY);
    fromY += 4;
    doc.setTextColor(...COLORS.gold);
    doc.setFont("helvetica", "bold");
    doc.text(`GSTIN: ${COMPANY.gstin}`, PAGE.margin + 4, fromY);

    // TO Box
    const toX = PAGE.margin + boxWidth + 8;
    doc.setFillColor(...COLORS.background);
    doc.setDrawColor(...COLORS.lightGray);
    doc.roundedRect(toX, y, boxWidth, boxHeight, 2, 2, "FD");

    // TO Header
    doc.setFillColor(...COLORS.gold);
    doc.roundedRect(toX, y, boxWidth, 7, 2, 2, "F");
    doc.rect(toX, y + 4, boxWidth, 3, "F");
    
    doc.setFontSize(7);
    doc.setTextColor(...COLORS.charcoal);
    doc.setFont("helvetica", "bold");
    doc.text("BILL TO", toX + 4, y + 5);

    let toY = y + 12;
    doc.setFontSize(9);
    doc.setTextColor(...COLORS.charcoal);
    doc.setFont("helvetica", "bold");
    drawText((invoice.client_name || "Customer").toUpperCase(), toX + 4, toY, { maxWidth: boxWidth - 8 });
    
    toY += 5;
    doc.setFontSize(7);
    doc.setTextColor(...COLORS.darkGray);
    doc.setFont("helvetica", "normal");
    
    if (invoice.client_address) {
      const addressLines = doc.splitTextToSize(invoice.client_address, boxWidth - 8);
      addressLines.slice(0, 3).forEach((line: string) => {
        doc.text(line, toX + 4, toY);
        toY += 4;
      });
    }
    
    if (invoice.buyer_gstin) {
      doc.setTextColor(...COLORS.gold);
      doc.setFont("helvetica", "bold");
      doc.text(`GSTIN: ${invoice.buyer_gstin}`, toX + 4, y + boxHeight - 4);
    }

    y += boxHeight + 8;

    // ========== ITEMS TABLE ==========
    const tableX = PAGE.margin;
    const tableW = contentWidth;
    const rowHeight = 7;
    const headerHeight = 8;

    // Column definitions - properly spaced
    const cols = {
      sno: { x: tableX, w: 8 },
      sku: { x: tableX + 8, w: 22 },
      desc: { x: tableX + 30, w: 50 },
      hsn: { x: tableX + 80, w: 16 },
      qty: { x: tableX + 96, w: 12 },
      rate: { x: tableX + 108, w: 22 },
      taxable: { x: tableX + 130, w: 22 },
      tax: { x: tableX + 152, w: 16 },
      total: { x: tableX + 168, w: 18 },
    };

    // Table Header
    doc.setFillColor(...COLORS.charcoal);
    doc.rect(tableX, y, tableW, headerHeight, "F");

    doc.setFontSize(6);
    doc.setTextColor(...COLORS.white);
    doc.setFont("helvetica", "bold");

    doc.text("#", cols.sno.x + 2, y + 5.5);
    doc.text("SKU", cols.sku.x + 1, y + 5.5);
    doc.text("DESCRIPTION", cols.desc.x + 1, y + 5.5);
    doc.text("HSN", cols.hsn.x + 1, y + 5.5);
    doc.text("QTY", cols.qty.x + 1, y + 5.5);
    doc.text("RATE", cols.rate.x + 1, y + 5.5);
    doc.text("TAXABLE", cols.taxable.x + 1, y + 5.5);
    doc.text(isIgst ? "IGST" : "GST", cols.tax.x + 1, y + 5.5);
    doc.text("TOTAL", cols.total.x + cols.total.w - 2, y + 5.5, { align: "right" });

    y += headerHeight;

    // Table Rows
    items.forEach((item, idx) => {
      checkPageBreak(rowHeight + 2);

      // Alternating row background
      doc.setFillColor(...(idx % 2 === 0 ? COLORS.white : COLORS.background));
      doc.rect(tableX, y, tableW, rowHeight, "F");

      // Row border
      doc.setDrawColor(...COLORS.lightGray);
      doc.setLineWidth(0.1);
      doc.line(tableX, y + rowHeight, tableX + tableW, y + rowHeight);

      const textY = y + 5;
      doc.setFontSize(6);
      doc.setTextColor(...COLORS.darkGray);
      doc.setFont("helvetica", "normal");

      // S.No
      doc.text(String(idx + 1), cols.sno.x + 2, textY);
      
      // SKU
      doc.setTextColor(...COLORS.gray);
      drawText(item.sku, cols.sku.x + 1, textY, { maxWidth: cols.sku.w - 2 });
      
      // Description
      doc.setTextColor(...COLORS.charcoal);
      doc.setFont("helvetica", "bold");
      drawText(item.description, cols.desc.x + 1, textY, { maxWidth: cols.desc.w - 2 });
      
      // HSN
      doc.setFont("helvetica", "normal");
      doc.setTextColor(...COLORS.darkGray);
      doc.text(item.hsn, cols.hsn.x + 1, textY);
      
      // Qty
      doc.text(String(item.qty), cols.qty.x + cols.qty.w / 2, textY, { align: "center" });
      
      // Rate
      doc.text(formatCurrency(item.rate), cols.rate.x + cols.rate.w - 2, textY, { align: "right" });
      
      // Taxable
      doc.text(formatCurrency(item.taxableValue), cols.taxable.x + cols.taxable.w - 2, textY, { align: "right" });
      
      // Tax %
      doc.setTextColor(...COLORS.gold);
      doc.setFont("helvetica", "bold");
      doc.text(`${item.gstRate}%`, cols.tax.x + cols.tax.w / 2, textY, { align: "center" });
      
      // Total
      doc.setTextColor(...COLORS.charcoal);
      doc.text(formatCurrency(item.total), cols.total.x + cols.total.w - 2, textY, { align: "right" });

      y += rowHeight;
    });

    // Table bottom border
    doc.setDrawColor(...COLORS.charcoal);
    doc.setLineWidth(0.5);
    doc.line(tableX, y, tableX + tableW, y);

    y += 10;
    checkPageBreak(55);

    // ========== SUMMARY SECTION ==========
    const summaryWidth = 75;
    const gstBoxWidth = contentWidth - summaryWidth - 10;
    const summaryHeight = isIgst ? 45 : 50;

    // GST Summary Box (Left)
    doc.setFillColor(...COLORS.background);
    doc.setDrawColor(...COLORS.lightGray);
    doc.setLineWidth(0.2);
    doc.roundedRect(PAGE.margin, y, gstBoxWidth, summaryHeight, 2, 2, "FD");

    doc.setFontSize(8);
    doc.setTextColor(...COLORS.charcoal);
    doc.setFont("helvetica", "bold");
    doc.text("TAX SUMMARY", PAGE.margin + 4, y + 7);

    let gstY = y + 13;
    doc.setFontSize(6.5);
    doc.setTextColor(...COLORS.gray);
    doc.setFont("helvetica", "normal");
    
    doc.text("Supply Type:", PAGE.margin + 4, gstY);
    doc.setTextColor(...COLORS.charcoal);
    doc.setFont("helvetica", "bold");
    doc.text(isIgst ? "Inter-State" : "Intra-State", PAGE.margin + 28, gstY);

    gstY += 5;
    doc.setTextColor(...COLORS.gray);
    doc.setFont("helvetica", "normal");
    doc.text("Place of Supply:", PAGE.margin + 4, gstY);
    doc.setTextColor(...COLORS.charcoal);
    doc.text(invoice.buyer_state || COMPANY.state, PAGE.margin + 28, gstY);

    gstY += 7;
    doc.setDrawColor(...COLORS.lightGray);
    doc.setLineWidth(0.2);
    doc.line(PAGE.margin + 4, gstY, PAGE.margin + gstBoxWidth - 4, gstY);

    gstY += 5;
    if (isIgst) {
      doc.setTextColor(...COLORS.darkGray);
      doc.setFont("helvetica", "normal");
      doc.text("IGST:", PAGE.margin + 4, gstY);
      doc.text(formatCurrency(totalIgst), PAGE.margin + gstBoxWidth - 4, gstY, { align: "right" });
    } else {
      doc.setTextColor(...COLORS.darkGray);
      doc.text("CGST:", PAGE.margin + 4, gstY);
      doc.text(formatCurrency(totalCgst), PAGE.margin + gstBoxWidth - 4, gstY, { align: "right" });
      gstY += 5;
      doc.text("SGST:", PAGE.margin + 4, gstY);
      doc.text(formatCurrency(totalSgst), PAGE.margin + gstBoxWidth - 4, gstY, { align: "right" });
    }

    gstY += 6;
    doc.setDrawColor(...COLORS.gold);
    doc.setLineWidth(0.5);
    doc.line(PAGE.margin + 4, gstY, PAGE.margin + gstBoxWidth - 4, gstY);
    
    gstY += 5;
    doc.setTextColor(...COLORS.charcoal);
    doc.setFont("helvetica", "bold");
    doc.text("Total Tax:", PAGE.margin + 4, gstY);
    doc.setTextColor(...COLORS.gold);
    doc.text(formatCurrency(totalCgst + totalSgst + totalIgst), PAGE.margin + gstBoxWidth - 4, gstY, { align: "right" });

    // Totals Box (Right)
    const totalsX = PAGE.width - PAGE.margin - summaryWidth;
    doc.setFillColor(...COLORS.charcoal);
    doc.roundedRect(totalsX, y, summaryWidth, summaryHeight, 2, 2, "F");

    let totY = y + 10;
    const labelX = totalsX + 6;
    const valueX = totalsX + summaryWidth - 6;

    doc.setFontSize(7);
    doc.setTextColor(...COLORS.white);
    doc.setFont("helvetica", "normal");

    doc.text("Subtotal:", labelX, totY);
    doc.text(formatCurrency(invoice.subtotal), valueX, totY, { align: "right" });
    
    totY += 6;
    if (isIgst) {
      doc.text("IGST:", labelX, totY);
      doc.text(formatCurrency(totalIgst), valueX, totY, { align: "right" });
    } else {
      doc.text("CGST:", labelX, totY);
      doc.text(formatCurrency(totalCgst), valueX, totY, { align: "right" });
      totY += 5;
      doc.text("SGST:", labelX, totY);
      doc.text(formatCurrency(totalSgst), valueX, totY, { align: "right" });
    }

    totY += 10;

    // Grand Total highlight
    doc.setFillColor(...COLORS.gold);
    doc.roundedRect(totalsX + 4, totY - 3, summaryWidth - 8, 12, 1.5, 1.5, "F");

    doc.setFontSize(9);
    doc.setTextColor(...COLORS.charcoal);
    doc.setFont("helvetica", "bold");
    doc.text("GRAND TOTAL", labelX + 2, totY + 5);
    doc.text(formatCurrency(invoice.total_amount), valueX - 2, totY + 5, { align: "right" });

    y += summaryHeight + 10;

    // ========== TERMS SECTION ==========
    if (y + 20 < safeZone) {
      doc.setFontSize(7);
      doc.setTextColor(...COLORS.charcoal);
      doc.setFont("helvetica", "bold");
      doc.text("Terms & Conditions", PAGE.margin, y);
      
      y += 4;
      doc.setFontSize(5.5);
      doc.setTextColor(...COLORS.gray);
      doc.setFont("helvetica", "normal");
      COMPANY.terms.forEach((term) => {
        doc.text(term, PAGE.margin, y);
        y += 3;
      });
    }

    // Add footers to all pages
    const pageCount = doc.getNumberOfPages();
    for (let i = 1; i <= pageCount; i++) {
      doc.setPage(i);
      addFooter(i, pageCount);
    }

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
    } catch (e: any) {
      console.error("Error generating invoice PDF:", e);
      toast.error(e?.message || "Failed to generate PDF");
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
    } catch (e: any) {
      console.error("Error uploading invoice PDF:", e);
      toast.error(e?.message || "Failed to upload PDF");
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
