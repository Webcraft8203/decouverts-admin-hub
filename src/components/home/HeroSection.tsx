import { motion, AnimatePresence } from "framer-motion";
import { ChevronDown, Plane, Radio, ShieldCheck, Cpu } from "lucide-react";
import { useEffect, useState } from "react";
import logo from "@/assets/logo.png";
import { FloatingSocials } from "./FloatingSocials";
import { Button } from "@/components/ui/button";

// Intro Animation Overlay
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
          <div className="absolute top-0 right-0 w-1/2 h-1/2 bg-[radial-gradient(circle_at_top_right,rgba(249,115,22,0.03),transparent_70%)]" />

          <div className="relative flex flex-col items-center z-10">
            <div className="relative flex items-center justify-center w-32 h-32 md:w-40 md:h-40">
              <svg className="absolute inset-0 w-full h-full -rotate-90" viewBox="0 0 100 100">
                <motion.circle
                  cx="50"
                  cy="50"
                  r="46"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="0.8"
                  className="text-orange-500"
                  initial={{ pathLength: 0, opacity: 0 }}
                  animate={{ pathLength: 1, opacity: 0.3 }}
                  transition={{ duration: 0.6, ease: "easeOut", delay: 0.2 }}
                />
              </svg>
              <motion.img
                src={logo}
                alt="Decouvertes"
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
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, ease: "easeOut", delay: 0.5 }}
              >
                DECOUVERTES
              </motion.h1>
              <motion.p
                className="text-xs md:text-sm text-primary font-medium tracking-wider mt-2"
                style={{ fontFamily: "'Montserrat', sans-serif" }}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.5, ease: "easeOut", delay: 0.7 }}
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

const capabilities = [
  { icon: Plane, title: "Custom UAV Design", desc: "Airframes tuned to your mission profile." },
  { icon: Radio, title: "Autonomous Flight", desc: "Precision GPS, RTK & obstacle-aware navigation." },
  { icon: Cpu, title: "Payload Integration", desc: "Cameras, LiDAR, sensors — plug and fly." },
  { icon: ShieldCheck, title: "Defence-Grade Build", desc: "Rugged, reliable, made-in-India platforms." },
];

export const HeroSection = () => {


  const [showIntro, setShowIntro] = useState(() => {
    try {
      return !sessionStorage.getItem("introPlayed");
    } catch {
      return true;
    }
  });
  const [contentReady, setContentReady] = useState(() => !showIntro);

  const handleIntroComplete = () => {
    try {
      sessionStorage.setItem("introPlayed", "true");
    } catch {}
    setShowIntro(false);
    setTimeout(() => setContentReady(true), 100);
  };

  return (
    <>
      <FloatingSocials />
      <AnimatePresence>
        {showIntro && <IntroAnimation onComplete={handleIntroComplete} />}
      </AnimatePresence>

      <section className="relative min-h-[80vh] bg-gradient-to-br from-[#F9FBFF] to-[#EEF2F7] overflow-hidden flex flex-col pt-16 pb-20 justify-center">
        {/* Blueprint Grid */}
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute inset-0 bg-[linear-gradient(to_right,#94a3b80a_1px,transparent_1px),linear-gradient(to_bottom,#94a3b80a_1px,transparent_1px)] bg-[size:40px_40px] [mask-image:radial-gradient(ellipse_at_center,black_60%,transparent_100%)]" />
        </div>

        {/* Ambient orbs */}
        <div className="absolute top-[20%] left-[10%] w-[400px] h-[400px] bg-orange-500/10 blur-[100px] rounded-full pointer-events-none" />
        <div className="absolute bottom-[10%] right-[10%] w-[500px] h-[500px] bg-blue-500/10 blur-[100px] rounded-full pointer-events-none" />

        <div className="container mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <div className="max-w-4xl mx-auto text-center">
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              animate={contentReady ? { opacity: 1, y: 0 } : {}}
              transition={{ duration: 0.8, ease: "easeOut" }}
            >
              <span className="inline-flex items-center gap-2 py-1.5 px-4 rounded-full bg-primary/10 text-primary text-xs font-bold tracking-widest uppercase mb-6 border border-primary/20">
                <Plane className="w-3.5 h-3.5" /> Indigenous Drone Technology
              </span>

              <h1 className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-bold leading-tight tracking-tight mb-6 text-foreground">
                Building the Future of{" "}
                <span className="text-primary relative inline-block">
                  Flight
                  <motion.span
                    className="absolute inset-0 bg-gradient-to-r from-transparent via-white/40 to-transparent"
                    animate={{ x: ["-100%", "100%"] }}
                    transition={{ duration: 2.5, repeat: Infinity, repeatDelay: 3 }}
                  />
                </span>
              </h1>

              <p className="text-base md:text-lg lg:text-xl text-muted-foreground mb-10 max-w-2xl mx-auto leading-relaxed">
                Decouvertes designs, engineers, and deploys next-generation drone platforms built in India for surveillance, industrial, and mission-critical applications.
              </p>

              <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-16">
                <Button
                  size="lg"
                  onClick={() => {
                    const el = document.getElementById("gallery-section");
                    el?.scrollIntoView({ behavior: "smooth" });
                  }}
                  className="bg-primary hover:bg-primary/90 text-primary-foreground h-12 px-8 rounded-xl shadow-lg shadow-primary/20"
                >
                  View Our Fleet
                </Button>
                <Button
                  size="lg"
                  variant="outline"
                  onClick={() => {
                    const el = document.getElementById("contact-section");
                    el?.scrollIntoView({ behavior: "smooth" });
                  }}
                  className="h-12 px-8 rounded-xl border-slate-300"
                >
                  Contact Us
                </Button>
              </div>
            </motion.div>

            {/* Capability chips */}
            <motion.div
              className="grid grid-cols-2 md:grid-cols-4 gap-4 max-w-4xl mx-auto"
              initial={{ opacity: 0, y: 20 }}
              animate={contentReady ? { opacity: 1, y: 0 } : {}}
              transition={{ duration: 0.6, delay: 0.4 }}
            >
              {capabilities.map((cap, i) => (
                <motion.div
                  key={cap.title}
                  className="group bg-white/70 backdrop-blur-sm border border-slate-200/70 rounded-2xl p-5 text-left hover:border-primary/30 hover:shadow-lg transition-all"
                  whileHover={{ y: -4 }}
                  initial={{ opacity: 0, y: 10 }}
                  animate={contentReady ? { opacity: 1, y: 0 } : {}}
                  transition={{ delay: 0.5 + i * 0.08 }}
                >
                  <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center mb-3 group-hover:bg-primary/20 transition-colors">
                    <cap.icon className="w-5 h-5 text-primary" />
                  </div>
                  <h3 className="text-sm font-bold text-foreground mb-1">{cap.title}</h3>
                  <p className="text-xs text-muted-foreground leading-relaxed">{cap.desc}</p>
                </motion.div>
              ))}
            </motion.div>
          </div>
        </div>

        {/* Scroll indicator */}
        <motion.div
          className="absolute bottom-6 left-1/2 -translate-x-1/2 flex flex-col items-center gap-2"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1.5 }}
        >
          <motion.div
            animate={{ y: [0, 4, 0], opacity: [0.3, 0.7, 0.3] }}
            transition={{ duration: 1.5, repeat: Infinity }}
          >
            <ChevronDown className="w-5 h-5 text-muted-foreground" />
          </motion.div>
        </motion.div>
      </section>
    </>
  );
};
