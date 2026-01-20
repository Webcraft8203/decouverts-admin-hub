import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { useState, useEffect, useCallback } from "react";
import { Link } from "react-router-dom";
import { cn } from "@/lib/utils";
import { Skeleton } from "@/components/ui/skeleton";

interface BlogSlide {
  id: string;
  title: string;
  description: string | null;
  image_url: string;
  cta_link: string | null;
  cta_text: string | null;
  is_visible: boolean;
  display_order: number;
}

export function BlogHeroSlider() {
  const [currentSlide, setCurrentSlide] = useState(0);
  const [isPaused, setIsPaused] = useState(false);

  const { data: slides, isLoading } = useQuery({
    queryKey: ["blog-slides"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("blog_slides")
        .select("*")
        .eq("is_visible", true)
        .order("display_order", { ascending: true });

      if (error) throw error;
      return (data || []) as BlogSlide[];
    },
  });

  const nextSlide = useCallback(() => {
    if (!slides || slides.length === 0) return;
    setCurrentSlide((prev) => (prev + 1) % slides.length);
  }, [slides]);

  const prevSlide = useCallback(() => {
    if (!slides || slides.length === 0) return;
    setCurrentSlide((prev) => (prev - 1 + slides.length) % slides.length);
  }, [slides]);

  // Auto-slide every 5 seconds
  useEffect(() => {
    if (isPaused || !slides || slides.length <= 1) return;
    
    const interval = setInterval(nextSlide, 5000);
    return () => clearInterval(interval);
  }, [isPaused, nextSlide, slides]);

  if (isLoading) {
    return (
      <div className="relative pt-16 md:pt-20">
        <Skeleton className="w-full h-[400px] md:h-[500px] lg:h-[600px]" />
      </div>
    );
  }

  if (!slides || slides.length === 0) {
    return (
      <div className="relative pt-16 md:pt-20">
        <div className="w-full h-[400px] md:h-[500px] lg:h-[600px] bg-gradient-to-br from-dark via-dark-elevated to-dark-accent flex items-center justify-center">
          <div className="text-center text-white px-4">
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold mb-4">
              Blogs & News
            </h1>
            <p className="text-lg md:text-xl text-white/70 max-w-2xl mx-auto">
              Stay updated with the latest insights and announcements
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div 
      className="relative pt-16 md:pt-20 overflow-hidden"
      onMouseEnter={() => setIsPaused(true)}
      onMouseLeave={() => setIsPaused(false)}
    >
      {/* Slides Container */}
      <div className="relative w-full h-[400px] md:h-[500px] lg:h-[600px]">
        {slides.map((slide, index) => (
          <div
            key={slide.id}
            className={cn(
              "absolute inset-0 transition-all duration-700 ease-out",
              index === currentSlide 
                ? "opacity-100 scale-100" 
                : "opacity-0 scale-105 pointer-events-none"
            )}
          >
            {/* Background Image */}
            <div 
              className="absolute inset-0 bg-cover bg-center"
              style={{ backgroundImage: `url(${slide.image_url})` }}
            >
              {/* Gradient Overlay */}
              <div className="absolute inset-0 bg-gradient-to-r from-dark/90 via-dark/70 to-transparent" />
              <div className="absolute inset-0 bg-gradient-to-t from-dark/60 to-transparent" />
            </div>

            {/* Content */}
            <div className="relative h-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex items-center">
              <div className="max-w-2xl">
                <h2 
                  className={cn(
                    "text-3xl md:text-4xl lg:text-5xl font-bold text-white mb-4 leading-tight transition-all duration-700 delay-200",
                    index === currentSlide 
                      ? "translate-y-0 opacity-100" 
                      : "translate-y-8 opacity-0"
                  )}
                >
                  {slide.title}
                </h2>
                {slide.description && (
                  <p 
                    className={cn(
                      "text-lg md:text-xl text-white/80 mb-8 transition-all duration-700 delay-300",
                      index === currentSlide 
                        ? "translate-y-0 opacity-100" 
                        : "translate-y-8 opacity-0"
                    )}
                  >
                    {slide.description}
                  </p>
                )}
                {slide.cta_link && (
                  <Link to={slide.cta_link}>
                    <Button 
                      size="lg"
                      className={cn(
                        "bg-primary hover:bg-primary/90 text-primary-foreground shadow-glow transition-all duration-700 delay-400",
                        index === currentSlide 
                          ? "translate-y-0 opacity-100" 
                          : "translate-y-8 opacity-0"
                      )}
                    >
                      {slide.cta_text || "Read More"}
                    </Button>
                  </Link>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Navigation Arrows */}
      {slides.length > 1 && (
        <>
          <Button
            variant="ghost"
            size="icon"
            onClick={prevSlide}
            className="absolute left-4 top-1/2 -translate-y-1/2 z-10 bg-white/10 hover:bg-white/20 text-white backdrop-blur-sm border border-white/10 h-12 w-12 rounded-full"
          >
            <ChevronLeft className="w-6 h-6" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            onClick={nextSlide}
            className="absolute right-4 top-1/2 -translate-y-1/2 z-10 bg-white/10 hover:bg-white/20 text-white backdrop-blur-sm border border-white/10 h-12 w-12 rounded-full"
          >
            <ChevronRight className="w-6 h-6" />
          </Button>
        </>
      )}

      {/* Dots Indicator */}
      {slides.length > 1 && (
        <div className="absolute bottom-6 left-1/2 -translate-x-1/2 z-10 flex items-center gap-2">
          {slides.map((_, index) => (
            <button
              key={index}
              onClick={() => setCurrentSlide(index)}
              className={cn(
                "transition-all duration-300 rounded-full",
                index === currentSlide 
                  ? "w-8 h-2 bg-primary" 
                  : "w-2 h-2 bg-white/50 hover:bg-white/80"
              )}
              aria-label={`Go to slide ${index + 1}`}
            />
          ))}
        </div>
      )}
    </div>
  );
}
