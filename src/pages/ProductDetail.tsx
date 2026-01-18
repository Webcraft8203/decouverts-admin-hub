import { useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
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
  Share2,
  Copy,
  Facebook,
  Twitter,
  MessageSquare,
  ChevronDown,
  ChevronUp
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
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

  const productUrl = `${window.location.origin}/product/${id}`;

  const handleCopyLink = async () => {
    await navigator.clipboard.writeText(productUrl);
    toast.success("Link copied to clipboard!");
  };

  const handleNativeShare = async () => {
    if (navigator.share && product) {
      try {
        await navigator.share({
          title: product.name,
          text: product.description || `Check out ${product.name}`,
          url: productUrl,
        });
      } catch (err) {
        if ((err as Error).name !== 'AbortError') {
          handleCopyLink();
        }
      }
    } else {
      handleCopyLink();
    }
  };

  const handleShareFacebook = () => {
    window.open(`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(productUrl)}`, '_blank');
  };

  const handleShareTwitter = () => {
    const text = product ? `Check out ${product.name}` : 'Check out this product';
    window.open(`https://twitter.com/intent/tweet?url=${encodeURIComponent(productUrl)}&text=${encodeURIComponent(text)}`, '_blank');
  };

  const handleShareWhatsApp = () => {
    const text = product ? `Check out ${product.name}: ${productUrl}` : productUrl;
    window.open(`https://wa.me/?text=${encodeURIComponent(text)}`, '_blank');
  };

  const averageRating = reviews?.length
    ? reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length
    : 0;

  const approvedReviews = reviews?.filter((r) => r.is_approved) || [];

  if (isLoading) {
    return (
      <div className="min-h-screen flex flex-col bg-slate-50">
        <PublicNavbar />
        <main className="flex-1 pt-24 pb-16">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="bg-white rounded-3xl p-8 shadow-sm border border-slate-200">
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
          </div>
        </main>
        <PublicFooter />
      </div>
    );
  }

  if (!product) {
    return (
      <div className="min-h-screen flex flex-col bg-slate-50">
        <PublicNavbar />
        <main className="flex-1 pt-24 pb-16 flex items-center justify-center">
          <div className="text-center">
            <div className="w-20 h-20 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-6">
              <Package className="w-10 h-10 text-slate-400" />
            </div>
            <h1 className="text-2xl font-bold text-slate-900 mb-2">Product Not Found</h1>
            <p className="text-slate-500 mb-6">The product you are looking for does not exist or has been removed.</p>
            <Button onClick={() => navigate("/shop")} variant="outline">
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
    <div className="min-h-screen flex flex-col bg-[#F8F9FA]">
      <PublicNavbar />

      <motion.main 
        className="flex-1 pt-24 pb-24 lg:pb-16"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Breadcrumb / Back Navigation */}
          <nav className="flex items-center mb-8">
             <button
                onClick={() => navigate("/shop")}
                className="group flex items-center gap-2 text-sm font-medium text-slate-500 hover:text-orange-600 transition-colors"
             >
                <div className="p-1.5 rounded-full bg-white border border-slate-200 group-hover:border-orange-600 transition-colors shadow-sm">
                    <ArrowLeft className="w-4 h-4" />
                </div>
                Back to Catalog
             </button>
          </nav>

          {/* Product Hero Section */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-20 items-start mb-16">
              
              {/* Left Column: Gallery */}
              <div>
                <ProductMediaGallery 
                  images={product.images}
                  videoUrl={product.video_url}
                  productName={product.name}
                />
              </div>

              {/* Right Column: Information */}
              <div className="flex flex-col h-full">
                
                {/* Category Badge */}
                <div className="mb-4">
                    {(product.categories as any)?.name && (
                        <Badge variant="secondary" className="bg-slate-100 text-slate-600 hover:bg-slate-200 border-slate-200 px-3 py-1 rounded-full text-xs font-semibold tracking-wide uppercase">
                            {(product.categories as any).name}
                        </Badge>
                    )}
                </div>

                {/* Title */}
                <h1 className="text-4xl sm:text-5xl font-bold text-slate-900 leading-tight tracking-tight mb-4">
                    {product.name}
                </h1>

                {/* Price & Stock */}
                <div className="flex items-center gap-4 mb-6">
                    <span className="text-3xl font-bold text-orange-600">
                        ₹{product.price.toLocaleString()}
                    </span>
                    <div className="h-6 w-px bg-slate-200"></div>
                    {product.stock_quantity > 0 ? (
                        <div className="flex items-center gap-1.5 text-emerald-600 font-medium bg-emerald-50 px-3 py-1 rounded-full border border-emerald-100">
                            <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></div>
                            In Stock
                        </div>
                    ) : (
                        <div className="flex items-center gap-1.5 text-rose-600 font-medium bg-rose-50 px-3 py-1 rounded-full border border-rose-100">
                            <Clock className="w-4 h-4" />
                            Out of Stock
                        </div>
                    )}
                </div>

                {/* Short Description */}
                {product.description && (
                    <div className="mb-8">
                      <motion.div
                        initial={false}
                        animate={{ 
                          height: isLongDescription && !isDescriptionExpanded ? "7.4rem" : "auto"
                        }}
                        transition={{ duration: 0.3 }}
                        className={cn("text-lg text-slate-600 leading-relaxed overflow-hidden relative")}
                        style={{
                           maskImage: isLongDescription && !isDescriptionExpanded 
                             ? "linear-gradient(to bottom, black 60%, transparent 100%)" 
                             : "none",
                           WebkitMaskImage: isLongDescription && !isDescriptionExpanded 
                             ? "linear-gradient(to bottom, black 60%, transparent 100%)" 
                             : "none"
                        }}
                      >
                        {product.description}
                      </motion.div>
                      {isLongDescription && (
                        <button
                          onClick={() => setIsDescriptionExpanded(!isDescriptionExpanded)}
                          className="mt-2 text-sm font-semibold text-slate-500 hover:text-orange-600 transition-colors flex items-center gap-1 focus:outline-none group"
                        >
                          {isDescriptionExpanded ? (
                            <>See less <ChevronUp className="w-4 h-4 transition-transform group-hover:-translate-y-0.5" /></>
                          ) : (
                            <>See more <ChevronDown className="w-4 h-4 transition-transform group-hover:translate-y-0.5" /></>
                          )}
                        </button>
                      )}
                    </div>
                )}

                {/* Divider */}
                <div className="h-px w-full bg-slate-100 mb-8"></div>

                {/* Actions Area */}
                <div className="space-y-6">
                    <div className="flex flex-col sm:flex-row gap-4">
                        {/* Quantity */}
                        {product.stock_quantity > 0 && (
                            <div className="flex items-center border border-slate-200 rounded-xl h-14 w-full sm:w-40 bg-white shadow-sm">
                                <button 
                                    onClick={() => setQuantity(Math.max(1, quantity - 1))}
                                    disabled={quantity <= 1}
                                    className="w-12 h-full flex items-center justify-center text-slate-400 hover:text-slate-900 disabled:opacity-30 transition-colors"
                                >
                                    <Minus className="w-5 h-5" />
                                </button>
                                <div className="flex-1 text-center font-bold text-lg text-slate-900">
                                    {quantity}
                                </div>
                                <button 
                                    onClick={() => setQuantity(Math.min(product.stock_quantity, quantity + 1))}
                                    disabled={quantity >= product.stock_quantity}
                                    className="w-12 h-full flex items-center justify-center text-slate-400 hover:text-slate-900 disabled:opacity-30 transition-colors"
                                >
                                    <Plus className="w-5 h-5" />
                                </button>
                            </div>
                        )}

                        {/* Buy Now */}
                        <Button
                            onClick={handleBuyNow}
                            size="lg"
                            disabled={product.stock_quantity === 0}
                            className="flex-1 h-14 bg-orange-600 hover:bg-orange-700 text-white font-bold text-lg shadow-lg shadow-orange-200 rounded-xl transition-all hover:-translate-y-0.5 active:translate-y-0"
                        >
                            Buy Now
                        </Button>
                    </div>

                    {/* Add to Cart */}
                    <Button
                        onClick={handleAddToCart}
                        variant="outline"
                        size="lg"
                        disabled={product.stock_quantity === 0 || addToCartMutation.isPending}
                        className="w-full h-14 border-2 border-slate-200 text-slate-700 hover:border-orange-600 hover:text-orange-600 hover:bg-orange-50 font-semibold text-lg rounded-xl transition-all"
                    >
                        <ShoppingCart className="w-5 h-5 mr-2" />
                        Add to Cart
                    </Button>
                </div>

                {/* Trust Badges */}
                <div className="mt-8 pt-8 border-t border-slate-100 grid grid-cols-2 gap-4">
                    <div className="flex items-center gap-3 text-sm text-slate-500">
                        <div className="p-2 bg-slate-100 rounded-full"><Check className="w-4 h-4 text-slate-700" /></div>
                        <span>Official Warranty</span>
                    </div>
                    <div className="flex items-center gap-3 text-sm text-slate-500">
                        <div className="p-2 bg-slate-100 rounded-full"><Package className="w-4 h-4 text-slate-700" /></div>
                        <span>Secure Shipping</span>
                    </div>
                </div>

              </div>
          </div>

          {/* Product Specifications */}
          {id && <ProductSpecifications productId={id} />}

          {/* Reviews Section */}
          <section id="reviews" className="mt-12 lg:mt-20 border-t border-slate-200 pt-8 lg:pt-12">
            <div 
                className="flex items-center justify-between mb-8 cursor-pointer group"
                onClick={() => setIsReviewsOpen(!isReviewsOpen)}
            >
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-orange-50 rounded-lg group-hover:bg-orange-100 transition-colors">
                    <Star className="w-6 h-6 text-orange-600 fill-orange-600" />
                  </div>
                  <h2 className="text-xl lg:text-2xl font-bold text-slate-900">Customer Reviews</h2>
                  {approvedReviews.length > 0 && (
                    <Badge variant="secondary" className="bg-slate-100 text-slate-600">{approvedReviews.length}</Badge>
                  )}
                </div>
                <div className="p-2 rounded-full hover:bg-slate-100 transition-colors">
                    {isReviewsOpen ? <ChevronUp className="w-5 h-5 text-slate-500" /> : <ChevronDown className="w-5 h-5 text-slate-500" />}
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
                        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 pb-4">
              {/* Write Review Column */}
              <div className="lg:col-span-4">
                <Card className="border-slate-200 shadow-sm sticky top-24 overflow-hidden">
                              <div className="h-1.5 bg-orange-600" />
                  <CardContent className="p-6 sm:p-8">
                    <h3 className="font-bold text-xl text-slate-900 mb-2">Write a Review</h3>
                    <p className="text-sm text-slate-500 mb-8 leading-relaxed">
                      Share your experience with this product to help other professionals make informed decisions.
                    </p>
                    
                    {user ? (
                      <div className="space-y-6">
                        <div>
                          <label className="text-sm font-semibold text-slate-700 mb-3 block">
                            Rate this product
                          </label>
                          <div className="flex gap-2">
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
                                  className={`w-8 h-8 ${
                                    star <= (hoveredRating || rating)
                                      ? "text-amber-400 fill-amber-400 drop-shadow-sm"
                                      : "text-slate-200 fill-slate-50"
                                  }`}
                                />
                              </motion.button>
                            ))}
                          </div>
                          <div className="h-6 mt-1">
                             <AnimatePresence mode="wait">
                                {(hoveredRating || rating) > 0 && (
                                   <motion.span 
                                     key={hoveredRating || rating}
                                     initial={{ opacity: 0, y: -5 }}
                                     animate={{ opacity: 1, y: 0 }}
                                     exit={{ opacity: 0, y: 5 }}
                                                 className="text-sm font-medium text-orange-600"
                                   >
                                      {["Poor", "Fair", "Good", "Very Good", "Excellent"][(hoveredRating || rating) - 1]}
                                   </motion.span>
                                )}
                             </AnimatePresence>
                          </div>
                        </div>
                        
                        <div>
                          <label className="text-sm font-semibold text-slate-700 mb-3 block">
                            Your Review
                          </label>
                          <Textarea
                            placeholder="What did you like or dislike? How was the quality?"
                            value={reviewText}
                            onChange={(e) => setReviewText(e.target.value)}
                            rows={5}
                                        className="resize-none border-slate-200 focus:border-orange-600 focus:ring-orange-600/20 bg-slate-50/50 text-base"
                          />
                        </div>
                        
                        <Button
                          onClick={() => submitReviewMutation.mutate()}
                          disabled={submitReviewMutation.isPending}
                          className="w-full bg-slate-900 hover:bg-slate-800 text-white h-12 text-base font-medium shadow-lg shadow-slate-900/10"
                        >
                          {submitReviewMutation.isPending ? "Submitting..." : "Submit Review"}
                        </Button>
                      </div>
                    ) : (
                      <div className="text-center py-8 bg-slate-50 rounded-xl border border-dashed border-slate-200">
                        <User className="w-10 h-10 text-slate-300 mx-auto mb-3" />
                        <p className="text-slate-600 font-medium mb-4">
                          Please login to write a review
                        </p>
                                    <Button onClick={() => navigate("/login")} variant="outline" className="w-full border-slate-300 hover:border-orange-600 hover:text-orange-600">
                          Login Now
                        </Button>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </div>

              {/* Reviews List Column */}
              <div className="lg:col-span-8 space-y-6">
                {approvedReviews.length > 0 ? (
                  approvedReviews.map((review) => (
                    <motion.div 
                      key={review.id}
                      initial={{ opacity: 0, y: 10 }}
                      whileInView={{ opacity: 1, y: 0 }}
                      viewport={{ once: true }}
                    >
                      <Card className="border-slate-100 shadow-sm hover:shadow-md transition-all duration-300">
                        <CardContent className="p-6 sm:p-8">
                          <div className="flex items-start gap-4 sm:gap-6">
                            <Avatar className="w-12 h-12 border border-slate-100 shadow-sm">
                              <AvatarFallback className="bg-slate-100 text-slate-600 font-bold text-lg">
                                <User className="w-6 h-6" />
                              </AvatarFallback>
                            </Avatar>
                            <div className="flex-1">
                              <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-3 gap-2">
                                <div className="flex items-center gap-2">
                                  <div className="flex gap-0.5">
                                    {[1, 2, 3, 4, 5].map((star) => (
                                      <Star
                                        key={star}
                                        className={`w-4 h-4 ${
                                          star <= review.rating
                                            ? "text-amber-400 fill-amber-400"
                                            : "text-slate-200"
                                        }`}
                                      />
                                    ))}
                                  </div>
                                  <span className="text-sm font-semibold text-slate-900 ml-2">
                                    {["Poor", "Fair", "Good", "Very Good", "Excellent"][review.rating - 1]}
                                  </span>
                                </div>
                                <span className="text-xs text-slate-400 font-medium">
                                  {new Date(review.created_at).toLocaleDateString(undefined, { year: 'numeric', month: 'long', day: 'numeric' })}
                                </span>
                              </div>
                              
                              {review.review_text ? (
                                <p className="text-slate-600 leading-relaxed text-base">{review.review_text}</p>
                              ) : (
                                <p className="text-slate-400 italic text-sm">No written review</p>
                              )}
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    </motion.div>
                  ))
                ) : (
                  <div className="bg-white rounded-3xl border border-slate-200 p-16 text-center shadow-sm">
                    <div className="w-20 h-20 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-6 border border-slate-100">
                      <MessageSquare className="w-10 h-10 text-slate-300" />
                    </div>
                    <h3 className="text-xl font-bold text-slate-900 mb-3">No reviews yet</h3>
                    <p className="text-slate-500 max-w-md mx-auto leading-relaxed">
                      Be the first to share your experience with this product. Your feedback is valuable to us and helps other professionals.
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
      <div className="fixed bottom-0 left-0 right-0 p-4 bg-white border-t border-slate-200 lg:hidden z-50 shadow-[0_-4px_20px_-5px_rgba(0,0,0,0.1)] safe-area-bottom">
        <div className="flex gap-3">
          <Button 
            variant="outline" 
            className="flex-1 h-12 border-slate-300 text-slate-700 font-semibold text-base" 
            onClick={handleAddToCart}
            disabled={product.stock_quantity === 0 || addToCartMutation.isPending}
          >
            Add to Cart
          </Button>
          <Button 
            className="flex-1 h-12 bg-orange-600 text-white font-bold shadow-md text-base" 
            onClick={handleBuyNow}
            disabled={product.stock_quantity === 0}
          >
            Buy Now
          </Button>
        </div>
      </div>

      <PublicFooter />
    </div>
  );
};

export default ProductDetail;