import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { AdminLayout } from "@/components/AdminLayout";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
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
import { Plus, Trash2, Upload, Image, ArrowUp, ArrowDown } from "lucide-react";

interface HomepageImage {
  id: string;
  image_url: string;
  alt_text: string | null;
  is_active: boolean;
  display_order: number;
  created_at: string;
}

export default function HomepageImages() {
  const queryClient = useQueryClient();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [altText, setAltText] = useState("");

  const { data: images, isLoading } = useQuery({
    queryKey: ["admin-homepage-images"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("homepage_images")
        .select("*")
        .order("display_order", { ascending: true });

      if (error) throw error;
      return data as HomepageImage[];
    },
  });

  const uploadMutation = useMutation({
    mutationFn: async (file: File) => {
      const fileExt = file.name.split(".").pop();
      const fileName = `${Date.now()}.${fileExt}`;
      const filePath = `gallery/${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from("homepage-images")
        .upload(filePath, file);

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from("homepage-images")
        .getPublicUrl(filePath);

      const maxOrder = images?.reduce((max, img) => Math.max(max, img.display_order), -1) ?? -1;

      const { error: insertError } = await supabase
        .from("homepage_images")
        .insert({
          image_url: publicUrl,
          alt_text: altText || null,
          display_order: maxOrder + 1,
        });

      if (insertError) throw insertError;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-homepage-images"] });
      queryClient.invalidateQueries({ queryKey: ["homepage-images"] });
      toast.success("Image uploaded successfully");
      setIsDialogOpen(false);
      setAltText("");
    },
    onError: (error) => {
      console.error("Upload error:", error);
      toast.error("Failed to upload image");
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
      queryClient.invalidateQueries({ queryKey: ["admin-homepage-images"] });
      queryClient.invalidateQueries({ queryKey: ["homepage-images"] });
      toast.success("Image visibility updated");
    },
    onError: () => {
      toast.error("Failed to update image");
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
      queryClient.invalidateQueries({ queryKey: ["admin-homepage-images"] });
      queryClient.invalidateQueries({ queryKey: ["homepage-images"] });
      toast.success("Image deleted successfully");
    },
    onError: () => {
      toast.error("Failed to delete image");
    },
  });

  const reorderMutation = useMutation({
    mutationFn: async ({ id, direction }: { id: string; direction: "up" | "down" }) => {
      if (!images) return;

      const currentIndex = images.findIndex((img) => img.id === id);
      const swapIndex = direction === "up" ? currentIndex - 1 : currentIndex + 1;

      if (swapIndex < 0 || swapIndex >= images.length) return;

      const currentImage = images[currentIndex];
      const swapImage = images[swapIndex];

      await supabase
        .from("homepage_images")
        .update({ display_order: swapImage.display_order })
        .eq("id", currentImage.id);

      await supabase
        .from("homepage_images")
        .update({ display_order: currentImage.display_order })
        .eq("id", swapImage.id);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-homepage-images"] });
      queryClient.invalidateQueries({ queryKey: ["homepage-images"] });
    },
  });

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
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

    setUploading(true);
    await uploadMutation.mutateAsync(file);
    setUploading(false);
  };

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">Homepage Images</h1>
            <p className="text-muted-foreground">
              Manage gallery images displayed on the homepage
            </p>
          </div>
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="mr-2 h-4 w-4" />
                Add Image
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Upload New Image</DialogTitle>
              </DialogHeader>
              <div className="space-y-4 pt-4">
                <div className="space-y-2">
                  <Label>Alt Text (Optional)</Label>
                  <Input
                    placeholder="Describe the image"
                    value={altText}
                    onChange={(e) => setAltText(e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Image File</Label>
                  <div className="border-2 border-dashed rounded-lg p-8 text-center">
                    <input
                      type="file"
                      accept="image/jpeg,image/png,image/webp"
                      onChange={handleFileUpload}
                      className="hidden"
                      id="image-upload"
                      disabled={uploading}
                    />
                    <label
                      htmlFor="image-upload"
                      className="cursor-pointer flex flex-col items-center gap-2"
                    >
                      <Upload className="h-8 w-8 text-muted-foreground" />
                      <span className="text-sm text-muted-foreground">
                        {uploading ? "Uploading..." : "Click to upload (JPG, PNG, WEBP)"}
                      </span>
                    </label>
                  </div>
                </div>
              </div>
            </DialogContent>
          </Dialog>
        </div>

        {isLoading ? (
          <div className="text-center py-10">Loading...</div>
        ) : !images || images.length === 0 ? (
          <div className="text-center py-16 bg-muted/30 rounded-lg">
            <Image className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
            <h3 className="text-lg font-medium mb-2">No Images Yet</h3>
            <p className="text-muted-foreground mb-4">
              Upload images to display in the homepage gallery.
            </p>
          </div>
        ) : (
          <div className="border rounded-lg">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-20">Order</TableHead>
                  <TableHead className="w-32">Preview</TableHead>
                  <TableHead>Alt Text</TableHead>
                  <TableHead className="w-24">Active</TableHead>
                  <TableHead className="w-32">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {images.map((image, index) => (
                  <TableRow key={image.id}>
                    <TableCell>
                      <div className="flex gap-1">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => reorderMutation.mutate({ id: image.id, direction: "up" })}
                          disabled={index === 0}
                        >
                          <ArrowUp className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => reorderMutation.mutate({ id: image.id, direction: "down" })}
                          disabled={index === images.length - 1}
                        >
                          <ArrowDown className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                    <TableCell>
                      <img
                        src={image.image_url}
                        alt={image.alt_text || "Gallery image"}
                        className="w-24 h-16 object-cover rounded"
                      />
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {image.alt_text || "No alt text"}
                    </TableCell>
                    <TableCell>
                      <Switch
                        checked={image.is_active}
                        onCheckedChange={(checked) =>
                          toggleMutation.mutate({ id: image.id, is_active: checked })
                        }
                      />
                    </TableCell>
                    <TableCell>
                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <Button variant="ghost" size="icon" className="text-destructive">
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                          <AlertDialogHeader>
                            <AlertDialogTitle>Delete Image</AlertDialogTitle>
                            <AlertDialogDescription>
                              Are you sure you want to delete this image? This action cannot be undone.
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>Cancel</AlertDialogCancel>
                            <AlertDialogAction
                              onClick={() => deleteMutation.mutate(image.id)}
                              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                            >
                              Delete
                            </AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
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
