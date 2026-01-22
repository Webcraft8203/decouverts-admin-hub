import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { useEmployeeActivityLog } from "@/hooks/useEmployeeActivityLog";
import { 
  Loader2, 
  User, 
  FileText, 
  CreditCard, 
  ClipboardList,
  AlertCircle
} from "lucide-react";
import { EmployeeSelfServiceProfile } from "@/components/employee/EmployeeSelfServiceProfile";
import { EmployeeSelfServiceDocuments } from "@/components/employee/EmployeeSelfServiceDocuments";
import { EmployeeSelfServiceBank } from "@/components/employee/EmployeeSelfServiceBank";
import { EmployeePendingRequests } from "@/components/employee/EmployeePendingRequests";

interface EmployeeData {
  id: string;
  user_id: string | null;
  employee_name: string;
  employee_email: string;
  department: string | null;
  designation: string | null;
  is_active: boolean;
  created_at: string;
  phone_number: string | null;
  current_address: string | null;
  permanent_address: string | null;
  date_of_joining: string | null;
  emergency_contact_name: string | null;
  emergency_contact_number: string | null;
  date_of_birth: string | null;
  gender: string | null;
  blood_group: string | null;
}

export default function EmployeePortal() {
  const { user } = useAuth();
  const { toast } = useToast();
  const { logActivity } = useEmployeeActivityLog();
  
  const [employee, setEmployee] = useState<EmployeeData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("profile");

  // Log page view when employee data is loaded
  useEffect(() => {
    if (employee) {
      logActivity({
        actionType: "page_viewed",
        entityType: "profile",
        description: "Viewed Employee Self-Service Portal"
      });
    }
  }, [employee?.id]);

  const fetchEmployee = async () => {
    if (!user?.id) return;
    
    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from('employees')
        .select('*')
        .eq('user_id', user.id)
        .maybeSingle();
      
      if (error) throw error;
      setEmployee(data);
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to fetch employee data",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (user?.id) {
      fetchEmployee();
    }
  }, [user?.id]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!employee) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Card className="max-w-md">
          <CardContent className="pt-6 text-center">
            <AlertCircle className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
            <h2 className="text-xl font-semibold mb-2">No Employee Profile Found</h2>
            <p className="text-muted-foreground">
              Your account is not linked to an employee profile. Please contact HR for assistance.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!employee.is_active) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Card className="max-w-md">
          <CardContent className="pt-6 text-center">
            <AlertCircle className="h-12 w-12 mx-auto text-destructive mb-4" />
            <h2 className="text-xl font-semibold mb-2">Account Deactivated</h2>
            <p className="text-muted-foreground">
              Your employee account has been deactivated. Please contact HR for more information.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8 space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold">Employee Self-Service</h1>
          <p className="text-muted-foreground">
            Manage your profile, documents, and view pending requests
          </p>
        </div>
        <Badge variant="outline" className="w-fit">
          {employee.designation || "Employee"} {employee.department && `• ${employee.department}`}
        </Badge>
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-2 md:grid-cols-4 h-auto">
          <TabsTrigger value="profile" className="flex items-center gap-2 py-3">
            <User className="h-4 w-4" />
            <span className="hidden sm:inline">My Profile</span>
            <span className="sm:hidden">Profile</span>
          </TabsTrigger>
          <TabsTrigger value="documents" className="flex items-center gap-2 py-3">
            <FileText className="h-4 w-4" />
            <span className="hidden sm:inline">Documents</span>
            <span className="sm:hidden">Docs</span>
          </TabsTrigger>
          <TabsTrigger value="bank" className="flex items-center gap-2 py-3">
            <CreditCard className="h-4 w-4" />
            <span className="hidden sm:inline">Bank Details</span>
            <span className="sm:hidden">Bank</span>
          </TabsTrigger>
          <TabsTrigger value="requests" className="flex items-center gap-2 py-3">
            <ClipboardList className="h-4 w-4" />
            <span className="hidden sm:inline">Pending Requests</span>
            <span className="sm:hidden">Requests</span>
          </TabsTrigger>
        </TabsList>

        <TabsContent value="profile" className="mt-6">
          <EmployeeSelfServiceProfile 
            employee={employee} 
            onUpdate={fetchEmployee}
          />
        </TabsContent>

        <TabsContent value="documents" className="mt-6">
          <EmployeeSelfServiceDocuments 
            employeeId={employee.id}
          />
        </TabsContent>

        <TabsContent value="bank" className="mt-6">
          <EmployeeSelfServiceBank 
            employeeId={employee.id}
          />
        </TabsContent>

        <TabsContent value="requests" className="mt-6">
          <EmployeePendingRequests 
            employeeId={employee.id}
          />
        </TabsContent>
      </Tabs>
    </div>
  );
}
