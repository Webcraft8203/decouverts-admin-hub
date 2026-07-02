import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";
import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { WishlistButton } from "@/components/WishlistButton";
import {
  ShoppingCart,
  Package,
  Sparkles,
  Flame,
  MapPin,
  BadgeCheck,
  ArrowRight,
  Loader2,
  X,
  Box,
  FileText,
  Target,
  Cpu,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";

interface Props {
  productId: string | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

type Tab = "overview" | "specs" | "missions";

export function FullscreenQuickView({ productId, open, onOpenChange }: Props) {
  const navigate = useNavigate();
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [imgIdx, setImgIdx] = useState(0);
  const [tab, setTab] = useState<Tab>("overview");

  useEffect(() => {
    if (open) {
      setImgIdx(0);
      setTab("overview");
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [open, productId]);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onOpenChange(false);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onOpenChange]);

  const { data: product, isLoading } = useQuery({
    queryKey: ["fullscreen-quick-view", productId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("products")
        .select("*, categories(name)")
        .eq("id", productId!)
        .maybeSingle();
      if (error) throw error;
      return data as any;
    },
    enabled: !!productId && open,
  });

  const { data: highlights } = useQuery({
    queryKey: ["fullscreen-quick-view-highlights", productId],
    queryFn: async () => {
      const { data } = await supabase
        .from("product_highlights")
        .select("*")
        .eq("product_id", productId!)
        .order("display_order", { ascending: true });
      return data || [];
    },
    enabled: !!productId && open,
  });

  const addToCart = useMutation({
    mutationFn: async () => {
      if (!user || !product) throw new Error("Not authenticated");
      const { data: existing } = await supabase
        .from("cart_items")
        .select("id, quantity")
        .eq("user_id", user.id)
        .eq("product_id", product.id)
        .maybeSingle();
      if (existing) {
        const { error } = await supabase
          .from("cart_items")
          .update({ quantity: existing.quantity + 1 })
          .eq("id", existing.id);
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from("cart_items")
          .insert({ user_id: user.id, product_id: product.id, quantity: 1 });
        if (error) throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["cart-count"] });
      queryClient.invalidateQueries({ queryKey: ["cart-items"] });
      toast.success("Added to cart!");
    },
    onError: () => toast.error("Failed to add to cart"),
  });

  const handleAddToCart = () => {
    if (!user) {
      toast.info("Please login to add items to cart", {
        action: { label: "Login", onClick: () => navigate("/login") },
      });
      return;
    }
    addToCart.mutate();
  };

  const images: string[] = product?.images || [];
  const activeImg = images[imgIdx];

  const applications: string[] = product?.applications || [];

  const nextImg = () =>
    setImgIdx((i) => (images.length ? (i + 1) % images.length : 0));
  const prevImg = () =>
    setImgIdx((i) => (images.length ? (i - 1 + images.length) % images.length : 0));

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2 }}
          className="fixed inset-0 z-50 bg-background/95 backdrop-blur-xl"
          role="dialog"
          aria-modal="true"
          aria-label={product?.name || "Product Quick View"}
        >
          {/* Header */}
          <div className="absolute top-0 inset-x-0 z-20 flex items-center justify-between px-4 sm:px-8 py-4 border-b border-border/40 bg-background/60 backdrop-blur">
            <div className="flex items-center gap-3">
              <div className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse" />
              <div>
                <div className="text-[9px] font-bold uppercase tracking-[0.22em] text-primary">
                  Platform Quick View
                </div>
                {product && (
                  <div className="text-xs text-muted-foreground font-mono">
                    {product.sku || product.id.slice(0, 8)}
                  </div>
                )}
              </div>
            </div>
            <button
              onClick={() => onOpenChange(false)}
              className="w-10 h-10 rounded-xl bg-secondary/60 hover:bg-secondary border border-border/60 flex items-center justify-center transition-colors"
              aria-label="Close"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          <div className="h-full pt-[72px] overflow-y-auto">
            <div className="max-w-[1400px] mx-auto px-4 sm:px-8 py-8">
              {isLoading || !product ? (
                <div className="grid grid-cols-1 lg:grid-cols-5 gap-8">
                  <Skeleton className="lg:col-span-3 aspect-[4/3] rounded-2xl" />
                  <div className="lg:col-span-2 space-y-4">
                    <Skeleton className="h-4 w-1/3" />
                    <Skeleton className="h-10 w-3/4" />
                    <Skeleton className="h-24 w-full" />
                  </div>
                </div>
              ) : (
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.35, ease: "easeOut" }}
                  className="grid grid-cols-1 lg:grid-cols-5 gap-6 lg:gap-10"
                >
                  {/* Gallery */}
                  <div className="lg:col-span-3 space-y-3">
                    <div className="relative aspect-[4/3] rounded-2xl overflow-hidden border border-border/50 bg-gradient-to-br from-secondary/40 via-background to-secondary/20">
                      {/* Blueprint grid */}
                      <div
                        aria-hidden
                        className="absolute inset-0 opacity-30 [mask-image:radial-gradient(ellipse_at_center,black,transparent_75%)]"
                        style={{
                          backgroundImage:
                            "linear-gradient(hsl(var(--border)/0.6) 1px, transparent 1px), linear-gradient(90deg, hsl(var(--border)/0.6) 1px, transparent 1px)",
                          backgroundSize: "32px 32px",
                        }}
                      />
                      {activeImg ? (
                        <motion.img
                          key={activeImg}
                          initial={{ opacity: 0, scale: 0.98 }}
                          animate={{ opacity: 1, scale: 1 }}
                          transition={{ duration: 0.35 }}
                          src={activeImg}
                          alt={product.name}
                          className="relative w-full h-full object-contain p-10"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center">
                          <Package className="w-20 h-20 text-muted-foreground/20" />
                        </div>
                      )}

                      {/* Corner marks */}
                      {["top-3 left-3", "top-3 right-3", "bottom-3 left-3", "bottom-3 right-3"].map(
                        (pos) => (
                          <div
                            key={pos}
                            className={`absolute ${pos} w-4 h-4 border-primary/60`}
                            style={{
                              borderTop: pos.includes("top") ? "2px solid" : undefined,
                              borderBottom: pos.includes("bottom") ? "2px solid" : undefined,
                              borderLeft: pos.includes("left") ? "2px solid" : undefined,
                              borderRight: pos.includes("right") ? "2px solid" : undefined,
                            }}
                          />
                        )
                      )}

                      {/* Nav */}
                      {images.length > 1 && (
                        <>
                          <button
                            onClick={prevImg}
                            className="absolute left-3 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-card/95 border border-border/60 flex items-center justify-center shadow-md hover:bg-card"
                            aria-label="Previous"
                          >
                            <ChevronLeft className="w-4 h-4" />
                          </button>
                          <button
                            onClick={nextImg}
                            className="absolute right-3 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-card/95 border border-border/60 flex items-center justify-center shadow-md hover:bg-card"
                            aria-label="Next"
                          >
                            <ChevronRight className="w-4 h-4" />
                          </button>
                        </>
                      )}

                      {/* Badges */}
                      <div className="absolute top-4 left-4 flex flex-col gap-1.5">
                        {product.is_new_arrival && (
                          <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-1 rounded bg-emerald-500 text-white shadow">
                            <Sparkles className="w-3 h-3" /> NEW
                          </span>
                        )}
                        {(product.is_bestseller || product.is_highlighted) && (
                          <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-1 rounded bg-foreground text-background shadow">
                            <Flame className="w-3 h-3" /> BESTSELLER
                          </span>
                        )}
                        {product.made_in_india && (
                          <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-1 rounded bg-primary text-primary-foreground shadow">
                            <MapPin className="w-3 h-3" /> MADE IN INDIA
                          </span>
                        )}
                      </div>

                      {product.model_3d_url && (
                        <div className="absolute top-4 right-4">
                          <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-1 rounded bg-primary/15 border border-primary/40 text-primary">
                            <Box className="w-3 h-3" /> 3D AVAILABLE
                          </span>
                        </div>
                      )}
                    </div>

                    {images.length > 1 && (
                      <div className="flex gap-2 overflow-x-auto scrollbar-none pb-1">
                        {images.map((src, i) => (
                          <button
                            key={i}
                            onClick={() => setImgIdx(i)}
                            className={`flex-shrink-0 w-16 h-16 rounded-lg overflow-hidden border-2 transition-all ${
                              i === imgIdx
                                ? "border-primary shadow-md"
                                : "border-border/40 hover:border-primary/50"
                            }`}
                          >
                            <img src={src} alt="" className="w-full h-full object-cover" />
                          </button>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Info */}
                  <div className="lg:col-span-2 flex flex-col">
                    <div className="flex items-center gap-2 mb-3">
                      {product.brand && (
                        <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-primary">
                          {product.brand}
                        </span>
                      )}
                      {product.brand && product.categories && (
                        <span className="w-1 h-1 rounded-full bg-border" />
                      )}
                      {product.categories && (
                        <span className="text-[10px] font-semibold uppercase tracking-[0.16em] text-muted-foreground">
                          {product.mission_type || product.categories.name}
                        </span>
                      )}
                    </div>

                    <h1 className="text-2xl sm:text-3xl font-bold text-foreground tracking-tight leading-tight mb-3">
                      {product.name}
                    </h1>

                    {product.short_description && (
                      <p className="text-sm text-muted-foreground leading-relaxed mb-5">
                        {product.short_description}
                      </p>
                    )}

                    <div className="flex items-baseline gap-3 mb-5 pb-5 border-b border-border/40">
                      {product.price > 0 ? (
                        <>
                          <div>
                            <div className="text-[9px] font-bold uppercase tracking-[0.18em] text-muted-foreground">
                              Starting at
                            </div>
                            <div className="text-3xl font-bold text-foreground tracking-tight font-mono">
                              ₹{Number(product.price).toLocaleString("en-IN")}
                            </div>
                          </div>
                        </>
                      ) : (
                        <div className="text-lg font-bold text-foreground">Price on request</div>
                      )}
                      <div className="ml-auto">
                        {product.stock_quantity > 0 && !product.is_coming_soon ? (
                          <span className="inline-flex items-center gap-1.5 text-[11px] font-semibold text-emerald-600 px-2 py-1 rounded bg-emerald-500/10 border border-emerald-500/25">
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                            In Stock
                          </span>
                        ) : product.is_coming_soon ? (
                          <span className="text-[11px] font-semibold text-sky-600 px-2 py-1 rounded bg-sky-500/10 border border-sky-500/25">
                            Coming Soon
                          </span>
                        ) : (
                          <span className="text-[11px] font-semibold text-destructive px-2 py-1 rounded bg-destructive/10">
                            Unavailable
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Tabs */}
                    <div className="flex gap-1 mb-4 border-b border-border/40">
                      {(
                        [
                          { id: "overview", label: "Overview", icon: FileText },
                          { id: "specs", label: "Specifications", icon: Cpu },
                          { id: "missions", label: "Missions", icon: Target },
                        ] as { id: Tab; label: string; icon: any }[]
                      ).map((t) => (
                        <button
                          key={t.id}
                          onClick={() => setTab(t.id)}
                          className={`relative flex items-center gap-1.5 px-3 py-2 text-[11px] font-bold uppercase tracking-[0.12em] transition-colors ${
                            tab === t.id
                              ? "text-primary"
                              : "text-muted-foreground hover:text-foreground"
                          }`}
                        >
                          <t.icon className="w-3.5 h-3.5" />
                          {t.label}
                          {tab === t.id && (
                            <motion.span
                              layoutId="qv-tab"
                              className="absolute -bottom-px inset-x-0 h-0.5 bg-primary"
                            />
                          )}
                        </button>
                      ))}
                    </div>

                    <div className="flex-1 mb-5 min-h-[140px]">
                      {tab === "overview" && (
                        <div className="text-sm text-muted-foreground leading-relaxed whitespace-pre-wrap">
                          {product.description || product.short_description || "No overview available."}
                        </div>
                      )}
                      {tab === "specs" && (
                        <div className="grid grid-cols-2 gap-2">
                          {highlights && highlights.length > 0 ? (
                            highlights.map((h: any) => (
                              <div
                                key={h.id}
                                className="p-3 rounded-lg bg-secondary/40 border border-border/30"
                              >
                                <div className="text-[9px] font-bold uppercase tracking-[0.14em] text-muted-foreground">
                                  {h.label}
                                </div>
                                <div className="text-sm font-bold text-foreground font-mono mt-0.5">
                                  {h.value}
                                </div>
                              </div>
                            ))
                          ) : (
                            <div className="col-span-2 text-xs text-muted-foreground">
                              No specifications available.
                            </div>
                          )}
                        </div>
                      )}
                      {tab === "missions" && (
                        <div className="flex flex-wrap gap-1.5">
                          {applications.length > 0 ? (
                            applications.map((app) => (
                              <span
                                key={app}
                                className="inline-flex items-center gap-1 text-[11px] font-semibold px-2.5 py-1.5 rounded-lg bg-primary/10 border border-primary/25 text-primary"
                              >
                                <Target className="w-3 h-3" /> {app}
                              </span>
                            ))
                          ) : (
                            <div className="text-xs text-muted-foreground">
                              No mission profiles defined.
                            </div>
                          )}
                        </div>
                      )}
                    </div>

                    {/* Actions */}
                    <div className="space-y-2">
                      {product.is_coming_soon ? (
                        <Button
                          variant="outline"
                          className="w-full h-11 rounded-lg font-semibold text-sm border-sky-500/40 text-sky-600 hover:bg-sky-500/5"
                          onClick={() => {
                            onOpenChange(false);
                            navigate(`/product/${product.slug || product.id}`);
                          }}
                        >
                          <BadgeCheck className="w-4 h-4 mr-2" /> Notify Me on Launch
                        </Button>
                      ) : product.price > 0 ? (
                        <Button
                          onClick={handleAddToCart}
                          disabled={product.stock_quantity === 0 || addToCart.isPending}
                          className="w-full h-11 rounded-lg bg-primary hover:bg-primary/90 text-primary-foreground font-semibold text-sm shadow-sm shadow-primary/25"
                        >
                          {addToCart.isPending ? (
                            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                          ) : (
                            <ShoppingCart className="w-4 h-4 mr-2" />
                          )}
                          Add to Cart
                        </Button>
                      ) : (
                        <Button
                          onClick={() => {
                            onOpenChange(false);
                            navigate(`/product/${product.slug || product.id}`);
                          }}
                          className="w-full h-11 rounded-lg bg-primary hover:bg-primary/90 text-primary-foreground font-semibold text-sm"
                        >
                          Request Quote <ArrowRight className="w-4 h-4 ml-2" />
                        </Button>
                      )}

                      <div className="flex gap-2">
                        <Button
                          variant="outline"
                          className="flex-1 h-10 rounded-lg text-xs font-semibold"
                          onClick={() => {
                            onOpenChange(false);
                            navigate(`/product/${product.slug || product.id}`);
                          }}
                        >
                          Full Platform Details <ArrowRight className="w-3.5 h-3.5 ml-1.5" />
                        </Button>
                        <div className="flex items-center px-3 border border-border/50 rounded-lg">
                          <WishlistButton productId={product.id} />
                        </div>
                      </div>
                    </div>
                  </div>
                </motion.div>
              )}
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
