import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { PublicNavbar } from "@/components/PublicNavbar";
import { PublicFooter } from "@/components/PublicFooter";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { WishlistButton } from "@/components/WishlistButton";
import { ShopHeroSlider } from "@/components/shop/ShopHeroSlider";
import { 
  ShoppingCart, 
  Package, 
  Search, 
  Star, 
  Grid3X3,
  LayoutGrid,
  SlidersHorizontal,
  X,
  Eye,
  Heart,
  Sparkles,
  Truck,
  Shield,
  RefreshCw,
  ChevronRight,
  Percent,
  Zap,
  ArrowRight
} from "lucide-react";
import { Input } from "@/components/ui/input";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { Separator } from "@/components/ui/separator";
import { motion, AnimatePresence } from "framer-motion";

interface Product {
  id: string;
  name: string;
  description: string | null;
  price: number;
  stock_quantity: number;
  images: string[] | null;
  category_id: string | null;
  is_highlighted: boolean;
  categories: { name: string } | null;
  gst_percentage?: number;
}

interface Category {
  id: string;
  name: string;
  description: string | null;
}

const Shop = () => {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [sortBy, setSortBy] = useState("newest");
  const [gridView, setGridView] = useState<"grid" | "large">("grid");
  const [hoveredProduct, setHoveredProduct] = useState<string | null>(null);
  const navigate = useNavigate();
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const { data: products, isLoading: productsLoading } = useQuery({
    queryKey: ["public-products"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("products")
        .select("*, categories(name)")
        .gt("stock_quantity", 0)
        .order("created_at", { ascending: false });

      if (error) throw error;
      return data as Product[];
    },
  });

  const { data: categories } = useQuery({
    queryKey: ["public-categories"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("categories")
        .select("*")
        .order("name", { ascending: true });

      if (error) throw error;
      return data as Category[];
    },
  });

  const addToCartMutation = useMutation({
    mutationFn: async (productId: string) => {
      if (!user) throw new Error("Not authenticated");

      const { data: existingItem } = await supabase
        .from("cart_items")
        .select("id, quantity")
        .eq("user_id", user.id)
        .eq("product_id", productId)
        .maybeSingle();

      if (existingItem) {
        const { error } = await supabase
          .from("cart_items")
          .update({ quantity: existingItem.quantity + 1 })
          .eq("id", existingItem.id);
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from("cart_items")
          .insert({ user_id: user.id, product_id: productId, quantity: 1 });
        if (error) throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["cart-count"] });
      queryClient.invalidateQueries({ queryKey: ["cart-items"] });
      toast.success("Added to cart!");
    },
    onError: () => toast.error("Failed to add to cart"),
  });

  const handleAddToCart = (e: React.MouseEvent, productId: string) => {
    e.stopPropagation();
    if (!user) {
      toast.info("Please login to add items to cart", {
        action: { label: "Login", onClick: () => navigate("/login") },
      });
      return;
    }
    addToCartMutation.mutate(productId);
  };

  // Filter and sort products
  const filteredProducts = products
    ?.filter((product) => {
      const matchesSearch = 
        product.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        product.description?.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesCategory = !selectedCategory || product.category_id === selectedCategory;
      return matchesSearch && matchesCategory;
    })
    ?.sort((a, b) => {
      switch (sortBy) {
        case "price-low":
          return a.price - b.price;
        case "price-high":
          return b.price - a.price;
        case "name":
          return a.name.localeCompare(b.name);
        case "popular":
          return (b.is_highlighted ? 1 : 0) - (a.is_highlighted ? 1 : 0);
        default:
          return 0;
      }
    });

  const featuredProducts = products?.filter((p) => p.is_highlighted) || [];

  // Enhanced Product Card Component - Shopify Dawn Theme Style
  const ProductCard = ({ product, index }: { product: Product; index?: number }) => {
    const isHovered = hoveredProduct === product.id;
    
    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: index ? index * 0.05 : 0 }}
        onClick={() => navigate(`/product/${product.id}`)}
        onMouseEnter={() => setHoveredProduct(product.id)}
        onMouseLeave={() => setHoveredProduct(null)}
        className="group cursor-pointer"
      >
        {/* Image Container */}
        <div className="relative aspect-[3/4] overflow-hidden rounded-xl bg-gradient-to-br from-secondary/80 to-secondary mb-4 shadow-sm group-hover:shadow-xl transition-all duration-500">
          {product.images && product.images.length > 0 ? (
            <>
              <img
                src={product.images[0]}
                alt={product.name}
                className="w-full h-full object-cover transition-all duration-700 group-hover:scale-110"
              />
              {product.images[1] && (
                <img
                  src={product.images[1]}
                  alt={product.name}
                  className="absolute inset-0 w-full h-full object-cover opacity-0 group-hover:opacity-100 transition-opacity duration-500"
                />
              )}
              {/* Overlay gradient on hover */}
              <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
            </>
          ) : (
            <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-secondary to-muted">
              <Package className="w-16 h-16 text-muted-foreground/30" />
            </div>
          )}
          
          {/* Top Badges */}
          <div className="absolute top-3 left-3 flex flex-col gap-2 z-10">
            {product.is_highlighted && (
              <Badge className="bg-primary text-primary-foreground text-[10px] font-semibold px-2.5 py-1 rounded-full shadow-lg">
                <Sparkles className="w-3 h-3 mr-1" />
                BESTSELLER
              </Badge>
            )}
            {product.stock_quantity <= 5 && (
              <Badge className="bg-destructive text-destructive-foreground text-[10px] font-semibold px-2.5 py-1 rounded-full shadow-lg">
                <Zap className="w-3 h-3 mr-1" />
                ONLY {product.stock_quantity} LEFT
              </Badge>
            )}
          </div>

          {/* Quick Actions - Top Right */}
          <div className="absolute top-3 right-3 z-10 flex flex-col gap-2">
            <motion.div
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: isHovered ? 1 : 0, scale: isHovered ? 1 : 0.8 }}
              transition={{ duration: 0.2 }}
            >
              <WishlistButton productId={product.id} size="sm" />
            </motion.div>
            <motion.button
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: isHovered ? 1 : 0, scale: isHovered ? 1 : 0.8 }}
              transition={{ duration: 0.2, delay: 0.05 }}
              onClick={(e) => {
                e.stopPropagation();
                navigate(`/product/${product.id}`);
              }}
              className="w-9 h-9 rounded-full bg-background/90 backdrop-blur-sm flex items-center justify-center shadow-lg hover:bg-background transition-colors"
            >
              <Eye className="w-4 h-4 text-foreground" />
            </motion.button>
          </div>

          {/* Quick Add Button - Bottom */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: isHovered ? 1 : 0, y: isHovered ? 0 : 20 }}
            transition={{ duration: 0.3 }}
            className="absolute bottom-0 left-0 right-0 p-4"
          >
            <Button
              onClick={(e) => handleAddToCart(e, product.id)}
              className="w-full bg-background hover:bg-background/90 text-foreground font-semibold h-12 rounded-full shadow-xl backdrop-blur-sm border border-border/50"
            >
              <ShoppingCart className="w-4 h-4 mr-2" />
              Add to Cart
            </Button>
          </motion.div>
        </div>

        {/* Product Info */}
        <div className="space-y-2 px-1">
          {product.categories && (
            <p className="text-xs text-primary font-medium uppercase tracking-widest">
              {product.categories.name}
            </p>
          )}
          <h3 className="font-semibold text-foreground text-sm sm:text-base leading-snug group-hover:text-primary transition-colors duration-300 line-clamp-2">
            {product.name}
          </h3>
          <div className="flex items-center gap-2">
            <p className="text-lg sm:text-xl font-bold text-foreground">
              ₹{product.price.toLocaleString("en-IN")}
            </p>
            {product.gst_percentage && (
              <span className="text-xs text-muted-foreground">
                +{product.gst_percentage}% GST
              </span>
            )}
          </div>
          {/* Stock indicator */}
          {product.stock_quantity <= 10 && product.stock_quantity > 0 && (
            <p className="text-xs text-destructive font-medium">
              Only {product.stock_quantity} left in stock
            </p>
          )}
        </div>
      </motion.div>
    );
  };

  // Category Card Component
  const CategoryCard = ({ category, count }: { category: Category; count: number }) => (
    <motion.button
      whileHover={{ scale: 1.02 }}
      whileTap={{ scale: 0.98 }}
      onClick={() => setSelectedCategory(category.id)}
      className={`relative p-6 rounded-2xl text-left transition-all duration-300 border-2 ${
        selectedCategory === category.id
          ? "bg-primary text-primary-foreground border-primary shadow-lg shadow-primary/25"
          : "bg-card hover:bg-secondary border-border hover:border-primary/50"
      }`}
    >
      <h4 className="font-semibold text-base mb-1">{category.name}</h4>
      <p className={`text-sm ${selectedCategory === category.id ? "text-primary-foreground/80" : "text-muted-foreground"}`}>
        {count} products
      </p>
      <ChevronRight className={`absolute right-4 top-1/2 -translate-y-1/2 w-5 h-5 transition-transform group-hover:translate-x-1 ${
        selectedCategory === category.id ? "text-primary-foreground" : "text-muted-foreground"
      }`} />
    </motion.button>
  );

  // Filter Sidebar Content
  const FilterContent = () => (
    <div className="space-y-8">
      {/* Categories */}
      <div>
        <h4 className="font-bold text-foreground mb-4 text-sm uppercase tracking-wider">Categories</h4>
        <div className="space-y-1">
          <button
            onClick={() => setSelectedCategory(null)}
            className={`w-full text-left px-4 py-3 rounded-xl text-sm font-medium transition-all duration-200 ${
              !selectedCategory 
                ? "bg-primary text-primary-foreground shadow-lg shadow-primary/20" 
                : "hover:bg-secondary text-foreground hover:translate-x-1"
            }`}
          >
            All Products ({products?.length || 0})
          </button>
          {categories?.map((category) => {
            const count = products?.filter(p => p.category_id === category.id).length || 0;
            return (
              <button
                key={category.id}
                onClick={() => setSelectedCategory(category.id)}
                className={`w-full text-left px-4 py-3 rounded-xl text-sm font-medium transition-all duration-200 ${
                  selectedCategory === category.id 
                    ? "bg-primary text-primary-foreground shadow-lg shadow-primary/20" 
                    : "hover:bg-secondary text-foreground hover:translate-x-1"
                }`}
              >
                {category.name} ({count})
              </button>
            );
          })}
        </div>
      </div>

      {/* Price Range */}
      <div>
        <h4 className="font-bold text-foreground mb-4 text-sm uppercase tracking-wider">Price Range</h4>
        <div className="space-y-2">
          {[
            { label: "Under ₹500", min: 0, max: 500 },
            { label: "₹500 - ₹1,000", min: 500, max: 1000 },
            { label: "₹1,000 - ₹5,000", min: 1000, max: 5000 },
            { label: "₹5,000+", min: 5000, max: Infinity },
          ].map((range) => (
            <button
              key={range.label}
              className="w-full text-left px-4 py-2.5 rounded-lg text-sm text-muted-foreground hover:text-foreground hover:bg-secondary transition-all"
            >
              {range.label}
            </button>
          ))}
        </div>
      </div>

      {/* Trust Badges */}
      <div className="pt-6 border-t border-border">
        <div className="space-y-4">
          <div className="flex items-center gap-3 text-sm text-muted-foreground">
            <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
              <Truck className="w-5 h-5 text-primary" />
            </div>
            <div>
              <p className="font-medium text-foreground">Free Shipping</p>
              <p className="text-xs">On orders over ₹999</p>
            </div>
          </div>
          <div className="flex items-center gap-3 text-sm text-muted-foreground">
            <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
              <Shield className="w-5 h-5 text-primary" />
            </div>
            <div>
              <p className="font-medium text-foreground">Secure Payment</p>
              <p className="text-xs">100% secure checkout</p>
            </div>
          </div>
          <div className="flex items-center gap-3 text-sm text-muted-foreground">
            <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
              <RefreshCw className="w-5 h-5 text-primary" />
            </div>
            <div>
              <p className="font-medium text-foreground">Easy Returns</p>
              <p className="text-xs">7-day return policy</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <PublicNavbar />

      <main className="flex-1 pt-16">
        {/* Hero Slider */}
        {!searchQuery && !selectedCategory && <ShopHeroSlider />}

        {/* Promotional Banner */}
        <section className="bg-gradient-to-r from-primary via-accent to-primary overflow-hidden">
          <div className="max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex items-center justify-center gap-4 py-3 text-primary-foreground">
              <Truck className="w-5 h-5 hidden sm:block" />
              <p className="text-sm font-medium text-center">
                <span className="font-bold">FREE SHIPPING</span> on all orders over ₹999 | 
                <span className="ml-2 font-bold">SAVE 10%</span> on your first order with code: <span className="font-mono bg-white/20 px-2 py-0.5 rounded">WELCOME10</span>
              </p>
              <Percent className="w-5 h-5 hidden sm:block" />
            </div>
          </div>
        </section>

        {/* Category Quick Navigation */}
        {categories && categories.length > 0 && !searchQuery && !selectedCategory && (
          <section className="py-8 sm:py-12 border-b border-border">
            <div className="max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-2xl font-bold text-foreground">Shop by Category</h2>
                <Button variant="ghost" className="text-primary font-medium">
                  View All <ChevronRight className="w-4 h-4 ml-1" />
                </Button>
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
                {categories.slice(0, 5).map((category) => (
                  <CategoryCard 
                    key={category.id} 
                    category={category} 
                    count={products?.filter(p => p.category_id === category.id).length || 0}
                  />
                ))}
              </div>
            </div>
          </section>
        )}

        {/* Shop Header */}
        <section className="border-b border-border bg-gradient-to-b from-secondary/30 to-transparent">
          <div className="max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8 py-10 sm:py-14">
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="text-center"
            >
              <Badge variant="outline" className="mb-4 px-4 py-1.5 text-xs font-semibold uppercase tracking-wider border-primary/30 text-primary">
                {selectedCategory 
                  ? categories?.find(c => c.id === selectedCategory)?.name 
                  : "Our Collection"}
              </Badge>
              <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold text-foreground tracking-tight mb-4">
                {selectedCategory 
                  ? categories?.find(c => c.id === selectedCategory)?.name 
                  : "Shop All Products"}
              </h1>
              <p className="text-muted-foreground text-lg sm:text-xl max-w-2xl mx-auto leading-relaxed">
                Discover our curated collection of premium 3D printed products, designed and crafted for excellence.
              </p>
            </motion.div>
          </div>
        </section>

        {/* Filters & Sort Bar */}
        <section className="sticky top-16 z-30 bg-background/80 backdrop-blur-xl border-b border-border shadow-sm">
          <div className="max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex items-center justify-between h-16 sm:h-18 gap-4">
              {/* Left: Filter Button (Mobile) & Search */}
              <div className="flex items-center gap-3 flex-1">
                {/* Mobile Filter Sheet */}
                <Sheet>
                  <SheetTrigger asChild>
                    <Button variant="outline" size="sm" className="lg:hidden h-10 px-4 gap-2 rounded-full border-2">
                      <SlidersHorizontal className="w-4 h-4" />
                      <span className="hidden sm:inline font-medium">Filters</span>
                    </Button>
                  </SheetTrigger>
                  <SheetContent side="left" className="w-[320px] p-6">
                    <SheetHeader>
                      <SheetTitle className="text-left">Filters</SheetTitle>
                    </SheetHeader>
                    <div className="mt-8">
                      <FilterContent />
                    </div>
                  </SheetContent>
                </Sheet>

                {/* Search */}
                <div className="relative flex-1 max-w-md">
                  <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <Input
                    placeholder="Search products..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-11 h-10 text-sm bg-secondary/50 border-2 border-transparent focus-visible:border-primary focus-visible:ring-0 rounded-full"
                  />
                  <AnimatePresence>
                    {searchQuery && (
                      <motion.button
                        initial={{ opacity: 0, scale: 0.8 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.8 }}
                        onClick={() => setSearchQuery("")}
                        className="absolute right-3 top-1/2 -translate-y-1/2 w-6 h-6 rounded-full bg-muted flex items-center justify-center hover:bg-muted-foreground/20 transition-colors"
                      >
                        <X className="w-3 h-3" />
                      </motion.button>
                    )}
                  </AnimatePresence>
                </div>
              </div>

              {/* Right: Sort & View Options */}
              <div className="flex items-center gap-3">
                <Select value={sortBy} onValueChange={setSortBy}>
                  <SelectTrigger className="w-[140px] sm:w-[180px] h-10 text-sm border-2 border-transparent bg-secondary/50 rounded-full focus:ring-0 focus:border-primary">
                    <SelectValue placeholder="Sort by" />
                  </SelectTrigger>
                  <SelectContent className="rounded-xl">
                    <SelectItem value="newest">Newest First</SelectItem>
                    <SelectItem value="popular">Most Popular</SelectItem>
                    <SelectItem value="price-low">Price: Low to High</SelectItem>
                    <SelectItem value="price-high">Price: High to Low</SelectItem>
                    <SelectItem value="name">Name: A to Z</SelectItem>
                  </SelectContent>
                </Select>

                {/* Grid View Toggle */}
                <div className="hidden sm:flex items-center bg-secondary/50 rounded-full p-1">
                  <button
                    onClick={() => setGridView("grid")}
                    className={`p-2 rounded-full transition-all duration-200 ${
                      gridView === "grid" ? "bg-background shadow-md" : "hover:bg-background/50"
                    }`}
                  >
                    <Grid3X3 className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => setGridView("large")}
                    className={`p-2 rounded-full transition-all duration-200 ${
                      gridView === "large" ? "bg-background shadow-md" : "hover:bg-background/50"
                    }`}
                  >
                    <LayoutGrid className="w-4 h-4" />
                  </button>
                </div>

                {/* Product Count */}
                <Badge variant="secondary" className="hidden md:flex h-10 px-4 rounded-full font-medium">
                  {filteredProducts?.length || 0} products
                </Badge>
              </div>
            </div>
          </div>
        </section>

        {/* Main Content */}
        <section className="py-10 sm:py-14">
          <div className="max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex gap-10 lg:gap-14">
              {/* Desktop Sidebar */}
              <aside className="hidden lg:block w-72 flex-shrink-0">
                <div className="sticky top-40">
                  <FilterContent />
                </div>
              </aside>

              {/* Products Grid */}
              <div className="flex-1">
                {/* Active Filters */}
                <AnimatePresence>
                  {(selectedCategory || searchQuery) && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: "auto" }}
                      exit={{ opacity: 0, height: 0 }}
                      className="flex items-center gap-2 mb-8 flex-wrap"
                    >
                      <span className="text-sm text-muted-foreground mr-2">Active filters:</span>
                      {selectedCategory && (
                        <Badge 
                          variant="secondary" 
                          className="px-4 py-2 text-sm cursor-pointer hover:bg-destructive/10 hover:text-destructive transition-colors rounded-full group"
                          onClick={() => setSelectedCategory(null)}
                        >
                          {categories?.find(c => c.id === selectedCategory)?.name}
                          <X className="w-3.5 h-3.5 ml-2 group-hover:text-destructive" />
                        </Badge>
                      )}
                      {searchQuery && (
                        <Badge 
                          variant="secondary" 
                          className="px-4 py-2 text-sm cursor-pointer hover:bg-destructive/10 hover:text-destructive transition-colors rounded-full group"
                          onClick={() => setSearchQuery("")}
                        >
                          "{searchQuery}"
                          <X className="w-3.5 h-3.5 ml-2 group-hover:text-destructive" />
                        </Badge>
                      )}
                      <button 
                        onClick={() => { setSelectedCategory(null); setSearchQuery(""); }}
                        className="text-sm text-primary hover:text-primary/80 font-medium ml-2 flex items-center gap-1"
                      >
                        Clear all <X className="w-3.5 h-3.5" />
                      </button>
                    </motion.div>
                  )}
                </AnimatePresence>

                {/* Featured Products Section */}
                {featuredProducts.length > 0 && !selectedCategory && !searchQuery && (
                  <div className="mb-14">
                    <div className="flex items-center justify-between mb-8">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                          <Star className="w-5 h-5 text-primary fill-primary" />
                        </div>
                        <div>
                          <h2 className="text-2xl font-bold text-foreground">Featured Products</h2>
                          <p className="text-sm text-muted-foreground">Handpicked favorites our customers love</p>
                        </div>
                      </div>
                      <Button variant="ghost" className="text-primary font-medium hidden sm:flex">
                        View All <ArrowRight className="w-4 h-4 ml-2" />
                      </Button>
                    </div>
                    <div className={`grid gap-6 sm:gap-8 ${
                      gridView === "large" 
                        ? "grid-cols-1 sm:grid-cols-2" 
                        : "grid-cols-2 sm:grid-cols-3"
                    }`}>
                      {featuredProducts.slice(0, gridView === "large" ? 4 : 6).map((product, index) => (
                        <ProductCard key={product.id} product={product} index={index} />
                      ))}
                    </div>
                    <Separator className="mt-14" />
                  </div>
                )}

                {/* Loading State */}
                {productsLoading ? (
                  <div className={`grid gap-6 sm:gap-8 ${
                    gridView === "large" 
                      ? "grid-cols-1 sm:grid-cols-2 lg:grid-cols-3" 
                      : "grid-cols-2 sm:grid-cols-3 lg:grid-cols-4"
                  }`}>
                    {[...Array(8)].map((_, i) => (
                      <div key={i} className="space-y-4">
                        <Skeleton className="aspect-[3/4] rounded-xl" />
                        <Skeleton className="h-3 w-1/3" />
                        <Skeleton className="h-5 w-3/4" />
                        <Skeleton className="h-6 w-1/4" />
                      </div>
                    ))}
                  </div>
                ) : filteredProducts && filteredProducts.length > 0 ? (
                  <>
                    {/* All Products Header */}
                    {(selectedCategory || searchQuery || featuredProducts.length > 0) && (
                      <div className="flex items-center justify-between mb-8">
                        <h2 className="text-2xl font-bold text-foreground">
                          {selectedCategory 
                            ? `All ${categories?.find(c => c.id === selectedCategory)?.name}`
                            : searchQuery 
                              ? `Search Results for "${searchQuery}"` 
                              : "All Products"}
                        </h2>
                        <span className="text-sm text-muted-foreground">
                          {filteredProducts.length} products
                        </span>
                      </div>
                    )}
                    
                    {/* Products Grid */}
                    <div className={`grid gap-6 sm:gap-8 ${
                      gridView === "large" 
                        ? "grid-cols-1 sm:grid-cols-2 lg:grid-cols-3" 
                        : "grid-cols-2 sm:grid-cols-3 lg:grid-cols-4"
                    }`}>
                      {filteredProducts
                        .filter(p => !p.is_highlighted || selectedCategory || searchQuery)
                        .map((product, index) => (
                          <ProductCard key={product.id} product={product} index={index} />
                        ))}
                    </div>
                  </>
                ) : (
                  /* Empty State */
                  <motion.div 
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="text-center py-24"
                  >
                    <div className="w-24 h-24 bg-gradient-to-br from-secondary to-muted rounded-full flex items-center justify-center mx-auto mb-8">
                      <Package className="w-12 h-12 text-muted-foreground" />
                    </div>
                    <h2 className="text-3xl font-bold text-foreground mb-4">
                      {searchQuery ? "No products found" : "No products yet"}
                    </h2>
                    <p className="text-muted-foreground max-w-md mx-auto mb-8 text-lg">
                      {searchQuery
                        ? "Try adjusting your search or filters to find what you're looking for."
                        : "Check back soon for our new collection."}
                    </p>
                    {(searchQuery || selectedCategory) && (
                      <Button
                        size="lg"
                        onClick={() => {
                          setSearchQuery("");
                          setSelectedCategory(null);
                        }}
                        className="rounded-full px-8"
                      >
                        Clear Filters
                      </Button>
                    )}
                  </motion.div>
                )}

                {/* Newsletter CTA */}
                {!productsLoading && filteredProducts && filteredProducts.length > 0 && (
                  <div className="mt-20 bg-gradient-to-r from-primary/10 via-accent/10 to-primary/10 rounded-3xl p-8 sm:p-12 text-center">
                    <h3 className="text-2xl sm:text-3xl font-bold text-foreground mb-3">
                      Stay Updated
                    </h3>
                    <p className="text-muted-foreground mb-6 max-w-lg mx-auto">
                      Subscribe to get notified about new products, exclusive offers, and special discounts.
                    </p>
                    <div className="flex flex-col sm:flex-row gap-3 max-w-md mx-auto">
                      <Input 
                        placeholder="Enter your email" 
                        className="h-12 rounded-full border-2 border-border focus-visible:border-primary" 
                      />
                      <Button size="lg" className="rounded-full px-8 h-12">
                        Subscribe
                      </Button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </section>
      </main>

      <PublicFooter />
    </div>
  );
};

export default Shop;
