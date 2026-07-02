import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { Layers } from "lucide-react";

interface Props {
  selectedId: string | null;
  onSelect: (id: string | null) => void;
}

export function CategoriesRail({ selectedId, onSelect }: Props) {
  const navigate = useNavigate();
  const { data: categories } = useQuery({
    queryKey: ["public-categories-rail"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("categories")
        .select("*")
        .order("name", { ascending: true });
      if (error) throw error;
      return data as any[];
    },
  });

  if (!categories || categories.length === 0) return null;

  return (
    <section className="border-b border-border/30 bg-gradient-to-b from-secondary/20 to-transparent">
      <div className="max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <Layers className="w-4 h-4 text-primary" />
            <h2 className="text-xs font-bold text-foreground uppercase tracking-[0.15em]">
              Browse by Category
            </h2>
          </div>
        </div>
        <div className="flex gap-2.5 overflow-x-auto scrollbar-none -mx-4 px-4 pb-1 snap-x">
          <motion.button
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.25 }}
            onClick={() => onSelect(null)}
            className={`snap-start flex-shrink-0 px-4 py-2 rounded-full border text-xs font-semibold transition-all ${
              !selectedId
                ? "bg-foreground text-background border-foreground"
                : "bg-card border-border/40 text-muted-foreground hover:border-primary/40 hover:text-foreground"
            }`}
          >
            All
          </motion.button>
          {categories.map((c, i) => (
            <motion.button
              key={c.id}
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.25, delay: 0.02 * i }}
              onClick={() => onSelect(c.id)}
              className={`snap-start flex-shrink-0 px-4 py-2 rounded-full border text-xs font-semibold transition-all ${
                selectedId === c.id
                  ? "bg-foreground text-background border-foreground"
                  : "bg-card border-border/40 text-muted-foreground hover:border-primary/40 hover:text-foreground"
              }`}
            >
              {c.name}
            </motion.button>
          ))}
        </div>
      </div>
    </section>
  );
}
