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
import { Analytics } from "@vercel/analytics/react";
import { SpeedInsights } from "@vercel/speed-insights/react";
import { SiteSchema } from "@/components/SEOSchemas";
import Home from "./pages/Home";
import About from "./pages/About";
import Shop from "./pages/Shop";
import ProductDetail from "./pages/ProductDetail";
import Checkout from "./pages/Checkout";
import CustomerAuth from "./pages/CustomerAuth";
import Auth from "./pages/Auth";
import Blogs from "./pages/Blogs";
import CategoryPage from "./pages/CategoryPage";
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
import CustomerMaster from "./pages/admin/CustomerMaster";
import ProductMaster from "./pages/admin/ProductMaster";
import AdminDesignRequests from "./pages/admin/DesignRequests";
import AdminDesignRequestDetail from "./pages/admin/DesignRequestDetail";
import HomepageSettings from "./pages/admin/HomepageSettings";
import HomepageImages from "./pages/admin/HomepageImages";
import ContactRequests from "./pages/admin/ContactRequests";
import CustomerReviews from "./pages/admin/CustomerReviews";
import Partners from "./pages/admin/Partners";
import ShopSlides from "./pages/admin/ShopSlides";
import HeroSlides from "./pages/admin/HeroSlides";
import BlogSlides from "./pages/admin/BlogSlides";
import BlogPosts from "./pages/admin/BlogPosts";
import Accounting from "./pages/admin/Accounting";
import Reports from "./pages/admin/Reports";
import Newsletter from "./pages/admin/Newsletter";
import VerifyOrder from "./pages/VerifyOrder";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const AdminRoute = ({ children }: { children: React.ReactNode }) => (
  <ProtectedRoute requireAdmin>
    <AdminLayout>{children}</AdminLayout>
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
            <SiteSchema />
            <ScrollToTop />
            <Routes>
              {/* Public Routes */}
              <Route path="/" element={<Home />} />
              <Route path="/about" element={<About />} />
              <Route path="/blogs" element={<Blogs />} />
              <Route path="/blogs/:slug" element={<BlogDetail />} />
              
              <Route path="/shop" element={<Shop />} />
              <Route path="/categories/:slug" element={<CategoryPage />} />
              <Route path="/product/:id" element={<ProductDetail />} />
              <Route path="/login" element={<CustomerAuth />} />
              <Route path="/auth" element={<Auth />} />
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

              {/* Admin Routes - super admin only */}
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
              <Route path="/admin/customer-master" element={<AdminRoute><CustomerMaster /></AdminRoute>} />
              <Route path="/admin/product-master" element={<AdminRoute><ProductMaster /></AdminRoute>} />
              <Route path="/admin/design-requests" element={<AdminRoute><AdminDesignRequests /></AdminRoute>} />
              <Route path="/admin/design-requests/:id" element={<AdminRoute><AdminDesignRequestDetail /></AdminRoute>} />
              <Route path="/admin/homepage-settings" element={<AdminRoute><HomepageSettings /></AdminRoute>} />
              <Route path="/admin/homepage-images" element={<AdminRoute><HomepageImages /></AdminRoute>} />
              <Route path="/admin/contact-requests" element={<AdminRoute><ContactRequests /></AdminRoute>} />
              
              <Route path="/admin/customer-reviews" element={<AdminRoute><CustomerReviews /></AdminRoute>} />
              <Route path="/admin/partners" element={<AdminRoute><Partners /></AdminRoute>} />
              <Route path="/admin/shop-slides" element={<AdminRoute><ShopSlides /></AdminRoute>} />
              <Route path="/admin/hero-slides" element={<AdminRoute><HeroSlides /></AdminRoute>} />
              <Route path="/admin/blog-slides" element={<AdminRoute><BlogSlides /></AdminRoute>} />
              <Route path="/admin/blog-posts" element={<AdminRoute><BlogPosts /></AdminRoute>} />
              <Route path="/admin/accounting" element={<AdminRoute><Accounting /></AdminRoute>} />
              <Route path="/admin/reports" element={<AdminRoute><Reports /></AdminRoute>} />
              <Route path="/admin/newsletter" element={<AdminRoute><Newsletter /></AdminRoute>} />

              {/* 404 */}
              <Route path="*" element={<NotFound />} />
            </Routes>
          </BrowserRouter>
        </TooltipProvider>
      </AuthProvider>
    </QueryClientProvider>
    <Analytics />
    <SpeedInsights />
  </ErrorBoundary>
);

export default App;
