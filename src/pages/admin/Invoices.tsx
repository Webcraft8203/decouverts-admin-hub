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
import { useUnifiedInvoicePdf, type Invoice } from "@/hooks/useUnifiedInvoicePdf";
import { Plus, Trash2, Download, FileText, Eye, X, Search, Filter, Calendar, CreditCard, Banknote, CheckCircle, Clock, AlertCircle, Receipt, FileCheck, FileDown, Loader2, Mail, Pencil } from "lucide-react";
import { toast as sonnerToast } from "sonner";
import { INDIAN_STATES } from "@/constants/indianStates";
import { format } from "date-fns";

// Invoice item interface - standardized
interface InvoiceItem {
  description: string;
  hsn_code: string;
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
    hsn_code: item.hsn_code || item.hsn || "",
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

// Use Invoice type from useUnifiedInvoicePdf hook

// Default GST rate
const DEFAULT_GST_RATE = 18;

// Invoice Settings (matches the generate-invoice edge function)
const COMPANY_SETTINGS = {
  business_name: "DECOUVERTES FUTURE TECH PRIVATE LIMITED",
  business_address: "A-414, Gera's Imperium Gateway, Near Nashik Phata Flyover, Opp. Bhosari Metro Station, Kasarwadi, Pimpri-Chinchwad",
  business_city: "Pune",
  business_state: "Maharashtra",
  business_pincode: "411034",
  business_country: "India",
  business_phone: "+91 9561103435",
  business_email: "hello@decouvertes.in",
  business_gstin: "27AAKCD1492N1Z4",
  terms_and_conditions: "1. Goods once sold are non-refundable.\n2. Payment due within 30 days.\n3. Warranty as per product terms.",
};

// Enhanced status badges with more states
const invoiceStatusConfig = {
  // Invoice type badges
  proforma: { label: "Proforma", color: "bg-amber-100 text-amber-700 border-amber-200", icon: Receipt },
  final: { label: "Tax Invoice", color: "bg-emerald-100 text-emerald-700 border-emerald-200", icon: FileCheck },
  
  // Payment status
  pending: { label: "Pending", color: "bg-slate-100 text-slate-600 border-slate-200", icon: Clock },
  paid: { label: "Paid", color: "bg-green-100 text-green-700 border-green-200", icon: CheckCircle },
  awaiting_delivery: { label: "Awaiting Delivery", color: "bg-blue-100 text-blue-700 border-blue-200", icon: Clock },
  delivered: { label: "Delivered", color: "bg-teal-100 text-teal-700 border-teal-200", icon: CheckCircle },
  
  // COD specific
  cod_pending: { label: "COD Pending", color: "bg-amber-100 text-amber-700 border-amber-200", icon: Banknote },
  cod_collected: { label: "Collected by Courier", color: "bg-blue-100 text-blue-700 border-blue-200", icon: Banknote },
  cod_settled: { label: "COD Settled", color: "bg-green-100 text-green-700 border-green-200", icon: CheckCircle },
  
  // Offline payment
  offline_paid: { label: "Offline Paid", color: "bg-purple-100 text-purple-700 border-purple-200", icon: Banknote },
  
  failed: { label: "Failed", color: "bg-red-100 text-red-700 border-red-200", icon: AlertCircle },
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
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [dateRange, setDateRange] = useState<{ from: string; to: string }>({ from: "", to: "" });
  
  const [formData, setFormData] = useState({
    client_name: "",
    client_email: "",
    client_address: "",
    notes: "",
    buyer_state: "Maharashtra",
    buyer_gstin: "",
  });
  const [items, setItems] = useState<InvoiceItem[]>([{ description: "", hsn_code: "", quantity: 1, price: 0, gst_rate: DEFAULT_GST_RATE }]);
  const [editingInvoiceId, setEditingInvoiceId] = useState<string | null>(null);

  // Email-invoice state
  const [emailDialogOpen, setEmailDialogOpen] = useState(false);
  const [emailTarget, setEmailTarget] = useState<Invoice | null>(null);
  const [emailRecipient, setEmailRecipient] = useState("");
  const [emailMessage, setEmailMessage] = useState("");
  const [isSendingEmail, setIsSendingEmail] = useState(false);

  const { toast } = useToast();
  const { user } = useAuth();
  
  // Bulk download hook
  const { downloadBulkInvoices, downloadInvoiceReport, isDownloading: isBulkDownloading, progress } = useBulkInvoiceDownload();
  
  // Unified invoice PDF hook
  const { downloadInvoice, generateInvoicePdf, isGenerating: isPdfGenerating } = useUnifiedInvoicePdf();

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
      (invoice.order?.order_number || "").toLowerCase().includes(query) ||
      (invoice.client_email || "").toLowerCase().includes(query);
    
    // Payment type filter
    const isCOD = !invoice.order?.payment_id || invoice.order.payment_id.startsWith("COD");
    const isOnline = invoice.order?.payment_id?.startsWith("pay_");
    const isOffline = !invoice.order_id; // Manual/offline invoices have no order
    
    const matchesPayment = paymentFilter === "all" || 
      (paymentFilter === "online" && isOnline) ||
      (paymentFilter === "cod" && isCOD && !isOffline) ||
      (paymentFilter === "offline" && isOffline);
    
    // Status filter
    const orderStatus = invoice.order?.status || "";
    const paymentStatus = invoice.order?.payment_status || "";
    
    const matchesStatus = statusFilter === "all" ||
      (statusFilter === "delivered" && orderStatus === "delivered") ||
      (statusFilter === "awaiting" && orderStatus !== "delivered" && !isOffline) ||
      (statusFilter === "paid" && paymentStatus === "paid") ||
      (statusFilter === "pending" && paymentStatus !== "paid" && !isOffline);
    
    // Date range filter
    const invoiceDate = new Date(invoice.created_at);
    const matchesDateFrom = !dateRange.from || invoiceDate >= new Date(dateRange.from);
    const matchesDateTo = !dateRange.to || invoiceDate <= new Date(dateRange.to + "T23:59:59");
    
    return matchesTab && matchesSearch && matchesPayment && matchesStatus && matchesDateFrom && matchesDateTo;
  });

  const addItem = () => setItems([...items, { description: "", hsn_code: "", quantity: 1, price: 0, gst_rate: DEFAULT_GST_RATE }]);
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

    // Validate HSN codes
    const invalidHsn = items.some(item => !item.hsn_code || !/^[a-zA-Z0-9]{4,10}$/.test(item.hsn_code.trim()));
    if (invalidHsn) {
      toast({ title: "Validation Error", description: "Each item must have a valid HSN code (4-10 alphanumeric characters)", variant: "destructive" });
      return;
    }

    // Prepare items with GST calculations
    const invoiceItems: InvoiceItem[] = items.map((item) => {
      const gst = calculateItemGst(item);
      return {
        description: item.description,
        hsn_code: item.hsn_code.trim(),
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

    const invoiceNumber = editingInvoiceId
      ? (invoices.find((i) => i.id === editingInvoiceId)?.invoice_number || `INV-${Date.now().toString(36).toUpperCase()}`)
      : `INV-${Date.now().toString(36).toUpperCase()}`;

    const payload = {
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
    };

    let error;
    if (editingInvoiceId) {
      ({ error } = await supabase.from("invoices").update(payload).eq("id", editingInvoiceId));
    } else {
      ({ error } = await supabase.from("invoices").insert([{ ...payload, created_by: user?.id }]));
    }

    if (error) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
      return;
    }

    toast({
      title: editingInvoiceId ? "Invoice updated" : "Invoice created",
      description: `Invoice ${invoiceNumber} ${editingInvoiceId ? "updated" : "generated"}`,
    });
    setDialogOpen(false);
    setEditingInvoiceId(null);
    setFormData({ client_name: "", client_email: "", client_address: "", notes: "", buyer_state: "Maharashtra", buyer_gstin: "" });
    setItems([{ description: "", hsn_code: "", quantity: 1, price: 0, gst_rate: DEFAULT_GST_RATE }]);
    fetchData();
  };

  const handleEdit = (invoice: Invoice) => {
    if (invoice.order_id) {
      toast({ title: "Cannot edit", description: "Auto-generated invoices from orders cannot be edited.", variant: "destructive" });
      return;
    }
    setEditingInvoiceId(invoice.id);
    setFormData({
      client_name: invoice.client_name || "",
      client_email: invoice.client_email || "",
      client_address: invoice.client_address || "",
      notes: invoice.notes || "",
      buyer_state: invoice.buyer_state || "Maharashtra",
      buyer_gstin: invoice.buyer_gstin || "",
    });
    const its = (invoice.items || []).map((it: any) => ({
      description: it.description || "",
      hsn_code: it.hsn_code || "",
      quantity: Number(it.quantity) || 1,
      price: Number(it.price) || 0,
      gst_rate: Number(it.gst_rate) || DEFAULT_GST_RATE,
    }));
    setItems(its.length > 0 ? its : [{ description: "", hsn_code: "", quantity: 1, price: 0, gst_rate: DEFAULT_GST_RATE }]);
    setDialogOpen(true);
  };

  const openEmailDialog = (invoice: Invoice) => {
    setEmailTarget(invoice);
    setEmailRecipient(invoice.client_email || "");
    setEmailMessage("");
    setEmailDialogOpen(true);
  };

  const blobToBase64 = (blob: Blob): Promise<string> =>
    new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onloadend = () => {
        const result = reader.result as string;
        // Strip "data:application/pdf;base64," prefix
        const base64 = result.includes(",") ? result.split(",")[1] : result;
        resolve(base64);
      };
      reader.onerror = () => reject(reader.error);
      reader.readAsDataURL(blob);
    });

  const handleSendEmail = async () => {
    if (!emailTarget) return;
    if (!emailRecipient || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(emailRecipient)) {
      toast({ title: "Invalid email", description: "Please enter a valid email address.", variant: "destructive" });
      return;
    }
    setIsSendingEmail(true);
    try {
      const blob = await generateInvoicePdf(emailTarget);
      const pdfBase64 = await blobToBase64(blob);
      const { data, error } = await supabase.functions.invoke("send-invoice-email", {
        body: {
          to: emailRecipient,
          invoiceNumber: emailTarget.invoice_number,
          clientName: emailTarget.client_name,
          totalAmount: emailTarget.total_amount,
          pdfBase64,
          message: emailMessage || undefined,
        },
      });
      if (error) throw error;
      if ((data as any)?.error) throw new Error((data as any).error);
      toast({ title: "Email sent", description: `Invoice emailed to ${emailRecipient}` });
      setEmailDialogOpen(false);
    } catch (e: any) {
      console.error("Send invoice email error:", e);
      toast({ title: "Failed to send", description: e?.message || "Could not send email", variant: "destructive" });
    } finally {
      setIsSendingEmail(false);
    }
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

  // Get payment type badge with improved styling
  const getPaymentTypeBadge = (invoice: Invoice) => {
    const isOffline = !invoice.order_id;
    const isCOD = !isOffline && (!invoice.order?.payment_id || invoice.order.payment_id.startsWith("COD"));
    const isOnline = invoice.order?.payment_id?.startsWith("pay_");
    
    if (isOffline) {
      return (
        <Badge variant="outline" className="bg-purple-50 text-purple-700 border-purple-200 font-medium">
          <Banknote className="w-3 h-3 mr-1" />
          Offline
        </Badge>
      );
    }
    if (isCOD) {
      return (
        <Badge variant="outline" className="bg-amber-50 text-amber-700 border-amber-200 font-medium">
          <Banknote className="w-3 h-3 mr-1" />
          COD
        </Badge>
      );
    }
    return (
      <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200 font-medium">
        <CreditCard className="w-3 h-3 mr-1" />
        Online
      </Badge>
    );
  };

  // Get comprehensive status badge
  const getStatusBadge = (invoice: Invoice) => {
    const orderStatus = invoice.order?.status || "";
    const paymentStatus = invoice.order?.payment_status || "";
    const isOffline = !invoice.order_id;
    const isCOD = !isOffline && (!invoice.order?.payment_id || invoice.order.payment_id?.startsWith("COD"));
    
    // Offline/Manual invoices - always show as paid
    if (isOffline) {
      return invoiceStatusConfig.offline_paid;
    }
    
    // COD orders
    if (isCOD) {
      if (paymentStatus === "paid") {
        return invoiceStatusConfig.cod_settled;
      }
      if (orderStatus === "delivered") {
        return invoiceStatusConfig.cod_collected;
      }
      return invoiceStatusConfig.cod_pending;
    }
    
    // Online orders
    if (paymentStatus === "paid") {
      if (orderStatus === "delivered") {
        return invoiceStatusConfig.delivered;
      }
      return invoiceStatusConfig.paid;
    }
    
    return invoiceStatusConfig.pending;
  };

  // Legacy function for backward compatibility
  const getPaymentStatus = getStatusBadge;

  // PDF generation and download now handled by useUnifiedInvoicePdf hook

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
        <Dialog
          open={dialogOpen}
          onOpenChange={(open) => {
            setDialogOpen(open);
            if (!open) {
              setEditingInvoiceId(null);
              setFormData({ client_name: "", client_email: "", client_address: "", notes: "", buyer_state: "Maharashtra", buyer_gstin: "" });
              setItems([{ description: "", hsn_code: "", quantity: 1, price: 0, gst_rate: DEFAULT_GST_RATE }]);
            }
          }}
        >
          <DialogTrigger asChild>
            <Button className="gap-2">
              <Plus className="w-4 h-4" />
              Create Manual Invoice
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>{editingInvoiceId ? "Edit Invoice" : "Create New Invoice"}</DialogTitle>
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
                  <div key={i} className="space-y-2 p-4 bg-muted/30 rounded-lg">
                    <div className="grid grid-cols-12 gap-2 items-end">
                      <div className="col-span-12 md:col-span-3">
                        <Label>Description <span className="text-destructive">*</span></Label>
                        <Input
                          value={item.description}
                          onChange={(e) => updateItem(i, "description", e.target.value)}
                          placeholder="Product or service"
                          required
                        />
                      </div>
                      <div className="col-span-6 md:col-span-2">
                        <Label>HSN Code <span className="text-destructive">*</span></Label>
                        <Input
                          value={item.hsn_code}
                          onChange={(e) => updateItem(i, "hsn_code", e.target.value.replace(/[^a-zA-Z0-9]/g, '').slice(0, 10))}
                          placeholder="e.g., 8471"
                          required
                          className={!item.hsn_code || /^[a-zA-Z0-9]{4,10}$/.test(item.hsn_code) ? '' : 'border-destructive'}
                        />
                        {item.hsn_code && !/^[a-zA-Z0-9]{4,10}$/.test(item.hsn_code) && (
                          <p className="text-[10px] text-destructive mt-0.5">4-10 alphanumeric chars</p>
                        )}
                      </div>
                      <div className="col-span-3 md:col-span-1">
                        <Label>Qty</Label>
                        <Input
                          type="number"
                          min="1"
                          value={item.quantity}
                          onChange={(e) => updateItem(i, "quantity", Number(e.target.value))}
                          required
                        />
                      </div>
                      <div className="col-span-3 md:col-span-2">
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
                      <div className="col-span-3 md:col-span-2 flex justify-end">
                        {items.length > 1 && (
                          <Button type="button" variant="ghost" size="icon" onClick={() => removeItem(i)}>
                            <Trash2 className="w-4 h-4 text-destructive" />
                          </Button>
                        )}
                      </div>
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

              <Button type="submit" className="w-full">{editingInvoiceId ? "Update Invoice" : "Create Invoice"}</Button>
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
        <div className="mt-4 space-y-3">
          <div className="grid grid-cols-1 md:grid-cols-12 gap-3">
            {/* Search - takes more space */}
            <div className="relative md:col-span-4">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                placeholder="Search invoice, order, customer..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
            
            {/* Payment Type Filter */}
            <div className="md:col-span-2">
              <Select value={paymentFilter} onValueChange={setPaymentFilter}>
                <SelectTrigger>
                  <CreditCard className="w-4 h-4 mr-2 text-muted-foreground" />
                  <SelectValue placeholder="Payment" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Payments</SelectItem>
                  <SelectItem value="online">Online</SelectItem>
                  <SelectItem value="cod">COD</SelectItem>
                  <SelectItem value="offline">Offline/Manual</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            {/* Status Filter */}
            <div className="md:col-span-2">
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger>
                  <Filter className="w-4 h-4 mr-2 text-muted-foreground" />
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="paid">Paid</SelectItem>
                  <SelectItem value="pending">Pending</SelectItem>
                  <SelectItem value="delivered">Delivered</SelectItem>
                  <SelectItem value="awaiting">Awaiting Delivery</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            {/* Date Range */}
            <div className="md:col-span-4 flex gap-2">
              <div className="flex-1">
                <Input
                  type="date"
                  placeholder="From"
                  value={dateRange.from}
                  onChange={(e) => setDateRange({ ...dateRange, from: e.target.value })}
                  className="w-full"
                />
              </div>
              <div className="flex-1">
                <Input
                  type="date"
                  placeholder="To"
                  value={dateRange.to}
                  onChange={(e) => setDateRange({ ...dateRange, to: e.target.value })}
                  className="w-full"
                />
              </div>
              {(searchQuery || paymentFilter !== "all" || statusFilter !== "all" || dateRange.from || dateRange.to) && (
                <Button 
                  variant="ghost" 
                  size="icon"
                  onClick={() => {
                    setSearchQuery("");
                    setPaymentFilter("all");
                    setStatusFilter("all");
                    setDateRange({ from: "", to: "" });
                  }}
                  className="shrink-0"
                >
                  <X className="w-4 h-4" />
                </Button>
              )}
            </div>
          </div>
          
          {/* Active filters summary */}
          {(searchQuery || paymentFilter !== "all" || statusFilter !== "all" || dateRange.from || dateRange.to) && (
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <span>Showing {filteredInvoices.length} of {activeTab === "proforma" ? proformaCount : finalCount} invoices</span>
              {searchQuery && <Badge variant="secondary" className="text-xs">Search: {searchQuery}</Badge>}
              {paymentFilter !== "all" && <Badge variant="secondary" className="text-xs capitalize">{paymentFilter}</Badge>}
              {statusFilter !== "all" && <Badge variant="secondary" className="text-xs capitalize">{statusFilter}</Badge>}
              {(dateRange.from || dateRange.to) && <Badge variant="secondary" className="text-xs">Date filtered</Badge>}
            </div>
          )}
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

      {/* View Invoice Dialog - Premium Design */}
      <Dialog open={viewDialogOpen} onOpenChange={setViewDialogOpen}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto p-0 gap-0">
          {selectedInvoice && (() => {
            const inv = selectedInvoice;
            const isFinal = inv.is_final || inv.invoice_type === "final";
            const isManual = !inv.order_id;
            const isIgst = inv.is_igst || (inv.buyer_state?.toLowerCase() !== COMPANY_SETTINGS.business_state.toLowerCase());
            const cgst = inv.cgst_amount || inv.tax_amount / 2;
            const sgst = inv.sgst_amount || inv.tax_amount / 2;
            const igst = inv.igst_amount || inv.tax_amount;

            return (
              <div className="bg-white dark:bg-card">
                {/* ── Top accent bar ── */}
                <div className="h-1.5 bg-gradient-to-r from-[#D4AF37] via-[#E67E22] to-[#D4AF37]" />

                {/* ── Header ── */}
                <div className="px-8 pt-6 pb-5">
                  <div className="flex items-start justify-between gap-6">
                    {/* Left: Company info */}
                    <div className="space-y-1">
                      <h2 className="text-xl font-extrabold tracking-tight text-foreground leading-none">DECOUVERTES</h2>
                      <p className="text-xs italic text-[#E67E22] font-medium">Discovering Future Technologies</p>
                      <div className="pt-2 space-y-0.5">
                        <p className="text-[11px] text-muted-foreground leading-relaxed max-w-xs">{COMPANY_SETTINGS.business_address}</p>
                        <p className="text-[11px] text-muted-foreground">{COMPANY_SETTINGS.business_city}, {COMPANY_SETTINGS.business_state} – {COMPANY_SETTINGS.business_pincode}</p>
                        <p className="text-[11px] text-muted-foreground">Phone: {COMPANY_SETTINGS.business_phone} · Email: {COMPANY_SETTINGS.business_email}</p>
                        <p className="text-[11px] font-semibold text-foreground">GSTIN: {COMPANY_SETTINGS.business_gstin} · PAN: AAKCD1492N</p>
                      </div>
                    </div>
                    {/* Right: Invoice type + meta */}
                    <div className="text-right shrink-0 space-y-3">
                      <div className={`inline-flex items-center gap-2 px-4 py-1.5 rounded-md text-sm font-bold tracking-wide ${isFinal ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-400' : 'bg-amber-50 text-amber-700 dark:bg-amber-500/10 dark:text-amber-400'}`}>
                        {isFinal ? <FileCheck className="w-4 h-4" /> : <Receipt className="w-4 h-4" />}
                        {isFinal ? "TAX INVOICE" : "PROFORMA INVOICE"}
                      </div>
                      {!isFinal && <p className="text-[10px] text-muted-foreground">Not valid for tax purposes</p>}
                      <div className="space-y-1 pt-1">
                        <div className="flex justify-end gap-2 text-xs">
                          <span className="text-muted-foreground">Invoice No.</span>
                          <span className="font-semibold text-foreground min-w-[100px] text-right">{inv.invoice_number}</span>
                        </div>
                        <div className="flex justify-end gap-2 text-xs">
                          <span className="text-muted-foreground">Date</span>
                          <span className="font-semibold text-foreground min-w-[100px] text-right">{format(new Date(inv.created_at), "dd MMM yyyy")}</span>
                        </div>
                        {inv.order?.order_number && (
                          <div className="flex justify-end gap-2 text-xs">
                            <span className="text-muted-foreground">Order No.</span>
                            <span className="font-semibold text-foreground min-w-[100px] text-right">{inv.order.order_number}</span>
                          </div>
                        )}
                        {inv.delivery_date && (
                          <div className="flex justify-end gap-2 text-xs">
                            <span className="text-muted-foreground">Delivery</span>
                            <span className="font-semibold text-foreground min-w-[100px] text-right">{format(new Date(inv.delivery_date), "dd MMM yyyy")}</span>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>

                {/* ── Gold divider ── */}
                <div className="h-[2px] mx-8 bg-gradient-to-r from-[#D4AF37]/60 via-[#D4AF37] to-[#D4AF37]/60" />

                {/* ── Billing section ── */}
                <div className="px-8 py-5 grid grid-cols-2 gap-4">
                  {/* Billed By */}
                  <div className="rounded-lg border bg-muted/20 overflow-hidden">
                    <div className="bg-foreground text-background px-4 py-1.5">
                      <p className="text-[11px] font-bold tracking-wider">BILLED BY</p>
                    </div>
                    <div className="px-4 py-3 space-y-0.5">
                      <p className="text-xs font-bold text-foreground">{COMPANY_SETTINGS.business_name}</p>
                      <p className="text-[11px] text-muted-foreground leading-relaxed">{COMPANY_SETTINGS.business_address}</p>
                      <p className="text-[11px] text-muted-foreground">{COMPANY_SETTINGS.business_city}, {COMPANY_SETTINGS.business_state} – {COMPANY_SETTINGS.business_pincode}</p>
                      <p className="text-[11px] text-muted-foreground">Phone: {COMPANY_SETTINGS.business_phone}</p>
                      <p className="text-[11px] text-muted-foreground">Email: {COMPANY_SETTINGS.business_email}</p>
                      <p className="text-[11px] font-semibold text-[#D4AF37] pt-0.5">GSTIN: {COMPANY_SETTINGS.business_gstin}</p>
                      <p className="text-[11px] font-semibold text-[#D4AF37]">PAN: AAKCD1492N</p>
                    </div>
                  </div>
                  {/* Billed To */}
                  <div className="rounded-lg border bg-muted/20 overflow-hidden">
                    <div className="bg-[#D4AF37] text-foreground px-4 py-1.5">
                      <p className="text-[11px] font-bold tracking-wider">BILLED TO</p>
                    </div>
                    <div className="px-4 py-3 space-y-0.5">
                      <p className="text-xs font-bold text-foreground">{inv.client_name}</p>
                      {inv.client_address && <p className="text-[11px] text-muted-foreground leading-relaxed break-words whitespace-pre-wrap">{inv.client_address}</p>}
                      {inv.client_email && <p className="text-[11px] text-muted-foreground">{inv.client_email}</p>}
                      {inv.buyer_state && <p className="text-[11px] text-muted-foreground">State: {inv.buyer_state}</p>}
                      {inv.buyer_gstin && <p className="text-[11px] font-semibold text-[#D4AF37] pt-0.5">GSTIN: {inv.buyer_gstin}</p>}
                    </div>
                  </div>
                </div>

                {/* ── Items table ── */}
                <div className="px-8">
                  <div className="rounded-lg overflow-hidden border">
                    <table className="w-full text-xs">
                      <thead>
                        <tr className="bg-foreground text-background">
                          <th className="px-3 py-2.5 text-center font-semibold w-8">#</th>
                          <th className="px-3 py-2.5 text-left font-semibold">Item Description</th>
                          <th className="px-3 py-2.5 text-center font-semibold w-16">HSN</th>
                          <th className="px-3 py-2.5 text-center font-semibold w-12">Qty</th>
                          <th className="px-3 py-2.5 text-right font-semibold w-20">Rate</th>
                          <th className="px-3 py-2.5 text-right font-semibold w-20">Taxable</th>
                          <th className="px-3 py-2.5 text-center font-semibold w-14">GST %</th>
                          <th className="px-3 py-2.5 text-right font-semibold w-20">GST Amt</th>
                          <th className="px-3 py-2.5 text-right font-semibold w-20">Total</th>
                        </tr>
                      </thead>
                      <tbody>
                        {inv.items.map((item, i) => {
                          const qty = Number(item.quantity) || 1;
                          const rate = Number(item.price || item.rate || item.product_price) || 0;
                          const taxableValue = Number(item.taxable_value) || qty * rate;
                          const gstRate = Number(item.gst_rate) || 18;
                          const gstAmt = isIgst 
                            ? Number(item.igst_amount) || (taxableValue * gstRate / 100)
                            : (Number(item.cgst_amount) || 0) + (Number(item.sgst_amount) || 0) || (taxableValue * gstRate / 100);
                          const total = Number(item.total) || taxableValue + gstAmt;
                          const hsn = item.hsn_code || (item as any).hsn || "N/A";

                          return (
                            <tr key={i} className={`border-t ${i % 2 === 0 ? 'bg-background' : 'bg-muted/30'}`}>
                              <td className="px-3 py-3 text-center text-muted-foreground">{i + 1}</td>
                              <td className="px-3 py-3 font-medium text-foreground break-words whitespace-pre-wrap">{item.description || item.name || item.product_name}</td>
                              <td className="px-3 py-3 text-center text-muted-foreground font-mono text-[10px]">{hsn}</td>
                              <td className="px-3 py-3 text-center tabular-nums">{qty}</td>
                              <td className="px-3 py-3 text-right tabular-nums">{formatCurrency(rate)}</td>
                              <td className="px-3 py-3 text-right tabular-nums">{formatCurrency(taxableValue)}</td>
                              <td className="px-3 py-3 text-center font-semibold text-[#D4AF37]">{gstRate}%</td>
                              <td className="px-3 py-3 text-right tabular-nums">{formatCurrency(gstAmt)}</td>
                              <td className="px-3 py-3 text-right font-semibold tabular-nums">{formatCurrency(total)}</td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                </div>

                {/* ── Amount in words ── */}
                <div className="px-8 pt-4">
                  <div className="rounded-md bg-muted/40 border px-4 py-2.5">
                    <p className="text-[10px] text-muted-foreground mb-0.5">Amount in Words</p>
                    <p className="text-xs font-semibold text-foreground italic">
                      {(() => {
                        const ones = ['', 'One', 'Two', 'Three', 'Four', 'Five', 'Six', 'Seven', 'Eight', 'Nine', 'Ten',
                          'Eleven', 'Twelve', 'Thirteen', 'Fourteen', 'Fifteen', 'Sixteen', 'Seventeen', 'Eighteen', 'Nineteen'];
                        const tens = ['', '', 'Twenty', 'Thirty', 'Forty', 'Fifty', 'Sixty', 'Seventy', 'Eighty', 'Ninety'];
                        const convert = (n: number): string => {
                          if (n < 20) return ones[n];
                          if (n < 100) return tens[Math.floor(n / 10)] + (n % 10 ? ' ' + ones[n % 10] : '');
                          if (n < 1000) return ones[Math.floor(n / 100)] + ' Hundred' + (n % 100 ? ' And ' + convert(n % 100) : '');
                          if (n < 100000) return convert(Math.floor(n / 1000)) + ' Thousand' + (n % 1000 ? ' ' + convert(n % 1000) : '');
                          if (n < 10000000) return convert(Math.floor(n / 100000)) + ' Lakh' + (n % 100000 ? ' ' + convert(n % 100000) : '');
                          return convert(Math.floor(n / 10000000)) + ' Crore' + (n % 10000000 ? ' ' + convert(n % 10000000) : '');
                        };
                        const r = Math.floor(inv.total_amount);
                        const p = Math.round((inv.total_amount - r) * 100);
                        return convert(r) + ' Rupees' + (p > 0 ? ' And ' + convert(p) + ' Paise' : '') + ' Only';
                      })()}
                    </p>
                  </div>
                </div>

                {/* ── Summary section ── */}
                <div className="px-8 py-5 grid grid-cols-2 gap-4">
                  {/* Tax Summary */}
                  <div className="rounded-lg border bg-muted/20 p-4 space-y-2">
                    <h4 className="text-xs font-bold text-foreground tracking-wide">TAX SUMMARY</h4>
                    <Separator />
                    <div className="space-y-1.5 text-xs">
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Supply Type</span>
                        <span className="font-medium">{isIgst ? 'Inter-State' : 'Intra-State'}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Place of Supply</span>
                        <span className="font-medium">{inv.buyer_state || COMPANY_SETTINGS.business_state}</span>
                      </div>
                      <Separator />
                      {isIgst ? (
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">IGST</span>
                          <span className="font-semibold tabular-nums">{formatCurrency(igst)}</span>
                        </div>
                      ) : (
                        <>
                          <div className="flex justify-between">
                            <span className="text-muted-foreground">CGST</span>
                            <span className="font-semibold tabular-nums">{formatCurrency(cgst)}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-muted-foreground">SGST</span>
                            <span className="font-semibold tabular-nums">{formatCurrency(sgst)}</span>
                          </div>
                        </>
                      )}
                      <div className="h-[2px] bg-[#D4AF37]/50" />
                      <div className="flex justify-between font-bold">
                        <span>Total Tax</span>
                        <span className="text-[#D4AF37] tabular-nums">{formatCurrency(inv.tax_amount)}</span>
                      </div>
                    </div>
                  </div>

                  {/* Grand Total */}
                  <div className="rounded-lg bg-foreground text-background p-4 flex flex-col justify-between">
                    <div className="space-y-2 text-xs">
                      <div className="flex justify-between text-background/70">
                        <span>Subtotal</span>
                        <span className="tabular-nums">{formatCurrency(inv.subtotal)}</span>
                      </div>
                      {isIgst ? (
                        <div className="flex justify-between text-background/70">
                          <span>IGST</span>
                          <span className="tabular-nums">{formatCurrency(igst)}</span>
                        </div>
                      ) : (
                        <>
                          <div className="flex justify-between text-background/70">
                            <span>CGST</span>
                            <span className="tabular-nums">{formatCurrency(cgst)}</span>
                          </div>
                          <div className="flex justify-between text-background/70">
                            <span>SGST</span>
                            <span className="tabular-nums">{formatCurrency(sgst)}</span>
                          </div>
                        </>
                      )}
                    </div>
                    <div className="mt-3 rounded-md bg-[#D4AF37] px-4 py-3 flex justify-between items-center">
                      <span className="font-bold text-sm text-foreground">GRAND TOTAL</span>
                      <span className="font-extrabold text-lg text-foreground tabular-nums">{formatCurrency(inv.total_amount)}</span>
                    </div>
                  </div>
                </div>

                {/* ── Terms ── */}
                <div className="px-8 pb-2">
                  <Separator className="mb-3" />
                  <h4 className="text-[11px] font-bold text-foreground mb-1.5">Terms & Conditions</h4>
                  <div className="space-y-0.5">
                    <p className="text-[10px] text-muted-foreground leading-relaxed">1. Goods once sold will only be taken back or exchanged as per company policy.</p>
                    <p className="text-[10px] text-muted-foreground leading-relaxed">2. Payment is due within 30 days of invoice date unless otherwise specified.</p>
                    <p className="text-[10px] text-muted-foreground leading-relaxed">3. All disputes are subject to Pune jurisdiction.</p>
                    <p className="text-[10px] text-muted-foreground leading-relaxed">4. Warranty as per product terms and conditions.</p>
                  </div>
                </div>

                {/* ── Footer ── */}
                <div className="px-8 py-3 border-t bg-muted/20">
                  <div className="flex items-center justify-between">
                    <p className="text-[10px] text-muted-foreground">This is a computer-generated document and does not require a signature.</p>
                    <div className="flex gap-3">
                      <Button variant="outline" size="sm" onClick={() => setViewDialogOpen(false)}>
                        Close
                      </Button>
                      <Button size="sm" onClick={() => downloadInvoice(inv)} disabled={isDownloading} className="gap-1.5 bg-[#D4AF37] hover:bg-[#C9A431] text-foreground">
                        <Download className="w-3.5 h-3.5" />
                        Download PDF
                      </Button>
                    </div>
                  </div>
                </div>
              </div>
            );
          })()}
        </DialogContent>
      </Dialog>
    </div>
  );
}
