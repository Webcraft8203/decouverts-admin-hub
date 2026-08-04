import { motion, AnimatePresence } from "framer-motion";
import { useEffect, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import logo from "@/assets/logo.png";
import { FloatingSocials } from "./FloatingSocials";
import { HeroSlider, type HeroSlide } from "./HeroSlider";

/* ---------- Intro overlay ---------- */
const IntroAnimation = ({ onComplete }: { onComplete: () => void }) => {
  const [isVisible, setIsVisible] = useState(true);
  useEffect(() => {
    const timer = setTimeout(() => {
      setIsVisible(false);
      setTimeout(onComplete, 500);
    }, 1600);
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
          <div className="absolute inset-0 bg-gradient-to-br from-slate-50 via-white to-slate-100" />
          <div className="absolute top-0 right-0 w-1/2 h-1/2 bg-[radial-gradient(circle_at_top_right,rgba(255,107,0,0.06),transparent_70%)]" />
          <div className="relative flex flex-col items-center z-10">
            <motion.img
              src={logo} alt="Decouvertes"
              className="w-20 h-20 md:w-24 md:h-24 object-contain"
              initial={{ opacity: 0, scale: 0.94 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.4 }}
            />
            <motion.h1
              className="mt-6 text-2xl md:text-3xl font-bold text-slate-900 tracking-[0.15em] uppercase"
              style={{ fontFamily: "'Montserrat', sans-serif" }}
              initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.4 }}
            >
              DECOUVERTES
            </motion.h1>
            <motion.p
              className="text-xs md:text-sm text-primary font-medium tracking-wider mt-2"
              initial={{ opacity: 0 }} animate={{ opacity: 1 }}
              transition={{ duration: 0.5, delay: 0.6 }}
            >
              Discovering Future Technologies
            </motion.p>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export const HeroSection = () => {
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
      </section>
    </>
  );
};
