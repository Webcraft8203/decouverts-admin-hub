import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Separator } from "@/components/ui/separator";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Checkbox } from "@/components/ui/checkbox";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";
import { useBulkInvoiceDownload } from "@/hooks/useBulkInvoiceDownload";
import { Plus, Trash2, Download, FileText, Eye, X, Search, Filter, Calendar, CreditCard, Banknote, CheckCircle, Clock, AlertCircle, Receipt, FileCheck, FileDown, Loader2 } from "lucide-react";
import { toast as sonnerToast } from "sonner";
import { INDIAN_STATES } from "@/constants/indianStates";
import { jsPDF } from "jspdf";
import { format } from "date-fns";

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
  order?: {
    order_number: string;
    payment_status: string;
    payment_id: string | null;
    status: string;
  } | null;
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

// Payment status config for COD
const paymentStatusConfig = {
  pending: { label: "Pending", color: "bg-amber-500/10 text-amber-500 border-amber-500/20", icon: Clock },
  paid: { label: "Paid", color: "bg-green-500/10 text-green-500 border-green-500/20", icon: CheckCircle },
  cod_collected: { label: "COD Collected", color: "bg-blue-500/10 text-blue-500 border-blue-500/20", icon: Banknote },
  cod_settled: { label: "Settled", color: "bg-emerald-500/10 text-emerald-500 border-emerald-500/20", icon: CheckCircle },
  failed: { label: "Failed", color: "bg-destructive/10 text-destructive border-destructive/20", icon: AlertCircle },
};

export default function Invoices() {
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [viewDialogOpen, setViewDialogOpen] = useState(false);
  const [selectedInvoice, setSelectedInvoice] = useState<Invoice | null>(null);
  const [isDownloading, setIsDownloading] = useState(false);
  const [activeTab, setActiveTab] = useState<"proforma" | "final">("proforma");
  
  // Selection state for bulk operations
  const [selectedInvoiceIds, setSelectedInvoiceIds] = useState<Set<string>>(new Set());
  
  // Search and filter states
  const [searchQuery, setSearchQuery] = useState("");
  const [paymentFilter, setPaymentFilter] = useState<string>("all");
  const [dateRange, setDateRange] = useState<{ from: string; to: string }>({ from: "", to: "" });
  
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
  
  // Bulk download hook
  const { downloadBulkInvoices, downloadInvoiceReport, isDownloading: isBulkDownloading, progress } = useBulkInvoiceDownload();

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    const { data } = await supabase
      .from("invoices")
      .select(`
        id, invoice_number, invoice_type, is_final, client_name, client_email, client_address, 
        total_amount, subtotal, tax_amount, items, notes, pdf_url, created_at, delivery_date,
        order_id, buyer_state, seller_state, is_igst, cgst_amount, sgst_amount, igst_amount, buyer_gstin
      `)
      .order("created_at", { ascending: false });

    // Fetch related order data separately
    const invoicesWithOrders = await Promise.all(
      (data || []).map(async (inv) => {
        let order = null;
        if (inv.order_id) {
          const { data: orderData } = await supabase
            .from("orders")
            .select("order_number, payment_status, payment_id, status")
            .eq("id", inv.order_id)
            .single();
          order = orderData;
        }
        return {
          ...inv,
          invoice_type: inv.invoice_type || (inv.is_final ? "final" : "proforma"),
          items: Array.isArray(inv.items)
            ? (inv.items as unknown as any[]).map(normalizeInvoiceItem)
            : [],
          order,
        };
      })
    );

    setInvoices(invoicesWithOrders);
    setIsLoading(false);
  };

  // Filter invoices based on active tab, search, and filters
  const filteredInvoices = invoices.filter((invoice) => {
    // Tab filter
    const matchesTab = activeTab === "proforma" 
      ? invoice.invoice_type !== "final"
      : invoice.invoice_type === "final";
    
    // Search filter
    const query = searchQuery.toLowerCase();
    const matchesSearch = !query || 
      invoice.invoice_number.toLowerCase().includes(query) ||
      invoice.client_name.toLowerCase().includes(query) ||
      (invoice.order?.order_number || "").toLowerCase().includes(query);
    
    // Payment filter
    const matchesPayment = paymentFilter === "all" || 
      (paymentFilter === "online" && invoice.order?.payment_id && !invoice.order.payment_id.startsWith("COD")) ||
      (paymentFilter === "cod" && (!invoice.order?.payment_id || invoice.order.payment_id.startsWith("COD")));
    
    // Date range filter
    const invoiceDate = new Date(invoice.created_at);
    const matchesDateFrom = !dateRange.from || invoiceDate >= new Date(dateRange.from);
    const matchesDateTo = !dateRange.to || invoiceDate <= new Date(dateRange.to + "T23:59:59");
    
    return matchesTab && matchesSearch && matchesPayment && matchesDateFrom && matchesDateTo;
  });

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
        invoice_type: "final",
        is_final: true,
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
    if (!confirm("Delete this invoice?")) return;
    await supabase.from("invoices").delete().eq("id", id);
    toast({ title: "Invoice deleted" });
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

  // Get payment type badge
  const getPaymentTypeBadge = (invoice: Invoice) => {
    const isCOD = !invoice.order?.payment_id || invoice.order.payment_id.startsWith("COD");
    if (isCOD) {
      return (
        <Badge variant="outline" className="bg-amber-500/10 text-amber-600 border-amber-500/20">
          <Banknote className="w-3 h-3 mr-1" />
          COD
        </Badge>
      );
    }
    return (
      <Badge variant="outline" className="bg-blue-500/10 text-blue-600 border-blue-500/20">
        <CreditCard className="w-3 h-3 mr-1" />
        Online
      </Badge>
    );
  };

  // Get payment status for COD orders
  const getPaymentStatus = (invoice: Invoice) => {
    const status = invoice.order?.payment_status || "pending";
    const orderStatus = invoice.order?.status || "";
    const isCOD = !invoice.order?.payment_id || invoice.order.payment_id?.startsWith("COD");
    
    if (isCOD) {
      if (orderStatus === "delivered") {
        // COD order delivered = payment collected by delivery partner
        return { label: "Collected by Delivery Partner", color: "bg-blue-500/10 text-blue-600 border-blue-500/20", icon: Banknote };
      } else if (status === "pending") {
        return { label: "Awaiting Delivery", color: "bg-amber-500/10 text-amber-600 border-amber-500/20", icon: Clock };
      }
    }
    
    const config = paymentStatusConfig[status as keyof typeof paymentStatusConfig];
    return config || paymentStatusConfig.pending;
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
    const warningColor: [number, number, number] = [255, 152, 0];
    const successColor: [number, number, number] = [76, 175, 80];

    const isFinal = invoice.is_final || invoice.invoice_type === "final";

    // ==================== HEADER ====================
    // Left side - Company info
    doc.setFontSize(22);
    doc.setTextColor(...primaryColor);
    doc.setFont("helvetica", "bold");
    doc.text(COMPANY_SETTINGS.business_name, margin, y + 8);

    // Right side - Invoice type box
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
    
    if (!isFinal) {
      doc.setFontSize(7);
      doc.setFont("helvetica", "normal");
      doc.text("Temporary - Not a Tax Document", boxX + boxWidth / 2, boxY + 17, { align: "center" });
    } else {
      doc.setFontSize(7);
      doc.setFont("helvetica", "normal");
      doc.text("GST Compliant", boxX + boxWidth / 2, boxY + 17, { align: "center" });
    }

    y += 12;

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

    // Invoice details on right side (below the box)
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

    if (invoice.order?.order_number) {
      doc.setFont("helvetica", "bold");
      doc.text("Order No:", rightColX, invoiceDetailsY + 10);
      doc.setFont("helvetica", "normal");
      doc.text(invoice.order.order_number, pageWidth - margin, invoiceDetailsY + 10, { align: "right" });
    }

    y += 5;

    // Separator line
    if (isFinal) {
      doc.setDrawColor(successColor[0], successColor[1], successColor[2]);
    } else {
      doc.setDrawColor(primaryColor[0], primaryColor[1], primaryColor[2]);
    }
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
              const prefix = invoice.is_final ? "TAX-INVOICE" : "PROFORMA";
              link.download = `${prefix}_${invoice.invoice_number}.pdf`;
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
      const prefix = invoice.is_final ? "TAX-INVOICE" : "PROFORMA";
      link.download = `${prefix}_${invoice.invoice_number}.pdf`;
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

  // Stats for tabs
  const proformaCount = invoices.filter(i => i.invoice_type !== "final").length;
  const finalCount = invoices.filter(i => i.invoice_type === "final").length;
  
  // Get final invoices for selection
  const finalInvoices = filteredInvoices.filter(i => i.invoice_type === "final");
  
  // Selection handlers for bulk operations
  const toggleInvoiceSelection = (invoiceId: string) => {
    const newSelection = new Set(selectedInvoiceIds);
    if (newSelection.has(invoiceId)) {
      newSelection.delete(invoiceId);
    } else {
      newSelection.add(invoiceId);
    }
    setSelectedInvoiceIds(newSelection);
  };

  const toggleSelectAll = () => {
    if (selectedInvoiceIds.size === finalInvoices.length) {
      setSelectedInvoiceIds(new Set());
    } else {
      setSelectedInvoiceIds(new Set(finalInvoices.map(inv => inv.id)));
    }
  };

  const handleBulkDownload = async () => {
    const selectedIds = Array.from(selectedInvoiceIds);
    await downloadBulkInvoices(selectedIds);
    setSelectedInvoiceIds(new Set());
  };

  const handleDownloadReport = async () => {
    const dateRangeLabel = dateRange.from && dateRange.to 
      ? `${format(new Date(dateRange.from), "dd MMM yyyy")} - ${format(new Date(dateRange.to), "dd MMM yyyy")}`
      : "All Time";
    await downloadInvoiceReport({
      dateFrom: dateRange.from || undefined,
      dateTo: dateRange.to || undefined,
      dateRange: dateRangeLabel,
    });
  };

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Invoice Management</h1>
          <p className="text-muted-foreground">Generate and manage GST-compliant invoices</p>
        </div>
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button className="gap-2">
              <Plus className="w-4 h-4" />
              Create Manual Invoice
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Create New Invoice</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-6 mt-4">
              {/* Client Information */}
              <div className="space-y-4">
                <h3 className="font-semibold text-lg flex items-center gap-2">
                  <FileText className="w-5 h-5 text-primary" />
                  Client Information
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="client_name">Client Name *</Label>
                    <Input
                      id="client_name"
                      value={formData.client_name}
                      onChange={(e) => setFormData({ ...formData, client_name: e.target.value })}
                      required
                    />
                  </div>
                  <div>
                    <Label htmlFor="client_email">Client Email</Label>
                    <Input
                      id="client_email"
                      type="email"
                      value={formData.client_email}
                      onChange={(e) => setFormData({ ...formData, client_email: e.target.value })}
                    />
                  </div>
                  <div>
                    <Label htmlFor="buyer_state">Buyer State *</Label>
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
                  </div>
                  <div>
                    <Label htmlFor="buyer_gstin">Buyer GSTIN</Label>
                    <Input
                      id="buyer_gstin"
                      value={formData.buyer_gstin}
                      onChange={(e) => setFormData({ ...formData, buyer_gstin: e.target.value.toUpperCase() })}
                      placeholder="e.g., 27XXXXX1234X1ZX"
                    />
                  </div>
                  <div className="md:col-span-2">
                    <Label htmlFor="client_address">Client Address</Label>
                    <Textarea
                      id="client_address"
                      value={formData.client_address}
                      onChange={(e) => setFormData({ ...formData, client_address: e.target.value })}
                    />
                  </div>
                </div>
              </div>

              <Separator />

              {/* Invoice Items */}
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="font-semibold text-lg">Invoice Items</h3>
                  <Button type="button" variant="outline" size="sm" onClick={addItem}>
                    <Plus className="w-4 h-4 mr-1" /> Add Item
                  </Button>
                </div>
                {items.map((item, i) => (
                  <div key={i} className="grid grid-cols-12 gap-2 items-end p-4 bg-muted/30 rounded-lg">
                    <div className="col-span-12 md:col-span-4">
                      <Label>Description</Label>
                      <Input
                        value={item.description}
                        onChange={(e) => updateItem(i, "description", e.target.value)}
                        placeholder="Product or service"
                        required
                      />
                    </div>
                    <div className="col-span-4 md:col-span-2">
                      <Label>Qty</Label>
                      <Input
                        type="number"
                        min="1"
                        value={item.quantity}
                        onChange={(e) => updateItem(i, "quantity", Number(e.target.value))}
                        required
                      />
                    </div>
                    <div className="col-span-4 md:col-span-2">
                      <Label>Rate (₹)</Label>
                      <Input
                        type="number"
                        min="0"
                        step="0.01"
                        value={item.price}
                        onChange={(e) => updateItem(i, "price", Number(e.target.value))}
                        required
                      />
                    </div>
                    <div className="col-span-3 md:col-span-2">
                      <Label>GST %</Label>
                      <Select
                        value={String(item.gst_rate || DEFAULT_GST_RATE)}
                        onValueChange={(value) => updateItem(i, "gst_rate", Number(value))}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="0">0%</SelectItem>
                          <SelectItem value="5">5%</SelectItem>
                          <SelectItem value="12">12%</SelectItem>
                          <SelectItem value="18">18%</SelectItem>
                          <SelectItem value="28">28%</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="col-span-1 md:col-span-2 flex justify-end">
                      {items.length > 1 && (
                        <Button type="button" variant="ghost" size="icon" onClick={() => removeItem(i)}>
                          <Trash2 className="w-4 h-4 text-destructive" />
                        </Button>
                      )}
                    </div>
                  </div>
                ))}
              </div>

              {/* Totals */}
              <Card className="bg-muted/30">
                <CardContent className="pt-4">
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Subtotal:</span>
                      <span>{formatCurrency(totals.subtotal)}</span>
                    </div>
                    {isInterState ? (
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">IGST ({DEFAULT_GST_RATE}%):</span>
                        <span>{formatCurrency(totals.totalIgst)}</span>
                      </div>
                    ) : (
                      <>
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">CGST ({DEFAULT_GST_RATE / 2}%):</span>
                          <span>{formatCurrency(totals.totalCgst)}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">SGST ({DEFAULT_GST_RATE / 2}%):</span>
                          <span>{formatCurrency(totals.totalSgst)}</span>
                        </div>
                      </>
                    )}
                    <Separator className="my-2" />
                    <div className="flex justify-between font-bold text-lg">
                      <span>Grand Total:</span>
                      <span className="text-primary">{formatCurrency(totals.grandTotal)}</span>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Notes */}
              <div>
                <Label htmlFor="notes">Notes</Label>
                <Textarea
                  id="notes"
                  value={formData.notes}
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                  placeholder="Additional notes for this invoice"
                />
              </div>

              <Button type="submit" className="w-full">Create Invoice</Button>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Tabs for Proforma and Final Invoices */}
      <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as "proforma" | "final")}>
        <TabsList className="grid w-full max-w-md grid-cols-2">
          <TabsTrigger value="proforma" className="gap-2">
            <Receipt className="w-4 h-4" />
            Proforma ({proformaCount})
          </TabsTrigger>
          <TabsTrigger value="final" className="gap-2">
            <FileCheck className="w-4 h-4" />
            Final Invoices ({finalCount})
          </TabsTrigger>
        </TabsList>

        {/* Search and Filters */}
        <div className="mt-4 grid grid-cols-1 md:grid-cols-4 gap-3">
          <div className="relative md:col-span-2">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="Search by invoice number, order number, or customer name..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>
          <Select value={paymentFilter} onValueChange={setPaymentFilter}>
            <SelectTrigger>
              <Filter className="w-4 h-4 mr-2" />
              <SelectValue placeholder="Payment Type" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Payments</SelectItem>
              <SelectItem value="online">Online Payments</SelectItem>
              <SelectItem value="cod">Cash on Delivery</SelectItem>
            </SelectContent>
          </Select>
          <div className="flex gap-2">
            <Input
              type="date"
              placeholder="From"
              value={dateRange.from}
              onChange={(e) => setDateRange({ ...dateRange, from: e.target.value })}
              className="w-full"
            />
            <Input
              type="date"
              placeholder="To"
              value={dateRange.to}
              onChange={(e) => setDateRange({ ...dateRange, to: e.target.value })}
              className="w-full"
            />
          </div>
        </div>

        {/* Invoice Lists */}
        <TabsContent value="proforma" className="mt-4">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-lg">
                <Receipt className="w-5 h-5 text-amber-500" />
                Proforma Invoices
              </CardTitle>
              <CardDescription>
                Temporary invoices generated at order placement. Not valid for tax filing.
              </CardDescription>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <div className="space-y-3">
                  {[...Array(3)].map((_, i) => (
                    <Skeleton key={i} className="h-16 w-full" />
                  ))}
                </div>
              ) : filteredInvoices.length > 0 ? (
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Invoice #</TableHead>
                        <TableHead>Order #</TableHead>
                        <TableHead>Customer</TableHead>
                        <TableHead>Date</TableHead>
                        <TableHead>Payment</TableHead>
                        <TableHead className="text-right">Amount</TableHead>
                        <TableHead className="text-right">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredInvoices.map((invoice) => (
                        <TableRow key={invoice.id}>
                          <TableCell className="font-medium">{invoice.invoice_number}</TableCell>
                          <TableCell>
                            {invoice.order?.order_number || (
                              <span className="text-muted-foreground text-xs">Manual</span>
                            )}
                          </TableCell>
                          <TableCell>{invoice.client_name}</TableCell>
                          <TableCell className="text-muted-foreground">
                            {format(new Date(invoice.created_at), "dd MMM yyyy")}
                          </TableCell>
                          <TableCell>
                            {invoice.order && getPaymentTypeBadge(invoice)}
                          </TableCell>
                          <TableCell className="text-right font-semibold">
                            {formatCurrency(invoice.total_amount)}
                          </TableCell>
                          <TableCell className="text-right">
                            <div className="flex justify-end gap-1">
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => handleViewInvoice(invoice)}
                              >
                                <Eye className="w-4 h-4" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => downloadInvoice(invoice)}
                                disabled={isDownloading}
                              >
                                <Download className="w-4 h-4" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => handleDelete(invoice.id)}
                                className="text-destructive hover:text-destructive"
                              >
                                <Trash2 className="w-4 h-4" />
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              ) : (
                <div className="text-center py-12 text-muted-foreground">
                  <Receipt className="w-12 h-12 mx-auto mb-3 opacity-30" />
                  <p>No proforma invoices found</p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="final" className="mt-4">
          <Card>
            <CardHeader className="pb-3">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                <div>
                  <CardTitle className="flex items-center gap-2 text-lg">
                    <FileCheck className="w-5 h-5 text-green-500" />
                    Final Tax Invoices
                  </CardTitle>
                  <CardDescription>
                    Official GST-compliant invoices generated after order delivery. Valid for tax filing.
                  </CardDescription>
                </div>
                <div className="flex items-center gap-2">
                  {selectedInvoiceIds.size > 0 && (
                    <Button
                      size="sm"
                      onClick={handleBulkDownload}
                      disabled={isBulkDownloading}
                      className="gap-2"
                    >
                      {isBulkDownloading ? (
                        <>
                          <Loader2 className="w-4 h-4 animate-spin" />
                          {progress.current}/{progress.total}
                        </>
                      ) : (
                        <>
                          <FileDown className="w-4 h-4" />
                          Download Selected ({selectedInvoiceIds.size})
                        </>
                      )}
                    </Button>
                  )}
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleDownloadReport}
                    disabled={isBulkDownloading || finalInvoices.length === 0}
                    className="gap-2"
                  >
                    <FileText className="w-4 h-4" />
                    Download Report
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <div className="space-y-3">
                  {[...Array(3)].map((_, i) => (
                    <Skeleton key={i} className="h-16 w-full" />
                  ))}
                </div>
              ) : filteredInvoices.length > 0 ? (
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className="w-10">
                          <Checkbox
                            checked={selectedInvoiceIds.size === finalInvoices.length && finalInvoices.length > 0}
                            onCheckedChange={toggleSelectAll}
                            aria-label="Select all"
                          />
                        </TableHead>
                        <TableHead>Invoice #</TableHead>
                        <TableHead>Order #</TableHead>
                        <TableHead>Customer</TableHead>
                        <TableHead>Delivery Date</TableHead>
                        <TableHead>Payment</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead className="text-right">Amount</TableHead>
                        <TableHead className="text-right">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredInvoices.map((invoice) => {
                        const paymentStatus = getPaymentStatus(invoice);
                        const PaymentIcon = paymentStatus.icon;
                        return (
                          <TableRow key={invoice.id} className={selectedInvoiceIds.has(invoice.id) ? "bg-muted/50" : ""}>
                            <TableCell>
                              <Checkbox
                                checked={selectedInvoiceIds.has(invoice.id)}
                                onCheckedChange={() => toggleInvoiceSelection(invoice.id)}
                                aria-label={`Select invoice ${invoice.invoice_number}`}
                              />
                            </TableCell>
                            <TableCell className="font-medium">{invoice.invoice_number}</TableCell>
                            <TableCell>
                              {invoice.order?.order_number || (
                                <span className="text-muted-foreground text-xs">Manual</span>
                              )}
                            </TableCell>
                            <TableCell>{invoice.client_name}</TableCell>
                            <TableCell className="text-muted-foreground">
                              {invoice.delivery_date 
                                ? format(new Date(invoice.delivery_date), "dd MMM yyyy")
                                : format(new Date(invoice.created_at), "dd MMM yyyy")
                              }
                            </TableCell>
                            <TableCell>
                              {invoice.order && getPaymentTypeBadge(invoice)}
                            </TableCell>
                            <TableCell>
                              <Badge variant="outline" className={paymentStatus.color}>
                                <PaymentIcon className="w-3 h-3 mr-1" />
                                {paymentStatus.label}
                              </Badge>
                            </TableCell>
                            <TableCell className="text-right font-semibold">
                              {formatCurrency(invoice.total_amount)}
                            </TableCell>
                            <TableCell className="text-right">
                              <div className="flex justify-end gap-1">
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  onClick={() => handleViewInvoice(invoice)}
                                >
                                  <Eye className="w-4 h-4" />
                                </Button>
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  onClick={() => downloadInvoice(invoice)}
                                  disabled={isDownloading}
                                >
                                  <Download className="w-4 h-4" />
                                </Button>
                              </div>
                            </TableCell>
                          </TableRow>
                        );
                      })}
                    </TableBody>
                  </Table>
                </div>
              ) : (
                <div className="text-center py-12 text-muted-foreground">
                  <FileCheck className="w-12 h-12 mx-auto mb-3 opacity-30" />
                  <p>No final invoices found</p>
                  <p className="text-sm mt-1">Final invoices are generated automatically when orders are delivered</p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* View Invoice Dialog */}
      <Dialog open={viewDialogOpen} onOpenChange={setViewDialogOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-3">
              <FileText className="w-5 h-5 text-primary" />
              {selectedInvoice?.is_final ? "Tax Invoice" : "Proforma Invoice"} - {selectedInvoice?.invoice_number}
              {selectedInvoice?.is_final ? (
                <Badge className="bg-green-500/10 text-green-600 border-green-500/20">Final</Badge>
              ) : (
                <Badge className="bg-amber-500/10 text-amber-600 border-amber-500/20">Proforma</Badge>
              )}
            </DialogTitle>
          </DialogHeader>
          {selectedInvoice && (
            <div className="space-y-6 mt-4">
              {/* Invoice Header Preview */}
              <div className="grid grid-cols-2 gap-6">
                <div>
                  <h3 className="font-bold text-xl text-primary">{COMPANY_SETTINGS.business_name}</h3>
                  <p className="text-sm text-muted-foreground">{COMPANY_SETTINGS.business_address}</p>
                  <p className="text-sm text-muted-foreground">
                    {COMPANY_SETTINGS.business_city}, {COMPANY_SETTINGS.business_state} - {COMPANY_SETTINGS.business_pincode}
                  </p>
                  <p className="text-sm text-muted-foreground">GSTIN: {COMPANY_SETTINGS.business_gstin}</p>
                </div>
                <div className="text-right">
                  <div className={`inline-block px-4 py-2 rounded-lg ${selectedInvoice.is_final ? 'bg-green-500/10' : 'bg-amber-500/10'}`}>
                    <p className={`font-bold ${selectedInvoice.is_final ? 'text-green-600' : 'text-amber-600'}`}>
                      {selectedInvoice.is_final ? "TAX INVOICE" : "PROFORMA INVOICE"}
                    </p>
                    {!selectedInvoice.is_final && (
                      <p className="text-xs text-muted-foreground">Temporary - Not a Tax Document</p>
                    )}
                  </div>
                  <p className="text-sm mt-2">
                    <span className="text-muted-foreground">Invoice #:</span> {selectedInvoice.invoice_number}
                  </p>
                  <p className="text-sm">
                    <span className="text-muted-foreground">Date:</span>{" "}
                    {format(new Date(selectedInvoice.created_at), "dd MMM yyyy")}
                  </p>
                  {selectedInvoice.order?.order_number && (
                    <p className="text-sm">
                      <span className="text-muted-foreground">Order #:</span> {selectedInvoice.order.order_number}
                    </p>
                  )}
                </div>
              </div>

              <Separator />

              {/* Bill To */}
              <div>
                <h4 className="text-sm font-semibold text-primary mb-2">BILL TO</h4>
                <p className="font-medium">{selectedInvoice.client_name}</p>
                {selectedInvoice.client_address && (
                  <p className="text-sm text-muted-foreground">{selectedInvoice.client_address}</p>
                )}
                {selectedInvoice.client_email && (
                  <p className="text-sm text-muted-foreground">{selectedInvoice.client_email}</p>
                )}
                {selectedInvoice.buyer_state && (
                  <p className="text-sm text-muted-foreground">State: {selectedInvoice.buyer_state}</p>
                )}
                {selectedInvoice.buyer_gstin && (
                  <p className="text-sm font-medium text-primary">GSTIN: {selectedInvoice.buyer_gstin}</p>
                )}
              </div>

              {/* Items Table */}
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>#</TableHead>
                    <TableHead>Description</TableHead>
                    <TableHead className="text-right">Qty</TableHead>
                    <TableHead className="text-right">Rate</TableHead>
                    <TableHead className="text-right">GST</TableHead>
                    <TableHead className="text-right">Total</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {selectedInvoice.items.map((item, i) => (
                    <TableRow key={i}>
                      <TableCell>{i + 1}</TableCell>
                      <TableCell>{item.description}</TableCell>
                      <TableCell className="text-right">{item.quantity}</TableCell>
                      <TableCell className="text-right">{formatCurrency(item.price)}</TableCell>
                      <TableCell className="text-right">{item.gst_rate || 18}%</TableCell>
                      <TableCell className="text-right font-medium">
                        {formatCurrency(item.total || item.quantity * item.price)}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>

              {/* Totals */}
              <div className="flex justify-end">
                <div className="w-72 space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Subtotal:</span>
                    <span>{formatCurrency(selectedInvoice.subtotal)}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">GST:</span>
                    <span>{getGstDisplay(selectedInvoice)}</span>
                  </div>
                  <Separator />
                  <div className="flex justify-between font-bold text-lg">
                    <span>Total:</span>
                    <span className="text-primary">{formatCurrency(selectedInvoice.total_amount)}</span>
                  </div>
                </div>
              </div>

              {/* Actions */}
              <div className="flex gap-3 justify-end pt-4">
                <Button variant="outline" onClick={() => setViewDialogOpen(false)}>
                  Close
                </Button>
                <Button onClick={() => downloadInvoice(selectedInvoice)} disabled={isDownloading}>
                  <Download className="w-4 h-4 mr-2" />
                  Download PDF
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
