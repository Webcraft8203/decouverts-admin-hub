import { useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { UserLayout } from "@/components/UserLayout";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { ShoppingCart, Trash2, Plus, Minus, Package, ArrowRight } from "lucide-react";
import { toast } from "sonner";

const UserCart = () => {
  const { user, isLoading: authLoading } = useAuth();
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  useEffect(() => {
    if (!authLoading && !user) {
      navigate("/login");
    }
  }, [user, authLoading, navigate]);

  const { data: cartItems, isLoading } = useQuery({
    queryKey: ["cart-items", user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("cart_items")
        .select("*, products(*)")
        .eq("user_id", user!.id)
        .order("created_at", { ascending: false });

      if (error) throw error;
      return data;
    },
    enabled: !!user,
  });

  const updateQuantityMutation = useMutation({
    mutationFn: async ({ id, quantity }: { id: string; quantity: number }) => {
      const { error } = await supabase
        .from("cart_items")
        .update({ quantity })
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["cart-items"] });
    },
    onError: () => {
      toast.error("Failed to update quantity");
    },
  });

  const removeItemMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from("cart_items")
        .delete()
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["cart-items"] });
      toast.success("Item removed from cart");
    },
    onError: () => {
      toast.error("Failed to remove item");
    },
  });

  const totalAmount = cartItems?.reduce((sum, item) => {
    return sum + (item.products?.price || 0) * item.quantity;
  }, 0) || 0;

  if (authLoading) {
    return null;
  }

  return (
    <UserLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-foreground">My Cart</h1>
            <p className="text-muted-foreground">
              {cartItems?.length || 0} items in your cart
            </p>
          </div>
          <Button asChild variant="outline">
            <Link to="/shop">Continue Shopping</Link>
          </Button>
        </div>

        {isLoading ? (
          <div className="space-y-4">
            {[...Array(3)].map((_, i) => (
              <Skeleton key={i} className="h-32 w-full" />
            ))}
          </div>
        ) : cartItems && cartItems.length > 0 ? (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Cart Items */}
            <div className="lg:col-span-2 space-y-4">
              {cartItems.map((item) => (
                <Card key={item.id}>
                  <CardContent className="p-4">
                    <div className="flex gap-4">
                      <div className="w-20 h-20 bg-muted rounded-lg overflow-hidden flex-shrink-0">
                        {item.products?.images && item.products.images.length > 0 ? (
                          <img
                            src={item.products.images[0]}
                            alt={item.products.name}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center">
                            <Package className="w-8 h-8 text-muted-foreground/30" />
                          </div>
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <h3 className="font-semibold text-foreground truncate">
                          {item.products?.name}
                        </h3>
                        <p className="text-primary font-bold mt-1">
                          ₹{item.products?.price.toLocaleString()}
                        </p>
                        <p className="text-sm text-muted-foreground">
                          {item.products?.stock_quantity} in stock
                        </p>
                      </div>
                      <div className="flex flex-col items-end gap-2">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => removeItemMutation.mutate(item.id)}
                          className="text-destructive hover:text-destructive"
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                        <div className="flex items-center gap-2">
                          <Button
                            variant="outline"
                            size="icon"
                            className="h-8 w-8"
                            onClick={() =>
                              updateQuantityMutation.mutate({
                                id: item.id,
                                quantity: Math.max(1, item.quantity - 1),
                              })
                            }
                            disabled={item.quantity <= 1}
                          >
                            <Minus className="w-3 h-3" />
                          </Button>
                          <Input
                            type="number"
                            value={item.quantity}
                            onChange={(e) =>
                              updateQuantityMutation.mutate({
                                id: item.id,
                                quantity: Math.max(1, parseInt(e.target.value) || 1),
                              })
                            }
                            className="w-16 h-8 text-center"
                            min="1"
                            max={item.products?.stock_quantity}
                          />
                          <Button
                            variant="outline"
                            size="icon"
                            className="h-8 w-8"
                            onClick={() =>
                              updateQuantityMutation.mutate({
                                id: item.id,
                                quantity: Math.min(
                                  item.products?.stock_quantity || 99,
                                  item.quantity + 1
                                ),
                              })
                            }
                            disabled={item.quantity >= (item.products?.stock_quantity || 99)}
                          >
                            <Plus className="w-3 h-3" />
                          </Button>
                        </div>
                        <p className="font-semibold">
                          ₹{((item.products?.price || 0) * item.quantity).toLocaleString()}
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>

            {/* Order Summary */}
            <div className="lg:col-span-1">
              <Card className="sticky top-24">
                <CardHeader>
                  <CardTitle>Order Summary</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Subtotal</span>
                      <span>₹{totalAmount.toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Shipping</span>
                      <span className="text-success">Free</span>
                    </div>
                  </div>
                  <div className="border-t pt-4">
                    <div className="flex justify-between font-bold text-lg">
                      <span>Total</span>
                      <span className="text-primary">₹{totalAmount.toLocaleString()}</span>
                    </div>
                  </div>
                  <Button
                    className="w-full"
                    size="lg"
                    onClick={() => navigate("/checkout/cart")}
                  >
                    Proceed to Checkout
                    <ArrowRight className="w-4 h-4 ml-2" />
                  </Button>
                </CardContent>
              </Card>
            </div>
          </div>
        ) : (
          <Card>
            <CardContent className="py-16 text-center">
              <ShoppingCart className="w-16 h-16 text-muted-foreground/30 mx-auto mb-4" />
              <h2 className="text-xl font-semibold text-foreground mb-2">Your cart is empty</h2>
              <p className="text-muted-foreground mb-6">
                Looks like you haven't added anything to your cart yet.
              </p>
              <Button asChild>
                <Link to="/shop">Start Shopping</Link>
              </Button>
            </CardContent>
          </Card>
        )}
      </div>
    </UserLayout>
  );
};

export default UserCart;
