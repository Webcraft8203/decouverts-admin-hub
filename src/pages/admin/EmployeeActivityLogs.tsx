import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { 
  Activity, 
  Search,
  User,
  Package,
  ShoppingBag,
  Layers,
  Box,
  FileText,
  LogIn,
  LogOut,
  Plus,
  Pencil,
  Trash2,
  AlertCircle,
  Calendar,
  RefreshCw,
  Clock,
  CheckCircle,
  XCircle,
  Eye,
  Download,
  Settings,
  UserCheck
} from "lucide-react";
import { format, formatDistanceToNow } from "date-fns";

const actionIcons: Record<string, React.ElementType> = {
  login: LogIn,
  logout: LogOut,
  attendance_marked: CheckCircle,
  attendance_updated: Pencil,
  leave_applied: Calendar,
  leave_approved: CheckCircle,
  leave_rejected: XCircle,
  document_uploaded: Plus,
  document_approved: CheckCircle,
  document_rejected: XCircle,
  profile_updated: User,
  profile_update_requested: Pencil,
  payslip_viewed: Eye,
  payslip_downloaded: Download,
  order_viewed: Eye,
  order_updated: Pencil,
  order_status_changed: ShoppingBag,
  product_created: Plus,
  product_updated: Pencil,
  product_deleted: Trash2,
  category_created: Plus,
  category_updated: Pencil,
  category_deleted: Trash2,
  invoice_generated: FileText,
  invoice_viewed: Eye,
  customer_viewed: Eye,
  customer_blocked: AlertCircle,
  customer_unblocked: UserCheck,
  raw_material_added: Plus,
  raw_material_updated: Pencil,
  raw_material_consumed: Box,
  settings_updated: Settings,
  permission_changed: Settings,
  page_viewed: Eye,
};

const entityIcons: Record<string, React.ElementType> = {
  attendance: Clock,
  leave: Calendar,
  document: FileText,
  profile: User,
  payslip: FileText,
  order: ShoppingBag,
  product: Package,
  category: Layers,
  invoice: FileText,
  customer: User,
  raw_material: Box,
  settings: Settings,
  employee: User,
  system: Activity,
};

const getActionColor = (actionType: string) => {
  if (actionType.includes("created") || actionType.includes("added") || actionType.includes("approved") || actionType.includes("marked")) 
    return "bg-green-500/10 text-green-600";
  if (actionType.includes("updated") || actionType.includes("changed") || actionType.includes("applied")) 
    return "bg-blue-500/10 text-blue-600";
  if (actionType.includes("deleted") || actionType.includes("rejected")) 
    return "bg-destructive/10 text-destructive";
  if (actionType.includes("blocked")) 
    return "bg-warning/10 text-warning";
  if (actionType.includes("login") || actionType.includes("logout")) 
    return "bg-primary/10 text-primary";
  if (actionType.includes("viewed") || actionType.includes("downloaded")) 
    return "bg-muted text-muted-foreground";
  return "bg-muted text-muted-foreground";
};

const formatActionType = (actionType: string) => {
  return actionType
    .split("_")
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");
};

interface ActivityLog {
  id: string;
  employee_id: string;
  action_type: string;
  entity_type: string;
  entity_id: string | null;
  description: string | null;
  metadata: Record<string, unknown> | null;
  created_at: string;
  employees: {
    employee_name: string;
    department: string | null;
    designation: string | null;
  } | null;
}

export default function EmployeeActivityLogs() {
  const [searchQuery, setSearchQuery] = useState("");
  const [filterAction, setFilterAction] = useState("all");
  const [filterEntity, setFilterEntity] = useState("all");
  const [filterEmployee, setFilterEmployee] = useState("all");

  const { data: logs, isLoading, refetch } = useQuery({
    queryKey: ["employee-activity-logs"],
    queryFn: async () => {
      // Fetch activity logs
      const { data: logsData, error: logsError } = await supabase
        .from("employee_activity_logs" as any)
        .select("*")
        .order("created_at", { ascending: false })
        .limit(500);
      if (logsError) throw logsError;
      
      if (!logsData || logsData.length === 0) return [];
      
      // Fetch employee details for the logs
      const employeeIds = [...new Set(logsData.map((l: any) => l.employee_id))];
      const { data: employeesData } = await supabase
        .from("employees")
        .select("id, employee_name, department, designation")
        .in("id", employeeIds);
      
      const employeeMap = new Map(employeesData?.map(e => [e.id, e]) || []);
      
      return logsData.map((log: any) => ({
        ...log,
        employees: employeeMap.get(log.employee_id) || null
      })) as ActivityLog[];
    },
  });

  const { data: employees } = useQuery({
    queryKey: ["employees-for-filter"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("employees")
        .select("id, employee_name")
        .eq("is_active", true)
        .order("employee_name");
      if (error) throw error;
      return data;
    },
  });

  const filteredLogs = logs?.filter((log) => {
    const matchesAction = filterAction === "all" || log.action_type === filterAction;
    const matchesEntity = filterEntity === "all" || log.entity_type === filterEntity;
    const matchesEmployee = filterEmployee === "all" || log.employee_id === filterEmployee;
    
    if (!searchQuery.trim()) return matchesAction && matchesEntity && matchesEmployee;
    
    const query = searchQuery.toLowerCase();
    const matchesSearch = 
      log.action_type.toLowerCase().includes(query) ||
      log.entity_type.toLowerCase().includes(query) ||
      log.description?.toLowerCase().includes(query) ||
      log.entity_id?.toLowerCase().includes(query) ||
      log.employees?.employee_name.toLowerCase().includes(query);
    
    return matchesAction && matchesEntity && matchesEmployee && matchesSearch;
  });

  const uniqueActions = [...new Set(logs?.map(log => log.action_type) || [])];
  const uniqueEntities = [...new Set(logs?.map(log => log.entity_type) || [])];

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <Activity className="h-6 w-6 text-primary" />
            Employee Activity Logs
          </h1>
          <p className="text-muted-foreground">
            Complete audit trail of employee actions • Auto-deletes after 15 days
          </p>
        </div>
        <Button variant="outline" onClick={() => refetch()}>
          <RefreshCw className="w-4 h-4 mr-2" />
          Refresh
        </Button>
      </div>

      {/* Filters */}
      <div className="flex flex-col lg:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Search logs..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>
        <Select value={filterEmployee} onValueChange={setFilterEmployee}>
          <SelectTrigger className="w-full lg:w-48">
            <SelectValue placeholder="Employee" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Employees</SelectItem>
            {employees?.map((emp) => (
              <SelectItem key={emp.id} value={emp.id}>
                {emp.employee_name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select value={filterAction} onValueChange={setFilterAction}>
          <SelectTrigger className="w-full lg:w-48">
            <SelectValue placeholder="Action type" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Actions</SelectItem>
            {uniqueActions.map((action) => (
              <SelectItem key={action} value={action}>
                {formatActionType(action)}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select value={filterEntity} onValueChange={setFilterEntity}>
          <SelectTrigger className="w-full lg:w-40">
            <SelectValue placeholder="Entity type" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Entities</SelectItem>
            {uniqueEntities.map((entity) => (
              <SelectItem key={entity} value={entity}>
                {entity.charAt(0).toUpperCase() + entity.slice(1).replace("_", " ")}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Stats */}
      {logs && logs.length > 0 && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Card>
            <CardContent className="pt-4">
              <div className="text-2xl font-bold">{logs.length}</div>
              <p className="text-sm text-muted-foreground">Total Logs</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-4">
              <div className="text-2xl font-bold">
                {logs.filter(l => new Date(l.created_at) > new Date(Date.now() - 24*60*60*1000)).length}
              </div>
              <p className="text-sm text-muted-foreground">Last 24 Hours</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-4">
              <div className="text-2xl font-bold">{uniqueActions.length}</div>
              <p className="text-sm text-muted-foreground">Action Types</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-4">
              <div className="text-2xl font-bold">
                {new Set(logs.map(l => l.employee_id)).size}
              </div>
              <p className="text-sm text-muted-foreground">Active Employees</p>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Logs List */}
      {isLoading ? (
        <div className="space-y-3">
          {[...Array(5)].map((_, i) => (
            <Skeleton key={i} className="h-24" />
          ))}
        </div>
      ) : filteredLogs && filteredLogs.length > 0 ? (
        <Card>
          <CardContent className="p-0">
            <div className="divide-y divide-border">
              {filteredLogs.map((log) => {
                const ActionIcon = actionIcons[log.action_type] || Activity;
                const EntityIcon = entityIcons[log.entity_type] || Activity;
                
                return (
                  <div key={log.id} className="p-4 hover:bg-muted/50 transition-colors">
                    <div className="flex items-start gap-4">
                      <div className={`p-2 rounded-lg ${getActionColor(log.action_type)}`}>
                        <ActionIcon className="w-4 h-4" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex flex-wrap items-center gap-2 mb-1">
                          <span className="font-medium text-sm">
                            {log.employees?.employee_name || "Unknown Employee"}
                          </span>
                          {log.employees?.designation && (
                            <Badge variant="outline" className="text-xs">
                              {log.employees.designation}
                            </Badge>
                          )}
                        </div>
                        <div className="flex flex-wrap items-center gap-2 mb-1">
                          <Badge variant="outline" className="font-medium">
                            {formatActionType(log.action_type)}
                          </Badge>
                          <Badge variant="secondary" className="flex items-center gap-1">
                            <EntityIcon className="w-3 h-3" />
                            {log.entity_type.replace("_", " ")}
                          </Badge>
                        </div>
                        {log.description && (
                          <p className="text-sm text-muted-foreground mb-1">{log.description}</p>
                        )}
                        {log.entity_id && (
                          <p className="text-xs text-muted-foreground font-mono truncate">
                            ID: {log.entity_id}
                          </p>
                        )}
                      </div>
                      <div className="text-right text-sm text-muted-foreground shrink-0">
                        <div className="flex items-center gap-1">
                          <Calendar className="w-3 h-3" />
                          {format(new Date(log.created_at), "MMM d, yyyy")}
                        </div>
                        <div className="text-xs">
                          {format(new Date(log.created_at), "h:mm a")}
                        </div>
                        <div className="text-xs mt-1">
                          {formatDistanceToNow(new Date(log.created_at), { addSuffix: true })}
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardContent className="py-16 text-center">
            <Activity className="w-12 h-12 text-muted-foreground/30 mx-auto mb-4" />
            <p className="text-muted-foreground">
              {searchQuery || filterAction !== "all" || filterEntity !== "all" || filterEmployee !== "all"
                ? "No logs match your filters" 
                : "No employee activity logs yet"}
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
