import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "@/hooks/useAuth";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import { ErrorBoundary } from "@/components/ErrorBoundary";
import { AdminLayout } from "@/components/AdminLayout";
import Home from "./pages/Home";
import About from "./pages/About";
import Engineering from "./pages/Engineering";
import Manufacturing from "./pages/Manufacturing";
import Shop from "./pages/Shop";
import ProductDetail from "./pages/ProductDetail";
import Checkout from "./pages/Checkout";
import CustomerAuth from "./pages/CustomerAuth";
import Auth from "./pages/Auth";
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
import Dashboard from "./pages/admin/Dashboard";
import Products from "./pages/admin/Products";
import Categories from "./pages/admin/Categories";
import Inventory from "./pages/admin/Inventory";
import RawMaterials from "./pages/admin/RawMaterials";
import AdminOrders from "./pages/admin/Orders";
import AdminReviews from "./pages/admin/Reviews";
import AdminPromoCodes from "./pages/admin/PromoCodes";
import Invoices from "./pages/admin/Invoices";
import InvoiceSettings from "./pages/admin/InvoiceSettings";
import Customers from "./pages/admin/Customers";
import ActivityLogs from "./pages/admin/ActivityLogs";
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
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <ErrorBoundary>
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <TooltipProvider>
          <Toaster />
          <Sonner />
          <BrowserRouter>
            <Routes>
              <Route path="/" element={<Home />} />
              <Route path="/about" element={<About />} />
              <Route path="/engineering" element={<Engineering />} />
              <Route path="/manufacturing" element={<Manufacturing />} />
              <Route path="/printer-configuration" element={<PrinterConfiguration />} />
              <Route path="/drone-configuration" element={<DroneConfiguration />} />
              <Route path="/shop" element={<Shop />} />
              <Route path="/product/:id" element={<ProductDetail />} />
              <Route path="/checkout/:productId" element={<ProtectedRoute><Checkout /></ProtectedRoute>} />
              <Route path="/login" element={<CustomerAuth />} />
              <Route path="/auth" element={<Auth />} />
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
              <Route path="/admin" element={<ProtectedRoute requireAdmin><AdminLayout><Dashboard /></AdminLayout></ProtectedRoute>} />
              <Route path="/admin/products" element={<ProtectedRoute requireAdmin><AdminLayout><Products /></AdminLayout></ProtectedRoute>} />
              <Route path="/admin/categories" element={<ProtectedRoute requireAdmin><AdminLayout><Categories /></AdminLayout></ProtectedRoute>} />
              <Route path="/admin/inventory" element={<ProtectedRoute requireAdmin><AdminLayout><Inventory /></AdminLayout></ProtectedRoute>} />
              <Route path="/admin/raw-materials" element={<ProtectedRoute requireAdmin><AdminLayout><RawMaterials /></AdminLayout></ProtectedRoute>} />
              <Route path="/admin/orders" element={<ProtectedRoute requireAdmin><AdminLayout><AdminOrders /></AdminLayout></ProtectedRoute>} />
              <Route path="/admin/reviews" element={<ProtectedRoute requireAdmin><AdminLayout><AdminReviews /></AdminLayout></ProtectedRoute>} />
              <Route path="/admin/promo-codes" element={<ProtectedRoute requireAdmin><AdminLayout><AdminPromoCodes /></AdminLayout></ProtectedRoute>} />
              <Route path="/admin/invoices" element={<ProtectedRoute requireAdmin><AdminLayout><Invoices /></AdminLayout></ProtectedRoute>} />
              <Route path="/admin/invoice-settings" element={<ProtectedRoute requireAdmin><AdminLayout><InvoiceSettings /></AdminLayout></ProtectedRoute>} />
              <Route path="/admin/customers" element={<ProtectedRoute requireAdmin><AdminLayout><Customers /></AdminLayout></ProtectedRoute>} />
              <Route path="/admin/activity-logs" element={<ProtectedRoute requireAdmin><AdminLayout><ActivityLogs /></AdminLayout></ProtectedRoute>} />
              <Route path="/admin/design-requests" element={<ProtectedRoute requireAdmin><AdminLayout><AdminDesignRequests /></AdminLayout></ProtectedRoute>} />
              <Route path="/admin/design-requests/:id" element={<ProtectedRoute requireAdmin><AdminLayout><AdminDesignRequestDetail /></AdminLayout></ProtectedRoute>} />
              <Route path="/admin/homepage-settings" element={<ProtectedRoute requireAdmin><HomepageSettings /></ProtectedRoute>} />
              <Route path="/admin/homepage-images" element={<ProtectedRoute requireAdmin><HomepageImages /></ProtectedRoute>} />
              <Route path="/admin/contact-requests" element={<ProtectedRoute requireAdmin><ContactRequests /></ProtectedRoute>} />
              <Route path="/admin/printer-configurations" element={<ProtectedRoute requireAdmin><AdminLayout><PrinterConfigurations /></AdminLayout></ProtectedRoute>} />
              <Route path="/admin/drone-configurations" element={<ProtectedRoute requireAdmin><AdminLayout><DroneConfigurations /></AdminLayout></ProtectedRoute>} />
              <Route path="/admin/customer-reviews" element={<ProtectedRoute requireAdmin><AdminLayout><CustomerReviews /></AdminLayout></ProtectedRoute>} />
              <Route path="/admin/partners" element={<ProtectedRoute requireAdmin><AdminLayout><Partners /></AdminLayout></ProtectedRoute>} />
              <Route path="*" element={<NotFound />} />
            </Routes>
          </BrowserRouter>
        </TooltipProvider>
      </AuthProvider>
    </QueryClientProvider>
  </ErrorBoundary>
);

export default App;