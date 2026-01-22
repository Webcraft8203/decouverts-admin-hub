import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { usePermissions } from "@/hooks/useEmployeePermissions";
import { AccessDeniedBanner } from "@/components/admin/AccessDeniedBanner";
import { Loader2, FileText, Download, Plus, RefreshCw, Building2, User } from "lucide-react";
import { format } from "date-fns";
import jsPDF from "jspdf";

interface Employee {
  id: string;
  employee_name: string;
  department: string | null;
  designation: string | null;
  date_of_joining: string | null;
}

interface Payslip {
  id: string;
  employee_id: string;
  payslip_month: string;
  payslip_year: number;
  basic_salary: number;
  deductions: number;
  bonuses: number;
  net_salary: number;
  working_days: number;
  present_days: number;
  leave_days: number;
  pdf_url: string | null;
  generated_at: string;
  employee?: Employee;
}

interface SalaryInfo {
  id: string;
  employee_id: string;
  salary_amount: number;
  salary_type: string;
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
        'Prefer': options.method === 'POST' ? 'return=representation' : 'return=minimal',
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

export default function Payslips() {
  const { toast } = useToast();
  const { isSuperAdmin, hasPermission } = usePermissions();
  const [payslips, setPayslips] = useState<Payslip[]>([]);
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [salaryInfo, setSalaryInfo] = useState<SalaryInfo[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [generateDialogOpen, setGenerateDialogOpen] = useState(false);
  const [selectedMonth, setSelectedMonth] = useState(months[new Date().getMonth()]);
  const [selectedYear, setSelectedYear] = useState(currentYear);
  const [selectedEmployee, setSelectedEmployee] = useState<string>("all");
  const [generating, setGenerating] = useState(false);
  const [generatingData, setGeneratingData] = useState({
    employee_id: "",
    month: months[new Date().getMonth()],
    year: currentYear,
    deductions: 0,
    bonuses: 0,
    working_days: 26,
    present_days: 26,
    leave_days: 0,
  });

  const canGenerate = isSuperAdmin || hasPermission("generate_payslips");
  const canView = isSuperAdmin || hasPermission("view_payslips") || hasPermission("generate_payslips");

  const fetchData = async () => {
    if (!canView) return;
    
    setIsLoading(true);
    try {
      const [slips, emps, salaries] = await Promise.all([
        apiCall(`employee_payslips?select=*&order=payslip_year.desc,payslip_month.desc`),
        apiCall("employees?is_active=eq.true&select=id,employee_name,department,designation,date_of_joining"),
        apiCall("employee_salary?select=*"),
      ]);
      
      // Map employee info to payslips
      const enrichedPayslips = (slips || []).map((slip: Payslip) => ({
        ...slip,
        employee: emps?.find((e: Employee) => e.id === slip.employee_id),
      }));
      
      setPayslips(enrichedPayslips);
      setEmployees(emps || []);
      setSalaryInfo(salaries || []);
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

  const handleGenerate = async () => {
    if (!generatingData.employee_id) {
      toast({ title: "Error", description: "Please select an employee", variant: "destructive" });
      return;
    }

    setGenerating(true);
    try {
      const salary = salaryInfo.find(s => s.employee_id === generatingData.employee_id);
      const basicSalary = salary?.salary_amount || 0;
      const netSalary = basicSalary + generatingData.bonuses - generatingData.deductions;

      const { data: { user } } = await supabase.auth.getUser();

      await apiCall("employee_payslips", {
        method: "POST",
        body: JSON.stringify({
          employee_id: generatingData.employee_id,
          payslip_month: generatingData.month,
          payslip_year: generatingData.year,
          basic_salary: basicSalary,
          deductions: generatingData.deductions,
          bonuses: generatingData.bonuses,
          net_salary: netSalary,
          working_days: generatingData.working_days,
          present_days: generatingData.present_days,
          leave_days: generatingData.leave_days,
          generated_by: user?.id,
        }),
      });

      toast({ title: "Success", description: "Payslip generated successfully" });
      setGenerateDialogOpen(false);
      setGeneratingData({
        employee_id: "",
        month: months[new Date().getMonth()],
        year: currentYear,
        deductions: 0,
        bonuses: 0,
        working_days: 26,
        present_days: 26,
        leave_days: 0,
      });
      fetchData();
    } catch (error: any) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    } finally {
      setGenerating(false);
    }
  };

  const downloadPayslip = (payslip: Payslip) => {
    const doc = new jsPDF();
    const employee = payslip.employee;

    // Header
    doc.setFontSize(20);
    doc.setFont("helvetica", "bold");
    doc.text("PAYSLIP", 105, 20, { align: "center" });

    doc.setFontSize(12);
    doc.setFont("helvetica", "normal");
    doc.text("Decouverts Plus", 105, 30, { align: "center" });

    // Period
    doc.setFontSize(14);
    doc.text(`${payslip.payslip_month} ${payslip.payslip_year}`, 105, 45, { align: "center" });

    // Employee Details
    doc.setFontSize(11);
    doc.text("Employee Details", 20, 65);
    doc.setDrawColor(200, 200, 200);
    doc.line(20, 68, 190, 68);

    doc.setFontSize(10);
    doc.text(`Name: ${employee?.employee_name || "N/A"}`, 20, 78);
    doc.text(`Department: ${employee?.department || "N/A"}`, 20, 86);
    doc.text(`Designation: ${employee?.designation || "N/A"}`, 120, 78);
    doc.text(`Date of Joining: ${employee?.date_of_joining ? format(new Date(employee.date_of_joining), "MMM d, yyyy") : "N/A"}`, 120, 86);

    // Attendance
    doc.setFontSize(11);
    doc.text("Attendance Summary", 20, 105);
    doc.line(20, 108, 190, 108);

    doc.setFontSize(10);
    doc.text(`Working Days: ${payslip.working_days}`, 20, 118);
    doc.text(`Present Days: ${payslip.present_days}`, 80, 118);
    doc.text(`Leave Days: ${payslip.leave_days}`, 140, 118);

    // Earnings & Deductions
    doc.setFontSize(11);
    doc.text("Earnings", 20, 138);
    doc.text("Deductions", 120, 138);
    doc.line(20, 141, 100, 141);
    doc.line(120, 141, 190, 141);

    doc.setFontSize(10);
    doc.text(`Basic Salary: ${formatCurrency(payslip.basic_salary)}`, 20, 151);
    doc.text(`Bonuses: ${formatCurrency(payslip.bonuses)}`, 20, 159);
    doc.text(`Deductions: ${formatCurrency(payslip.deductions)}`, 120, 151);

    // Total
    doc.setFontSize(12);
    doc.setFont("helvetica", "bold");
    doc.line(20, 175, 190, 175);
    doc.text(`Net Salary: ${formatCurrency(payslip.net_salary)}`, 20, 185);

    // Footer
    doc.setFontSize(8);
    doc.setFont("helvetica", "normal");
    doc.text("This is a computer-generated payslip and does not require a signature.", 105, 280, { align: "center" });
    doc.text(`Generated on: ${format(new Date(payslip.generated_at), "MMM d, yyyy")}`, 105, 286, { align: "center" });

    doc.save(`Payslip_${employee?.employee_name}_${payslip.payslip_month}_${payslip.payslip_year}.pdf`);
  };

  const filteredPayslips = payslips.filter(p => {
    const monthMatch = selectedMonth === "all" || p.payslip_month === selectedMonth;
    const yearMatch = p.payslip_year === selectedYear;
    const empMatch = selectedEmployee === "all" || p.employee_id === selectedEmployee;
    return monthMatch && yearMatch && empMatch;
  });

  if (!canView) {
    return <AccessDeniedBanner />;
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold">Payslip Management</h1>
          <p className="text-muted-foreground">Generate and download employee payslips</p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" onClick={fetchData} disabled={isLoading}>
            <RefreshCw className={`h-4 w-4 mr-2 ${isLoading ? "animate-spin" : ""}`} />
            Refresh
          </Button>
          {canGenerate && (
            <Dialog open={generateDialogOpen} onOpenChange={setGenerateDialogOpen}>
              <DialogTrigger asChild>
                <Button>
                  <Plus className="h-4 w-4 mr-2" />
                  Generate Payslip
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-md">
                <DialogHeader>
                  <DialogTitle>Generate Payslip</DialogTitle>
                </DialogHeader>
                <div className="space-y-4 py-4">
                  <div className="space-y-2">
                    <Label>Employee</Label>
                    <Select
                      value={generatingData.employee_id}
                      onValueChange={(v) => setGeneratingData(prev => ({ ...prev, employee_id: v }))}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select employee" />
                      </SelectTrigger>
                      <SelectContent>
                        {employees.map((emp) => (
                          <SelectItem key={emp.id} value={emp.id}>
                            {emp.employee_name} - {emp.department}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>Month</Label>
                      <Select
                        value={generatingData.month}
                        onValueChange={(v) => setGeneratingData(prev => ({ ...prev, month: v }))}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {months.map((month) => (
                            <SelectItem key={month} value={month}>{month}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label>Year</Label>
                      <Select
                        value={String(generatingData.year)}
                        onValueChange={(v) => setGeneratingData(prev => ({ ...prev, year: parseInt(v) }))}
                      >
                        <SelectTrigger>
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
                  <div className="grid grid-cols-3 gap-4">
                    <div className="space-y-2">
                      <Label>Working Days</Label>
                      <Input
                        type="number"
                        value={generatingData.working_days}
                        onChange={(e) => setGeneratingData(prev => ({ ...prev, working_days: parseInt(e.target.value) || 0 }))}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Present Days</Label>
                      <Input
                        type="number"
                        value={generatingData.present_days}
                        onChange={(e) => setGeneratingData(prev => ({ ...prev, present_days: parseInt(e.target.value) || 0 }))}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Leave Days</Label>
                      <Input
                        type="number"
                        value={generatingData.leave_days}
                        onChange={(e) => setGeneratingData(prev => ({ ...prev, leave_days: parseInt(e.target.value) || 0 }))}
                      />
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>Bonuses (₹)</Label>
                      <Input
                        type="number"
                        value={generatingData.bonuses}
                        onChange={(e) => setGeneratingData(prev => ({ ...prev, bonuses: parseFloat(e.target.value) || 0 }))}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Deductions (₹)</Label>
                      <Input
                        type="number"
                        value={generatingData.deductions}
                        onChange={(e) => setGeneratingData(prev => ({ ...prev, deductions: parseFloat(e.target.value) || 0 }))}
                      />
                    </div>
                  </div>
                  <Button onClick={handleGenerate} className="w-full" disabled={generating}>
                    {generating ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <FileText className="h-4 w-4 mr-2" />}
                    Generate Payslip
                  </Button>
                </div>
              </DialogContent>
            </Dialog>
          )}
        </div>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle>Filters</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-4">
            <div className="space-y-2">
              <Label>Month</Label>
              <Select value={selectedMonth} onValueChange={setSelectedMonth}>
                <SelectTrigger className="w-40">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Months</SelectItem>
                  {months.map((month) => (
                    <SelectItem key={month} value={month}>{month}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Year</Label>
              <Select value={String(selectedYear)} onValueChange={(v) => setSelectedYear(parseInt(v))}>
                <SelectTrigger className="w-32">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {years.map((year) => (
                    <SelectItem key={year} value={String(year)}>{year}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Employee</Label>
              <Select value={selectedEmployee} onValueChange={setSelectedEmployee}>
                <SelectTrigger className="w-48">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Employees</SelectItem>
                  {employees.map((emp) => (
                    <SelectItem key={emp.id} value={emp.id}>{emp.employee_name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Payslips Table */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            Payslips ({filteredPayslips.length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-8 w-8 animate-spin" />
            </div>
          ) : filteredPayslips.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              No payslips found for the selected criteria
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Employee</TableHead>
                  <TableHead>Period</TableHead>
                  <TableHead>Basic Salary</TableHead>
                  <TableHead>Bonuses</TableHead>
                  <TableHead>Deductions</TableHead>
                  <TableHead>Net Salary</TableHead>
                  <TableHead>Generated</TableHead>
                  <TableHead>Action</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredPayslips.map((slip) => (
                  <TableRow key={slip.id}>
                    <TableCell>
                      <div>
                        <p className="font-medium">{slip.employee?.employee_name || "Unknown"}</p>
                        <p className="text-xs text-muted-foreground">{slip.employee?.department}</p>
                      </div>
                    </TableCell>
                    <TableCell>{slip.payslip_month} {slip.payslip_year}</TableCell>
                    <TableCell>{formatCurrency(slip.basic_salary)}</TableCell>
                    <TableCell className="text-green-600">+{formatCurrency(slip.bonuses)}</TableCell>
                    <TableCell className="text-red-600">-{formatCurrency(slip.deductions)}</TableCell>
                    <TableCell className="font-bold">{formatCurrency(slip.net_salary)}</TableCell>
                    <TableCell>{format(new Date(slip.generated_at), "MMM d, yyyy")}</TableCell>
                    <TableCell>
                      <Button size="sm" variant="outline" onClick={() => downloadPayslip(slip)}>
                        <Download className="h-4 w-4 mr-2" />
                        Download
                      </Button>
                    </TableCell>
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
