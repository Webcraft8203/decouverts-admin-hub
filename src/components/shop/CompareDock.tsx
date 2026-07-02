import { motion, AnimatePresence } from "framer-motion";
import { Scale, X, ArrowRight, Package } from "lucide-react";
import { Button } from "@/components/ui/button";

export interface CompareItem {
  id: string;
  name: string;
  image?: string | null;
}

interface Props {
  items: CompareItem[];
  onRemove: (id: string) => void;
  onClear: () => void;
  onOpen: () => void;
  max?: number;
}

export function CompareDock({ items, onRemove, onClear, onOpen, max = 4 }: Props) {
  return (
    <AnimatePresence>
      {items.length > 0 && (
        <motion.div
          initial={{ y: 100, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: 100, opacity: 0 }}
          transition={{ type: "spring", stiffness: 260, damping: 28 }}
          className="fixed bottom-4 left-1/2 -translate-x-1/2 z-40 w-[calc(100%-1.5rem)] max-w-3xl"
        >
          <div className="relative rounded-2xl border border-border/60 bg-card/95 backdrop-blur-xl shadow-[0_25px_60px_-15px_hsl(var(--primary)/0.35)] overflow-hidden">
            {/* Accent line */}
            <div className="absolute top-0 inset-x-0 h-px bg-gradient-to-r from-transparent via-primary to-transparent" />

            <div className="p-3 sm:p-4 flex items-center gap-3">
              <div className="hidden sm:flex items-center gap-2 pr-3 border-r border-border/40">
                <div className="w-8 h-8 rounded-lg bg-primary/10 border border-primary/30 flex items-center justify-center">
                  <Scale className="w-4 h-4 text-primary" />
                </div>
                <div className="min-w-0">
                  <div className="text-[9px] font-bold uppercase tracking-[0.18em] text-primary">Compare</div>
                  <div className="text-[10px] text-muted-foreground font-mono">
                    {items.length}/{max} platforms
                  </div>
                </div>
              </div>

              <div className="flex-1 flex items-center gap-2 overflow-x-auto scrollbar-none">
                {items.map((item) => (
                  <div
                    key={item.id}
                    className="relative flex-shrink-0 group/chip"
                  >
                    <div className="w-14 h-14 rounded-xl overflow-hidden border border-border/50 bg-secondary/40 flex items-center justify-center">
                      {item.image ? (
                        <img src={item.image} alt={item.name} className="w-full h-full object-contain p-1" />
                      ) : (
                        <Package className="w-5 h-5 text-muted-foreground/40" />
                      )}
                    </div>
                    <button
                      onClick={() => onRemove(item.id)}
                      aria-label={`Remove ${item.name}`}
                      className="absolute -top-1.5 -right-1.5 w-5 h-5 rounded-full bg-foreground text-background flex items-center justify-center shadow-md opacity-0 group-hover/chip:opacity-100 transition-opacity"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </div>
                ))}
                {Array.from({ length: Math.max(0, Math.min(max, 3) - items.length) }).map((_, i) => (
                  <div
                    key={`empty-${i}`}
                    className="flex-shrink-0 w-14 h-14 rounded-xl border border-dashed border-border/40"
                  />
                ))}
              </div>

              <div className="flex items-center gap-1.5 flex-shrink-0">
                <button
                  onClick={onClear}
                  className="text-[11px] text-muted-foreground hover:text-foreground px-2 py-1"
                >
                  Clear
                </button>
                <Button
                  onClick={onOpen}
                  disabled={items.length < 2}
                  className="h-9 px-3 rounded-lg bg-primary hover:bg-primary/90 text-primary-foreground font-semibold text-[11px] shadow-sm shadow-primary/25"
                >
                  Compare
                  <ArrowRight className="w-3.5 h-3.5 ml-1" />
                </Button>
              </div>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
