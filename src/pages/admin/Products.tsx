import { useState, useEffect, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { useActivityLog } from "@/hooks/useActivityLog";
import { Plus, Pencil, Trash2, Upload, X, Image as ImageIcon, Loader2, Star, MessageSquare, Video, Play, ClipboardList, Search } from "lucide-react";
import { AdminNotes } from "@/components/admin/AdminNotes";
import { ProductParameters } from "@/components/admin/ProductParameters";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { ApplicationsPicker } from "@/components/admin/products/ApplicationsPicker";
import { DownloadsManager } from "@/components/admin/products/DownloadsManager";
import { RelatedProductsPicker } from "@/components/admin/products/RelatedProductsPicker";
import { ChildTableRepeater } from "@/components/admin/products/ChildTableRepeater";

const isValidYouTubeUrl = (url: string): boolean => {
  if (!url) return true;
  return /^(https?:\/\/)?(www\.)?(youtube\.com\/(watch\?v=|embed\/)|youtu\.be\/)[\w-]{11}.*$/.test(url);
};
const getYouTubeVideoId = (url: string): string | null => {
  const m = url.match(/^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|&v=)([^#&?]*).*/);
  return m && m[2].length === 11 ? m[2] : null;
};

interface Category { id: string; name: string; }

interface Product {
  id: string;
  name: string;
  description: string | null;
  short_description?: string | null;
  long_description?: string | null;
  brand?: string | null;
  series?: string | null;
  model_number?: string | null;
  price: number;
  cost_price: number;
  category_id: string | null;
  stock_quantity: number;
  availability_status: string;
  images: string[] | null;
  gallery_360?: string[] | null;
  video_url: string | null;
  is_highlighted: boolean;
  is_featured?: boolean;
  featured_order?: number;
  is_bestseller?: boolean;
  is_new_arrival?: boolean;
  is_coming_soon?: boolean;
  is_pre_order?: boolean;
  is_discontinued?: boolean;
  made_in_india?: boolean;
  applications?: string[] | null;
  gst_percentage: number;
  sku: string | null;
  hsn_code: string | null;
  seo_title?: string | null;
  seo_description?: string | null;
  seo_keywords?: string[] | null;
  og_image_url?: string | null;
  canonical_url?: string | null;
}

const defaultForm = {
  name: "", short_description: "", long_description: "", description: "",
  brand: "", series: "", model_number: "",
  price: "", cost_price: "", category_id: "", stock_quantity: "",
  availability_status: "in_stock",
  is_highlighted: false, is_featured: false, featured_order: "0",
  is_bestseller: false, is_new_arrival: false, is_coming_soon: false,
  is_pre_order: false, is_discontinued: false, made_in_india: false,
  video_url: "", gst_percentage: "18", hsn_code: "",
  seo_title: "", seo_description: "", seo_keywords: "",
  og_image_url: "", canonical_url: "",
};

export default function Products() {
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [formData, setFormData] = useState(defaultForm);
  const [productImages, setProductImages] = useState<string[]>([]);
  const [gallery360, setGallery360] = useState<string[]>([]);
  const [applications, setApplications] = useState<string[]>([]);
  const [uploading, setUploading] = useState(false);
  const [uploading360, setUploading360] = useState(false);
  const [videoUrlError, setVideoUrlError] = useState("");
  const [tableSearch, setTableSearch] = useState("");
  const [activeTab, setActiveTab] = useState("general");
  const fileInputRef = useRef<HTMLInputElement>(null);
  const file360Ref = useRef<HTMLInputElement>(null);
  const { toast } = useToast();
  const { logActivity } = useActivityLog();

  useEffect(() => { fetchData(); }, []);

  const fetchData = async () => {
    const [productsRes, categoriesRes] = await Promise.all([
      supabase.from("products").select("*").order("created_at", { ascending: false }),
      supabase.from("categories").select("id, name"),
    ]);
    setProducts((productsRes.data as Product[]) || []);
    setCategories(categoriesRes.data || []);
    setIsLoading(false);
  };

  const uploadFiles = async (files: FileList, into: (urls: string[]) => void, folder = "products") => {
    const uploadedUrls: string[] = [];
    for (const file of Array.from(files)) {
      const ext = file.name.split(".").pop();
      const name = `${Date.now()}-${Math.random().toString(36).substring(7)}.${ext}`;
      const path = `${folder}/${name}`;
      const { error } = await supabase.storage.from("product-images").upload(path, file);
      if (error) { toast({ title: "Upload error", description: error.message, variant: "destructive" }); continue; }
      const { data: { publicUrl } } = supabase.storage.from("product-images").getPublicUrl(path);
      uploadedUrls.push(publicUrl);
    }
    into(uploadedUrls);
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files?.length) return;
    setUploading(true);
    await uploadFiles(e.target.files, (urls) => setProductImages((prev) => [...prev, ...urls]));
    setUploading(false);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const handle360Upload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files?.length) return;
    setUploading360(true);
    await uploadFiles(e.target.files, (urls) => setGallery360((prev) => [...prev, ...urls]), "360");
    setUploading360(false);
    if (file360Ref.current) file360Ref.current.value = "";
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (formData.video_url && !isValidYouTubeUrl(formData.video_url)) {
      setVideoUrlError("Please enter a valid YouTube URL");
      setActiveTab("media");
      return;
    }

    const data: any = {
      name: formData.name,
      short_description: formData.short_description || null,
      long_description: formData.long_description || null,
      description: formData.description || formData.long_description || formData.short_description || null,
      brand: formData.brand || null,
      series: formData.series || null,
      model_number: formData.model_number || null,
      price: parseFloat(formData.price) || 0,
      cost_price: parseFloat(formData.cost_price) || 0,
      category_id: formData.category_id || null,
      stock_quantity: parseInt(formData.stock_quantity) || 0,
      availability_status: formData.availability_status,
      images: productImages.length > 0 ? productImages : null,
      gallery_360: gallery360,
      applications,
      video_url: formData.video_url?.trim() || null,
      is_highlighted: formData.is_highlighted,
      is_featured: formData.is_featured,
      featured_order: parseInt(formData.featured_order) || 0,
      is_bestseller: formData.is_bestseller,
      is_new_arrival: formData.is_new_arrival,
      is_coming_soon: formData.is_coming_soon,
      is_pre_order: formData.is_pre_order,
      is_discontinued: formData.is_discontinued,
      made_in_india: formData.made_in_india,
      gst_percentage: parseFloat(formData.gst_percentage) || 18,
      hsn_code: formData.hsn_code?.trim() || null,
      seo_title: formData.seo_title || null,
      seo_description: formData.seo_description || null,
      seo_keywords: formData.seo_keywords ? formData.seo_keywords.split(",").map((s) => s.trim()).filter(Boolean) : [],
      og_image_url: formData.og_image_url || null,
      canonical_url: formData.canonical_url || null,
    };

    if (editingProduct) {
      const { error } = await supabase.from("products").update(data).eq("id", editingProduct.id);
      if (error) { toast({ title: "Error", description: error.message, variant: "destructive" }); return; }
      toast({ title: "Product updated" });
      logActivity({ actionType: "product_update", entityType: "product", entityId: editingProduct.id, description: `Updated: ${formData.name}` });
    } else {
      const { data: newP, error } = await supabase.from("products").insert([data]).select().single();
      if (error) { toast({ title: "Error", description: error.message, variant: "destructive" }); return; }
      toast({ title: "Product created", description: "You can now add features, highlights, downloads and related products." });
      if (newP) {
        setEditingProduct(newP as Product);
        logActivity({ actionType: "product_create", entityType: "product", entityId: newP.id, description: `Created: ${formData.name}` });
      }
    }
    fetchData();
  };

  const handleDelete = async (id: string) => {
    const p = products.find((x) => x.id === id);
    if (!confirm("Delete this product? This will also delete all its features, highlights, downloads, and related links.")) return;
    await supabase.from("products").delete().eq("id", id);
    toast({ title: "Product deleted" });
    logActivity({ actionType: "product_delete", entityType: "product", entityId: id, description: `Deleted: ${p?.name || id}` });
    fetchData();
  };

  const resetForm = () => {
    setFormData(defaultForm);
    setEditingProduct(null);
    setProductImages([]);
    setGallery360([]);
    setApplications([]);
    setVideoUrlError("");
    setActiveTab("general");
  };

  const openEdit = (product: Product) => {
    setEditingProduct(product);
    setFormData({
      name: product.name,
      short_description: product.short_description || "",
      long_description: product.long_description || "",
      description: product.description || "",
      brand: product.brand || "",
      series: product.series || "",
      model_number: product.model_number || "",
      price: String(product.price),
      cost_price: String(product.cost_price || 0),
      category_id: product.category_id || "",
      stock_quantity: String(product.stock_quantity),
      availability_status: product.availability_status,
      is_highlighted: product.is_highlighted,
      is_featured: product.is_featured ?? false,
      featured_order: String(product.featured_order ?? 0),
      is_bestseller: product.is_bestseller ?? false,
      is_new_arrival: product.is_new_arrival ?? false,
      is_coming_soon: product.is_coming_soon ?? false,
      is_pre_order: product.is_pre_order ?? false,
      is_discontinued: product.is_discontinued ?? false,
      made_in_india: product.made_in_india ?? false,
      video_url: product.video_url || "",
      gst_percentage: String(product.gst_percentage ?? 18),
      hsn_code: product.hsn_code || "",
      seo_title: product.seo_title || "",
      seo_description: product.seo_description || "",
      seo_keywords: (product.seo_keywords || []).join(", "),
      og_image_url: product.og_image_url || "",
      canonical_url: product.canonical_url || "",
    });
    setProductImages(product.images || []);
    setGallery360(product.gallery_360 || []);
    setApplications(product.applications || []);
    setVideoUrlError("");
    setActiveTab("general");
    setDialogOpen(true);
  };

  const filteredProducts = products.filter((p) =>
    !tableSearch.trim() ||
    p.name.toLowerCase().includes(tableSearch.toLowerCase()) ||
    (p.sku || "").toLowerCase().includes(tableSearch.toLowerCase()) ||
    (p.brand || "").toLowerCase().includes(tableSearch.toLowerCase())
  );

  const badgeCount = [
    formData.is_featured, formData.is_bestseller, formData.is_new_arrival,
    formData.is_coming_soon, formData.is_pre_order, formData.made_in_india,
  ].filter(Boolean).length;

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Products</h1>
          <p className="text-muted-foreground">Manage your product catalog</p>
        </div>
        <div className="flex items-center gap-2">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              className="pl-9 w-64"
              placeholder="Search products..."
              value={tableSearch}
              onChange={(e) => setTableSearch(e.target.value)}
            />
          </div>
          <Dialog open={dialogOpen} onOpenChange={(open) => { setDialogOpen(open); if (!open) resetForm(); }}>
            <DialogTrigger asChild>
              <Button><Plus className="mr-2 h-4 w-4" />Add Product</Button>
            </DialogTrigger>
            <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>{editingProduct ? `Edit: ${editingProduct.name}` : "Add Product"}</DialogTitle>
              </DialogHeader>

              <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
                <TabsList className="grid grid-cols-5 md:grid-cols-10 w-full h-auto">
                  <TabsTrigger value="general">General</TabsTrigger>
                  <TabsTrigger value="badges">
                    Badges {badgeCount > 0 && <Badge variant="secondary" className="ml-1 h-4 text-[10px]">{badgeCount}</Badge>}
                  </TabsTrigger>
                  <TabsTrigger value="media">Media</TabsTrigger>
                  <TabsTrigger value="apps">Applications</TabsTrigger>
                  <TabsTrigger value="seo">SEO</TabsTrigger>
                  <TabsTrigger value="specs" disabled={!editingProduct}>Specs</TabsTrigger>
                  <TabsTrigger value="features" disabled={!editingProduct}>Features</TabsTrigger>
                  <TabsTrigger value="highlights" disabled={!editingProduct}>Highlights</TabsTrigger>
                  <TabsTrigger value="downloads" disabled={!editingProduct}>Downloads</TabsTrigger>
                  <TabsTrigger value="related" disabled={!editingProduct}>Related</TabsTrigger>
                </TabsList>

                {/* General + Badges + Media + Apps + SEO share the main form */}
                <form onSubmit={handleSubmit} className="space-y-4 mt-4">
                  <TabsContent value="general" className="space-y-4 mt-0">
                    <div><Label>Name *</Label><Input value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })} required /></div>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                      <div><Label>Brand</Label><Input value={formData.brand} onChange={(e) => setFormData({ ...formData, brand: e.target.value })} placeholder="Decouvertes" /></div>
                      <div><Label>Series</Label><Input value={formData.series} onChange={(e) => setFormData({ ...formData, series: e.target.value })} placeholder="Enterprise" /></div>
                      <div><Label>Model Number</Label><Input value={formData.model_number} onChange={(e) => setFormData({ ...formData, model_number: e.target.value })} placeholder="DP-X10" /></div>
                    </div>
                    <div><Label>Short Description</Label><Textarea rows={2} value={formData.short_description} onChange={(e) => setFormData({ ...formData, short_description: e.target.value })} placeholder="One-liner shown on cards & meta description." /></div>
                    <div><Label>Long Description</Label><Textarea rows={5} value={formData.long_description} onChange={(e) => setFormData({ ...formData, long_description: e.target.value })} placeholder="Full storytelling description shown on product page." /></div>
                    <div className="grid grid-cols-2 gap-4">
                      <div><Label>Selling Price (₹) *</Label><Input type="number" step="0.01" value={formData.price} onChange={(e) => setFormData({ ...formData, price: e.target.value })} required /></div>
                      <div><Label>Cost Price (₹) <span className="text-xs text-muted-foreground">(Admin)</span></Label><Input type="number" step="0.01" value={formData.cost_price} onChange={(e) => setFormData({ ...formData, cost_price: e.target.value })} /></div>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div><Label>Stock Quantity *</Label><Input type="number" value={formData.stock_quantity} onChange={(e) => setFormData({ ...formData, stock_quantity: e.target.value })} required /></div>
                      <div><Label>HSN Code *</Label><Input value={formData.hsn_code} onChange={(e) => setFormData({ ...formData, hsn_code: e.target.value })} required /></div>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label>GST %</Label>
                        <Select value={formData.gst_percentage} onValueChange={(v) => setFormData({ ...formData, gst_percentage: v })}>
                          <SelectTrigger><SelectValue /></SelectTrigger>
                          <SelectContent>
                            {["0","5","12","18","28"].map(v => <SelectItem key={v} value={v}>{v}%</SelectItem>)}
                          </SelectContent>
                        </Select>
                      </div>
                      <div>
                        <Label>Category</Label>
                        <Select value={formData.category_id} onValueChange={(v) => setFormData({ ...formData, category_id: v })}>
                          <SelectTrigger><SelectValue placeholder="Select category" /></SelectTrigger>
                          <SelectContent>{categories.map((c) => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}</SelectContent>
                        </Select>
                      </div>
                    </div>
                    <div>
                      <Label>Availability</Label>
                      <Select value={formData.availability_status} onValueChange={(v) => setFormData({ ...formData, availability_status: v })}>
                        <SelectTrigger><SelectValue /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="in_stock">In Stock</SelectItem>
                          <SelectItem value="low_stock">Low Stock</SelectItem>
                          <SelectItem value="out_of_stock">Out of Stock</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    {editingProduct?.sku && (
                      <div className="p-3 bg-muted/50 rounded-lg">
                        <Label className="text-muted-foreground">SKU (Auto)</Label>
                        <p className="font-mono text-sm font-medium">{editingProduct.sku}</p>
                      </div>
                    )}
                  </TabsContent>

                  <TabsContent value="badges" className="space-y-3 mt-0">
                    {[
                      { key: "is_featured", label: "Featured on Homepage", desc: "Show in Featured Products section.", icon: Star, color: "text-primary" },
                      { key: "is_bestseller", label: "Best Seller", desc: "Mark as top-selling.", icon: Star, color: "text-warning" },
                      { key: "is_new_arrival", label: "New Arrival", desc: "Show 'NEW' badge on card.", icon: Star, color: "text-success" },
                      { key: "is_coming_soon", label: "Coming Soon", desc: "Hides Add to Cart, shows notify.", icon: Star, color: "text-muted-foreground" },
                      { key: "is_pre_order", label: "Pre-Order", desc: "Allow orders before stock available.", icon: Star, color: "text-primary" },
                      { key: "made_in_india", label: "Made in India", desc: "Show 'Made in India' emblem.", icon: Star, color: "text-warning" },
                      { key: "is_discontinued", label: "Discontinued", desc: "Hide from shop.", icon: Star, color: "text-destructive" },
                      { key: "is_highlighted", label: "Highlight (Slideshow)", desc: "Use in featured slideshow.", icon: Star, color: "text-warning" },
                    ].map(({ key, label, desc, icon: Icon, color }) => (
                      <div key={key} className="flex items-center justify-between p-4 border rounded-lg bg-muted/30">
                        <div className="flex items-center gap-3">
                          <Icon className={`h-5 w-5 ${color}`} />
                          <div>
                            <Label className="text-base">{label}</Label>
                            <p className="text-sm text-muted-foreground">{desc}</p>
                          </div>
                        </div>
                        <Switch
                          checked={(formData as any)[key]}
                          onCheckedChange={(c) => setFormData({ ...formData, [key]: c } as any)}
                        />
                      </div>
                    ))}
                    {formData.is_featured && (
                      <div className="p-4 border rounded-lg">
                        <Label>Featured Display Order</Label>
                        <Input type="number" className="w-32 mt-1" value={formData.featured_order} onChange={(e) => setFormData({ ...formData, featured_order: e.target.value })} />
                      </div>
                    )}
                  </TabsContent>

                  <TabsContent value="media" className="space-y-4 mt-0">
                    <div className="space-y-3">
                      <Label>Product Images</Label>
                      <div className="border-2 border-dashed border-border rounded-lg p-4">
                        <input type="file" ref={fileInputRef} onChange={handleImageUpload} accept="image/*" multiple className="hidden" />
                        <div className="flex flex-col items-center gap-2">
                          <Button type="button" variant="outline" onClick={() => fileInputRef.current?.click()} disabled={uploading}>
                            {uploading ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" />Uploading...</> : <><Upload className="mr-2 h-4 w-4" />Upload Images</>}
                          </Button>
                          <p className="text-xs text-muted-foreground">PNG, JPG, WEBP</p>
                        </div>
                      </div>
                      {productImages.length > 0 && (
                        <div className="grid grid-cols-4 gap-3">
                          {productImages.map((url, i) => (
                            <div key={i} className="relative group aspect-square">
                              <img src={url} alt="" className="w-full h-full object-cover rounded-lg border" />
                              <button type="button" onClick={() => setProductImages(productImages.filter((_, x) => x !== i))} className="absolute -top-2 -right-2 bg-destructive text-destructive-foreground rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                <X className="h-3 w-3" />
                              </button>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>

                    <div className="space-y-3 pt-4 border-t">
                      <div>
                        <Label>360° Gallery (optional)</Label>
                        <p className="text-xs text-muted-foreground">Upload sequential frames — 24 to 36 images work best.</p>
                      </div>
                      <div className="border-2 border-dashed border-border rounded-lg p-4">
                        <input type="file" ref={file360Ref} onChange={handle360Upload} accept="image/*" multiple className="hidden" />
                        <div className="flex flex-col items-center gap-2">
                          <Button type="button" variant="outline" onClick={() => file360Ref.current?.click()} disabled={uploading360}>
                            {uploading360 ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" />Uploading...</> : <><Upload className="mr-2 h-4 w-4" />Upload 360° Frames</>}
                          </Button>
                          <p className="text-xs text-muted-foreground">{gallery360.length} frame{gallery360.length === 1 ? "" : "s"}</p>
                        </div>
                      </div>
                      {gallery360.length > 0 && (
                        <div className="grid grid-cols-6 gap-2">
                          {gallery360.map((url, i) => (
                            <div key={i} className="relative group aspect-square">
                              <img src={url} alt="" className="w-full h-full object-cover rounded border" />
                              <button type="button" onClick={() => setGallery360(gallery360.filter((_, x) => x !== i))} className="absolute -top-1 -right-1 bg-destructive text-destructive-foreground rounded-full p-0.5 opacity-0 group-hover:opacity-100">
                                <X className="h-3 w-3" />
                              </button>
                            </div>
                          ))}
                          <Button type="button" variant="outline" size="sm" onClick={() => setGallery360([])} className="col-span-6">Clear all 360° frames</Button>
                        </div>
                      )}
                    </div>

                    <div className="space-y-3 pt-4 border-t">
                      <Label className="flex items-center gap-2"><Video className="h-4 w-4" />Product Video (YouTube)</Label>
                      <Input type="url" placeholder="https://www.youtube.com/watch?v=..." value={formData.video_url}
                        onChange={(e) => { setFormData({ ...formData, video_url: e.target.value }); if (videoUrlError && isValidYouTubeUrl(e.target.value)) setVideoUrlError(""); }}
                        className={videoUrlError ? "border-destructive" : ""}
                      />
                      {videoUrlError && <p className="text-sm text-destructive">{videoUrlError}</p>}
                      {formData.video_url && isValidYouTubeUrl(formData.video_url) && getYouTubeVideoId(formData.video_url) && (
                        <div className="relative mt-3">
                          <div className="aspect-video rounded-lg overflow-hidden border bg-muted">
                            <img src={`https://img.youtube.com/vi/${getYouTubeVideoId(formData.video_url)}/mqdefault.jpg`} alt="" className="w-full h-full object-cover" />
                            <div className="absolute inset-0 flex items-center justify-center bg-black/20">
                              <div className="w-12 h-12 rounded-full bg-white/90 flex items-center justify-center">
                                <Play className="w-6 h-6 text-primary ml-0.5" fill="currentColor" />
                              </div>
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  </TabsContent>

                  <TabsContent value="apps" className="mt-0">
                    <ApplicationsPicker value={applications} onChange={setApplications} />
                  </TabsContent>

                  <TabsContent value="seo" className="space-y-3 mt-0">
                    <div>
                      <Label>Meta Title</Label>
                      <Input value={formData.seo_title} onChange={(e) => setFormData({ ...formData, seo_title: e.target.value })} placeholder="Falls back to product name" maxLength={70} />
                      <p className="text-xs text-muted-foreground mt-1">{formData.seo_title.length}/70 characters</p>
                    </div>
                    <div>
                      <Label>Meta Description</Label>
                      <Textarea rows={3} value={formData.seo_description} onChange={(e) => setFormData({ ...formData, seo_description: e.target.value })} placeholder="Falls back to short description" maxLength={160} />
                      <p className="text-xs text-muted-foreground mt-1">{formData.seo_description.length}/160 characters</p>
                    </div>
                    <div>
                      <Label>Keywords <span className="text-xs text-muted-foreground">(comma separated)</span></Label>
                      <Input value={formData.seo_keywords} onChange={(e) => setFormData({ ...formData, seo_keywords: e.target.value })} placeholder="drone, agriculture, precision spraying" />
                    </div>
                    <div>
                      <Label>OG Image URL <span className="text-xs text-muted-foreground">(for social sharing)</span></Label>
                      <Input value={formData.og_image_url} onChange={(e) => setFormData({ ...formData, og_image_url: e.target.value })} placeholder="Falls back to first product image" />
                    </div>
                    <div>
                      <Label>Canonical URL</Label>
                      <Input value={formData.canonical_url} onChange={(e) => setFormData({ ...formData, canonical_url: e.target.value })} placeholder="Auto-generated from slug if empty" />
                    </div>
                  </TabsContent>

                  {(activeTab === "general" || activeTab === "badges" || activeTab === "media" || activeTab === "apps" || activeTab === "seo") && (
                    <Button type="submit" className="w-full sticky bottom-0">
                      {editingProduct ? "Update Product" : "Create Product"}
                    </Button>
                  )}
                </form>

                {/* Child-table tabs — need product to exist */}
                <TabsContent value="specs" className="mt-4">
                  {editingProduct && <ProductParameters productId={editingProduct.id} />}
                </TabsContent>
                <TabsContent value="features" className="mt-4">
                  {editingProduct && (
                    <ChildTableRepeater
                      table="product_features"
                      productId={editingProduct.id}
                      title="Features"
                      emptyItem={{ icon: "", title: "", description: "" }}
                      fields={[
                        { key: "icon", label: "Icon (lucide name, e.g. 'Shield')", placeholder: "Shield" },
                        { key: "title", label: "Title", placeholder: "Precision Flight" },
                        { key: "description", label: "Description", type: "textarea", placeholder: "One-sentence explanation." },
                      ]}
                    />
                  )}
                </TabsContent>
                <TabsContent value="highlights" className="mt-4">
                  {editingProduct && (
                    <ChildTableRepeater
                      table="product_highlights"
                      productId={editingProduct.id}
                      title="Highlights"
                      emptyItem={{ icon: "", label: "", value: "" }}
                      fields={[
                        { key: "icon", label: "Icon (lucide name)", placeholder: "Battery" },
                        { key: "label", label: "Label", placeholder: "Flight Time" },
                        { key: "value", label: "Value", placeholder: "45 min" },
                      ]}
                    />
                  )}
                </TabsContent>
                <TabsContent value="downloads" className="mt-4">
                  {editingProduct && <DownloadsManager productId={editingProduct.id} />}
                </TabsContent>
                <TabsContent value="related" className="mt-4">
                  {editingProduct && <RelatedProductsPicker productId={editingProduct.id} />}
                </TabsContent>
              </Tabs>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      <Card><CardContent className="p-0">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-16">Image</TableHead>
              <TableHead>SKU</TableHead>
              <TableHead>Name</TableHead>
              <TableHead>Badges</TableHead>
              <TableHead>Price</TableHead>
              <TableHead>Stock</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow><TableCell colSpan={7} className="text-center py-8">Loading...</TableCell></TableRow>
            ) : filteredProducts.length === 0 ? (
              <TableRow><TableCell colSpan={7} className="text-center py-8 text-muted-foreground">No products</TableCell></TableRow>
            ) : filteredProducts.map((p) => (
              <TableRow key={p.id}>
                <TableCell>
                  {p.images?.[0] ? (
                    <img src={p.images[0]} alt={p.name} className="w-12 h-12 object-cover rounded-md border" />
                  ) : (
                    <div className="w-12 h-12 bg-muted rounded-md flex items-center justify-center">
                      <ImageIcon className="h-5 w-5 text-muted-foreground" />
                    </div>
                  )}
                </TableCell>
                <TableCell className="font-mono text-xs text-muted-foreground">{p.sku || "-"}</TableCell>
                <TableCell>
                  <div className="font-medium">{p.name}</div>
                  {p.brand && <div className="text-xs text-muted-foreground">{p.brand}{p.model_number ? ` · ${p.model_number}` : ""}</div>}
                </TableCell>
                <TableCell>
                  <div className="flex flex-wrap gap-1 max-w-[200px]">
                    {p.is_featured && <Badge variant="default" className="text-[10px] h-4">Featured</Badge>}
                    {p.is_bestseller && <Badge variant="secondary" className="text-[10px] h-4">Best</Badge>}
                    {p.is_new_arrival && <Badge className="text-[10px] h-4 bg-success text-success-foreground">New</Badge>}
                    {p.is_coming_soon && <Badge variant="outline" className="text-[10px] h-4">Soon</Badge>}
                    {p.is_pre_order && <Badge variant="outline" className="text-[10px] h-4">Pre-Order</Badge>}
                    {p.made_in_india && <Badge className="text-[10px] h-4 bg-warning text-warning-foreground">🇮🇳 India</Badge>}
                    {p.is_discontinued && <Badge variant="destructive" className="text-[10px] h-4">Discontinued</Badge>}
                  </div>
                </TableCell>
                <TableCell>₹{p.price.toLocaleString()}</TableCell>
                <TableCell>
                  <span className={`px-2 py-1 rounded-full text-xs ${
                    p.availability_status === "in_stock" ? "bg-success/10 text-success"
                    : p.availability_status === "low_stock" ? "bg-warning/10 text-warning"
                    : "bg-destructive/10 text-destructive"
                  }`}>{p.stock_quantity}</span>
                </TableCell>
                <TableCell className="text-right">
                  <Sheet>
                    <SheetTrigger asChild>
                      <Button variant="ghost" size="icon" title="Notes"><MessageSquare className="h-4 w-4" /></Button>
                    </SheetTrigger>
                    <SheetContent>
                      <SheetHeader><SheetTitle>Notes for {p.name}</SheetTitle></SheetHeader>
                      <div className="mt-4"><AdminNotes entityType="product" entityId={p.id} /></div>
                    </SheetContent>
                  </Sheet>
                  <Button variant="ghost" size="icon" onClick={() => openEdit(p)}><Pencil className="h-4 w-4" /></Button>
                  <Button variant="ghost" size="icon" onClick={() => handleDelete(p.id)}><Trash2 className="h-4 w-4 text-destructive" /></Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent></Card>
    </div>
  );
}
