import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useEffect, useState } from "react";

export type ActionType = 
  | "login" | "logout"
  | "product_create" | "product_update" | "product_delete"
  | "category_create" | "category_update" | "category_delete"
  | "raw_material_add" | "raw_material_update" | "raw_material_consume" | "raw_material_adjust"
  | "order_status_change" | "order_update" | "order_delete" | "shipping_label_generated"
  | "invoice_create" | "invoice_viewed"
  | "customer_block" | "customer_unblock" | "customer_viewed"
  | "quotation_sent" | "revised_quotation" | "price_locked" | "price_updated" | "status_change" | "rejected"
  | "cod_payment_pending" | "cod_payment_received" | "cod_payment_not_received"
  | "cod_collected_by_courier" | "cod_awaiting_settlement" | "cod_settled" | "cod_not_received"
  | "attendance_marked" | "attendance_updated"
  | "leave_approved" | "leave_rejected"
  | "employee_created" | "employee_updated" | "employee_activated" | "employee_deactivated"
  | "permission_granted" | "permission_revoked"
  | "settings_updated" | "page_viewed";

export type EntityType = "product" | "category" | "raw_material" | "order" | "invoice" | "user" | "system" | "design_request" | "employee" | "attendance" | "leave" | "settings";

interface LogActivityParams {
  actionType: ActionType;
  entityType: EntityType;
  entityId?: string;
  description?: string;
  metadata?: Record<string, unknown>;
}

interface EmployeeInfo {
  id: string;
  employee_name: string;
}

export function useActivityLog() {
  const { user } = useAuth();
  const [employeeInfo, setEmployeeInfo] = useState<EmployeeInfo | null>(null);

  // Fetch employee info if user is an employee
  useEffect(() => {
    const fetchEmployeeInfo = async () => {
      if (!user?.id) return;
      
      const { data } = await supabase
        .from("employees")
        .select("id, employee_name")
        .eq("user_id", user.id)
        .eq("is_active", true)
        .maybeSingle();
      
      if (data) {
        setEmployeeInfo(data);
      }
    };

    fetchEmployeeInfo();
  }, [user?.id]);

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
      // Always log to admin activity_logs
      const { error: adminLogError } = await supabase.from("activity_logs").insert({
        admin_id: user.id,
        action_type: actionType,
        entity_type: entityType,
        entity_id: entityId,
        description,
        metadata
      } as any);

      if (adminLogError) {
        console.error("Failed to log admin activity:", adminLogError);
      }

      // Also log to employee_activity_logs if user is an employee
      if (employeeInfo) {
        // Map action types to employee action types
        const employeeActionType = mapToEmployeeActionType(actionType);
        const employeeEntityType = mapToEmployeeEntityType(entityType);

        const { error: employeeLogError } = await supabase.from("employee_activity_logs").insert({
          employee_id: employeeInfo.id,
          action_type: employeeActionType,
          entity_type: employeeEntityType,
          entity_id: entityId,
          description,
          metadata,
          user_agent: navigator.userAgent
        } as any);

        if (employeeLogError) {
          console.error("Failed to log employee activity:", employeeLogError);
        }
      }
    } catch (err) {
      console.error("Error logging activity:", err);
    }
  };

  return { logActivity, isEmployee: !!employeeInfo };
}

// Map admin action types to employee action types
function mapToEmployeeActionType(actionType: ActionType): string {
  const mapping: Record<string, string> = {
    // Order actions
    "order_status_change": "order_status_changed",
    "order_update": "order_updated",
    "order_delete": "order_updated",
    "shipping_label_generated": "order_updated",
    
    // Product actions
    "product_create": "product_created",
    "product_update": "product_updated",
    "product_delete": "product_deleted",
    
    // Category actions
    "category_create": "category_created",
    "category_update": "category_updated",
    "category_delete": "category_deleted",
    
    // Raw material actions
    "raw_material_add": "raw_material_added",
    "raw_material_update": "raw_material_updated",
    "raw_material_consume": "raw_material_consumed",
    "raw_material_adjust": "raw_material_updated",
    
    // Invoice actions
    "invoice_create": "invoice_generated",
    "invoice_viewed": "invoice_viewed",
    
    // Customer actions
    "customer_block": "customer_blocked",
    "customer_unblock": "customer_unblocked",
    "customer_viewed": "customer_viewed",
    
    // COD actions
    "cod_payment_pending": "order_updated",
    "cod_payment_received": "order_updated",
    "cod_payment_not_received": "order_updated",
    "cod_collected_by_courier": "order_updated",
    "cod_awaiting_settlement": "order_updated",
    "cod_settled": "order_updated",
    "cod_not_received": "order_updated",
    
    // Attendance & Leave
    "attendance_marked": "attendance_marked",
    "attendance_updated": "attendance_updated",
    "leave_approved": "leave_approved",
    "leave_rejected": "leave_rejected",
    
    // Settings & permissions
    "settings_updated": "settings_updated",
    "permission_granted": "permission_changed",
    "permission_revoked": "permission_changed",
    
    // Page views
    "page_viewed": "page_viewed",
  };
  
  return mapping[actionType] || "order_updated";
}

// Map admin entity types to employee entity types
function mapToEmployeeEntityType(entityType: EntityType): string {
  const mapping: Record<string, string> = {
    "product": "product",
    "category": "category",
    "raw_material": "raw_material",
    "order": "order",
    "invoice": "invoice",
    "user": "customer",
    "system": "system",
    "design_request": "order",
    "employee": "employee",
    "attendance": "attendance",
    "leave": "leave",
    "settings": "settings",
  };
  
  return mapping[entityType] || "system";
}
