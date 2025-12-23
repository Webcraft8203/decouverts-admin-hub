import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";
import { Plus, Trash2, Download, FileText } from "lucide-react";

interface InvoiceItem { description: string; quantity: number; price: number; }
interface Invoice { id: string; invoice_number: string; client_name: string; client_email: string | null; total_amount: number; created_at: string; }

export default function Invoices() {
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [formData, setFormData] = useState({ client_name: "", client_email: "", client_address: "", notes: "" });
  const [items, setItems] = useState<InvoiceItem[]>([{ description: "", quantity: 1, price: 0 }]);
  const { toast } = useToast();
  const { user } = useAuth();

  useEffect(() => { fetchData(); }, []);
  const fetchData = async () => { const { data } = await supabase.from("invoices").select("id, invoice_number, client_name, client_email, total_amount, created_at").order("created_at", { ascending: false }); setInvoices(data || []); setIsLoading(false); };

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
            <TableRow key={inv.id}><TableCell className="font-medium"><div className="flex items-center gap-2"><FileText className="h-4 w-4 text-muted-foreground" />{inv.invoice_number}</div></TableCell><TableCell>{inv.client_name}</TableCell><TableCell>₹{inv.total_amount.toFixed(2)}</TableCell><TableCell>{new Date(inv.created_at).toLocaleDateString()}</TableCell><TableCell className="text-right"><Button variant="ghost" size="icon" onClick={() => handleDelete(inv.id)}><Trash2 className="h-4 w-4 text-destructive" /></Button></TableCell></TableRow>
          ))}</TableBody>
        </Table>
      </CardContent></Card>
    </div>
  );
}