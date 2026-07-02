import { useEffect, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { AnimatePresence, motion } from "framer-motion";
import { ChevronLeft, ChevronRight } from "lucide-react";
import Autoplay from "embla-carousel-autoplay";
import { supabase } from "@/integrations/supabase/client";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Carousel,
  CarouselApi,
  CarouselContent,
  CarouselItem,
} from "@/components/ui/carousel";

interface ShopSlide {
  id: string;
  title: string;
  description: string | null;
  image_url: string;
  product_id: string | null;
  is_visible: boolean;
  display_order: number;
}

const AUTOPLAY_MS = 6000;

export function ShopHeroSlider() {
  const [api, setApi] = useState<CarouselApi>();
  const [current, setCurrent] = useState(0);

  const { data: slides, isLoading } = useQuery({
    queryKey: ["shop-slides"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("shop_slides")
        .select("*")
        .eq("is_visible", true)
        .order("display_order", { ascending: true });
      if (error) throw error;
      return data as ShopSlide[];
    },
  });

  useEffect(() => {
    if (!api) return;
    const sync = () => setCurrent(api.selectedScrollSnap());
    sync();
    api.on("select", sync);
    return () => {
      api.off("select", sync);
    };
  }, [api]);

  if (isLoading) {
    return (
      <section className="w-full bg-white">
        <Skeleton className="w-full h-auto max-h-[80vh] aspect-[21/9]" />
      </section>
    );
  }

  if (!slides || slides.length === 0) return null;

  return (
    <section className="relative w-full bg-white">
      <Carousel
        setApi={setApi}
        opts={{ align: "start", loop: true }}
        plugins={[
          Autoplay({
            delay: AUTOPLAY_MS,
            stopOnInteraction: false,
            stopOnMouseEnter: true,
          }),
        ]}
        className="w-full"
      >
        <CarouselContent className="ml-0">
          {slides.map((slide, idx) => (
            <CarouselItem key={slide.id} className="pl-0">
              <div className="w-full flex items-center justify-center">
                <AnimatePresence mode="wait">
                  {idx === current && (
                    <motion.img
                      key={slide.id}
                      src={slide.image_url}
                      alt={slide.title}
                      initial={{ opacity: 0, scale: 1.02 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0 }}
                      transition={{
                        duration: 0.75,
                        ease: [0.22, 1, 0.36, 1],
                      }}
                      className="block w-full h-auto max-h-[80vh] object-contain"
                    />
                  )}
                  {idx !== current && (
                    <img
                      src={slide.image_url}
                      alt=""
                      aria-hidden
                      className="block w-full h-auto max-h-[80vh] object-contain opacity-0"
                    />
                  )}
                </AnimatePresence>
              </div>
            </CarouselItem>
          ))}
        </CarouselContent>

        {slides.length > 1 && (
          <>
            <button
              type="button"
              aria-label="Previous slide"
              onClick={() => api?.scrollPrev()}
              className="absolute left-4 top-1/2 -translate-y-1/2 z-10 w-10 h-10 flex items-center justify-center rounded-full bg-white/90 border border-gray-200 text-foreground/70 hover:text-foreground hover:bg-white transition-colors"
            >
              <ChevronLeft className="w-5 h-5" />
            </button>
            <button
              type="button"
              aria-label="Next slide"
              onClick={() => api?.scrollNext()}
              className="absolute right-4 top-1/2 -translate-y-1/2 z-10 w-10 h-10 flex items-center justify-center rounded-full bg-white/90 border border-gray-200 text-foreground/70 hover:text-foreground hover:bg-white transition-colors"
            >
              <ChevronRight className="w-5 h-5" />
            </button>
          </>
        )}
      </Carousel>

      {slides.length > 1 && (
        <div className="flex items-center justify-center gap-2 py-4">
          {slides.map((_, i) => (
            <button
              key={i}
              onClick={() => api?.scrollTo(i)}
              aria-label={`Go to slide ${i + 1}`}
              className={`h-1.5 rounded-full transition-all ${
                i === current
                  ? "w-8 bg-primary"
                  : "w-1.5 bg-foreground/25 hover:bg-foreground/40"
              }`}
            />
          ))}
        </div>
      )}
    </section>
  );
}
