import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { useToast } from "@/hooks/use-toast";
import { Loader2, Save, User, MapPin, Heart, Info } from "lucide-react";
import { format } from "date-fns";

interface Employee {
  id: string;
  employee_name: string;
  employee_email: string;
  department: string | null;
  designation: string | null;
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

interface EmployeeSelfServiceProfileProps {
  employee: Employee;
  onUpdate: () => void;
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
  
  return response;
};

// Fields that employees can edit directly
const EDITABLE_FIELDS = ['phone_number', 'current_address', 'permanent_address', 'emergency_contact_name', 'emergency_contact_number'];

export function EmployeeSelfServiceProfile({ employee, onUpdate }: EmployeeSelfServiceProfileProps) {
  const { toast } = useToast();
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  
  const [formData, setFormData] = useState({
    phone_number: employee.phone_number || "",
    current_address: employee.current_address || "",
    permanent_address: employee.permanent_address || "",
    emergency_contact_name: employee.emergency_contact_name || "",
    emergency_contact_number: employee.emergency_contact_number || "",
  });

  const handleChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleSave = async () => {
    setIsSaving(true);
    try {
      // Create update requests for HR approval
      const session = await supabase.auth.getSession();
      const updates: any[] = [];

      EDITABLE_FIELDS.forEach(field => {
        const oldValue = employee[field as keyof Employee] as string | null;
        const newValue = formData[field as keyof typeof formData];
        
        if ((oldValue || "") !== newValue) {
          updates.push({
            employee_id: employee.id,
            field_name: field,
            old_value: oldValue || null,
            new_value: newValue || null,
            status: 'pending',
          });
        }
      });

      if (updates.length === 0) {
        toast({
          title: "No Changes",
          description: "No changes were detected to save.",
        });
        setIsEditing(false);
        return;
      }

      // Insert update requests
      for (const update of updates) {
        await apiCall('employee_profile_updates', {
          method: 'POST',
          body: JSON.stringify(update),
        });
      }

      toast({
        title: "Update Requests Submitted",
        description: `${updates.length} change(s) have been submitted for HR approval.`,
      });
      
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

  const formatDate = (date: string | null) => {
    if (!date) return "Not set";
    try {
      return format(new Date(date), "PPP");
    } catch {
      return date;
    }
  };

  if (!isEditing) {
    return (
      <div className="space-y-6">
        {/* Basic Info Card - View Only */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <User className="h-5 w-5" />
                Personal Information
              </CardTitle>
              <CardDescription>Your employment and personal details</CardDescription>
            </div>
            <Button onClick={() => setIsEditing(true)}>
              Edit Contact Info
            </Button>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              <div>
                <p className="text-sm text-muted-foreground">Full Name</p>
                <p className="font-medium">{employee.employee_name}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Email</p>
                <p className="font-medium">{employee.employee_email}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Phone</p>
                <p className="font-medium">{employee.phone_number || "Not set"}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Department</p>
                <p className="font-medium">{employee.department || "Not set"}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Designation</p>
                <p className="font-medium">{employee.designation || "Not set"}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Date of Joining</p>
                <p className="font-medium">{formatDate(employee.date_of_joining)}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Date of Birth</p>
                <p className="font-medium">{formatDate(employee.date_of_birth)}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Gender</p>
                <p className="font-medium capitalize">{employee.gender || "Not set"}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Blood Group</p>
                <p className="font-medium">{employee.blood_group || "Not set"}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Address Card */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <MapPin className="h-5 w-5" />
              Address Information
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <p className="text-sm text-muted-foreground">Current Address</p>
                <p className="font-medium whitespace-pre-wrap">{employee.current_address || "Not set"}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Permanent Address</p>
                <p className="font-medium whitespace-pre-wrap">{employee.permanent_address || "Not set"}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Emergency Contact Card */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Heart className="h-5 w-5 text-destructive" />
              Emergency Contact
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <p className="text-sm text-muted-foreground">Contact Name</p>
                <p className="font-medium">{employee.emergency_contact_name || "Not set"}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Contact Number</p>
                <p className="font-medium">{employee.emergency_contact_number || "Not set"}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Update Contact Information</CardTitle>
        <CardDescription>Changes will be submitted for HR approval</CardDescription>
      </CardHeader>
      <CardContent>
        <Alert className="mb-6">
          <Info className="h-4 w-4" />
          <AlertDescription>
            You can update your contact information and address. Changes require HR approval before they take effect.
          </AlertDescription>
        </Alert>

        <div className="space-y-6">
          {/* Phone */}
          <div className="space-y-2">
            <Label htmlFor="phone_number">Phone Number</Label>
            <Input
              id="phone_number"
              value={formData.phone_number}
              onChange={(e) => handleChange("phone_number", e.target.value)}
              placeholder="+91 XXXXX XXXXX"
            />
          </div>

          {/* Addresses */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="current_address">Current Address</Label>
              <Textarea
                id="current_address"
                value={formData.current_address}
                onChange={(e) => handleChange("current_address", e.target.value)}
                rows={3}
                placeholder="Enter current address"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="permanent_address">Permanent Address</Label>
              <Textarea
                id="permanent_address"
                value={formData.permanent_address}
                onChange={(e) => handleChange("permanent_address", e.target.value)}
                rows={3}
                placeholder="Enter permanent address"
              />
            </div>
          </div>

          {/* Emergency Contact */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="emergency_contact_name">Emergency Contact Name</Label>
              <Input
                id="emergency_contact_name"
                value={formData.emergency_contact_name}
                onChange={(e) => handleChange("emergency_contact_name", e.target.value)}
                placeholder="Contact person name"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="emergency_contact_number">Emergency Contact Number</Label>
              <Input
                id="emergency_contact_number"
                value={formData.emergency_contact_number}
                onChange={(e) => handleChange("emergency_contact_number", e.target.value)}
                placeholder="+91 XXXXX XXXXX"
              />
            </div>
          </div>

          {/* Actions */}
          <div className="flex justify-end gap-2 pt-4 border-t">
            <Button 
              variant="outline" 
              onClick={() => {
                setFormData({
                  phone_number: employee.phone_number || "",
                  current_address: employee.current_address || "",
                  permanent_address: employee.permanent_address || "",
                  emergency_contact_name: employee.emergency_contact_name || "",
                  emergency_contact_number: employee.emergency_contact_number || "",
                });
                setIsEditing(false);
              }} 
              disabled={isSaving}
            >
              Cancel
            </Button>
            <Button onClick={handleSave} disabled={isSaving}>
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
      </CardContent>
    </Card>
  );
}
