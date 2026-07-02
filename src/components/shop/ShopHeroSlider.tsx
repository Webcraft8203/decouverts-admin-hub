import { useQuery } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { ArrowRight } from "lucide-react";
import {
  Carousel,
  CarouselApi,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
} from "@/components/ui/carousel";
import Autoplay from "embla-carousel-autoplay";
import { useEffect, useState } from "react";

interface ShopSlide {
  id: string;
  title: string;
  description: string | null;
  image_url: string;
  product_id: string | null;
  is_visible: boolean;
  display_order: number;
}

export function ShopHeroSlider() {
  const navigate = useNavigate();
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
    setCurrent(api.selectedScrollSnap());
    const onSelect = () => setCurrent(api.selectedScrollSnap());
    api.on("select", onSelect);
    return () => {
      api.off("select", onSelect);
    };
  }, [api]);

  if (isLoading) {
    return (
      <section className="bg-secondary/20">
        <Skeleton className="w-full h-[420px] sm:h-[520px] lg:h-[600px]" />
      </section>
    );
  }

  if (!slides || slides.length === 0) {
    return null;
  }

  const handleCta = (slide: ShopSlide) => {
    if (slide.product_id) navigate(`/product/${slide.product_id}`);
  };

  return (
    <section className="relative bg-background">
      <Carousel
        setApi={setApi}
        opts={{ align: "start", loop: true }}
        plugins={[
          Autoplay({
            delay: 6000,
            stopOnInteraction: true,
            stopOnMouseEnter: true,
          }),
        ]}
        className="w-full"
      >
        <CarouselContent>
          {slides.map((slide) => (
            <CarouselItem key={slide.id}>
              <div className="relative w-full h-[440px] sm:h-[540px] lg:h-[640px] overflow-hidden bg-secondary/20">
                <img
                  src={slide.image_url}
                  alt={slide.title}
                  className="absolute inset-0 w-full h-full object-cover"
                />
                {/* Subtle bottom fade for legibility */}
                <div className="absolute inset-0 bg-gradient-to-t from-background/85 via-background/20 to-transparent" />
                {/* Copy */}
                <div className="absolute inset-x-0 bottom-0">
                  <div className="max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8 pb-14 lg:pb-20">
                    <div className="max-w-2xl">
                      <h1 className="text-3xl sm:text-4xl lg:text-5xl font-semibold text-foreground tracking-tight leading-[1.05]">
                        {slide.title}
                      </h1>
                      {slide.description && (
                        <p className="mt-4 text-base sm:text-lg text-foreground/70 max-w-xl leading-relaxed">
                          {slide.description}
                        </p>
                      )}
                      <div className="mt-7 flex flex-wrap items-center gap-3">
                        {slide.product_id && (
                          <Button
                            onClick={() => handleCta(slide)}
                            className="h-11 px-6 rounded-full bg-primary hover:bg-primary/90 text-primary-foreground font-medium text-sm group"
                          >
                            Learn More
                            <ArrowRight className="w-4 h-4 ml-1.5 transition-transform group-hover:translate-x-0.5" />
                          </Button>
                        )}
                        <Button
                          variant="outline"
                          onClick={() =>
                            document
                              .getElementById("shop-catalogue")
                              ?.scrollIntoView({ behavior: "smooth" })
                          }
                          className="h-11 px-6 rounded-full border-foreground/30 bg-background/60 backdrop-blur-sm hover:bg-background font-medium text-sm"
                        >
                          Shop All
                        </Button>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </CarouselItem>
          ))}
        </CarouselContent>

        {slides.length > 1 && (
          <>
            <CarouselPrevious className="left-4 sm:left-6 h-11 w-11 bg-background/70 backdrop-blur-md border-border/40 hover:bg-background" />
            <CarouselNext className="right-4 sm:right-6 h-11 w-11 bg-background/70 backdrop-blur-md border-border/40 hover:bg-background" />

            {/* Dots */}
            <div className="absolute bottom-5 left-1/2 -translate-x-1/2 flex items-center gap-2">
              {slides.map((_, i) => (
                <button
                  key={i}
                  onClick={() => api?.scrollTo(i)}
                  aria-label={`Go to slide ${i + 1}`}
                  className={`h-1.5 rounded-full transition-all ${
                    i === current
                      ? "w-8 bg-primary"
                      : "w-1.5 bg-foreground/30 hover:bg-foreground/50"
                  }`}
                />
              ))}
            </div>
          </>
        )}
      </Carousel>
    </section>
  );
}
