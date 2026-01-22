import { createContext, useContext, useEffect, useState, ReactNode } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";

export type EmployeePermission =
  | "view_orders"
  | "update_orders"
  | "manage_shipping"
  | "view_accounting"
  | "view_gst_reports"
  | "view_revenue"
  | "download_financials"
  | "view_invoices"
  | "generate_invoices"
  | "download_invoices"
  | "manage_products"
  | "manage_categories"
  | "manage_inventory"
  | "manage_homepage"
  | "manage_blog"
  | "manage_partners"
  | "manage_customer_reviews"
  | "view_customers"
  | "manage_promo_codes"
  | "view_activity_logs"
  | "manage_design_requests"
  | "manage_printer_configs"
  | "manage_drone_configs"
  | "view_contact_requests"
  | "view_employee_profiles"
  | "manage_employee_profiles"
  | "view_salary_info"
  | "manage_salary"
  | "view_employee_documents"
  | "manage_employee_documents"
  | "mark_attendance"
  | "view_attendance"
  | "manage_leave"
  | "view_leave_requests"
  | "generate_payslips"
  | "view_payslips";

export const ALL_PERMISSIONS: { key: EmployeePermission; label: string; category: string }[] = [
  // Order Management
  { key: "view_orders", label: "View Orders", category: "Order Management" },
  { key: "update_orders", label: "Update Order Status", category: "Order Management" },
  { key: "manage_shipping", label: "Manage Shipping", category: "Order Management" },
  { key: "manage_design_requests", label: "Manage Design Requests", category: "Order Management" },
  
  // Accounting & Finance
  { key: "view_accounting", label: "View Accounting Dashboard", category: "Accounting & Finance" },
  { key: "view_gst_reports", label: "View GST Reports", category: "Accounting & Finance" },
  { key: "view_revenue", label: "View Revenue Analytics", category: "Accounting & Finance" },
  { key: "download_financials", label: "Download Financial Reports", category: "Accounting & Finance" },
  { key: "generate_payslips", label: "Generate Payslips", category: "Accounting & Finance" },
  { key: "view_payslips", label: "View Payslips", category: "Accounting & Finance" },
  
  // Invoice Management
  { key: "view_invoices", label: "View Invoices", category: "Invoice Management" },
  { key: "generate_invoices", label: "Generate Invoices", category: "Invoice Management" },
  { key: "download_invoices", label: "Download Invoices", category: "Invoice Management" },
  
  // Product & Inventory
  { key: "manage_products", label: "Manage Products", category: "Product & Inventory" },
  { key: "manage_categories", label: "Manage Categories", category: "Product & Inventory" },
  { key: "manage_inventory", label: "Manage Inventory", category: "Product & Inventory" },
  { key: "manage_promo_codes", label: "Manage Promo Codes", category: "Product & Inventory" },
  
  // Content Management
  { key: "manage_homepage", label: "Manage Homepage", category: "Content Management" },
  { key: "manage_blog", label: "Manage Blog Posts", category: "Content Management" },
  { key: "manage_partners", label: "Manage Partners", category: "Content Management" },
  { key: "manage_customer_reviews", label: "Manage Customer Reviews", category: "Content Management" },
  
  // HR & Attendance
  { key: "mark_attendance", label: "Mark Attendance", category: "HR & Attendance" },
  { key: "view_attendance", label: "View Attendance Records", category: "HR & Attendance" },
  { key: "manage_leave", label: "Manage Leave Requests", category: "HR & Attendance" },
  { key: "view_leave_requests", label: "View Leave Requests", category: "HR & Attendance" },
  
  // Employee Management
  { key: "view_employee_profiles", label: "View Employee Profiles", category: "Employee Management" },
  { key: "manage_employee_profiles", label: "Manage Employee Profiles", category: "Employee Management" },
  { key: "view_employee_documents", label: "View Employee Documents", category: "Employee Management" },
  { key: "manage_employee_documents", label: "Manage Employee Documents", category: "Employee Management" },
  { key: "view_salary_info", label: "View Salary Information", category: "Employee Management" },
  { key: "manage_salary", label: "Manage Salary & Payments", category: "Employee Management" },
  
  // Support & Configuration
  { key: "view_customers", label: "View Customers", category: "Support & Configuration" },
  { key: "view_contact_requests", label: "View Contact Requests", category: "Support & Configuration" },
  { key: "manage_printer_configs", label: "Manage Printer Configurations", category: "Support & Configuration" },
  { key: "manage_drone_configs", label: "Manage Drone Configurations", category: "Support & Configuration" },
  { key: "view_activity_logs", label: "View Activity Logs", category: "Support & Configuration" },
];

interface EmployeeInfo {
  id: string;
  employee_name: string;
  department: string | null;
  designation: string | null;
}

interface PermissionsContextType {
  isSuperAdmin: boolean;
  isEmployee: boolean;
  permissions: EmployeePermission[];
  employeeInfo: EmployeeInfo | null;
  isLoading: boolean;
  hasPermission: (permission: EmployeePermission) => boolean;
  hasAnyPermission: (permissions: EmployeePermission[]) => boolean;
  canAccessRoute: (route: string) => boolean;
  refetch: () => Promise<void>;
}

const PermissionsContext = createContext<PermissionsContextType | undefined>(undefined);

// Route to permission mapping
const ROUTE_PERMISSIONS: Record<string, EmployeePermission[]> = {
  "/admin/orders": ["view_orders", "update_orders"],
  "/admin/design-requests": ["manage_design_requests"],
  "/admin/products": ["manage_products"],
  "/admin/categories": ["manage_categories"],
  "/admin/shop-slides": ["manage_products"],
  "/admin/promo-codes": ["manage_promo_codes"],
  "/admin/reviews": ["manage_products"],
  "/admin/inventory": ["manage_inventory"],
  "/admin/raw-materials": ["manage_inventory"],
  "/admin/invoices": ["view_invoices", "generate_invoices"],
  "/admin/customers": ["view_customers"],
  "/admin/homepage-settings": ["manage_homepage"],
  "/admin/homepage-images": ["manage_homepage"],
  "/admin/contact-requests": ["view_contact_requests"],
  "/admin/printer-configurations": ["manage_printer_configs"],
  "/admin/drone-configurations": ["manage_drone_configs"],
  "/admin/customer-reviews": ["manage_customer_reviews"],
  "/admin/partners": ["manage_partners"],
  "/admin/blog-posts": ["manage_blog"],
  "/admin/blog-slides": ["manage_blog"],
  "/admin/employees": [], // Super admin only
  "/admin/activity-logs": [], // Super admin only
  "/admin/employee-activity-logs": [], // Super admin only
  "/admin/accounting": ["view_accounting", "view_gst_reports", "view_revenue"],
  "/admin/attendance": ["mark_attendance", "view_attendance"],
  "/admin/leave-management": ["manage_leave", "view_leave_requests"],
  "/admin/payslips": ["generate_payslips", "view_payslips"],
  "/admin/salary-reports": ["view_salary_info", "view_accounting"],
};

export function PermissionsProvider({ children }: { children: ReactNode }) {
  const { user, isAdmin, isLoading: authLoading, isAdminResolved } = useAuth();
  const [isSuperAdmin, setIsSuperAdmin] = useState(false);
  const [isEmployee, setIsEmployee] = useState(false);
  const [permissions, setPermissions] = useState<EmployeePermission[]>([]);
  const [employeeInfo, setEmployeeInfo] = useState<EmployeeInfo | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const fetchPermissions = async () => {
    // CRITICAL: Wait for BOTH auth loading AND admin status to be resolved
    // This prevents the race condition where isAdmin is still false during initial load
    if (authLoading || !isAdminResolved) {
      return;
    }

    if (!user) {
      setIsSuperAdmin(false);
      setIsEmployee(false);
      setPermissions([]);
      setEmployeeInfo(null);
      setIsLoading(false);
      return;
    }

    try {
      setIsLoading(true);

      // CRITICAL: Super Admin check MUST happen first and take absolute precedence
      // If user has admin role in user_roles table, they are ALWAYS a Super Admin
      // regardless of any employee records that may exist
      if (isAdmin) {
        console.log("[Permissions] User is Super Admin - skipping employee check");
        setIsSuperAdmin(true);
        setIsEmployee(false);
        setPermissions([]);
        setEmployeeInfo(null);
        setIsLoading(false);
        return;
      }
      
      // Only check employee status if user is NOT an admin
      console.log("[Permissions] User is not admin - checking employee status");
      
      // Get session for API calls
      const { data: sessionData } = await supabase.auth.getSession();
      const token = sessionData.session?.access_token;
      
      if (!token) {
        setIsSuperAdmin(false);
        setIsEmployee(false);
        setPermissions([]);
        setEmployeeInfo(null);
        setIsLoading(false);
        return;
      }

      // Check if user is in employees table
      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/rest/v1/employees?user_id=eq.${user.id}&select=id,employee_name,department,designation,is_active`,
        {
          headers: {
            'apikey': import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY,
            'Authorization': `Bearer ${token}`,
          },
        }
      );
      const employees = await response.json();
      const employeeData = employees?.[0];

      if (employeeData && employeeData.is_active) {
        // User is an active employee (and NOT an admin)
        console.log("[Permissions] User is active employee:", employeeData.employee_name);
        setIsEmployee(true);
        setIsSuperAdmin(false);
        setEmployeeInfo({
          id: employeeData.id,
          employee_name: employeeData.employee_name,
          department: employeeData.department,
          designation: employeeData.designation,
        });

        // Fetch employee permissions
        const permsResponse = await fetch(
          `${import.meta.env.VITE_SUPABASE_URL}/rest/v1/employee_permissions?employee_id=eq.${employeeData.id}&select=permission`,
          {
            headers: {
              'apikey': import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY,
              'Authorization': `Bearer ${token}`,
            },
          }
        );
        const perms = await permsResponse.json();

        if (perms && Array.isArray(perms)) {
          setPermissions(perms.map((p: any) => p.permission as EmployeePermission));
        }
      } else {
        // User is neither admin nor active employee
        console.log("[Permissions] User has no admin or employee access");
        setIsSuperAdmin(false);
        setIsEmployee(false);
        setPermissions([]);
        setEmployeeInfo(null);
      }
    } catch (error) {
      console.error("Error fetching permissions:", error);
      // If there's an error but user is admin, still grant super admin access
      if (isAdmin) {
        setIsSuperAdmin(true);
        setIsEmployee(false);
      } else {
        setIsSuperAdmin(false);
        setIsEmployee(false);
      }
      setPermissions([]);
      setEmployeeInfo(null);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    // CRITICAL: Only run when auth is fully loaded AND admin status is resolved
    // This prevents running with stale isAdmin=false value
    if (!authLoading && isAdminResolved) {
      fetchPermissions();
    }
  }, [user, isAdmin, authLoading, isAdminResolved]);

  const hasPermission = (permission: EmployeePermission): boolean => {
    if (isSuperAdmin) return true;
    return permissions.includes(permission);
  };

  const hasAnyPermission = (perms: EmployeePermission[]): boolean => {
    if (isSuperAdmin) return true;
    return perms.some((p) => permissions.includes(p));
  };

  const canAccessRoute = (route: string): boolean => {
    if (isSuperAdmin) return true;
    
    // Dashboard is accessible to all authenticated admin users
    if (route === "/admin" || route === "/admin/") return true;
    
    const requiredPermissions = ROUTE_PERMISSIONS[route];
    
    // If no permissions are defined, it's super admin only
    if (!requiredPermissions || requiredPermissions.length === 0) {
      return false;
    }
    
    return hasAnyPermission(requiredPermissions);
  };

  return (
    <PermissionsContext.Provider
      value={{
        isSuperAdmin,
        isEmployee,
        permissions,
        employeeInfo,
        isLoading,
        hasPermission,
        hasAnyPermission,
        canAccessRoute,
        refetch: fetchPermissions,
      }}
    >
      {children}
    </PermissionsContext.Provider>
  );
}

export function usePermissions() {
  const context = useContext(PermissionsContext);
  if (context === undefined) {
    throw new Error("usePermissions must be used within a PermissionsProvider");
  }
  return context;
}
