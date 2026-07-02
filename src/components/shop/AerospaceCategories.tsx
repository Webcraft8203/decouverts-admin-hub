import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { motion } from "framer-motion";
import * as Icons from "lucide-react";
import { ArrowRight, Layers, Plane } from "lucide-react";

interface Props {
  selectedId: string | null;
  onSelect: (id: string | null) => void;
}

interface Category {
  id: string;
  name: string;
  description: string | null;
  icon_name: string | null;
  tagline: string | null;
  mission_label: string | null;
}

function getIcon(name: string | null | undefined) {
  if (!name) return Plane;
  const Comp = (Icons as any)[name];
  return Comp || Plane;
}

export function AerospaceCategories({ selectedId, onSelect }: Props) {
  const { data: categories } = useQuery({
    queryKey: ["aerospace-categories"],
    queryFn: async () => {
      const [catsRes, countsRes] = await Promise.all([
        supabase.from("categories").select("*").order("name"),
        supabase
          .from("products")
          .select("category_id")
          .eq("is_discontinued", false as any),
      ]);
      if (catsRes.error) throw catsRes.error;
      const counts = new Map<string, number>();
      (countsRes.data || []).forEach((r: any) => {
        if (!r.category_id) return;
        counts.set(r.category_id, (counts.get(r.category_id) || 0) + 1);
      });
      return (catsRes.data as Category[]).map((c) => ({
        ...c,
        count: counts.get(c.id) || 0,
      }));
    },
  });

  if (!categories || categories.length === 0) return null;

  return (
    <section className="relative py-14 sm:py-20 bg-gradient-to-b from-background to-secondary/20">
      <div
        aria-hidden
        className="absolute inset-0 opacity-[0.25] [mask-image:radial-gradient(ellipse_at_top,black,transparent_70%)]"
        style={{
          backgroundImage:
            "linear-gradient(hsl(var(--border)/0.6) 1px, transparent 1px), linear-gradient(90deg, hsl(var(--border)/0.6) 1px, transparent 1px)",
          backgroundSize: "48px 48px",
        }}
      />

      <div className="relative max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4 mb-10">
          <div>
            <div className="flex items-center gap-2 mb-3">
              <Layers className="w-4 h-4 text-primary" />
              <span className="text-[10px] uppercase tracking-[0.22em] font-bold text-primary">
                Mission Categories
              </span>
            </div>
            <h2 className="text-3xl sm:text-4xl font-bold text-foreground tracking-tight">
              Platforms for every mission.
            </h2>
            <p className="text-sm text-muted-foreground mt-2 max-w-xl">
              Explore purpose-built systems across defence, agriculture, industrial
              inspection and research programs.
            </p>
          </div>
          <button
            onClick={() => onSelect(null)}
            className={`self-start sm:self-auto text-xs font-semibold px-4 py-2 rounded-full border transition-all ${
              !selectedId
                ? "bg-foreground text-background border-foreground"
                : "bg-card border-border/50 text-muted-foreground hover:border-primary/50 hover:text-foreground"
            }`}
          >
            View All Platforms
          </button>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 sm:gap-5">
          {categories.map((c, i) => {
            const Icon = getIcon(c.icon_name);
            const active = selectedId === c.id;
            return (
              <motion.button
                key={c.id}
                initial={{ opacity: 0, y: 16 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.4, delay: i * 0.04 }}
                whileHover={{ y: -6 }}
                onClick={() => onSelect(active ? null : c.id)}
                className={`group relative overflow-hidden rounded-2xl border text-left p-5 sm:p-6 transition-all duration-300 ${
                  active
                    ? "border-primary bg-primary/5 shadow-[0_16px_50px_-12px_hsl(var(--primary)/0.4)]"
                    : "border-border/50 bg-card/70 backdrop-blur-sm hover:border-primary/60 hover:shadow-[0_20px_60px_-18px_hsl(var(--primary)/0.35)]"
                }`}
              >
                {/* Mesh bg */}
                <div
                  aria-hidden
                  className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500 [mask-image:radial-gradient(circle_at_top_right,black,transparent_70%)]"
                  style={{
                    backgroundImage:
                      "linear-gradient(hsl(var(--primary)/0.15) 1px, transparent 1px), linear-gradient(90deg, hsl(var(--primary)/0.15) 1px, transparent 1px)",
                    backgroundSize: "22px 22px",
                  }}
                />
                {/* Corner glow */}
                <div className="absolute -top-10 -right-10 w-32 h-32 rounded-full bg-primary/20 blur-2xl opacity-0 group-hover:opacity-100 transition-opacity" />
                {/* Animated border */}
                <div
                  aria-hidden
                  className="absolute inset-0 rounded-2xl pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity"
                  style={{
                    background:
                      "linear-gradient(120deg, transparent 30%, hsl(var(--primary)/0.4) 50%, transparent 70%)",
                    maskImage:
                      "linear-gradient(black,black) content-box,linear-gradient(black,black)",
                    WebkitMaskComposite: "xor",
                    maskComposite: "exclude",
                    padding: "1px",
                  }}
                />

                <div className="relative flex items-start justify-between mb-4">
                  <div className="relative">
                    <div className="w-12 h-12 rounded-xl bg-background border border-border/60 flex items-center justify-center group-hover:border-primary/50 group-hover:bg-primary/5 transition-colors">
                      <Icon className="w-5 h-5 text-foreground group-hover:text-primary transition-colors" />
                    </div>
                  </div>
                  <ArrowRight className="w-4 h-4 text-muted-foreground group-hover:text-primary group-hover:translate-x-1 transition-all" />
                </div>

                <div className="relative">
                  <h3 className="text-base sm:text-lg font-bold text-foreground tracking-tight leading-tight">
                    {c.name}
                  </h3>
                  <p className="text-[11px] text-muted-foreground mt-1 uppercase tracking-[0.14em] font-semibold">
                    {c.mission_label || c.tagline || "Mission Systems"}
                  </p>
                  <div className="flex items-center justify-between mt-4 pt-4 border-t border-border/40">
                    <span className="text-xs font-semibold text-foreground">
                      {c.count} Platform{c.count === 1 ? "" : "s"}
                    </span>
                    <span className="text-[10px] uppercase tracking-[0.14em] text-primary font-bold opacity-0 group-hover:opacity-100 transition-opacity">
                      Explore
                    </span>
                  </div>
                </div>
              </motion.button>
            );
          })}
        </div>
      </div>
    </section>
  );
}
