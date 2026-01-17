import { useState, useEffect, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { useToast } from "@/hooks/use-toast";
import { Plus, Pencil, Trash2, Upload, X, Image, Loader2, GripVertical, Eye, EyeOff, ExternalLink } from "lucide-react";

interface ShopSlide {
  id: string;
  title: string;
  description: string | null;
  image_url: string;
  product_id: string | null;
  is_visible: boolean;
  display_order: number;
  created_at: string;
}

interface Product {
  id: string;
  name: string;
  images: string[] | null;
}

export default function ShopSlides() {
  const [slides, setSlides] = useState<ShopSlide[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingSlide, setEditingSlide] = useState<ShopSlide | null>(null);
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    product_id: "",
    is_visible: true,
  });
  const [slideImage, setSlideImage] = useState<string>("");
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    const [slidesRes, productsRes] = await Promise.all([
      supabase.from("shop_slides").select("*").order("display_order", { ascending: true }),
      supabase.from("products").select("id, name, images").order("name", { ascending: true }),
    ]);
    setSlides(slidesRes.data || []);
    setProducts(productsRes.data || []);
    setIsLoading(false);
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading(true);
    const fileExt = file.name.split(".").pop();
    const fileName = `slide-${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExt}`;
    const filePath = `slides/${fileName}`;

    const { error: uploadError } = await supabase.storage
      .from("homepage-images")
      .upload(filePath, file);

    if (uploadError) {
      toast({ title: "Upload Error", description: uploadError.message, variant: "destructive" });
      setUploading(false);
      return;
    }

    const { data: { publicUrl } } = supabase.storage
      .from("homepage-images")
      .getPublicUrl(filePath);

    setSlideImage(publicUrl);
    setUploading(false);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!slideImage) {
      toast({ title: "Error", description: "Please upload a slide image", variant: "destructive" });
      return;
    }

    const maxOrder = slides.length > 0 ? Math.max(...slides.map(s => s.display_order)) : -1;

    const data = {
      title: formData.title,
      description: formData.description || null,
      image_url: slideImage,
      product_id: formData.product_id || null,
      is_visible: formData.is_visible,
      display_order: editingSlide ? editingSlide.display_order : maxOrder + 1,
    };

    if (editingSlide) {
      const { error } = await supabase.from("shop_slides").update(data).eq("id", editingSlide.id);
      if (error) {
        toast({ title: "Error", description: error.message, variant: "destructive" });
        return;
      }
      toast({ title: "Slide updated" });
    } else {
      const { error } = await supabase.from("shop_slides").insert([data]);
      if (error) {
        toast({ title: "Error", description: error.message, variant: "destructive" });
        return;
      }
      toast({ title: "Slide created" });
    }

    setDialogOpen(false);
    resetForm();
    fetchData();
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Delete this slide?")) return;
    await supabase.from("shop_slides").delete().eq("id", id);
    toast({ title: "Slide deleted" });
    fetchData();
  };

  const toggleVisibility = async (slide: ShopSlide) => {
    const { error } = await supabase
      .from("shop_slides")
      .update({ is_visible: !slide.is_visible })
      .eq("id", slide.id);

    if (error) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
      return;
    }
    toast({ title: slide.is_visible ? "Slide hidden" : "Slide visible" });
    fetchData();
  };

  const moveSlide = async (slideId: string, direction: 'up' | 'down') => {
    const index = slides.findIndex(s => s.id === slideId);
    if (index === -1) return;
    
    const newIndex = direction === 'up' ? index - 1 : index + 1;
    if (newIndex < 0 || newIndex >= slides.length) return;

    const currentSlide = slides[index];
    const swapSlide = slides[newIndex];

    await Promise.all([
      supabase.from("shop_slides").update({ display_order: swapSlide.display_order }).eq("id", currentSlide.id),
      supabase.from("shop_slides").update({ display_order: currentSlide.display_order }).eq("id", swapSlide.id),
    ]);

    fetchData();
  };

  const resetForm = () => {
    setFormData({ title: "", description: "", product_id: "", is_visible: true });
    setEditingSlide(null);
    setSlideImage("");
  };

  const openEdit = (slide: ShopSlide) => {
    setEditingSlide(slide);
    setFormData({
      title: slide.title,
      description: slide.description || "",
      product_id: slide.product_id || "",
      is_visible: slide.is_visible,
    });
    setSlideImage(slide.image_url);
    setDialogOpen(true);
  };

  const getProductName = (productId: string | null) => {
    if (!productId) return "No product linked";
    const product = products.find(p => p.id === productId);
    return product?.name || "Unknown product";
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Shop Slider</h1>
          <p className="text-muted-foreground">Manage marketing banners for the shop page</p>
        </div>
        <Dialog open={dialogOpen} onOpenChange={(open) => { setDialogOpen(open); if (!open) resetForm(); }}>
          <DialogTrigger asChild>
            <Button><Plus className="mr-2 h-4 w-4" />Add Slide</Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>{editingSlide ? "Edit" : "Add"} Slide</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <Label>Slide Title *</Label>
                <Input 
                  value={formData.title} 
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })} 
                  placeholder="e.g., Summer Sale - Up to 50% Off"
                  required 
                />
              </div>
              
              <div>
                <Label>Description (Optional)</Label>
                <Textarea 
                  value={formData.description} 
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Short promotional text..."
                  rows={2}
                />
              </div>

              <div>
                <Label>Link to Product (Optional)</Label>
                <Select value={formData.product_id || "none"} onValueChange={(v) => setFormData({ ...formData, product_id: v === "none" ? "" : v })}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select a product to link" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">No product link</SelectItem>
                    {products.map((p) => (
                      <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <p className="text-xs text-muted-foreground mt-1">
                  Clicking the slide will navigate to this product's detail page
                </p>
              </div>

              <div className="flex items-center justify-between p-4 border rounded-lg bg-muted/30">
                <div className="flex items-center gap-3">
                  <Eye className="h-5 w-5 text-primary" />
                  <div>
                    <Label className="text-base">Visible</Label>
                    <p className="text-sm text-muted-foreground">Show this slide in the shop slider</p>
                  </div>
                </div>
                <Switch 
                  checked={formData.is_visible} 
                  onCheckedChange={(checked) => setFormData({ ...formData, is_visible: checked })} 
                />
              </div>

              {/* Image Upload Section */}
              <div className="space-y-3">
                <Label>Slide Image *</Label>
                <div className="border-2 border-dashed border-border rounded-lg p-4">
                  <input
                    type="file"
                    ref={fileInputRef}
                    onChange={handleImageUpload}
                    accept="image/*"
                    className="hidden"
                  />
                  <div className="flex flex-col items-center gap-2">
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => fileInputRef.current?.click()}
                      disabled={uploading}
                    >
                      {uploading ? (
                        <><Loader2 className="mr-2 h-4 w-4 animate-spin" />Uploading...</>
                      ) : (
                        <><Upload className="mr-2 h-4 w-4" />Upload Banner Image</>
                      )}
                    </Button>
                    <p className="text-xs text-muted-foreground">
                      Recommended: 1920x600px, JPG or PNG
                    </p>
                  </div>
                </div>

                {slideImage && (
                  <div className="relative">
                    <img
                      src={slideImage}
                      alt="Slide preview"
                      className="w-full h-48 object-cover rounded-lg border border-border"
                    />
                    <button
                      type="button"
                      onClick={() => setSlideImage("")}
                      className="absolute -top-2 -right-2 bg-destructive text-destructive-foreground rounded-full p-1 hover:bg-destructive/90 transition-colors"
                    >
                      <X className="h-4 w-4" />
                    </button>
                  </div>
                )}
              </div>

              <Button type="submit" className="w-full" disabled={!slideImage}>
                {editingSlide ? "Update" : "Create"} Slide
              </Button>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <Image className="h-5 w-5" />
            Active Slides ({slides.filter(s => s.is_visible).length} visible)
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-12">Order</TableHead>
                <TableHead className="w-24">Preview</TableHead>
                <TableHead>Title</TableHead>
                <TableHead>Linked Product</TableHead>
                <TableHead className="text-center">Visible</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-8">Loading...</TableCell>
                </TableRow>
              ) : slides.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                    No slides yet. Create your first marketing banner!
                  </TableCell>
                </TableRow>
              ) : slides.map((slide, index) => (
                <TableRow key={slide.id}>
                  <TableCell>
                    <div className="flex flex-col gap-1">
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-6 w-6"
                        onClick={() => moveSlide(slide.id, 'up')}
                        disabled={index === 0}
                      >
                        ↑
                      </Button>
                      <span className="text-center text-xs text-muted-foreground">{index + 1}</span>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-6 w-6"
                        onClick={() => moveSlide(slide.id, 'down')}
                        disabled={index === slides.length - 1}
                      >
                        ↓
                      </Button>
                    </div>
                  </TableCell>
                  <TableCell>
                    <img
                      src={slide.image_url}
                      alt={slide.title}
                      className="w-20 h-12 object-cover rounded-md border border-border"
                    />
                  </TableCell>
                  <TableCell>
                    <div>
                      <p className="font-medium">{slide.title}</p>
                      {slide.description && (
                        <p className="text-sm text-muted-foreground line-clamp-1">{slide.description}</p>
                      )}
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      {slide.product_id ? (
                        <>
                          <ExternalLink className="h-4 w-4 text-primary" />
                          <span className="text-sm">{getProductName(slide.product_id)}</span>
                        </>
                      ) : (
                        <span className="text-sm text-muted-foreground">No link</span>
                      )}
                    </div>
                  </TableCell>
                  <TableCell className="text-center">
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => toggleVisibility(slide)}
                      className={slide.is_visible ? "text-success" : "text-muted-foreground"}
                    >
                      {slide.is_visible ? <Eye className="h-4 w-4" /> : <EyeOff className="h-4 w-4" />}
                    </Button>
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex items-center justify-end gap-2">
                      <Button variant="ghost" size="icon" onClick={() => openEdit(slide)}>
                        <Pencil className="h-4 w-4" />
                      </Button>
                      <Button variant="ghost" size="icon" onClick={() => handleDelete(slide.id)} className="text-destructive hover:text-destructive">
                        <Trash2 className="h-4 w-4" />
                      </Button>
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
