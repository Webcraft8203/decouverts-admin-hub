import { useCallback, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { jsPDF } from "jspdf";
import { toast } from "sonner";

// DECOUVERTES Brand Color Palette
const colors = {
  primary: [28, 28, 28] as [number, number, number],        // Deep charcoal/black
  brand: [35, 35, 35] as [number, number, number],          // Charcoal for headers
  accent: [212, 175, 55] as [number, number, number],       // Gold/yellow accent
  secondary: [85, 85, 85] as [number, number, number],      // Dark gray for text
  muted: [130, 130, 130] as [number, number, number],       // Medium gray for metadata
  border: [220, 220, 220] as [number, number, number],      // Light gray border
  light: [248, 248, 248] as [number, number, number],       // Off-white background
  white: [255, 255, 255] as [number, number, number],
  success: [34, 139, 34] as [number, number, number],       // Forest green
  warning: [205, 133, 63] as [number, number, number],      // Peru/bronze
};

const COMPANY_SETTINGS = {
  business_name: "DECOUVERTES",
  business_address: "Innovation Hub, Tech Park",
  business_city: "Pune",
  business_state: "Maharashtra",
  business_pincode: "411001",
  business_phone: "+91 98765 43210",
  business_email: "info@decouvertes.com",
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
    sku: item.sku || "",
    hsn_code: item.hsn_code || item.hsn || "8471",
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
      
      doc.setDrawColor(...colors.accent);
      doc.setLineWidth(0.5);
      doc.line(margin, footerY - 5, pageWidth - margin, footerY - 5);
      
      doc.setFontSize(7);
      doc.setTextColor(...colors.muted);
      doc.setFont("helvetica", "normal");
      doc.text("This is a computer-generated document and does not require a signature.", margin, footerY);
      doc.text(`Page ${pageNum}`, pageWidth - margin, footerY, { align: "right" });
      
      doc.setFontSize(6);
      doc.setTextColor(...colors.secondary);
      doc.text(`Generated on ${new Date().toLocaleString("en-IN")} | DECOUVERTES`, pageWidth / 2, footerY + 4, { align: "center" });
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
    // Top accent bar with gold
    doc.setFillColor(...colors.primary);
    doc.rect(0, 0, pageWidth, 4, "F");
    doc.setFillColor(...colors.accent);
    doc.rect(0, 4, pageWidth, 1, "F");

    y = 10;

    // Logo and company section
    if (logoBase64) {
      try { doc.addImage(logoBase64, "PNG", margin, y, 30, 15); } catch {}
    }
    
    const companyNameX = margin + (logoBase64 ? 34 : 0);
    doc.setFontSize(22);
    doc.setTextColor(...colors.primary);
    doc.setFont("helvetica", "bold");
    doc.text("DECOUVERTES", companyNameX, y + 9);
    
    doc.setFontSize(8);
    doc.setTextColor(...colors.muted);
    doc.setFont("helvetica", "normal");
    doc.text("Precision Engineering & Innovation", companyNameX, y + 14);

    // Invoice metadata box
    const metaBoxWidth = 62;
    const metaBoxX = pageWidth - margin - metaBoxWidth;
    
    doc.setFillColor(...(isFinal ? colors.accent : colors.secondary));
    doc.roundedRect(metaBoxX, y - 2, metaBoxWidth, 10, 2, 2, "F");
    doc.setFontSize(11);
    doc.setTextColor(...(isFinal ? colors.primary : colors.white));
    doc.setFont("helvetica", "bold");
    doc.text(isFinal ? "TAX INVOICE" : "PROFORMA INVOICE", metaBoxX + metaBoxWidth / 2, y + 5, { align: "center" });

    y += 12;
    doc.setFillColor(...colors.light);
    doc.setDrawColor(...colors.border);
    doc.roundedRect(metaBoxX, y, metaBoxWidth, 20, 2, 2, "FD");

    const metaY = y + 5;
    doc.setFontSize(7);
    doc.setTextColor(...colors.muted);
    doc.setFont("helvetica", "normal");
    doc.text("Invoice No:", metaBoxX + 4, metaY);
    doc.setTextColor(...colors.primary);
    doc.setFont("helvetica", "bold");
    doc.text(invoice.invoice_number, metaBoxX + metaBoxWidth - 4, metaY, { align: "right" });

    const invoiceDate = new Date(invoice.created_at).toLocaleDateString("en-IN", {
      day: "2-digit", month: "short", year: "numeric"
    });
    
    doc.setTextColor(...colors.muted);
    doc.setFont("helvetica", "normal");
    doc.text("Date:", metaBoxX + 4, metaY + 5);
    doc.setTextColor(...colors.primary);
    doc.text(invoiceDate, metaBoxX + metaBoxWidth - 4, metaY + 5, { align: "right" });

    if (invoice.order?.order_number) {
      doc.setTextColor(...colors.muted);
      doc.text("Order No:", metaBoxX + 4, metaY + 10);
      doc.setTextColor(...colors.primary);
      doc.text(invoice.order.order_number, metaBoxX + metaBoxWidth - 4, metaY + 10, { align: "right" });
    } else {
      doc.setTextColor(...colors.success);
      doc.setFont("helvetica", "bold");
      doc.text("Status: PAID", metaBoxX + metaBoxWidth - 4, metaY + 10, { align: "right" });
    }

    y = 44;
    doc.setDrawColor(...colors.accent);
    doc.setLineWidth(1);
    doc.line(margin, y, pageWidth - margin, y);

    y += 7;

    // ==================== SELLER & BUYER SECTION ====================
    const boxWidth = (pageWidth - 2 * margin - 12) / 2;
    const boxHeight = 40;

    // SELLER BOX
    doc.setFillColor(...colors.light);
    doc.setDrawColor(...colors.border);
    doc.setLineWidth(0.3);
    doc.roundedRect(margin, y, boxWidth, boxHeight, 3, 3, "FD");

    doc.setFillColor(...colors.primary);
    doc.roundedRect(margin, y, boxWidth, 8, 3, 3, "F");
    doc.setFillColor(...colors.light);
    doc.rect(margin, y + 5, boxWidth, 3, "F");
    
    doc.setFontSize(8);
    doc.setTextColor(255, 255, 255);
    doc.setFont("helvetica", "bold");
    doc.text("BILLED FROM", margin + 5, y + 5.5);

    doc.setFontSize(11);
    doc.setTextColor(...colors.primary);
    doc.setFont("helvetica", "bold");
    doc.text("DECOUVERTES", margin + 5, y + 16);

    doc.setFontSize(7);
    doc.setTextColor(...colors.secondary);
    doc.setFont("helvetica", "normal");
    doc.text(COMPANY_SETTINGS.business_address, margin + 5, y + 21);
    doc.text(`${COMPANY_SETTINGS.business_city}, ${COMPANY_SETTINGS.business_state} - ${COMPANY_SETTINGS.business_pincode}`, margin + 5, y + 25);
    doc.setTextColor(...colors.accent);
    doc.setFont("helvetica", "bold");
    doc.text(`GSTIN: ${COMPANY_SETTINGS.business_gstin}`, margin + 5, y + 30);
    doc.setTextColor(...colors.secondary);
    doc.setFont("helvetica", "normal");
    doc.text(`Phone: ${COMPANY_SETTINGS.business_phone}`, margin + 5, y + 35);

    // BUYER BOX
    const buyerX = margin + boxWidth + 12;
    doc.setFillColor(...colors.light);
    doc.setDrawColor(...colors.border);
    doc.roundedRect(buyerX, y, boxWidth, boxHeight, 3, 3, "FD");

    doc.setFillColor(...colors.accent);
    doc.roundedRect(buyerX, y, boxWidth, 8, 3, 3, "F");
    doc.setFillColor(...colors.light);
    doc.rect(buyerX, y + 5, boxWidth, 3, "F");
    
    doc.setFontSize(8);
    doc.setTextColor(...colors.primary);
    doc.setFont("helvetica", "bold");
    doc.text("BILLED TO", buyerX + 5, y + 5.5);

    doc.setFontSize(11);
    doc.setTextColor(...colors.primary);
    doc.setFont("helvetica", "bold");
    doc.text((invoice.client_name || "Customer").toUpperCase(), buyerX + 5, y + 16);

    doc.setFontSize(7);
    doc.setTextColor(...colors.secondary);
    doc.setFont("helvetica", "normal");
    
    if (invoice.client_address) {
      const addressLines = invoice.client_address.split(",").map(s => s.trim()).filter(Boolean);
      let addrY = y + 21;
      addressLines.slice(0, 3).forEach((line) => {
        doc.text(line, buyerX + 5, addrY);
        addrY += 4;
      });
    }
    
    if (invoice.buyer_gstin) {
      doc.setTextColor(...colors.accent);
      doc.setFont("helvetica", "bold");
      doc.text(`GSTIN: ${invoice.buyer_gstin}`, buyerX + 5, y + 35);
    }

    y += boxHeight + 8;

    // ==================== ITEMS TABLE ====================
    const tableWidth = pageWidth - 2 * margin;
    
    doc.setFillColor(...colors.primary);
    doc.rect(margin, y, tableWidth, 9, "F");
    
    doc.setFontSize(7);
    doc.setTextColor(255, 255, 255);
    doc.setFont("helvetica", "bold");

    const cols = isIgst 
      ? { sno: margin + 4, desc: margin + 14, qty: margin + 102, rate: margin + 118, taxable: margin + 138, igst: margin + 158, total: pageWidth - margin - 4 }
      : { sno: margin + 4, desc: margin + 12, qty: margin + 74, rate: margin + 90, taxable: margin + 108, cgst: margin + 128, sgst: margin + 148, total: pageWidth - margin - 4 };

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
        doc.setFillColor(252, 252, 252);
      } else {
        doc.setFillColor(255, 255, 255);
      }
      doc.rect(margin, y, tableWidth, rowH, "F");

      doc.setDrawColor(...colors.border);
      doc.setLineWidth(0.1);
      doc.line(margin, y + rowH, pageWidth - margin, y + rowH);

      doc.setFontSize(7);
      doc.setTextColor(...colors.secondary);
      doc.setFont("helvetica", "normal");

      const desc = (item.description || "").substring(0, isIgst ? 52 : 36);
      const gstRate = item.gst_rate || 18;

      if (isIgst) {
        doc.text(String(idx + 1), cols.sno, y + 5.5);
        doc.setTextColor(...colors.primary);
        doc.setFont("helvetica", "bold");
        doc.text(desc, cols.desc, y + 5.5);
        doc.setTextColor(...colors.secondary);
        doc.setFont("helvetica", "normal");
        doc.text(String(item.quantity), cols.qty, y + 5.5);
        doc.text(formatCurrency(item.price || 0), cols.rate, y + 5.5);
        doc.text(formatCurrency(item.taxable_value || 0), cols.taxable, y + 5.5);
        doc.setTextColor(...colors.accent);
        doc.text(`${gstRate}%`, cols.igst, y + 5.5);
        doc.setTextColor(...colors.primary);
        doc.setFont("helvetica", "bold");
        doc.text(formatCurrency(item.total || 0), cols.total, y + 5.5, { align: "right" });
      } else {
        doc.text(String(idx + 1), cols.sno, y + 5.5);
        doc.setTextColor(...colors.primary);
        doc.setFont("helvetica", "bold");
        doc.text(desc, cols.desc, y + 5.5);
        doc.setTextColor(...colors.secondary);
        doc.setFont("helvetica", "normal");
        doc.text(String(item.quantity), cols.qty, y + 5.5);
        doc.text(formatCurrency(item.price || 0), cols.rate, y + 5.5);
        doc.text(formatCurrency(item.taxable_value || 0), cols.taxable, y + 5.5);
        doc.setTextColor(...colors.accent);
        doc.text(`${gstRate / 2}%`, cols.cgst, y + 5.5);
        doc.text(`${gstRate / 2}%`, cols.sgst, y + 5.5);
        doc.setTextColor(...colors.primary);
        doc.setFont("helvetica", "bold");
        doc.text(formatCurrency(item.total || 0), cols.total, y + 5.5, { align: "right" });
      }

      y += rowH;
    });

    y += 8;
    checkPageBreak(65);

    // ==================== TOTALS & GST SUMMARY ====================
    const summaryHeight = isIgst ? 52 : 58;
    const totalsWidth = 85;
    const gstWidth = pageWidth - 2 * margin - totalsWidth - 12;
    
    // GST SUMMARY BOX (Left)
    doc.setFillColor(...colors.light);
    doc.setDrawColor(...colors.border);
    doc.setLineWidth(0.3);
    doc.roundedRect(margin, y, gstWidth, summaryHeight, 3, 3, "FD");

    doc.setFontSize(9);
    doc.setTextColor(...colors.primary);
    doc.setFont("helvetica", "bold");
    doc.text("GST TAX SUMMARY", margin + 6, y + 8);

    let gstY = y + 14;
    const sellerState = invoice.seller_state || COMPANY_SETTINGS.business_state;
    const buyerState = invoice.buyer_state || "N/A";

    doc.setFontSize(7);
    doc.setTextColor(...colors.muted);
    doc.setFont("helvetica", "normal");
    doc.text(`Supply Type:`, margin + 6, gstY);
    doc.setTextColor(...colors.primary);
    doc.setFont("helvetica", "bold");
    doc.text(isIgst ? "Inter-State" : "Intra-State", margin + 32, gstY);
    
    gstY += 5;
    doc.setTextColor(...colors.muted);
    doc.setFont("helvetica", "normal");
    doc.text(`Place of Supply:`, margin + 6, gstY);
    doc.setTextColor(...colors.primary);
    doc.text(`${sellerState}${isIgst ? ` → ${buyerState}` : ""}`, margin + 32, gstY);

    gstY += 8;
    
    doc.setFillColor(...colors.primary);
    doc.rect(margin + 4, gstY, gstWidth - 8, 7, "F");
    doc.setFontSize(6);
    doc.setTextColor(255, 255, 255);
    doc.setFont("helvetica", "bold");
    doc.text("TAX TYPE", margin + 8, gstY + 5);
    doc.text("AMOUNT", margin + gstWidth - 12, gstY + 5, { align: "right" });

    gstY += 8;

    if (isIgst) {
      doc.setFontSize(7);
      doc.setTextColor(...colors.secondary);
      doc.setFont("helvetica", "normal");
      doc.text("IGST @ Various Rates", margin + 8, gstY + 5);
      doc.text(formatCurrency(totalIgst), margin + gstWidth - 12, gstY + 5, { align: "right" });
      gstY += 8;
    } else {
      doc.setFontSize(7);
      doc.setTextColor(...colors.secondary);
      doc.setFont("helvetica", "normal");
      doc.text("CGST @ Various Rates", margin + 8, gstY + 5);
      doc.text(formatCurrency(totalCgst), margin + gstWidth - 12, gstY + 5, { align: "right" });
      gstY += 6;
      doc.text("SGST @ Various Rates", margin + 8, gstY + 5);
      doc.text(formatCurrency(totalSgst), margin + gstWidth - 12, gstY + 5, { align: "right" });
      gstY += 8;
    }

    doc.setDrawColor(...colors.accent);
    doc.setLineWidth(0.5);
    doc.line(margin + 8, gstY + 2, margin + gstWidth - 8, gstY + 2);

    doc.setFont("helvetica", "bold");
    doc.setTextColor(...colors.primary);
    doc.text("TOTAL TAX", margin + 8, gstY + 8);
    doc.setTextColor(...colors.accent);
    doc.text(formatCurrency(totalCgst + totalSgst + totalIgst), margin + gstWidth - 12, gstY + 8, { align: "right" });

    // TOTALS BOX (Right)
    const totalsX = pageWidth - margin - totalsWidth;
    doc.setFillColor(...colors.primary);
    doc.roundedRect(totalsX, y, totalsWidth, summaryHeight, 3, 3, "F");

    let totalsY = y + 10;
    const labelX = totalsX + 6;
    const valueX = totalsX + totalsWidth - 6;

    doc.setFontSize(8);
    doc.setTextColor(255, 255, 255);
    doc.setFont("helvetica", "normal");
    
    doc.text("Subtotal:", labelX, totalsY);
    doc.text(formatCurrency(invoice.subtotal), valueX, totalsY, { align: "right" });
    totalsY += 7;

    if (isIgst) {
      doc.text("IGST:", labelX, totalsY);
      doc.text(formatCurrency(totalIgst), valueX, totalsY, { align: "right" });
      totalsY += 7;
    } else {
      doc.text("CGST:", labelX, totalsY);
      doc.text(formatCurrency(totalCgst), valueX, totalsY, { align: "right" });
      totalsY += 6;
      doc.text("SGST:", labelX, totalsY);
      doc.text(formatCurrency(totalSgst), valueX, totalsY, { align: "right" });
      totalsY += 7;
    }

    totalsY += 5;

    // Grand Total with gold highlight
    doc.setFillColor(...colors.accent);
    doc.roundedRect(totalsX + 4, totalsY - 2, totalsWidth - 8, 13, 2, 2, "F");

    doc.setFontSize(10);
    doc.setTextColor(...colors.primary);
    doc.setFont("helvetica", "bold");
    doc.text("GRAND TOTAL", labelX + 2, totalsY + 7);
    doc.text(formatCurrency(invoice.total_amount), valueX - 2, totalsY + 7, { align: "right" });

    y += summaryHeight + 12;

    // ==================== TERMS SECTION ====================
    if (y < pageHeight - 40) {
      doc.setFontSize(8);
      doc.setTextColor(...colors.primary);
      doc.setFont("helvetica", "bold");
      doc.text("Terms & Conditions", margin, y);
      
      y += 5;
      doc.setFontSize(6);
      doc.setTextColor(...colors.muted);
      doc.setFont("helvetica", "normal");
      const terms = COMPANY_SETTINGS.terms_and_conditions.split("\n");
      terms.forEach((term) => {
        doc.text(term, margin, y);
        y += 3.5;
      });
    }

    // Add footer
    addPageFooter(currentPage);

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

      if (uploadError) {
        throw new Error("Failed to upload PDF");
      }

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
