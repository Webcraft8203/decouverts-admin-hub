import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { X, Search } from "lucide-react";

interface Props {
  productId: string;
}

interface P { id: string; name: string; images: string[] | null; }
interface Row { id: string; accessory_type: string | null; products: P | null }

export function AccessoriesPicker({ productId }: Props) {
  const [rows, setRows] = useState<Row[]>([]);
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<P[]>([]);

  const load = async () => {
    const { data } = await supabase
      .from("product_accessories")
      .select("id, accessory_type, display_order, products:products!product_accessories_accessory_product_id_fkey(id, name, images)")
      .eq("product_id", productId)
      .order("display_order");
    setRows(((data as any[]) || []).filter((r) => r.products));
  };

  useEffect(() => { if (productId) load(); }, [productId]);

  useEffect(() => {
    const t = setTimeout(async () => {
      if (!query.trim()) { setResults([]); return; }
      const { data } = await supabase
        .from("products")
        .select("id, name, images")
        .ilike("name", `%${query}%`)
        .neq("id", productId)
        .limit(10);
      setResults(data || []);
    }, 250);
    return () => clearTimeout(t);
  }, [query, productId]);

  const add = async (p: P) => {
    if (rows.find((r) => r.products?.id === p.id)) return;
    await supabase.from("product_accessories").insert({
      product_id: productId,
      accessory_product_id: p.id,
      accessory_type: "Accessory",
      display_order: rows.length,
    });
    await load();
    setQuery("");
    setResults([]);
  };

  const remove = async (rowId: string) => {
    await supabase.from("product_accessories").delete().eq("id", rowId);
    await load();
  };

  const updateType = async (rowId: string, type: string) => {
    setRows((prev) => prev.map((r) => (r.id === rowId ? { ...r, accessory_type: type } : r)));
    await supabase.from("product_accessories").update({ accessory_type: type }).eq("id", rowId);
  };

  return (
    <div className="space-y-4">
      <div>
        <Label className="text-base">Accessories & Payloads</Label>
        <p className="text-xs text-muted-foreground">
          Link other products as compatible payloads, batteries, sensors or bundles.
        </p>
      </div>

      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          className="pl-9"
          placeholder="Search products to add as accessory..."
          value={query}
          onChange={(e) => setQuery(e.target.value)}
        />
        {results.length > 0 && (
          <Card className="absolute z-10 w-full mt-1 max-h-64 overflow-y-auto">
            {results.map((r) => (
              <button
                key={r.id}
                type="button"
                onClick={() => add(r)}
                className="w-full flex items-center gap-3 p-2 hover:bg-muted text-left"
              >
                {r.images?.[0] ? (
                  <img src={r.images[0]} alt={r.name} className="w-10 h-10 rounded object-cover" />
                ) : (
                  <div className="w-10 h-10 rounded bg-muted" />
                )}
                <span className="text-sm">{r.name}</span>
              </button>
            ))}
          </Card>
        )}
      </div>

      <div className="space-y-2">
        {rows.length === 0 && (
          <p className="text-sm text-muted-foreground italic">No accessories linked yet.</p>
        )}
        {rows.map((r) => (
          <div key={r.id} className="flex items-center gap-2 p-2 border rounded-md">
            {r.products?.images?.[0] ? (
              <img src={r.products.images[0]} alt="" className="w-10 h-10 rounded object-cover" />
            ) : (
              <div className="w-10 h-10 rounded bg-muted" />
            )}
            <div className="flex-1 min-w-0">
              <div className="text-sm font-medium truncate">{r.products?.name}</div>
            </div>
            <Input
              value={r.accessory_type || ""}
              onChange={(e) => updateType(r.id, e.target.value)}
              placeholder="Type (Battery, Payload…)"
              className="w-48 h-8 text-xs"
            />
            <Badge variant="ghost" asChild>
              <button type="button" onClick={() => remove(r.id)} className="p-1"><X className="h-4 w-4" /></button>
            </Badge>
          </div>
        ))}
      </div>
    </div>
  );
}
