import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { motion } from "framer-motion";
import { FileText, Download, FileBox, FileCode, Award, File } from "lucide-react";

interface Props { productId: string }

const typeMeta: Record<string, { icon: any; label: string }> = {
  brochure: { icon: FileText, label: "Brochure" },
  manual: { icon: FileBox, label: "Manual" },
  cad: { icon: FileCode, label: "CAD File" },
  firmware: { icon: FileCode, label: "Firmware" },
  certificate: { icon: Award, label: "Certificate" },
  other: { icon: File, label: "Document" },
};

export function ProductDownloads({ productId }: Props) {
  const { data } = useQuery({
    queryKey: ["product-downloads", productId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("product_downloads")
        .select("*")
        .eq("product_id", productId)
        .order("display_order", { ascending: true });
      if (error) throw error;
      return data;
    },
    enabled: !!productId,
  });

  if (!data || data.length === 0) return null;

  return (
    <section className="mt-12 lg:mt-16 border-t border-border/30 pt-8 lg:pt-10">
      <div className="flex items-center gap-2.5 mb-6">
        <Download className="w-5 h-5 text-primary" />
        <h2 className="text-lg lg:text-xl font-bold text-foreground">Downloads & Resources</h2>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {data.map((d: any, i: number) => {
          const meta = typeMeta[d.download_type] || typeMeta.other;
          const Icon = meta.icon;
          return (
            <motion.a
              key={d.id}
              href={d.file_url}
              target="_blank"
              rel="noopener noreferrer"
              initial={{ opacity: 0, y: 8 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.3, delay: i * 0.03 }}
              className="group flex items-center gap-3 p-4 rounded-xl border border-border/30 bg-card/60 hover:border-primary/40 hover:bg-card transition-all"
            >
              <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0 group-hover:bg-primary/20 transition-colors">
                <Icon className="w-5 h-5 text-primary" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="text-[10px] uppercase tracking-wider text-muted-foreground font-medium">{meta.label}</div>
                <div className="text-sm font-semibold text-foreground truncate">{d.title}</div>
                {d.file_size && (
                  <div className="text-[10px] text-muted-foreground/70">{d.file_size}</div>
                )}
              </div>
              <Download className="w-4 h-4 text-muted-foreground group-hover:text-primary transition-colors" />
            </motion.a>
          );
        })}
      </div>
    </section>
  );
}
