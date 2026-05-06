import { useState, useEffect, useMemo } from "react";
import { supabase } from "@/integrations/supabase/client";
import { usePermissions } from "@/hooks/useEmployeePermissions";
import { useReportGenerator } from "@/hooks/useReportGenerator";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import {
  Download, Calendar, ShoppingCart, TrendingUp, Users, Package, Boxes, Receipt,
  Loader2, Shield, BarChart3, Search, AlertTriangle, Truck, Trophy, PieChart,
  XCircle, CalendarCheck, Wallet,
} from "lucide-react";
import { format, startOfMonth, endOfMonth, subMonths, startOfYear, endOfYear, subDays } from "date-fns";

type ReportCategory = "quick" | "financial" | "operations" | "inventory" | "hr";

interface ReportDef {
  id: string;
  title: string;
  description: string;
  icon: any;
  category: ReportCategory;
  color: string;
  bgColor: string;
  borderColor: string;
  needsDateRange?: boolean;
  needsCustomerSelect?: boolean;
  quick?: boolean;
  run: (ctx: { start: Date; end: Date; customerId?: string }) => void | Promise<void>;
}

export default function Reports() {
  const { isSuperAdmin, hasAnyPermission } = usePermissions();
  const r = useReportGenerator();

  const [customers, setCustomers] = useState<{ id: string; full_name: string; email: string }[]>([]);
  const [selectedCustomer, setSelectedCustomer] = useState<string>("all");
  const [search, setSearch] = useState("");

  // Per-card date range state (keyed by report id)
  const [ranges, setRanges] = useState<Record<string, { preset: string; from: string; to: string }>>({});
  const getRange = (id: string) => ranges[id] || { preset: "this_month", from: "", to: "" };
  const setRange = (id: string, patch: Partial<{ preset: string; from: string; to: string }>) =>
    setRanges((prev) => ({ ...prev, [id]: { ...getRange(id), ...patch } }));

  const canView = isSuperAdmin || hasAnyPermission(["view_accounting", "view_revenue", "download_financials"]);

  useEffect(() => { if (canView) fetchCustomers(); }, [canView]);
  const fetchCustomers = async () => {
    const { data } = await supabase.from("profiles").select("id, full_name, email").order("full_name");
    setCustomers(data || []);
  };

  const resolveDates = (id: string): { start: Date; end: Date } => {
    const cfg = getRange(id);
    const now = new Date();
    switch (cfg.preset) {
      case "today": return { start: new Date(now.getFullYear(), now.getMonth(), now.getDate()), end: now };
      case "yesterday": { const y = subDays(now, 1); return { start: new Date(y.getFullYear(), y.getMonth(), y.getDate()), end: y }; }
      case "this_week": return { start: subDays(now, 7), end: now };
      case "this_month": return { start: startOfMonth(now), end: endOfMonth(now) };
      case "last_month": return { start: startOfMonth(subMonths(now, 1)), end: endOfMonth(subMonths(now, 1)) };
      case "last_3_months": return { start: startOfMonth(subMonths(now, 2)), end: endOfMonth(now) };
      case "this_year": return { start: startOfYear(now), end: endOfYear(now) };
      case "custom": return { start: cfg.from ? new Date(cfg.from) : startOfMonth(now), end: cfg.to ? new Date(cfg.to) : endOfMonth(now) };
      default: return { start: startOfMonth(now), end: endOfMonth(now) };
    }
  };

  const reports: ReportDef[] = useMemo(() => [
    // QUICK
    { id: "today_orders", title: "Today's Orders", description: "Daily snapshot of all orders received today", icon: ShoppingCart, category: "quick", quick: true,
      color: "text-blue-600", bgColor: "bg-blue-500/10", borderColor: "border-blue-500/20",
      run: () => r.generateTodayOrdersReport() },
    { id: "low_stock", title: "Low Stock Alert", description: "Products & raw materials needing immediate reorder", icon: AlertTriangle, category: "quick", quick: true,
      color: "text-red-600", bgColor: "bg-red-500/10", borderColor: "border-red-500/20",
      run: () => r.generateLowStockReport() },
    { id: "pending_payments", title: "Pending Payments", description: "Outstanding receivables with aging buckets (0-30, 31-60, 61-90, 90+ days)", icon: Wallet, category: "quick", quick: true,
      color: "text-orange-600", bgColor: "bg-orange-500/10", borderColor: "border-orange-500/20",
      run: () => r.generatePendingPaymentsReport() },

    // FINANCIAL
    { id: "sales", title: "Sales Performance", description: "Revenue, profit & sales breakdown for the period", icon: TrendingUp, category: "financial", needsDateRange: true,
      color: "text-green-600", bgColor: "bg-green-500/10", borderColor: "border-green-500/20",
      run: ({ start, end }) => r.generateSalesReport(start, end) },
    { id: "pnl", title: "Profit & Loss", description: "Revenue, COGS, GST & net profit summary", icon: PieChart, category: "financial", needsDateRange: true,
      color: "text-emerald-600", bgColor: "bg-emerald-500/10", borderColor: "border-emerald-500/20",
      run: ({ start, end }) => r.generateProfitLossReport(start, end) },
    { id: "gst", title: "GST Tax Report", description: "CGST, SGST, IGST breakdown from final invoices", icon: Receipt, category: "financial", needsDateRange: true,
      color: "text-orange-600", bgColor: "bg-orange-500/10", borderColor: "border-orange-500/20",
      run: ({ start, end }) => r.generateGSTReport(start, end) },
    { id: "cod", title: "COD Collection", description: "Cash-on-Delivery tracking, settlements & in-transit", icon: Truck, category: "financial", needsDateRange: true,
      color: "text-amber-600", bgColor: "bg-amber-500/10", borderColor: "border-amber-500/20",
      run: ({ start, end }) => r.generateCodReport(start, end) },

    // OPERATIONS
    { id: "top_products", title: "Top Products", description: "Best-selling products ranked by revenue", icon: Trophy, category: "operations", needsDateRange: true,
      color: "text-yellow-600", bgColor: "bg-yellow-500/10", borderColor: "border-yellow-500/20",
      run: ({ start, end }) => r.generateTopProductsReport(start, end) },
    { id: "cancellations", title: "Cancellations & Refunds", description: "Cancelled orders & refund tracking", icon: XCircle, category: "operations", needsDateRange: true,
      color: "text-rose-600", bgColor: "bg-rose-500/10", borderColor: "border-rose-500/20",
      run: ({ start, end }) => r.generateCancellationsReport(start, end) },
    { id: "customers", title: "Customer Database", description: "All customers or detailed report for one customer", icon: Users, category: "operations", needsCustomerSelect: true,
      color: "text-purple-600", bgColor: "bg-purple-500/10", borderColor: "border-purple-500/20",
      run: ({ customerId }) => r.generateCustomerReport(customerId) },

    // INVENTORY
    { id: "inventory", title: "Product Inventory", description: "Stock levels, pricing & availability status", icon: Package, category: "inventory", quick: true,
      color: "text-cyan-600", bgColor: "bg-cyan-500/10", borderColor: "border-cyan-500/20",
      run: () => r.generateProductInventoryReport() },
    { id: "raw_materials", title: "Raw Materials", description: "Current stock levels & reorder status of materials", icon: Boxes, category: "inventory", quick: true,
      color: "text-amber-600", bgColor: "bg-amber-500/10", borderColor: "border-amber-500/20",
      run: () => r.generateRawMaterialsReport() },

    // HR
    { id: "attendance", title: "Employee Attendance", description: "Per-employee attendance summary for the period", icon: CalendarCheck, category: "hr", needsDateRange: true,
      color: "text-indigo-600", bgColor: "bg-indigo-500/10", borderColor: "border-indigo-500/20",
      run: ({ start, end }) => r.generateAttendanceReport(start, end) },
  ], [r]);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return reports;
    return reports.filter((rep) => rep.title.toLowerCase().includes(q) || rep.description.toLowerCase().includes(q));
  }, [search, reports]);

  if (!canView) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Card className="max-w-md">
          <CardContent className="pt-6 text-center">
            <Shield className="h-12 w-12 mx-auto text-destructive mb-4" />
            <h2 className="text-xl font-semibold mb-2">Access Denied</h2>
            <p className="text-muted-foreground">You don't have permission to access reports.</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  const renderCard = (rep: ReportDef) => {
    const range = getRange(rep.id);
    return (
      <Card key={rep.id} className={`${rep.borderColor} hover:shadow-lg hover:-translate-y-0.5 transition-all`}>
        <CardHeader className="pb-3">
          <div className="flex items-start justify-between">
            <div className={`p-2.5 rounded-lg ${rep.bgColor}`}>
              <rep.icon className={`h-5 w-5 ${rep.color}`} />
            </div>
            {rep.quick && <Badge variant="secondary" className="text-xs">Quick</Badge>}
          </div>
          <CardTitle className="text-base mt-3">{rep.title}</CardTitle>
          <CardDescription className="text-xs leading-relaxed">{rep.description}</CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          {rep.needsDateRange && (
            <div className="space-y-2">
              <Select value={range.preset} onValueChange={(v) => setRange(rep.id, { preset: v })}>
                <SelectTrigger className="w-full h-9">
                  <Calendar className="h-3.5 w-3.5 mr-2" />
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="today">Today</SelectItem>
                  <SelectItem value="yesterday">Yesterday</SelectItem>
                  <SelectItem value="this_week">Last 7 Days</SelectItem>
                  <SelectItem value="this_month">This Month</SelectItem>
                  <SelectItem value="last_month">Last Month</SelectItem>
                  <SelectItem value="last_3_months">Last 3 Months</SelectItem>
                  <SelectItem value="this_year">This Year</SelectItem>
                  <SelectItem value="custom">Custom Range</SelectItem>
                </SelectContent>
              </Select>
              {range.preset === "custom" && (
                <div className="grid grid-cols-2 gap-2">
                  <div><Label className="text-xs">From</Label>
                    <Input type="date" value={range.from} onChange={(e) => setRange(rep.id, { from: e.target.value })} className="h-8" /></div>
                  <div><Label className="text-xs">To</Label>
                    <Input type="date" value={range.to} onChange={(e) => setRange(rep.id, { to: e.target.value })} className="h-8" /></div>
                </div>
              )}
            </div>
          )}
          {rep.needsCustomerSelect && (
            <Select value={selectedCustomer} onValueChange={setSelectedCustomer}>
              <SelectTrigger className="w-full h-9"><Users className="h-3.5 w-3.5 mr-2" /><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Customers</SelectItem>
                {customers.map((c) => (<SelectItem key={c.id} value={c.id}>{c.full_name || c.email}</SelectItem>))}
              </SelectContent>
            </Select>
          )}
          <Button
            onClick={() => {
              const { start, end } = resolveDates(rep.id);
              rep.run({ start, end, customerId: selectedCustomer === "all" ? undefined : selectedCustomer });
            }}
            disabled={r.isGenerating}
            className="w-full"
            size="sm"
          >
            {r.isGenerating ? <><Loader2 className="h-3.5 w-3.5 mr-2 animate-spin" />Generating...</> : <><Download className="h-3.5 w-3.5 mr-2" />Download PDF</>}
          </Button>
        </CardContent>
      </Card>
    );
  };

  const tabs: { value: string; label: string; filter: (rep: ReportDef) => boolean }[] = [
    { value: "all", label: "All Reports", filter: () => true },
    { value: "quick", label: "Quick", filter: (rep) => rep.category === "quick" || !!rep.quick },
    { value: "financial", label: "Financial", filter: (rep) => rep.category === "financial" },
    { value: "operations", label: "Operations", filter: (rep) => rep.category === "operations" },
    { value: "inventory", label: "Inventory", filter: (rep) => rep.category === "inventory" },
    { value: "hr", label: "HR & Payroll", filter: (rep) => rep.category === "hr" },
  ];

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-foreground flex items-center gap-3">
            <BarChart3 className="h-8 w-8 text-primary" />
            Reports Center
          </h1>
          <p className="text-muted-foreground mt-1">
            {reports.length} business reports across finance, operations, inventory & HR
          </p>
        </div>
        {r.isGenerating && (
          <Badge variant="outline" className="flex items-center gap-2">
            <Loader2 className="h-4 w-4 animate-spin" /> Generating Report...
          </Badge>
        )}
      </div>

      <div className="relative max-w-md">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input placeholder="Search reports..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-9" />
      </div>

      <Tabs defaultValue="all" className="w-full">
        <TabsList className="flex-wrap h-auto">
          {tabs.map((t) => (
            <TabsTrigger key={t.value} value={t.value}>
              {t.label}
              <span className="ml-1.5 text-xs opacity-60">({filtered.filter(t.filter).length})</span>
            </TabsTrigger>
          ))}
        </TabsList>
        {tabs.map((t) => (
          <TabsContent key={t.value} value={t.value} className="mt-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
              {filtered.filter(t.filter).map(renderCard)}
            </div>
            {filtered.filter(t.filter).length === 0 && (
              <div className="text-center py-12 text-muted-foreground">
                <Search className="h-10 w-10 mx-auto mb-3 opacity-40" />
                No reports match your search.
              </div>
            )}
          </TabsContent>
        ))}
      </Tabs>
    </div>
  );
}
