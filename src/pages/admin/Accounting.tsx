import { useState, useEffect, useMemo } from "react";
import { supabase } from "@/integrations/supabase/client";
import { usePermissions } from "@/hooks/useEmployeePermissions";
import { useBulkInvoiceDownload } from "@/hooks/useBulkInvoiceDownload";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Progress } from "@/components/ui/progress";
import { useToast } from "@/hooks/use-toast";
import { 
  IndianRupee, 
  TrendingUp, 
  TrendingDown,
  Receipt, 
  FileText, 
  RefreshCw,
  Download,
  Calendar,
  CreditCard,
  Wallet,
  PiggyBank,
  BarChart3,
  Shield,
  Loader2,
  FileDown,
  Users,
  Package,
  ArrowUpRight,
  ArrowDownRight,
  Percent,
  ShoppingCart,
  Banknote,
  CircleDollarSign,
  Target,
  AlertTriangle
} from "lucide-react";
import { format, startOfMonth, endOfMonth, subMonths, startOfYear, endOfYear, differenceInDays } from "date-fns";
import { SalesChart } from "@/components/admin/analytics/SalesChart";
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart";
import { PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, CartesianGrid, ResponsiveContainer, Tooltip, Legend } from "recharts";

interface AccountingStats {
  totalRevenue: number;
  totalProfit: number;
  totalCgst: number;
  totalSgst: number;
  totalIgst: number;
  totalTax: number;
  paidOrders: number;
  pendingPayments: number;
  pendingAmount: number;
  codSettled: number;
  codCollectedByCourier: number;
  codAwaitingSettlement: number;
  codPending: number;
  // New stats
  avgOrderValue: number;
  profitMargin: number;
  onlineRevenue: number;
  codRevenue: number;
  totalOrders: number;
  cancelledOrders: number;
  cancelledAmount: number;
  totalProductsSold: number;
  platformFeeCollected: number;
}

interface InvoiceSummary {
  proformaCount: number;
  finalCount: number;
  proformaAmount: number;
  finalAmount: number;
}

interface TopCustomer {
  userId: string;
  email: string;
  name: string;
  totalOrders: number;
  totalSpent: number;
  avgOrderValue: number;
}

interface TopProduct {
  productId: string;
  name: string;
  unitsSold: number;
  revenue: number;
  profit: number;
}

interface GSTSlabData {
  slab: string;
  taxableValue: number;
  cgst: number;
  sgst: number;
  igst: number;
  total: number;
}

export default function Accounting() {
  const { isSuperAdmin, hasPermission, hasAnyPermission } = usePermissions();
  const { toast } = useToast();
  const { downloadInvoiceReport, downloadBulkInvoices, isDownloading: isBulkDownloading, progress } = useBulkInvoiceDownload();
  
  const [stats, setStats] = useState<AccountingStats>({
    totalRevenue: 0,
    totalProfit: 0,
    totalCgst: 0,
    totalSgst: 0,
    totalIgst: 0,
    totalTax: 0,
    paidOrders: 0,
    pendingPayments: 0,
    pendingAmount: 0,
    codSettled: 0,
    codCollectedByCourier: 0,
    codAwaitingSettlement: 0,
    codPending: 0,
    avgOrderValue: 0,
    profitMargin: 0,
    onlineRevenue: 0,
    codRevenue: 0,
    totalOrders: 0,
    cancelledOrders: 0,
    cancelledAmount: 0,
    totalProductsSold: 0,
    platformFeeCollected: 0,
  });
  const [invoiceSummary, setInvoiceSummary] = useState<InvoiceSummary>({
    proformaCount: 0,
    finalCount: 0,
    proformaAmount: 0,
    finalAmount: 0,
  });
  const [salesData, setSalesData] = useState<{ date: string; revenue: number; orders: number }[]>([]);
  const [recentInvoices, setRecentInvoices] = useState<any[]>([]);
  const [topCustomers, setTopCustomers] = useState<TopCustomer[]>([]);
  const [topProducts, setTopProducts] = useState<TopProduct[]>([]);
  const [gstSlabData, setGstSlabData] = useState<GSTSlabData[]>([]);
  const [paymentMethodData, setPaymentMethodData] = useState<{ name: string; value: number; color: string }[]>([]);
  const [orderStatusData, setOrderStatusData] = useState<{ status: string; count: number; amount: number }[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [dateRange, setDateRange] = useState("this_month");

  const canView = isSuperAdmin || hasAnyPermission(["view_accounting", "view_gst_reports", "view_revenue"]);
  const canDownload = isSuperAdmin || hasPermission("download_financials");

  const getDateRange = () => {
    const now = new Date();
    switch (dateRange) {
      case "this_month":
        return { start: startOfMonth(now), end: endOfMonth(now) };
      case "last_month":
        return { start: startOfMonth(subMonths(now, 1)), end: endOfMonth(subMonths(now, 1)) };
      case "last_3_months":
        return { start: startOfMonth(subMonths(now, 2)), end: endOfMonth(now) };
      case "this_year":
        return { start: startOfYear(now), end: endOfYear(now) };
      default:
        return { start: startOfMonth(now), end: endOfMonth(now) };
    }
  };

  const fetchAccountingData = async () => {
    setIsLoading(true);
    const { start, end } = getDateRange();

    try {
      // Fetch orders with payment status
      const { data: orders, error: ordersError } = await supabase
        .from("orders")
        .select("*, order_items(product_id, quantity, total_price, product_name)")
        .gte("created_at", start.toISOString())
        .lte("created_at", end.toISOString());

      if (ordersError) throw ordersError;

      // Fetch products for cost price calculation
      const { data: products } = await supabase
        .from("products")
        .select("id, cost_price, name, gst_percentage");
      
      const productCostMap: Record<string, number> = {};
      const productNameMap: Record<string, string> = {};
      const productGstMap: Record<string, number> = {};
      (products || []).forEach((p) => {
        productCostMap[p.id] = Number(p.cost_price || 0);
        productNameMap[p.id] = p.name;
        productGstMap[p.id] = Number(p.gst_percentage || 18);
      });

      // Fetch profiles for customer names
      const { data: profiles } = await supabase
        .from("profiles")
        .select("id, email, full_name");
      
      const profileMap: Record<string, { email: string; name: string }> = {};
      (profiles || []).forEach((p) => {
        profileMap[p.id] = { email: p.email || "", name: p.full_name || p.email || "Unknown" };
      });

      // Calculate stats from orders
      const paidOrders = orders?.filter((o) => o.payment_status === "paid") || [];
      const pendingOrders = orders?.filter((o) => o.payment_status !== "paid" && o.status !== "cancelled") || [];
      const cancelledOrders = orders?.filter((o) => o.status === "cancelled") || [];

      // COD specific calculations
      const isOnlinePaid = (o: any) => o.payment_id?.startsWith("pay_");
      const codOrders = orders?.filter((o) => 
        !isOnlinePaid(o) && (
          o.payment_id?.startsWith("COD") || 
          o.order_type === "cod" || 
          o.cod_payment_status != null
        )
      ) || [];
      
      const codSettledOrders = codOrders.filter((o) => 
        o.cod_payment_status === "settled" || o.cod_payment_status === "received"
      );
      const codCollectedByCourierOrders = codOrders.filter((o) => o.cod_payment_status === "collected_by_courier");
      const codAwaitingSettlementOrders = codOrders.filter((o) => o.cod_payment_status === "awaiting_settlement");
      const codPendingOrders = codOrders.filter((o) => 
        o.cod_payment_status === "pending" && o.status !== "cancelled"
      );

      const codSettled = codSettledOrders.reduce((sum, o) => sum + (o.total_amount || 0), 0);
      const codCollectedByCourier = codCollectedByCourierOrders.reduce((sum, o) => sum + (o.total_amount || 0), 0);
      const codAwaitingSettlement = codAwaitingSettlementOrders.reduce((sum, o) => sum + (o.total_amount || 0), 0);
      const codPending = codPendingOrders.reduce((sum, o) => sum + (o.total_amount || 0), 0);

      const isCodOrder = (o: any) => 
        o.payment_id?.startsWith("COD") || 
        o.order_type === "cod" || 
        o.cod_payment_status != null;

      const onlinePaidOrders = paidOrders.filter((o) => !isCodOrder(o));
      const onlineRevenue = onlinePaidOrders.reduce((sum, o) => sum + (o.total_amount || 0), 0);
      const totalRevenue = onlineRevenue + codSettled;
      
      const pendingAmount = pendingOrders
        .filter((o) => !isCodOrder(o))
        .reduce((sum, o) => sum + (o.total_amount || 0), 0);

      // Fetch final invoices for GST calculations
      const { data: finalInvoices, error: invoicesError } = await supabase
        .from("invoices")
        .select("*")
        .eq("is_final", true)
        .gte("created_at", start.toISOString())
        .lte("created_at", end.toISOString());

      if (invoicesError) throw invoicesError;

      const totalCgst = finalInvoices?.reduce((sum, inv) => sum + (inv.cgst_amount || 0), 0) || 0;
      const totalSgst = finalInvoices?.reduce((sum, inv) => sum + (inv.sgst_amount || 0), 0) || 0;
      const totalIgst = finalInvoices?.reduce((sum, inv) => sum + (inv.igst_amount || 0), 0) || 0;

      // Platform fee collected
      const platformFeeCollected = finalInvoices?.reduce((sum, inv) => sum + (inv.platform_fee || 0), 0) || 0;

      // All invoices for summary
      const { data: allInvoices } = await supabase
        .from("invoices")
        .select("*")
        .gte("created_at", start.toISOString())
        .lte("created_at", end.toISOString());

      const proformaInvoices = allInvoices?.filter((i) => !i.is_final) || [];
      const finalInvs = allInvoices?.filter((i) => i.is_final) || [];

      setInvoiceSummary({
        proformaCount: proformaInvoices.length,
        finalCount: finalInvs.length,
        proformaAmount: proformaInvoices.reduce((sum, i) => sum + i.total_amount, 0),
        finalAmount: finalInvs.reduce((sum, i) => sum + i.total_amount, 0),
      });

      // Calculate profit
      const paidSettledOrders = [...onlinePaidOrders, ...codSettledOrders];
      const paidOrderSubtotals = paidSettledOrders.reduce((sum, o) => sum + (o.subtotal || 0), 0);
      
      let totalCost = 0;
      let totalProductsSold = 0;
      const productSalesMap: Record<string, { units: number; revenue: number; cost: number }> = {};

      paidSettledOrders.forEach((order) => {
        const items = order.order_items || [];
        items.forEach((item: any) => {
          totalProductsSold += item.quantity;
          if (item.product_id) {
            const cost = productCostMap[item.product_id] || 0;
            totalCost += cost * item.quantity;
            
            if (!productSalesMap[item.product_id]) {
              productSalesMap[item.product_id] = { units: 0, revenue: 0, cost: 0 };
            }
            productSalesMap[item.product_id].units += item.quantity;
            productSalesMap[item.product_id].revenue += item.total_price || 0;
            productSalesMap[item.product_id].cost += cost * item.quantity;
          }
        });
      });
      
      const estimatedProfit = paidOrderSubtotals - totalCost;
      const profitMargin = paidOrderSubtotals > 0 ? (estimatedProfit / paidOrderSubtotals) * 100 : 0;
      const avgOrderValue = paidSettledOrders.length > 0 ? totalRevenue / paidSettledOrders.length : 0;

      // Top products by revenue
      const topProductsList: TopProduct[] = Object.entries(productSalesMap)
        .map(([id, data]) => ({
          productId: id,
          name: productNameMap[id] || "Unknown Product",
          unitsSold: data.units,
          revenue: data.revenue,
          profit: data.revenue - data.cost,
        }))
        .sort((a, b) => b.revenue - a.revenue)
        .slice(0, 10);
      setTopProducts(topProductsList);

      // Top customers
      const customerMap: Record<string, { orders: number; spent: number }> = {};
      paidSettledOrders.forEach((order) => {
        if (!customerMap[order.user_id]) {
          customerMap[order.user_id] = { orders: 0, spent: 0 };
        }
        customerMap[order.user_id].orders += 1;
        customerMap[order.user_id].spent += order.total_amount || 0;
      });

      const topCustomersList: TopCustomer[] = Object.entries(customerMap)
        .map(([userId, data]) => ({
          userId,
          email: profileMap[userId]?.email || "N/A",
          name: profileMap[userId]?.name || "Unknown",
          totalOrders: data.orders,
          totalSpent: data.spent,
          avgOrderValue: data.spent / data.orders,
        }))
        .sort((a, b) => b.totalSpent - a.totalSpent)
        .slice(0, 10);
      setTopCustomers(topCustomersList);

      // Payment method breakdown
      const onlineCount = onlinePaidOrders.length;
      const codCount = codOrders.filter(o => o.status !== "cancelled").length;
      setPaymentMethodData([
        { name: "Online (Razorpay)", value: onlineRevenue, color: "hsl(var(--primary))" },
        { name: "COD Settled", value: codSettled, color: "hsl(142, 76%, 36%)" },
        { name: "COD Pending", value: codPending + codCollectedByCourier + codAwaitingSettlement, color: "hsl(38, 92%, 50%)" },
      ].filter(d => d.value > 0));

      // Order status breakdown
      const statusMap: Record<string, { count: number; amount: number }> = {};
      (orders || []).forEach((o) => {
        const s = o.status;
        if (!statusMap[s]) statusMap[s] = { count: 0, amount: 0 };
        statusMap[s].count += 1;
        statusMap[s].amount += o.total_amount || 0;
      });
      setOrderStatusData(
        Object.entries(statusMap).map(([status, data]) => ({
          status: status.charAt(0).toUpperCase() + status.slice(1).replace(/_/g, " "),
          count: data.count,
          amount: data.amount,
        }))
      );

      // GST slab-wise breakdown from final invoices
      const gstSlabs: Record<string, GSTSlabData> = {};
      (finalInvoices || []).forEach((inv) => {
        const breakdown = inv.gst_breakdown as any[] || [];
        breakdown.forEach((item: any) => {
          const rate = item.gst_rate || item.gstRate || 18;
          const slabKey = `${rate}%`;
          if (!gstSlabs[slabKey]) {
            gstSlabs[slabKey] = { slab: slabKey, taxableValue: 0, cgst: 0, sgst: 0, igst: 0, total: 0 };
          }
          const taxable = Number(item.taxable_value || item.taxableValue || 0);
          gstSlabs[slabKey].taxableValue += taxable;
          if (inv.is_igst) {
            gstSlabs[slabKey].igst += taxable * (rate / 100);
          } else {
            gstSlabs[slabKey].cgst += taxable * (rate / 200);
            gstSlabs[slabKey].sgst += taxable * (rate / 200);
          }
          gstSlabs[slabKey].total += taxable * (rate / 100);
        });
      });
      setGstSlabData(Object.values(gstSlabs).sort((a, b) => parseFloat(a.slab) - parseFloat(b.slab)));

      setStats({
        totalRevenue,
        totalProfit: estimatedProfit,
        totalCgst,
        totalSgst,
        totalIgst,
        totalTax: totalCgst + totalSgst + totalIgst,
        paidOrders: paidOrders.length,
        pendingPayments: pendingOrders.filter((o) => !isCodOrder(o)).length,
        pendingAmount,
        codSettled,
        codCollectedByCourier,
        codAwaitingSettlement,
        codPending,
        avgOrderValue,
        profitMargin,
        onlineRevenue,
        codRevenue: codSettled,
        totalOrders: orders?.length || 0,
        cancelledOrders: cancelledOrders.length,
        cancelledAmount: cancelledOrders.reduce((sum, o) => sum + (o.total_amount || 0), 0),
        totalProductsSold,
        platformFeeCollected,
      });

      // Sales data for chart
      const salesByDate: Record<string, { revenue: number; orders: number }> = {};
      onlinePaidOrders.forEach((order) => {
        const date = format(new Date(order.created_at), "MMM dd");
        if (!salesByDate[date]) salesByDate[date] = { revenue: 0, orders: 0 };
        salesByDate[date].revenue += order.total_amount || 0;
        salesByDate[date].orders += 1;
      });
      codSettledOrders.forEach((order) => {
        const date = format(new Date(order.created_at), "MMM dd");
        if (!salesByDate[date]) salesByDate[date] = { revenue: 0, orders: 0 };
        salesByDate[date].revenue += order.total_amount || 0;
        salesByDate[date].orders += 1;
      });
      setSalesData(
        Object.entries(salesByDate).map(([date, data]) => ({ date, revenue: data.revenue, orders: data.orders }))
      );

      // Recent invoices
      const { data: recent } = await supabase
        .from("invoices")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(15);
      setRecentInvoices(recent || []);
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to fetch accounting data",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (canView) {
      fetchAccountingData();
    }
  }, [canView, dateRange]);

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: "INR",
      maximumFractionDigits: 0,
    }).format(amount);
  };

  const collectionEfficiency = useMemo(() => {
    const totalExpected = stats.onlineRevenue + stats.codSettled + stats.codCollectedByCourier + stats.codAwaitingSettlement + stats.codPending + stats.pendingAmount;
    if (totalExpected === 0) return 0;
    return ((stats.totalRevenue) / totalExpected) * 100;
  }, [stats]);

  if (!canView) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Card className="max-w-md">
          <CardContent className="pt-6 text-center">
            <Shield className="h-12 w-12 mx-auto text-destructive mb-4" />
            <h2 className="text-xl font-semibold mb-2">Access Denied</h2>
            <p className="text-muted-foreground">
              You don't have permission to view accounting data.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-foreground flex items-center gap-3">
            <BarChart3 className="h-8 w-8 text-primary" />
            Accounting Dashboard
          </h1>
          <p className="text-muted-foreground mt-1">
            Complete financial overview, GST reports & business insights
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Select value={dateRange} onValueChange={setDateRange}>
            <SelectTrigger className="w-[180px]">
              <Calendar className="h-4 w-4 mr-2" />
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="this_month">This Month</SelectItem>
              <SelectItem value="last_month">Last Month</SelectItem>
              <SelectItem value="last_3_months">Last 3 Months</SelectItem>
              <SelectItem value="this_year">This Year</SelectItem>
            </SelectContent>
          </Select>
          <Button variant="outline" onClick={fetchAccountingData} disabled={isLoading}>
            <RefreshCw className={`h-4 w-4 mr-2 ${isLoading ? "animate-spin" : ""}`} />
            Refresh
          </Button>
          {canDownload && (
            <Button 
              variant="outline"
              onClick={() => {
                const { start, end } = getDateRange();
                const dateRangeLabel = dateRange === "this_month" ? "This Month" 
                  : dateRange === "last_month" ? "Last Month"
                  : dateRange === "last_3_months" ? "Last 3 Months"
                  : dateRange === "this_year" ? "This Year"
                  : format(start, "dd MMM yyyy") + " - " + format(end, "dd MMM yyyy");
                downloadInvoiceReport({
                  dateFrom: format(start, "yyyy-MM-dd"),
                  dateTo: format(end, "yyyy-MM-dd"),
                  dateRange: dateRangeLabel,
                });
              }}
              disabled={isBulkDownloading || invoiceSummary.finalCount === 0}
            >
              {isBulkDownloading ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Generating...
                </>
              ) : (
                <>
                  <FileDown className="h-4 w-4 mr-2" />
                  Export Report
                </>
              )}
            </Button>
          )}
        </div>
      </div>

      {/* Key Metrics - Row 1 */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="bg-gradient-to-br from-green-500/10 to-green-500/5 border-green-500/20">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Total Revenue</CardTitle>
            <IndianRupee className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{formatCurrency(stats.totalRevenue)}</div>
            <p className="text-xs text-muted-foreground mt-1">{stats.paidOrders} paid orders</p>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-blue-500/10 to-blue-500/5 border-blue-500/20">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Net Profit</CardTitle>
            <Wallet className="h-4 w-4 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">{formatCurrency(stats.totalProfit)}</div>
            <div className="flex items-center gap-1 mt-1">
              <Badge variant={stats.profitMargin >= 20 ? "default" : "secondary"} className="text-xs">
                <Percent className="h-3 w-3 mr-0.5" />
                {stats.profitMargin.toFixed(1)}% margin
              </Badge>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-orange-500/10 to-orange-500/5 border-orange-500/20">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Pending Payments</CardTitle>
            <CreditCard className="h-4 w-4 text-orange-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-orange-600">{formatCurrency(stats.pendingAmount)}</div>
            <p className="text-xs text-muted-foreground mt-1">{stats.pendingPayments} orders</p>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-purple-500/10 to-purple-500/5 border-purple-500/20">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Total GST Collected</CardTitle>
            <Receipt className="h-4 w-4 text-purple-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-purple-600">{formatCurrency(stats.totalTax)}</div>
            <p className="text-xs text-muted-foreground mt-1">From final invoices</p>
          </CardContent>
        </Card>
      </div>

      {/* Key Metrics - Row 2 (New) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-xs font-medium text-muted-foreground">Avg Order Value</CardTitle>
            <ShoppingCart className="h-4 w-4 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-xl font-bold">{formatCurrency(stats.avgOrderValue)}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-xs font-medium text-muted-foreground">Total Orders</CardTitle>
            <Package className="h-4 w-4 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-xl font-bold">{stats.totalOrders}</div>
            <p className="text-xs text-muted-foreground">{stats.totalProductsSold} units sold</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-xs font-medium text-muted-foreground">Platform Fee</CardTitle>
            <CircleDollarSign className="h-4 w-4 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-xl font-bold">{formatCurrency(stats.platformFeeCollected)}</div>
            <p className="text-xs text-muted-foreground">@ 2% of subtotal</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-xs font-medium text-muted-foreground">Collection Rate</CardTitle>
            <Target className="h-4 w-4 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-xl font-bold">{collectionEfficiency.toFixed(0)}%</div>
            <Progress value={collectionEfficiency} className="h-1.5 mt-2" />
          </CardContent>
        </Card>
        <Card className={stats.cancelledOrders > 0 ? "border-destructive/30" : ""}>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-xs font-medium text-muted-foreground">Cancelled</CardTitle>
            <AlertTriangle className={`h-4 w-4 ${stats.cancelledOrders > 0 ? "text-destructive" : "text-muted-foreground"}`} />
          </CardHeader>
          <CardContent>
            <div className="text-xl font-bold">{stats.cancelledOrders}</div>
            <p className="text-xs text-muted-foreground">{formatCurrency(stats.cancelledAmount)} lost</p>
          </CardContent>
        </Card>
      </div>

      {/* COD Payment Tracking */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="bg-gradient-to-br from-green-500/10 to-green-500/5 border-green-500/20">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">COD Settled</CardTitle>
            <Wallet className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{formatCurrency(stats.codSettled)}</div>
            <p className="text-xs text-muted-foreground mt-1">Money received in account</p>
          </CardContent>
        </Card>
        <Card className="bg-gradient-to-br from-blue-500/10 to-blue-500/5 border-blue-500/20">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">With Courier</CardTitle>
            <Wallet className="h-4 w-4 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">{formatCurrency(stats.codCollectedByCourier)}</div>
            <p className="text-xs text-muted-foreground mt-1">Collected by delivery partner</p>
          </CardContent>
        </Card>
        <Card className="bg-gradient-to-br from-purple-500/10 to-purple-500/5 border-purple-500/20">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Awaiting Settlement</CardTitle>
            <PiggyBank className="h-4 w-4 text-purple-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-purple-600">{formatCurrency(stats.codAwaitingSettlement)}</div>
            <p className="text-xs text-muted-foreground mt-1">In transit from courier</p>
          </CardContent>
        </Card>
        <Card className="bg-gradient-to-br from-orange-500/10 to-orange-500/5 border-orange-500/20">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">COD Pending</CardTitle>
            <CreditCard className="h-4 w-4 text-orange-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-orange-600">{formatCurrency(stats.codPending)}</div>
            <p className="text-xs text-muted-foreground mt-1">Awaiting delivery/collection</p>
          </CardContent>
        </Card>
      </div>

      {/* GST Breakdown */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">CGST Collected</CardTitle>
            <Receipt className="h-4 w-4 text-orange-500" />
          </CardHeader>
          <CardContent>
            <div className="text-xl font-bold text-orange-500">{formatCurrency(stats.totalCgst)}</div>
            <p className="text-xs text-muted-foreground">Central GST @ 9%</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">SGST Collected</CardTitle>
            <Receipt className="h-4 w-4 text-purple-500" />
          </CardHeader>
          <CardContent>
            <div className="text-xl font-bold text-purple-500">{formatCurrency(stats.totalSgst)}</div>
            <p className="text-xs text-muted-foreground">State GST @ 9%</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">IGST Collected</CardTitle>
            <Receipt className="h-4 w-4 text-teal-500" />
          </CardHeader>
          <CardContent>
            <div className="text-xl font-bold text-teal-500">{formatCurrency(stats.totalIgst)}</div>
            <p className="text-xs text-muted-foreground">Integrated GST @ 18%</p>
          </CardContent>
        </Card>
      </div>

      {/* Tabbed Content */}
      <Tabs defaultValue="overview" className="space-y-4">
        <TabsList className="flex flex-wrap h-auto gap-1">
          <TabsTrigger value="overview">Revenue Overview</TabsTrigger>
          <TabsTrigger value="payments">Payment Breakdown</TabsTrigger>
          <TabsTrigger value="gst">GST Filing</TabsTrigger>
          <TabsTrigger value="customers">Top Customers</TabsTrigger>
          <TabsTrigger value="products">Top Products</TabsTrigger>
          <TabsTrigger value="invoices">Invoices</TabsTrigger>
        </TabsList>

        {/* Revenue Overview Tab */}
        <TabsContent value="overview" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2">
              <SalesChart data={salesData} isLoading={isLoading} />
            </div>
            <Card>
              <CardHeader>
                <CardTitle>Invoice Summary</CardTitle>
                <CardDescription>Proforma vs Final Invoices</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between p-4 rounded-lg bg-muted/50">
                  <div>
                    <p className="text-sm text-muted-foreground">Proforma Invoices</p>
                    <p className="text-2xl font-bold">{invoiceSummary.proformaCount}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm text-muted-foreground">Value</p>
                    <p className="text-lg font-semibold">{formatCurrency(invoiceSummary.proformaAmount)}</p>
                  </div>
                </div>
                <div className="flex items-center justify-between p-4 rounded-lg bg-green-500/10">
                  <div>
                    <p className="text-sm text-muted-foreground">Final Invoices</p>
                    <p className="text-2xl font-bold text-green-600">{invoiceSummary.finalCount}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm text-muted-foreground">Value</p>
                    <p className="text-lg font-semibold text-green-600">{formatCurrency(invoiceSummary.finalAmount)}</p>
                  </div>
                </div>
                <div className="border-t pt-4 space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Online Revenue</span>
                    <span className="font-medium">{formatCurrency(stats.onlineRevenue)}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">COD Revenue</span>
                    <span className="font-medium">{formatCurrency(stats.codRevenue)}</span>
                  </div>
                  <div className="flex justify-between text-sm font-semibold border-t pt-2">
                    <span>Total Confirmed</span>
                    <span className="text-green-600">{formatCurrency(stats.totalRevenue)}</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Order Status Breakdown */}
          {orderStatusData.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle>Order Status Breakdown</CardTitle>
                <CardDescription>Distribution of orders by current status</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
                  {orderStatusData.map((item) => (
                    <div key={item.status} className="p-3 rounded-lg bg-muted/50 text-center">
                      <p className="text-xs text-muted-foreground mb-1">{item.status}</p>
                      <p className="text-lg font-bold">{item.count}</p>
                      <p className="text-xs text-muted-foreground">{formatCurrency(item.amount)}</p>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        {/* Payment Breakdown Tab */}
        <TabsContent value="payments" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Payment Method Split</CardTitle>
                <CardDescription>Revenue by payment channel</CardDescription>
              </CardHeader>
              <CardContent>
                {paymentMethodData.length > 0 ? (
                  <div className="space-y-6">
                    <div className="h-[250px]">
                      <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                          <Pie
                            data={paymentMethodData}
                            cx="50%"
                            cy="50%"
                            innerRadius={60}
                            outerRadius={100}
                            paddingAngle={3}
                            dataKey="value"
                          >
                            {paymentMethodData.map((entry, index) => (
                              <Cell key={`cell-${index}`} fill={entry.color} />
                            ))}
                          </Pie>
                          <Tooltip formatter={(value: number) => formatCurrency(value)} />
                        </PieChart>
                      </ResponsiveContainer>
                    </div>
                    <div className="space-y-2">
                      {paymentMethodData.map((item) => (
                        <div key={item.name} className="flex items-center justify-between p-2 rounded bg-muted/30">
                          <div className="flex items-center gap-2">
                            <div className="w-3 h-3 rounded-full" style={{ backgroundColor: item.color }} />
                            <span className="text-sm">{item.name}</span>
                          </div>
                          <span className="text-sm font-semibold">{formatCurrency(item.value)}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                ) : (
                  <p className="text-muted-foreground text-center py-8">No payment data available</p>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Payment Collection Summary</CardTitle>
                <CardDescription>Complete payment pipeline</CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="p-3 rounded-lg bg-green-500/10 flex justify-between items-center">
                  <div>
                    <p className="text-sm font-medium">✅ Online Paid</p>
                    <p className="text-xs text-muted-foreground">Razorpay confirmed</p>
                  </div>
                  <span className="text-lg font-bold text-green-600">{formatCurrency(stats.onlineRevenue)}</span>
                </div>
                <div className="p-3 rounded-lg bg-green-500/10 flex justify-between items-center">
                  <div>
                    <p className="text-sm font-medium">✅ COD Settled</p>
                    <p className="text-xs text-muted-foreground">Received in bank</p>
                  </div>
                  <span className="text-lg font-bold text-green-600">{formatCurrency(stats.codSettled)}</span>
                </div>
                <div className="p-3 rounded-lg bg-blue-500/10 flex justify-between items-center">
                  <div>
                    <p className="text-sm font-medium">🚚 With Courier</p>
                    <p className="text-xs text-muted-foreground">Cash collected, not remitted</p>
                  </div>
                  <span className="text-lg font-bold text-blue-600">{formatCurrency(stats.codCollectedByCourier)}</span>
                </div>
                <div className="p-3 rounded-lg bg-purple-500/10 flex justify-between items-center">
                  <div>
                    <p className="text-sm font-medium">⏳ Awaiting Settlement</p>
                    <p className="text-xs text-muted-foreground">In transit from courier</p>
                  </div>
                  <span className="text-lg font-bold text-purple-600">{formatCurrency(stats.codAwaitingSettlement)}</span>
                </div>
                <div className="p-3 rounded-lg bg-orange-500/10 flex justify-between items-center">
                  <div>
                    <p className="text-sm font-medium">⌛ COD Pending</p>
                    <p className="text-xs text-muted-foreground">Awaiting delivery</p>
                  </div>
                  <span className="text-lg font-bold text-orange-600">{formatCurrency(stats.codPending)}</span>
                </div>
                <div className="p-3 rounded-lg bg-muted flex justify-between items-center">
                  <div>
                    <p className="text-sm font-medium">💳 Online Pending</p>
                    <p className="text-xs text-muted-foreground">Payment not completed</p>
                  </div>
                  <span className="text-lg font-bold">{formatCurrency(stats.pendingAmount)}</span>
                </div>
                <div className="border-t pt-3 flex justify-between items-center">
                  <span className="font-semibold">Collection Efficiency</span>
                  <Badge variant={collectionEfficiency >= 80 ? "default" : "secondary"}>
                    {collectionEfficiency.toFixed(1)}%
                  </Badge>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* GST Filing Tab */}
        <TabsContent value="gst" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>GST Slab-wise Breakdown</CardTitle>
                <CardDescription>Tax collected by GST rate from final invoices</CardDescription>
              </CardHeader>
              <CardContent>
                {gstSlabData.length > 0 ? (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>GST Slab</TableHead>
                        <TableHead className="text-right">Taxable Value</TableHead>
                        <TableHead className="text-right">CGST</TableHead>
                        <TableHead className="text-right">SGST</TableHead>
                        <TableHead className="text-right">IGST</TableHead>
                        <TableHead className="text-right">Total Tax</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {gstSlabData.map((slab) => (
                        <TableRow key={slab.slab}>
                          <TableCell className="font-medium">{slab.slab}</TableCell>
                          <TableCell className="text-right">{formatCurrency(slab.taxableValue)}</TableCell>
                          <TableCell className="text-right">{formatCurrency(slab.cgst)}</TableCell>
                          <TableCell className="text-right">{formatCurrency(slab.sgst)}</TableCell>
                          <TableCell className="text-right">{formatCurrency(slab.igst)}</TableCell>
                          <TableCell className="text-right font-semibold">{formatCurrency(slab.total)}</TableCell>
                        </TableRow>
                      ))}
                      <TableRow className="border-t-2 font-bold">
                        <TableCell>Total</TableCell>
                        <TableCell className="text-right">{formatCurrency(gstSlabData.reduce((s, d) => s + d.taxableValue, 0))}</TableCell>
                        <TableCell className="text-right">{formatCurrency(stats.totalCgst)}</TableCell>
                        <TableCell className="text-right">{formatCurrency(stats.totalSgst)}</TableCell>
                        <TableCell className="text-right">{formatCurrency(stats.totalIgst)}</TableCell>
                        <TableCell className="text-right">{formatCurrency(stats.totalTax)}</TableCell>
                      </TableRow>
                    </TableBody>
                  </Table>
                ) : (
                  <p className="text-muted-foreground text-center py-8">No GST data available for this period</p>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>GST Summary for Filing</CardTitle>
                <CardDescription>Ready-to-use numbers for GSTR-1 / GSTR-3B</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="p-4 rounded-lg bg-muted/50 space-y-3">
                  <h4 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">Outward Supplies (Sales)</h4>
                  <div className="flex justify-between">
                    <span className="text-sm">Total Taxable Value</span>
                    <span className="font-semibold">{formatCurrency(gstSlabData.reduce((s, d) => s + d.taxableValue, 0))}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm">Total Tax Liability</span>
                    <span className="font-semibold">{formatCurrency(stats.totalTax)}</span>
                  </div>
                </div>
                <div className="p-4 rounded-lg bg-orange-500/10 space-y-3">
                  <h4 className="text-sm font-semibold text-orange-700 uppercase tracking-wider">CGST Payable</h4>
                  <div className="flex justify-between">
                    <span className="text-sm">Output CGST</span>
                    <span className="font-semibold text-orange-600">{formatCurrency(stats.totalCgst)}</span>
                  </div>
                </div>
                <div className="p-4 rounded-lg bg-purple-500/10 space-y-3">
                  <h4 className="text-sm font-semibold text-purple-700 uppercase tracking-wider">SGST Payable</h4>
                  <div className="flex justify-between">
                    <span className="text-sm">Output SGST</span>
                    <span className="font-semibold text-purple-600">{formatCurrency(stats.totalSgst)}</span>
                  </div>
                </div>
                <div className="p-4 rounded-lg bg-teal-500/10 space-y-3">
                  <h4 className="text-sm font-semibold text-teal-700 uppercase tracking-wider">IGST Payable</h4>
                  <div className="flex justify-between">
                    <span className="text-sm">Output IGST</span>
                    <span className="font-semibold text-teal-600">{formatCurrency(stats.totalIgst)}</span>
                  </div>
                </div>
                <div className="border-t pt-3">
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Final Invoices Issued</span>
                    <span className="font-medium">{invoiceSummary.finalCount}</span>
                  </div>
                  <div className="flex justify-between text-sm mt-1">
                    <span className="text-muted-foreground">Platform Fee Collected</span>
                    <span className="font-medium">{formatCurrency(stats.platformFeeCollected)}</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Top Customers Tab */}
        <TabsContent value="customers">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Users className="h-5 w-5" />
                Top Customers by Revenue
              </CardTitle>
              <CardDescription>Highest-value customers in the selected period</CardDescription>
            </CardHeader>
            <CardContent>
              {topCustomers.length > 0 ? (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>#</TableHead>
                      <TableHead>Customer</TableHead>
                      <TableHead>Email</TableHead>
                      <TableHead className="text-right">Orders</TableHead>
                      <TableHead className="text-right">Total Spent</TableHead>
                      <TableHead className="text-right">Avg Order</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {topCustomers.map((customer, index) => (
                      <TableRow key={customer.userId}>
                        <TableCell>
                          <Badge variant={index < 3 ? "default" : "secondary"} className="w-7 h-7 rounded-full flex items-center justify-center text-xs">
                            {index + 1}
                          </Badge>
                        </TableCell>
                        <TableCell className="font-medium">{customer.name}</TableCell>
                        <TableCell className="text-muted-foreground text-sm">{customer.email}</TableCell>
                        <TableCell className="text-right">{customer.totalOrders}</TableCell>
                        <TableCell className="text-right font-semibold">{formatCurrency(customer.totalSpent)}</TableCell>
                        <TableCell className="text-right text-muted-foreground">{formatCurrency(customer.avgOrderValue)}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              ) : (
                <p className="text-muted-foreground text-center py-8">No customer data available</p>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Top Products Tab */}
        <TabsContent value="products">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Package className="h-5 w-5" />
                Top Products by Revenue
              </CardTitle>
              <CardDescription>Best-performing products from paid/settled orders</CardDescription>
            </CardHeader>
            <CardContent>
              {topProducts.length > 0 ? (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>#</TableHead>
                      <TableHead>Product</TableHead>
                      <TableHead className="text-right">Units Sold</TableHead>
                      <TableHead className="text-right">Revenue</TableHead>
                      <TableHead className="text-right">Profit</TableHead>
                      <TableHead className="text-right">Margin</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {topProducts.map((product, index) => {
                      const margin = product.revenue > 0 ? (product.profit / product.revenue) * 100 : 0;
                      return (
                        <TableRow key={product.productId}>
                          <TableCell>
                            <Badge variant={index < 3 ? "default" : "secondary"} className="w-7 h-7 rounded-full flex items-center justify-center text-xs">
                              {index + 1}
                            </Badge>
                          </TableCell>
                          <TableCell className="font-medium max-w-[200px] truncate">{product.name}</TableCell>
                          <TableCell className="text-right">{product.unitsSold}</TableCell>
                          <TableCell className="text-right font-semibold">{formatCurrency(product.revenue)}</TableCell>
                          <TableCell className="text-right">
                            <span className={product.profit >= 0 ? "text-green-600" : "text-destructive"}>
                              {formatCurrency(product.profit)}
                            </span>
                          </TableCell>
                          <TableCell className="text-right">
                            <Badge variant={margin >= 30 ? "default" : margin >= 15 ? "secondary" : "destructive"} className="text-xs">
                              {margin.toFixed(1)}%
                            </Badge>
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              ) : (
                <p className="text-muted-foreground text-center py-8">No product data available</p>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Invoices Tab */}
        <TabsContent value="invoices">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle>Recent Invoices</CardTitle>
                <CardDescription>Last 15 invoices generated</CardDescription>
              </div>
              {canDownload && invoiceSummary.finalCount > 0 && (
                <Button
                  size="sm"
                  variant="outline"
                  onClick={async () => {
                    const { start, end } = getDateRange();
                    const { data: invoices } = await supabase
                      .from("invoices")
                      .select("id")
                      .eq("is_final", true)
                      .gte("created_at", start.toISOString())
                      .lte("created_at", end.toISOString());
                    if (invoices && invoices.length > 0) {
                      await downloadBulkInvoices(invoices.map(i => i.id));
                    }
                  }}
                  disabled={isBulkDownloading}
                  className="gap-2"
                >
                  {isBulkDownloading ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      {progress.current}/{progress.total}
                    </>
                  ) : (
                    <>
                      <FileDown className="w-4 h-4" />
                      Download All Final ({invoiceSummary.finalCount})
                    </>
                  )}
                </Button>
              )}
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Invoice #</TableHead>
                    <TableHead>Client</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead className="text-right">Subtotal</TableHead>
                    <TableHead className="text-right">Tax</TableHead>
                    <TableHead className="text-right">Total</TableHead>
                    <TableHead>Date</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {recentInvoices.map((invoice) => (
                    <TableRow key={invoice.id}>
                      <TableCell className="font-medium">{invoice.invoice_number}</TableCell>
                      <TableCell>{invoice.client_name}</TableCell>
                      <TableCell>
                        <Badge variant={invoice.is_final ? "default" : "secondary"}>
                          {invoice.is_final ? "Final" : "Proforma"}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">{formatCurrency(invoice.subtotal)}</TableCell>
                      <TableCell className="text-right">{formatCurrency(invoice.tax_amount)}</TableCell>
                      <TableCell className="text-right font-semibold">{formatCurrency(invoice.total_amount)}</TableCell>
                      <TableCell>{format(new Date(invoice.created_at), "dd MMM yyyy")}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
