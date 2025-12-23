import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { Plus, Pencil, Trash2, IndianRupee, Package, TrendingDown } from "lucide-react";

interface RawMaterial {
  id: string;
  name: string;
  description: string | null;
  quantity: number;
  unit: string;
  availability_status: string;
  cost_per_unit: number;
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
    availability_status: "available",
    cost_per_unit: "",
  });
  const { toast } = useToast();

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    const { data } = await supabase.from("raw_materials").select("*").order("name");
    setMaterials(data || []);
    setIsLoading(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const data = {
      name: formData.name,
      description: formData.description || null,
      quantity: parseFloat(formData.quantity) || 0,
      unit: formData.unit,
      availability_status: formData.availability_status,
      cost_per_unit: parseFloat(formData.cost_per_unit) || 0,
    };
    if (editing) {
      await supabase.from("raw_materials").update(data).eq("id", editing.id);
      toast({ title: "Material updated" });
    } else {
      await supabase.from("raw_materials").insert(data);
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
      availability_status: "available",
      cost_per_unit: "",
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
      availability_status: m.availability_status,
      cost_per_unit: String(m.cost_per_unit || 0),
    });
    setDialogOpen(true);
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Delete this material?")) return;
    await supabase.from("raw_materials").delete().eq("id", id);
    toast({ title: "Material deleted" });
    fetchData();
  };

  const statusColors: Record<string, string> = {
    available: "bg-success/10 text-success",
    low_stock: "bg-warning/10 text-warning",
    unavailable: "bg-destructive/10 text-destructive",
  };

  // Calculate totals
  const totalCost = materials.reduce((sum, m) => sum + m.quantity * (m.cost_per_unit || 0), 0);
  const totalItems = materials.reduce((sum, m) => sum + m.quantity, 0);
  const lowStockCount = materials.filter((m) => m.availability_status === "low_stock" || m.availability_status === "unavailable").length;

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: "INR",
      maximumFractionDigits: 0,
    }).format(amount);
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Raw Materials</h1>
          <p className="text-muted-foreground">Internal inventory management</p>
        </div>
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
                  <Label>Cost per Unit (₹) *</Label>
                  <Input
                    type="number"
                    step="0.01"
                    min="0"
                    value={formData.cost_per_unit}
                    onChange={(e) => setFormData({ ...formData, cost_per_unit: e.target.value })}
                    placeholder="0.00"
                  />
                </div>
                <div>
                  <Label>Status</Label>
                  <Select
                    value={formData.availability_status}
                    onValueChange={(v) => setFormData({ ...formData, availability_status: v })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="available">Available</SelectItem>
                      <SelectItem value="low_stock">Low Stock</SelectItem>
                      <SelectItem value="unavailable">Unavailable</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <Button type="submit" className="w-full">
                {editing ? "Update" : "Create"} Material
              </Button>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
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
              Needs Attention
            </CardTitle>
            <TrendingDown className={`h-4 w-4 ${lowStockCount > 0 ? "text-warning" : "text-success"}`} />
          </CardHeader>
          <CardContent>
            <div className={`text-2xl font-bold ${lowStockCount > 0 ? "text-warning" : "text-success"}`}>
              {lowStockCount}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              {lowStockCount > 0 ? "Low stock or unavailable" : "All materials stocked"}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Materials Table */}
      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Quantity</TableHead>
                <TableHead>Unit</TableHead>
                <TableHead>Cost/Unit</TableHead>
                <TableHead>Total Cost</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <TableRow>
                  <TableCell colSpan={7} className="text-center py-8">
                    Loading...
                  </TableCell>
                </TableRow>
              ) : materials.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                    No materials added yet
                  </TableCell>
                </TableRow>
              ) : (
                materials.map((m) => (
                  <TableRow key={m.id}>
                    <TableCell className="font-medium">{m.name}</TableCell>
                    <TableCell>{m.quantity.toLocaleString()}</TableCell>
                    <TableCell>{m.unit}</TableCell>
                    <TableCell>₹{(m.cost_per_unit || 0).toLocaleString()}</TableCell>
                    <TableCell className="font-medium">
                      ₹{(m.quantity * (m.cost_per_unit || 0)).toLocaleString()}
                    </TableCell>
                    <TableCell>
                      <span className={`px-2 py-1 rounded-full text-xs ${statusColors[m.availability_status]}`}>
                        {m.availability_status.replace("_", " ")}
                      </span>
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
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
