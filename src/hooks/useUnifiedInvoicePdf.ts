import { useCallback, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { jsPDF } from "jspdf";
import { toast } from "sonner";

// Enterprise color palette
const colors = {
  brand: [45, 62, 80] as [number, number, number],
  primary: [30, 41, 59] as [number, number, number],
  secondary: [71, 85, 105] as [number, number, number],
  accent: [16, 185, 129] as [number, number, number],
  muted: [148, 163, 184] as [number, number, number],
  border: [226, 232, 240] as [number, number, number],
  light: [248, 250, 252] as [number, number, number],
  white: [255, 255, 255] as [number, number, number],
  warning: [245, 158, 11] as [number, number, number],
  success: [34, 197, 94] as [number, number, number],
};

const COMPANY_SETTINGS = {
  business_name: "DECOUVERTS",
  business_address: "Innovation Hub, Tech Park",
  business_city: "Pune",
  business_state: "Maharashtra",
  business_pincode: "411001",
  business_phone: "+91 98765 43210",
  business_email: "info@decouverts.com",
  business_gstin: "27XXXXX1234X1ZX",
  terms_and_conditions: "1. Goods once sold are non-refundable.\n2. Payment due within 30 days.\n3. Warranty as per product terms.",
};

const formatCurrency = (amount: number): string => {
  return `₹${Number(amount || 0).toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
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

function normalizeItem(item: any): InvoiceItem {
  return {
    description: item.description || item.name || item.product_name || "Item",
    quantity: Number(item.quantity) || 1,
    price: Number(item.price) || Number(item.rate) || Number(item.product_price) || 0,
    gst_rate: Number(item.gst_rate) || 18,
    taxable_value: Number(item.taxable_value) || (Number(item.quantity || 1) * Number(item.price || item.rate || 0)),
    cgst_amount: Number(item.cgst_amount) || 0,
    sgst_amount: Number(item.sgst_amount) || 0,
    igst_amount: Number(item.igst_amount) || 0,
    total: Number(item.total) || (Number(item.quantity || 1) * Number(item.price || item.rate || 0)),
  };
}

export function useUnifiedInvoicePdf() {
  const [isGenerating, setIsGenerating] = useState(false);

  const generateInvoicePdf = useCallback(async (invoice: Invoice): Promise<Blob> => {
    const doc = new jsPDF({ orientation: "portrait", unit: "mm", format: "a4" });

    const pageWidth = doc.internal.pageSize.getWidth();
    const pageHeight = doc.internal.pageSize.getHeight();
    const margin = 15;
    let y = margin;
    let currentPage = 1;

    const isFinal = invoice.is_final || invoice.invoice_type === "final";
    const isIgst = invoice.is_igst || (invoice.buyer_state?.toLowerCase() !== COMPANY_SETTINGS.business_state.toLowerCase());

    const items = (invoice.items || []).map(normalizeItem);

    let totalCgst = invoice.cgst_amount || 0;
    let totalSgst = invoice.sgst_amount || 0;
    let totalIgst = invoice.igst_amount || 0;

    if (!totalCgst && !totalSgst && !totalIgst) {
      items.forEach((item) => {
        totalCgst += item.cgst_amount || 0;
        totalSgst += item.sgst_amount || 0;
        totalIgst += item.igst_amount || 0;
      });
    }

    const logoBase64 = await fetchLogoAsBase64();

    // Helper function to add page footer
    const addPageFooter = (pageNum: number) => {
      const footerY = pageHeight - 12;
      
      doc.setDrawColor(...colors.border);
      doc.setLineWidth(0.3);
      doc.line(margin, footerY - 4, pageWidth - margin, footerY - 4);
      
      doc.setFontSize(7);
      doc.setTextColor(...colors.muted);
      doc.setFont("helvetica", "normal");
      doc.text("This is a computer-generated document and does not require a signature.", margin, footerY);
      doc.text(`Page ${pageNum}`, pageWidth - margin, footerY, { align: "right" });
      
      doc.setFontSize(6);
      doc.text(`Generated on ${new Date().toLocaleString("en-IN")} | DECOUVERTS`, pageWidth / 2, footerY + 4, { align: "center" });
    };

    // Check page break
    const checkPageBreak = (neededHeight: number) => {
      if (y + neededHeight > pageHeight - 25) {
        addPageFooter(currentPage);
        doc.addPage();
        currentPage++;
        y = margin + 10;
        return true;
      }
      return false;
    };

    // ==================== HEADER SECTION ====================
    // Top accent bar
    doc.setFillColor(...colors.brand);
    doc.rect(0, 0, pageWidth, 3, "F");

    y = 8;

    // Logo and company section
    if (logoBase64) {
      try { doc.addImage(logoBase64, "PNG", margin, y, 28, 14); } catch {}
    }
    
    const companyNameX = margin + (logoBase64 ? 32 : 0);
    doc.setFontSize(18);
    doc.setTextColor(...colors.brand);
    doc.setFont("helvetica", "bold");
    doc.text("DECOUVERTS", companyNameX, y + 7);
    
    doc.setFontSize(7);
    doc.setTextColor(...colors.secondary);
    doc.setFont("helvetica", "italic");
    doc.text("Discovering Future Technologies", companyNameX, y + 12);

    // Invoice metadata box
    const metaBoxWidth = 60;
    const metaBoxX = pageWidth - margin - metaBoxWidth;
    
    doc.setFillColor(...(isFinal ? colors.success : colors.warning));
    doc.roundedRect(metaBoxX, y - 2, metaBoxWidth, 9, 2, 2, "F");
    doc.setFontSize(10);
    doc.setTextColor(255, 255, 255);
    doc.setFont("helvetica", "bold");
    doc.text(isFinal ? "TAX INVOICE" : "PROFORMA INVOICE", metaBoxX + metaBoxWidth / 2, y + 4, { align: "center" });

    y += 10;
    doc.setFillColor(...colors.light);
    doc.setDrawColor(...colors.border);
    doc.roundedRect(metaBoxX, y, metaBoxWidth, 18, 2, 2, "FD");

    const metaY = y + 4;
    doc.setFontSize(7);
    doc.setTextColor(...colors.secondary);
    doc.setFont("helvetica", "normal");
    doc.text("Invoice No:", metaBoxX + 3, metaY);
    doc.setTextColor(...colors.primary);
    doc.setFont("helvetica", "bold");
    doc.text(invoice.invoice_number, metaBoxX + metaBoxWidth - 3, metaY, { align: "right" });

    const invoiceDate = new Date(invoice.created_at).toLocaleDateString("en-IN", {
      day: "2-digit", month: "short", year: "numeric"
    });
    
    doc.setTextColor(...colors.secondary);
    doc.setFont("helvetica", "normal");
    doc.text("Date:", metaBoxX + 3, metaY + 5);
    doc.setTextColor(...colors.primary);
    doc.text(invoiceDate, metaBoxX + metaBoxWidth - 3, metaY + 5, { align: "right" });

    if (invoice.order?.order_number) {
      doc.setTextColor(...colors.secondary);
      doc.text("Order No:", metaBoxX + 3, metaY + 10);
      doc.setTextColor(...colors.primary);
      doc.text(invoice.order.order_number, metaBoxX + metaBoxWidth - 3, metaY + 10, { align: "right" });
    } else {
      doc.setTextColor(...colors.success);
      doc.setFont("helvetica", "bold");
      doc.text("Status: PAID", metaBoxX + metaBoxWidth - 3, metaY + 10, { align: "right" });
    }

    y = 40;
    doc.setDrawColor(...colors.brand);
    doc.setLineWidth(0.8);
    doc.line(margin, y, pageWidth - margin, y);

    y += 6;

    // ==================== SELLER & BUYER SECTION ====================
    const boxWidth = (pageWidth - 2 * margin - 10) / 2;
    const boxHeight = 38;

    // SELLER BOX
    doc.setFillColor(...colors.light);
    doc.setDrawColor(...colors.border);
    doc.roundedRect(margin, y, boxWidth, boxHeight, 3, 3, "FD");

    doc.setFillColor(...colors.brand);
    doc.roundedRect(margin + 4, y + 3, 22, 6, 1, 1, "F");
    doc.setFontSize(6);
    doc.setTextColor(255, 255, 255);
    doc.setFont("helvetica", "bold");
    doc.text("FROM", margin + 15, y + 7, { align: "center" });

    doc.setFontSize(10);
    doc.setTextColor(...colors.primary);
    doc.setFont("helvetica", "bold");
    doc.text("DECOUVERTS", margin + 6, y + 15);

    doc.setFontSize(7);
    doc.setTextColor(...colors.secondary);
    doc.setFont("helvetica", "normal");
    doc.text(COMPANY_SETTINGS.business_address, margin + 6, y + 20);
    doc.text(`${COMPANY_SETTINGS.business_city}, ${COMPANY_SETTINGS.business_state} - ${COMPANY_SETTINGS.business_pincode}`, margin + 6, y + 24);
    doc.text(`GSTIN: ${COMPANY_SETTINGS.business_gstin}`, margin + 6, y + 28);
    doc.text(`Phone: ${COMPANY_SETTINGS.business_phone}`, margin + 6, y + 32);

    // BUYER BOX
    const buyerX = margin + boxWidth + 10;
    doc.setFillColor(...colors.light);
    doc.setDrawColor(...colors.border);
    doc.roundedRect(buyerX, y, boxWidth, boxHeight, 3, 3, "FD");

    doc.setFillColor(...colors.accent);
    doc.roundedRect(buyerX + 4, y + 3, 22, 6, 1, 1, "F");
    doc.setFontSize(6);
    doc.setTextColor(255, 255, 255);
    doc.setFont("helvetica", "bold");
    doc.text("BILL TO", buyerX + 15, y + 7, { align: "center" });

    doc.setFontSize(10);
    doc.setTextColor(...colors.primary);
    doc.setFont("helvetica", "bold");
    doc.text((invoice.client_name || "Customer").toUpperCase(), buyerX + 6, y + 15);

    doc.setFontSize(7);
    doc.setTextColor(...colors.secondary);
    doc.setFont("helvetica", "normal");
    
    if (invoice.client_address) {
      const addressLines = invoice.client_address.split(",").map(s => s.trim()).filter(Boolean);
      addressLines.slice(0, 3).forEach((line, i) => {
        doc.text(line, buyerX + 6, y + 20 + i * 4);
      });
    }
    
    if (invoice.buyer_gstin) {
      doc.setTextColor(...colors.accent);
      doc.setFont("helvetica", "bold");
      doc.text(`GSTIN: ${invoice.buyer_gstin}`, buyerX + 6, y + 32);
    }

    y += boxHeight + 8;

    // ==================== ITEMS TABLE ====================
    const tableWidth = pageWidth - 2 * margin;
    
    doc.setFillColor(...colors.brand);
    doc.rect(margin, y, tableWidth, 9, "F");
    
    doc.setFontSize(7);
    doc.setTextColor(255, 255, 255);
    doc.setFont("helvetica", "bold");

    const cols = isIgst 
      ? { sno: margin + 3, desc: margin + 12, qty: margin + 100, rate: margin + 115, taxable: margin + 135, igst: margin + 155, total: pageWidth - margin - 3 }
      : { sno: margin + 3, desc: margin + 10, qty: margin + 72, rate: margin + 87, taxable: margin + 105, cgst: margin + 125, sgst: margin + 145, total: pageWidth - margin - 3 };

    if (isIgst) {
      doc.text("#", cols.sno, y + 6);
      doc.text("DESCRIPTION", cols.desc, y + 6);
      doc.text("QTY", cols.qty, y + 6);
      doc.text("RATE", cols.rate, y + 6);
      doc.text("TAXABLE", cols.taxable, y + 6);
      doc.text("IGST", cols.igst, y + 6);
      doc.text("TOTAL", cols.total, y + 6, { align: "right" });
    } else {
      doc.text("#", cols.sno, y + 6);
      doc.text("DESCRIPTION", cols.desc, y + 6);
      doc.text("QTY", cols.qty, y + 6);
      doc.text("RATE", cols.rate, y + 6);
      doc.text("TAXABLE", cols.taxable, y + 6);
      doc.text("CGST", cols.cgst, y + 6);
      doc.text("SGST", cols.sgst, y + 6);
      doc.text("TOTAL", cols.total, y + 6, { align: "right" });
    }

    y += 9;

    items.forEach((item, idx) => {
      checkPageBreak(8);
      
      const rowH = 8;
      
      if (idx % 2 === 0) {
        doc.setFillColor(250, 251, 252);
      } else {
        doc.setFillColor(255, 255, 255);
      }
      doc.rect(margin, y, tableWidth, rowH, "F");

      doc.setDrawColor(...colors.border);
      doc.setLineWidth(0.1);
      doc.line(margin, y + rowH, pageWidth - margin, y + rowH);

      doc.setFontSize(7);
      doc.setTextColor(...colors.primary);
      doc.setFont("helvetica", "normal");

      const desc = (item.description || "").substring(0, isIgst ? 50 : 35);
      const gstRate = item.gst_rate || 18;

      if (isIgst) {
        doc.text(String(idx + 1), cols.sno, y + 5);
        doc.text(desc, cols.desc, y + 5);
        doc.text(String(item.quantity), cols.qty, y + 5);
        doc.text(formatCurrency(item.price || 0), cols.rate, y + 5);
        doc.text(formatCurrency(item.taxable_value || 0), cols.taxable, y + 5);
        doc.setTextColor(...colors.accent);
        doc.text(`${gstRate}%`, cols.igst, y + 5);
        doc.setTextColor(...colors.primary);
        doc.setFont("helvetica", "bold");
        doc.text(formatCurrency(item.total || 0), cols.total, y + 5, { align: "right" });
      } else {
        doc.text(String(idx + 1), cols.sno, y + 5);
        doc.text(desc, cols.desc, y + 5);
        doc.text(String(item.quantity), cols.qty, y + 5);
        doc.text(formatCurrency(item.price || 0), cols.rate, y + 5);
        doc.text(formatCurrency(item.taxable_value || 0), cols.taxable, y + 5);
        doc.setTextColor(...colors.accent);
        doc.text(`${gstRate / 2}%`, cols.cgst, y + 5);
        doc.text(`${gstRate / 2}%`, cols.sgst, y + 5);
        doc.setTextColor(...colors.primary);
        doc.setFont("helvetica", "bold");
        doc.text(formatCurrency(item.total || 0), cols.total, y + 5, { align: "right" });
      }

      y += rowH;
    });

    y += 6;
    checkPageBreak(60);

    // ==================== TOTALS & GST SUMMARY ====================
    const summaryHeight = isIgst ? 48 : 56;
    const totalsWidth = 80;
    const gstWidth = pageWidth - 2 * margin - totalsWidth - 10;
    
    // GST SUMMARY BOX (Left)
    doc.setFillColor(...colors.light);
    doc.setDrawColor(...colors.border);
    doc.roundedRect(margin, y, gstWidth, summaryHeight, 3, 3, "FD");

    doc.setFontSize(8);
    doc.setTextColor(...colors.brand);
    doc.setFont("helvetica", "bold");
    doc.text("TAX SUMMARY", margin + 6, y + 8);

    let gstY = y + 14;
    const sellerState = invoice.seller_state || COMPANY_SETTINGS.business_state;
    const buyerState = invoice.buyer_state || "N/A";

    doc.setFontSize(7);
    doc.setTextColor(...colors.secondary);
    doc.setFont("helvetica", "normal");
    doc.text(`Supply Type:`, margin + 6, gstY);
    doc.setTextColor(...colors.primary);
    doc.setFont("helvetica", "bold");
    doc.text(isIgst ? "Inter-State" : "Intra-State", margin + 35, gstY);
    
    gstY += 5;
    doc.setTextColor(...colors.secondary);
    doc.setFont("helvetica", "normal");
    doc.text(`Place of Supply:`, margin + 6, gstY);
    doc.setTextColor(...colors.primary);
    doc.text(`${sellerState}${isIgst ? ` → ${buyerState}` : ""}`, margin + 35, gstY);

    gstY += 8;
    
    doc.setFillColor(...colors.brand);
    doc.rect(margin + 4, gstY, gstWidth - 8, 6, "F");
    doc.setFontSize(6);
    doc.setTextColor(255, 255, 255);
    doc.setFont("helvetica", "bold");
    doc.text("TAX TYPE", margin + 8, gstY + 4);
    doc.text("AMOUNT", margin + gstWidth - 12, gstY + 4, { align: "right" });

    gstY += 6;

    if (isIgst) {
      doc.setFontSize(7);
      doc.setTextColor(...colors.primary);
      doc.setFont("helvetica", "normal");
      doc.text("IGST @ Various Rates", margin + 8, gstY + 5);
      doc.text(formatCurrency(totalIgst), margin + gstWidth - 12, gstY + 5, { align: "right" });
      gstY += 7;
    } else {
      doc.setFontSize(7);
      doc.setTextColor(...colors.primary);
      doc.setFont("helvetica", "normal");
      doc.text("CGST @ Various Rates", margin + 8, gstY + 5);
      doc.text(formatCurrency(totalCgst), margin + gstWidth - 12, gstY + 5, { align: "right" });
      gstY += 6;
      doc.text("SGST @ Various Rates", margin + 8, gstY + 5);
      doc.text(formatCurrency(totalSgst), margin + gstWidth - 12, gstY + 5, { align: "right" });
      gstY += 7;
    }

    doc.setDrawColor(...colors.accent);
    doc.setLineWidth(0.5);
    doc.line(margin + 8, gstY + 2, margin + gstWidth - 8, gstY + 2);

    doc.setFont("helvetica", "bold");
    doc.setTextColor(...colors.brand);
    doc.text("TOTAL TAX", margin + 8, gstY + 8);
    doc.setTextColor(...colors.accent);
    doc.text(formatCurrency(totalCgst + totalSgst + totalIgst), margin + gstWidth - 12, gstY + 8, { align: "right" });

    // TOTALS BOX (Right)
    const totalsX = pageWidth - margin - totalsWidth;
    doc.setFillColor(...colors.brand);
    doc.roundedRect(totalsX, y, totalsWidth, summaryHeight, 3, 3, "F");

    let totalsY = y + 8;
    const labelX = totalsX + 6;
    const valueX = totalsX + totalsWidth - 6;

    doc.setFontSize(7);
    doc.setTextColor(255, 255, 255);
    doc.setFont("helvetica", "normal");

    doc.text("Subtotal", labelX, totalsY);
    doc.text(formatCurrency(invoice.subtotal), valueX, totalsY, { align: "right" });
    totalsY += 6;

    if (isIgst) {
      doc.text("IGST", labelX, totalsY);
      doc.text(formatCurrency(totalIgst), valueX, totalsY, { align: "right" });
      totalsY += 6;
    } else {
      doc.text("CGST", labelX, totalsY);
      doc.text(formatCurrency(totalCgst), valueX, totalsY, { align: "right" });
      totalsY += 5;
      doc.text("SGST", labelX, totalsY);
      doc.text(formatCurrency(totalSgst), valueX, totalsY, { align: "right" });
      totalsY += 6;
    }

    totalsY += 8;

    doc.setFillColor(...colors.accent);
    doc.roundedRect(totalsX + 4, totalsY - 2, totalsWidth - 8, 12, 2, 2, "F");

    doc.setFontSize(9);
    doc.setFont("helvetica", "bold");
    doc.text("GRAND TOTAL", labelX + 2, totalsY + 5);
    doc.text(formatCurrency(invoice.total_amount), valueX - 2, totalsY + 5, { align: "right" });

    y += summaryHeight + 8;

    // Proforma notice
    if (!isFinal) {
      checkPageBreak(16);
      
      doc.setFillColor(255, 251, 235);
      doc.setDrawColor(...colors.warning);
      doc.setLineWidth(0.8);
      doc.roundedRect(margin, y, pageWidth - 2 * margin, 12, 2, 2, "FD");
      
      doc.setFontSize(8);
      doc.setTextColor(...colors.warning);
      doc.setFont("helvetica", "bold");
      doc.text("⚠ PROFORMA INVOICE - NOT A TAX DOCUMENT", margin + 6, y + 5);
      doc.setFontSize(7);
      doc.setFont("helvetica", "normal");
      doc.setTextColor(...colors.secondary);
      doc.text("This document is for reference only. Final GST Tax Invoice will be issued upon successful delivery.", margin + 6, y + 9);
      y += 16;
    }

    // Terms
    checkPageBreak(25);
    doc.setFontSize(8);
    doc.setTextColor(...colors.brand);
    doc.setFont("helvetica", "bold");
    doc.text("Terms & Conditions", margin, y);
    y += 5;

    doc.setFontSize(6);
    doc.setTextColor(...colors.muted);
    doc.setFont("helvetica", "normal");
    const terms = COMPANY_SETTINGS.terms_and_conditions.split("\n");
    terms.forEach((term) => {
      if (y < pageHeight - 25) {
        doc.text(term, margin, y);
        y += 3.5;
      }
    });

    y += 4;

    // Thank you
    doc.setFillColor(...colors.light);
    doc.roundedRect(margin, y, pageWidth - 2 * margin, 10, 2, 2, "F");
    doc.setFontSize(9);
    doc.setTextColor(...colors.accent);
    doc.setFont("helvetica", "bold");
    doc.text("Thank you for your business!", pageWidth / 2, y + 6.5, { align: "center" });

    addPageFooter(currentPage);

    return doc.output("blob");
  }, []);

  const downloadInvoice = useCallback(async (invoice: Invoice) => {
    setIsGenerating(true);
    try {
      if (invoice.pdf_url) {
        const { data, error } = await supabase.storage
          .from("invoices")
          .createSignedUrl(invoice.pdf_url, 60);

        if (!error && data?.signedUrl) {
          const link = document.createElement("a");
          link.href = data.signedUrl;
          link.download = `${invoice.invoice_number}.pdf`;
          link.target = "_blank";
          document.body.appendChild(link);
          link.click();
          document.body.removeChild(link);
          return;
        }
      }

      const blob = await generateInvoicePdf(invoice);
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `${invoice.invoice_number}.pdf`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
      
      toast.success("Invoice downloaded successfully");
    } catch (error: any) {
      console.error("Error downloading invoice:", error);
      toast.error(error?.message || "Failed to download invoice");
    } finally {
      setIsGenerating(false);
    }
  }, [generateInvoicePdf]);

  return {
    isGenerating,
    generateInvoicePdf,
    downloadInvoice,
  };
}
