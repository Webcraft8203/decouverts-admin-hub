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
  Receipt,
  FileText,
  FileCheck2,
  RefreshCw,
  Download,
  Clock,
  Shield,
  Loader2,
  FileDown,
  Users,
  Percent,
  Wallet,
  BarChart3,
} from "lucide-react";
import { format, startOfMonth, endOfMonth, subMonths, startOfYear, endOfYear } from "date-fns";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, ResponsiveContainer, Tooltip, Legend } from "recharts";

interface AccountingStats {
  finalCount: number;
  finalValue: number;
  proformaCount: number;
  proformaValue: number;
  proformaPending: number;
  proformaPendingCount: number;
  totalReceived: number;
  receivedCount: number;
  outstanding: number;
  outstandingCount: number;
  totalCgst: number;
  totalSgst: number;
  totalIgst: number;
  totalTax: number;
  taxableValue: number;
  avgInvoiceValue: number;
}

interface TopClient {
  name: string;
  gstin: string | null;
  invoices: number;
  billed: number;
  received: number;
}

interface GSTSlabData {
  slab: string;
  taxableValue: number;
  cgst: number;
  sgst: number;
  igst: number;
  total: number;
}

interface MonthlyPoint {
  label: string;
  invoiced: number;
  received: number;
  gst: number;
}

const emptyStats: AccountingStats = {
  finalCount: 0,
  finalValue: 0,
  proformaCount: 0,
  proformaValue: 0,
  proformaPending: 0,
  proformaPendingCount: 0,
  totalReceived: 0,
  receivedCount: 0,
  outstanding: 0,
  outstandingCount: 0,
  totalCgst: 0,
  totalSgst: 0,
  totalIgst: 0,
  totalTax: 0,
  taxableValue: 0,
  avgInvoiceValue: 0,
};

export default function Accounting() {
  const { isSuperAdmin, hasPermission, hasAnyPermission } = usePermissions();
  const { toast } = useToast();
  const { downloadInvoiceReport, downloadBulkInvoices, isDownloading: isBulkDownloading, progress } =
    useBulkInvoiceDownload();

  const [stats, setStats] = useState<AccountingStats>(emptyStats);
  const [gstSlabData, setGstSlabData] = useState<GSTSlabData[]>([]);
  const [monthlyData, setMonthlyData] = useState<MonthlyPoint[]>([]);
  const [topClients, setTopClients] = useState<TopClient[]>([]);
  const [invoiceList, setInvoiceList] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [dateRange, setDateRange] = useState("this_month");

  const canView = isSuperAdmin || hasAnyPermission(["view_accounting", "view_gst_reports", "view_revenue"]);
  const canDownload = isSuperAdmin || hasPermission("download_financials");

  const getDateRange = () => {
    const now = new Date();
    switch (dateRange) {
      case "last_month":
        return { start: startOfMonth(subMonths(now, 1)), end: endOfMonth(subMonths(now, 1)) };
      case "last_3_months":
        return { start: startOfMonth(subMonths(now, 2)), end: endOfMonth(now) };
      case "last_6_months":
        return { start: startOfMonth(subMonths(now, 5)), end: endOfMonth(now) };
      case "this_year":
        return { start: startOfYear(now), end: endOfYear(now) };
      default:
        return { start: startOfMonth(now), end: endOfMonth(now) };
    }
  };

  const dateRangeLabel = useMemo(() => {
    const { start, end } = getDateRange();
    return `${format(start, "dd MMM yyyy")} - ${format(end, "dd MMM yyyy")}`;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [dateRange]);

  const fetchAccountingData = async () => {
    setIsLoading(true);
    const { start, end } = getDateRange();

    try {
      const { data, error } = await supabase
        .from("invoices")
        .select("*")
        .gte("created_at", start.toISOString())
        .lte("created_at", end.toISOString())
        .order("created_at", { ascending: false });

      if (error) throw error;

      const list = data || [];
      const isFinal = (i: any) => i.invoice_type === "final" || i.is_final === true;
      const isPaid = (i: any) => i.payment_status === "paid";
      const amt = (i: any) => Number(i.total_amount || 0);
      // Amount actually received (supports partial payments)
      const paidAmt = (i: any) =>
        i.payment_status === "paid" ? amt(i) : Math.min(Number(i.amount_paid || 0), amt(i));

      const finals = list.filter(isFinal);
      const proformas = list.filter((i) => !isFinal(i));
      const paid = list.filter((i) => paidAmt(i) > 0);
      const outstandingList = finals.filter((i) => paidAmt(i) < amt(i));
      const proformaPendingList = proformas.filter((i) => paidAmt(i) < amt(i));

      const totalCgst = finals.reduce((s, i) => s + Number(i.cgst_amount || 0), 0);
      const totalSgst = finals.reduce((s, i) => s + Number(i.sgst_amount || 0), 0);
      const totalIgst = finals.reduce((s, i) => s + Number(i.igst_amount || 0), 0);
      const finalValue = finals.reduce((s, i) => s + amt(i), 0);
      const taxableValue = finals.reduce((s, i) => s + Number(i.subtotal || 0), 0);

      setStats({
        finalCount: finals.length,
        finalValue,
        proformaCount: proformas.length,
        proformaValue: proformas.reduce((s, i) => s + amt(i), 0),
        proformaPending: proformaPendingList.reduce((s, i) => s + (amt(i) - paidAmt(i)), 0),
        proformaPendingCount: proformaPendingList.length,
        totalReceived: list.reduce((s, i) => s + paidAmt(i), 0),
        receivedCount: paid.length,
        outstanding: outstandingList.reduce((s, i) => s + (amt(i) - paidAmt(i)), 0),
        outstandingCount: outstandingList.length,
        totalCgst,
        totalSgst,
        totalIgst,
        totalTax: totalCgst + totalSgst + totalIgst,
        taxableValue,
        avgInvoiceValue: finals.length ? finalValue / finals.length : 0,
      });

      // GST slab-wise breakdown from final invoices
      const gstSlabs: Record<string, GSTSlabData> = {};
      finals.forEach((inv: any) => {
        const breakdown: any[] = Array.isArray(inv.gst_breakdown) ? inv.gst_breakdown : [];
        const rows = breakdown.length
          ? breakdown
          : (Array.isArray(inv.items) ? inv.items : []).map((it: any) => ({
              gst_rate: it.gst_rate ?? it.gstRate,
              taxable_value: it.taxable_value ?? (Number(it.price || 0) * Number(it.quantity || 0)),
            }));
        rows.forEach((item: any) => {
          const rate = Number(item.gst_rate ?? item.gstRate ?? 18);
          const slabKey = `${rate}%`;
          if (!gstSlabs[slabKey]) {
            gstSlabs[slabKey] = { slab: slabKey, taxableValue: 0, cgst: 0, sgst: 0, igst: 0, total: 0 };
          }
          const taxable = Number(item.taxable_value ?? item.taxableValue ?? 0);
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

      // Monthly trend within the selected range
      const buckets: Record<string, MonthlyPoint> = {};
      const ensure = (key: string) => {
        if (!buckets[key]) buckets[key] = { label: key, invoiced: 0, received: 0, gst: 0 };
        return buckets[key];
      };
      finals.forEach((inv: any) => {
        const key = format(startOfMonth(new Date(inv.created_at)), "MMM yy");
        const b = ensure(key);
        b.invoiced += amt(inv);
        b.gst += Number(inv.cgst_amount || 0) + Number(inv.sgst_amount || 0) + Number(inv.igst_amount || 0);
      });
      paid.forEach((inv: any) => {
        const key = format(startOfMonth(new Date(inv.payment_date || inv.created_at)), "MMM yy");
        ensure(key).received += paidAmt(inv);
      });
      setMonthlyData(Object.values(buckets));

      // Top clients by billed value (final invoices)
      const clientMap: Record<string, TopClient> = {};
      finals.forEach((inv: any) => {
        const key = (inv.client_name || "Unknown").trim();
        if (!clientMap[key]) {
          clientMap[key] = { name: key, gstin: inv.buyer_gstin || null, invoices: 0, billed: 0, received: 0 };
        }
        clientMap[key].invoices += 1;
        clientMap[key].billed += amt(inv);
        clientMap[key].received += paidAmt(inv);
        if (!clientMap[key].gstin && inv.buyer_gstin) clientMap[key].gstin = inv.buyer_gstin;
      });
      setTopClients(Object.values(clientMap).sort((a, b) => b.billed - a.billed).slice(0, 10));

      setInvoiceList(list.slice(0, 25));
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
    if (canView) fetchAccountingData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [canView, dateRange]);

  const formatCurrency = (amount: number) =>
    new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: "INR",
      maximumFractionDigits: 0,
    }).format(amount || 0);

  const collectionEfficiency = useMemo(() => {
    const billed = stats.finalValue;
    if (!billed) return 0;
    return Math.min(100, Math.round((stats.totalReceived / billed) * 100));
  }, [stats]);

  if (!canView) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Card className="max-w-md">
          <CardContent className="pt-6 text-center space-y-3">
            <Shield className="h-10 w-10 mx-auto text-muted-foreground" />
            <h2 className="text-xl font-semibold">Access Restricted</h2>
            <p className="text-sm text-muted-foreground">
              You do not have permission to view accounting data.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  const show = (v: string) => (isLoading ? "..." : v);

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Accounting</h1>
          <p className="text-muted-foreground mt-1">
            Invoice-based financials &amp; GST · {dateRangeLabel}
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Select value={dateRange} onValueChange={setDateRange}>
            <SelectTrigger className="w-[170px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="this_month">This Month</SelectItem>
              <SelectItem value="last_month">Last Month</SelectItem>
              <SelectItem value="last_3_months">Last 3 Months</SelectItem>
              <SelectItem value="last_6_months">Last 6 Months</SelectItem>
              <SelectItem value="this_year">This Year</SelectItem>
            </SelectContent>
          </Select>
          <Button variant="outline" size="sm" onClick={fetchAccountingData} disabled={isLoading}>
            <RefreshCw className={`h-4 w-4 mr-2 ${isLoading ? "animate-spin" : ""}`} />
            Refresh
          </Button>
          {canDownload && (
            <Button
              size="sm"
              onClick={() => {
                const { start, end } = getDateRange();
                downloadInvoiceReport({
                  dateFrom: format(start, "yyyy-MM-dd"),
                  dateTo: format(end, "yyyy-MM-dd"),
                  dateRange: dateRangeLabel,
                });
              }}
              disabled={isBulkDownloading}
            >
              {isBulkDownloading ? (
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              ) : (
                <FileDown className="h-4 w-4 mr-2" />
              )}
              Report PDF
            </Button>
          )}
        </div>
      </div>

      {isBulkDownloading && progress > 0 && <Progress value={progress} className="h-2" />}

      {/* Primary KPIs */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        <Card className="border-border">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Total Invoiced (Final)</CardTitle>
            <FileCheck2 className="h-4 w-4 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{show(formatCurrency(stats.finalValue))}</div>
            <p className="text-xs text-muted-foreground mt-1">{stats.finalCount} final invoices</p>
          </CardContent>
        </Card>

        <Card className="border-border">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Payment Received</CardTitle>
            <Wallet className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{show(formatCurrency(stats.totalReceived))}</div>
            <p className="text-xs text-muted-foreground mt-1">{stats.receivedCount} paid invoices</p>
          </CardContent>
        </Card>

        <Card className="border-border">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Outstanding (Final)</CardTitle>
            <Clock className="h-4 w-4 text-orange-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-orange-600">{show(formatCurrency(stats.outstanding))}</div>
            <p className="text-xs text-muted-foreground mt-1">{stats.outstandingCount} unpaid invoices</p>
          </CardContent>
        </Card>

        <Card className="border-border">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Proforma Pending</CardTitle>
            <FileText className="h-4 w-4 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">{show(formatCurrency(stats.proformaPending))}</div>
            <p className="text-xs text-muted-foreground mt-1">
              {stats.proformaPendingCount} of {stats.proformaCount} proformas awaiting payment
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Secondary KPIs */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Taxable Value</CardTitle>
            <IndianRupee className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-xl font-bold">{show(formatCurrency(stats.taxableValue))}</div>
            <p className="text-xs text-muted-foreground">Before GST</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Total GST Collected</CardTitle>
            <Receipt className="h-4 w-4 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-xl font-bold text-primary">{show(formatCurrency(stats.totalTax))}</div>
            <p className="text-xs text-muted-foreground">CGST + SGST + IGST</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Avg Invoice Value</CardTitle>
            <BarChart3 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-xl font-bold">{show(formatCurrency(stats.avgInvoiceValue))}</div>
            <p className="text-xs text-muted-foreground">Per final invoice</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Collection Efficiency</CardTitle>
            <Percent className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent className="space-y-2">
            <div className="text-xl font-bold">{show(`${collectionEfficiency}%`)}</div>
            <Progress value={collectionEfficiency} className="h-2" />
          </CardContent>
        </Card>
      </div>

      {/* GST split */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {[
          { label: "CGST Collected", value: stats.totalCgst, cls: "text-orange-500", note: "Central GST (intra-state)" },
          { label: "SGST Collected", value: stats.totalSgst, cls: "text-purple-500", note: "State GST (intra-state)" },
          { label: "IGST Collected", value: stats.totalIgst, cls: "text-teal-500", note: "Integrated GST (inter-state)" },
        ].map((g) => (
          <Card key={g.label}>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">{g.label}</CardTitle>
              <Receipt className={`h-4 w-4 ${g.cls}`} />
            </CardHeader>
            <CardContent>
              <div className={`text-xl font-bold ${g.cls}`}>{show(formatCurrency(g.value))}</div>
              <p className="text-xs text-muted-foreground">{g.note}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Tabs */}
      <Tabs defaultValue="overview" className="space-y-4">
        <TabsList className="flex flex-wrap h-auto gap-1">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="gst">GST Filing</TabsTrigger>
          <TabsTrigger value="clients">Top Clients</TabsTrigger>
          <TabsTrigger value="invoices">Invoices</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Billing vs Collection</CardTitle>
              <CardDescription>Month-wise invoiced value against payment received</CardDescription>
            </CardHeader>
            <CardContent className="h-[340px]">
              {monthlyData.length === 0 ? (
                <div className="h-full flex items-center justify-center text-sm text-muted-foreground">
                  {isLoading ? "Loading..." : "No invoice data for this period"}
                </div>
              ) : (
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={monthlyData}>
                    <CartesianGrid strokeDasharray="3 3" className="stroke-muted" vertical={false} />
                    <XAxis dataKey="label" tickLine={false} axisLine={false} fontSize={12} />
                    <YAxis
                      tickLine={false}
                      axisLine={false}
                      fontSize={12}
                      tickFormatter={(v) => `${Math.round(Number(v) / 1000)}k`}
                    />
                    <Tooltip formatter={(v: any) => formatCurrency(Number(v))} />
                    <Legend />
                    <Bar dataKey="invoiced" name="Invoiced" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
                    <Bar dataKey="received" name="Received" fill="hsl(142, 76%, 36%)" radius={[4, 4, 0, 0]} />
                    <Bar dataKey="gst" name="GST" fill="hsl(38, 92%, 50%)" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Invoice Summary</CardTitle>
              <CardDescription>Proforma vs Final for {dateRangeLabel}</CardDescription>
            </CardHeader>
            <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="flex items-center justify-between p-4 rounded-lg bg-muted/50">
                <div>
                  <p className="text-sm text-muted-foreground">Proforma Invoices</p>
                  <p className="text-2xl font-bold">{stats.proformaCount}</p>
                </div>
                <div className="text-right">
                  <p className="text-sm text-muted-foreground">Value</p>
                  <p className="text-lg font-semibold">{formatCurrency(stats.proformaValue)}</p>
                </div>
              </div>
              <div className="flex items-center justify-between p-4 rounded-lg bg-green-500/10">
                <div>
                  <p className="text-sm text-muted-foreground">Final Invoices</p>
                  <p className="text-2xl font-bold text-green-600">{stats.finalCount}</p>
                </div>
                <div className="text-right">
                  <p className="text-sm text-muted-foreground">Value</p>
                  <p className="text-lg font-semibold text-green-600">{formatCurrency(stats.finalValue)}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="gst" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>GST Slab-wise Summary</CardTitle>
              <CardDescription>Derived from final tax invoices in the selected period</CardDescription>
            </CardHeader>
            <CardContent>
              {gstSlabData.length === 0 ? (
                <p className="text-sm text-muted-foreground py-8 text-center">
                  {isLoading ? "Loading..." : "No GST data for this period"}
                </p>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Slab</TableHead>
                      <TableHead className="text-right">Taxable Value</TableHead>
                      <TableHead className="text-right">CGST</TableHead>
                      <TableHead className="text-right">SGST</TableHead>
                      <TableHead className="text-right">IGST</TableHead>
                      <TableHead className="text-right">Total Tax</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {gstSlabData.map((s) => (
                      <TableRow key={s.slab}>
                        <TableCell className="font-medium">{s.slab}</TableCell>
                        <TableCell className="text-right">{formatCurrency(s.taxableValue)}</TableCell>
                        <TableCell className="text-right">{formatCurrency(s.cgst)}</TableCell>
                        <TableCell className="text-right">{formatCurrency(s.sgst)}</TableCell>
                        <TableCell className="text-right">{formatCurrency(s.igst)}</TableCell>
                        <TableCell className="text-right font-semibold">{formatCurrency(s.total)}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="clients">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Users className="h-4 w-4" /> Top Clients
              </CardTitle>
              <CardDescription>Ranked by billed value on final invoices</CardDescription>
            </CardHeader>
            <CardContent>
              {topClients.length === 0 ? (
                <p className="text-sm text-muted-foreground py-8 text-center">
                  {isLoading ? "Loading..." : "No client billing in this period"}
                </p>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Client</TableHead>
                      <TableHead>GSTIN</TableHead>
                      <TableHead className="text-right">Invoices</TableHead>
                      <TableHead className="text-right">Billed</TableHead>
                      <TableHead className="text-right">Received</TableHead>
                      <TableHead className="text-right">Outstanding</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {topClients.map((c) => (
                      <TableRow key={c.name}>
                        <TableCell className="font-medium">{c.name}</TableCell>
                        <TableCell className="text-xs text-muted-foreground">{c.gstin || "—"}</TableCell>
                        <TableCell className="text-right">{c.invoices}</TableCell>
                        <TableCell className="text-right">{formatCurrency(c.billed)}</TableCell>
                        <TableCell className="text-right text-green-600">{formatCurrency(c.received)}</TableCell>
                        <TableCell className="text-right text-orange-600">
                          {formatCurrency(Math.max(0, c.billed - c.received))}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="invoices">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle>Invoices</CardTitle>
                <CardDescription>Latest invoices in the selected period</CardDescription>
              </div>
              {canDownload && invoiceList.length > 0 && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => downloadBulkInvoices(invoiceList.map((i) => i.id))}
                  disabled={isBulkDownloading}
                >
                  {isBulkDownloading ? (
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  ) : (
                    <Download className="h-4 w-4 mr-2" />
                  )}
                  Download All
                </Button>
              )}
            </CardHeader>
            <CardContent>
              {invoiceList.length === 0 ? (
                <p className="text-sm text-muted-foreground py-8 text-center">
                  {isLoading ? "Loading..." : "No invoices for this period"}
                </p>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Invoice #</TableHead>
                      <TableHead>Client</TableHead>
                      <TableHead>Date</TableHead>
                      <TableHead>Type</TableHead>
                      <TableHead>Payment</TableHead>
                      <TableHead className="text-right">Amount</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {invoiceList.map((inv) => {
                      const final = inv.invoice_type === "final" || inv.is_final === true;
                      const paid = inv.payment_status === "paid";
                      return (
                        <TableRow key={inv.id}>
                          <TableCell className="font-mono text-xs">{inv.invoice_number}</TableCell>
                          <TableCell>{inv.client_name}</TableCell>
                          <TableCell className="text-sm text-muted-foreground">
                            {format(new Date(inv.created_at), "dd MMM yyyy")}
                          </TableCell>
                          <TableCell>
                            <Badge variant={final ? "default" : "secondary"}>
                              {final ? "Final" : "Proforma"}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            <Badge variant={paid ? "default" : "outline"} className={paid ? "bg-green-600" : ""}>
                              {paid ? "Paid" : inv.payment_status || "pending"}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-right font-semibold">
                            {formatCurrency(Number(inv.total_amount || 0))}
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
