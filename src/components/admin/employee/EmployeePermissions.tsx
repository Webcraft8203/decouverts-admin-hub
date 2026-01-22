import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { useToast } from "@/hooks/use-toast";
import { Loader2, Save, Shield } from "lucide-react";
import { ALL_PERMISSIONS, EmployeePermission } from "@/hooks/useEmployeePermissions";

interface EmployeePermissionsProps {
  employeeId: string;
  employeeName: string;
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

export function EmployeePermissions({ employeeId, employeeName }: EmployeePermissionsProps) {
  const { toast } = useToast();
  const [currentPermissions, setCurrentPermissions] = useState<EmployeePermission[]>([]);
  const [selectedPermissions, setSelectedPermissions] = useState<EmployeePermission[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [hasChanges, setHasChanges] = useState(false);

  const fetchPermissions = async () => {
    setIsLoading(true);
    try {
      const perms = await apiCall(`employee_permissions?employee_id=eq.${employeeId}&select=permission`);
      const permList = (perms || []).map((p: any) => p.permission as EmployeePermission);
      setCurrentPermissions(permList);
      setSelectedPermissions(permList);
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to fetch permissions",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchPermissions();
  }, [employeeId]);

  useEffect(() => {
    const currentSet = new Set(currentPermissions);
    const selectedSet = new Set(selectedPermissions);
    const changed = currentPermissions.length !== selectedPermissions.length ||
      currentPermissions.some(p => !selectedSet.has(p)) ||
      selectedPermissions.some(p => !currentSet.has(p));
    setHasChanges(changed);
  }, [currentPermissions, selectedPermissions]);

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

  const handleSave = async () => {
    setIsSaving(true);
    try {
      // Delete existing permissions
      await apiCall(`employee_permissions?employee_id=eq.${employeeId}`, {
        method: 'DELETE',
      });

      // Add new permissions
      if (selectedPermissions.length > 0) {
        const permissionInserts = selectedPermissions.map((perm) => ({
          employee_id: employeeId,
          permission: perm,
        }));

        await apiCall('employee_permissions', {
          method: 'POST',
          body: JSON.stringify(permissionInserts),
        });
      }

      toast({
        title: "Permissions Updated",
        description: `${employeeName}'s permissions have been saved.`,
      });

      setCurrentPermissions(selectedPermissions);
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to update permissions",
        variant: "destructive",
      });
    } finally {
      setIsSaving(false);
    }
  };

  const groupedPermissions = ALL_PERMISSIONS.reduce((acc, perm) => {
    if (!acc[perm.category]) acc[perm.category] = [];
    acc[perm.category].push(perm);
    return acc;
  }, {} as Record<string, typeof ALL_PERMISSIONS>);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Shield className="h-5 w-5" />
          Access Permissions
        </CardTitle>
        <CardDescription>
          Manage what {employeeName} can access in the admin panel
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {/* Summary */}
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-sm text-muted-foreground">Current permissions:</span>
            <Badge variant="secondary">{selectedPermissions.length} of {ALL_PERMISSIONS.length}</Badge>
            {hasChanges && (
              <Badge variant="outline" className="text-yellow-600">Unsaved changes</Badge>
            )}
          </div>

          {/* Permission Selector */}
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
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pl-8 pt-2">
                      {perms.map((perm) => (
                        <div key={perm.key} className="flex items-center space-x-2">
                          <Checkbox
                            id={`perm-${perm.key}`}
                            checked={selectedPermissions.includes(perm.key)}
                            onCheckedChange={() => togglePermission(perm.key)}
                          />
                          <Label htmlFor={`perm-${perm.key}`} className="text-sm cursor-pointer">
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

          {/* Save Button */}
          <div className="flex justify-end pt-4 border-t">
            <Button onClick={handleSave} disabled={isSaving || !hasChanges}>
              {isSaving ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Saving...
                </>
              ) : (
                <>
                  <Save className="h-4 w-4 mr-2" />
                  Save Permissions
                </>
              )}
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
