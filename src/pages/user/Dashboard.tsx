import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { UserLayout } from "@/components/UserLayout";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { ShoppingBag, ShoppingCart, MapPin, Package, ArrowRight } from "lucide-react";
import { Link } from "react-router-dom";

const UserDashboard = () => {
  const { user, isLoading: authLoading } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!authLoading && !user) {
      navigate("/login");
    }
  }, [user, authLoading, navigate]);

  const { data: stats, isLoading } = useQuery({
    queryKey: ["user-dashboard-stats", user?.id],
    queryFn: async () => {
      const [ordersRes, cartRes, addressesRes] = await Promise.all([
        supabase.from("orders").select("id, status").eq("user_id", user!.id),
        supabase.from("cart_items").select("id").eq("user_id", user!.id),
        supabase.from("user_addresses").select("id").eq("user_id", user!.id),
      ]);

      return {
        totalOrders: ordersRes.data?.length || 0,
        pendingOrders: ordersRes.data?.filter(o => o.status === 'pending').length || 0,
        cartItems: cartRes.data?.length || 0,
        addresses: addressesRes.data?.length || 0,
      };
    },
    enabled: !!user,
  });

  const { data: recentOrders } = useQuery({
    queryKey: ["recent-orders", user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("orders")
        .select("*")
        .eq("user_id", user!.id)
        .order("created_at", { ascending: false })
        .limit(5);

      if (error) throw error;
      return data;
    },
    enabled: !!user,
  });

  if (authLoading) {
    return null;
  }

  return (
    <UserLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Dashboard</h1>
          <p className="text-muted-foreground">Welcome back! Here's an overview of your account.</p>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-primary/10 rounded-xl flex items-center justify-center">
                  <ShoppingBag className="w-6 h-6 text-primary" />
                </div>
                <div>
                  {isLoading ? (
                    <Skeleton className="h-8 w-16" />
                  ) : (
                    <p className="text-2xl font-bold text-foreground">{stats?.totalOrders}</p>
                  )}
                  <p className="text-sm text-muted-foreground">Total Orders</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-warning/10 rounded-xl flex items-center justify-center">
                  <Package className="w-6 h-6 text-warning" />
                </div>
                <div>
                  {isLoading ? (
                    <Skeleton className="h-8 w-16" />
                  ) : (
                    <p className="text-2xl font-bold text-foreground">{stats?.pendingOrders}</p>
                  )}
                  <p className="text-sm text-muted-foreground">Pending</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-accent/10 rounded-xl flex items-center justify-center">
                  <ShoppingCart className="w-6 h-6 text-accent" />
                </div>
                <div>
                  {isLoading ? (
                    <Skeleton className="h-8 w-16" />
                  ) : (
                    <p className="text-2xl font-bold text-foreground">{stats?.cartItems}</p>
                  )}
                  <p className="text-sm text-muted-foreground">Cart Items</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-success/10 rounded-xl flex items-center justify-center">
                  <MapPin className="w-6 h-6 text-success" />
                </div>
                <div>
                  {isLoading ? (
                    <Skeleton className="h-8 w-16" />
                  ) : (
                    <p className="text-2xl font-bold text-foreground">{stats?.addresses}</p>
                  )}
                  <p className="text-sm text-muted-foreground">Saved Addresses</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Recent Orders */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle>Recent Orders</CardTitle>
            <Button variant="ghost" size="sm" asChild>
              <Link to="/dashboard/orders">
                View All <ArrowRight className="w-4 h-4 ml-1" />
              </Link>
            </Button>
          </CardHeader>
          <CardContent>
            {recentOrders && recentOrders.length > 0 ? (
              <div className="space-y-3">
                {recentOrders.map((order) => (
                  <div
                    key={order.id}
                    className="flex items-center justify-between p-3 bg-muted/50 rounded-lg"
                  >
                    <div>
                      <p className="font-medium text-foreground">{order.order_number}</p>
                      <p className="text-sm text-muted-foreground">
                        {new Date(order.created_at).toLocaleDateString()}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="font-semibold text-primary">₹{order.total_amount.toLocaleString()}</p>
                      <span className={`text-xs px-2 py-1 rounded-full ${
                        order.status === 'delivered' ? 'bg-success/10 text-success' :
                        order.status === 'pending' ? 'bg-warning/10 text-warning' :
                        order.status === 'cancelled' ? 'bg-destructive/10 text-destructive' :
                        'bg-primary/10 text-primary'
                      }`}>
                        {order.status.charAt(0).toUpperCase() + order.status.slice(1)}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8">
                <ShoppingBag className="w-12 h-12 text-muted-foreground/30 mx-auto mb-3" />
                <p className="text-muted-foreground">No orders yet</p>
                <Button className="mt-4" asChild>
                  <Link to="/shop">Start Shopping</Link>
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </UserLayout>
  );
};

export default UserDashboard;
