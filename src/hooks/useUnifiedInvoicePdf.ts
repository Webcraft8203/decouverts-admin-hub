import { useCallback, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { jsPDF } from "jspdf";
import { toast } from "sonner";

// Colors matching edge function
const PRIMARY_COLOR: [number, number, number] = [234, 171, 28]; // Brand gold #EAAB1C
const TEXT_DARK: [number, number, number] = [33, 33, 33];
const TEXT_GRAY: [number, number, number] = [102, 102, 102];
const TEXT_LIGHT: [number, number, number] = [140, 140, 140];
const BORDER_COLOR: [number, number, number] = [220, 220, 220];
const WARNING_COLOR: [number, number, number] = [255, 152, 0]; // Orange for proforma
const SUCCESS_COLOR: [number, number, number] = [76, 175, 80]; // Green for final

// Company settings (matches edge function defaults)
const COMPANY_SETTINGS = {
  business_name: "Decouverts",
  business_address: "Innovation Hub, Tech Park",
  business_city: "Pune",
  business_state: "Maharashtra",
  business_pincode: "411001",
  business_country: "India",
  business_phone: "+91 98765 43210",
  business_email: "info@decouverts.com",
  business_gstin: "27XXXXX1234X1ZX",
  terms_and_conditions: "1. Goods once sold are non-refundable.\n2. Payment due within 30 days.\n3. Warranty as per product terms.",
};

const formatCurrency = (amount: number): string => {
  return `₹${Number(amount || 0).toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
};

// Fetch and convert logo to base64
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

// Normalize invoice items to handle different formats
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

  // Generate unified PDF that matches edge function template exactly
  const generateInvoicePdf = useCallback(async (invoice: Invoice): Promise<Blob> => {
    const doc = new jsPDF({
      orientation: "portrait",
      unit: "mm",
      format: "a4",
    });

    const pageWidth = doc.internal.pageSize.getWidth();
    const pageHeight = doc.internal.pageSize.getHeight();
    const margin = 15;
    let y = 12;

    const isFinal = invoice.is_final || invoice.invoice_type === "final";
    const isIgst = invoice.is_igst || (invoice.buyer_state?.toLowerCase() !== COMPANY_SETTINGS.business_state.toLowerCase());

    // Normalize items
    const items = (invoice.items || []).map(normalizeItem);

    // Calculate totals
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

    // ==================== HEADER SECTION ====================
    // Header background band
    doc.setFillColor(250, 250, 250);
    doc.rect(0, 0, pageWidth, 45, "F");

    // Try to add logo
    const logoBase64 = await fetchLogoAsBase64();
    if (logoBase64) {
      try {
        doc.addImage(logoBase64, "PNG", margin, y, 35, 18);
      } catch (e) {
        console.error("Failed to add logo:", e);
      }
    }

    // Invoice Type Badge - Top Right
    const badgeWidth = 55;
    const badgeHeight = 20;
    const badgeX = pageWidth - margin - badgeWidth;
    const badgeY = y;

    if (isFinal) {
      doc.setFillColor(SUCCESS_COLOR[0], SUCCESS_COLOR[1], SUCCESS_COLOR[2]);
    } else {
      doc.setFillColor(WARNING_COLOR[0], WARNING_COLOR[1], WARNING_COLOR[2]);
    }
    doc.roundedRect(badgeX, badgeY, badgeWidth, badgeHeight, 3, 3, "F");

    doc.setTextColor(255, 255, 255);
    doc.setFontSize(11);
    doc.setFont("helvetica", "bold");
    const invoiceTypeText = isFinal ? "TAX INVOICE" : "PROFORMA INVOICE";
    doc.text(invoiceTypeText, badgeX + badgeWidth / 2, badgeY + 8, { align: "center" });

    doc.setFontSize(7);
    doc.setFont("helvetica", "normal");
    if (!isFinal) {
      doc.text("Not a Tax Document", badgeX + badgeWidth / 2, badgeY + 14, { align: "center" });
    } else {
      doc.text("GST Compliant • PAID", badgeX + badgeWidth / 2, badgeY + 14, { align: "center" });
    }

    // Company Name
    const companyNameY = y + 22;
    doc.setFontSize(18);
    doc.setTextColor(...PRIMARY_COLOR);
    doc.setFont("helvetica", "bold");
    doc.text(COMPANY_SETTINGS.business_name, margin, companyNameY);

    // Tagline
    doc.setFontSize(8);
    doc.setTextColor(...TEXT_GRAY);
    doc.setFont("helvetica", "italic");
    doc.text("Discovering Future Technologies", margin, companyNameY + 5);

    y = 50;

    // ==================== COMPANY & INVOICE DETAILS ROW ====================
    doc.setFontSize(8);
    doc.setTextColor(...TEXT_GRAY);
    doc.setFont("helvetica", "normal");

    const companyDetails = [
      COMPANY_SETTINGS.business_address,
      `${COMPANY_SETTINGS.business_city}, ${COMPANY_SETTINGS.business_state} - ${COMPANY_SETTINGS.business_pincode}`,
      `Phone: ${COMPANY_SETTINGS.business_phone}`,
      `Email: ${COMPANY_SETTINGS.business_email}`,
      `GSTIN: ${COMPANY_SETTINGS.business_gstin}`,
    ];

    let leftY = y;
    companyDetails.forEach((line) => {
      doc.text(line, margin, leftY);
      leftY += 4;
    });

    // Right side - Invoice Details Box
    const detailsBoxWidth = 70;
    const detailsBoxX = pageWidth - margin - detailsBoxWidth;
    doc.setFillColor(248, 248, 248);
    doc.setDrawColor(...BORDER_COLOR);
    doc.roundedRect(detailsBoxX, y - 2, detailsBoxWidth, 22, 2, 2, "FD");

    const invoiceDate = new Date(invoice.created_at).toLocaleDateString("en-IN", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });

    doc.setFontSize(8);
    doc.setTextColor(...TEXT_DARK);
    const detailsLabelX = detailsBoxX + 4;
    const detailsValueX = detailsBoxX + detailsBoxWidth - 4;

    doc.setFont("helvetica", "bold");
    doc.text(isFinal ? "Invoice No:" : "Proforma No:", detailsLabelX, y + 3);
    doc.setFont("helvetica", "normal");
    doc.text(invoice.invoice_number, detailsValueX, y + 3, { align: "right" });

    doc.setFont("helvetica", "bold");
    doc.text("Date:", detailsLabelX, y + 9);
    doc.setFont("helvetica", "normal");
    doc.text(invoiceDate, detailsValueX, y + 9, { align: "right" });

    if (invoice.order?.order_number) {
      doc.setFont("helvetica", "bold");
      doc.text("Order No:", detailsLabelX, y + 15);
      doc.setFont("helvetica", "normal");
      doc.text(invoice.order.order_number, detailsValueX, y + 15, { align: "right" });
    } else {
      // For admin-created invoices, show status
      doc.setFont("helvetica", "bold");
      doc.text("Status:", detailsLabelX, y + 15);
      doc.setFont("helvetica", "normal");
      doc.setTextColor(SUCCESS_COLOR[0], SUCCESS_COLOR[1], SUCCESS_COLOR[2]);
      doc.text("PAID", detailsValueX, y + 15, { align: "right" });
    }

    y = leftY + 6;

    // Separator line
    const lineColor = isFinal ? SUCCESS_COLOR : PRIMARY_COLOR;
    doc.setDrawColor(lineColor[0], lineColor[1], lineColor[2]);
    doc.setLineWidth(0.8);
    doc.line(margin, y, pageWidth - margin, y);

    y += 8;

    // ==================== BUYER DETAILS (BILL TO / SHIP TO) ====================
    const colWidth = (pageWidth - 2 * margin - 15) / 2;

    // Bill To Header
    doc.setFillColor(248, 248, 248);
    doc.rect(margin, y, colWidth, 6, "F");
    doc.setFontSize(9);
    doc.setTextColor(...PRIMARY_COLOR);
    doc.setFont("helvetica", "bold");
    doc.text("BILL TO", margin + 3, y + 4);

    // Ship To Header
    doc.rect(margin + colWidth + 15, y, colWidth, 6, "F");
    doc.text("SHIP TO", margin + colWidth + 18, y + 4);

    y += 10;

    // Buyer/Ship name
    doc.setFontSize(10);
    doc.setTextColor(...TEXT_DARK);
    doc.setFont("helvetica", "bold");
    const buyerName = invoice.client_name || "Customer";
    doc.text(buyerName, margin, y);
    doc.text(buyerName, margin + colWidth + 15, y);

    y += 5;

    // Address details
    doc.setFontSize(8);
    doc.setFont("helvetica", "normal");
    doc.setTextColor(...TEXT_GRAY);

    if (invoice.client_address) {
      const addressLines = invoice.client_address.split(",").map((s) => s.trim()).filter(Boolean);
      addressLines.forEach((line) => {
        doc.text(line, margin, y);
        doc.text(line, margin + colWidth + 15, y);
        y += 4;
      });
    }

    // Buyer GSTIN if provided
    if (invoice.buyer_gstin) {
      y += 1;
      doc.setTextColor(...PRIMARY_COLOR);
      doc.setFont("helvetica", "bold");
      doc.text(`GSTIN: ${invoice.buyer_gstin}`, margin, y);
      y += 4;
    }

    y += 6;

    // ==================== PRODUCT TABLE ====================
    const headers = isIgst
      ? ["#", "Product Description", "Qty", "Rate", "Taxable", "IGST %", "IGST", "Total"]
      : ["#", "Product Description", "Qty", "Rate", "Taxable", "CGST %", "CGST", "SGST %", "SGST", "Total"];

    const colWidths = isIgst
      ? [8, 52, 12, 22, 25, 14, 18, 25]
      : [8, 38, 10, 18, 20, 11, 14, 11, 14, 22];

    const tableWidth = colWidths.reduce((a, b) => a + b, 0);
    const tableX = margin;

    // Header background
    doc.setFillColor(PRIMARY_COLOR[0], PRIMARY_COLOR[1], PRIMARY_COLOR[2]);
    doc.rect(tableX, y, tableWidth, 8, "F");

    doc.setFontSize(7);
    doc.setTextColor(255, 255, 255);
    doc.setFont("helvetica", "bold");

    let xPos = tableX + 2;
    headers.forEach((header, i) => {
      doc.text(header, xPos, y + 5);
      xPos += colWidths[i];
    });

    y += 8;

    // Table rows
    items.forEach((item, index) => {
      const rowHeight = 7;
      const isAlternate = index % 2 === 1;

      if (isAlternate) {
        doc.setFillColor(248, 248, 248);
        doc.rect(tableX, y, tableWidth, rowHeight, "F");
      }

      doc.setFontSize(7);
      doc.setTextColor(...TEXT_DARK);
      doc.setFont("helvetica", "normal");

      xPos = tableX + 2;
      const gstRate = item.gst_rate || 18;
      const taxableValue = item.taxable_value || (item.quantity * (item.price || 0));
      const cgstRate = isIgst ? 0 : gstRate / 2;
      const sgstRate = isIgst ? 0 : gstRate / 2;
      const igstRate = isIgst ? gstRate : 0;

      if (isIgst) {
        const rowData = [
          (index + 1).toString(),
          (item.description || "").substring(0, 28),
          item.quantity.toString(),
          formatCurrency(item.price || 0),
          formatCurrency(taxableValue),
          `${igstRate}%`,
          formatCurrency(item.igst_amount || 0),
          formatCurrency(item.total || taxableValue),
        ];
        rowData.forEach((cell, i) => {
          doc.text(cell, xPos, y + 5);
          xPos += colWidths[i];
        });
      } else {
        const rowData = [
          (index + 1).toString(),
          (item.description || "").substring(0, 20),
          item.quantity.toString(),
          formatCurrency(item.price || 0),
          formatCurrency(taxableValue),
          `${cgstRate}%`,
          formatCurrency(item.cgst_amount || 0),
          `${sgstRate}%`,
          formatCurrency(item.sgst_amount || 0),
          formatCurrency(item.total || taxableValue),
        ];
        rowData.forEach((cell, i) => {
          doc.text(cell, xPos, y + 5);
          xPos += colWidths[i];
        });
      }

      y += rowHeight;
    });

    // Draw table border
    doc.setDrawColor(...BORDER_COLOR);
    doc.setLineWidth(0.3);
    doc.rect(tableX, y - items.length * 7 - 8, tableWidth, items.length * 7 + 8);

    y += 8;

    // ==================== TOTALS SECTION ====================
    const totalsX = pageWidth - margin - 75;
    const totalsWidth = 75;

    doc.setFillColor(248, 248, 248);
    doc.setDrawColor(...BORDER_COLOR);
    doc.roundedRect(totalsX, y, totalsWidth, 45, 2, 2, "FD");

    doc.setFontSize(8);
    let totalsY = y + 6;

    const totalRows = [
      { label: "Subtotal:", value: formatCurrency(invoice.subtotal) },
      ...(isIgst
        ? [{ label: "IGST:", value: formatCurrency(totalIgst) }]
        : [
            { label: "CGST:", value: formatCurrency(totalCgst) },
            { label: "SGST:", value: formatCurrency(totalSgst) },
          ]),
    ];

    totalRows.forEach((row) => {
      doc.setTextColor(...TEXT_GRAY);
      doc.setFont("helvetica", "normal");
      doc.text(row.label, totalsX + 5, totalsY);
      doc.text(row.value, totalsX + totalsWidth - 5, totalsY, { align: "right" });
      totalsY += 6;
    });

    // Grand Total line
    totalsY += 2;
    doc.setDrawColor(...PRIMARY_COLOR);
    doc.setLineWidth(0.5);
    doc.line(totalsX + 5, totalsY - 2, totalsX + totalsWidth - 5, totalsY - 2);

    doc.setFontSize(10);
    doc.setTextColor(...TEXT_DARK);
    doc.setFont("helvetica", "bold");
    doc.text("Grand Total:", totalsX + 5, totalsY + 4);
    doc.setTextColor(...PRIMARY_COLOR);
    doc.text(formatCurrency(invoice.total_amount), totalsX + totalsWidth - 5, totalsY + 4, { align: "right" });

    y += 52;

    // ==================== GST SUMMARY BOX ====================
    doc.setFillColor(248, 248, 248);
    doc.setDrawColor(...BORDER_COLOR);
    doc.roundedRect(margin, y, pageWidth - 2 * margin, 18, 2, 2, "FD");

    doc.setFontSize(8);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(...TEXT_DARK);
    doc.text("GST Summary", margin + 5, y + 5);

    doc.setFontSize(8);
    doc.setFont("helvetica", "normal");
    doc.setTextColor(...TEXT_GRAY);

    const sellerState = invoice.seller_state || COMPANY_SETTINGS.business_state;
    const buyerState = invoice.buyer_state || "N/A";

    if (isIgst) {
      doc.text(`Supply Type: Inter-State (${sellerState} → ${buyerState})`, margin + 5, y + 10);
      doc.text(`IGST: ${formatCurrency(totalIgst)}`, margin + 5, y + 14);
    } else {
      doc.text(`Supply Type: Intra-State (${sellerState})`, margin + 5, y + 10);
      doc.text(`CGST: ${formatCurrency(totalCgst)} | SGST: ${formatCurrency(totalSgst)}`, margin + 5, y + 14);
    }

    // Seller GSTIN on right
    doc.setFont("helvetica", "bold");
    doc.text(`Seller GSTIN: ${COMPANY_SETTINGS.business_gstin}`, pageWidth - margin - 5, y + 10, { align: "right" });
    if (invoice.buyer_gstin) {
      doc.text(`Buyer GSTIN: ${invoice.buyer_gstin}`, pageWidth - margin - 5, y + 14, { align: "right" });
    }

    y += 25;

    // ==================== TERMS & CONDITIONS ====================
    if (y < pageHeight - 50) {
      doc.setFontSize(8);
      doc.setFont("helvetica", "bold");
      doc.setTextColor(...TEXT_DARK);
      doc.text("Terms & Conditions:", margin, y);

      y += 4;
      doc.setFont("helvetica", "normal");
      doc.setFontSize(7);
      doc.setTextColor(...TEXT_GRAY);

      const terms = COMPANY_SETTINGS.terms_and_conditions.split("\n");
      terms.forEach((term) => {
        if (y < pageHeight - 25) {
          doc.text(term, margin, y);
          y += 3.5;
        }
      });
    }

    // ==================== FOOTER ====================
    y = pageHeight - 15;

    doc.setDrawColor(...BORDER_COLOR);
    doc.setLineWidth(0.3);
    doc.line(margin, y - 5, pageWidth - margin, y - 5);

    doc.setFontSize(9);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(...TEXT_DARK);
    doc.text("Thank you for your business!", pageWidth / 2, y, { align: "center" });

    y += 5;

    doc.setFontSize(7);
    doc.setFont("helvetica", "normal");
    doc.setTextColor(...TEXT_LIGHT);
    doc.text("This is a computer-generated invoice and does not require a signature.", pageWidth / 2, y, { align: "center" });

    return doc.output("blob");
  }, []);

  // Download invoice with unified format
  const downloadInvoice = useCallback(async (invoice: Invoice) => {
    setIsGenerating(true);
    try {
      // First try to download from storage if available
      if (invoice.pdf_url) {
        try {
          const { data: signed, error: signError } = await supabase.storage
            .from("invoices")
            .createSignedUrl(invoice.pdf_url, 60 * 15);

          if (!signError && signed?.signedUrl) {
            const response = await fetch(signed.signedUrl);
            if (response.ok) {
              const blob = await response.blob();
              const url = URL.createObjectURL(blob);
              const link = document.createElement("a");
              link.href = url;
              const prefix = invoice.is_final ? "TAX-INVOICE" : "PROFORMA";
              link.download = `${prefix}_${invoice.invoice_number}.pdf`;
              document.body.appendChild(link);
              link.click();
              document.body.removeChild(link);
              URL.revokeObjectURL(url);
              toast.success("Invoice downloaded!");
              return;
            }
          }
        } catch (storageError) {
          console.log("Storage download failed, generating PDF locally:", storageError);
        }
      }

      // Generate PDF locally using unified template
      const pdfBlob = await generateInvoicePdf(invoice);

      const url = URL.createObjectURL(pdfBlob);
      const link = document.createElement("a");
      link.href = url;
      const prefix = invoice.is_final ? "TAX-INVOICE" : "PROFORMA";
      link.download = `${prefix}_${invoice.invoice_number}.pdf`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
      toast.success("Invoice downloaded!");
    } catch (e: any) {
      console.error("Download error:", e);
      toast.error(e?.message || "Failed to download invoice");
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
