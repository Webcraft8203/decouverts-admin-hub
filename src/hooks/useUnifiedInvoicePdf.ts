import { useCallback, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { jsPDF } from "jspdf";
import { toast } from "sonner";

// ==================== UNIFIED DECOUVERTES INVOICE TEMPLATE ====================
// This template matches the edge function (generate-invoice) exactly
// Both admin and user downloads will produce identical professional invoices

const COLORS = {
  primary: [33, 37, 41] as [number, number, number],
  accent: [198, 158, 47] as [number, number, number],
  orange: [230, 126, 34] as [number, number, number],
  secondary: [73, 80, 87] as [number, number, number],
  muted: [134, 142, 150] as [number, number, number],
  light: [248, 249, 250] as [number, number, number],
  border: [222, 226, 230] as [number, number, number],
  white: [255, 255, 255] as [number, number, number],
  success: [25, 135, 84] as [number, number, number],
  warning: [255, 193, 7] as [number, number, number],
  tableHeader: [33, 37, 41] as [number, number, number],
  tableAlt: [248, 249, 250] as [number, number, number],
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

const PAGE = {
  width: 210,
  height: 297,
  margin: 15,
  footerHeight: 18,
};

const formatCurrency = (amount: number): string => {
  return `₹${Number(amount || 0).toLocaleString("en-IN", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
};

const formatDate = (dateStr: string): string => {
  return new Date(dateStr).toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
};

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
  result += ' Only';
  
  return result;
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
  cgst: number;
  sgst: number;
  igst: number;
  total: number;
}

function normalizeItem(item: InvoiceItem, index: number): NormalizedItem {
  const qty = Number(item.quantity) || 1;
  const rate = Number(item.price) || Number(item.rate) || Number(item.product_price) || 0;
  const taxableValue = Number(item.taxable_value) || qty * rate;
  const gstRate = Number(item.gst_rate) || 18;
  
  return {
    sno: index + 1,
    name: item.name || item.description || item.product_name || "Item",
    sku: item.sku || `DEC-PRD-${String(index + 1).padStart(5, '0')}`,
    hsn: item.hsn_code || item.hsn || "8471",
    qty,
    rate,
    taxableValue,
    gstRate,
    cgst: Number(item.cgst_amount) || 0,
    sgst: Number(item.sgst_amount) || 0,
    igst: Number(item.igst_amount) || 0,
    total: Number(item.total) || taxableValue + (Number(item.cgst_amount) || 0) + (Number(item.sgst_amount) || 0) + (Number(item.igst_amount) || 0),
  };
}

export function useUnifiedInvoicePdf() {
  const [isGenerating, setIsGenerating] = useState(false);

  const generateInvoicePdf = useCallback(async (invoice: Invoice): Promise<Blob> => {
    const doc = new jsPDF({ orientation: "portrait", unit: "mm", format: "a4" });
    const pageWidth = PAGE.width;
    const pageHeight = PAGE.height;
    const margin = PAGE.margin;
    const contentWidth = pageWidth - 2 * margin;
    let y = margin;
    let currentPage = 1;

    const isFinal = invoice.is_final || invoice.invoice_type === "final";
    const isIgst = invoice.is_igst || (invoice.buyer_state?.toLowerCase() !== COMPANY.state.toLowerCase());
    const items = (invoice.items || []).map((item, idx) => normalizeItem(item, idx));
    
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
    const safeZone = pageHeight - PAGE.footerHeight - 5;

    // ========== HELPER FUNCTIONS ==========
    const addFooter = (pageNum: number, total: number) => {
      const footerY = pageHeight - 12;
      
      doc.setDrawColor(...COLORS.border);
      doc.setLineWidth(0.5);
      doc.line(margin, footerY - 6, pageWidth - margin, footerY - 6);
      
      doc.setFontSize(6.5);
      doc.setTextColor(...COLORS.muted);
      doc.setFont("helvetica", "normal");
      doc.text("This is a computer-generated document and does not require a signature.", margin, footerY - 2);
      doc.text(`Page ${pageNum} of ${total}`, pageWidth - margin, footerY, { align: "right" });
      
      doc.setFontSize(6);
      doc.text(`Generated: ${new Date().toLocaleString("en-IN")} | ${COMPANY.website}`, pageWidth / 2, footerY + 3, { align: "center" });
    };

    const checkPageBreak = (neededHeight: number): boolean => {
      if (y + neededHeight > safeZone) {
        doc.addPage();
        currentPage++;
        y = margin + 8;
        return true;
      }
      return false;
    };

    // ==================== HEADER SECTION ====================
    // Logo on left, Company name + tagline on right of logo
    if (logoBase64) {
      try {
        doc.addImage(logoBase64, "PNG", margin, y, 28, 14);
      } catch {}
      
      // Company name in bold
      doc.setFontSize(18);
      doc.setTextColor(...COLORS.primary);
      doc.setFont("helvetica", "bold");
      doc.text(COMPANY.name, margin + 32, y + 7);
      
      // Tagline in orange
      doc.setFontSize(9);
      doc.setTextColor(...COLORS.orange);
      doc.setFont("helvetica", "italic");
      doc.text(COMPANY.tagline, margin + 32, y + 12);
      
      y += 18;
    } else {
      // Fallback: Text-based header
      doc.setFontSize(22);
      doc.setTextColor(...COLORS.primary);
      doc.setFont("helvetica", "bold");
      doc.text(COMPANY.name, margin, y + 8);
      
      doc.setFontSize(10);
      doc.setTextColor(...COLORS.orange);
      doc.setFont("helvetica", "italic");
      doc.text(COMPANY.tagline, margin, y + 14);
      y += 18;
    }

    // Company Details Row
    doc.setFontSize(7);
    doc.setTextColor(...COLORS.secondary);
    doc.setFont("helvetica", "normal");
    doc.text(`${COMPANY.address}, ${COMPANY.city}, ${COMPANY.state} - ${COMPANY.pincode}, ${COMPANY.country}`, margin, y);
    y += 4;
    doc.text(`Phone: ${COMPANY.phone} | Email: ${COMPANY.email}`, margin, y);
    y += 4;
    doc.text(`GSTIN: ${COMPANY.gstin} | PAN: ${COMPANY.pan}`, margin, y);
    
    y += 8;

    // Gold accent divider
    doc.setFillColor(...COLORS.accent);
    doc.rect(margin, y, contentWidth, 2, "F");
    y += 6;

    // Invoice Type Badge - Centered
    const invoiceTypeLabel = isFinal ? "TAX INVOICE" : "PROFORMA INVOICE";
    const badgeBgColor = isFinal ? COLORS.primary : COLORS.secondary;
    
    const badgeWidth = 55;
    const badgeX = (pageWidth - badgeWidth) / 2;
    doc.setFillColor(...badgeBgColor);
    doc.roundedRect(badgeX, y, badgeWidth, 8, 2, 2, "F");
    doc.setFontSize(9);
    doc.setTextColor(...COLORS.white);
    doc.setFont("helvetica", "bold");
    doc.text(invoiceTypeLabel, pageWidth / 2, y + 5.5, { align: "center" });
    
    y += 14;

    // ==================== INVOICE DETAILS ROW (3 columns, no payment status) ====================
    doc.setFillColor(...COLORS.light);
    doc.roundedRect(margin, y, contentWidth, 16, 2, 2, "F");
    
    const detailY = y + 5;
    const colSpacing = contentWidth / 3;
    const col1 = margin + 8;
    const col2 = margin + colSpacing + 8;
    const col3 = margin + colSpacing * 2 + 8;
    
    doc.setFontSize(7);
    doc.setTextColor(...COLORS.muted);
    doc.setFont("helvetica", "normal");
    doc.text("Invoice Number", col1, detailY);
    doc.text("Invoice Date", col2, detailY);
    doc.text("Order Number", col3, detailY);
    
    doc.setFontSize(9);
    doc.setTextColor(...COLORS.primary);
    doc.setFont("helvetica", "bold");
    doc.text(invoice.invoice_number, col1, detailY + 6);
    doc.text(formatDate(invoice.created_at), col2, detailY + 6);
    doc.text(invoice.order?.order_number || "N/A", col3, detailY + 6);

    y += 22;

    // ==================== BILLED BY / BILLED TO SECTION ====================
    const boxWidth = (contentWidth - 10) / 2;
    const boxHeight = 42;

    // Billed By Box
    doc.setFillColor(...COLORS.light);
    doc.setDrawColor(...COLORS.border);
    doc.setLineWidth(0.3);
    doc.roundedRect(margin, y, boxWidth, boxHeight, 2, 2, "FD");
    
    doc.setFillColor(...COLORS.primary);
    doc.roundedRect(margin, y, boxWidth, 8, 2, 2, "F");
    doc.rect(margin, y + 4, boxWidth, 4, "F");
    
    doc.setFontSize(8);
    doc.setTextColor(...COLORS.white);
    doc.setFont("helvetica", "bold");
    doc.text("BILLED BY", margin + 4, y + 5.5);

    let fromY = y + 13;
    doc.setFontSize(9);
    doc.setTextColor(...COLORS.primary);
    doc.setFont("helvetica", "bold");
    doc.text(COMPANY.name, margin + 4, fromY);
    
    fromY += 5;
    doc.setFontSize(7);
    doc.setTextColor(...COLORS.secondary);
    doc.setFont("helvetica", "normal");
    doc.text(COMPANY.address, margin + 4, fromY, { maxWidth: boxWidth - 8 });
    fromY += 4;
    doc.text(`${COMPANY.city}, ${COMPANY.state} - ${COMPANY.pincode}`, margin + 4, fromY);
    fromY += 4;
    doc.text(`Phone: ${COMPANY.phone}`, margin + 4, fromY);
    fromY += 4;
    doc.text(`Email: ${COMPANY.email}`, margin + 4, fromY);
    fromY += 5;
    doc.setTextColor(...COLORS.accent);
    doc.setFont("helvetica", "bold");
    doc.text(`GSTIN: ${COMPANY.gstin}`, margin + 4, fromY);
    fromY += 4;
    doc.text(`PAN: ${COMPANY.pan}`, margin + 4, fromY);

    // Billed To Box
    const toX = margin + boxWidth + 10;
    doc.setFillColor(...COLORS.light);
    doc.setDrawColor(...COLORS.border);
    doc.roundedRect(toX, y, boxWidth, boxHeight, 2, 2, "FD");
    
    doc.setFillColor(...COLORS.accent);
    doc.roundedRect(toX, y, boxWidth, 8, 2, 2, "F");
    doc.rect(toX, y + 4, boxWidth, 4, "F");
    
    doc.setFontSize(8);
    doc.setTextColor(...COLORS.primary);
    doc.setFont("helvetica", "bold");
    doc.text("BILLED TO", toX + 4, y + 5.5);

    let toY = y + 13;
    doc.setFontSize(9);
    doc.setTextColor(...COLORS.primary);
    doc.setFont("helvetica", "bold");
    const clientName = (invoice.client_name || "Customer").toUpperCase();
    const truncatedName = clientName.length > 30 ? clientName.substring(0, 30) + "..." : clientName;
    doc.text(truncatedName, toX + 4, toY);
    
    toY += 5;
    doc.setFontSize(7);
    doc.setTextColor(...COLORS.secondary);
    doc.setFont("helvetica", "normal");
    
    if (invoice.client_address) {
      const addressLines = doc.splitTextToSize(invoice.client_address, boxWidth - 8);
      addressLines.slice(0, 4).forEach((line: string) => {
        doc.text(line, toX + 4, toY);
        toY += 4;
      });
    }
    
    if (invoice.buyer_state) {
      doc.text(`State: ${invoice.buyer_state}`, toX + 4, toY);
      toY += 4;
    }
    
    if (invoice.buyer_gstin) {
      doc.setTextColor(...COLORS.accent);
      doc.setFont("helvetica", "bold");
      doc.text(`GSTIN: ${invoice.buyer_gstin}`, toX + 4, y + boxHeight - 5);
    }

    y += boxHeight + 8;

    // ==================== ITEMS TABLE ====================
    const tableX = margin;
    const tableW = contentWidth;
    const rowHeight = 12; // Increased for 2-line item rows
    const headerHeight = 9;

    // Column widths - Item Name + SKU combined, no separate description
    const colWidths = {
      sno: 10,
      item: 55,      // Combined Item Name + SKU column
      hsn: 20,
      qty: 14,
      rate: 24,
      taxable: 24,
      tax: 16,
      total: 27,
    };

    // Table Header
    doc.setFillColor(...COLORS.tableHeader);
    doc.rect(tableX, y, tableW, headerHeight, "F");

    doc.setFontSize(6.5);
    doc.setTextColor(...COLORS.white);
    doc.setFont("helvetica", "bold");

    let colX = tableX + 2;
    doc.text("S.No", colX, y + 6);
    colX += colWidths.sno;
    doc.text("Item Description", colX, y + 6);
    colX += colWidths.item;
    doc.text("HSN", colX, y + 6);
    colX += colWidths.hsn;
    doc.text("Qty", colX + 4, y + 6);
    colX += colWidths.qty;
    doc.text("Rate", colX + colWidths.rate - 2, y + 6, { align: "right" });
    colX += colWidths.rate;
    doc.text("Taxable", colX + colWidths.taxable - 2, y + 6, { align: "right" });
    colX += colWidths.taxable;
    doc.text(isIgst ? "IGST" : "GST", colX + 2, y + 6);
    colX += colWidths.tax;
    doc.text("Total", colX + colWidths.total - 2, y + 6, { align: "right" });

    y += headerHeight;

    // Table Rows
    items.forEach((item, idx) => {
      checkPageBreak(rowHeight + 2);

      // Alternating row background
      doc.setFillColor(...(idx % 2 === 0 ? COLORS.white : COLORS.tableAlt));
      doc.rect(tableX, y, tableW, rowHeight, "F");

      // Row border
      doc.setDrawColor(...COLORS.border);
      doc.setLineWidth(0.1);
      doc.line(tableX, y + rowHeight, tableX + tableW, y + rowHeight);

      const textY1 = y + 5; // First line (Item name)
      const textY2 = y + 9.5; // Second line (SKU)
      
      doc.setFontSize(6.5);

      colX = tableX + 2;
      
      // S.No - centered vertically
      doc.setTextColor(...COLORS.secondary);
      doc.setFont("helvetica", "normal");
      doc.text(String(item.sno), colX + 3, y + 7);
      colX += colWidths.sno;
      
      // Item Name (line 1) + SKU (line 2)
      doc.setTextColor(...COLORS.primary);
      doc.setFont("helvetica", "bold");
      const truncatedName2 = item.name.length > 35 ? item.name.substring(0, 35) + "..." : item.name;
      doc.text(truncatedName2, colX, textY1);
      
      doc.setTextColor(...COLORS.muted);
      doc.setFont("helvetica", "normal");
      doc.setFontSize(6);
      doc.text(`SKU: ${item.sku}`, colX, textY2);
      doc.setFontSize(6.5);
      colX += colWidths.item;
      
      // HSN
      doc.setTextColor(...COLORS.secondary);
      doc.text(item.hsn, colX, y + 7);
      colX += colWidths.hsn;
      
      // Qty
      doc.text(String(item.qty), colX + 6, y + 7, { align: "center" });
      colX += colWidths.qty;
      
      // Rate - right aligned
      doc.text(formatCurrency(item.rate), colX + colWidths.rate - 2, y + 7, { align: "right" });
      colX += colWidths.rate;
      
      // Taxable - right aligned
      doc.text(formatCurrency(item.taxableValue), colX + colWidths.taxable - 2, y + 7, { align: "right" });
      colX += colWidths.taxable;
      
      // Tax %
      doc.setTextColor(...COLORS.accent);
      doc.setFont("helvetica", "bold");
      doc.text(`${item.gstRate}%`, colX + 6, y + 7, { align: "center" });
      colX += colWidths.tax;
      
      // Total - right aligned
      doc.setTextColor(...COLORS.primary);
      doc.text(formatCurrency(item.total), colX + colWidths.total - 2, y + 7, { align: "right" });

      y += rowHeight;
    });

    // Table bottom border
    doc.setDrawColor(...COLORS.primary);
    doc.setLineWidth(0.5);
    doc.line(tableX, y, tableX + tableW, y);

    y += 10;
    checkPageBreak(65);

    // ==================== AMOUNT IN WORDS ====================
    doc.setFillColor(...COLORS.light);
    doc.roundedRect(margin, y, contentWidth, 12, 2, 2, "F");
    
    doc.setFontSize(7);
    doc.setTextColor(...COLORS.muted);
    doc.setFont("helvetica", "normal");
    doc.text("Amount in Words:", margin + 4, y + 5);
    
    doc.setFontSize(8);
    doc.setTextColor(...COLORS.primary);
    doc.setFont("helvetica", "bold");
    doc.text(numberToWords(invoice.total_amount), margin + 4, y + 9.5);

    y += 16;

    // ==================== SUMMARY SECTION ====================
    const summaryWidth = 80;
    const gstBoxWidth = contentWidth - summaryWidth - 10;
    const summaryHeight = isIgst ? 50 : 55;

    // GST Summary Box (Left)
    doc.setFillColor(...COLORS.light);
    doc.setDrawColor(...COLORS.border);
    doc.setLineWidth(0.2);
    doc.roundedRect(margin, y, gstBoxWidth, summaryHeight, 2, 2, "FD");

    doc.setFontSize(8);
    doc.setTextColor(...COLORS.primary);
    doc.setFont("helvetica", "bold");
    doc.text("TAX SUMMARY", margin + 4, y + 8);

    let gstY = y + 14;
    doc.setFontSize(7);
    doc.setTextColor(...COLORS.muted);
    doc.setFont("helvetica", "normal");
    
    doc.text("Supply Type:", margin + 4, gstY);
    doc.setTextColor(...COLORS.primary);
    doc.setFont("helvetica", "bold");
    doc.text(isIgst ? "Inter-State" : "Intra-State", margin + 32, gstY);

    gstY += 5;
    doc.setTextColor(...COLORS.muted);
    doc.setFont("helvetica", "normal");
    doc.text("Place of Supply:", margin + 4, gstY);
    doc.setTextColor(...COLORS.primary);
    doc.text(invoice.buyer_state || COMPANY.state, margin + 32, gstY);

    gstY += 7;
    doc.setDrawColor(...COLORS.border);
    doc.setLineWidth(0.2);
    doc.line(margin + 4, gstY, margin + gstBoxWidth - 4, gstY);

    gstY += 6;
    if (isIgst) {
      doc.setTextColor(...COLORS.secondary);
      doc.setFont("helvetica", "normal");
      doc.text("IGST:", margin + 4, gstY);
      doc.text(formatCurrency(totalIgst), margin + gstBoxWidth - 4, gstY, { align: "right" });
    } else {
      doc.setTextColor(...COLORS.secondary);
      doc.text("CGST:", margin + 4, gstY);
      doc.text(formatCurrency(totalCgst), margin + gstBoxWidth - 4, gstY, { align: "right" });
      gstY += 5;
      doc.text("SGST:", margin + 4, gstY);
      doc.text(formatCurrency(totalSgst), margin + gstBoxWidth - 4, gstY, { align: "right" });
    }

    gstY += 7;
    doc.setDrawColor(...COLORS.accent);
    doc.setLineWidth(0.5);
    doc.line(margin + 4, gstY, margin + gstBoxWidth - 4, gstY);
    
    gstY += 5;
    doc.setTextColor(...COLORS.primary);
    doc.setFont("helvetica", "bold");
    doc.text("Total Tax:", margin + 4, gstY);
    doc.setTextColor(...COLORS.accent);
    doc.text(formatCurrency(totalCgst + totalSgst + totalIgst), margin + gstBoxWidth - 4, gstY, { align: "right" });

    // Totals Box (Right)
    const totalsX = pageWidth - margin - summaryWidth;
    doc.setFillColor(...COLORS.primary);
    doc.roundedRect(totalsX, y, summaryWidth, summaryHeight, 2, 2, "F");

    let totY = y + 10;
    const labelX = totalsX + 6;
    const valueX = totalsX + summaryWidth - 6;

    doc.setFontSize(7.5);
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

    if (invoice.platform_fee && invoice.platform_fee > 0) {
      totY += 5;
      doc.text("Platform Fee:", labelX, totY);
      doc.text(formatCurrency(invoice.platform_fee), valueX, totY, { align: "right" });
    }

    totY += 10;

    // Grand Total highlight
    doc.setFillColor(...COLORS.accent);
    doc.roundedRect(totalsX + 4, totY - 3, summaryWidth - 8, 14, 2, 2, "F");

    doc.setFontSize(9);
    doc.setTextColor(...COLORS.primary);
    doc.setFont("helvetica", "bold");
    doc.text("GRAND TOTAL", labelX + 2, totY + 5);
    doc.setFontSize(11);
    doc.text(formatCurrency(invoice.total_amount), valueX - 2, totY + 5, { align: "right" });

    y += summaryHeight + 10;

    // ==================== TERMS SECTION ====================
    if (y + 25 < safeZone) {
      doc.setFontSize(8);
      doc.setTextColor(...COLORS.primary);
      doc.setFont("helvetica", "bold");
      doc.text("Terms & Conditions", margin, y);
      
      y += 5;
      doc.setFontSize(6);
      doc.setTextColor(...COLORS.muted);
      doc.setFont("helvetica", "normal");
      COMPANY.terms.forEach((term) => {
        doc.text(term, margin, y);
        y += 3.5;
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
    } catch (e: unknown) {
      console.error("Error generating invoice PDF:", e);
      const errorMessage = e instanceof Error ? e.message : "Failed to generate PDF";
      toast.error(errorMessage);
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
      const errorMessage = e instanceof Error ? e.message : "Failed to upload PDF";
      toast.error(errorMessage);
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
