import { useQuery } from "@tanstack/react-query";
import { Link } from "react-router-dom";
import { ArrowRight, ArrowLeft, Eye, Sparkles } from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";
import useEmblaCarousel from "embla-carousel-react";
import Autoplay from "embla-carousel-autoplay";
import { supabase } from "@/integrations/supabase/client";
import { cn } from "@/lib/utils";

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
    <section className="relative py-20 md:py-28 bg-background">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 relative">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-6 mb-10 md:mb-14">
          <div className="max-w-2xl">
            <div className="flex items-center gap-3 mb-4">
              <span className="h-px w-10 bg-primary" />
              <p className="text-primary font-semibold tracking-[0.2em] text-xs uppercase">Featured Products</p>
            </div>
            <h2 className="text-4xl md:text-5xl lg:text-[54px] font-bold leading-[1.05] tracking-tight text-foreground">
              Featured Products
            </h2>
            <p className="mt-4 text-base md:text-lg leading-relaxed text-muted-foreground">
              Discover our latest drone platforms, accessories and engineering innovations.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={scrollPrev}
              aria-label="Previous"
              className="h-11 w-11 rounded-md border border-border bg-card text-foreground hover:border-primary hover:text-primary transition-colors flex items-center justify-center"
            >
              <ArrowLeft className="w-4 h-4" />
            </button>
            <button
              onClick={scrollNext}
              aria-label="Next"
              className="h-11 w-11 rounded-md border border-border bg-card text-foreground hover:border-primary hover:text-primary transition-colors flex items-center justify-center"
            >
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Carousel */}
        <div className="relative">
          {/* Edge fades */}
          <div aria-hidden className="pointer-events-none absolute left-0 top-0 z-10 h-full w-12 bg-gradient-to-r from-background to-transparent md:w-20" />
          <div aria-hidden className="pointer-events-none absolute right-0 top-0 z-10 h-full w-12 bg-gradient-to-l from-background to-transparent md:w-20" />

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
                      className="group relative block bg-card rounded-lg border border-border overflow-hidden hover:-translate-y-1 hover:border-primary/40 transition-all duration-300 ease-out"
                    >
                      {/* Image */}
                      <div className="relative aspect-[4/3] bg-secondary overflow-hidden">
                        {image ? (
                          <img
                            src={image}
                            alt={p.name}
                            loading="lazy"
                            className="w-full h-full object-cover group-hover:scale-[1.04] transition-transform duration-500 ease-out"
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center text-muted-foreground/50 text-sm">No image</div>
                        )}

                        {/* Top-left: New badge */}
                        {isNew(p.created_at) && (
                          <span className="absolute top-3 left-3 inline-flex items-center gap-1 text-[10px] font-bold tracking-wider uppercase px-2.5 py-1 rounded bg-primary text-white">
                            <Sparkles className="w-3 h-3" />
                            New
                          </span>
                        )}

                        {/* Top-right: Stock badge */}
                        {outOfStock ? (
                          <span className="absolute top-3 right-3 text-[10px] font-bold tracking-wider uppercase px-2.5 py-1 rounded bg-foreground/85 text-background">Out of Stock</span>
                        ) : stockLow ? (
                          <span className="absolute top-3 right-3 text-[10px] font-bold tracking-wider uppercase px-2.5 py-1 rounded bg-warning text-white">Low Stock</span>
                        ) : (
                          <span className="absolute top-3 right-3 text-[10px] font-bold tracking-wider uppercase px-2.5 py-1 rounded bg-success text-white">In Stock</span>
                        )}
                      </div>

                      {/* Body */}
                      <div className="p-5">
                        {p.categories?.name && (
                          <p className="text-[10px] font-bold tracking-[0.2em] uppercase text-primary mb-2">{p.categories.name}</p>
                        )}
                        <h3 className="text-base font-bold text-foreground leading-snug line-clamp-2 group-hover:text-primary transition-colors min-h-[44px]">
                          {p.name}
                        </h3>
                        {p.description && (
                          <p className="mt-2 text-[13px] leading-relaxed text-muted-foreground line-clamp-2">
                            {p.description}
                          </p>
                        )}
                        <div className="mt-4 flex items-center justify-between">
                          <span className="font-display text-lg font-bold text-foreground tabular-nums">
                            ₹{Number(p.price).toLocaleString("en-IN")}
                          </span>
                          <span className="inline-flex items-center gap-1.5 h-9 px-3.5 rounded-md bg-foreground text-background text-[11px] font-bold uppercase tracking-wider group-hover:bg-primary transition-colors">
                            <Eye className="w-3.5 h-3.5" />
                            Explore
                            <ArrowRight className="w-3 h-3 transition-transform group-hover:translate-x-0.5" />
                          </span>
                        </div>
                      </div>
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
                    selectedIndex === i ? "w-8 bg-primary" : "w-1.5 bg-border hover:bg-muted-foreground/40"
                  )}
                />
              ))}
            </div>
          )}
        </div>

        <div className="mt-10 flex justify-center">
          <Link
            to="/shop"
            className="group inline-flex items-center gap-2 h-11 px-6 rounded-md border border-border bg-card text-foreground text-xs font-bold tracking-wider uppercase hover:border-primary hover:text-primary transition-colors"
          >
            Explore Full Fleet
            <ArrowRight className="w-3.5 h-3.5 transition-transform group-hover:translate-x-1" />
          </Link>
        </div>
      </div>
    </section>
  );
};
