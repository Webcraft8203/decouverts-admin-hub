import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { useActivityLog } from "@/hooks/useActivityLog";
import { Plus, Pencil, Trash2 } from "lucide-react";

interface Category { id: string; name: string; description: string | null; }

export default function Categories() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<Category | null>(null);
  const [formData, setFormData] = useState({ name: "", description: "" });
  const { toast } = useToast();
  const { logActivity } = useActivityLog();

  useEffect(() => { fetchData(); }, []);
  const fetchData = async () => { const { data } = await supabase.from("categories").select("*").order("name"); setCategories(data || []); setIsLoading(false); };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const data = { name: formData.name, description: formData.description || null };
    if (editing) { 
      await supabase.from("categories").update(data).eq("id", editing.id); 
      toast({ title: "Category updated" });
      logActivity({
        actionType: "category_update",
        entityType: "category",
        entityId: editing.id,
        description: `Updated category: ${formData.name}`,
        metadata: { oldName: editing.name, newName: formData.name }
      });
    } else { 
      const { data: newCategory } = await supabase.from("categories").insert(data).select().single(); 
      toast({ title: "Category created" });
      if (newCategory) {
        logActivity({
          actionType: "category_create",
          entityType: "category",
          entityId: newCategory.id,
          description: `Created category: ${formData.name}`
        });
      }
    }
    setDialogOpen(false); setFormData({ name: "", description: "" }); setEditing(null); fetchData();
  };

  const handleDelete = async (id: string) => { 
    const category = categories.find(c => c.id === id);
    if (!confirm("Delete?")) return; 
    await supabase.from("categories").delete().eq("id", id); 
    toast({ title: "Deleted" }); 
    logActivity({
      actionType: "category_delete",
      entityType: "category",
      entityId: id,
      description: `Deleted category: ${category?.name || id}`
    });
    fetchData(); 
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <div><h1 className="text-3xl font-bold text-foreground">Categories</h1><p className="text-muted-foreground">Manage product categories</p></div>
        <Dialog open={dialogOpen} onOpenChange={(o) => { setDialogOpen(o); if (!o) { setEditing(null); setFormData({ name: "", description: "" }); } }}>
          <DialogTrigger asChild><Button><Plus className="mr-2 h-4 w-4" />Add Category</Button></DialogTrigger>
          <DialogContent><DialogHeader><DialogTitle>{editing ? "Edit" : "Add"} Category</DialogTitle></DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div><Label>Name</Label><Input value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })} required /></div>
              <div><Label>Description</Label><Textarea value={formData.description} onChange={(e) => setFormData({ ...formData, description: e.target.value })} /></div>
              <Button type="submit" className="w-full">{editing ? "Update" : "Create"}</Button>
            </form>
          </DialogContent>
        </Dialog>
      </div>
      <Card><CardContent className="p-0">
        <Table><TableHeader><TableRow><TableHead>Name</TableHead><TableHead>Description</TableHead><TableHead className="text-right">Actions</TableHead></TableRow></TableHeader>
          <TableBody>{isLoading ? <TableRow><TableCell colSpan={3} className="text-center py-8">Loading...</TableCell></TableRow> : categories.length === 0 ? <TableRow><TableCell colSpan={3} className="text-center py-8 text-muted-foreground">No categories</TableCell></TableRow> : categories.map((c) => (
            <TableRow key={c.id}><TableCell className="font-medium">{c.name}</TableCell><TableCell className="text-muted-foreground">{c.description || "-"}</TableCell><TableCell className="text-right"><Button variant="ghost" size="icon" onClick={() => { setEditing(c); setFormData({ name: c.name, description: c.description || "" }); setDialogOpen(true); }}><Pencil className="h-4 w-4" /></Button><Button variant="ghost" size="icon" onClick={() => handleDelete(c.id)}><Trash2 className="h-4 w-4 text-destructive" /></Button></TableCell></TableRow>
          ))}</TableBody>
        </Table>
      </CardContent></Card>
    </div>
  );
}