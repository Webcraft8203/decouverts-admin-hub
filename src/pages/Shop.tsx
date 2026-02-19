import { useState, useEffect, useRef, useCallback } from "react";
import { usePageSEO } from "@/hooks/usePageSEO";
import { BreadcrumbSchema } from "@/components/SEOSchemas";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { PublicNavbar } from "@/components/PublicNavbar";
import { PublicFooter } from "@/components/PublicFooter";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { WishlistButton } from "@/components/WishlistButton";
import { ShareMenu } from "@/components/ShareMenu";
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
  Check,
  Eye,
  ArrowUpDown,
  Loader2,
  Sparkles,
  ChevronRight,
  Zap,
  TrendingUp,
  Filter,
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
  sku: string | null;
  slug: string | null;
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
  const [addedProductId, setAddedProductId] = useState<string | null>(null);
  const [searchFocused, setSearchFocused] = useState(false);
  const navigate = useNavigate();
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const categoryScrollRef = useRef<HTMLDivElement>(null);

  const { data: products, isLoading: productsLoading } = useQuery({
    queryKey: ["public-products"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("products")
        .select("*, categories(name), sku, slug")
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

  const filteredProducts = products
    ?.filter((product) => {
      const matchesSearch = 
        product.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        product.description?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        product.sku?.toLowerCase().includes(searchQuery.toLowerCase());
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
        default:
          return 0;
      }
    });

  const selectedCategoryName = selectedCategory 
    ? categories?.find(c => c.id === selectedCategory)?.name 
    : null;

  usePageSEO({
    title: selectedCategoryName
      ? `${selectedCategoryName} | Buy Online India | DECOUVERTES`
      : "Shop Premium 3D Printers & Industrial Products | DECOUVERTES",
    description: selectedCategoryName
      ? `Shop ${selectedCategoryName} from DECOUVERTES. Premium quality engineering & industrial products at best prices in India. Free shipping available.`
      : "Browse DECOUVERTES collection of industrial 3D printers, engineering tools & premium products. Best prices in India with free shipping.",
    path: "/shop",
  });

  useEffect(() => {
    if (!filteredProducts?.length) return;
    const itemListLd = {
      "@context": "https://schema.org",
      "@type": "ItemList",
      name: selectedCategoryName ? `${selectedCategoryName} Products` : "All Products",
      numberOfItems: filteredProducts.length,
      itemListElement: filteredProducts.slice(0, 30).map((p, i) => ({
        "@type": "ListItem",
        position: i + 1,
        url: `https://admin-craft-engine.lovable.app/product/${p.slug || p.id}`,
        name: p.name,
        image: p.images?.[0],
      })),
    };
    const script = document.createElement("script");
    script.id = "shop-itemlist-jsonld";
    script.type = "application/ld+json";
    script.textContent = JSON.stringify(itemListLd);
    document.head.appendChild(script);
    return () => { document.getElementById("shop-itemlist-jsonld")?.remove(); };
  }, [filteredProducts, selectedCategoryName]);

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
    onSuccess: (_data, productId) => {
      queryClient.invalidateQueries({ queryKey: ["cart-count"] });
      queryClient.invalidateQueries({ queryKey: ["cart-items"] });
      setAddedProductId(productId);
      toast.success("Added to cart!");
      setTimeout(() => setAddedProductId(null), 1500);
    },
    onError: () => toast.error("Failed to add to cart"),
  });

  const handleAddToCart = (e: React.MouseEvent, productId: string) => {
    e.stopPropagation();
    e.preventDefault();
    if (!user) {
      toast.info("Please login to add items to cart", {
        action: { label: "Login", onClick: () => navigate("/login") },
      });
      return;
    }
    addToCartMutation.mutate(productId);
  };

  const featuredProducts = products?.filter((p) => p.is_highlighted) || [];

  // Category count map
  const categoryCounts = products?.reduce((acc, p) => {
    if (p.category_id) {
      acc[p.category_id] = (acc[p.category_id] || 0) + 1;
    }
    return acc;
  }, {} as Record<string, number>) || {};

  const ProductCard = ({ product, index }: { product: Product; index: number }) => {
    const isAdded = addedProductId === product.id;
    
    return (
      <div
        onClick={() => navigate(`/product/${product.slug || product.id}`)}
        className="group relative flex flex-col h-full bg-card rounded-2xl overflow-hidden cursor-pointer border border-border/40 hover:border-primary/30 transition-all duration-500 hover:shadow-[0_20px_60px_-15px_rgba(0,0,0,0.1)] hover:-translate-y-1"
        style={{ animationDelay: `${index * 50}ms` }}
      >
        {/* Image */}
        <div className="relative aspect-[4/5] overflow-hidden bg-gradient-to-br from-secondary/20 to-secondary/5">
          {product.images && product.images.length > 0 ? (
            <>
              <img
                src={product.images[0]}
                alt={`${product.name} - ${product.categories?.name || "Product"} by DECOUVERTES`}
                className="w-full h-full object-cover transition-all duration-700 ease-out group-hover:scale-105"
                loading="lazy"
              />
              {product.images[1] && (
                <img
                  src={product.images[1]}
                  alt={`${product.name} alternate view`}
                  className="absolute inset-0 w-full h-full object-cover opacity-0 group-hover:opacity-100 transition-opacity duration-500"
                  loading="lazy"
                />
              )}
            </>
          ) : (
            <div className="w-full h-full flex items-center justify-center">
              <Package className="w-12 h-12 text-muted-foreground/10" />
            </div>
          )}
          
          {/* Badges */}
          <div className="absolute top-3 left-3 flex flex-col gap-1.5 z-10">
            {product.is_highlighted && (
              <span className="inline-flex items-center gap-1.5 bg-gradient-to-r from-primary to-primary/90 text-primary-foreground text-[10px] font-bold px-3 py-1.5 rounded-full shadow-lg shadow-primary/25">
                <Sparkles className="w-3 h-3" />
                BEST SELLER
              </span>
            )}
            {product.stock_quantity <= 5 && (
              <span className="inline-flex items-center bg-destructive/90 backdrop-blur-sm text-destructive-foreground text-[10px] font-bold px-3 py-1.5 rounded-full shadow-lg">
                <Zap className="w-3 h-3 mr-1" />
                Only {product.stock_quantity} left
              </span>
            )}
          </div>

          {/* Hover Actions - top right */}
          <div className="absolute top-3 right-3 z-10 flex flex-col gap-2 opacity-0 group-hover:opacity-100 transition-all duration-300 translate-x-2 group-hover:translate-x-0">
            <div className="bg-card/90 backdrop-blur-md rounded-full p-2 shadow-lg border border-border/20 hover:scale-110 transition-transform duration-200">
              <WishlistButton productId={product.id} size="sm" />
            </div>
            <div className="hover:scale-110 transition-transform duration-200">
              <ShareMenu
                url={`${window.location.origin}/product/${product.slug || product.id}`}
                title={product.name}
                description={product.description || undefined}
              />
            </div>
          </div>

          {/* Quick View overlay on hover */}
          <div className="absolute inset-0 bg-gradient-to-t from-foreground/60 via-foreground/0 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
          <div className="absolute bottom-0 left-0 right-0 p-4 opacity-0 group-hover:opacity-100 translate-y-4 group-hover:translate-y-0 transition-all duration-400 z-10 flex gap-2">
            <Button
              type="button"
              onClick={(e) => handleAddToCart(e, product.id)}
              disabled={addToCartMutation.isPending || isAdded}
              className={`flex-1 h-10 rounded-xl font-semibold text-xs shadow-xl transition-all duration-300 ${
                isAdded 
                  ? "bg-green-500 hover:bg-green-500 text-white" 
                  : "bg-card/95 backdrop-blur-md hover:bg-card text-foreground border border-border/20"
              }`}
              size="sm"
            >
              {isAdded ? (
                <>
                  <Check className="w-4 h-4 mr-1.5" />
                  Added!
                </>
              ) : addToCartMutation.isPending ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <>
                  <ShoppingCart className="w-4 h-4 mr-1.5" />
                  Add to Cart
                </>
              )}
            </Button>
            <Button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                navigate(`/product/${product.slug || product.id}`);
              }}
              variant="secondary"
              className="h-10 px-3 rounded-xl bg-card/95 backdrop-blur-md hover:bg-card text-foreground shadow-xl border border-border/20"
              size="sm"
            >
              <Eye className="w-4 h-4" />
            </Button>
          </div>
        </div>

        {/* Info */}
        <div className="flex flex-col flex-1 p-4">
          {product.categories && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                setSelectedCategory(product.category_id);
                window.scrollTo({ top: 0, behavior: 'smooth' });
              }}
              className="text-[10px] text-primary/80 font-semibold uppercase tracking-[0.15em] mb-1.5 hover:text-primary transition-colors text-left w-fit"
            >
              {product.categories.name}
            </button>
          )}
          <h3 className="font-semibold text-foreground text-sm leading-snug mb-1 line-clamp-2 min-h-[2.5em] group-hover:text-primary transition-colors duration-300">
            {product.name}
          </h3>
          {product.sku && (
            <span className="text-[9px] font-mono text-muted-foreground/40 mb-2">
              {product.sku}
            </span>
          )}
          
          <div className="mt-auto pt-3 border-t border-border/20">
            <div className="flex items-center justify-between gap-2">
              <p className="text-lg font-bold text-foreground tracking-tight">
                ₹{product.price.toLocaleString("en-IN")}
              </p>
              {product.stock_quantity <= 10 && product.stock_quantity > 5 && (
                <span className="text-[9px] text-warning font-semibold bg-warning/10 px-2 py-0.5 rounded-full">
                  {product.stock_quantity} left
                </span>
              )}
            </div>

            {/* Mobile Add to Cart */}
            <Button
              type="button"
              onClick={(e) => handleAddToCart(e, product.id)}
              disabled={addToCartMutation.isPending || isAdded}
              className={`w-full mt-3 h-9 rounded-xl font-semibold text-xs transition-all duration-300 md:hidden ${
                isAdded
                  ? "bg-green-500 hover:bg-green-500 text-white"
                  : "bg-primary hover:bg-primary/90 text-primary-foreground"
              }`}
              size="sm"
            >
              {isAdded ? (
                <>
                  <Check className="w-3.5 h-3.5 mr-1.5" />
                  Added!
                </>
              ) : (
                <>
                  <ShoppingCart className="w-3.5 h-3.5 mr-1.5" />
                  Add to Cart
                </>
              )}
            </Button>
          </div>
        </div>
      </div>
    );
  };

  const FilterContent = () => (
    <div className="space-y-5">
      <div>
        <h4 className="font-semibold text-foreground mb-3 text-xs uppercase tracking-[0.15em]">Categories</h4>
        <div className="space-y-0.5">
          <button
            onClick={() => setSelectedCategory(null)}
            className={`w-full text-left px-3 py-2.5 rounded-xl text-sm transition-all duration-200 flex items-center justify-between ${
              !selectedCategory 
                ? "bg-primary/10 text-primary font-medium" 
                : "text-muted-foreground hover:bg-secondary/60 hover:text-foreground"
            }`}
          >
            <span>All Products</span>
            <span className="flex items-center gap-2">
              <span className="text-[10px] font-mono text-muted-foreground">{products?.length || 0}</span>
              {!selectedCategory && <Check className="w-3.5 h-3.5" />}
            </span>
          </button>
          {categories?.map((category) => (
            <button
              key={category.id}
              onClick={() => setSelectedCategory(category.id)}
              className={`w-full text-left px-3 py-2.5 rounded-xl text-sm transition-all duration-200 flex items-center justify-between ${
                selectedCategory === category.id 
                  ? "bg-primary/10 text-primary font-medium" 
                  : "text-muted-foreground hover:bg-secondary/60 hover:text-foreground"
              }`}
            >
              <span>{category.name}</span>
              <span className="flex items-center gap-2">
                <span className="text-[10px] font-mono text-muted-foreground">{categoryCounts[category.id] || 0}</span>
                {selectedCategory === category.id && <Check className="w-3.5 h-3.5" />}
              </span>
            </button>
          ))}
        </div>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <BreadcrumbSchema items={[
        { name: "Home", url: "/" },
        { name: "Shop", url: "/shop" },
        ...(selectedCategoryName ? [{ name: selectedCategoryName, url: "/shop" }] : []),
      ]} />
      <PublicNavbar />

      <main className="flex-1 pt-16">
        {/* Hero Slider */}
        {!searchQuery && !selectedCategory && <ShopHeroSlider />}

        {/* Shop Header */}
        <section className="border-b border-border/30">
          <div className="max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-10">
            <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4">
              <div>
                <p className="text-primary font-semibold text-[11px] uppercase tracking-[0.2em] mb-1.5 flex items-center gap-1.5">
                  <Sparkles className="w-3 h-3" />
                  DECOUVERTES
                </p>
                <h1 className="text-2xl sm:text-3xl font-bold text-foreground tracking-tight">
                  {selectedCategory 
                    ? categories?.find(c => c.id === selectedCategory)?.name 
                    : "Shop All Products"}
                </h1>
              </div>
              <p className="text-sm text-muted-foreground tabular-nums">
                {filteredProducts?.length || 0} product{(filteredProducts?.length || 0) !== 1 ? 's' : ''} available
              </p>
            </div>

            {/* Horizontal Category Chips */}
            <div 
              ref={categoryScrollRef}
              className="flex items-center gap-2 mt-6 overflow-x-auto scrollbar-thin pb-1 -mx-1 px-1"
            >
              <button
                onClick={() => setSelectedCategory(null)}
                className={`shrink-0 px-4 py-2 rounded-full text-xs font-semibold transition-all duration-300 border ${
                  !selectedCategory
                    ? "bg-primary text-primary-foreground border-primary shadow-md shadow-primary/20 scale-[1.02]"
                    : "bg-card text-muted-foreground border-border/40 hover:border-primary/30 hover:text-foreground hover:bg-secondary/50"
                }`}
              >
                All
              </button>
              {categories?.map((category) => (
                <button
                  key={category.id}
                  onClick={() => setSelectedCategory(
                    selectedCategory === category.id ? null : category.id
                  )}
                  className={`shrink-0 px-4 py-2 rounded-full text-xs font-semibold transition-all duration-300 border flex items-center gap-1.5 ${
                    selectedCategory === category.id
                      ? "bg-primary text-primary-foreground border-primary shadow-md shadow-primary/20 scale-[1.02]"
                      : "bg-card text-muted-foreground border-border/40 hover:border-primary/30 hover:text-foreground hover:bg-secondary/50"
                  }`}
                >
                  {category.name}
                  {categoryCounts[category.id] && (
                    <span className={`text-[10px] font-mono ${
                      selectedCategory === category.id ? "text-primary-foreground/70" : "text-muted-foreground/50"
                    }`}>
                      {categoryCounts[category.id]}
                    </span>
                  )}
                </button>
              ))}
            </div>
          </div>
        </section>

        {/* Sticky Toolbar */}
        <section className="sticky top-16 z-30 bg-background/80 backdrop-blur-xl border-b border-border/20 shadow-sm">
          <div className="max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex items-center justify-between h-12 sm:h-14 gap-3">
              <div className="flex items-center gap-2 flex-1">
                <Sheet>
                  <SheetTrigger asChild>
                    <Button variant="ghost" size="sm" className="lg:hidden h-8 px-2.5 gap-1.5 text-xs rounded-lg">
                      <Filter className="w-3.5 h-3.5" />
                      <span className="hidden sm:inline">Filters</span>
                    </Button>
                  </SheetTrigger>
                  <SheetContent side="left" className="w-[280px]">
                    <SheetHeader>
                      <SheetTitle>Filters</SheetTitle>
                    </SheetHeader>
                    <div className="mt-6">
                      <FilterContent />
                    </div>
                  </SheetContent>
                </Sheet>

                <div className={`relative flex-1 max-w-xs transition-all duration-300 ${searchFocused ? 'max-w-sm' : ''}`}>
                  <Search className={`absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 transition-colors duration-200 ${searchFocused ? 'text-primary' : 'text-muted-foreground/40'}`} />
                  <Input
                    placeholder="Search products..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    onFocus={() => setSearchFocused(true)}
                    onBlur={() => setSearchFocused(false)}
                    className="pl-9 h-8 text-xs bg-secondary/30 border-border/20 focus-visible:ring-1 focus-visible:ring-primary/30 focus-visible:border-primary/20 rounded-xl transition-all duration-200"
                  />
                  {searchQuery && (
                    <button
                      onClick={() => setSearchQuery("")}
                      className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors p-0.5 rounded-full hover:bg-secondary/50"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  )}
                </div>
              </div>

              <div className="flex items-center gap-2">
                <Select value={sortBy} onValueChange={setSortBy}>
                  <SelectTrigger className="w-[120px] sm:w-[140px] h-8 text-xs border-border/20 bg-secondary/30 rounded-xl">
                    <ArrowUpDown className="w-3 h-3 mr-1 text-muted-foreground/50" />
                    <SelectValue placeholder="Sort" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="newest">Newest</SelectItem>
                    <SelectItem value="price-low">Price: Low → High</SelectItem>
                    <SelectItem value="price-high">Price: High → Low</SelectItem>
                    <SelectItem value="name">Name</SelectItem>
                  </SelectContent>
                </Select>

                <div className="hidden sm:flex items-center border border-border/20 rounded-xl p-0.5 bg-secondary/20">
                  <button
                    onClick={() => setGridView("grid")}
                    className={`p-1.5 rounded-lg transition-all duration-200 ${
                      gridView === "grid" ? "bg-card shadow-sm text-foreground" : "text-muted-foreground/50 hover:text-muted-foreground"
                    }`}
                  >
                    <Grid3X3 className="w-3.5 h-3.5" />
                  </button>
                  <button
                    onClick={() => setGridView("large")}
                    className={`p-1.5 rounded-lg transition-all duration-200 ${
                      gridView === "large" ? "bg-card shadow-sm text-foreground" : "text-muted-foreground/50 hover:text-muted-foreground"
                    }`}
                  >
                    <LayoutGrid className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Main Content */}
        <section className="py-6 sm:py-8">
          <div className="max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex gap-8 lg:gap-10">
              {/* Desktop Sidebar */}
              <aside className="hidden lg:block w-52 flex-shrink-0">
                <div className="sticky top-36">
                  <FilterContent />
                </div>
              </aside>

              {/* Products */}
              <div className="flex-1 min-w-0">
                {/* Active Filters */}
                {(selectedCategory || searchQuery) && (
                  <div className="flex items-center gap-2 mb-5 flex-wrap animate-fade-in">
                    {selectedCategory && (
                      <Badge 
                        variant="secondary" 
                        className="px-3 py-1.5 text-xs cursor-pointer hover:bg-destructive/10 hover:text-destructive rounded-full transition-all duration-200 hover:scale-95 group"
                        onClick={() => setSelectedCategory(null)}
                      >
                        {categories?.find(c => c.id === selectedCategory)?.name}
                        <X className="w-3 h-3 ml-1.5 group-hover:rotate-90 transition-transform duration-200" />
                      </Badge>
                    )}
                    {searchQuery && (
                      <Badge 
                        variant="secondary" 
                        className="px-3 py-1.5 text-xs cursor-pointer hover:bg-destructive/10 hover:text-destructive rounded-full transition-all duration-200 hover:scale-95 group"
                        onClick={() => setSearchQuery("")}
                      >
                        "{searchQuery}"
                        <X className="w-3 h-3 ml-1.5 group-hover:rotate-90 transition-transform duration-200" />
                      </Badge>
                    )}
                    <button 
                      onClick={() => { setSelectedCategory(null); setSearchQuery(""); }}
                      className="text-[11px] font-medium text-muted-foreground hover:text-destructive transition-colors underline-offset-2 hover:underline"
                    >
                      Clear all
                    </button>
                  </div>
                )}

                {/* Featured */}
                {featuredProducts.length > 0 && !selectedCategory && !searchQuery && (
                  <div className="mb-10">
                    <div className="flex items-center gap-2.5 mb-5">
                      <div className="flex items-center justify-center w-7 h-7 rounded-lg bg-primary/10">
                        <TrendingUp className="w-4 h-4 text-primary" />
                      </div>
                      <h2 className="text-sm font-bold text-foreground uppercase tracking-wide">Trending Now</h2>
                      <ChevronRight className="w-4 h-4 text-muted-foreground/40" />
                    </div>
                    <div className={`grid gap-4 ${
                      gridView === "large" 
                        ? "grid-cols-1 sm:grid-cols-2" 
                        : "grid-cols-2 sm:grid-cols-3"
                    }`}>
                      {featuredProducts.slice(0, gridView === "large" ? 4 : 6).map((product, i) => (
                        <ProductCard key={product.id} product={product} index={i} />
                      ))}
                    </div>
                    <Separator className="mt-10" />
                  </div>
                )}

                {/* Loading */}
                {productsLoading ? (
                  <div className={`grid gap-4 ${
                    gridView === "large" 
                      ? "grid-cols-1 sm:grid-cols-2" 
                      : "grid-cols-2 sm:grid-cols-3 lg:grid-cols-4"
                  }`}>
                    {[...Array(8)].map((_, i) => (
                      <div key={i} className="bg-card rounded-2xl border border-border/20 overflow-hidden">
                        <Skeleton className="aspect-[4/5]" />
                        <div className="p-4 space-y-2.5">
                          <Skeleton className="h-2.5 w-1/3 rounded-full" />
                          <Skeleton className="h-3.5 w-3/4 rounded-full" />
                          <Skeleton className="h-4 w-1/4 rounded-full" />
                        </div>
                      </div>
                    ))}
                  </div>
                ) : filteredProducts && filteredProducts.length > 0 ? (
                  <>
                    {(selectedCategory || searchQuery || featuredProducts.length > 0) && (
                      <h2 className="text-sm font-bold text-foreground mb-5 uppercase tracking-wide flex items-center gap-2">
                        {selectedCategory 
                          ? `All ${categories?.find(c => c.id === selectedCategory)?.name}`
                          : searchQuery 
                            ? "Search Results" 
                            : "All Products"}
                        <span className="text-[10px] font-mono text-muted-foreground bg-secondary/50 px-2 py-0.5 rounded-full">
                          {filteredProducts.filter(p => !p.is_highlighted || selectedCategory || searchQuery).length}
                        </span>
                      </h2>
                    )}
                    
                    <div className={`grid gap-4 ${
                      gridView === "large" 
                        ? "grid-cols-1 sm:grid-cols-2 lg:grid-cols-3" 
                        : "grid-cols-2 sm:grid-cols-3 lg:grid-cols-4"
                    }`}>
                      {filteredProducts
                        .filter(p => !p.is_highlighted || selectedCategory || searchQuery)
                        .map((product, i) => (
                          <ProductCard key={product.id} product={product} index={i} />
                        ))}
                    </div>
                  </>
                ) : (
                  <div className="text-center py-24 animate-fade-in">
                    <div className="w-20 h-20 bg-secondary/30 rounded-3xl flex items-center justify-center mx-auto mb-5 rotate-3">
                      <Package className="w-10 h-10 text-muted-foreground/20" />
                    </div>
                    <h2 className="text-lg font-bold text-foreground mb-1.5">
                      {searchQuery ? "No products found" : "No products yet"}
                    </h2>
                    <p className="text-muted-foreground text-sm max-w-sm mx-auto mb-6">
                      {searchQuery
                        ? "Try adjusting your search or filters."
                        : "Check back soon for our new collection."}
                    </p>
                    {(searchQuery || selectedCategory) && (
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        className="rounded-xl"
                        onClick={() => {
                          setSearchQuery("");
                          setSelectedCategory(null);
                        }}
                      >
                        Clear Filters
                      </Button>
                    )}
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
