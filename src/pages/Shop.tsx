import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { PublicNavbar } from "@/components/PublicNavbar";
import { PublicFooter } from "@/components/PublicFooter";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { ShoppingCart, Package, Search, Plus, Star, ArrowRight, Sparkles, Share2 } from "lucide-react";
import { Input } from "@/components/ui/input";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
} from "@/components/ui/carousel";
import Autoplay from "embla-carousel-autoplay";

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
}

const Shop = () => {
  const [searchQuery, setSearchQuery] = useState("");
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

  const filteredProducts = products?.filter(
    (product) =>
      product.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      product.description?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const highlightedProducts = products?.filter((p) => p.is_highlighted) || [];

  const getProductsByCategory = (categoryId: string) => {
    return filteredProducts?.filter((p) => p.category_id === categoryId) || [];
  };

  const uncategorizedProducts = filteredProducts?.filter((p) => !p.category_id) || [];

  const ProductCard = ({ product }: { product: Product }) => (
    <Card
      onClick={() => navigate(`/product/${product.id}`)}
      className="group cursor-pointer overflow-hidden border-0 bg-card/50 backdrop-blur-sm hover:bg-card transition-all duration-300 hover:shadow-2xl hover:shadow-primary/10 hover:-translate-y-1"
    >
      <div className="relative aspect-square overflow-hidden bg-gradient-to-br from-muted to-muted/50">
        {product.images && product.images.length > 0 ? (
          <img
            src={product.images[0]}
            alt={product.name}
            className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <Package className="w-16 h-16 text-muted-foreground/20" />
          </div>
        )}
        
        {/* Overlay on hover */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
        
        {/* Quick Add Button */}
        <Button
          size="sm"
          onClick={(e) => handleAddToCart(e, product.id)}
          className="absolute bottom-4 left-1/2 -translate-x-1/2 translate-y-4 opacity-0 group-hover:translate-y-0 group-hover:opacity-100 transition-all duration-300 bg-white text-black hover:bg-white/90 rounded-full px-6 shadow-lg"
        >
          <Plus className="w-4 h-4 mr-1" /> Add to Cart
        </Button>

        {/* Badges */}
        <div className="absolute top-3 left-3 flex flex-col gap-2">
          {product.is_highlighted && (
            <Badge className="bg-warning/90 text-warning-foreground backdrop-blur-sm">
              <Sparkles className="w-3 h-3 mr-1" /> Featured
            </Badge>
          )}
          {product.stock_quantity <= 5 && (
            <Badge variant="destructive" className="backdrop-blur-sm">
              Only {product.stock_quantity} left
            </Badge>
          )}
        </div>

        {/* Share Button */}
        <Button
          size="icon"
          variant="secondary"
          onClick={(e) => handleShare(e, product)}
          className="absolute top-3 right-3 w-9 h-9 rounded-full bg-background/80 backdrop-blur-sm opacity-0 group-hover:opacity-100 transition-opacity shadow-lg hover:bg-background"
        >
          <Share2 className="w-4 h-4" />
        </Button>
      </div>

      <CardContent className="p-5">
        {product.categories && (
          <p className="text-xs font-medium text-primary mb-2 uppercase tracking-wider">
            {product.categories.name}
          </p>
        )}
        <h3 className="font-semibold text-foreground text-lg mb-2 line-clamp-1 group-hover:text-primary transition-colors">
          {product.name}
        </h3>
        <p className="text-muted-foreground text-sm mb-4 line-clamp-2 leading-relaxed">
          {product.description || "Premium quality product"}
        </p>
        <div className="flex items-center justify-between">
          <span className="text-2xl font-bold bg-gradient-to-r from-primary to-primary/70 bg-clip-text text-transparent">
            ₹{product.price.toLocaleString()}
          </span>
          <ArrowRight className="w-5 h-5 text-muted-foreground group-hover:text-primary group-hover:translate-x-1 transition-all" />
        </div>
      </CardContent>
    </Card>
  );

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <PublicNavbar />

      <main className="flex-1 pt-20">
        {/* Hero Section */}
        <section className="relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-background to-accent/5" />
          <div className="absolute top-0 right-0 w-96 h-96 bg-primary/10 rounded-full blur-3xl" />
          <div className="absolute bottom-0 left-0 w-96 h-96 bg-accent/10 rounded-full blur-3xl" />
          
          <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 sm:py-24">
            <div className="max-w-3xl">
              <Badge className="mb-6 px-4 py-1.5 text-sm font-medium bg-primary/10 text-primary hover:bg-primary/20 border-0">
                <Sparkles className="w-4 h-4 mr-2" /> Premium Collection
              </Badge>
              <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold text-foreground mb-6 leading-tight">
                Discover
                <span className="block bg-gradient-to-r from-primary via-primary/80 to-accent bg-clip-text text-transparent">
                  Premium Products
                </span>
              </h1>
              <p className="text-lg sm:text-xl text-muted-foreground mb-8 leading-relaxed max-w-xl">
                Explore our curated collection of high-quality products designed to elevate your experience.
              </p>

              {/* Search */}
              <div className="relative max-w-md">
                <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                <Input
                  placeholder="Search products..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-12 h-14 text-lg bg-card/50 backdrop-blur-sm border-border/50 rounded-2xl focus:ring-2 focus:ring-primary/20"
                />
              </div>
            </div>
          </div>
        </section>

        {/* Featured Products Carousel */}
        {highlightedProducts.length > 0 && (
          <section className="py-16 bg-gradient-to-b from-primary/5 to-background">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
              <div className="flex items-center justify-between mb-10">
                <div className="flex items-center gap-4">
                  <div className="p-3 bg-warning/10 rounded-2xl">
                    <Star className="w-6 h-6 text-warning fill-warning" />
                  </div>
                  <div>
                    <h2 className="text-2xl sm:text-3xl font-bold text-foreground">Featured Products</h2>
                    <p className="text-muted-foreground">Hand-picked favorites just for you</p>
                  </div>
                </div>
              </div>

              <Carousel
                opts={{ align: "start", loop: true }}
                plugins={[
                  Autoplay({
                    delay: 5000,
                    stopOnInteraction: true,
                    stopOnMouseEnter: true,
                  }),
                ]}
                className="w-full"
              >
                <CarouselContent className="-ml-4">
                  {highlightedProducts.map((product) => (
                    <CarouselItem key={product.id} className="pl-4 basis-full sm:basis-1/2 lg:basis-1/3">
                      <Card
                        onClick={() => navigate(`/product/${product.id}`)}
                        className="group cursor-pointer overflow-hidden border-2 border-warning/20 hover:border-warning/50 bg-gradient-to-br from-warning/5 to-background transition-all duration-300 hover:shadow-xl hover:shadow-warning/10"
                      >
                        <div className="relative aspect-[4/3] overflow-hidden">
                          {product.images && product.images.length > 0 ? (
                            <img
                              src={product.images[0]}
                              alt={product.name}
                              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                            />
                          ) : (
                            <div className="w-full h-full bg-muted flex items-center justify-center">
                              <Package className="w-20 h-20 text-muted-foreground/20" />
                            </div>
                          )}
                          <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent" />
                          <div className="absolute bottom-0 left-0 right-0 p-6 text-white">
                            <Badge className="mb-3 bg-warning text-warning-foreground">
                              <Star className="w-3 h-3 mr-1 fill-current" /> Featured
                            </Badge>
                            <h3 className="text-xl font-bold mb-2 line-clamp-1">{product.name}</h3>
                            <div className="flex items-center justify-between">
                              <span className="text-2xl font-bold">₹{product.price.toLocaleString()}</span>
                              <Button
                                size="sm"
                                className="bg-white text-black hover:bg-white/90 rounded-full"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  navigate(`/product/${product.id}`);
                                }}
                              >
                                View <ArrowRight className="w-4 h-4 ml-1" />
                              </Button>
                            </div>
                          </div>
                        </div>
                      </Card>
                    </CarouselItem>
                  ))}
                </CarouselContent>
                <CarouselPrevious className="hidden sm:flex -left-4 bg-background/80 backdrop-blur-sm" />
                <CarouselNext className="hidden sm:flex -right-4 bg-background/80 backdrop-blur-sm" />
              </Carousel>
            </div>
          </section>
        )}

        {/* Products by Category */}
        <section className="py-16">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-20">
            {productsLoading ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                {[...Array(8)].map((_, i) => (
                  <Card key={i} className="overflow-hidden border-0 bg-card/50">
                    <Skeleton className="aspect-square" />
                    <CardContent className="p-5">
                      <Skeleton className="h-4 w-1/3 mb-2" />
                      <Skeleton className="h-6 w-3/4 mb-2" />
                      <Skeleton className="h-4 w-full mb-4" />
                      <Skeleton className="h-8 w-1/2" />
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : (
              <>
                {categories?.map((category) => {
                  const categoryProducts = getProductsByCategory(category.id);
                  if (categoryProducts.length === 0) return null;

                  return (
                    <div key={category.id}>
                      <div className="flex items-center gap-4 mb-8">
                        <div className="h-12 w-1.5 bg-gradient-to-b from-primary to-primary/50 rounded-full" />
                        <div>
                          <h2 className="text-2xl sm:text-3xl font-bold text-foreground">{category.name}</h2>
                          <p className="text-muted-foreground">
                            {categoryProducts.length} product{categoryProducts.length !== 1 ? "s" : ""}
                          </p>
                        </div>
                      </div>
                      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                        {categoryProducts.map((product) => (
                          <ProductCard key={product.id} product={product} />
                        ))}
                      </div>
                    </div>
                  );
                })}

                {uncategorizedProducts.length > 0 && (
                  <div>
                    <div className="flex items-center gap-4 mb-8">
                      <div className="h-12 w-1.5 bg-gradient-to-b from-muted-foreground to-muted-foreground/50 rounded-full" />
                      <div>
                        <h2 className="text-2xl sm:text-3xl font-bold text-foreground">Other Products</h2>
                        <p className="text-muted-foreground">
                          {uncategorizedProducts.length} product{uncategorizedProducts.length !== 1 ? "s" : ""}
                        </p>
                      </div>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                      {uncategorizedProducts.map((product) => (
                        <ProductCard key={product.id} product={product} />
                      ))}
                    </div>
                  </div>
                )}

                {filteredProducts && filteredProducts.length === 0 && (
                  <div className="text-center py-24">
                    <div className="w-24 h-24 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-6">
                      <Package className="w-12 h-12 text-primary" />
                    </div>
                    <h2 className="text-2xl font-bold text-foreground mb-4">
                      {searchQuery ? "No products found" : "Products Coming Soon"}
                    </h2>
                    <p className="text-muted-foreground text-lg max-w-md mx-auto mb-8">
                      {searchQuery
                        ? "Try adjusting your search query."
                        : "We're preparing an amazing collection of premium products."}
                    </p>
                    {searchQuery && (
                      <Button
                        variant="outline"
                        onClick={() => setSearchQuery("")}
                        className="rounded-full px-8"
                      >
                        Clear Search
                      </Button>
                    )}
                  </div>
                )}
              </>
            )}
          </div>
        </section>
      </main>

      <PublicFooter />
    </div>
  );
};

export default Shop;