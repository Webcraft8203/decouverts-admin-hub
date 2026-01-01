import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";

export type ActionType = 
  | "login" | "logout"
  | "product_create" | "product_update" | "product_delete"
  | "category_create" | "category_update" | "category_delete"
  | "raw_material_add" | "raw_material_update" | "raw_material_consume" | "raw_material_adjust"
  | "order_status_change" | "order_update" | "order_delete"
  | "invoice_create"
  | "customer_block" | "customer_unblock"
  | "quotation_sent" | "revised_quotation" | "price_locked" | "price_updated" | "status_change" | "rejected";

export type EntityType = "product" | "category" | "raw_material" | "order" | "invoice" | "user" | "system" | "design_request";

interface LogActivityParams {
  actionType: ActionType;
  entityType: EntityType;
  entityId?: string;
  description?: string;
  metadata?: Record<string, unknown>;
}

export function useActivityLog() {
  const { user } = useAuth();

  const logActivity = async ({
    actionType,
    entityType,
    entityId,
    description,
    metadata = {}
  }: LogActivityParams) => {
    if (!user) {
      console.warn("Cannot log activity: No user authenticated");
      return;
    }

    try {
      const { error } = await supabase.from("activity_logs").insert({
        admin_id: user.id,
        action_type: actionType,
        entity_type: entityType,
        entity_id: entityId,
        description,
        metadata
      } as any);

      if (error) {
        console.error("Failed to log activity:", error);
      }
    } catch (err) {
      console.error("Error logging activity:", err);
    }
  };

  return { logActivity };
}
