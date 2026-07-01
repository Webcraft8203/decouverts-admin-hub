import { motion, AnimatePresence, useMotionValue, useSpring } from "framer-motion";
import { ArrowRight, ChevronDown } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import logo from "@/assets/logo.png";
import { FloatingSocials } from "./FloatingSocials";
import { HeroSlider, type HeroSlide } from "./HeroSlider";
import { HeroFeatureStrip } from "./HeroFeatureStrip";

// ---------- Intro overlay (unchanged behavior) ----------
const IntroAnimation = ({ onComplete }: { onComplete: () => void }) => {
  const [isVisible, setIsVisible] = useState(true);
  useEffect(() => {
    const timer = setTimeout(() => {
      setIsVisible(false);
      setTimeout(onComplete, 500);
    }, 1700);
    return () => clearTimeout(timer);
  }, [onComplete]);

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          className="fixed inset-0 z-[100] flex items-center justify-center bg-white"
          initial={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.5, ease: "easeInOut" }}
        >
          <div className="absolute inset-0 bg-gradient-to-br from-slate-50 via-[#f8f9fa] to-slate-100" />
          <div className="absolute top-0 right-0 w-1/2 h-1/2 bg-[radial-gradient(circle_at_top_right,rgba(249,115,22,0.05),transparent_70%)]" />
          <div className="relative flex flex-col items-center z-10">
            <div className="relative flex items-center justify-center w-32 h-32 md:w-40 md:h-40">
              <motion.img
                src={logo} alt="Decouvertes"
                className="w-20 h-20 md:w-24 md:h-24 object-contain relative z-10"
                initial={{ opacity: 0, scale: 0.96 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.4, ease: "easeOut" }}
              />
            </div>
            <div className="absolute top-full mt-4 flex flex-col items-center whitespace-nowrap">
              <motion.h1
                className="text-2xl md:text-3xl font-bold text-slate-900 tracking-[0.15em] uppercase"
                style={{ fontFamily: "'Montserrat', sans-serif" }}
                initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.5 }}
              >
                DECOUVERTES
              </motion.h1>
              <motion.p
                className="text-xs md:text-sm text-primary font-medium tracking-wider mt-2"
                initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                transition={{ duration: 0.5, delay: 0.7 }}
              >
                Drone Technology
              </motion.p>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

// ---------- Magnetic button ----------
const MagneticButton = ({
  children, onClick, variant = "primary",
}: { children: React.ReactNode; onClick: () => void; variant?: "primary" | "ghost" }) => {
  const ref = useRef<HTMLButtonElement>(null);
  const x = useMotionValue(0);
  const y = useMotionValue(0);
  const sx = useSpring(x, { stiffness: 200, damping: 15 });
  const sy = useSpring(y, { stiffness: 200, damping: 15 });

  const handleMove = (e: React.MouseEvent<HTMLButtonElement>) => {
    const r = ref.current?.getBoundingClientRect();
    if (!r) return;
    x.set((e.clientX - (r.left + r.width / 2)) * 0.25);
    y.set((e.clientY - (r.top + r.height / 2)) * 0.25);
  };
  const reset = () => { x.set(0); y.set(0); };

  const base = "group relative inline-flex items-center gap-2 h-12 px-7 rounded-full font-semibold text-sm tracking-wide transition-colors overflow-hidden";
  const styles = variant === "primary"
    ? "bg-primary text-primary-foreground shadow-[0_10px_30px_-8px_hsl(var(--primary)/0.55)] hover:shadow-[0_14px_40px_-8px_hsl(var(--primary)/0.7)]"
    : "bg-white/70 backdrop-blur border border-slate-200 text-foreground hover:border-slate-300";

  return (
    <motion.button
      ref={ref} onClick={onClick} onMouseMove={handleMove} onMouseLeave={reset}
      style={{ x: sx, y: sy }} className={`${base} ${styles}`}
    >
      {variant === "primary" && (
        <span className="absolute inset-0 bg-gradient-to-r from-primary via-orange-500 to-primary opacity-0 group-hover:opacity-100 transition-opacity" />
      )}
      <span className="relative">{children}</span>
      <ArrowRight className="relative w-4 h-4 transition-transform duration-300 group-hover:translate-x-1" />
    </motion.button>
  );
};

// ---------- Animated mini stat ----------
const MiniStat = ({ value, suffix, label, delay = 0 }: { value: number; suffix: string; label: string; delay?: number }) => {
  const [n, setN] = useState(0);
  useEffect(() => {
    const t = setTimeout(() => {
      const start = performance.now();
      const dur = 1400;
      const tick = (now: number) => {
        const p = Math.min(1, (now - start) / dur);
        setN(Math.floor(value * (1 - Math.pow(1 - p, 3))));
        if (p < 1) requestAnimationFrame(tick);
      };
      requestAnimationFrame(tick);
    }, delay);
    return () => clearTimeout(t);
  }, [value, delay]);
  return (
    <div className="flex flex-col">
      <span className="text-2xl md:text-3xl font-bold text-slate-900 tabular-nums">
        {n}<span className="text-primary">{suffix}</span>
      </span>
      <span className="text-[10px] tracking-[0.18em] uppercase text-slate-500 mt-0.5">{label}</span>
    </div>
  );
};

// Floating particles background layer
const Particles = () => (
  <div className="absolute inset-0 pointer-events-none overflow-hidden">
    {Array.from({ length: 14 }).map((_, i) => (
      <motion.span
        key={i}
        className="absolute w-1 h-1 rounded-full bg-primary/40"
        style={{ left: `${(i * 73) % 100}%`, top: `${(i * 41) % 100}%` }}
        animate={{ y: [0, -20, 0], opacity: [0.2, 0.8, 0.2] }}
        transition={{ duration: 4 + (i % 4), repeat: Infinity, ease: "easeInOut", delay: i * 0.3 }}
      />
    ))}
  </div>
);

export const HeroSection = () => {
  const [showIntro, setShowIntro] = useState(() => {
    try { return !sessionStorage.getItem("introPlayed"); } catch { return true; }
  });
  const [contentReady, setContentReady] = useState(() => !showIntro);

  const handleIntroComplete = () => {
    try { sessionStorage.setItem("introPlayed", "true"); } catch {}
    setShowIntro(false);
    setTimeout(() => setContentReady(true), 100);
  };

  const scrollTo = (id: string) => {
    document.getElementById(id)?.scrollIntoView({ behavior: "smooth" });
  };

  const { data: slides = [] } = useQuery({
    queryKey: ["hero-slides-public"],
    queryFn: async () => {
      const { data, error } = await (supabase as any)
        .from("hero_slides")
        .select("*")
        .eq("is_active", true)
        .order("display_order", { ascending: true });
      if (error) throw error;
      return (data ?? []) as HeroSlide[];
    },
  });

  return (
    <>
      <FloatingSocials />
      <AnimatePresence>
        {showIntro && <IntroAnimation onComplete={handleIntroComplete} />}
      </AnimatePresence>

      <section className="relative min-h-[92vh] bg-white overflow-hidden flex items-center pt-20 pb-20">
        {/* Layered background */}
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute inset-0 bg-[linear-gradient(to_right,rgba(15,23,42,0.045)_1px,transparent_1px),linear-gradient(to_bottom,rgba(15,23,42,0.045)_1px,transparent_1px)] bg-[size:56px_56px] [mask-image:radial-gradient(ellipse_at_center,black_45%,transparent_100%)]" />
          <div className="absolute -top-40 -right-40 w-[720px] h-[720px] rounded-full bg-[radial-gradient(circle,rgba(249,115,22,0.16),transparent_60%)]" />
          <div className="absolute -bottom-40 -left-40 w-[720px] h-[720px] rounded-full bg-[radial-gradient(circle,rgba(59,130,246,0.10),transparent_60%)]" />
          <svg className="absolute inset-0 w-full h-full opacity-40" viewBox="0 0 100 100" preserveAspectRatio="none">
            <motion.path
              d="M 0 80 Q 30 30, 60 55 T 100 25"
              stroke="hsl(var(--primary))" strokeWidth="0.15" strokeDasharray="0.6 1.2" fill="none" vectorEffect="non-scaling-stroke"
              initial={{ pathLength: 0 }} animate={{ pathLength: 1 }}
              transition={{ duration: 3, delay: 0.5, ease: "easeInOut" }}
            />
            <motion.path
              d="M 0 20 Q 40 55, 70 30 T 100 60"
              stroke="hsl(var(--primary))" strokeOpacity="0.4" strokeWidth="0.15" strokeDasharray="0.3 1.5" fill="none" vectorEffect="non-scaling-stroke"
              initial={{ pathLength: 0 }} animate={{ pathLength: 1 }}
              transition={{ duration: 3.5, delay: 1, ease: "easeInOut" }}
            />
          </svg>
          <Particles />
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,transparent_60%,rgba(0,0,0,0.04)_100%)]" />
        </div>

        <div className="container mx-auto px-4 sm:px-6 lg:px-8 relative z-10 w-full">
          <div className="grid lg:grid-cols-[45%_55%] gap-10 lg:gap-8 items-center">
            {/* LEFT 45% */}
            <motion.div
              className="text-center lg:text-left"
              initial={{ opacity: 0, y: 30 }}
              animate={contentReady ? { opacity: 1, y: 0 } : {}}
              transition={{ duration: 0.8, ease: "easeOut" }}
            >
              <motion.span
                className="inline-flex items-center gap-2 py-1.5 px-4 rounded-full bg-white/80 backdrop-blur text-primary text-[11px] font-bold tracking-[0.2em] uppercase mb-7 border border-primary/20 shadow-sm"
                initial={{ opacity: 0, y: 10 }}
                animate={contentReady ? { opacity: 1, y: 0 } : {}}
                transition={{ delay: 0.1 }}
              >
                <span className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse" />
                Indigenous Drone Technology
              </motion.span>

              <h1
                className="text-[2.5rem] sm:text-5xl md:text-6xl lg:text-[4.25rem] font-bold leading-[1.04] tracking-tight mb-6 text-foreground"
                style={{ fontFamily: "'Montserrat', sans-serif" }}
              >
                Engineering the{" "}
                <span className="relative inline-block">
                  <span className="relative z-10 bg-gradient-to-r from-primary via-orange-500 to-amber-500 bg-clip-text text-transparent">
                    future of flight
                  </span>
                  <motion.span
                    className="absolute inset-0 z-0 bg-gradient-to-r from-transparent via-white/60 to-transparent"
                    animate={{ x: ["-100%", "120%"] }}
                    transition={{ duration: 2.4, repeat: Infinity, repeatDelay: 3 }}
                  />
                </span>
                .
              </h1>

              <p className="text-base md:text-lg text-muted-foreground mb-8 max-w-xl mx-auto lg:mx-0 leading-relaxed">
                Decouvertes designs, engineers, and deploys next-generation drone platforms
                built in India for surveillance, industrial, and mission-critical operations.
              </p>

              <div className="flex flex-col sm:flex-row items-center lg:items-start justify-center lg:justify-start gap-4 mb-10">
                <MagneticButton onClick={() => scrollTo("gallery-section")}>Explore Fleet</MagneticButton>
                <MagneticButton onClick={() => scrollTo("contact-section")} variant="ghost">Contact Us</MagneticButton>
              </div>

              {/* Mini stats */}
              <motion.div
                className="grid grid-cols-3 gap-6 lg:gap-8 max-w-md mx-auto lg:mx-0 pt-6 border-t border-slate-200/70"
                initial={{ opacity: 0, y: 20 }}
                animate={contentReady ? { opacity: 1, y: 0 } : {}}
                transition={{ duration: 0.6, delay: 0.5 }}
              >
                <MiniStat value={150} suffix="+" label="Missions" delay={200} />
                <MiniStat value={50} suffix="+" label="Clients" delay={350} />
                <MiniStat value={99} suffix="%" label="Reliability" delay={500} />
              </motion.div>
            </motion.div>

            {/* RIGHT 55% — Cinematic slider */}
            <motion.div
              className="relative"
              initial={{ opacity: 0, scale: 0.94 }}
              animate={contentReady ? { opacity: 1, scale: 1 } : {}}
              transition={{ duration: 1, delay: 0.2, ease: "easeOut" }}
            >
              {slides.length > 0 ? (
                <HeroSlider slides={slides} />
              ) : (
                <div className="relative w-full aspect-square max-w-[520px] mx-auto rounded-3xl border border-dashed border-slate-300 bg-white/40 flex flex-col items-center justify-center text-slate-500 text-sm p-8 text-center">
                  <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mb-4">
                    <ArrowRight className="w-6 h-6 text-primary" />
                  </div>
                  <p className="font-semibold">No hero slides yet</p>
                  <p className="text-xs mt-1 opacity-70">Add slides from Admin → Hero Slider</p>
                </div>
              )}
            </motion.div>
          </div>

          {/* Bottom glass feature strip */}
          <HeroFeatureStrip />
        </div>

        {/* Scroll indicator */}
        <motion.div
          className="absolute bottom-3 left-1/2 -translate-x-1/2 flex flex-col items-center gap-1 text-muted-foreground"
          initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 1.5 }}
        >
          <span className="text-[10px] tracking-[0.3em] uppercase">Scroll</span>
          <motion.div animate={{ y: [0, 4, 0], opacity: [0.3, 0.8, 0.3] }} transition={{ duration: 1.6, repeat: Infinity }}>
            <ChevronDown className="w-4 h-4" />
          </motion.div>
        </motion.div>
      </section>
    </>
  );
};
