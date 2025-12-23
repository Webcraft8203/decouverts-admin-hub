import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { Save } from "lucide-react";

interface Product { id: string; name: string; stock_quantity: number; availability_status: string; }

export default function Inventory() {
  const [products, setProducts] = useState<Product[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [changes, setChanges] = useState<Record<string, number>>({});
  const { toast } = useToast();

  useEffect(() => { fetchData(); }, []);
  const fetchData = async () => { const { data } = await supabase.from("products").select("id, name, stock_quantity, availability_status").order("name"); setProducts(data || []); setIsLoading(false); };

  const handleSave = async (id: string) => {
    const qty = changes[id];
    if (qty === undefined) return;
    const status = qty > 0 ? "in_stock" : "out_of_stock";
    await supabase.from("products").update({ stock_quantity: qty, availability_status: status }).eq("id", id);
    toast({ title: "Stock updated" });
    setChanges((prev) => { const n = { ...prev }; delete n[id]; return n; });
    fetchData();
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <div><h1 className="text-3xl font-bold text-foreground">Inventory</h1><p className="text-muted-foreground">Manage product stock levels</p></div>
      <Card><CardContent className="p-0">
        <Table><TableHeader><TableRow><TableHead>Product</TableHead><TableHead>Current Stock</TableHead><TableHead>Status</TableHead><TableHead className="text-right">Actions</TableHead></TableRow></TableHeader>
          <TableBody>{isLoading ? <TableRow><TableCell colSpan={4} className="text-center py-8">Loading...</TableCell></TableRow> : products.length === 0 ? <TableRow><TableCell colSpan={4} className="text-center py-8 text-muted-foreground">No products</TableCell></TableRow> : products.map((p) => (
            <TableRow key={p.id}><TableCell className="font-medium">{p.name}</TableCell><TableCell><Input type="number" className="w-24" value={changes[p.id] ?? p.stock_quantity} onChange={(e) => setChanges({ ...changes, [p.id]: parseInt(e.target.value) || 0 })} /></TableCell><TableCell><span className={`px-2 py-1 rounded-full text-xs ${p.availability_status === "in_stock" ? "bg-success/10 text-success" : "bg-destructive/10 text-destructive"}`}>{p.availability_status === "in_stock" ? "In Stock" : "Out of Stock"}</span></TableCell><TableCell className="text-right">{changes[p.id] !== undefined && <Button size="sm" onClick={() => handleSave(p.id)}><Save className="h-4 w-4 mr-1" />Save</Button>}</TableCell></TableRow>
          ))}</TableBody>
        </Table>
      </CardContent></Card>
    </div>
  );
}