import { motion, AnimatePresence } from "framer-motion";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import logo from "@/assets/logo.png";
import { FloatingSocials } from "./FloatingSocials";
import { HeroSlider, type HeroSlide } from "./HeroSlider";

export const HeroSection = () => {
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

      <section
        className="relative w-full bg-[hsl(217,45%,9%)] overflow-hidden"
        style={{ height: "92vh", minHeight: 640, maxHeight: 900 }}
      >
        <AnimatePresence mode="wait">
          {isLoading ? (
            <motion.div
              key="skeleton"
              className="absolute inset-0"
              initial={{ opacity: 1 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.3 }}
            >
              <div className="relative z-10 h-full flex items-center max-w-[1440px] mx-auto px-6 md:px-10 lg:px-16">
                <div className="max-w-[640px] w-full animate-pulse">
                  <div className="h-4 w-40 bg-white/10 rounded mb-6" />
                  <div className="h-12 md:h-16 w-full bg-white/15 rounded mb-3" />
                  <div className="h-12 md:h-16 w-4/5 bg-white/10 rounded mb-6" />
                  <div className="h-5 w-full max-w-lg bg-white/5 rounded mb-3" />
                  <div className="h-5 w-2/3 max-w-md bg-white/5 rounded mb-10" />
                  <div className="flex gap-3">
                    <div className="h-12 w-40 bg-primary/30 rounded-md" />
                    <div className="h-12 w-36 bg-white/10 rounded-md" />
                  </div>
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
              className="absolute inset-0 flex items-center justify-center"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.3 }}
            >
              <div className="text-center text-white/70 max-w-md px-6">
                <div className="w-16 h-16 mx-auto rounded-full border border-primary/30 flex items-center justify-center mb-4">
                  <img src={logo} alt="" className="w-8 h-8 opacity-80" />
                </div>
                <p className="font-semibold text-lg text-white">No hero slides configured</p>
                <p className="text-sm mt-1 opacity-70">Add slides from Admin → Hero Slider</p>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </section>
    </>
  );
};
