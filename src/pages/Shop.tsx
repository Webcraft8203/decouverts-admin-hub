import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { PublicNavbar } from "@/components/PublicNavbar";
import { PublicFooter } from "@/components/PublicFooter";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { WishlistButton } from "@/components/WishlistButton";
import { ShopHeroSlider } from "@/components/shop/ShopHeroSlider";
import { 
  ShoppingCart, 
  Package, 
  Search, 
  Plus, 
  Star, 
  ChevronDown,
  Filter,
  Grid3X3,
  LayoutGrid,
  SlidersHorizontal,
  X,
  Check
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
        default:
          return 0;
      }
    });

  const featuredProducts = products?.filter((p) => p.is_highlighted) || [];

  // Product Card Component - Shopify Style
  const ProductCard = ({ product }: { product: Product }) => (
    <div
      onClick={() => navigate(`/product/${product.id}`)}
      className="group flex flex-col h-full bg-card border border-border/40 rounded-xl overflow-hidden hover:shadow-md transition-all duration-300 cursor-pointer"
    >
      {/* Image Container */}
      <div className="relative aspect-square overflow-hidden bg-secondary/20">
        {product.images && product.images.length > 0 ? (
          <>
            <img
              src={product.images[0]}
              alt={product.name}
              className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
            />
            {product.images[1] && (
              <img
                src={product.images[1]}
                alt={product.name}
                className="absolute inset-0 w-full h-full object-cover opacity-0 group-hover:opacity-100 transition-opacity duration-500"
              />
            )}
          </>
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <Package className="w-12 h-12 text-muted-foreground/20" />
          </div>
        )}
        
        {/* Badges */}
        <div className="absolute top-3 left-3 flex flex-col gap-2 z-10">
          {product.is_highlighted && (
            <Badge className="bg-primary text-primary-foreground text-[10px] font-bold px-2.5 py-0.5 shadow-sm">
              BESTSELLER
            </Badge>
          )}
          {product.stock_quantity <= 5 && (
            <Badge variant="destructive" className="text-[10px] font-bold px-2.5 py-0.5 shadow-sm">
              LOW STOCK
            </Badge>
          )}
        </div>

        {/* Wishlist */}
        <div className="absolute top-3 right-3 z-10">
          <div className="bg-background/80 backdrop-blur-sm rounded-full p-1.5 shadow-sm transition-opacity hover:bg-background">
            <WishlistButton productId={product.id} size="sm" />
          </div>
        </div>
      </div>

      {/* Product Info */}
      <div className="flex flex-col flex-1 p-4">
        {product.categories && (
          <p className="text-xs text-muted-foreground uppercase tracking-wider font-medium mb-1">
            {product.categories.name}
          </p>
        )}
        <h3 className="font-medium text-foreground text-sm sm:text-base leading-snug mb-2 line-clamp-2 min-h-[2.5em]">
          {product.name}
        </h3>
        
        <div className="mt-auto pt-2">
          <div className="flex items-center justify-between gap-2 mb-3">
            <p className="text-base sm:text-lg font-bold text-foreground">
              ₹{product.price.toLocaleString("en-IN")}
            </p>
          </div>
          
          <Button
            onClick={(e) => handleAddToCart(e, product.id)}
            className="w-full bg-foreground hover:bg-foreground/90 text-background h-9 sm:h-10 rounded-lg font-medium transition-transform active:scale-[0.98] shadow-sm"
            size="sm"
          >
            <ShoppingCart className="w-4 h-4 mr-2" />
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
        <h4 className="font-semibold text-foreground mb-4 px-2 text-sm uppercase tracking-wider">Categories</h4>
        <div className="space-y-1">
          <button
            onClick={() => setSelectedCategory(null)}
            className={`w-full text-left px-3 py-2 rounded-md text-sm transition-all duration-200 flex items-center justify-between ${
              !selectedCategory 
                ? "bg-primary text-primary-foreground font-medium shadow-sm" 
                : "text-muted-foreground hover:bg-secondary hover:text-foreground"
            }`}
          >
            All Products
            {!selectedCategory && <Check className="w-3.5 h-3.5" />}
          </button>
          {categories?.map((category) => (
            <button
              key={category.id}
              onClick={() => setSelectedCategory(category.id)}
              className={`w-full text-left px-3 py-2 rounded-md text-sm transition-all duration-200 flex items-center justify-between ${
                selectedCategory === category.id 
                  ? "bg-primary text-primary-foreground font-medium shadow-sm" 
                  : "text-muted-foreground hover:bg-secondary hover:text-foreground"
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
      <PublicNavbar />

      <main className="flex-1 pt-16">
        {/* Hero Slider */}
        {!searchQuery && !selectedCategory && <ShopHeroSlider />}

        {/* Shop Header */}
        <section className="border-b border-border">
          <div className="max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12">
            <div className="text-center">
              <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-foreground tracking-tight mb-4">
                {selectedCategory 
                  ? categories?.find(c => c.id === selectedCategory)?.name 
                  : "Shop All Products"}
              </h1>
              <p className="text-muted-foreground text-base sm:text-lg max-w-2xl mx-auto">
                Discover our curated collection of premium products designed for excellence.
              </p>
            </div>
          </div>
        </section>

        {/* Filters & Sort Bar */}
        <section className="sticky top-16 z-30 bg-background/95 backdrop-blur-md border-b border-border">
          <div className="max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex items-center justify-between h-14 sm:h-16 gap-4">
              {/* Left: Filter Button (Mobile) & Search */}
              <div className="flex items-center gap-3 flex-1">
                {/* Mobile Filter Sheet */}
                <Sheet>
                  <SheetTrigger asChild>
                    <Button variant="outline" size="sm" className="lg:hidden h-9 px-3 gap-2">
                      <SlidersHorizontal className="w-4 h-4" />
                      <span className="hidden sm:inline">Filters</span>
                    </Button>
                  </SheetTrigger>
                  <SheetContent side="left" className="w-[300px]">
                    <SheetHeader>
                      <SheetTitle>Filters</SheetTitle>
                    </SheetHeader>
                    <div className="mt-6">
                      <FilterContent />
                    </div>
                  </SheetContent>
                </Sheet>

                {/* Search */}
                <div className="relative flex-1 max-w-md">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <Input
                    placeholder="Search products..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-10 h-9 text-sm bg-secondary/50 border-0 focus-visible:ring-1 focus-visible:ring-foreground/20"
                  />
                  {searchQuery && (
                    <button
                      onClick={() => setSearchQuery("")}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  )}
                </div>
              </div>

              {/* Right: Sort & View Options */}
              <div className="flex items-center gap-2 sm:gap-3">
                <Select value={sortBy} onValueChange={setSortBy}>
                  <SelectTrigger className="w-[140px] sm:w-[160px] h-9 text-sm border-0 bg-secondary/50">
                    <SelectValue placeholder="Sort by" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="newest">Newest</SelectItem>
                    <SelectItem value="price-low">Price: Low to High</SelectItem>
                    <SelectItem value="price-high">Price: High to Low</SelectItem>
                    <SelectItem value="name">Name</SelectItem>
                  </SelectContent>
                </Select>

                {/* Grid View Toggle */}
                <div className="hidden sm:flex items-center border rounded-md bg-secondary/50 p-0.5">
                  <button
                    onClick={() => setGridView("grid")}
                    className={`p-1.5 rounded transition-colors ${
                      gridView === "grid" ? "bg-background shadow-sm" : ""
                    }`}
                  >
                    <Grid3X3 className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => setGridView("large")}
                    className={`p-1.5 rounded transition-colors ${
                      gridView === "large" ? "bg-background shadow-sm" : ""
                    }`}
                  >
                    <LayoutGrid className="w-4 h-4" />
                  </button>
                </div>

                {/* Product Count */}
                <span className="text-sm text-muted-foreground hidden md:block">
                  {filteredProducts?.length || 0} products
                </span>
              </div>
            </div>
          </div>
        </section>

        {/* Main Content */}
        <section className="py-8 sm:py-12">
          <div className="max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex gap-8 lg:gap-12">
              {/* Desktop Sidebar */}
              <aside className="hidden lg:block w-64 flex-shrink-0">
                <div className="sticky top-36">
                  <FilterContent />
                </div>
              </aside>

              {/* Products Grid */}
              <div className="flex-1">
                {/* Active Filters */}
                {(selectedCategory || searchQuery) && (
                  <div className="flex items-center gap-2 mb-6 flex-wrap">
                    {selectedCategory && (
                      <Badge 
                        variant="secondary" 
                        className="px-3 py-1.5 text-sm cursor-pointer hover:bg-secondary/80"
                        onClick={() => setSelectedCategory(null)}
                      >
                        {categories?.find(c => c.id === selectedCategory)?.name}
                        <X className="w-3 h-3 ml-2" />
                      </Badge>
                    )}
                    {searchQuery && (
                      <Badge 
                        variant="secondary" 
                        className="px-3 py-1.5 text-sm cursor-pointer hover:bg-secondary/80"
                        onClick={() => setSearchQuery("")}
                      >
                        "{searchQuery}"
                        <X className="w-3 h-3 ml-2" />
                      </Badge>
                    )}
                    <button 
                      onClick={() => { setSelectedCategory(null); setSearchQuery(""); }}
                      className="text-sm text-muted-foreground hover:text-foreground underline underline-offset-4"
                    >
                      Clear all
                    </button>
                  </div>
                )}

                {/* Featured Products Banner */}
                {featuredProducts.length > 0 && !selectedCategory && !searchQuery && (
                  <div className="mb-10">
                    <div className="flex items-center gap-3 mb-6">
                      <Star className="w-5 h-5 text-primary fill-primary" />
                      <h2 className="text-xl font-semibold text-foreground">Featured Products</h2>
                    </div>
                    <div className={`grid gap-4 sm:gap-6 ${
                      gridView === "large" 
                        ? "grid-cols-1 sm:grid-cols-2" 
                        : "grid-cols-2 sm:grid-cols-3"
                    }`}>
                      {featuredProducts.slice(0, gridView === "large" ? 4 : 6).map((product) => (
                        <ProductCard key={product.id} product={product} />
                      ))}
                    </div>
                    <Separator className="mt-10" />
                  </div>
                )}

                {/* Loading State */}
                {productsLoading ? (
                  <div className={`grid gap-4 sm:gap-6 ${
                    gridView === "large" 
                      ? "grid-cols-1 sm:grid-cols-2" 
                      : "grid-cols-2 sm:grid-cols-3 lg:grid-cols-4"
                  }`}>
                    {[...Array(8)].map((_, i) => (
                      <div key={i} className="space-y-4">
                        <Skeleton className="aspect-square rounded-lg" />
                        <Skeleton className="h-3 w-1/3" />
                        <Skeleton className="h-4 w-3/4" />
                        <Skeleton className="h-5 w-1/4" />
                      </div>
                    ))}
                  </div>
                ) : filteredProducts && filteredProducts.length > 0 ? (
                  <>
                    {/* All Products Header */}
                    {(selectedCategory || searchQuery || featuredProducts.length > 0) && (
                      <h2 className="text-xl font-semibold text-foreground mb-6">
                        {selectedCategory 
                          ? `All ${categories?.find(c => c.id === selectedCategory)?.name}`
                          : searchQuery 
                            ? "Search Results" 
                            : "All Products"}
                      </h2>
                    )}
                    
                    {/* Products Grid */}
                    <div className={`grid gap-4 sm:gap-6 ${
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
                  /* Empty State */
                  <div className="text-center py-20">
                    <div className="w-20 h-20 bg-secondary rounded-full flex items-center justify-center mx-auto mb-6">
                      <Package className="w-10 h-10 text-muted-foreground" />
                    </div>
                    <h2 className="text-2xl font-semibold text-foreground mb-3">
                      {searchQuery ? "No products found" : "No products yet"}
                    </h2>
                    <p className="text-muted-foreground max-w-md mx-auto mb-6">
                      {searchQuery
                        ? "Try adjusting your search or filters to find what you're looking for."
                        : "Check back soon for our new collection."}
                    </p>
                    {(searchQuery || selectedCategory) && (
                      <Button
                        variant="outline"
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
