import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { PublicNavbar } from "@/components/PublicNavbar";
import { PublicFooter } from "@/components/PublicFooter";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { ShoppingCart, Package, Search, Plus, ChevronLeft, ChevronRight, Star } from "lucide-react";
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
    onError: () => {
      toast.error("Failed to add to cart");
    },
  });

  const handleAddToCart = (productId: string) => {
    if (!user) {
      toast.info("Please login to add items to cart", {
        action: {
          label: "Login",
          onClick: () => navigate("/login"),
        },
      });
      return;
    }
    addToCartMutation.mutate(productId);
  };

  const handleBuyNow = (product: Product) => {
    if (!user) {
      toast.info("Please login to purchase", {
        action: {
          label: "Login",
          onClick: () => navigate("/login"),
        },
      });
      return;
    }
    navigate(`/checkout/${product.id}`);
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
    <Card className="overflow-hidden border-border hover:border-primary/30 transition-all hover:shadow-lg group h-full flex flex-col">
      <div className="relative h-48 bg-muted overflow-hidden">
        {product.images && product.images.length > 0 ? (
          <img
            src={product.images[0]}
            alt={product.name}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <Package className="w-16 h-16 text-muted-foreground/30" />
          </div>
        )}
        {product.categories && (
          <Badge className="absolute top-3 left-3 bg-primary text-primary-foreground">
            {product.categories.name}
          </Badge>
        )}
        {product.is_highlighted && (
          <Badge className="absolute top-3 right-3 bg-warning text-warning-foreground">
            <Star className="w-3 h-3 mr-1 fill-current" />
            Featured
          </Badge>
        )}
      </div>
      <CardContent className="p-4 flex-1">
        <h3 className="font-semibold text-foreground text-lg mb-2 line-clamp-1">
          {product.name}
        </h3>
        <p className="text-muted-foreground text-sm mb-3 line-clamp-2">
          {product.description || "Premium quality product"}
        </p>
        <div className="flex items-center justify-between">
          <span className="text-2xl font-bold text-primary">
            ₹{product.price.toLocaleString()}
          </span>
          <span className="text-sm text-muted-foreground">
            {product.stock_quantity} in stock
          </span>
        </div>
      </CardContent>
      <CardFooter className="p-4 pt-0 flex gap-2">
        <Button
          variant="outline"
          onClick={() => handleAddToCart(product.id)}
          disabled={addToCartMutation.isPending}
          className="flex-1 border-primary text-primary hover:bg-primary hover:text-primary-foreground"
        >
          <Plus className="w-4 h-4 mr-1" />
          Add to Cart
        </Button>
        <Button
          onClick={() => handleBuyNow(product)}
          className="flex-1 bg-accent text-accent-foreground hover:bg-accent/90"
        >
          <ShoppingCart className="w-4 h-4 mr-1" />
          Buy Now
        </Button>
      </CardFooter>
    </Card>
  );

  return (
    <div className="min-h-screen flex flex-col">
      <PublicNavbar />

      <main className="flex-1 pt-20">
        {/* Header */}
        <section className="bg-gradient-to-br from-accent to-accent/90 text-accent-foreground py-16">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold mb-4">
              Shop <span className="text-primary">Premium Products</span>
            </h1>
            <p className="text-accent-foreground/70 text-lg max-w-2xl">
              Browse our curated collection of high-quality products.
            </p>

            {/* Search */}
            <div className="mt-8 max-w-md">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                <Input
                  placeholder="Search products..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10 bg-background/10 border-accent-foreground/20 text-accent-foreground placeholder:text-accent-foreground/50"
                />
              </div>
            </div>
          </div>
        </section>

        {/* Highlighted Products Carousel */}
        {highlightedProducts.length > 0 && (
          <section className="py-12 bg-gradient-to-b from-background to-muted/30">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
              <div className="flex items-center gap-3 mb-8">
                <Star className="w-6 h-6 text-warning fill-warning" />
                <h2 className="text-2xl sm:text-3xl font-bold text-foreground">Featured Products</h2>
              </div>
              
              <Carousel
                opts={{
                  align: "start",
                  loop: true,
                }}
                plugins={[
                  Autoplay({
                    delay: 4000,
                    stopOnInteraction: true,
                    stopOnMouseEnter: true,
                  }),
                ]}
                className="w-full"
              >
                <CarouselContent className="-ml-4">
                  {highlightedProducts.map((product) => (
                    <CarouselItem key={product.id} className="pl-4 basis-full sm:basis-1/2 lg:basis-1/3 xl:basis-1/4">
                      <div className="h-full">
                        <Card className="overflow-hidden border-2 border-warning/30 hover:border-warning transition-all hover:shadow-xl group h-full flex flex-col bg-gradient-to-br from-background to-warning/5">
                          <div className="relative h-56 bg-muted overflow-hidden">
                            {product.images && product.images.length > 0 ? (
                              <img
                                src={product.images[0]}
                                alt={product.name}
                                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                              />
                            ) : (
                              <div className="w-full h-full flex items-center justify-center">
                                <Package className="w-20 h-20 text-muted-foreground/30" />
                              </div>
                            )}
                            <div className="absolute top-0 left-0 right-0 bg-gradient-to-b from-black/40 to-transparent p-4">
                              <Badge className="bg-warning text-warning-foreground">
                                <Star className="w-3 h-3 mr-1 fill-current" />
                                Featured
                              </Badge>
                            </div>
                          </div>
                          <CardContent className="p-5 flex-1">
                            <h3 className="font-bold text-foreground text-xl mb-2 line-clamp-1">
                              {product.name}
                            </h3>
                            <p className="text-muted-foreground text-sm mb-4 line-clamp-2">
                              {product.description || "Premium quality product"}
                            </p>
                            <div className="flex items-center justify-between">
                              <span className="text-3xl font-bold text-primary">
                                ₹{product.price.toLocaleString()}
                              </span>
                            </div>
                          </CardContent>
                          <CardFooter className="p-5 pt-0">
                            <Button
                              onClick={() => handleBuyNow(product)}
                              className="w-full bg-warning text-warning-foreground hover:bg-warning/90 font-semibold"
                              size="lg"
                            >
                              <ShoppingCart className="w-5 h-5 mr-2" />
                              Shop Now
                            </Button>
                          </CardFooter>
                        </Card>
                      </div>
                    </CarouselItem>
                  ))}
                </CarouselContent>
                <CarouselPrevious className="hidden sm:flex -left-4" />
                <CarouselNext className="hidden sm:flex -right-4" />
              </Carousel>
            </div>
          </section>
        )}

        {/* Category-wise Products */}
        <section className="py-12">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-16">
            {productsLoading ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                {[...Array(8)].map((_, i) => (
                  <Card key={i} className="overflow-hidden">
                    <Skeleton className="h-48 w-full" />
                    <CardContent className="p-4">
                      <Skeleton className="h-6 w-3/4 mb-2" />
                      <Skeleton className="h-4 w-full mb-2" />
                      <Skeleton className="h-4 w-1/2" />
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
                      <div className="flex items-center gap-3 mb-6">
                        <div className="h-8 w-1 bg-primary rounded-full" />
                        <h2 className="text-2xl font-bold text-foreground">{category.name}</h2>
                        <Badge variant="secondary" className="ml-2">
                          {categoryProducts.length} products
                        </Badge>
                      </div>
                      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                        {categoryProducts.map((product) => (
                          <ProductCard key={product.id} product={product} />
                        ))}
                      </div>
                    </div>
                  );
                })}

                {/* Uncategorized Products */}
                {uncategorizedProducts.length > 0 && (
                  <div>
                    <div className="flex items-center gap-3 mb-6">
                      <div className="h-8 w-1 bg-muted-foreground rounded-full" />
                      <h2 className="text-2xl font-bold text-foreground">Other Products</h2>
                      <Badge variant="secondary" className="ml-2">
                        {uncategorizedProducts.length} products
                      </Badge>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                      {uncategorizedProducts.map((product) => (
                        <ProductCard key={product.id} product={product} />
                      ))}
                    </div>
                  </div>
                )}

                {filteredProducts && filteredProducts.length === 0 && (
                  <div className="text-center py-20">
                    <div className="w-24 h-24 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-6">
                      <Package className="w-12 h-12 text-primary" />
                    </div>
                    <h2 className="text-2xl font-bold text-foreground mb-4">
                      {searchQuery ? "No products found" : "Products Coming Soon"}
                    </h2>
                    <p className="text-muted-foreground text-lg max-w-md mx-auto mb-8">
                      {searchQuery 
                        ? "Try adjusting your search query." 
                        : "We're preparing an amazing collection of premium products. Check back soon for exciting offerings!"}
                    </p>
                    {searchQuery && (
                      <Button
                        variant="outline"
                        onClick={() => setSearchQuery("")}
                        className="border-primary text-primary hover:bg-primary hover:text-primary-foreground"
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