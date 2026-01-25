import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useToast } from "@/hooks/use-toast";
import { useEmployeeActivityLog } from "@/hooks/useEmployeeActivityLog";
import { Loader2, Plus, CalendarIcon, Clock, Check, X, AlertCircle } from "lucide-react";
import { format, differenceInDays } from "date-fns";
import { cn } from "@/lib/utils";

interface EmployeeLeaveRequestsProps {
  employeeId: string;
}

interface LeaveRequest {
  id: string;
  leave_type: string;
  start_date: string;
  end_date: string;
  reason: string | null;
  status: "pending" | "approved" | "rejected";
  rejection_reason: string | null;
  created_at: string;
}

interface LeaveBalance {
  casual_leave: number;
  sick_leave: number;
  earned_leave: number;
  casual_leave_used: number;
  sick_leave_used: number;
  earned_leave_used: number;
}

const leaveTypeLabels: Record<string, string> = {
  casual: "Casual Leave",
  sick: "Sick Leave",
  earned: "Earned Leave",
  unpaid: "Unpaid Leave",
};

const statusConfig: Record<string, { label: string; variant: "default" | "secondary" | "destructive" | "outline"; icon: React.ElementType }> = {
  pending: { label: "Pending", variant: "outline", icon: Clock },
  approved: { label: "Approved", variant: "default", icon: Check },
  rejected: { label: "Rejected", variant: "destructive", icon: X },
};

export function EmployeeLeaveRequests({ employeeId }: EmployeeLeaveRequestsProps) {
  const { toast } = useToast();
  const { logActivity } = useEmployeeActivityLog();
  
  const [requests, setRequests] = useState<LeaveRequest[]>([]);
  const [balance, setBalance] = useState<LeaveBalance | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [dialogOpen, setDialogOpen] = useState(false);
  
  // Form state
  const [leaveType, setLeaveType] = useState<string>("");
  const [startDate, setStartDate] = useState<Date | undefined>();
  const [endDate, setEndDate] = useState<Date | undefined>();
  const [reason, setReason] = useState("");

  const fetchData = async () => {
    setIsLoading(true);
    try {
      const [requestsRes, balanceRes] = await Promise.all([
        supabase
          .from('employee_leave_requests')
          .select('*')
          .eq('employee_id', employeeId)
          .order('created_at', { ascending: false }),
        supabase
          .from('employee_leave_balance')
          .select('*')
          .eq('employee_id', employeeId)
          .eq('year', new Date().getFullYear())
          .maybeSingle(),
      ]);

      if (requestsRes.error) throw requestsRes.error;
      setRequests(requestsRes.data || []);
      setBalance(balanceRes.data);
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to fetch leave data",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (employeeId) {
      fetchData();
    }
  }, [employeeId]);

  const resetForm = () => {
    setLeaveType("");
    setStartDate(undefined);
    setEndDate(undefined);
    setReason("");
  };

  const handleSubmit = async () => {
    if (!leaveType || !startDate || !endDate) {
      toast({
        title: "Validation Error",
        description: "Please fill in all required fields",
        variant: "destructive",
      });
      return;
    }

    if (endDate < startDate) {
      toast({
        title: "Validation Error",
        description: "End date cannot be before start date",
        variant: "destructive",
      });
      return;
    }

    setIsSubmitting(true);
    try {
      const { error } = await supabase
        .from('employee_leave_requests')
        .insert({
          employee_id: employeeId,
          leave_type: leaveType,
          start_date: format(startDate, "yyyy-MM-dd"),
          end_date: format(endDate, "yyyy-MM-dd"),
          reason: reason.trim() || null,
          status: "pending",
        });

      if (error) throw error;

      logActivity({
        actionType: "leave_applied",
        entityType: "leave",
        description: `Submitted ${leaveTypeLabels[leaveType]} request from ${format(startDate, "MMM d")} to ${format(endDate, "MMM d, yyyy")}`,
      });

      toast({
        title: "Success",
        description: "Leave request submitted successfully",
      });

      setDialogOpen(false);
      resetForm();
      fetchData();
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to submit leave request",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const getAvailableLeave = (type: string): { total: number; used: number; remaining: number } => {
    if (!balance) return { total: 0, used: 0, remaining: 0 };
    
    const map: Record<string, { total: keyof LeaveBalance; used: keyof LeaveBalance }> = {
      casual: { total: "casual_leave", used: "casual_leave_used" },
      sick: { total: "sick_leave", used: "sick_leave_used" },
      earned: { total: "earned_leave", used: "earned_leave_used" },
    };
    
    const keys = map[type];
    if (!keys) return { total: 0, used: 0, remaining: 0 };
    
    const total = balance[keys.total] as number;
    const used = balance[keys.used] as number;
    return { total, used, remaining: total - used };
  };

  const pendingCount = requests.filter(r => r.status === "pending").length;

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[200px]">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Leave Balance Cards */}
      {balance && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {["casual", "sick", "earned"].map((type) => {
            const { total, used, remaining } = getAvailableLeave(type);
            return (
              <Card key={type}>
                <CardContent className="pt-4">
                  <div className="flex justify-between items-start">
                    <div>
                      <p className="text-sm font-medium text-muted-foreground">{leaveTypeLabels[type]}</p>
                      <p className="text-2xl font-bold">{remaining}</p>
                      <p className="text-xs text-muted-foreground">of {total} remaining</p>
                    </div>
                    <Badge variant="secondary">{used} used</Badge>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      {!balance && (
        <Card className="border-amber-200 bg-amber-50 dark:bg-amber-950/20 dark:border-amber-800">
          <CardContent className="pt-4 flex items-center gap-3">
            <AlertCircle className="h-5 w-5 text-amber-600" />
            <p className="text-sm text-amber-700 dark:text-amber-400">
              Leave balance not set up for this year. Contact HR to set up your leave balance.
            </p>
          </CardContent>
        </Card>
      )}

      {/* Leave Requests */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <CalendarIcon className="h-5 w-5" />
              Leave Requests
              {pendingCount > 0 && (
                <Badge variant="secondary">{pendingCount} pending</Badge>
              )}
            </CardTitle>
            <CardDescription>
              Submit and track your leave requests
            </CardDescription>
          </div>
          <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
            <DialogTrigger asChild>
              <Button onClick={() => resetForm()}>
                <Plus className="h-4 w-4 mr-2" />
                Apply Leave
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-md">
              <DialogHeader>
                <DialogTitle>Apply for Leave</DialogTitle>
              </DialogHeader>
              <div className="space-y-4 py-4">
                {/* Leave Type */}
                <div className="space-y-2">
                  <Label>Leave Type *</Label>
                  <Select value={leaveType} onValueChange={setLeaveType}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select leave type" />
                    </SelectTrigger>
                    <SelectContent>
                      {Object.entries(leaveTypeLabels).map(([value, label]) => {
                        const avail = getAvailableLeave(value);
                        return (
                          <SelectItem key={value} value={value}>
                            {label} {value !== "unpaid" && `(${avail.remaining} left)`}
                          </SelectItem>
                        );
                      })}
                    </SelectContent>
                  </Select>
                </div>

                {/* Start Date */}
                <div className="space-y-2">
                  <Label>Start Date *</Label>
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button
                        variant="outline"
                        className={cn(
                          "w-full justify-start text-left font-normal",
                          !startDate && "text-muted-foreground"
                        )}
                      >
                        <CalendarIcon className="mr-2 h-4 w-4" />
                        {startDate ? format(startDate, "PPP") : "Select start date"}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="start">
                      <Calendar
                        mode="single"
                        selected={startDate}
                        onSelect={setStartDate}
                        disabled={(date) => date < new Date(new Date().setHours(0, 0, 0, 0))}
                        initialFocus
                      />
                    </PopoverContent>
                  </Popover>
                </div>

                {/* End Date */}
                <div className="space-y-2">
                  <Label>End Date *</Label>
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button
                        variant="outline"
                        className={cn(
                          "w-full justify-start text-left font-normal",
                          !endDate && "text-muted-foreground"
                        )}
                      >
                        <CalendarIcon className="mr-2 h-4 w-4" />
                        {endDate ? format(endDate, "PPP") : "Select end date"}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="start">
                      <Calendar
                        mode="single"
                        selected={endDate}
                        onSelect={setEndDate}
                        disabled={(date) => 
                          date < new Date(new Date().setHours(0, 0, 0, 0)) ||
                          (startDate ? date < startDate : false)
                        }
                        initialFocus
                      />
                    </PopoverContent>
                  </Popover>
                </div>

                {/* Duration Preview */}
                {startDate && endDate && (
                  <div className="p-3 bg-muted rounded-lg">
                    <p className="text-sm">
                      <strong>Duration:</strong> {differenceInDays(endDate, startDate) + 1} day(s)
                    </p>
                  </div>
                )}

                {/* Reason */}
                <div className="space-y-2">
                  <Label>Reason (Optional)</Label>
                  <Textarea
                    value={reason}
                    onChange={(e) => setReason(e.target.value)}
                    placeholder="Provide a reason for your leave..."
                    rows={3}
                  />
                </div>

                {/* Actions */}
                <div className="flex gap-2 pt-2">
                  <Button
                    variant="outline"
                    onClick={() => setDialogOpen(false)}
                    className="flex-1"
                    disabled={isSubmitting}
                  >
                    Cancel
                  </Button>
                  <Button
                    onClick={handleSubmit}
                    className="flex-1"
                    disabled={isSubmitting || !leaveType || !startDate || !endDate}
                  >
                    {isSubmitting ? (
                      <>
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        Submitting...
                      </>
                    ) : (
                      "Submit Request"
                    )}
                  </Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>
        </CardHeader>
        <CardContent>
          {requests.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <CalendarIcon className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>No leave requests yet</p>
              <p className="text-sm">Click "Apply Leave" to submit your first request</p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Type</TableHead>
                  <TableHead>From</TableHead>
                  <TableHead>To</TableHead>
                  <TableHead>Days</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Submitted</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {requests.map((req) => {
                  const days = differenceInDays(new Date(req.end_date), new Date(req.start_date)) + 1;
                  const config = statusConfig[req.status];
                  const StatusIcon = config.icon;
                  
                  return (
                    <TableRow key={req.id}>
                      <TableCell className="font-medium">
                        {leaveTypeLabels[req.leave_type] || req.leave_type}
                      </TableCell>
                      <TableCell>{format(new Date(req.start_date), "MMM d, yyyy")}</TableCell>
                      <TableCell>{format(new Date(req.end_date), "MMM d, yyyy")}</TableCell>
                      <TableCell>{days}</TableCell>
                      <TableCell>
                        <Badge variant={config.variant} className="flex items-center gap-1 w-fit">
                          <StatusIcon className="h-3 w-3" />
                          {config.label}
                        </Badge>
                        {req.status === "rejected" && req.rejection_reason && (
                          <p className="text-xs text-destructive mt-1 max-w-[200px]">
                            {req.rejection_reason}
                          </p>
                        )}
                      </TableCell>
                      <TableCell className="text-muted-foreground text-sm">
                        {format(new Date(req.created_at), "MMM d, yyyy")}
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
