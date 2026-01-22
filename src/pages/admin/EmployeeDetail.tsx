import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { usePermissions } from "@/hooks/useEmployeePermissions";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { 
  ArrowLeft, 
  Loader2, 
  User, 
  FileText, 
  Wallet, 
  Shield, 
  Activity,
  UserCheck,
  UserX
} from "lucide-react";
import { EmployeePersonalInfo } from "@/components/admin/employee/EmployeePersonalInfo";
import { EmployeeDocuments } from "@/components/admin/employee/EmployeeDocuments";
import { EmployeeBankSalary } from "@/components/admin/employee/EmployeeBankSalary";
import { EmployeePermissions } from "@/components/admin/employee/EmployeePermissions";
import { EmployeeActivityLog } from "@/components/admin/employee/EmployeeActivityLog";

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

// Helper to make authenticated REST API calls
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

export default function EmployeeDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { isSuperAdmin, hasAnyPermission } = usePermissions();
  const { toast } = useToast();
  
  const [employee, setEmployee] = useState<EmployeeData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("personal");

  const canViewEmployee = isSuperAdmin || hasAnyPermission(['view_employee_profiles', 'manage_employee_profiles']);
  const canEditEmployee = isSuperAdmin || hasAnyPermission(['manage_employee_profiles']);
  const canViewSalary = isSuperAdmin || hasAnyPermission(['view_salary_info', 'manage_salary', 'view_accounting']);
  const canManageSalary = isSuperAdmin || hasAnyPermission(['manage_salary']);
  const canViewDocuments = isSuperAdmin || hasAnyPermission(['view_employee_documents', 'manage_employee_documents']);

  const fetchEmployee = async () => {
    if (!id) return;
    
    setIsLoading(true);
    try {
      const data = await apiCall(`employees?id=eq.${id}&select=*`);
      if (data && data.length > 0) {
        setEmployee(data[0]);
      } else {
        toast({
          title: "Employee Not Found",
          description: "The requested employee could not be found.",
          variant: "destructive",
        });
        navigate("/admin/employees");
      }
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to fetch employee details",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (canViewEmployee) {
      fetchEmployee();
    }
  }, [id, canViewEmployee]);

  const toggleEmployeeStatus = async () => {
    if (!employee) return;
    
    try {
      await apiCall(`employees?id=eq.${employee.id}`, {
        method: 'PATCH',
        body: JSON.stringify({ is_active: !employee.is_active }),
      });

      toast({
        title: employee.is_active ? "Employee Deactivated" : "Employee Activated",
        description: `${employee.employee_name} has been ${employee.is_active ? "deactivated" : "activated"}.`,
      });

      fetchEmployee();
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to update employee status",
        variant: "destructive",
      });
    }
  };

  if (!canViewEmployee) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Card className="max-w-md">
          <CardContent className="pt-6 text-center">
            <Shield className="h-12 w-12 mx-auto text-destructive mb-4" />
            <h2 className="text-xl font-semibold mb-2">Access Denied</h2>
            <p className="text-muted-foreground">
              You don't have permission to view employee profiles.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!employee) {
    return null;
  }

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => navigate("/admin/employees")}>
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-2xl font-bold">{employee.employee_name}</h1>
              <Badge variant={employee.is_active ? "default" : "secondary"}>
                {employee.is_active ? "Active" : "Inactive"}
              </Badge>
            </div>
            <p className="text-muted-foreground">
              {employee.designation || "Employee"} {employee.department && `• ${employee.department}`}
            </p>
          </div>
        </div>
        
        {canEditEmployee && (
          <Button
            variant={employee.is_active ? "destructive" : "default"}
            onClick={toggleEmployeeStatus}
          >
            {employee.is_active ? (
              <>
                <UserX className="h-4 w-4 mr-2" />
                Deactivate
              </>
            ) : (
              <>
                <UserCheck className="h-4 w-4 mr-2" />
                Activate
              </>
            )}
          </Button>
        )}
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-2 lg:grid-cols-5 h-auto">
          <TabsTrigger value="personal" className="flex items-center gap-2 py-3">
            <User className="h-4 w-4" />
            <span className="hidden sm:inline">Personal Info</span>
            <span className="sm:hidden">Personal</span>
          </TabsTrigger>
          {canViewDocuments && (
            <TabsTrigger value="documents" className="flex items-center gap-2 py-3">
              <FileText className="h-4 w-4" />
              <span className="hidden sm:inline">Documents</span>
              <span className="sm:hidden">Docs</span>
            </TabsTrigger>
          )}
          {canViewSalary && (
            <TabsTrigger value="salary" className="flex items-center gap-2 py-3">
              <Wallet className="h-4 w-4" />
              <span className="hidden sm:inline">Bank & Salary</span>
              <span className="sm:hidden">Salary</span>
            </TabsTrigger>
          )}
          {isSuperAdmin && (
            <TabsTrigger value="permissions" className="flex items-center gap-2 py-3">
              <Shield className="h-4 w-4" />
              <span className="hidden sm:inline">Permissions</span>
              <span className="sm:hidden">Perms</span>
            </TabsTrigger>
          )}
          <TabsTrigger value="activity" className="flex items-center gap-2 py-3">
            <Activity className="h-4 w-4" />
            <span className="hidden sm:inline">Activity</span>
          </TabsTrigger>
        </TabsList>

        <TabsContent value="personal" className="mt-6">
          <EmployeePersonalInfo 
            employee={employee} 
            canEdit={canEditEmployee}
            onUpdate={fetchEmployee}
          />
        </TabsContent>

        {canViewDocuments && (
          <TabsContent value="documents" className="mt-6">
            <EmployeeDocuments 
              employeeId={employee.id}
              canManage={isSuperAdmin || hasAnyPermission(['manage_employee_documents'])}
            />
          </TabsContent>
        )}

        {canViewSalary && (
          <TabsContent value="salary" className="mt-6">
            <EmployeeBankSalary 
              employeeId={employee.id}
              canManage={canManageSalary}
            />
          </TabsContent>
        )}

        {isSuperAdmin && (
          <TabsContent value="permissions" className="mt-6">
            <EmployeePermissions 
              employeeId={employee.id}
              employeeName={employee.employee_name}
            />
          </TabsContent>
        )}

        <TabsContent value="activity" className="mt-6">
          <EmployeeActivityLog employeeId={employee.id} />
        </TabsContent>
      </Tabs>
    </div>
  );
}
