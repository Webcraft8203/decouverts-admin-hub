import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { useToast } from "@/hooks/use-toast";
import { Loader2, Save, CreditCard, Wallet, Info } from "lucide-react";
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

interface EmployeeSelfServiceBankProps {
  employeeId: string;
}

export function EmployeeSelfServiceBank({ employeeId }: EmployeeSelfServiceBankProps) {
  const { toast } = useToast();
  const [bankInfo, setBankInfo] = useState<BankInfo | null>(null);
  const [salaryInfo, setSalaryInfo] = useState<SalaryInfo | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  
  // Bank form state
  const [bankName, setBankName] = useState("");
  const [accountNumber, setAccountNumber] = useState("");
  const [ifscCode, setIfscCode] = useState("");
  const [branchName, setBranchName] = useState("");

  const fetchData = async () => {
    setIsLoading(true);
    try {
      // Fetch bank info
      const { data: bank, error: bankError } = await supabase
        .from('employee_bank_info')
        .select('*')
        .eq('employee_id', employeeId);
      
      if (bankError) throw bankError;
      
      if (bank && bank.length > 0) {
        setBankInfo(bank[0]);
        setBankName(bank[0].bank_name || "");
        setIfscCode(bank[0].ifsc_code || "");
        setBranchName(bank[0].branch_name || "");
      }
      
      // Fetch salary info
      const { data: salary, error: salaryError } = await supabase
        .from('employee_salary')
        .select('*')
        .eq('employee_id', employeeId);
      
      if (salaryError) throw salaryError;
      
      if (salary && salary.length > 0) {
        setSalaryInfo(salary[0]);
      }
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

  const handleSubmitBankUpdate = async () => {
    if (!bankName && !accountNumber && !ifscCode && !branchName) {
      toast({
        title: "Validation Error",
        description: "Please fill at least one field to update",
        variant: "destructive",
      });
      return;
    }

    setIsSaving(true);
    try {
      // Create update requests for HR approval
      const updates: any[] = [];
      const fields = [
        { field: 'bank_name', value: bankName, oldValue: bankInfo?.bank_name },
        { field: 'account_number', value: accountNumber, oldValue: bankInfo?.account_number_last_four ? `****${bankInfo.account_number_last_four}` : null },
        { field: 'ifsc_code', value: ifscCode, oldValue: bankInfo?.ifsc_code },
        { field: 'branch_name', value: branchName, oldValue: bankInfo?.branch_name },
      ];

      fields.forEach(({ field, value, oldValue }) => {
        if (value && value !== oldValue) {
          updates.push({
            employee_id: employeeId,
            field_name: `bank_${field}`,
            old_value: oldValue || null,
            new_value: value,
            status: 'pending',
          });
        }
      });

      if (updates.length === 0) {
        toast({
          title: "No Changes",
          description: "No changes were detected to submit.",
        });
        setIsEditing(false);
        return;
      }

      // Insert update requests using Supabase client
      const { error } = await supabase
        .from('employee_profile_updates')
        .insert(updates);

      if (error) throw error;

      toast({
        title: "Update Requests Submitted",
        description: `${updates.length} bank detail change(s) have been submitted for HR approval.`,
      });

      setAccountNumber("");
      setIsEditing(false);
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to submit update requests",
        variant: "destructive",
      });
    } finally {
      setIsSaving(false);
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
        <CardHeader className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <CardTitle className="flex items-center gap-2">
              <CreditCard className="h-5 w-5" />
              Bank Account Details
            </CardTitle>
            <CardDescription>Your bank account for salary disbursement</CardDescription>
          </div>
          {!isEditing && (
            <Button onClick={() => setIsEditing(true)}>
              Update Bank Details
            </Button>
          )}
        </CardHeader>
        <CardContent>
          {!isEditing ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
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
          ) : (
            <div className="space-y-4">
              <Alert>
                <Info className="h-4 w-4" />
                <AlertDescription>
                  Bank detail changes require HR approval. Enter only the fields you want to update.
                </AlertDescription>
              </Alert>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
              
              <div className="flex justify-end gap-2 pt-4 border-t">
                <Button 
                  variant="outline" 
                  onClick={() => {
                    setBankName(bankInfo?.bank_name || "");
                    setIfscCode(bankInfo?.ifsc_code || "");
                    setBranchName(bankInfo?.branch_name || "");
                    setAccountNumber("");
                    setIsEditing(false);
                  }} 
                  disabled={isSaving}
                >
                  Cancel
                </Button>
                <Button onClick={handleSubmitBankUpdate} disabled={isSaving}>
                  {isSaving ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Submitting...
                    </>
                  ) : (
                    <>
                      <Save className="h-4 w-4 mr-2" />
                      Submit for Approval
                    </>
                  )}
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Salary Information - View Only */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Wallet className="h-5 w-5" />
            Salary Information
          </CardTitle>
          <CardDescription>Your current salary details (view only)</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
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
          <p className="text-xs text-muted-foreground mt-4">
            Contact HR for any salary-related queries or corrections.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
