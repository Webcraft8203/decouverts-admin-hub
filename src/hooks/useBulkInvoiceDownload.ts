import { useState, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { jsPDF } from "jspdf";
import { toast } from "sonner";
import { format } from "date-fns";

// Invoice item interface
interface InvoiceItem {
  description: string;
  quantity: number;
  price: number;
  gst_rate?: number;
  taxable_value?: number;
  cgst_amount?: number;
  sgst_amount?: number;
  igst_amount?: number;
  total?: number;
}

interface Invoice {
  id: string;
  invoice_number: string;
  invoice_type: string;
  is_final: boolean;
  client_name: string;
  client_email: string | null;
  client_address: string | null;
  total_amount: number;
  subtotal: number;
  tax_amount: number;
  items: InvoiceItem[];
  notes: string | null;
  pdf_url: string | null;
  created_at: string;
  delivery_date: string | null;
  order_id: string | null;
  buyer_state?: string | null;
  seller_state?: string | null;
  is_igst?: boolean | null;
  cgst_amount?: number | null;
  sgst_amount?: number | null;
  igst_amount?: number | null;
  buyer_gstin?: string | null;
}

// Company settings - matches invoice generation
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

const DEFAULT_GST_RATE = 18;

// Normalize invoice items
function normalizeInvoiceItem(item: any): InvoiceItem {
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

// Format currency
const formatCurrency = (amount: number): string => {
  return `₹${Number(amount || 0).toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
};

// Generate single invoice PDF
function generateInvoicePdf(invoice: Invoice): Blob {
  const doc = new jsPDF({
    orientation: "portrait",
    unit: "mm",
    format: "a4",
  });

  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const margin = 15;
  let y = 15;

  // Colors
  const primaryColor: [number, number, number] = [234, 171, 28];
  const textDark: [number, number, number] = [33, 33, 33];
  const textGray: [number, number, number] = [102, 102, 102];
  const textLight: [number, number, number] = [128, 128, 128];
  const borderColor: [number, number, number] = [220, 220, 220];
  const successColor: [number, number, number] = [76, 175, 80];

  const isFinal = invoice.is_final || invoice.invoice_type === "final";

  // Header
  doc.setFontSize(22);
  doc.setTextColor(...primaryColor);
  doc.setFont("helvetica", "bold");
  doc.text(COMPANY_SETTINGS.business_name, margin, y + 8);

  // Invoice type box
  const boxWidth = 65;
  const boxHeight = 24;
  const boxX = pageWidth - margin - boxWidth;
  const boxY = y - 2;
  
  if (isFinal) {
    doc.setFillColor(76, 175, 80);
  } else {
    doc.setFillColor(255, 152, 0);
  }
  doc.roundedRect(boxX, boxY, boxWidth, boxHeight, 2, 2, "F");
  
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(12);
  doc.setFont("helvetica", "bold");
  const invoiceTypeText = isFinal ? "TAX INVOICE" : "PROFORMA INVOICE";
  doc.text(invoiceTypeText, boxX + boxWidth / 2, boxY + 10, { align: "center" });
  
  doc.setFontSize(7);
  doc.setFont("helvetica", "normal");
  doc.text(isFinal ? "GST Compliant" : "Temporary - Not a Tax Document", boxX + boxWidth / 2, boxY + 17, { align: "center" });

  y += 12;

  // Company tagline
  doc.setFontSize(9);
  doc.setTextColor(...textGray);
  doc.setFont("helvetica", "normal");
  doc.text("Discovering Future Technologies", margin, y);

  y += 6;

  // Company address
  doc.setFontSize(8);
  const companyAddressLines = [
    COMPANY_SETTINGS.business_address,
    `${COMPANY_SETTINGS.business_city}, ${COMPANY_SETTINGS.business_state} - ${COMPANY_SETTINGS.business_pincode}`,
    `Phone: ${COMPANY_SETTINGS.business_phone} | Email: ${COMPANY_SETTINGS.business_email}`,
    `GSTIN: ${COMPANY_SETTINGS.business_gstin}`,
  ];
  companyAddressLines.forEach((line) => {
    doc.text(line, margin, y);
    y += 4;
  });

  // Invoice details
  const invoiceDate = new Date(invoice.created_at).toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });

  const invoiceDetailsY = boxY + boxHeight + 8;
  const rightColX = pageWidth - margin - 55;
  
  doc.setFontSize(8);
  doc.setTextColor(...textDark);
  
  doc.setFont("helvetica", "bold");
  doc.text(isFinal ? "Invoice No:" : "Proforma No:", rightColX, invoiceDetailsY);
  doc.setFont("helvetica", "normal");
  doc.text(invoice.invoice_number, pageWidth - margin, invoiceDetailsY, { align: "right" });

  doc.setFont("helvetica", "bold");
  doc.text("Date:", rightColX, invoiceDetailsY + 5);
  doc.setFont("helvetica", "normal");
  doc.text(invoiceDate, pageWidth - margin, invoiceDetailsY + 5, { align: "right" });

  y += 5;

  // Separator
  if (isFinal) {
    doc.setDrawColor(successColor[0], successColor[1], successColor[2]);
  } else {
    doc.setDrawColor(primaryColor[0], primaryColor[1], primaryColor[2]);
  }
  doc.setLineWidth(0.8);
  doc.line(margin, y, pageWidth - margin, y);

  y += 10;

  // Buyer details
  doc.setFontSize(9);
  doc.setTextColor(...primaryColor);
  doc.setFont("helvetica", "bold");
  doc.text("BILL TO", margin, y);

  y += 5;

  doc.setFontSize(11);
  doc.setTextColor(...textDark);
  doc.setFont("helvetica", "bold");
  doc.text(invoice.client_name, margin, y);

  y += 5;

  doc.setFontSize(9);
  doc.setFont("helvetica", "normal");
  doc.setTextColor(...textGray);

  if (invoice.client_address) {
    doc.text(invoice.client_address, margin, y);
    y += 4;
  }
  if (invoice.client_email) {
    doc.text(`Email: ${invoice.client_email}`, margin, y);
    y += 4;
  }
  if (invoice.buyer_state) {
    doc.text(`State: ${invoice.buyer_state}`, margin, y);
    y += 4;
  }
  if (invoice.buyer_gstin) {
    doc.setTextColor(...primaryColor);
    doc.setFont("helvetica", "bold");
    doc.text(`GSTIN: ${invoice.buyer_gstin}`, margin, y);
    y += 4;
  }

  y += 6;

  // Product table
  const isIgst = invoice.is_igst || (invoice.buyer_state?.toLowerCase() !== COMPANY_SETTINGS.business_state.toLowerCase());

  const headers = isIgst
    ? ["#", "Description", "Qty", "Rate (₹)", "Taxable", "IGST", "Total"]
    : ["#", "Description", "Qty", "Rate (₹)", "Taxable", "CGST", "SGST", "Total"];

  const colWidths = isIgst ? [8, 55, 15, 25, 25, 25, 27] : [8, 45, 12, 22, 22, 22, 22, 27];

  const tableWidth = colWidths.reduce((a, b) => a + b, 0);
  const tableX = margin;

  // Header background
  doc.setFillColor(248, 248, 248);
  doc.rect(tableX, y, tableWidth, 8, "F");

  // Header border
  doc.setDrawColor(primaryColor[0], primaryColor[1], primaryColor[2]);
  doc.setLineWidth(0.5);
  doc.line(tableX, y + 8, tableX + tableWidth, y + 8);

  // Header text
  doc.setFontSize(7);
  doc.setTextColor(...textGray);
  doc.setFont("helvetica", "bold");

  let colX = tableX;
  headers.forEach((header, i) => {
    doc.text(header, colX + 2, y + 5.5);
    colX += colWidths[i];
  });

  y += 12;

  // Table rows
  doc.setFont("helvetica", "normal");
  doc.setTextColor(...textDark);
  doc.setFontSize(8);

  const normalizedItems = (invoice.items || []).map(normalizeInvoiceItem);

  normalizedItems.forEach((item, index) => {
    colX = tableX;

    const taxableValue = item.quantity * item.price;
    const gstRate = item.gst_rate || DEFAULT_GST_RATE;
    const gstAmount = (taxableValue * gstRate) / 100;
    const cgstAmt = isIgst ? 0 : gstAmount / 2;
    const sgstAmt = isIgst ? 0 : gstAmount / 2;
    const igstAmt = isIgst ? gstAmount : 0;
    const itemTotal = taxableValue + gstAmount;

    let description = item.description;
    const maxChars = isIgst ? 30 : 24;
    if (description.length > maxChars) {
      description = description.substring(0, maxChars - 2) + "...";
    }

    const rowData = isIgst
      ? [
          String(index + 1),
          description,
          String(item.quantity),
          Number(item.price).toFixed(2),
          taxableValue.toFixed(2),
          igstAmt.toFixed(2),
          itemTotal.toFixed(2),
        ]
      : [
          String(index + 1),
          description,
          String(item.quantity),
          Number(item.price).toFixed(2),
          taxableValue.toFixed(2),
          cgstAmt.toFixed(2),
          sgstAmt.toFixed(2),
          itemTotal.toFixed(2),
        ];

    rowData.forEach((cell, i) => {
      doc.text(cell, colX + 2, y);
      colX += colWidths[i];
    });

    doc.setDrawColor(...borderColor);
    doc.setLineWidth(0.2);
    doc.line(tableX, y + 3, tableX + tableWidth, y + 3);

    y += 7;
  });

  y += 5;

  // Summary section
  const summaryX = pageWidth - margin - 80;
  const summaryValueX = pageWidth - margin;

  let subtotal = 0;
  let totalCgst = 0;
  let totalSgst = 0;
  let totalIgst = 0;

  normalizedItems.forEach((item) => {
    const taxableValue = item.quantity * item.price;
    subtotal += taxableValue;
    const gstRate = item.gst_rate || DEFAULT_GST_RATE;
    const gstAmount = (taxableValue * gstRate) / 100;
    if (isIgst) {
      totalIgst += gstAmount;
    } else {
      totalCgst += gstAmount / 2;
      totalSgst += gstAmount / 2;
    }
  });

  const totalTax = totalCgst + totalSgst + totalIgst;
  const grandTotal = subtotal + totalTax;

  doc.setFontSize(9);

  // Subtotal
  doc.setTextColor(...textGray);
  doc.text("Subtotal", summaryX, y);
  doc.setTextColor(...textDark);
  doc.text(formatCurrency(subtotal), summaryValueX, y, { align: "right" });
  y += 5;

  // GST breakdown
  if (isIgst) {
    doc.setTextColor(...textGray);
    doc.text("IGST Total", summaryX, y);
    doc.setTextColor(...textDark);
    doc.text(formatCurrency(totalIgst), summaryValueX, y, { align: "right" });
    y += 5;
  } else {
    doc.setTextColor(...textGray);
    doc.text("CGST Total", summaryX, y);
    doc.setTextColor(...textDark);
    doc.text(formatCurrency(totalCgst), summaryValueX, y, { align: "right" });
    y += 5;

    doc.setTextColor(...textGray);
    doc.text("SGST Total", summaryX, y);
    doc.setTextColor(...textDark);
    doc.text(formatCurrency(totalSgst), summaryValueX, y, { align: "right" });
    y += 5;
  }

  // Total line
  doc.setDrawColor(...textDark);
  doc.setLineWidth(0.5);
  doc.line(summaryX, y, pageWidth - margin, y);
  y += 5;

  // Grand Total
  doc.setFontSize(12);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(...textDark);
  doc.text("Grand Total", summaryX, y);
  doc.setTextColor(...primaryColor);
  doc.text(formatCurrency(grandTotal), summaryValueX, y, { align: "right" });

  y += 15;

  // GST Summary Box
  doc.setFillColor(250, 250, 250);
  doc.setDrawColor(...borderColor);
  doc.roundedRect(margin, y, pageWidth - 2 * margin, 18, 2, 2, "FD");

  doc.setFontSize(8);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(...textDark);
  doc.text("GST Summary", margin + 5, y + 5);

  doc.setFontSize(8);
  doc.setFont("helvetica", "normal");
  doc.setTextColor(...textGray);

  const sellerState = invoice.seller_state || COMPANY_SETTINGS.business_state;
  const buyerState = invoice.buyer_state || "N/A";

  if (isIgst) {
    doc.text(`Supply Type: Inter-State (${sellerState} → ${buyerState})`, margin + 5, y + 10);
    doc.text(`IGST: ${formatCurrency(totalIgst)}`, margin + 5, y + 14);
  } else {
    doc.text(`Supply Type: Intra-State (${sellerState})`, margin + 5, y + 10);
    doc.text(`CGST: ${formatCurrency(totalCgst)} | SGST: ${formatCurrency(totalSgst)}`, margin + 5, y + 14);
  }

  doc.setFont("helvetica", "bold");
  doc.text(`Seller GSTIN: ${COMPANY_SETTINGS.business_gstin}`, pageWidth - margin - 5, y + 10, { align: "right" });
  if (invoice.buyer_gstin) {
    doc.text(`Buyer GSTIN: ${invoice.buyer_gstin}`, pageWidth - margin - 5, y + 14, { align: "right" });
  }

  y += 25;

  // Terms & Conditions
  if (y < pageHeight - 50) {
    doc.setFontSize(8);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(...textDark);
    doc.text("Terms & Conditions:", margin, y);

    y += 4;
    doc.setFont("helvetica", "normal");
    doc.setFontSize(7);
    doc.setTextColor(...textGray);

    const terms = COMPANY_SETTINGS.terms_and_conditions.split("\n");
    terms.forEach((term: string) => {
      if (y < pageHeight - 25) {
        doc.text(term, margin, y);
        y += 3.5;
      }
    });
  }

  // Footer
  y = pageHeight - 15;

  doc.setDrawColor(...borderColor);
  doc.setLineWidth(0.3);
  doc.line(margin, y - 5, pageWidth - margin, y - 5);

  doc.setFontSize(9);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(...textDark);
  doc.text("Thank you for your business!", pageWidth / 2, y, { align: "center" });

  y += 5;

  doc.setFontSize(7);
  doc.setFont("helvetica", "normal");
  doc.setTextColor(...textLight);
  doc.text("This is a computer-generated invoice and does not require a signature.", pageWidth / 2, y, { align: "center" });

  return doc.output("blob");
}

// Generate invoice report PDF
function generateInvoiceReportPdf(invoices: Invoice[], dateRange: string): Blob {
  const doc = new jsPDF({
    orientation: "landscape",
    unit: "mm",
    format: "a4",
  });

  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const margin = 15;
  let y = 15;

  // Colors
  const primaryColor: [number, number, number] = [234, 171, 28];
  const textDark: [number, number, number] = [33, 33, 33];
  const textGray: [number, number, number] = [102, 102, 102];
  const borderColor: [number, number, number] = [220, 220, 220];

  // Header
  doc.setFontSize(22);
  doc.setTextColor(...primaryColor);
  doc.setFont("helvetica", "bold");
  doc.text(COMPANY_SETTINGS.business_name, margin, y + 8);

  // Report type badge
  const boxWidth = 70;
  const boxHeight = 20;
  const boxX = pageWidth - margin - boxWidth;
  const boxY = y - 2;
  
  doc.setFillColor(76, 175, 80);
  doc.roundedRect(boxX, boxY, boxWidth, boxHeight, 2, 2, "F");
  
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(12);
  doc.setFont("helvetica", "bold");
  doc.text("INVOICE REPORT", boxX + boxWidth / 2, boxY + 9, { align: "center" });
  
  doc.setFontSize(7);
  doc.setFont("helvetica", "normal");
  doc.text("Final Tax Invoices", boxX + boxWidth / 2, boxY + 15, { align: "center" });

  y += 12;

  // Company info
  doc.setFontSize(9);
  doc.setTextColor(...textGray);
  doc.setFont("helvetica", "normal");
  doc.text(`${COMPANY_SETTINGS.business_address}, ${COMPANY_SETTINGS.business_city}, ${COMPANY_SETTINGS.business_state} - ${COMPANY_SETTINGS.business_pincode}`, margin, y);
  y += 4;
  doc.text(`GSTIN: ${COMPANY_SETTINGS.business_gstin} | Email: ${COMPANY_SETTINGS.business_email}`, margin, y);

  // Report date range
  doc.setFont("helvetica", "bold");
  doc.text(`Period: ${dateRange}`, pageWidth - margin, y, { align: "right" });
  doc.setFont("helvetica", "normal");
  doc.text(`Generated: ${format(new Date(), "dd MMM yyyy, hh:mm a")}`, pageWidth - margin, y - 4, { align: "right" });

  y += 10;

  // Separator
  doc.setDrawColor(primaryColor[0], primaryColor[1], primaryColor[2]);
  doc.setLineWidth(0.8);
  doc.line(margin, y, pageWidth - margin, y);

  y += 8;

  // Summary stats
  const totalAmount = invoices.reduce((sum, inv) => sum + inv.total_amount, 0);
  const totalTax = invoices.reduce((sum, inv) => sum + inv.tax_amount, 0);
  const totalSubtotal = invoices.reduce((sum, inv) => sum + inv.subtotal, 0);

  doc.setFillColor(248, 248, 248);
  doc.roundedRect(margin, y, pageWidth - 2 * margin, 20, 2, 2, "F");

  doc.setFontSize(10);
  doc.setTextColor(...textDark);
  doc.setFont("helvetica", "bold");
  
  const statWidth = (pageWidth - 2 * margin) / 4;
  
  doc.text("Total Invoices", margin + statWidth / 2, y + 7, { align: "center" });
  doc.setFontSize(14);
  doc.setTextColor(...primaryColor);
  doc.text(String(invoices.length), margin + statWidth / 2, y + 15, { align: "center" });

  doc.setFontSize(10);
  doc.setTextColor(...textDark);
  doc.text("Subtotal", margin + statWidth * 1.5, y + 7, { align: "center" });
  doc.setFontSize(12);
  doc.setTextColor(...primaryColor);
  doc.text(formatCurrency(totalSubtotal), margin + statWidth * 1.5, y + 15, { align: "center" });

  doc.setFontSize(10);
  doc.setTextColor(...textDark);
  doc.text("Total GST", margin + statWidth * 2.5, y + 7, { align: "center" });
  doc.setFontSize(12);
  doc.setTextColor(...primaryColor);
  doc.text(formatCurrency(totalTax), margin + statWidth * 2.5, y + 15, { align: "center" });

  doc.setFontSize(10);
  doc.setTextColor(...textDark);
  doc.text("Grand Total", margin + statWidth * 3.5, y + 7, { align: "center" });
  doc.setFontSize(12);
  doc.setTextColor(76, 175, 80);
  doc.text(formatCurrency(totalAmount), margin + statWidth * 3.5, y + 15, { align: "center" });

  y += 28;

  // Table headers
  const headers = ["#", "Invoice No.", "Date", "Client Name", "Subtotal", "CGST", "SGST", "IGST", "Total"];
  const colWidths = [10, 35, 25, 65, 30, 25, 25, 25, 30];
  const tableWidth = colWidths.reduce((a, b) => a + b, 0);
  const tableX = (pageWidth - tableWidth) / 2;

  // Header background
  doc.setFillColor(primaryColor[0], primaryColor[1], primaryColor[2]);
  doc.rect(tableX, y, tableWidth, 8, "F");

  doc.setFontSize(8);
  doc.setTextColor(255, 255, 255);
  doc.setFont("helvetica", "bold");

  let colX = tableX;
  headers.forEach((header, i) => {
    doc.text(header, colX + colWidths[i] / 2, y + 5.5, { align: "center" });
    colX += colWidths[i];
  });

  y += 10;

  // Table rows
  doc.setFont("helvetica", "normal");
  doc.setFontSize(8);

  invoices.forEach((invoice, index) => {
    // Check for page break
    if (y > pageHeight - 25) {
      doc.addPage();
      y = 20;
    }

    // Alternating row colors
    if (index % 2 === 0) {
      doc.setFillColor(250, 250, 250);
      doc.rect(tableX, y - 4, tableWidth, 7, "F");
    }

    colX = tableX;
    doc.setTextColor(...textDark);

    const rowData = [
      String(index + 1),
      invoice.invoice_number,
      format(new Date(invoice.created_at), "dd MMM yyyy"),
      invoice.client_name.length > 30 ? invoice.client_name.substring(0, 28) + "..." : invoice.client_name,
      formatCurrency(invoice.subtotal),
      formatCurrency(invoice.cgst_amount || 0),
      formatCurrency(invoice.sgst_amount || 0),
      formatCurrency(invoice.igst_amount || 0),
      formatCurrency(invoice.total_amount),
    ];

    rowData.forEach((cell, i) => {
      if (i === 3) {
        doc.text(cell, colX + 2, y);
      } else {
        doc.text(cell, colX + colWidths[i] / 2, y, { align: "center" });
      }
      colX += colWidths[i];
    });

    // Row border
    doc.setDrawColor(...borderColor);
    doc.setLineWidth(0.2);
    doc.line(tableX, y + 3, tableX + tableWidth, y + 3);

    y += 7;
  });

  // Footer
  const footerY = pageHeight - 10;
  doc.setDrawColor(...borderColor);
  doc.setLineWidth(0.3);
  doc.line(margin, footerY - 5, pageWidth - margin, footerY - 5);

  doc.setFontSize(8);
  doc.setTextColor(...textGray);
  doc.setFont("helvetica", "normal");
  doc.text(`${COMPANY_SETTINGS.business_name} - Confidential Financial Document`, pageWidth / 2, footerY, { align: "center" });

  return doc.output("blob");
}

export function useBulkInvoiceDownload() {
  const [isDownloading, setIsDownloading] = useState(false);
  const [progress, setProgress] = useState({ current: 0, total: 0 });

  // Download individual invoices as zip-like bundle (sequential download)
  const downloadBulkInvoices = useCallback(async (invoiceIds: string[]) => {
    if (invoiceIds.length === 0) {
      toast.error("No invoices selected for download");
      return;
    }

    setIsDownloading(true);
    setProgress({ current: 0, total: invoiceIds.length });

    try {
      // Fetch all selected invoices
      const { data: invoices, error } = await supabase
        .from("invoices")
        .select("*")
        .in("id", invoiceIds)
        .eq("is_final", true);

      if (error) throw error;

      if (!invoices || invoices.length === 0) {
        toast.error("No final invoices found");
        return;
      }

      // Normalize invoices with proper item parsing
      const normalizedInvoices: Invoice[] = invoices.map((inv) => ({
        ...inv,
        items: Array.isArray(inv.items) ? (inv.items as unknown as InvoiceItem[]) : [],
      }));

      // Download each invoice
      for (let i = 0; i < normalizedInvoices.length; i++) {
        const invoice = normalizedInvoices[i];
        setProgress({ current: i + 1, total: normalizedInvoices.length });

        // Try to download from storage first
        if (invoice.pdf_url) {
          try {
            const { data: signed, error: signError } = await supabase.storage
              .from("invoices")
              .createSignedUrl(invoice.pdf_url, 60 * 5);

            if (!signError && signed?.signedUrl) {
              const response = await fetch(signed.signedUrl);
              if (response.ok) {
                const blob = await response.blob();
                const url = URL.createObjectURL(blob);
                const link = document.createElement("a");
                link.href = url;
                link.download = `TAX-INVOICE_${invoice.invoice_number}.pdf`;
                document.body.appendChild(link);
                link.click();
                document.body.removeChild(link);
                URL.revokeObjectURL(url);
                continue;
              }
            }
          } catch (storageError) {
            console.log("Storage download failed, generating locally");
          }
        }

        // Generate PDF locally
        const pdfBlob = generateInvoicePdf(invoice);
        const url = URL.createObjectURL(pdfBlob);
        const link = document.createElement("a");
        link.href = url;
        link.download = `TAX-INVOICE_${invoice.invoice_number}.pdf`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);

        // Small delay between downloads
        if (i < normalizedInvoices.length - 1) {
          await new Promise(resolve => setTimeout(resolve, 300));
        }
      }

      toast.success(`Downloaded ${normalizedInvoices.length} invoice(s)`);
    } catch (e: any) {
      console.error("Bulk download error:", e);
      toast.error(e?.message || "Failed to download invoices");
    } finally {
      setIsDownloading(false);
      setProgress({ current: 0, total: 0 });
    }
  }, []);

  // Download invoice report (summary PDF)
  const downloadInvoiceReport = useCallback(async (options: {
    dateFrom?: string;
    dateTo?: string;
    dateRange?: string;
  }) => {
    setIsDownloading(true);

    try {
      let query = supabase
        .from("invoices")
        .select("*")
        .eq("is_final", true)
        .order("created_at", { ascending: false });

      if (options.dateFrom) {
        query = query.gte("created_at", options.dateFrom);
      }
      if (options.dateTo) {
        query = query.lte("created_at", options.dateTo + "T23:59:59");
      }

      const { data: invoices, error } = await query;

      if (error) throw error;

      if (!invoices || invoices.length === 0) {
        toast.error("No final invoices found for the selected period");
        return;
      }

      // Normalize invoices with proper item parsing
      const normalizedInvoices: Invoice[] = invoices.map((inv) => ({
        ...inv,
        items: Array.isArray(inv.items) ? (inv.items as unknown as InvoiceItem[]) : [],
      }));

      const dateRangeText = options.dateRange || 
        (options.dateFrom && options.dateTo 
          ? `${format(new Date(options.dateFrom), "dd MMM yyyy")} - ${format(new Date(options.dateTo), "dd MMM yyyy")}`
          : "All Time");

      const pdfBlob = generateInvoiceReportPdf(normalizedInvoices, dateRangeText);

      const url = URL.createObjectURL(pdfBlob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `Invoice-Report_${format(new Date(), "yyyy-MM-dd")}.pdf`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);

      toast.success(`Report generated with ${invoices.length} invoice(s)`);
    } catch (e: any) {
      console.error("Report generation error:", e);
      toast.error(e?.message || "Failed to generate report");
    } finally {
      setIsDownloading(false);
    }
  }, []);

  return {
    downloadBulkInvoices,
    downloadInvoiceReport,
    isDownloading,
    progress,
  };
}
