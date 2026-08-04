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

// Define the single, permanent "Defence Navy" theme object
const defenceNavyTheme = {
  background: "linear-gradient(180deg, #07111C 0%, #0B1625 100%)",
  headingColor: "#FFFFFF",
  descriptionColor: "#C7D0DA",
  primaryButtonBg: "bg-[#FF6A00]",
  primaryButtonTextColor: "text-white",
  secondaryButtonBg: "bg-transparent",
  secondaryButtonBorder: "border-[rgba(255,255,255,.20)]",
  secondaryButtonTextColor: "text-white",
  secondaryButtonHoverBg: "hover:bg-[rgba(255,255,255,.08)]",
  iconColor: "#FFFFFF",
  dividerColor: "rgba(255,255,255,.20)",
};

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
        <div
          className="hidden md:flex relative md:w-[40%] h-full flex-col justify-center"
          style={{ background: defenceNavyTheme.background }}
        >
          {/* Premium background details */}
          <div
            aria-hidden
            className="absolute inset-0 opacity-[0.03] mix-blend-overlay"
            style={{
              backgroundImage: "linear-gradient(rgba(255,255,255,0.05) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.05) 1px, transparent 1px)",
              backgroundSize: "32px 32px",
              maskImage: "radial-gradient(ellipse at 20% 50%, black 0%, transparent 60%)"
            }}
          />
          <div className="w-full max-w-[1600px] mx-auto">
            <div className="relative z-20 px-6 sm:px-8 md:px-12 lg:px-16">
              <div className="max-w-[520px]">
                <AnimatePresence mode="wait">
                  <motion.div
                    key={active.id + "-content"}
                    initial="hidden"
                    animate="visible"
                    exit="hidden"
                    variants={{
                      visible: { transition: { staggerChildren: 0.1 } },
                      hidden: { transition: { staggerChildren: 0.05, staggerDirection: -1 } },
                    }}
                  >
                    <motion.h1
                      className="font-extrabold tracking-tighter mb-8 [font-size:clamp(2.5rem,5vw,3.5rem)]" // Changed mb-6 to mb-8 (32px)
                      style={{ color: defenceNavyTheme.headingColor, lineHeight: "1.1" }}
                    >
                      {active.title.split(" ").map((word, i) => (
                        <motion.span
                          key={word + i}
                          className="inline-block mr-2"
                          variants={{
                            hidden: { opacity: 0, y: 20 },
                            visible: { opacity: 1, y: 0, transition: { duration: 0.5, ease: "easeOut" } },
                          }}
                        >
                          {word}
                        </motion.span>
                      ))}
                    </motion.h1>

                    {active.description && (
                      <motion.p
                        className="mb-10 text-base md:text-lg leading-relaxed max-w-[520px]" // mb-10 (40px) is correct
                        style={{ color: defenceNavyTheme.descriptionColor }}
                        variants={{
                          hidden: { opacity: 0, y: 20 },
                          visible: { opacity: 1, y: 0, transition: { duration: 0.5, ease: "easeOut", delay: 0.2 } },
                        }}
                      >
                        {active.description}
                      </motion.p>
                    )}

                    <motion.div
                      variants={{
                        hidden: { opacity: 0, y: 20 },
                        visible: { opacity: 1, y: 0, transition: { duration: 0.5, ease: "easeOut", delay: 0.3 } },
                      }}
                      className="flex flex-col sm:flex-row items-start gap-3 mb-16" // Added mb-16 (64px)
                    >
                      {active.primary_cta_label && (
                        <button
                          onClick={() => go(active.primary_cta_link)}
                          className={`group relative inline-flex items-center justify-center gap-2 rounded-[14px] font-semibold text-sm overflow-hidden transition-all duration-300 hover:-translate-y-0.5 h-11 px-6 shadow-lg shadow-primary/20 hover:shadow-primary/40 ${defenceNavyTheme.primaryButtonBg} ${defenceNavyTheme.primaryButtonTextColor}`}
                        >
                          <span>{active.primary_cta_label}</span>
                          <ArrowRight className="w-4 h-4 transition-transform duration-300 group-hover:translate-x-1" />
                          {/* Glow effect on hover */}
                          <span className="absolute inset-0 -z-10 rounded-[14px] bg-primary opacity-0 transition-opacity duration-300 group-hover:opacity-100 blur-md" />
                        </button>
                      )}
                      {active.secondary_cta_label && (
                        <button
                          onClick={() => go(active.secondary_cta_link)}
                          className={`group relative inline-flex items-center justify-center gap-2 rounded-[14px] font-semibold text-sm backdrop-blur-sm transition-all duration-300 hover:-translate-y-0.5 h-11 px-6 border ${defenceNavyTheme.secondaryButtonBg} ${defenceNavyTheme.secondaryButtonBorder} ${defenceNavyTheme.secondaryButtonTextColor} ${defenceNavyTheme.secondaryButtonHoverBg}`}
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
        <div className="relative w-full md:w-[60%] h-full" style={{ clipPath: "polygon(10% 0, 100% 0, 100% 100%, 0% 100%)" }}>
          <AnimatePresence mode="sync">
            <motion.div
              key={active.id + "-media"}
              className="absolute inset-0"
              initial={{ opacity: 0, scale: 1.1 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 1.2, ease: "easeInOut" }}
            >
              <motion.div
                className="absolute inset-0"
                initial={{ scale: 1.08, opacity: 0.9, x: 0 }}
                animate={{ scale: 1, opacity: 1, x: "2%" }} // Subtle parallax effect
                transition={{ duration: (AUTO_MS / 1000) + 4, ease: "linear", repeat: Infinity, repeatType: "reverse" }}
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
          {/* Subtle gradient overlay for smoother transition */}
          <div className="absolute inset-0 bg-gradient-to-r from-black/40 via-black/10 to-transparent" />
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
                    <div key={s.id} className="flex items-center gap-2 text-white/70 text-sm font-mono" style={{ color: defenceNavyTheme.descriptionColor }}>
                      <span className="w-5 text-right">{String(i + 1).padStart(2, '0')}</span>
                      <button onClick={() => setIndex(i)} className="relative h-1 w-16 rounded-full overflow-hidden transition-all hover:bg-white/30">
                        <span className="absolute inset-0 h-full overflow-hidden rounded-full" style={{ backgroundColor: defenceNavyTheme.dividerColor }}>
                          {i === index && (
                            <motion.span key={s.id + "-prog-" + index + "-" + String(paused)} className="absolute inset-y-0 left-0" style={{ backgroundColor: defenceNavyTheme.primaryButtonBg.replace('bg-','' )}} initial={{ width: "0%" }} animate={{ width: "100%" }} transition={{ duration: AUTO_MS / 1000, ease: "linear" }} />
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
            initial={{ opacity: 0, y: 20 }}
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
              className="fixed bottom-0 left-0 right-0 h-full z-50 rounded-t-3xl p-6 pt-4 md:hidden"
              style={{ background: defenceNavyTheme.background, color: defenceNavyTheme.headingColor }}
            >
              <div className="absolute top-3 left-1/2 -translate-x-1/2 w-10 h-1.5 rounded-full" style={{ backgroundColor: defenceNavyTheme.dividerColor }} />
              <button onClick={() => setIsSheetOpen(false)} className="absolute top-4 right-4 w-8 h-8 rounded-full flex items-center justify-center bg-white/10">
                <X className="w-4 h-4" />
              </button>
              <div className="overflow-y-auto h-full pt-8">
                <h1 className="font-extrabold tracking-tight mb-4 text-3xl" style={{ color: defenceNavyTheme.headingColor }}>{active.title}</h1>
                {active.description && <p className="mb-8" style={{ color: defenceNavyTheme.descriptionColor }}>{active.description}</p>}
                <div className="flex flex-col items-start gap-4">
                  {active.primary_cta_label && (
                    <button onClick={() => go(active.primary_cta_link)} className={`w-full group relative inline-flex items-center justify-center gap-2 rounded-[14px] font-semibold text-sm h-12 px-6 ${defenceNavyTheme.primaryButtonBg} ${defenceNavyTheme.primaryButtonTextColor}`}>
                      <span>{active.primary_cta_label}</span>
                      <ArrowRight className="w-4 h-4 transition-transform duration-300 group-hover:translate-x-1" />
                    </button>
                  )}
                  {active.secondary_cta_label && (
                    <button onClick={() => go(active.secondary_cta_link)} className={`w-full group relative inline-flex items-center justify-center gap-2 rounded-[14px] font-semibold text-sm h-12 px-6 border ${defenceNavyTheme.secondaryButtonBorder} ${defenceNavyTheme.secondaryButtonTextColor} ${defenceNavyTheme.secondaryButtonHoverBg}`}>
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
