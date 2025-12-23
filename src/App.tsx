import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider } from "@/hooks/useAuth";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import { AdminLayout } from "@/components/AdminLayout";
import Auth from "./pages/Auth";
import Dashboard from "./pages/admin/Dashboard";
import Products from "./pages/admin/Products";
import Categories from "./pages/admin/Categories";
import Inventory from "./pages/admin/Inventory";
import RawMaterials from "./pages/admin/RawMaterials";
import Invoices from "./pages/admin/Invoices";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <AuthProvider>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <Routes>
            <Route path="/" element={<Navigate to="/auth" replace />} />
            <Route path="/auth" element={<Auth />} />
            <Route path="/admin" element={<ProtectedRoute requireAdmin><AdminLayout><Dashboard /></AdminLayout></ProtectedRoute>} />
            <Route path="/admin/products" element={<ProtectedRoute requireAdmin><AdminLayout><Products /></AdminLayout></ProtectedRoute>} />
            <Route path="/admin/categories" element={<ProtectedRoute requireAdmin><AdminLayout><Categories /></AdminLayout></ProtectedRoute>} />
            <Route path="/admin/inventory" element={<ProtectedRoute requireAdmin><AdminLayout><Inventory /></AdminLayout></ProtectedRoute>} />
            <Route path="/admin/raw-materials" element={<ProtectedRoute requireAdmin><AdminLayout><RawMaterials /></AdminLayout></ProtectedRoute>} />
            <Route path="/admin/invoices" element={<ProtectedRoute requireAdmin><AdminLayout><Invoices /></AdminLayout></ProtectedRoute>} />
            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </TooltipProvider>
    </AuthProvider>
  </QueryClientProvider>
);

export default App;