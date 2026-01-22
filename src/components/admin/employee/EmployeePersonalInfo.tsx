import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { Loader2, Save, User, Phone, MapPin, Calendar, Heart, Droplets } from "lucide-react";
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

interface EmployeePersonalInfoProps {
  employee: Employee;
  canEdit: boolean;
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
        'Prefer': 'return=minimal',
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

export function EmployeePersonalInfo({ employee, canEdit, onUpdate }: EmployeePersonalInfoProps) {
  const { toast } = useToast();
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  
  const [formData, setFormData] = useState({
    employee_name: employee.employee_name,
    department: employee.department || "",
    designation: employee.designation || "",
    phone_number: employee.phone_number || "",
    current_address: employee.current_address || "",
    permanent_address: employee.permanent_address || "",
    date_of_joining: employee.date_of_joining || "",
    emergency_contact_name: employee.emergency_contact_name || "",
    emergency_contact_number: employee.emergency_contact_number || "",
    date_of_birth: employee.date_of_birth || "",
    gender: employee.gender || "",
    blood_group: employee.blood_group || "",
  });

  const handleChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleSave = async () => {
    setIsSaving(true);
    try {
      await apiCall(`employees?id=eq.${employee.id}`, {
        method: 'PATCH',
        body: JSON.stringify({
          employee_name: formData.employee_name,
          department: formData.department || null,
          designation: formData.designation || null,
          phone_number: formData.phone_number || null,
          current_address: formData.current_address || null,
          permanent_address: formData.permanent_address || null,
          date_of_joining: formData.date_of_joining || null,
          emergency_contact_name: formData.emergency_contact_name || null,
          emergency_contact_number: formData.emergency_contact_number || null,
          date_of_birth: formData.date_of_birth || null,
          gender: formData.gender || null,
          blood_group: formData.blood_group || null,
        }),
      });

      toast({
        title: "Profile Updated",
        description: "Employee information has been saved successfully.",
      });
      
      setIsEditing(false);
      onUpdate();
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
        {/* Basic Info Card */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <User className="h-5 w-5" />
                Basic Information
              </CardTitle>
              <CardDescription>Personal and employment details</CardDescription>
            </div>
            {canEdit && (
              <Button onClick={() => setIsEditing(true)}>Edit Profile</Button>
            )}
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
        <CardTitle>Edit Employee Profile</CardTitle>
        <CardDescription>Update employee personal information</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-6">
          {/* Basic Info */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label htmlFor="employee_name">Full Name *</Label>
              <Input
                id="employee_name"
                value={formData.employee_name}
                onChange={(e) => handleChange("employee_name", e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label>Email (Read Only)</Label>
              <Input value={employee.employee_email} disabled />
            </div>
            <div className="space-y-2">
              <Label htmlFor="phone_number">Phone Number</Label>
              <Input
                id="phone_number"
                value={formData.phone_number}
                onChange={(e) => handleChange("phone_number", e.target.value)}
                placeholder="+91 XXXXX XXXXX"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="department">Department</Label>
              <Input
                id="department"
                value={formData.department}
                onChange={(e) => handleChange("department", e.target.value)}
                placeholder="e.g., Operations"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="designation">Designation</Label>
              <Input
                id="designation"
                value={formData.designation}
                onChange={(e) => handleChange("designation", e.target.value)}
                placeholder="e.g., Manager"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="date_of_joining">Date of Joining</Label>
              <Input
                id="date_of_joining"
                type="date"
                value={formData.date_of_joining}
                onChange={(e) => handleChange("date_of_joining", e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="date_of_birth">Date of Birth</Label>
              <Input
                id="date_of_birth"
                type="date"
                value={formData.date_of_birth}
                onChange={(e) => handleChange("date_of_birth", e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="gender">Gender</Label>
              <Select value={formData.gender} onValueChange={(v) => handleChange("gender", v)}>
                <SelectTrigger>
                  <SelectValue placeholder="Select gender" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="male">Male</SelectItem>
                  <SelectItem value="female">Female</SelectItem>
                  <SelectItem value="other">Other</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="blood_group">Blood Group</Label>
              <Select value={formData.blood_group} onValueChange={(v) => handleChange("blood_group", v)}>
                <SelectTrigger>
                  <SelectValue placeholder="Select blood group" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="A+">A+</SelectItem>
                  <SelectItem value="A-">A-</SelectItem>
                  <SelectItem value="B+">B+</SelectItem>
                  <SelectItem value="B-">B-</SelectItem>
                  <SelectItem value="AB+">AB+</SelectItem>
                  <SelectItem value="AB-">AB-</SelectItem>
                  <SelectItem value="O+">O+</SelectItem>
                  <SelectItem value="O-">O-</SelectItem>
                </SelectContent>
              </Select>
            </div>
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
            <Button variant="outline" onClick={() => setIsEditing(false)} disabled={isSaving}>
              Cancel
            </Button>
            <Button onClick={handleSave} disabled={isSaving}>
              {isSaving ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Saving...
                </>
              ) : (
                <>
                  <Save className="h-4 w-4 mr-2" />
                  Save Changes
                </>
              )}
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
