import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { 
  Package, 
  Layers, 
  Warehouse, 
  Box, 
  FileText, 
  TrendingUp, 
  ShoppingBag,
  Clock,
  PackageCheck,
  Truck,
  IndianRupee,
  Calendar
} from "lucide-react";
import { format } from "date-fns";

interface DashboardStats {
  totalProducts: number;
  totalCategories: number;
  inStockProducts: number;
  outOfStockProducts: number;
  totalRawMaterials: number;
  lowStockMaterials: number;
  totalInvoices: number;
  // Order stats
  pendingConfirmation: number;
  pendingPacking: number;
  pendingPickup: number;
  // Revenue stats
  todayCollection: number;
  totalRevenue: number;
  totalOrders: number;
  // Raw material cost
  totalMaterialCost: number;
}

export default function Dashboard() {
  const [stats, setStats] = useState<DashboardStats>({
    totalProducts: 0,
    totalCategories: 0,
    inStockProducts: 0,
    outOfStockProducts: 0,
    totalRawMaterials: 0,
    lowStockMaterials: 0,
    totalInvoices: 0,
    pendingConfirmation: 0,
    pendingPacking: 0,
    pendingPickup: 0,
    todayCollection: 0,
    totalRevenue: 0,
    totalOrders: 0,
    totalMaterialCost: 0,
  });
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchStats();
  }, []);

  const fetchStats = async () => {
    try {
      // Get today's date range
      const today = new Date();
      const startOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate()).toISOString();
      const endOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate() + 1).toISOString();

      const [
        productsRes, 
        categoriesRes, 
        rawMaterialsRes, 
        invoicesRes,
        ordersRes,
        todayOrdersRes
      ] = await Promise.all([
        supabase.from("products").select("id, availability_status"),
        supabase.from("categories").select("id"),
        supabase.from("raw_materials").select("id, availability_status, quantity, cost_per_unit"),
        supabase.from("invoices").select("id"),
        supabase.from("orders").select("id, status, total_amount, payment_status"),
        supabase.from("orders")
          .select("total_amount, payment_status")
          .gte("created_at", startOfDay)
          .lt("created_at", endOfDay)
          .eq("payment_status", "paid"),
      ]);

      const products = productsRes.data || [];
      const inStock = products.filter((p) => p.availability_status === "in_stock").length;
      const outOfStock = products.filter((p) => p.availability_status === "out_of_stock").length;

      const materials = rawMaterialsRes.data || [];
      const lowStock = materials.filter((m) => m.availability_status === "low_stock" || m.availability_status === "unavailable").length;
      
      // Calculate total raw material investment
      const totalMaterialCost = materials.reduce((sum, m) => {
        return sum + (Number(m.quantity) * Number(m.cost_per_unit || 0));
      }, 0);

      const orders = ordersRes.data || [];
      const pendingConfirmation = orders.filter((o) => o.status === "pending").length;
      const pendingPacking = orders.filter((o) => o.status === "confirmed" || o.status === "processing").length;
      const pendingPickup = orders.filter((o) => o.status === "packed" || o.status === "ready_for_pickup").length;

      // Calculate revenue
      const paidOrders = orders.filter((o) => o.payment_status === "paid");
      const totalRevenue = paidOrders.reduce((sum, o) => sum + Number(o.total_amount || 0), 0);
      
      const todayOrders = todayOrdersRes.data || [];
      const todayCollection = todayOrders.reduce((sum, o) => sum + Number(o.total_amount || 0), 0);

      setStats({
        totalProducts: products.length,
        totalCategories: (categoriesRes.data || []).length,
        inStockProducts: inStock,
        outOfStockProducts: outOfStock,
        totalRawMaterials: materials.length,
        lowStockMaterials: lowStock,
        totalInvoices: (invoicesRes.data || []).length,
        pendingConfirmation,
        pendingPacking,
        pendingPickup,
        todayCollection,
        totalRevenue,
        totalOrders: orders.length,
        totalMaterialCost,
      });
    } catch (error) {
      console.error("Error fetching stats:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0
    }).format(amount);
  };

  return (
    <div className="space-y-8 animate-fade-in">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-foreground">Dashboard</h1>
        <p className="text-muted-foreground mt-1">
          Welcome to Decouverts Plus Admin Panel
        </p>
      </div>

      {/* Order Status Cards */}
      <div>
        <h2 className="text-lg font-semibold text-foreground mb-4 flex items-center gap-2">
          <ShoppingBag className="w-5 h-5 text-primary" />
          Order Status
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card className="border-border hover:shadow-md transition-shadow bg-orange-500/5 border-orange-500/20">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Pending Confirmation
              </CardTitle>
              <div className="p-2 rounded-lg bg-orange-500/10">
                <Clock className="h-4 w-4 text-orange-500" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-orange-600">
                {isLoading ? "..." : stats.pendingConfirmation}
              </div>
              <p className="text-xs text-muted-foreground mt-1">Awaiting confirmation</p>
            </CardContent>
          </Card>

          <Card className="border-border hover:shadow-md transition-shadow bg-blue-500/5 border-blue-500/20">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Pending Packing
              </CardTitle>
              <div className="p-2 rounded-lg bg-blue-500/10">
                <Package className="h-4 w-4 text-blue-500" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-blue-600">
                {isLoading ? "..." : stats.pendingPacking}
              </div>
              <p className="text-xs text-muted-foreground mt-1">Ready to pack</p>
            </CardContent>
          </Card>

          <Card className="border-border hover:shadow-md transition-shadow bg-purple-500/5 border-purple-500/20">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Pending Pickup
              </CardTitle>
              <div className="p-2 rounded-lg bg-purple-500/10">
                <Truck className="h-4 w-4 text-purple-500" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-purple-600">
                {isLoading ? "..." : stats.pendingPickup}
              </div>
              <p className="text-xs text-muted-foreground mt-1">Ready for dispatch</p>
            </CardContent>
          </Card>

          <Card className="border-border hover:shadow-md transition-shadow bg-green-500/5 border-green-500/20">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Total Orders
              </CardTitle>
              <div className="p-2 rounded-lg bg-green-500/10">
                <PackageCheck className="h-4 w-4 text-green-500" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-green-600">
                {isLoading ? "..." : stats.totalOrders}
              </div>
              <p className="text-xs text-muted-foreground mt-1">All time orders</p>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Revenue Cards */}
      <div>
        <h2 className="text-lg font-semibold text-foreground mb-4 flex items-center gap-2">
          <IndianRupee className="w-5 h-5 text-primary" />
          Revenue Overview
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <Card className="border-border hover:shadow-md transition-shadow bg-gradient-to-br from-primary/10 to-primary/5 border-primary/20">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                <Calendar className="w-4 h-4" />
                Today's Collection
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl sm:text-3xl font-bold text-primary">
                {isLoading ? "..." : formatCurrency(stats.todayCollection)}
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                {format(new Date(), "dd MMM yyyy")}
              </p>
            </CardContent>
          </Card>

          <Card className="border-border hover:shadow-md transition-shadow bg-gradient-to-br from-green-500/10 to-green-500/5 border-green-500/20">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                <TrendingUp className="w-4 h-4" />
                Total Revenue
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl sm:text-3xl font-bold text-green-600">
                {isLoading ? "..." : formatCurrency(stats.totalRevenue)}
              </div>
              <p className="text-xs text-muted-foreground mt-1">All time earnings</p>
            </CardContent>
          </Card>

          <Card className="border-border hover:shadow-md transition-shadow bg-gradient-to-br from-red-500/10 to-red-500/5 border-red-500/20">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                <Box className="w-4 h-4" />
                Raw Material Investment
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl sm:text-3xl font-bold text-red-600">
                {isLoading ? "..." : formatCurrency(stats.totalMaterialCost)}
              </div>
              <p className="text-xs text-muted-foreground mt-1">Total inventory cost</p>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Inventory Stats Grid */}
      <div>
        <h2 className="text-lg font-semibold text-foreground mb-4 flex items-center gap-2">
          <Warehouse className="w-5 h-5 text-primary" />
          Inventory Overview
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
          <Card className="border-border hover:shadow-md transition-shadow">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Total Products
              </CardTitle>
              <div className="p-2 rounded-lg bg-primary/10">
                <Package className="h-4 w-4 text-primary" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-foreground">
                {isLoading ? "..." : stats.totalProducts}
              </div>
              <p className="text-xs text-muted-foreground mt-1">{stats.inStockProducts} in stock</p>
            </CardContent>
          </Card>

          <Card className="border-border hover:shadow-md transition-shadow">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Categories
              </CardTitle>
              <div className="p-2 rounded-lg bg-accent/10">
                <Layers className="h-4 w-4 text-accent" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-foreground">
                {isLoading ? "..." : stats.totalCategories}
              </div>
              <p className="text-xs text-muted-foreground mt-1">Product categories</p>
            </CardContent>
          </Card>

          <Card className="border-border hover:shadow-md transition-shadow">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Out of Stock
              </CardTitle>
              <div className={`p-2 rounded-lg ${stats.outOfStockProducts > 0 ? "bg-warning/10" : "bg-success/10"}`}>
                <Warehouse className={`h-4 w-4 ${stats.outOfStockProducts > 0 ? "text-warning" : "text-success"}`} />
              </div>
            </CardHeader>
            <CardContent>
              <div className={`text-2xl font-bold ${stats.outOfStockProducts > 0 ? "text-warning" : "text-success"}`}>
                {isLoading ? "..." : stats.outOfStockProducts}
              </div>
              <p className="text-xs text-muted-foreground mt-1">Need restocking</p>
            </CardContent>
          </Card>

          <Card className="border-border hover:shadow-md transition-shadow">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Raw Materials
              </CardTitle>
              <div className="p-2 rounded-lg bg-chart-2/10">
                <Box className="h-4 w-4 text-chart-2" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-foreground">
                {isLoading ? "..." : stats.totalRawMaterials}
              </div>
              <p className="text-xs text-muted-foreground mt-1">{stats.lowStockMaterials} need attention</p>
            </CardContent>
          </Card>

          <Card className="border-border hover:shadow-md transition-shadow">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Invoices
              </CardTitle>
              <div className="p-2 rounded-lg bg-chart-3/10">
                <FileText className="h-4 w-4 text-chart-3" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-foreground">
                {isLoading ? "..." : stats.totalInvoices}
              </div>
              <p className="text-xs text-muted-foreground mt-1">Total generated</p>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
