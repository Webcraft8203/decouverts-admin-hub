import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { toast } from "sonner";
import { Plus, Pencil, Trash2, Star, Upload, X } from "lucide-react";

interface CustomerReview {
  id: string;
  customer_name: string;
  company_name: string;
  designation: string | null;
  photo_url: string | null;
  review_text: string;
  rating: number | null;
  image_title: string;
  image_description: string;
  status: string;
  display_order: number;
  created_at: string;
}

interface ReviewFormData {
  customer_name: string;
  company_name: string;
  designation: string;
  review_text: string;
  rating: string;
  image_title: string;
  image_description: string;
  status: string;
  display_order: string;
}

const CustomerReviews = () => {
  const queryClient = useQueryClient();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingReview, setEditingReview] = useState<CustomerReview | null>(null);
  const [uploading, setUploading] = useState(false);
  const [photoUrl, setPhotoUrl] = useState<string | null>(null);
  const [formData, setFormData] = useState<ReviewFormData>({
    customer_name: "",
    company_name: "",
    designation: "",
    review_text: "",
    rating: "",
    image_title: "",
    image_description: "",
    status: "draft",
    display_order: "0",
  });

  const { data: reviews, isLoading } = useQuery({
    queryKey: ["admin-customer-reviews"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("customer_reviews")
        .select("*")
        .order("display_order", { ascending: true });
      if (error) throw error;
      return data as CustomerReview[];
    },
  });

  const uploadPhoto = async (file: File) => {
    setUploading(true);
    try {
      const fileExt = file.name.split(".").pop();
      const fileName = `customer-${Date.now()}.${fileExt}`;
      const { error: uploadError } = await supabase.storage
        .from("customer-partner-images")
        .upload(fileName, file);

      if (uploadError) throw uploadError;

      const { data } = supabase.storage
        .from("customer-partner-images")
        .getPublicUrl(fileName);

      setPhotoUrl(data.publicUrl);
      toast.success("Photo uploaded successfully");
    } catch (error: any) {
      toast.error(error.message);
    } finally {
      setUploading(false);
    }
  };

  const createMutation = useMutation({
    mutationFn: async (data: ReviewFormData) => {
      const { error } = await supabase.from("customer_reviews").insert({
        customer_name: data.customer_name,
        company_name: data.company_name,
        designation: data.designation || null,
        photo_url: photoUrl,
        review_text: data.review_text,
        rating: data.rating ? parseInt(data.rating) : null,
        image_title: data.image_title,
        image_description: data.image_description,
        status: data.status,
        display_order: parseInt(data.display_order) || 0,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-customer-reviews"] });
      queryClient.invalidateQueries({ queryKey: ["published-customer-reviews"] });
      resetForm();
      setIsDialogOpen(false);
      toast.success("Review created successfully");
    },
    onError: (error: any) => toast.error(error.message),
  });

  const updateMutation = useMutation({
    mutationFn: async (data: ReviewFormData & { id: string }) => {
      const { error } = await supabase
        .from("customer_reviews")
        .update({
          customer_name: data.customer_name,
          company_name: data.company_name,
          designation: data.designation || null,
          photo_url: photoUrl,
          review_text: data.review_text,
          rating: data.rating ? parseInt(data.rating) : null,
          image_title: data.image_title,
          image_description: data.image_description,
          status: data.status,
          display_order: parseInt(data.display_order) || 0,
        })
        .eq("id", data.id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-customer-reviews"] });
      queryClient.invalidateQueries({ queryKey: ["published-customer-reviews"] });
      resetForm();
      setIsDialogOpen(false);
      toast.success("Review updated successfully");
    },
    onError: (error: any) => toast.error(error.message),
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("customer_reviews").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-customer-reviews"] });
      queryClient.invalidateQueries({ queryKey: ["published-customer-reviews"] });
      toast.success("Review deleted successfully");
    },
    onError: (error: any) => toast.error(error.message),
  });

  const resetForm = () => {
    setFormData({
      customer_name: "",
      company_name: "",
      designation: "",
      review_text: "",
      rating: "",
      image_title: "",
      image_description: "",
      status: "draft",
      display_order: "0",
    });
    setPhotoUrl(null);
    setEditingReview(null);
  };

  const handleEdit = (review: CustomerReview) => {
    setEditingReview(review);
    setFormData({
      customer_name: review.customer_name,
      company_name: review.company_name,
      designation: review.designation || "",
      review_text: review.review_text,
      rating: review.rating?.toString() || "",
      image_title: review.image_title,
      image_description: review.image_description,
      status: review.status,
      display_order: review.display_order.toString(),
    });
    setPhotoUrl(review.photo_url);
    setIsDialogOpen(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (editingReview) {
      updateMutation.mutate({ ...formData, id: editingReview.id });
    } else {
      createMutation.mutate(formData);
    }
  };

  const renderStars = (rating: number | null) => {
    if (!rating) return <span className="text-muted-foreground text-sm">No rating</span>;
    return (
      <div className="flex gap-0.5">
        {[1, 2, 3, 4, 5].map((star) => (
          <Star
            key={star}
            className={`h-3 w-3 ${star <= rating ? "text-amber-400 fill-amber-400" : "text-muted-foreground/30"}`}
          />
        ))}
      </div>
    );
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold">Customer Reviews</h1>
          <p className="text-muted-foreground">Manage customer testimonials displayed on the homepage</p>
        </div>
        <Dialog open={isDialogOpen} onOpenChange={(open) => { setIsDialogOpen(open); if (!open) resetForm(); }}>
          <DialogTrigger asChild>
            <Button><Plus className="h-4 w-4 mr-2" /> Add Review</Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>{editingReview ? "Edit Review" : "Add New Review"}</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Customer Name *</Label>
                  <Input
                    value={formData.customer_name}
                    onChange={(e) => setFormData({ ...formData, customer_name: e.target.value })}
                    required
                  />
                </div>
                <div>
                  <Label>Company Name *</Label>
                  <Input
                    value={formData.company_name}
                    onChange={(e) => setFormData({ ...formData, company_name: e.target.value })}
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Designation</Label>
                  <Input
                    value={formData.designation}
                    onChange={(e) => setFormData({ ...formData, designation: e.target.value })}
                    placeholder="e.g., CEO, Director"
                  />
                </div>
                <div>
                  <Label>Rating (1-5)</Label>
                  <Select value={formData.rating || "none"} onValueChange={(v) => setFormData({ ...formData, rating: v === "none" ? "" : v })}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select rating" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">No rating</SelectItem>
                      {[1, 2, 3, 4, 5].map((r) => (
                        <SelectItem key={r} value={r.toString()}>{r} Star{r > 1 && "s"}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div>
                <Label>Customer Photo</Label>
                <div className="flex items-center gap-4 mt-2">
                  {photoUrl ? (
                    <div className="relative">
                      <Avatar className="h-16 w-16">
                        <AvatarImage src={photoUrl} />
                        <AvatarFallback>?</AvatarFallback>
                      </Avatar>
                      <button
                        type="button"
                        onClick={() => setPhotoUrl(null)}
                        className="absolute -top-1 -right-1 bg-destructive text-destructive-foreground rounded-full p-0.5"
                      >
                        <X className="h-3 w-3" />
                      </button>
                    </div>
                  ) : (
                    <label className="cursor-pointer flex items-center gap-2 border rounded-lg px-4 py-2 hover:bg-muted transition-colors">
                      <Upload className="h-4 w-4" />
                      <span className="text-sm">{uploading ? "Uploading..." : "Upload Photo"}</span>
                      <input
                        type="file"
                        accept="image/*"
                        className="hidden"
                        onChange={(e) => e.target.files?.[0] && uploadPhoto(e.target.files[0])}
                        disabled={uploading}
                      />
                    </label>
                  )}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Image Title *</Label>
                  <Input
                    value={formData.image_title}
                    onChange={(e) => setFormData({ ...formData, image_title: e.target.value })}
                    placeholder="Alt text for accessibility"
                    required
                  />
                </div>
                <div>
                  <Label>Image Description *</Label>
                  <Input
                    value={formData.image_description}
                    onChange={(e) => setFormData({ ...formData, image_description: e.target.value })}
                    placeholder="Brief description for SEO"
                    required
                  />
                </div>
              </div>

              <div>
                <Label>Review Text *</Label>
                <Textarea
                  value={formData.review_text}
                  onChange={(e) => setFormData({ ...formData, review_text: e.target.value })}
                  rows={3}
                  placeholder="Customer testimonial..."
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Status</Label>
                  <Select value={formData.status} onValueChange={(v) => setFormData({ ...formData, status: v })}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="draft">Draft</SelectItem>
                      <SelectItem value="published">Published</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>Display Order</Label>
                  <Input
                    type="number"
                    value={formData.display_order}
                    onChange={(e) => setFormData({ ...formData, display_order: e.target.value })}
                  />
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-4">
                <Button type="button" variant="outline" onClick={() => { setIsDialogOpen(false); resetForm(); }}>
                  Cancel
                </Button>
                <Button type="submit" disabled={createMutation.isPending || updateMutation.isPending}>
                  {editingReview ? "Update" : "Create"}
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>All Reviews</CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="text-center py-8 text-muted-foreground">Loading...</div>
          ) : !reviews?.length ? (
            <div className="text-center py-8 text-muted-foreground">No reviews yet</div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Customer</TableHead>
                  <TableHead>Company</TableHead>
                  <TableHead>Rating</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Order</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {reviews.map((review) => (
                  <TableRow key={review.id}>
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <Avatar className="h-8 w-8">
                          <AvatarImage src={review.photo_url || undefined} />
                          <AvatarFallback className="text-xs">
                            {review.customer_name.split(" ").map((n) => n[0]).join("").slice(0, 2)}
                          </AvatarFallback>
                        </Avatar>
                        <div>
                          <div className="font-medium">{review.customer_name}</div>
                          {review.designation && (
                            <div className="text-xs text-muted-foreground">{review.designation}</div>
                          )}
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>{review.company_name}</TableCell>
                    <TableCell>{renderStars(review.rating)}</TableCell>
                    <TableCell>
                      <Badge variant={review.status === "published" ? "default" : "secondary"}>
                        {review.status}
                      </Badge>
                    </TableCell>
                    <TableCell>{review.display_order}</TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-2">
                        <Button variant="ghost" size="icon" onClick={() => handleEdit(review)}>
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => deleteMutation.mutate(review.id)}
                          disabled={deleteMutation.isPending}
                        >
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

export default CustomerReviews;
