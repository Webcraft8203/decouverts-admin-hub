import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/hooks/use-toast";
import { INDIAN_STATES } from "@/constants/indianStates";
import { Plus, Pencil, Eye, Search, Users, Building2, Mail, Phone, FileText } from "lucide-react";
import { format } from "date-fns";

interface CustomerMaster {
  id: string;
  customer_name: string;
  company_name: string | null;
  contact_person: string | null;
  mobile_number: string | null;
  alternate_mobile: string | null;
  email: string | null;
  gst_number: string | null;
  pan_number: string | null;
  billing_address: string | null;
  shipping_address: string | null;
  city: string | null;
  state: string | null;
  country: string | null;
  pincode: string | null;
  customer_type: "individual" | "business";
  source: string;
  notes: string | null;
  last_invoice_date: string | null;
  total_invoices_count: number;
  created_at: string;
}

interface InvoiceLite {
  id: string;
  invoice_number: string;
  invoice_type: string | null;
  is_final: boolean | null;
  total_amount: number;
  payment_status: string | null;
  created_at: string;
}

const emptyForm: Partial<CustomerMaster> = {
  customer_name: "",
  company_name: "",
  contact_person: "",
  mobile_number: "",
  alternate_mobile: "",
  email: "",
  gst_number: "",
  pan_number: "",
  billing_address: "",
  shipping_address: "",
  city: "",
  state: "Maharashtra",
  country: "India",
  pincode: "",
  customer_type: "business",
  notes: "",
};

export default function CustomerMaster() {
  const { toast } = useToast();
  const [rows, setRows] = useState<CustomerMaster[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [typeFilter, setTypeFilter] = useState<"all" | "business" | "individual">("all");
  const [sourceFilter, setSourceFilter] = useState<"all" | string>("all");

  const [formOpen, setFormOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<Partial<CustomerMaster>>(emptyForm);

  const [detailsOpen, setDetailsOpen] = useState(false);
  const [details, setDetails] = useState<CustomerMaster | null>(null);
  const [history, setHistory] = useState<InvoiceLite[]>([]);
  const [historyLoading, setHistoryLoading] = useState(false);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setIsLoading(true);
    const { data, error } = await (supabase as any)
      .from("customer_master")
      .select("*")
      .order("created_at", { ascending: false });
    if (error) toast({ title: "Error", description: error.message, variant: "destructive" });
    setRows((data as CustomerMaster[]) || []);
    setIsLoading(false);
  };

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return rows.filter((r) => {
      if (typeFilter !== "all" && r.customer_type !== typeFilter) return false;
      if (sourceFilter !== "all" && r.source !== sourceFilter) return false;
      if (!q) return true;
      return [
        r.customer_name,
        r.company_name,
        r.email,
        r.mobile_number,
        r.gst_number,
        r.city,
        r.state,
      ]
        .filter(Boolean)
        .some((v) => (v as string).toLowerCase().includes(q));
    });
  }, [rows, search, typeFilter, sourceFilter]);

  const openCreate = () => {
    setEditingId(null);
    setForm(emptyForm);
    setFormOpen(true);
  };

  const openEdit = (c: CustomerMaster) => {
    setEditingId(c.id);
    setForm({ ...c });
    setFormOpen(true);
  };

  const openDetails = async (c: CustomerMaster) => {
    setDetails(c);
    setDetailsOpen(true);
    setHistoryLoading(true);
    const { data } = await supabase
      .from("invoices")
      .select("id, invoice_number, invoice_type, is_final, total_amount, payment_status, created_at")
      .eq("customer_id" as any, c.id)
      .order("created_at", { ascending: false });
    setHistory((data as InvoiceLite[]) || []);
    setHistoryLoading(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.customer_name?.trim()) {
      toast({ title: "Name required", variant: "destructive" });
      return;
    }
    const payload: any = {
      ...form,
      email: form.email?.trim() || null,
      gst_number: form.gst_number?.trim()?.toUpperCase() || null,
      mobile_number: form.mobile_number?.trim() || null,
      source: editingId ? undefined : "manual_entry",
    };
    let res;
    if (editingId) {
      res = await (supabase as any).from("customer_master").update(payload).eq("id", editingId);
    } else {
      res = await (supabase as any).from("customer_master").insert([payload]).select("id, email").single();
      // Auto-subscribe newly created customer to newsletter
      if (!res.error && payload.email) {
        await supabase
          .from("newsletter_subscribers")
          .upsert(
            { email: payload.email, is_active: true, customer_id: res.data?.id } as any,
            { onConflict: "email" }
          );
      }
    }
    if (res.error) {
      toast({ title: "Save failed", description: res.error.message, variant: "destructive" });
      return;
    }
    toast({ title: editingId ? "Customer updated" : "Customer created" });
    setFormOpen(false);
    fetchData();
  };

  const sources = Array.from(new Set(rows.map((r) => r.source))).filter(Boolean);

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-2">
            <Users className="w-7 h-7 text-primary" /> Customer Master
          </h1>
          <p className="text-muted-foreground">Single source of truth for all billing customers</p>
        </div>
        <Button onClick={openCreate} className="gap-2">
          <Plus className="w-4 h-4" /> Add Customer
        </Button>
      </div>

      <Card>
        <CardHeader className="pb-3">
          <div className="flex flex-col md:flex-row gap-3 md:items-center">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search by name, company, email, mobile, GST…"
                className="pl-9"
              />
            </div>
            <Select value={typeFilter} onValueChange={(v: any) => setTypeFilter(v)}>
              <SelectTrigger className="w-full md:w-40"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Types</SelectItem>
                <SelectItem value="business">Business</SelectItem>
                <SelectItem value="individual">Individual</SelectItem>
              </SelectContent>
            </Select>
            <Select value={sourceFilter} onValueChange={(v: any) => setSourceFilter(v)}>
              <SelectTrigger className="w-full md:w-44"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Sources</SelectItem>
                {sources.map((s) => (
                  <SelectItem key={s} value={s}>{s.replace(/_/g, " ")}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Badge variant="secondary" className="whitespace-nowrap">{filtered.length} of {rows.length}</Badge>
          </div>
        </CardHeader>
        <CardContent>
          <div className="border rounded-lg overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Customer</TableHead>
                  <TableHead>Company</TableHead>
                  <TableHead>Mobile</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>GST</TableHead>
                  <TableHead className="text-right">Invoices</TableHead>
                  <TableHead>Last Invoice</TableHead>
                  <TableHead>Source</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading ? (
                  Array.from({ length: 5 }).map((_, i) => (
                    <TableRow key={i}>
                      <TableCell colSpan={9}><Skeleton className="h-8 w-full" /></TableCell>
                    </TableRow>
                  ))
                ) : filtered.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={9} className="text-center text-muted-foreground py-10">
                      No customers yet. Create your first one or generate a manual invoice.
                    </TableCell>
                  </TableRow>
                ) : (
                  filtered.map((c) => (
                    <TableRow key={c.id}>
                      <TableCell>
                        <div className="font-medium flex items-center gap-2">
                          {c.customer_type === "business" ? (
                            <Building2 className="w-3.5 h-3.5 text-primary" />
                          ) : (
                            <Users className="w-3.5 h-3.5 text-muted-foreground" />
                          )}
                          {c.customer_name}
                        </div>
                      </TableCell>
                      <TableCell className="text-sm">{c.company_name || "—"}</TableCell>
                      <TableCell className="text-sm">{c.mobile_number || "—"}</TableCell>
                      <TableCell className="text-sm">{c.email || "—"}</TableCell>
                      <TableCell className="text-xs font-mono">{c.gst_number || "—"}</TableCell>
                      <TableCell className="text-right font-semibold">{c.total_invoices_count}</TableCell>
                      <TableCell className="text-sm">
                        {c.last_invoice_date ? format(new Date(c.last_invoice_date), "dd MMM yyyy") : "—"}
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline" className="text-[10px]">{c.source.replace(/_/g, " ")}</Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-1">
                          <Button size="icon" variant="ghost" onClick={() => openDetails(c)} title="View">
                            <Eye className="w-4 h-4" />
                          </Button>
                          <Button size="icon" variant="ghost" onClick={() => openEdit(c)} title="Edit">
                            <Pencil className="w-4 h-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {/* Create / Edit dialog */}
      <Dialog open={formOpen} onOpenChange={setFormOpen}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editingId ? "Edit Customer" : "Add Customer"}</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4 mt-2">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div>
                <Label>Customer Name *</Label>
                <Input value={form.customer_name || ""} onChange={(e) => setForm({ ...form, customer_name: e.target.value })} required />
              </div>
              <div>
                <Label>Customer Type</Label>
                <Select value={form.customer_type as string} onValueChange={(v: any) => setForm({ ...form, customer_type: v })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="business">Business</SelectItem>
                    <SelectItem value="individual">Individual</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Company Name</Label>
                <Input value={form.company_name || ""} onChange={(e) => setForm({ ...form, company_name: e.target.value })} />
              </div>
              <div>
                <Label>Contact Person</Label>
                <Input value={form.contact_person || ""} onChange={(e) => setForm({ ...form, contact_person: e.target.value })} />
              </div>
              <div>
                <Label>Mobile</Label>
                <Input value={form.mobile_number || ""} onChange={(e) => setForm({ ...form, mobile_number: e.target.value })} />
              </div>
              <div>
                <Label>Alternate Mobile</Label>
                <Input value={form.alternate_mobile || ""} onChange={(e) => setForm({ ...form, alternate_mobile: e.target.value })} />
              </div>
              <div>
                <Label>Email</Label>
                <Input type="email" value={form.email || ""} onChange={(e) => setForm({ ...form, email: e.target.value })} />
              </div>
              <div>
                <Label>GST Number</Label>
                <Input value={form.gst_number || ""} onChange={(e) => setForm({ ...form, gst_number: e.target.value.toUpperCase() })} />
              </div>
              <div>
                <Label>PAN Number</Label>
                <Input value={form.pan_number || ""} onChange={(e) => setForm({ ...form, pan_number: e.target.value.toUpperCase() })} />
              </div>
              <div>
                <Label>State</Label>
                <Select value={form.state || ""} onValueChange={(v) => setForm({ ...form, state: v })}>
                  <SelectTrigger><SelectValue placeholder="Select" /></SelectTrigger>
                  <SelectContent>
                    {INDIAN_STATES.map((s) => <SelectItem key={s} value={s}>{s}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>City</Label>
                <Input value={form.city || ""} onChange={(e) => setForm({ ...form, city: e.target.value })} />
              </div>
              <div>
                <Label>Pincode</Label>
                <Input value={form.pincode || ""} onChange={(e) => setForm({ ...form, pincode: e.target.value })} />
              </div>
              <div>
                <Label>Country</Label>
                <Input value={form.country || ""} onChange={(e) => setForm({ ...form, country: e.target.value })} />
              </div>
            </div>
            <div>
              <Label>Billing Address</Label>
              <Textarea rows={2} value={form.billing_address || ""} onChange={(e) => setForm({ ...form, billing_address: e.target.value })} />
            </div>
            <div>
              <Label>Shipping Address</Label>
              <Textarea rows={2} value={form.shipping_address || ""} onChange={(e) => setForm({ ...form, shipping_address: e.target.value })} />
            </div>
            <div>
              <Label>Notes</Label>
              <Textarea rows={2} value={form.notes || ""} onChange={(e) => setForm({ ...form, notes: e.target.value })} />
            </div>
            <div className="flex justify-end gap-2">
              <Button type="button" variant="outline" onClick={() => setFormOpen(false)}>Cancel</Button>
              <Button type="submit">{editingId ? "Update" : "Create"}</Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* Details + history dialog */}
      <Dialog open={detailsOpen} onOpenChange={setDetailsOpen}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Users className="w-5 h-5" /> {details?.customer_name}
              {details?.company_name && <span className="text-muted-foreground text-sm">· {details.company_name}</span>}
            </DialogTitle>
          </DialogHeader>
          {details && (
            <Tabs defaultValue="info" className="mt-2">
              <TabsList>
                <TabsTrigger value="info">Profile</TabsTrigger>
                <TabsTrigger value="invoices">Invoice History ({history.length})</TabsTrigger>
              </TabsList>
              <TabsContent value="info" className="space-y-3 pt-3 text-sm">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <Field label="Contact Person" value={details.contact_person} />
                  <Field label="Customer Type" value={details.customer_type} />
                  <Field label="Mobile" value={details.mobile_number} icon={<Phone className="w-3.5 h-3.5" />} />
                  <Field label="Alternate Mobile" value={details.alternate_mobile} />
                  <Field label="Email" value={details.email} icon={<Mail className="w-3.5 h-3.5" />} />
                  <Field label="GST Number" value={details.gst_number} />
                  <Field label="PAN" value={details.pan_number} />
                  <Field label="State" value={details.state} />
                  <Field label="City" value={details.city} />
                  <Field label="Pincode" value={details.pincode} />
                </div>
                <Field label="Billing Address" value={details.billing_address} />
                <Field label="Shipping Address" value={details.shipping_address} />
                <Field label="Notes" value={details.notes} />
                <div className="grid grid-cols-3 gap-3 pt-2 border-t">
                  <Stat label="Source" value={details.source.replace(/_/g, " ")} />
                  <Stat label="Total Invoices" value={String(details.total_invoices_count)} />
                  <Stat label="Last Invoice" value={details.last_invoice_date ? format(new Date(details.last_invoice_date), "dd MMM yyyy") : "—"} />
                </div>
              </TabsContent>
              <TabsContent value="invoices" className="pt-3">
                {historyLoading ? (
                  <Skeleton className="h-32 w-full" />
                ) : history.length === 0 ? (
                  <div className="text-center text-muted-foreground py-8 text-sm">No invoices yet for this customer.</div>
                ) : (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Invoice</TableHead>
                        <TableHead>Type</TableHead>
                        <TableHead>Date</TableHead>
                        <TableHead className="text-right">Amount</TableHead>
                        <TableHead>Status</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {history.map((inv) => (
                        <TableRow key={inv.id}>
                          <TableCell className="font-mono text-xs">{inv.invoice_number}</TableCell>
                          <TableCell>
                            <Badge variant="outline" className="text-[10px]">
                              {inv.invoice_type || (inv.is_final ? "final" : "proforma")}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-sm">{format(new Date(inv.created_at), "dd MMM yyyy")}</TableCell>
                          <TableCell className="text-right font-medium">
                            ₹{Number(inv.total_amount).toLocaleString("en-IN", { minimumFractionDigits: 2 })}
                          </TableCell>
                          <TableCell>
                            <Badge variant="secondary" className="text-[10px]">{inv.payment_status || "—"}</Badge>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                )}
              </TabsContent>
            </Tabs>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}

function Field({ label, value, icon }: { label: string; value?: string | null; icon?: React.ReactNode }) {
  return (
    <div>
      <div className="text-xs text-muted-foreground flex items-center gap-1">{icon}{label}</div>
      <div className="font-medium break-words">{value || "—"}</div>
    </div>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-md border bg-muted/30 p-2">
      <div className="text-[10px] text-muted-foreground uppercase">{label}</div>
      <div className="font-semibold text-sm capitalize">{value}</div>
    </div>
  );
}
