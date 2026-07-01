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
const NAV_H = 170;
const ORANGE = "#FF6B00";

export const HeroSlider = ({ slides }: Props) => {
  const [index, setIndex] = useState(0);
  const [paused, setPaused] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    if (paused || slides.length <= 1) return;
    const t = setTimeout(
      () => setIndex((i) => (i + 1) % slides.length),
      AUTO_MS
    );
    return () => clearTimeout(t);
  }, [index, paused, slides.length]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "ArrowRight") setIndex((i) => (i + 1) % slides.length);
      if (e.key === "ArrowLeft")
        setIndex((i) => (i - 1 + slides.length) % slides.length);
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
      className="absolute inset-0 overflow-hidden bg-slate-950"
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
      onTouchStart={onTouchStart}
      onTouchEnd={onTouchEnd}
    >
      {/* ============ LAYER 1 — Full background media ============ */}
      <AnimatePresence mode="sync">
        <motion.div
          key={active.id + "-bg"}
          className="absolute inset-0"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 1.1, ease: [0.22, 1, 0.36, 1] }}
        >
          <motion.div
            className="absolute inset-0"
            initial={{ scale: 1 }}
            animate={{ scale: 1.08 }}
            transition={{ duration: AUTO_MS / 1000 + 2, ease: "linear" }}
          >
            {active.video_url ? (
              <video
                src={active.video_url}
                autoPlay
                muted
                loop
                playsInline
                preload="metadata"
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

      {/* Subtle dark overlay — exactly rgba(0,0,0,0.35) */}
      <div
        className="absolute inset-0"
        style={{ background: "rgba(0,0,0,0.35)" }}
      />
      {/* Extra readability gradient from the left (very subtle) */}
      <div
        className="absolute inset-0"
        style={{
          background:
            "linear-gradient(90deg, rgba(0,0,0,0.35) 0%, rgba(0,0,0,0.15) 45%, rgba(0,0,0,0) 70%)",
        }}
      />

      {/* ============ LAYER 2 — Left content ============ */}
      <div
        className="absolute inset-x-0 top-0 z-20 flex items-center pointer-events-none"
        style={{ bottom: NAV_H }}
      >
        <div className="w-full px-6 sm:px-10 lg:px-20">
          <div className="w-full lg:w-[45%] xl:w-[40%] pointer-events-auto">
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
                  initial={{ opacity: 0, y: 16 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.6, delay: 0.05 }}
                  className="inline-flex items-center gap-2 py-1.5 px-4 rounded-full backdrop-blur-md border text-[10px] md:text-[11px] font-bold tracking-[0.28em] uppercase mb-6 text-white"
                  style={{
                    background: `${ORANGE}1A`,
                    borderColor: `${ORANGE}66`,
                  }}
                >
                  <span
                    className="w-1.5 h-1.5 rounded-full animate-pulse"
                    style={{ background: ORANGE }}
                  />
                  {active.badge_label || "Indigenous Drone Technology"}
                </motion.span>

                {/* Heading 72-88px */}
                <motion.h1
                  initial={{ opacity: 0, y: 24 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.7, delay: 0.12 }}
                  className="text-white font-bold leading-[1.02] tracking-tight mb-6 drop-shadow-[0_4px_24px_rgba(0,0,0,0.55)]"
                  style={{
                    fontFamily: "'Montserrat', sans-serif",
                    fontSize: "clamp(2.5rem, 6.2vw, 5.5rem)",
                  }}
                >
                  {active.title}
                </motion.h1>

                {/* Description */}
                {active.description && (
                  <motion.p
                    initial={{ opacity: 0, y: 18 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.7, delay: 0.22 }}
                    className="text-white/70 leading-relaxed mb-10 max-w-xl"
                    style={{ fontSize: "clamp(1rem, 1.35vw, 1.375rem)" }}
                  >
                    {active.description}
                  </motion.p>
                )}

                {/* Buttons */}
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.7, delay: 0.32 }}
                  className="flex flex-col sm:flex-row gap-3 sm:gap-4"
                >
                  <button
                    onClick={() => go(active.primary_cta_link || "/shop")}
                    className="group relative inline-flex items-center justify-center gap-2 h-14 px-8 rounded-full font-bold text-sm tracking-wide uppercase text-white overflow-hidden transition-all hover:-translate-y-0.5 w-full sm:w-auto"
                    style={{
                      background: ORANGE,
                      boxShadow: `0 20px 40px -12px ${ORANGE}90`,
                    }}
                  >
                    <span className="absolute inset-0 bg-white opacity-0 group-hover:opacity-15 transition-opacity" />
                    <span className="relative">
                      {active.primary_cta_label || "Explore Products"}
                    </span>
                    <ArrowRight className="relative w-4 h-4 transition-transform group-hover:translate-x-1" />
                  </button>
                  <button
                    onClick={() =>
                      go(active.secondary_cta_link || "#contact-section")
                    }
                    className="group inline-flex items-center justify-center gap-2 h-14 px-8 rounded-full font-bold text-sm tracking-wide uppercase text-white bg-transparent border border-white/70 hover:bg-white hover:text-slate-900 transition-colors w-full sm:w-auto"
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

      {/* ============ LAYER 3 — Bottom glass navigation panel ============ */}
      {slides.length > 0 && (
        <div
          className="absolute bottom-0 inset-x-0 z-30 border-t border-white/10"
          style={{
            height: NAV_H,
            background: "rgba(15,20,30,0.92)",
            backdropFilter: "blur(25px)",
            WebkitBackdropFilter: "blur(25px)",
          }}
        >
          <div className="h-full flex items-stretch">
            {/* Slides grid */}
            <div className="flex-1 flex items-stretch overflow-x-auto no-scrollbar">
              {slides.map((s, i) => {
                const isActive = i === index;
                return (
                  <button
                    key={s.id}
                    onClick={() => setIndex(i)}
                    className="group relative flex-1 min-w-[220px] text-left px-6 md:px-7 py-6 border-r border-white/10 transition-colors hover:bg-white/[0.04]"
                  >
                    {/* Top progress line */}
                    <span className="absolute top-0 left-0 right-0 h-[2px] bg-white/12 overflow-hidden">
                      {isActive ? (
                        <motion.span
                          key={s.id + "-prog-" + index + "-" + String(paused)}
                          className="absolute inset-y-0 left-0"
                          style={{
                            background: ORANGE,
                            boxShadow: `0 0 10px ${ORANGE}`,
                          }}
                          initial={{ width: "0%" }}
                          animate={{ width: paused ? "0%" : "100%" }}
                          transition={{
                            duration: paused ? 0 : AUTO_MS / 1000,
                            ease: "linear",
                          }}
                        />
                      ) : null}
                    </span>

                    {/* Number */}
                    <div
                      className={`text-xs font-mono tracking-[0.2em] tabular-nums mb-2 transition-colors ${
                        isActive ? "" : "text-white/40 group-hover:text-white/60"
                      }`}
                      style={isActive ? { color: ORANGE } : undefined}
                    >
                      {String(i + 1).padStart(2, "0")}
                    </div>

                    {/* Title — always white */}
                    <div className="text-white text-[15px] md:text-base font-bold uppercase tracking-wider mb-1.5 line-clamp-1">
                      {s.title}
                    </div>

                    {/* Short description */}
                    {(s.subtitle || s.description) && (
                      <p
                        className={`text-[11.5px] md:text-xs leading-snug line-clamp-2 transition-colors ${
                          isActive ? "text-white/75" : "text-white/45"
                        }`}
                      >
                        {s.subtitle || s.description}
                      </p>
                    )}
                  </button>
                );
              })}
            </div>

            {/* Prev / Next controls */}
            {slides.length > 1 && (
              <div className="flex items-center gap-3 px-6 md:px-8 border-l border-white/10">
                <button
                  onClick={prev}
                  aria-label="Previous slide"
                  className="w-11 h-11 md:w-12 md:h-12 rounded-full border border-white/25 bg-white/5 text-white flex items-center justify-center hover:border-[color:var(--hero-orange)] hover:text-[color:var(--hero-orange)] hover:bg-white/10 transition-colors"
                  style={{ ["--hero-orange" as any]: ORANGE }}
                >
                  <ChevronLeft className="w-5 h-5" />
                </button>
                <button
                  onClick={next}
                  aria-label="Next slide"
                  className="w-11 h-11 md:w-12 md:h-12 rounded-full border border-white/25 bg-white/5 text-white flex items-center justify-center hover:border-[color:var(--hero-orange)] hover:text-[color:var(--hero-orange)] hover:bg-white/10 transition-colors"
                  style={{ ["--hero-orange" as any]: ORANGE }}
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
