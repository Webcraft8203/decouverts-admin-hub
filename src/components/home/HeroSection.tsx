import { motion, AnimatePresence } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { ArrowRight, ShoppingCart, Box, Plane, Layers, Check, ChevronDown } from "lucide-react";
import { useEffect, useState } from "react";
import logo from "@/assets/logo.png";
import { FloatingSocials } from "./FloatingSocials";

// ---------- Intro Animation ----------
const IntroAnimation = ({ onComplete }: { onComplete: () => void }) => {
  const [isVisible, setIsVisible] = useState(true);
  useEffect(() => {
    const t = setTimeout(() => {
      setIsVisible(false);
      setTimeout(onComplete, 500);
    }, 1700);
    return () => clearTimeout(t);
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
          <div className="relative flex flex-col items-center z-10">
            <div className="relative flex items-center justify-center w-32 h-32 md:w-40 md:h-40">
              <svg className="absolute inset-0 w-full h-full -rotate-90" viewBox="0 0 100 100">
                <motion.circle cx="50" cy="50" r="46" fill="none" stroke="currentColor" strokeWidth="0.8" className="text-orange-500"
                  initial={{ pathLength: 0, opacity: 0 }} animate={{ pathLength: 1, opacity: 0.3 }}
                  transition={{ duration: 0.6, ease: "easeOut", delay: 0.2 }} />
              </svg>
              <motion.img src={logo} alt="Decouvertes" className="w-20 h-20 md:w-24 md:h-24 object-contain relative z-10"
                initial={{ opacity: 0, scale: 0.96 }} animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.4, ease: "easeOut" }} />
            </div>
            <div className="absolute top-full mt-4 flex flex-col items-center whitespace-nowrap">
              <motion.h1 className="text-2xl md:text-3xl font-bold text-slate-900 tracking-[0.15em] uppercase"
                style={{ fontFamily: "'Montserrat', sans-serif" }}
                initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, ease: "easeOut", delay: 0.5 }}>
                DECOUVERTES
              </motion.h1>
              <motion.p className="text-xs md:text-sm text-primary font-medium tracking-wider mt-2"
                style={{ fontFamily: "'Montserrat', sans-serif" }}
                initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                transition={{ duration: 0.5, ease: "easeOut", delay: 0.7 }}>
                Discovering Future Technologies
              </motion.p>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

// ---------- Decorative SVGs (placeholders for premium 3D renders) ----------
const BlueprintBg = ({ color }: { color: string }) => (
  <div className="absolute inset-0 pointer-events-none overflow-hidden">
    <div
      className="absolute inset-0 opacity-[0.06]"
      style={{
        backgroundImage: `linear-gradient(to right, ${color} 1px, transparent 1px), linear-gradient(to bottom, ${color} 1px, transparent 1px)`,
        backgroundSize: "28px 28px",
      }}
    />
  </div>
);

const Pedestal = ({ color }: { color: string }) => (
  <svg viewBox="0 0 220 60" className="w-[80%] max-w-[260px]" aria-hidden>
    <defs>
      <radialGradient id={`ped-${color}`} cx="50%" cy="40%" r="60%">
        <stop offset="0%" stopColor={color} stopOpacity="0.35" />
        <stop offset="100%" stopColor={color} stopOpacity="0" />
      </radialGradient>
    </defs>
    <ellipse cx="110" cy="30" rx="100" ry="22" fill={`url(#ped-${color})`} />
    <ellipse cx="110" cy="28" rx="80" ry="16" fill="#ffffff" stroke="#e5e7eb" strokeWidth="1" />
    <ellipse cx="110" cy="26" rx="80" ry="16" fill="#fafafa" />
  </svg>
);

const ShoppingCartArt = () => (
  <div className="relative w-full h-full flex items-end justify-center pb-4">
    <div className="absolute bottom-2 flex flex-col items-center">
      <motion.div
        initial={{ y: 8, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.8, ease: "easeOut" }}
        className="relative z-10 mb-[-12px]"
      >
        <div className="relative">
          <div className="absolute -inset-6 bg-[#ff7a00]/20 blur-2xl rounded-full" />
          <ShoppingCart className="relative w-28 h-28 md:w-32 md:h-32 text-[#ff7a00] drop-shadow-[0_8px_16px_rgba(255,122,0,0.35)]" strokeWidth={1.4} />
        </div>
      </motion.div>
      <Pedestal color="#ff7a00" />
    </div>
    {/* floating dots */}
    {[...Array(5)].map((_, i) => (
      <motion.span
        key={i}
        className="absolute w-1.5 h-1.5 rounded-full bg-[#ff7a00]/70"
        style={{ left: `${15 + i * 16}%`, top: `${20 + (i % 3) * 18}%` }}
        animate={{ y: [0, -8, 0], opacity: [0.4, 1, 0.4] }}
        transition={{ duration: 2.5 + i * 0.3, repeat: Infinity, ease: "easeInOut", delay: i * 0.2 }}
      />
    ))}
  </div>
);

const CADComponentArt = () => (
  <div className="relative w-full h-full flex items-center justify-center">
    <motion.svg
      viewBox="0 0 240 240"
      className="w-[78%] max-w-[320px] drop-shadow-[0_20px_30px_rgba(79,140,255,0.25)]"
      animate={{ rotate: [0, 4, 0, -4, 0] }}
      transition={{ duration: 14, repeat: Infinity, ease: "easeInOut" }}
      aria-hidden
    >
      <defs>
        <linearGradient id="metal" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#cfe0ff" />
          <stop offset="55%" stopColor="#7aa6e8" />
          <stop offset="100%" stopColor="#3b5b8c" />
        </linearGradient>
        <linearGradient id="metal2" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#e9f0fb" />
          <stop offset="100%" stopColor="#9bb7df" />
        </linearGradient>
      </defs>
      {/* triangle-ish mechanical body */}
      <path d="M120 30 L210 180 L30 180 Z" fill="url(#metal)" stroke="#3b5b8c" strokeWidth="1.2" />
      <path d="M120 30 L210 180 L30 180 Z" fill="url(#metal2)" opacity="0.5" />
      {/* bolt holes */}
      <circle cx="120" cy="80" r="26" fill="#1f3457" />
      <circle cx="120" cy="80" r="18" fill="#0f1f3a" />
      <circle cx="60" cy="160" r="20" fill="#1f3457" />
      <circle cx="60" cy="160" r="14" fill="#0f1f3a" />
      <circle cx="180" cy="160" r="20" fill="#1f3457" />
      <circle cx="180" cy="160" r="14" fill="#0f1f3a" />
      {/* highlight */}
      <path d="M120 36 L196 174" stroke="#ffffff" strokeOpacity="0.5" strokeWidth="2" />
    </motion.svg>
  </div>
);

const DroneArt = () => (
  <div className="relative w-full h-full flex items-center justify-center">
    <motion.svg
      viewBox="0 0 260 180"
      className="w-[82%] max-w-[300px] drop-shadow-[0_18px_24px_rgba(139,92,246,0.3)]"
      animate={{ y: [0, -8, 0] }}
      transition={{ duration: 3.5, repeat: Infinity, ease: "easeInOut" }}
      aria-hidden
    >
      <defs>
        <linearGradient id="dronebody" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#3a3a3a" />
          <stop offset="100%" stopColor="#0a0a0a" />
        </linearGradient>
      </defs>
      {/* arms */}
      <line x1="60" y1="60" x2="130" y2="95" stroke="#1a1a1a" strokeWidth="8" strokeLinecap="round" />
      <line x1="200" y1="60" x2="130" y2="95" stroke="#1a1a1a" strokeWidth="8" strokeLinecap="round" />
      <line x1="60" y1="130" x2="130" y2="95" stroke="#1a1a1a" strokeWidth="8" strokeLinecap="round" />
      <line x1="200" y1="130" x2="130" y2="95" stroke="#1a1a1a" strokeWidth="8" strokeLinecap="round" />
      {/* body */}
      <ellipse cx="130" cy="95" rx="34" ry="22" fill="url(#dronebody)" />
      <circle cx="130" cy="95" r="8" fill="#8b5cf6" />
      {/* rotors */}
      {[{cx:60,cy:60},{cx:200,cy:60},{cx:60,cy:130},{cx:200,cy:130}].map((p,i)=>(
        <g key={i}>
          <circle cx={p.cx} cy={p.cy} r="22" fill="#8b5cf6" opacity="0.12" />
          <motion.ellipse cx={p.cx} cy={p.cy} rx="22" ry="2.5" fill="#222"
            animate={{ rotate: 360 }}
            transform={`rotate(0 ${p.cx} ${p.cy})`}
            style={{ originX: `${p.cx}px`, originY: `${p.cy}px` }}
            // @ts-ignore framer rotates via style
            />
          <circle cx={p.cx} cy={p.cy} r="4" fill="#0a0a0a" />
        </g>
      ))}
    </motion.svg>
    {/* shadow ring */}
    <div className="absolute bottom-6 w-40 h-3 rounded-full bg-[#8b5cf6]/25 blur-md" />
  </div>
);

const LatticeArt = () => (
  <div className="relative w-full h-full flex items-end justify-center pb-4">
    <div className="flex flex-col items-center">
      <motion.svg
        viewBox="0 0 200 200"
        className="w-[60%] max-w-[200px] mb-[-10px] drop-shadow-[0_14px_22px_rgba(103,194,58,0.3)]"
        animate={{ rotate: [0, 8, 0, -8, 0] }}
        transition={{ duration: 16, repeat: Infinity, ease: "easeInOut" }}
        aria-hidden
      >
        <defs>
          <linearGradient id="lat" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#bfe6a6" />
            <stop offset="100%" stopColor="#67c23a" />
          </linearGradient>
        </defs>
        {/* tetrahedron lattice */}
        <g stroke="url(#lat)" strokeWidth="3" fill="none" strokeLinecap="round" strokeLinejoin="round">
          <polygon points="100,20 180,170 20,170" />
          <polygon points="100,20 100,170 180,170" opacity="0.7" />
          <polygon points="100,20 100,170 20,170" opacity="0.7" />
          <line x1="60" y1="95" x2="140" y2="95" />
          <line x1="40" y1="135" x2="160" y2="135" />
          <line x1="100" y1="20" x2="100" y2="170" opacity="0.5" />
        </g>
      </motion.svg>
      <Pedestal color="#67c23a" />
    </div>
  </div>
);

// ---------- Announcement Ticker ----------
const AnnouncementTicker = () => {
  const items = [
    { icon: "🚀", text: "New services launching soon" },
    { icon: "📦", text: "Orders dispatching daily" },
    { icon: "🛠", text: "Engineering services coming shortly" },
  ];
  const loop = [...items, ...items, ...items];
  return (
    <div className="relative w-full bg-white border-y border-slate-200/80 overflow-hidden">
      <div className="flex whitespace-nowrap py-3">
        <motion.div
          className="flex shrink-0 gap-12 px-6"
          animate={{ x: ["0%", "-50%"] }}
          transition={{ duration: 35, repeat: Infinity, ease: "linear" }}
        >
          {loop.map((it, i) => (
            <span key={i} className="flex items-center gap-2 text-sm font-medium text-slate-600">
              <span className="text-base">{it.icon}</span>
              <span>{it.text}</span>
              <span className="ml-12 h-3 w-px bg-slate-300" aria-hidden />
            </span>
          ))}
        </motion.div>
      </div>
    </div>
  );
};

// ---------- Hero Card ----------
type CardProps = {
  badgeIcon: React.ReactNode;
  badgeBg: string;
  title: React.ReactNode;
  description: string;
  features?: string[];
  ctaColor: string;
  illustration: React.ReactNode;
  onClick: () => void;
  delay?: number;
  className?: string;
  contentClassName?: string;
  tone: string; // hex color for accents
};

const BentoCard = ({
  badgeIcon, badgeBg, title, description, features, ctaColor,
  illustration, onClick, delay = 0, className = "", contentClassName = "", tone,
}: CardProps) => (
  <motion.button
    type="button"
    onClick={onClick}
    initial={{ opacity: 0, y: 24 }}
    whileInView={{ opacity: 1, y: 0 }}
    viewport={{ once: true, margin: "-80px" }}
    transition={{ duration: 0.6, delay, ease: [0.22, 1, 0.36, 1] }}
    whileHover={{ y: -6 }}
    className={`group relative text-left overflow-hidden rounded-[24px] border border-slate-200/70 bg-white/90 backdrop-blur-md shadow-[0_10px_40px_rgba(0,0,0,0.06)] hover:shadow-[0_20px_60px_rgba(0,0,0,0.10)] transition-shadow duration-500 focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 ${className}`}
    style={{ ['--tone' as any]: tone }}
    aria-label={typeof title === "string" ? title : undefined}
  >
    <BlueprintBg color={tone} />
    {/* radial wash */}
    <div
      className="absolute inset-0 opacity-60 pointer-events-none"
      style={{ background: `radial-gradient(120% 80% at 100% 0%, ${tone}14, transparent 60%)` }}
    />

    <div className={`relative z-10 flex flex-col h-full p-6 md:p-7 ${contentClassName}`}>
      <div
        className="inline-flex items-center justify-center w-11 h-11 rounded-xl text-white shadow-md mb-5"
        style={{ background: badgeBg }}
      >
        {badgeIcon}
      </div>

      <h3 className="text-2xl md:text-[26px] font-bold text-slate-900 leading-tight tracking-tight">
        {title}
      </h3>
      <p className="mt-3 text-[15px] leading-relaxed text-slate-600 max-w-[36ch]">
        {description}
      </p>

      <div className="mt-4 h-[3px] w-12 rounded-full" style={{ background: tone, opacity: 0.7 }} />

      {features && (
        <ul className="mt-5 space-y-2.5">
          {features.map((f) => (
            <li key={f} className="flex items-center gap-2.5 text-[14px] text-slate-700">
              <span
                className="inline-flex items-center justify-center w-[18px] h-[18px] rounded-full text-white"
                style={{ background: tone }}
              >
                <Check className="w-3 h-3" strokeWidth={3} />
              </span>
              {f}
            </li>
          ))}
        </ul>
      )}

      <span
        className="mt-6 inline-flex items-center gap-1.5 text-sm font-semibold"
        style={{ color: ctaColor }}
      >
        Explore Solutions
        <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
      </span>

      {/* illustration area */}
      <div className="relative mt-4 flex-1 min-h-[140px] md:min-h-[180px]">
        {illustration}
      </div>
    </div>
  </motion.button>
);

// ---------- Main ----------
export const HeroSection = () => {
  const navigate = useNavigate();

  const [showIntro, setShowIntro] = useState(() => {
    try { return !sessionStorage.getItem("introPlayed"); } catch { return true; }
  });
  const [contentReady, setContentReady] = useState(() => !showIntro);

  const handleIntroComplete = () => {
    try { sessionStorage.setItem("introPlayed", "true"); } catch {}
    setShowIntro(false);
    setTimeout(() => setContentReady(true), 100);
  };

  const { data: sections } = useQuery({
    queryKey: ["homepage-sections"],
    queryFn: async () => {
      const { data, error } = await supabase.from("homepage_sections").select("*").order("display_order");
      if (error) throw error;
      return data;
    },
  });
  const isVisible = (key: string) => sections?.find((s) => s.section_key === key)?.is_visible ?? true;
  const ecommerceVisible = isVisible("ecommerce");
  const engineeringVisible = isVisible("engineering");
  const manufacturingVisible = isVisible("manufacturing");

  return (
    <>
      <FloatingSocials />
      <AnimatePresence>
        {showIntro && <IntroAnimation onComplete={handleIntroComplete} />}
      </AnimatePresence>

      {/* Ticker bar sits directly below the navbar */}
      <AnnouncementTicker />

      <section className="relative bg-white overflow-hidden pt-6 md:pt-10 pb-16 md:pb-24">
        {/* soft gray gradient + blueprint grid background */}
        <div className="absolute inset-0 bg-gradient-to-b from-white via-slate-50/60 to-white pointer-events-none" />
        <div
          className="absolute inset-0 pointer-events-none opacity-[0.45]"
          style={{
            backgroundImage:
              "linear-gradient(to right, rgba(15,23,42,0.05) 1px, transparent 1px), linear-gradient(to bottom, rgba(15,23,42,0.05) 1px, transparent 1px)",
            backgroundSize: "48px 48px",
            maskImage: "radial-gradient(ellipse at center, black 55%, transparent 100%)",
            WebkitMaskImage: "radial-gradient(ellipse at center, black 55%, transparent 100%)",
          }}
        />
        {/* slow rotating engineering grid accent */}
        <motion.div
          className="absolute -top-40 -right-40 w-[640px] h-[640px] rounded-full border border-slate-200/70 pointer-events-none"
          animate={{ rotate: 360 }}
          transition={{ duration: 160, repeat: Infinity, ease: "linear" }}
        />
        <motion.div
          className="absolute -bottom-52 -left-40 w-[560px] h-[560px] rounded-full border border-dashed border-slate-200/70 pointer-events-none"
          animate={{ rotate: -360 }}
          transition={{ duration: 200, repeat: Infinity, ease: "linear" }}
        />

        <div className="container mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          {/* ====== Bento Card Grid ====== */}
          <motion.div
            className="mx-auto max-w-[1240px]"
            initial={{ opacity: 0, y: 30 }}
            animate={contentReady ? { opacity: 1, y: 0 } : {}}
            transition={{ duration: 0.8, ease: "easeOut" }}
          >
            <div className="grid gap-4 md:gap-5 grid-cols-1 md:grid-cols-2 lg:grid-cols-12 lg:auto-rows-[1fr]">
              {/* Card 1 — E-Commerce (left, 25%) */}
              {ecommerceVisible && (
                <div className="lg:col-span-3 lg:row-span-2">
                  <BentoCard
                    delay={0.05}
                    tone="#ff7a00"
                    ctaColor="#ff7a00"
                    badgeBg="linear-gradient(135deg,#ff944d,#ff7a00)"
                    badgeIcon={<ShoppingCart className="w-5 h-5" strokeWidth={2.2} />}
                    title={<>E-Commerce<br/>Solutions</>}
                    description="Industrial component sourcing made simple and reliable."
                    features={["Global Logistics", "Bulk Procurement", "Verified Suppliers"]}
                    illustration={<ShoppingCartArt />}
                    onClick={() => navigate("/shop")}
                    className="h-full min-h-[520px]"
                  />
                </div>
              )}

              {/* Card 2 — Engineering Services (center, 35%, largest) */}
              {engineeringVisible && (
                <div className="lg:col-span-5 lg:row-span-2">
                  <BentoCard
                    delay={0.15}
                    tone="#4f8cff"
                    ctaColor="#4f8cff"
                    badgeBg="linear-gradient(135deg,#7aa8ff,#4f8cff)"
                    badgeIcon={<Box className="w-5 h-5" strokeWidth={2.2} />}
                    title={<>Engineering<br/>Services</>}
                    description="End-to-end product development that drives innovation."
                    features={["CAD/CAM Design", "FEA Simulation", "Rapid Prototyping"]}
                    illustration={<CADComponentArt />}
                    onClick={() => navigate("/engineering")}
                    className="h-full min-h-[520px]"
                  />
                </div>
              )}

              {/* Card 3 — Drone Technology (top right) */}
              <div className="lg:col-span-4 lg:row-span-1">
                <BentoCard
                  delay={0.25}
                  tone="#8b5cf6"
                  ctaColor="#8b5cf6"
                  badgeBg="linear-gradient(135deg,#a78bfa,#8b5cf6)"
                  badgeIcon={<Plane className="w-5 h-5" strokeWidth={2.2} />}
                  title={<>Drone<br/>Technology</>}
                  description="Advanced drone solutions for every industry."
                  
                  illustration={<DroneArt />}
                  onClick={() => navigate("/manufacturing")}
                  className="h-full min-h-[250px]"
                  contentClassName="md:flex-row md:items-stretch md:gap-4"
                />
              </div>

              {/* Card 4 — 3D Printing Solutions (bottom right) */}
              {manufacturingVisible && (
                <div className="lg:col-span-4 lg:row-span-1">
                  <BentoCard
                    delay={0.35}
                    tone="#67c23a"
                    ctaColor="#3f9b1a"
                    badgeBg="linear-gradient(135deg,#86d65a,#67c23a)"
                    badgeIcon={<Layers className="w-5 h-5" strokeWidth={2.2} />}
                    title={<>3D Printing<br/>Solutions</>}
                    description="Precision. Prototyping. Possibilities."
                    illustration={<LatticeArt />}
                    onClick={() => navigate("/manufacturing")}
                    className="h-full min-h-[250px]"
                    contentClassName="md:flex-row md:items-stretch md:gap-4"
                  />
                </div>
              )}
            </div>
          </motion.div>

          {/* ====== Headline below grid ====== */}
          <motion.div
            className="text-center mt-14 md:mt-20 max-w-4xl mx-auto"
            initial={{ opacity: 0, y: 20 }}
            animate={contentReady ? { opacity: 1, y: 0 } : {}}
            transition={{ duration: 0.7, delay: 0.4, ease: "easeOut" }}
          >
            <h1 className="text-3xl sm:text-5xl md:text-6xl font-extrabold tracking-tight leading-[1.05] text-[#0b1f3a]">
              Engineering the Future
              <br />
              <span>Through </span>
              <span style={{ color: "#ff7a00" }}>Innovation</span>
              <span> & </span>
              <span style={{ color: "#ff7a00" }}>Manufacturing</span>
            </h1>
            <p className="mt-6 text-base md:text-lg text-slate-500 tracking-wide">
              Design <span className="mx-2 text-slate-400">•</span> Build
              <span className="mx-2 text-slate-400">•</span> Manufacture
              <span className="mx-2 text-slate-400">•</span> Deliver
            </p>
          </motion.div>
        </div>

        {/* Scroll indicator */}
        <motion.div
          className="hidden md:flex absolute bottom-6 left-1/2 -translate-x-1/2 flex-col items-center gap-1.5 text-slate-400"
          initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 1.5 }}
        >
          <span className="text-xs">Scroll to explore</span>
          <motion.div animate={{ y: [0, 6, 0] }} transition={{ duration: 1.6, repeat: Infinity, ease: "easeInOut" }}>
            <ChevronDown className="w-5 h-5" />
          </motion.div>
        </motion.div>
      </section>
    </>
  );
};
