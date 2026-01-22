import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useToast } from "@/hooks/use-toast";
import { Loader2, ClipboardList, Clock, CheckCircle, XCircle } from "lucide-react";
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

interface EmployeePendingRequestsProps {
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
  
  return response.json();
};

const FIELD_LABELS: Record<string, string> = {
  phone_number: "Phone Number",
  current_address: "Current Address",
  permanent_address: "Permanent Address",
  emergency_contact_name: "Emergency Contact Name",
  emergency_contact_number: "Emergency Contact Number",
  bank_bank_name: "Bank Name",
  bank_account_number: "Account Number",
  bank_ifsc_code: "IFSC Code",
  bank_branch_name: "Branch Name",
};

export function EmployeePendingRequests({ employeeId }: EmployeePendingRequestsProps) {
  const { toast } = useToast();
  const [requests, setRequests] = useState<ProfileUpdate[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const fetchRequests = async () => {
    setIsLoading(true);
    try {
      const data = await apiCall(`employee_profile_updates?employee_id=eq.${employeeId}&order=requested_at.desc`);
      setRequests(data || []);
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to fetch update requests",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchRequests();
  }, [employeeId]);

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'approved':
        return (
          <Badge className="bg-green-500 gap-1">
            <CheckCircle className="h-3 w-3" />
            Approved
          </Badge>
        );
      case 'rejected':
        return (
          <Badge variant="destructive" className="gap-1">
            <XCircle className="h-3 w-3" />
            Rejected
          </Badge>
        );
      default:
        return (
          <Badge variant="secondary" className="gap-1">
            <Clock className="h-3 w-3" />
            Pending
          </Badge>
        );
    }
  };

  const getFieldLabel = (fieldName: string) => {
    return FIELD_LABELS[fieldName] || fieldName.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase());
  };

  const truncateValue = (value: string | null, maxLength: number = 30) => {
    if (!value) return "-";
    if (value.length <= maxLength) return value;
    return value.substring(0, maxLength) + "...";
  };

  // Separate pending and processed requests
  const pendingRequests = requests.filter(r => r.status === 'pending');
  const processedRequests = requests.filter(r => r.status !== 'pending');

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Pending Requests */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Clock className="h-5 w-5 text-yellow-500" />
            Pending Requests
          </CardTitle>
          <CardDescription>Update requests awaiting HR approval</CardDescription>
        </CardHeader>
        <CardContent>
          {pendingRequests.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <CheckCircle className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>No pending requests</p>
              <p className="text-sm">All your update requests have been processed</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Field</TableHead>
                    <TableHead>Old Value</TableHead>
                    <TableHead>New Value</TableHead>
                    <TableHead>Requested</TableHead>
                    <TableHead>Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {pendingRequests.map((request) => (
                    <TableRow key={request.id}>
                      <TableCell className="font-medium">
                        {getFieldLabel(request.field_name)}
                      </TableCell>
                      <TableCell className="text-muted-foreground">
                        {truncateValue(request.old_value)}
                      </TableCell>
                      <TableCell>{truncateValue(request.new_value)}</TableCell>
                      <TableCell>
                        {request.requested_at 
                          ? format(new Date(request.requested_at), "PP") 
                          : "-"}
                      </TableCell>
                      <TableCell>{getStatusBadge(request.status)}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Request History */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <ClipboardList className="h-5 w-5" />
            Request History
          </CardTitle>
          <CardDescription>Previously processed update requests</CardDescription>
        </CardHeader>
        <CardContent>
          {processedRequests.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <ClipboardList className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>No request history</p>
              <p className="text-sm">Your processed requests will appear here</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Field</TableHead>
                    <TableHead>Old Value</TableHead>
                    <TableHead>New Value</TableHead>
                    <TableHead>Requested</TableHead>
                    <TableHead>Processed</TableHead>
                    <TableHead>Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {processedRequests.map((request) => (
                    <TableRow key={request.id}>
                      <TableCell className="font-medium">
                        {getFieldLabel(request.field_name)}
                      </TableCell>
                      <TableCell className="text-muted-foreground">
                        {truncateValue(request.old_value)}
                      </TableCell>
                      <TableCell>{truncateValue(request.new_value)}</TableCell>
                      <TableCell>
                        {request.requested_at 
                          ? format(new Date(request.requested_at), "PP") 
                          : "-"}
                      </TableCell>
                      <TableCell>
                        {request.processed_at 
                          ? format(new Date(request.processed_at), "PP") 
                          : "-"}
                      </TableCell>
                      <TableCell>
                        <div>
                          {getStatusBadge(request.status)}
                          {request.rejection_reason && (
                            <p className="text-xs text-destructive mt-1">
                              {request.rejection_reason}
                            </p>
                          )}
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
    </div>
  );
}
