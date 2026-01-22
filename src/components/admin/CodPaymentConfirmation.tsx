import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { usePermissions } from "@/hooks/useEmployeePermissions";
import { useActivityLog } from "@/hooks/useActivityLog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
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
  Loader2
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
    total_amount: number;
  };
  compact?: boolean;
}

const COD_STATUS_CONFIG = {
  pending: {
    label: "COD Pending",
    icon: Clock,
    variant: "secondary" as const,
    color: "text-orange-500",
    bgColor: "bg-orange-500/10",
  },
  received: {
    label: "COD Received",
    icon: CheckCircle2,
    variant: "default" as const,
    color: "text-green-600",
    bgColor: "bg-green-500/10",
  },
  not_received: {
    label: "COD Issue",
    icon: XCircle,
    variant: "destructive" as const,
    color: "text-destructive",
    bgColor: "bg-destructive/10",
  },
};

export function CodPaymentConfirmation({ order, compact = false }: CodPaymentConfirmationProps) {
  const queryClient = useQueryClient();
  const { logActivity } = useActivityLog();
  const { isSuperAdmin, hasAnyPermission } = usePermissions();
  
  const [confirmDialogOpen, setConfirmDialogOpen] = useState(false);
  const [pendingStatus, setPendingStatus] = useState<string | null>(null);

  // Check if this is a COD order
  const isCodOrder = order.payment_id?.startsWith("COD") || false;
  
  // Can confirm COD payment
  const canConfirmPayment = isSuperAdmin || hasAnyPermission(["view_accounting", "update_orders"]);
  
  // Is order delivered
  const isDelivered = order.status === "delivered";
  
  // Current COD status
  const codStatus = order.cod_payment_status || "pending";
  const statusConfig = COD_STATUS_CONFIG[codStatus as keyof typeof COD_STATUS_CONFIG] || COD_STATUS_CONFIG.pending;
  const StatusIcon = statusConfig.icon;

  const updateCodStatusMutation = useMutation({
    mutationFn: async (newStatus: string) => {
      const { error } = await supabase
        .from("orders")
        .update({ cod_payment_status: newStatus })
        .eq("id", order.id);
      
      if (error) throw error;
      return { newStatus };
    },
    onSuccess: async ({ newStatus }) => {
      queryClient.invalidateQueries({ queryKey: ["admin-orders"] });
      
      const statusLabel = COD_STATUS_CONFIG[newStatus as keyof typeof COD_STATUS_CONFIG]?.label || newStatus;
      toast.success(`COD payment marked as ${statusLabel}`);
      
      // Map status to action type
      const actionTypeMap: Record<string, "cod_payment_pending" | "cod_payment_received" | "cod_payment_not_received"> = {
        pending: "cod_payment_pending",
        received: "cod_payment_received",
        not_received: "cod_payment_not_received",
      };
      
      await logActivity({
        actionType: actionTypeMap[newStatus] || "cod_payment_pending",
        entityType: "order",
        entityId: order.id,
        description: `COD payment for order ${order.order_number} marked as ${statusLabel}`,
        metadata: { 
          orderNumber: order.order_number,
          amount: order.total_amount,
          newStatus 
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
    if (newStatus === "received") {
      // Confirm before marking as received (it's locked after)
      setPendingStatus(newStatus);
      setConfirmDialogOpen(true);
    } else {
      updateCodStatusMutation.mutate(newStatus);
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
        {statusConfig.label}
      </Badge>
    );
  }

  return (
    <>
      <div className={`p-3 rounded-lg ${statusConfig.bgColor} border border-${statusConfig.color}/20`}>
        <div className="flex items-center justify-between mb-2">
          <p className="font-medium flex items-center gap-2 text-sm">
            <Banknote className="w-4 h-4" />
            Cash on Delivery
          </p>
          <Badge variant={statusConfig.variant} className="text-xs">
            <StatusIcon className="w-3 h-3 mr-1" />
            {statusConfig.label}
          </Badge>
        </div>

        {/* Show confirmation details if received */}
        {codStatus === "received" && order.cod_confirmed_at && (
          <p className="text-xs text-muted-foreground mb-2">
            Confirmed on {format(new Date(order.cod_confirmed_at), "MMM d, yyyy 'at' h:mm a")}
          </p>
        )}

        {/* Payment confirmation controls - only show for delivered orders */}
        {canConfirmPayment && isDelivered && codStatus !== "received" && (
          <div className="mt-3 pt-3 border-t border-current/10">
            <p className="text-xs text-muted-foreground mb-2">
              Confirm COD Payment Status:
            </p>
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
                <SelectItem value="received">
                  <span className="flex items-center gap-2">
                    <CheckCircle2 className="w-3.5 h-3.5 text-green-600" />
                    Payment Received
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

        {/* Show locked message for received status */}
        {codStatus === "received" && (
          <div className="mt-2">
            <p className="text-xs text-green-600 flex items-center gap-1">
              <CheckCircle2 className="w-3 h-3" />
              Payment confirmed and locked
            </p>
          </div>
        )}
      </div>

      {/* Confirmation Dialog */}
      <AlertDialog open={confirmDialogOpen} onOpenChange={setConfirmDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2">
              <CheckCircle2 className="w-5 h-5 text-green-600" />
              Confirm COD Payment Received
            </AlertDialogTitle>
            <AlertDialogDescription className="space-y-2">
              <p>
                You are about to confirm that <strong>₹{order.total_amount.toLocaleString()}</strong> has been 
                collected for order <strong>{order.order_number}</strong>.
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
              onClick={() => pendingStatus && updateCodStatusMutation.mutate(pendingStatus)}
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
                  Confirm Payment
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
  const isCodOrder = order.payment_id?.startsWith("COD") || false;
  
  if (!isCodOrder) return null;
  
  const codStatus = order.cod_payment_status || "pending";
  const statusConfig = COD_STATUS_CONFIG[codStatus as keyof typeof COD_STATUS_CONFIG] || COD_STATUS_CONFIG.pending;
  const StatusIcon = statusConfig.icon;
  
  return (
    <Badge 
      variant={statusConfig.variant} 
      className={`${statusConfig.bgColor} ${statusConfig.color} border-0 text-xs`}
    >
      <StatusIcon className="w-3 h-3 mr-1" />
      {statusConfig.label}
    </Badge>
  );
}
