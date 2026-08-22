import { useCallback, useEffect, useState } from "react";
import { AdminLayout } from "@/components/AdminLayout";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle,
} from "@/components/ui/dialog";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { toast } from "sonner";
import { ArrowDown, ArrowUp, FileText, Pencil, Plus, ScrollText, Trash2 } from "lucide-react";
import type { DocumentTerm, DocumentTermType } from "@/lib/documentTerms";

const DOC_TYPES: { value: DocumentTermType; label: string }[] = [
  { value: "invoice", label: "Invoice" },
  { value: "quotation", label: "Quotation" },
];

export default function TermsConditions() {
  const [docType, setDocType] = useState<DocumentTermType>("invoice");
  const [terms, setTerms] = useState<DocumentTerm[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<DocumentTerm | null>(null);
  const [content, setContent] = useState("");
  const [order, setOrder] = useState<number>(0);
  const [isActive, setIsActive] = useState(true);
  const [saving, setSaving] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<DocumentTerm | null>(null);

  const load = useCallback(async () => {
    setIsLoading(true);
    const { data, error } = await supabase
      .from("document_terms")
      .select("*")
      .eq("document_type", docType)
      .order("display_order", { ascending: true });
    if (error) {
      toast.error("Failed to load terms");
    } else {
      setTerms((data || []) as DocumentTerm[]);
    }
    setIsLoading(false);
  }, [docType]);

  useEffect(() => { load(); }, [load]);

  const openCreate = () => {
    setEditing(null);
    setContent("");
    setOrder((terms[terms.length - 1]?.display_order ?? 0) + 1);
    setIsActive(true);
    setDialogOpen(true);
  };

  const openEdit = (term: DocumentTerm) => {
    setEditing(term);
    setContent(term.content);
    setOrder(term.display_order);
    setIsActive(term.is_active);
    setDialogOpen(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!content.trim()) {
      toast.error("Term text is required");
      return;
    }
    setSaving(true);
    const payload = {
      document_type: docType,
      content: content.trim(),
      display_order: Number(order) || 0,
      is_active: isActive,
    };
    const { error } = editing
      ? await supabase.from("document_terms").update(payload).eq("id", editing.id)
      : await supabase.from("document_terms").insert(payload);
    setSaving(false);
    if (error) {
      toast.error(error.message);
      return;
    }
    toast.success(editing ? "Term updated" : "Term added");
    setDialogOpen(false);
    load();
  };

  const toggleActive = async (term: DocumentTerm) => {
    const { error } = await supabase
      .from("document_terms")
      .update({ is_active: !term.is_active })
      .eq("id", term.id);
    if (error) { toast.error(error.message); return; }
    setTerms((prev) => prev.map((t) => (t.id === term.id ? { ...t, is_active: !t.is_active } : t)));
  };

  const move = async (index: number, dir: -1 | 1) => {
    const target = terms[index + dir];
    const current = terms[index];
    if (!target || !current) return;
    const updates = [
      supabase.from("document_terms").update({ display_order: target.display_order }).eq("id", current.id),
      supabase.from("document_terms").update({ display_order: current.display_order }).eq("id", target.id),
    ];
    const results = await Promise.all(updates);
    if (results.some((r) => r.error)) { toast.error("Failed to reorder"); return; }
    load();
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    const { error } = await supabase.from("document_terms").delete().eq("id", deleteTarget.id);
    if (error) { toast.error(error.message); return; }
    toast.success("Term deleted");
    setDeleteTarget(null);
    load();
  };

  const activeTerms = terms.filter((t) => t.is_active);

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
              <ScrollText className="h-6 w-6 text-primary" />
              Terms &amp; Conditions
            </h1>
            <p className="text-muted-foreground">
              Manage the terms printed on invoices and quotations.
            </p>
          </div>
          <Button onClick={openCreate}>
            <Plus className="mr-2 h-4 w-4" /> Add Term
          </Button>
        </div>

        <Tabs value={docType} onValueChange={(v) => setDocType(v as DocumentTermType)}>
          <TabsList>
            {DOC_TYPES.map((d) => (
              <TabsTrigger key={d.value} value={d.value}>{d.label}</TabsTrigger>
            ))}
          </TabsList>
        </Tabs>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">
              {DOC_TYPES.find((d) => d.value === docType)?.label} Terms
            </CardTitle>
            <CardDescription>
              Active terms are numbered automatically in the order shown below.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {isLoading ? (
              [...Array(3)].map((_, i) => <Skeleton key={i} className="h-16 w-full" />)
            ) : terms.length === 0 ? (
              <div className="py-12 text-center">
                <FileText className="mx-auto mb-3 h-10 w-10 text-muted-foreground/30" />
                <p className="text-muted-foreground">No terms added yet.</p>
              </div>
            ) : (
              terms.map((term, index) => (
                <div
                  key={term.id}
                  className="flex items-start gap-3 rounded-lg border bg-card p-3"
                >
                  <div className="flex flex-col gap-1 pt-0.5">
                    <Button variant="ghost" size="icon" className="h-6 w-6"
                      disabled={index === 0} onClick={() => move(index, -1)}>
                      <ArrowUp className="h-3.5 w-3.5" />
                    </Button>
                    <Button variant="ghost" size="icon" className="h-6 w-6"
                      disabled={index === terms.length - 1} onClick={() => move(index, 1)}>
                      <ArrowDown className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-sm text-foreground">{term.content}</p>
                    <div className="mt-2 flex items-center gap-2">
                      <Badge variant={term.is_active ? "default" : "secondary"} className="text-[10px]">
                        {term.is_active ? "Active" : "Hidden"}
                      </Badge>
                      <span className="text-xs text-muted-foreground">Order {term.display_order}</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Switch checked={term.is_active} onCheckedChange={() => toggleActive(term)} />
                    <Button variant="ghost" size="icon" onClick={() => openEdit(term)}>
                      <Pencil className="h-4 w-4" />
                    </Button>
                    <Button variant="ghost" size="icon" onClick={() => setDeleteTarget(term)}>
                      <Trash2 className="h-4 w-4 text-destructive" />
                    </Button>
                  </div>
                </div>
              ))
            )}
          </CardContent>
        </Card>

        {activeTerms.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Document Preview</CardTitle>
              <CardDescription>How the terms will appear on the PDF.</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="rounded-md border bg-muted/30 p-4 space-y-1">
                {activeTerms.map((t, i) => (
                  <p key={t.id} className="text-xs text-muted-foreground">
                    {i + 1}. {t.content}
                  </p>
                ))}
              </div>
            </CardContent>
          </Card>
        )}
      </div>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent>
          <form onSubmit={handleSave}>
            <DialogHeader>
              <DialogTitle>{editing ? "Edit Term" : "Add Term"}</DialogTitle>
              <DialogDescription>
                Applies to {DOC_TYPES.find((d) => d.value === docType)?.label.toLowerCase()} documents.
                Do not add a number — it is added automatically.
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="term-content">Term Text *</Label>
                <Textarea
                  id="term-content"
                  value={content}
                  onChange={(e) => setContent(e.target.value)}
                  rows={4}
                  placeholder="Payment is due within 7 days of the invoice date."
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="term-order">Display Order</Label>
                  <Input
                    id="term-order"
                    type="number"
                    value={order}
                    onChange={(e) => setOrder(Number(e.target.value))}
                  />
                </div>
                <div className="flex items-end gap-3 pb-2">
                  <Switch id="term-active" checked={isActive} onCheckedChange={setIsActive} />
                  <Label htmlFor="term-active">Show on documents</Label>
                </div>
              </div>
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setDialogOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" disabled={saving}>
                {saving ? "Saving..." : editing ? "Update" : "Add Term"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <AlertDialog open={!!deleteTarget} onOpenChange={(o) => !o && setDeleteTarget(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete this term?</AlertDialogTitle>
            <AlertDialogDescription>
              It will be removed from all future documents. Already generated PDFs are unchanged.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete}>Delete</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </AdminLayout>
  );
}
