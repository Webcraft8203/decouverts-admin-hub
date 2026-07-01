import { motion, AnimatePresence, useMotionValue, useSpring, useTransform } from "framer-motion";
import { ArrowRight, ChevronDown, Plane, Radio, ShieldCheck, Cpu } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import logo from "@/assets/logo.png";
import { FloatingSocials } from "./FloatingSocials";

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
              <svg className="absolute inset-0 w-full h-full -rotate-90" viewBox="0 0 100 100">
                <motion.circle
                  cx="50" cy="50" r="46" fill="none"
                  stroke="currentColor" strokeWidth="0.8" className="text-primary"
                  initial={{ pathLength: 0, opacity: 0 }}
                  animate={{ pathLength: 1, opacity: 0.3 }}
                  transition={{ duration: 0.6, ease: "easeOut", delay: 0.2 }}
                />
              </svg>
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
                style={{ fontFamily: "'Montserrat', sans-serif" }}
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

// ---------- Cinematic Drone SVG ----------
const DroneVisual = () => {
  return (
    <div className="relative w-full aspect-square max-w-[560px] mx-auto">
      {/* Radar rings */}
      <svg className="absolute inset-0 w-full h-full" viewBox="0 0 400 400" fill="none">
        {[80, 130, 180].map((r, i) => (
          <motion.circle
            key={r} cx="200" cy="200" r={r}
            stroke="hsl(var(--primary))" strokeOpacity="0.15" strokeWidth="1" strokeDasharray="2 6"
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.3 + i * 0.15, duration: 0.8 }}
          />
        ))}
        {/* Scanning sweep */}
        <motion.g
          style={{ transformOrigin: "200px 200px" }}
          animate={{ rotate: 360 }}
          transition={{ duration: 8, repeat: Infinity, ease: "linear" }}
        >
          <defs>
            <linearGradient id="sweep" x1="200" y1="200" x2="380" y2="200" gradientUnits="userSpaceOnUse">
              <stop offset="0%" stopColor="hsl(var(--primary))" stopOpacity="0.35" />
              <stop offset="100%" stopColor="hsl(var(--primary))" stopOpacity="0" />
            </linearGradient>
          </defs>
          <path d="M200 200 L380 170 A180 180 0 0 1 380 230 Z" fill="url(#sweep)" />
        </motion.g>
      </svg>

      {/* Floating drone */}
      <motion.div
        className="absolute inset-0 flex items-center justify-center"
        animate={{ y: [0, -12, 0] }}
        transition={{ duration: 5, repeat: Infinity, ease: "easeInOut" }}
      >
        <motion.div
          className="relative"
          animate={{ rotateZ: [-1.5, 1.5, -1.5] }}
          transition={{ duration: 7, repeat: Infinity, ease: "easeInOut" }}
        >
          <svg width="320" height="320" viewBox="0 0 320 320" fill="none" className="drop-shadow-[0_30px_40px_rgba(15,23,42,0.18)]">
            <defs>
              <linearGradient id="body" x1="0" y1="0" x2="1" y2="1">
                <stop offset="0%" stopColor="#1e293b" />
                <stop offset="100%" stopColor="#0f172a" />
              </linearGradient>
              <linearGradient id="arm" x1="0" y1="0" x2="1" y2="1">
                <stop offset="0%" stopColor="#334155" />
                <stop offset="100%" stopColor="#0f172a" />
              </linearGradient>
              <radialGradient id="led" cx="0.5" cy="0.5" r="0.5">
                <stop offset="0%" stopColor="hsl(var(--primary))" stopOpacity="1" />
                <stop offset="100%" stopColor="hsl(var(--primary))" stopOpacity="0" />
              </radialGradient>
            </defs>

            {/* Arms */}
            {[
              { x1: 160, y1: 160, x2: 70, y2: 70 },
              { x1: 160, y1: 160, x2: 250, y2: 70 },
              { x1: 160, y1: 160, x2: 70, y2: 250 },
              { x1: 160, y1: 160, x2: 250, y2: 250 },
            ].map((a, i) => (
              <line key={i} x1={a.x1} y1={a.y1} x2={a.x2} y2={a.y2}
                stroke="url(#arm)" strokeWidth="14" strokeLinecap="round" />
            ))}

            {/* Motor housings + propellers */}
            {[
              { cx: 70, cy: 70 },
              { cx: 250, cy: 70 },
              { cx: 70, cy: 250 },
              { cx: 250, cy: 250 },
            ].map((m, i) => (
              <g key={i}>
                {/* Prop blur disk */}
                <motion.circle
                  cx={m.cx} cy={m.cy} r="34"
                  fill="hsl(var(--primary))" fillOpacity="0.06"
                  animate={{ opacity: [0.4, 0.15, 0.4] }}
                  transition={{ duration: 0.6, repeat: Infinity }}
                />
                <circle cx={m.cx} cy={m.cy} r="20" fill="#0f172a" stroke="#334155" strokeWidth="2" />
                {/* Rotating props */}
                <motion.g
                  style={{ transformOrigin: `${m.cx}px ${m.cy}px` }}
                  animate={{ rotate: 360 }}
                  transition={{ duration: 0.15, repeat: Infinity, ease: "linear" }}
                >
                  <ellipse cx={m.cx} cy={m.cy} rx="30" ry="2.5" fill="#475569" opacity="0.55" />
                  <ellipse cx={m.cx} cy={m.cy} rx="2.5" ry="30" fill="#475569" opacity="0.55" />
                </motion.g>
                <circle cx={m.cx} cy={m.cy} r="4" fill="hsl(var(--primary))" />
              </g>
            ))}

            {/* Central body */}
            <rect x="115" y="120" width="90" height="80" rx="18" fill="url(#body)" stroke="#1e293b" strokeWidth="2" />
            <rect x="130" y="135" width="60" height="30" rx="6" fill="#0b1220" />
            {/* Camera gimbal */}
            <circle cx="160" cy="200" r="18" fill="#0b1220" stroke="#334155" strokeWidth="2" />
            <circle cx="160" cy="200" r="10" fill="#020617" />
            <motion.circle
              cx="160" cy="200" r="3" fill="hsl(var(--primary))"
              animate={{ opacity: [1, 0.3, 1] }}
              transition={{ duration: 1.8, repeat: Infinity }}
            />
            {/* Front LEDs */}
            <circle cx="140" cy="130" r="10" fill="url(#led)" />
            <circle cx="180" cy="130" r="10" fill="url(#led)" />
          </svg>
        </motion.div>
      </motion.div>

      {/* Shadow ellipse */}
      <motion.div
        className="absolute left-1/2 -translate-x-1/2 bottom-[10%] w-56 h-6 rounded-[50%] bg-slate-900/25 blur-2xl"
        animate={{ scale: [1, 0.9, 1], opacity: [0.35, 0.25, 0.35] }}
        transition={{ duration: 5, repeat: Infinity, ease: "easeInOut" }}
      />
    </div>
  );
};

// ---------- Magnetic pill button ----------
const MagneticButton = ({
  children, onClick, variant = "primary",
}: {
  children: React.ReactNode;
  onClick: () => void;
  variant?: "primary" | "ghost";
}) => {
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

  const base =
    "group relative inline-flex items-center gap-2 h-12 px-7 rounded-full font-semibold text-sm tracking-wide transition-colors overflow-hidden";
  const styles =
    variant === "primary"
      ? "bg-primary text-primary-foreground shadow-[0_10px_30px_-8px_hsl(var(--primary)/0.55)] hover:shadow-[0_14px_40px_-8px_hsl(var(--primary)/0.7)]"
      : "bg-white/70 backdrop-blur border border-slate-200 text-foreground hover:border-slate-300";

  return (
    <motion.button
      ref={ref}
      onClick={onClick}
      onMouseMove={handleMove}
      onMouseLeave={reset}
      style={{ x: sx, y: sy }}
      className={`${base} ${styles}`}
    >
      {variant === "primary" && (
        <span className="absolute inset-0 bg-gradient-to-r from-primary via-orange-500 to-primary opacity-0 group-hover:opacity-100 transition-opacity" />
      )}
      <span className="relative">{children}</span>
      <ArrowRight className="relative w-4 h-4 transition-transform duration-300 group-hover:translate-x-1" />
    </motion.button>
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

  return (
    <>
      <FloatingSocials />
      <AnimatePresence>
        {showIntro && <IntroAnimation onComplete={handleIntroComplete} />}
      </AnimatePresence>

      <section className="relative min-h-[92vh] bg-white overflow-hidden flex items-center pt-20 pb-24">
        {/* Layered background */}
        <div className="absolute inset-0 pointer-events-none">
          {/* Engineering grid */}
          <div className="absolute inset-0 bg-[linear-gradient(to_right,rgba(15,23,42,0.05)_1px,transparent_1px),linear-gradient(to_bottom,rgba(15,23,42,0.05)_1px,transparent_1px)] bg-[size:56px_56px] [mask-image:radial-gradient(ellipse_at_center,black_50%,transparent_100%)]" />
          {/* Orange radial */}
          <div className="absolute -top-40 -right-40 w-[720px] h-[720px] rounded-full bg-[radial-gradient(circle,rgba(249,115,22,0.18),transparent_60%)]" />
          {/* Blue radial */}
          <div className="absolute -bottom-40 -left-40 w-[720px] h-[720px] rounded-full bg-[radial-gradient(circle,rgba(59,130,246,0.12),transparent_60%)]" />
          {/* Flight trajectory */}
          <svg className="absolute inset-0 w-full h-full opacity-40" preserveAspectRatio="none">
            <motion.path
              d="M 0 80% Q 30% 30%, 60% 55% T 100% 25%"
              stroke="hsl(var(--primary))" strokeWidth="1" strokeDasharray="4 8" fill="none"
              initial={{ pathLength: 0 }} animate={{ pathLength: 1 }}
              transition={{ duration: 3, delay: 0.5, ease: "easeInOut" }}
            />
          </svg>
          {/* Noise vignette */}
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,transparent_60%,rgba(0,0,0,0.04)_100%)]" />
        </div>

        <div className="container mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <div className="grid lg:grid-cols-12 gap-10 lg:gap-8 items-center">
            {/* Left: copy */}
            <motion.div
              className="lg:col-span-7 text-center lg:text-left"
              initial={{ opacity: 0, y: 30 }}
              animate={contentReady ? { opacity: 1, y: 0 } : {}}
              transition={{ duration: 0.8, ease: "easeOut" }}
            >
              <motion.span
                className="inline-flex items-center gap-2 py-1.5 px-4 rounded-full bg-white/80 backdrop-blur text-primary text-[11px] font-bold tracking-[0.2em] uppercase mb-8 border border-primary/20 shadow-sm"
                initial={{ opacity: 0, y: 10 }}
                animate={contentReady ? { opacity: 1, y: 0 } : {}}
                transition={{ delay: 0.1 }}
              >
                <span className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse" />
                Indigenous Drone Technology
              </motion.span>

              <h1
                className="text-[2.75rem] sm:text-5xl md:text-6xl lg:text-[4.5rem] font-bold leading-[1.05] tracking-tight mb-6 text-foreground"
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

              <p className="text-base md:text-lg text-muted-foreground mb-10 max-w-xl mx-auto lg:mx-0 leading-relaxed">
                Decouvertes designs, engineers, and deploys next-generation drone platforms
                built in India for surveillance, industrial, and mission-critical operations.
              </p>

              <div className="flex flex-col sm:flex-row items-center lg:items-start justify-center lg:justify-start gap-4 mb-14">
                <MagneticButton onClick={() => scrollTo("gallery-section")}>View Our Fleet</MagneticButton>
                <MagneticButton onClick={() => scrollTo("contact-section")} variant="ghost">Contact Us</MagneticButton>
              </div>

              {/* Capability chips */}
              <motion.div
                className="grid grid-cols-2 md:grid-cols-4 gap-3"
                initial={{ opacity: 0, y: 20 }}
                animate={contentReady ? { opacity: 1, y: 0 } : {}}
                transition={{ duration: 0.6, delay: 0.4 }}
              >
                {capabilities.map((cap, i) => (
                  <motion.div
                    key={cap.title}
                    className="group relative bg-white/60 backdrop-blur-md border border-slate-200/70 rounded-2xl p-4 text-left hover:border-primary/40 hover:bg-white transition-all duration-300 hover:-translate-y-1 hover:shadow-[0_20px_40px_-20px_hsl(var(--primary)/0.35)]"
                    initial={{ opacity: 0, y: 10 }}
                    animate={contentReady ? { opacity: 1, y: 0 } : {}}
                    transition={{ delay: 0.5 + i * 0.08 }}
                  >
                    <div className="absolute inset-x-4 -top-px h-px bg-gradient-to-r from-transparent via-primary/40 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                    <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-primary/10 to-primary/5 border border-primary/10 flex items-center justify-center mb-3 group-hover:from-primary/20 group-hover:to-primary/10 transition-all">
                      <cap.icon className="w-4.5 h-4.5 text-primary" />
                    </div>
                    <h3 className="text-[13px] font-bold text-foreground mb-1 leading-tight">{cap.title}</h3>
                    <p className="text-[11px] text-muted-foreground leading-relaxed">{cap.desc}</p>
                  </motion.div>
                ))}
              </motion.div>
            </motion.div>

            {/* Right: drone */}
            <motion.div
              className="lg:col-span-5 relative"
              initial={{ opacity: 0, scale: 0.9 }}
              animate={contentReady ? { opacity: 1, scale: 1 } : {}}
              transition={{ duration: 1, delay: 0.2, ease: "easeOut" }}
            >
              <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,hsl(var(--primary)/0.18),transparent_60%)] blur-3xl" />
              <DroneVisual />
            </motion.div>
          </div>
        </div>

        {/* Scroll indicator */}
        <motion.div
          className="absolute bottom-6 left-1/2 -translate-x-1/2 flex flex-col items-center gap-1 text-muted-foreground"
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
