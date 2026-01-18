import { useQuery } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
} from "@/components/ui/carousel";
import Autoplay from "embla-carousel-autoplay";

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

  const handleSlideClick = (slide: ShopSlide) => {
    if (slide.product_id) {
      navigate(`/product/${slide.product_id}`);
    }
  };

  if (isLoading) {
    return (
      <section className="bg-gradient-to-br from-primary/5 via-accent/5 to-secondary/10">
        <div className="w-full">
          <Skeleton className="w-full h-[200px] sm:h-[300px] md:h-[400px]" />
        </div>
      </section>
    );
  }

  if (!slides || slides.length === 0) {
    return null;
  }

  return (
    <section className="bg-gradient-to-br from-primary/5 via-accent/5 to-secondary/10">
      <div className="w-full">
        <Carousel
          opts={{ align: "start", loop: true }}
          plugins={[
            Autoplay({
              delay: 5000,
              stopOnInteraction: true,
              stopOnMouseEnter: true,
            }),
          ]}
          className="w-full"
        >
          <CarouselContent>
            {slides.map((slide) => (
              <CarouselItem key={slide.id}>
                <div
                  onClick={() => handleSlideClick(slide)}
                  className={`relative w-full ${
                    slide.product_id ? 'cursor-pointer' : ''
                  }`}
                >
                  {/* Background Image */}
                  <img
                    src={slide.image_url}
                    alt={slide.title}
                    className="w-full h-auto block"
                  />
                </div>
              </CarouselItem>
            ))}
          </CarouselContent>
          
          {slides.length > 1 && (
            <>
              <CarouselPrevious className="left-2 sm:left-4 bg-background/80 backdrop-blur-sm border-border/50 hover:bg-background" />
              <CarouselNext className="right-2 sm:right-4 bg-background/80 backdrop-blur-sm border-border/50 hover:bg-background" />
              
              {/* Slide Indicators */}
              <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-2">
                {slides.map((_, index) => (
                  <div
                    key={index}
                    className="w-2 h-2 rounded-full bg-foreground/30 transition-all"
                  />
                ))}
              </div>
            </>
          )}
        </Carousel>
      </div>
    </section>
  );
}
