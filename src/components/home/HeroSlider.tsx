import { useEffect, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { ArrowRight, ChevronLeft, ChevronRight } from "lucide-react";

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

/* Minimal HUD: blueprint grid, subtle radar, orange glow */
const MinimalHud = ({ glow }: { glow: string }) => (
  <div className="pointer-events-none absolute inset-0 overflow-hidden">
    {/* blueprint grid */}
    <div className="absolute inset-0 opacity-[0.08] bg-[linear-gradient(to_right,rgba(255,255,255,0.7)_1px,transparent_1px),linear-gradient(to_bottom,rgba(255,255,255,0.7)_1px,transparent_1px)] bg-[size:80px_80px] [mask-image:radial-gradient(ellipse_at_center,black_40%,transparent_100%)]" />
    {/* radar */}
    <svg viewBox="0 0 400 400" className="absolute -right-40 bottom-20 w-[560px] h-[560px] opacity-40 hidden md:block">
      <defs>
        <radialGradient id="hero-radar-fade" cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor={glow} stopOpacity="0.18" />
          <stop offset="100%" stopColor={glow} stopOpacity="0" />
        </radialGradient>
      </defs>
      <circle cx="200" cy="200" r="180" fill="url(#hero-radar-fade)" />
      {[80, 130, 180].map((r, i) => (
        <motion.circle
          key={r}
          cx="200" cy="200" r={r}
          fill="none" stroke={glow} strokeOpacity="0.25" strokeWidth="0.6" strokeDasharray="2 6"
          animate={{ rotate: 360 }}
          style={{ transformOrigin: "200px 200px" }}
          transition={{ duration: 40 + i * 10, repeat: Infinity, ease: "linear" }}
        />
      ))}
    </svg>
  </div>
);

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

  if (!slides.length) return null;

  const active = slides[index];
  const glow = active.glow_color || "#FF6B00";

  const go = (link: string | null) => {
    if (!link) return;
    if (link.startsWith("http")) window.open(link, "_blank");
    else if (link.startsWith("#")) document.getElementById(link.slice(1))?.scrollIntoView({ behavior: "smooth" });
    else navigate(link);
  };

  const bgMedia = active.background_image_url || active.image_url;

  const touchStart = useRef<number | null>(null);
  const onTouchStart = (e: React.TouchEvent) => { touchStart.current = e.touches[0].clientX; };
  const onTouchEnd = (e: React.TouchEvent) => {
    if (touchStart.current == null) return;
    const dx = e.changedTouches[0].clientX - touchStart.current;
    if (dx < -50) setIndex((i) => (i + 1) % slides.length);
    if (dx > 50) setIndex((i) => (i - 1 + slides.length) % slides.length);
    touchStart.current = null;
  };

  const next = () => setIndex((i) => (i + 1) % slides.length);
  const prev = () => setIndex((i) => (i - 1 + slides.length) % slides.length);

  return (
    <div
      className="absolute inset-0 overflow-hidden bg-slate-950"
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
      onTouchStart={onTouchStart}
      onTouchEnd={onTouchEnd}
    >
      {/* Media layer — fullscreen background with slow zoom */}
      <AnimatePresence mode="sync">
        <motion.div
          key={active.id + "-media"}
          className="absolute inset-0"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 1.1, ease: [0.22, 1, 0.36, 1] }}
        >
          <motion.div
            className="absolute inset-0"
            initial={{ scale: 1.08 }}
            animate={{ scale: 1.18 }}
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

      {/* Premium overlays — black + dark navy gradient for readability */}
      <div className="absolute inset-0 bg-gradient-to-r from-slate-950/85 via-slate-950/55 to-slate-950/25" />
      <div className="absolute inset-0 bg-gradient-to-t from-slate-950/90 via-slate-950/20 to-slate-950/40" />
      <div
        className="absolute inset-0 opacity-60"
        style={{ background: `radial-gradient(ellipse at 18% 45%, ${glow}22, transparent 55%)` }}
      />

      <MinimalHud glow={glow} />

      {/* Left content block */}
      <div className="absolute inset-0 z-20 flex items-center pointer-events-none">
        <div className="container mx-auto px-6 sm:px-8 lg:px-16">
          <div className="max-w-2xl pointer-events-auto">
            <AnimatePresence mode="wait">
              <motion.div
                key={active.id + "-content"}
                initial={{ opacity: 0, y: 24 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -14 }}
                transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
              >
                <motion.span
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.6, delay: 0.05 }}
                  className="inline-flex items-center gap-2 py-1.5 px-4 rounded-full backdrop-blur-md border text-[10px] md:text-[11px] font-bold tracking-[0.28em] uppercase mb-6 text-white"
                  style={{ background: `${glow}18`, borderColor: `${glow}66` }}
                >
                  <span className="w-1.5 h-1.5 rounded-full animate-pulse" style={{ background: glow }} />
                  {active.badge_label || "Indigenous Drone Technology"}
                </motion.span>

                <motion.h1
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.8, delay: 0.1 }}
                  className="text-white font-bold leading-[1.02] tracking-tight text-[2.75rem] sm:text-6xl md:text-7xl lg:text-[5.5rem] mb-5 drop-shadow-[0_4px_24px_rgba(0,0,0,0.55)]"
                  style={{ fontFamily: "'Montserrat', sans-serif" }}
                >
                  {active.title}
                </motion.h1>

                {active.description && (
                  <motion.p
                    initial={{ opacity: 0, y: 16 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.7, delay: 0.2 }}
                    className="text-base md:text-lg lg:text-xl text-white/85 max-w-xl leading-relaxed mb-8 line-clamp-3"
                  >
                    {active.description}
                  </motion.p>
                )}

                <motion.div
                  initial={{ opacity: 0, y: 16 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.7, delay: 0.3 }}
                  className="flex flex-col sm:flex-row gap-3 sm:gap-4"
                >
                  <button
                    onClick={() => go(active.primary_cta_link || "/shop")}
                    className="group relative inline-flex items-center justify-center gap-2 h-13 py-3.5 px-8 rounded-full font-bold text-sm tracking-wide uppercase text-white overflow-hidden transition-transform hover:-translate-y-0.5 w-full sm:w-auto"
                    style={{ background: glow, boxShadow: `0 20px 40px -12px ${glow}90` }}
                  >
                    <span className="absolute inset-0 bg-white opacity-0 group-hover:opacity-15 transition-opacity" />
                    <span className="relative">{active.primary_cta_label || "Explore Products"}</span>
                    <ArrowRight className="relative w-4 h-4 transition-transform group-hover:translate-x-1" />
                  </button>
                  <button
                    onClick={() => go(active.secondary_cta_link || "#contact-section")}
                    className="group inline-flex items-center justify-center gap-2 h-13 py-3.5 px-8 rounded-full font-bold text-sm tracking-wide uppercase text-white bg-white/8 backdrop-blur-md border border-white/30 hover:bg-white/15 hover:border-white/60 transition-colors w-full sm:w-auto"
                  >
                    {active.secondary_cta_label || "Contact Us"}
                    <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
                  </button>
                </motion.div>
              </motion.div>
            </AnimatePresence>
          </div>
        </div>
      </div>

      {/* Prev / Next controls — bottom right */}
      {slides.length > 1 && (
        <div className="absolute bottom-32 md:bottom-40 right-4 md:right-10 z-40 flex items-center gap-3">
          <button
            onClick={prev}
            aria-label="Previous slide"
            className="group w-11 h-11 md:w-12 md:h-12 rounded-full border border-white/25 bg-white/5 backdrop-blur-md text-white flex items-center justify-center hover:border-primary hover:text-primary transition-colors"
          >
            <ChevronLeft className="w-5 h-5" />
          </button>
          <button
            onClick={next}
            aria-label="Next slide"
            className="group w-11 h-11 md:w-12 md:h-12 rounded-full border border-white/25 bg-white/5 backdrop-blur-md text-white flex items-center justify-center hover:border-primary hover:text-primary transition-colors"
          >
            <ChevronRight className="w-5 h-5" />
          </button>
        </div>
      )}

      {/* Bottom slide navigation */}
      {slides.length > 1 && (
        <div className="absolute bottom-0 inset-x-0 z-30">
          <div className="bg-gradient-to-t from-slate-950/95 via-slate-950/60 to-transparent pt-10 pb-5 md:pb-7">
            <div className="container mx-auto px-4 md:px-10">
              <div className="flex gap-3 md:gap-0 overflow-x-auto md:overflow-visible md:grid md:grid-cols-4 md:border-t md:border-white/10 no-scrollbar">
                {slides.map((s, i) => {
                  const isActive = i === index;
                  return (
                    <button
                      key={s.id}
                      onClick={() => setIndex(i)}
                      className={`group relative flex-shrink-0 w-[240px] md:w-auto text-left pt-5 pb-3 px-5 md:border-l md:border-white/10 md:first:border-l-0 transition-colors ${isActive ? "" : "hover:bg-white/5"}`}
                    >
                      {/* Progress line */}
                      <span className="absolute top-0 left-0 right-0 h-[2px] bg-white/10 overflow-hidden">
                        {isActive && (
                          <motion.span
                            key={s.id + "-prog-" + index + "-" + String(paused)}
                            className="absolute inset-y-0 left-0"
                            style={{ background: glow, boxShadow: `0 0 10px ${glow}` }}
                            initial={{ width: "0%" }}
                            animate={{ width: "100%" }}
                            transition={{ duration: paused ? 30 : AUTO_MS / 1000, ease: "linear" }}
                          />
                        )}
                      </span>

                      <div className="flex items-baseline gap-3 mb-1.5">
                        <span className={`text-xs tabular-nums tracking-widest font-mono ${isActive ? "text-white" : "text-white/40"}`}>
                          {String(i + 1).padStart(2, "0")}
                        </span>
                        <span className={`text-sm md:text-base font-bold uppercase tracking-wider transition-colors ${isActive ? "text-white" : "text-white/55 group-hover:text-white/85"}`}>
                          {s.title}
                        </span>
                      </div>
                      {(s.subtitle || s.description) && (
                        <p className={`text-[11px] md:text-xs line-clamp-1 pl-8 transition-colors ${isActive ? "text-white/75" : "text-white/40 group-hover:text-white/60"}`}>
                          {s.subtitle || s.description}
                        </p>
                      )}
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
