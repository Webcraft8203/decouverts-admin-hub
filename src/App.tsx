import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "@/hooks/useAuth";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import { ErrorBoundary } from "@/components/ErrorBoundary";
import { ScrollToTop } from "@/components/ScrollToTop";
import { AdminLayout } from "@/components/AdminLayout";
import { PermissionProtectedRoute } from "@/components/admin/PermissionProtectedRoute";
import { Analytics } from "@vercel/analytics/react";
import Home from "./pages/Home";
import About from "./pages/About";
import Engineering from "./pages/Engineering";
import Manufacturing from "./pages/Manufacturing";
import Shop from "./pages/Shop";
import ProductDetail from "./pages/ProductDetail";
import Checkout from "./pages/Checkout";
import CustomerAuth from "./pages/CustomerAuth";
import Auth from "./pages/Auth";
import EmployeeAuth from "./pages/EmployeeAuth";
import Blogs from "./pages/Blogs";
import BlogDetail from "./pages/BlogDetail";
import UserDashboard from "./pages/user/Dashboard";
import UserCart from "./pages/user/Cart";
import UserOrders from "./pages/user/Orders";
import UserOrderDetails from "./pages/user/OrderDetails";
import UserAddresses from "./pages/user/Addresses";
import UserInvoices from "./pages/user/Invoices";
import UserProfile from "./pages/user/Profile";
import UserWishlist from "./pages/user/Wishlist";
import UserDesignRequests from "./pages/user/DesignRequests";
import UserDesignRequestDetail from "./pages/user/DesignRequestDetail";
import CustomPrintRequest from "./pages/user/CustomPrintRequest";
import EmployeePortal from "./pages/user/EmployeePortal";
import Dashboard from "./pages/admin/Dashboard";
import Products from "./pages/admin/Products";
import Categories from "./pages/admin/Categories";
import Inventory from "./pages/admin/Inventory";
import RawMaterials from "./pages/admin/RawMaterials";
import AdminOrders from "./pages/admin/Orders";
import AdminReviews from "./pages/admin/Reviews";
import AdminPromoCodes from "./pages/admin/PromoCodes";
import Invoices from "./pages/admin/Invoices";
import Customers from "./pages/admin/Customers";
import ActivityLogs from "./pages/admin/ActivityLogs";
import EmployeeActivityLogs from "./pages/admin/EmployeeActivityLogs";
import AdminDesignRequests from "./pages/admin/DesignRequests";
import AdminDesignRequestDetail from "./pages/admin/DesignRequestDetail";
import HomepageSettings from "./pages/admin/HomepageSettings";
import HomepageImages from "./pages/admin/HomepageImages";
import ContactRequests from "./pages/admin/ContactRequests";
import PrinterConfiguration from "./pages/PrinterConfiguration";
import PrinterConfigurations from "./pages/admin/PrinterConfigurations";
import DroneConfiguration from "./pages/DroneConfiguration";
import DroneConfigurations from "./pages/admin/DroneConfigurations";
import CustomerReviews from "./pages/admin/CustomerReviews";
import Partners from "./pages/admin/Partners";
import ShopSlides from "./pages/admin/ShopSlides";
import BlogSlides from "./pages/admin/BlogSlides";
import BlogPosts from "./pages/admin/BlogPosts";
import Employees from "./pages/admin/Employees";
import EmployeeDetail from "./pages/admin/EmployeeDetail";
import Accounting from "./pages/admin/Accounting";
import Attendance from "./pages/admin/Attendance";
import LeaveManagement from "./pages/admin/LeaveManagement";
import Payslips from "./pages/admin/Payslips";
import SalaryReports from "./pages/admin/SalaryReports";
import Reports from "./pages/admin/Reports";
import VerifyOrder from "./pages/VerifyOrder";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

// Helper component that wraps admin routes with permission protection
const AdminRoute = ({ children }: { children: React.ReactNode }) => (
  <ProtectedRoute requireAdmin>
    <AdminLayout>
      <PermissionProtectedRoute>
        {children}
      </PermissionProtectedRoute>
    </AdminLayout>
  </ProtectedRoute>
);

const App = () => (
  <ErrorBoundary>
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <TooltipProvider>
          <Toaster />
          <Sonner />
          <BrowserRouter>
            <ScrollToTop />
            <Routes>
              {/* Public Routes */}
              <Route path="/" element={<Home />} />
              <Route path="/about" element={<About />} />
              <Route path="/blogs" element={<Blogs />} />
              <Route path="/blogs/:slug" element={<BlogDetail />} />
              <Route path="/engineering" element={<Engineering />} />
              <Route path="/manufacturing" element={<Manufacturing />} />
              <Route path="/printer-configuration" element={<PrinterConfiguration />} />
              <Route path="/drone-configuration" element={<DroneConfiguration />} />
              <Route path="/shop" element={<Shop />} />
              <Route path="/product/:id" element={<ProductDetail />} />
              <Route path="/login" element={<CustomerAuth />} />
              <Route path="/auth" element={<Auth />} />
              <Route path="/employee-login" element={<EmployeeAuth />} />
              <Route path="/verify-order" element={<VerifyOrder />} />

              {/* Protected Customer Routes */}
              <Route path="/checkout/:productId" element={<ProtectedRoute><Checkout /></ProtectedRoute>} />
              <Route path="/dashboard" element={<ProtectedRoute><UserDashboard /></ProtectedRoute>} />
              <Route path="/dashboard/cart" element={<ProtectedRoute><UserCart /></ProtectedRoute>} />
              <Route path="/dashboard/orders" element={<ProtectedRoute><UserOrders /></ProtectedRoute>} />
              <Route path="/dashboard/orders/:orderId" element={<ProtectedRoute><UserOrderDetails /></ProtectedRoute>} />
              <Route path="/dashboard/addresses" element={<ProtectedRoute><UserAddresses /></ProtectedRoute>} />
              <Route path="/dashboard/invoices" element={<ProtectedRoute><UserInvoices /></ProtectedRoute>} />
              <Route path="/dashboard/profile" element={<ProtectedRoute><UserProfile /></ProtectedRoute>} />
              <Route path="/dashboard/wishlist" element={<ProtectedRoute><UserWishlist /></ProtectedRoute>} />
              <Route path="/dashboard/design-requests" element={<ProtectedRoute><UserDesignRequests /></ProtectedRoute>} />
              <Route path="/dashboard/design-requests/:id" element={<ProtectedRoute><UserDesignRequestDetail /></ProtectedRoute>} />
              <Route path="/dashboard/custom-print" element={<ProtectedRoute><CustomPrintRequest /></ProtectedRoute>} />
              <Route path="/dashboard/employee-portal" element={<ProtectedRoute><EmployeePortal /></ProtectedRoute>} />

              {/* Admin Routes - All wrapped with permission protection */}
              <Route path="/admin" element={<AdminRoute><Dashboard /></AdminRoute>} />
              <Route path="/admin/products" element={<AdminRoute><Products /></AdminRoute>} />
              <Route path="/admin/categories" element={<AdminRoute><Categories /></AdminRoute>} />
              <Route path="/admin/inventory" element={<AdminRoute><Inventory /></AdminRoute>} />
              <Route path="/admin/raw-materials" element={<AdminRoute><RawMaterials /></AdminRoute>} />
              <Route path="/admin/orders" element={<AdminRoute><AdminOrders /></AdminRoute>} />
              <Route path="/admin/reviews" element={<AdminRoute><AdminReviews /></AdminRoute>} />
              <Route path="/admin/promo-codes" element={<AdminRoute><AdminPromoCodes /></AdminRoute>} />
              <Route path="/admin/invoices" element={<AdminRoute><Invoices /></AdminRoute>} />
              <Route path="/admin/customers" element={<AdminRoute><Customers /></AdminRoute>} />
              <Route path="/admin/activity-logs" element={<AdminRoute><ActivityLogs /></AdminRoute>} />
              <Route path="/admin/employee-activity-logs" element={<AdminRoute><EmployeeActivityLogs /></AdminRoute>} />
              <Route path="/admin/design-requests" element={<AdminRoute><AdminDesignRequests /></AdminRoute>} />
              <Route path="/admin/design-requests/:id" element={<AdminRoute><AdminDesignRequestDetail /></AdminRoute>} />
              <Route path="/admin/homepage-settings" element={<AdminRoute><HomepageSettings /></AdminRoute>} />
              <Route path="/admin/homepage-images" element={<AdminRoute><HomepageImages /></AdminRoute>} />
              <Route path="/admin/contact-requests" element={<AdminRoute><ContactRequests /></AdminRoute>} />
              <Route path="/admin/printer-configurations" element={<AdminRoute><PrinterConfigurations /></AdminRoute>} />
              <Route path="/admin/drone-configurations" element={<AdminRoute><DroneConfigurations /></AdminRoute>} />
              <Route path="/admin/customer-reviews" element={<AdminRoute><CustomerReviews /></AdminRoute>} />
              <Route path="/admin/partners" element={<AdminRoute><Partners /></AdminRoute>} />
              <Route path="/admin/shop-slides" element={<AdminRoute><ShopSlides /></AdminRoute>} />
              <Route path="/admin/blog-slides" element={<AdminRoute><BlogSlides /></AdminRoute>} />
              <Route path="/admin/blog-posts" element={<AdminRoute><BlogPosts /></AdminRoute>} />
              <Route path="/admin/employees" element={<AdminRoute><Employees /></AdminRoute>} />
              <Route path="/admin/employees/:id" element={<AdminRoute><EmployeeDetail /></AdminRoute>} />
              <Route path="/admin/accounting" element={<AdminRoute><Accounting /></AdminRoute>} />
              <Route path="/admin/attendance" element={<AdminRoute><Attendance /></AdminRoute>} />
              <Route path="/admin/leave-management" element={<AdminRoute><LeaveManagement /></AdminRoute>} />
              <Route path="/admin/payslips" element={<AdminRoute><Payslips /></AdminRoute>} />
              <Route path="/admin/salary-reports" element={<AdminRoute><SalaryReports /></AdminRoute>} />
              <Route path="/admin/reports" element={<AdminRoute><Reports /></AdminRoute>} />

              {/* 404 */}
              <Route path="*" element={<NotFound />} />
            </Routes>
          </BrowserRouter>
        </TooltipProvider>
      </AuthProvider>
    </QueryClientProvider>
    <Analytics />
  </ErrorBoundary>
);

export default App;
