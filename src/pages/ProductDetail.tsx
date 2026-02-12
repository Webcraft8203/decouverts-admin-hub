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
  Zap
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

  // Support both UUID and slug-based URLs
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

  // Redirect UUID URLs to slug URLs for SEO
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

  // Compute review stats for SEO
  const approvedReviewsForSEO = reviews?.filter((r: any) => r.is_approved) || [];
  const avgRating = approvedReviewsForSEO.length
    ? approvedReviewsForSEO.reduce((sum: number, r: any) => sum + r.rating, 0) / approvedReviewsForSEO.length
    : 0;

  // SEO: dynamic meta tags and JSON-LD structured data
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
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-20">
              <Skeleton className="aspect-square rounded-3xl" />
              <div className="space-y-6 pt-4">
                <Skeleton className="h-4 w-24" />
                <Skeleton className="h-12 w-3/4" />
                <Skeleton className="h-8 w-1/3" />
                <Skeleton className="h-24 w-full" />
                <Skeleton className="h-14 w-full rounded-xl" />
                <Skeleton className="h-14 w-full rounded-xl" />
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
            <div className="w-24 h-24 bg-secondary/50 rounded-3xl flex items-center justify-center mx-auto mb-6">
              <Package className="w-12 h-12 text-muted-foreground/30" />
            </div>
            <h1 className="text-2xl font-bold text-foreground mb-2">Product Not Found</h1>
            <p className="text-muted-foreground mb-6">The product you are looking for does not exist or has been removed.</p>
            <Button onClick={() => navigate("/shop")} variant="outline" className="rounded-xl">
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
        transition={{ duration: 0.4 }}
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Breadcrumb */}
          <nav className="flex items-center gap-2 text-sm text-muted-foreground mb-8 pt-4">
            <button onClick={() => navigate("/")} className="hover:text-foreground transition-colors">Home</button>
            <span>/</span>
            <button onClick={() => navigate("/shop")} className="hover:text-foreground transition-colors">Shop</button>
            {(product.categories as any)?.name && (
              <>
                <span>/</span>
                <span className="text-muted-foreground">{(product.categories as any).name}</span>
              </>
            )}
            <span>/</span>
            <span className="text-foreground font-medium truncate max-w-[200px]">{product.name}</span>
          </nav>

          {/* Product Hero Section */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 md:gap-12 lg:gap-20 items-start mb-16 md:mb-24">
              
            {/* Left Column: Gallery */}
            <motion.div 
              className="lg:sticky lg:top-24 z-10"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.5 }}
            >
              <ProductMediaGallery 
                images={product.images}
                videoUrl={product.video_url}
                productName={product.name}
              />
            </motion.div>

            {/* Right Column: Information */}
            <motion.div 
              className="flex flex-col h-full"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.5, delay: 0.1 }}
            >
              {/* Brand & Category */}
              <div className="flex items-center gap-2 mb-4">
                <span className="text-primary font-bold text-xs uppercase tracking-[0.2em]">DECOUVERTES</span>
                {(product.categories as any)?.name && (
                  <>
                    <span className="text-muted-foreground/30">•</span>
                    <Badge variant="secondary" className="bg-secondary/50 text-muted-foreground border-0 px-2.5 py-0.5 rounded-full text-[11px] font-semibold tracking-wide uppercase">
                      {(product.categories as any).name}
                    </Badge>
                  </>
                )}
              </div>

              {/* Title */}
              <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-foreground leading-[1.15] tracking-tight mb-4">
                {product.name}
              </h1>

              {/* Rating Summary */}
              {approvedReviews.length > 0 && (
                <div className="flex items-center gap-2 mb-6">
                  <div className="flex gap-0.5">
                    {[1,2,3,4,5].map(s => (
                      <Star key={s} className={`w-4 h-4 ${s <= Math.round(averageRating) ? "text-amber-400 fill-amber-400" : "text-muted-foreground/20"}`} />
                    ))}
                  </div>
                  <span className="text-sm font-medium text-foreground">{averageRating.toFixed(1)}</span>
                  <span className="text-sm text-muted-foreground">({approvedReviews.length} review{approvedReviews.length > 1 ? 's' : ''})</span>
                </div>
              )}

              {/* Price & Stock */}
              <div className="flex items-center flex-wrap gap-4 mb-6">
                <span className="text-3xl sm:text-4xl font-bold text-foreground tracking-tight">
                  ₹{product.price.toLocaleString()}
                </span>
                {product.stock_quantity > 0 ? (
                  <div className="flex items-center gap-1.5 text-emerald-600 text-sm font-medium bg-emerald-50 px-3 py-1.5 rounded-full border border-emerald-100">
                    <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></div>
                    In Stock
                  </div>
                ) : (
                  <div className="flex items-center gap-1.5 text-destructive text-sm font-medium bg-destructive/5 px-3 py-1.5 rounded-full border border-destructive/10">
                    <Clock className="w-3.5 h-3.5" />
                    Out of Stock
                  </div>
                )}
              </div>

              {/* Meta info */}
              <div className="flex items-center gap-3 mb-6 flex-wrap">
                {product.sku && (
                  <span className="text-[11px] font-mono text-muted-foreground bg-muted/50 px-2.5 py-1 rounded-lg">
                    SKU: {product.sku}
                  </span>
                )}
                {product.hsn_code && (
                  <span className="text-[11px] font-mono text-muted-foreground bg-muted/50 px-2.5 py-1 rounded-lg">
                    HSN: {product.hsn_code}
                  </span>
                )}
              </div>

              {/* Description */}
              {product.description && (
                <div className="mb-8">
                  <motion.div
                    initial={false}
                    animate={{ height: isLongDescription && !isDescriptionExpanded ? "6rem" : "auto" }}
                    transition={{ duration: 0.3 }}
                    className="text-base text-muted-foreground leading-relaxed overflow-hidden relative"
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
                  </motion.div>
                  {isLongDescription && (
                    <button
                      onClick={() => setIsDescriptionExpanded(!isDescriptionExpanded)}
                      className="mt-2 text-sm font-semibold text-primary hover:text-primary/80 transition-colors flex items-center gap-1"
                    >
                      {isDescriptionExpanded ? (
                        <>Read less <ChevronUp className="w-4 h-4" /></>
                      ) : (
                        <>Read more <ChevronDown className="w-4 h-4" /></>
                      )}
                    </button>
                  )}
                </div>
              )}

              {/* Divider */}
              <div className="h-px w-full bg-border/50 mb-8"></div>

              {/* Actions Area */}
              <div className="space-y-4">
                {/* Quantity & Buy Now Row */}
                <div className="flex flex-col sm:flex-row gap-3">
                  {product.stock_quantity > 0 && (
                    <div className="flex items-center border border-border rounded-xl h-13 w-full sm:w-36 bg-card overflow-hidden">
                      <button 
                        onClick={() => setQuantity(Math.max(1, quantity - 1))}
                        disabled={quantity <= 1}
                        className="w-11 h-full flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-secondary disabled:opacity-30 transition-colors"
                      >
                        <Minus className="w-4 h-4" />
                      </button>
                      <div className="flex-1 text-center font-bold text-lg text-foreground tabular-nums">
                        {quantity}
                      </div>
                      <button 
                        onClick={() => setQuantity(Math.min(product.stock_quantity, quantity + 1))}
                        disabled={quantity >= product.stock_quantity}
                        className="w-11 h-full flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-secondary disabled:opacity-30 transition-colors"
                      >
                        <Plus className="w-4 h-4" />
                      </button>
                    </div>
                  )}

                  <Button
                    onClick={handleBuyNow}
                    size="lg"
                    disabled={product.stock_quantity === 0}
                    className="flex-1 h-13 bg-primary hover:bg-primary/90 text-primary-foreground font-bold text-base shadow-lg shadow-primary/20 rounded-xl transition-all hover:-translate-y-0.5 active:translate-y-0"
                  >
                    <Zap className="w-4 h-4 mr-2" />
                    Buy Now
                  </Button>
                </div>

                {/* Add to Cart */}
                <Button
                  onClick={handleAddToCart}
                  variant="outline"
                  size="lg"
                  disabled={product.stock_quantity === 0 || addToCartMutation.isPending}
                  className="w-full h-13 border-2 border-foreground/15 text-foreground hover:border-primary hover:text-primary hover:bg-primary/5 font-semibold text-base rounded-xl transition-all"
                >
                  <ShoppingCart className="w-5 h-5 mr-2" />
                  Add to Cart
                </Button>

                {/* Share & Wishlist Row */}
                <div className="flex items-center gap-2">
                  <ShareMenu
                    url={productUrl}
                    title={product.name}
                    description={product.description || undefined}
                    label="Share"
                    triggerClassName="flex items-center gap-2 px-4 py-2.5 border border-border/50 rounded-xl text-sm font-medium text-muted-foreground hover:text-foreground hover:border-primary/30 hover:bg-primary/5 transition-all bg-card"
                    iconClassName="w-4 h-4"
                  />
                  <div className="flex items-center gap-2 px-4 py-2.5 border border-border/50 rounded-xl hover:border-primary/30 hover:bg-primary/5 transition-all bg-card">
                    <WishlistButton productId={product.id} />
                  </div>
                </div>
              </div>

              {/* Trust Badges */}
              <div className="mt-8 pt-6 border-t border-border/40">
                <div className="grid grid-cols-3 gap-4">
                  <div className="flex flex-col items-center text-center gap-2">
                    <div className="p-2.5 bg-secondary/50 rounded-xl">
                      <Shield className="w-5 h-5 text-foreground" />
                    </div>
                    <span className="text-xs font-medium text-muted-foreground leading-tight">Official Warranty</span>
                  </div>
                  <div className="flex flex-col items-center text-center gap-2">
                    <div className="p-2.5 bg-secondary/50 rounded-xl">
                      <Truck className="w-5 h-5 text-foreground" />
                    </div>
                    <span className="text-xs font-medium text-muted-foreground leading-tight">Fast Shipping</span>
                  </div>
                  <div className="flex flex-col items-center text-center gap-2">
                    <div className="p-2.5 bg-secondary/50 rounded-xl">
                      <Check className="w-5 h-5 text-foreground" />
                    </div>
                    <span className="text-xs font-medium text-muted-foreground leading-tight">Quality Assured</span>
                  </div>
                </div>
              </div>

            </motion.div>
          </div>

          {/* Product Specifications */}
          {product?.id && <ProductSpecifications productId={product.id} />}

          {/* Reviews Section */}
          <section id="reviews" className="mt-12 lg:mt-20 border-t border-border/50 pt-8 lg:pt-12">
            <div 
              className="flex items-center justify-between mb-8 cursor-pointer group"
              onClick={() => setIsReviewsOpen(!isReviewsOpen)}
            >
              <div className="flex items-center gap-3">
                <div className="p-2 bg-primary/10 rounded-xl group-hover:bg-primary/15 transition-colors">
                  <Star className="w-5 h-5 text-primary fill-primary" />
                </div>
                <h2 className="text-xl lg:text-2xl font-bold text-foreground">Customer Reviews</h2>
                {approvedReviews.length > 0 && (
                  <Badge variant="secondary" className="bg-secondary text-muted-foreground rounded-full">{approvedReviews.length}</Badge>
                )}
              </div>
              <div className="p-2 rounded-xl hover:bg-secondary transition-colors">
                {isReviewsOpen ? <ChevronUp className="w-5 h-5 text-muted-foreground" /> : <ChevronDown className="w-5 h-5 text-muted-foreground" />}
              </div>
            </div>

            <AnimatePresence>
              {isReviewsOpen && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: "auto", opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  transition={{ duration: 0.3 }}
                  className="overflow-hidden"
                >
                  <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 pb-4">
                    {/* Write Review Column */}
                    <div className="lg:col-span-4">
                      <Card className="border-border/30 shadow-sm sticky top-24 overflow-hidden rounded-2xl">
                        <div className="h-1 bg-gradient-to-r from-primary to-accent" />
                        <CardContent className="p-6 sm:p-8">
                          <h3 className="font-bold text-lg text-foreground mb-1">Write a Review</h3>
                          <p className="text-sm text-muted-foreground mb-6 leading-relaxed">
                            Share your experience with this product.
                          </p>
                          
                          {user ? (
                            <div className="space-y-5">
                              <div>
                                <label className="text-sm font-semibold text-foreground mb-3 block">
                                  Rate this product
                                </label>
                                <div className="flex gap-1.5">
                                  {[1, 2, 3, 4, 5].map((star) => (
                                    <motion.button
                                      key={star}
                                      type="button"
                                      onClick={() => setRating(star)}
                                      onMouseEnter={() => setHoveredRating(star)}
                                      onMouseLeave={() => setHoveredRating(0)}
                                      whileHover={{ scale: 1.15 }}
                                      whileTap={{ scale: 0.9 }}
                                      className="focus:outline-none transition-colors"
                                    >
                                      <Star
                                        className={`w-7 h-7 ${
                                          star <= (hoveredRating || rating)
                                            ? "text-amber-400 fill-amber-400 drop-shadow-sm"
                                            : "text-muted-foreground/15 fill-muted-foreground/5"
                                        }`}
                                      />
                                    </motion.button>
                                  ))}
                                </div>
                                <div className="h-5 mt-1">
                                  <AnimatePresence mode="wait">
                                    {(hoveredRating || rating) > 0 && (
                                      <motion.span 
                                        key={hoveredRating || rating}
                                        initial={{ opacity: 0, y: -5 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        exit={{ opacity: 0, y: 5 }}
                                        className="text-xs font-semibold text-primary"
                                      >
                                        {["Poor", "Fair", "Good", "Very Good", "Excellent"][(hoveredRating || rating) - 1]}
                                      </motion.span>
                                    )}
                                  </AnimatePresence>
                                </div>
                              </div>
                              
                              <div>
                                <label className="text-sm font-semibold text-foreground mb-2 block">
                                  Your Review
                                </label>
                                <Textarea
                                  placeholder="What did you like or dislike?"
                                  value={reviewText}
                                  onChange={(e) => setReviewText(e.target.value)}
                                  rows={4}
                                  className="resize-none border-border/50 focus:border-primary bg-secondary/30 text-sm rounded-xl"
                                />
                              </div>
                              
                              <Button
                                onClick={() => submitReviewMutation.mutate()}
                                disabled={submitReviewMutation.isPending}
                                className="w-full bg-foreground hover:bg-foreground/90 text-background h-11 text-sm font-semibold rounded-xl shadow-sm"
                              >
                                {submitReviewMutation.isPending ? "Submitting..." : "Submit Review"}
                              </Button>
                            </div>
                          ) : (
                            <div className="text-center py-8 bg-secondary/30 rounded-2xl border border-dashed border-border/50">
                              <User className="w-10 h-10 text-muted-foreground/20 mx-auto mb-3" />
                              <p className="text-muted-foreground font-medium mb-4 text-sm">
                                Login to write a review
                              </p>
                              <Button onClick={() => navigate("/login")} variant="outline" className="border-border/50 hover:border-primary hover:text-primary rounded-xl text-sm">
                                Login Now
                              </Button>
                            </div>
                          )}
                        </CardContent>
                      </Card>
                    </div>

                    {/* Reviews List Column */}
                    <div className="lg:col-span-8 space-y-4">
                      {approvedReviews.length > 0 ? (
                        approvedReviews.map((review) => (
                          <motion.div 
                            key={review.id}
                            initial={{ opacity: 0, y: 10 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            viewport={{ once: true }}
                          >
                            <Card className="border-border/20 shadow-sm hover:shadow-md transition-shadow duration-300 rounded-2xl">
                              <CardContent className="p-5 sm:p-6">
                                <div className="flex items-start gap-4">
                                  <Avatar className="w-10 h-10 border border-border/30 shadow-sm flex-shrink-0">
                                    <AvatarFallback className="bg-secondary text-muted-foreground font-bold text-sm">
                                      <User className="w-4 h-4" />
                                    </AvatarFallback>
                                  </Avatar>
                                  <div className="flex-1 min-w-0">
                                    <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-2 gap-1">
                                      <div className="flex items-center gap-2">
                                        <div className="flex gap-0.5">
                                          {[1, 2, 3, 4, 5].map((star) => (
                                            <Star
                                              key={star}
                                              className={`w-3.5 h-3.5 ${
                                                star <= review.rating
                                                  ? "text-amber-400 fill-amber-400"
                                                  : "text-muted-foreground/15"
                                              }`}
                                            />
                                          ))}
                                        </div>
                                        <span className="text-xs font-semibold text-foreground">
                                          {["Poor", "Fair", "Good", "Very Good", "Excellent"][review.rating - 1]}
                                        </span>
                                      </div>
                                      <span className="text-[11px] text-muted-foreground">
                                        {new Date(review.created_at).toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' })}
                                      </span>
                                    </div>
                                    
                                    {review.review_text ? (
                                      <p className="text-muted-foreground leading-relaxed text-sm">{review.review_text}</p>
                                    ) : (
                                      <p className="text-muted-foreground/50 italic text-xs">No written review</p>
                                    )}
                                  </div>
                                </div>
                              </CardContent>
                            </Card>
                          </motion.div>
                        ))
                      ) : (
                        <div className="bg-card rounded-3xl border border-border/20 p-12 sm:p-16 text-center">
                          <div className="w-16 h-16 bg-secondary/50 rounded-2xl flex items-center justify-center mx-auto mb-5">
                            <MessageSquare className="w-8 h-8 text-muted-foreground/20" />
                          </div>
                          <h3 className="text-lg font-bold text-foreground mb-2">No reviews yet</h3>
                          <p className="text-muted-foreground max-w-sm mx-auto leading-relaxed text-sm">
                            Be the first to share your experience with this product.
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

      {/* Mobile Sticky Action Bar */}
      <div className="fixed bottom-0 left-0 right-0 p-3 bg-card/95 backdrop-blur-xl border-t border-border/30 lg:hidden z-50 shadow-[0_-8px_30px_-10px_rgba(0,0,0,0.1)]">
        <div className="flex gap-2.5 max-w-lg mx-auto">
          <Button 
            variant="outline" 
            className="flex-1 h-12 border-border/50 text-foreground font-semibold text-sm hover:bg-secondary rounded-xl" 
            onClick={handleAddToCart}
            disabled={product.stock_quantity === 0 || addToCartMutation.isPending}
          >
            <ShoppingCart className="w-4 h-4 mr-1.5" />
            Cart
          </Button>
          <Button 
            className="flex-1 h-12 bg-primary text-primary-foreground font-bold shadow-lg shadow-primary/20 text-sm hover:bg-primary/90 rounded-xl" 
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
