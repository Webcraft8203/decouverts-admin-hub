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
  RefreshCw
} from "lucide-react";
import { format } from "date-fns";

const actionIcons: Record<string, React.ElementType> = {
  login: LogIn,
  logout: LogOut,
  product_create: Plus,
  product_update: Pencil,
  product_delete: Trash2,
  category_create: Plus,
  category_update: Pencil,
  category_delete: Trash2,
  raw_material_add: Plus,
  raw_material_update: Pencil,
  raw_material_consume: Box,
  raw_material_adjust: RefreshCw,
  order_status_change: ShoppingBag,
  order_update: Pencil,
  order_delete: Trash2,
  invoice_create: FileText,
  customer_block: AlertCircle,
  customer_unblock: User,
};

const entityIcons: Record<string, React.ElementType> = {
  product: Package,
  category: Layers,
  raw_material: Box,
  order: ShoppingBag,
  invoice: FileText,
  user: User,
  system: Activity,
};

const getActionColor = (actionType: string) => {
  if (actionType.includes("create") || actionType.includes("add")) return "bg-green-500/10 text-green-600";
  if (actionType.includes("update") || actionType.includes("change")) return "bg-blue-500/10 text-blue-600";
  if (actionType.includes("delete")) return "bg-destructive/10 text-destructive";
  if (actionType.includes("block")) return "bg-warning/10 text-warning";
  if (actionType.includes("login")) return "bg-primary/10 text-primary";
  return "bg-muted text-muted-foreground";
};

const formatActionType = (actionType: string) => {
  return actionType
    .split("_")
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");
};

export default function ActivityLogs() {
  const [searchQuery, setSearchQuery] = useState("");
  const [filterAction, setFilterAction] = useState("all");
  const [filterEntity, setFilterEntity] = useState("all");

  const { data: logs, isLoading, refetch } = useQuery({
    queryKey: ["activity-logs"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("activity_logs")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(500);
      if (error) throw error;
      return data;
    },
  });

  const filteredLogs = logs?.filter((log) => {
    const matchesAction = filterAction === "all" || log.action_type === filterAction;
    const matchesEntity = filterEntity === "all" || log.entity_type === filterEntity;
    
    if (!searchQuery.trim()) return matchesAction && matchesEntity;
    
    const query = searchQuery.toLowerCase();
    const matchesSearch = 
      log.action_type.toLowerCase().includes(query) ||
      log.entity_type.toLowerCase().includes(query) ||
      log.description?.toLowerCase().includes(query) ||
      log.entity_id?.toLowerCase().includes(query);
    
    return matchesAction && matchesEntity && matchesSearch;
  });

  const uniqueActions = [...new Set(logs?.map(log => log.action_type) || [])];
  const uniqueEntities = [...new Set(logs?.map(log => log.entity_type) || [])];

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <Activity className="h-6 w-6 text-primary" />
            Activity Logs
          </h1>
          <p className="text-muted-foreground">Complete audit trail of admin actions</p>
        </div>
        <Button variant="outline" onClick={() => refetch()}>
          <RefreshCw className="w-4 h-4 mr-2" />
          Refresh
        </Button>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Search logs..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>
        <Select value={filterAction} onValueChange={setFilterAction}>
          <SelectTrigger className="w-full sm:w-48">
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
          <SelectTrigger className="w-full sm:w-40">
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

      {/* Logs List */}
      {isLoading ? (
        <div className="space-y-3">
          {[...Array(5)].map((_, i) => (
            <Skeleton key={i} className="h-20" />
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
              {searchQuery || filterAction !== "all" || filterEntity !== "all" 
                ? "No logs match your filters" 
                : "No activity logs yet"}
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
