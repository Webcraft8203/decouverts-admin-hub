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
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";
import { Plus, Trash2, Download, FileText, Eye, X } from "lucide-react";
import { toast as sonnerToast } from "sonner";

interface InvoiceItem { description: string; quantity: number; price: number; }
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
}

export default function Invoices() {
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [viewDialogOpen, setViewDialogOpen] = useState(false);
  const [selectedInvoice, setSelectedInvoice] = useState<Invoice | null>(null);
  const [isDownloading, setIsDownloading] = useState(false);
  const [formData, setFormData] = useState({ client_name: "", client_email: "", client_address: "", notes: "" });
  const [items, setItems] = useState<InvoiceItem[]>([{ description: "", quantity: 1, price: 0 }]);
  const { toast } = useToast();
  const { user } = useAuth();

  useEffect(() => { fetchData(); }, []);

  const fetchData = async () => {
    const { data } = await supabase
      .from("invoices")
      .select("id, invoice_number, client_name, client_email, client_address, total_amount, subtotal, tax_amount, items, notes, pdf_url, created_at")
      .order("created_at", { ascending: false });
    // Parse items from Json to InvoiceItem[]
    const parsed = (data || []).map((inv) => ({
      ...inv,
      items: Array.isArray(inv.items) ? (inv.items as unknown as InvoiceItem[]) : [],
    }));
    setInvoices(parsed);
    setIsLoading(false);
  };

  const addItem = () => setItems([...items, { description: "", quantity: 1, price: 0 }]);
  const removeItem = (i: number) => setItems(items.filter((_, idx) => idx !== i));
  const updateItem = (i: number, field: keyof InvoiceItem, value: string | number) => { const n = [...items]; n[i] = { ...n[i], [field]: value }; setItems(n); };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const subtotal = items.reduce((s, i) => s + i.quantity * i.price, 0);
    const tax = subtotal * 0.18;
    const total = subtotal + tax;
    const invoiceNumber = `INV-${Date.now().toString(36).toUpperCase()}`;
    
    const { error } = await supabase.from("invoices").insert([{ invoice_number: invoiceNumber, client_name: formData.client_name, client_email: formData.client_email || null, client_address: formData.client_address || null, items: JSON.parse(JSON.stringify(items)), subtotal, tax_amount: tax, total_amount: total, notes: formData.notes || null, created_by: user?.id }]);
    
    if (error) { toast({ title: "Error", description: error.message, variant: "destructive" }); return; }
    toast({ title: "Invoice created", description: `Invoice ${invoiceNumber} generated` });
    setDialogOpen(false); setFormData({ client_name: "", client_email: "", client_address: "", notes: "" }); setItems([{ description: "", quantity: 1, price: 0 }]); fetchData();
  };

  const handleDelete = async (id: string) => { if (!confirm("Delete?")) return; await supabase.from("invoices").delete().eq("id", id); toast({ title: "Deleted" }); fetchData(); };

  const handleViewInvoice = (invoice: Invoice) => {
    setSelectedInvoice(invoice);
    setViewDialogOpen(true);
  };

  const downloadInvoice = useCallback(async (invoice: Invoice) => {
    setIsDownloading(true);
    try {
      // If pdf_url exists, download from storage
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
        link.download = `${invoice.invoice_number}.html`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
        sonnerToast.success("Invoice downloaded!");
      } else {
        // Generate HTML invoice on the fly
        const invoiceHtml = generateInvoiceHtml(invoice);
        const blob = new Blob([invoiceHtml], { type: "text/html" });
        const url = URL.createObjectURL(blob);
        const link = document.createElement("a");
        link.href = url;
        link.download = `${invoice.invoice_number}.html`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
        sonnerToast.success("Invoice downloaded!");
      }
    } catch (e: any) {
      console.error("Download error:", e);
      sonnerToast.error(e?.message || "Failed to download invoice");
    } finally {
      setIsDownloading(false);
    }
  }, []);

  const generateInvoiceHtml = (invoice: Invoice): string => {
    const COMPANY = {
      name: "Decouverts Plus",
      tagline: "Premium 3D Printing Solutions",
      address: "123 Innovation Hub, Tech Park",
      city: "Pune",
      state: "Maharashtra",
      pincode: "411001",
      country: "India",
      phone: "+91 98765 43210",
      email: "info@decouvertsplus.com",
      website: "www.decouvertsplus.com",
      gst: "27XXXXX1234X1ZX",
    };

    const invoiceDate = new Date(invoice.created_at).toLocaleDateString("en-IN", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });

    const itemsArray = Array.isArray(invoice.items) ? invoice.items : [];

    return `<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <title>Invoice ${invoice.invoice_number}</title>
  <style>
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; color: #333; background: #fff; padding: 20px; }
    .invoice-container { max-width: 800px; margin: 0 auto; border: 1px solid #e0e0e0; padding: 40px; }
    .header { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 30px; padding-bottom: 20px; border-bottom: 3px solid #EAAB1C; }
    .company-info { max-width: 50%; }
    .company-name { font-size: 28px; font-weight: bold; color: #EAAB1C; margin-bottom: 5px; }
    .company-tagline { color: #666; font-size: 12px; margin-bottom: 10px; }
    .company-details { font-size: 11px; color: #555; line-height: 1.6; }
    .invoice-meta { text-align: right; }
    .invoice-title { font-size: 36px; font-weight: bold; color: #333; letter-spacing: 2px; }
    .invoice-number { font-size: 14px; color: #666; margin-top: 5px; }
    .invoice-date { font-size: 12px; color: #888; margin-top: 5px; }
    .billing-section { display: flex; justify-content: space-between; margin: 30px 0; }
    .bill-to { width: 48%; }
    .section-title { font-size: 11px; font-weight: bold; color: #EAAB1C; text-transform: uppercase; letter-spacing: 1px; margin-bottom: 10px; }
    .customer-name { font-size: 16px; font-weight: bold; color: #333; margin-bottom: 5px; }
    .customer-details { font-size: 12px; color: #555; line-height: 1.6; }
    table { width: 100%; border-collapse: collapse; margin: 30px 0; }
    th { background: #f8f8f8; padding: 12px 15px; text-align: left; font-size: 11px; font-weight: bold; text-transform: uppercase; letter-spacing: 0.5px; color: #555; border-bottom: 2px solid #EAAB1C; }
    td { padding: 15px; border-bottom: 1px solid #eee; font-size: 13px; }
    .text-right { text-align: right; }
    .text-center { text-align: center; }
    .summary-section { display: flex; justify-content: flex-end; margin-top: 20px; }
    .summary { width: 280px; }
    .summary-row { display: flex; justify-content: space-between; padding: 8px 0; font-size: 13px; }
    .summary-row span:first-child { color: #666; }
    .summary-row span:last-child { color: #333; font-weight: 500; }
    .summary-total { border-top: 2px solid #333; margin-top: 10px; padding-top: 10px; font-size: 16px; font-weight: bold; }
    .summary-total span:last-child { color: #EAAB1C; }
    .footer { margin-top: 40px; padding-top: 20px; border-top: 1px solid #eee; text-align: center; }
    .footer-text { font-size: 11px; color: #888; margin-bottom: 5px; }
    .footer-thanks { font-size: 14px; font-weight: 500; color: #333; margin-bottom: 10px; }
    .gst-box { background: #f9f9f9; border: 1px solid #eee; padding: 15px; margin-top: 20px; border-radius: 5px; }
    .gst-title { font-size: 11px; font-weight: bold; color: #555; margin-bottom: 5px; }
    .gst-number { font-size: 14px; font-weight: bold; color: #333; letter-spacing: 1px; }
    @media print { body { padding: 0; } .invoice-container { border: none; padding: 20px; } }
  </style>
</head>
<body>
  <div class="invoice-container">
    <div class="header">
      <div class="company-info">
        <div class="company-name">${COMPANY.name}</div>
        <div class="company-tagline">${COMPANY.tagline}</div>
        <div class="company-details">
          ${COMPANY.address}<br>
          ${COMPANY.city}, ${COMPANY.state} - ${COMPANY.pincode}<br>
          ${COMPANY.country}<br>
          Phone: ${COMPANY.phone}<br>
          Email: ${COMPANY.email}<br>
          <strong>GSTIN: ${COMPANY.gst}</strong>
        </div>
      </div>
      <div class="invoice-meta">
        <div class="invoice-title">INVOICE</div>
        <div class="invoice-number">${invoice.invoice_number}</div>
        <div class="invoice-date">Date: ${invoiceDate}</div>
      </div>
    </div>
    <div class="billing-section">
      <div class="bill-to">
        <div class="section-title">Bill To</div>
        <div class="customer-name">${invoice.client_name}</div>
        <div class="customer-details">
          ${invoice.client_address || ""}<br>
          ${invoice.client_email ? `Email: ${invoice.client_email}` : ""}
        </div>
      </div>
    </div>
    <table>
      <thead>
        <tr>
          <th style="width: 50%">Description</th>
          <th class="text-center" style="width: 15%">Qty</th>
          <th class="text-right" style="width: 17%">Unit Price</th>
          <th class="text-right" style="width: 18%">Amount</th>
        </tr>
      </thead>
      <tbody>
        ${itemsArray.map((item, index) => `
          <tr>
            <td>${index + 1}. ${item.description}</td>
            <td class="text-center">${item.quantity}</td>
            <td class="text-right">₹${Number(item.price).toLocaleString("en-IN")}</td>
            <td class="text-right">₹${(item.quantity * item.price).toLocaleString("en-IN")}</td>
          </tr>
        `).join("")}
      </tbody>
    </table>
    <div class="summary-section">
      <div class="summary">
        <div class="summary-row">
          <span>Subtotal</span>
          <span>₹${Number(invoice.subtotal).toLocaleString("en-IN")}</span>
        </div>
        <div class="summary-row">
          <span>Tax (18% GST)</span>
          <span>₹${Number(invoice.tax_amount).toLocaleString("en-IN")}</span>
        </div>
        <div class="summary-row summary-total">
          <span>Total</span>
          <span>₹${Number(invoice.total_amount).toLocaleString("en-IN")}</span>
        </div>
      </div>
    </div>
    <div class="gst-box">
      <div class="gst-title">Tax Invoice</div>
      <div class="gst-number">GSTIN: ${COMPANY.gst}</div>
    </div>
    <div class="footer">
      <div class="footer-thanks">Thank you for your business!</div>
      <div class="footer-text">${COMPANY.name} | ${COMPANY.website}</div>
      <div class="footer-text">This is a computer-generated invoice and does not require a signature.</div>
    </div>
  </div>
</body>
</html>`;
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <div><h1 className="text-3xl font-bold text-foreground">Invoices</h1><p className="text-muted-foreground">Generate and manage invoices</p></div>
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild><Button><Plus className="mr-2 h-4 w-4" />Create Invoice</Button></DialogTrigger>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto"><DialogHeader><DialogTitle>Create Invoice</DialogTitle></DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div><Label>Client Name</Label><Input value={formData.client_name} onChange={(e) => setFormData({ ...formData, client_name: e.target.value })} required /></div>
                <div><Label>Client Email</Label><Input type="email" value={formData.client_email} onChange={(e) => setFormData({ ...formData, client_email: e.target.value })} /></div>
              </div>
              <div><Label>Address</Label><Textarea value={formData.client_address} onChange={(e) => setFormData({ ...formData, client_address: e.target.value })} /></div>
              <div className="space-y-2"><Label>Items</Label>
                {items.map((item, i) => (
                  <div key={i} className="flex gap-2 items-center">
                    <Input placeholder="Description" value={item.description} onChange={(e) => updateItem(i, "description", e.target.value)} className="flex-1" required />
                    <Input type="number" placeholder="Qty" value={item.quantity} onChange={(e) => updateItem(i, "quantity", parseInt(e.target.value) || 0)} className="w-20" />
                    <Input type="number" step="0.01" placeholder="Price" value={item.price} onChange={(e) => updateItem(i, "price", parseFloat(e.target.value) || 0)} className="w-24" />
                    {items.length > 1 && <Button type="button" variant="ghost" size="icon" onClick={() => removeItem(i)}><Trash2 className="h-4 w-4" /></Button>}
                  </div>
                ))}
                <Button type="button" variant="outline" size="sm" onClick={addItem}><Plus className="h-4 w-4 mr-1" />Add Item</Button>
              </div>
              <div><Label>Notes</Label><Textarea value={formData.notes} onChange={(e) => setFormData({ ...formData, notes: e.target.value })} /></div>
              <div className="border-t pt-4 space-y-1 text-sm">
                <div className="flex justify-between"><span>Subtotal:</span><span>₹{items.reduce((s, i) => s + i.quantity * i.price, 0).toFixed(2)}</span></div>
                <div className="flex justify-between"><span>Tax (18%):</span><span>₹{(items.reduce((s, i) => s + i.quantity * i.price, 0) * 0.18).toFixed(2)}</span></div>
                <div className="flex justify-between font-bold"><span>Total:</span><span>₹{(items.reduce((s, i) => s + i.quantity * i.price, 0) * 1.18).toFixed(2)}</span></div>
              </div>
              <Button type="submit" className="w-full">Generate Invoice</Button>
            </form>
          </DialogContent>
        </Dialog>
      </div>
      <Card><CardContent className="p-0">
        <Table><TableHeader><TableRow><TableHead>Invoice #</TableHead><TableHead>Client</TableHead><TableHead>Amount</TableHead><TableHead>Date</TableHead><TableHead className="text-right">Actions</TableHead></TableRow></TableHeader>
          <TableBody>{isLoading ? <TableRow><TableCell colSpan={5} className="text-center py-8">Loading...</TableCell></TableRow> : invoices.length === 0 ? <TableRow><TableCell colSpan={5} className="text-center py-8 text-muted-foreground">No invoices</TableCell></TableRow> : invoices.map((inv) => (
            <TableRow key={inv.id}>
              <TableCell className="font-medium"><div className="flex items-center gap-2"><FileText className="h-4 w-4 text-muted-foreground" />{inv.invoice_number}</div></TableCell>
              <TableCell>{inv.client_name}</TableCell>
              <TableCell>₹{inv.total_amount.toFixed(2)}</TableCell>
              <TableCell>{new Date(inv.created_at).toLocaleDateString()}</TableCell>
              <TableCell className="text-right space-x-1">
                <Button variant="ghost" size="icon" onClick={() => handleViewInvoice(inv)} title="View Details">
                  <Eye className="h-4 w-4 text-primary" />
                </Button>
                <Button variant="ghost" size="icon" onClick={() => downloadInvoice(inv)} disabled={isDownloading} title="Download">
                  <Download className="h-4 w-4 text-muted-foreground" />
                </Button>
                <Button variant="ghost" size="icon" onClick={() => handleDelete(inv.id)} title="Delete">
                  <Trash2 className="h-4 w-4 text-destructive" />
                </Button>
              </TableCell>
            </TableRow>
          ))}</TableBody>
        </Table>
      </CardContent></Card>

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
                  <p className="font-semibold">{new Date(selectedInvoice.created_at).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" })}</p>
                </div>
              </div>

              <Separator />

              <div>
                <p className="text-sm text-muted-foreground mb-2">Bill To</p>
                <p className="font-semibold text-lg">{selectedInvoice.client_name}</p>
                {selectedInvoice.client_email && <p className="text-sm text-muted-foreground">{selectedInvoice.client_email}</p>}
                {selectedInvoice.client_address && <p className="text-sm text-muted-foreground mt-1">{selectedInvoice.client_address}</p>}
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
                        <TableHead className="text-right">Total</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {(Array.isArray(selectedInvoice.items) ? selectedInvoice.items : []).map((item, idx) => (
                        <TableRow key={idx}>
                          <TableCell>{item.description}</TableCell>
                          <TableCell className="text-center">{item.quantity}</TableCell>
                          <TableCell className="text-right">₹{Number(item.price).toLocaleString()}</TableCell>
                          <TableCell className="text-right font-medium">₹{(item.quantity * item.price).toLocaleString()}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              </div>

              <div className="bg-muted/30 rounded-lg p-4 space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Subtotal</span>
                  <span>₹{Number(selectedInvoice.subtotal).toLocaleString()}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Tax (18% GST)</span>
                  <span>₹{Number(selectedInvoice.tax_amount).toLocaleString()}</span>
                </div>
                <Separator />
                <div className="flex justify-between font-bold text-lg">
                  <span>Total</span>
                  <span className="text-primary">₹{Number(selectedInvoice.total_amount).toLocaleString()}</span>
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
                  {isDownloading ? "Downloading..." : "Download Invoice"}
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