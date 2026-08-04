import { useEffect, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { ArrowRight, ChevronLeft, ChevronRight, X, ArrowUp } from "lucide-react";

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

// Define the three premium themes
interface Theme {
  background: string;
  headingColor: string;
  descriptionColor: string;
  primaryButtonBg: string;
  primaryButtonHoverBg: string;
  secondaryButtonBg: string;
  secondaryButtonBorder: string;
  secondaryButtonHoverBg: string;
  secondaryButtonHoverBorder: string;
  subtleOverlay?: React.ReactNode;
}

const themes: Theme[] = [
  // Theme A: "Navy Defence"
  {
    background: "#08121F",
    headingColor: "white",
    descriptionColor: "#C9D1D9",
    primaryButtonBg: "bg-primary hover:bg-orange-400",
    primaryButtonHoverBg: "bg-orange-400",
    secondaryButtonBg: "bg-transparent",
    secondaryButtonBorder: "border-white/30",
    secondaryButtonHoverBg: "bg-white/10",
    secondaryButtonHoverBorder: "border-white/50",
    subtleOverlay: (
      <div aria-hidden className="absolute inset-0 opacity-[0.03] mix-blend-overlay" style={{ backgroundImage: "linear-gradient(rgba(255,255,255,0.05) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.05) 1px, transparent 1px)", backgroundSize: "56px 56px", maskImage: "radial-gradient(ellipse at 30% 50%, black 0%, transparent 70%)" }} />
    ),
  },
  // Theme B: "Clean White"
  {
    background: "#F8F9FB",
    headingColor: "#111827",
    descriptionColor: "#4B5563",
    primaryButtonBg: "bg-primary hover:bg-orange-400",
    primaryButtonHoverBg: "bg-orange-400",
    secondaryButtonBg: "bg-transparent",
    secondaryButtonBorder: "border-slate-300",
    secondaryButtonHoverBg: "bg-slate-100",
    secondaryButtonHoverBorder: "border-slate-400",
    subtleOverlay: (
      <div aria-hidden className="absolute inset-0 opacity-[0.05] mix-blend-overlay" style={{ backgroundImage: "radial-gradient(circle, rgba(0,0,0,0.02) 1px, transparent 1px)", backgroundSize: "8px 8px" }} />
    ),
  },
  // Theme C: "Graphite"
  {
    background: "#1A1D22",
    headingColor: "white",
    descriptionColor: "#D1D5DB",
    primaryButtonBg: "bg-primary hover:bg-orange-400",
    primaryButtonHoverBg: "bg-orange-400",
    secondaryButtonBg: "bg-transparent",
    secondaryButtonBorder: "border-white/20",
    secondaryButtonHoverBg: "bg-white/10",
    secondaryButtonHoverBorder: "border-white/30",
    subtleOverlay: (
      <div aria-hidden className="absolute inset-0 opacity-[0.08] mix-blend-overlay" style={{ background: "linear-gradient(135deg, rgba(255,255,255,0.05) 0%, transparent 50%, rgba(255,255,255,0.05) 100%)" }} />
    ),
  },
];

export const HeroSlider = ({ slides }: Props) => {
  const [index, setIndex] = useState(0);
  const [paused, setPaused] = useState(false);
  const [isSheetOpen, setIsSheetOpen] = useState(false);
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

  const currentTheme = themes[index % themes.length];

  return (
    <>
      <div
        className="absolute inset-0 overflow-hidden flex flex-col md:flex-row"
        onMouseEnter={() => setPaused(false)}
        onMouseLeave={() => setPaused(false)}
        onTouchStart={onTouchStart}
        onTouchEnd={onTouchEnd}
      >
        {/* ==================== Left Content Panel (Desktop/Tablet) ==================== */}
        <div className="hidden md:flex relative md:w-[45%] lg:w-[40%] h-full flex-col justify-center bg-[#081018]">
          {/* Animated background for the left panel */}
          <motion.div
            key={active.id + "-left-panel-bg"}
            initial={{ backgroundColor: themes[(index - 1 + themes.length) % themes.length].background }}
            animate={{ backgroundColor: currentTheme.background }}
            transition={{ duration: 0.6, ease: "easeOut" }}
            className="absolute inset-0"
          />
          {currentTheme.subtleOverlay}
          <div className="w-full max-w-[1600px] mx-auto">
            <div className="relative z-20 text-white px-6 sm:px-8 md:px-12 lg:px-16">
              <div className="max-w-[520px]">
                <AnimatePresence mode="wait">
                  <motion.div
                    key={active.id + "-content"}
                    initial={{ opacity: 0, x: 40, scale: 0.98 }}
                    animate={{ opacity: 1, x: 0, scale: 1 }}
                    exit={{ opacity: 0, x: -40, scale: 0.98 }}
                    transition={{ duration: 0.7, ease: "easeInOut" }}
                  >
                    <motion.h1
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.5, delay: 0.2, ease: "easeOut" }}
                      className={`font-extrabold tracking-tighter mb-6 [font-size:clamp(40px,5vw,64px)]`}
                      style={{ color: currentTheme.headingColor }}
                      style={{ lineHeight: "110%" }}
                    >
                      {active.title}
                    </motion.h1>

                    {active.description && (
                      <motion.p
                        initial={{ opacity: 0, y: 15 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.5, delay: 0.3, ease: "easeOut" }}
                        className="mb-10 text-base md:text-lg leading-relaxed max-w-[520px]"
                        style={{ color: currentTheme.descriptionColor }}
                      >
                        {active.description}
                      </motion.p>
                    )}

                    <motion.div
                      initial={{ opacity: 0, y: 15 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.5, delay: 0.4, ease: "easeOut" }}
                      className="flex flex-col sm:flex-row items-start gap-3"
                    >
                      {active.primary_cta_label && (
                        <button
                          onClick={() => go(active.primary_cta_link)}
                          className={`group relative inline-flex items-center justify-center gap-2 rounded-lg font-semibold text-sm text-white overflow-hidden transition-all duration-300 hover:-translate-y-0.5 h-11 px-6 shadow-lg shadow-primary/20 hover:shadow-primary/40 ${currentTheme.primaryButtonBg}`}
                        >
                          <span>{active.primary_cta_label}</span>
                          <ArrowRight className="w-4 h-4 transition-transform duration-300 group-hover:translate-x-1" />
                          {/* Glow effect on hover */}
                          <span className="absolute inset-0 -z-10 rounded-lg bg-primary opacity-0 transition-opacity duration-300 group-hover:opacity-100 blur-md" />
                        </button>
                      )}
                      {active.secondary_cta_label && (
                        <button
                          onClick={() => go(active.secondary_cta_link)}
                          className={`group relative inline-flex items-center justify-center gap-2 rounded-lg font-semibold text-sm text-white backdrop-blur-sm transition-all duration-300 hover:-translate-y-0.5 h-11 px-6 ${currentTheme.secondaryButtonBg} border ${currentTheme.secondaryButtonBorder} hover:${currentTheme.secondaryButtonHoverBg} hover:${currentTheme.secondaryButtonHoverBorder}`}
                        >
                          {active.secondary_cta_label}
                        </button>
                      )}
                    </motion.div>
                  </motion.div>
                </AnimatePresence>
              </div>
            </div>
          </div>
        </div>

        {/* ==================== Right Media Panel (All Screens) ==================== */}
        <div className="relative w-full md:w-[55%] lg:w-[60%] h-full">
          <AnimatePresence mode="sync">
            <motion.div
              key={active.id + "-media"}
              className="absolute inset-0"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 1.2, ease: "easeInOut" }}
            >
              <motion.div
                className="absolute inset-0"
                initial={{ scale: 1.08, opacity: 0.9, x: 0 }}
                animate={{ scale: 1, opacity: 1, x: "2%" }} // Subtle parallax effect
                transition={{ duration: AUTO_MS / 1000, ease: "linear", repeat: Infinity, repeatType: "reverse" }}
              >
                {active.video_url ? (
                  <video src={active.video_url} autoPlay muted loop playsInline preload="metadata" className="absolute inset-0 w-full h-full object-cover object-center" />
                ) : bgMedia ? (
                  <img src={bgMedia} alt={active.title} loading={index === 0 ? "eager" : "lazy"} fetchPriority={index === 0 ? "high" : "auto"} className="absolute inset-0 w-full h-full object-cover object-center" />
                ) : (
                  <div className="absolute inset-0 bg-gradient-to-br from-slate-800 to-slate-950" />
                )}
              </motion.div>
            </motion.div>
          </AnimatePresence>
          {/* Mobile-only gradient */}
          <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/30 to-transparent md:hidden" />
        </div>

        {/* ==================== Slider Navigation (All Screens) ==================== */}
        {slides.length > 1 && (
          <div className="absolute bottom-0 inset-x-0 z-30 h-24">
            <div className="h-full max-w-[1600px] mx-auto flex items-center justify-start px-6 sm:px-8 md:px-12 lg:px-16">
              <div className="flex items-center gap-6">
                <div className="flex items-center gap-2">
                  <button onClick={prev} aria-label="Previous slide" className="w-10 h-10 rounded-full flex items-center justify-center text-white/70 hover:text-white transition-colors duration-300 bg-black/30 border border-white/20 backdrop-blur-sm hover:bg-white/20">
                    <ChevronLeft className="w-4 h-4" />
                  </button>
                  <button onClick={next} aria-label="Next slide" className="w-10 h-10 rounded-full flex items-center justify-center text-white/70 hover:text-white transition-colors duration-300 bg-black/30 border border-white/20 backdrop-blur-sm hover:bg-white/20">
                    <ChevronRight className="w-4 h-4" />
                  </button>
                </div>
                <div className="hidden sm:flex items-center gap-2">
                  {slides.map((s, i) => (
                    <div key={s.id} className="flex items-center gap-2 text-white/70 text-sm font-mono">
                      <span className="w-5 text-right">{String(i + 1).padStart(2, '0')}</span>
                      <button onClick={() => setIndex(i)} className="relative h-1 w-16 bg-white/20 rounded-full overflow-hidden transition-all hover:bg-white/30">
                        <span className="absolute inset-0 h-full overflow-hidden rounded-full">
                          {i === index && (
                            <motion.span key={s.id + "-prog-" + index + "-" + String(paused)} className="absolute inset-y-0 left-0 bg-primary" initial={{ width: "0%" }} animate={{ width: "100%" }} transition={{ duration: AUTO_MS / 1000, ease: "linear" }} />
                          )}
                        </span>
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ==================== Mobile Floating Button ==================== */}
        <div className="md:hidden absolute bottom-24 inset-x-0 z-30 flex justify-center">
          <motion.button
            onClick={() => setIsSheetOpen(true)}
            className="inline-flex items-center justify-center gap-2 h-12 px-6 rounded-full bg-black/40 backdrop-blur-lg border border-white/20 text-white text-sm font-semibold shadow-lg"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 }}
          >
            Explore
            <ArrowUp className="w-4 h-4" />
          </motion.button>
        </div>
      </div>

      {/* ==================== Mobile Bottom Sheet ==================== */}
      <AnimatePresence>
        {isSheetOpen && (
          <>
            <motion.div
              onClick={() => setIsSheetOpen(false)}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-40 bg-black/50 backdrop-blur-sm md:hidden"
            />
            <motion.div
              drag="y"
              dragConstraints={{ top: 0, bottom: 0 }}
              onDragEnd={(_, info) => {
                if (info.offset.y > 100) setIsSheetOpen(false);
              }}
              initial={{ y: "100%" }}
              animate={{ y: "25%" }}
              exit={{ y: "100%" }}
              transition={{ type: "spring", damping: 25, stiffness: 200 }}
              className="fixed bottom-0 left-0 right-0 h-full z-50 bg-[#0D131D] rounded-t-3xl text-white p-6 pt-4 md:hidden"
            >
              <div className="absolute top-3 left-1/2 -translate-x-1/2 w-10 h-1.5 bg-white/20 rounded-full" />
              <button onClick={() => setIsSheetOpen(false)} className="absolute top-4 right-4 w-8 h-8 rounded-full bg-white/10 flex items-center justify-center">
                <X className="w-4 h-4" />
              </button>
              <div className="overflow-y-auto h-full pt-8">
                <h1 className="font-extrabold tracking-tight mb-4 text-3xl">{active.title}</h1>
                {active.description && <p className="mb-8 text-slate-300">{active.description}</p>}
                <div className="flex flex-col items-start gap-4">
                  {active.primary_cta_label && (
                    <button onClick={() => go(active.primary_cta_link)} className="w-full group relative inline-flex items-center justify-center gap-2 rounded-lg font-semibold text-sm text-white h-12 px-6 bg-primary">
                      <span>{active.primary_cta_label}</span>
                      <ArrowRight className="w-4 h-4 transition-transform duration-300 group-hover:translate-x-1" />
                    </button>
                  )}
                  {active.secondary_cta_label && (
                    <button onClick={() => go(active.secondary_cta_link)} className="w-full group relative inline-flex items-center justify-center gap-2 rounded-lg font-semibold text-sm text-white bg-white/10 border border-white/20 h-12 px-6">
                      {active.secondary_cta_label}
                    </button>
                  )}
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  );
};
