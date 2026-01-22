import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Calendar } from "@/components/ui/calendar";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { useActivityLog } from "@/hooks/useActivityLog";
import { usePermissions } from "@/hooks/useEmployeePermissions";
import { AccessDeniedBanner } from "@/components/admin/AccessDeniedBanner";
import { Loader2, Calendar as CalendarIcon, Clock, Users, CheckCircle, XCircle, RefreshCw } from "lucide-react";
import { format, startOfMonth, endOfMonth, eachDayOfInterval, isWeekend } from "date-fns";

interface Employee {
  id: string;
  employee_name: string;
  department: string | null;
  designation: string | null;
}

interface AttendanceRecord {
  id: string;
  employee_id: string;
  attendance_date: string;
  status: "present" | "absent" | "half_day" | "on_leave" | "holiday";
  check_in_time: string | null;
  check_out_time: string | null;
  notes: string | null;
}


const statusConfig: Record<string, { label: string; color: string }> = {
  present: { label: "Present", color: "bg-green-500" },
  absent: { label: "Absent", color: "bg-red-500" },
  half_day: { label: "Half Day", color: "bg-yellow-500" },
  on_leave: { label: "On Leave", color: "bg-blue-500" },
  holiday: { label: "Holiday", color: "bg-purple-500" },
};

export default function Attendance() {
  const { toast } = useToast();
  const { logActivity } = useActivityLog();
  const { isSuperAdmin, hasPermission } = usePermissions();
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [attendance, setAttendance] = useState<AttendanceRecord[]>([]);
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [selectedEmployee, setSelectedEmployee] = useState<string>("all");
  const [isLoading, setIsLoading] = useState(true);
  const [markDialogOpen, setMarkDialogOpen] = useState(false);
  const [markingFor, setMarkingFor] = useState<{ employeeId: string; employeeName: string } | null>(null);
  const [markData, setMarkData] = useState({
    status: "present" as AttendanceRecord["status"],
    check_in_time: "09:00",
    check_out_time: "18:00",
    notes: "",
  });

  const canMark = isSuperAdmin || hasPermission("mark_attendance");
  const canView = isSuperAdmin || hasPermission("view_attendance") || hasPermission("mark_attendance");

  const fetchData = async () => {
    if (!canView) return;
    
    setIsLoading(true);
    try {
      const [empsRes, attRes] = await Promise.all([
        supabase.from('employees').select('id,employee_name,department,designation').eq('is_active', true),
        supabase.from('employee_attendance').select('*').eq('attendance_date', format(selectedDate, "yyyy-MM-dd")),
      ]);
      setEmployees(empsRes.data || []);
      setAttendance(attRes.data || []);
    } catch (error: any) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [selectedDate, canView]);

  const handleMarkAttendance = async () => {
    if (!markingFor) return;
    
    try {
      const existingRecord = attendance.find(a => a.employee_id === markingFor.employeeId);
      
      if (existingRecord) {
        const { error } = await supabase
          .from('employee_attendance')
          .update({
            status: markData.status,
            check_in_time: markData.check_in_time || null,
            check_out_time: markData.check_out_time || null,
            notes: markData.notes || null,
          })
          .eq('id', existingRecord.id);
        
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from('employee_attendance')
          .insert({
            employee_id: markingFor.employeeId,
            attendance_date: format(selectedDate, "yyyy-MM-dd"),
            status: markData.status,
            check_in_time: markData.check_in_time || null,
            check_out_time: markData.check_out_time || null,
            notes: markData.notes || null,
          });
        
        if (error) throw error;
      }
      
      logActivity({
        actionType: "order_update",
        entityType: "system",
        entityId: markingFor.employeeId,
        description: `Marked attendance for ${markingFor.employeeName} as ${markData.status}`,
        metadata: { status: markData.status, date: format(selectedDate, "yyyy-MM-dd") }
      });
      
      toast({ title: "Success", description: `Attendance marked for ${markingFor.employeeName}` });
      setMarkDialogOpen(false);
      setMarkingFor(null);
      setMarkData({ status: "present", check_in_time: "09:00", check_out_time: "18:00", notes: "" });
      fetchData();
    } catch (error: any) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    }
  };

  const handleBulkMark = async (status: AttendanceRecord["status"]) => {
    try {
      const unmarkedEmployees = employees.filter(
        emp => !attendance.find(a => a.employee_id === emp.id)
      );
      
      if (unmarkedEmployees.length === 0) {
        toast({ title: "Info", description: "All employees already have attendance marked" });
        return;
      }
      
      const records = unmarkedEmployees.map(emp => ({
        employee_id: emp.id,
        attendance_date: format(selectedDate, "yyyy-MM-dd"),
        status,
      }));
      
      const { error } = await supabase
        .from('employee_attendance')
        .insert(records);
      
      if (error) throw error;
      
      toast({ title: "Success", description: `Marked ${unmarkedEmployees.length} employees as ${status}` });
      fetchData();
    } catch (error: any) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    }
  };

  const getEmployeeAttendance = (employeeId: string) => {
    return attendance.find(a => a.employee_id === employeeId);
  };

  const stats = {
    total: employees.length,
    present: attendance.filter(a => a.status === "present").length,
    absent: attendance.filter(a => a.status === "absent").length,
    onLeave: attendance.filter(a => a.status === "on_leave").length,
    unmarked: employees.length - attendance.length,
  };

  if (!canView) {
    return <AccessDeniedBanner />;
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold">Attendance Management</h1>
          <p className="text-muted-foreground">Mark and view employee attendance</p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" onClick={fetchData} disabled={isLoading}>
            <RefreshCw className={`h-4 w-4 mr-2 ${isLoading ? "animate-spin" : ""}`} />
            Refresh
          </Button>
          {canMark && (
            <>
              <Button variant="outline" onClick={() => handleBulkMark("present")}>
                <CheckCircle className="h-4 w-4 mr-2" />
                Mark All Present
              </Button>
              <Button variant="outline" onClick={() => handleBulkMark("holiday")}>
                Holiday
              </Button>
            </>
          )}
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center gap-2">
              <Users className="h-5 w-5 text-muted-foreground" />
              <div>
                <p className="text-2xl font-bold">{stats.total}</p>
                <p className="text-xs text-muted-foreground">Total</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center gap-2">
              <CheckCircle className="h-5 w-5 text-green-500" />
              <div>
                <p className="text-2xl font-bold">{stats.present}</p>
                <p className="text-xs text-muted-foreground">Present</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center gap-2">
              <XCircle className="h-5 w-5 text-red-500" />
              <div>
                <p className="text-2xl font-bold">{stats.absent}</p>
                <p className="text-xs text-muted-foreground">Absent</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center gap-2">
              <CalendarIcon className="h-5 w-5 text-blue-500" />
              <div>
                <p className="text-2xl font-bold">{stats.onLeave}</p>
                <p className="text-xs text-muted-foreground">On Leave</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center gap-2">
              <Clock className="h-5 w-5 text-yellow-500" />
              <div>
                <p className="text-2xl font-bold">{stats.unmarked}</p>
                <p className="text-xs text-muted-foreground">Unmarked</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid md:grid-cols-3 gap-6">
        {/* Calendar */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CalendarIcon className="h-5 w-5" />
              Select Date
            </CardTitle>
          </CardHeader>
          <CardContent>
            <Calendar
              mode="single"
              selected={selectedDate}
              onSelect={(date) => date && setSelectedDate(date)}
              className="rounded-md border"
            />
          </CardContent>
        </Card>

        {/* Attendance Table */}
        <Card className="md:col-span-2">
          <CardHeader>
            <CardTitle>Attendance for {format(selectedDate, "MMMM d, yyyy")}</CardTitle>
            <CardDescription>
              {isWeekend(selectedDate) && (
                <Badge variant="outline" className="ml-2">Weekend</Badge>
              )}
            </CardDescription>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="h-8 w-8 animate-spin" />
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Employee</TableHead>
                    <TableHead>Department</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Check In</TableHead>
                    <TableHead>Check Out</TableHead>
                    {canMark && <TableHead>Action</TableHead>}
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {employees.map((emp) => {
                    const record = getEmployeeAttendance(emp.id);
                    return (
                      <TableRow key={emp.id}>
                        <TableCell className="font-medium">{emp.employee_name}</TableCell>
                        <TableCell>{emp.department || "-"}</TableCell>
                        <TableCell>
                          {record ? (
                            <Badge className={statusConfig[record.status]?.color}>
                              {statusConfig[record.status]?.label}
                            </Badge>
                          ) : (
                            <Badge variant="outline">Not Marked</Badge>
                          )}
                        </TableCell>
                        <TableCell>{record?.check_in_time || "-"}</TableCell>
                        <TableCell>{record?.check_out_time || "-"}</TableCell>
                        {canMark && (
                          <TableCell>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => {
                                setMarkingFor({ employeeId: emp.id, employeeName: emp.employee_name });
                                if (record) {
                                  setMarkData({
                                    status: record.status,
                                    check_in_time: record.check_in_time || "09:00",
                                    check_out_time: record.check_out_time || "18:00",
                                    notes: record.notes || "",
                                  });
                                }
                                setMarkDialogOpen(true);
                              }}
                            >
                              {record ? "Edit" : "Mark"}
                            </Button>
                          </TableCell>
                        )}
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Mark Attendance Dialog */}
      <Dialog open={markDialogOpen} onOpenChange={setMarkDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Mark Attendance - {markingFor?.employeeName}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Status</Label>
              <Select value={markData.status} onValueChange={(v: any) => setMarkData(prev => ({ ...prev, status: v }))}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {Object.entries(statusConfig).map(([key, { label }]) => (
                    <SelectItem key={key} value={key}>{label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Check In Time</Label>
                <Input
                  type="time"
                  value={markData.check_in_time}
                  onChange={(e) => setMarkData(prev => ({ ...prev, check_in_time: e.target.value }))}
                />
              </div>
              <div className="space-y-2">
                <Label>Check Out Time</Label>
                <Input
                  type="time"
                  value={markData.check_out_time}
                  onChange={(e) => setMarkData(prev => ({ ...prev, check_out_time: e.target.value }))}
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label>Notes</Label>
              <Textarea
                value={markData.notes}
                onChange={(e) => setMarkData(prev => ({ ...prev, notes: e.target.value }))}
                placeholder="Optional notes..."
              />
            </div>
            <Button onClick={handleMarkAttendance} className="w-full">
              Save Attendance
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
