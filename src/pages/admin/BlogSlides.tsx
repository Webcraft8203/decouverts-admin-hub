import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Plus, Pencil, Trash2, GripVertical, Image as ImageIcon } from "lucide-react";
import { toast } from "sonner";

interface BlogSlide {
  id: string;
  title: string;
  description: string | null;
  image_url: string;
  cta_link: string | null;
  cta_text: string | null;
  is_visible: boolean;
  display_order: number;
}

interface SlideFormData {
  title: string;
  description: string;
  image_url: string;
  cta_link: string;
  cta_text: string;
  is_visible: boolean;
  display_order: number;
}

const defaultFormData: SlideFormData = {
  title: "",
  description: "",
  image_url: "",
  cta_link: "",
  cta_text: "Read More",
  is_visible: true,
  display_order: 0,
};

export default function BlogSlides() {
  const queryClient = useQueryClient();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingSlide, setEditingSlide] = useState<BlogSlide | null>(null);
  const [formData, setFormData] = useState<SlideFormData>(defaultFormData);

  const { data: slides, isLoading } = useQuery({
    queryKey: ["admin-blog-slides"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("blog_slides")
        .select("*")
        .order("display_order", { ascending: true });

      if (error) throw error;
      return (data || []) as BlogSlide[];
    },
  });

  const createMutation = useMutation({
    mutationFn: async (data: SlideFormData) => {
      const { error } = await supabase.from("blog_slides").insert([data]);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-blog-slides"] });
      toast.success("Slide created successfully");
      setIsDialogOpen(false);
      setFormData(defaultFormData);
    },
    onError: (error) => {
      toast.error("Failed to create slide: " + error.message);
    },
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: Partial<SlideFormData> }) => {
      const { error } = await supabase.from("blog_slides").update(data).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-blog-slides"] });
      toast.success("Slide updated successfully");
      setIsDialogOpen(false);
      setEditingSlide(null);
      setFormData(defaultFormData);
    },
    onError: (error) => {
      toast.error("Failed to update slide: " + error.message);
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("blog_slides").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-blog-slides"] });
      toast.success("Slide deleted successfully");
    },
    onError: (error) => {
      toast.error("Failed to delete slide: " + error.message);
    },
  });

  const handleOpenDialog = (slide?: BlogSlide) => {
    if (slide) {
      setEditingSlide(slide);
      setFormData({
        title: slide.title,
        description: slide.description || "",
        image_url: slide.image_url,
        cta_link: slide.cta_link || "",
        cta_text: slide.cta_text || "Read More",
        is_visible: slide.is_visible,
        display_order: slide.display_order,
      });
    } else {
      setEditingSlide(null);
      setFormData({
        ...defaultFormData,
        display_order: (slides?.length || 0) + 1,
      });
    }
    setIsDialogOpen(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.title || !formData.image_url) {
      toast.error("Title and image URL are required");
      return;
    }

    if (editingSlide) {
      updateMutation.mutate({ id: editingSlide.id, data: formData });
    } else {
      createMutation.mutate(formData);
    }
  };

  const toggleVisibility = (slide: BlogSlide) => {
    updateMutation.mutate({
      id: slide.id,
      data: { is_visible: !slide.is_visible },
    });
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Blog Hero Slider</h1>
          <p className="text-muted-foreground">Manage the hero slider on the Blogs & News page</p>
        </div>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button onClick={() => handleOpenDialog()}>
              <Plus className="w-4 h-4 mr-2" />
              Add Slide
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-lg">
            <DialogHeader>
              <DialogTitle>{editingSlide ? "Edit Slide" : "Add New Slide"}</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="title">Title *</Label>
                <Input
                  id="title"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  placeholder="Slide title"
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Short description (1-2 lines)"
                  rows={2}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="image_url">Banner Image URL *</Label>
                <Input
                  id="image_url"
                  value={formData.image_url}
                  onChange={(e) => setFormData({ ...formData, image_url: e.target.value })}
                  placeholder="https://..."
                  required
                />
                {formData.image_url && (
                  <img 
                    src={formData.image_url} 
                    alt="Preview" 
                    className="w-full h-32 object-cover rounded-lg mt-2"
                  />
                )}
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="cta_link">CTA Link</Label>
                  <Input
                    id="cta_link"
                    value={formData.cta_link}
                    onChange={(e) => setFormData({ ...formData, cta_link: e.target.value })}
                    placeholder="/blogs/my-post"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="cta_text">CTA Button Text</Label>
                  <Input
                    id="cta_text"
                    value={formData.cta_text}
                    onChange={(e) => setFormData({ ...formData, cta_text: e.target.value })}
                    placeholder="Read More"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="display_order">Display Order</Label>
                <Input
                  id="display_order"
                  type="number"
                  value={formData.display_order}
                  onChange={(e) => setFormData({ ...formData, display_order: parseInt(e.target.value) || 0 })}
                />
              </div>

              <div className="flex items-center justify-between">
                <Label htmlFor="is_visible">Visible</Label>
                <Switch
                  id="is_visible"
                  checked={formData.is_visible}
                  onCheckedChange={(checked) => setFormData({ ...formData, is_visible: checked })}
                />
              </div>

              <div className="flex justify-end gap-3 pt-4">
                <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>
                  Cancel
                </Button>
                <Button type="submit" disabled={createMutation.isPending || updateMutation.isPending}>
                  {editingSlide ? "Update Slide" : "Create Slide"}
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>All Slides</CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <p className="text-muted-foreground">Loading...</p>
          ) : slides && slides.length > 0 ? (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-12">Order</TableHead>
                  <TableHead className="w-20">Image</TableHead>
                  <TableHead>Title</TableHead>
                  <TableHead>CTA Link</TableHead>
                  <TableHead className="w-24">Visible</TableHead>
                  <TableHead className="w-24">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {slides.map((slide) => (
                  <TableRow key={slide.id}>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <GripVertical className="w-4 h-4 text-muted-foreground" />
                        {slide.display_order}
                      </div>
                    </TableCell>
                    <TableCell>
                      {slide.image_url ? (
                        <img
                          src={slide.image_url}
                          alt={slide.title}
                          className="w-16 h-10 object-cover rounded"
                        />
                      ) : (
                        <div className="w-16 h-10 bg-muted rounded flex items-center justify-center">
                          <ImageIcon className="w-4 h-4 text-muted-foreground" />
                        </div>
                      )}
                    </TableCell>
                    <TableCell className="font-medium">{slide.title}</TableCell>
                    <TableCell className="text-muted-foreground text-sm">
                      {slide.cta_link || "-"}
                    </TableCell>
                    <TableCell>
                      <Switch
                        checked={slide.is_visible}
                        onCheckedChange={() => toggleVisibility(slide)}
                      />
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleOpenDialog(slide)}
                        >
                          <Pencil className="w-4 h-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => {
                            if (confirm("Are you sure you want to delete this slide?")) {
                              deleteMutation.mutate(slide.id);
                            }
                          }}
                          className="text-destructive hover:text-destructive"
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          ) : (
            <div className="text-center py-8 text-muted-foreground">
              <ImageIcon className="w-12 h-12 mx-auto mb-4 opacity-50" />
              <p>No slides yet. Add your first slide to get started.</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
