import { motion, useInView } from "framer-motion";
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
    let start = value > 50 ? value / 2 : 0; // Start halfway for larger numbers
    const duration = 2000;
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
  const isInView = useInView(ref, { once: true, margin: "-200px" });

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
    <section
      ref={ref}
      className="relative py-12 sm:py-24 md:py-32 bg-white overflow-hidden"
    >
      {/* Background Effects */}
      <div
        aria-hidden
        className="absolute inset-0 opacity-[0.015] pointer-events-none"
        style={{
          backgroundImage: "linear-gradient(rgba(0,0,0,0.15) 1px, transparent 1px), linear-gradient(90deg, rgba(0,0,0,0.15) 1px, transparent 1px)",
          backgroundSize: "40px 40px",
        }}
      />
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-3/4 h-3/4 rounded-full bg-primary/[0.04] blur-[180px]" />

      <div className="max-w-7xl mx-auto relative z-10 px-4">
        {/* Desktop & Tablet Grid */}
        <div className="hidden sm:grid sm:grid-cols-2 lg:grid-cols-4 gap-y-20 md:gap-x-8">
          {stats.map((stat, index) => (
            <motion.div
              key={stat.label}
              className="group relative text-center flex flex-col items-center"
              initial={{ opacity: 0, y: 40 }}
              animate={isInView ? { opacity: 1, y: 0 } : {}}
              transition={{ duration: 0.8, delay: index * 0.12, ease: [0.16, 1, 0.3, 1] }}
            >
              <div className="relative">
                <h3 className="font-sans text-7xl lg:text-[80px] font-extrabold text-slate-900 tracking-tighter leading-none transition-transform duration-300 group-hover:scale-105">
                  <AnimatedNumber value={stat.value} suffix={stat.suffix} inView={isInView} />
                </h3>
                <motion.div
                  className="relative mt-5 h-8 flex flex-col items-center"
                  initial={{ scaleX: 0, opacity: 0 }}
                  animate={isInView ? { scaleX: 1, opacity: 1 } : {}}
                  transition={{ duration: 1.0, delay: 0.5 + index * 0.12, ease: [0.16, 1, 0.3, 1] }}
                >
                  <div className="w-px h-4 bg-gradient-to-b from-transparent to-primary/50" />
                  <div className="w-1.5 h-1.5 rounded-full bg-primary shadow-[0_0_12px_hsl(var(--primary)/0.5)] transition-all duration-300 group-hover:shadow-[0_0_24px_hsl(var(--primary)/0.8)]" />
                </motion.div>
                <p className="mt-4 text-[14px] font-semibold text-slate-600 tracking-[0.22em] uppercase transition-colors duration-300 group-hover:text-slate-800">
                  {stat.label}
                </p>
                <p className="mt-3 text-slate-500 text-[16px] max-w-[220px] mx-auto leading-relaxed transition-transform duration-300 group-hover:-translate-y-0.5">
                  {stat.description}
                </p>
              </div>
            </motion.div>
          ))}
        </div>

        {/* Mobile Carousel */}
        <div className="sm:hidden">
          <div className="overflow-hidden" ref={emblaRef}>
            <div className="flex">
              {stats.map((stat, index) => (
                <div key={stat.label} className="flex-[0_0_100%] min-w-0 px-4">
                  <div className="group relative text-center flex flex-col items-center max-w-[320px] mx-auto">
                    <motion.div
                      initial={{ opacity: 0, y: 20 }}
                      animate={selectedIndex === index && isInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 20 }}
                      transition={{ duration: 0.5, ease: "easeOut" }}
                    >
                      <h3 className="font-sans text-[42px] font-extrabold text-slate-900 tracking-tighter leading-none">
                        <AnimatedNumber value={stat.value} suffix={stat.suffix} inView={selectedIndex === index && isInView} />
                      </h3>
                      <div className="relative mt-5 h-8 flex flex-col items-center">
                        <div className="w-px h-4 bg-gradient-to-b from-transparent to-primary/50" />
                        <div className="w-1.5 h-1.5 rounded-full bg-primary shadow-[0_0_12px_hsl(var(--primary)/0.5)]" />
                      </div>
                      <p className="mt-4 text-[14px] font-semibold text-slate-600 tracking-[0.22em] uppercase">{stat.label}</p>
                      <p className="mt-3 text-slate-500 text-[16px] max-w-[220px] mx-auto leading-relaxed">{stat.description}</p>
                    </motion.div>
                  </div>
                </div>
              ))}
            </div>
          </div>
          <div className="mt-8 flex items-center justify-center gap-2">
            {scrollSnaps.map((_, i) => (
              <button key={i} onClick={() => emblaApi?.scrollTo(i)} aria-label={`Go to slide ${i + 1}`} className={cn("h-1.5 rounded-full transition-all duration-300", selectedIndex === i ? "w-6 bg-primary" : "w-1.5 bg-slate-300")} />
            ))}
          </div>
        </div>
      </div>
    </section>
  );
};
