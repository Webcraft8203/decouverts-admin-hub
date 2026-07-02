import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";
import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
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
} from "lucide-react";
import { WishlistButton } from "@/components/WishlistButton";

interface Props {
  productId: string | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function QuickViewModal({ productId, open, onOpenChange }: Props) {
  const navigate = useNavigate();
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [imgIdx, setImgIdx] = useState(0);

  const { data: product, isLoading } = useQuery({
    queryKey: ["quick-view-product", productId],
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
    queryKey: ["quick-view-highlights", productId],
    queryFn: async () => {
      const { data } = await supabase
        .from("product_highlights")
        .select("*")
        .eq("product_id", productId!)
        .order("display_order", { ascending: true })
        .limit(4);
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
  const activeImg = images[imgIdx] || images[0];

  const badges = product
    ? [
        product.is_new_arrival && { label: "NEW", icon: Sparkles, cls: "bg-emerald-500 text-white" },
        (product.is_bestseller || product.is_highlighted) && { label: "BESTSELLER", icon: Flame, cls: "bg-foreground text-background" },
        product.is_coming_soon && { label: "COMING SOON", cls: "bg-sky-500 text-white" },
        product.is_pre_order && { label: "PRE-ORDER", cls: "bg-violet-500 text-white" },
        product.made_in_india && { label: "MADE IN INDIA", icon: MapPin, cls: "bg-orange-500 text-white" },
      ].filter(Boolean)
    : [];

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl p-0 gap-0 overflow-hidden rounded-2xl">
        <button
          onClick={() => onOpenChange(false)}
          className="absolute top-3 right-3 z-30 w-8 h-8 rounded-full bg-card/95 backdrop-blur shadow-md flex items-center justify-center hover:bg-card border border-border/40"
          aria-label="Close"
        >
          <X className="w-4 h-4" />
        </button>

        <DialogTitle className="sr-only">{product?.name || "Product Quick View"}</DialogTitle>
        <DialogDescription className="sr-only">Quick view details for the selected product.</DialogDescription>

        {isLoading || !product ? (
          <div className="flex items-center justify-center py-24">
            <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 max-h-[85vh] overflow-hidden">
            {/* Gallery */}
            <div className="bg-secondary/20 p-4 sm:p-6 flex flex-col">
              <div className="relative aspect-square rounded-xl overflow-hidden bg-card border border-border/20">
                {activeImg ? (
                  <img src={activeImg} alt={product.name} className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center">
                    <Package className="w-16 h-16 text-muted-foreground/20" />
                  </div>
                )}
                {badges.length > 0 && (
                  <div className="absolute top-3 left-3 flex flex-col gap-1.5 max-w-[70%]">
                    {badges.map((b: any) => (
                      <span key={b.label} className={`inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded shadow ${b.cls}`}>
                        {b.icon && <b.icon className="w-2.5 h-2.5" />}
                        {b.label}
                      </span>
                    ))}
                  </div>
                )}
              </div>
              {images.length > 1 && (
                <div className="flex gap-2 mt-3 overflow-x-auto scrollbar-none">
                  {images.slice(0, 6).map((src, i) => (
                    <button
                      key={i}
                      onClick={() => setImgIdx(i)}
                      className={`flex-shrink-0 w-14 h-14 rounded-lg overflow-hidden border-2 transition-all ${
                        i === imgIdx ? "border-primary" : "border-border/30 hover:border-primary/40"
                      }`}
                    >
                      <img src={src} alt="" className="w-full h-full object-cover" />
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Info */}
            <div className="p-5 sm:p-7 flex flex-col overflow-y-auto">
              <div className="flex items-center gap-1.5 mb-2">
                {product.brand && (
                  <span className="text-[10px] text-primary font-bold uppercase tracking-[0.16em]">
                    {product.brand}
                  </span>
                )}
                {product.brand && product.categories && (
                  <span className="w-0.5 h-0.5 rounded-full bg-border" />
                )}
                {product.categories && (
                  <span className="text-[10px] text-muted-foreground uppercase tracking-[0.12em] font-medium">
                    {product.categories.name}
                  </span>
                )}
              </div>

              <h2 className="text-xl sm:text-2xl font-bold text-foreground tracking-tight leading-tight mb-2">
                {product.name}
              </h2>

              {product.short_description && (
                <p className="text-sm text-muted-foreground leading-relaxed mb-4">
                  {product.short_description}
                </p>
              )}

              <div className="flex items-baseline gap-3 mb-5">
                <span className="text-2xl font-bold text-foreground tracking-tight">
                  ₹{Number(product.price).toLocaleString("en-IN")}
                </span>
                {product.stock_quantity > 0 ? (
                  <span className="text-[11px] font-semibold text-emerald-600">In Stock</span>
                ) : (
                  <span className="text-[11px] font-semibold text-destructive">Out of Stock</span>
                )}
              </div>

              {/* Highlights */}
              {highlights && highlights.length > 0 && (
                <div className="grid grid-cols-2 gap-2 mb-5">
                  {highlights.map((h: any) => (
                    <div key={h.id} className="p-2.5 rounded-lg bg-secondary/40 border border-border/20">
                      <div className="text-sm font-bold text-foreground leading-tight">{h.value}</div>
                      <div className="text-[10px] uppercase tracking-wide text-muted-foreground mt-0.5">{h.label}</div>
                    </div>
                  ))}
                </div>
              )}

              {/* Actions */}
              <div className="mt-auto space-y-2 pt-3">
                {product.is_coming_soon ? (
                  <Button
                    className="w-full h-11 rounded-lg font-semibold text-sm border-sky-500/30 text-sky-600 hover:bg-sky-500/5"
                    variant="outline"
                    onClick={() => { onOpenChange(false); navigate(`/product/${product.slug || product.id}`); }}
                  >
                    <BadgeCheck className="w-4 h-4 mr-2" /> Notify Me
                  </Button>
                ) : (
                  <Button
                    onClick={handleAddToCart}
                    disabled={product.stock_quantity === 0 || addToCart.isPending}
                    className="w-full h-11 rounded-lg bg-primary hover:bg-primary/90 text-primary-foreground font-semibold text-sm shadow-sm shadow-primary/20"
                  >
                    {addToCart.isPending ? (
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    ) : (
                      <ShoppingCart className="w-4 h-4 mr-2" />
                    )}
                    Add to Cart
                  </Button>
                )}

                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    className="flex-1 h-10 rounded-lg text-xs font-semibold"
                    onClick={() => { onOpenChange(false); navigate(`/product/${product.slug || product.id}`); }}
                  >
                    View Full Details <ArrowRight className="w-3.5 h-3.5 ml-1.5" />
                  </Button>
                  <div className="flex items-center px-3 border border-border/40 rounded-lg">
                    <WishlistButton productId={product.id} />
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
