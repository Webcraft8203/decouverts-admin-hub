import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useActivityLog } from "@/hooks/useActivityLog";
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
  Palette,
  ExternalLink,
  Calendar,
  FileDown,
  QrCode,
  Banknote,
  CreditCard
} from "lucide-react";
import { AdminNotes } from "@/components/admin/AdminNotes";
import { OrderTimeline } from "@/components/admin/OrderTimeline";
import { ShippingDetailsModal } from "@/components/admin/ShippingDetailsModal";
import { WhatsAppButton } from "@/components/admin/WhatsAppButton";
import { CodPaymentConfirmation, CodBadge } from "@/components/admin/CodPaymentConfirmation";
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

const paymentFilterOptions = [
  { value: "all", label: "All Payments" },
  { value: "online", label: "Online Paid" },
  { value: "cod", label: "Cash on Delivery (All)" },
  { value: "cod_pending", label: "COD - Pending" },
  { value: "cod_collected", label: "COD - With Courier" },
  { value: "cod_awaiting", label: "COD - Awaiting Settlement" },
  { value: "cod_settled", label: "COD - Settled" },
  { value: "cod_issue", label: "COD - Issue" },
];

const getStatusInfo = (status: string) => {
  return statusOptions.find((s) => s.value === status) || statusOptions[0];
};

const AdminOrders = () => {
  const queryClient = useQueryClient();
  const { logActivity } = useActivityLog();
  const [filterStatus, setFilterStatus] = useState<string>("all");
  const [filterPayment, setFilterPayment] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedOrder, setSelectedOrder] = useState<any>(null);
  const [shippingModalOpen, setShippingModalOpen] = useState(false);
  const [pendingShipOrder, setPendingShipOrder] = useState<any>(null);
  const [statusDialogOpen, setStatusDialogOpen] = useState(false);

  const { data: orders, isLoading } = useQuery({
    queryKey: ["admin-orders"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("orders")
        .select("*, order_items(*, products(name, images)), design_requests(file_url, file_name, size, quantity)")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data;
    },
  });

  const updateStatusMutation = useMutation({
    mutationFn: async ({ 
      id, 
      status, 
      orderNumber,
      shippingDetails 
    }: { 
      id: string; 
      status: string; 
      orderNumber: string;
      shippingDetails?: {
        courier_name: string;
        tracking_id: string;
        tracking_url: string;
        expected_delivery_date: string;
      };
    }) => {
      const updateData: any = { status };
      
      if (shippingDetails) {
        updateData.courier_name = shippingDetails.courier_name;
        updateData.tracking_id = shippingDetails.tracking_id;
        updateData.tracking_url = shippingDetails.tracking_url || null;
        updateData.expected_delivery_date = shippingDetails.expected_delivery_date;
        updateData.shipped_at = new Date().toISOString();
      }
      
      // If marking as delivered, set delivered_at timestamp
      if (status === "delivered") {
        updateData.delivered_at = new Date().toISOString();
      }
      
      const { error } = await supabase.from("orders").update(updateData).eq("id", id);
      if (error) throw error;
      
      // If marking as delivered, generate final tax invoice
      if (status === "delivered") {
        try {
          const { data, error: invoiceError } = await supabase.functions.invoke("generate-invoice", {
            body: { orderId: id, invoiceType: "final" },
          });
          
          if (invoiceError) {
            console.error("Failed to generate final invoice:", invoiceError);
            toast.error("Order delivered but failed to generate final invoice");
          } else {
            toast.success("Final Tax Invoice generated automatically");
          }
        } catch (e) {
          console.error("Error generating final invoice:", e);
        }
      }
      
      return { id, status, orderNumber, shippingDetails };
    },
    onSuccess: async ({ id, status, orderNumber, shippingDetails }) => {
      queryClient.invalidateQueries({ queryKey: ["admin-orders"] });
      toast.success("Order status updated");
      setStatusDialogOpen(false);
      setShippingModalOpen(false);
      setPendingShipOrder(null);
      
      const metadata: any = { newStatus: status };
      if (shippingDetails) {
        metadata.courier_name = shippingDetails.courier_name;
        metadata.tracking_id = shippingDetails.tracking_id;
      }
      
      await logActivity({
        actionType: "order_status_change",
        entityType: "order",
        entityId: id,
        description: `Order ${orderNumber} status changed to ${status}${shippingDetails ? ` - Courier: ${shippingDetails.courier_name}` : ''}`,
        metadata
      });
    },
    onError: () => toast.error("Failed to update status"),
  });

  const deleteOrderMutation = useMutation({
    mutationFn: async ({ orderId, orderNumber }: { orderId: string; orderNumber: string }) => {
      // First delete associated invoices (foreign key constraint)
      const { error: invoicesError } = await supabase
        .from("invoices")
        .delete()
        .eq("order_id", orderId);
      if (invoicesError) throw invoicesError;

      // Then delete order items
      const { error: itemsError } = await supabase
        .from("order_items")
        .delete()
        .eq("order_id", orderId);
      if (itemsError) throw itemsError;
      
      // Finally delete the order
      const { error } = await supabase
        .from("orders")
        .delete()
        .eq("id", orderId);
      if (error) throw error;
      return { orderId, orderNumber };
    },
    onSuccess: async ({ orderId, orderNumber }) => {
      queryClient.invalidateQueries({ queryKey: ["admin-orders"] });
      toast.success("Order deleted successfully");
      
      await logActivity({
        actionType: "order_delete",
        entityType: "order",
        entityId: orderId,
        description: `Order ${orderNumber} deleted`,
      });
    },
    onError: () => toast.error("Failed to delete order"),
  });

  // Shipping Label Generation Mutation
  const generateShippingLabelMutation = useMutation({
    mutationFn: async ({ orderId, orderNumber }: { orderId: string; orderNumber: string }) => {
      const { data, error } = await supabase.functions.invoke("generate-shipping-label", {
        body: { orderId },
      });
      
      if (error) throw error;
      if (!data?.success) throw new Error(data?.error || "Failed to generate shipping label");
      
      return { orderId, orderNumber, labelPath: data.labelPath, shipmentId: data.shipmentId };
    },
    onSuccess: async ({ orderId, orderNumber, shipmentId }) => {
      queryClient.invalidateQueries({ queryKey: ["admin-orders"] });
      toast.success(`Shipping label generated: ${shipmentId}`);
      
      await logActivity({
        actionType: "shipping_label_generated",
        entityType: "order",
        entityId: orderId,
        description: `Shipping label generated for order ${orderNumber}`,
        metadata: { shipmentId },
      });
    },
    onError: (error) => toast.error(error instanceof Error ? error.message : "Failed to generate shipping label"),
  });

  // Download Shipping Label
  const downloadShippingLabel = async (orderId: string, labelPath: string) => {
    try {
      const { data, error } = await supabase.storage
        .from("invoices")
        .createSignedUrl(labelPath, 60 * 5); // 5 minutes
      
      if (error) throw error;
      
      window.open(data.signedUrl, "_blank");
    } catch (error) {
      console.error("Error downloading label:", error);
      toast.error("Failed to download shipping label");
    }
  };

  // Helper to check if order is COD
  const isCodOrder = (order: any) => {
    return order.payment_id?.startsWith("COD") || 
           order.order_type === "cod" || 
           order.cod_payment_status != null;
  };

  const filteredOrders = orders?.filter((order) => {
    // Status filter
    const matchesStatus = filterStatus === "all" || order.status === filterStatus;
    
    // Payment filter
    let matchesPayment = true;
    const isCod = isCodOrder(order);
    const codStatus = (order as any).cod_payment_status;
    
    if (filterPayment === "online") {
      matchesPayment = !isCod && order.payment_status === "paid";
    } else if (filterPayment === "cod") {
      matchesPayment = isCod === true;
    } else if (filterPayment === "cod_pending") {
      matchesPayment = isCod === true && codStatus === "pending";
    } else if (filterPayment === "cod_collected") {
      matchesPayment = isCod === true && codStatus === "collected_by_courier";
    } else if (filterPayment === "cod_awaiting") {
      matchesPayment = isCod === true && codStatus === "awaiting_settlement";
    } else if (filterPayment === "cod_settled") {
      matchesPayment = isCod === true && (codStatus === "settled" || codStatus === "received");
    } else if (filterPayment === "cod_issue") {
      matchesPayment = isCod === true && codStatus === "not_received";
    }
    
    // Search filter
    if (!searchQuery.trim()) return matchesStatus && matchesPayment;
    
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
    
    return matchesStatus && matchesPayment && matchesSearch;
  });

  const pendingCount = orders?.filter((o) => o.status === "pending").length || 0;
  // COD orders that are delivered but payment not yet settled
  const codAwaitingPaymentCount = orders?.filter((o) => 
    isCodOrder(o) && 
    !["settled", "received"].includes((o as any).cod_payment_status || "") &&
    o.status === "delivered"
  ).length || 0;

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">Orders Management</h1>
          <p className="text-muted-foreground">View and process customer orders</p>
        </div>
        <div className="flex items-center gap-3 flex-wrap">
          {pendingCount > 0 && (
            <Badge variant="destructive" className="animate-pulse">
              {pendingCount} Pending
            </Badge>
          )}
          {codAwaitingPaymentCount > 0 && (
            <Badge variant="secondary" className="bg-orange-500/10 text-orange-500 border-orange-500/20">
              <Banknote className="w-3 h-3 mr-1" />
              {codAwaitingPaymentCount} COD Awaiting Payment
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
          <SelectTrigger className="w-full sm:w-44">
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
        <Select value={filterPayment} onValueChange={setFilterPayment}>
          <SelectTrigger className="w-full sm:w-44">
            <SelectValue placeholder="Payment type" />
          </SelectTrigger>
          <SelectContent>
            {paymentFilterOptions.map((p) => (
              <SelectItem key={p.value} value={p.value}>
                {p.label}
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
                        {(order as any).order_type === "custom_design" && (
                          <Badge variant="secondary" className="bg-purple-500/10 text-purple-500 border-purple-500/20 text-xs">
                            <Palette className="w-3 h-3 mr-1" />
                            Custom Print
                          </Badge>
                        )}
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
                    <div className="flex items-center gap-2 flex-wrap">
                      {/* Payment method badge */}
                      {isCodOrder(order) ? (
                        <CodBadge order={{ payment_id: order.payment_id, cod_payment_status: (order as any).cod_payment_status }} />
                      ) : order.payment_status === "paid" ? (
                        <Badge variant="default" className="bg-green-500/10 text-green-600 border-0 text-xs">
                          <CreditCard className="w-3 h-3 mr-1" />
                          Paid Online
                        </Badge>
                      ) : null}
                      <Badge className={statusInfo.color}>
                        <StatusIcon className="w-3 h-3 mr-1" />
                        {statusInfo.label}
                      </Badge>
                      <Dialog open={statusDialogOpen && selectedOrder?.id === order.id} onOpenChange={(open) => {
                        setStatusDialogOpen(open);
                        if (open) setSelectedOrder(order);
                      }}>
                        <DialogTrigger asChild>
                          <Button variant="outline" size="sm" onClick={() => {
                            setSelectedOrder(order);
                            setStatusDialogOpen(true);
                          }}>
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
                                      if (status.value === "shipped") {
                                        setPendingShipOrder(order);
                                        setShippingModalOpen(true);
                                        setStatusDialogOpen(false);
                                      } else {
                                        updateStatusMutation.mutate({ 
                                          id: order.id, 
                                          status: status.value, 
                                          orderNumber: order.order_number 
                                        });
                                      }
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
                      <WhatsAppButton 
                        order={{
                          order_number: order.order_number,
                          total_amount: order.total_amount,
                          status: order.status,
                          courier_name: (order as any).courier_name,
                          tracking_id: (order as any).tracking_id,
                          tracking_url: (order as any).tracking_url,
                          expected_delivery_date: (order as any).expected_delivery_date,
                          shipping_address: order.shipping_address as any
                        }}
                      />
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
                              onClick={() => deleteOrderMutation.mutate({ orderId: order.id, orderNumber: order.order_number })}
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
                  {/* Order Timeline */}
                  <div className="mb-4 pb-4 border-b">
                    <OrderTimeline currentStatus={order.status} />
                  </div>
                  
                  <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
                    {/* Order Items */}
                    <div className="lg:col-span-2 space-y-2">
                      <h4 className="text-sm font-medium mb-2">Order Items</h4>
                      {(order as any).order_type === "custom_design" && (order as any).design_requests ? (
                        // Custom design order display
                        <div className="flex items-center gap-3 p-3 bg-purple-500/10 rounded-lg">
                          <div className="w-12 h-12 bg-purple-500/20 rounded flex items-center justify-center">
                            <Palette className="w-6 h-6 text-purple-500" />
                          </div>
                          <div className="flex-1">
                            <p className="font-medium">Custom Print - {(order as any).design_requests?.file_name || "Design"}</p>
                            <p className="text-sm text-muted-foreground">
                              {(order as any).design_requests?.size && `Size: ${(order as any).design_requests.size} | `}
                              Qty: {(order as any).design_requests?.quantity || 1}
                            </p>
                          </div>
                          <p className="font-semibold">₹{Number(order.total_amount).toLocaleString()}</p>
                        </div>
                      ) : (
                        // Standard order items
                        order.order_items?.map((item: any) => (
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
                        ))
                      )}
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

                      {/* Courier/Shipping Details */}
                      {(order as any).courier_name && (
                        <div className="p-3 bg-indigo-500/10 rounded-lg text-sm">
                          <p className="font-medium flex items-center justify-between mb-2">
                            <span className="flex items-center gap-1">
                              <Truck className="w-4 h-4" /> Shipping Details
                            </span>
                            {(order as any).shipment_id && (
                              <Badge variant="outline" className="text-xs">
                                {(order as any).shipment_id}
                              </Badge>
                            )}
                          </p>
                          <p className="font-medium">{(order as any).courier_name}</p>
                          <p className="text-muted-foreground">
                            Tracking: {(order as any).tracking_id}
                          </p>
                          {(order as any).expected_delivery_date && (
                            <p className="text-muted-foreground flex items-center gap-1">
                              <Calendar className="w-3 h-3" />
                              Expected: {new Date((order as any).expected_delivery_date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                            </p>
                          )}
                          {(order as any).tracking_url && (
                            <a 
                              href={(order as any).tracking_url} 
                              target="_blank" 
                              rel="noopener noreferrer"
                              className="text-primary hover:underline flex items-center gap-1 mt-1"
                            >
                              <ExternalLink className="w-3 h-3" /> Track Package
                            </a>
                          )}
                          
                          {/* Shipping Label Actions */}
                          <div className="flex gap-2 mt-3 pt-3 border-t border-indigo-500/20">
                            {(order as any).shipping_label_url ? (
                              <Button
                                variant="outline"
                                size="sm"
                                className="flex-1"
                                onClick={() => downloadShippingLabel(order.id, (order as any).shipping_label_url)}
                              >
                                <FileDown className="w-3.5 h-3.5 mr-1" />
                                Download Label
                              </Button>
                            ) : (
                              <Button
                                variant="outline"
                                size="sm"
                                className="flex-1"
                                onClick={() => generateShippingLabelMutation.mutate({ 
                                  orderId: order.id, 
                                  orderNumber: order.order_number 
                                })}
                                disabled={generateShippingLabelMutation.isPending}
                              >
                                <QrCode className="w-3.5 h-3.5 mr-1" />
                                {generateShippingLabelMutation.isPending ? "Generating..." : "Generate Label"}
                              </Button>
                            )}
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => window.open(`/verify-order?id=${order.id}`, "_blank")}
                              title="Preview Verification Page"
                            >
                              <ExternalLink className="w-3.5 h-3.5" />
                            </Button>
                          </div>
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

                      {/* Payment Status - Show COD confirmation for COD orders */}
                      {isCodOrder(order) ? (
                        <CodPaymentConfirmation 
                          order={{
                            id: order.id,
                            order_number: order.order_number,
                            status: order.status,
                            payment_id: order.payment_id,
                            payment_status: order.payment_status,
                            cod_payment_status: (order as any).cod_payment_status,
                            cod_confirmed_at: (order as any).cod_confirmed_at,
                            cod_confirmed_by: (order as any).cod_confirmed_by,
                            cod_collected_at: (order as any).cod_collected_at,
                            cod_settled_at: (order as any).cod_settled_at,
                            cod_courier_name: (order as any).cod_courier_name,
                            total_amount: order.total_amount,
                          }}
                        />
                      ) : (
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
                      )}

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
      {/* Shipping Details Modal */}
      <ShippingDetailsModal
        open={shippingModalOpen}
        onOpenChange={(open) => {
          setShippingModalOpen(open);
          if (!open) setPendingShipOrder(null);
        }}
        onConfirm={(details) => {
          if (pendingShipOrder) {
            updateStatusMutation.mutate({
              id: pendingShipOrder.id,
              status: "shipped",
              orderNumber: pendingShipOrder.order_number,
              shippingDetails: details
            });
          }
        }}
        initialData={pendingShipOrder ? {
          courier_name: (pendingShipOrder as any).courier_name || "",
          tracking_id: (pendingShipOrder as any).tracking_id || "",
          tracking_url: (pendingShipOrder as any).tracking_url || "",
          expected_delivery_date: (pendingShipOrder as any).expected_delivery_date || "",
        } : undefined}
        isLoading={updateStatusMutation.isPending}
      />
    </div>
  );
};

export default AdminOrders;