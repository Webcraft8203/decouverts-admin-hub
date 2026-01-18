import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Separator } from "@/components/ui/separator";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";
import { Plus, Trash2, Download, FileText, Eye, X } from "lucide-react";
import { toast as sonnerToast } from "sonner";
import { INDIAN_STATES } from "@/constants/indianStates";
import { jsPDF } from "jspdf";

// Invoice item interface - standardized
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

// Normalize invoice items to handle both legacy and new formats
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

interface Invoice {
  id: string;
  invoice_number: string;
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
  buyer_state?: string | null;
  seller_state?: string | null;
  is_igst?: boolean | null;
  cgst_amount?: number | null;
  sgst_amount?: number | null;
  igst_amount?: number | null;
  buyer_gstin?: string | null;
}

// Default GST rate
const DEFAULT_GST_RATE = 18;

// Invoice Settings (matches the generate-invoice edge function)
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

export default function Invoices() {
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [viewDialogOpen, setViewDialogOpen] = useState(false);
  const [selectedInvoice, setSelectedInvoice] = useState<Invoice | null>(null);
  const [isDownloading, setIsDownloading] = useState(false);
  const [formData, setFormData] = useState({
    client_name: "",
    client_email: "",
    client_address: "",
    notes: "",
    buyer_state: "Maharashtra",
    buyer_gstin: "",
  });
  const [items, setItems] = useState<InvoiceItem[]>([{ description: "", quantity: 1, price: 0, gst_rate: DEFAULT_GST_RATE }]);
  const { toast } = useToast();
  const { user } = useAuth();

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    const { data } = await supabase
      .from("invoices")
      .select("id, invoice_number, client_name, client_email, client_address, total_amount, subtotal, tax_amount, items, notes, pdf_url, created_at, buyer_state, seller_state, is_igst, cgst_amount, sgst_amount, igst_amount, buyer_gstin")
      .order("created_at", { ascending: false });

    // Parse and normalize items from Json to InvoiceItem[]
    const parsed = (data || []).map((inv) => ({
      ...inv,
      items: Array.isArray(inv.items)
        ? (inv.items as unknown as any[]).map(normalizeInvoiceItem)
        : [],
    }));
    setInvoices(parsed);
    setIsLoading(false);
  };

  const addItem = () => setItems([...items, { description: "", quantity: 1, price: 0, gst_rate: DEFAULT_GST_RATE }]);
  const removeItem = (i: number) => setItems(items.filter((_, idx) => idx !== i));
  const updateItem = (i: number, field: keyof InvoiceItem, value: string | number) => {
    const n = [...items];
    n[i] = { ...n[i], [field]: value };
    setItems(n);
  };

  // Calculate if IGST applies (interstate)
  const isInterState = formData.buyer_state.toLowerCase() !== COMPANY_SETTINGS.business_state.toLowerCase();

  // Calculate GST for a single item
  const calculateItemGst = (item: InvoiceItem) => {
    const taxableValue = item.quantity * item.price;
    const gstRate = item.gst_rate || DEFAULT_GST_RATE;
    const gstAmount = (taxableValue * gstRate) / 100;

    if (isInterState) {
      return { cgst: 0, sgst: 0, igst: gstAmount, total: taxableValue + gstAmount };
    } else {
      return { cgst: gstAmount / 2, sgst: gstAmount / 2, igst: 0, total: taxableValue + gstAmount };
    }
  };

  // Calculate totals
  const calculateTotals = () => {
    let subtotal = 0;
    let totalCgst = 0;
    let totalSgst = 0;
    let totalIgst = 0;

    items.forEach((item) => {
      const taxableValue = item.quantity * item.price;
      subtotal += taxableValue;
      const gst = calculateItemGst(item);
      totalCgst += gst.cgst;
      totalSgst += gst.sgst;
      totalIgst += gst.igst;
    });

    const totalTax = totalCgst + totalSgst + totalIgst;
    const grandTotal = subtotal + totalTax;

    return { subtotal, totalCgst, totalSgst, totalIgst, totalTax, grandTotal };
  };

  const totals = calculateTotals();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Prepare items with GST calculations
    const invoiceItems: InvoiceItem[] = items.map((item) => {
      const gst = calculateItemGst(item);
      return {
        description: item.description,
        quantity: item.quantity,
        price: item.price,
        gst_rate: item.gst_rate || DEFAULT_GST_RATE,
        taxable_value: item.quantity * item.price,
        cgst_amount: gst.cgst,
        sgst_amount: gst.sgst,
        igst_amount: gst.igst,
        total: gst.total,
      };
    });

    const invoiceNumber = `INV-${Date.now().toString(36).toUpperCase()}`;

    const { error } = await supabase.from("invoices").insert([
      {
        invoice_number: invoiceNumber,
        client_name: formData.client_name,
        client_email: formData.client_email || null,
        client_address: formData.client_address || null,
        items: JSON.parse(JSON.stringify(invoiceItems)),
        subtotal: totals.subtotal,
        tax_amount: totals.totalTax,
        total_amount: totals.grandTotal,
        cgst_amount: totals.totalCgst,
        sgst_amount: totals.totalSgst,
        igst_amount: totals.totalIgst,
        is_igst: isInterState,
        buyer_state: formData.buyer_state,
        seller_state: COMPANY_SETTINGS.business_state,
        buyer_gstin: formData.buyer_gstin || null,
        notes: formData.notes || null,
        created_by: user?.id,
      },
    ]);

    if (error) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
      return;
    }

    toast({ title: "Invoice created", description: `Invoice ${invoiceNumber} generated` });
    setDialogOpen(false);
    setFormData({ client_name: "", client_email: "", client_address: "", notes: "", buyer_state: "Maharashtra", buyer_gstin: "" });
    setItems([{ description: "", quantity: 1, price: 0, gst_rate: DEFAULT_GST_RATE }]);
    fetchData();
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Delete?")) return;
    await supabase.from("invoices").delete().eq("id", id);
    toast({ title: "Deleted" });
    fetchData();
  };

  const handleViewInvoice = (invoice: Invoice) => {
    setSelectedInvoice(invoice);
    setViewDialogOpen(true);
  };

  // Format currency in Indian format
  const formatCurrency = (amount: number): string => {
    return `₹${Number(amount || 0).toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  };

  // Generate PDF using jsPDF
  const generatePdf = useCallback((invoice: Invoice): Blob => {
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
    const primaryColor: [number, number, number] = [234, 171, 28]; // #EAAB1C
    const textDark: [number, number, number] = [33, 33, 33];
    const textGray: [number, number, number] = [102, 102, 102];
    const textLight: [number, number, number] = [128, 128, 128];
    const borderColor: [number, number, number] = [220, 220, 220];

    // ==================== HEADER ====================
    doc.setFontSize(22);
    doc.setTextColor(...primaryColor);
    doc.setFont("helvetica", "bold");
    doc.text(COMPANY_SETTINGS.business_name, margin, y + 8);

    // Invoice title
    doc.setFontSize(18);
    doc.setTextColor(...textDark);
    doc.text("TAX INVOICE", pageWidth - margin, y + 5, { align: "right" });

    y += 10;

    // Company tagline
    doc.setFontSize(9);
    doc.setTextColor(...textGray);
    doc.setFont("helvetica", "normal");
    doc.text("Discovering Future Technologies", margin, y);

    y += 6;

    // Company address block
    doc.setFontSize(8);
    doc.setTextColor(...textGray);
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

    // Invoice details on right side
    const invoiceDate = new Date(invoice.created_at).toLocaleDateString("en-IN", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });

    const invoiceDetailsY = y - 16;
    doc.setFontSize(9);
    doc.setTextColor(...textDark);
    doc.setFont("helvetica", "bold");
    doc.text("Invoice No:", pageWidth - margin - 50, invoiceDetailsY);
    doc.setFont("helvetica", "normal");
    doc.text(invoice.invoice_number, pageWidth - margin, invoiceDetailsY, { align: "right" });

    doc.setFont("helvetica", "bold");
    doc.text("Date:", pageWidth - margin - 50, invoiceDetailsY + 5);
    doc.setFont("helvetica", "normal");
    doc.text(invoiceDate, pageWidth - margin, invoiceDetailsY + 5, { align: "right" });

    y += 5;

    // Separator line
    doc.setDrawColor(primaryColor[0], primaryColor[1], primaryColor[2]);
    doc.setLineWidth(0.8);
    doc.line(margin, y, pageWidth - margin, y);

    y += 10;

    // ==================== BUYER DETAILS ====================
    doc.setFontSize(9);
    doc.setTextColor(...primaryColor);
    doc.setFont("helvetica", "bold");
    doc.text("BILL TO", margin, y);

    y += 5;

    // Buyer name
    doc.setFontSize(11);
    doc.setTextColor(...textDark);
    doc.setFont("helvetica", "bold");
    doc.text(invoice.client_name, margin, y);

    y += 5;

    // Address details
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

    // ==================== PRODUCT TABLE ====================
    const isIgst = invoice.is_igst || (invoice.buyer_state?.toLowerCase() !== COMPANY_SETTINGS.business_state.toLowerCase());

    // Table headers with GST breakdown
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
    doc.setDrawColor(...primaryColor);
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

    const normalizedItems = invoice.items.map(normalizeInvoiceItem);

    normalizedItems.forEach((item, index) => {
      colX = tableX;

      const taxableValue = item.quantity * item.price;
      const gstRate = item.gst_rate || DEFAULT_GST_RATE;
      const gstAmount = (taxableValue * gstRate) / 100;
      const cgstAmt = isIgst ? 0 : gstAmount / 2;
      const sgstAmt = isIgst ? 0 : gstAmount / 2;
      const igstAmt = isIgst ? gstAmount : 0;
      const itemTotal = taxableValue + gstAmount;

      // Truncate description if too long
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

      // Row separator
      doc.setDrawColor(...borderColor);
      doc.setLineWidth(0.2);
      doc.line(tableX, y + 3, tableX + tableWidth, y + 3);

      y += 7;
    });

    y += 5;

    // ==================== SUMMARY SECTION ====================
    const summaryX = pageWidth - margin - 80;
    const summaryValueX = pageWidth - margin;

    // Calculate totals from items
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

    // ==================== GST SUMMARY BOX ====================
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

    // Notes
    if (invoice.notes && y < pageHeight - 40) {
      y += 5;
      doc.setFontSize(8);
      doc.setFont("helvetica", "bold");
      doc.setTextColor(...textDark);
      doc.text("Notes:", margin, y);
      y += 4;
      doc.setFont("helvetica", "normal");
      doc.setFontSize(7);
      doc.setTextColor(...textGray);
      doc.text(invoice.notes, margin, y);
    }

    // ==================== FOOTER ====================
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

    // Return as blob
    return doc.output("blob");
  }, []);

  const downloadInvoice = useCallback(async (invoice: Invoice) => {
    setIsDownloading(true);
    try {
      // If pdf_url exists, try to download from storage first
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
              link.download = `INVOICE_${invoice.invoice_number}.pdf`;
              document.body.appendChild(link);
              link.click();
              document.body.removeChild(link);
              URL.revokeObjectURL(url);
              sonnerToast.success("Invoice downloaded!");
              return;
            }
          }
        } catch (storageError) {
          console.log("Storage download failed, generating PDF locally:", storageError);
        }
      }

      // Generate PDF locally using jsPDF
      const pdfBlob = generatePdf(invoice);

      const url = URL.createObjectURL(pdfBlob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `INVOICE_${invoice.invoice_number}.pdf`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
      sonnerToast.success("Invoice downloaded!");
    } catch (e: any) {
      console.error("Download error:", e);
      sonnerToast.error(e?.message || "Failed to download invoice");
    } finally {
      setIsDownloading(false);
    }
  }, [generatePdf]);

  // Get GST display for an invoice
  const getGstDisplay = (invoice: Invoice) => {
    const isIgst = invoice.is_igst || (invoice.buyer_state?.toLowerCase() !== COMPANY_SETTINGS.business_state.toLowerCase());
    if (isIgst) {
      return `IGST: ${formatCurrency(invoice.igst_amount || invoice.tax_amount)}`;
    }
    const cgst = invoice.cgst_amount || invoice.tax_amount / 2;
    const sgst = invoice.sgst_amount || invoice.tax_amount / 2;
    return `CGST: ${formatCurrency(cgst)} + SGST: ${formatCurrency(sgst)}`;
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Invoices</h1>
          <p className="text-muted-foreground">Generate and manage GST-compliant invoices</p>
        </div>
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="mr-2 h-4 w-4" />
              Create Invoice
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Create GST Invoice</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Client Name *</Label>
                  <Input
                    value={formData.client_name}
                    onChange={(e) => setFormData({ ...formData, client_name: e.target.value })}
                    required
                  />
                </div>
                <div>
                  <Label>Client Email</Label>
                  <Input
                    type="email"
                    value={formData.client_email}
                    onChange={(e) => setFormData({ ...formData, client_email: e.target.value })}
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Buyer State *</Label>
                  <Select
                    value={formData.buyer_state}
                    onValueChange={(value) => setFormData({ ...formData, buyer_state: value })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select state" />
                    </SelectTrigger>
                    <SelectContent>
                      {INDIAN_STATES.map((state) => (
                        <SelectItem key={state} value={state}>
                          {state}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <p className="text-xs text-muted-foreground mt-1">
                    {isInterState ? "IGST will apply (Inter-State)" : "CGST + SGST will apply (Intra-State)"}
                  </p>
                </div>
                <div>
                  <Label>Buyer GSTIN</Label>
                  <Input
                    value={formData.buyer_gstin}
                    onChange={(e) => setFormData({ ...formData, buyer_gstin: e.target.value.toUpperCase() })}
                    placeholder="e.g., 27AAAAA0000A1Z5"
                    maxLength={15}
                  />
                </div>
              </div>

              <div>
                <Label>Address</Label>
                <Textarea
                  value={formData.client_address}
                  onChange={(e) => setFormData({ ...formData, client_address: e.target.value })}
                />
              </div>

              <div className="space-y-2">
                <Label>Items</Label>
                {items.map((item, i) => (
                  <div key={i} className="flex gap-2 items-center">
                    <Input
                      placeholder="Description"
                      value={item.description}
                      onChange={(e) => updateItem(i, "description", e.target.value)}
                      className="flex-1"
                      required
                    />
                    <Input
                      type="number"
                      placeholder="Qty"
                      value={item.quantity}
                      onChange={(e) => updateItem(i, "quantity", parseInt(e.target.value) || 0)}
                      className="w-16"
                      min="1"
                    />
                    <Input
                      type="number"
                      step="0.01"
                      placeholder="Price"
                      value={item.price}
                      onChange={(e) => updateItem(i, "price", parseFloat(e.target.value) || 0)}
                      className="w-24"
                      min="0"
                    />
                    <Input
                      type="number"
                      placeholder="GST%"
                      value={item.gst_rate || DEFAULT_GST_RATE}
                      onChange={(e) => updateItem(i, "gst_rate", parseInt(e.target.value) || DEFAULT_GST_RATE)}
                      className="w-16"
                      min="0"
                      max="28"
                    />
                    {items.length > 1 && (
                      <Button type="button" variant="ghost" size="icon" onClick={() => removeItem(i)}>
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    )}
                  </div>
                ))}
                <Button type="button" variant="outline" size="sm" onClick={addItem}>
                  <Plus className="h-4 w-4 mr-1" />
                  Add Item
                </Button>
              </div>

              <div>
                <Label>Notes</Label>
                <Textarea
                  value={formData.notes}
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                />
              </div>

              <div className="border-t pt-4 space-y-1 text-sm">
                <div className="flex justify-between">
                  <span>Subtotal:</span>
                  <span>{formatCurrency(totals.subtotal)}</span>
                </div>
                {isInterState ? (
                  <div className="flex justify-between text-muted-foreground">
                    <span>IGST:</span>
                    <span>{formatCurrency(totals.totalIgst)}</span>
                  </div>
                ) : (
                  <>
                    <div className="flex justify-between text-muted-foreground">
                      <span>CGST:</span>
                      <span>{formatCurrency(totals.totalCgst)}</span>
                    </div>
                    <div className="flex justify-between text-muted-foreground">
                      <span>SGST:</span>
                      <span>{formatCurrency(totals.totalSgst)}</span>
                    </div>
                  </>
                )}
                <div className="flex justify-between font-bold pt-2 border-t">
                  <span>Grand Total:</span>
                  <span className="text-primary">{formatCurrency(totals.grandTotal)}</span>
                </div>
              </div>

              <Button type="submit" className="w-full">
                Generate Invoice
              </Button>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Invoice #</TableHead>
                <TableHead>Client</TableHead>
                <TableHead>GST</TableHead>
                <TableHead>Amount</TableHead>
                <TableHead>Date</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-8">
                    Loading...
                  </TableCell>
                </TableRow>
              ) : invoices.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                    No invoices
                  </TableCell>
                </TableRow>
              ) : (
                invoices.map((inv) => (
                  <TableRow key={inv.id}>
                    <TableCell className="font-medium">
                      <div className="flex items-center gap-2">
                        <FileText className="h-4 w-4 text-muted-foreground" />
                        {inv.invoice_number}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div>
                        <span className="font-medium">{inv.client_name}</span>
                        {inv.buyer_state && (
                          <span className="text-xs text-muted-foreground ml-2">({inv.buyer_state})</span>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <span className="text-xs text-muted-foreground">{getGstDisplay(inv)}</span>
                    </TableCell>
                    <TableCell className="font-semibold">{formatCurrency(inv.total_amount)}</TableCell>
                    <TableCell>{new Date(inv.created_at).toLocaleDateString("en-IN")}</TableCell>
                    <TableCell className="text-right space-x-1">
                      <Button variant="ghost" size="icon" onClick={() => handleViewInvoice(inv)} title="View Details">
                        <Eye className="h-4 w-4 text-primary" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => downloadInvoice(inv)}
                        disabled={isDownloading}
                        title="Download PDF"
                      >
                        <Download className="h-4 w-4 text-muted-foreground" />
                      </Button>
                      <Button variant="ghost" size="icon" onClick={() => handleDelete(inv.id)} title="Delete">
                        <Trash2 className="h-4 w-4 text-destructive" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* View Invoice Details Dialog */}
      <Dialog open={viewDialogOpen} onOpenChange={setViewDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5 text-primary" />
              Invoice Details
            </DialogTitle>
          </DialogHeader>
          {selectedInvoice && (
            <div className="space-y-6">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-muted-foreground">Invoice Number</p>
                  <p className="font-semibold text-lg">{selectedInvoice.invoice_number}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Date</p>
                  <p className="font-semibold">
                    {new Date(selectedInvoice.created_at).toLocaleDateString("en-IN", {
                      day: "2-digit",
                      month: "short",
                      year: "numeric",
                    })}
                  </p>
                </div>
              </div>

              <Separator />

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-muted-foreground mb-2">Bill To</p>
                  <p className="font-semibold text-lg">{selectedInvoice.client_name}</p>
                  {selectedInvoice.client_email && (
                    <p className="text-sm text-muted-foreground">{selectedInvoice.client_email}</p>
                  )}
                  {selectedInvoice.client_address && (
                    <p className="text-sm text-muted-foreground mt-1">{selectedInvoice.client_address}</p>
                  )}
                </div>
                <div>
                  <p className="text-sm text-muted-foreground mb-2">GST Details</p>
                  <p className="text-sm">
                    <span className="font-medium">Buyer State:</span> {selectedInvoice.buyer_state || "N/A"}
                  </p>
                  <p className="text-sm">
                    <span className="font-medium">Type:</span>{" "}
                    {selectedInvoice.is_igst ? "Inter-State (IGST)" : "Intra-State (CGST+SGST)"}
                  </p>
                  {selectedInvoice.buyer_gstin && (
                    <p className="text-sm">
                      <span className="font-medium">Buyer GSTIN:</span> {selectedInvoice.buyer_gstin}
                    </p>
                  )}
                </div>
              </div>

              <Separator />

              <div>
                <p className="text-sm text-muted-foreground mb-3">Items</p>
                <div className="border rounded-lg overflow-hidden">
                  <Table>
                    <TableHeader>
                      <TableRow className="bg-muted/50">
                        <TableHead>Description</TableHead>
                        <TableHead className="text-center">Qty</TableHead>
                        <TableHead className="text-right">Price</TableHead>
                        <TableHead className="text-right">GST</TableHead>
                        <TableHead className="text-right">Total</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {selectedInvoice.items.map((item, idx) => {
                        const normalizedItem = normalizeInvoiceItem(item);
                        const taxableValue = normalizedItem.quantity * normalizedItem.price;
                        const gstRate = normalizedItem.gst_rate || DEFAULT_GST_RATE;
                        const gstAmount = (taxableValue * gstRate) / 100;
                        const itemTotal = taxableValue + gstAmount;

                        return (
                          <TableRow key={idx}>
                            <TableCell>{normalizedItem.description}</TableCell>
                            <TableCell className="text-center">{normalizedItem.quantity}</TableCell>
                            <TableCell className="text-right">{formatCurrency(normalizedItem.price)}</TableCell>
                            <TableCell className="text-right text-muted-foreground">
                              {formatCurrency(gstAmount)} ({gstRate}%)
                            </TableCell>
                            <TableCell className="text-right font-medium">{formatCurrency(itemTotal)}</TableCell>
                          </TableRow>
                        );
                      })}
                    </TableBody>
                  </Table>
                </div>
              </div>

              <div className="bg-muted/30 rounded-lg p-4 space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Subtotal</span>
                  <span>{formatCurrency(selectedInvoice.subtotal)}</span>
                </div>
                {selectedInvoice.is_igst ? (
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">IGST</span>
                    <span>{formatCurrency(selectedInvoice.igst_amount || selectedInvoice.tax_amount)}</span>
                  </div>
                ) : (
                  <>
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">CGST</span>
                      <span>{formatCurrency(selectedInvoice.cgst_amount || selectedInvoice.tax_amount / 2)}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">SGST</span>
                      <span>{formatCurrency(selectedInvoice.sgst_amount || selectedInvoice.tax_amount / 2)}</span>
                    </div>
                  </>
                )}
                <Separator />
                <div className="flex justify-between font-bold text-lg">
                  <span>Total</span>
                  <span className="text-primary">{formatCurrency(selectedInvoice.total_amount)}</span>
                </div>
              </div>

              {selectedInvoice.notes && (
                <div>
                  <p className="text-sm text-muted-foreground mb-1">Notes</p>
                  <p className="text-sm bg-muted/30 p-3 rounded-lg">{selectedInvoice.notes}</p>
                </div>
              )}

              <div className="flex gap-3 pt-2">
                <Button className="flex-1" onClick={() => downloadInvoice(selectedInvoice)} disabled={isDownloading}>
                  <Download className="h-4 w-4 mr-2" />
                  {isDownloading ? "Downloading..." : "Download PDF"}
                </Button>
                <Button variant="outline" onClick={() => setViewDialogOpen(false)}>
                  Close
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
