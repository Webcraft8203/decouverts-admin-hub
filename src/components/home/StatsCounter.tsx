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
    <section ref={ref} className="py-14 md:py-16 px-4 bg-white relative overflow-hidden">
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,rgba(255,107,0,0.06),transparent_60%)]" />
      <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-slate-200 to-transparent" />
      <div className="absolute bottom-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-slate-200 to-transparent" />

      <div className="max-w-6xl mx-auto relative z-10">
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
          {stats.map((stat, index) => (
            <motion.div
              key={stat.label}
              className="group relative bg-white hairline rounded-2xl p-7 md:p-9 overflow-hidden elevation-1 hover:elevation-3 hover:-translate-y-1 hover:border-primary/40 transition-all duration-500 accent-bar-orange"
              initial={{ opacity: 0, y: 30 }}
              animate={isInView ? { opacity: 1, y: 0 } : {}}
              transition={{ duration: 0.6, delay: index * 0.12, ease: "easeOut" }}
            >
              <div className="absolute -top-16 -right-16 w-40 h-40 bg-primary/[0.06] rounded-full blur-3xl opacity-0 group-hover:opacity-100 transition-opacity duration-700" />
              <div className="relative">
                <h3 className="font-display text-5xl md:text-6xl font-bold text-slate-900 tracking-[-0.03em] leading-none mb-4">
                  <AnimatedNumber value={stat.value} suffix={stat.suffix} inView={isInView} />
                </h3>
                <p className="font-display font-semibold text-slate-900 text-[15px] md:text-base mb-1 tracking-tight">
                  {stat.label}
                </p>
                <p className="text-slate-500 text-[13px] md:text-sm">
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
