import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { usePermissions, ALL_PERMISSIONS, EmployeePermission } from "@/hooks/useEmployeePermissions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Switch } from "@/components/ui/switch";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { useToast } from "@/hooks/use-toast";
import { Loader2, Plus, Users, Shield, Mail, Building, Briefcase, RefreshCw, Pencil, Trash2, UserX, UserCheck } from "lucide-react";
import { format } from "date-fns";

interface Employee {
  id: string;
  user_id: string;
  employee_name: string;
  employee_email: string;
  department: string | null;
  designation: string | null;
  is_active: boolean;
  created_at: string;
  permissions: EmployeePermission[];
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

export default function Employees() {
  const { user } = useAuth();
  const { isSuperAdmin } = usePermissions();
  const { toast } = useToast();
  
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [editingEmployee, setEditingEmployee] = useState<Employee | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  // Form states
  const [formName, setFormName] = useState("");
  const [formEmail, setFormEmail] = useState("");
  const [formDepartment, setFormDepartment] = useState("");
  const [formDesignation, setFormDesignation] = useState("");
  const [selectedPermissions, setSelectedPermissions] = useState<EmployeePermission[]>([]);

  const fetchEmployees = async () => {
    setIsLoading(true);
    try {
      const emps = await apiCall('employees?order=created_at.desc');

      // Fetch permissions for all employees
      const employeesWithPermissions: Employee[] = [];
      for (const emp of emps || []) {
        const perms = await apiCall(`employee_permissions?employee_id=eq.${emp.id}&select=permission`);
        employeesWithPermissions.push({
          ...emp,
          permissions: (perms || []).map((p: any) => p.permission as EmployeePermission),
        });
      }

      setEmployees(employeesWithPermissions);
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to fetch employees",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (isSuperAdmin) {
      fetchEmployees();
    }
  }, [isSuperAdmin]);

  const resetForm = () => {
    setFormName("");
    setFormEmail("");
    setFormDepartment("");
    setFormDesignation("");
    setSelectedPermissions([]);
  };

  const handleAddEmployee = async () => {
    if (!formName || !formEmail) {
      toast({
        title: "Validation Error",
        description: "Name and email are required",
        variant: "destructive",
      });
      return;
    }

    setIsSaving(true);
    try {
      // Create employee record without user_id - will be linked when employee logs in
      const newEmployees = await apiCall('employees', {
        method: 'POST',
        headers: { 'Prefer': 'return=representation' },
        body: JSON.stringify({
          employee_name: formName,
          employee_email: formEmail.toLowerCase(),
          department: formDepartment || null,
          designation: formDesignation || null,
          created_by: user!.id,
        }),
      });

      const newEmployee = newEmployees?.[0];

      // Add permissions
      if (selectedPermissions.length > 0 && newEmployee) {
        const permissionInserts = selectedPermissions.map((perm) => ({
          employee_id: newEmployee.id,
          permission: perm,
        }));

        await apiCall('employee_permissions', {
          method: 'POST',
          body: JSON.stringify(permissionInserts),
        });
      }

      toast({
        title: "Employee Added",
        description: `${formName} has been added. They'll receive a magic link to set up access.`,
      });

      resetForm();
      setIsAddDialogOpen(false);
      fetchEmployees();
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to add employee",
        variant: "destructive",
      });
    } finally {
      setIsSaving(false);
    }
  };

  const handleEditEmployee = (employee: Employee) => {
    setEditingEmployee(employee);
    setFormName(employee.employee_name);
    setFormEmail(employee.employee_email);
    setFormDepartment(employee.department || "");
    setFormDesignation(employee.designation || "");
    setSelectedPermissions(employee.permissions);
    setIsEditDialogOpen(true);
  };

  const handleUpdateEmployee = async () => {
    if (!editingEmployee) return;

    setIsSaving(true);
    try {
      // Update employee info
      await apiCall(`employees?id=eq.${editingEmployee.id}`, {
        method: 'PATCH',
        body: JSON.stringify({
          employee_name: formName,
          department: formDepartment || null,
          designation: formDesignation || null,
        }),
      });

      // Delete existing permissions
      await apiCall(`employee_permissions?employee_id=eq.${editingEmployee.id}`, {
        method: 'DELETE',
      });

      // Add new permissions
      if (selectedPermissions.length > 0) {
        const permissionInserts = selectedPermissions.map((perm) => ({
          employee_id: editingEmployee.id,
          permission: perm,
        }));

        await apiCall('employee_permissions', {
          method: 'POST',
          body: JSON.stringify(permissionInserts),
        });
      }

      toast({
        title: "Employee Updated",
        description: `${formName}'s profile has been updated.`,
      });

      resetForm();
      setIsEditDialogOpen(false);
      setEditingEmployee(null);
      fetchEmployees();
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to update employee",
        variant: "destructive",
      });
    } finally {
      setIsSaving(false);
    }
  };

  const toggleEmployeeStatus = async (employee: Employee) => {
    try {
      await apiCall(`employees?id=eq.${employee.id}`, {
        method: 'PATCH',
        body: JSON.stringify({ is_active: !employee.is_active }),
      });

      toast({
        title: employee.is_active ? "Employee Deactivated" : "Employee Activated",
        description: `${employee.employee_name} has been ${employee.is_active ? "deactivated" : "activated"}.`,
      });

      fetchEmployees();
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to update employee status",
        variant: "destructive",
      });
    }
  };

  const deleteEmployee = async (employee: Employee) => {
    if (!confirm(`Are you sure you want to delete ${employee.employee_name}? This action cannot be undone.`)) {
      return;
    }

    try {
      await apiCall(`employees?id=eq.${employee.id}`, {
        method: 'DELETE',
      });

      toast({
        title: "Employee Deleted",
        description: `${employee.employee_name} has been removed.`,
      });

      fetchEmployees();
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to delete employee",
        variant: "destructive",
      });
    }
  };

  const togglePermission = (permission: EmployeePermission) => {
    setSelectedPermissions((prev) =>
      prev.includes(permission)
        ? prev.filter((p) => p !== permission)
        : [...prev, permission]
    );
  };

  const toggleCategoryPermissions = (category: string, allSelected: boolean) => {
    const categoryPerms = ALL_PERMISSIONS.filter((p) => p.category === category).map((p) => p.key);
    if (allSelected) {
      setSelectedPermissions((prev) => prev.filter((p) => !categoryPerms.includes(p)));
    } else {
      setSelectedPermissions((prev) => [...new Set([...prev, ...categoryPerms])]);
    }
  };

  const groupedPermissions = ALL_PERMISSIONS.reduce((acc, perm) => {
    if (!acc[perm.category]) acc[perm.category] = [];
    acc[perm.category].push(perm);
    return acc;
  }, {} as Record<string, typeof ALL_PERMISSIONS>);

  if (!isSuperAdmin) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Card className="max-w-md">
          <CardContent className="pt-6 text-center">
            <Shield className="h-12 w-12 mx-auto text-destructive mb-4" />
            <h2 className="text-xl font-semibold mb-2">Access Denied</h2>
            <p className="text-muted-foreground">
              Only Super Admins can manage employees.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  const PermissionSelector = () => (
    <Accordion type="multiple" className="w-full">
      {Object.entries(groupedPermissions).map(([category, perms]) => {
        const allSelected = perms.every((p) => selectedPermissions.includes(p.key));
        const someSelected = perms.some((p) => selectedPermissions.includes(p.key));

        return (
          <AccordionItem key={category} value={category}>
            <AccordionTrigger className="hover:no-underline">
              <div className="flex items-center gap-3">
                <Checkbox
                  checked={allSelected}
                  onCheckedChange={() => toggleCategoryPermissions(category, allSelected)}
                  onClick={(e) => e.stopPropagation()}
                  className={someSelected && !allSelected ? "opacity-50" : ""}
                />
                <span>{category}</span>
                <Badge variant="secondary" className="ml-2">
                  {perms.filter((p) => selectedPermissions.includes(p.key)).length}/{perms.length}
                </Badge>
              </div>
            </AccordionTrigger>
            <AccordionContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-2 pl-8">
                {perms.map((perm) => (
                  <div key={perm.key} className="flex items-center space-x-2">
                    <Checkbox
                      id={perm.key}
                      checked={selectedPermissions.includes(perm.key)}
                      onCheckedChange={() => togglePermission(perm.key)}
                    />
                    <Label htmlFor={perm.key} className="text-sm cursor-pointer">
                      {perm.label}
                    </Label>
                  </div>
                ))}
              </div>
            </AccordionContent>
          </AccordionItem>
        );
      })}
    </Accordion>
  );

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-foreground flex items-center gap-3">
            <Users className="h-8 w-8 text-primary" />
            Employee Management
          </h1>
          <p className="text-muted-foreground mt-1">
            Manage team access and permissions
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={fetchEmployees} disabled={isLoading}>
            <RefreshCw className={`h-4 w-4 mr-2 ${isLoading ? "animate-spin" : ""}`} />
            Refresh
          </Button>
          <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
            <DialogTrigger asChild>
              <Button onClick={resetForm}>
                <Plus className="h-4 w-4 mr-2" />
                Add Employee
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>Add New Employee</DialogTitle>
                <DialogDescription>
                  Create a new employee account with specific permissions.
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-6 py-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="name">Full Name *</Label>
                    <Input
                      id="name"
                      value={formName}
                      onChange={(e) => setFormName(e.target.value)}
                      placeholder="John Doe"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="email">Email Address *</Label>
                    <Input
                      id="email"
                      type="email"
                      value={formEmail}
                      onChange={(e) => setFormEmail(e.target.value)}
                      placeholder="john@company.com"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="department">Department</Label>
                    <Input
                      id="department"
                      value={formDepartment}
                      onChange={(e) => setFormDepartment(e.target.value)}
                      placeholder="e.g., Operations"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="designation">Designation</Label>
                    <Input
                      id="designation"
                      value={formDesignation}
                      onChange={(e) => setFormDesignation(e.target.value)}
                      placeholder="e.g., Manager"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label>Permissions</Label>
                  <p className="text-sm text-muted-foreground">
                    Select what this employee can access
                  </p>
                  <PermissionSelector />
                </div>

                <div className="flex justify-end gap-2">
                  <Button variant="outline" onClick={() => setIsAddDialogOpen(false)}>
                    Cancel
                  </Button>
                  <Button onClick={handleAddEmployee} disabled={isSaving}>
                    {isSaving ? (
                      <>
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        Adding...
                      </>
                    ) : (
                      "Add Employee"
                    )}
                  </Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Total Employees
            </CardTitle>
            <Users className="h-4 w-4 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{employees.length}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Active
            </CardTitle>
            <UserCheck className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              {employees.filter((e) => e.is_active).length}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Inactive
            </CardTitle>
            <UserX className="h-4 w-4 text-destructive" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-destructive">
              {employees.filter((e) => !e.is_active).length}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Employees Table */}
      <Card>
        <CardHeader>
          <CardTitle>Team Members</CardTitle>
          <CardDescription>
            All employees with their access permissions
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          ) : employees.length === 0 ? (
            <div className="text-center py-12">
              <Users className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              <h3 className="text-lg font-medium mb-2">No Employees Yet</h3>
              <p className="text-muted-foreground mb-4">
                Add your first team member to get started
              </p>
              <Button onClick={() => setIsAddDialogOpen(true)}>
                <Plus className="h-4 w-4 mr-2" />
                Add Employee
              </Button>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Employee</TableHead>
                    <TableHead>Department</TableHead>
                    <TableHead>Permissions</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Added</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {employees.map((employee) => (
                    <TableRow key={employee.id}>
                      <TableCell>
                        <div className="flex flex-col">
                          <span className="font-medium">{employee.employee_name}</span>
                          <span className="text-sm text-muted-foreground flex items-center gap-1">
                            <Mail className="h-3 w-3" />
                            {employee.employee_email}
                          </span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex flex-col">
                          {employee.department && (
                            <span className="flex items-center gap-1">
                              <Building className="h-3 w-3" />
                              {employee.department}
                            </span>
                          )}
                          {employee.designation && (
                            <span className="text-sm text-muted-foreground flex items-center gap-1">
                              <Briefcase className="h-3 w-3" />
                              {employee.designation}
                            </span>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex flex-wrap gap-1">
                          {employee.permissions.length === 0 ? (
                            <Badge variant="outline">No permissions</Badge>
                          ) : employee.permissions.length > 3 ? (
                            <Badge variant="secondary">
                              {employee.permissions.length} permissions
                            </Badge>
                          ) : (
                            employee.permissions.slice(0, 3).map((perm) => (
                              <Badge key={perm} variant="secondary" className="text-xs">
                                {ALL_PERMISSIONS.find((p) => p.key === perm)?.label || perm}
                              </Badge>
                            ))
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Switch
                            checked={employee.is_active}
                            onCheckedChange={() => toggleEmployeeStatus(employee)}
                          />
                          <Badge variant={employee.is_active ? "default" : "destructive"}>
                            {employee.is_active ? "Active" : "Inactive"}
                          </Badge>
                        </div>
                      </TableCell>
                      <TableCell>
                        {format(new Date(employee.created_at), "dd MMM yyyy")}
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-2">
                          <Button
                            size="icon"
                            variant="outline"
                            onClick={() => handleEditEmployee(employee)}
                          >
                            <Pencil className="h-4 w-4" />
                          </Button>
                          <Button
                            size="icon"
                            variant="destructive"
                            onClick={() => deleteEmployee(employee)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Edit Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Edit Employee</DialogTitle>
            <DialogDescription>
              Update employee details and permissions.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-6 py-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="edit-name">Full Name *</Label>
                <Input
                  id="edit-name"
                  value={formName}
                  onChange={(e) => setFormName(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit-email">Email Address</Label>
                <Input
                  id="edit-email"
                  type="email"
                  value={formEmail}
                  disabled
                  className="bg-muted"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit-department">Department</Label>
                <Input
                  id="edit-department"
                  value={formDepartment}
                  onChange={(e) => setFormDepartment(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit-designation">Designation</Label>
                <Input
                  id="edit-designation"
                  value={formDesignation}
                  onChange={(e) => setFormDesignation(e.target.value)}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label>Permissions</Label>
              <PermissionSelector />
            </div>

            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setIsEditDialogOpen(false)}>
                Cancel
              </Button>
              <Button onClick={handleUpdateEmployee} disabled={isSaving}>
                {isSaving ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Saving...
                  </>
                ) : (
                  "Save Changes"
                )}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
