import { useQuery } from "@tanstack/react-query";
import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import { ArrowRight, ArrowLeft, Eye, Sparkles } from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";
import useEmblaCarousel from "embla-carousel-react";
import Autoplay from "embla-carousel-autoplay";
import { supabase } from "@/integrations/supabase/client";
import { cn } from "@/lib/utils";

const ORANGE = "#FF6B00";

interface FeaturedProduct {
  id: string;
  name: string;
  description: string | null;
  price: number;
  images: string[] | null;
  slug: string | null;
  stock_quantity: number;
  availability_status: string;
  category_id: string | null;
  created_at: string;
  categories?: { name: string } | null;
}

export const FeaturedProducts = () => {
  const { data: products, isLoading } = useQuery({
    queryKey: ["featured-products-home"],
    queryFn: async () => {
      const { data, error } = await (supabase as any)
        .from("products")
        .select("id, name, description, price, images, slug, stock_quantity, availability_status, category_id, created_at, categories(name)")
        .eq("is_featured", true)
        .order("featured_order", { ascending: true })
        .limit(16);
      if (error) throw error;
      return (data ?? []) as FeaturedProduct[];
    },
  });

  const autoplayRef = useRef(
    Autoplay({ delay: 5000, stopOnInteraction: false, stopOnMouseEnter: true })
  );
  const [emblaRef, emblaApi] = useEmblaCarousel(
    { loop: true, align: "start", dragFree: false, containScroll: "trimSnaps" },
    [autoplayRef.current]
  );

  const [selectedIndex, setSelectedIndex] = useState(0);
  const [scrollSnaps, setScrollSnaps] = useState<number[]>([]);

  const onSelect = useCallback(() => {
    if (!emblaApi) return;
    setSelectedIndex(emblaApi.selectedScrollSnap());
  }, [emblaApi]);

  useEffect(() => {
    if (!emblaApi) return;
    setScrollSnaps(emblaApi.scrollSnapList());
    emblaApi.on("select", onSelect);
    emblaApi.on("reInit", onSelect);
    onSelect();
  }, [emblaApi, onSelect]);

  const scrollPrev = useCallback(() => emblaApi?.scrollPrev(), [emblaApi]);
  const scrollNext = useCallback(() => emblaApi?.scrollNext(), [emblaApi]);

  if (isLoading) return null;
  if (!products || products.length === 0) return null;

  const isNew = (createdAt: string) => {
    const days = (Date.now() - new Date(createdAt).getTime()) / (1000 * 60 * 60 * 24);
    return days <= 30;
  };

  return (
    <section className="relative py-16 md:py-24 bg-[hsl(210,20%,98%)] overflow-hidden">
      {/* Ambient glow */}
      <div className="absolute -top-40 right-0 w-[560px] h-[560px] rounded-full bg-[radial-gradient(circle,rgba(255,107,0,0.08),transparent_65%)] pointer-events-none" />
      <div className="absolute -bottom-40 left-0 w-[500px] h-[500px] rounded-full bg-[radial-gradient(circle,rgba(255,107,0,0.05),transparent_65%)] pointer-events-none" />

      <div className="container mx-auto px-4 sm:px-6 lg:px-8 relative">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-80px" }}
          transition={{ duration: 0.7 }}
          className="flex flex-col md:flex-row md:items-end md:justify-between gap-6 mb-10 md:mb-14"
        >
          <div className="max-w-2xl">
            <span
              className="inline-flex items-center gap-2 rounded-full border px-4 py-1.5 text-[11px] font-semibold uppercase tracking-[0.24em]"
              style={{
                borderColor: "rgba(255,107,0,0.35)",
                color: ORANGE,
                background: "rgba(255,107,0,0.06)",
              }}
            >
              <span className="h-1.5 w-1.5 rounded-full animate-pulse" style={{ background: ORANGE }} />
              Featured Products
            </span>
            <h2 className="mt-5 text-4xl md:text-5xl lg:text-[54px] font-bold leading-[1.05] tracking-tight text-slate-900">
              Featured Products
            </h2>
            <p className="mt-4 text-base md:text-lg leading-relaxed text-slate-600">
              Discover our latest drone platforms, accessories and engineering innovations.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={scrollPrev}
              aria-label="Previous"
              className="h-12 w-12 rounded-full border border-slate-200 bg-white text-slate-700 hover:border-primary hover:text-primary hover:shadow-[0_10px_30px_-12px_rgba(255,107,0,0.5)] transition-all flex items-center justify-center"
            >
              <ArrowLeft className="w-4 h-4" />
            </button>
            <button
              onClick={scrollNext}
              aria-label="Next"
              className="h-12 w-12 rounded-full border border-slate-200 bg-white text-slate-700 hover:border-primary hover:text-primary hover:shadow-[0_10px_30px_-12px_rgba(255,107,0,0.5)] transition-all flex items-center justify-center"
            >
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </motion.div>

        {/* Carousel */}
        <div className="relative">
          {/* Edge fades */}
          <div aria-hidden className="pointer-events-none absolute left-0 top-0 z-10 h-full w-12 bg-gradient-to-r from-[hsl(210,20%,98%)] to-transparent md:w-20" />
          <div aria-hidden className="pointer-events-none absolute right-0 top-0 z-10 h-full w-12 bg-gradient-to-l from-[hsl(210,20%,98%)] to-transparent md:w-20" />

          <div className="overflow-hidden -mx-2" ref={emblaRef}>
            <div className="flex touch-pan-y">
              {products.map((p) => {
                const image = p.images?.[0];
                const stockLow = p.availability_status === "low_stock";
                const outOfStock = p.availability_status === "out_of_stock" || p.stock_quantity <= 0;
                return (
                  <div
                    key={p.id}
                    className="shrink-0 grow-0 px-2 basis-full sm:basis-1/2 lg:basis-1/3 xl:basis-1/4"
                  >
                    <Link
                      to={`/product/${p.id}`}
                      className="group relative block bg-white rounded-[20px] border border-slate-200/70 overflow-hidden hover:-translate-y-2 hover:border-primary/40 hover:shadow-[0_40px_80px_-30px_hsl(var(--primary)/0.45)] transition-all duration-500 ease-out"
                    >
                      <div className="absolute inset-x-6 -top-px h-px bg-gradient-to-r from-transparent via-primary/60 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />

                      {/* Image */}
                      <div className="relative aspect-[4/3] bg-gradient-to-br from-slate-50 to-slate-100 overflow-hidden">
                        {image ? (
                          <img
                            src={image}
                            alt={p.name}
                            loading="lazy"
                            className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-[700ms] ease-out"
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center text-slate-300 text-sm">No image</div>
                        )}
                        <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(255,107,0,0.18),transparent_65%)] opacity-0 group-hover:opacity-100 transition-opacity duration-500" />

                        {/* Top-left: New badge */}
                        {isNew(p.created_at) && (
                          <span className="absolute top-3 left-3 inline-flex items-center gap-1 text-[10px] font-bold tracking-wider uppercase px-2.5 py-1 rounded-full bg-primary text-white shadow-md">
                            <Sparkles className="w-3 h-3" />
                            New
                          </span>
                        )}

                        {/* Top-right: Stock badge */}
                        {outOfStock ? (
                          <span className="absolute top-3 right-3 text-[10px] font-bold tracking-wider uppercase px-2.5 py-1 rounded-full bg-slate-900/85 text-white backdrop-blur">Out of Stock</span>
                        ) : stockLow ? (
                          <span className="absolute top-3 right-3 text-[10px] font-bold tracking-wider uppercase px-2.5 py-1 rounded-full bg-amber-500/90 text-white backdrop-blur">Low Stock</span>
                        ) : (
                          <span className="absolute top-3 right-3 text-[10px] font-bold tracking-wider uppercase px-2.5 py-1 rounded-full bg-emerald-500/90 text-white backdrop-blur">In Stock</span>
                        )}
                      </div>

                      {/* Body */}
                      <div className="p-5">
                        {p.categories?.name && (
                          <p className="text-[10px] font-bold tracking-[0.2em] uppercase text-primary mb-2">{p.categories.name}</p>
                        )}
                        <h3 className="text-base font-bold text-slate-900 leading-snug line-clamp-2 group-hover:text-primary transition-colors min-h-[44px]">
                          {p.name}
                        </h3>
                        {p.description && (
                          <p className="mt-2 text-[13px] leading-relaxed text-slate-500 line-clamp-2">
                            {p.description}
                          </p>
                        )}
                        <div className="mt-4 flex items-center justify-between">
                          <span className="text-lg font-bold text-slate-900 tabular-nums">
                            ₹{Number(p.price).toLocaleString("en-IN")}
                          </span>
                          <span className="inline-flex items-center gap-1.5 h-9 px-3.5 rounded-full bg-slate-900 text-white text-[11px] font-bold uppercase tracking-wider group-hover:bg-primary transition-colors">
                            <Eye className="w-3.5 h-3.5" />
                            Explore
                            <ArrowRight className="w-3 h-3 transition-transform group-hover:translate-x-0.5" />
                          </span>
                        </div>
                      </div>

                      {/* Orange accent line */}
                      <span
                        aria-hidden
                        className="absolute bottom-0 left-0 h-[3px] w-0 transition-all duration-500 ease-out group-hover:w-full"
                        style={{ background: ORANGE }}
                      />
                    </Link>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Pagination Dots */}
          {scrollSnaps.length > 1 && (
            <div className="mt-8 flex items-center justify-center gap-2">
              {scrollSnaps.map((_, i) => (
                <button
                  key={i}
                  onClick={() => emblaApi?.scrollTo(i)}
                  aria-label={`Go to slide ${i + 1}`}
                  className={cn(
                    "h-1.5 rounded-full transition-all duration-300",
                    selectedIndex === i ? "w-8 bg-primary" : "w-1.5 bg-slate-300 hover:bg-slate-400"
                  )}
                />
              ))}
            </div>
          )}
        </div>

        <div className="mt-10 flex justify-center">
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
