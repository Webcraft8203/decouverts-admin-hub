import { useInView } from "framer-motion";
import { useRef, useState, useEffect, useCallback } from "react";
import useEmblaCarousel from "embla-carousel-react";
import Autoplay from "embla-carousel-autoplay";
import { cn } from "@/lib/utils";

interface StatItem {
  value: number;
  suffix: string;
  label: string;
  description: string;
}

const stats: StatItem[] = [
  { value: 150, suffix: "+", label: "Flight Missions Completed", description: "Across diverse operational theaters" },
  { value: 50, suffix: "+", label: "Enterprise & Defence Clients", description: "Trusted by government and industry" },
  { value: 5, suffix: "+", label: "Years of R&D", description: "Dedicated to indigenous innovation" },
  { value: 99, suffix: "%", label: "Mission Reliability", description: "Engineered for peak performance" },
];

const AnimatedNumber = ({ value, suffix, inView }: { value: number; suffix: string; inView: boolean }) => {
  const [current, setCurrent] = useState(0);

  useEffect(() => {
    if (!inView) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      setCurrent(value);
      return;
    }
    let start = value > 50 ? value / 2 : 0;
    const duration = 1200;
    const increment = value / (duration / 16);
    const timer = setInterval(() => {
      start += increment;
      if (start >= value) {
        setCurrent(value);
        clearInterval(timer);
      } else {
        setCurrent(Math.floor(start));
      }
    }, 16);
    return () => clearInterval(timer);
  }, [inView, value]);

  return (
    <span className="tabular-nums">
      {current}
      <span className="text-primary">{suffix}</span>
    </span>
  );
};

export const StatsCounter = () => {
  const ref = useRef<HTMLDivElement>(null);
  const isInView = useInView(ref, { once: true, margin: "-150px" });

  const autoplayRef = useRef(Autoplay({ delay: 4500, stopOnInteraction: true }));
  const [emblaRef, emblaApi] = useEmblaCarousel(
    { loop: true, align: "center" },
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

  return (
    <section ref={ref} className="relative py-16 sm:py-24 bg-white border-t border-border">
      <div className="max-w-7xl mx-auto px-6 md:px-10 lg:px-16">
        {/* Desktop & Tablet Grid */}
        <div className="hidden sm:grid sm:grid-cols-2 lg:grid-cols-4 gap-y-14 md:gap-x-8 divide-y sm:divide-y-0 lg:divide-x divide-border">
          {stats.map((stat, index) => (
            <div key={stat.label} className="text-center flex flex-col items-center px-4 lg:px-6 first:pt-0 pt-14 sm:pt-0">
              <h3 className="font-display text-5xl lg:text-6xl font-bold text-foreground tracking-tight leading-none">
                <AnimatedNumber value={stat.value} suffix={stat.suffix} inView={isInView} />
              </h3>
              <div className="w-8 h-px bg-primary mt-5 mb-4" />
              <p className="text-[13px] font-semibold text-foreground/80 tracking-[0.14em] uppercase">
                {stat.label}
              </p>
              <p className="mt-2.5 text-muted-foreground text-sm max-w-[220px] mx-auto leading-relaxed">
                {stat.description}
              </p>
            </div>
          ))}
        </div>

        {/* Mobile Carousel */}
        <div className="sm:hidden">
          <div className="overflow-hidden" ref={emblaRef}>
            <div className="flex">
              {stats.map((stat, index) => (
                <div key={stat.label} className="flex-[0_0_100%] min-w-0 px-4">
                  <div className="text-center flex flex-col items-center max-w-[320px] mx-auto">
                    <h3 className="font-display text-[40px] font-bold text-foreground tracking-tight leading-none">
                      <AnimatedNumber value={stat.value} suffix={stat.suffix} inView={selectedIndex === index && isInView} />
                    </h3>
                    <div className="w-8 h-px bg-primary mt-5 mb-4" />
                    <p className="text-[13px] font-semibold text-foreground/80 tracking-[0.14em] uppercase">{stat.label}</p>
                    <p className="mt-2.5 text-muted-foreground text-sm max-w-[220px] mx-auto leading-relaxed">{stat.description}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
          <div className="mt-8 flex items-center justify-center gap-2">
            {scrollSnaps.map((_, i) => (
              <button key={i} onClick={() => emblaApi?.scrollTo(i)} aria-label={`Go to slide ${i + 1}`} className={cn("h-1.5 rounded-full transition-all duration-300", selectedIndex === i ? "w-6 bg-primary" : "w-1.5 bg-border")} />
            ))}
          </div>
        </div>
      </div>
    </section>
  );
};
