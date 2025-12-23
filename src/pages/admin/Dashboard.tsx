import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Package, Layers, Warehouse, Box, FileText, TrendingUp, AlertCircle } from "lucide-react";

interface DashboardStats {
  totalProducts: number;
  totalCategories: number;
  inStockProducts: number;
  outOfStockProducts: number;
  totalRawMaterials: number;
  lowStockMaterials: number;
  totalInvoices: number;
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
  });
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchStats();
  }, []);

  const fetchStats = async () => {
    try {
      const [productsRes, categoriesRes, rawMaterialsRes, invoicesRes] = await Promise.all([
        supabase.from("products").select("id, availability_status"),
        supabase.from("categories").select("id"),
        supabase.from("raw_materials").select("id, availability_status"),
        supabase.from("invoices").select("id"),
      ]);

      const products = productsRes.data || [];
      const inStock = products.filter((p) => p.availability_status === "in_stock").length;
      const outOfStock = products.filter((p) => p.availability_status === "out_of_stock").length;

      const materials = rawMaterialsRes.data || [];
      const lowStock = materials.filter((m) => m.availability_status === "low_stock" || m.availability_status === "unavailable").length;

      setStats({
        totalProducts: products.length,
        totalCategories: (categoriesRes.data || []).length,
        inStockProducts: inStock,
        outOfStockProducts: outOfStock,
        totalRawMaterials: materials.length,
        lowStockMaterials: lowStock,
        totalInvoices: (invoicesRes.data || []).length,
      });
    } catch (error) {
      console.error("Error fetching stats:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const statCards = [
    {
      title: "Total Products",
      value: stats.totalProducts,
      icon: Package,
      description: `${stats.inStockProducts} in stock`,
      color: "text-primary",
      bgColor: "bg-primary/10",
    },
    {
      title: "Categories",
      value: stats.totalCategories,
      icon: Layers,
      description: "Product categories",
      color: "text-accent",
      bgColor: "bg-accent/10",
    },
    {
      title: "Inventory Status",
      value: stats.outOfStockProducts,
      icon: Warehouse,
      description: "Out of stock items",
      color: stats.outOfStockProducts > 0 ? "text-warning" : "text-success",
      bgColor: stats.outOfStockProducts > 0 ? "bg-warning/10" : "bg-success/10",
    },
    {
      title: "Raw Materials",
      value: stats.totalRawMaterials,
      icon: Box,
      description: `${stats.lowStockMaterials} need attention`,
      color: "text-chart-2",
      bgColor: "bg-chart-2/10",
    },
    {
      title: "Invoices",
      value: stats.totalInvoices,
      icon: FileText,
      description: "Total generated",
      color: "text-chart-3",
      bgColor: "bg-chart-3/10",
    },
  ];

  return (
    <div className="space-y-8 animate-fade-in">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-foreground">Dashboard</h1>
        <p className="text-muted-foreground mt-1">
          Welcome to Decouverts Plus Admin Panel
        </p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4">
        {statCards.map((stat) => (
          <Card key={stat.title} className="border-border hover:shadow-md transition-shadow">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                {stat.title}
              </CardTitle>
              <div className={`p-2 rounded-lg ${stat.bgColor}`}>
                <stat.icon className={`h-4 w-4 ${stat.color}`} />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-foreground">
                {isLoading ? "..." : stat.value}
              </div>
              <p className="text-xs text-muted-foreground mt-1">{stat.description}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Quick Actions & Info */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="border-border">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-foreground">
              <TrendingUp className="h-5 w-5 text-primary" />
              Quick Overview
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between py-2 border-b border-border">
              <span className="text-muted-foreground">Products In Stock</span>
              <span className="font-semibold text-success">{stats.inStockProducts}</span>
            </div>
            <div className="flex items-center justify-between py-2 border-b border-border">
              <span className="text-muted-foreground">Products Out of Stock</span>
              <span className="font-semibold text-destructive">{stats.outOfStockProducts}</span>
            </div>
            <div className="flex items-center justify-between py-2">
              <span className="text-muted-foreground">Materials Needing Attention</span>
              <span className="font-semibold text-warning">{stats.lowStockMaterials}</span>
            </div>
          </CardContent>
        </Card>

        <Card className="border-border">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-foreground">
              <AlertCircle className="h-5 w-5 text-accent" />
              Phase 2 Coming Soon
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3 text-muted-foreground">
              <p className="text-sm">
                The following features will be available in Phase 2:
              </p>
              <ul className="text-sm space-y-2">
                <li className="flex items-center gap-2">
                  <div className="w-1.5 h-1.5 rounded-full bg-primary" />
                  Customer-facing e-commerce website
                </li>
                <li className="flex items-center gap-2">
                  <div className="w-1.5 h-1.5 rounded-full bg-primary" />
                  Shopping cart & checkout system
                </li>
                <li className="flex items-center gap-2">
                  <div className="w-1.5 h-1.5 rounded-full bg-primary" />
                  Payment integration (Razorpay)
                </li>
                <li className="flex items-center gap-2">
                  <div className="w-1.5 h-1.5 rounded-full bg-primary" />
                  Order management & tracking
                </li>
              </ul>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}