import { useState, useRef } from "react";
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
  ChevronRight, 
  ChevronLeft,
  Share2,
  Sparkles,
  Tag,
  Layers
} from "lucide-react";
import { Input } from "@/components/ui/input";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";

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

  const handleShare = async (e: React.MouseEvent, product: Product) => {
    e.stopPropagation();
    const productUrl = `${window.location.origin}/product/${product.id}`;
    
    if (navigator.share) {
      try {
        await navigator.share({
          title: product.name,
          text: product.description || `Check out ${product.name}`,
          url: productUrl,
        });
      } catch (err) {
        if ((err as Error).name !== 'AbortError') {
          await navigator.clipboard.writeText(productUrl);
          toast.success("Link copied to clipboard!");
        }
      }
    } else {
      await navigator.clipboard.writeText(productUrl);
      toast.success("Link copied to clipboard!");
    }
  };

  const filteredProducts = products?.filter((product) => {
    const matchesSearch = 
      product.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      product.description?.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = !selectedCategory || product.category_id === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  const highlightedProducts = products?.filter((p) => p.is_highlighted) || [];

  const getProductsByCategory = (categoryId: string) => {
    return filteredProducts?.filter((p) => p.category_id === categoryId) || [];
  };

  // Horizontal scroll helper
  const scrollContainer = (ref: React.RefObject<HTMLDivElement>, direction: 'left' | 'right') => {
    if (ref.current) {
      const scrollAmount = 300;
      ref.current.scrollBy({
        left: direction === 'left' ? -scrollAmount : scrollAmount,
        behavior: 'smooth'
      });
    }
  };

  // Product Card Component
  const ProductCard = ({ product, compact = false }: { product: Product; compact?: boolean }) => (
    <Card
      onClick={() => navigate(`/product/${product.id}`)}
      className={`group cursor-pointer flex-shrink-0 overflow-hidden border border-border/50 bg-card hover:shadow-xl hover:shadow-primary/5 transition-all duration-300 ${
        compact ? 'w-[180px] sm:w-[200px]' : 'w-[220px] sm:w-[260px]'
      }`}
    >
      <div className={`relative overflow-hidden bg-muted ${compact ? 'h-[140px] sm:h-[160px]' : 'h-[180px] sm:h-[220px]'}`}>
        {product.images && product.images.length > 0 ? (
          <img
            src={product.images[0]}
            alt={product.name}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-muted to-muted/50">
            <Package className="w-12 h-12 text-muted-foreground/30" />
          </div>
        )}
        
        {/* Badges */}
        <div className="absolute top-2 left-2 flex flex-col gap-1">
          {product.is_highlighted && (
            <Badge className="bg-primary text-primary-foreground text-xs px-2 py-0.5">
              <Sparkles className="w-3 h-3 mr-1" /> Featured
            </Badge>
          )}
          {product.stock_quantity <= 5 && (
            <Badge variant="destructive" className="text-xs px-2 py-0.5">
              Only {product.stock_quantity} left
            </Badge>
          )}
        </div>

        {/* Wishlist & Share Buttons */}
        <div className="absolute top-2 right-2 flex flex-col gap-1.5 opacity-0 group-hover:opacity-100 transition-opacity">
          <WishlistButton productId={product.id} size="sm" />
          <Button
            size="icon"
            variant="secondary"
            onClick={(e) => handleShare(e, product)}
            className="w-8 h-8 rounded-full bg-background/90 backdrop-blur-sm shadow-md hover:bg-background"
          >
            <Share2 className="w-3.5 h-3.5" />
          </Button>
        </div>
      </div>

      <CardContent className={`${compact ? 'p-3' : 'p-4'}`}>
        {product.categories && (
          <p className="text-[10px] font-medium text-primary uppercase tracking-wider mb-1">
            {product.categories.name}
          </p>
        )}
        <h3 className={`font-medium text-foreground line-clamp-2 group-hover:text-primary transition-colors ${
          compact ? 'text-sm mb-1' : 'text-base mb-2'
        }`}>
          {product.name}
        </h3>
        <div className="flex items-center justify-between">
          <span className={`font-bold text-foreground ${compact ? 'text-base' : 'text-lg'}`}>
            ₹{product.price.toLocaleString()}
          </span>
          <Button
            size="sm"
            onClick={(e) => handleAddToCart(e, product.id)}
            className="h-8 px-3 bg-primary text-primary-foreground hover:bg-primary/90 text-xs font-medium"
          >
            <Plus className="w-3.5 h-3.5 mr-1" /> Add
          </Button>
        </div>
      </CardContent>
    </Card>
  );

  // Horizontal Product Section Component
  const HorizontalProductSection = ({ 
    title, 
    products, 
    icon: Icon,
    bgColor = "bg-card"
  }: { 
    title: string; 
    products: Product[];
    icon?: React.ElementType;
    bgColor?: string;
  }) => {
    const scrollRef = useRef<HTMLDivElement>(null);
    
    if (products.length === 0) return null;

    return (
      <section className={`py-6 ${bgColor}`}>
        <div className="max-w-[1400px] mx-auto px-4">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              {Icon && (
                <div className="p-2 bg-primary/10 rounded-lg">
                  <Icon className="w-5 h-5 text-primary" />
                </div>
              )}
              <h2 className="text-xl sm:text-2xl font-bold text-foreground">{title}</h2>
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="icon"
                className="h-9 w-9 rounded-full border-border/50 hidden sm:flex"
                onClick={() => scrollContainer(scrollRef, 'left')}
              >
                <ChevronLeft className="w-4 h-4" />
              </Button>
              <Button
                variant="outline"
                size="icon"
                className="h-9 w-9 rounded-full border-border/50 hidden sm:flex"
                onClick={() => scrollContainer(scrollRef, 'right')}
              >
                <ChevronRight className="w-4 h-4" />
              </Button>
            </div>
          </div>
          
          <div 
            ref={scrollRef}
            className="flex gap-4 overflow-x-auto pb-4 scrollbar-thin snap-x snap-mandatory"
          >
            {products.map((product) => (
              <div key={product.id} className="snap-start">
                <ProductCard product={product} />
              </div>
            ))}
          </div>
        </div>
      </section>
    );
  };

  return (
    <div className="min-h-screen flex flex-col bg-secondary/30">
      <PublicNavbar />

      <main className="flex-1 pt-16">
        {/* Category Strip */}
        <section className="bg-card border-b border-border/50 shadow-sm sticky top-16 z-30">
          <div className="max-w-[1400px] mx-auto px-4">
            <div className="flex items-center gap-2 py-3 overflow-x-auto scrollbar-thin">
              <Button
                variant={selectedCategory === null ? "default" : "ghost"}
                size="sm"
                onClick={() => setSelectedCategory(null)}
                className={`flex-shrink-0 rounded-full ${
                  selectedCategory === null 
                    ? 'bg-primary text-primary-foreground' 
                    : 'hover:bg-muted'
                }`}
              >
                <Layers className="w-4 h-4 mr-2" />
                All
              </Button>
              {categories?.map((category) => (
                <Button
                  key={category.id}
                  variant={selectedCategory === category.id ? "default" : "ghost"}
                  size="sm"
                  onClick={() => setSelectedCategory(category.id)}
                  className={`flex-shrink-0 rounded-full ${
                    selectedCategory === category.id 
                      ? 'bg-primary text-primary-foreground' 
                      : 'hover:bg-muted'
                  }`}
                >
                  <Tag className="w-4 h-4 mr-2" />
                  {category.name}
                </Button>
              ))}
            </div>
          </div>
        </section>

        {/* Search Bar */}
        <section className="bg-card border-b border-border/50">
          <div className="max-w-[1400px] mx-auto px-4 py-4">
            <div className="relative max-w-2xl mx-auto">
              <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-muted-foreground" />
              <Input
                placeholder="Search for products, brands and more..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-12 h-12 text-base bg-secondary/50 border-border/50 rounded-lg focus:ring-2 focus:ring-primary/20"
              />
            </div>
          </div>
        </section>

        {/* Hero Banner Slider - Admin Controlled */}
        {!searchQuery && !selectedCategory && <ShopHeroSlider />}

        {/* Loading State */}
        {productsLoading ? (
          <section className="py-8">
            <div className="max-w-[1400px] mx-auto px-4">
              <Skeleton className="h-8 w-48 mb-4" />
              <div className="flex gap-4 overflow-hidden">
                {[...Array(6)].map((_, i) => (
                  <Card key={i} className="flex-shrink-0 w-[220px] overflow-hidden border-0">
                    <Skeleton className="h-[180px]" />
                    <CardContent className="p-4">
                      <Skeleton className="h-3 w-1/3 mb-2" />
                      <Skeleton className="h-5 w-3/4 mb-2" />
                      <Skeleton className="h-6 w-1/2" />
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          </section>
        ) : (
          <>
            {/* Featured Products Section */}
            {highlightedProducts.length > 0 && !selectedCategory && (
              <HorizontalProductSection 
                title="Top Deals" 
                products={highlightedProducts}
                icon={Star}
                bgColor="bg-card"
              />
            )}

            {/* Category Sections */}
            {categories?.map((category) => {
              const categoryProducts = getProductsByCategory(category.id);
              if (categoryProducts.length === 0) return null;

              return (
                <HorizontalProductSection 
                  key={category.id}
                  title={category.name} 
                  products={categoryProducts}
                  icon={Tag}
                  bgColor="bg-background"
                />
              );
            })}

            {/* Uncategorized Products */}
            {(() => {
              const uncategorizedProducts = filteredProducts?.filter((p) => !p.category_id) || [];
              if (uncategorizedProducts.length === 0) return null;
              
              return (
                <HorizontalProductSection 
                  title="More Products" 
                  products={uncategorizedProducts}
                  icon={Package}
                  bgColor="bg-card"
                />
              );
            })()}

            {/* Empty State */}
            {filteredProducts && filteredProducts.length === 0 && (
              <div className="text-center py-24 px-4">
                <div className="w-24 h-24 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-6">
                  <Package className="w-12 h-12 text-primary" />
                </div>
                <h2 className="text-2xl font-bold text-foreground mb-4">
                  {searchQuery ? "No products found" : "Products Coming Soon"}
                </h2>
                <p className="text-muted-foreground text-lg max-w-md mx-auto mb-8">
                  {searchQuery
                    ? "Try adjusting your search query or browse categories."
                    : "We're preparing an amazing collection of premium products."}
                </p>
                {(searchQuery || selectedCategory) && (
                  <Button
                    variant="outline"
                    onClick={() => {
                      setSearchQuery("");
                      setSelectedCategory(null);
                    }}
                    className="rounded-full px-8"
                  >
                    Clear Filters
                  </Button>
                )}
              </div>
            )}
          </>
        )}
      </main>

      <PublicFooter />
    </div>
  );
};

export default Shop;
