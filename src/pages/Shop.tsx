import { useState, useEffect, useRef } from "react";
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
  Sparkles,
  ArrowUpDown,
  Loader2
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
  const navigate = useNavigate();
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const hasAnimated = useRef(false);

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

  // Mark as animated after first render
  useEffect(() => {
    if (products && !hasAnimated.current) {
      hasAnimated.current = true;
    }
  }, [products]);

  // Filter and sort products
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

  // Inject ItemList JSON-LD for product listings
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
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["cart-count"] });
      queryClient.invalidateQueries({ queryKey: ["cart-items"] });
      toast.success("Added to cart!");
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

  // Product Card Component - no motion to prevent re-animation on cart mutation
  const ProductCard = ({ product }: { product: Product }) => (
    <div
      onClick={() => navigate(`/product/${product.slug || product.id}`)}
      className="group relative flex flex-col h-full bg-card rounded-2xl overflow-hidden cursor-pointer border border-border/40 hover:border-primary/30 transition-all duration-300 hover:shadow-xl hover:shadow-primary/5 hover:-translate-y-1"
    >
      {/* Image Container */}
      <div className="relative aspect-[4/5] overflow-hidden bg-secondary/20">
        {product.images && product.images.length > 0 ? (
          <>
            <img
              src={product.images[0]}
              alt={`${product.name} - ${product.categories?.name || "Product"} by DECOUVERTES`}
              className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
              loading="lazy"
            />
            {product.images[1] && (
              <img
                src={product.images[1]}
                alt={`${product.name} alternate view - DECOUVERTES`}
                className="absolute inset-0 w-full h-full object-cover opacity-0 group-hover:opacity-100 transition-opacity duration-500"
                loading="lazy"
              />
            )}
            <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
          </>
        ) : (
          <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-secondary/40 to-secondary/20">
            <Package className="w-12 h-12 text-muted-foreground/15" />
          </div>
        )}
        
        {/* Top Badges */}
        <div className="absolute top-3 left-3 flex flex-col gap-1.5 z-10">
          {product.is_highlighted && (
            <Badge className="bg-primary text-primary-foreground text-[10px] font-bold px-2 py-0.5 shadow-lg rounded-md">
              ★ BESTSELLER
            </Badge>
          )}
          {product.stock_quantity <= 5 && (
            <Badge variant="destructive" className="text-[10px] font-bold px-2 py-0.5 shadow-lg rounded-md">
              LOW STOCK
            </Badge>
          )}
        </div>

        {/* Top-right actions */}
        <div className="absolute top-3 right-3 z-10 flex flex-col gap-1.5">
          <div className="bg-card/90 backdrop-blur-md rounded-full p-1 shadow-md opacity-0 group-hover:opacity-100 transition-opacity duration-300">
            <WishlistButton productId={product.id} size="sm" />
          </div>
          <div className="opacity-0 group-hover:opacity-100 transition-opacity duration-300 delay-75">
            <ShareMenu
              url={`${window.location.origin}/product/${product.slug || product.id}`}
              title={product.name}
              description={product.description || undefined}
            />
          </div>
        </div>

        {/* Quick View on hover */}
        <div className="absolute bottom-0 left-0 right-0 p-3 translate-y-full group-hover:translate-y-0 transition-transform duration-300 z-10">
          <Button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              navigate(`/product/${product.slug || product.id}`);
            }}
            variant="secondary"
            className="w-full bg-card/95 backdrop-blur-md hover:bg-card text-foreground shadow-lg h-9 rounded-lg font-medium text-xs"
          >
            <Eye className="w-3.5 h-3.5 mr-1.5" />
            Quick View
          </Button>
        </div>
      </div>

      {/* Product Info */}
      <div className="flex flex-col flex-1 p-4">
        {product.categories && (
          <p className="text-[10px] text-primary font-semibold uppercase tracking-[0.15em] mb-1">
            {product.categories.name}
          </p>
        )}
        <h3 className="font-semibold text-foreground text-sm leading-snug mb-1 line-clamp-2 min-h-[2.5em] group-hover:text-primary transition-colors duration-300">
          {product.name}
        </h3>
        {product.sku && (
          <span className="text-[9px] font-mono text-muted-foreground/50 mb-2">
            {product.sku}
          </span>
        )}
        
        <div className="mt-auto pt-3 border-t border-border/30">
          <div className="flex items-end justify-between gap-2 mb-3">
            <p className="text-lg font-bold text-foreground tracking-tight">
              ₹{product.price.toLocaleString("en-IN")}
            </p>
            {product.stock_quantity <= 10 && product.stock_quantity > 0 && (
              <span className="text-[9px] text-destructive font-semibold bg-destructive/5 px-1.5 py-0.5 rounded">
                {product.stock_quantity} left
              </span>
            )}
          </div>
          
          <Button
            type="button"
            onClick={(e) => handleAddToCart(e, product.id)}
            disabled={addToCartMutation.isPending}
            className="w-full bg-foreground hover:bg-foreground/90 text-background h-9 rounded-lg font-semibold text-xs transition-all active:scale-[0.97]"
            size="sm"
          >
            {addToCartMutation.isPending ? (
              <Loader2 className="w-3.5 h-3.5 mr-1.5 animate-spin" />
            ) : (
              <ShoppingCart className="w-3.5 h-3.5 mr-1.5" />
            )}
            Add to Cart
          </Button>
        </div>
      </div>
    </div>
  );

  // Filter Sidebar Content
  const FilterContent = () => (
    <div className="space-y-6">
      <div>
        <h4 className="font-bold text-foreground mb-3 text-xs uppercase tracking-[0.2em]">Categories</h4>
        <div className="space-y-0.5">
          <button
            onClick={() => setSelectedCategory(null)}
            className={`w-full text-left px-3 py-2.5 rounded-lg text-sm transition-all duration-200 flex items-center justify-between ${
              !selectedCategory 
                ? "bg-primary text-primary-foreground font-medium shadow-sm" 
                : "text-muted-foreground hover:bg-secondary/80 hover:text-foreground"
            }`}
          >
            All Products
            {!selectedCategory && <Check className="w-3.5 h-3.5" />}
          </button>
          {categories?.map((category) => (
            <button
              key={category.id}
              onClick={() => setSelectedCategory(category.id)}
              className={`w-full text-left px-3 py-2.5 rounded-lg text-sm transition-all duration-200 flex items-center justify-between ${
                selectedCategory === category.id 
                  ? "bg-primary text-primary-foreground font-medium shadow-sm" 
                  : "text-muted-foreground hover:bg-secondary/80 hover:text-foreground"
              }`}
            >
              {category.name}
              {selectedCategory === category.id && <Check className="w-3.5 h-3.5" />}
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
        <section className="relative overflow-hidden bg-gradient-to-b from-secondary/50 via-secondary/20 to-background">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_20%,hsl(var(--primary)/0.04),transparent_50%)]" />
          <div className="relative max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8 py-10 sm:py-14">
            <div className="text-center max-w-2xl mx-auto">
              <p className="text-primary font-bold text-xs uppercase tracking-[0.25em] mb-3 flex items-center justify-center gap-2">
                <Sparkles className="w-3.5 h-3.5" />
                DECOUVERTES COLLECTION
                <Sparkles className="w-3.5 h-3.5" />
              </p>
              <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-foreground tracking-tight mb-3">
                {selectedCategory 
                  ? categories?.find(c => c.id === selectedCategory)?.name 
                  : "Our Products"}
              </h1>
              <p className="text-muted-foreground text-sm sm:text-base max-w-lg mx-auto leading-relaxed">
                Premium industrial-grade products engineered for excellence.
              </p>
            </div>
          </div>
        </section>

        {/* Filters & Sort Bar */}
        <section className="sticky top-16 z-30 bg-background/90 backdrop-blur-xl border-b border-border/40 shadow-sm">
          <div className="max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex items-center justify-between h-13 sm:h-14 gap-3">
              {/* Left: Filter Button (Mobile) & Search */}
              <div className="flex items-center gap-2 flex-1">
                <Sheet>
                  <SheetTrigger asChild>
                    <Button variant="outline" size="sm" className="lg:hidden h-8 px-2.5 gap-1.5 rounded-lg border-border/50 text-xs">
                      <SlidersHorizontal className="w-3.5 h-3.5" />
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

                <div className="relative flex-1 max-w-sm">
                  <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground" />
                  <Input
                    placeholder="Search products..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-8 h-8 text-xs bg-secondary/40 border-0 focus-visible:ring-1 focus-visible:ring-primary/30 rounded-lg"
                  />
                  {searchQuery && (
                    <button
                      onClick={() => setSearchQuery("")}
                      className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
              </div>

              {/* Right: Sort & View */}
              <div className="flex items-center gap-2">
                <Select value={sortBy} onValueChange={setSortBy}>
                  <SelectTrigger className="w-[130px] sm:w-[150px] h-8 text-xs border-0 bg-secondary/40 rounded-lg">
                    <ArrowUpDown className="w-3 h-3 mr-1 text-muted-foreground" />
                    <SelectValue placeholder="Sort by" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="newest">Newest</SelectItem>
                    <SelectItem value="price-low">Price: Low → High</SelectItem>
                    <SelectItem value="price-high">Price: High → Low</SelectItem>
                    <SelectItem value="name">Name</SelectItem>
                  </SelectContent>
                </Select>

                <div className="hidden sm:flex items-center border border-border/30 rounded-lg bg-secondary/30 p-0.5">
                  <button
                    onClick={() => setGridView("grid")}
                    className={`p-1 rounded transition-all ${
                      gridView === "grid" ? "bg-card shadow-sm text-foreground" : "text-muted-foreground"
                    }`}
                  >
                    <Grid3X3 className="w-3.5 h-3.5" />
                  </button>
                  <button
                    onClick={() => setGridView("large")}
                    className={`p-1 rounded transition-all ${
                      gridView === "large" ? "bg-card shadow-sm text-foreground" : "text-muted-foreground"
                    }`}
                  >
                    <LayoutGrid className="w-3.5 h-3.5" />
                  </button>
                </div>

                <span className="text-[10px] font-medium text-muted-foreground bg-secondary/50 px-2 py-1 rounded-md hidden md:block">
                  {filteredProducts?.length || 0} items
                </span>
              </div>
            </div>
          </div>
        </section>

        {/* Main Content */}
        <section className="py-6 sm:py-10">
          <div className="max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex gap-8 lg:gap-10">
              {/* Desktop Sidebar */}
              <aside className="hidden lg:block w-56 flex-shrink-0">
                <div className="sticky top-36 bg-card rounded-xl border border-border/30 p-5 shadow-sm">
                  <FilterContent />
                </div>
              </aside>

              {/* Products Grid */}
              <div className="flex-1 min-w-0">
                {/* Active Filters */}
                {(selectedCategory || searchQuery) && (
                  <div className="flex items-center gap-2 mb-5 flex-wrap">
                    {selectedCategory && (
                      <Badge 
                        variant="secondary" 
                        className="px-2.5 py-1 text-xs cursor-pointer hover:bg-secondary/80 rounded-full"
                        onClick={() => setSelectedCategory(null)}
                      >
                        {categories?.find(c => c.id === selectedCategory)?.name}
                        <X className="w-3 h-3 ml-1.5" />
                      </Badge>
                    )}
                    {searchQuery && (
                      <Badge 
                        variant="secondary" 
                        className="px-2.5 py-1 text-xs cursor-pointer hover:bg-secondary/80 rounded-full"
                        onClick={() => setSearchQuery("")}
                      >
                        "{searchQuery}"
                        <X className="w-3 h-3 ml-1.5" />
                      </Badge>
                    )}
                    <button 
                      onClick={() => { setSelectedCategory(null); setSearchQuery(""); }}
                      className="text-[10px] font-medium text-primary hover:text-primary/80 underline underline-offset-4"
                    >
                      Clear all
                    </button>
                  </div>
                )}

                {/* Featured Products */}
                {featuredProducts.length > 0 && !selectedCategory && !searchQuery && (
                  <div className="mb-8">
                    <div className="flex items-center gap-2 mb-5">
                      <div className="p-1.5 bg-primary/10 rounded-lg">
                        <Star className="w-4 h-4 text-primary fill-primary" />
                      </div>
                      <h2 className="text-base font-bold text-foreground">Featured Products</h2>
                    </div>
                    <div className={`grid gap-4 ${
                      gridView === "large" 
                        ? "grid-cols-1 sm:grid-cols-2" 
                        : "grid-cols-2 sm:grid-cols-3"
                    }`}>
                      {featuredProducts.slice(0, gridView === "large" ? 4 : 6).map((product) => (
                        <ProductCard key={product.id} product={product} />
                      ))}
                    </div>
                    <Separator className="mt-8" />
                  </div>
                )}

                {/* Loading State */}
                {productsLoading ? (
                  <div className={`grid gap-4 ${
                    gridView === "large" 
                      ? "grid-cols-1 sm:grid-cols-2" 
                      : "grid-cols-2 sm:grid-cols-3 lg:grid-cols-4"
                  }`}>
                    {[...Array(8)].map((_, i) => (
                      <div key={i} className="bg-card rounded-2xl border border-border/30 overflow-hidden">
                        <Skeleton className="aspect-[4/5]" />
                        <div className="p-4 space-y-2.5">
                          <Skeleton className="h-2.5 w-1/3" />
                          <Skeleton className="h-3.5 w-3/4" />
                          <Skeleton className="h-4 w-1/4" />
                          <Skeleton className="h-9 w-full rounded-lg" />
                        </div>
                      </div>
                    ))}
                  </div>
                ) : filteredProducts && filteredProducts.length > 0 ? (
                  <>
                    {(selectedCategory || searchQuery || featuredProducts.length > 0) && (
                      <h2 className="text-base font-bold text-foreground mb-5">
                        {selectedCategory 
                          ? `All ${categories?.find(c => c.id === selectedCategory)?.name}`
                          : searchQuery 
                            ? "Search Results" 
                            : "All Products"}
                      </h2>
                    )}
                    
                    <div className={`grid gap-4 ${
                      gridView === "large" 
                        ? "grid-cols-1 sm:grid-cols-2 lg:grid-cols-3" 
                        : "grid-cols-2 sm:grid-cols-3 lg:grid-cols-4"
                    }`}>
                      {filteredProducts
                        .filter(p => !p.is_highlighted || selectedCategory || searchQuery)
                        .map((product) => (
                          <ProductCard key={product.id} product={product} />
                        ))}
                    </div>
                  </>
                ) : (
                  <div className="text-center py-20">
                    <div className="w-20 h-20 bg-secondary/50 rounded-2xl flex items-center justify-center mx-auto mb-5">
                      <Package className="w-10 h-10 text-muted-foreground/25" />
                    </div>
                    <h2 className="text-xl font-bold text-foreground mb-2">
                      {searchQuery ? "No products found" : "No products yet"}
                    </h2>
                    <p className="text-muted-foreground text-sm max-w-md mx-auto mb-6">
                      {searchQuery
                        ? "Try adjusting your search or filters."
                        : "Check back soon for our new collection."}
                    </p>
                    {(searchQuery || selectedCategory) && (
                      <Button
                        type="button"
                        variant="outline"
                        className="rounded-lg"
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
