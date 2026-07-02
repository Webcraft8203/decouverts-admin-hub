import { useQuery } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { motion } from "framer-motion";
import { Package, ArrowRight, Layers } from "lucide-react";

interface Props {
  productId: string;
}

export function ProductAccessories({ productId }: Props) {
  const navigate = useNavigate();

  const { data: accessories } = useQuery({
    queryKey: ["product-accessories", productId],
    queryFn: async () => {
      const { data } = await supabase
        .from("product_accessories")
        .select("id, accessory_type, display_order, accessory_product_id, products:products!product_accessories_accessory_product_id_fkey(id, name, slug, price, images, brand)")
        .eq("product_id", productId)
        .order("display_order", { ascending: true });
      return (data || []).filter((r: any) => r.products);
    },
    enabled: !!productId,
  });

  if (!accessories || accessories.length === 0) return null;

  return (
    <section className="mt-12 lg:mt-16">
      <div className="mb-6 flex items-end justify-between">
        <div>
          <div className="text-[10px] font-bold uppercase tracking-[0.22em] text-primary mb-1.5">
            Mission Loadout
          </div>
          <h2 className="text-xl sm:text-2xl font-bold text-foreground tracking-tight">
            Accessories & Payloads
          </h2>
        </div>
        <div className="hidden sm:flex items-center gap-1.5 text-[10px] text-muted-foreground font-mono uppercase tracking-[0.14em]">
          <Layers className="w-3.5 h-3.5" /> {accessories.length} modules
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
        {accessories.map((row: any, i: number) => {
          const p = row.products;
          const url = `/product/${p.slug || p.id}`;
          return (
            <motion.button
              key={row.id}
              type="button"
              onClick={() => navigate(url)}
              initial={{ opacity: 0, y: 12 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-40px" }}
              transition={{ duration: 0.35, delay: i * 0.04 }}
              className="group text-left flex items-center gap-3 p-3 rounded-xl border border-border/50 bg-card/80 backdrop-blur-sm hover:border-primary/50 hover:shadow-[0_15px_35px_-15px_hsl(var(--primary)/0.3)] transition-all"
            >
              <div className="w-14 h-14 rounded-lg overflow-hidden bg-gradient-to-br from-secondary/50 to-secondary/20 border border-border/40 flex items-center justify-center flex-shrink-0">
                {p.images?.[0] ? (
                  <img src={p.images[0]} alt={p.name} className="w-full h-full object-contain p-1" />
                ) : (
                  <Package className="w-6 h-6 text-muted-foreground/30" />
                )}
              </div>
              <div className="flex-1 min-w-0">
                {row.accessory_type && (
                  <div className="text-[9px] font-bold uppercase tracking-[0.16em] text-primary mb-0.5">
                    {row.accessory_type}
                  </div>
                )}
                <div className="text-sm font-bold text-foreground leading-tight line-clamp-1 group-hover:text-primary transition-colors">
                  {p.name}
                </div>
                {p.price > 0 && (
                  <div className="text-[11px] font-mono text-muted-foreground mt-0.5">
                    ₹{Number(p.price).toLocaleString("en-IN")}
                  </div>
                )}
              </div>
              <ArrowRight className="w-4 h-4 text-muted-foreground/50 group-hover:text-primary group-hover:translate-x-0.5 transition-all flex-shrink-0" />
            </motion.button>
          );
        })}
      </div>
    </section>
  );
}
