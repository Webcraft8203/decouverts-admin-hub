import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { 
  Package, 
  ShoppingBag,
  IndianRupee,
  Calendar,
  TrendingUp,
  Users,
  RefreshCw,
  Wallet,
  Receipt
} from "lucide-react";
import { format } from "date-fns";
import { useAnalytics } from "@/hooks/useAnalytics";
import { SalesChart } from "@/components/admin/analytics/SalesChart";
import { OrderStatusChart } from "@/components/admin/analytics/OrderStatusChart";
import { TopProductsTable } from "@/components/admin/analytics/TopProductsTable";
import { CustomerInsights } from "@/components/admin/analytics/CustomerInsights";
import { LowStockProducts } from "@/components/admin/analytics/LowStockProducts";
import { LowStockMaterials } from "@/components/admin/LowStockMaterials";

export default function Dashboard() {
  const {
    isLoading,
    dashboardStats,
    salesData,
    orderStatusData,
    topProducts,
    lowProducts,
    lowStockProducts,
    customerStats,
    rawMaterials,
    refetch,
  } = useAnalytics();

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: "INR",
      maximumFractionDigits: 0,
    }).format(amount);
  };

  return (
    <div className="space-y-8 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Analytics Dashboard</h1>
          <p className="text-muted-foreground mt-1">
            Business performance overview for Decouverts Plus
          </p>
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={refetch}
          disabled={isLoading}
          className="self-start sm:self-auto"
        >
          <RefreshCw className={`h-4 w-4 mr-2 ${isLoading ? "animate-spin" : ""}`} />
          Refresh
        </Button>
      </div>

      {/* Key Metrics - Row 1 */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
        <Card className="border-border hover:shadow-md transition-shadow">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-xs font-medium text-muted-foreground">
              Total Orders
            </CardTitle>
            <ShoppingBag className="h-4 w-4 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-foreground">
              {isLoading ? "..." : dashboardStats.totalOrders}
            </div>
          </CardContent>
        </Card>

        <Card className="border-border hover:shadow-md transition-shadow">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-xs font-medium text-muted-foreground">
              Total Revenue
            </CardTitle>
            <IndianRupee className="h-4 w-4 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-primary">
              {isLoading ? "..." : formatCurrency(dashboardStats.totalRevenue)}
            </div>
          </CardContent>
        </Card>

        <Card className="border-border hover:shadow-md transition-shadow bg-gradient-to-br from-green-500/10 to-green-500/5 border-green-500/20">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-xs font-medium text-muted-foreground">
              Total Profit
            </CardTitle>
            <Wallet className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              {isLoading ? "..." : formatCurrency(dashboardStats.totalProfit)}
            </div>
            <p className="text-xs text-muted-foreground mt-1">Revenue - Cost</p>
          </CardContent>
        </Card>

        <Card className="border-border hover:shadow-md transition-shadow">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-xs font-medium text-muted-foreground">
              Total Products
            </CardTitle>
            <Package className="h-4 w-4 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-foreground">
              {isLoading ? "..." : dashboardStats.totalProducts}
            </div>
          </CardContent>
        </Card>

        <Card className="border-border hover:shadow-md transition-shadow">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-xs font-medium text-muted-foreground">
              Customers
            </CardTitle>
            <Users className="h-4 w-4 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-foreground">
              {isLoading ? "..." : dashboardStats.totalCustomers}
            </div>
          </CardContent>
        </Card>

        <Card className="border-border hover:shadow-md transition-shadow bg-gradient-to-br from-primary/10 to-primary/5 border-primary/20">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-xs font-medium text-muted-foreground">
              Today's Revenue
            </CardTitle>
            <TrendingUp className="h-4 w-4 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-primary">
              {isLoading ? "..." : formatCurrency(dashboardStats.todayRevenue)}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              {format(new Date(), "dd MMM yyyy")}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* GST Collection Stats - Row 2 */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="border-border hover:shadow-md transition-shadow bg-gradient-to-br from-blue-500/10 to-blue-500/5 border-blue-500/20">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-xs font-medium text-muted-foreground">
              Today's Orders
            </CardTitle>
            <Calendar className="h-4 w-4 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">
              {isLoading ? "..." : dashboardStats.todayOrders}
            </div>
          </CardContent>
        </Card>

        <Card className="border-border hover:shadow-md transition-shadow">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-xs font-medium text-muted-foreground">
              CGST Collected
            </CardTitle>
            <Receipt className="h-4 w-4 text-orange-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-orange-500">
              {isLoading ? "..." : formatCurrency(dashboardStats.totalCgst)}
            </div>
            <p className="text-xs text-muted-foreground mt-1">Central GST</p>
          </CardContent>
        </Card>

        <Card className="border-border hover:shadow-md transition-shadow">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-xs font-medium text-muted-foreground">
              SGST Collected
            </CardTitle>
            <Receipt className="h-4 w-4 text-purple-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-purple-500">
              {isLoading ? "..." : formatCurrency(dashboardStats.totalSgst)}
            </div>
            <p className="text-xs text-muted-foreground mt-1">State GST</p>
          </CardContent>
        </Card>

        <Card className="border-border hover:shadow-md transition-shadow">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-xs font-medium text-muted-foreground">
              IGST Collected
            </CardTitle>
            <Receipt className="h-4 w-4 text-teal-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-teal-500">
              {isLoading ? "..." : formatCurrency(dashboardStats.totalIgst)}
            </div>
            <p className="text-xs text-muted-foreground mt-1">Integrated GST</p>
          </CardContent>
        </Card>
      </div>

      {/* Sales Analytics Section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <SalesChart data={salesData} isLoading={isLoading} />
        </div>
        <div>
          <OrderStatusChart data={orderStatusData} isLoading={isLoading} />
        </div>
      </div>

      {/* Product Insights */}
      <div>
        <h2 className="text-lg font-semibold text-foreground mb-4 flex items-center gap-2">
          <Package className="w-5 h-5 text-primary" />
          Product Insights
        </h2>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2">
            <TopProductsTable
              topProducts={topProducts}
              lowProducts={lowProducts}
              isLoading={isLoading}
            />
          </div>
          <div className="space-y-6">
            <LowStockProducts products={lowStockProducts} isLoading={isLoading} />
            <LowStockMaterials materials={rawMaterials} isLoading={isLoading} />
          </div>
        </div>
      </div>

      {/* Customer Insights */}
      <CustomerInsights stats={customerStats} isLoading={isLoading} />
    </div>
  );
}
