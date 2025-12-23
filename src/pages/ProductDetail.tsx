import { useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { PublicNavbar } from "@/components/PublicNavbar";
import { PublicFooter } from "@/components/PublicFooter";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Textarea } from "@/components/ui/textarea";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  ShoppingCart,
  Package,
  Plus,
  Minus,
  Star,
  ChevronLeft,
  ChevronRight,
  ArrowLeft,
  Check,
  Clock,
  User,
} from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
} from "@/components/ui/carousel";

const ProductDetail = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [quantity, setQuantity] = useState(1);
  const [rating, setRating] = useState(5);
  const [reviewText, setReviewText] = useState("");
  const [hoveredRating, setHoveredRating] = useState(0);

  const { data: product, isLoading } = useQuery({
    queryKey: ["product", id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("products")
        .select("*, categories(name)")
        .eq("id", id)
        .maybeSingle();

      if (error) throw error;
      return data;
    },
    enabled: !!id,
  });

  const { data: reviews } = useQuery({
    queryKey: ["product-reviews", id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("product_reviews")
        .select("*")
        .eq("product_id", id)
        .order("created_at", { ascending: false });

      if (error) throw error;
      return data;
    },
    enabled: !!id,
  });

  const addToCartMutation = useMutation({
    mutationFn: async () => {
      if (!user || !product) throw new Error("Not authenticated");

      const { data: existingItem } = await supabase
        .from("cart_items")
        .select("id, quantity")
        .eq("user_id", user.id)
        .eq("product_id", product.id)
        .maybeSingle();

      if (existingItem) {
        const { error } = await supabase
          .from("cart_items")
          .update({ quantity: existingItem.quantity + quantity })
          .eq("id", existingItem.id);
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from("cart_items")
          .insert({ user_id: user.id, product_id: product.id, quantity });
        if (error) throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["cart-count"] });
      queryClient.invalidateQueries({ queryKey: ["cart-items"] });
      toast.success(`Added ${quantity} item(s) to cart!`);
    },
    onError: () => toast.error("Failed to add to cart"),
  });

  const submitReviewMutation = useMutation({
    mutationFn: async () => {
      if (!user || !product) throw new Error("Not authenticated");

      const { error } = await supabase.from("product_reviews").insert({
        product_id: product.id,
        user_id: user.id,
        rating,
        review_text: reviewText.trim() || null,
      });

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["product-reviews", id] });
      setReviewText("");
      setRating(5);
      toast.success("Review submitted! It will appear after approval.");
    },
    onError: () => toast.error("Failed to submit review"),
  });

  const handleAddToCart = () => {
    if (!user) {
      toast.info("Please login to add items to cart", {
        action: { label: "Login", onClick: () => navigate("/login") },
      });
      return;
    }
    addToCartMutation.mutate();
  };

  const handleBuyNow = () => {
    if (!user) {
      toast.info("Please login to purchase", {
        action: { label: "Login", onClick: () => navigate("/login") },
      });
      return;
    }
    navigate(`/checkout/${product?.id}`);
  };

  const averageRating = reviews?.length
    ? reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length
    : 0;

  const approvedReviews = reviews?.filter((r) => r.is_approved) || [];

  if (isLoading) {
    return (
      <div className="min-h-screen flex flex-col">
        <PublicNavbar />
        <main className="flex-1 pt-24 pb-16">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
              <Skeleton className="aspect-square rounded-2xl" />
              <div className="space-y-6">
                <Skeleton className="h-12 w-3/4" />
                <Skeleton className="h-6 w-1/2" />
                <Skeleton className="h-24 w-full" />
                <Skeleton className="h-12 w-1/3" />
              </div>
            </div>
          </div>
        </main>
        <PublicFooter />
      </div>
    );
  }

  if (!product) {
    return (
      <div className="min-h-screen flex flex-col">
        <PublicNavbar />
        <main className="flex-1 pt-24 pb-16 flex items-center justify-center">
          <div className="text-center">
            <Package className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
            <h1 className="text-2xl font-bold mb-2">Product Not Found</h1>
            <Button onClick={() => navigate("/shop")} variant="outline">
              <ArrowLeft className="w-4 h-4 mr-2" /> Back to Shop
            </Button>
          </div>
        </main>
        <PublicFooter />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <PublicNavbar />

      <main className="flex-1 pt-24 pb-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Breadcrumb */}
          <button
            onClick={() => navigate("/shop")}
            className="flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors mb-8 group"
          >
            <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
            <span>Back to Shop</span>
          </button>

          {/* Product Section */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-16">
            {/* Image Gallery */}
            <div className="space-y-4">
              {product.images && product.images.length > 0 ? (
                <Carousel className="w-full">
                  <CarouselContent>
                    {product.images.map((image: string, index: number) => (
                      <CarouselItem key={index}>
                        <div className="aspect-square rounded-3xl overflow-hidden bg-muted">
                          <img
                            src={image}
                            alt={`${product.name} - Image ${index + 1}`}
                            className="w-full h-full object-cover"
                          />
                        </div>
                      </CarouselItem>
                    ))}
                  </CarouselContent>
                  {product.images.length > 1 && (
                    <>
                      <CarouselPrevious className="-left-4 lg:-left-6" />
                      <CarouselNext className="-right-4 lg:-right-6" />
                    </>
                  )}
                </Carousel>
              ) : (
                <div className="aspect-square rounded-3xl bg-muted flex items-center justify-center">
                  <Package className="w-32 h-32 text-muted-foreground/30" />
                </div>
              )}

              {/* Thumbnail Strip */}
              {product.images && product.images.length > 1 && (
                <div className="flex gap-3 overflow-x-auto pb-2">
                  {product.images.map((image: string, index: number) => (
                    <div
                      key={index}
                      className="w-20 h-20 rounded-xl overflow-hidden border-2 border-border hover:border-primary transition-colors cursor-pointer flex-shrink-0"
                    >
                      <img
                        src={image}
                        alt={`Thumbnail ${index + 1}`}
                        className="w-full h-full object-cover"
                      />
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Product Info */}
            <div className="space-y-6">
              {/* Category & Badges */}
              <div className="flex flex-wrap items-center gap-3">
                {(product.categories as any)?.name && (
                  <Badge variant="secondary" className="text-sm">
                    {(product.categories as any).name}
                  </Badge>
                )}
                {product.is_highlighted && (
                  <Badge className="bg-warning text-warning-foreground">
                    <Star className="w-3 h-3 mr-1 fill-current" /> Featured
                  </Badge>
                )}
                {product.stock_quantity <= 10 && product.stock_quantity > 0 && (
                  <Badge variant="destructive" className="animate-pulse">
                    Only {product.stock_quantity} left!
                  </Badge>
                )}
              </div>

              {/* Title */}
              <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-foreground leading-tight">
                {product.name}
              </h1>

              {/* Rating */}
              {approvedReviews.length > 0 && (
                <div className="flex items-center gap-3">
                  <div className="flex items-center gap-1">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <Star
                        key={star}
                        className={`w-5 h-5 ${
                          star <= Math.round(averageRating)
                            ? "text-warning fill-warning"
                            : "text-muted-foreground/30"
                        }`}
                      />
                    ))}
                  </div>
                  <span className="text-lg font-medium">{averageRating.toFixed(1)}</span>
                  <span className="text-muted-foreground">
                    ({approvedReviews.length} review{approvedReviews.length !== 1 ? "s" : ""})
                  </span>
                </div>
              )}

              {/* Price */}
              <div className="flex items-baseline gap-3">
                <span className="text-4xl sm:text-5xl font-bold text-primary">
                  ₹{product.price.toLocaleString()}
                </span>
              </div>

              {/* Description */}
              {product.description && (
                <p className="text-lg text-muted-foreground leading-relaxed">
                  {product.description}
                </p>
              )}

              {/* Stock Status */}
              <div className="flex items-center gap-2">
                {product.stock_quantity > 0 ? (
                  <>
                    <Check className="w-5 h-5 text-success" />
                    <span className="text-success font-medium">In Stock</span>
                    <span className="text-muted-foreground">
                      ({product.stock_quantity} available)
                    </span>
                  </>
                ) : (
                  <>
                    <Clock className="w-5 h-5 text-destructive" />
                    <span className="text-destructive font-medium">Out of Stock</span>
                  </>
                )}
              </div>

              {/* Quantity Selector */}
              {product.stock_quantity > 0 && (
                <div className="flex items-center gap-4">
                  <span className="text-sm font-medium text-muted-foreground">Quantity:</span>
                  <div className="flex items-center gap-3 bg-muted rounded-xl p-1">
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => setQuantity(Math.max(1, quantity - 1))}
                      disabled={quantity <= 1}
                      className="rounded-lg"
                    >
                      <Minus className="w-4 h-4" />
                    </Button>
                    <span className="w-12 text-center font-semibold text-lg">{quantity}</span>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => setQuantity(Math.min(product.stock_quantity, quantity + 1))}
                      disabled={quantity >= product.stock_quantity}
                      className="rounded-lg"
                    >
                      <Plus className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              )}

              {/* Action Buttons */}
              <div className="flex flex-col sm:flex-row gap-4 pt-4">
                <Button
                  onClick={handleAddToCart}
                  variant="outline"
                  size="lg"
                  disabled={product.stock_quantity === 0 || addToCartMutation.isPending}
                  className="flex-1 h-14 text-lg font-semibold border-2 border-primary text-primary hover:bg-primary hover:text-primary-foreground rounded-xl"
                >
                  <Plus className="w-5 h-5 mr-2" />
                  Add to Cart
                </Button>
                <Button
                  onClick={handleBuyNow}
                  size="lg"
                  disabled={product.stock_quantity === 0}
                  className="flex-1 h-14 text-lg font-semibold bg-primary hover:bg-primary/90 rounded-xl"
                >
                  <ShoppingCart className="w-5 h-5 mr-2" />
                  Buy Now
                </Button>
              </div>
            </div>
          </div>

          {/* Reviews Section */}
          <section className="mt-20">
            <div className="flex items-center gap-3 mb-8">
              <Star className="w-6 h-6 text-warning fill-warning" />
              <h2 className="text-2xl sm:text-3xl font-bold">Customer Reviews</h2>
              {approvedReviews.length > 0 && (
                <Badge variant="secondary">{approvedReviews.length}</Badge>
              )}
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              {/* Write Review */}
              <Card className="lg:col-span-1 h-fit">
                <CardContent className="p-6">
                  <h3 className="font-semibold text-lg mb-4">Write a Review</h3>
                  {user ? (
                    <div className="space-y-4">
                      <div>
                        <label className="text-sm text-muted-foreground mb-2 block">
                          Your Rating
                        </label>
                        <div className="flex gap-1">
                          {[1, 2, 3, 4, 5].map((star) => (
                            <button
                              key={star}
                              type="button"
                              onClick={() => setRating(star)}
                              onMouseEnter={() => setHoveredRating(star)}
                              onMouseLeave={() => setHoveredRating(0)}
                              className="transition-transform hover:scale-110"
                            >
                              <Star
                                className={`w-8 h-8 ${
                                  star <= (hoveredRating || rating)
                                    ? "text-warning fill-warning"
                                    : "text-muted-foreground/30"
                                }`}
                              />
                            </button>
                          ))}
                        </div>
                      </div>
                      <div>
                        <label className="text-sm text-muted-foreground mb-2 block">
                          Your Review (optional)
                        </label>
                        <Textarea
                          placeholder="Share your experience with this product..."
                          value={reviewText}
                          onChange={(e) => setReviewText(e.target.value)}
                          rows={4}
                        />
                      </div>
                      <Button
                        onClick={() => submitReviewMutation.mutate()}
                        disabled={submitReviewMutation.isPending}
                        className="w-full"
                      >
                        Submit Review
                      </Button>
                    </div>
                  ) : (
                    <div className="text-center py-4">
                      <p className="text-muted-foreground mb-4">
                        Please login to write a review
                      </p>
                      <Button onClick={() => navigate("/login")} variant="outline">
                        Login
                      </Button>
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Reviews List */}
              <div className="lg:col-span-2 space-y-4">
                {approvedReviews.length > 0 ? (
                  approvedReviews.map((review) => (
                    <Card key={review.id}>
                      <CardContent className="p-6">
                        <div className="flex items-start gap-4">
                          <Avatar className="w-10 h-10">
                            <AvatarFallback className="bg-primary/10 text-primary">
                              <User className="w-5 h-5" />
                            </AvatarFallback>
                          </Avatar>
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-2">
                              <div className="flex gap-0.5">
                                {[1, 2, 3, 4, 5].map((star) => (
                                  <Star
                                    key={star}
                                    className={`w-4 h-4 ${
                                      star <= review.rating
                                        ? "text-warning fill-warning"
                                        : "text-muted-foreground/30"
                                    }`}
                                  />
                                ))}
                              </div>
                              <span className="text-sm text-muted-foreground">
                                {new Date(review.created_at).toLocaleDateString()}
                              </span>
                            </div>
                            {review.review_text && (
                              <p className="text-foreground">{review.review_text}</p>
                            )}
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))
                ) : (
                  <Card>
                    <CardContent className="py-12 text-center">
                      <Star className="w-12 h-12 text-muted-foreground/30 mx-auto mb-4" />
                      <p className="text-muted-foreground">
                        No reviews yet. Be the first to review this product!
                      </p>
                    </CardContent>
                  </Card>
                )}
              </div>
            </div>
          </section>
        </div>
      </main>

      <PublicFooter />
    </div>
  );
};

export default ProductDetail;