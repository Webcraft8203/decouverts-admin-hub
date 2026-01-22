import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { Loader2, Activity, Clock, User, FileText, Check, X } from "lucide-react";
import { format } from "date-fns";

interface ProfileUpdate {
  id: string;
  field_name: string;
  old_value: string | null;
  new_value: string | null;
  status: string;
  requested_at: string;
  processed_at: string | null;
  rejection_reason: string | null;
}

interface EmployeeActivityLogProps {
  employeeId: string;
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

export function EmployeeActivityLog({ employeeId }: EmployeeActivityLogProps) {
  const { toast } = useToast();
  const [profileUpdates, setProfileUpdates] = useState<ProfileUpdate[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const fetchActivity = async () => {
    setIsLoading(true);
    try {
      const updates = await apiCall(`employee_profile_updates?employee_id=eq.${employeeId}&order=requested_at.desc&limit=50`);
      setProfileUpdates(updates || []);
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to fetch activity",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchActivity();
  }, [employeeId]);

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'approved':
        return <Badge className="bg-green-500">Approved</Badge>;
      case 'rejected':
        return <Badge variant="destructive">Rejected</Badge>;
      default:
        return <Badge variant="secondary">Pending</Badge>;
    }
  };

  const formatFieldName = (field: string) => {
    return field.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
  };

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
          <Activity className="h-5 w-5" />
          Activity Log
        </CardTitle>
        <CardDescription>Profile update requests and changes history</CardDescription>
      </CardHeader>
      <CardContent>
        {profileUpdates.length === 0 ? (
          <div className="text-center py-12 text-muted-foreground">
            <Clock className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <p>No activity recorded yet</p>
            <p className="text-sm mt-1">Profile update requests will appear here</p>
          </div>
        ) : (
          <div className="space-y-4">
            {profileUpdates.map((update) => (
              <div key={update.id} className="flex gap-4 p-4 border rounded-lg">
                <div className="flex-shrink-0">
                  {update.status === 'approved' ? (
                    <div className="w-10 h-10 rounded-full bg-green-100 flex items-center justify-center">
                      <Check className="h-5 w-5 text-green-600" />
                    </div>
                  ) : update.status === 'rejected' ? (
                    <div className="w-10 h-10 rounded-full bg-red-100 flex items-center justify-center">
                      <X className="h-5 w-5 text-red-600" />
                    </div>
                  ) : (
                    <div className="w-10 h-10 rounded-full bg-muted flex items-center justify-center">
                      <FileText className="h-5 w-5 text-muted-foreground" />
                    </div>
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-medium">{formatFieldName(update.field_name)}</span>
                    {getStatusBadge(update.status)}
                  </div>
                  <div className="text-sm text-muted-foreground mt-1">
                    <span className="line-through">{update.old_value || '(empty)'}</span>
                    {' → '}
                    <span className="font-medium text-foreground">{update.new_value || '(empty)'}</span>
                  </div>
                  <div className="flex items-center gap-4 mt-2 text-xs text-muted-foreground">
                    <span className="flex items-center gap-1">
                      <Clock className="h-3 w-3" />
                      Requested: {format(new Date(update.requested_at), "PPp")}
                    </span>
                    {update.processed_at && (
                      <span className="flex items-center gap-1">
                        <Check className="h-3 w-3" />
                        Processed: {format(new Date(update.processed_at), "PPp")}
                      </span>
                    )}
                  </div>
                  {update.rejection_reason && (
                    <p className="text-sm text-destructive mt-2">
                      Reason: {update.rejection_reason}
                    </p>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
