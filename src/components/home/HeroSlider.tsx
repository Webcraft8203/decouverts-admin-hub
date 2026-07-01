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

const AUTO_MS = 6500;
const NAV_H = 115;
const ORANGE = "#FF6B00";
const ORANGE_SOFT = "#FF8A2A";

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
      onMouseEnter={() => setPaused(true)}
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
            initial={{ scale: 1.05 }}
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
        style={{
          background:
            "linear-gradient(90deg, rgba(8,12,20,0.75) 0%, rgba(8,12,20,0.55) 30%, rgba(8,12,20,0.45) 50%, rgba(8,12,20,0.22) 75%, rgba(8,12,20,0.08) 100%)",
        }}
      />
      {/* Bottom-fade toward the nav bar so it blends */}
      <div
        className="absolute inset-x-0 bottom-0 pointer-events-none"
        style={{
          height: NAV_H + 120,
          background:
            "linear-gradient(180deg, rgba(8,12,20,0) 0%, rgba(8,12,20,0.55) 60%, rgba(17,24,39,0.95) 100%)",
        }}
      />

      {/* ============ Subtle aerospace HUD (3–5% opacity) ============ */}
      <div className="absolute inset-0 pointer-events-none opacity-[0.05]">
        {/* GPS grid */}
        <svg className="absolute inset-0 w-full h-full" xmlns="http://www.w3.org/2000/svg">
          <defs>
            <pattern id="hud-grid" width="72" height="72" patternUnits="userSpaceOnUse">
              <path d="M 72 0 L 0 0 0 72" fill="none" stroke="white" strokeWidth="0.5" />
            </pattern>
          </defs>
          <rect width="100%" height="100%" fill="url(#hud-grid)" />
        </svg>
      </div>
      {/* Radar circles — top right */}
      <div className="absolute -top-40 -right-40 w-[560px] h-[560px] pointer-events-none opacity-[0.06]">
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
          height: 520,
          background: `radial-gradient(circle, ${ORANGE}22 0%, transparent 65%)`,
          filter: "blur(20px)",
        }}
      />

      {/* ============ LAYER 2 — Left-anchored content ============ */}
      <div
        className="absolute inset-x-0 top-0 z-20 flex items-center pointer-events-none"
        style={{ bottom: NAV_H }}
      >
        <div
          className="w-full mx-auto"
          style={{ maxWidth: 1440, paddingLeft: "clamp(24px, 8vw, 120px)", paddingRight: "clamp(24px, 6vw, 80px)" }}
        >
          <div className="max-w-[720px] pointer-events-auto">
            <AnimatePresence mode="wait">
              <motion.div
                key={active.id + "-content"}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.5 }}
              >
                {/* Badge */}
                <motion.span
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.6, delay: 0.05 }}
                  className="inline-flex items-center gap-2 py-2 px-4 rounded-full backdrop-blur-md text-[10px] md:text-[11px] font-semibold tracking-[0.32em] uppercase mb-8 text-white"
                  style={{
                    background: "rgba(255,255,255,0.06)",
                    border: `1px solid ${ORANGE}80`,
                    boxShadow: `0 0 24px ${ORANGE}22, inset 0 0 12px rgba(255,255,255,0.04)`,
                  }}
                >
                  <span
                    className="w-1.5 h-1.5 rounded-full animate-pulse"
                    style={{ background: ORANGE, boxShadow: `0 0 8px ${ORANGE}` }}
                  />
                  {active.badge_label || "Indigenous Drone Technology"}
                </motion.span>

                {/* Title */}
                <motion.h1
                  initial={{ opacity: 0, y: 24 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.75, delay: 0.14 }}
                  className="text-white font-extrabold tracking-[-0.015em] mb-8"
                  style={{
                    fontFamily: "'Montserrat', sans-serif",
                    fontSize: "clamp(2.5rem, 6vw, 4.5rem)",
                    lineHeight: 0.95,
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
                    transition={{ duration: 0.75, delay: 0.24 }}
                    className="mb-10"
                    style={{
                      color: "rgba(226,232,240,0.82)",
                      fontSize: 18,
                      lineHeight: 1.8,
                      maxWidth: 620,
                    }}
                  >
                    {active.description}
                  </motion.p>
                )}

                {/* CTAs */}
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.75, delay: 0.34 }}
                  className="flex flex-col sm:flex-row gap-4"
                >
                  <button
                    onClick={() => go(active.primary_cta_link || "/shop")}
                    className="group relative inline-flex items-center justify-center gap-2.5 rounded-full font-semibold text-[13px] tracking-[0.14em] uppercase text-white overflow-hidden transition-all duration-300 hover:-translate-y-[3px] w-full sm:w-auto"
                    style={{
                      height: 60,
                      padding: "0 40px",
                      background: `linear-gradient(135deg, ${ORANGE} 0%, ${ORANGE_SOFT} 100%)`,
                      boxShadow: `0 14px 34px -10px ${ORANGE}cc, 0 0 0 1px ${ORANGE}30 inset`,
                    }}
                    onMouseEnter={(e) => {
                      (e.currentTarget as HTMLButtonElement).style.boxShadow = `0 22px 50px -8px ${ORANGE}, 0 0 40px ${ORANGE}80`;
                    }}
                    onMouseLeave={(e) => {
                      (e.currentTarget as HTMLButtonElement).style.boxShadow = `0 14px 34px -10px ${ORANGE}cc, 0 0 0 1px ${ORANGE}30 inset`;
                    }}
                  >
                    <span className="relative">{active.primary_cta_label || "Explore Products"}</span>
                    <ArrowRight className="relative w-4 h-4 transition-transform group-hover:translate-x-1" />
                  </button>
                  <button
                    onClick={() => go(active.secondary_cta_link || "#contact-section")}
                    className="group inline-flex items-center justify-center gap-2.5 rounded-full font-semibold text-[13px] tracking-[0.14em] uppercase text-white bg-white/5 border border-white/40 backdrop-blur-md hover:bg-white hover:text-slate-900 hover:border-white transition-colors w-full sm:w-auto"
                    style={{ height: 60, padding: "0 40px" }}
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

      {/* ============ LAYER 3 — Premium timeline navigation ============ */}
      {slides.length > 0 && (
        <div
          className="absolute bottom-0 inset-x-0 z-30"
          style={{
            height: NAV_H,
            background: "#111827",
            borderTop: "1px solid rgba(255,255,255,0.06)",
            boxShadow: "0 -20px 60px rgba(0,0,0,0.35)",
          }}
        >
          <div className="h-full max-w-[1440px] mx-auto flex items-stretch px-4 md:px-8">
            {/* Slides timeline */}
            <div className="flex-1 flex items-stretch overflow-x-auto no-scrollbar">
              {slides.map((s, i) => {
                const isActive = i === index;
                return (
                  <button
                    key={s.id}
                    onClick={() => setIndex(i)}
                    className={`group relative flex-1 min-w-[200px] text-left px-6 py-5 transition-all duration-300 ${
                      isActive
                        ? "bg-white/[0.04]"
                        : "opacity-70 hover:opacity-100 hover:-translate-y-[2px]"
                    }`}
                  >
                    {/* Top progress / border line */}
                    <span className="absolute top-0 left-0 right-0 h-[2px] bg-white/8 overflow-hidden">
                      <span
                        className={`absolute inset-y-0 left-0 transition-all duration-500 ${
                          isActive ? "opacity-100" : "opacity-0 group-hover:opacity-60"
                        }`}
                        style={{
                          width: isActive ? undefined : "40%",
                          background: ORANGE,
                        }}
                      />
                      {isActive && (
                        <motion.span
                          key={s.id + "-prog-" + index + "-" + String(paused)}
                          className="absolute inset-y-0 left-0"
                          style={{ background: ORANGE, boxShadow: `0 0 10px ${ORANGE}` }}
                          initial={{ width: "0%" }}
                          animate={{ width: paused ? "0%" : "100%" }}
                          transition={{
                            duration: paused ? 0 : AUTO_MS / 1000,
                            ease: "linear",
                          }}
                        />
                      )}
                    </span>

                    {/* Number */}
                    <div
                      className="text-[11px] font-mono tracking-[0.2em] tabular-nums mb-1.5 transition-colors"
                      style={{ color: isActive ? ORANGE : "rgba(255,255,255,0.45)" }}
                    >
                      {String(i + 1).padStart(2, "0")}
                    </div>

                    {/* Title */}
                    <div
                      className={`text-[14px] font-semibold tracking-wide mb-1 line-clamp-1 transition-colors ${
                        isActive ? "text-white" : "text-white/70"
                      }`}
                    >
                      {s.title}
                    </div>

                    {/* Short description */}
                    {(s.subtitle || s.description) && (
                      <p
                        className={`text-[11.5px] leading-snug line-clamp-1 transition-colors ${
                          isActive ? "text-white/60" : "text-white/40"
                        }`}
                      >
                        {s.subtitle || s.description}
                      </p>
                    )}
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
                  className="rounded-full flex items-center justify-center text-white transition-all duration-300 hover:text-white"
                  style={{
                    width: 60,
                    height: 60,
                    background: "rgba(255,255,255,0.04)",
                    border: "1px solid rgba(255,255,255,0.18)",
                    backdropFilter: "blur(12px)",
                  }}
                  onMouseEnter={(e) => {
                    const b = e.currentTarget as HTMLButtonElement;
                    b.style.background = ORANGE;
                    b.style.borderColor = ORANGE;
                  }}
                  onMouseLeave={(e) => {
                    const b = e.currentTarget as HTMLButtonElement;
                    b.style.background = "rgba(255,255,255,0.04)";
                    b.style.borderColor = "rgba(255,255,255,0.18)";
                  }}
                >
                  <ChevronLeft className="w-5 h-5" />
                </button>
                <button
                  onClick={next}
                  aria-label="Next slide"
                  className="rounded-full flex items-center justify-center text-white transition-all duration-300"
                  style={{
                    width: 60,
                    height: 60,
                    background: "rgba(255,255,255,0.04)",
                    border: "1px solid rgba(255,255,255,0.18)",
                    backdropFilter: "blur(12px)",
                  }}
                  onMouseEnter={(e) => {
                    const b = e.currentTarget as HTMLButtonElement;
                    b.style.background = ORANGE;
                    b.style.borderColor = ORANGE;
                  }}
                  onMouseLeave={(e) => {
                    const b = e.currentTarget as HTMLButtonElement;
                    b.style.background = "rgba(255,255,255,0.04)";
                    b.style.borderColor = "rgba(255,255,255,0.18)";
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
