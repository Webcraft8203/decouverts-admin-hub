import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useToast } from "@/hooks/use-toast";
import { Loader2, Save, CreditCard, Wallet, Plus, Calendar, IndianRupee } from "lucide-react";
import { format } from "date-fns";

interface BankInfo {
  id: string;
  bank_name: string | null;
  account_number_last_four: string | null;
  ifsc_code: string | null;
  branch_name: string | null;
}

interface SalaryInfo {
  id: string;
  salary_amount: number | null;
  salary_type: string;
  effective_from: string | null;
}

interface SalaryPayment {
  id: string;
  payment_period: string;
  amount: number;
  status: string;
  payment_date: string | null;
  payment_method: string | null;
  notes: string | null;
  created_at: string;
}

interface EmployeeBankSalaryProps {
  employeeId: string;
  canManage: boolean;
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

export function EmployeeBankSalary({ employeeId, canManage }: EmployeeBankSalaryProps) {
  const { toast } = useToast();
  const [bankInfo, setBankInfo] = useState<BankInfo | null>(null);
  const [salaryInfo, setSalaryInfo] = useState<SalaryInfo | null>(null);
  const [payments, setPayments] = useState<SalaryPayment[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isPaymentDialogOpen, setIsPaymentDialogOpen] = useState(false);
  
  // Bank form state
  const [bankName, setBankName] = useState("");
  const [accountNumber, setAccountNumber] = useState("");
  const [ifscCode, setIfscCode] = useState("");
  const [branchName, setBranchName] = useState("");
  
  // Salary form state
  const [salaryAmount, setSalaryAmount] = useState("");
  const [salaryType, setSalaryType] = useState("monthly");
  const [effectiveFrom, setEffectiveFrom] = useState("");
  
  // Payment form state
  const [paymentPeriod, setPaymentPeriod] = useState("");
  const [paymentAmount, setPaymentAmount] = useState("");
  const [paymentMethod, setPaymentMethod] = useState("");
  const [paymentNotes, setPaymentNotes] = useState("");

  const fetchData = async () => {
    setIsLoading(true);
    try {
      // Fetch bank info
      const bank = await apiCall(`employee_bank_info?employee_id=eq.${employeeId}`);
      if (bank && bank.length > 0) {
        setBankInfo(bank[0]);
        setBankName(bank[0].bank_name || "");
        setIfscCode(bank[0].ifsc_code || "");
        setBranchName(bank[0].branch_name || "");
      }
      
      // Fetch salary info
      const salary = await apiCall(`employee_salary?employee_id=eq.${employeeId}`);
      if (salary && salary.length > 0) {
        setSalaryInfo(salary[0]);
        setSalaryAmount(salary[0].salary_amount?.toString() || "");
        setSalaryType(salary[0].salary_type || "monthly");
        setEffectiveFrom(salary[0].effective_from || "");
      }
      
      // Fetch payment history
      const paymentHistory = await apiCall(`salary_payments?employee_id=eq.${employeeId}&order=created_at.desc`);
      setPayments(paymentHistory || []);
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to fetch data",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [employeeId]);

  const handleSaveBankInfo = async () => {
    setIsSaving(true);
    try {
      const data = {
        employee_id: employeeId,
        bank_name: bankName || null,
        account_number_encrypted: accountNumber || null,
        account_number_last_four: accountNumber ? accountNumber.slice(-4) : null,
        ifsc_code: ifscCode || null,
        branch_name: branchName || null,
      };

      if (bankInfo) {
        await apiCall(`employee_bank_info?employee_id=eq.${employeeId}`, {
          method: 'PATCH',
          body: JSON.stringify(data),
        });
      } else {
        await apiCall('employee_bank_info', {
          method: 'POST',
          body: JSON.stringify(data),
        });
      }

      toast({
        title: "Bank Info Updated",
        description: "Bank details have been saved successfully.",
      });

      setAccountNumber("");
      fetchData();
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to save bank info",
        variant: "destructive",
      });
    } finally {
      setIsSaving(false);
    }
  };

  const handleSaveSalaryInfo = async () => {
    setIsSaving(true);
    try {
      const data = {
        employee_id: employeeId,
        salary_amount: salaryAmount ? parseFloat(salaryAmount) : null,
        salary_type: salaryType,
        effective_from: effectiveFrom || null,
      };

      if (salaryInfo) {
        await apiCall(`employee_salary?employee_id=eq.${employeeId}`, {
          method: 'PATCH',
          body: JSON.stringify(data),
        });
      } else {
        await apiCall('employee_salary', {
          method: 'POST',
          body: JSON.stringify(data),
        });
      }

      toast({
        title: "Salary Updated",
        description: "Salary information has been saved successfully.",
      });

      fetchData();
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to save salary info",
        variant: "destructive",
      });
    } finally {
      setIsSaving(false);
    }
  };

  const handleAddPayment = async () => {
    if (!paymentPeriod || !paymentAmount) {
      toast({
        title: "Validation Error",
        description: "Please fill in period and amount",
        variant: "destructive",
      });
      return;
    }

    setIsSaving(true);
    try {
      const session = await supabase.auth.getSession();
      await apiCall('salary_payments', {
        method: 'POST',
        body: JSON.stringify({
          employee_id: employeeId,
          payment_period: paymentPeriod,
          amount: parseFloat(paymentAmount),
          status: 'pending',
          payment_method: paymentMethod || null,
          notes: paymentNotes || null,
          processed_by: session.data.session?.user?.id,
        }),
      });

      toast({
        title: "Payment Added",
        description: "Salary payment record has been created.",
      });

      setIsPaymentDialogOpen(false);
      setPaymentPeriod("");
      setPaymentAmount("");
      setPaymentMethod("");
      setPaymentNotes("");
      fetchData();
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to add payment",
        variant: "destructive",
      });
    } finally {
      setIsSaving(false);
    }
  };

  const handleUpdatePaymentStatus = async (paymentId: string, status: string) => {
    try {
      await apiCall(`salary_payments?id=eq.${paymentId}`, {
        method: 'PATCH',
        body: JSON.stringify({
          status,
          payment_date: status === 'paid' ? new Date().toISOString().split('T')[0] : null,
        }),
      });

      toast({
        title: "Status Updated",
        description: `Payment marked as ${status}.`,
      });

      fetchData();
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to update status",
        variant: "destructive",
      });
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'paid':
        return <Badge className="bg-green-500">Paid</Badge>;
      case 'on_hold':
        return <Badge variant="secondary">On Hold</Badge>;
      default:
        return <Badge variant="outline">Pending</Badge>;
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0,
    }).format(amount);
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Bank Information */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CreditCard className="h-5 w-5" />
            Bank Account Details
          </CardTitle>
          <CardDescription>Employee's bank account for salary disbursement</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-6">
            <div>
              <p className="text-sm text-muted-foreground">Bank Name</p>
              <p className="font-medium">{bankInfo?.bank_name || "Not provided"}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Account Number</p>
              <p className="font-medium font-mono">
                {bankInfo?.account_number_last_four 
                  ? `XXXXXXXX${bankInfo.account_number_last_four}` 
                  : "Not provided"}
              </p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">IFSC Code</p>
              <p className="font-medium font-mono">{bankInfo?.ifsc_code || "Not provided"}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Branch</p>
              <p className="font-medium">{bankInfo?.branch_name || "Not provided"}</p>
            </div>
          </div>

          {canManage && (
            <div className="pt-6 border-t">
              <p className="text-sm font-medium mb-4">Update Bank Details</p>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="bankName">Bank Name</Label>
                  <Input
                    id="bankName"
                    value={bankName}
                    onChange={(e) => setBankName(e.target.value)}
                    placeholder="e.g., State Bank of India"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="accountNumber">Account Number</Label>
                  <Input
                    id="accountNumber"
                    value={accountNumber}
                    onChange={(e) => setAccountNumber(e.target.value)}
                    placeholder="Enter full account number"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="ifsc">IFSC Code</Label>
                  <Input
                    id="ifsc"
                    value={ifscCode}
                    onChange={(e) => setIfscCode(e.target.value.toUpperCase())}
                    placeholder="e.g., SBIN0001234"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="branch">Branch Name</Label>
                  <Input
                    id="branch"
                    value={branchName}
                    onChange={(e) => setBranchName(e.target.value)}
                    placeholder="e.g., Mumbai Main"
                  />
                </div>
              </div>
              <Button onClick={handleSaveBankInfo} className="mt-4" disabled={isSaving}>
                {isSaving ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Saving...
                  </>
                ) : (
                  <>
                    <Save className="h-4 w-4 mr-2" />
                    Save Bank Details
                  </>
                )}
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Salary Information */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Wallet className="h-5 w-5" />
            Salary Information
          </CardTitle>
          <CardDescription>Current salary structure and details</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
            <div>
              <p className="text-sm text-muted-foreground">Current Salary</p>
              <p className="text-2xl font-bold text-primary">
                {salaryInfo?.salary_amount 
                  ? formatCurrency(salaryInfo.salary_amount) 
                  : "Not set"}
              </p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Salary Type</p>
              <p className="font-medium capitalize">{salaryInfo?.salary_type || "Monthly"}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Effective From</p>
              <p className="font-medium">
                {salaryInfo?.effective_from 
                  ? format(new Date(salaryInfo.effective_from), "PPP") 
                  : "Not set"}
              </p>
            </div>
          </div>

          {canManage && (
            <div className="pt-6 border-t">
              <p className="text-sm font-medium mb-4">Update Salary</p>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="salaryAmount">Salary Amount (₹)</Label>
                  <Input
                    id="salaryAmount"
                    type="number"
                    value={salaryAmount}
                    onChange={(e) => setSalaryAmount(e.target.value)}
                    placeholder="e.g., 50000"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="salaryType">Salary Type</Label>
                  <Select value={salaryType} onValueChange={setSalaryType}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="monthly">Monthly</SelectItem>
                      <SelectItem value="hourly">Hourly</SelectItem>
                      <SelectItem value="contract">Contract</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="effectiveFrom">Effective From</Label>
                  <Input
                    id="effectiveFrom"
                    type="date"
                    value={effectiveFrom}
                    onChange={(e) => setEffectiveFrom(e.target.value)}
                  />
                </div>
              </div>
              <Button onClick={handleSaveSalaryInfo} className="mt-4" disabled={isSaving}>
                {isSaving ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Saving...
                  </>
                ) : (
                  <>
                    <Save className="h-4 w-4 mr-2" />
                    Update Salary
                  </>
                )}
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Payment History */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Calendar className="h-5 w-5" />
              Payment History
            </CardTitle>
            <CardDescription>Salary payment records and status</CardDescription>
          </div>
          {canManage && (
            <Dialog open={isPaymentDialogOpen} onOpenChange={setIsPaymentDialogOpen}>
              <DialogTrigger asChild>
                <Button>
                  <Plus className="h-4 w-4 mr-2" />
                  Add Payment
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Add Salary Payment</DialogTitle>
                  <DialogDescription>Create a new salary payment record</DialogDescription>
                </DialogHeader>
                <div className="space-y-4 py-4">
                  <div className="space-y-2">
                    <Label htmlFor="paymentPeriod">Payment Period</Label>
                    <Input
                      id="paymentPeriod"
                      value={paymentPeriod}
                      onChange={(e) => setPaymentPeriod(e.target.value)}
                      placeholder="e.g., January 2026"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="paymentAmount">Amount (₹)</Label>
                    <Input
                      id="paymentAmount"
                      type="number"
                      value={paymentAmount}
                      onChange={(e) => setPaymentAmount(e.target.value)}
                      placeholder="e.g., 50000"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="paymentMethod">Payment Method</Label>
                    <Select value={paymentMethod} onValueChange={setPaymentMethod}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select method" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="bank_transfer">Bank Transfer</SelectItem>
                        <SelectItem value="cash">Cash</SelectItem>
                        <SelectItem value="cheque">Cheque</SelectItem>
                        <SelectItem value="upi">UPI</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="paymentNotes">Notes (Optional)</Label>
                    <Textarea
                      id="paymentNotes"
                      value={paymentNotes}
                      onChange={(e) => setPaymentNotes(e.target.value)}
                      placeholder="Any additional notes..."
                      rows={2}
                    />
                  </div>
                  <div className="flex justify-end gap-2 pt-4">
                    <Button variant="outline" onClick={() => setIsPaymentDialogOpen(false)}>
                      Cancel
                    </Button>
                    <Button onClick={handleAddPayment} disabled={isSaving}>
                      {isSaving ? (
                        <>
                          <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                          Adding...
                        </>
                      ) : (
                        "Add Payment"
                      )}
                    </Button>
                  </div>
                </div>
              </DialogContent>
            </Dialog>
          )}
        </CardHeader>
        <CardContent>
          {payments.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <IndianRupee className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>No payment records yet</p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Period</TableHead>
                  <TableHead>Amount</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Method</TableHead>
                  <TableHead>Payment Date</TableHead>
                  {canManage && <TableHead className="text-right">Actions</TableHead>}
                </TableRow>
              </TableHeader>
              <TableBody>
                {payments.map((payment) => (
                  <TableRow key={payment.id}>
                    <TableCell className="font-medium">{payment.payment_period}</TableCell>
                    <TableCell>{formatCurrency(payment.amount)}</TableCell>
                    <TableCell>{getStatusBadge(payment.status)}</TableCell>
                    <TableCell className="capitalize">{payment.payment_method?.replace('_', ' ') || '-'}</TableCell>
                    <TableCell>
                      {payment.payment_date 
                        ? format(new Date(payment.payment_date), "PP") 
                        : '-'}
                    </TableCell>
                    {canManage && (
                      <TableCell className="text-right">
                        {payment.status === 'pending' && (
                          <div className="flex justify-end gap-2">
                            <Button 
                              size="sm" 
                              variant="outline"
                              onClick={() => handleUpdatePaymentStatus(payment.id, 'paid')}
                            >
                              Mark Paid
                            </Button>
                            <Button 
                              size="sm" 
                              variant="ghost"
                              onClick={() => handleUpdatePaymentStatus(payment.id, 'on_hold')}
                            >
                              Hold
                            </Button>
                          </div>
                        )}
                        {payment.status === 'on_hold' && (
                          <Button 
                            size="sm" 
                            variant="outline"
                            onClick={() => handleUpdatePaymentStatus(payment.id, 'paid')}
                          >
                            Mark Paid
                          </Button>
                        )}
                      </TableCell>
                    )}
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
