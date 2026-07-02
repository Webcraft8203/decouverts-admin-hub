import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { motion } from "framer-motion";
import { Milestone, Rocket, CheckCircle2, Zap } from "lucide-react";

interface Props {
  productId: string;
}

export function ProductTimeline({ productId }: Props) {
  const { data: items } = useQuery({
    queryKey: ["product-timeline", productId],
    queryFn: async () => {
      const { data } = await supabase
        .from("product_timeline")
        .select("*")
        .eq("product_id", productId)
        .order("display_order", { ascending: true });
      return data || [];
    },
    enabled: !!productId,
  });

  if (!items || items.length === 0) return null;

  return (
    <section className="mt-12 lg:mt-16">
      <div className="mb-6">
        <div className="text-[10px] font-bold uppercase tracking-[0.22em] text-primary mb-1.5">
          Engineering Journey
        </div>
        <h2 className="text-xl sm:text-2xl font-bold text-foreground tracking-tight">
          Development Timeline
        </h2>
      </div>

      <div className="relative">
        {/* Vertical spine */}
        <div className="absolute left-3 sm:left-4 top-2 bottom-2 w-px bg-gradient-to-b from-primary/60 via-border to-primary/20" />

        <div className="space-y-5">
          {items.map((it: any, i: number) => (
            <motion.div
              key={it.id}
              initial={{ opacity: 0, x: -12 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true, margin: "-40px" }}
              transition={{ duration: 0.35, delay: i * 0.05 }}
              className="relative pl-10 sm:pl-14"
            >
              {/* Node */}
              <div className="absolute left-0 top-1 w-6 h-6 sm:w-8 sm:h-8 rounded-full bg-card border-2 border-primary/60 flex items-center justify-center shadow-md shadow-primary/10">
                <div className="w-2 h-2 rounded-full bg-primary animate-pulse" />
              </div>

              <div className="rounded-xl border border-border/50 bg-card/80 backdrop-blur-sm p-4 hover:border-primary/40 transition-colors">
                <div className="flex items-start justify-between gap-3 mb-1 flex-wrap">
                  <div className="flex items-center gap-2">
                    {it.stage && (
                      <span className="text-[9px] font-bold uppercase tracking-[0.14em] text-primary bg-primary/10 px-1.5 py-0.5 rounded">
                        {it.stage}
                      </span>
                    )}
                    <h3 className="text-sm font-bold text-foreground tracking-tight">
                      {it.title}
                    </h3>
                  </div>
                  {it.event_date && (
                    <span className="text-[10px] font-mono uppercase tracking-[0.14em] text-muted-foreground flex-shrink-0">
                      {new Date(it.event_date).toLocaleDateString(undefined, { year: "numeric", month: "short" })}
                    </span>
                  )}
                </div>
                {it.description && (
                  <p className="text-xs text-muted-foreground leading-relaxed">
                    {it.description}
                  </p>
                )}
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
