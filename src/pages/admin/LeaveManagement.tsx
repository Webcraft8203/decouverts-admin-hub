import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { usePermissions } from "@/hooks/useEmployeePermissions";
import { AccessDeniedBanner } from "@/components/admin/AccessDeniedBanner";
import { Loader2, Calendar, Check, X, RefreshCw, Clock, FileText } from "lucide-react";
import { format, differenceInDays } from "date-fns";

interface LeaveRequest {
  id: string;
  employee_id: string;
  leave_type: string;
  start_date: string;
  end_date: string;
  reason: string | null;
  status: "pending" | "approved" | "rejected";
  approved_by: string | null;
  approved_at: string | null;
  rejection_reason: string | null;
  created_at: string;
  employee?: {
    employee_name: string;
    department: string | null;
  };
}

interface LeaveBalance {
  id: string;
  employee_id: string;
  casual_leave: number;
  sick_leave: number;
  earned_leave: number;
  casual_leave_used: number;
  sick_leave_used: number;
  earned_leave_used: number;
  year: number;
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

const leaveTypeLabels: Record<string, string> = {
  casual: "Casual Leave",
  sick: "Sick Leave",
  earned: "Earned Leave",
  unpaid: "Unpaid Leave",
};

const statusConfig: Record<string, { label: string; variant: "default" | "secondary" | "destructive" | "outline" }> = {
  pending: { label: "Pending", variant: "outline" },
  approved: { label: "Approved", variant: "default" },
  rejected: { label: "Rejected", variant: "destructive" },
};

export default function LeaveManagement() {
  const { toast } = useToast();
  const { isSuperAdmin, hasPermission } = usePermissions();
  const [requests, setRequests] = useState<LeaveRequest[]>([]);
  const [balances, setBalances] = useState<LeaveBalance[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("pending");
  const [actionDialog, setActionDialog] = useState<{ request: LeaveRequest; action: "approve" | "reject" } | null>(null);
  const [rejectionReason, setRejectionReason] = useState("");

  const canManage = isSuperAdmin || hasPermission("manage_leave");
  const canView = isSuperAdmin || hasPermission("view_leave_requests") || hasPermission("manage_leave");

  const fetchData = async () => {
    if (!canView) return;
    
    setIsLoading(true);
    try {
      const [reqs, emps] = await Promise.all([
        apiCall("employee_leave_requests?select=*&order=created_at.desc"),
        apiCall("employees?is_active=eq.true&select=id,employee_name,department"),
      ]);
      
      // Map employee info to requests
      const enrichedRequests = (reqs || []).map((req: LeaveRequest) => ({
        ...req,
        employee: emps?.find((e: any) => e.id === req.employee_id),
      }));
      
      setRequests(enrichedRequests);
      
      // Fetch leave balances
      const bals = await apiCall("employee_leave_balance?select=*");
      setBalances(bals || []);
    } catch (error: any) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [canView]);

  const handleAction = async () => {
    if (!actionDialog) return;
    
    const { request, action } = actionDialog;
    
    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      await apiCall(`employee_leave_requests?id=eq.${request.id}`, {
        method: "PATCH",
        body: JSON.stringify({
          status: action === "approve" ? "approved" : "rejected",
          approved_by: user?.id,
          approved_at: new Date().toISOString(),
          rejection_reason: action === "reject" ? rejectionReason : null,
        }),
      });
      
      // Update leave balance if approved
      if (action === "approve") {
        const days = differenceInDays(new Date(request.end_date), new Date(request.start_date)) + 1;
        const balance = balances.find(b => b.employee_id === request.employee_id);
        
        if (balance) {
          const fieldMap: Record<string, string> = {
            casual: "casual_leave_used",
            sick: "sick_leave_used",
            earned: "earned_leave_used",
          };
          
          const field = fieldMap[request.leave_type];
          if (field) {
            await apiCall(`employee_leave_balance?id=eq.${balance.id}`, {
              method: "PATCH",
              body: JSON.stringify({
                [field]: (balance as any)[field] + days,
              }),
            });
          }
        }
      }
      
      toast({ 
        title: "Success", 
        description: `Leave request ${action === "approve" ? "approved" : "rejected"}` 
      });
      
      setActionDialog(null);
      setRejectionReason("");
      fetchData();
    } catch (error: any) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    }
  };

  const filteredRequests = requests.filter(r => {
    if (activeTab === "pending") return r.status === "pending";
    if (activeTab === "approved") return r.status === "approved";
    if (activeTab === "rejected") return r.status === "rejected";
    return true;
  });

  const stats = {
    pending: requests.filter(r => r.status === "pending").length,
    approved: requests.filter(r => r.status === "approved").length,
    rejected: requests.filter(r => r.status === "rejected").length,
  };

  if (!canView) {
    return <AccessDeniedBanner />;
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold">Leave Management</h1>
          <p className="text-muted-foreground">Review and manage employee leave requests</p>
        </div>
        <Button variant="outline" onClick={fetchData} disabled={isLoading}>
          <RefreshCw className={`h-4 w-4 mr-2 ${isLoading ? "animate-spin" : ""}`} />
          Refresh
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-3 gap-4">
        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center gap-2">
              <Clock className="h-5 w-5 text-yellow-500" />
              <div>
                <p className="text-2xl font-bold">{stats.pending}</p>
                <p className="text-xs text-muted-foreground">Pending</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center gap-2">
              <Check className="h-5 w-5 text-green-500" />
              <div>
                <p className="text-2xl font-bold">{stats.approved}</p>
                <p className="text-xs text-muted-foreground">Approved</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center gap-2">
              <X className="h-5 w-5 text-red-500" />
              <div>
                <p className="text-2xl font-bold">{stats.rejected}</p>
                <p className="text-xs text-muted-foreground">Rejected</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Leave Requests */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calendar className="h-5 w-5" />
            Leave Requests
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList>
              <TabsTrigger value="pending">
                Pending {stats.pending > 0 && <Badge variant="secondary" className="ml-2">{stats.pending}</Badge>}
              </TabsTrigger>
              <TabsTrigger value="approved">Approved</TabsTrigger>
              <TabsTrigger value="rejected">Rejected</TabsTrigger>
              <TabsTrigger value="all">All</TabsTrigger>
            </TabsList>
            
            <TabsContent value={activeTab} className="mt-4">
              {isLoading ? (
                <div className="flex items-center justify-center py-8">
                  <Loader2 className="h-8 w-8 animate-spin" />
                </div>
              ) : filteredRequests.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  No leave requests found
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Employee</TableHead>
                      <TableHead>Leave Type</TableHead>
                      <TableHead>From</TableHead>
                      <TableHead>To</TableHead>
                      <TableHead>Days</TableHead>
                      <TableHead>Reason</TableHead>
                      <TableHead>Status</TableHead>
                      {canManage && <TableHead>Actions</TableHead>}
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredRequests.map((req) => {
                      const days = differenceInDays(new Date(req.end_date), new Date(req.start_date)) + 1;
                      return (
                        <TableRow key={req.id}>
                          <TableCell>
                            <div>
                              <p className="font-medium">{req.employee?.employee_name || "Unknown"}</p>
                              <p className="text-xs text-muted-foreground">{req.employee?.department}</p>
                            </div>
                          </TableCell>
                          <TableCell>{leaveTypeLabels[req.leave_type] || req.leave_type}</TableCell>
                          <TableCell>{format(new Date(req.start_date), "MMM d, yyyy")}</TableCell>
                          <TableCell>{format(new Date(req.end_date), "MMM d, yyyy")}</TableCell>
                          <TableCell>{days}</TableCell>
                          <TableCell className="max-w-[200px] truncate">{req.reason || "-"}</TableCell>
                          <TableCell>
                            <Badge variant={statusConfig[req.status]?.variant}>
                              {statusConfig[req.status]?.label}
                            </Badge>
                          </TableCell>
                          {canManage && (
                            <TableCell>
                              {req.status === "pending" && (
                                <div className="flex gap-2">
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    className="text-green-600"
                                    onClick={() => setActionDialog({ request: req, action: "approve" })}
                                  >
                                    <Check className="h-4 w-4" />
                                  </Button>
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    className="text-red-600"
                                    onClick={() => setActionDialog({ request: req, action: "reject" })}
                                  >
                                    <X className="h-4 w-4" />
                                  </Button>
                                </div>
                              )}
                            </TableCell>
                          )}
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              )}
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>

      {/* Action Dialog */}
      <Dialog open={!!actionDialog} onOpenChange={() => setActionDialog(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {actionDialog?.action === "approve" ? "Approve" : "Reject"} Leave Request
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            {actionDialog && (
              <>
                <div className="space-y-2">
                  <p><strong>Employee:</strong> {actionDialog.request.employee?.employee_name}</p>
                  <p><strong>Leave Type:</strong> {leaveTypeLabels[actionDialog.request.leave_type]}</p>
                  <p><strong>Duration:</strong> {format(new Date(actionDialog.request.start_date), "MMM d")} - {format(new Date(actionDialog.request.end_date), "MMM d, yyyy")}</p>
                  <p><strong>Reason:</strong> {actionDialog.request.reason || "Not specified"}</p>
                </div>
                
                {actionDialog.action === "reject" && (
                  <div className="space-y-2">
                    <Label>Rejection Reason</Label>
                    <Textarea
                      value={rejectionReason}
                      onChange={(e) => setRejectionReason(e.target.value)}
                      placeholder="Provide a reason for rejection..."
                    />
                  </div>
                )}
                
                <div className="flex gap-2">
                  <Button variant="outline" onClick={() => setActionDialog(null)} className="flex-1">
                    Cancel
                  </Button>
                  <Button
                    onClick={handleAction}
                    className="flex-1"
                    variant={actionDialog.action === "approve" ? "default" : "destructive"}
                  >
                    {actionDialog.action === "approve" ? "Approve" : "Reject"}
                  </Button>
                </div>
              </>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
