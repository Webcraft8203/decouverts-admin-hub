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
    const doc = new jsPDF({ orientation: "portrait", unit: "mm", format: "a4" });
    
    const pw = doc.internal.pageSize.getWidth();
    const ph = doc.internal.pageSize.getHeight();
    const M = 14;
    const CW = pw - 2 * M;
    let y = M;

    // ---- COLORS (matches invoice template) ----
    const C = {
      primary: [28, 28, 28] as [number, number, number],
      accent: [212, 175, 55] as [number, number, number],
      orange: [230, 126, 34] as [number, number, number],
      secondary: [68, 68, 68] as [number, number, number],
      muted: [130, 130, 130] as [number, number, number],
      light: [245, 245, 245] as [number, number, number],
      border: [218, 218, 218] as [number, number, number],
      white: [255, 255, 255] as [number, number, number],
      tableHeader: [28, 28, 28] as [number, number, number],
      tableAlt: [250, 250, 250] as [number, number, number],
    };

    const COMPANY = {
      name: "DECOUVERTES",
      tagline: "Discovering Future Technologies",
      address: "Megapolis Springs, Phase 3, Hinjawadi Rajiv Gandhi Infotech Park",
      city: "Pune",
      state: "Maharashtra",
      pincode: "411057",
      phone: "+91 9561103435",
      email: "hello@decouvertes.com",
      gstin: "27AAKCD1492N1Z4",
      pan: "AAKCD1492N",
      website: "www.decouvertes.com",
    };

    // ---- FOOTER helper ----
    const addFooter = (pageNum: number, total: number) => {
      const fy = ph - 10;
      doc.setDrawColor(...C.border);
      doc.setLineWidth(0.4);
      doc.line(M, fy - 5, pw - M, fy - 5);
      doc.setFontSize(6);
      doc.setTextColor(...C.muted);
      doc.setFont("helvetica", "normal");
      doc.text("This is a computer-generated document and does not require a signature.", M, fy - 1);
      doc.text(`Page ${pageNum} of ${total}`, pw - M, fy - 1, { align: "right" });
      doc.text(`Generated: ${new Date().toLocaleString("en-IN")} | ${COMPANY.website}`, pw / 2, fy + 3, { align: "center" });
    };

    const safeZone = ph - 16 - 4;
    const checkBreak = (h: number) => {
      if (y + h > safeZone) { doc.addPage(); y = M + 6; return true; }
      return false;
    };

    // ==================== 1. HEADER (matches invoice) ====================
    let logoBase64: string | null = null;
    try {
      const logoUrl = `${import.meta.env.VITE_SUPABASE_URL}/storage/v1/object/public/customer-partner-images/email-logo.png`;
      const response = await fetch(logoUrl);
      if (response.ok) {
        const blob = await response.blob();
        logoBase64 = await new Promise<string | null>((resolve) => {
          const reader = new FileReader();
          reader.onload = () => resolve(reader.result as string);
          reader.onerror = () => resolve(null);
          reader.readAsDataURL(blob);
        });
      }
    } catch (e) {
      console.error("Logo fetch error:", e);
    }

    if (logoBase64) {
      try { doc.addImage(logoBase64, "PNG", M, y, 24, 12); } catch { /* ignore */ }
    }

    const logoTextX = logoBase64 ? M + 28 : M;
    doc.setFontSize(20);
    doc.setTextColor(...C.primary);
    doc.setFont("helvetica", "bold");
    doc.text(COMPANY.name, logoTextX, y + 8);

    doc.setFontSize(8);
    doc.setTextColor(...C.orange);
    doc.setFont("helvetica", "italic");
    doc.text(COMPANY.tagline, logoTextX, y + 13);

    // Report badge — top right
    const badgeWidth = 58;
    const badgeX = pw - M - badgeWidth;
    doc.setFillColor(...C.accent);
    doc.roundedRect(badgeX, y, badgeWidth, 18, 2, 2, "F");
    doc.setFontSize(8);
    doc.setTextColor(...C.primary);
    doc.setFont("helvetica", "bold");
    doc.text("SALARY REPORT", badgeX + badgeWidth / 2, y + 7, { align: "center" });
    doc.setFontSize(7);
    doc.setFont("helvetica", "normal");
    doc.text(`${selectedMonth} ${selectedYear}`, badgeX + badgeWidth / 2, y + 13, { align: "center" });

    y += 17;

    // Company details
    doc.setFontSize(6.5);
    doc.setTextColor(...C.secondary);
    doc.setFont("helvetica", "normal");
    doc.text(`${COMPANY.address}, ${COMPANY.city}, ${COMPANY.state} - ${COMPANY.pincode}`, M, y);
    y += 3.5;
    doc.text(`Phone: ${COMPANY.phone}  |  Email: ${COMPANY.email}  |  GSTIN: ${COMPANY.gstin}  |  PAN: ${COMPANY.pan}`, M, y);
    y += 5;

    // Gold divider
    doc.setFillColor(...C.accent);
    doc.rect(M, y, CW, 1.5, "F");
    y += 5;

    // ==================== 2. TITLE ====================
    doc.setFontSize(14);
    doc.setTextColor(...C.primary);
    doc.setFont("helvetica", "bold");
    doc.text("Salary Report", M, y);
    y += 5;
    doc.setFontSize(8);
    doc.setTextColor(...C.muted);
    doc.setFont("helvetica", "normal");
    doc.text(`Employee salary data and payment status for ${selectedMonth} ${selectedYear}`, M, y);
    y += 10;

    // ==================== 3. SUMMARY STAT CARDS ====================
    const cardStats = [
      { label: "EMPLOYEES", value: String(stats.totalEmployees) },
      { label: "MONTHLY BUDGET", value: formatCurrency(stats.totalMonthlySalary) },
      { label: "TOTAL PAID", value: formatCurrency(stats.totalPaid) },
      { label: "PENDING", value: formatCurrency(stats.totalPending) },
    ];
    const cardW = (CW - 15) / 4;
    const cardH = 24;
    cardStats.forEach((stat, i) => {
      const x = M + i * (cardW + 5);
      doc.setFillColor(...C.light);
      doc.setDrawColor(...C.border);
      doc.setLineWidth(0.3);
      doc.roundedRect(x, y, cardW, cardH, 3, 3, "FD");
      // Gold top accent
      doc.setFillColor(...C.accent);
      doc.roundedRect(x, y, cardW, 3, 3, 3, "F");
      doc.setFillColor(...C.light);
      doc.rect(x, y + 2, cardW, 2, "F");

      doc.setFontSize(6);
      doc.setTextColor(...C.muted);
      doc.setFont("helvetica", "normal");
      doc.text(stat.label, x + cardW / 2, y + 11, { align: "center" });
      doc.setFontSize(10);
      doc.setTextColor(...C.primary);
      doc.setFont("helvetica", "bold");
      doc.text(stat.value, x + cardW / 2, y + 20, { align: "center" });
    });
    y += cardH + 8;

    // ==================== 4. EMPLOYEE SALARIES TABLE ====================
    doc.setFontSize(10);
    doc.setTextColor(...C.primary);
    doc.setFont("helvetica", "bold");
    doc.text("Employee Salary Structure", M, y);
    y += 6;

    const tableHeaders = ["Employee", "Department", "Designation", "Salary", "Type"];
    const colWidths = [50, 35, 35, 30, 32];
    const hdrH = 8;
    const rowH = 7;

    // Header
    doc.setFillColor(...C.tableHeader);
    doc.rect(M, y, CW, hdrH, "F");
    doc.setFontSize(6);
    doc.setTextColor(255, 255, 255);
    doc.setFont("helvetica", "bold");
    let cx = M + 3;
    tableHeaders.forEach((h, i) => {
      const align = i === 3 ? "right" : "left";
      if (align === "right") {
        doc.text(h, cx + colWidths[i] - 2, y + 5.5, { align: "right" });
      } else {
        doc.text(h, cx, y + 5.5);
      }
      cx += colWidths[i];
    });
    y += hdrH;

    // Rows
    salaries.forEach((sal, idx) => {
      checkBreak(rowH + 1);
      doc.setFillColor(...(idx % 2 === 0 ? C.white : C.tableAlt));
      doc.rect(M, y, CW, rowH, "F");
      doc.setDrawColor(...C.border);
      doc.setLineWidth(0.08);
      doc.line(M, y + rowH, M + CW, y + rowH);

      doc.setFontSize(6.5);
      cx = M + 3;
      // Employee name
      doc.setTextColor(...C.primary);
      doc.setFont("helvetica", "bold");
      doc.text((sal.employee?.employee_name || "N/A").substring(0, 25), cx, y + 5);
      cx += colWidths[0];
      // Department
      doc.setTextColor(...C.secondary);
      doc.setFont("helvetica", "normal");
      doc.text((sal.employee?.department || "-").substring(0, 18), cx, y + 5);
      cx += colWidths[1];
      // Designation
      doc.text((sal.employee?.designation || "-").substring(0, 18), cx, y + 5);
      cx += colWidths[2];
      // Salary (right-aligned)
      doc.setTextColor(...C.primary);
      doc.setFont("helvetica", "bold");
      doc.text(formatCurrency(sal.salary_amount), cx + colWidths[3] - 2, y + 5, { align: "right" });
      cx += colWidths[3];
      // Type
      doc.setTextColor(...C.accent);
      doc.setFont("helvetica", "bold");
      doc.text(sal.salary_type || "Monthly", cx, y + 5);

      y += rowH;
    });

    // Table bottom line
    doc.setDrawColor(...C.primary);
    doc.setLineWidth(0.5);
    doc.line(M, y, M + CW, y);
    y += 10;

    // ==================== 5. PAYMENT HISTORY TABLE ====================
    if (filteredPayments.length > 0) {
      checkBreak(30);
      doc.setFontSize(10);
      doc.setTextColor(...C.primary);
      doc.setFont("helvetica", "bold");
      doc.text(`Payment History — ${selectedMonth} ${selectedYear}`, M, y);
      y += 6;

      const payHeaders = ["Employee", "Department", "Amount", "Status", "Payment Date", "Method"];
      const payColWidths = [40, 30, 28, 22, 30, 32];

      doc.setFillColor(...C.tableHeader);
      doc.rect(M, y, CW, hdrH, "F");
      doc.setFontSize(6);
      doc.setTextColor(255, 255, 255);
      doc.setFont("helvetica", "bold");
      cx = M + 3;
      payHeaders.forEach((h, i) => {
        const align = i === 2 ? "right" : "left";
        if (align === "right") {
          doc.text(h, cx + payColWidths[i] - 2, y + 5.5, { align: "right" });
        } else {
          doc.text(h, cx, y + 5.5);
        }
        cx += payColWidths[i];
      });
      y += hdrH;

      filteredPayments.forEach((pay, idx) => {
        checkBreak(rowH + 1);
        doc.setFillColor(...(idx % 2 === 0 ? C.white : C.tableAlt));
        doc.rect(M, y, CW, rowH, "F");
        doc.setDrawColor(...C.border);
        doc.setLineWidth(0.08);
        doc.line(M, y + rowH, M + CW, y + rowH);

        doc.setFontSize(6.5);
        cx = M + 3;
        doc.setTextColor(...C.primary);
        doc.setFont("helvetica", "bold");
        doc.text((pay.employee?.employee_name || "Unknown").substring(0, 20), cx, y + 5);
        cx += payColWidths[0];
        doc.setTextColor(...C.secondary);
        doc.setFont("helvetica", "normal");
        doc.text((pay.employee?.department || "-").substring(0, 15), cx, y + 5);
        cx += payColWidths[1];
        doc.setTextColor(...C.primary);
        doc.setFont("helvetica", "bold");
        doc.text(formatCurrency(pay.amount), cx + payColWidths[2] - 2, y + 5, { align: "right" });
        cx += payColWidths[2];
        // Status with color
        const statusColor = pay.status === "paid" ? [34, 139, 34] as [number, number, number]
          : pay.status === "on_hold" ? [178, 34, 34] as [number, number, number]
          : [205, 133, 63] as [number, number, number];
        doc.setTextColor(...statusColor);
        doc.setFont("helvetica", "bold");
        doc.text(pay.status === "on_hold" ? "On Hold" : pay.status.charAt(0).toUpperCase() + pay.status.slice(1), cx, y + 5);
        cx += payColWidths[3];
        doc.setTextColor(...C.secondary);
        doc.setFont("helvetica", "normal");
        doc.text(pay.payment_date ? format(new Date(pay.payment_date), "MMM d, yyyy") : "-", cx, y + 5);
        cx += payColWidths[4];
        doc.text(pay.payment_method || "-", cx, y + 5);

        y += rowH;
      });

      doc.setDrawColor(...C.primary);
      doc.setLineWidth(0.5);
      doc.line(M, y, M + CW, y);
    }

    // ==================== FOOTERS ====================
    const pageCount = doc.getNumberOfPages();
    for (let i = 1; i <= pageCount; i++) {
      doc.setPage(i);
      addFooter(i, pageCount);
    }

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
