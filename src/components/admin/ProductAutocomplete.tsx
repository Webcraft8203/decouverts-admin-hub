import { useEffect, useRef, useState } from "react";
import { Input } from "@/components/ui/input";
import { supabase } from "@/integrations/supabase/client";
import { Loader2, Package } from "lucide-react";

export interface ProductMasterLite {
  id: string;
  product_name: string;
  description: string | null;
  hsn_code: string;
  default_gst_rate: number;
  default_unit_price: number;
  category: string | null;
  invoice_count: number;
}

interface Props {
  value: string;
  onChange: (val: string) => void;
  onSelect: (p: ProductMasterLite) => void;
  placeholder?: string;
  required?: boolean;
  disabled?: boolean;
  id?: string;
}

export function ProductAutocomplete({
  value,
  onChange,
  onSelect,
  placeholder = "Search products by name, HSN or category…",
  required,
  disabled,
  id,
}: Props) {
  const [results, setResults] = useState<ProductMasterLite[]>([]);
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const wrapperRef = useRef<HTMLDivElement>(null);
  const tRef = useRef<number | null>(null);

  useEffect(() => {
    const onDoc = (e: MouseEvent) => {
      if (!wrapperRef.current?.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", onDoc);
    return () => document.removeEventListener("mousedown", onDoc);
  }, []);

  useEffect(() => {
    if (tRef.current) window.clearTimeout(tRef.current);
    const q = value.trim();
    if (q.length < 1) {
      setResults([]);
      return;
    }
    tRef.current = window.setTimeout(async () => {
      setLoading(true);
      const like = `%${q}%`;
      const { data } = await (supabase as any)
        .from("products_master")
        .select("id, product_name, description, hsn_code, default_gst_rate, default_unit_price, category, invoice_count")
        .or(`product_name.ilike.${like},hsn_code.ilike.${like},category.ilike.${like}`)
        .order("invoice_count", { ascending: false })
        .limit(10);
      setResults((data as ProductMasterLite[]) || []);
      setLoading(false);
    }, 180);
  }, [value]);

  return (
    <div ref={wrapperRef} className="relative">
      <Input
        id={id}
        value={value}
        onChange={(e) => {
          onChange(e.target.value);
          setOpen(true);
        }}
        onFocus={() => value && setOpen(true)}
        placeholder={placeholder}
        required={required}
        disabled={disabled}
        autoComplete="off"
      />
      {open && (results.length > 0 || loading) && (
        <div className="absolute z-50 mt-1 w-full max-h-72 overflow-y-auto rounded-md border bg-popover text-popover-foreground shadow-md">
          {loading && (
            <div className="flex items-center gap-2 px-3 py-2 text-xs text-muted-foreground">
              <Loader2 className="h-3 w-3 animate-spin" /> Searching…
            </div>
          )}
          {results.map((r) => (
            <button
              type="button"
              key={r.id}
              onClick={() => {
                onSelect(r);
                setOpen(false);
              }}
              className="flex w-full items-start gap-2 px-3 py-2 text-left text-sm hover:bg-accent border-b last:border-b-0"
            >
              <Package className="h-4 w-4 mt-0.5 text-primary shrink-0" />
              <div className="min-w-0 flex-1">
                <div className="font-medium truncate">{r.product_name}</div>
                <div className="text-xs text-muted-foreground truncate">
                  HSN {r.hsn_code} · GST {Number(r.default_gst_rate)}% · ₹{Number(r.default_unit_price).toLocaleString("en-IN")}
                  {r.invoice_count > 0 && <span> · used {r.invoice_count}×</span>}
                </div>
              </div>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
