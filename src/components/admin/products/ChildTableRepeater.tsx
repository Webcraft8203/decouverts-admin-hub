import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { RepeaterList, RepeaterField } from "./RepeaterList";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { Save, Loader2 } from "lucide-react";

interface Props {
  table: "product_features" | "product_highlights";
  productId: string;
  title: string;
  fields: RepeaterField[];
  emptyItem: Record<string, any>;
}

/**
 * Loads all rows for a product from a child table, lets the admin edit them
 * inline via RepeaterList, and saves the full set on Save (delete + insert).
 */
export function ChildTableRepeater({ table, productId, title, fields, emptyItem }: Props) {
  const [items, setItems] = useState<Record<string, any>[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const { toast } = useToast();

  const load = async () => {
    setLoading(true);
    const { data } = await supabase
      .from(table)
      .select("*")
      .eq("product_id", productId)
      .order("display_order");
    setItems((data as any[]) || []);
    setLoading(false);
  };

  useEffect(() => { if (productId) load(); }, [productId, table]);

  const save = async () => {
    setSaving(true);
    await supabase.from(table).delete().eq("product_id", productId);
    if (items.length > 0) {
      const rows = items.map((it, i) => ({
        ...Object.fromEntries(fields.map((f) => [f.key, it[f.key] ?? null])),
        product_id: productId,
        display_order: i,
      }));
      const { error } = await supabase.from(table).insert(rows as any);
      if (error) {
        toast({ title: "Save failed", description: error.message, variant: "destructive" });
        setSaving(false);
        return;
      }
    }
    toast({ title: `${title} saved` });
    setSaving(false);
    load();
  };

  if (loading) {
    return <div className="flex items-center justify-center py-8"><Loader2 className="h-5 w-5 animate-spin" /></div>;
  }

  return (
    <div className="space-y-4">
      <RepeaterList
        title={title}
        items={items}
        fields={fields}
        onChange={setItems}
        emptyItem={emptyItem}
      />
      <Button type="button" onClick={save} disabled={saving} className="w-full">
        {saving ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" />Saving...</> : <><Save className="mr-2 h-4 w-4" />Save {title}</>}
      </Button>
    </div>
  );
}
