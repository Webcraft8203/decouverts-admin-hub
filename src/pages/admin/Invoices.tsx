import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";
import { Plus, Trash2, Download, FileText, Eye, X, Settings, IndianRupee, ArrowUpDown, Building2 } from "lucide-react";
import { toast as sonnerToast } from "sonner";
import { Link } from "react-router-dom";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

const INDIAN_STATES = [
  "Andhra Pradesh", "Arunachal Pradesh", "Assam", "Bihar", "Chhattisgarh",
  "Goa", "Gujarat", "Haryana", "Himachal Pradesh", "Jharkhand", "Karnataka",
  "Kerala", "Madhya Pradesh", "Maharashtra", "Manipur", "Meghalaya", "Mizoram",
  "Nagaland", "Odisha", "Punjab", "Rajasthan", "Sikkim", "Tamil Nadu",
  "Telangana", "Tripura", "Uttar Pradesh", "Uttarakhand", "West Bengal",
  "Andaman and Nicobar Islands", "Chandigarh", "Dadra and Nagar Haveli and Daman and Diu",
  "Delhi", "Jammu and Kashmir", "Ladakh", "Lakshadweep", "Puducherry"
];

const GST_RATES = [0, 5, 12, 18, 28];

interface InvoiceItem {
  description: string;
  quantity: number;
  price: number;
  gstRate: number;
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
  buyer_gstin: string | null;
  buyer_state: string | null;
  seller_state: string | null;
  cgst_amount: number;
  sgst_amount: number;
  igst_amount: number;
  platform_fee: number;
  is_igst: boolean;
}

interface InvoiceSettings {
  business_state: string;
  platform_fee_percentage: number;
  platform_fee_taxable: boolean;
  default_gst_rate: number;
}

export default function Invoices() {
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [viewDialogOpen, setViewDialogOpen] = useState(false);
  const [selectedInvoice, setSelectedInvoice] = useState<Invoice | null>(null);
  const [isDownloading, setIsDownloading] = useState(false);
  const [settings, setSettings] = useState<InvoiceSettings | null>(null);
  
  const [formData, setFormData] = useState({
    client_name: "",
    client_email: "",
    client_address: "",
    client_state: "Maharashtra",
    notes: "",
    hasGstin: false,
    buyer_gstin: "",
  });
  
  const [items, setItems] = useState<InvoiceItem[]>([
    { description: "", quantity: 1, price: 0, gstRate: 18 }
  ]);
  
  const { toast } = useToast();
  const { user } = useAuth();

  useEffect(() => {
    fetchData();
    fetchSettings();
  }, []);

  const fetchSettings = async () => {
    const { data } = await supabase
      .from("invoice_settings")
      .select("business_state, platform_fee_percentage, platform_fee_taxable, default_gst_rate")
      .limit(1)
      .single();
    
    if (data) {
      setSettings(data as InvoiceSettings);
    }
  };

  const fetchData = async () => {
    const { data } = await supabase
      .from("invoices")
      .select("*")
      .order("created_at", { ascending: false });
    
    const parsed = (data || []).map((inv) => ({
      ...inv,
      items: Array.isArray(inv.items) ? (inv.items as unknown as InvoiceItem[]) : [],
      cgst_amount: inv.cgst_amount || 0,
      sgst_amount: inv.sgst_amount || 0,
      igst_amount: inv.igst_amount || 0,
      platform_fee: inv.platform_fee || 0,
      is_igst: inv.is_igst || false,
    }));
    setInvoices(parsed);
    setIsLoading(false);
  };

  const addItem = () => setItems([...items, { description: "", quantity: 1, price: 0, gstRate: settings?.default_gst_rate || 18 }]);
  const removeItem = (i: number) => setItems(items.filter((_, idx) => idx !== i));
  const updateItem = (i: number, field: keyof InvoiceItem, value: string | number) => {
    const n = [...items];
    n[i] = { ...n[i], [field]: value };
    setItems(n);
  };

  // Calculate GST based on state comparison
  const calculateTotals = useCallback(() => {
    const sellerState = settings?.business_state || "Maharashtra";
    const buyerState = formData.client_state;
    const isIGST = sellerState.toLowerCase() !== buyerState.toLowerCase();
    const platformFeeRate = settings?.platform_fee_percentage || 2;
    const platformFeeTaxable = settings?.platform_fee_taxable || false;

    let subtotal = 0;
    let totalCGST = 0;
    let totalSGST = 0;
    let totalIGST = 0;

    items.forEach((item) => {
      const taxableValue = item.quantity * item.price;
      subtotal += taxableValue;

      const gstAmount = (taxableValue * item.gstRate) / 100;
      if (isIGST) {
        totalIGST += gstAmount;
      } else {
        totalCGST += gstAmount / 2;
        totalSGST += gstAmount / 2;
      }
    });

    const platformFee = (subtotal * platformFeeRate) / 100;
    const platformFeeTax = platformFeeTaxable ? (platformFee * 18) / 100 : 0;
    const totalTax = totalCGST + totalSGST + totalIGST + platformFeeTax;
    const grandTotal = subtotal + totalTax + platformFee;

    return {
      subtotal,
      totalCGST,
      totalSGST,
      totalIGST,
      totalTax,
      platformFee,
      platformFeeTax,
      grandTotal,
      isIGST,
    };
  }, [items, formData.client_state, settings]);

  const totals = calculateTotals();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    const sellerState = settings?.business_state || "Maharashtra";
    const invoiceNumber = `INV-${Date.now().toString(36).toUpperCase()}`;
    
    const { error } = await supabase.from("invoices").insert([{
      invoice_number: invoiceNumber,
      client_name: formData.client_name,
      client_email: formData.client_email || null,
      client_address: formData.client_address || null,
      items: JSON.parse(JSON.stringify(items)),
      subtotal: totals.subtotal,
      tax_amount: totals.totalTax,
      total_amount: totals.grandTotal,
      notes: formData.notes || null,
      created_by: user?.id,
      buyer_gstin: formData.hasGstin ? formData.buyer_gstin : null,
      buyer_state: formData.client_state,
      seller_state: sellerState,
      cgst_amount: totals.totalCGST,
      sgst_amount: totals.totalSGST,
      igst_amount: totals.totalIGST,
      platform_fee: totals.platformFee,
      platform_fee_tax: totals.platformFeeTax,
      is_igst: totals.isIGST,
      gst_breakdown: items.map((item) => ({
        description: item.description,
        taxableValue: item.quantity * item.price,
        gstRate: item.gstRate,
        cgst: totals.isIGST ? 0 : ((item.quantity * item.price * item.gstRate) / 100) / 2,
        sgst: totals.isIGST ? 0 : ((item.quantity * item.price * item.gstRate) / 100) / 2,
        igst: totals.isIGST ? (item.quantity * item.price * item.gstRate) / 100 : 0,
      })),
    }]);
    
    if (error) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
      return;
    }
    
    toast({ title: "Invoice created", description: `Invoice ${invoiceNumber} generated` });
    setDialogOpen(false);
    setFormData({
      client_name: "",
      client_email: "",
      client_address: "",
      client_state: "Maharashtra",
      notes: "",
      hasGstin: false,
      buyer_gstin: "",
    });
    setItems([{ description: "", quantity: 1, price: 0, gstRate: settings?.default_gst_rate || 18 }]);
    fetchData();
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Delete this invoice?")) return;
    await supabase.from("invoices").delete().eq("id", id);
    toast({ title: "Deleted" });
    fetchData();
  };

  const handleViewInvoice = (invoice: Invoice) => {
    setSelectedInvoice(invoice);
    setViewDialogOpen(true);
  };

  const downloadInvoice = useCallback(async (invoice: Invoice) => {
    setIsDownloading(true);
    try {
      if (invoice.pdf_url) {
        const { data: signed, error: signError } = await supabase.storage
          .from("invoices")
          .createSignedUrl(invoice.pdf_url, 60 * 15);

        if (signError || !signed?.signedUrl) throw new Error("Failed to get invoice link");

        const response = await fetch(signed.signedUrl);
        if (!response.ok) throw new Error("Failed to fetch invoice");

        const blob = await response.blob();
        const url = URL.createObjectURL(blob);
        const link = document.createElement("a");
        link.href = url;
        link.download = `${invoice.invoice_number}.pdf`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
        sonnerToast.success("Invoice downloaded!");
      } else {
        sonnerToast.error("PDF not available. Generate invoice from order first.");
      }
    } catch (e: any) {
      console.error("Download error:", e);
      sonnerToast.error(e?.message || "Failed to download invoice");
    } finally {
      setIsDownloading(false);
    }
  }, []);

  const formatCurrency = (amount: number) => {
    return `₹${Number(amount).toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Invoices</h1>
          <p className="text-muted-foreground">GST-compliant invoice management</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" asChild>
            <Link to="/admin/invoice-settings">
              <Settings className="mr-2 h-4 w-4" />
              Settings
            </Link>
          </Button>
          <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="mr-2 h-4 w-4" />
                Create Invoice
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle className="flex items-center gap-2">
                  <FileText className="h-5 w-5 text-primary" />
                  Create GST Invoice
                </DialogTitle>
              </DialogHeader>
              <form onSubmit={handleSubmit} className="space-y-6">
                {/* Buyer Details */}
                <div className="space-y-4">
                  <h3 className="font-semibold flex items-center gap-2">
                    <Building2 className="h-4 w-4" />
                    Buyer Details
                  </h3>
                  <div className="grid gap-4 sm:grid-cols-2">
                    <div>
                      <Label>Client Name *</Label>
                      <Input
                        value={formData.client_name}
                        onChange={(e) => setFormData({ ...formData, client_name: e.target.value })}
                        required
                        placeholder="Business or individual name"
                      />
                    </div>
                    <div>
                      <Label>Email</Label>
                      <Input
                        type="email"
                        value={formData.client_email}
                        onChange={(e) => setFormData({ ...formData, client_email: e.target.value })}
                        placeholder="client@example.com"
                      />
                    </div>
                    <div className="sm:col-span-2">
                      <Label>Address</Label>
                      <Textarea
                        value={formData.client_address}
                        onChange={(e) => setFormData({ ...formData, client_address: e.target.value })}
                        placeholder="Full address"
                        rows={2}
                      />
                    </div>
                    <div>
                      <Label>State *</Label>
                      <Select
                        value={formData.client_state}
                        onValueChange={(value) => setFormData({ ...formData, client_state: value })}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {INDIAN_STATES.map((state) => (
                            <SelectItem key={state} value={state}>{state}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="flex items-center gap-4">
                      <div className="flex items-center gap-2">
                        <Checkbox
                          id="hasGstin"
                          checked={formData.hasGstin}
                          onCheckedChange={(checked) => setFormData({ ...formData, hasGstin: !!checked })}
                        />
                        <Label htmlFor="hasGstin" className="cursor-pointer">Add GSTIN</Label>
                      </div>
                    </div>
                    {formData.hasGstin && (
                      <div className="sm:col-span-2">
                        <Label>Buyer GSTIN</Label>
                        <Input
                          value={formData.buyer_gstin}
                          onChange={(e) => setFormData({ ...formData, buyer_gstin: e.target.value.toUpperCase() })}
                          placeholder="22AAAAA0000A1Z5"
                          className="font-mono"
                          maxLength={15}
                        />
                      </div>
                    )}
                  </div>
                </div>

                <Separator />

                {/* GST Type Indicator */}
                <div className="flex items-center gap-2">
                  <ArrowUpDown className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm">
                    Tax Type:{" "}
                    <Badge variant={totals.isIGST ? "destructive" : "default"}>
                      {totals.isIGST ? "IGST (Interstate)" : "CGST + SGST (Intrastate)"}
                    </Badge>
                  </span>
                  <span className="text-xs text-muted-foreground">
                    (Seller: {settings?.business_state || "Maharashtra"})
                  </span>
                </div>

                {/* Line Items */}
                <div className="space-y-3">
                  <h3 className="font-semibold flex items-center gap-2">
                    <IndianRupee className="h-4 w-4" />
                    Products / Services
                  </h3>
                  {items.map((item, i) => (
                    <div key={i} className="grid gap-2 p-3 border rounded-lg bg-muted/30">
                      <div className="grid gap-2 sm:grid-cols-12">
                        <div className="sm:col-span-5">
                          <Input
                            placeholder="Description *"
                            value={item.description}
                            onChange={(e) => updateItem(i, "description", e.target.value)}
                            required
                          />
                        </div>
                        <div className="sm:col-span-2">
                          <Input
                            type="number"
                            min="1"
                            placeholder="Qty"
                            value={item.quantity}
                            onChange={(e) => updateItem(i, "quantity", parseInt(e.target.value) || 1)}
                          />
                        </div>
                        <div className="sm:col-span-2">
                          <Input
                            type="number"
                            step="0.01"
                            min="0"
                            placeholder="Unit Price"
                            value={item.price}
                            onChange={(e) => updateItem(i, "price", parseFloat(e.target.value) || 0)}
                          />
                        </div>
                        <div className="sm:col-span-2">
                          <Select
                            value={String(item.gstRate)}
                            onValueChange={(value) => updateItem(i, "gstRate", Number(value))}
                          >
                            <SelectTrigger>
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              {GST_RATES.map((rate) => (
                                <SelectItem key={rate} value={String(rate)}>
                                  {rate}% GST
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                        <div className="sm:col-span-1 flex items-center justify-end">
                          {items.length > 1 && (
                            <Button type="button" variant="ghost" size="icon" onClick={() => removeItem(i)}>
                              <Trash2 className="h-4 w-4 text-destructive" />
                            </Button>
                          )}
                        </div>
                      </div>
                      <div className="text-right text-sm text-muted-foreground">
                        Taxable: {formatCurrency(item.quantity * item.price)}
                      </div>
                    </div>
                  ))}
                  <Button type="button" variant="outline" size="sm" onClick={addItem}>
                    <Plus className="h-4 w-4 mr-1" />
                    Add Item
                  </Button>
                </div>

                {/* Notes */}
                <div>
                  <Label>Notes (Optional)</Label>
                  <Textarea
                    value={formData.notes}
                    onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                    placeholder="Additional notes, payment terms, etc."
                    rows={2}
                  />
                </div>

                <Separator />

                {/* Summary */}
                <div className="bg-muted/50 rounded-lg p-4 space-y-2">
                  <div className="flex justify-between text-sm">
                    <span>Subtotal</span>
                    <span>{formatCurrency(totals.subtotal)}</span>
                  </div>
                  {totals.isIGST ? (
                    <div className="flex justify-between text-sm">
                      <span>IGST</span>
                      <span>{formatCurrency(totals.totalIGST)}</span>
                    </div>
                  ) : (
                    <>
                      <div className="flex justify-between text-sm">
                        <span>CGST</span>
                        <span>{formatCurrency(totals.totalCGST)}</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span>SGST</span>
                        <span>{formatCurrency(totals.totalSGST)}</span>
                      </div>
                    </>
                  )}
                  {settings && settings.platform_fee_percentage > 0 && (
                    <>
                      <div className="flex justify-between text-sm">
                        <span>Platform Fee ({settings.platform_fee_percentage}%)</span>
                        <span>{formatCurrency(totals.platformFee)}</span>
                      </div>
                      {totals.platformFeeTax > 0 && (
                        <div className="flex justify-between text-sm text-muted-foreground">
                          <span>Platform Fee Tax</span>
                          <span>{formatCurrency(totals.platformFeeTax)}</span>
                        </div>
                      )}
                    </>
                  )}
                  <Separator className="my-2" />
                  <div className="flex justify-between font-bold text-lg">
                    <span>Grand Total</span>
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
      </div>

      {/* Tax Summary Cards */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Total Invoices</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{invoices.length}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Total CGST</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              {formatCurrency(invoices.reduce((sum, inv) => sum + (inv.cgst_amount || 0), 0))}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Total SGST</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">
              {formatCurrency(invoices.reduce((sum, inv) => sum + (inv.sgst_amount || 0), 0))}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Total IGST</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-purple-600">
              {formatCurrency(invoices.reduce((sum, inv) => sum + (inv.igst_amount || 0), 0))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Invoice Table */}
      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Invoice #</TableHead>
                <TableHead>Client</TableHead>
                <TableHead>State</TableHead>
                <TableHead>Tax Type</TableHead>
                <TableHead className="text-right">Amount</TableHead>
                <TableHead>Date</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <TableRow>
                  <TableCell colSpan={7} className="text-center py-8">Loading...</TableCell>
                </TableRow>
              ) : invoices.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                    No invoices yet
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
                        <p className="font-medium">{inv.client_name}</p>
                        {inv.buyer_gstin && (
                          <p className="text-xs text-muted-foreground font-mono">{inv.buyer_gstin}</p>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>{inv.buyer_state || "-"}</TableCell>
                    <TableCell>
                      <Badge variant={inv.is_igst ? "destructive" : "secondary"} className="text-xs">
                        {inv.is_igst ? "IGST" : "CGST+SGST"}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right font-medium">
                      {formatCurrency(inv.total_amount)}
                    </TableCell>
                    <TableCell>{new Date(inv.created_at).toLocaleDateString()}</TableCell>
                    <TableCell className="text-right space-x-1">
                      <Button variant="ghost" size="icon" onClick={() => handleViewInvoice(inv)} title="View">
                        <Eye className="h-4 w-4 text-primary" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => downloadInvoice(inv)}
                        disabled={isDownloading || !inv.pdf_url}
                        title="Download"
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

      {/* View Invoice Dialog */}
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
              <div className="flex justify-between items-start">
                <div>
                  <h3 className="text-2xl font-bold text-primary">{selectedInvoice.invoice_number}</h3>
                  <p className="text-muted-foreground">
                    {new Date(selectedInvoice.created_at).toLocaleDateString("en-IN", {
                      day: "2-digit",
                      month: "long",
                      year: "numeric",
                    })}
                  </p>
                </div>
                <Badge variant={selectedInvoice.is_igst ? "destructive" : "default"}>
                  {selectedInvoice.is_igst ? "Interstate (IGST)" : "Intrastate (CGST+SGST)"}
                </Badge>
              </div>

              <Separator />

              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <p className="text-sm text-muted-foreground mb-1">Bill To</p>
                  <p className="font-semibold">{selectedInvoice.client_name}</p>
                  {selectedInvoice.client_address && (
                    <p className="text-sm text-muted-foreground">{selectedInvoice.client_address}</p>
                  )}
                  {selectedInvoice.buyer_state && (
                    <p className="text-sm text-muted-foreground">State: {selectedInvoice.buyer_state}</p>
                  )}
                  {selectedInvoice.buyer_gstin && (
                    <p className="text-sm font-mono mt-1">GSTIN: {selectedInvoice.buyer_gstin}</p>
                  )}
                </div>
                <div className="text-right">
                  <p className="text-sm text-muted-foreground mb-1">Seller State</p>
                  <p className="font-semibold">{selectedInvoice.seller_state || "Maharashtra"}</p>
                </div>
              </div>

              <Separator />

              <div>
                <h4 className="font-semibold mb-3">Items</h4>
                <div className="space-y-2">
                  {selectedInvoice.items.map((item, i) => (
                    <div key={i} className="flex justify-between items-center py-2 border-b last:border-0">
                      <div>
                        <p className="font-medium">{item.description}</p>
                        <p className="text-sm text-muted-foreground">
                          {item.quantity} × {formatCurrency(item.price)} @ {item.gstRate || 18}% GST
                        </p>
                      </div>
                      <p className="font-medium">{formatCurrency(item.quantity * item.price)}</p>
                    </div>
                  ))}
                </div>
              </div>

              <div className="bg-muted/50 rounded-lg p-4 space-y-2">
                <div className="flex justify-between">
                  <span>Subtotal</span>
                  <span>{formatCurrency(selectedInvoice.subtotal)}</span>
                </div>
                {selectedInvoice.is_igst ? (
                  <div className="flex justify-between">
                    <span>IGST</span>
                    <span>{formatCurrency(selectedInvoice.igst_amount)}</span>
                  </div>
                ) : (
                  <>
                    <div className="flex justify-between">
                      <span>CGST</span>
                      <span>{formatCurrency(selectedInvoice.cgst_amount)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>SGST</span>
                      <span>{formatCurrency(selectedInvoice.sgst_amount)}</span>
                    </div>
                  </>
                )}
                {selectedInvoice.platform_fee > 0 && (
                  <div className="flex justify-between">
                    <span>Platform Fee</span>
                    <span>{formatCurrency(selectedInvoice.platform_fee)}</span>
                  </div>
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
                  <p className="text-sm">{selectedInvoice.notes}</p>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
