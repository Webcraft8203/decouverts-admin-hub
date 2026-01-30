import { useState, useEffect } from "react";
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
  FileText, 
  Download, 
  Calendar, 
  ShoppingCart, 
  TrendingUp, 
  Users, 
  Package, 
  Boxes, 
  Receipt,
  Loader2,
  Shield,
  BarChart3
} from "lucide-react";
import { format, startOfMonth, endOfMonth, subMonths, startOfYear, endOfYear, subDays } from "date-fns";

export default function Reports() {
  const { isSuperAdmin, hasAnyPermission } = usePermissions();
  const {
    isGenerating,
    generateTodayOrdersReport,
    generateSalesReport,
    generateCustomerReport,
    generateRawMaterialsReport,
    generateProductInventoryReport,
    generateGSTReport,
  } = useReportGenerator();

  const [customers, setCustomers] = useState<{ id: string; full_name: string; email: string }[]>([]);
  const [selectedCustomer, setSelectedCustomer] = useState<string>("all");
  const [salesDateRange, setSalesDateRange] = useState("this_month");
  const [customSalesStart, setCustomSalesStart] = useState("");
  const [customSalesEnd, setCustomSalesEnd] = useState("");
  const [gstDateRange, setGstDateRange] = useState("this_month");
  const [customGstStart, setCustomGstStart] = useState("");
  const [customGstEnd, setCustomGstEnd] = useState("");

  const canView = isSuperAdmin || hasAnyPermission(["view_accounting", "view_revenue", "download_financials"]);

  useEffect(() => {
    if (canView) {
      fetchCustomers();
    }
  }, [canView]);

  const fetchCustomers = async () => {
    const { data } = await supabase
      .from("profiles")
      .select("id, full_name, email")
      .order("full_name");
    setCustomers(data || []);
  };

  const getDateRangeForSales = () => {
    const now = new Date();
    switch (salesDateRange) {
      case "today":
        return { start: new Date(now.getFullYear(), now.getMonth(), now.getDate()), end: now };
      case "yesterday":
        const yesterday = subDays(now, 1);
        return { start: new Date(yesterday.getFullYear(), yesterday.getMonth(), yesterday.getDate()), end: yesterday };
      case "this_week":
        return { start: subDays(now, 7), end: now };
      case "this_month":
        return { start: startOfMonth(now), end: endOfMonth(now) };
      case "last_month":
        return { start: startOfMonth(subMonths(now, 1)), end: endOfMonth(subMonths(now, 1)) };
      case "last_3_months":
        return { start: startOfMonth(subMonths(now, 2)), end: endOfMonth(now) };
      case "this_year":
        return { start: startOfYear(now), end: endOfYear(now) };
      case "custom":
        return { 
          start: customSalesStart ? new Date(customSalesStart) : startOfMonth(now), 
          end: customSalesEnd ? new Date(customSalesEnd) : endOfMonth(now) 
        };
      default:
        return { start: startOfMonth(now), end: endOfMonth(now) };
    }
  };

  const getDateRangeForGst = () => {
    const now = new Date();
    switch (gstDateRange) {
      case "this_month":
        return { start: startOfMonth(now), end: endOfMonth(now) };
      case "last_month":
        return { start: startOfMonth(subMonths(now, 1)), end: endOfMonth(subMonths(now, 1)) };
      case "last_3_months":
        return { start: startOfMonth(subMonths(now, 2)), end: endOfMonth(now) };
      case "this_year":
        return { start: startOfYear(now), end: endOfYear(now) };
      case "custom":
        return { 
          start: customGstStart ? new Date(customGstStart) : startOfMonth(now), 
          end: customGstEnd ? new Date(customGstEnd) : endOfMonth(now) 
        };
      default:
        return { start: startOfMonth(now), end: endOfMonth(now) };
    }
  };

  if (!canView) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Card className="max-w-md">
          <CardContent className="pt-6 text-center">
            <Shield className="h-12 w-12 mx-auto text-destructive mb-4" />
            <h2 className="text-xl font-semibold mb-2">Access Denied</h2>
            <p className="text-muted-foreground">
              You don't have permission to access reports.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  const reportCards = [
    {
      title: "Today's Orders",
      description: "Daily report of all orders received today with payment status",
      icon: ShoppingCart,
      color: "text-blue-600",
      bgColor: "bg-blue-500/10",
      borderColor: "border-blue-500/20",
      action: generateTodayOrdersReport,
      quick: true,
    },
    {
      title: "Sales Report",
      description: "Revenue, profit, and sales breakdown for selected period",
      icon: TrendingUp,
      color: "text-green-600",
      bgColor: "bg-green-500/10",
      borderColor: "border-green-500/20",
      action: () => {
        const { start, end } = getDateRangeForSales();
        generateSalesReport(start, end);
      },
      hasDateRange: true,
      dateRangeState: salesDateRange,
      setDateRange: setSalesDateRange,
      customStart: customSalesStart,
      setCustomStart: setCustomSalesStart,
      customEnd: customSalesEnd,
      setCustomEnd: setCustomSalesEnd,
    },
    {
      title: "Customer Report",
      description: "All customers or detailed report for a specific customer",
      icon: Users,
      color: "text-purple-600",
      bgColor: "bg-purple-500/10",
      borderColor: "border-purple-500/20",
      action: () => generateCustomerReport(selectedCustomer === "all" ? undefined : selectedCustomer),
      hasCustomerSelect: true,
    },
    {
      title: "GST Report",
      description: "CGST, SGST, IGST breakdown from final invoices",
      icon: Receipt,
      color: "text-orange-600",
      bgColor: "bg-orange-500/10",
      borderColor: "border-orange-500/20",
      action: () => {
        const { start, end } = getDateRangeForGst();
        generateGSTReport(start, end);
      },
      hasGstDateRange: true,
    },
    {
      title: "Raw Materials",
      description: "Current stock levels of all raw materials",
      icon: Boxes,
      color: "text-amber-600",
      bgColor: "bg-amber-500/10",
      borderColor: "border-amber-500/20",
      action: generateRawMaterialsReport,
      quick: true,
    },
    {
      title: "Product Inventory",
      description: "Product stock, pricing, and availability status",
      icon: Package,
      color: "text-cyan-600",
      bgColor: "bg-cyan-500/10",
      borderColor: "border-cyan-500/20",
      action: generateProductInventoryReport,
      quick: true,
    },
  ];

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-foreground flex items-center gap-3">
            <BarChart3 className="h-8 w-8 text-primary" />
            Reports Center
          </h1>
          <p className="text-muted-foreground mt-1">
            Generate professional PDF reports for orders, sales, inventory, and more
          </p>
        </div>
        {isGenerating && (
          <Badge variant="outline" className="flex items-center gap-2">
            <Loader2 className="h-4 w-4 animate-spin" />
            Generating Report...
          </Badge>
        )}
      </div>

      <Tabs defaultValue="all" className="w-full">
        <TabsList>
          <TabsTrigger value="all">All Reports</TabsTrigger>
          <TabsTrigger value="quick">Quick Reports</TabsTrigger>
          <TabsTrigger value="financial">Financial</TabsTrigger>
          <TabsTrigger value="inventory">Inventory</TabsTrigger>
        </TabsList>

        <TabsContent value="all" className="mt-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {reportCards.map((report, index) => (
              <Card key={index} className={`${report.borderColor} hover:shadow-md transition-shadow`}>
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between">
                    <div className={`p-2 rounded-lg ${report.bgColor}`}>
                      <report.icon className={`h-5 w-5 ${report.color}`} />
                    </div>
                    {report.quick && (
                      <Badge variant="secondary" className="text-xs">Quick</Badge>
                    )}
                  </div>
                  <CardTitle className="text-lg mt-3">{report.title}</CardTitle>
                  <CardDescription>{report.description}</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  {report.hasDateRange && (
                    <div className="space-y-3">
                      <Select value={report.dateRangeState} onValueChange={report.setDateRange}>
                        <SelectTrigger className="w-full">
                          <Calendar className="h-4 w-4 mr-2" />
                          <SelectValue placeholder="Select period" />
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
                      {report.dateRangeState === "custom" && (
                        <div className="grid grid-cols-2 gap-2">
                          <div>
                            <Label className="text-xs">From</Label>
                            <Input 
                              type="date" 
                              value={report.customStart} 
                              onChange={(e) => report.setCustomStart?.(e.target.value)}
                              className="h-9"
                            />
                          </div>
                          <div>
                            <Label className="text-xs">To</Label>
                            <Input 
                              type="date" 
                              value={report.customEnd} 
                              onChange={(e) => report.setCustomEnd?.(e.target.value)}
                              className="h-9"
                            />
                          </div>
                        </div>
                      )}
                    </div>
                  )}

                  {report.hasGstDateRange && (
                    <div className="space-y-3">
                      <Select value={gstDateRange} onValueChange={setGstDateRange}>
                        <SelectTrigger className="w-full">
                          <Calendar className="h-4 w-4 mr-2" />
                          <SelectValue placeholder="Select period" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="this_month">This Month</SelectItem>
                          <SelectItem value="last_month">Last Month</SelectItem>
                          <SelectItem value="last_3_months">Last 3 Months</SelectItem>
                          <SelectItem value="this_year">This Year</SelectItem>
                          <SelectItem value="custom">Custom Range</SelectItem>
                        </SelectContent>
                      </Select>
                      {gstDateRange === "custom" && (
                        <div className="grid grid-cols-2 gap-2">
                          <div>
                            <Label className="text-xs">From</Label>
                            <Input 
                              type="date" 
                              value={customGstStart} 
                              onChange={(e) => setCustomGstStart(e.target.value)}
                              className="h-9"
                            />
                          </div>
                          <div>
                            <Label className="text-xs">To</Label>
                            <Input 
                              type="date" 
                              value={customGstEnd} 
                              onChange={(e) => setCustomGstEnd(e.target.value)}
                              className="h-9"
                            />
                          </div>
                        </div>
                      )}
                    </div>
                  )}

                  {report.hasCustomerSelect && (
                    <Select value={selectedCustomer} onValueChange={setSelectedCustomer}>
                      <SelectTrigger className="w-full">
                        <Users className="h-4 w-4 mr-2" />
                        <SelectValue placeholder="All Customers" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All Customers</SelectItem>
                        {customers.map((customer) => (
                          <SelectItem key={customer.id} value={customer.id}>
                            {customer.full_name || customer.email}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  )}

                  <Button 
                    onClick={report.action} 
                    disabled={isGenerating}
                    className="w-full"
                  >
                    {isGenerating ? (
                      <>
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        Generating...
                      </>
                    ) : (
                      <>
                        <Download className="h-4 w-4 mr-2" />
                        Download Report
                      </>
                    )}
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="quick" className="mt-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {reportCards.filter(r => r.quick).map((report, index) => (
              <Card key={index} className={`${report.borderColor} hover:shadow-md transition-shadow`}>
                <CardHeader className="pb-3">
                  <div className={`p-2 rounded-lg ${report.bgColor} w-fit`}>
                    <report.icon className={`h-5 w-5 ${report.color}`} />
                  </div>
                  <CardTitle className="text-lg mt-3">{report.title}</CardTitle>
                  <CardDescription>{report.description}</CardDescription>
                </CardHeader>
                <CardContent>
                  <Button 
                    onClick={report.action} 
                    disabled={isGenerating}
                    className="w-full"
                  >
                    {isGenerating ? (
                      <>
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        Generating...
                      </>
                    ) : (
                      <>
                        <Download className="h-4 w-4 mr-2" />
                        Download
                      </>
                    )}
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="financial" className="mt-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {reportCards.filter(r => ["Sales Report", "GST Report"].includes(r.title)).map((report, index) => (
              <Card key={index} className={`${report.borderColor} hover:shadow-md transition-shadow`}>
                <CardHeader className="pb-3">
                  <div className={`p-2 rounded-lg ${report.bgColor} w-fit`}>
                    <report.icon className={`h-5 w-5 ${report.color}`} />
                  </div>
                  <CardTitle className="text-lg mt-3">{report.title}</CardTitle>
                  <CardDescription>{report.description}</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  {report.hasDateRange && (
                    <div className="space-y-3">
                      <Select value={report.dateRangeState} onValueChange={report.setDateRange}>
                        <SelectTrigger className="w-full">
                          <Calendar className="h-4 w-4 mr-2" />
                          <SelectValue placeholder="Select period" />
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
                      {report.dateRangeState === "custom" && (
                        <div className="grid grid-cols-2 gap-2">
                          <div>
                            <Label className="text-xs">From</Label>
                            <Input 
                              type="date" 
                              value={report.customStart} 
                              onChange={(e) => report.setCustomStart?.(e.target.value)}
                              className="h-9"
                            />
                          </div>
                          <div>
                            <Label className="text-xs">To</Label>
                            <Input 
                              type="date" 
                              value={report.customEnd} 
                              onChange={(e) => report.setCustomEnd?.(e.target.value)}
                              className="h-9"
                            />
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                  {report.hasGstDateRange && (
                    <div className="space-y-3">
                      <Select value={gstDateRange} onValueChange={setGstDateRange}>
                        <SelectTrigger className="w-full">
                          <Calendar className="h-4 w-4 mr-2" />
                          <SelectValue placeholder="Select period" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="this_month">This Month</SelectItem>
                          <SelectItem value="last_month">Last Month</SelectItem>
                          <SelectItem value="last_3_months">Last 3 Months</SelectItem>
                          <SelectItem value="this_year">This Year</SelectItem>
                          <SelectItem value="custom">Custom Range</SelectItem>
                        </SelectContent>
                      </Select>
                      {gstDateRange === "custom" && (
                        <div className="grid grid-cols-2 gap-2">
                          <div>
                            <Label className="text-xs">From</Label>
                            <Input 
                              type="date" 
                              value={customGstStart} 
                              onChange={(e) => setCustomGstStart(e.target.value)}
                              className="h-9"
                            />
                          </div>
                          <div>
                            <Label className="text-xs">To</Label>
                            <Input 
                              type="date" 
                              value={customGstEnd} 
                              onChange={(e) => setCustomGstEnd(e.target.value)}
                              className="h-9"
                            />
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                  <Button 
                    onClick={report.action} 
                    disabled={isGenerating}
                    className="w-full"
                  >
                    {isGenerating ? (
                      <>
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        Generating...
                      </>
                    ) : (
                      <>
                        <Download className="h-4 w-4 mr-2" />
                        Download Report
                      </>
                    )}
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="inventory" className="mt-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {reportCards.filter(r => ["Raw Materials", "Product Inventory"].includes(r.title)).map((report, index) => (
              <Card key={index} className={`${report.borderColor} hover:shadow-md transition-shadow`}>
                <CardHeader className="pb-3">
                  <div className={`p-2 rounded-lg ${report.bgColor} w-fit`}>
                    <report.icon className={`h-5 w-5 ${report.color}`} />
                  </div>
                  <CardTitle className="text-lg mt-3">{report.title}</CardTitle>
                  <CardDescription>{report.description}</CardDescription>
                </CardHeader>
                <CardContent>
                  <Button 
                    onClick={report.action} 
                    disabled={isGenerating}
                    className="w-full"
                  >
                    {isGenerating ? (
                      <>
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        Generating...
                      </>
                    ) : (
                      <>
                        <Download className="h-4 w-4 mr-2" />
                        Download Report
                      </>
                    )}
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
