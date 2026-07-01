import { motion, useInView } from "framer-motion";
import { useRef, useState, useEffect } from "react";

interface StatItem {
  value: number;
  suffix: string;
  label: string;
  description: string;
}

const stats: StatItem[] = [
  { value: 150, suffix: "+", label: "Projects Delivered", description: "Across industries" },
  { value: 50, suffix: "+", label: "Happy Clients", description: "Globally trusted" },
  { value: 5, suffix: "+", label: "Years Experience", description: "In drone R&D & flight ops" },
  { value: 99, suffix: "%", label: "Quality Rate", description: "Precision engineered" },
];

const AnimatedNumber = ({ value, suffix, inView }: { value: number; suffix: string; inView: boolean }) => {
  const [current, setCurrent] = useState(0);

  useEffect(() => {
    if (!inView) return;
    let start = 0;
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
  const isInView = useInView(ref, { once: true, margin: "-100px" });

  return (
    <section ref={ref} className="py-20 md:py-28 px-4 bg-white relative overflow-hidden">
      <div className="absolute inset-0 bg-[linear-gradient(to_right,rgba(15,23,42,0.04)_1px,transparent_1px),linear-gradient(to_bottom,rgba(15,23,42,0.04)_1px,transparent_1px)] bg-[size:48px_48px] [mask-image:radial-gradient(ellipse_at_center,black_40%,transparent_90%)]" />
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[600px] h-[300px] bg-[radial-gradient(ellipse,hsl(var(--primary)/0.10),transparent_70%)]" />
      <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-border to-transparent" />
      <div className="absolute bottom-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-border to-transparent" />

      <div className="max-w-6xl mx-auto relative z-10">
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
          {stats.map((stat, index) => (
            <motion.div
              key={stat.label}
              className="group relative bg-white/70 backdrop-blur-xl border border-slate-200/70 rounded-2xl p-6 md:p-7 overflow-hidden hover:-translate-y-1 hover:border-primary/30 hover:shadow-[0_30px_60px_-30px_hsl(var(--primary)/0.35)] transition-all duration-500"
              initial={{ opacity: 0, y: 30 }}
              animate={isInView ? { opacity: 1, y: 0 } : {}}
              transition={{ duration: 0.6, delay: index * 0.12, ease: "easeOut" }}
            >
              <div className="absolute top-0 left-6 right-6 h-px bg-gradient-to-r from-transparent via-primary/60 to-transparent opacity-60 group-hover:opacity-100 transition-opacity" />
              <div className="absolute -top-10 -right-10 w-32 h-32 bg-primary/10 rounded-full blur-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
              <div className="relative">
                <h3 className="text-4xl md:text-5xl font-bold text-foreground tracking-tight leading-none mb-3">
                  <AnimatedNumber value={stat.value} suffix={stat.suffix} inView={isInView} />
                </h3>
                <p className="font-semibold text-foreground text-sm md:text-[15px] mb-1">
                  {stat.label}
                </p>
                <p className="text-muted-foreground text-xs md:text-[13px]">
                  {stat.description}
                </p>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
};
