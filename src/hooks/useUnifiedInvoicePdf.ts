import { useCallback, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { jsPDF } from "jspdf";
import { toast } from "sonner";

// Professional color palette - matching edge function
const colors = {
  primary: [45, 55, 72] as [number, number, number],
  secondary: [71, 85, 105] as [number, number, number],
  accent: [16, 185, 129] as [number, number, number],
  muted: [148, 163, 184] as [number, number, number],
  border: [226, 232, 240] as [number, number, number],
  light: [248, 250, 252] as [number, number, number],
  dark: [30, 41, 59] as [number, number, number],
  warning: [245, 158, 11] as [number, number, number],
  success: [34, 197, 94] as [number, number, number],
};

// Company settings
const COMPANY_SETTINGS = {
  business_name: "Decouverts",
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
    const margin = 12;
    let y = margin;

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

    // Fetch logo
    const logoBase64 = await fetchLogoAsBase64();

    // ==================== HEADER ====================
    if (logoBase64) {
      try { doc.addImage(logoBase64, "PNG", margin, y, 32, 16); } catch {}
    }
    
    doc.setFontSize(16);
    doc.setTextColor(...colors.dark);
    doc.setFont("helvetica", "bold");
    doc.text(COMPANY_SETTINGS.business_name, margin + (logoBase64 ? 36 : 0), y + 8);
    
    doc.setFontSize(8);
    doc.setTextColor(...colors.muted);
    doc.setFont("helvetica", "normal");
    doc.text("Discovering Future Technologies", margin + (logoBase64 ? 36 : 0), y + 13);

    // Invoice type badge
    const rightX = pageWidth - margin;
    doc.setFillColor(...(isFinal ? colors.success : colors.warning));
    doc.roundedRect(rightX - 50, y, 50, 8, 1, 1, "F");
    doc.setFontSize(9);
    doc.setTextColor(255, 255, 255);
    doc.setFont("helvetica", "bold");
    doc.text(isFinal ? "TAX INVOICE" : "PROFORMA", rightX - 25, y + 5.5, { align: "center" });

    y += 12;
    doc.setFontSize(8);
    doc.setTextColor(...colors.secondary);
    doc.setFont("helvetica", "normal");
    doc.text(`Invoice #: ${invoice.invoice_number}`, rightX, y, { align: "right" });
    
    const invoiceDate = new Date(invoice.created_at).toLocaleDateString("en-IN", {
      day: "2-digit", month: "short", year: "numeric"
    });
    doc.text(`Date: ${invoiceDate}`, rightX, y + 4, { align: "right" });
    
    if (invoice.order?.order_number) {
      doc.text(`Order: ${invoice.order.order_number}`, rightX, y + 8, { align: "right" });
    } else {
      doc.setTextColor(...colors.success);
      doc.setFont("helvetica", "bold");
      doc.text("Status: PAID", rightX, y + 8, { align: "right" });
    }

    y = 35;
    doc.setDrawColor(...colors.border);
    doc.setLineWidth(0.3);
    doc.line(margin, y, pageWidth - margin, y);

    y += 6;

    // ==================== SELLER & BUYER ====================
    const halfWidth = (pageWidth - 2 * margin - 8) / 2;

    // Seller
    doc.setFillColor(...colors.light);
    doc.roundedRect(margin, y, halfWidth, 32, 2, 2, "F");
    
    doc.setFontSize(7);
    doc.setTextColor(...colors.muted);
    doc.setFont("helvetica", "bold");
    doc.text("FROM", margin + 4, y + 5);
    
    doc.setFontSize(9);
    doc.setTextColor(...colors.dark);
    doc.text(COMPANY_SETTINGS.business_name, margin + 4, y + 10);
    
    doc.setFontSize(7);
    doc.setTextColor(...colors.secondary);
    doc.setFont("helvetica", "normal");
    doc.text(COMPANY_SETTINGS.business_address, margin + 4, y + 15);
    doc.text(`${COMPANY_SETTINGS.business_city}, ${COMPANY_SETTINGS.business_state} - ${COMPANY_SETTINGS.business_pincode}`, margin + 4, y + 19);
    doc.text(`GSTIN: ${COMPANY_SETTINGS.business_gstin}`, margin + 4, y + 23);
    doc.text(`Phone: ${COMPANY_SETTINGS.business_phone}`, margin + 4, y + 27);

    // Buyer
    const buyerX = margin + halfWidth + 8;
    doc.setFillColor(...colors.light);
    doc.roundedRect(buyerX, y, halfWidth, 32, 2, 2, "F");
    
    doc.setFontSize(7);
    doc.setTextColor(...colors.muted);
    doc.setFont("helvetica", "bold");
    doc.text("BILL TO", buyerX + 4, y + 5);
    
    doc.setFontSize(9);
    doc.setTextColor(...colors.dark);
    doc.text(invoice.client_name || "Customer", buyerX + 4, y + 10);
    
    doc.setFontSize(7);
    doc.setTextColor(...colors.secondary);
    doc.setFont("helvetica", "normal");
    
    if (invoice.client_address) {
      const addressLines = invoice.client_address.split(",").map(s => s.trim()).filter(Boolean);
      addressLines.slice(0, 3).forEach((line, i) => {
        doc.text(line, buyerX + 4, y + 15 + i * 4);
      });
    }
    
    if (invoice.buyer_gstin) {
      doc.setTextColor(...colors.accent);
      doc.setFont("helvetica", "bold");
      doc.text(`GSTIN: ${invoice.buyer_gstin}`, buyerX + 4, y + 27);
    }

    y += 38;

    // ==================== ITEMS TABLE ====================
    const tableWidth = pageWidth - 2 * margin;
    
    doc.setFillColor(...colors.primary);
    doc.rect(margin, y, tableWidth, 7, "F");
    
    doc.setFontSize(6.5);
    doc.setTextColor(255, 255, 255);
    doc.setFont("helvetica", "bold");

    const cols = isIgst 
      ? { sno: margin + 2, desc: margin + 12, qty: margin + 100, rate: margin + 115, taxable: margin + 135, igst: margin + 155, total: pageWidth - margin - 2 }
      : { sno: margin + 2, desc: margin + 10, qty: margin + 78, rate: margin + 92, taxable: margin + 108, cgst: margin + 128, sgst: margin + 148, total: pageWidth - margin - 2 };

    if (isIgst) {
      doc.text("#", cols.sno, y + 4.5);
      doc.text("Description", cols.desc, y + 4.5);
      doc.text("Qty", cols.qty, y + 4.5);
      doc.text("Rate", cols.rate, y + 4.5);
      doc.text("Taxable", cols.taxable, y + 4.5);
      doc.text("IGST", cols.igst, y + 4.5);
      doc.text("Total", cols.total, y + 4.5, { align: "right" });
    } else {
      doc.text("#", cols.sno, y + 4.5);
      doc.text("Description", cols.desc, y + 4.5);
      doc.text("Qty", cols.qty, y + 4.5);
      doc.text("Rate", cols.rate, y + 4.5);
      doc.text("Taxable", cols.taxable, y + 4.5);
      doc.text("CGST", cols.cgst, y + 4.5);
      doc.text("SGST", cols.sgst, y + 4.5);
      doc.text("Total", cols.total, y + 4.5, { align: "right" });
    }

    y += 7;

    items.forEach((item, idx) => {
      const rowH = 6;
      if (idx % 2 === 0) {
        doc.setFillColor(252, 252, 252);
        doc.rect(margin, y, tableWidth, rowH, "F");
      }

      doc.setFontSize(6.5);
      doc.setTextColor(...colors.dark);
      doc.setFont("helvetica", "normal");

      const desc = (item.description || "").substring(0, isIgst ? 50 : 40);
      const gstRate = item.gst_rate || 18;

      if (isIgst) {
        doc.text(String(idx + 1), cols.sno, y + 4);
        doc.text(desc, cols.desc, y + 4);
        doc.text(String(item.quantity), cols.qty, y + 4);
        doc.text(formatCurrency(item.price || 0), cols.rate, y + 4);
        doc.text(formatCurrency(item.taxable_value || 0), cols.taxable, y + 4);
        doc.text(`${gstRate}%`, cols.igst, y + 4);
        doc.text(formatCurrency(item.total || 0), cols.total, y + 4, { align: "right" });
      } else {
        doc.text(String(idx + 1), cols.sno, y + 4);
        doc.text(desc, cols.desc, y + 4);
        doc.text(String(item.quantity), cols.qty, y + 4);
        doc.text(formatCurrency(item.price || 0), cols.rate, y + 4);
        doc.text(formatCurrency(item.taxable_value || 0), cols.taxable, y + 4);
        doc.text(`${gstRate / 2}%`, cols.cgst, y + 4);
        doc.text(`${gstRate / 2}%`, cols.sgst, y + 4);
        doc.text(formatCurrency(item.total || 0), cols.total, y + 4, { align: "right" });
      }

      y += rowH;
    });

    doc.setDrawColor(...colors.border);
    doc.setLineWidth(0.3);
    doc.line(margin, y, pageWidth - margin, y);

    y += 8;

    // ==================== TOTALS ====================
    const totalsWidth = 75;
    const totalsX = pageWidth - margin - totalsWidth;
    
    doc.setFillColor(...colors.light);
    doc.roundedRect(totalsX, y, totalsWidth, isIgst ? 38 : 44, 2, 2, "F");

    let totalsY = y + 6;
    const labelX = totalsX + 4;
    const valueX = totalsX + totalsWidth - 4;

    doc.setFontSize(7);

    doc.setTextColor(...colors.secondary);
    doc.setFont("helvetica", "normal");
    doc.text("Subtotal", labelX, totalsY);
    doc.setTextColor(...colors.dark);
    doc.text(formatCurrency(invoice.subtotal), valueX, totalsY, { align: "right" });
    totalsY += 5;

    if (isIgst) {
      doc.setTextColor(...colors.secondary);
      doc.text("IGST", labelX, totalsY);
      doc.setTextColor(...colors.dark);
      doc.text(formatCurrency(totalIgst), valueX, totalsY, { align: "right" });
      totalsY += 5;
    } else {
      doc.setTextColor(...colors.secondary);
      doc.text("CGST", labelX, totalsY);
      doc.setTextColor(...colors.dark);
      doc.text(formatCurrency(totalCgst), valueX, totalsY, { align: "right" });
      totalsY += 5;
      
      doc.setTextColor(...colors.secondary);
      doc.text("SGST", labelX, totalsY);
      doc.setTextColor(...colors.dark);
      doc.text(formatCurrency(totalSgst), valueX, totalsY, { align: "right" });
      totalsY += 5;
    }

    totalsY += 4;
    doc.setDrawColor(...colors.accent);
    doc.setLineWidth(0.5);
    doc.line(labelX, totalsY - 2, valueX, totalsY - 2);

    doc.setFontSize(9);
    doc.setTextColor(...colors.dark);
    doc.setFont("helvetica", "bold");
    doc.text("GRAND TOTAL", labelX, totalsY + 3);
    doc.setTextColor(...colors.accent);
    doc.text(formatCurrency(invoice.total_amount), valueX, totalsY + 3, { align: "right" });

    // GST Summary (left side)
    const gstBoxHeight = isIgst ? 38 : 44;
    doc.setFillColor(252, 252, 252);
    doc.setDrawColor(...colors.border);
    doc.roundedRect(margin, y, totalsX - margin - 6, gstBoxHeight, 2, 2, "FD");

    let gstY = y + 6;
    doc.setFontSize(8);
    doc.setTextColor(...colors.primary);
    doc.setFont("helvetica", "bold");
    doc.text("TAX SUMMARY", margin + 4, gstY);
    gstY += 6;

    doc.setFontSize(7);
    doc.setTextColor(...colors.secondary);
    doc.setFont("helvetica", "normal");
    const sellerState = invoice.seller_state || COMPANY_SETTINGS.business_state;
    const buyerState = invoice.buyer_state || "N/A";
    doc.text(`Supply Type: ${isIgst ? "Inter-State" : "Intra-State"} (${sellerState}${isIgst ? ` → ${buyerState}` : ""})`, margin + 4, gstY);
    gstY += 5;
    
    if (isIgst) {
      doc.text(`IGST @ Various Rates: ${formatCurrency(totalIgst)}`, margin + 4, gstY);
    } else {
      doc.text(`CGST @ Various Rates: ${formatCurrency(totalCgst)}`, margin + 4, gstY);
      gstY += 5;
      doc.text(`SGST @ Various Rates: ${formatCurrency(totalSgst)}`, margin + 4, gstY);
    }
    gstY += 6;
    doc.setFont("helvetica", "bold");
    doc.text(`Total Tax: ${formatCurrency(totalCgst + totalSgst + totalIgst)}`, margin + 4, gstY);

    y += gstBoxHeight + 6;

    // Proforma notice
    if (!isFinal) {
      doc.setFillColor(255, 251, 235);
      doc.setDrawColor(...colors.warning);
      doc.setLineWidth(0.5);
      doc.roundedRect(margin, y, pageWidth - 2 * margin, 10, 2, 2, "FD");
      
      doc.setFontSize(7);
      doc.setTextColor(...colors.warning);
      doc.setFont("helvetica", "bold");
      doc.text("⚠ PROFORMA INVOICE", margin + 4, y + 4);
      doc.setFont("helvetica", "normal");
      doc.setTextColor(...colors.secondary);
      doc.text("This is not a tax document. Final GST Tax Invoice will be issued upon delivery.", margin + 4, y + 7.5);
      y += 14;
    }

    // Terms
    doc.setFontSize(7);
    doc.setTextColor(...colors.primary);
    doc.setFont("helvetica", "bold");
    doc.text("Terms & Conditions", margin, y);
    y += 4;

    doc.setFontSize(6);
    doc.setTextColor(...colors.muted);
    doc.setFont("helvetica", "normal");
    const terms = COMPANY_SETTINGS.terms_and_conditions.split("\n");
    terms.forEach((term) => {
      if (y < pageHeight - 20) {
        doc.text(term, margin, y);
        y += 3;
      }
    });

    // Footer
    y = pageHeight - 14;
    doc.setDrawColor(...colors.border);
    doc.setLineWidth(0.2);
    doc.line(margin, y - 4, pageWidth - margin, y - 4);

    doc.setFontSize(8);
    doc.setTextColor(...colors.accent);
    doc.setFont("helvetica", "bold");
    doc.text("Thank you for your business!", pageWidth / 2, y, { align: "center" });

    doc.setFontSize(6);
    doc.setTextColor(...colors.muted);
    doc.setFont("helvetica", "normal");
    const footerText = isFinal 
      ? "This is a computer-generated Tax Invoice and does not require a signature."
      : "This is a computer-generated Proforma Invoice. Not valid for tax purposes.";
    doc.text(footerText, pageWidth / 2, y + 4, { align: "center" });
    doc.text(`Generated on ${new Date().toLocaleString("en-IN")}`, pageWidth / 2, y + 7, { align: "center" });

    return doc.output("blob");
  }, []);

  const downloadInvoice = useCallback(async (invoice: Invoice) => {
    setIsGenerating(true);
    try {
      // Try to get existing PDF first
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

      // Generate PDF client-side
      const blob = await generateInvoicePdf(invoice);
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `${invoice.invoice_number}.pdf`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    } catch (error) {
      console.error("Error downloading invoice:", error);
      toast.error("Failed to download invoice");
    } finally {
      setIsGenerating(false);
    }
  }, [generateInvoicePdf]);

  return { generateInvoicePdf, downloadInvoice, isGenerating };
}
