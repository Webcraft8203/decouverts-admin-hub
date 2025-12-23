import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { Plus, Pencil, Trash2 } from "lucide-react";

interface RawMaterial { id: string; name: string; description: string | null; quantity: number; unit: string; availability_status: string; }

export default function RawMaterials() {
  const [materials, setMaterials] = useState<RawMaterial[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<RawMaterial | null>(null);
  const [formData, setFormData] = useState({ name: "", description: "", quantity: "", unit: "units", availability_status: "available" });
  const { toast } = useToast();

  useEffect(() => { fetchData(); }, []);
  const fetchData = async () => { const { data } = await supabase.from("raw_materials").select("*").order("name"); setMaterials(data || []); setIsLoading(false); };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const data = { name: formData.name, description: formData.description || null, quantity: parseFloat(formData.quantity) || 0, unit: formData.unit, availability_status: formData.availability_status };
    if (editing) { await supabase.from("raw_materials").update(data).eq("id", editing.id); toast({ title: "Material updated" }); }
    else { await supabase.from("raw_materials").insert(data); toast({ title: "Material created" }); }
    setDialogOpen(false); resetForm(); fetchData();
  };

  const resetForm = () => { setFormData({ name: "", description: "", quantity: "", unit: "units", availability_status: "available" }); setEditing(null); };
  const handleDelete = async (id: string) => { if (!confirm("Delete?")) return; await supabase.from("raw_materials").delete().eq("id", id); toast({ title: "Deleted" }); fetchData(); };

  const statusColors: Record<string, string> = { available: "bg-success/10 text-success", low_stock: "bg-warning/10 text-warning", unavailable: "bg-destructive/10 text-destructive" };

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <div><h1 className="text-3xl font-bold text-foreground">Raw Materials</h1><p className="text-muted-foreground">Internal inventory management</p></div>
        <Dialog open={dialogOpen} onOpenChange={(o) => { setDialogOpen(o); if (!o) resetForm(); }}>
          <DialogTrigger asChild><Button><Plus className="mr-2 h-4 w-4" />Add Material</Button></DialogTrigger>
          <DialogContent><DialogHeader><DialogTitle>{editing ? "Edit" : "Add"} Raw Material</DialogTitle></DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div><Label>Name</Label><Input value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })} required /></div>
              <div><Label>Description</Label><Textarea value={formData.description} onChange={(e) => setFormData({ ...formData, description: e.target.value })} /></div>
              <div className="grid grid-cols-2 gap-4">
                <div><Label>Quantity</Label><Input type="number" step="0.01" value={formData.quantity} onChange={(e) => setFormData({ ...formData, quantity: e.target.value })} required /></div>
                <div><Label>Unit</Label><Input value={formData.unit} onChange={(e) => setFormData({ ...formData, unit: e.target.value })} /></div>
              </div>
              <div><Label>Status</Label><Select value={formData.availability_status} onValueChange={(v) => setFormData({ ...formData, availability_status: v })}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent><SelectItem value="available">Available</SelectItem><SelectItem value="low_stock">Low Stock</SelectItem><SelectItem value="unavailable">Unavailable</SelectItem></SelectContent></Select></div>
              <Button type="submit" className="w-full">{editing ? "Update" : "Create"}</Button>
            </form>
          </DialogContent>
        </Dialog>
      </div>
      <Card><CardContent className="p-0">
        <Table><TableHeader><TableRow><TableHead>Name</TableHead><TableHead>Quantity</TableHead><TableHead>Unit</TableHead><TableHead>Status</TableHead><TableHead className="text-right">Actions</TableHead></TableRow></TableHeader>
          <TableBody>{isLoading ? <TableRow><TableCell colSpan={5} className="text-center py-8">Loading...</TableCell></TableRow> : materials.length === 0 ? <TableRow><TableCell colSpan={5} className="text-center py-8 text-muted-foreground">No materials</TableCell></TableRow> : materials.map((m) => (
            <TableRow key={m.id}><TableCell className="font-medium">{m.name}</TableCell><TableCell>{m.quantity}</TableCell><TableCell>{m.unit}</TableCell><TableCell><span className={`px-2 py-1 rounded-full text-xs ${statusColors[m.availability_status]}`}>{m.availability_status.replace("_", " ")}</span></TableCell><TableCell className="text-right"><Button variant="ghost" size="icon" onClick={() => { setEditing(m); setFormData({ name: m.name, description: m.description || "", quantity: String(m.quantity), unit: m.unit, availability_status: m.availability_status }); setDialogOpen(true); }}><Pencil className="h-4 w-4" /></Button><Button variant="ghost" size="icon" onClick={() => handleDelete(m.id)}><Trash2 className="h-4 w-4 text-destructive" /></Button></TableCell></TableRow>
          ))}</TableBody>
        </Table>
      </CardContent></Card>
    </div>
  );
}