import { motion, AnimatePresence, useReducedMotion } from "framer-motion";
import { useEffect, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import logo from "@/assets/logo.png";
import { FloatingSocials } from "./FloatingSocials";
import { HeroSlider, type HeroSlide } from "./HeroSlider";

/* ---------- Intro overlay — cinematic entrance sequence ---------- */
const BRAND = "DECOUVERTES";

const IntroAnimation = ({ onComplete }: { onComplete: () => void }) => {
  const prefersReducedMotion = useReducedMotion();
  const [phase, setPhase] = useState<"content" | "wipe" | "done">("content");

  useEffect(() => {
    if (prefersReducedMotion) {
      const t = setTimeout(onComplete, 200);
      return () => clearTimeout(t);
    }
    const t1 = setTimeout(() => setPhase("wipe"), 2200);
    const t2 = setTimeout(() => {
      setPhase("done");
      onComplete();
    }, 3000);
    return () => {
      clearTimeout(t1);
      clearTimeout(t2);
    };
  }, [onComplete, prefersReducedMotion]);

  if (prefersReducedMotion) return null;

  return (
    <AnimatePresence>
      {phase !== "done" && (
        <div className="fixed inset-0 z-[100] pointer-events-none">
          {/* Two panels that curtain-wipe apart to reveal the hero */}
          <motion.div
            className="absolute inset-y-0 left-0 w-1/2 bg-[#07090d] flex items-center justify-end overflow-hidden"
            animate={phase === "wipe" ? { x: "-100%" } : { x: 0 }}
            transition={{ duration: 0.8, ease: [0.76, 0, 0.24, 1] }}
          >
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_80%_50%,rgba(255,107,0,0.08),transparent_60%)]" />
          </motion.div>
          <motion.div
            className="absolute inset-y-0 right-0 w-1/2 bg-[#07090d] flex items-center justify-start overflow-hidden"
            animate={phase === "wipe" ? { x: "100%" } : { x: 0 }}
            transition={{ duration: 0.8, ease: [0.76, 0, 0.24, 1] }}
          >
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_50%,rgba(255,107,0,0.08),transparent_60%)]" />
          </motion.div>

          {/* Centered content, independent of the two panels */}
          <motion.div
            className="absolute inset-0 flex flex-col items-center justify-center"
            animate={phase === "wipe" ? { opacity: 0, scale: 1.04 } : { opacity: 1, scale: 1 }}
            transition={{ duration: 0.5, ease: "easeInOut" }}
          >
            <motion.img
              src={logo}
              alt="Decouvertes"
              className="w-14 h-14 md:w-16 md:h-16 object-contain"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
            />

            <div className="mt-7 flex overflow-hidden">
              {BRAND.split("").map((ch, i) => (
                <motion.span
                  key={i}
                  className="font-display text-2xl md:text-4xl font-bold tracking-[0.3em] text-white uppercase inline-block"
                  initial={{ y: "110%" }}
                  animate={{ y: 0 }}
                  transition={{ duration: 0.6, delay: 0.35 + i * 0.045, ease: [0.22, 1, 0.36, 1] }}
                >
                  {ch}
                </motion.span>
              ))}
            </div>

            <motion.p
              className="mt-4 text-[11px] md:text-xs text-primary font-medium tracking-[0.35em] uppercase"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.6, delay: 1.1 }}
            >
              Discovering Future Technologies
            </motion.p>

            {/* Loading line */}
            <div className="mt-10 w-40 md:w-48 h-px bg-white/10 overflow-hidden rounded-full">
              <motion.div
                className="h-full bg-primary"
                initial={{ width: "0%" }}
                animate={{ width: "100%" }}
                transition={{ duration: 1.5, delay: 0.5, ease: [0.65, 0, 0.35, 1] }}
              />
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};

export const HeroSection = () => {
  const prefersReducedMotion = useReducedMotion();
  const [showIntro, setShowIntro] = useState(() => {
    try { return !sessionStorage.getItem("introPlayed"); } catch { return true; }
  });

  const handleIntroComplete = () => {
    try { sessionStorage.setItem("introPlayed", "true"); } catch {}
    setShowIntro(false);
  };

  const { data: slides = [], isLoading } = useQuery({
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
    staleTime: 5 * 60 * 1000,
  });

  return (
    <>
      <FloatingSocials />
      <AnimatePresence>
        {showIntro && <IntroAnimation onComplete={handleIntroComplete} />}
      </AnimatePresence>

      <section
        className="relative w-full bg-[#080c14] overflow-hidden"
        style={{ height: "100vh", minHeight: 780 }}
      >
        <AnimatePresence mode="wait">
          {isLoading ? (
            <motion.div
              key="skeleton"
              className="absolute inset-0 bg-gradient-to-br from-slate-900 via-slate-950 to-black overflow-hidden"
              initial={{ opacity: 1 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.3 }}
            >
              <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_40%,rgba(255,107,0,0.08),transparent_60%)]" />
              <div className="relative z-10 h-full flex items-center max-w-[1400px] mx-auto px-6 md:px-10 lg:px-16">
                <div className="max-w-[650px] w-full animate-pulse">
                  <div className="h-6 w-48 bg-white/10 rounded-full mb-5" />
                  <div className="h-12 md:h-16 w-full bg-white/15 rounded-lg mb-4" />
                  <div className="h-12 md:h-16 w-4/5 bg-white/10 rounded-lg mb-6" />
                  <div className="h-5 w-full max-w-lg bg-white/5 rounded mb-3" />
                  <div className="h-5 w-2/3 max-w-md bg-white/5 rounded mb-10" />
                  <div className="flex gap-4">
                    <div className="h-12 w-40 bg-primary/30 rounded-lg" />
                    <div className="h-12 w-36 bg-white/10 rounded-lg" />
                  </div>
                </div>
              </div>
              {/* Skeleton for bottom nav */}
              <div className="absolute bottom-0 inset-x-0 h-24 animate-pulse">
                <div className="h-full max-w-[1400px] mx-auto flex items-center justify-between px-6 md:px-10 lg:px-16">
                  <div className="flex items-center gap-3"><div className="h-12 w-12 rounded-full bg-white/10" /><div className="h-12 w-12 rounded-full bg-white/10" /></div>
                  <div className="flex-1 flex items-center gap-3 ml-8"><div className="h-1 flex-1 bg-white/5 rounded-full" /><div className="h-1 flex-1 bg-white/5 rounded-full" /><div className="h-1 flex-1 bg-white/5 rounded-full" /></div>
                </div>
              </div>
            </motion.div>
          ) : slides.length > 0 ? (
            <motion.div
              key="slider"
              className="absolute inset-0"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.3 }}
            >
              <HeroSlider slides={slides} />
            </motion.div>
          ) : (
            <motion.div
              key="empty"
              className="absolute inset-0 flex items-center justify-center bg-gradient-to-br from-slate-900 via-slate-950 to-black"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.3 }}
            >
              <div className="text-center text-white/70 max-w-md px-6">
                <div className="w-16 h-16 mx-auto rounded-full bg-primary/20 border border-primary/40 flex items-center justify-center mb-4">
                  <img src={logo} alt="" className="w-8 h-8 opacity-80" />
                </div>
                <p className="font-bold text-lg">No hero slides configured</p>
                <p className="text-xs mt-1 opacity-70">Add cinematic slides from Admin → Hero Slider</p>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Scroll cue — desktop only */}
        {!isLoading && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 1.4, duration: 0.6 }}
            className="hidden md:flex absolute bottom-7 left-1/2 -translate-x-1/2 z-20 flex-col items-center gap-2 pointer-events-none"
          >
            <span className="text-[10px] font-semibold tracking-[0.3em] uppercase text-white/40">Scroll</span>
            <motion.span
              animate={prefersReducedMotion ? {} : { y: [0, 6, 0] }}
              transition={{ duration: 1.8, repeat: Infinity, ease: "easeInOut" }}
              className="w-px h-8 bg-gradient-to-b from-white/50 to-transparent"
            />
          </motion.div>
        )}
      </section>
    </>
  );
};
