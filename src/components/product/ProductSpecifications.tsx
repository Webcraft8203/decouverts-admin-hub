import { useState, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ChevronDown, ChevronUp, Search, Settings2, Sparkles } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

interface ProductParameter {
  id: string;
  parameter_name: string;
  parameter_value: string;
  display_order: number;
}

interface ProductSpecificationsProps {
  productId: string;
}

const INITIAL_COUNT = 8;

export function ProductSpecifications({ productId }: ProductSpecificationsProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [query, setQuery] = useState("");

  const { data: parameters, isLoading } = useQuery({
    queryKey: ["product-parameters", productId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("product_parameters")
        .select("*")
        .eq("product_id", productId)
        .order("display_order", { ascending: true });
      if (error) throw error;
      return data as ProductParameter[];
    },
    enabled: !!productId,
  });

  const filtered = useMemo(() => {
    if (!parameters) return [];
    const q = query.trim().toLowerCase();
    if (!q) return parameters;
    return parameters.filter(
      (p) =>
        p.parameter_name.toLowerCase().includes(q) ||
        p.parameter_value.toLowerCase().includes(q)
    );
  }, [parameters, query]);

  if (isLoading) {
    return (
      <section className="mt-20">
        <Skeleton className="h-8 w-64 mb-8" />
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {Array.from({ length: 6 }).map((_, i) => (
            <Skeleton key={i} className="h-20 rounded-2xl" />
          ))}
        </div>
      </section>
    );
  }

  if (!parameters || parameters.length === 0) return null;

  const hasMore = filtered.length > INITIAL_COUNT;
  const visible = isExpanded || query ? filtered : filtered.slice(0, INITIAL_COUNT);

  return (
    <section className="mt-20 scroll-mt-24" id="specifications">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-6 mb-10">
        <div className="flex items-center gap-4">
          <div className="relative">
            <div className="absolute inset-0 bg-primary/20 blur-xl rounded-2xl" />
            <div className="relative w-12 h-12 rounded-2xl bg-gradient-to-br from-primary to-primary/70 flex items-center justify-center shadow-lg">
              <Settings2 className="w-6 h-6 text-primary-foreground" />
            </div>
          </div>
          <div>
            <div className="flex items-center gap-2 text-xs font-medium text-primary uppercase tracking-widest mb-1">
              <Sparkles className="w-3 h-3" />
              Full Specs
            </div>
            <h2 className="text-2xl md:text-3xl font-bold text-foreground tracking-tight">
              Technical Specifications
            </h2>
          </div>
        </div>

        {/* Search */}
        <div className="relative w-full md:w-72">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search specifications..."
            className="pl-11 h-11 rounded-full bg-card/60 backdrop-blur-sm border-border/60 focus-visible:ring-primary/40"
          />
        </div>
      </div>

      {/* Grid */}
      {filtered.length === 0 ? (
        <div className="text-center py-12 text-muted-foreground">
          No specifications match "{query}"
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 md:gap-4">
          <AnimatePresence mode="popLayout">
            {visible.map((param, index) => (
              <motion.div
                key={param.id}
                layout
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8 }}
                transition={{ duration: 0.25, delay: Math.min(index * 0.02, 0.2) }}
                className="group relative overflow-hidden rounded-2xl border border-border/60 bg-gradient-to-br from-card/80 to-card/40 backdrop-blur-sm p-5 hover:border-primary/40 hover:shadow-[0_8px_30px_-8px_hsl(var(--primary)/0.25)] transition-all duration-300"
              >
                {/* Hover glow */}
                <div className="absolute -inset-px rounded-2xl bg-gradient-to-br from-primary/0 via-primary/0 to-primary/10 opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none" />
                {/* Accent bar */}
                <div className="absolute left-0 top-1/2 -translate-y-1/2 h-8 w-1 rounded-r-full bg-gradient-to-b from-primary to-primary/40 opacity-60 group-hover:opacity-100 group-hover:h-12 transition-all duration-300" />

                <div className="relative flex items-start justify-between gap-4">
                  <div className="min-w-0 flex-1">
                    <div className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground/80 mb-1.5">
                      {param.parameter_name}
                    </div>
                    <div className="text-base font-semibold text-foreground break-words leading-snug">
                      {param.parameter_value}
                    </div>
                  </div>
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      )}

      {/* Show more / less */}
      {hasMore && !query && (
        <div className="mt-10 flex justify-center">
          <Button
            variant="outline"
            onClick={() => setIsExpanded(!isExpanded)}
            className="rounded-full px-8 h-11 border-border/60 hover:border-primary hover:text-primary hover:bg-primary/5 transition-all"
          >
            {isExpanded ? (
              <>Show Less <ChevronUp className="ml-2 w-4 h-4" /></>
            ) : (
              <>Show All {filtered.length} Specifications <ChevronDown className="ml-2 w-4 h-4" /></>
            )}
          </Button>
        </div>
      )}
    </section>
  );
}
