import { useState, useEffect, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { useToast } from "@/hooks/use-toast";
import { Plus, Pencil, Trash2, Upload, X, Image as ImageIcon, Loader2, Eye, EyeOff, Rocket } from "lucide-react";

interface HeroSlide {
  id: string;
  badge_label: string | null;
  title: string;
  subtitle: string | null;
  description: string | null;
  image_url: string | null;
  background_image_url: string | null;
  video_url: string | null;
  primary_cta_label: string | null;
  primary_cta_link: string | null;
  secondary_cta_label: string | null;
  secondary_cta_link: string | null;
  glow_color: string | null;
  display_order: number;
  is_active: boolean;
  created_at: string;
}

const emptyForm = {
  badge_label: "",
  title: "",
  subtitle: "",
  description: "",
  video_url: "",
  primary_cta_label: "",
  primary_cta_link: "",
  secondary_cta_label: "",
  secondary_cta_link: "",
  glow_color: "#f97316",
  is_active: true,
};

export default function HeroSlides() {
  const [slides, setSlides] = useState<HeroSlide[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<HeroSlide | null>(null);
  const [form, setForm] = useState(emptyForm);
  const [imageUrl, setImageUrl] = useState("");
  const [bgImageUrl, setBgImageUrl] = useState("");
  const [uploading, setUploading] = useState<"image" | "bg" | null>(null);
  const imgRef = useRef<HTMLInputElement>(null);
  const bgRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();

  useEffect(() => { fetchData(); }, []);

  const fetchData = async () => {
    setIsLoading(true);
    const { data, error } = await (supabase as any)
      .from("hero_slides")
      .select("*")
      .order("display_order", { ascending: true });
    if (error) toast({ title: "Error", description: error.message, variant: "destructive" });
    setSlides((data as HeroSlide[]) || []);
    setIsLoading(false);
  };

  const uploadFile = async (e: React.ChangeEvent<HTMLInputElement>, type: "image" | "bg") => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(type);
    const ext = file.name.split(".").pop();
    const path = `hero/${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${ext}`;
    const { error } = await supabase.storage.from("homepage-images").upload(path, file);
    if (error) {
      toast({ title: "Upload failed", description: error.message, variant: "destructive" });
      setUploading(null);
      return;
    }
    const { data: { publicUrl } } = supabase.storage.from("homepage-images").getPublicUrl(path);
    if (type === "image") setImageUrl(publicUrl); else setBgImageUrl(publicUrl);
    setUploading(null);
    if (type === "image" && imgRef.current) imgRef.current.value = "";
    if (type === "bg" && bgRef.current) bgRef.current.value = "";
  };

  const resetForm = () => {
    setForm(emptyForm);
    setImageUrl("");
    setBgImageUrl("");
    setEditing(null);
  };

  const openEdit = (s: HeroSlide) => {
    setEditing(s);
    setForm({
      badge_label: s.badge_label || "",
      title: s.title,
      subtitle: s.subtitle || "",
      description: s.description || "",
      video_url: s.video_url || "",
      primary_cta_label: s.primary_cta_label || "",
      primary_cta_link: s.primary_cta_link || "",
      secondary_cta_label: s.secondary_cta_label || "",
      secondary_cta_link: s.secondary_cta_link || "",
      glow_color: s.glow_color || "#f97316",
      is_active: s.is_active,
    });
    setImageUrl(s.image_url || "");
    setBgImageUrl(s.background_image_url || "");
    setDialogOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.title.trim()) return;

    const maxOrder = slides.length ? Math.max(...slides.map(s => s.display_order)) : -1;
    const payload = {
      badge_label: form.badge_label || null,
      title: form.title,
      subtitle: form.subtitle || null,
      description: form.description || null,
      image_url: imageUrl || null,
      background_image_url: bgImageUrl || null,
      video_url: form.video_url || null,
      primary_cta_label: form.primary_cta_label || null,
      primary_cta_link: form.primary_cta_link || null,
      secondary_cta_label: form.secondary_cta_label || null,
      secondary_cta_link: form.secondary_cta_link || null,
      glow_color: form.glow_color,
      is_active: form.is_active,
      display_order: editing ? editing.display_order : maxOrder + 1,
    };

    const q = editing
      ? (supabase as any).from("hero_slides").update(payload).eq("id", editing.id)
      : (supabase as any).from("hero_slides").insert([payload]);
    const { error } = await q;
    if (error) {
      toast({ title: "Save failed", description: error.message, variant: "destructive" });
      return;
    }
    toast({ title: editing ? "Slide updated" : "Slide created" });
    setDialogOpen(false);
    resetForm();
    fetchData();
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Delete this hero slide?")) return;
    const { error } = await (supabase as any).from("hero_slides").delete().eq("id", id);
    if (error) return toast({ title: "Delete failed", description: error.message, variant: "destructive" });
    toast({ title: "Slide deleted" });
    fetchData();
  };

  const toggleActive = async (s: HeroSlide) => {
    await (supabase as any).from("hero_slides").update({ is_active: !s.is_active }).eq("id", s.id);
    fetchData();
  };

  const move = async (id: string, dir: "up" | "down") => {
    const idx = slides.findIndex(s => s.id === id);
    if (idx === -1) return;
    const swapIdx = dir === "up" ? idx - 1 : idx + 1;
    if (swapIdx < 0 || swapIdx >= slides.length) return;
    const a = slides[idx], b = slides[swapIdx];
    await Promise.all([
      (supabase as any).from("hero_slides").update({ display_order: b.display_order }).eq("id", a.id),
      (supabase as any).from("hero_slides").update({ display_order: a.display_order }).eq("id", b.id),
    ]);
    fetchData();
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground flex items-center gap-2">
            <Rocket className="h-7 w-7 text-primary" />
            Hero Slider
          </h1>
          <p className="text-muted-foreground">Manage the cinematic hero slider on the homepage</p>
        </div>
        <Dialog open={dialogOpen} onOpenChange={(o) => { setDialogOpen(o); if (!o) resetForm(); }}>
          <DialogTrigger asChild>
            <Button><Plus className="mr-2 h-4 w-4" />Add Slide</Button>
          </DialogTrigger>
          <DialogContent className="max-w-3xl max-h-[92vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>{editing ? "Edit" : "Add"} Hero Slide</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label>Badge Label</Label>
                  <Input value={form.badge_label} onChange={(e) => setForm({ ...form, badge_label: e.target.value })} placeholder="Indigenous Drone Technology" />
                </div>
                <div>
                  <Label>Glow Color</Label>
                  <div className="flex gap-2">
                    <Input type="color" value={form.glow_color} onChange={(e) => setForm({ ...form, glow_color: e.target.value })} className="w-16 p-1 h-10" />
                    <Input value={form.glow_color} onChange={(e) => setForm({ ...form, glow_color: e.target.value })} placeholder="#f97316" />
                  </div>
                </div>
              </div>

              <div>
                <Label>Title *</Label>
                <Input value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} required placeholder="Precision Recon UAV" />
              </div>
              <div>
                <Label>Subtitle</Label>
                <Input value={form.subtitle} onChange={(e) => setForm({ ...form, subtitle: e.target.value })} placeholder="Long-range surveillance platform" />
              </div>
              <div>
                <Label>Description</Label>
                <Textarea value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} rows={3} placeholder="Short marketing copy shown under the title." />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label>Primary CTA Label</Label>
                  <Input value={form.primary_cta_label} onChange={(e) => setForm({ ...form, primary_cta_label: e.target.value })} placeholder="Explore Fleet" />
                </div>
                <div>
                  <Label>Primary CTA Link</Label>
                  <Input value={form.primary_cta_link} onChange={(e) => setForm({ ...form, primary_cta_link: e.target.value })} placeholder="/shop or #gallery-section" />
                </div>
                <div>
                  <Label>Secondary CTA Label</Label>
                  <Input value={form.secondary_cta_label} onChange={(e) => setForm({ ...form, secondary_cta_label: e.target.value })} placeholder="Contact Sales" />
                </div>
                <div>
                  <Label>Secondary CTA Link</Label>
                  <Input value={form.secondary_cta_link} onChange={(e) => setForm({ ...form, secondary_cta_link: e.target.value })} placeholder="#contact-section" />
                </div>
              </div>

              <div>
                <Label>Video URL (optional)</Label>
                <Input value={form.video_url} onChange={(e) => setForm({ ...form, video_url: e.target.value })} placeholder="https://…" />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Hero Image (PNG with transparent background recommended)</Label>
                  <input type="file" ref={imgRef} accept="image/*" className="hidden" onChange={(e) => uploadFile(e, "image")} />
                  <Button type="button" variant="outline" onClick={() => imgRef.current?.click()} disabled={uploading === "image"}>
                    {uploading === "image" ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" />Uploading…</> : <><Upload className="mr-2 h-4 w-4" />Upload Image</>}
                  </Button>
                  {imageUrl && (
                    <div className="relative">
                      <img src={imageUrl} alt="hero" className="w-full h-40 object-contain rounded-lg border border-border bg-slate-50" />
                      <button type="button" onClick={() => setImageUrl("")} className="absolute -top-2 -right-2 bg-destructive text-destructive-foreground rounded-full p-1"><X className="h-3.5 w-3.5" /></button>
                    </div>
                  )}
                </div>
                <div className="space-y-2">
                  <Label>Background Image (optional)</Label>
                  <input type="file" ref={bgRef} accept="image/*" className="hidden" onChange={(e) => uploadFile(e, "bg")} />
                  <Button type="button" variant="outline" onClick={() => bgRef.current?.click()} disabled={uploading === "bg"}>
                    {uploading === "bg" ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" />Uploading…</> : <><Upload className="mr-2 h-4 w-4" />Upload Background</>}
                  </Button>
                  {bgImageUrl && (
                    <div className="relative">
                      <img src={bgImageUrl} alt="bg" className="w-full h-40 object-cover rounded-lg border border-border" />
                      <button type="button" onClick={() => setBgImageUrl("")} className="absolute -top-2 -right-2 bg-destructive text-destructive-foreground rounded-full p-1"><X className="h-3.5 w-3.5" /></button>
                    </div>
                  )}
                </div>
              </div>

              <div className="flex items-center justify-between p-4 border rounded-lg bg-muted/30">
                <div className="flex items-center gap-3">
                  <Eye className="h-5 w-5 text-primary" />
                  <div>
                    <Label className="text-base">Active</Label>
                    <p className="text-sm text-muted-foreground">Show this slide in the hero</p>
                  </div>
                </div>
                <Switch checked={form.is_active} onCheckedChange={(v) => setForm({ ...form, is_active: v })} />
              </div>

              <Button type="submit" className="w-full">{editing ? "Update" : "Create"} Slide</Button>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <ImageIcon className="h-5 w-5" />
            Slides ({slides.filter(s => s.is_active).length} active)
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-16">Order</TableHead>
                <TableHead className="w-24">Preview</TableHead>
                <TableHead>Title</TableHead>
                <TableHead>Badge</TableHead>
                <TableHead className="text-center">Active</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <TableRow><TableCell colSpan={6} className="text-center py-8">Loading…</TableCell></TableRow>
              ) : slides.length === 0 ? (
                <TableRow><TableCell colSpan={6} className="text-center py-8 text-muted-foreground">No hero slides yet. Add your first one.</TableCell></TableRow>
              ) : slides.map((s, i) => (
                <TableRow key={s.id}>
                  <TableCell>
                    <div className="flex flex-col gap-0.5 items-center">
                      <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => move(s.id, "up")} disabled={i === 0}>↑</Button>
                      <span className="text-xs text-muted-foreground">{i + 1}</span>
                      <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => move(s.id, "down")} disabled={i === slides.length - 1}>↓</Button>
                    </div>
                  </TableCell>
                  <TableCell>
                    {s.image_url ? (
                      <img src={s.image_url} alt={s.title} className="w-20 h-14 object-contain rounded-md border border-border bg-slate-50" />
                    ) : <div className="w-20 h-14 rounded-md border border-dashed" />}
                  </TableCell>
                  <TableCell>
                    <p className="font-medium">{s.title}</p>
                    {s.subtitle && <p className="text-xs text-muted-foreground line-clamp-1">{s.subtitle}</p>}
                  </TableCell>
                  <TableCell className="text-xs text-muted-foreground">{s.badge_label || "—"}</TableCell>
                  <TableCell className="text-center">
                    <Button variant="ghost" size="icon" onClick={() => toggleActive(s)} className={s.is_active ? "text-emerald-600" : "text-muted-foreground"}>
                      {s.is_active ? <Eye className="h-4 w-4" /> : <EyeOff className="h-4 w-4" />}
                    </Button>
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex items-center justify-end gap-1">
                      <Button variant="ghost" size="icon" onClick={() => openEdit(s)}><Pencil className="h-4 w-4" /></Button>
                      <Button variant="ghost" size="icon" onClick={() => handleDelete(s.id)} className="text-destructive"><Trash2 className="h-4 w-4" /></Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
