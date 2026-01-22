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

  const downloadReport = () => {
    const doc = new jsPDF();
    
    doc.setFontSize(20);
    doc.setFont("helvetica", "bold");
    doc.text("Salary Report", 105, 20, { align: "center" });
    
    doc.setFontSize(12);
    doc.setFont("helvetica", "normal");
    doc.text(`${selectedMonth} ${selectedYear}`, 105, 30, { align: "center" });
    doc.text(`Generated: ${format(new Date(), "MMM d, yyyy")}`, 105, 38, { align: "center" });
    
    // Summary
    doc.setFontSize(14);
    doc.setFont("helvetica", "bold");
    doc.text("Summary", 20, 55);
    doc.line(20, 58, 190, 58);
    
    doc.setFontSize(10);
    doc.setFont("helvetica", "normal");
    doc.text(`Total Employees: ${stats.totalEmployees}`, 20, 68);
    doc.text(`Monthly Salary Budget: ${formatCurrency(stats.totalMonthlySalary)}`, 20, 76);
    doc.text(`Total Paid: ${formatCurrency(stats.totalPaid)}`, 120, 68);
    doc.text(`Total Pending: ${formatCurrency(stats.totalPending)}`, 120, 76);
    
    // Employee Salaries
    doc.setFontSize(14);
    doc.setFont("helvetica", "bold");
    doc.text("Employee Salaries", 20, 95);
    doc.line(20, 98, 190, 98);
    
    let yPos = 108;
    doc.setFontSize(9);
    doc.setFont("helvetica", "bold");
    doc.text("Employee", 20, yPos);
    doc.text("Department", 80, yPos);
    doc.text("Salary", 140, yPos);
    doc.text("Type", 170, yPos);
    
    doc.setFont("helvetica", "normal");
    salaries.forEach((sal, index) => {
      yPos = 116 + (index * 8);
      if (yPos > 270) {
        doc.addPage();
        yPos = 20;
      }
      doc.text(sal.employee?.employee_name || "N/A", 20, yPos);
      doc.text(sal.employee?.department || "-", 80, yPos);
      doc.text(formatCurrency(sal.salary_amount), 140, yPos);
      doc.text(sal.salary_type, 170, yPos);
    });
    
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
