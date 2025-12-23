import { useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { UserLayout } from "@/components/UserLayout";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { useInvoiceDownload } from "@/hooks/useInvoiceDownload";
import { ShoppingBag, Package, Eye, Download } from "lucide-react";

const statusColors: Record<string, string> = {
  pending: "bg-warning/10 text-warning border-warning/20",
  confirmed: "bg-primary/10 text-primary border-primary/20",
  processing: "bg-primary/10 text-primary border-primary/20",
  shipped: "bg-blue-500/10 text-blue-500 border-blue-500/20",
  delivered: "bg-success/10 text-success border-success/20",
  cancelled: "bg-destructive/10 text-destructive border-destructive/20",
};

const UserOrders = () => {
  const { user, isLoading: authLoading } = useAuth();
  const { downloadInvoice, isDownloading } = useInvoiceDownload();
  const navigate = useNavigate();

  useEffect(() => {
    if (!authLoading && !user) {
      navigate("/login");
    }
  }, [user, authLoading, navigate]);

  const { data: orders, isLoading } = useQuery({
    queryKey: ["user-orders", user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("orders")
        .select("*, order_items(*, products(name, images))")
        .eq("user_id", user!.id)
        .order("created_at", { ascending: false });

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
          <h1 className="text-2xl font-bold text-foreground">My Orders</h1>
          <p className="text-muted-foreground">Track and manage your orders</p>
        </div>

        {isLoading ? (
          <div className="space-y-4">
            {[...Array(3)].map((_, i) => (
              <Skeleton key={i} className="h-40 w-full" />
            ))}
          </div>
        ) : orders && orders.length > 0 ? (
          <div className="space-y-4">
            {orders.map((order) => (
              <Card key={order.id} className="overflow-hidden">
                <div className="bg-muted/50 px-4 py-3 border-b flex flex-wrap items-center justify-between gap-2">
                  <div className="flex items-center gap-4">
                    <span className="font-semibold text-foreground">{order.order_number}</span>
                    <Badge variant="outline" className={statusColors[order.status]}>
                      {order.status.charAt(0).toUpperCase() + order.status.slice(1)}
                    </Badge>
                  </div>
                  <div className="flex items-center gap-4 text-sm text-muted-foreground">
                    <span>{new Date(order.created_at).toLocaleDateString()}</span>
                    <span className="font-semibold text-primary">
                      ₹{order.total_amount.toLocaleString()}
                    </span>
                  </div>
                </div>
                <CardContent className="p-4">
                  <div className="space-y-3">
                    {order.order_items?.slice(0, 3).map((item: any) => (
                      <div key={item.id} className="flex items-center gap-3">
                        <div className="w-12 h-12 bg-muted rounded-lg overflow-hidden flex-shrink-0">
                          {item.products?.images && item.products.images.length > 0 ? (
                            <img
                              src={item.products.images[0]}
                              alt={item.product_name}
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center">
                              <Package className="w-5 h-5 text-muted-foreground/30" />
                            </div>
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="font-medium text-foreground truncate">{item.product_name}</p>
                          <p className="text-sm text-muted-foreground">
                            Qty: {item.quantity} × ₹{item.product_price.toLocaleString()}
                          </p>
                        </div>
                        <p className="font-semibold">₹{item.total_price.toLocaleString()}</p>
                      </div>
                    ))}
                    {order.order_items && order.order_items.length > 3 && (
                      <p className="text-sm text-muted-foreground">
                        +{order.order_items.length - 3} more items
                      </p>
                    )}
                  </div>
                  <div className="flex gap-2 mt-4 pt-4 border-t">
                    <Button variant="outline" size="sm" asChild>
                      <Link to={`/dashboard/orders/${order.id}`}>
                        <Eye className="w-4 h-4 mr-1" />
                        View Details
                      </Link>
                    </Button>
                    {order.invoice_url && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => downloadInvoice(order.id)}
                        disabled={isDownloading}
                      >
                        <Download className="w-4 h-4 mr-1" />
                        Invoice
                      </Button>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : (
          <Card>
            <CardContent className="py-16 text-center">
              <ShoppingBag className="w-16 h-16 text-muted-foreground/30 mx-auto mb-4" />
              <h2 className="text-xl font-semibold text-foreground mb-2">No orders yet</h2>
              <p className="text-muted-foreground mb-6">
                You haven't placed any orders yet. Start shopping to see your orders here!
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

export default UserOrders;
