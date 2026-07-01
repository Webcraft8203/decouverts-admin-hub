import { useQuery } from "@tanstack/react-query";
import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import { ArrowUpRight, Layers } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

interface Category {
  id: string;
  name: string;
  description: string | null;
}

export const ProductCategories = () => {
  const { data: categories } = useQuery({
    queryKey: ["home-categories"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("categories")
        .select("id, name, description")
        .order("name", { ascending: true });
      if (error) throw error;
      return (data ?? []) as Category[];
    },
  });

  if (!categories || categories.length === 0) return null;

  return (
    <section className="relative py-20 md:py-24 bg-white overflow-hidden">
      <div className="absolute inset-0 pointer-events-none bg-[linear-gradient(to_right,rgba(15,23,42,0.04)_1px,transparent_1px),linear-gradient(to_bottom,rgba(15,23,42,0.04)_1px,transparent_1px)] bg-[size:64px_64px] [mask-image:radial-gradient(ellipse_at_center,black_45%,transparent_100%)]" />
      <div className="absolute -bottom-40 left-1/2 -translate-x-1/2 w-[720px] h-[420px] rounded-full bg-[radial-gradient(ellipse,rgba(255,107,0,0.08),transparent_70%)]" />

      <div className="container mx-auto px-4 sm:px-6 lg:px-8 relative">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-80px" }}
          transition={{ duration: 0.6 }}
          className="max-w-2xl mb-14"
        >
          <span className="inline-flex items-center gap-2 py-1 px-3 rounded-full bg-primary/8 text-primary text-[10px] font-bold tracking-[0.22em] uppercase mb-4 border border-primary/20">
            <span className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse" />
            Capabilities
          </span>
          <h2 className="text-3xl md:text-5xl font-bold text-slate-900 leading-tight" style={{ fontFamily: "'Montserrat', sans-serif" }}>
            Built for every mission.
          </h2>
          <p className="mt-3 text-base text-slate-600">
            From agriculture to defence — explore purpose-built drone platforms engineered for real-world operations.
          </p>
        </motion.div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5 md:gap-6">
          {categories.slice(0, 6).map((c, i) => (
            <motion.div
              key={c.id}
              initial={{ opacity: 0, y: 24 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-60px" }}
              transition={{ duration: 0.55, delay: i * 0.06 }}
            >
              <Link
                to={`/shop?category=${encodeURIComponent(c.id)}`}
                className="group relative block rounded-2xl border border-slate-200/70 bg-white p-6 overflow-hidden hover:-translate-y-1.5 hover:border-primary/40 hover:shadow-[0_30px_60px_-30px_hsl(var(--primary)/0.4)] transition-all duration-500"
              >
                {/* Ambient glow */}
                <div className="absolute -top-24 -right-24 w-52 h-52 rounded-full bg-[radial-gradient(circle,hsl(var(--primary)/0.18),transparent_65%)] opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                {/* Corner brackets */}
                <div className="absolute top-4 right-4 w-6 h-6 border-t border-r border-slate-200 group-hover:border-primary/60 transition-colors" />
                <div className="absolute bottom-4 left-4 w-6 h-6 border-b border-l border-slate-200 group-hover:border-primary/60 transition-colors" />

                <div className="relative">
                  <div className="w-12 h-12 rounded-xl bg-slate-50 border border-slate-200 group-hover:bg-primary/10 group-hover:border-primary/40 transition-colors flex items-center justify-center mb-5">
                    <Layers className="w-5 h-5 text-slate-700 group-hover:text-primary transition-colors" />
                  </div>
                  <p className="text-[10px] font-bold tracking-[0.22em] uppercase text-primary mb-2">Category</p>
                  <h3 className="text-xl font-bold text-slate-900 group-hover:text-primary transition-colors">
                    {c.name}
                  </h3>
                  {c.description && (
                    <p className="mt-2 text-sm text-slate-600 line-clamp-2">{c.description}</p>
                  )}
                  <div className="mt-5 inline-flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-slate-700 group-hover:text-primary transition-colors">
                    Explore
                    <ArrowUpRight className="w-3.5 h-3.5 transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
                  </div>
                </div>
              </Link>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
};
