import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { Package, User, MapPin, Clock } from "lucide-react";
import { toast } from "sonner";

const statusOptions = [
  { value: "pending", label: "Pending" },
  { value: "confirmed", label: "Confirmed" },
  { value: "processing", label: "Processing" },
  { value: "shipped", label: "Shipped" },
  { value: "delivered", label: "Delivered" },
  { value: "cancelled", label: "Cancelled" },
];

const statusColors: Record<string, string> = {
  pending: "bg-warning/10 text-warning",
  confirmed: "bg-primary/10 text-primary",
  processing: "bg-blue-500/10 text-blue-500",
  shipped: "bg-purple-500/10 text-purple-500",
  delivered: "bg-success/10 text-success",
  cancelled: "bg-destructive/10 text-destructive",
};

const AdminOrders = () => {
  const queryClient = useQueryClient();
  const [filterStatus, setFilterStatus] = useState<string>("all");

  const { data: orders, isLoading } = useQuery({
    queryKey: ["admin-orders"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("orders")
        .select("*, order_items(*, products(name, images)), profiles(full_name, email)")
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

  const filteredOrders = orders?.filter(
    (order) => filterStatus === "all" || order.status === filterStatus
  );

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Orders Management</h1>
          <p className="text-muted-foreground">View and process customer orders</p>
        </div>
        <Select value={filterStatus} onValueChange={setFilterStatus}>
          <SelectTrigger className="w-40">
            <SelectValue placeholder="Filter" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Orders</SelectItem>
            {statusOptions.map((s) => (
              <SelectItem key={s.value} value={s.value}>{s.label}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {isLoading ? (
        <div className="space-y-4">{[...Array(3)].map((_, i) => <Skeleton key={i} className="h-40" />)}</div>
      ) : filteredOrders && filteredOrders.length > 0 ? (
        <div className="space-y-4">
          {filteredOrders.map((order) => (
            <Card key={order.id}>
              <CardHeader className="pb-3 flex flex-row items-center justify-between">
                <div>
                  <CardTitle className="text-lg">{order.order_number}</CardTitle>
                  <div className="flex items-center gap-4 text-sm text-muted-foreground mt-1">
                    <span className="flex items-center gap-1">
                      <User className="w-3 h-3" />
                      {(order.profiles as any)?.full_name || (order.profiles as any)?.email || "Customer"}
                    </span>
                    <span className="flex items-center gap-1">
                      <Clock className="w-3 h-3" />
                      {new Date(order.created_at).toLocaleString()}
                    </span>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <Select
                    value={order.status}
                    onValueChange={(value) => updateStatusMutation.mutate({ id: order.id, status: value })}
                  >
                    <SelectTrigger className="w-36">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {statusOptions.map((s) => (
                        <SelectItem key={s.value} value={s.value}>{s.label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <Badge className={statusColors[order.status]}>{order.status}</Badge>
                </div>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
                  <div className="lg:col-span-2 space-y-2">
                    {order.order_items?.map((item: any) => (
                      <div key={item.id} className="flex items-center gap-3 p-2 bg-muted/50 rounded">
                        <Package className="w-8 h-8 text-muted-foreground" />
                        <div className="flex-1">
                          <p className="font-medium">{item.product_name}</p>
                          <p className="text-sm text-muted-foreground">Qty: {item.quantity} × ₹{item.product_price}</p>
                        </div>
                        <p className="font-semibold">₹{item.total_price}</p>
                      </div>
                    ))}
                  </div>
                  <div className="space-y-3">
                    {order.shipping_address && (
                      <div className="p-3 bg-muted/50 rounded text-sm">
                        <p className="font-medium flex items-center gap-1 mb-1"><MapPin className="w-3 h-3" /> Shipping</p>
                        <p>{(order.shipping_address as any).full_name}</p>
                        <p className="text-muted-foreground">{(order.shipping_address as any).address_line1}, {(order.shipping_address as any).city}</p>
                      </div>
                    )}
                    <div className="p-3 bg-primary/10 rounded">
                      <p className="text-sm text-muted-foreground">Total Amount</p>
                      <p className="text-xl font-bold text-primary">₹{order.total_amount.toLocaleString()}</p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <Card><CardContent className="py-16 text-center"><p className="text-muted-foreground">No orders found</p></CardContent></Card>
      )}
    </div>
  );
};

export default AdminOrders;
