import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { WishlistButton } from "@/components/WishlistButton";
import {
  ArrowRight,
  Eye,
  Package,
  Sparkles,
  Flame,
  MapPin,
  Scale,
  Box,
} from "lucide-react";

export interface EngineeredProduct {
  id: string;
  name: string;
  slug?: string | null;
  short_description?: string | null;
  price: number;
  images?: string[] | null;
  stock_quantity: number;
  brand?: string | null;
  categories?: { name: string } | null;
  is_new_arrival?: boolean | null;
  is_bestseller?: boolean | null;
  is_highlighted?: boolean;
  is_coming_soon?: boolean | null;
  is_pre_order?: boolean | null;
  made_in_india?: boolean | null;
  mission_type?: string | null;
  model_3d_url?: string | null;
}

interface QuickSpec {
  label: string;
  value: string;
}

interface Props {
  product: EngineeredProduct;
  specs?: QuickSpec[];
  onQuickView?: (id: string) => void;
  onCompare?: (id: string) => void;
  compareActive?: boolean;
}

export function EngineeredProductCard({
  product,
  specs = [],
  onQuickView,
  onCompare,
  compareActive,
}: Props) {
  const navigate = useNavigate();
  const url = `/product/${product.slug || product.id}`;

  return (
    <motion.div
      initial={{ opacity: 0, y: 24 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-40px" }}
      transition={{ duration: 0.4 }}
      whileHover={{ y: -6 }}
      onClick={() => navigate(url)}
      className="group relative flex flex-col rounded-2xl overflow-hidden border border-border/50 bg-card/80 backdrop-blur-sm cursor-pointer transition-all duration-500 hover:border-primary/50 hover:shadow-[0_28px_70px_-25px_hsl(var(--primary)/0.35)]"
    >
      {/* Image stage */}
      <div className="relative aspect-[4/3] overflow-hidden bg-gradient-to-br from-secondary/40 via-background to-secondary/20">
        {/* Blueprint lines */}
        <div
          aria-hidden
          className="absolute inset-0 opacity-40 [mask-image:radial-gradient(ellipse_at_center,black,transparent_75%)]"
          style={{
            backgroundImage:
              "linear-gradient(hsl(var(--border)/0.5) 1px, transparent 1px), linear-gradient(90deg, hsl(var(--border)/0.5) 1px, transparent 1px)",
            backgroundSize: "24px 24px",
          }}
        />
        {/* Orange under-glow */}
        <div className="absolute inset-x-6 bottom-2 h-6 rounded-full bg-primary/30 blur-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-500" />

        {product.images && product.images[0] ? (
          <motion.img
            src={product.images[0]}
            alt={product.name}
            loading="lazy"
            className="relative w-full h-full object-contain p-6 transition-transform duration-700 ease-out"
            whileHover={{ rotate: -3, scale: 1.05 }}
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <Package className="w-14 h-14 text-muted-foreground/20" />
          </div>
        )}

        {/* Badges */}
        <div className="absolute top-3 left-3 flex flex-col gap-1.5 max-w-[70%]">
          {(product.is_bestseller || product.is_highlighted) && (
            <span className="inline-flex items-center gap-1 text-[9px] font-bold px-2 py-0.5 rounded bg-foreground text-background shadow">
              <Flame className="w-2.5 h-2.5" /> BESTSELLER
            </span>
          )}
          {product.is_new_arrival && (
            <span className="inline-flex items-center gap-1 text-[9px] font-bold px-2 py-0.5 rounded bg-emerald-500 text-white shadow">
              <Sparkles className="w-2.5 h-2.5" /> NEW
            </span>
          )}
          {product.is_coming_soon && (
            <span className="text-[9px] font-bold px-2 py-0.5 rounded bg-sky-500 text-white shadow">
              COMING SOON
            </span>
          )}
          {product.is_pre_order && (
            <span className="text-[9px] font-bold px-2 py-0.5 rounded bg-violet-500 text-white shadow">
              PRE-ORDER
            </span>
          )}
          {product.made_in_india && (
            <span className="inline-flex items-center gap-1 text-[9px] font-bold px-2 py-0.5 rounded bg-primary text-primary-foreground shadow">
              <MapPin className="w-2.5 h-2.5" /> MADE IN INDIA
            </span>
          )}
        </div>

        {/* Right actions */}
        <div className="absolute top-3 right-3 flex flex-col gap-1.5 opacity-0 group-hover:opacity-100 transition-opacity">
          <div
            className="w-8 h-8 rounded-full bg-card/95 backdrop-blur-md border border-border/50 shadow flex items-center justify-center"
            onClick={(e) => e.stopPropagation()}
          >
            <WishlistButton productId={product.id} size="sm" />
          </div>
          {onCompare && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                onCompare(product.id);
              }}
              aria-label="Compare"
              className={`w-8 h-8 rounded-full border shadow flex items-center justify-center transition-colors ${
                compareActive
                  ? "bg-primary text-primary-foreground border-primary"
                  : "bg-card/95 backdrop-blur-md border-border/50 text-foreground hover:text-primary"
              }`}
            >
              <Scale className="w-3.5 h-3.5" />
            </button>
          )}
          {product.model_3d_url && (
            <button
              onClick={(e) => { e.stopPropagation(); navigate(url); }}
              aria-label="3D View"
              className="w-8 h-8 rounded-full bg-card/95 backdrop-blur-md border border-border/50 shadow flex items-center justify-center text-foreground hover:text-primary"
            >
              <Box className="w-3.5 h-3.5" />
            </button>
          )}
        </div>

        {/* Quick view */}
        {onQuickView && (
          <div className="absolute bottom-3 left-3 right-3 opacity-0 translate-y-2 group-hover:opacity-100 group-hover:translate-y-0 transition-all duration-300">
            <button
              onClick={(e) => {
                e.stopPropagation();
                onQuickView(product.id);
              }}
              className="w-full flex items-center justify-center gap-1.5 py-2 rounded-lg bg-card/95 backdrop-blur-md border border-border/50 shadow-md text-[11px] font-semibold text-foreground hover:text-primary transition-colors"
            >
              <Eye className="w-3.5 h-3.5" /> Quick View
            </button>
          </div>
        )}
      </div>

      {/* Info */}
      <div className="relative flex flex-col flex-1 p-4 sm:p-5">
        <div className="flex items-center gap-1.5 mb-1.5">
          {product.brand && (
            <span className="text-[10px] font-bold text-primary uppercase tracking-[0.16em]">
              {product.brand}
            </span>
          )}
          {product.brand && product.categories && (
            <span className="w-1 h-1 rounded-full bg-border" />
          )}
          {product.categories && (
            <span className="text-[10px] font-semibold text-muted-foreground uppercase tracking-[0.14em]">
              {product.mission_type || product.categories.name}
            </span>
          )}
        </div>

        <h3 className="text-base sm:text-lg font-bold text-foreground tracking-tight leading-tight line-clamp-2 min-h-[2.6em] group-hover:text-primary transition-colors">
          {product.name}
        </h3>

        {product.short_description && (
          <p className="mt-1.5 text-xs text-muted-foreground leading-relaxed line-clamp-2">
            {product.short_description}
          </p>
        )}

        {/* Quick spec strip */}
        {specs.length > 0 && (
          <div className="mt-4 grid grid-cols-3 gap-1.5 border-t border-border/40 pt-3">
            {specs.slice(0, 3).map((s) => (
              <div key={s.label} className="min-w-0">
                <div className="text-[9px] font-semibold uppercase tracking-[0.12em] text-muted-foreground truncate">
                  {s.label}
                </div>
                <div className="text-[11px] font-bold text-foreground font-mono truncate">
                  {s.value}
                </div>
              </div>
            ))}
          </div>
        )}

        <div className="mt-auto pt-4 flex items-center justify-between gap-2">
          {product.price > 0 && (
            <div>
              <div className="text-[9px] uppercase tracking-[0.14em] text-muted-foreground font-semibold">
                Starting at
              </div>
              <div className="text-base font-bold text-foreground font-mono">
                ₹{Number(product.price).toLocaleString("en-IN")}
              </div>
            </div>
          )}
          <div className={`flex gap-2 ${product.price > 0 ? "" : "flex-1"}`}>
            <Button
              onClick={(e) => { e.stopPropagation(); navigate(url); }}
              className="h-9 px-3 rounded-lg bg-primary hover:bg-primary/90 text-primary-foreground font-semibold text-[11px] shadow-sm shadow-primary/25 group/btn"
            >
              Explore
              <ArrowRight className="w-3.5 h-3.5 ml-1 transition-transform group-hover/btn:translate-x-0.5" />
            </Button>
            <Button
              variant="outline"
              onClick={(e) => { e.stopPropagation(); navigate(url); }}
              className="h-9 px-3 rounded-lg border-border/60 hover:border-primary hover:text-primary font-semibold text-[11px]"
            >
              Get Quote
            </Button>
          </div>
        </div>
      </div>
    </motion.div>
  );
}
