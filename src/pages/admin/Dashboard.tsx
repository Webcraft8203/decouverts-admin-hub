import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  IndianRupee,
  RefreshCw,
  Wallet,
  Receipt,
  FileText,
  FileCheck2,
  Clock,
} from "lucide-react";
import { useInvoiceAnalytics } from "@/hooks/useInvoiceAnalytics";
import { InvoiceTrendChart } from "@/components/admin/analytics/InvoiceTrendChart";
import { AccessDeniedBanner } from "@/components/admin/AccessDeniedBanner";
import { PermissionGate } from "@/components/admin/PermissionGate";
import { usePermissions } from "@/hooks/useEmployeePermissions";

const formatCurrency = (amount: number) =>
  new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(amount || 0);

export default function Dashboard() {
  const { kpis, isLoading, refetch } = useInvoiceAnalytics();
  const { isSuperAdmin } = usePermissions();

  const show = (v: string | number) => (isLoading ? "..." : v);

  return (
    <div className="space-y-8 animate-fade-in">
      <AccessDeniedBanner className="mb-4" />

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Invoice Dashboard</h1>
          <p className="text-muted-foreground mt-1">
            {isSuperAdmin
              ? "Billing performance overview for Decouvertes"
              : "Your personalized admin dashboard"}
          </p>
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={() => refetch()}
          disabled={isLoading}
          className="self-start sm:self-auto"
        >
          <RefreshCw className={`h-4 w-4 mr-2 ${isLoading ? "animate-spin" : ""}`} />
          Refresh
        </Button>
      </div>

      <PermissionGate permission={["view_invoices", "view_accounting", "view_revenue"]}>
        {/* Invoice KPIs */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4">
          <Card className="border-border hover:shadow-md transition-shadow">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-xs font-medium text-muted-foreground">
                Total Proforma Invoices
              </CardTitle>
              <FileText className="h-4 w-4 text-amber-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-foreground">{show(kpis.proformaCount)}</div>
              <p className="text-xs text-muted-foreground mt-1">
                {formatCurrency(kpis.proformaValue)} value
              </p>
            </CardContent>
          </Card>

          <Card className="border-border hover:shadow-md transition-shadow">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-xs font-medium text-muted-foreground">
                Total Final Invoices
              </CardTitle>
              <FileCheck2 className="h-4 w-4 text-primary" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-foreground">{show(kpis.finalCount)}</div>
              <p className="text-xs text-muted-foreground mt-1">
                {formatCurrency(kpis.finalValue)} invoiced
              </p>
            </CardContent>
          </Card>

          <Card className="border-border hover:shadow-md transition-shadow bg-gradient-to-br from-orange-500/10 to-orange-500/5 border-orange-500/20">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-xs font-medium text-muted-foreground">
                Pending (Final Invoices)
              </CardTitle>
              <Clock className="h-4 w-4 text-orange-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-orange-600">
                {show(formatCurrency(kpis.finalPending))}
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                {kpis.finalPendingCount} invoice{kpis.finalPendingCount === 1 ? "" : "s"} unpaid
              </p>
            </CardContent>
          </Card>

          <Card className="border-border hover:shadow-md transition-shadow bg-gradient-to-br from-amber-500/10 to-amber-500/5 border-amber-500/20">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-xs font-medium text-muted-foreground">
                Proforma Pending
              </CardTitle>
              <Clock className="h-4 w-4 text-amber-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-amber-600">
                {show(formatCurrency(kpis.proformaPending))}
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                {kpis.proformaPendingCount} awaiting payment
              </p>
            </CardContent>
          </Card>

          <Card className="border-border hover:shadow-md transition-shadow bg-gradient-to-br from-green-500/10 to-green-500/5 border-green-500/20">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-xs font-medium text-muted-foreground">
                Total Received Payment
              </CardTitle>
              <Wallet className="h-4 w-4 text-green-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">
                {show(formatCurrency(kpis.totalReceived))}
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                {kpis.receivedCount} paid invoice{kpis.receivedCount === 1 ? "" : "s"}
              </p>
            </CardContent>
          </Card>
        </div>
      </PermissionGate>

      {/* GST Collection */}
      <PermissionGate permission={["view_gst_reports", "view_accounting"]}>
        <div>
          <h2 className="text-lg font-semibold text-foreground mb-3 flex items-center gap-2">
            <Receipt className="h-5 w-5 text-primary" />
            GST Collection (Final Invoices)
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <Card className="border-border hover:shadow-md transition-shadow">
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-xs font-medium text-muted-foreground">
                  CGST Collected
                </CardTitle>
                <Receipt className="h-4 w-4 text-orange-500" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-orange-500">
                  {show(formatCurrency(kpis.cgst))}
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
                  {show(formatCurrency(kpis.sgst))}
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
                  {show(formatCurrency(kpis.igst))}
                </div>
                <p className="text-xs text-muted-foreground mt-1">Integrated GST</p>
              </CardContent>
            </Card>

            <Card className="border-border hover:shadow-md transition-shadow bg-gradient-to-br from-primary/10 to-primary/5 border-primary/20">
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-xs font-medium text-muted-foreground">
                  Total GST
                </CardTitle>
                <IndianRupee className="h-4 w-4 text-primary" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-primary">
                  {show(formatCurrency(kpis.totalGst))}
                </div>
                <p className="text-xs text-muted-foreground mt-1">CGST + SGST + IGST</p>
              </CardContent>
            </Card>
          </div>
        </div>
      </PermissionGate>

      {/* Trend */}
      <PermissionGate permission={["view_revenue", "view_accounting", "view_invoices"]}>
        <InvoiceTrendChart
          monthly={kpis.monthlyTrend}
          weekly={kpis.weeklyTrend}
          isLoading={isLoading}
        />
      </PermissionGate>
    </div>
  );
}
