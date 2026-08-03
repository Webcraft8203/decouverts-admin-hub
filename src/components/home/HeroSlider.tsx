import { useEffect, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { ArrowRight, ChevronLeft, ChevronRight, ShieldCheck } from "lucide-react";

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

const AUTO_MS = 6500;
const ORANGE = "hsl(26, 100%, 50%)"; // #FF6B00

export const HeroSlider = ({ slides }: Props) => {
  const [index, setIndex] = useState(0);
  const [paused, setPaused] = useState(false);
  const navigate = useNavigate();

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

  const touchStart = useRef<number | null>(null);
  const onTouchStart = (e: React.TouchEvent) => {
    touchStart.current = e.touches[0].clientX;
  };
  const onTouchEnd = (e: React.TouchEvent) => {
    if (touchStart.current == null) return;
    const dx = e.changedTouches[0].clientX - touchStart.current;
    if (dx < -50) setIndex((i) => (i + 1) % slides.length);
    if (dx > 50) setIndex((i) => (i - 1 + slides.length) % slides.length);
    touchStart.current = null;
  };

  if (!slides.length) return null;

  const active = slides[index];
  const bgMedia = active.background_image_url || active.image_url;

  const go = (link: string | null) => {
    if (!link) return;
    if (link.startsWith("http")) window.open(link, "_blank");
    else if (link.startsWith("#"))
      document.getElementById(link.slice(1))?.scrollIntoView({ behavior: "smooth" });
    else navigate(link);
  };

  const next = () => setIndex((i) => (i + 1) % slides.length);
  const prev = () => setIndex((i) => (i - 1 + slides.length) % slides.length);

  return (
    <div
      className="absolute inset-0 overflow-hidden bg-[#080c14]"
      onMouseEnter={() => setPaused(false)} // Keep autoscroll for premium feel
      onMouseLeave={() => setPaused(false)}
      onTouchStart={onTouchStart}
      onTouchEnd={onTouchEnd}
    >
      {/* ============ LAYER 1 — Full-bleed cinematic background ============ */}
      <AnimatePresence mode="sync">
        <motion.div
          key={active.id + "-bg"}
          className="absolute inset-0"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 1.2, ease: [0.22, 1, 0.36, 1] }}
        >
          <motion.div
            className="absolute inset-0"
            initial={{ scale: 1.1 }}
            animate={{ scale: 1 }}
            transition={{ duration: 8, ease: "linear" }}
          >
            {active.video_url ? (
              <video
                src={active.video_url}
                autoPlay
                muted
                loop
                playsInline
                preload="metadata"
                className="absolute inset-0 w-full h-full object-cover object-center"
              />
            ) : bgMedia ? (
              <img
                src={bgMedia}
                alt={active.title}
                loading={index === 0 ? "eager" : "lazy"}
                fetchPriority={index === 0 ? "high" : "auto"}
                className="absolute inset-0 w-full h-full object-cover object-center"
              />
            ) : (
              <div className="absolute inset-0 bg-gradient-to-br from-slate-800 to-slate-950" />
            )}
          </motion.div>
        </motion.div>
      </AnimatePresence>

      {/* ============ Cinematic left-to-right gradient overlay ============ */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{ background: "linear-gradient(90deg, rgba(8,10,15,0.82) 0%, rgba(8,10,15,0.58) 38%, rgba(8,10,15,0.18) 70%, rgba(8,10,15,0.05) 100%)" }}
      />

      {/* ============ Subtle aerospace HUD (3–5% opacity) ============ */}
      <div
        aria-hidden
        className="absolute inset-0 pointer-events-none opacity-[0.03]"
        style={{ mixBlendMode: "overlay" }}
      >
        {/* GPS grid */}
        <svg className="absolute inset-0 w-full h-full" xmlns="http://www.w3.org/2000/svg">
          <defs>
            <pattern id="hud-grid" width="56" height="56" patternUnits="userSpaceOnUse">
              <path d="M 72 0 L 0 0 0 72" fill="none" stroke="white" strokeWidth="0.5" />
            </pattern>
          </defs>
          <rect width="100%" height="100%" fill="url(#hud-grid)" />
        </svg>
      </div>
      {/* Radar circles — top right */}
      <div className="absolute -top-40 -right-40 w-[560px] h-[560px] pointer-events-none opacity-[0.04]">
        <div className="absolute inset-0 rounded-full border border-white/60" />
        <div className="absolute inset-10 rounded-full border border-white/50" />
        <div className="absolute inset-24 rounded-full border border-white/40" />
        <div className="absolute inset-40 rounded-full border border-white/30" />
      </div>
      {/* Soft orange glow */}
      <div
        className="absolute pointer-events-none"
        style={{
          top: "18%",
          right: "12%",
          width: 520,
          height: 420,
          background: `radial-gradient(circle, hsl(var(--primary) / 0.12) 0%, transparent 65%)`,
          filter: "blur(20px)",
        }}
      />

      {/* ============ LAYER 2 — Left-anchored content ============ */}
      <div
        className="absolute inset-0 z-20 flex items-center pointer-events-none"
      >
        <div
          className="w-full mx-auto px-6 md:px-16 lg:px-24"
          style={{ maxWidth: 1440, paddingBottom: 90 }} // Avoid overlap with bottom nav
        >
          <div className="max-w-[650px] pointer-events-auto">
            <AnimatePresence mode="wait">
              <motion.div
                key={active.id + "-content"}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.5 }}
              >
                {/* Badge */}
                <motion.div
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ duration: 0.6, delay: 0.2, ease: [0.16, 1, 0.3, 1] }}
                  className="inline-flex items-center gap-2.5 py-2 px-4 rounded-full backdrop-blur-md text-[10px] font-semibold tracking-[0.18em] uppercase mb-6 text-white border border-white/20 bg-white/10"
                >
                  <span className="relative flex h-2 w-2">
                    <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-primary opacity-75"></span>
                    <span className="relative inline-flex h-2 w-2 rounded-full bg-primary"></span>
                  </span>
                  <ShieldCheck className="w-3.5 h-3.5 text-primary" />
                  <span>{active.badge_label || "Trusted by Defence Professionals"}</span>
                </motion.div>

                {/* Title */}
                <motion.h1
                  initial={{ opacity: 0, y: 24 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.8, delay: 0.3, ease: [0.16, 1, 0.3, 1] }}
                  className="text-white font-extrabold tracking-tighter mb-6 md:mb-8 text-5xl sm:text-6xl md:text-7xl"
                  style={{
                    fontFamily: "'Montserrat', sans-serif",
                    lineHeight: 1.0,
                    textShadow: "0 4px 40px rgba(0,0,0,0.5)",
                  }}
                >
                  {active.title}
                </motion.h1>

                {/* Description */}
                {active.description && (
                  <motion.p
                    initial={{ opacity: 0, y: 18 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.8, delay: 0.4, ease: [0.16, 1, 0.3, 1] }}
                    className="mb-8 md:mb-10 text-base md:text-lg lg:text-xl leading-relaxed md:leading-loose"
                    style={{
                      color: "rgba(226,232,240,0.82)",
                      maxWidth: 600,
                    }}
                  >
                    {active.description}
                  </motion.p>
                )}

                {/* CTAs */}
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.8, delay: 0.5, ease: [0.16, 1, 0.3, 1] }}
                  className="flex flex-col sm:flex-row gap-4"
                >
                  <button
                    onClick={() => go(active.primary_cta_link || "/shop")}
                    className="group relative inline-flex items-center justify-center gap-2.5 rounded-[14px] font-semibold text-[13px] tracking-wider uppercase text-white overflow-hidden transition-all duration-300 hover:-translate-y-0.5 w-full sm:w-auto h-14 px-8 shadow-[0_10px_30px_-10px_hsl(var(--primary)/0.5)]"
                    style={{
                      background: `linear-gradient(135deg, hsl(var(--primary)) 0%, hsl(var(--primary) / 0.8) 100%)`,
                    }}
                  >
                    <span className="relative">{active.primary_cta_label || "Explore Products"}</span>
                    <ArrowRight className="relative w-4 h-4 transition-transform group-hover:translate-x-1" />
                  </button>
                  <button
                    onClick={() => go(active.secondary_cta_link || "#contact-section")} // Corrected height
                    className="group inline-flex items-center justify-center gap-2.5 rounded-[14px] font-semibold text-[13px] tracking-wider uppercase text-white bg-white/10 border border-white/20 backdrop-blur-md hover:border-white hover:-translate-y-0.5 transition-all duration-300 w-full sm:w-auto h-14 px-8"
                  >
                    {active.secondary_cta_label || "Contact Us"}
                  </button>
                </motion.div>
              </motion.div>
            </AnimatePresence>
          </div>
        </div>
      </div>

      {/* Scroll Indicator */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 1.5, duration: 1 }}
        className="absolute bottom-32 left-6 md:left-16 lg:left-24 z-20 flex flex-col items-center gap-2 text-white/50 pointer-events-none"
      >
        <span className="text-[10px] font-semibold tracking-[0.2em] uppercase [writing-mode:vertical-rl]">Scroll</span>
        <span className="w-px h-8 bg-white/40 mt-2" />
      </motion.div>

      {/* ============ LAYER 3 — Premium timeline navigation ============ */}
      {slides.length > 0 && (
        <div
          className="absolute bottom-0 inset-x-0 z-30 h-[90px]"
          style={{
            background: "rgba(15, 23, 42, 0.3)",
            backdropFilter: "blur(12px)",
            borderTop: "1px solid rgba(255,255,255,0.1)",
          }}
        >
          <div className="h-full max-w-[1440px] mx-auto flex items-stretch px-6 md:px-8">
            {/* Slides timeline */}
            <div className="flex-1 flex items-stretch overflow-x-auto no-scrollbar">
              {slides.map((s, i) => {
                const isActive = i === index;
                return (
                  <button
                    key={s.id}
                    onClick={() => setIndex(i)}
                    className={`group relative flex-1 min-w-[180px] md:min-w-[240px] text-left px-4 md:px-6 py-3 md:py-5 transition-all duration-300 ${
                      isActive
                        ? "bg-white/[0.04]"
                        : "opacity-70 hover:opacity-100 hover:-translate-y-[2px]"
                    }`}
                  >
                    {/* Top progress / border line */}
                    <span className="absolute top-0 left-0 right-0 h-[2px] bg-white/8 overflow-hidden">
                      {isActive && (
                        <motion.span
                          key={s.id + "-prog-" + index + "-" + String(paused)}
                          className="absolute inset-y-0 left-0"
                          style={{ background: "hsl(var(--primary))", boxShadow: `0 0 10px hsl(var(--primary))` }}
                          initial={{ width: "0%" }}
                          animate={{ width: "100%" }}
                          transition={{
                            duration: AUTO_MS / 1000,
                            ease: "linear",
                          }}
                        />
                      )}
                    </span>

                    {/* Number */}
                    <div
                      className={`text-[11px] font-mono tracking-widest tabular-nums mb-2 transition-colors ${
                        isActive ? "text-primary" : "text-white/50"
                      }`}
                    >
                      {String(i + 1).padStart(2, "0")}
                    </div>

                    {/* Title */}
                    <div
                      className={`text-sm font-semibold tracking-wide line-clamp-1 transition-colors ${
                        isActive ? "text-white" : "text-white/70"
                      }`}
                    >
                      {s.title}
                    </div>
                  </button>
                );
              })}
            </div>

            {/* Prev / Next — glass circular */}
            {slides.length > 1 && (
              <div className="flex items-center gap-3 pl-4 md:pl-6">
                <button
                  onClick={prev}
                  aria-label="Previous slide"
                  className="rounded-full flex items-center justify-center text-white/70 hover:text-white transition-all duration-300 w-11 h-11"
                  style={{
                    background: "rgba(255,255,255,0.08)",
                    border: "1px solid rgba(255,255,255,0.15)",
                  }}
                >
                  <ChevronLeft className="w-5 h-5" />
                </button>
                <button
                  onClick={next}
                  aria-label="Next slide"
                  className="rounded-full flex items-center justify-center text-white/70 hover:text-white transition-all duration-300 w-11 h-11"
                  style={{
                    background: "rgba(255,255,255,0.08)",
                    border: "1px solid rgba(255,255,255,0.15)",
                  }}
                >
                  <ChevronRight className="w-5 h-5" />
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
