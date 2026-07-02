import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { motion } from "framer-motion";
import { BadgeCheck, ShieldCheck } from "lucide-react";

interface Props {
  productId: string;
}

export function ProductCertifications({ productId }: Props) {
  const { data: certs } = useQuery({
    queryKey: ["product-certifications", productId],
    queryFn: async () => {
      const { data } = await supabase
        .from("product_certifications")
        .select("*")
        .eq("product_id", productId)
        .order("display_order", { ascending: true });
      return data || [];
    },
    enabled: !!productId,
  });

  if (!certs || certs.length === 0) return null;

  return (
    <section className="mt-12 lg:mt-16">
      <div className="mb-6">
        <div className="text-[10px] font-bold uppercase tracking-[0.22em] text-primary mb-1.5">
          Trust & Compliance
        </div>
        <h2 className="text-xl sm:text-2xl font-bold text-foreground tracking-tight">
          Certifications & Standards
        </h2>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
        {certs.map((c: any, i: number) => (
          <motion.div
            key={c.id}
            initial={{ opacity: 0, y: 16 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-40px" }}
            transition={{ duration: 0.35, delay: i * 0.04 }}
            className="group relative flex flex-col items-center text-center rounded-xl border border-border/50 bg-card/80 backdrop-blur-sm p-4 hover:border-primary/50 hover:shadow-[0_15px_40px_-15px_hsl(var(--primary)/0.3)] transition-all"
          >
            <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-secondary/60 to-secondary/20 border border-border/40 flex items-center justify-center mb-3">
              <ShieldCheck className="w-6 h-6 text-primary" />
            </div>
            <div className="text-[11px] font-bold text-foreground leading-tight line-clamp-2">
              {c.cert_name}
            </div>
            {c.issued_by && (
              <div className="text-[10px] text-muted-foreground mt-0.5 line-clamp-1">
                {c.issued_by}
              </div>
            )}
            {c.cert_type && (
              <span className="mt-2 text-[9px] font-bold uppercase tracking-[0.14em] text-primary bg-primary/10 px-2 py-0.5 rounded">
                {c.cert_type}
              </span>
            )}
            <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
              <BadgeCheck className="w-3.5 h-3.5 text-primary" />
            </div>
          </motion.div>
        ))}
      </div>
    </section>
  );
}
