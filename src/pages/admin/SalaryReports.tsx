import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useToast } from "@/hooks/use-toast";
import { usePermissions } from "@/hooks/useEmployeePermissions";
import { AccessDeniedBanner } from "@/components/admin/AccessDeniedBanner";
import { Loader2, TrendingUp, Users, DollarSign, Calendar, RefreshCw, Download, PieChart } from "lucide-react";
import { format } from "date-fns";
import jsPDF from "jspdf";

interface Employee {
  id: string;
  employee_name: string;
  department: string | null;
  designation: string | null;
}

interface SalaryInfo {
  id: string;
  employee_id: string;
  salary_amount: number;
  salary_type: string;
  employee?: Employee;
}

interface SalaryPayment {
  id: string;
  employee_id: string;
  amount: number;
  payment_period: string;
  status: "pending" | "paid" | "on_hold";
  payment_date: string | null;
  payment_method: string | null;
  employee?: Employee;
}

const apiCall = async (endpoint: string, options: RequestInit = {}) => {
  const session = await supabase.auth.getSession();
  const token = session.data.session?.access_token;
  
  const response = await fetch(
    `${import.meta.env.VITE_SUPABASE_URL}/rest/v1/${endpoint}`,
    {
      ...options,
      headers: {
        'apikey': import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY,
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
        ...options.headers,
      },
    }
  );
  
  if (!response.ok) {
    const error = await response.json().catch(() => ({ message: 'Request failed' }));
    throw new Error(error.message || 'Request failed');
  }
  
  if (response.status === 204) return null;
  return response.json();
};

const months = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December"
];

const currentYear = new Date().getFullYear();
const years = [currentYear - 1, currentYear, currentYear + 1];

const statusConfig: Record<string, { label: string; variant: "default" | "secondary" | "destructive" | "outline" }> = {
  pending: { label: "Pending", variant: "outline" },
  paid: { label: "Paid", variant: "default" },
  on_hold: { label: "On Hold", variant: "destructive" },
};

export default function SalaryReports() {
  const { toast } = useToast();
  const { isSuperAdmin, hasPermission } = usePermissions();
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [salaries, setSalaries] = useState<SalaryInfo[]>([]);
  const [payments, setPayments] = useState<SalaryPayment[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedMonth, setSelectedMonth] = useState(months[new Date().getMonth()]);
  const [selectedYear, setSelectedYear] = useState(currentYear);

  const canView = isSuperAdmin || hasPermission("view_salary_info") || hasPermission("view_accounting");

  const fetchData = async () => {
    if (!canView) return;
    
    setIsLoading(true);
    try {
      const [emps, sals, pays] = await Promise.all([
        apiCall("employees?is_active=eq.true&select=id,employee_name,department,designation"),
        apiCall("employee_salary?select=*"),
        apiCall("salary_payments?select=*&order=created_at.desc"),
      ]);
      
      setEmployees(emps || []);
      
      // Enrich salaries with employee info
      const enrichedSalaries = (sals || []).map((sal: SalaryInfo) => ({
        ...sal,
        employee: emps?.find((e: Employee) => e.id === sal.employee_id),
      }));
      setSalaries(enrichedSalaries);
      
      // Enrich payments with employee info
      const enrichedPayments = (pays || []).map((pay: SalaryPayment) => ({
        ...pay,
        employee: emps?.find((e: Employee) => e.id === pay.employee_id),
      }));
      setPayments(enrichedPayments);
    } catch (error: any) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [canView]);

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: "INR",
      maximumFractionDigits: 0,
    }).format(amount);
  };

  // Calculate statistics
  const stats = {
    totalEmployees: employees.length,
    totalMonthlySalary: salaries.reduce((sum, s) => sum + (s.salary_amount || 0), 0),
    totalPaid: payments.filter(p => p.status === "paid").reduce((sum, p) => sum + p.amount, 0),
    totalPending: payments.filter(p => p.status === "pending").reduce((sum, p) => sum + p.amount, 0),
    paidCount: payments.filter(p => p.status === "paid").length,
    pendingCount: payments.filter(p => p.status === "pending").length,
  };

  // Filter payments by selected period
  const filteredPayments = payments.filter(p => {
    const period = `${selectedMonth} ${selectedYear}`;
    return p.payment_period === period;
  });

  const downloadReport = async () => {
    const doc = new jsPDF();
    
    const pageWidth = doc.internal.pageSize.getWidth();
    const margin = 15;
    let y = 12;

    // Colors
    const primaryColor: [number, number, number] = [234, 171, 28]; // Brand gold #EAAB1C
    const textDark: [number, number, number] = [33, 33, 33];
    const textGray: [number, number, number] = [102, 102, 102];
    const successColor: [number, number, number] = [76, 175, 80];
    const borderColor: [number, number, number] = [220, 220, 220];

    // Company settings
    const companySettings = {
      business_name: "Decouverts",
      business_address: "Innovation Hub, Tech Park",
      business_city: "Pune",
      business_state: "Maharashtra",
      business_pincode: "411001",
      business_phone: "+91 98765 43210",
      business_email: "info@decouverts.com",
      business_gstin: "27XXXXX1234X1ZX",
    };

    // Header background
    doc.setFillColor(250, 250, 250);
    doc.rect(0, 0, pageWidth, 45, "F");

    // Try to load logo
    try {
      const logoUrl = `${import.meta.env.VITE_SUPABASE_URL}/storage/v1/object/public/customer-partner-images/email-logo.png`;
      const response = await fetch(logoUrl);
      if (response.ok) {
        const blob = await response.blob();
        const reader = new FileReader();
        await new Promise((resolve) => {
          reader.onload = () => {
            try {
              const logoBase64 = reader.result as string;
              doc.addImage(logoBase64, 'PNG', margin, y, 35, 18);
            } catch (e) {
              console.error("Failed to add logo:", e);
            }
            resolve(true);
          };
          reader.readAsDataURL(blob);
        });
      }
    } catch (e) {
      console.error("Logo fetch error:", e);
    }

    // Report Badge - Top Right
    const badgeWidth = 55;
    const badgeHeight = 18;
    const badgeX = pageWidth - margin - badgeWidth;
    const badgeY = y;
    doc.setFillColor(primaryColor[0], primaryColor[1], primaryColor[2]);
    doc.roundedRect(badgeX, badgeY, badgeWidth, badgeHeight, 3, 3, "F");
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(11);
    doc.setFont("helvetica", "bold");
    doc.text("SALARY REPORT", badgeX + badgeWidth / 2, badgeY + 8, { align: "center" });
    doc.setFontSize(7);
    doc.setFont("helvetica", "normal");
    doc.text(`${selectedMonth} ${selectedYear}`, badgeX + badgeWidth / 2, badgeY + 14, { align: "center" });

    // Company Name
    const companyNameY = y + 22;
    doc.setFontSize(18);
    doc.setTextColor(...primaryColor);
    doc.setFont("helvetica", "bold");
    doc.text(companySettings.business_name, margin, companyNameY);

    // Tagline
    doc.setFontSize(8);
    doc.setTextColor(...textGray);
    doc.setFont("helvetica", "italic");
    doc.text("Discovering Future Technologies", margin, companyNameY + 5);

    y = 50;

    // Company details row
    doc.setFontSize(8);
    doc.setTextColor(...textGray);
    doc.setFont("helvetica", "normal");
    doc.text(`${companySettings.business_address}, ${companySettings.business_city}, ${companySettings.business_state} - ${companySettings.business_pincode}`, margin, y);
    y += 4;
    doc.text(`Phone: ${companySettings.business_phone} | Email: ${companySettings.business_email} | GSTIN: ${companySettings.business_gstin}`, margin, y);
    y += 4;

    // Generated date - right
    doc.text(`Generated: ${format(new Date(), "dd MMM yyyy, HH:mm")}`, pageWidth - margin, y, { align: "right" });

    y += 8;

    // Separator
    doc.setDrawColor(...primaryColor);
    doc.setLineWidth(0.8);
    doc.line(margin, y, pageWidth - margin, y);

    y += 10;

    // Summary Section
    doc.setFillColor(248, 248, 248);
    doc.rect(margin, y, pageWidth - 2 * margin, 6, "F");
    doc.setFontSize(10);
    doc.setTextColor(...primaryColor);
    doc.setFont("helvetica", "bold");
    doc.text("SUMMARY", margin + 3, y + 4);

    y += 12;

    const colWidth = (pageWidth - 2 * margin) / 4;
    const summaryItems = [
      { label: "Total Employees", value: String(stats.totalEmployees) },
      { label: "Monthly Budget", value: formatCurrency(stats.totalMonthlySalary) },
      { label: "Total Paid", value: formatCurrency(stats.totalPaid) },
      { label: "Total Pending", value: formatCurrency(stats.totalPending) },
    ];

    doc.setFontSize(8);
    summaryItems.forEach((item, i) => {
      const x = margin + i * colWidth;
      doc.setTextColor(...textGray);
      doc.setFont("helvetica", "normal");
      doc.text(item.label, x, y);
      doc.setTextColor(...textDark);
      doc.setFont("helvetica", "bold");
      doc.text(item.value, x, y + 5);
    });

    y += 18;

    // Employee Salaries Table
    doc.setFillColor(248, 248, 248);
    doc.rect(margin, y, pageWidth - 2 * margin, 6, "F");
    doc.setFontSize(10);
    doc.setTextColor(...primaryColor);
    doc.setFont("helvetica", "bold");
    doc.text("EMPLOYEE SALARIES", margin + 3, y + 4);

    y += 10;

    // Table Header
    const tableColWidths = [55, 40, 40, 30];
    const tableHeaders = ["Employee", "Department", "Salary", "Type"];
    
    doc.setFillColor(primaryColor[0], primaryColor[1], primaryColor[2]);
    doc.rect(margin, y, pageWidth - 2 * margin, 8, "F");
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(8);
    doc.setFont("helvetica", "bold");
    
    let xPos = margin + 3;
    tableHeaders.forEach((header, i) => {
      doc.text(header, xPos, y + 5.5);
      xPos += tableColWidths[i];
    });

    y += 10;

    // Table Rows
    doc.setFont("helvetica", "normal");
    salaries.forEach((sal, index) => {
      if (y > 270) {
        doc.addPage();
        y = 20;
      }
      
      // Alternating row background
      if (index % 2 === 0) {
        doc.setFillColor(250, 250, 250);
        doc.rect(margin, y - 2, pageWidth - 2 * margin, 7, "F");
      }
      
      doc.setTextColor(...textDark);
      xPos = margin + 3;
      doc.text((sal.employee?.employee_name || "N/A").substring(0, 25), xPos, y + 3);
      xPos += tableColWidths[0];
      doc.text((sal.employee?.department || "-").substring(0, 18), xPos, y + 3);
      xPos += tableColWidths[1];
      doc.text(formatCurrency(sal.salary_amount), xPos, y + 3);
      xPos += tableColWidths[2];
      doc.text(sal.salary_type || "Monthly", xPos, y + 3);
      
      y += 7;
    });

    // Footer
    doc.setDrawColor(...borderColor);
    doc.line(margin, 280, pageWidth - margin, 280);
    doc.setFontSize(8);
    doc.setTextColor(...textGray);
    doc.text(`${companySettings.business_name} | ${companySettings.business_phone} | ${companySettings.business_email}`, pageWidth / 2, 286, { align: "center" });
    
    doc.save(`Salary_Report_${selectedMonth}_${selectedYear}.pdf`);
  };

  if (!canView) {
    return <AccessDeniedBanner />;
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold">Salary Reports</h1>
          <p className="text-muted-foreground">View salary data and payment status</p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" onClick={fetchData} disabled={isLoading}>
            <RefreshCw className={`h-4 w-4 mr-2 ${isLoading ? "animate-spin" : ""}`} />
            Refresh
          </Button>
          <Button onClick={downloadReport}>
            <Download className="h-4 w-4 mr-2" />
            Export Report
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center gap-2">
              <Users className="h-5 w-5 text-blue-500" />
              <div>
                <p className="text-2xl font-bold">{stats.totalEmployees}</p>
                <p className="text-xs text-muted-foreground">Employees</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5 text-purple-500" />
              <div>
                <p className="text-2xl font-bold">{formatCurrency(stats.totalMonthlySalary)}</p>
                <p className="text-xs text-muted-foreground">Monthly Budget</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center gap-2">
              <DollarSign className="h-5 w-5 text-green-500" />
              <div>
                <p className="text-2xl font-bold">{formatCurrency(stats.totalPaid)}</p>
                <p className="text-xs text-muted-foreground">Total Paid ({stats.paidCount})</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center gap-2">
              <Calendar className="h-5 w-5 text-yellow-500" />
              <div>
                <p className="text-2xl font-bold">{formatCurrency(stats.totalPending)}</p>
                <p className="text-xs text-muted-foreground">Pending ({stats.pendingCount})</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Employee Salaries Table */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <PieChart className="h-5 w-5" />
            Employee Salary Structure
          </CardTitle>
          <CardDescription>Current salary configuration for all active employees</CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-8 w-8 animate-spin" />
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Employee</TableHead>
                  <TableHead>Department</TableHead>
                  <TableHead>Designation</TableHead>
                  <TableHead>Salary</TableHead>
                  <TableHead>Type</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {salaries.map((sal) => (
                  <TableRow key={sal.id}>
                    <TableCell className="font-medium">{sal.employee?.employee_name || "Unknown"}</TableCell>
                    <TableCell>{sal.employee?.department || "-"}</TableCell>
                    <TableCell>{sal.employee?.designation || "-"}</TableCell>
                    <TableCell className="font-bold">{formatCurrency(sal.salary_amount)}</TableCell>
                    <TableCell>
                      <Badge variant="outline">{sal.salary_type}</Badge>
                    </TableCell>
                  </TableRow>
                ))}
                {salaries.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={5} className="text-center text-muted-foreground py-8">
                      No salary data configured
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Payment History */}
      <Card>
        <CardHeader>
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <div>
              <CardTitle>Payment History</CardTitle>
              <CardDescription>Track salary payments by period</CardDescription>
            </div>
            <div className="flex items-center gap-2">
              <Select value={selectedMonth} onValueChange={setSelectedMonth}>
                <SelectTrigger className="w-32">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {months.map((month) => (
                    <SelectItem key={month} value={month}>{month}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Select value={String(selectedYear)} onValueChange={(v) => setSelectedYear(parseInt(v))}>
                <SelectTrigger className="w-24">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {years.map((year) => (
                    <SelectItem key={year} value={String(year)}>{year}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-8 w-8 animate-spin" />
            </div>
          ) : filteredPayments.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              No payments found for {selectedMonth} {selectedYear}
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Employee</TableHead>
                  <TableHead>Amount</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Payment Date</TableHead>
                  <TableHead>Method</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredPayments.map((pay) => (
                  <TableRow key={pay.id}>
                    <TableCell>
                      <div>
                        <p className="font-medium">{pay.employee?.employee_name || "Unknown"}</p>
                        <p className="text-xs text-muted-foreground">{pay.employee?.department}</p>
                      </div>
                    </TableCell>
                    <TableCell className="font-bold">{formatCurrency(pay.amount)}</TableCell>
                    <TableCell>
                      <Badge variant={statusConfig[pay.status]?.variant}>
                        {statusConfig[pay.status]?.label}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      {pay.payment_date ? format(new Date(pay.payment_date), "MMM d, yyyy") : "-"}
                    </TableCell>
                    <TableCell>{pay.payment_method || "-"}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
