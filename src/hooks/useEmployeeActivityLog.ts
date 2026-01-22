import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useEffect, useState } from "react";

export type EmployeeActionType = 
  | "login" | "logout"
  | "attendance_marked" | "attendance_updated"
  | "leave_applied" | "leave_approved" | "leave_rejected"
  | "document_uploaded" | "document_approved" | "document_rejected"
  | "profile_updated" | "profile_update_requested"
  | "payslip_viewed" | "payslip_downloaded"
  | "order_viewed" | "order_updated" | "order_status_changed"
  | "product_created" | "product_updated" | "product_deleted"
  | "category_created" | "category_updated" | "category_deleted"
  | "invoice_generated" | "invoice_viewed"
  | "customer_viewed" | "customer_blocked" | "customer_unblocked"
  | "raw_material_added" | "raw_material_updated" | "raw_material_consumed"
  | "settings_updated" | "permission_changed"
  | "page_viewed";

export type EmployeeEntityType = 
  | "attendance" | "leave" | "document" | "profile" | "payslip"
  | "order" | "product" | "category" | "invoice" | "customer"
  | "raw_material" | "settings" | "employee" | "system";

interface LogActivityParams {
  actionType: EmployeeActionType;
  entityType: EmployeeEntityType;
  entityId?: string;
  description?: string;
  metadata?: Record<string, unknown>;
}

interface EmployeeInfo {
  id: string;
  employee_name: string;
}

export function useEmployeeActivityLog() {
  const { user } = useAuth();
  const [employeeInfo, setEmployeeInfo] = useState<EmployeeInfo | null>(null);

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
    if (!employeeInfo) {
      console.warn("Cannot log activity: No employee record found");
      return;
    }

    try {
      const { error } = await supabase.from("employee_activity_logs").insert({
        employee_id: employeeInfo.id,
        action_type: actionType,
        entity_type: entityType,
        entity_id: entityId,
        description,
        metadata,
        user_agent: navigator.userAgent
      } as any);

      if (error) {
        console.error("Failed to log employee activity:", error);
      }
    } catch (err) {
      console.error("Error logging employee activity:", err);
    }
  };

  return { logActivity, employeeInfo };
}
