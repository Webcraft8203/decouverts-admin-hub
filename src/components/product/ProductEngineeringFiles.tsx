import { supabase } from "@/integrations/supabase/client";
import { motion } from "framer-motion";
import { Download, FileCode, FileBox, Loader2 } from "lucide-react";
import { useState } from "react";
import { useToast } from "@/hooks/use-toast";

interface Props {
  stepUrl?: string | null;
  stlUrl?: string | null;
  productName?: string;
}

const items = [
  { key: "step", label: "STEP File", ext: "step", icon: FileCode, desc: "Native CAD format for engineering." },
  { key: "stl", label: "STL File", ext: "stl", icon: FileBox, desc: "Mesh format for slicers & 3D printing." },
] as const;

async function resolveDownloadUrl(pathOrUrl: string): Promise<string> {
  if (/^https?:\/\//i.test(pathOrUrl)) return pathOrUrl;
  const { data, error } = await supabase.storage
    .from("product-3d-models")
    .createSignedUrl(pathOrUrl, 60 * 5, { download: true });
  if (error) throw error;
  return data.signedUrl;
}

export function ProductEngineeringFiles({ stepUrl, stlUrl, productName }: Props) {
  const { toast } = useToast();
  const [loading, setLoading] = useState<string | null>(null);
  const available = items.filter((it) => (it.key === "step" ? !!stepUrl : !!stlUrl));
  if (available.length === 0) return null;

  const handleDownload = async (key: string, url: string, ext: string) => {
    try {
      setLoading(key);
      const dl = await resolveDownloadUrl(url);
      const a = document.createElement("a");
      a.href = dl;
      a.download = `${(productName || "model").replace(/[^a-z0-9-_]+/gi, "-").toLowerCase()}.${ext}`;
      a.rel = "noopener";
      document.body.appendChild(a);
      a.click();
      a.remove();
    } catch (e: any) {
      toast({ title: "Download failed", description: e.message, variant: "destructive" });
    } finally {
      setLoading(null);
    }
  };

  return (
    <section className="mt-10 lg:mt-12">
      <div className="flex items-center gap-2.5 mb-4">
        <FileCode className="w-5 h-5 text-primary" />
        <h2 className="text-lg lg:text-xl font-bold text-foreground">Engineering Files</h2>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {available.map((it, i) => {
          const url = it.key === "step" ? stepUrl! : stlUrl!;
          const Icon = it.icon;
          return (
            <motion.button
              key={it.key}
              initial={{ opacity: 0, y: 8 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.3, delay: i * 0.05 }}
              onClick={() => handleDownload(it.key, url, it.ext)}
              disabled={loading === it.key}
              className="group flex items-center gap-3 p-4 rounded-xl border border-border/40 bg-card hover:border-primary/50 hover:bg-card/80 transition-all text-left"
            >
              <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0 group-hover:bg-primary/20 transition-colors">
                <Icon className="w-5 h-5 text-primary" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="text-[10px] uppercase tracking-wider text-muted-foreground font-medium">
                  Download · .{it.ext}
                </div>
                <div className="text-sm font-semibold text-foreground">{it.label}</div>
                <div className="text-[11px] text-muted-foreground/80">{it.desc}</div>
              </div>
              {loading === it.key ? (
                <Loader2 className="w-4 h-4 text-primary animate-spin" />
              ) : (
                <Download className="w-4 h-4 text-muted-foreground group-hover:text-primary transition-colors" />
              )}
            </motion.button>
          );
        })}
      </div>
    </section>
  );
}
