import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { PublicNavbar } from "@/components/PublicNavbar";
import { PublicFooter } from "@/components/PublicFooter";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { ShoppingCart, Package, Search, Plus } from "lucide-react";
import { Input } from "@/components/ui/input";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";

const Shop = () => {
  const [searchQuery, setSearchQuery] = useState("");
  const navigate = useNavigate();
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const { data: products, isLoading } = useQuery({
    queryKey: ["public-products"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("products")
        .select("*, categories(name)")
        .eq("availability_status", "in_stock")
        .gt("stock_quantity", 0)
        .order("created_at", { ascending: false });

      if (error) throw error;
      return data;
    },
  });

  const addToCartMutation = useMutation({
    mutationFn: async (productId: string) => {
      if (!user) throw new Error("Not authenticated");
      
      // Check if item already exists in cart
      const { data: existingItem } = await supabase
        .from("cart_items")
        .select("id, quantity")
        .eq("user_id", user.id)
        .eq("product_id", productId)
        .maybeSingle();

      if (existingItem) {
        // Update quantity
        const { error } = await supabase
          .from("cart_items")
          .update({ quantity: existingItem.quantity + 1 })
          .eq("id", existingItem.id);
        if (error) throw error;
      } else {
        // Insert new item
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

  const filteredProducts = products?.filter(
    (product) =>
      product.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      product.description?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleBuyNow = (product: typeof products extends (infer T)[] ? T : never) => {
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

        {/* Products Grid */}
        <section className="py-16">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            {isLoading ? (
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
            ) : filteredProducts && filteredProducts.length > 0 ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                {filteredProducts.map((product) => (
                  <Card
                    key={product.id}
                    className="overflow-hidden border-border hover:border-primary/30 transition-all hover:shadow-lg group"
                  >
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
                          {(product.categories as { name: string }).name}
                        </Badge>
                      )}
                    </div>
                    <CardContent className="p-4">
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
                ))}
              </div>
            ) : (
              <div className="text-center py-20">
                <div className="w-24 h-24 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-6">
                  <Package className="w-12 h-12 text-primary" />
                </div>
                <h2 className="text-2xl font-bold text-foreground mb-4">
                  Products Coming Soon
                </h2>
                <p className="text-muted-foreground text-lg max-w-md mx-auto mb-8">
                  We're preparing an amazing collection of premium products. 
                  Check back soon for exciting offerings!
                </p>
                <Button
                  variant="outline"
                  onClick={() => navigate("/")}
                  className="border-primary text-primary hover:bg-primary hover:text-primary-foreground"
                >
                  Back to Home
                </Button>
              </div>
            )}
          </div>
        </section>
      </main>

      <PublicFooter />
    </div>
  );
};

export default Shop;
