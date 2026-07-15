import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Checkbox } from "@/components/ui/checkbox";
import { Plus, Trash2, Download, Eye, Pencil, Search, FileText, Copy, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { format } from "date-fns";
import { useAuth } from "@/hooks/useAuth";
import { useQuotationPdf, type Quotation, type QuotationItem } from "@/hooks/useQuotationPdf";

const STATUS = {
  draft: { label: "Draft", cls: "bg-slate-100 text-slate-700 border-slate-200" },
  sent: { label: "Sent", cls: "bg-blue-100 text-blue-700 border-blue-200" },
  approved: { label: "Approved", cls: "bg-green-100 text-green-700 border-green-200" },
  rejected: { label: "Rejected", cls: "bg-red-100 text-red-700 border-red-200" },
  expired: { label: "Expired", cls: "bg-amber-100 text-amber-700 border-amber-200" },
} as const;

type Row = any;

const emptyItem = (): QuotationItem => ({
  product_name: "",
  description: "",
  quantity: 1,
  unit: "Nos",
  rate: 0,
  discount: 0,
  gst: 18,
  total: 0,
});

const emptyForm = () => ({
  quotation_number: "",
  quotation_date: format(new Date(), "yyyy-MM-dd"),
  valid_until: format(new Date(Date.now() + 30 * 86400000), "yyyy-MM-dd"),
  reference_number: "",
  subject: "",
  prepared_by: "",
  customer_name: "",
  company_name: "",
  contact_person: "",
  mobile: "",
  email: "",
  gst_number: "",
  billing_address: "",
  shipping_address: "",
  delivery_time: "4-6 weeks from PO",
  installation: "Included at customer site",
  training: "1-day onsite training included",
  warranty: "12 months standard warranty",
  payment_terms: "50% advance with PO, 50% before dispatch",
  dispatch_location: "Pune, Maharashtra",
  is_igst: false,
  scope_of_supply: "",
  exclusions: "GST as applicable. Freight, insurance, and unloading extra at actuals.",
  terms_conditions:
    "1. Prices are valid for 30 days from the date of quotation.\n2. Delivery timelines commence after receipt of PO and advance.\n3. Any change in scope will be quoted separately.\n4. Jurisdiction: Pune.",
  notes: "",
  status: "draft" as string,
  items: [emptyItem()],
});

function computeTotals(f: ReturnType<typeof emptyForm>) {
  let subtotal = 0;
  let discount = 0;
  let taxable = 0;
  let tax = 0;
  const items = f.items.map((it) => {
    const q = Number(it.quantity) || 0;
    const r = Number(it.rate) || 0;
    const d = Number(it.discount) || 0;
    const g = Number(it.gst) || 0;
    const line = q * r;
    const lineTaxable = Math.max(0, line - d);
    const lineTax = (lineTaxable * g) / 100;
    subtotal += line;
    discount += d;
    taxable += lineTaxable;
    tax += lineTax;
    return { ...it, total: +(lineTaxable + lineTax).toFixed(2) };
  });
  const cgst = f.is_igst ? 0 : +(tax / 2).toFixed(2);
  const sgst = f.is_igst ? 0 : +(tax / 2).toFixed(2);
  const igst = f.is_igst ? +tax.toFixed(2) : 0;
  const rawTotal = taxable + tax;
  const rounded = Math.round(rawTotal);
  const round_off = +(rounded - rawTotal).toFixed(2);
  return {
    items,
    subtotal: +subtotal.toFixed(2),
    discount: +discount.toFixed(2),
    taxable_amount: +taxable.toFixed(2),
    cgst,
    sgst,
    igst,
    round_off,
    grand_total: rounded,
  };
}

export default function Quotations() {
  const { user } = useAuth();
  const { download, preview, isBusy } = useQuotationPdf();
  const [rows, setRows] = useState<Row[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [sheetOpen, setSheetOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState(emptyForm());

  const load = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from("quotations")
      .select("*, quotation_items(*)")
      .order("created_at", { ascending: false });
    if (error) toast.error(error.message);
    setRows(data || []);
    setLoading(false);
  };

  useEffect(() => {
    load();
  }, []);

  const filtered = useMemo(() => {
    return rows.filter((r) => {
      if (statusFilter !== "all" && r.status !== statusFilter) return false;
      if (!search) return true;
      const s = search.toLowerCase();
      return (
        r.quotation_number?.toLowerCase().includes(s) ||
        r.customer_name?.toLowerCase().includes(s) ||
        r.company_name?.toLowerCase().includes(s) ||
        r.subject?.toLowerCase().includes(s)
      );
    });
  }, [rows, search, statusFilter]);

  const totals = useMemo(() => computeTotals(form), [form]);

  const openNew = async () => {
    setEditingId(null);
    const f = emptyForm();
    // fetch next quotation number
    try {
      const { data } = await supabase.rpc("generate_quotation_number");
      if (data) f.quotation_number = data as string;
    } catch {}
    setForm(f);
    setSheetOpen(true);
  };

  const openEdit = (r: Row) => {
    setEditingId(r.id);
    setForm({
      quotation_number: r.quotation_number,
      quotation_date: r.quotation_date,
      valid_until: r.valid_until || "",
      reference_number: r.reference_number || "",
      subject: r.subject || "",
      prepared_by: r.prepared_by || "",
      customer_name: r.customer_name || "",
      company_name: r.company_name || "",
      contact_person: r.contact_person || "",
      mobile: r.mobile || "",
      email: r.email || "",
      gst_number: r.gst_number || "",
      billing_address: r.billing_address || "",
      shipping_address: r.shipping_address || "",
      delivery_time: r.delivery_time || "",
      installation: r.installation || "",
      training: r.training || "",
      warranty: r.warranty || "",
      payment_terms: r.payment_terms || "",
      dispatch_location: r.dispatch_location || "",
      is_igst: !!r.is_igst,
      scope_of_supply: r.scope_of_supply || "",
      exclusions: r.exclusions || "",
      terms_conditions: r.terms_conditions || "",
      notes: r.notes || "",
      status: r.status || "draft",
      items:
        (r.quotation_items || [])
          .sort((a: any, b: any) => a.line_order - b.line_order)
          .map((i: any) => ({
            product_name: i.product_name,
            description: i.description || "",
            quantity: Number(i.quantity) || 1,
            unit: i.unit || "Nos",
            rate: Number(i.rate) || 0,
            discount: Number(i.discount) || 0,
            gst: Number(i.gst) || 18,
            total: Number(i.total) || 0,
          })) || [emptyItem()],
    });
    setSheetOpen(true);
  };

  const duplicate = async (r: Row) => {
    openEdit(r);
    setEditingId(null);
    try {
      const { data } = await supabase.rpc("generate_quotation_number");
      if (data) setForm((f) => ({ ...f, quotation_number: data as string, status: "draft" }));
    } catch {}
  };

  const save = async () => {
    if (!form.customer_name.trim()) {
      toast.error("Customer name is required");
      return;
    }
    if (form.items.some((i) => !i.product_name.trim())) {
      toast.error("Each item needs a product name");
      return;
    }
    setSaving(true);
    const t = computeTotals(form);
    const payload = {
      quotation_number: form.quotation_number,
      quotation_date: form.quotation_date,
      valid_until: form.valid_until || null,
      reference_number: form.reference_number || null,
      subject: form.subject || null,
      prepared_by: form.prepared_by || null,
      customer_name: form.customer_name,
      company_name: form.company_name || null,
      contact_person: form.contact_person || null,
      mobile: form.mobile || null,
      email: form.email || null,
      gst_number: form.gst_number || null,
      billing_address: form.billing_address || null,
      shipping_address: form.shipping_address || null,
      delivery_time: form.delivery_time || null,
      installation: form.installation || null,
      training: form.training || null,
      warranty: form.warranty || null,
      payment_terms: form.payment_terms || null,
      dispatch_location: form.dispatch_location || null,
      is_igst: form.is_igst,
      scope_of_supply: form.scope_of_supply || null,
      exclusions: form.exclusions || null,
      terms_conditions: form.terms_conditions || null,
      notes: form.notes || null,
      status: form.status,
      subtotal: t.subtotal,
      discount: t.discount,
      taxable_amount: t.taxable_amount,
      cgst: t.cgst,
      sgst: t.sgst,
      igst: t.igst,
      round_off: t.round_off,
      grand_total: t.grand_total,
      created_by: user?.id ?? null,
    };
    try {
      let qid = editingId;
      if (editingId) {
        const { error } = await supabase.from("quotations").update(payload).eq("id", editingId);
        if (error) throw error;
        await supabase.from("quotation_items").delete().eq("quotation_id", editingId);
      } else {
        const { data, error } = await supabase.from("quotations").insert(payload).select("id").single();
        if (error) throw error;
        qid = data!.id;
      }
      const itemsPayload = t.items.map((it, idx) => ({
        quotation_id: qid,
        product_name: it.product_name,
        description: it.description || null,
        quantity: Number(it.quantity) || 0,
        unit: it.unit || null,
        rate: Number(it.rate) || 0,
        discount: Number(it.discount) || 0,
        gst: Number(it.gst) || 0,
        total: it.total,
        line_order: idx,
      }));
      const { error: iErr } = await supabase.from("quotation_items").insert(itemsPayload);
      if (iErr) throw iErr;
      toast.success(editingId ? "Quotation updated" : "Quotation created");
      setSheetOpen(false);
      load();
    } catch (e: any) {
      toast.error(e?.message || "Failed to save");
    } finally {
      setSaving(false);
    }
  };

  const remove = async (r: Row) => {
    if (!confirm(`Delete ${r.quotation_number}?`)) return;
    const { error } = await supabase.from("quotations").delete().eq("id", r.id);
    if (error) return toast.error(error.message);
    toast.success("Deleted");
    load();
  };

  const toQuotation = (r: Row): Quotation => ({
    ...r,
    items: (r.quotation_items || [])
      .sort((a: any, b: any) => a.line_order - b.line_order)
      .map((i: any) => ({
        product_name: i.product_name,
        description: i.description,
        quantity: Number(i.quantity),
        unit: i.unit,
        rate: Number(i.rate),
        discount: Number(i.discount),
        gst: Number(i.gst),
        total: Number(i.total),
      })),
  });

  const setItem = (idx: number, patch: Partial<QuotationItem>) => {
    setForm((f) => {
      const items = [...f.items];
      items[idx] = { ...items[idx], ...patch } as QuotationItem;
      return { ...f, items };
    });
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <FileText className="h-6 w-6" /> Quotations
          </h1>
          <p className="text-sm text-muted-foreground">Create and manage professional quotations</p>
        </div>
        <Button onClick={openNew}>
          <Plus className="mr-2 h-4 w-4" /> New Quotation
        </Button>
      </div>

      <Card>
        <CardHeader className="pb-3">
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search by number, customer, subject..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-9"
              />
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="sm:w-48">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Statuses</SelectItem>
                {Object.entries(STATUS).map(([k, v]) => (
                  <SelectItem key={k} value={k}>
                    {v.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="py-12 text-center text-muted-foreground">
              <Loader2 className="animate-spin h-5 w-5 mx-auto" />
            </div>
          ) : filtered.length === 0 ? (
            <div className="py-12 text-center text-muted-foreground">No quotations yet.</div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Quotation #</TableHead>
                    <TableHead>Date</TableHead>
                    <TableHead>Customer</TableHead>
                    <TableHead>Subject</TableHead>
                    <TableHead className="text-right">Total</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filtered.map((r) => {
                    const st = STATUS[r.status as keyof typeof STATUS] || STATUS.draft;
                    return (
                      <TableRow key={r.id}>
                        <TableCell className="font-mono text-xs">{r.quotation_number}</TableCell>
                        <TableCell>{format(new Date(r.quotation_date), "dd MMM yyyy")}</TableCell>
                        <TableCell>
                          <div className="font-medium">{r.company_name || r.customer_name}</div>
                          {r.company_name && (
                            <div className="text-xs text-muted-foreground">{r.customer_name}</div>
                          )}
                        </TableCell>
                        <TableCell className="max-w-xs truncate text-sm">{r.subject || "-"}</TableCell>
                        <TableCell className="text-right font-medium">
                          ₹{Number(r.grand_total || 0).toLocaleString("en-IN")}
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline" className={st.cls}>
                            {st.label}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex gap-1 justify-end">
                            <Button size="icon" variant="ghost" onClick={() => preview(toQuotation(r))} title="Preview">
                              <Eye className="h-4 w-4" />
                            </Button>
                            <Button
                              size="icon"
                              variant="ghost"
                              onClick={() => download(toQuotation(r))}
                              disabled={isBusy}
                              title="Download PDF"
                            >
                              <Download className="h-4 w-4" />
                            </Button>
                            <Button size="icon" variant="ghost" onClick={() => openEdit(r)} title="Edit">
                              <Pencil className="h-4 w-4" />
                            </Button>
                            <Button size="icon" variant="ghost" onClick={() => duplicate(r)} title="Duplicate">
                              <Copy className="h-4 w-4" />
                            </Button>
                            <Button size="icon" variant="ghost" onClick={() => remove(r)} title="Delete">
                              <Trash2 className="h-4 w-4 text-destructive" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      <Sheet open={sheetOpen} onOpenChange={setSheetOpen}>
        <SheetContent className="sm:max-w-3xl w-full overflow-y-auto">
          <SheetHeader>
            <SheetTitle>
              {editingId ? "Edit Quotation" : "New Quotation"}{" "}
              <span className="font-mono text-sm text-muted-foreground ml-2">{form.quotation_number}</span>
            </SheetTitle>
          </SheetHeader>

          <Tabs defaultValue="basic" className="mt-4">
            <TabsList className="grid grid-cols-4 w-full">
              <TabsTrigger value="basic">Basic</TabsTrigger>
              <TabsTrigger value="customer">Customer</TabsTrigger>
              <TabsTrigger value="items">Items</TabsTrigger>
              <TabsTrigger value="terms">Terms</TabsTrigger>
            </TabsList>

            <TabsContent value="basic" className="space-y-4 mt-4">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label>Quotation Number</Label>
                  <Input
                    value={form.quotation_number}
                    onChange={(e) => setForm({ ...form, quotation_number: e.target.value })}
                  />
                </div>
                <div>
                  <Label>Status</Label>
                  <Select value={form.status} onValueChange={(v) => setForm({ ...form, status: v })}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {Object.entries(STATUS).map(([k, v]) => (
                        <SelectItem key={k} value={k}>
                          {v.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>Quotation Date</Label>
                  <Input
                    type="date"
                    value={form.quotation_date}
                    onChange={(e) => setForm({ ...form, quotation_date: e.target.value })}
                  />
                </div>
                <div>
                  <Label>Valid Until</Label>
                  <Input
                    type="date"
                    value={form.valid_until}
                    onChange={(e) => setForm({ ...form, valid_until: e.target.value })}
                  />
                </div>
                <div>
                  <Label>Reference #</Label>
                  <Input
                    value={form.reference_number}
                    onChange={(e) => setForm({ ...form, reference_number: e.target.value })}
                    placeholder="Customer RFQ / PO ref"
                  />
                </div>
                <div>
                  <Label>Prepared By</Label>
                  <Input
                    value={form.prepared_by}
                    onChange={(e) => setForm({ ...form, prepared_by: e.target.value })}
                  />
                </div>
                <div className="col-span-2">
                  <Label>Subject</Label>
                  <Input
                    value={form.subject}
                    onChange={(e) => setForm({ ...form, subject: e.target.value })}
                    placeholder="e.g. Quotation for 3D Printer with training package"
                  />
                </div>
                <div className="col-span-2 flex items-center gap-2">
                  <Checkbox
                    id="igst"
                    checked={form.is_igst}
                    onCheckedChange={(v) => setForm({ ...form, is_igst: !!v })}
                  />
                  <Label htmlFor="igst" className="cursor-pointer">
                    Apply IGST (inter-state supply)
                  </Label>
                </div>
              </div>
            </TabsContent>

            <TabsContent value="customer" className="space-y-4 mt-4">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label>Customer Name *</Label>
                  <Input
                    value={form.customer_name}
                    onChange={(e) => setForm({ ...form, customer_name: e.target.value })}
                  />
                </div>
                <div>
                  <Label>Company Name</Label>
                  <Input
                    value={form.company_name}
                    onChange={(e) => setForm({ ...form, company_name: e.target.value })}
                  />
                </div>
                <div>
                  <Label>Contact Person</Label>
                  <Input
                    value={form.contact_person}
                    onChange={(e) => setForm({ ...form, contact_person: e.target.value })}
                  />
                </div>
                <div>
                  <Label>GSTIN</Label>
                  <Input
                    value={form.gst_number}
                    onChange={(e) => setForm({ ...form, gst_number: e.target.value })}
                  />
                </div>
                <div>
                  <Label>Mobile</Label>
                  <Input value={form.mobile} onChange={(e) => setForm({ ...form, mobile: e.target.value })} />
                </div>
                <div>
                  <Label>Email</Label>
                  <Input value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />
                </div>
                <div className="col-span-2">
                  <Label>Billing Address</Label>
                  <Textarea
                    rows={3}
                    value={form.billing_address}
                    onChange={(e) => setForm({ ...form, billing_address: e.target.value })}
                  />
                </div>
                <div className="col-span-2">
                  <Label>Shipping Address (leave blank to reuse billing)</Label>
                  <Textarea
                    rows={3}
                    value={form.shipping_address}
                    onChange={(e) => setForm({ ...form, shipping_address: e.target.value })}
                  />
                </div>
              </div>
            </TabsContent>

            <TabsContent value="items" className="space-y-3 mt-4">
              {form.items.map((it, idx) => (
                <Card key={idx} className="p-3 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-mono text-muted-foreground">Item #{idx + 1}</span>
                    <Button
                      size="icon"
                      variant="ghost"
                      onClick={() =>
                        setForm({ ...form, items: form.items.filter((_, i) => i !== idx) })
                      }
                      disabled={form.items.length === 1}
                    >
                      <Trash2 className="h-4 w-4 text-destructive" />
                    </Button>
                  </div>
                  <Input
                    placeholder="Product / Service name"
                    value={it.product_name}
                    onChange={(e) => setItem(idx, { product_name: e.target.value })}
                  />
                  <Textarea
                    rows={2}
                    placeholder="Description / specifications"
                    value={it.description || ""}
                    onChange={(e) => setItem(idx, { description: e.target.value })}
                  />
                  <div className="grid grid-cols-5 gap-2">
                    <div>
                      <Label className="text-xs">Qty</Label>
                      <Input
                        type="number"
                        value={it.quantity}
                        onChange={(e) => setItem(idx, { quantity: Number(e.target.value) })}
                      />
                    </div>
                    <div>
                      <Label className="text-xs">Unit</Label>
                      <Input
                        value={it.unit || ""}
                        onChange={(e) => setItem(idx, { unit: e.target.value })}
                      />
                    </div>
                    <div>
                      <Label className="text-xs">Rate</Label>
                      <Input
                        type="number"
                        value={it.rate}
                        onChange={(e) => setItem(idx, { rate: Number(e.target.value) })}
                      />
                    </div>
                    <div>
                      <Label className="text-xs">Discount</Label>
                      <Input
                        type="number"
                        value={it.discount || 0}
                        onChange={(e) => setItem(idx, { discount: Number(e.target.value) })}
                      />
                    </div>
                    <div>
                      <Label className="text-xs">GST %</Label>
                      <Input
                        type="number"
                        value={it.gst || 0}
                        onChange={(e) => setItem(idx, { gst: Number(e.target.value) })}
                      />
                    </div>
                  </div>
                  <div className="text-right text-sm text-muted-foreground">
                    Line total:{" "}
                    <span className="font-semibold text-foreground">
                      ₹
                      {(
                        Math.max(0, (Number(it.quantity) || 0) * (Number(it.rate) || 0) - (Number(it.discount) || 0)) *
                        (1 + (Number(it.gst) || 0) / 100)
                      ).toLocaleString("en-IN", { maximumFractionDigits: 2 })}
                    </span>
                  </div>
                </Card>
              ))}
              <Button
                variant="outline"
                onClick={() => setForm({ ...form, items: [...form.items, emptyItem()] })}
              >
                <Plus className="mr-2 h-4 w-4" /> Add Item
              </Button>

              <Card className="p-4 bg-muted/40">
                <div className="space-y-1 text-sm">
                  <div className="flex justify-between">
                    <span>Subtotal</span>
                    <span>₹{totals.subtotal.toLocaleString("en-IN")}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Discount</span>
                    <span>- ₹{totals.discount.toLocaleString("en-IN")}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Taxable</span>
                    <span>₹{totals.taxable_amount.toLocaleString("en-IN")}</span>
                  </div>
                  {form.is_igst ? (
                    <div className="flex justify-between">
                      <span>IGST</span>
                      <span>₹{totals.igst.toLocaleString("en-IN")}</span>
                    </div>
                  ) : (
                    <>
                      <div className="flex justify-between">
                        <span>CGST</span>
                        <span>₹{totals.cgst.toLocaleString("en-IN")}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>SGST</span>
                        <span>₹{totals.sgst.toLocaleString("en-IN")}</span>
                      </div>
                    </>
                  )}
                  {totals.round_off !== 0 && (
                    <div className="flex justify-between">
                      <span>Round off</span>
                      <span>₹{totals.round_off.toLocaleString("en-IN")}</span>
                    </div>
                  )}
                  <div className="flex justify-between text-base font-bold pt-2 border-t">
                    <span>Grand Total</span>
                    <span>₹{totals.grand_total.toLocaleString("en-IN")}</span>
                  </div>
                </div>
              </Card>
            </TabsContent>

            <TabsContent value="terms" className="space-y-3 mt-4">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label>Delivery Time</Label>
                  <Input
                    value={form.delivery_time}
                    onChange={(e) => setForm({ ...form, delivery_time: e.target.value })}
                  />
                </div>
                <div>
                  <Label>Installation</Label>
                  <Input
                    value={form.installation}
                    onChange={(e) => setForm({ ...form, installation: e.target.value })}
                  />
                </div>
                <div>
                  <Label>Training</Label>
                  <Input
                    value={form.training}
                    onChange={(e) => setForm({ ...form, training: e.target.value })}
                  />
                </div>
                <div>
                  <Label>Warranty</Label>
                  <Input
                    value={form.warranty}
                    onChange={(e) => setForm({ ...form, warranty: e.target.value })}
                  />
                </div>
                <div>
                  <Label>Payment Terms</Label>
                  <Input
                    value={form.payment_terms}
                    onChange={(e) => setForm({ ...form, payment_terms: e.target.value })}
                  />
                </div>
                <div>
                  <Label>Dispatch Location</Label>
                  <Input
                    value={form.dispatch_location}
                    onChange={(e) => setForm({ ...form, dispatch_location: e.target.value })}
                  />
                </div>
              </div>
              <div>
                <Label>Exclusions</Label>
                <Textarea
                  rows={3}
                  value={form.exclusions}
                  onChange={(e) => setForm({ ...form, exclusions: e.target.value })}
                />
              </div>
              <div>
                <Label>Terms & Conditions</Label>
                <Textarea
                  rows={5}
                  value={form.terms_conditions}
                  onChange={(e) => setForm({ ...form, terms_conditions: e.target.value })}
                />
              </div>
              <div>
                <Label>Internal Notes</Label>
                <Textarea
                  rows={2}
                  value={form.notes}
                  onChange={(e) => setForm({ ...form, notes: e.target.value })}
                />
              </div>
            </TabsContent>
          </Tabs>

          <div className="flex gap-2 justify-end sticky bottom-0 bg-background pt-4 pb-2 mt-6 border-t">
            <Button
              variant="outline"
              onClick={() =>
                preview({
                  ...(form as any),
                  ...totals,
                  items: totals.items,
                } as Quotation)
              }
            >
              <Eye className="mr-2 h-4 w-4" /> Preview
            </Button>
            <Button variant="ghost" onClick={() => setSheetOpen(false)}>
              Cancel
            </Button>
            <Button onClick={save} disabled={saving}>
              {saving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
              {editingId ? "Update" : "Create"} Quotation
            </Button>
          </div>
        </SheetContent>
      </Sheet>
    </div>
  );
}
