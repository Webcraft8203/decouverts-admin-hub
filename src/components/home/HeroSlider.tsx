import { useEffect, useRef, useState, useMemo } from "react";
import { motion, AnimatePresence, useReducedMotion } from "framer-motion";
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

const AUTO_MS = 7000;

export const HeroSlider = ({ slides }: Props) => {
  const [index, setIndex] = useState(0);
  const [paused, setPaused] = useState(false);
  const navigate = useNavigate();
  const prefersReducedMotion = useReducedMotion();

  useEffect(() => {
    if (paused || slides.length <= 1 || prefersReducedMotion) return;
    const t = setTimeout(() => setIndex((i) => (i + 1) % slides.length), AUTO_MS);
    return () => clearTimeout(t);
  }, [index, paused, slides.length, prefersReducedMotion]);

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
      className="absolute inset-0 overflow-hidden bg-[hsl(217,45%,9%)]"
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
      onTouchStart={onTouchStart}
      onTouchEnd={onTouchEnd}
    >
      {/* Media */}
      <AnimatePresence mode="sync">
        <motion.div
          key={active.id + "-media"}
          className="absolute inset-0"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.9, ease: "easeInOut" }}
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
            <div className="absolute inset-0 bg-[hsl(217,45%,9%)]" />
          )}
        </motion.div>
      </AnimatePresence>

      {/* Readability scrim */}
      <div className="absolute inset-0 bg-gradient-to-r from-[hsl(217,45%,7%)]/95 via-[hsl(217,45%,7%)]/55 to-[hsl(217,45%,7%)]/10" />
      <div className="absolute inset-0 bg-gradient-to-t from-[hsl(217,45%,7%)]/70 via-transparent to-transparent" />

      {/* Content */}
      <div className="relative z-10 h-full flex items-center">
        <div className="w-full max-w-[1440px] mx-auto px-6 md:px-10 lg:px-16">
          <div className="max-w-[640px]">
            <AnimatePresence mode="wait">
              <motion.div
                key={active.id + "-content"}
                initial={{ opacity: 0, y: 14 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.5, ease: "easeOut" }}
              >
                {active.badge_label && (
                  <div className="inline-flex items-center gap-2 text-[11px] font-semibold tracking-[0.2em] uppercase text-primary mb-6">
                    <span className="h-px w-8 bg-primary" />
                    {active.badge_label}
                  </div>
                )}

                <h1 className="font-display font-bold text-white tracking-tight leading-[1.06] text-[clamp(2.25rem,4.4vw,3.75rem)] mb-6">
                  {active.title}
                </h1>

                {active.description && (
                  <p className="text-white/70 text-base md:text-lg leading-relaxed max-w-[520px] mb-9 line-clamp-3 md:line-clamp-none">
                    {active.description}
                  </p>
                )}

                <div className="flex flex-wrap items-center gap-3">
                  {active.primary_cta_label && (
                    <button
                      onClick={() => go(active.primary_cta_link)}
                      className="group inline-flex items-center justify-center gap-2 rounded-md font-semibold text-sm h-12 px-6 bg-primary text-primary-foreground hover:bg-primary/90 transition-colors duration-200"
                    >
                      {active.primary_cta_label}
                      <ArrowRight className="w-4 h-4 transition-transform duration-200 group-hover:translate-x-0.5" />
                    </button>
                  )}
                  {active.secondary_cta_label && (
                    <button
                      onClick={() => go(active.secondary_cta_link)}
                      className="inline-flex items-center justify-center gap-2 rounded-md font-semibold text-sm h-12 px-6 border border-white/25 text-white hover:bg-white/10 transition-colors duration-200"
                    >
                      {active.secondary_cta_label}
                    </button>
                  )}
                </div>
              </motion.div>
            </AnimatePresence>
          </div>
        </div>
      </div>

      {/* Bottom control bar */}
      {slides.length > 1 && (
        <div className="absolute bottom-0 inset-x-0 z-10">
          <div className="max-w-[1440px] mx-auto px-6 md:px-10 lg:px-16 pb-7 flex items-center gap-6">
            <div className="flex items-center gap-2">
              <button
                onClick={prev}
                aria-label="Previous slide"
                className="w-9 h-9 rounded-full flex items-center justify-center text-white/70 hover:text-white border border-white/20 hover:bg-white/10 transition-colors duration-200"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <button
                onClick={next}
                aria-label="Next slide"
                className="w-9 h-9 rounded-full flex items-center justify-center text-white/70 hover:text-white border border-white/20 hover:bg-white/10 transition-colors duration-200"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
            <div className="flex-1 flex items-center gap-3">
              {slides.map((s, i) => (
                <button
                  key={s.id}
                  onClick={() => setIndex(i)}
                  aria-label={`Go to slide ${i + 1}`}
                  className="relative h-[3px] flex-1 max-w-16 bg-white/15 rounded-full overflow-hidden"
                >
                  {i === index ? (
                    <motion.span
                      key={s.id + "-prog-" + index}
                      className="absolute inset-y-0 left-0 bg-primary"
                      initial={{ width: "0%" }}
                      animate={{ width: "100%" }}
                      transition={{ duration: prefersReducedMotion ? 0 : AUTO_MS / 1000, ease: "linear" }}
                    />
                  ) : i < index ? (
                    <span className="absolute inset-0 bg-white/40" />
                  ) : null}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
