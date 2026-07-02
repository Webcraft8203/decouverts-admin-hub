import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { X, Search } from "lucide-react";

interface Props {
  productId: string; // parent product id (must exist)
  onChanged?: () => void;
}

interface P { id: string; name: string; images: string[] | null; }

export function RelatedProductsPicker({ productId, onChanged }: Props) {
  const [selected, setSelected] = useState<P[]>([]);
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<P[]>([]);

  const load = async () => {
    const { data } = await supabase
      .from("product_related")
      .select("related_product_id, display_order, products:related_product_id(id, name, images)")
      .eq("product_id", productId)
      .order("display_order");
    setSelected((data || []).map((r: any) => r.products).filter(Boolean));
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
    if (selected.find((s) => s.id === p.id)) return;
    await supabase.from("product_related").insert({
      product_id: productId,
      related_product_id: p.id,
      display_order: selected.length,
    });
    await load();
    onChanged?.();
    setQuery("");
    setResults([]);
  };

  const remove = async (id: string) => {
    await supabase
      .from("product_related")
      .delete()
      .eq("product_id", productId)
      .eq("related_product_id", id);
    await load();
    onChanged?.();
  };

  return (
    <div className="space-y-4">
      <div>
        <Label className="text-base">Related Products</Label>
        <p className="text-xs text-muted-foreground">
          Manually pick related products. If empty, related products fall back to same-category automatically.
        </p>
      </div>

      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          className="pl-9"
          placeholder="Search products to add..."
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

      <div className="flex flex-wrap gap-2">
        {selected.length === 0 && (
          <p className="text-sm text-muted-foreground italic">No manual related products.</p>
        )}
        {selected.map((s) => (
          <Badge key={s.id} variant="secondary" className="gap-1 py-1.5 pl-1 pr-2">
            {s.images?.[0] && (
              <img src={s.images[0]} alt="" className="w-5 h-5 rounded object-cover" />
            )}
            {s.name}
            <button type="button" onClick={() => remove(s.id)}>
              <X className="h-3 w-3" />
            </button>
          </Badge>
        ))}
      </div>
    </div>
  );
}
