import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useProductSEO } from "@/hooks/useProductSEO";
import { supabase } from "@/integrations/supabase/client";
import { PublicNavbar } from "@/components/PublicNavbar";
import { PublicFooter } from "@/components/PublicFooter";
import { ProductMediaGallery } from "@/components/ProductMediaGallery";
import { ProductSpecifications } from "@/components/product/ProductSpecifications";
import { RelatedProducts } from "@/components/product/RelatedProducts";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Textarea } from "@/components/ui/textarea";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { WishlistButton } from "@/components/WishlistButton";
import { ShareMenu } from "@/components/ShareMenu";
import {
  ShoppingCart,
  Package,
  Plus,
  Minus,
  Star,
  ArrowLeft,
  Check,
  Clock,
  User,
  ChevronDown,
  ChevronUp,
  Shield,
  Truck,
  MessageSquare,
  Zap,
  Award
} from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { motion, AnimatePresence } from "framer-motion";

const ProductDetail = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [quantity, setQuantity] = useState(1);
  const [rating, setRating] = useState(5);
  const [reviewText, setReviewText] = useState("");
  const [hoveredRating, setHoveredRating] = useState(0);
  const [isReviewsOpen, setIsReviewsOpen] = useState(true);
  const [isDescriptionExpanded, setIsDescriptionExpanded] = useState(false);

  const isUUID = id ? /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id) : false;

  const { data: product, isLoading } = useQuery({
    queryKey: ["product", id],
    queryFn: async () => {
      let query = supabase
        .from("products")
        .select("*, categories(name)");
      
      if (isUUID) {
        query = query.eq("id", id!);
      } else {
        query = query.eq("slug", id!);
      }
      
      const { data, error } = await query.maybeSingle();
      if (error) throw error;
      return data;
    },
    enabled: !!id,
  });

  useEffect(() => {
    if (product && isUUID && product.slug) {
      navigate(`/product/${product.slug}`, { replace: true });
    }
  }, [product, isUUID, navigate]);

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

  const approvedReviewsForSEO = reviews?.filter((r: any) => r.is_approved) || [];
  const avgRating = approvedReviewsForSEO.length
    ? approvedReviewsForSEO.reduce((sum: number, r: any) => sum + r.rating, 0) / approvedReviewsForSEO.length
    : 0;

  useProductSEO(product, approvedReviewsForSEO.length > 0 ? {
    ratingValue: avgRating,
    reviewCount: approvedReviewsForSEO.length,
  } : undefined);

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

  const productUrl = `${window.location.origin}/product/${product?.slug || id}`;

  const averageRating = reviews?.length
    ? reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length
    : 0;

  const approvedReviews = reviews?.filter((r) => r.is_approved) || [];

  if (isLoading) {
    return (
      <div className="min-h-screen flex flex-col bg-background">
        <PublicNavbar />
        <main className="flex-1 pt-24 pb-16">
          <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 lg:gap-16">
              <Skeleton className="aspect-square rounded-2xl" />
              <div className="space-y-5 pt-4">
                <Skeleton className="h-3 w-20" />
                <Skeleton className="h-10 w-3/4" />
                <Skeleton className="h-8 w-1/3" />
                <Skeleton className="h-20 w-full" />
                <Skeleton className="h-12 w-full rounded-xl" />
                <Skeleton className="h-12 w-full rounded-xl" />
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
      <div className="min-h-screen flex flex-col bg-background">
        <PublicNavbar />
        <main className="flex-1 pt-24 pb-16 flex items-center justify-center">
          <div className="text-center">
            <div className="w-20 h-20 bg-secondary/30 rounded-2xl flex items-center justify-center mx-auto mb-5">
              <Package className="w-10 h-10 text-muted-foreground/20" />
            </div>
            <h1 className="text-xl font-bold text-foreground mb-2">Product Not Found</h1>
            <p className="text-muted-foreground text-sm mb-6">This product doesn't exist or has been removed.</p>
            <Button onClick={() => navigate("/shop")} variant="outline" size="sm" className="rounded-xl">
              <ArrowLeft className="w-4 h-4 mr-2" /> Back to Shop
            </Button>
          </div>
        </main>
        <PublicFooter />
      </div>
    );
  }

  const isLongDescription = (product.description?.length || 0) > 300;

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <PublicNavbar />

      <motion.main 
        className="flex-1 pt-20 pb-24 lg:pb-16"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.3 }}
      >
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Breadcrumb */}
          <nav className="flex items-center gap-1.5 text-[13px] text-muted-foreground mb-6 pt-4">
            <button onClick={() => navigate("/")} className="hover:text-foreground transition-colors">Home</button>
            <span className="text-muted-foreground/30">/</span>
            <button onClick={() => navigate("/shop")} className="hover:text-foreground transition-colors">Shop</button>
            {(product.categories as any)?.name && (
              <>
                <span className="text-muted-foreground/30">/</span>
                <span>{(product.categories as any).name}</span>
              </>
            )}
            <span className="text-muted-foreground/30">/</span>
            <span className="text-foreground font-medium truncate max-w-[180px]">{product.name}</span>
          </nav>

          {/* Product Hero */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-14 items-start mb-16">
              
            {/* Gallery */}
            <motion.div 
              className="lg:sticky lg:top-24 z-10"
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4 }}
            >
              <ProductMediaGallery 
                images={product.images}
                videoUrl={product.video_url}
                productName={product.name}
              />
            </motion.div>

            {/* Product Info */}
            <motion.div 
              className="flex flex-col"
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, delay: 0.1 }}
            >
              {/* Brand & Category */}
              <div className="flex items-center gap-2.5 mb-3">
                <span className="text-primary font-bold text-[11px] uppercase tracking-[0.2em]">DECOUVERTES</span>
                {(product.categories as any)?.name && (
                  <>
                    <span className="w-1 h-1 rounded-full bg-border" />
                    <span className="text-[11px] text-muted-foreground font-medium uppercase tracking-wide">
                      {(product.categories as any).name}
                    </span>
                  </>
                )}
              </div>

              {/* Title */}
              <h1 className="text-2xl sm:text-3xl font-bold text-foreground leading-tight tracking-tight mb-3">
                {product.name}
              </h1>

              {/* Rating */}
              {approvedReviews.length > 0 && (
                <div className="flex items-center gap-2 mb-5">
                  <div className="flex gap-0.5">
                    {[1,2,3,4,5].map(s => (
                      <Star key={s} className={`w-3.5 h-3.5 ${s <= Math.round(averageRating) ? "text-amber-400 fill-amber-400" : "text-muted-foreground/15"}`} />
                    ))}
                  </div>
                  <span className="text-sm font-semibold text-foreground">{averageRating.toFixed(1)}</span>
                  <span className="text-sm text-muted-foreground">({approvedReviews.length} review{approvedReviews.length > 1 ? 's' : ''})</span>
                </div>
              )}

              {/* Price & Stock */}
              <div className="flex items-center flex-wrap gap-3 mb-5">
                <span className="text-3xl font-bold text-foreground tracking-tight">
                  ₹{product.price.toLocaleString()}
                </span>
                {product.stock_quantity > 0 ? (
                  <div className="flex items-center gap-1.5 text-emerald-600 text-xs font-semibold bg-emerald-50 px-2.5 py-1 rounded-full">
                    <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                    In Stock
                  </div>
                ) : (
                  <div className="flex items-center gap-1.5 text-destructive text-xs font-semibold bg-destructive/5 px-2.5 py-1 rounded-full">
                    <Clock className="w-3 h-3" />
                    Out of Stock
                  </div>
                )}
              </div>

              {/* SKU / HSN */}
              <div className="flex items-center gap-2 mb-5 flex-wrap">
                {product.sku && (
                  <span className="text-[10px] font-mono text-muted-foreground/50">
                    SKU: {product.sku}
                  </span>
                )}
                {product.hsn_code && (
                  <>
                    {product.sku && <span className="text-muted-foreground/20">•</span>}
                    <span className="text-[10px] font-mono text-muted-foreground/50">
                      HSN: {product.hsn_code}
                    </span>
                  </>
                )}
              </div>

              {/* Description */}
              {product.description && (
                <div className="mb-6">
                  <div
                    className={cn(
                      "text-sm text-muted-foreground leading-relaxed overflow-hidden relative transition-all duration-300",
                      isLongDescription && !isDescriptionExpanded && "max-h-24"
                    )}
                    style={{
                      maskImage: isLongDescription && !isDescriptionExpanded 
                        ? "linear-gradient(to bottom, black 50%, transparent 100%)" 
                        : "none",
                      WebkitMaskImage: isLongDescription && !isDescriptionExpanded 
                        ? "linear-gradient(to bottom, black 50%, transparent 100%)" 
                        : "none"
                    }}
                  >
                    {product.description}
                  </div>
                  {isLongDescription && (
                    <button
                      onClick={() => setIsDescriptionExpanded(!isDescriptionExpanded)}
                      className="mt-1.5 text-xs font-semibold text-primary hover:text-primary/80 transition-colors flex items-center gap-1"
                    >
                      {isDescriptionExpanded ? (
                        <>Show less <ChevronUp className="w-3.5 h-3.5" /></>
                      ) : (
                        <>Read more <ChevronDown className="w-3.5 h-3.5" /></>
                      )}
                    </button>
                  )}
                </div>
              )}

              {/* Divider */}
              <div className="h-px w-full bg-border/40 mb-6" />

              {/* Actions */}
              <div className="space-y-3">
                <div className="flex flex-col sm:flex-row gap-2.5">
                  {product.stock_quantity > 0 && (
                    <div className="flex items-center border border-border/50 rounded-xl h-12 w-full sm:w-32 bg-card overflow-hidden">
                      <button 
                        onClick={() => setQuantity(Math.max(1, quantity - 1))}
                        disabled={quantity <= 1}
                        className="w-10 h-full flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-secondary/50 disabled:opacity-30 transition-colors"
                      >
                        <Minus className="w-3.5 h-3.5" />
                      </button>
                      <div className="flex-1 text-center font-bold text-foreground tabular-nums">
                        {quantity}
                      </div>
                      <button 
                        onClick={() => setQuantity(Math.min(product.stock_quantity, quantity + 1))}
                        disabled={quantity >= product.stock_quantity}
                        className="w-10 h-full flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-secondary/50 disabled:opacity-30 transition-colors"
                      >
                        <Plus className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  )}

                  <Button
                    onClick={handleBuyNow}
                    size="lg"
                    disabled={product.stock_quantity === 0}
                    className="flex-1 h-12 bg-primary hover:bg-primary/90 text-primary-foreground font-bold text-sm shadow-md shadow-primary/15 rounded-xl transition-all hover:shadow-lg hover:shadow-primary/20 active:scale-[0.98]"
                  >
                    <Zap className="w-4 h-4 mr-2" />
                    Buy Now
                  </Button>
                </div>

                <Button
                  onClick={handleAddToCart}
                  variant="outline"
                  size="lg"
                  disabled={product.stock_quantity === 0 || addToCartMutation.isPending}
                  className="w-full h-12 border-border/40 text-foreground hover:border-primary/30 hover:text-primary hover:bg-primary/5 font-semibold text-sm rounded-xl transition-all"
                >
                  <ShoppingCart className="w-4 h-4 mr-2" />
                  Add to Cart
                </Button>

                {/* Share & Wishlist */}
                <div className="flex items-center gap-2 pt-1">
                  <ShareMenu
                    url={productUrl}
                    title={product.name}
                    description={product.description || undefined}
                    label="Share"
                    triggerClassName="flex items-center gap-2 px-3.5 py-2 border border-border/30 rounded-xl text-xs font-medium text-muted-foreground hover:text-foreground hover:border-primary/20 transition-all bg-card"
                    iconClassName="w-3.5 h-3.5"
                  />
                  <div className="flex items-center gap-2 px-3.5 py-2 border border-border/30 rounded-xl hover:border-primary/20 transition-all bg-card">
                    <WishlistButton productId={product.id} />
                  </div>
                </div>
              </div>

              {/* Trust Badges */}
              <div className="mt-8 pt-6 border-t border-border/30">
                <div className="grid grid-cols-3 gap-3">
                  {[
                    { icon: Shield, label: "Warranty" },
                    { icon: Truck, label: "Fast Shipping" },
                    { icon: Award, label: "Quality" },
                  ].map(({ icon: Icon, label }) => (
                    <div key={label} className="flex flex-col items-center text-center gap-1.5">
                      <div className="p-2 bg-secondary/40 rounded-lg">
                        <Icon className="w-4 h-4 text-muted-foreground" />
                      </div>
                      <span className="text-[10px] font-medium text-muted-foreground">{label}</span>
                    </div>
                  ))}
                </div>
              </div>

            </motion.div>
          </div>

          {/* Specifications */}
          {product?.id && <ProductSpecifications productId={product.id} />}

          {/* Reviews */}
          <section id="reviews" className="mt-12 lg:mt-16 border-t border-border/30 pt-8 lg:pt-10">
            <div 
              className="flex items-center justify-between mb-6 cursor-pointer group"
              onClick={() => setIsReviewsOpen(!isReviewsOpen)}
            >
              <div className="flex items-center gap-2.5">
                <Star className="w-5 h-5 text-primary fill-primary" />
                <h2 className="text-lg lg:text-xl font-bold text-foreground">Customer Reviews</h2>
                {approvedReviews.length > 0 && (
                  <Badge variant="secondary" className="bg-secondary/50 text-muted-foreground rounded-full text-xs">{approvedReviews.length}</Badge>
                )}
              </div>
              <button className="p-1.5 rounded-lg hover:bg-secondary/50 transition-colors">
                {isReviewsOpen ? <ChevronUp className="w-4 h-4 text-muted-foreground" /> : <ChevronDown className="w-4 h-4 text-muted-foreground" />}
              </button>
            </div>

            <AnimatePresence>
              {isReviewsOpen && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: "auto", opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  transition={{ duration: 0.25 }}
                  className="overflow-hidden"
                >
                  <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 lg:gap-10 pb-4">
                    {/* Write Review */}
                    <div className="lg:col-span-4">
                      <Card className="border-border/20 shadow-sm sticky top-24 overflow-hidden rounded-xl">
                        <div className="h-0.5 bg-gradient-to-r from-primary to-accent" />
                        <CardContent className="p-5 sm:p-6">
                          <h3 className="font-bold text-base text-foreground mb-1">Write a Review</h3>
                          <p className="text-xs text-muted-foreground mb-5">
                            Share your experience with this product.
                          </p>
                          
                          {user ? (
                            <div className="space-y-4">
                              <div>
                                <label className="text-xs font-semibold text-foreground mb-2 block">
                                  Rating
                                </label>
                                <div className="flex gap-1">
                                  {[1, 2, 3, 4, 5].map((star) => (
                                    <button
                                      key={star}
                                      type="button"
                                      onClick={() => setRating(star)}
                                      onMouseEnter={() => setHoveredRating(star)}
                                      onMouseLeave={() => setHoveredRating(0)}
                                      className="focus:outline-none transition-transform hover:scale-110 active:scale-95"
                                    >
                                      <Star
                                        className={`w-6 h-6 transition-colors ${
                                          star <= (hoveredRating || rating)
                                            ? "text-amber-400 fill-amber-400"
                                            : "text-muted-foreground/10 fill-muted-foreground/5"
                                        }`}
                                      />
                                    </button>
                                  ))}
                                </div>
                                {(hoveredRating || rating) > 0 && (
                                  <span className="text-[11px] font-semibold text-primary mt-1 block">
                                    {["Poor", "Fair", "Good", "Very Good", "Excellent"][(hoveredRating || rating) - 1]}
                                  </span>
                                )}
                              </div>
                              
                              <div>
                                <label className="text-xs font-semibold text-foreground mb-1.5 block">
                                  Your Review
                                </label>
                                <Textarea
                                  placeholder="What did you like or dislike?"
                                  value={reviewText}
                                  onChange={(e) => setReviewText(e.target.value)}
                                  rows={3}
                                  className="resize-none border-border/30 focus:border-primary/30 bg-secondary/20 text-sm rounded-lg"
                                />
                              </div>
                              
                              <Button
                                onClick={() => submitReviewMutation.mutate()}
                                disabled={submitReviewMutation.isPending}
                                className="w-full bg-foreground hover:bg-foreground/90 text-background h-10 text-xs font-semibold rounded-lg"
                              >
                                {submitReviewMutation.isPending ? "Submitting..." : "Submit Review"}
                              </Button>
                            </div>
                          ) : (
                            <div className="text-center py-6 bg-secondary/20 rounded-xl border border-dashed border-border/30">
                              <User className="w-8 h-8 text-muted-foreground/15 mx-auto mb-2" />
                              <p className="text-muted-foreground font-medium mb-3 text-xs">
                                Login to write a review
                              </p>
                              <Button onClick={() => navigate("/login")} variant="outline" size="sm" className="rounded-lg text-xs">
                                Login Now
                              </Button>
                            </div>
                          )}
                        </CardContent>
                      </Card>
                    </div>

                    {/* Reviews List */}
                    <div className="lg:col-span-8 space-y-3">
                      {approvedReviews.length > 0 ? (
                        approvedReviews.map((review) => (
                          <Card key={review.id} className="border-border/15 shadow-sm rounded-xl">
                            <CardContent className="p-4 sm:p-5">
                              <div className="flex items-start gap-3">
                                <Avatar className="w-8 h-8 border border-border/20 flex-shrink-0">
                                  <AvatarFallback className="bg-secondary/50 text-muted-foreground text-xs">
                                    <User className="w-3.5 h-3.5" />
                                  </AvatarFallback>
                                </Avatar>
                                <div className="flex-1 min-w-0">
                                  <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-1.5 gap-1">
                                    <div className="flex items-center gap-1.5">
                                      <div className="flex gap-0.5">
                                        {[1, 2, 3, 4, 5].map((star) => (
                                          <Star
                                            key={star}
                                            className={`w-3 h-3 ${
                                              star <= review.rating
                                                ? "text-amber-400 fill-amber-400"
                                                : "text-muted-foreground/10"
                                            }`}
                                          />
                                        ))}
                                      </div>
                                      <span className="text-[11px] font-semibold text-foreground">
                                        {["Poor", "Fair", "Good", "Very Good", "Excellent"][review.rating - 1]}
                                      </span>
                                    </div>
                                    <span className="text-[10px] text-muted-foreground/60">
                                      {new Date(review.created_at).toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' })}
                                    </span>
                                  </div>
                                  
                                  {review.review_text ? (
                                    <p className="text-muted-foreground leading-relaxed text-sm">{review.review_text}</p>
                                  ) : (
                                    <p className="text-muted-foreground/40 italic text-xs">No written review</p>
                                  )}
                                </div>
                              </div>
                            </CardContent>
                          </Card>
                        ))
                      ) : (
                        <div className="bg-card rounded-2xl border border-border/15 p-10 sm:p-14 text-center">
                          <div className="w-14 h-14 bg-secondary/30 rounded-xl flex items-center justify-center mx-auto mb-4">
                            <MessageSquare className="w-7 h-7 text-muted-foreground/15" />
                          </div>
                          <h3 className="text-base font-bold text-foreground mb-1.5">No reviews yet</h3>
                          <p className="text-muted-foreground text-sm max-w-sm mx-auto">
                            Be the first to share your experience.
                          </p>
                        </div>
                      )}
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </section>

          {/* Related Products */}
          {product && <RelatedProducts categoryId={product.category_id} currentProductId={product.id} />}
        </div>
      </motion.main>

      {/* Mobile Sticky Bar */}
      <div className="fixed bottom-0 left-0 right-0 p-3 bg-card/95 backdrop-blur-xl border-t border-border/20 lg:hidden z-50 shadow-[0_-4px_20px_-8px_rgba(0,0,0,0.08)]">
        <div className="flex gap-2.5 max-w-lg mx-auto">
          <Button 
            variant="outline" 
            className="flex-1 h-11 border-border/40 text-foreground font-semibold text-sm rounded-xl" 
            onClick={handleAddToCart}
            disabled={product.stock_quantity === 0 || addToCartMutation.isPending}
          >
            <ShoppingCart className="w-4 h-4 mr-1.5" />
            Cart
          </Button>
          <Button 
            className="flex-1 h-11 bg-primary text-primary-foreground font-bold shadow-md shadow-primary/15 text-sm rounded-xl" 
            onClick={handleBuyNow}
            disabled={product.stock_quantity === 0}
          >
            <Zap className="w-4 h-4 mr-1.5" />
            Buy Now
          </Button>
        </div>
      </div>

      <PublicFooter />
    </div>
  );
};

export default ProductDetail;
