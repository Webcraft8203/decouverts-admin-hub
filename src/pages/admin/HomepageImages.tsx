import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { AdminLayout } from "@/components/AdminLayout";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Badge } from "@/components/ui/badge";
import {
  Plus,
  Trash2,
  Upload,
  Image,
  ArrowUp,
  ArrowDown,
  Pencil,
  Video,
  Star,
  X,
} from "lucide-react";

interface GalleryItem {
  id: string;
  image_url: string;
  alt_text: string | null;
  title: string;
  description: string | null;
  video_url: string | null;
  category: string | null;
  project_id: string | null;
  is_featured: boolean;
  is_active: boolean;
  display_order: number;
  created_at: string;
}

const CATEGORIES = [
  { value: "manufacturing", label: "Manufacturing" },
  { value: "3d-printing", label: "3D Printing" },
  { value: "drone", label: "Drone" },
  { value: "rd", label: "R&D" },
  { value: "prototyping", label: "Prototyping" },
];

const isValidYouTubeUrl = (url: string): boolean => {
  if (!url) return true;
  const youtubeRegex = /^(https?:\/\/)?(www\.)?(youtube\.com\/(watch\?v=|embed\/|shorts\/)|youtu\.be\/)[a-zA-Z0-9_-]{11}/;
  return youtubeRegex.test(url);
};

const getYouTubeVideoId = (url: string): string | null => {
  if (!url) return null;
  const regex = /(?:youtube\.com\/(?:watch\?v=|embed\/|shorts\/)|youtu\.be\/)([a-zA-Z0-9_-]{11})/;
  const match = url.match(regex);
  return match ? match[1] : null;
};

export default function HomepageImages() {
  const queryClient = useQueryClient();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    alt_text: "",
    video_url: "",
    category: "",
    project_id: "",
    is_featured: false,
  });
  const [videoUrlError, setVideoUrlError] = useState("");
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);

  const { data: items, isLoading } = useQuery({
    queryKey: ["admin-gallery-items"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("homepage_images")
        .select("*")
        .order("display_order", { ascending: true });

      if (error) throw error;
      return data as GalleryItem[];
    },
  });

  const resetForm = () => {
    setFormData({
      title: "",
      description: "",
      alt_text: "",
      video_url: "",
      category: "",
      project_id: "",
      is_featured: false,
    });
    setVideoUrlError("");
    setSelectedFile(null);
    setPreviewUrl(null);
    setIsEditMode(false);
    setEditingId(null);
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      toast.error("Please select an image file");
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      toast.error("File size must be less than 5MB");
      return;
    }

    setSelectedFile(file);
    setPreviewUrl(URL.createObjectURL(file));
  };

  const handleVideoUrlChange = (url: string) => {
    setFormData({ ...formData, video_url: url });
    if (url && !isValidYouTubeUrl(url)) {
      setVideoUrlError("Please enter a valid YouTube URL");
    } else {
      setVideoUrlError("");
    }
  };

  const uploadMutation = useMutation({
    mutationFn: async () => {
      if (!selectedFile && !isEditMode) {
        throw new Error("Please select an image");
      }

      if (!formData.title.trim()) {
        throw new Error("Title is required");
      }

      if (formData.video_url && !isValidYouTubeUrl(formData.video_url)) {
        throw new Error("Invalid YouTube URL");
      }

      let imageUrl = previewUrl;

      if (selectedFile) {
        const fileExt = selectedFile.name.split(".").pop();
        const fileName = `${Date.now()}.${fileExt}`;
        const filePath = `gallery/${fileName}`;

        const { error: uploadError } = await supabase.storage
          .from("homepage-images")
          .upload(filePath, selectedFile);

        if (uploadError) throw uploadError;

        const { data: { publicUrl } } = supabase.storage
          .from("homepage-images")
          .getPublicUrl(filePath);

        imageUrl = publicUrl;
      }

      if (isEditMode && editingId) {
        const updateData: Record<string, unknown> = {
          title: formData.title,
          description: formData.description || null,
          alt_text: formData.alt_text || null,
          video_url: formData.video_url || null,
          category: formData.category || null,
          project_id: formData.project_id || null,
          is_featured: formData.is_featured,
        };

        if (selectedFile && imageUrl) {
          updateData.image_url = imageUrl;
        }

        const { error: updateError } = await supabase
          .from("homepage_images")
          .update(updateData)
          .eq("id", editingId);

        if (updateError) throw updateError;
      } else {
        const maxOrder = items?.reduce((max, img) => Math.max(max, img.display_order), -1) ?? -1;

        const { error: insertError } = await supabase
          .from("homepage_images")
          .insert({
            image_url: imageUrl,
            title: formData.title,
            description: formData.description || null,
            alt_text: formData.alt_text || null,
            video_url: formData.video_url || null,
            category: formData.category || null,
            project_id: formData.project_id || null,
            is_featured: formData.is_featured,
            display_order: maxOrder + 1,
          });

        if (insertError) throw insertError;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-gallery-items"] });
      queryClient.invalidateQueries({ queryKey: ["homepage-images"] });
      toast.success(isEditMode ? "Gallery item updated successfully" : "Gallery item added successfully");
      setIsDialogOpen(false);
      resetForm();
    },
    onError: (error) => {
      console.error("Save error:", error);
      toast.error(error instanceof Error ? error.message : "Failed to save gallery item");
    },
  });

  const toggleMutation = useMutation({
    mutationFn: async ({ id, is_active }: { id: string; is_active: boolean }) => {
      const { error } = await supabase
        .from("homepage_images")
        .update({ is_active })
        .eq("id", id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-gallery-items"] });
      queryClient.invalidateQueries({ queryKey: ["homepage-images"] });
      toast.success("Item visibility updated");
    },
    onError: () => {
      toast.error("Failed to update item");
    },
  });

  const toggleFeaturedMutation = useMutation({
    mutationFn: async ({ id, is_featured }: { id: string; is_featured: boolean }) => {
      const { error } = await supabase
        .from("homepage_images")
        .update({ is_featured })
        .eq("id", id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-gallery-items"] });
      queryClient.invalidateQueries({ queryKey: ["homepage-images"] });
      toast.success("Featured status updated");
    },
    onError: () => {
      toast.error("Failed to update featured status");
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from("homepage_images")
        .delete()
        .eq("id", id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-gallery-items"] });
      queryClient.invalidateQueries({ queryKey: ["homepage-images"] });
      toast.success("Item deleted successfully");
    },
    onError: () => {
      toast.error("Failed to delete item");
    },
  });

  const reorderMutation = useMutation({
    mutationFn: async ({ id, direction }: { id: string; direction: "up" | "down" }) => {
      if (!items) return;

      const currentIndex = items.findIndex((img) => img.id === id);
      const swapIndex = direction === "up" ? currentIndex - 1 : currentIndex + 1;

      if (swapIndex < 0 || swapIndex >= items.length) return;

      const currentItem = items[currentIndex];
      const swapItem = items[swapIndex];

      await supabase
        .from("homepage_images")
        .update({ display_order: swapItem.display_order })
        .eq("id", currentItem.id);

      await supabase
        .from("homepage_images")
        .update({ display_order: currentItem.display_order })
        .eq("id", swapItem.id);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-gallery-items"] });
      queryClient.invalidateQueries({ queryKey: ["homepage-images"] });
    },
  });

  const openEdit = (item: GalleryItem) => {
    setFormData({
      title: item.title,
      description: item.description || "",
      alt_text: item.alt_text || "",
      video_url: item.video_url || "",
      category: item.category || "",
      project_id: item.project_id || "",
      is_featured: item.is_featured,
    });
    setPreviewUrl(item.image_url);
    setIsEditMode(true);
    setEditingId(item.id);
    setIsDialogOpen(true);
  };

  const handleSubmit = async () => {
    setUploading(true);
    await uploadMutation.mutateAsync();
    setUploading(false);
  };

  const getCategoryLabel = (value: string | null) => {
    if (!value) return null;
    return CATEGORIES.find((c) => c.value === value)?.label || value;
  };

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">Gallery Manager</h1>
            <p className="text-muted-foreground">
              Manage your engineering portfolio gallery items
            </p>
          </div>
          <Dialog
            open={isDialogOpen}
            onOpenChange={(open) => {
              setIsDialogOpen(open);
              if (!open) resetForm();
            }}
          >
            <DialogTrigger asChild>
              <Button>
                <Plus className="mr-2 h-4 w-4" />
                Add Gallery Item
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>
                  {isEditMode ? "Edit Gallery Item" : "Add New Gallery Item"}
                </DialogTitle>
              </DialogHeader>
              <div className="space-y-6 pt-4">
                {/* Image Upload */}
                <div className="space-y-2">
                  <Label className="text-base font-semibold">
                    Gallery Image <span className="text-destructive">*</span>
                  </Label>
                  {previewUrl ? (
                    <div className="relative">
                      <img
                        src={previewUrl}
                        alt="Preview"
                        className="w-full h-48 object-cover rounded-lg border"
                      />
                      <Button
                        variant="destructive"
                        size="icon"
                        className="absolute top-2 right-2"
                        onClick={() => {
                          setSelectedFile(null);
                          setPreviewUrl(null);
                        }}
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                  ) : (
                    <div className="border-2 border-dashed rounded-lg p-8 text-center">
                      <input
                        type="file"
                        accept="image/jpeg,image/png,image/webp"
                        onChange={handleFileSelect}
                        className="hidden"
                        id="image-upload"
                      />
                      <label
                        htmlFor="image-upload"
                        className="cursor-pointer flex flex-col items-center gap-2"
                      >
                        <Upload className="h-8 w-8 text-muted-foreground" />
                        <span className="text-sm text-muted-foreground">
                          Click to upload (JPG, PNG, WEBP - max 5MB)
                        </span>
                      </label>
                    </div>
                  )}
                </div>

                {/* Title */}
                <div className="space-y-2">
                  <Label className="text-base font-semibold">
                    Project Title <span className="text-destructive">*</span>
                  </Label>
                  <Input
                    placeholder="e.g., Industrial Drone Prototype v2"
                    value={formData.title}
                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  />
                </div>

                {/* Description */}
                <div className="space-y-2">
                  <Label className="text-base font-semibold">Short Description</Label>
                  <Textarea
                    placeholder="Brief description of the project (1-3 lines)"
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    rows={3}
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  {/* Category */}
                  <div className="space-y-2">
                    <Label className="text-base font-semibold">Category</Label>
                    <Select
                      value={formData.category}
                      onValueChange={(value) => setFormData({ ...formData, category: value })}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select category" />
                      </SelectTrigger>
                      <SelectContent>
                        {CATEGORIES.map((cat) => (
                          <SelectItem key={cat.value} value={cat.value}>
                            {cat.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Project ID */}
                  <div className="space-y-2">
                    <Label className="text-base font-semibold">Project ID / Reference</Label>
                    <Input
                      placeholder="e.g., PRJ-2024-001"
                      value={formData.project_id}
                      onChange={(e) => setFormData({ ...formData, project_id: e.target.value })}
                    />
                  </div>
                </div>

                {/* Video URL */}
                <div className="space-y-2">
                  <Label className="text-base font-semibold">YouTube Video Link (Optional)</Label>
                  <Input
                    placeholder="https://www.youtube.com/watch?v=..."
                    value={formData.video_url}
                    onChange={(e) => handleVideoUrlChange(e.target.value)}
                    className={videoUrlError ? "border-destructive" : ""}
                  />
                  {videoUrlError && (
                    <p className="text-sm text-destructive">{videoUrlError}</p>
                  )}
                  {formData.video_url && !videoUrlError && getYouTubeVideoId(formData.video_url) && (
                    <div className="relative aspect-video w-full max-w-sm rounded-lg overflow-hidden bg-muted">
                      <img
                        src={`https://img.youtube.com/vi/${getYouTubeVideoId(formData.video_url)}/mqdefault.jpg`}
                        alt="Video thumbnail"
                        className="w-full h-full object-cover"
                      />
                      <div className="absolute inset-0 flex items-center justify-center">
                        <div className="w-12 h-12 rounded-full bg-red-600 flex items-center justify-center">
                          <Video className="w-6 h-6 text-white ml-1" />
                        </div>
                      </div>
                    </div>
                  )}
                </div>

                {/* Alt Text */}
                <div className="space-y-2">
                  <Label className="text-base font-semibold">Alt Text (SEO)</Label>
                  <Input
                    placeholder="Descriptive text for accessibility"
                    value={formData.alt_text}
                    onChange={(e) => setFormData({ ...formData, alt_text: e.target.value })}
                  />
                </div>

                {/* Featured Toggle */}
                <div className="flex items-center justify-between p-4 bg-muted/50 rounded-lg">
                  <div>
                    <Label className="text-base font-semibold">Featured Item</Label>
                    <p className="text-sm text-muted-foreground">
                      Featured items appear larger and first in the gallery
                    </p>
                  </div>
                  <Switch
                    checked={formData.is_featured}
                    onCheckedChange={(checked) => setFormData({ ...formData, is_featured: checked })}
                  />
                </div>

                {/* Submit Button */}
                <Button
                  className="w-full"
                  onClick={handleSubmit}
                  disabled={uploading || (!selectedFile && !isEditMode) || !formData.title.trim()}
                >
                  {uploading ? "Saving..." : isEditMode ? "Update Gallery Item" : "Add Gallery Item"}
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>

        {isLoading ? (
          <div className="text-center py-10">Loading...</div>
        ) : !items || items.length === 0 ? (
          <div className="text-center py-16 bg-muted/30 rounded-lg">
            <Image className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
            <h3 className="text-lg font-medium mb-2">No Gallery Items Yet</h3>
            <p className="text-muted-foreground mb-4">
              Add projects to showcase your engineering portfolio.
            </p>
          </div>
        ) : (
          <div className="border rounded-lg overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-20">Order</TableHead>
                  <TableHead className="w-32">Preview</TableHead>
                  <TableHead>Project Details</TableHead>
                  <TableHead className="w-28">Category</TableHead>
                  <TableHead className="w-24">Featured</TableHead>
                  <TableHead className="w-24">Active</TableHead>
                  <TableHead className="w-28">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {items.map((item, index) => (
                  <TableRow key={item.id}>
                    <TableCell>
                      <div className="flex gap-1">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => reorderMutation.mutate({ id: item.id, direction: "up" })}
                          disabled={index === 0}
                        >
                          <ArrowUp className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => reorderMutation.mutate({ id: item.id, direction: "down" })}
                          disabled={index === items.length - 1}
                        >
                          <ArrowDown className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="relative">
                        <img
                          src={item.image_url}
                          alt={item.alt_text || item.title}
                          className="w-24 h-16 object-cover rounded"
                        />
                        {item.video_url && (
                          <div className="absolute inset-0 flex items-center justify-center">
                            <div className="w-6 h-6 rounded-full bg-red-600/90 flex items-center justify-center">
                              <Video className="w-3 h-3 text-white" />
                            </div>
                          </div>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div>
                        <p className="font-medium line-clamp-1">{item.title}</p>
                        <p className="text-sm text-muted-foreground line-clamp-1">
                          {item.description || "No description"}
                        </p>
                        {item.project_id && (
                          <p className="text-xs text-muted-foreground font-mono mt-1">
                            {item.project_id}
                          </p>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      {item.category ? (
                        <Badge variant="secondary">{getCategoryLabel(item.category)}</Badge>
                      ) : (
                        <span className="text-muted-foreground text-sm">—</span>
                      )}
                    </TableCell>
                    <TableCell>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() =>
                          toggleFeaturedMutation.mutate({ id: item.id, is_featured: !item.is_featured })
                        }
                        className={item.is_featured ? "text-yellow-500" : "text-muted-foreground"}
                      >
                        <Star className={`h-5 w-5 ${item.is_featured ? "fill-current" : ""}`} />
                      </Button>
                    </TableCell>
                    <TableCell>
                      <Switch
                        checked={item.is_active}
                        onCheckedChange={(checked) =>
                          toggleMutation.mutate({ id: item.id, is_active: checked })
                        }
                      />
                    </TableCell>
                    <TableCell>
                      <div className="flex gap-1">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => openEdit(item)}
                        >
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <AlertDialog>
                          <AlertDialogTrigger asChild>
                            <Button variant="ghost" size="icon" className="text-destructive">
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </AlertDialogTrigger>
                          <AlertDialogContent>
                            <AlertDialogHeader>
                              <AlertDialogTitle>Delete Gallery Item</AlertDialogTitle>
                              <AlertDialogDescription>
                                Are you sure you want to delete "{item.title}"? This action cannot be undone.
                              </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel>Cancel</AlertDialogCancel>
                              <AlertDialogAction
                                onClick={() => deleteMutation.mutate(item.id)}
                                className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                              >
                                Delete
                              </AlertDialogAction>
                            </AlertDialogFooter>
                          </AlertDialogContent>
                        </AlertDialog>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </div>
    </AdminLayout>
  );
}
