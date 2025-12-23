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
import Dashboard from "./pages/admin/Dashboard";
import Products from "./pages/admin/Products";
import Categories from "./pages/admin/Categories";
import Inventory from "./pages/admin/Inventory";
import RawMaterials from "./pages/admin/RawMaterials";
import AdminOrders from "./pages/admin/Orders";
import AdminReviews from "./pages/admin/Reviews";
import AdminPromoCodes from "./pages/admin/PromoCodes";
import Invoices from "./pages/admin/Invoices";
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
              <Route path="/admin" element={<ProtectedRoute requireAdmin><AdminLayout><Dashboard /></AdminLayout></ProtectedRoute>} />
              <Route path="/admin/products" element={<ProtectedRoute requireAdmin><AdminLayout><Products /></AdminLayout></ProtectedRoute>} />
              <Route path="/admin/categories" element={<ProtectedRoute requireAdmin><AdminLayout><Categories /></AdminLayout></ProtectedRoute>} />
              <Route path="/admin/inventory" element={<ProtectedRoute requireAdmin><AdminLayout><Inventory /></AdminLayout></ProtectedRoute>} />
              <Route path="/admin/raw-materials" element={<ProtectedRoute requireAdmin><AdminLayout><RawMaterials /></AdminLayout></ProtectedRoute>} />
              <Route path="/admin/orders" element={<ProtectedRoute requireAdmin><AdminLayout><AdminOrders /></AdminLayout></ProtectedRoute>} />
              <Route path="/admin/reviews" element={<ProtectedRoute requireAdmin><AdminLayout><AdminReviews /></AdminLayout></ProtectedRoute>} />
              <Route path="/admin/promo-codes" element={<ProtectedRoute requireAdmin><AdminLayout><AdminPromoCodes /></AdminLayout></ProtectedRoute>} />
              <Route path="/admin/invoices" element={<ProtectedRoute requireAdmin><AdminLayout><Invoices /></AdminLayout></ProtectedRoute>} />
              <Route path="*" element={<NotFound />} />
            </Routes>
          </BrowserRouter>
        </TooltipProvider>
      </AuthProvider>
    </QueryClientProvider>
  </ErrorBoundary>
);

export default App;