import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { Plus, Pencil, Trash2, Upload, X, FileText, Star } from "lucide-react";

interface Certification {
  id: string;
  title: string;
  issuing_authority: string;
  certificate_number: string | null;
  issue_date: string | null;
  expiry_date: string | null;
  description: string | null;
  category: string;
  status_label: string | null;
  image_url: string | null;
  pdf_url: string | null;
  is_active: boolean;
  is_featured: boolean;
  display_order: number;
}

const CATEGORIES = ["registration", "recognition", "certification", "licence", "patent", "award", "compliance"];
const AUTHORITIES = ["MSME", "Startup India", "DPIIT", "ISO", "DGCA", "BIS", "GST", "Import Export Code", "UDYAM", "Patent Office", "Government of India"];

const emptyForm = {
  title: "",
  issuing_authority: "",
  certificate_number: "",
  issue_date: "",
  expiry_date: "",
  description: "",
  category: "certification",
  status_label: "Active",
  display_order: "0",
  is_active: true,
  is_featured: false,
};

const AdminCertifications = () => {
  const qc = useQueryClient();
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<Certification | null>(null);
  const [form, setForm] = useState(emptyForm);
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const [pdfUrl, setPdfUrl] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);

  const { data: rows, isLoading } = useQuery({
    queryKey: ["admin-certifications"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("certifications")
        .select("*")
        .order("is_featured", { ascending: false })
        .order("display_order", { ascending: true });
      if (error) throw error;
      return data as Certification[];
    },
  });

  const uploadFile = async (file: File, kind: "image" | "pdf") => {
    setUploading(true);
    try {
      const ext = file.name.split(".").pop();
      const name = `certificates/${kind}-${Date.now()}.${ext}`;
      const { error } = await supabase.storage.from("homepage-images").upload(name, file);
      if (error) throw error;
      const { data } = supabase.storage.from("homepage-images").getPublicUrl(name);
      if (kind === "image") setImageUrl(data.publicUrl);
      else setPdfUrl(data.publicUrl);
      toast.success(`${kind === "image" ? "Image" : "PDF"} uploaded`);
    } catch (e: any) {
      toast.error(e.message);
    } finally {
      setUploading(false);
    }
  };

  const reset = () => {
    setForm(emptyForm);
    setImageUrl(null);
    setPdfUrl(null);
    setEditing(null);
  };

  const save = useMutation({
    mutationFn: async () => {
      const payload = {
        title: form.title,
        issuing_authority: form.issuing_authority,
        certificate_number: form.certificate_number || null,
        issue_date: form.issue_date || null,
        expiry_date: form.expiry_date || null,
        description: form.description || null,
        category: form.category,
        status_label: form.status_label || null,
        image_url: imageUrl,
        pdf_url: pdfUrl,
        is_active: form.is_active,
        is_featured: form.is_featured,
        display_order: parseInt(form.display_order) || 0,
      };
      if (editing) {
        const { error } = await supabase.from("certifications").update(payload).eq("id", editing.id);
        if (error) throw error;
      } else {
        const { error } = await supabase.from("certifications").insert(payload);
        if (error) throw error;
      }
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["admin-certifications"] });
      qc.invalidateQueries({ queryKey: ["certifications-public"] });
      toast.success(editing ? "Updated" : "Created");
      setOpen(false);
      reset();
    },
    onError: (e: any) => toast.error(e.message),
  });

  const del = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("certifications").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["admin-certifications"] });
      qc.invalidateQueries({ queryKey: ["certifications-public"] });
      toast.success("Deleted");
    },
    onError: (e: any) => toast.error(e.message),
  });

  const edit = (c: Certification) => {
    setEditing(c);
    setForm({
      title: c.title,
      issuing_authority: c.issuing_authority,
      certificate_number: c.certificate_number ?? "",
      issue_date: c.issue_date ?? "",
      expiry_date: c.expiry_date ?? "",
      description: c.description ?? "",
      category: c.category,
      status_label: c.status_label ?? "Active",
      display_order: String(c.display_order),
      is_active: c.is_active,
      is_featured: c.is_featured,
    });
    setImageUrl(c.image_url);
    setPdfUrl(c.pdf_url);
    setOpen(true);
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold">Certifications & Recognitions</h1>
          <p className="text-muted-foreground">Manage certificates displayed in the Trust & Compliance section</p>
        </div>
        <Dialog open={open} onOpenChange={(o) => { setOpen(o); if (!o) reset(); }}>
          <DialogTrigger asChild>
            <Button><Plus className="h-4 w-4 mr-2" /> Add Certificate</Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>{editing ? "Edit Certificate" : "Add Certificate"}</DialogTitle>
            </DialogHeader>
            <form
              onSubmit={(e) => { e.preventDefault(); save.mutate(); }}
              className="space-y-4"
            >
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label>Title *</Label>
                  <Input required value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} />
                </div>
                <div>
                  <Label>Issuing Authority *</Label>
                  <Input list="authorities" required value={form.issuing_authority} onChange={(e) => setForm({ ...form, issuing_authority: e.target.value })} />
                  <datalist id="authorities">
                    {AUTHORITIES.map((a) => <option key={a} value={a} />)}
                  </datalist>
                </div>
                <div>
                  <Label>Certificate Number</Label>
                  <Input value={form.certificate_number} onChange={(e) => setForm({ ...form, certificate_number: e.target.value })} />
                </div>
                <div>
                  <Label>Category *</Label>
                  <Select value={form.category} onValueChange={(v) => setForm({ ...form, category: v })}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {CATEGORIES.map((c) => <SelectItem key={c} value={c} className="capitalize">{c}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>Issue Date</Label>
                  <Input type="date" value={form.issue_date} onChange={(e) => setForm({ ...form, issue_date: e.target.value })} />
                </div>
                <div>
                  <Label>Expiry Date</Label>
                  <Input type="date" value={form.expiry_date} onChange={(e) => setForm({ ...form, expiry_date: e.target.value })} />
                </div>
                <div>
                  <Label>Status Badge</Label>
                  <Input placeholder="Active / Government Approved / …" value={form.status_label} onChange={(e) => setForm({ ...form, status_label: e.target.value })} />
                </div>
                <div>
                  <Label>Display Order</Label>
                  <Input type="number" value={form.display_order} onChange={(e) => setForm({ ...form, display_order: e.target.value })} />
                </div>
              </div>

              <div>
                <Label>Description</Label>
                <Textarea rows={3} value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label>Certificate Image *</Label>
                  <div className="mt-2">
                    {imageUrl ? (
                      <div className="relative inline-block">
                        <img src={imageUrl} alt="preview" className="h-28 w-auto object-contain border rounded p-2 bg-white" />
                        <button type="button" onClick={() => setImageUrl(null)} className="absolute -top-1 -right-1 bg-destructive text-destructive-foreground rounded-full p-0.5">
                          <X className="h-3 w-3" />
                        </button>
                      </div>
                    ) : (
                      <label className="cursor-pointer inline-flex items-center gap-2 border rounded-lg px-4 py-2 hover:bg-muted transition-colors">
                        <Upload className="h-4 w-4" />
                        <span className="text-sm">{uploading ? "Uploading…" : "Upload Image"}</span>
                        <input type="file" accept="image/*" className="hidden" onChange={(e) => e.target.files?.[0] && uploadFile(e.target.files[0], "image")} disabled={uploading} />
                      </label>
                    )}
                  </div>
                </div>
                <div>
                  <Label>PDF (optional)</Label>
                  <div className="mt-2">
                    {pdfUrl ? (
                      <div className="flex items-center gap-2 border rounded-lg px-3 py-2">
                        <FileText className="h-4 w-4 text-primary" />
                        <a href={pdfUrl} target="_blank" rel="noreferrer" className="text-sm text-primary underline truncate">View PDF</a>
                        <button type="button" onClick={() => setPdfUrl(null)} className="ml-auto text-destructive"><X className="h-3 w-3" /></button>
                      </div>
                    ) : (
                      <label className="cursor-pointer inline-flex items-center gap-2 border rounded-lg px-4 py-2 hover:bg-muted transition-colors">
                        <Upload className="h-4 w-4" />
                        <span className="text-sm">{uploading ? "Uploading…" : "Upload PDF"}</span>
                        <input type="file" accept="application/pdf" className="hidden" onChange={(e) => e.target.files?.[0] && uploadFile(e.target.files[0], "pdf")} disabled={uploading} />
                      </label>
                    )}
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-8 pt-2">
                <label className="flex items-center gap-2">
                  <Switch checked={form.is_active} onCheckedChange={(v) => setForm({ ...form, is_active: v })} />
                  <span className="text-sm">Active</span>
                </label>
                <label className="flex items-center gap-2">
                  <Switch checked={form.is_featured} onCheckedChange={(v) => setForm({ ...form, is_featured: v })} />
                  <span className="text-sm">Featured</span>
                </label>
              </div>

              <div className="flex justify-end gap-2 pt-4">
                <Button type="button" variant="outline" onClick={() => { setOpen(false); reset(); }}>Cancel</Button>
                <Button type="submit" disabled={save.isPending || !imageUrl}>{editing ? "Update" : "Create"}</Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <Card>
        <CardHeader><CardTitle>All Certificates</CardTitle></CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="text-center py-8 text-muted-foreground">Loading…</div>
          ) : !rows?.length ? (
            <div className="text-center py-8 text-muted-foreground">No certificates yet</div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Image</TableHead>
                  <TableHead>Title</TableHead>
                  <TableHead>Authority</TableHead>
                  <TableHead>Category</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Order</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {rows.map((c) => (
                  <TableRow key={c.id}>
                    <TableCell>
                      {c.image_url ? <img src={c.image_url} alt={c.title} className="h-10 w-14 object-cover rounded" /> : <div className="h-10 w-14 bg-muted rounded" />}
                    </TableCell>
                    <TableCell>
                      <div className="font-medium flex items-center gap-1">
                        {c.is_featured && <Star className="h-3 w-3 text-orange-500 fill-orange-500" />}
                        {c.title}
                      </div>
                      {c.certificate_number && <div className="text-xs text-muted-foreground">{c.certificate_number}</div>}
                    </TableCell>
                    <TableCell>{c.issuing_authority}</TableCell>
                    <TableCell><Badge variant="outline" className="capitalize">{c.category}</Badge></TableCell>
                    <TableCell>
                      <Badge variant={c.is_active ? "default" : "secondary"}>{c.is_active ? "Active" : "Inactive"}</Badge>
                    </TableCell>
                    <TableCell>{c.display_order}</TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-2">
                        <Button variant="ghost" size="icon" onClick={() => edit(c)}><Pencil className="h-4 w-4" /></Button>
                        <Button variant="ghost" size="icon" onClick={() => { if (confirm("Delete this certificate?")) del.mutate(c.id); }}>
                          <Trash2 className="h-4 w-4 text-destructive" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default AdminCertifications;
