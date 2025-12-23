import { useEffect } from "react";
import { useNavigate, useParams, Link } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { UserLayout } from "@/components/UserLayout";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Separator } from "@/components/ui/separator";
import { 
  ArrowLeft, 
  Package, 
  MapPin, 
  Phone, 
  User, 
  CreditCard, 
  Calendar,
  Download,
  Truck
} from "lucide-react";

const statusColors: Record<string, string> = {
  pending: "bg-warning/10 text-warning border-warning/20",
  confirmed: "bg-primary/10 text-primary border-primary/20",
  packing: "bg-blue-500/10 text-blue-500 border-blue-500/20",
  "waiting-for-pickup": "bg-orange-500/10 text-orange-500 border-orange-500/20",
  shipped: "bg-indigo-500/10 text-indigo-500 border-indigo-500/20",
  "out-for-delivery": "bg-purple-500/10 text-purple-500 border-purple-500/20",
  delivered: "bg-success/10 text-success border-success/20",
  cancelled: "bg-destructive/10 text-destructive border-destructive/20",
};

const statusLabels: Record<string, string> = {
  pending: "Pending Confirmation",
  confirmed: "Confirmed",
  packing: "Packing",
  "waiting-for-pickup": "Waiting for Pickup",
  shipped: "Shipped",
  "out-for-delivery": "Out for Delivery",
  delivered: "Delivered",
  cancelled: "Cancelled",
};

const OrderDetails = () => {
  const { orderId } = useParams();
  const { user, isLoading: authLoading } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!authLoading && !user) {
      navigate("/login");
    }
  }, [user, authLoading, navigate]);

  const { data: order, isLoading } = useQuery({
    queryKey: ["order-details", orderId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("orders")
        .select("*, order_items(*, products(name, images, description))")
        .eq("id", orderId)
        .eq("user_id", user!.id)
        .single();

      if (error) throw error;
      return data;
    },
    enabled: !!user && !!orderId,
  });

  if (authLoading) return null;

  const shippingAddress = order?.shipping_address as {
    full_name?: string;
    phone?: string;
    address_line1?: string;
    address_line2?: string;
    city?: string;
    state?: string;
    postal_code?: string;
    country?: string;
  } | null;

  return (
    <UserLayout>
      <div className="space-y-6">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" asChild>
            <Link to="/dashboard/orders">
              <ArrowLeft className="h-5 w-5" />
            </Link>
          </Button>
          <div>
            <h1 className="text-2xl font-bold text-foreground">Order Details</h1>
            {order && (
              <p className="text-muted-foreground">{order.order_number}</p>
            )}
          </div>
        </div>

        {isLoading ? (
          <div className="space-y-4">
            <Skeleton className="h-40 w-full" />
            <Skeleton className="h-60 w-full" />
            <Skeleton className="h-40 w-full" />
          </div>
        ) : order ? (
          <div className="grid gap-6 lg:grid-cols-3">
            {/* Order Items */}
            <div className="lg:col-span-2 space-y-6">
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
                  <CardTitle className="flex items-center gap-2">
                    <Package className="h-5 w-5 text-primary" />
                    Order Items
                  </CardTitle>
                  <Badge variant="outline" className={statusColors[order.status]}>
                    {statusLabels[order.status] || order.status}
                  </Badge>
                </CardHeader>
                <CardContent className="space-y-4">
                  {order.order_items?.map((item: any) => (
                    <div key={item.id} className="flex gap-4 p-4 bg-muted/30 rounded-lg">
                      <div className="w-20 h-20 bg-muted rounded-lg overflow-hidden flex-shrink-0">
                        {item.products?.images && item.products.images.length > 0 ? (
                          <img
                            src={item.products.images[0]}
                            alt={item.product_name}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center">
                            <Package className="w-8 h-8 text-muted-foreground/30" />
                          </div>
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <h3 className="font-semibold text-foreground">{item.product_name}</h3>
                        {item.products?.description && (
                          <p className="text-sm text-muted-foreground line-clamp-2 mt-1">
                            {item.products.description}
                          </p>
                        )}
                        <div className="flex items-center gap-4 mt-2 text-sm">
                          <span className="text-muted-foreground">
                            Qty: {item.quantity}
                          </span>
                          <span className="text-muted-foreground">
                            × ₹{item.product_price.toLocaleString()}
                          </span>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="font-bold text-lg">₹{item.total_price.toLocaleString()}</p>
                      </div>
                    </div>
                  ))}
                </CardContent>
              </Card>

              {/* Delivery Status Timeline */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Truck className="h-5 w-5 text-primary" />
                    Delivery Status
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="relative">
                    {["pending", "confirmed", "packing", "shipped", "out-for-delivery", "delivered"].map((status, index, arr) => {
                      const statusIndex = arr.indexOf(order.status);
                      const isCompleted = index <= statusIndex;
                      const isCurrent = status === order.status;
                      
                      return (
                        <div key={status} className="flex items-start gap-4 pb-6 last:pb-0">
                          <div className="relative flex flex-col items-center">
                            <div 
                              className={`w-4 h-4 rounded-full border-2 ${
                                isCompleted 
                                  ? "bg-primary border-primary" 
                                  : "bg-background border-muted-foreground/30"
                              } ${isCurrent ? "ring-4 ring-primary/20" : ""}`}
                            />
                            {index < arr.length - 1 && (
                              <div 
                                className={`w-0.5 h-8 ${
                                  isCompleted && index < statusIndex
                                    ? "bg-primary" 
                                    : "bg-muted-foreground/30"
                                }`}
                              />
                            )}
                          </div>
                          <div className={`flex-1 ${isCompleted ? "text-foreground" : "text-muted-foreground"}`}>
                            <p className={`font-medium ${isCurrent ? "text-primary" : ""}`}>
                              {statusLabels[status]}
                            </p>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Right Sidebar */}
            <div className="space-y-6">
              {/* Order Summary */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <CreditCard className="h-5 w-5 text-primary" />
                    Order Summary
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Subtotal</span>
                    <span>₹{order.subtotal.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Tax</span>
                    <span>₹{order.tax_amount.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Shipping</span>
                    <span>{order.shipping_amount === 0 ? "Free" : `₹${order.shipping_amount.toLocaleString()}`}</span>
                  </div>
                  <Separator />
                  <div className="flex justify-between font-bold text-lg">
                    <span>Total</span>
                    <span className="text-primary">₹{order.total_amount.toLocaleString()}</span>
                  </div>
                  <Separator />
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Calendar className="h-4 w-4" />
                    <span>Ordered on {new Date(order.created_at).toLocaleDateString()}</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm">
                    <Badge variant={order.payment_status === "paid" ? "default" : "secondary"}>
                      {order.payment_status === "paid" ? "Paid" : "Pending"}
                    </Badge>
                    {order.payment_id && (
                      <span className="text-xs text-muted-foreground truncate">
                        ID: {order.payment_id.slice(-8)}
                      </span>
                    )}
                  </div>
                  {order.invoice_url && (
                    <Button variant="outline" className="w-full mt-4" asChild>
                      <a href={order.invoice_url} target="_blank" rel="noopener noreferrer">
                        <Download className="w-4 h-4 mr-2" />
                        Download Invoice
                      </a>
                    </Button>
                  )}
                </CardContent>
              </Card>

              {/* Shipping Address */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <MapPin className="h-5 w-5 text-primary" />
                    Shipping Address
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  {shippingAddress ? (
                    <>
                      <div className="flex items-center gap-2">
                        <User className="h-4 w-4 text-muted-foreground" />
                        <span className="font-medium">{shippingAddress.full_name}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Phone className="h-4 w-4 text-muted-foreground" />
                        <span>{shippingAddress.phone}</span>
                      </div>
                      <div className="text-sm text-muted-foreground">
                        <p>{shippingAddress.address_line1}</p>
                        {shippingAddress.address_line2 && <p>{shippingAddress.address_line2}</p>}
                        <p>
                          {shippingAddress.city}, {shippingAddress.state} - {shippingAddress.postal_code}
                        </p>
                        <p>{shippingAddress.country}</p>
                      </div>
                    </>
                  ) : (
                    <p className="text-muted-foreground text-sm">Address not available</p>
                  )}
                </CardContent>
              </Card>
            </div>
          </div>
        ) : (
          <Card>
            <CardContent className="py-16 text-center">
              <Package className="w-16 h-16 text-muted-foreground/30 mx-auto mb-4" />
              <h2 className="text-xl font-semibold text-foreground mb-2">Order not found</h2>
              <p className="text-muted-foreground mb-6">
                This order doesn't exist or you don't have permission to view it.
              </p>
              <Button asChild>
                <Link to="/dashboard/orders">Back to Orders</Link>
              </Button>
            </CardContent>
          </Card>
        )}
      </div>
    </UserLayout>
  );
};

export default OrderDetails;
