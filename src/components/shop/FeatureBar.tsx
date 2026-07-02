import { motion } from "framer-motion";
import {
  ShieldCheck,
  MapPin,
  Cpu,
  Building2,
  BadgeCheck,
  Blocks,
} from "lucide-react";

const FEATURES = [
  { icon: ShieldCheck, label: "Mission Ready" },
  { icon: MapPin, label: "Made in India" },
  { icon: Cpu, label: "AI Powered" },
  { icon: Building2, label: "Enterprise Grade" },
  { icon: BadgeCheck, label: "DGCA Ready" },
  { icon: Blocks, label: "Modular Design" },
];

export function FeatureBar() {
  return (
    <section className="relative border-y border-border/40 bg-gradient-to-b from-background to-secondary/30">
      <div className="max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <div className="relative rounded-2xl border border-border/50 bg-card/70 backdrop-blur-xl shadow-[0_10px_40px_-15px_rgba(0,0,0,0.15)] overflow-hidden">
          {/* Animated connector line */}
          <div
            aria-hidden
            className="absolute left-4 right-4 top-1/2 h-px -translate-y-1/2 bg-gradient-to-r from-transparent via-primary/40 to-transparent hidden md:block"
          />
          <motion.div
            aria-hidden
            className="absolute top-1/2 h-1 w-24 -translate-y-1/2 rounded-full bg-primary/60 blur-md hidden md:block"
            initial={{ left: "-10%" }}
            animate={{ left: ["-10%", "100%"] }}
            transition={{ duration: 6, repeat: Infinity, ease: "linear" }}
          />

          <div className="relative grid grid-cols-3 md:grid-cols-6 gap-1">
            {FEATURES.map((f, i) => {
              const Icon = f.icon;
              return (
                <motion.div
                  key={f.label}
                  initial={{ opacity: 0, y: 10 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.35, delay: i * 0.06 }}
                  className="group flex flex-col items-center justify-center gap-2 py-5 px-2 relative"
                >
                  <div className="relative">
                    <div className="w-10 h-10 rounded-xl bg-background/80 border border-border/50 flex items-center justify-center group-hover:border-primary/60 group-hover:bg-primary/10 transition-all">
                      <Icon className="w-4 h-4 text-foreground group-hover:text-primary transition-colors" />
                    </div>
                    <div className="absolute inset-0 rounded-xl bg-primary/30 blur-lg opacity-0 group-hover:opacity-60 transition-opacity -z-10" />
                  </div>
                  <div className="text-[10px] sm:text-[11px] font-semibold text-foreground uppercase tracking-[0.1em] text-center leading-tight">
                    {f.label}
                  </div>
                </motion.div>
              );
            })}
          </div>
        </div>
      </div>
    </section>
  );
}
