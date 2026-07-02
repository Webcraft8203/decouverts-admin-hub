import { useQuery } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import {
  Dialog,
  DialogContent,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Package, ArrowRight, X, Check, Minus, MapPin, Share2 } from "lucide-react";
import { toast } from "sonner";

interface Props {
  ids: string[];
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onRemove: (id: string) => void;
}

export function CompareDialog({ ids, open, onOpenChange, onRemove }: Props) {
  const navigate = useNavigate();

  const { data, isLoading } = useQuery({
    queryKey: ["compare-products", ids.sort().join(",")],
    queryFn: async () => {
      if (ids.length === 0) return { products: [], highlights: [] };
      const [{ data: products }, { data: highlights }] = await Promise.all([
        supabase.from("products").select("*, categories(name)").in("id", ids),
        supabase
          .from("product_highlights")
          .select("*")
          .in("product_id", ids)
          .order("display_order", { ascending: true }),
      ]);
      return { products: products || [], highlights: highlights || [] };
    },
    enabled: open && ids.length > 0,
  });

  const products = (data?.products || []).sort(
    (a: any, b: any) => ids.indexOf(a.id) - ids.indexOf(b.id)
  );
  const highlights = data?.highlights || [];

  // Union of highlight labels across all products
  const specLabels = Array.from(
    new Set(highlights.map((h: any) => h.label))
  );

  const getSpec = (productId: string, label: string) => {
    const h = highlights.find(
      (h: any) => h.product_id === productId && h.label === label
    );
    return h?.value;
  };

  const boolRow = (
    label: string,
    getVal: (p: any) => boolean | null | undefined,
    Icon?: any
  ) => ({ label, getVal, Icon });

  const baseRows = [
    { label: "Category", getVal: (p: any) => p.categories?.name || "—" },
    { label: "Brand", getVal: (p: any) => p.brand || "—" },
    { label: "Mission", getVal: (p: any) => p.mission_type || "—" },
    { label: "SKU", getVal: (p: any) => p.sku || "—" },
    {
      label: "Price",
      getVal: (p: any) =>
        p.price > 0 ? `₹${Number(p.price).toLocaleString("en-IN")}` : "On request",
    },
    {
      label: "Availability",
      getVal: (p: any) =>
        p.is_coming_soon
          ? "Coming Soon"
          : p.is_pre_order
          ? "Pre-Order"
          : p.stock_quantity > 0
          ? "In Stock"
          : "Out of Stock",
    },
  ];

  const flagRows = [
    boolRow("Made in India", (p) => p.made_in_india, MapPin),
    boolRow("Bestseller", (p) => p.is_bestseller || p.is_highlighted),
    boolRow("3D Model Available", (p) => !!p.model_3d_url),
    boolRow("New Arrival", (p) => p.is_new_arrival),
  ];

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-6xl p-0 gap-0 overflow-hidden rounded-2xl">
        <DialogTitle className="sr-only">Compare Platforms</DialogTitle>
        <DialogDescription className="sr-only">
          Side-by-side comparison of selected Decouvertes platforms.
        </DialogDescription>

        <div className="p-5 sm:p-6 border-b border-border/50 bg-secondary/20">
          <div className="flex items-start justify-between gap-4 flex-wrap">
            <div>
              <div className="text-[10px] font-bold uppercase tracking-[0.22em] text-primary mb-1">
                Comparison Matrix
              </div>
              <h2 className="text-xl sm:text-2xl font-bold text-foreground tracking-tight">
                Platform Specifications
              </h2>
              <p className="text-xs text-muted-foreground mt-1">
                Side-by-side technical comparison across up to 4 platforms.
              </p>
            </div>
            {ids.length > 0 && (
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={async () => {
                  try {
                    const url = new URL(window.location.origin + "/shop");
                    url.searchParams.set("compare", ids.join(","));
                    await navigator.clipboard.writeText(url.toString());
                    toast.success("Comparison link copied to clipboard");
                  } catch {
                    toast.error("Could not copy link");
                  }
                }}
                className="h-9 rounded-lg mt-1"
              >
                <Share2 className="w-3.5 h-3.5 mr-1.5" />
                Share Comparison
              </Button>
            )}
          </div>
        </div>


        <div className="max-h-[70vh] overflow-y-auto">
          {isLoading ? (
            <div className="p-6 space-y-3">
              {Array.from({ length: 6 }).map((_, i) => (
                <Skeleton key={i} className="h-10 w-full" />
              ))}
            </div>
          ) : products.length === 0 ? (
            <div className="p-12 text-center text-muted-foreground">
              No products selected.
            </div>
          ) : (
            <table className="w-full text-sm border-separate border-spacing-0">
              <thead className="sticky top-0 z-10 bg-card">
                <tr>
                  <th className="w-[180px] text-left p-4 text-[10px] font-bold uppercase tracking-[0.14em] text-muted-foreground border-b border-border/50 bg-secondary/30">
                    Attribute
                  </th>
                  {products.map((p: any) => (
                    <th
                      key={p.id}
                      className="p-4 border-b border-l border-border/50 bg-card text-left align-top min-w-[200px]"
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex-1 min-w-0">
                          <div className="w-full aspect-[4/3] rounded-lg overflow-hidden bg-secondary/40 border border-border/30 mb-3 flex items-center justify-center">
                            {p.images?.[0] ? (
                              <img
                                src={p.images[0]}
                                alt={p.name}
                                className="w-full h-full object-contain p-3"
                              />
                            ) : (
                              <Package className="w-8 h-8 text-muted-foreground/30" />
                            )}
                          </div>
                          <div className="text-[9px] font-bold uppercase tracking-[0.14em] text-primary">
                            {p.brand || "Decouvertes"}
                          </div>
                          <div className="font-bold text-foreground text-sm leading-tight mt-0.5 line-clamp-2">
                            {p.name}
                          </div>
                        </div>
                        <button
                          onClick={() => onRemove(p.id)}
                          aria-label="Remove"
                          className="w-6 h-6 rounded-full bg-secondary hover:bg-destructive hover:text-destructive-foreground flex items-center justify-center transition-colors flex-shrink-0"
                        >
                          <X className="w-3 h-3" />
                        </button>
                      </div>
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="font-mono">
                {baseRows.map((row, idx) => (
                  <tr key={row.label} className={idx % 2 === 0 ? "bg-background" : "bg-secondary/10"}>
                    <td className="p-3 text-[11px] font-bold uppercase tracking-[0.1em] text-muted-foreground border-b border-border/30">
                      {row.label}
                    </td>
                    {products.map((p: any) => (
                      <td
                        key={p.id}
                        className="p-3 text-xs text-foreground border-b border-l border-border/30 font-semibold"
                      >
                        {row.getVal(p)}
                      </td>
                    ))}
                  </tr>
                ))}

                {specLabels.length > 0 && (
                  <tr>
                    <td
                      colSpan={products.length + 1}
                      className="p-3 pt-5 text-[10px] font-bold uppercase tracking-[0.18em] text-primary bg-secondary/20 border-b border-border/40"
                    >
                      Key Specifications
                    </td>
                  </tr>
                )}
                {specLabels.map((label: any, idx) => (
                  <tr key={label} className={idx % 2 === 0 ? "bg-background" : "bg-secondary/10"}>
                    <td className="p-3 text-[11px] font-bold uppercase tracking-[0.1em] text-muted-foreground border-b border-border/30">
                      {label}
                    </td>
                    {products.map((p: any) => (
                      <td
                        key={p.id}
                        className="p-3 text-xs text-foreground border-b border-l border-border/30 font-semibold"
                      >
                        {getSpec(p.id, label) || <span className="text-muted-foreground/40">—</span>}
                      </td>
                    ))}
                  </tr>
                ))}

                <tr>
                  <td
                    colSpan={products.length + 1}
                    className="p-3 pt-5 text-[10px] font-bold uppercase tracking-[0.18em] text-primary bg-secondary/20 border-b border-border/40"
                  >
                    Attributes
                  </td>
                </tr>
                {flagRows.map((row, idx) => (
                  <tr key={row.label} className={idx % 2 === 0 ? "bg-background" : "bg-secondary/10"}>
                    <td className="p-3 text-[11px] font-bold uppercase tracking-[0.1em] text-muted-foreground border-b border-border/30">
                      {row.label}
                    </td>
                    {products.map((p: any) => (
                      <td
                        key={p.id}
                        className="p-3 border-b border-l border-border/30"
                      >
                        {row.getVal(p) ? (
                          <Check className="w-4 h-4 text-emerald-500" />
                        ) : (
                          <Minus className="w-4 h-4 text-muted-foreground/30" />
                        )}
                      </td>
                    ))}
                  </tr>
                ))}

                <tr>
                  <td className="p-3 border-t border-border/50" />
                  {products.map((p: any) => (
                    <td key={p.id} className="p-3 border-l border-t border-border/50">
                      <Button
                        onClick={() => {
                          onOpenChange(false);
                          navigate(`/product/${p.slug || p.id}`);
                        }}
                        className="w-full h-9 rounded-lg bg-primary hover:bg-primary/90 text-primary-foreground font-semibold text-[11px]"
                      >
                        View Platform
                        <ArrowRight className="w-3.5 h-3.5 ml-1" />
                      </Button>
                    </td>
                  ))}
                </tr>
              </tbody>
            </table>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
