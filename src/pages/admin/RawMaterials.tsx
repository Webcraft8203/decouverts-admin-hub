import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { Plus, Pencil, Trash2, IndianRupee, Package, TrendingDown, AlertTriangle, PackageX } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { RawMaterialUsage } from "@/components/admin/RawMaterialUsage";
import { RawMaterialLedger } from "@/components/admin/RawMaterialLedger";
import { useAuth } from "@/hooks/useAuth";

interface RawMaterial {
  id: string;
  name: string;
  description: string | null;
  quantity: number;
  unit: string;
  availability_status: string;
  cost_per_unit: number;
  min_quantity: number;
}

export default function RawMaterials() {
  const [materials, setMaterials] = useState<RawMaterial[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<RawMaterial | null>(null);
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    quantity: "",
    unit: "units",
    cost_per_unit: "",
    min_quantity: "10",
  });
  const { toast } = useToast();
  const { user } = useAuth();

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    const { data } = await supabase.from("raw_materials").select("*").order("name");
    setMaterials(data || []);
    setIsLoading(false);
  };

  const getAutoStatus = (quantity: number, minQuantity: number): string => {
    if (quantity <= 0) return "out_of_stock";
    if (quantity <= minQuantity) return "low_stock";
    return "available";
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const quantity = parseFloat(formData.quantity) || 0;
    const minQuantity = parseFloat(formData.min_quantity) || 10;
    
    const data = {
      name: formData.name,
      description: formData.description || null,
      quantity: quantity,
      unit: formData.unit,
      availability_status: getAutoStatus(quantity, minQuantity),
      cost_per_unit: parseFloat(formData.cost_per_unit) || 0,
      min_quantity: minQuantity,
    };

    if (editing) {
      // Log the change if quantity changed
      if (quantity !== editing.quantity && user) {
        await supabase.from("raw_material_ledger").insert({
          raw_material_id: editing.id,
          action_type: quantity > editing.quantity ? "add" : "adjust",
          quantity_change: quantity - editing.quantity,
          previous_quantity: editing.quantity,
          new_quantity: quantity,
          admin_id: user.id,
          note: "Manual stock update via form",
        });
      }
      await supabase.from("raw_materials").update(data).eq("id", editing.id);
      toast({ title: "Material updated" });
    } else {
      const { data: newMaterial } = await supabase.from("raw_materials").insert(data).select().single();
      // Log initial stock entry
      if (newMaterial && user) {
        await supabase.from("raw_material_ledger").insert({
          raw_material_id: newMaterial.id,
          action_type: "add",
          quantity_change: quantity,
          previous_quantity: 0,
          new_quantity: quantity,
          admin_id: user.id,
          note: "Initial stock entry",
        });
      }
      toast({ title: "Material created" });
    }
    setDialogOpen(false);
    resetForm();
    fetchData();
  };

  const resetForm = () => {
    setFormData({
      name: "",
      description: "",
      quantity: "",
      unit: "units",
      cost_per_unit: "",
      min_quantity: "10",
    });
    setEditing(null);
  };

  const handleEdit = (m: RawMaterial) => {
    setEditing(m);
    setFormData({
      name: m.name,
      description: m.description || "",
      quantity: String(m.quantity),
      unit: m.unit,
      cost_per_unit: String(m.cost_per_unit || 0),
      min_quantity: String(m.min_quantity || 10),
    });
    setDialogOpen(true);
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Delete this material? This will also delete all associated usage records and ledger entries.")) return;
    await supabase.from("raw_materials").delete().eq("id", id);
    toast({ title: "Material deleted" });
    fetchData();
  };

  const getStatusDisplay = (m: RawMaterial) => {
    const isOutOfStock = m.quantity <= 0 || m.availability_status === "out_of_stock";
    const isLowStock = !isOutOfStock && (m.quantity <= m.min_quantity || m.availability_status === "low_stock");
    
    if (isOutOfStock) {
      return {
        color: "bg-destructive/10 text-destructive border-destructive/20",
        icon: <PackageX className="h-3 w-3" />,
        label: "Out of Stock",
      };
    }
    if (isLowStock) {
      return {
        color: "bg-warning/10 text-warning border-warning/20",
        icon: <AlertTriangle className="h-3 w-3" />,
        label: "Low Stock",
      };
    }
    return {
      color: "bg-success/10 text-success border-success/20",
      icon: null,
      label: "Normal",
    };
  };

  // Calculate totals
  const totalCost = materials.reduce((sum, m) => sum + m.quantity * (m.cost_per_unit || 0), 0);
  const totalItems = materials.reduce((sum, m) => sum + m.quantity, 0);
  const outOfStockCount = materials.filter((m) => m.quantity <= 0 || m.availability_status === "out_of_stock").length;
  const lowStockCount = materials.filter((m) => {
    const isOutOfStock = m.quantity <= 0 || m.availability_status === "out_of_stock";
    return !isOutOfStock && (m.quantity <= m.min_quantity || m.availability_status === "low_stock");
  }).length;

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: "INR",
      maximumFractionDigits: 0,
    }).format(amount);
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Raw Materials</h1>
          <p className="text-muted-foreground">Internal inventory management with usage tracking</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <RawMaterialUsage materials={materials} onUsageRecorded={fetchData} />
          <RawMaterialLedger materials={materials} />
          <Dialog
            open={dialogOpen}
            onOpenChange={(o) => {
              setDialogOpen(o);
              if (!o) resetForm();
            }}
          >
            <DialogTrigger asChild>
              <Button>
                <Plus className="mr-2 h-4 w-4" />
                Add Material
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>{editing ? "Edit" : "Add"} Raw Material</DialogTitle>
              </DialogHeader>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <Label>Name *</Label>
                  <Input
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    required
                  />
                </div>
                <div>
                  <Label>Description</Label>
                  <Textarea
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label>Quantity *</Label>
                    <Input
                      type="number"
                      step="0.01"
                      value={formData.quantity}
                      onChange={(e) => setFormData({ ...formData, quantity: e.target.value })}
                      required
                    />
                  </div>
                  <div>
                    <Label>Unit</Label>
                    <Input
                      value={formData.unit}
                      onChange={(e) => setFormData({ ...formData, unit: e.target.value })}
                    />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label>Min Stock Threshold *</Label>
                    <Input
                      type="number"
                      step="0.01"
                      min="0"
                      value={formData.min_quantity}
                      onChange={(e) => setFormData({ ...formData, min_quantity: e.target.value })}
                      placeholder="10"
                    />
                    <p className="text-xs text-muted-foreground mt-1">Alert when stock falls below</p>
                  </div>
                  <div>
                    <Label>Cost per Unit (₹)</Label>
                    <Input
                      type="number"
                      step="0.01"
                      min="0"
                      value={formData.cost_per_unit}
                      onChange={(e) => setFormData({ ...formData, cost_per_unit: e.target.value })}
                      placeholder="0.00"
                    />
                  </div>
                </div>
                <Button type="submit" className="w-full">
                  {editing ? "Update" : "Create"} Material
                </Button>
              </form>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <Card className="border-primary/20 bg-primary/5">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Total Investment
            </CardTitle>
            <IndianRupee className="h-4 w-4 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-primary">{formatCurrency(totalCost)}</div>
            <p className="text-xs text-muted-foreground mt-1">
              Across {materials.length} materials
            </p>
          </CardContent>
        </Card>

        <Card className="border-blue-500/20 bg-blue-500/5">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Total Stock
            </CardTitle>
            <Package className="h-4 w-4 text-blue-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">
              {totalItems.toLocaleString()}
            </div>
            <p className="text-xs text-muted-foreground mt-1">Combined units in stock</p>
          </CardContent>
        </Card>

        <Card className={`${lowStockCount > 0 ? "border-warning/20 bg-warning/5" : "border-success/20 bg-success/5"}`}>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Low Stock
            </CardTitle>
            <TrendingDown className={`h-4 w-4 ${lowStockCount > 0 ? "text-warning" : "text-success"}`} />
          </CardHeader>
          <CardContent>
            <div className={`text-2xl font-bold ${lowStockCount > 0 ? "text-warning" : "text-success"}`}>
              {lowStockCount}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              {lowStockCount > 0 ? "Below threshold" : "All stocked well"}
            </p>
          </CardContent>
        </Card>

        <Card className={`${outOfStockCount > 0 ? "border-destructive/20 bg-destructive/5" : "border-success/20 bg-success/5"}`}>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Out of Stock
            </CardTitle>
            <PackageX className={`h-4 w-4 ${outOfStockCount > 0 ? "text-destructive" : "text-success"}`} />
          </CardHeader>
          <CardContent>
            <div className={`text-2xl font-bold ${outOfStockCount > 0 ? "text-destructive" : "text-success"}`}>
              {outOfStockCount}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              {outOfStockCount > 0 ? "Need immediate restock" : "All available"}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Materials Table */}
      <Card>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead className="text-right">Quantity</TableHead>
                  <TableHead className="text-right">Min Threshold</TableHead>
                  <TableHead>Unit</TableHead>
                  <TableHead className="text-right">Cost/Unit</TableHead>
                  <TableHead className="text-right">Total Cost</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading ? (
                  <TableRow>
                    <TableCell colSpan={8} className="text-center py-8">
                      Loading...
                    </TableCell>
                  </TableRow>
                ) : materials.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={8} className="text-center py-8 text-muted-foreground">
                      No materials added yet
                    </TableCell>
                  </TableRow>
                ) : (
                  materials.map((m) => {
                    const status = getStatusDisplay(m);
                    return (
                      <TableRow key={m.id}>
                        <TableCell>
                          <div>
                            <span className="font-medium">{m.name}</span>
                            {m.description && (
                              <p className="text-xs text-muted-foreground truncate max-w-[200px]">
                                {m.description}
                              </p>
                            )}
                          </div>
                        </TableCell>
                        <TableCell className="text-right font-medium">
                          {m.quantity.toLocaleString()}
                        </TableCell>
                        <TableCell className="text-right text-muted-foreground">
                          {m.min_quantity.toLocaleString()}
                        </TableCell>
                        <TableCell>{m.unit}</TableCell>
                        <TableCell className="text-right">₹{(m.cost_per_unit || 0).toLocaleString()}</TableCell>
                        <TableCell className="text-right font-medium">
                          ₹{(m.quantity * (m.cost_per_unit || 0)).toLocaleString()}
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline" className={`text-xs ${status.color}`}>
                            {status.icon && <span className="mr-1">{status.icon}</span>}
                            {status.label}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-right">
                          <Button variant="ghost" size="icon" onClick={() => handleEdit(m)}>
                            <Pencil className="h-4 w-4" />
                          </Button>
                          <Button variant="ghost" size="icon" onClick={() => handleDelete(m.id)}>
                            <Trash2 className="h-4 w-4 text-destructive" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    );
                  })
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
