import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { ArrowRight, PlayCircle, Radar, Gauge, Cpu, Wind, ShieldCheck } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import droneImg from "@/assets/hero-drone.png";

const SPECS = [
  { icon: Wind, label: "Range", value: "18 km" },
  { icon: Gauge, label: "Payload", value: "10 kg" },
  { icon: Radar, label: "Endurance", value: "45 min" },
  { icon: Cpu, label: "AI Navigation", value: "RTK+Vision" },
  { icon: ShieldCheck, label: "Mission Ready", value: "DGCA" },
];

export function AerospaceHero() {
  const navigate = useNavigate();

  const { data: slide } = useQuery({
    queryKey: ["shop-hero-slide"],
    queryFn: async () => {
      const { data } = await supabase
        .from("shop_slides")
        .select("id,title,description,image_url,product_id,is_visible,display_order")
        .eq("is_visible", true)
        .order("display_order", { ascending: true })
        .limit(1)
        .maybeSingle();
      return data as {
        id: string;
        title: string;
        description: string | null;
        image_url: string;
        product_id: string | null;
      } | null;
    },
    staleTime: 5 * 60 * 1000,
  });

  const heroTitle = slide?.title;
  const heroDescription = slide?.description;
  const heroImage = slide?.image_url || droneImg;

  const handlePrimary = () => {
    if (slide?.product_id) {
      navigate(`/product/${slide.product_id}`);
    } else {
      document.getElementById("shop-catalogue")?.scrollIntoView({ behavior: "smooth" });
    }
  };

  return (
    <section className="relative overflow-hidden bg-gradient-to-b from-background via-secondary/20 to-background">
      {/* Engineering grid */}
      <div
        aria-hidden
        className="absolute inset-0 opacity-[0.35] [mask-image:radial-gradient(ellipse_at_center,black_35%,transparent_75%)]"
        style={{
          backgroundImage:
            "linear-gradient(hsl(var(--border)/0.6) 1px, transparent 1px), linear-gradient(90deg, hsl(var(--border)/0.6) 1px, transparent 1px)",
          backgroundSize: "56px 56px",
        }}
      />
      {/* Ambient orange glow */}
      <div className="pointer-events-none absolute -top-40 -right-32 w-[520px] h-[520px] rounded-full bg-primary/20 blur-3xl" />
      <div className="pointer-events-none absolute -bottom-40 -left-40 w-[420px] h-[420px] rounded-full bg-primary/10 blur-3xl" />

      <div className="relative max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8 pt-14 pb-20 lg:pt-24 lg:pb-28">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-6 items-center">
          {/* LEFT — copy */}
          <div className="lg:col-span-6 relative z-10">
            <motion.div
              initial={{ opacity: 0, y: 14 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
              className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full border border-primary/30 bg-primary/5 backdrop-blur-sm mb-6"
            >
              <span className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse" />
              <span className="text-[10px] font-bold uppercase tracking-[0.22em] text-primary">
                Indigenous · Deep-Tech · India
              </span>
            </motion.div>

            <motion.h1
              initial={{ opacity: 0, y: 18 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.55, delay: 0.05 }}
              className="text-4xl sm:text-5xl lg:text-6xl xl:text-7xl font-bold text-foreground tracking-tight leading-[1.02]"
            >
              {heroTitle ? (
                <span className="bg-gradient-to-r from-foreground via-primary to-foreground bg-clip-text text-transparent">
                  {heroTitle}
                </span>
              ) : (
                <>
                  Engineering India's{" "}
                  <span className="relative inline-block">
                    <span className="relative z-10 bg-gradient-to-r from-foreground via-primary to-foreground bg-clip-text text-transparent">
                      Next Generation
                    </span>
                  </span>{" "}
                  UAV Platforms.
                </>
              )}
            </motion.h1>

            <motion.p
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.15 }}
              className="mt-6 text-base sm:text-lg text-muted-foreground max-w-xl leading-relaxed"
            >
              {heroDescription ||
                "Purpose-built aerial systems for Defence, Agriculture, Industrial Inspection and Advanced Research. Precision engineered. Mission tested."}
            </motion.p>


            <motion.div
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.25 }}
              className="mt-8 flex flex-wrap items-center gap-3"
            >
              <Button
                onClick={handlePrimary}
                className="h-12 px-6 rounded-xl bg-primary hover:bg-primary/90 text-primary-foreground font-semibold text-sm shadow-lg shadow-primary/30 group"
              >
                {slide?.product_id ? "View Featured Platform" : "Explore Platforms"}
                <ArrowRight className="w-4 h-4 ml-2 transition-transform group-hover:translate-x-1" />
              </Button>

              <Button
                variant="outline"
                className="h-12 px-6 rounded-xl border-border/60 bg-card/50 backdrop-blur-sm hover:bg-card font-semibold text-sm"
              >
                <PlayCircle className="w-4 h-4 mr-2" />
                Book Demonstration
              </Button>
            </motion.div>

            {/* Metric bar */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.6, delay: 0.4 }}
              className="mt-10 grid grid-cols-3 gap-6 max-w-md"
            >
              {[
                { k: "12+", l: "Platforms" },
                { k: "500+", l: "Missions" },
                { k: "IN", l: "Made in India" },
              ].map((m) => (
                <div key={m.l}>
                  <div className="text-2xl sm:text-3xl font-bold text-foreground tracking-tight">
                    {m.k}
                  </div>
                  <div className="text-[10px] uppercase tracking-[0.16em] text-muted-foreground mt-0.5 font-semibold">
                    {m.l}
                  </div>
                </div>
              ))}
            </motion.div>
          </div>

          {/* RIGHT — drone stage */}
          <div className="lg:col-span-6 relative">
            <div className="relative aspect-square max-w-[620px] mx-auto">
              {/* Radar rings */}
              {[0, 1, 2].map((i) => (
                <motion.div
                  key={i}
                  aria-hidden
                  className="absolute inset-0 rounded-full border border-primary/25"
                  initial={{ scale: 0.6, opacity: 0 }}
                  animate={{ scale: [0.6, 1.05], opacity: [0.55, 0] }}
                  transition={{
                    duration: 4,
                    repeat: Infinity,
                    delay: i * 1.3,
                    ease: "easeOut",
                  }}
                />
              ))}
              {/* Static rings */}
              <div aria-hidden className="absolute inset-6 rounded-full border border-border/40" />
              <div aria-hidden className="absolute inset-16 rounded-full border border-border/30" />
              <div aria-hidden className="absolute inset-28 rounded-full border border-primary/15" />

              {/* Radar sweep */}
              <motion.div
                aria-hidden
                className="absolute inset-0 rounded-full"
                style={{
                  background:
                    "conic-gradient(from 0deg, transparent 0deg, hsl(var(--primary)/0.14) 40deg, transparent 80deg)",
                }}
                animate={{ rotate: 360 }}
                transition={{ duration: 6, repeat: Infinity, ease: "linear" }}
              />

              {/* Particles */}
              {Array.from({ length: 14 }).map((_, i) => (
                <motion.span
                  key={i}
                  aria-hidden
                  className="absolute w-1 h-1 rounded-full bg-primary/60"
                  style={{
                    top: `${20 + Math.random() * 60}%`,
                    left: `${20 + Math.random() * 60}%`,
                  }}
                  animate={{
                    y: [0, -14, 0],
                    opacity: [0.2, 1, 0.2],
                  }}
                  transition={{
                    duration: 3 + Math.random() * 2,
                    repeat: Infinity,
                    delay: Math.random() * 2,
                  }}
                />
              ))}

              {/* Drone image */}
              <motion.img
                src={heroImage}
                alt="Decouvertes UAV platform"
                className="absolute inset-0 w-full h-full object-contain drop-shadow-[0_30px_50px_rgba(255,106,26,0.25)]"
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{
                  opacity: 1,
                  scale: 1,
                  y: [0, -12, 0],
                  rotate: [-1.5, 1.5, -1.5],
                }}
                transition={{
                  opacity: { duration: 0.8 },
                  scale: { duration: 0.8 },
                  y: { duration: 5, repeat: Infinity, ease: "easeInOut" },
                  rotate: { duration: 9, repeat: Infinity, ease: "easeInOut" },
                }}
              />

              {/* Ground shadow */}
              <motion.div
                aria-hidden
                className="absolute bottom-4 left-1/2 -translate-x-1/2 h-4 w-56 rounded-full bg-foreground/25 blur-2xl"
                animate={{ scaleX: [1, 0.85, 1], opacity: [0.35, 0.55, 0.35] }}
                transition={{ duration: 5, repeat: Infinity, ease: "easeInOut" }}
              />

              {/* Floating spec chips */}
              {SPECS.map((s, i) => {
                const angle = (i / SPECS.length) * Math.PI * 2 - Math.PI / 2;
                const r = 46; // % from center
                const x = 50 + Math.cos(angle) * r;
                const y = 50 + Math.sin(angle) * r;
                const Icon = s.icon;
                return (
                  <motion.div
                    key={s.label}
                    initial={{ opacity: 0, scale: 0.7 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ duration: 0.5, delay: 0.6 + i * 0.1 }}
                    className="absolute -translate-x-1/2 -translate-y-1/2"
                    style={{ left: `${x}%`, top: `${y}%` }}
                  >
                    <div className="group flex items-center gap-2 pl-2 pr-3 py-1.5 rounded-full bg-card/85 backdrop-blur-md border border-border/60 shadow-lg shadow-black/5 hover:border-primary/50 transition-colors">
                      <span className="w-6 h-6 rounded-full bg-primary/10 flex items-center justify-center">
                        <Icon className="w-3 h-3 text-primary" />
                      </span>
                      <div className="leading-none">
                        <div className="text-[9px] uppercase tracking-[0.14em] text-muted-foreground font-semibold">
                          {s.label}
                        </div>
                        <div className="text-[11px] font-bold text-foreground mt-0.5">
                          {s.value}
                        </div>
                      </div>
                    </div>
                  </motion.div>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
