import { useQuery } from "@tanstack/react-query";
import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import { ArrowRight, Eye } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

interface FeaturedProduct {
  id: string;
  name: string;
  price: number;
  images: string[] | null;
  slug: string | null;
  stock_quantity: number;
  availability_status: string;
  category_id: string | null;
  categories?: { name: string } | null;
}

export const FeaturedProducts = () => {
  const { data: products, isLoading } = useQuery({
    queryKey: ["featured-products-home"],
    queryFn: async () => {
      const { data, error } = await (supabase as any)
        .from("products")
        .select("id, name, price, images, slug, stock_quantity, availability_status, category_id, categories(name)")
        .eq("is_featured", true)
        .order("featured_order", { ascending: true })
        .limit(8);
      if (error) throw error;
      return (data ?? []) as FeaturedProduct[];
    },
  });

  if (isLoading) return null;
  if (!products || products.length === 0) return null;

  return (
    <section className="relative py-16 md:py-20 bg-[hsl(210,20%,98%)] overflow-hidden">
      <div className="absolute -top-40 right-0 w-[560px] h-[560px] rounded-full bg-[radial-gradient(circle,rgba(249,115,22,0.06),transparent_65%)] pointer-events-none" />

      <div className="container mx-auto px-4 sm:px-6 lg:px-8 relative">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-80px" }}
          transition={{ duration: 0.7 }}
          className="text-center max-w-2xl mx-auto mb-14"
        >
          <span className="inline-flex items-center gap-2 py-1 px-3 rounded-full bg-primary/8 text-primary text-[10px] font-bold tracking-[0.22em] uppercase mb-4 border border-primary/20">
            <span className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse" />
            Featured Fleet
          </span>
          <h2 className="text-3xl md:text-5xl font-bold text-slate-900 leading-tight" style={{ fontFamily: "'Montserrat', sans-serif" }}>
            Featured Products
          </h2>
          <p className="mt-3 text-base text-slate-600">
            Designed, built and ready for mission.
          </p>
        </motion.div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5 md:gap-6">
          {products.slice(0, 4).map((p, i) => {
            const image = p.images?.[0];
            const stockLow = p.availability_status === "low_stock";
            const outOfStock = p.availability_status === "out_of_stock" || p.stock_quantity <= 0;
            return (
              <motion.div
                key={p.id}
                initial={{ opacity: 0, y: 24 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: "-60px" }}
                transition={{ duration: 0.55, delay: i * 0.07 }}
                className="group relative bg-white rounded-2xl border border-slate-200/70 overflow-hidden hover:-translate-y-1.5 hover:border-primary/40 hover:shadow-[0_30px_60px_-30px_hsl(var(--primary)/0.4)] transition-all duration-500"
              >
                <div className="absolute inset-x-6 -top-px h-px bg-gradient-to-r from-transparent via-primary/50 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />

                <Link to={`/product/${p.id}`} className="block relative aspect-[4/3] bg-gradient-to-br from-slate-50 to-slate-100 overflow-hidden">
                  {image ? (
                    <img
                      src={image}
                      alt={p.name}
                      loading="lazy"
                      className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700 ease-out"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-slate-300 text-sm">No image</div>
                  )}
                  <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(249,115,22,0.15),transparent_65%)] opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                  {outOfStock ? (
                    <span className="absolute top-3 left-3 text-[10px] font-bold tracking-wider uppercase px-2.5 py-1 rounded-full bg-slate-900/80 text-white backdrop-blur">Out of Stock</span>
                  ) : stockLow ? (
                    <span className="absolute top-3 left-3 text-[10px] font-bold tracking-wider uppercase px-2.5 py-1 rounded-full bg-amber-500/90 text-white backdrop-blur">Low Stock</span>
                  ) : (
                    <span className="absolute top-3 left-3 text-[10px] font-bold tracking-wider uppercase px-2.5 py-1 rounded-full bg-emerald-500/90 text-white backdrop-blur">In Stock</span>
                  )}
                </Link>

                <div className="p-5">
                  {p.categories?.name && (
                    <p className="text-[10px] font-bold tracking-[0.2em] uppercase text-primary mb-1.5">{p.categories.name}</p>
                  )}
                  <Link to={`/product/${p.id}`} className="block">
                    <h3 className="text-base font-bold text-slate-900 leading-snug line-clamp-2 group-hover:text-primary transition-colors">
                      {p.name}
                    </h3>
                  </Link>
                  <div className="mt-3 flex items-center justify-between">
                    <span className="text-lg font-bold text-slate-900 tabular-nums">
                      ₹{Number(p.price).toLocaleString("en-IN")}
                    </span>
                    <div className="flex items-center gap-1.5">
                      <Link
                        to={`/product/${p.id}`}
                        className="w-9 h-9 rounded-full bg-slate-100 text-slate-700 hover:bg-primary hover:text-primary-foreground transition-colors flex items-center justify-center"
                        aria-label="Quick view"
                      >
                        <Eye className="w-4 h-4" />
                      </Link>
                      <Link
                        to={`/product/${p.id}`}
                        className="h-9 px-3.5 rounded-full bg-slate-900 text-white text-[11px] font-bold uppercase tracking-wider hover:bg-primary transition-colors flex items-center gap-1.5"
                      >
                        View
                        <ArrowRight className="w-3 h-3" />
                      </Link>
                    </div>
                  </div>
                </div>
              </motion.div>
            );
          })}
        </div>

        <div className="mt-12 flex justify-center">
          <Link
            to="/shop"
            className="group inline-flex items-center gap-2 h-11 px-6 rounded-full bg-white border border-slate-200 text-slate-800 text-xs font-bold tracking-wider uppercase hover:border-primary hover:text-primary transition-colors"
          >
            Explore Full Fleet
            <ArrowRight className="w-3.5 h-3.5 transition-transform group-hover:translate-x-1" />
          </Link>
        </div>
      </div>
    </section>
  );
};
