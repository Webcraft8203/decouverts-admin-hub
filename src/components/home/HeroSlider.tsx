import { useEffect, useRef, useState } from "react";
import { motion, AnimatePresence, useMotionValue, useSpring, useTransform } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { ArrowRight, ChevronLeft, ChevronRight, Radio } from "lucide-react";

export interface HeroSlide {
  id: string;
  badge_label: string | null;
  title: string;
  subtitle: string | null;
  description: string | null;
  image_url: string | null;
  background_image_url: string | null;
  video_url: string | null;
  primary_cta_label: string | null;
  primary_cta_link: string | null;
  secondary_cta_label: string | null;
  secondary_cta_link: string | null;
  glow_color: string | null;
}

interface Props {
  slides: HeroSlide[];
}

const AUTO_MS = 6000;

/* ---------- Aerospace HUD overlay ---------- */
const HudBackdrop = ({ glow }: { glow: string }) => (
  <div className="pointer-events-none absolute inset-0 overflow-hidden">
    <div className="absolute inset-0 opacity-[0.18] bg-[linear-gradient(to_right,rgba(255,255,255,0.6)_1px,transparent_1px),linear-gradient(to_bottom,rgba(255,255,255,0.6)_1px,transparent_1px)] bg-[size:64px_64px] [mask-image:radial-gradient(ellipse_at_center,black_45%,transparent_100%)]" />
    <svg viewBox="0 0 400 400" className="absolute -right-24 top-1/2 -translate-y-1/2 w-[520px] h-[520px] opacity-40 hidden md:block">
      <defs>
        <radialGradient id="rg-fade" cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor={glow} stopOpacity="0.22" />
          <stop offset="100%" stopColor={glow} stopOpacity="0" />
        </radialGradient>
        <linearGradient id="rg-sweep" x1="200" y1="200" x2="400" y2="200" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor={glow} stopOpacity="0.5" />
          <stop offset="100%" stopColor={glow} stopOpacity="0" />
        </linearGradient>
      </defs>
      <circle cx="200" cy="200" r="180" fill="url(#rg-fade)" />
      {[80, 130, 180].map((r, i) => (
        <motion.circle
          key={r} cx="200" cy="200" r={r} fill="none"
          stroke={glow} strokeOpacity="0.3" strokeWidth="0.7" strokeDasharray="2 6"
          animate={{ rotate: 360 }} style={{ transformOrigin: "200px 200px" }}
          transition={{ duration: 30 + i * 8, repeat: Infinity, ease: "linear" }}
        />
      ))}
      <motion.g style={{ transformOrigin: "200px 200px" }} animate={{ rotate: 360 }} transition={{ duration: 7, repeat: Infinity, ease: "linear" }}>
        <path d="M200 200 L400 175 A200 200 0 0 1 400 225 Z" fill="url(#rg-sweep)" />
      </motion.g>
    </svg>
    <motion.div
      className="absolute inset-x-0 h-px"
      style={{ background: `linear-gradient(90deg, transparent, ${glow}, transparent)` }}
      animate={{ y: ["-5%", "105%"] }}
      transition={{ duration: 6, repeat: Infinity, ease: "easeInOut" }}
    />
    {Array.from({ length: 14 }).map((_, i) => (
      <motion.span
        key={i}
        className="absolute w-1 h-1 rounded-full"
        style={{ background: glow, left: `${(i * 79) % 100}%`, top: `${(i * 37) % 100}%`, opacity: 0.5 }}
        animate={{ y: [0, -30, 0], opacity: [0.15, 0.6, 0.15] }}
        transition={{ duration: 5 + (i % 3), repeat: Infinity, ease: "easeInOut", delay: i * 0.4 }}
      />
    ))}
  </div>
);

export const HeroSlider = ({ slides }: Props) => {
  const [index, setIndex] = useState(0);
  const [paused, setPaused] = useState(false);
  const navigate = useNavigate();
  const rootRef = useRef<HTMLDivElement>(null);

  const mx = useMotionValue(0);
  const my = useMotionValue(0);
  const sx = useSpring(mx, { stiffness: 50, damping: 18 });
  const sy = useSpring(my, { stiffness: 50, damping: 18 });
  const bgX = useTransform(sx, (v) => v * -22);
  const bgY = useTransform(sy, (v) => v * -22);
  const droneX = useTransform(sx, (v) => v * 30);
  const droneY = useTransform(sy, (v) => v * 20);
  const droneRot = useTransform(sx, (v) => v * 4);

  useEffect(() => {
    if (paused || slides.length <= 1) return;
    const t = setTimeout(() => setIndex((i) => (i + 1) % slides.length), AUTO_MS);
    return () => clearTimeout(t);
  }, [index, paused, slides.length]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "ArrowRight") setIndex((i) => (i + 1) % slides.length);
      if (e.key === "ArrowLeft") setIndex((i) => (i - 1 + slides.length) % slides.length);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [slides.length]);

  if (!slides.length) return null;

  const active = slides[index];
  const glow = active.glow_color || "#FF6B00";

  const go = (link: string | null) => {
    if (!link) return;
    if (link.startsWith("http")) window.open(link, "_blank");
    else if (link.startsWith("#")) document.getElementById(link.slice(1))?.scrollIntoView({ behavior: "smooth" });
    else navigate(link);
  };

  const handleMove = (e: React.MouseEvent<HTMLDivElement>) => {
    const r = e.currentTarget.getBoundingClientRect();
    mx.set((e.clientX - (r.left + r.width / 2)) / (r.width / 2));
    my.set((e.clientY - (r.top + r.height / 2)) / (r.height / 2));
  };
  const resetMove = () => { mx.set(0); my.set(0); };

  const bgMedia = active.background_image_url || active.image_url;
  const droneOverlay = active.background_image_url ? active.image_url : null; // only if separate bg exists

  // Touch swipe
  const touchStart = useRef<number | null>(null);
  const onTouchStart = (e: React.TouchEvent) => { touchStart.current = e.touches[0].clientX; };
  const onTouchEnd = (e: React.TouchEvent) => {
    if (touchStart.current == null) return;
    const dx = e.changedTouches[0].clientX - touchStart.current;
    if (dx < -50) setIndex((i) => (i + 1) % slides.length);
    if (dx > 50) setIndex((i) => (i - 1 + slides.length) % slides.length);
    touchStart.current = null;
  };

  return (
    <div
      ref={rootRef}
      className="absolute inset-0 overflow-hidden bg-slate-950"
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => { setPaused(false); resetMove(); }}
      onMouseMove={handleMove}
      onTouchStart={onTouchStart}
      onTouchEnd={onTouchEnd}
    >
      {/* Media layer */}
      <AnimatePresence mode="sync">
        <motion.div
          key={active.id + "-media"}
          className="absolute inset-0"
          initial={{ opacity: 0, scale: 1.12, filter: "blur(16px)" }}
          animate={{ opacity: 1, scale: 1, filter: "blur(0px)" }}
          exit={{ opacity: 0, scale: 1.04, filter: "blur(10px)" }}
          transition={{ duration: 1.2, ease: [0.22, 1, 0.36, 1] }}
        >
          <motion.div
            className="absolute -inset-[3%]"
            style={{ x: bgX, y: bgY }}
            animate={{ scale: [1.06, 1.16] }}
            transition={{ duration: AUTO_MS / 1000 + 4, ease: "linear" }}
          >
            {active.video_url ? (
              <video
                src={active.video_url}
                autoPlay muted loop playsInline preload="metadata"
                className="absolute inset-0 w-full h-full object-cover"
              />
            ) : bgMedia ? (
              <img
                src={bgMedia}
                alt={active.title}
                loading={index === 0 ? "eager" : "lazy"}
                fetchPriority={index === 0 ? "high" : "auto"}
                className="absolute inset-0 w-full h-full object-cover"
              />
            ) : (
              <div className="absolute inset-0 bg-gradient-to-br from-slate-800 to-slate-950" />
            )}
          </motion.div>
        </motion.div>
      </AnimatePresence>

      {/* Cinematic overlays */}
      <div className="absolute inset-0 bg-gradient-to-r from-slate-950/85 via-slate-950/55 to-slate-950/20" />
      <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/30 to-transparent" />
      <div
        className="absolute inset-0 opacity-70"
        style={{ background: `radial-gradient(ellipse at 15% 40%, ${glow}22, transparent 55%)` }}
      />
      <div className="absolute inset-0 [box-shadow:inset_0_0_180px_60px_rgba(0,0,0,0.7)]" />

      <HudBackdrop glow={glow} />

      {/* Optional floating drone overlay */}
      {droneOverlay && (
        <motion.div
          className="absolute right-[6%] top-1/2 -translate-y-1/2 pointer-events-none hidden md:block z-10"
          style={{ x: droneX, y: droneY, rotate: droneRot }}
        >
          <motion.div
            animate={{ y: [-14, 14, -14] }}
            transition={{ duration: 5, repeat: Infinity, ease: "easeInOut" }}
            className="relative"
          >
            <div
              className="absolute inset-0 blur-3xl opacity-70"
              style={{ background: `radial-gradient(circle, ${glow}, transparent 65%)` }}
            />
            <motion.img
              key={active.id + "-drone"}
              src={droneOverlay}
              alt=""
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.9, delay: 0.2 }}
              className="relative w-[380px] lg:w-[520px] xl:w-[620px] max-w-[50vw] object-contain drop-shadow-[0_30px_60px_rgba(0,0,0,0.6)]"
            />
          </motion.div>
        </motion.div>
      )}

      {/* Top status bar */}
      <div className="absolute top-6 md:top-8 left-4 md:left-10 right-4 md:right-10 flex items-center justify-between z-30 pointer-events-none">
        <span className="inline-flex items-center gap-2 py-1.5 px-3 rounded-full bg-black/40 backdrop-blur-md border border-white/15 text-white/90 text-[10px] font-bold tracking-[0.22em] uppercase">
          <Radio className="w-3 h-3 text-emerald-400 animate-pulse" />
          Fleet Live · {String(index + 1).padStart(2, "0")}/{String(slides.length).padStart(2, "0")}
        </span>
        <span className="hidden md:inline-flex items-center gap-2 py-1.5 px-3 rounded-full bg-black/40 backdrop-blur-md border border-white/15 text-white/70 text-[10px] font-mono tracking-widest">
          LAT 28.6139° N · LON 77.2090° E
        </span>
      </div>

      {/* Left content block */}
      <div className="absolute inset-0 z-20 flex items-center pointer-events-none">
        <div className="container mx-auto px-4 sm:px-6 lg:px-12">
          <div className="max-w-2xl pointer-events-auto">
            <AnimatePresence mode="wait">
              <motion.div
                key={active.id + "-content"}
                initial={{ opacity: 0, y: 30, filter: "blur(6px)" }}
                animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
                exit={{ opacity: 0, y: -20, filter: "blur(4px)" }}
                transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
              >
                {active.badge_label && (
                  <span
                    className="inline-flex items-center gap-2 py-1.5 px-4 rounded-full backdrop-blur-md border text-[10px] md:text-[11px] font-bold tracking-[0.28em] uppercase mb-6"
                    style={{ background: `${glow}18`, borderColor: `${glow}66`, color: "#fff" }}
                  >
                    <span className="w-1.5 h-1.5 rounded-full animate-pulse" style={{ background: glow }} />
                    {active.badge_label}
                  </span>
                )}

                <h1
                  className="text-white font-bold leading-[1.02] tracking-tight text-[2.5rem] sm:text-6xl md:text-7xl lg:text-[5.5rem] mb-5 drop-shadow-[0_4px_20px_rgba(0,0,0,0.5)]"
                  style={{ fontFamily: "'Montserrat', sans-serif" }}
                >
                  {active.title}
                </h1>

                {active.subtitle && (
                  <p
                    className="text-lg md:text-2xl font-semibold mb-4"
                    style={{ color: glow, textShadow: "0 2px 20px rgba(0,0,0,0.5)" }}
                  >
                    {active.subtitle}
                  </p>
                )}

                {active.description && (
                  <p className="text-sm md:text-base lg:text-lg text-white/80 max-w-xl leading-relaxed mb-8 drop-shadow">
                    {active.description}
                  </p>
                )}

                <div className="flex flex-col sm:flex-row gap-3 sm:gap-4">
                  {active.primary_cta_label && (
                    <button
                      onClick={() => go(active.primary_cta_link)}
                      className="group relative inline-flex items-center justify-center gap-2 h-12 px-7 rounded-full font-bold text-sm tracking-wide uppercase text-white overflow-hidden transition-transform hover:-translate-y-0.5 w-full sm:w-auto"
                      style={{ background: glow, boxShadow: `0 20px 40px -12px ${glow}90` }}
                    >
                      <span className="absolute inset-0 bg-white opacity-0 group-hover:opacity-20 transition-opacity" />
                      <span className="relative">{active.primary_cta_label}</span>
                      <ArrowRight className="relative w-4 h-4 transition-transform group-hover:translate-x-1" />
                    </button>
                  )}
                  {active.secondary_cta_label && (
                    <button
                      onClick={() => go(active.secondary_cta_link)}
                      className="group inline-flex items-center justify-center gap-2 h-12 px-7 rounded-full font-bold text-sm tracking-wide uppercase text-white bg-white/10 backdrop-blur-md border border-white/30 hover:bg-white/20 hover:border-white/50 transition-colors w-full sm:w-auto"
                    >
                      {active.secondary_cta_label}
                      <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
                    </button>
                  )}
                </div>
              </motion.div>
            </AnimatePresence>
          </div>
        </div>
      </div>

      {/* Mobile prev/next */}
      {slides.length > 1 && (
        <>
          <button
            onClick={() => setIndex((i) => (i - 1 + slides.length) % slides.length)}
            className="md:hidden absolute left-3 top-1/2 -translate-y-1/2 z-30 w-10 h-10 rounded-full bg-white/10 backdrop-blur border border-white/20 text-white flex items-center justify-center"
            aria-label="Previous"
          >
            <ChevronLeft className="w-5 h-5" />
          </button>
          <button
            onClick={() => setIndex((i) => (i + 1) % slides.length)}
            className="md:hidden absolute right-3 top-1/2 -translate-y-1/2 z-30 w-10 h-10 rounded-full bg-white/10 backdrop-blur border border-white/20 text-white flex items-center justify-center"
            aria-label="Next"
          >
            <ChevronRight className="w-5 h-5" />
          </button>
        </>
      )}

      {/* Bottom category navigation */}
      {slides.length > 1 && (
        <div className="absolute bottom-0 inset-x-0 z-30">
          <div className="bg-gradient-to-t from-slate-950/95 via-slate-950/70 to-transparent pt-10 pb-4 md:pb-6">
            <div className="container mx-auto px-4 md:px-8">
              <div className="flex gap-3 md:gap-0 overflow-x-auto md:overflow-visible md:grid md:grid-cols-4 lg:grid-cols-5 md:border-t md:border-white/10 no-scrollbar">
                {slides.map((s, i) => {
                  const isActive = i === index;
                  return (
                    <button
                      key={s.id}
                      onClick={() => setIndex(i)}
                      onMouseEnter={() => setPaused(true)}
                      onMouseLeave={() => setPaused(false)}
                      className={`group relative flex-shrink-0 w-[240px] md:w-auto text-left pt-4 md:pt-5 pb-3 px-4 md:px-5 border-l md:border-l-0 border-white/10 transition-colors ${isActive ? "" : "hover:bg-white/5"}`}
                    >
                      {/* Progress line */}
                      <span className="absolute top-0 left-0 right-0 h-[2px] bg-white/10 overflow-hidden">
                        {isActive && (
                          <motion.span
                            key={s.id + "-prog-" + index}
                            className="absolute inset-y-0 left-0"
                            style={{ background: glow, boxShadow: `0 0 10px ${glow}` }}
                            initial={{ width: "0%" }}
                            animate={{ width: paused ? "100%" : "100%" }}
                            transition={{ duration: paused ? 0.4 : AUTO_MS / 1000, ease: paused ? "easeOut" : "linear" }}
                          />
                        )}
                      </span>

                      <div className="flex items-baseline gap-2 mb-1">
                        <span className={`text-[10px] tabular-nums tracking-widest font-mono ${isActive ? "text-white" : "text-white/40"}`}>
                          {String(i + 1).padStart(2, "0")}
                        </span>
                        <span
                          className={`text-xs md:text-sm font-bold uppercase tracking-wider transition-colors ${isActive ? "text-white" : "text-white/50 group-hover:text-white/80"}`}
                          style={isActive ? { color: "#fff" } : {}}
                        >
                          {s.badge_label || s.title}
                        </span>
                      </div>
                      <p className={`text-[11px] md:text-xs line-clamp-1 transition-colors ${isActive ? "text-white/80" : "text-white/40 group-hover:text-white/60"}`}>
                        {s.subtitle || s.description || "Precision aerial platform"}
                      </p>
                    </button>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
