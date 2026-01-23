import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { usePermissions } from "@/hooks/useEmployeePermissions";
import { useActivityLog } from "@/hooks/useActivityLog";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { toast } from "sonner";
import { 
  Banknote, 
  CheckCircle2, 
  Clock, 
  XCircle,
  AlertTriangle,
  Loader2,
  Truck,
  Building2,
  ArrowRight
} from "lucide-react";
import { format } from "date-fns";

interface CodPaymentConfirmationProps {
  order: {
    id: string;
    order_number: string;
    status: string;
    payment_id: string | null;
    payment_status: string | null;
    cod_payment_status: string | null;
    cod_confirmed_at: string | null;
    cod_confirmed_by: string | null;
    cod_collected_at?: string | null;
    cod_settled_at?: string | null;
    cod_courier_name?: string | null;
    total_amount: number;
  };
  compact?: boolean;
}

// Updated status config with granular COD flow
const COD_STATUS_CONFIG = {
  pending: {
    label: "COD Pending",
    shortLabel: "Pending",
    icon: Clock,
    variant: "secondary" as const,
    color: "text-orange-500",
    bgColor: "bg-orange-500/10",
    step: 1,
  },
  collected_by_courier: {
    label: "Collected by Courier",
    shortLabel: "Collected",
    icon: Truck,
    variant: "outline" as const,
    color: "text-blue-600",
    bgColor: "bg-blue-500/10",
    step: 2,
  },
  awaiting_settlement: {
    label: "Awaiting Settlement",
    shortLabel: "Awaiting",
    icon: Building2,
    variant: "outline" as const,
    color: "text-purple-600",
    bgColor: "bg-purple-500/10",
    step: 3,
  },
  settled: {
    label: "Payment Settled",
    shortLabel: "Settled",
    icon: CheckCircle2,
    variant: "default" as const,
    color: "text-green-600",
    bgColor: "bg-green-500/10",
    step: 4,
  },
  not_received: {
    label: "COD Issue",
    shortLabel: "Issue",
    icon: XCircle,
    variant: "destructive" as const,
    color: "text-destructive",
    bgColor: "bg-destructive/10",
    step: 0,
  },
};

// For backward compatibility with old "received" status
const getStatusConfig = (status: string) => {
  if (status === "received") {
    return COD_STATUS_CONFIG.settled;
  }
  return COD_STATUS_CONFIG[status as keyof typeof COD_STATUS_CONFIG] || COD_STATUS_CONFIG.pending;
};

export function CodPaymentConfirmation({ order, compact = false }: CodPaymentConfirmationProps) {
  const queryClient = useQueryClient();
  const { logActivity } = useActivityLog();
  const { isSuperAdmin, hasAnyPermission } = usePermissions();
  
  const [confirmDialogOpen, setConfirmDialogOpen] = useState(false);
  const [pendingStatus, setPendingStatus] = useState<string | null>(null);
  const [courierName, setCourierName] = useState(order.cod_courier_name || "");

  // Check if this is a COD order (payment_id starts with COD OR cod_payment_status exists)
  const isCodOrder = order.payment_id?.startsWith("COD") || order.cod_payment_status != null;
  
  // Can confirm COD payment
  const canConfirmPayment = isSuperAdmin || hasAnyPermission(["view_accounting", "update_orders"]);
  
  // Is order delivered
  const isDelivered = order.status === "delivered";
  
  // Current COD status (handle backward compatibility)
  const codStatus = order.cod_payment_status === "received" ? "settled" : (order.cod_payment_status || "pending");
  const statusConfig = getStatusConfig(codStatus);
  const StatusIcon = statusConfig.icon;

  const updateCodStatusMutation = useMutation({
    mutationFn: async ({ newStatus, courier }: { newStatus: string; courier?: string }) => {
      const updateData: Record<string, any> = { cod_payment_status: newStatus };
      if (courier) {
        updateData.cod_courier_name = courier;
      }
      
      const { error } = await supabase
        .from("orders")
        .update(updateData)
        .eq("id", order.id);
      
      if (error) throw error;
      return { newStatus };
    },
    onSuccess: async ({ newStatus }) => {
      queryClient.invalidateQueries({ queryKey: ["admin-orders"] });
      
      const config = getStatusConfig(newStatus);
      toast.success(`COD status updated to ${config.label}`);
      
      // Map status to action type
      const actionTypeMap: Record<string, "cod_payment_pending" | "cod_collected_by_courier" | "cod_awaiting_settlement" | "cod_settled" | "cod_not_received"> = {
        pending: "cod_payment_pending",
        collected_by_courier: "cod_collected_by_courier",
        awaiting_settlement: "cod_awaiting_settlement",
        settled: "cod_settled",
        not_received: "cod_not_received",
      };
      
      await logActivity({
        actionType: actionTypeMap[newStatus] || "cod_payment_pending",
        entityType: "order",
        entityId: order.id,
        description: `COD payment for order ${order.order_number} marked as ${config.label}`,
        metadata: { 
          orderNumber: order.order_number,
          amount: order.total_amount,
          newStatus,
          courierName: courierName || undefined
        },
      });
      
      setConfirmDialogOpen(false);
      setPendingStatus(null);
    },
    onError: (error: any) => {
      const message = error.message || "Failed to update COD payment status";
      toast.error(message);
      setConfirmDialogOpen(false);
      setPendingStatus(null);
    },
  });

  const handleStatusChange = (newStatus: string) => {
    if (newStatus === "settled") {
      // Confirm before marking as settled (it's locked after)
      setPendingStatus(newStatus);
      setConfirmDialogOpen(true);
    } else {
      updateCodStatusMutation.mutate({ newStatus, courier: courierName });
    }
  };

  const getNextStatus = () => {
    switch (codStatus) {
      case "pending":
        return "collected_by_courier";
      case "collected_by_courier":
        return "awaiting_settlement";
      case "awaiting_settlement":
        return "settled";
      default:
        return null;
    }
  };

  // If not a COD order, don't render anything
  if (!isCodOrder) {
    return null;
  }

  // Compact view - just show badge
  if (compact) {
    return (
      <Badge 
        variant={statusConfig.variant} 
        className={`${statusConfig.bgColor} ${statusConfig.color} border-0`}
      >
        <StatusIcon className="w-3 h-3 mr-1" />
        {statusConfig.shortLabel}
      </Badge>
    );
  }

  const isSettled = codStatus === "settled";
  const nextStatus = getNextStatus();

  return (
    <>
      <div className={`p-4 rounded-lg ${statusConfig.bgColor} border`}>
        <div className="flex items-center justify-between mb-3">
          <p className="font-medium flex items-center gap-2 text-sm">
            <Banknote className="w-4 h-4" />
            Cash on Delivery
          </p>
          <Badge variant={statusConfig.variant} className="text-xs">
            <StatusIcon className="w-3 h-3 mr-1" />
            {statusConfig.label}
          </Badge>
        </div>

        {/* Progress indicator */}
        <div className="flex items-center gap-1 mb-4">
          {["pending", "collected_by_courier", "awaiting_settlement", "settled"].map((step, index) => {
            const stepConfig = COD_STATUS_CONFIG[step as keyof typeof COD_STATUS_CONFIG];
            const isActive = stepConfig.step <= statusConfig.step && statusConfig.step > 0;
            const isCurrent = step === codStatus;
            return (
              <div key={step} className="flex items-center flex-1">
                <div 
                  className={`h-2 flex-1 rounded-full transition-colors ${
                    isActive ? stepConfig.color.replace('text-', 'bg-') : 'bg-muted'
                  } ${isCurrent ? 'ring-2 ring-offset-1' : ''}`}
                />
                {index < 3 && <ArrowRight className="w-3 h-3 mx-1 text-muted-foreground" />}
              </div>
            );
          })}
        </div>

        {/* Show timestamps */}
        <div className="space-y-1 text-xs text-muted-foreground mb-3">
          {order.cod_collected_at && (
            <p>Collected: {format(new Date(order.cod_collected_at), "MMM d, yyyy 'at' h:mm a")}</p>
          )}
          {order.cod_settled_at && (
            <p>Settled: {format(new Date(order.cod_settled_at), "MMM d, yyyy 'at' h:mm a")}</p>
          )}
          {order.cod_courier_name && (
            <p>Courier: {order.cod_courier_name}</p>
          )}
        </div>

        {/* Payment confirmation controls - only show for delivered orders and non-settled status */}
        {canConfirmPayment && isDelivered && !isSettled && codStatus !== "not_received" && (
          <div className="mt-3 pt-3 border-t border-current/10 space-y-3">
            {/* Courier name input - show when moving to collected */}
            {codStatus === "pending" && (
              <div>
                <Label htmlFor="courier-name" className="text-xs">Courier/Delivery Partner Name</Label>
                <Input
                  id="courier-name"
                  placeholder="e.g., Delhivery, BlueDart"
                  value={courierName}
                  onChange={(e) => setCourierName(e.target.value)}
                  className="h-8 text-sm mt-1"
                />
              </div>
            )}
            
            {/* Quick action button for next status */}
            {nextStatus && (
              <button
                onClick={() => handleStatusChange(nextStatus)}
                disabled={updateCodStatusMutation.isPending}
                className={`w-full py-2.5 px-4 rounded-lg font-medium text-sm flex items-center justify-center gap-2 transition-all ${
                  nextStatus === "settled" 
                    ? "bg-green-600 hover:bg-green-700 text-white" 
                    : nextStatus === "awaiting_settlement"
                    ? "bg-purple-600 hover:bg-purple-700 text-white"
                    : "bg-blue-600 hover:bg-blue-700 text-white"
                } ${updateCodStatusMutation.isPending ? "opacity-50 cursor-not-allowed" : ""}`}
              >
                {updateCodStatusMutation.isPending ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : nextStatus === "collected_by_courier" ? (
                  <>
                    <Truck className="w-4 h-4" />
                    Mark as Collected by Courier
                  </>
                ) : nextStatus === "awaiting_settlement" ? (
                  <>
                    <Building2 className="w-4 h-4" />
                    Mark as Awaiting Settlement
                  </>
                ) : (
                  <>
                    <CheckCircle2 className="w-4 h-4" />
                    Confirm Payment Received
                  </>
                )}
              </button>
            )}
            
            <div>
              <Label className="text-xs mb-2 block text-muted-foreground">Or select status manually:</Label>
              <Select
                value={codStatus}
                onValueChange={handleStatusChange}
                disabled={updateCodStatusMutation.isPending}
              >
                <SelectTrigger className="w-full h-9 text-sm">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="pending">
                    <span className="flex items-center gap-2">
                      <Clock className="w-3.5 h-3.5 text-orange-500" />
                      Pending
                    </span>
                  </SelectItem>
                  <SelectItem value="collected_by_courier">
                    <span className="flex items-center gap-2">
                      <Truck className="w-3.5 h-3.5 text-blue-600" />
                      Collected by Courier
                    </span>
                  </SelectItem>
                  <SelectItem value="awaiting_settlement">
                    <span className="flex items-center gap-2">
                      <Building2 className="w-3.5 h-3.5 text-purple-600" />
                      Awaiting Settlement
                    </span>
                  </SelectItem>
                  <SelectItem value="settled">
                    <span className="flex items-center gap-2">
                      <CheckCircle2 className="w-3.5 h-3.5 text-green-600" />
                      Payment Settled
                    </span>
                  </SelectItem>
                  <SelectItem value="not_received">
                    <span className="flex items-center gap-2">
                      <XCircle className="w-3.5 h-3.5 text-destructive" />
                      Not Received / Issue
                    </span>
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        )}

        {/* Show warning if not delivered yet */}
        {canConfirmPayment && !isDelivered && codStatus === "pending" && (
          <div className="mt-3 pt-3 border-t border-current/10">
            <p className="text-xs text-muted-foreground flex items-center gap-1">
              <AlertTriangle className="w-3 h-3" />
              Payment confirmation available after delivery
            </p>
          </div>
        )}

        {/* Show locked message for settled status */}
        {isSettled && (
          <div className="mt-2">
            <p className="text-xs text-green-600 flex items-center gap-1">
              <CheckCircle2 className="w-3 h-3" />
              Payment confirmed and locked
            </p>
          </div>
        )}
      </div>

      {/* Confirmation Dialog for Settlement */}
      <AlertDialog open={confirmDialogOpen} onOpenChange={setConfirmDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2">
              <CheckCircle2 className="w-5 h-5 text-green-600" />
              Confirm COD Payment Settlement
            </AlertDialogTitle>
            <AlertDialogDescription className="space-y-2">
              <p>
                You are about to confirm that <strong>₹{order.total_amount.toLocaleString()}</strong> has been 
                settled to your account for order <strong>{order.order_number}</strong>.
              </p>
              <p className="text-orange-600 font-medium">
                ⚠️ This action cannot be undone (except by Super Admin).
              </p>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={updateCodStatusMutation.isPending}>
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={() => pendingStatus && updateCodStatusMutation.mutate({ newStatus: pendingStatus })}
              disabled={updateCodStatusMutation.isPending}
              className="bg-green-600 hover:bg-green-700"
            >
              {updateCodStatusMutation.isPending ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Confirming...
                </>
              ) : (
                <>
                  <CheckCircle2 className="w-4 h-4 mr-2" />
                  Confirm Settlement
                </>
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}

// Helper component for displaying COD badge in order list
export function CodBadge({ order }: { order: { payment_id: string | null; cod_payment_status: string | null } }) {
  // Check if it's a COD order using payment_id OR cod_payment_status presence
  const isCodOrder = order.payment_id?.startsWith("COD") || order.cod_payment_status != null;
  
  if (!isCodOrder) return null;
  
  const codStatus = order.cod_payment_status === "received" ? "settled" : (order.cod_payment_status || "pending");
  const statusConfig = getStatusConfig(codStatus);
  const StatusIcon = statusConfig.icon;
  
  return (
    <Badge 
      variant={statusConfig.variant} 
      className={`${statusConfig.bgColor} ${statusConfig.color} border-0 text-xs`}
    >
      <StatusIcon className="w-3 h-3 mr-1" />
      {statusConfig.shortLabel}
    </Badge>
  );
}
