import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { motion } from "framer-motion";
import * as Icons from "lucide-react";
import { Sparkles } from "lucide-react";

interface Props { productId: string }

export function ProductFeatures({ productId }: Props) {
  const { data } = useQuery({
    queryKey: ["product-features", productId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("product_features")
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
    if (!name) return Sparkles;
    const Icon = (Icons as any)[name];
    return Icon || Sparkles;
  };

  return (
    <section className="mt-12 lg:mt-16 border-t border-border/30 pt-8 lg:pt-10">
      <div className="flex items-center gap-2.5 mb-6">
        <Sparkles className="w-5 h-5 text-primary" />
        <h2 className="text-lg lg:text-xl font-bold text-foreground">Key Features</h2>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {data.map((f: any, i: number) => {
          const Icon = resolveIcon(f.icon);
          return (
            <motion.div
              key={f.id}
              initial={{ opacity: 0, y: 12 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-40px" }}
              transition={{ duration: 0.35, delay: i * 0.04 }}
              className="group relative p-5 rounded-2xl border border-border/30 bg-card/60 backdrop-blur-sm hover:border-primary/40 hover:shadow-lg hover:shadow-primary/5 transition-all"
            >
              <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center mb-3 group-hover:bg-primary/20 transition-colors">
                <Icon className="w-5 h-5 text-primary" />
              </div>
              <h3 className="font-semibold text-sm text-foreground mb-1.5">{f.title}</h3>
              {f.description && (
                <p className="text-xs text-muted-foreground leading-relaxed">{f.description}</p>
              )}
            </motion.div>
          );
        })}
      </div>
    </section>
  );
}
