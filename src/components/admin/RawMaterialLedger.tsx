import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { format } from "date-fns";
import { History, Plus, Minus, RefreshCw, ArrowUpDown, Filter, X } from "lucide-react";
import { Badge } from "@/components/ui/badge";

interface RawMaterial {
  id: string;
  name: string;
}

interface LedgerEntry {
  id: string;
  raw_material_id: string;
  action_type: string;
  quantity_change: number;
  previous_quantity: number;
  new_quantity: number;
  admin_id: string;
  note: string | null;
  created_at: string;
  raw_materials?: {
    name: string;
  };
}

interface RawMaterialLedgerProps {
  materials: RawMaterial[];
  selectedMaterialId?: string;
}

const actionTypeColors: Record<string, string> = {
  add: "bg-success/10 text-success border-success/20",
  use: "bg-destructive/10 text-destructive border-destructive/20",
  adjust: "bg-warning/10 text-warning border-warning/20",
  update: "bg-blue-500/10 text-blue-600 border-blue-500/20",
};

const actionTypeIcons: Record<string, React.ReactNode> = {
  add: <Plus className="h-3 w-3" />,
  use: <Minus className="h-3 w-3" />,
  adjust: <ArrowUpDown className="h-3 w-3" />,
  update: <RefreshCw className="h-3 w-3" />,
};

export function RawMaterialLedger({ materials, selectedMaterialId }: RawMaterialLedgerProps) {
  const [open, setOpen] = useState(false);
  const [entries, setEntries] = useState<LedgerEntry[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [filterMaterial, setFilterMaterial] = useState<string>(selectedMaterialId || "all");
  const [filterAction, setFilterAction] = useState<string>("all");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");

  const fetchLedger = async () => {
    setIsLoading(true);
    let query = supabase
      .from("raw_material_ledger")
      .select("*, raw_materials(name)")
      .order("created_at", { ascending: false })
      .limit(100);

    if (filterMaterial && filterMaterial !== "all") {
      query = query.eq("raw_material_id", filterMaterial);
    }
    if (filterAction && filterAction !== "all") {
      query = query.eq("action_type", filterAction);
    }
    if (dateFrom) {
      query = query.gte("created_at", dateFrom);
    }
    if (dateTo) {
      query = query.lte("created_at", `${dateTo}T23:59:59`);
    }

    const { data } = await query;
    setEntries((data as LedgerEntry[]) || []);
    setIsLoading(false);
  };

  useEffect(() => {
    if (open) {
      fetchLedger();
    }
  }, [open, filterMaterial, filterAction, dateFrom, dateTo]);

  const clearFilters = () => {
    setFilterMaterial("all");
    setFilterAction("all");
    setDateFrom("");
    setDateTo("");
  };

  const hasActiveFilters = filterMaterial !== "all" || filterAction !== "all" || dateFrom || dateTo;

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline">
          <History className="mr-2 h-4 w-4" />
          View Ledger
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-4xl max-h-[85vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <History className="h-5 w-5 text-primary" />
            Raw Material Ledger
          </DialogTitle>
        </DialogHeader>

        {/* Filters */}
        <Card className="border-border/50">
          <CardHeader className="py-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm font-medium flex items-center gap-2">
                <Filter className="h-4 w-4" />
                Filters
              </CardTitle>
              {hasActiveFilters && (
                <Button variant="ghost" size="sm" onClick={clearFilters}>
                  <X className="h-3 w-3 mr-1" />
                  Clear
                </Button>
              )}
            </div>
          </CardHeader>
          <CardContent className="py-2">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              <div>
                <Label className="text-xs">Material</Label>
                <Select value={filterMaterial} onValueChange={setFilterMaterial}>
                  <SelectTrigger className="h-8 text-xs">
                    <SelectValue placeholder="All materials" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All materials</SelectItem>
                    {materials.map((m) => (
                      <SelectItem key={m.id} value={m.id}>
                        {m.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label className="text-xs">Action Type</Label>
                <Select value={filterAction} onValueChange={setFilterAction}>
                  <SelectTrigger className="h-8 text-xs">
                    <SelectValue placeholder="All actions" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All actions</SelectItem>
                    <SelectItem value="add">Added</SelectItem>
                    <SelectItem value="use">Used</SelectItem>
                    <SelectItem value="adjust">Adjusted</SelectItem>
                    <SelectItem value="update">Updated</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label className="text-xs">From Date</Label>
                <Input
                  type="date"
                  className="h-8 text-xs"
                  value={dateFrom}
                  onChange={(e) => setDateFrom(e.target.value)}
                />
              </div>
              <div>
                <Label className="text-xs">To Date</Label>
                <Input
                  type="date"
                  className="h-8 text-xs"
                  value={dateTo}
                  onChange={(e) => setDateTo(e.target.value)}
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Ledger Table */}
        <div className="flex-1 overflow-auto border rounded-md">
          <Table>
            <TableHeader className="sticky top-0 bg-background z-10">
              <TableRow>
                <TableHead className="w-[140px]">Date & Time</TableHead>
                <TableHead>Material</TableHead>
                <TableHead>Action</TableHead>
                <TableHead className="text-right">Change</TableHead>
                <TableHead className="text-right">Previous</TableHead>
                <TableHead className="text-right">New</TableHead>
                <TableHead>Note</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <TableRow>
                  <TableCell colSpan={7} className="text-center py-8">
                    <RefreshCw className="h-4 w-4 animate-spin mx-auto mb-2" />
                    Loading...
                  </TableCell>
                </TableRow>
              ) : entries.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                    No ledger entries found
                  </TableCell>
                </TableRow>
              ) : (
                entries.map((entry) => (
                  <TableRow key={entry.id}>
                    <TableCell className="text-xs text-muted-foreground">
                      {format(new Date(entry.created_at), "dd MMM yyyy")}
                      <br />
                      <span className="text-[10px]">
                        {format(new Date(entry.created_at), "HH:mm:ss")}
                      </span>
                    </TableCell>
                    <TableCell className="font-medium text-sm">
                      {entry.raw_materials?.name || "Unknown"}
                    </TableCell>
                    <TableCell>
                      <Badge
                        variant="outline"
                        className={`text-xs ${actionTypeColors[entry.action_type] || ""}`}
                      >
                        <span className="mr-1">{actionTypeIcons[entry.action_type]}</span>
                        {entry.action_type.charAt(0).toUpperCase() + entry.action_type.slice(1)}
                      </Badge>
                    </TableCell>
                    <TableCell
                      className={`text-right font-mono text-sm ${
                        entry.quantity_change > 0 ? "text-success" : "text-destructive"
                      }`}
                    >
                      {entry.quantity_change > 0 ? "+" : ""}
                      {entry.quantity_change.toLocaleString()}
                    </TableCell>
                    <TableCell className="text-right text-sm text-muted-foreground">
                      {entry.previous_quantity.toLocaleString()}
                    </TableCell>
                    <TableCell className="text-right text-sm font-medium">
                      {entry.new_quantity.toLocaleString()}
                    </TableCell>
                    <TableCell className="text-xs text-muted-foreground max-w-[200px] truncate">
                      {entry.note || "-"}
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>

        <p className="text-xs text-muted-foreground text-center">
          Showing last 100 entries. Use filters to narrow down results.
        </p>
      </DialogContent>
    </Dialog>
  );
}
