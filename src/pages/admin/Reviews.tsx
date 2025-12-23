import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Star, Check, X, Clock, Trash2, User } from "lucide-react";
import { toast } from "sonner";
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
import { Avatar, AvatarFallback } from "@/components/ui/avatar";

const AdminReviews = () => {
  const queryClient = useQueryClient();

  const { data: reviews, isLoading } = useQuery({
    queryKey: ["admin-reviews"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("product_reviews")
        .select("*, products(name, images)")
        .order("created_at", { ascending: false });

      if (error) throw error;
      return data;
    },
  });

  const updateReviewMutation = useMutation({
    mutationFn: async ({ id, is_approved }: { id: string; is_approved: boolean }) => {
      const { error } = await supabase
        .from("product_reviews")
        .update({ is_approved })
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-reviews"] });
      toast.success("Review updated");
    },
    onError: () => toast.error("Failed to update review"),
  });

  const deleteReviewMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("product_reviews").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-reviews"] });
      toast.success("Review deleted");
    },
    onError: () => toast.error("Failed to delete review"),
  });

  const pendingReviews = reviews?.filter((r) => !r.is_approved) || [];
  const approvedReviews = reviews?.filter((r) => r.is_approved) || [];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Reviews Moderation</h1>
        <p className="text-muted-foreground">Manage customer product reviews</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-warning/10 rounded-xl">
                <Clock className="w-6 h-6 text-warning" />
              </div>
              <div>
                <p className="text-2xl font-bold">{pendingReviews.length}</p>
                <p className="text-sm text-muted-foreground">Pending</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-success/10 rounded-xl">
                <Check className="w-6 h-6 text-success" />
              </div>
              <div>
                <p className="text-2xl font-bold">{approvedReviews.length}</p>
                <p className="text-sm text-muted-foreground">Approved</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-primary/10 rounded-xl">
                <Star className="w-6 h-6 text-primary" />
              </div>
              <div>
                <p className="text-2xl font-bold">{reviews?.length || 0}</p>
                <p className="text-sm text-muted-foreground">Total</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Pending Reviews */}
      {pendingReviews.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Clock className="w-5 h-5 text-warning" />
              Pending Approval
              <Badge variant="secondary">{pendingReviews.length}</Badge>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {pendingReviews.map((review) => (
              <div
                key={review.id}
                className="flex flex-col sm:flex-row gap-4 p-4 bg-muted/50 rounded-xl border border-warning/30"
              >
                <div className="flex items-start gap-3 flex-1">
                  {(review.products as any)?.images?.[0] ? (
                    <img
                      src={(review.products as any).images[0]}
                      alt={(review.products as any).name}
                      className="w-16 h-16 object-cover rounded-lg"
                    />
                  ) : (
                    <div className="w-16 h-16 bg-muted rounded-lg flex items-center justify-center">
                      <Star className="w-6 h-6 text-muted-foreground" />
                    </div>
                  )}
                  <div className="flex-1">
                    <p className="font-medium">{(review.products as any)?.name}</p>
                    <div className="flex gap-0.5 my-1">
                      {[1, 2, 3, 4, 5].map((star) => (
                        <Star
                          key={star}
                          className={`w-4 h-4 ${
                            star <= review.rating ? "text-warning fill-warning" : "text-muted-foreground/30"
                          }`}
                        />
                      ))}
                    </div>
                    {review.review_text && (
                      <p className="text-sm text-muted-foreground">{review.review_text}</p>
                    )}
                    <p className="text-xs text-muted-foreground mt-2">
                      {new Date(review.created_at).toLocaleString()}
                    </p>
                  </div>
                </div>
                <div className="flex sm:flex-col gap-2">
                  <Button
                    size="sm"
                    onClick={() => updateReviewMutation.mutate({ id: review.id, is_approved: true })}
                    className="bg-success hover:bg-success/90"
                  >
                    <Check className="w-4 h-4 mr-1" /> Approve
                  </Button>
                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <Button size="sm" variant="destructive">
                        <Trash2 className="w-4 h-4 mr-1" /> Delete
                      </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                      <AlertDialogHeader>
                        <AlertDialogTitle>Delete Review?</AlertDialogTitle>
                        <AlertDialogDescription>
                          This will permanently delete this review.
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction
                          onClick={() => deleteReviewMutation.mutate(review.id)}
                          className="bg-destructive text-destructive-foreground"
                        >
                          Delete
                        </AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      {/* All Reviews */}
      <Card>
        <CardHeader>
          <CardTitle>All Reviews</CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="space-y-4">
              {[...Array(3)].map((_, i) => (
                <Skeleton key={i} className="h-24" />
              ))}
            </div>
          ) : reviews && reviews.length > 0 ? (
            <div className="space-y-4">
              {reviews.map((review) => (
                <div
                  key={review.id}
                  className={`flex flex-col sm:flex-row gap-4 p-4 rounded-xl border ${
                    review.is_approved ? "bg-muted/30" : "bg-warning/5 border-warning/20"
                  }`}
                >
                  <div className="flex items-start gap-3 flex-1">
                    {(review.products as any)?.images?.[0] ? (
                      <img
                        src={(review.products as any).images[0]}
                        alt={(review.products as any).name}
                        className="w-12 h-12 object-cover rounded-lg"
                      />
                    ) : (
                      <div className="w-12 h-12 bg-muted rounded-lg flex items-center justify-center">
                        <Star className="w-5 h-5 text-muted-foreground" />
                      </div>
                    )}
                    <div className="flex-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <p className="font-medium">{(review.products as any)?.name}</p>
                        <Badge variant={review.is_approved ? "default" : "secondary"}>
                          {review.is_approved ? "Approved" : "Pending"}
                        </Badge>
                      </div>
                      <div className="flex gap-0.5 my-1">
                        {[1, 2, 3, 4, 5].map((star) => (
                          <Star
                            key={star}
                            className={`w-4 h-4 ${
                              star <= review.rating ? "text-warning fill-warning" : "text-muted-foreground/30"
                            }`}
                          />
                        ))}
                      </div>
                      {review.review_text && (
                        <p className="text-sm text-muted-foreground">{review.review_text}</p>
                      )}
                      <p className="text-xs text-muted-foreground mt-1">
                        {new Date(review.created_at).toLocaleString()}
                      </p>
                    </div>
                  </div>
                  <div className="flex sm:flex-col gap-2">
                    {review.is_approved ? (
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => updateReviewMutation.mutate({ id: review.id, is_approved: false })}
                      >
                        <X className="w-4 h-4 mr-1" /> Unapprove
                      </Button>
                    ) : (
                      <Button
                        size="sm"
                        onClick={() => updateReviewMutation.mutate({ id: review.id, is_approved: true })}
                        className="bg-success hover:bg-success/90"
                      >
                        <Check className="w-4 h-4 mr-1" /> Approve
                      </Button>
                    )}
                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <Button size="sm" variant="destructive">
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle>Delete Review?</AlertDialogTitle>
                          <AlertDialogDescription>
                            This will permanently delete this review.
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>Cancel</AlertDialogCancel>
                          <AlertDialogAction
                            onClick={() => deleteReviewMutation.mutate(review.id)}
                            className="bg-destructive text-destructive-foreground"
                          >
                            Delete
                          </AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-12">
              <Star className="w-12 h-12 text-muted-foreground/30 mx-auto mb-4" />
              <p className="text-muted-foreground">No reviews yet</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default AdminReviews;