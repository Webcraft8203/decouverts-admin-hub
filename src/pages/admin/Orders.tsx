import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { Input } from "@/components/ui/input";
import { 
  Package, 
  User, 
  MapPin, 
  Clock, 
  Phone, 
  CheckCircle, 
  Truck, 
  PackageCheck,
  Timer,
  XCircle,
  AlertCircle,
  Search,
  Trash2,
  MessageSquare
} from "lucide-react";
import { AdminNotes } from "@/components/admin/AdminNotes";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

const statusOptions = [
  { value: "pending", label: "Pending Confirmation", icon: Timer, color: "bg-warning/10 text-warning" },
  { value: "confirmed", label: "Confirmed", icon: CheckCircle, color: "bg-blue-500/10 text-blue-500" },
  { value: "packing", label: "Packing", icon: Package, color: "bg-purple-500/10 text-purple-500" },
  { value: "waiting-for-pickup", label: "Waiting for Pickup", icon: Timer, color: "bg-orange-500/10 text-orange-500" },
  { value: "shipped", label: "Shipped", icon: Truck, color: "bg-indigo-500/10 text-indigo-500" },
  { value: "out-for-delivery", label: "Out for Delivery", icon: Truck, color: "bg-cyan-500/10 text-cyan-500" },
  { value: "delivered", label: "Delivered", icon: PackageCheck, color: "bg-green-500/10 text-green-500" },
  { value: "cancelled", label: "Cancelled", icon: XCircle, color: "bg-destructive/10 text-destructive" },
];

const getStatusInfo = (status: string) => {
  return statusOptions.find((s) => s.value === status) || statusOptions[0];
};

const AdminOrders = () => {
  const queryClient = useQueryClient();
  const [filterStatus, setFilterStatus] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedOrder, setSelectedOrder] = useState<any>(null);

  const { data: orders, isLoading } = useQuery({
    queryKey: ["admin-orders"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("orders")
        .select("*, order_items(*, products(name, images))")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data;
    },
  });

  const updateStatusMutation = useMutation({
    mutationFn: async ({ id, status }: { id: string; status: string }) => {
      const { error } = await supabase.from("orders").update({ status }).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-orders"] });
      toast.success("Order status updated");
    },
    onError: () => toast.error("Failed to update status"),
  });

  const deleteOrderMutation = useMutation({
    mutationFn: async (orderId: string) => {
      // First delete order items
      const { error: itemsError } = await supabase
        .from("order_items")
        .delete()
        .eq("order_id", orderId);
      if (itemsError) throw itemsError;
      
      // Then delete the order
      const { error } = await supabase
        .from("orders")
        .delete()
        .eq("id", orderId);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-orders"] });
      toast.success("Order deleted successfully");
    },
    onError: () => toast.error("Failed to delete order"),
  });

  const filteredOrders = orders?.filter((order) => {
    // Status filter
    const matchesStatus = filterStatus === "all" || order.status === filterStatus;
    
    // Search filter
    if (!searchQuery.trim()) return matchesStatus;
    
    const query = searchQuery.toLowerCase();
    const shippingAddress = order.shipping_address as any;
    
    const matchesSearch = 
      order.order_number?.toLowerCase().includes(query) ||
      shippingAddress?.full_name?.toLowerCase().includes(query) ||
      shippingAddress?.phone?.toLowerCase().includes(query) ||
      shippingAddress?.city?.toLowerCase().includes(query) ||
      shippingAddress?.state?.toLowerCase().includes(query) ||
      shippingAddress?.postal_code?.toLowerCase().includes(query) ||
      order.payment_id?.toLowerCase().includes(query) ||
      new Date(order.created_at).toLocaleDateString().includes(query) ||
      new Date(order.created_at).toLocaleTimeString().includes(query);
    
    return matchesStatus && matchesSearch;
  });

  const pendingCount = orders?.filter((o) => o.status === "pending").length || 0;

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">Orders Management</h1>
          <p className="text-muted-foreground">View and process customer orders</p>
        </div>
        <div className="flex items-center gap-3">
          {pendingCount > 0 && (
            <Badge variant="destructive" className="animate-pulse">
              {pendingCount} Pending
            </Badge>
          )}
        </div>
      </div>

      {/* Search and Filter */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Search by order number, name, phone, city, date..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>
        <Select value={filterStatus} onValueChange={setFilterStatus}>
          <SelectTrigger className="w-full sm:w-48">
            <SelectValue placeholder="Filter by status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Orders</SelectItem>
            {statusOptions.map((s) => (
              <SelectItem key={s.value} value={s.value}>
                {s.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {isLoading ? (
        <div className="space-y-4">
          {[...Array(3)].map((_, i) => (
            <Skeleton key={i} className="h-48" />
          ))}
        </div>
      ) : filteredOrders && filteredOrders.length > 0 ? (
        <div className="space-y-4">
          {filteredOrders.map((order) => {
            const statusInfo = getStatusInfo(order.status);
            const StatusIcon = statusInfo.icon;

            return (
              <Card key={order.id} className={order.status === "pending" ? "border-warning" : ""}>
                <CardHeader className="pb-3">
                  <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                    <div>
                      <CardTitle className="text-lg flex items-center gap-2">
                        {order.order_number}
                        {order.status === "pending" && (
                          <AlertCircle className="w-5 h-5 text-warning animate-pulse" />
                        )}
                      </CardTitle>
                      <div className="flex flex-wrap items-center gap-4 text-sm text-muted-foreground mt-1">
                        <span className="flex items-center gap-1">
                          <User className="w-3 h-3" />
                          {(order.shipping_address as any)?.full_name || "Customer"}
                        </span>
                        <span className="flex items-center gap-1">
                          <Clock className="w-3 h-3" />
                          {new Date(order.created_at).toLocaleString()}
                        </span>
                        {(order.shipping_address as any)?.phone && (
                          <span className="flex items-center gap-1">
                            <Phone className="w-3 h-3" />
                            {(order.shipping_address as any).phone}
                          </span>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge className={statusInfo.color}>
                        <StatusIcon className="w-3 h-3 mr-1" />
                        {statusInfo.label}
                      </Badge>
                      <Dialog>
                        <DialogTrigger asChild>
                          <Button variant="outline" size="sm" onClick={() => setSelectedOrder(order)}>
                            Update Status
                          </Button>
                        </DialogTrigger>
                        <DialogContent>
                          <DialogHeader>
                            <DialogTitle>Update Order Status</DialogTitle>
                          </DialogHeader>
                          <div className="space-y-4 pt-4">
                            <div className="grid grid-cols-2 gap-2">
                              {statusOptions.map((status) => {
                                const Icon = status.icon;
                                return (
                                  <Button
                                    key={status.value}
                                    variant={order.status === status.value ? "default" : "outline"}
                                    className="justify-start"
                                    onClick={() => {
                                      updateStatusMutation.mutate({ id: order.id, status: status.value });
                                    }}
                                    disabled={updateStatusMutation.isPending}
                                  >
                                    <Icon className="w-4 h-4 mr-2" />
                                    {status.label}
                                  </Button>
                                );
                              })}
                            </div>
                          </div>
                        </DialogContent>
                      </Dialog>
                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <Button variant="destructive" size="sm">
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                          <AlertDialogHeader>
                            <AlertDialogTitle>Delete Order?</AlertDialogTitle>
                            <AlertDialogDescription>
                              This will permanently delete order <strong>{order.order_number}</strong> and all its items. This action cannot be undone.
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>Cancel</AlertDialogCancel>
                            <AlertDialogAction
                              onClick={() => deleteOrderMutation.mutate(order.id)}
                              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                            >
                              Delete
                            </AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
                    {/* Order Items */}
                    <div className="lg:col-span-2 space-y-2">
                      <h4 className="text-sm font-medium mb-2">Order Items</h4>
                      {order.order_items?.map((item: any) => (
                        <div key={item.id} className="flex items-center gap-3 p-3 bg-muted/50 rounded-lg">
                          {item.products?.images?.[0] ? (
                            <img
                              src={item.products.images[0]}
                              alt={item.product_name}
                              className="w-12 h-12 object-cover rounded"
                            />
                          ) : (
                            <div className="w-12 h-12 bg-muted rounded flex items-center justify-center">
                              <Package className="w-6 h-6 text-muted-foreground" />
                            </div>
                          )}
                          <div className="flex-1">
                            <p className="font-medium">{item.product_name}</p>
                            <p className="text-sm text-muted-foreground">
                              Qty: {item.quantity} × ₹{Number(item.product_price).toLocaleString()}
                            </p>
                          </div>
                          <p className="font-semibold">₹{Number(item.total_price).toLocaleString()}</p>
                        </div>
                      ))}
                    </div>

                    {/* Shipping & Total */}
                    <div className="space-y-3">
                      {order.shipping_address && (
                        <div className="p-3 bg-muted/50 rounded-lg text-sm">
                          <p className="font-medium flex items-center gap-1 mb-2">
                            <MapPin className="w-4 h-4" /> Shipping Address
                          </p>
                          <p className="font-medium">{(order.shipping_address as any).full_name}</p>
                          <p className="text-muted-foreground">
                            {(order.shipping_address as any).address_line1}
                          </p>
                          {(order.shipping_address as any).address_line2 && (
                            <p className="text-muted-foreground">
                              {(order.shipping_address as any).address_line2}
                            </p>
                          )}
                          <p className="text-muted-foreground">
                            {(order.shipping_address as any).city}, {(order.shipping_address as any).state} - {(order.shipping_address as any).postal_code}
                          </p>
                          <p className="flex items-center gap-1 mt-2">
                            <Phone className="w-3 h-3" />
                            {(order.shipping_address as any).phone}
                          </p>
                        </div>
                      )}

                      <div className="p-3 bg-primary/10 rounded-lg">
                        <div className="flex justify-between text-sm mb-1">
                          <span className="text-muted-foreground">Subtotal</span>
                          <span>₹{Number(order.subtotal).toLocaleString()}</span>
                        </div>
                        {order.shipping_amount > 0 && (
                          <div className="flex justify-between text-sm mb-1">
                            <span className="text-muted-foreground">Shipping</span>
                            <span>₹{Number(order.shipping_amount).toLocaleString()}</span>
                          </div>
                        )}
                        <div className="flex justify-between font-bold text-lg pt-2 border-t border-primary/20">
                          <span>Total</span>
                          <span className="text-primary">₹{Number(order.total_amount).toLocaleString()}</span>
                        </div>
                      </div>

                      <div className="p-3 bg-muted/50 rounded-lg text-sm">
                        <p className="text-muted-foreground mb-1">Payment Status</p>
                        <Badge variant={order.payment_status === "paid" ? "default" : "secondary"}>
                          {order.payment_status === "paid" ? "Paid" : "Pending"}
                        </Badge>
                        {order.payment_id && (
                          <p className="text-xs text-muted-foreground mt-1 truncate">
                            ID: {order.payment_id}
                          </p>
                        )}
                      </div>

                      {/* Admin Notes Section */}
                      <div className="p-3 bg-muted/30 rounded-lg border border-border">
                        <AdminNotes entityType="order" entityId={order.id} compact />
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      ) : (
        <Card>
          <CardContent className="py-16 text-center">
            <Package className="w-12 h-12 text-muted-foreground/30 mx-auto mb-4" />
            <p className="text-muted-foreground">
              {searchQuery ? "No orders match your search" : "No orders found"}
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default AdminOrders;