import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useNavigate } from "react-router-dom";
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
} from "@/components/ui/carousel";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { ShoppingCart, Package } from "lucide-react";
import { WishlistButton } from "@/components/WishlistButton";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";

interface Product {
  id: string;
  name: string;
  price: number;
  images: string[] | null;
  category_id: string | null;
  stock_quantity: number;
  is_highlighted: boolean;
  categories: { name: string } | null;
}

interface RelatedProductsProps {
  categoryId: string | null;
  currentProductId: string;
}

export function RelatedProducts({ categoryId, currentProductId }: RelatedProductsProps) {
  const navigate = useNavigate();
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const { data: products, isLoading } = useQuery({
    queryKey: ["related-products", categoryId, currentProductId],
    queryFn: async () => {
      let query = supabase
        .from("products")
        .select("*, categories(name)")
        .neq("id", currentProductId)
        .gt("stock_quantity", 0)
        .limit(10);

      if (categoryId) {
        query = query.eq("category_id", categoryId);
      }

      const { data, error } = await query;
      if (error) throw error;
      
      // If not enough related products, fetch some random ones to fill
      if (!data || data.length < 4) {
         const { data: randomProducts } = await supabase
            .from("products")
            .select("*, categories(name)")
            .neq("id", currentProductId)
            .gt("stock_quantity", 0)
            .limit(10);
            
         return randomProducts as Product[];
      }

      return data as Product[];
    },
    enabled: !!currentProductId,
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
    e.preventDefault();
    if (!user) {
      toast.info("Please login to add items to cart", {
        action: { label: "Login", onClick: () => navigate("/login") },
      });
      return;
    }
    addToCartMutation.mutate(productId);
  };

  if (isLoading) {
    return (
      <div className="mt-16 space-y-6">
        <Skeleton className="h-8 w-48" />
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map((i) => (
            <Skeleton key={i} className="h-[300px] w-full rounded-xl" />
          ))}
        </div>
      </div>
    );
  }

  if (!products || products.length === 0) {
    return null;
  }

  return (
    <section className="mt-16 border-t border-slate-200 pt-12">
      <h2 className="text-2xl font-bold text-slate-900 mb-8">Related Products</h2>
      
      <Carousel
        opts={{
          align: "start",
          loop: true,
        }}
        className="w-full hidden md:block"
      >
        <CarouselContent className="-ml-4">
          {products.map((product) => (
            <CarouselItem key={product.id} className="pl-4 md:basis-1/2 lg:basis-1/4">
              <div
                onClick={() => navigate(`/product/${product.id}`)}
                className="group cursor-pointer"
              >
                {/* Image Container */}
                <div className="relative aspect-square overflow-hidden rounded-lg bg-secondary/50 mb-4 border border-slate-100">
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
                      <Package className="w-16 h-16 text-muted-foreground/20" />
                    </div>
                  )}
                  
                  {/* Badges */}
                  <div className="absolute top-3 left-3 flex flex-col gap-2">
                    {product.is_highlighted && (
                      <Badge className="bg-foreground text-background text-[10px] font-medium px-2.5 py-1 rounded-sm">
                        BESTSELLER
                      </Badge>
                    )}
                    {product.stock_quantity <= 5 && (
                      <Badge className="bg-destructive text-destructive-foreground text-[10px] font-medium px-2.5 py-1 rounded-sm">
                        LOW STOCK
                      </Badge>
                    )}
                  </div>

                  {/* Quick Actions */}
                  <div className="absolute top-3 right-3 opacity-0 group-hover:opacity-100 transition-all duration-300 translate-y-2 group-hover:translate-y-0">
                    <WishlistButton productId={product.id} size="sm" />
                  </div>

                  {/* Quick Add Button */}
                  <div className="absolute bottom-0 left-0 right-0 p-3 opacity-0 group-hover:opacity-100 transition-all duration-300 translate-y-4 group-hover:translate-y-0">
                    <Button
                      onClick={(e) => handleAddToCart(e, product.id)}
                      className="w-full bg-foreground hover:bg-foreground/90 text-background font-medium h-11 rounded-md shadow-lg"
                    >
                      <ShoppingCart className="w-4 h-4 mr-2" />
                      Add to Cart
                    </Button>
                  </div>
                </div>

                {/* Product Info */}
                <div className="space-y-2">
                  {product.categories && (
                    <p className="text-xs text-muted-foreground uppercase tracking-wider">
                      {product.categories.name}
                    </p>
                  )}
                  <h3 className="font-medium text-foreground text-sm sm:text-base leading-tight group-hover:text-primary transition-colors line-clamp-2">
                    {product.name}
                  </h3>
                  <p className="text-base sm:text-lg font-semibold text-foreground">
                    ₹{product.price.toLocaleString("en-IN")}
                  </p>
                </div>
              </div>
            </CarouselItem>
          ))}
        </CarouselContent>
        <div className="flex justify-end gap-2 mt-6">
            <CarouselPrevious className="static translate-y-0 border-slate-200 hover:bg-slate-100 hover:text-orange-600" />
            <CarouselNext className="static translate-y-0 border-slate-200 hover:bg-slate-100 hover:text-orange-600" />
        </div>
      </Carousel>

      {/* Mobile List View */}
      <div className="flex flex-col gap-4 md:hidden">
        {products.slice(0, 5).map((product) => (
          <div
            key={product.id}
            onClick={() => navigate(`/product/${product.id}`)}
            className="flex gap-4 p-3 border border-slate-100 rounded-xl bg-white shadow-sm active:scale-[0.98] transition-transform"
          >
            {/* Image */}
            <div className="w-24 h-24 flex-shrink-0 bg-secondary/30 rounded-lg overflow-hidden border border-slate-100">
              {product.images && product.images.length > 0 ? (
                <img
                  src={product.images[0]}
                  alt={product.name}
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center">
                  <Package className="w-8 h-8 text-muted-foreground/20" />
                </div>
              )}
            </div>

            {/* Details */}
            <div className="flex flex-col justify-between flex-1 py-0.5">
              <div>
                <h3 className="font-medium text-slate-900 line-clamp-2 text-sm leading-snug mb-1">
                  {product.name}
                </h3>
                <p className="text-lg font-bold text-slate-900">
                  ₹{product.price.toLocaleString("en-IN")}
                </p>
              </div>
              
              <div className="flex items-center justify-between mt-2">
                 {product.stock_quantity <= 5 && product.stock_quantity > 0 ? (
                    <span className="text-[10px] text-red-600 font-medium bg-red-50 px-2 py-0.5 rounded-full">
                      Low Stock
                    </span>
                 ) : (
                    <span /> 
                 )}
                 <Button 
                   size="sm" 
                   variant="outline"
                   className="h-8 px-4 border-slate-200 text-slate-700"
                   onClick={(e) => handleAddToCart(e, product.id)}
                 >
                   Add
                 </Button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}