import { useLocation } from "react-router-dom";
import { usePermissions } from "@/hooks/useEmployeePermissions";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { AlertTriangle, ShieldX } from "lucide-react";

interface AccessDeniedBannerProps {
  className?: string;
}

/**
 * Shows an access denied message when a user was redirected due to insufficient permissions.
 * Checks for accessDenied state passed via React Router navigation.
 */
export function AccessDeniedBanner({ className }: AccessDeniedBannerProps) {
  const location = useLocation();
  const state = location.state as { accessDenied?: boolean; attemptedPath?: string } | null;

  if (!state?.accessDenied) {
    return null;
  }

  return (
    <Alert variant="destructive" className={className}>
      <ShieldX className="h-4 w-4" />
      <AlertTitle>Access Denied</AlertTitle>
      <AlertDescription>
        You don't have permission to access {state.attemptedPath || "that page"}. 
        Please contact your administrator if you believe this is an error.
      </AlertDescription>
    </Alert>
  );
}

/**
 * A card component that shows the user's current permissions and access level.
 * Useful for debugging and helping users understand what they can do.
 */
export function PermissionsInfoCard() {
  const { isSuperAdmin, isEmployee, permissions, employeeInfo, isLoading } = usePermissions();

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5" />
            Loading Permissions...
          </CardTitle>
        </CardHeader>
      </Card>
    );
  }

  if (isSuperAdmin) {
    return null; // Super admins don't need to see this
  }

  if (!isEmployee) {
    return null;
  }

  // Group permissions by category
  const permissionsByCategory: Record<string, string[]> = {};
  permissions.forEach((perm) => {
    const category = getCategoryForPermission(perm);
    if (!permissionsByCategory[category]) {
      permissionsByCategory[category] = [];
    }
    permissionsByCategory[category].push(formatPermission(perm));
  });

  return (
    <Card className="border-primary/20">
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-medium flex items-center gap-2">
          Your Access Level
        </CardTitle>
      </CardHeader>
      <CardContent className="text-sm text-muted-foreground">
        {employeeInfo && (
          <p className="mb-2">
            <span className="font-medium text-foreground">{employeeInfo.employee_name}</span>
            {employeeInfo.designation && <span> • {employeeInfo.designation}</span>}
            {employeeInfo.department && <span> • {employeeInfo.department}</span>}
          </p>
        )}
        {permissions.length === 0 ? (
          <p>No specific permissions assigned. Contact your administrator.</p>
        ) : (
          <div className="space-y-2">
            {Object.entries(permissionsByCategory).map(([category, perms]) => (
              <div key={category}>
                <p className="font-medium text-foreground text-xs">{category}</p>
                <p className="text-xs">{perms.join(", ")}</p>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

function getCategoryForPermission(permission: string): string {
  const categoryMap: Record<string, string> = {
    view_orders: "Orders",
    update_orders: "Orders",
    manage_shipping: "Orders",
    manage_design_requests: "Orders",
    view_accounting: "Finance",
    view_gst_reports: "Finance",
    view_revenue: "Finance",
    download_financials: "Finance",
    view_invoices: "Invoices",
    generate_invoices: "Invoices",
    download_invoices: "Invoices",
    manage_products: "Products",
    manage_categories: "Products",
    manage_inventory: "Inventory",
    manage_promo_codes: "Products",
    manage_homepage: "Content",
    manage_blog: "Content",
    manage_partners: "Content",
    manage_customer_reviews: "Content",
    view_customers: "Support",
    view_contact_requests: "Support",
    manage_printer_configs: "Configuration",
    manage_drone_configs: "Configuration",
    view_activity_logs: "System",
  };
  return categoryMap[permission] || "Other";
}

function formatPermission(permission: string): string {
  return permission
    .replace(/_/g, " ")
    .replace(/\b\w/g, (l) => l.toUpperCase());
}
