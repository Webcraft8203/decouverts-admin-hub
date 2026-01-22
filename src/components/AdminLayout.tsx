import { NavLink, useLocation } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { PermissionsProvider, usePermissions, EmployeePermission } from "@/hooks/useEmployeePermissions";
import { cn } from "@/lib/utils";
import {
  LayoutDashboard,
  Package,
  Layers,
  Warehouse,
  Box,
  FileText,
  LogOut,
  Menu,
  X,
  Shield,
  ShoppingBag,
  Star,
  Ticket,
  Users,
  Activity,
  Palette,
  Home,
  Printer,
  Plane,
  MessageCircle,
  Handshake,
  Image as ImageIcon,
  MessageSquare,
  SlidersHorizontal,
  FileText as BlogIcon,
  Newspaper,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { useState } from "react";
import { Badge } from "@/components/ui/badge";

interface NavItem {
  to: string;
  icon: React.ElementType;
  label: string;
  exact?: boolean;
  /** Required permissions - user needs ANY of these to see the item */
  permissions?: EmployeePermission[];
  /** If true, only super admins can see this item */
  superAdminOnly?: boolean;
}

const navItems: NavItem[] = [
  { to: "/admin", icon: LayoutDashboard, label: "Dashboard", exact: true },
  { to: "/admin/orders", icon: ShoppingBag, label: "Orders", permissions: ["view_orders", "update_orders"] },
  { to: "/admin/design-requests", icon: Palette, label: "Design Requests", permissions: ["manage_design_requests"] },
  { to: "/admin/products", icon: Package, label: "Products", permissions: ["manage_products"] },
  { to: "/admin/categories", icon: Layers, label: "Categories", permissions: ["manage_categories"] },
  { to: "/admin/shop-slides", icon: SlidersHorizontal, label: "Shop Slider", permissions: ["manage_products"] },
  { to: "/admin/promo-codes", icon: Ticket, label: "Promo Codes", permissions: ["manage_promo_codes"] },
  { to: "/admin/reviews", icon: Star, label: "Reviews", permissions: ["manage_products"] },
  { to: "/admin/inventory", icon: Warehouse, label: "Inventory", permissions: ["manage_inventory"] },
  { to: "/admin/raw-materials", icon: Box, label: "Raw Materials", permissions: ["manage_inventory"] },
  { to: "/admin/invoices", icon: FileText, label: "Invoices", permissions: ["view_invoices", "generate_invoices"] },
  { to: "/admin/accounting", icon: Activity, label: "Accounting", permissions: ["view_accounting", "view_gst_reports", "view_revenue"] },
  { to: "/admin/attendance", icon: Users, label: "Attendance", permissions: ["mark_attendance", "view_attendance"] },
  { to: "/admin/leave-management", icon: Activity, label: "Leave Management", permissions: ["manage_leave", "view_leave_requests"] },
  { to: "/admin/payslips", icon: FileText, label: "Payslips", permissions: ["generate_payslips", "view_payslips"] },
  { to: "/admin/salary-reports", icon: Activity, label: "Salary Reports", permissions: ["view_salary_info", "view_accounting"] },
  { to: "/admin/customers", icon: Users, label: "Customers", permissions: ["view_customers"] },
  { to: "/admin/employees", icon: Shield, label: "Employees", superAdminOnly: true },
  { to: "/admin/activity-logs", icon: Activity, label: "Activity Logs", permissions: ["view_activity_logs"] },
  { to: "/admin/homepage-settings", icon: Home, label: "Homepage Settings", permissions: ["manage_homepage"] },
  { to: "/admin/homepage-images", icon: ImageIcon, label: "Homepage Images", permissions: ["manage_homepage"] },
  { to: "/admin/contact-requests", icon: MessageSquare, label: "Contact Requests", permissions: ["view_contact_requests"] },
  { to: "/admin/printer-configurations", icon: Printer, label: "Printer Configs", permissions: ["manage_printer_configs"] },
  { to: "/admin/drone-configurations", icon: Plane, label: "Drone Configs", permissions: ["manage_drone_configs"] },
  { to: "/admin/customer-reviews", icon: MessageCircle, label: "Customer Reviews", permissions: ["manage_customer_reviews"] },
  { to: "/admin/partners", icon: Handshake, label: "Partners", permissions: ["manage_partners"] },
  { to: "/admin/blog-posts", icon: Newspaper, label: "Blog Posts", permissions: ["manage_blog"] },
  { to: "/admin/blog-slides", icon: BlogIcon, label: "Blog Slider", permissions: ["manage_blog"] },
];

interface AdminLayoutProps {
  children: React.ReactNode;
}

function AdminLayoutContent({ children }: AdminLayoutProps) {
  const { user, signOut } = useAuth();
  const { isSuperAdmin, isEmployee, employeeInfo, hasAnyPermission, isLoading } = usePermissions();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const location = useLocation();

  const handleSignOut = async () => {
    await signOut();
  };

  // Filter nav items based on permissions
  const filteredNavItems = navItems.filter((item) => {
    // Dashboard is always visible
    if (item.exact && item.to === "/admin") return true;
    
    // Super admin only items
    if (item.superAdminOnly) {
      return isSuperAdmin;
    }
    
    // If super admin, show all items
    if (isSuperAdmin) return true;
    
    // If no permissions defined, show to everyone (shouldn't happen, but fallback)
    if (!item.permissions || item.permissions.length === 0) return true;
    
    // Check if user has any of the required permissions
    return hasAnyPermission(item.permissions);
  });

  // Determine role display
  const getRoleDisplay = () => {
    if (isSuperAdmin) {
      return { label: "Super Admin", variant: "default" as const };
    }
    if (isEmployee && employeeInfo) {
      return { 
        label: employeeInfo.designation || "Employee", 
        variant: "secondary" as const 
      };
    }
    return { label: "User", variant: "outline" as const };
  };

  const roleDisplay = getRoleDisplay();

  return (
    <div className="min-h-screen bg-background">
      {/* Mobile Header */}
      <header className="lg:hidden fixed top-0 left-0 right-0 h-16 bg-sidebar border-b border-sidebar-border flex items-center justify-between px-4 z-50">
        <div className="flex items-center gap-3">
          <Shield className="h-6 w-6 text-sidebar-primary" />
          <span className="font-semibold text-sidebar-foreground">Decouverts Plus</span>
        </div>
        <Button
          variant="ghost"
          size="icon"
          onClick={() => setSidebarOpen(!sidebarOpen)}
          className="text-sidebar-foreground hover:bg-sidebar-accent"
        >
          {sidebarOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
        </Button>
      </header>

      {/* Sidebar */}
      <aside
        className={cn(
          "fixed top-0 left-0 h-screen w-64 bg-sidebar border-r border-sidebar-border transition-transform duration-300 z-40 flex flex-col",
          "lg:translate-x-0",
          sidebarOpen ? "translate-x-0" : "-translate-x-full"
        )}
      >
        {/* Header - Fixed */}
        <div className="h-16 flex-shrink-0 flex items-center gap-3 px-6 border-b border-sidebar-border">
          <Shield className="h-7 w-7 text-sidebar-primary" />
          <div>
            <span className="font-bold text-sidebar-foreground">Decouverts Plus</span>
            <p className="text-xs text-sidebar-foreground/60">Admin Panel</p>
          </div>
        </div>

        {/* Navigation - Scrollable */}
        <nav className="flex-1 overflow-y-auto p-4 space-y-1 scrollbar-thin">
          {isLoading ? (
            // Loading skeleton for nav items
            <div className="space-y-2">
              {[1, 2, 3, 4, 5].map((i) => (
                <div key={i} className="h-10 bg-sidebar-accent/30 rounded-lg animate-pulse" />
              ))}
            </div>
          ) : (
            filteredNavItems.map((item) => {
              const isActive = item.exact 
                ? location.pathname === item.to 
                : location.pathname.startsWith(item.to);
              
              return (
                <NavLink
                  key={item.to}
                  to={item.to}
                  onClick={() => setSidebarOpen(false)}
                  className={cn(
                    "flex items-center gap-3 px-4 py-2.5 rounded-lg text-sm font-medium transition-colors",
                    isActive
                      ? "bg-sidebar-primary text-sidebar-primary-foreground"
                      : "text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
                  )}
                >
                  <item.icon className="h-5 w-5" />
                  {item.label}
                </NavLink>
              );
            })
          )}
        </nav>

        {/* Footer - Fixed */}
        <div className="flex-shrink-0 p-4 border-t border-sidebar-border bg-sidebar">
          <div className="flex items-center gap-3 px-2 mb-3">
            <div className="w-8 h-8 rounded-full bg-sidebar-primary/20 flex items-center justify-center">
              <span className="text-xs font-medium text-sidebar-primary">
                {user?.email?.[0].toUpperCase()}
              </span>
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-sidebar-foreground truncate">
                {isEmployee && employeeInfo ? employeeInfo.employee_name : user?.email}
              </p>
              <Badge variant={roleDisplay.variant} className="text-[10px] px-1.5 py-0">
                {roleDisplay.label}
              </Badge>
            </div>
          </div>
          <Button
            variant="ghost"
            onClick={handleSignOut}
            className="w-full justify-start text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
          >
            <LogOut className="mr-2 h-4 w-4" />
            Sign Out
          </Button>
        </div>
      </aside>

      {/* Mobile Overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-foreground/20 backdrop-blur-sm z-30 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Main Content */}
      <main className="lg:ml-64 min-h-screen pt-16 lg:pt-0">
        <div className="p-6 lg:p-8">{children}</div>
      </main>
    </div>
  );
}

export function AdminLayout({ children }: AdminLayoutProps) {
  return (
    <PermissionsProvider>
      <AdminLayoutContent>{children}</AdminLayoutContent>
    </PermissionsProvider>
  );
}
