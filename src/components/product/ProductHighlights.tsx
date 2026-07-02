import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { motion } from "framer-motion";
import * as Icons from "lucide-react";
import { Zap } from "lucide-react";

interface Props { productId: string }

export function ProductHighlights({ productId }: Props) {
  const { data } = useQuery({
    queryKey: ["product-highlights", productId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("product_highlights")
        .select("*")
        .eq("product_id", productId)
        .order("display_order", { ascending: true });
      if (error) throw error;
      return data;
    },
    enabled: !!productId,
  });

  if (!data || data.length === 0) return null;

  const resolveIcon = (name: string | null) => {
    if (!name) return Zap;
    const Icon = (Icons as any)[name];
    return Icon || Zap;
  };

  return (
    <section className="mt-10">
      <div className="rounded-2xl bg-gradient-to-br from-primary/5 via-card to-accent/5 border border-border/30 p-6 lg:p-8">
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-6">
          {data.map((h: any, i: number) => {
            const Icon = resolveIcon(h.icon);
            return (
              <motion.div
                key={h.id}
                initial={{ opacity: 0, y: 10 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.3, delay: i * 0.05 }}
                className="text-center"
              >
                <div className="w-11 h-11 mx-auto mb-2.5 rounded-xl bg-background/60 backdrop-blur flex items-center justify-center border border-border/30">
                  <Icon className="w-5 h-5 text-primary" />
                </div>
                <div className="text-lg lg:text-xl font-bold text-foreground tracking-tight">{h.value}</div>
                <div className="text-[11px] uppercase tracking-wider text-muted-foreground mt-0.5">{h.label}</div>
              </motion.div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
