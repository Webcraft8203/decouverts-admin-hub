import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { Pencil, Eye, Search, Package, Trash2 } from "lucide-react";
import { format } from "date-fns";

interface Product {
  id: string;
  product_name: string;
  description: string | null;
  hsn_code: string;
  default_gst_rate: number;
  default_unit_price: number;
  category: string | null;
  invoice_count: number;
  last_used_at: string | null;
  created_at: string;
}

interface UsageRow {
  id: string;
  invoice_id: string;
  description: string | null;
  quantity: number;
  rate: number;
  total: number;
  created_at: string;
  invoices?: { invoice_number: string; client_name: string; created_at: string } | null;
}

const GST_OPTIONS = [0, 5, 12, 18, 28];

export default function ProductMaster() {
  const { toast } = useToast();
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [gstFilter, setGstFilter] = useState<string>("all");
  const [editOpen, setEditOpen] = useState(false);
  const [editing, setEditing] = useState<Product | null>(null);
  const [viewOpen, setViewOpen] = useState(false);
  const [viewing, setViewing] = useState<Product | null>(null);
  const [usage, setUsage] = useState<UsageRow[]>([]);
  const [usageLoading, setUsageLoading] = useState(false);

  const load = async () => {
    setLoading(true);
    const { data, error } = await (supabase as any)
      .from("products_master")
      .select("*")
      .order("last_used_at", { ascending: false, nullsFirst: false });
    if (error) toast({ title: "Error", description: error.message, variant: "destructive" });
    setProducts((data as Product[]) || []);
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return products.filter((p) => {
      const matchesSearch = !q
        || p.product_name.toLowerCase().includes(q)
        || p.hsn_code.toLowerCase().includes(q)
        || (p.category || "").toLowerCase().includes(q);
      const matchesGst = gstFilter === "all" || Number(p.default_gst_rate) === Number(gstFilter);
      return matchesSearch && matchesGst;
    });
  }, [products, search, gstFilter]);

  const openView = async (p: Product) => {
    setViewing(p);
    setViewOpen(true);
    setUsageLoading(true);
    const { data } = await (supabase as any)
      .from("invoice_product_usage")
      .select("id, invoice_id, description, quantity, rate, total, created_at, invoices(invoice_number, client_name, created_at)")
      .eq("product_id", p.id)
      .order("created_at", { ascending: false });
    setUsage((data as UsageRow[]) || []);
    setUsageLoading(false);
  };

  const saveEdit = async () => {
    if (!editing) return;
    const payload = {
      product_name: editing.product_name.trim(),
      description: editing.description,
      hsn_code: editing.hsn_code.trim(),
      default_gst_rate: Number(editing.default_gst_rate),
      default_unit_price: Number(editing.default_unit_price),
      category: editing.category || null,
    };
    if (!payload.product_name || !/^[a-zA-Z0-9]{4,10}$/.test(payload.hsn_code)) {
      toast({ title: "Validation", description: "Name and HSN (4-10 alphanumeric) required", variant: "destructive" });
      return;
    }
    const { error } = await (supabase as any).from("products_master").update(payload).eq("id", editing.id);
    if (error) { toast({ title: "Error", description: error.message, variant: "destructive" }); return; }
    toast({ title: "Product updated" });
    setEditOpen(false);
    setEditing(null);
    load();
  };

  const handleDelete = async (p: Product) => {
    if (!confirm(`Delete ${p.product_name}? This removes it from the Product Master (invoices are untouched).`)) return;
    const { error } = await (supabase as any).from("products_master").delete().eq("id", p.id);
    if (error) { toast({ title: "Error", description: error.message, variant: "destructive" }); return; }
    toast({ title: "Product deleted" });
    load();
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2"><Package className="w-6 h-6" /> Product Master</h1>
          <p className="text-sm text-muted-foreground">Central catalog auto-built from manual invoices</p>
        </div>
        <Badge variant="secondary">{products.length} products</Badge>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Filters</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col md:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
            <Input placeholder="Search by name, HSN, category" value={search} onChange={(e) => setSearch(e.target.value)} className="pl-9" />
          </div>
          <Select value={gstFilter} onValueChange={setGstFilter}>
            <SelectTrigger className="w-full md:w-48"><SelectValue placeholder="GST" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All GST rates</SelectItem>
              {GST_OPTIONS.map((g) => <SelectItem key={g} value={String(g)}>{g}%</SelectItem>)}
            </SelectContent>
          </Select>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="p-0">
          {loading ? (
            <div className="p-6 space-y-3">{[...Array(5)].map((_, i) => <Skeleton key={i} className="h-10 w-full" />)}</div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Product Name</TableHead>
                  <TableHead>HSN</TableHead>
                  <TableHead>GST %</TableHead>
                  <TableHead className="text-right">Default Price</TableHead>
                  <TableHead className="text-right">Invoice Count</TableHead>
                  <TableHead>Last Used</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.length === 0 ? (
                  <TableRow><TableCell colSpan={7} className="text-center text-muted-foreground py-8">No products yet — create a manual invoice to populate.</TableCell></TableRow>
                ) : filtered.map((p) => (
                  <TableRow key={p.id}>
                    <TableCell>
                      <div className="font-medium">{p.product_name}</div>
                      {p.category && <div className="text-xs text-muted-foreground">{p.category}</div>}
                    </TableCell>
                    <TableCell><code className="text-xs">{p.hsn_code}</code></TableCell>
                    <TableCell>{Number(p.default_gst_rate)}%</TableCell>
                    <TableCell className="text-right">₹{Number(p.default_unit_price).toLocaleString("en-IN")}</TableCell>
                    <TableCell className="text-right">{p.invoice_count}</TableCell>
                    <TableCell>{p.last_used_at ? format(new Date(p.last_used_at), "dd MMM yyyy") : "—"}</TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-1">
                        <Button size="icon" variant="ghost" onClick={() => openView(p)}><Eye className="w-4 h-4" /></Button>
                        <Button size="icon" variant="ghost" onClick={() => { setEditing(p); setEditOpen(true); }}><Pencil className="w-4 h-4" /></Button>
                        <Button size="icon" variant="ghost" onClick={() => handleDelete(p)}><Trash2 className="w-4 h-4 text-destructive" /></Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Edit Dialog */}
      <Dialog open={editOpen} onOpenChange={(o) => { setEditOpen(o); if (!o) setEditing(null); }}>
        <DialogContent>
          <DialogHeader><DialogTitle>Edit Product</DialogTitle></DialogHeader>
          {editing && (
            <div className="space-y-3">
              <div>
                <Label>Product Name</Label>
                <Input value={editing.product_name} onChange={(e) => setEditing({ ...editing, product_name: e.target.value })} />
              </div>
              <div>
                <Label>Description</Label>
                <Textarea value={editing.description || ""} onChange={(e) => setEditing({ ...editing, description: e.target.value })} />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label>HSN Code</Label>
                  <Input value={editing.hsn_code} onChange={(e) => setEditing({ ...editing, hsn_code: e.target.value.replace(/[^a-zA-Z0-9]/g, "").slice(0, 10) })} />
                </div>
                <div>
                  <Label>Category</Label>
                  <Input value={editing.category || ""} onChange={(e) => setEditing({ ...editing, category: e.target.value })} />
                </div>
                <div>
                  <Label>Default GST %</Label>
                  <Select value={String(editing.default_gst_rate)} onValueChange={(v) => setEditing({ ...editing, default_gst_rate: Number(v) })}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>{GST_OPTIONS.map((g) => <SelectItem key={g} value={String(g)}>{g}%</SelectItem>)}</SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>Default Unit Price (₹)</Label>
                  <Input type="number" min="0" step="0.01" value={editing.default_unit_price} onChange={(e) => setEditing({ ...editing, default_unit_price: Number(e.target.value) })} />
                </div>
              </div>
              <div className="flex justify-end gap-2">
                <Button variant="outline" onClick={() => setEditOpen(false)}>Cancel</Button>
                <Button onClick={saveEdit}>Save</Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Usage History Dialog */}
      <Dialog open={viewOpen} onOpenChange={setViewOpen}>
        <DialogContent className="max-w-3xl">
          <DialogHeader><DialogTitle>{viewing?.product_name} — Usage History</DialogTitle></DialogHeader>
          {usageLoading ? (
            <div className="space-y-2">{[...Array(4)].map((_, i) => <Skeleton key={i} className="h-8 w-full" />)}</div>
          ) : usage.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-6">Not used on any invoice yet.</p>
          ) : (
            <div className="max-h-[60vh] overflow-y-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Invoice #</TableHead>
                    <TableHead>Customer</TableHead>
                    <TableHead>Date</TableHead>
                    <TableHead className="text-right">Qty</TableHead>
                    <TableHead className="text-right">Rate</TableHead>
                    <TableHead className="text-right">Total</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {usage.map((u) => (
                    <TableRow key={u.id}>
                      <TableCell className="font-mono text-xs">{u.invoices?.invoice_number || "—"}</TableCell>
                      <TableCell>{u.invoices?.client_name || "—"}</TableCell>
                      <TableCell>{format(new Date(u.invoices?.created_at || u.created_at), "dd MMM yyyy")}</TableCell>
                      <TableCell className="text-right">{Number(u.quantity)}</TableCell>
                      <TableCell className="text-right">₹{Number(u.rate).toLocaleString("en-IN")}</TableCell>
                      <TableCell className="text-right">₹{Number(u.total).toLocaleString("en-IN")}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
