import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { usePermissions } from "@/hooks/useEmployeePermissions";
import { useBulkInvoiceDownload } from "@/hooks/useBulkInvoiceDownload";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
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
  FileDown
} from "lucide-react";
import { format, startOfMonth, endOfMonth, subMonths, startOfYear, endOfYear } from "date-fns";
import { SalesChart } from "@/components/admin/analytics/SalesChart";

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
}

interface InvoiceSummary {
  proformaCount: number;
  finalCount: number;
  proformaAmount: number;
  finalAmount: number;
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
  });
  const [invoiceSummary, setInvoiceSummary] = useState<InvoiceSummary>({
    proformaCount: 0,
    finalCount: 0,
    proformaAmount: 0,
    finalAmount: 0,
  });
  const [salesData, setSalesData] = useState<{ date: string; revenue: number; orders: number }[]>([]);
  const [recentInvoices, setRecentInvoices] = useState<any[]>([]);
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
        .select("*, order_items(product_id, quantity, total_price)")
        .gte("created_at", start.toISOString())
        .lte("created_at", end.toISOString());

      if (ordersError) throw ordersError;

      // Fetch products for cost price calculation
      const { data: products } = await supabase
        .from("products")
        .select("id, cost_price");
      
      const productCostMap: Record<string, number> = {};
      (products || []).forEach((p) => {
        productCostMap[p.id] = Number(p.cost_price || 0);
      });

      // Calculate stats from orders
      const paidOrders = orders?.filter((o) => o.payment_status === "paid") || [];
      const pendingOrders = orders?.filter((o) => o.payment_status !== "paid") || [];

      // COD specific calculations with granular statuses
      // Match COD by payment_id prefix, order_type, or cod_payment_status presence
      // IMPORTANT: Exclude orders that have online payment (pay_ prefix from Razorpay)
      const isOnlinePaid = (o: any) => o.payment_id?.startsWith("pay_");
      const codOrders = orders?.filter((o) => 
        !isOnlinePaid(o) && (
          o.payment_id?.startsWith("COD") || 
          o.order_type === "cod" || 
          o.cod_payment_status != null
        )
      ) || [];
      
      // Settled = payment received to company account (includes old 'received' status for backward compatibility)
      const codSettledOrders = codOrders.filter((o) => 
        o.cod_payment_status === "settled" || o.cod_payment_status === "received"
      );
      // Collected by courier = courier has picked up money, awaiting transfer
      const codCollectedByCourierOrders = codOrders.filter((o) => o.cod_payment_status === "collected_by_courier");
      // Awaiting settlement = money in transit from courier
      const codAwaitingSettlementOrders = codOrders.filter((o) => o.cod_payment_status === "awaiting_settlement");
      // Pending = delivered but payment not yet collected, or still in transit
      const codPendingOrders = codOrders.filter((o) => 
        o.cod_payment_status === "pending" && 
        o.status !== "cancelled"
      );

      const codSettled = codSettledOrders.reduce((sum, o) => sum + (o.total_amount || 0), 0);
      const codCollectedByCourier = codCollectedByCourierOrders.reduce((sum, o) => sum + (o.total_amount || 0), 0);
      const codAwaitingSettlement = codAwaitingSettlementOrders.reduce((sum, o) => sum + (o.total_amount || 0), 0);
      const codPending = codPendingOrders.reduce((sum, o) => sum + (o.total_amount || 0), 0);

      // Helper to check if order is COD
      const isCodOrder = (o: any) => 
        o.payment_id?.startsWith("COD") || 
        o.order_type === "cod" || 
        o.cod_payment_status != null;

      // Online paid orders (exclude COD orders)
      const onlinePaidOrders = paidOrders.filter((o) => !isCodOrder(o));
      const onlineRevenue = onlinePaidOrders.reduce((sum, o) => sum + (o.total_amount || 0), 0);

      // Total confirmed revenue = online paid + COD settled
      const totalRevenue = onlineRevenue + codSettled;
      
      // Pending = orders not yet paid (excluding COD which has its own flow)
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

      // Fetch all invoices for summary
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

      // Calculate profit using actual cost prices (matching Analytics dashboard)
      const paidSettledOrders = [...onlinePaidOrders, ...codSettledOrders];
      const paidOrderSubtotals = paidSettledOrders.reduce((sum, o) => sum + (o.subtotal || 0), 0);
      
      let totalCost = 0;
      paidSettledOrders.forEach((order) => {
        const items = order.order_items || [];
        items.forEach((item: any) => {
          if (item.product_id && productCostMap[item.product_id]) {
            totalCost += productCostMap[item.product_id] * item.quantity;
          }
        });
      });
      
      const estimatedProfit = paidOrderSubtotals - totalCost;

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
      });

      // Sales data for chart - include both online paid and settled COD orders
      const salesByDate: Record<string, { revenue: number; orders: number }> = {};
      
      // Add online paid orders (non-COD with payment_status = paid)
      onlinePaidOrders.forEach((order) => {
        const date = format(new Date(order.created_at), "MMM dd");
        if (!salesByDate[date]) {
          salesByDate[date] = { revenue: 0, orders: 0 };
        }
        salesByDate[date].revenue += order.total_amount || 0;
        salesByDate[date].orders += 1;
      });
      
      // Add settled/received COD orders
      codSettledOrders.forEach((order) => {
        const date = format(new Date(order.created_at), "MMM dd");
        if (!salesByDate[date]) {
          salesByDate[date] = { revenue: 0, orders: 0 };
        }
        salesByDate[date].revenue += order.total_amount || 0;
        salesByDate[date].orders += 1;
      });

      setSalesData(
        Object.entries(salesByDate).map(([date, data]) => ({
          date,
          revenue: data.revenue,
          orders: data.orders,
        }))
      );

      // Recent invoices
      const { data: recent } = await supabase
        .from("invoices")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(10);

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
            Financial overview and GST reports
          </p>
        </div>
        <div className="flex gap-2">
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

      {/* Revenue Overview */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="bg-gradient-to-br from-green-500/10 to-green-500/5 border-green-500/20">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Total Revenue
            </CardTitle>
            <IndianRupee className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              {formatCurrency(stats.totalRevenue)}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              {stats.paidOrders} paid orders
            </p>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-blue-500/10 to-blue-500/5 border-blue-500/20">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Estimated Profit
            </CardTitle>
            <Wallet className="h-4 w-4 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">
              {formatCurrency(stats.totalProfit)}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              Revenue - Cost
            </p>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-orange-500/10 to-orange-500/5 border-orange-500/20">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Pending Payments
            </CardTitle>
            <CreditCard className="h-4 w-4 text-orange-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-orange-600">
              {formatCurrency(stats.pendingAmount)}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              {stats.pendingPayments} orders
            </p>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-purple-500/10 to-purple-500/5 border-purple-500/20">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Total GST Collected
            </CardTitle>
            <Receipt className="h-4 w-4 text-purple-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-purple-600">
              {formatCurrency(stats.totalTax)}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              From final invoices
            </p>
          </CardContent>
        </Card>
      </div>

      {/* COD Payment Tracking - Granular View */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="bg-gradient-to-br from-green-500/10 to-green-500/5 border-green-500/20">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              COD Settled
            </CardTitle>
            <Wallet className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              {formatCurrency(stats.codSettled)}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              Money received in account
            </p>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-blue-500/10 to-blue-500/5 border-blue-500/20">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              With Courier
            </CardTitle>
            <Wallet className="h-4 w-4 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">
              {formatCurrency(stats.codCollectedByCourier)}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              Collected by delivery partner
            </p>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-purple-500/10 to-purple-500/5 border-purple-500/20">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Awaiting Settlement
            </CardTitle>
            <PiggyBank className="h-4 w-4 text-purple-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-purple-600">
              {formatCurrency(stats.codAwaitingSettlement)}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              In transit from courier
            </p>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-orange-500/10 to-orange-500/5 border-orange-500/20">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              COD Pending
            </CardTitle>
            <CreditCard className="h-4 w-4 text-orange-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-orange-600">
              {formatCurrency(stats.codPending)}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              Awaiting delivery/collection
            </p>
          </CardContent>
        </Card>
      </div>

      {/* GST Breakdown */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              CGST Collected
            </CardTitle>
            <Receipt className="h-4 w-4 text-orange-500" />
          </CardHeader>
          <CardContent>
            <div className="text-xl font-bold text-orange-500">
              {formatCurrency(stats.totalCgst)}
            </div>
            <p className="text-xs text-muted-foreground">Central GST @ 9%</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              SGST Collected
            </CardTitle>
            <Receipt className="h-4 w-4 text-purple-500" />
          </CardHeader>
          <CardContent>
            <div className="text-xl font-bold text-purple-500">
              {formatCurrency(stats.totalSgst)}
            </div>
            <p className="text-xs text-muted-foreground">State GST @ 9%</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              IGST Collected
            </CardTitle>
            <Receipt className="h-4 w-4 text-teal-500" />
          </CardHeader>
          <CardContent>
            <div className="text-xl font-bold text-teal-500">
              {formatCurrency(stats.totalIgst)}
            </div>
            <p className="text-xs text-muted-foreground">Integrated GST @ 18%</p>
          </CardContent>
        </Card>
      </div>

      {/* Charts and Tables */}
      <Tabs defaultValue="overview" className="space-y-4">
        <TabsList>
          <TabsTrigger value="overview">Revenue Overview</TabsTrigger>
          <TabsTrigger value="invoices">Invoice Summary</TabsTrigger>
        </TabsList>

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
                    <p className="text-lg font-semibold">
                      {formatCurrency(invoiceSummary.proformaAmount)}
                    </p>
                  </div>
                </div>
                <div className="flex items-center justify-between p-4 rounded-lg bg-green-500/10">
                  <div>
                    <p className="text-sm text-muted-foreground">Final Invoices</p>
                    <p className="text-2xl font-bold text-green-600">
                      {invoiceSummary.finalCount}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm text-muted-foreground">Value</p>
                    <p className="text-lg font-semibold text-green-600">
                      {formatCurrency(invoiceSummary.finalAmount)}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="invoices">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle>Recent Invoices</CardTitle>
                <CardDescription>Last 10 invoices generated</CardDescription>
              </div>
              {canDownload && invoiceSummary.finalCount > 0 && (
                <Button
                  size="sm"
                  variant="outline"
                  onClick={async () => {
                    const { start, end } = getDateRange();
                    // Get all final invoice IDs for the period
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
                    <TableHead>Amount</TableHead>
                    <TableHead>Tax</TableHead>
                    <TableHead>Date</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {recentInvoices.map((invoice) => (
                    <TableRow key={invoice.id}>
                      <TableCell className="font-medium">
                        {invoice.invoice_number}
                      </TableCell>
                      <TableCell>{invoice.client_name}</TableCell>
                      <TableCell>
                        <Badge variant={invoice.is_final ? "default" : "secondary"}>
                          {invoice.is_final ? "Final" : "Proforma"}
                        </Badge>
                      </TableCell>
                      <TableCell>{formatCurrency(invoice.total_amount)}</TableCell>
                      <TableCell>{formatCurrency(invoice.tax_amount)}</TableCell>
                      <TableCell>
                        {format(new Date(invoice.created_at), "dd MMM yyyy")}
                      </TableCell>
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
