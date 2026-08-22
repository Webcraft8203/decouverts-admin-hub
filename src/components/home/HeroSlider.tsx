import { useEffect, useRef, useState, MouseEvent, useMemo } from "react";
import { motion, AnimatePresence, useMotionValue, useTransform } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { ArrowRight, ChevronLeft, ChevronRight, X, ArrowUp, ChevronsDown } from "lucide-react";

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
  const [isDescriptionExpanded, setIsDescriptionExpanded] = useState(false);
  const navigate = useNavigate();

  // Parallax effect on mouse move
  const x = useMotionValue(0);
  const y = useMotionValue(0);
  const contentX = useTransform(x, [-400, 400], [12, -12]);
  const contentY = useTransform(y, [-300, 300], [8, -8]);

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

  const handleMouseMove = (e: MouseEvent) => {
    const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();
    x.set(e.clientX - rect.left - rect.width / 2);
    y.set(e.clientY - rect.top - rect.height / 2);
  };

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
          className="hidden md:flex relative md:w-[40%] h-full flex-col justify-center overflow-hidden"
          style={{ background: defenceNavyTheme.background }}
          onMouseMove={handleMouseMove}
          onMouseLeave={() => { x.set(0); y.set(0); }}
        >
          {/* --- Premium Background Details --- */}
          <div
            aria-hidden
            className="absolute inset-0 opacity-[0.02] mix-blend-soft-light"
            style={{
              backgroundImage: "linear-gradient(rgba(255,255,255,0.05) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.05) 1px, transparent 1px)",
              backgroundSize: "32px 32px",
              maskImage: "radial-gradient(ellipse at 30% 40%, black 0%, transparent 70%)"
            }}
          />
          {/* Soft radial lighting */}
          <motion.div
            aria-hidden
            className="absolute top-1/2 left-0 -translate-y-1/2 w-[800px] h-[800px] pointer-events-none"
            style={{ background: "radial-gradient(ellipse at center, hsl(var(--primary) / 0.1), transparent 60%)" }}
          />

          <motion.div style={{ x: contentX, y: contentY }} className="w-full max-w-[1600px] mx-auto">
            <div className="relative z-10 px-6 sm:px-8 md:px-12 lg:px-16">
              <div className="max-w-[520px]">
                <AnimatePresence mode="wait" initial={false}>
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
                    <div className="relative">
                      <motion.h1
                        className="font-extrabold tracking-tighter mb-8 [font-size:clamp(2.5rem,5vw,3.5rem)]"
                        style={{ color: defenceNavyTheme.headingColor, lineHeight: "1.1" }}
                      >
                        {active.title.split("\n").map((line, lineIndex) => (
                          <span key={lineIndex} className="block overflow-hidden">
                            <motion.span
                              className="inline-block"
                              variants={{
                                hidden: { opacity: 0, y: "100%" },
                                visible: { opacity: 1, y: 0, transition: { duration: 0.6, ease: [0.22, 1, 0.36, 1] } },
                              }}
                            >
                              {line}
                            </motion.span>
                          </span>
                        ))}
                      </motion.h1>
                    </div>

                    {active.description && !isDescriptionExpanded && (
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
                      className="flex flex-col sm:flex-row items-start gap-3 mb-12"
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

                    {/* --- Slider Navigation --- */}
                    {slides.length > 1 && (
                      <motion.div
                        className="flex items-center gap-6"
                        variants={{
                          hidden: { opacity: 0, y: 20 },
                          visible: { opacity: 1, y: 0, transition: { duration: 0.5, ease: "easeOut", delay: 0.4 } },
                        }}
                      >
                        <div className="flex items-center gap-2">
                          <button onClick={prev} aria-label="Previous slide" className="w-10 h-10 rounded-full flex items-center justify-center text-white/70 hover:text-white transition-colors duration-300 bg-black/30 border border-white/20 backdrop-blur-sm hover:bg-white/20">
                            <ChevronLeft className="w-4 h-4" />
                          </button>
                          <button onClick={next} aria-label="Next slide" className="w-10 h-10 rounded-full flex items-center justify-center text-white/70 hover:text-white transition-colors duration-300 bg-black/30 border border-white/20 backdrop-blur-sm hover:bg-white/20">
                            <ChevronRight className="w-4 h-4" />
                          </button>
                        </div>
                        <div className="hidden sm:flex items-center gap-3">
                          {slides.map((s, i) => (
                            <div key={s.id} className="flex items-center gap-2 text-white/70 text-sm font-mono" style={{ color: defenceNavyTheme.descriptionColor }}>
                              <span className="w-5 text-right">{String(i + 1).padStart(2, '0')}</span>
                              <button onClick={() => setIndex(i)} className="relative h-1 w-20 bg-white/10 rounded-full overflow-hidden transition-all hover:bg-white/20">
                                <span className="absolute inset-0 h-full overflow-hidden rounded-full">
                                  {i === index && (
                                    <motion.span key={s.id + "-prog-" + index + "-" + String(paused)} className="absolute inset-y-0 left-0 bg-primary" initial={{ width: "0%" }} animate={{ width: "100%" }} transition={{ duration: AUTO_MS / 1000, ease: "linear" }} />
                                  )}
                                  {i < index && <span className="absolute inset-0 bg-primary/50" />}
                                </span>
                              </button>
                            </div>
                          ))}
                        </div>
                      </motion.div>
                    )}
                  </motion.div>
                </AnimatePresence>
              </div>
            </div>
          </motion.div>
        </div>

        {/* ==================== Right Media Panel (All Screens) ==================== */}
        <div className="relative w-full md:w-[60%] h-full" style={{ clipPath: "polygon(12% 0, 100% 0, 100% 100%, 0% 100%)" }}>
          <AnimatePresence mode="sync">
            <motion.div
              key={active.id + "-media"}
              className="absolute inset-0"
              initial={{ opacity: 0, scale: 1.15 }}
              animate={{ opacity: 1, scale: 1.05 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 1.2, ease: "easeInOut" }}
            >
              <motion.div
                className="absolute inset-0"
                initial={{ scale: 1.08, opacity: 0.9, x: 0 }}
                animate={{ scale: 1, opacity: 1, x: "2%" }} // Subtle parallax effect
                transition={{ duration: (AUTO_MS / 1000) + 8, ease: "linear", repeat: Infinity, repeatType: "reverse" }}
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
          {/* --- Overlays --- */}
          <div className="absolute inset-0 bg-gradient-to-r from-black/40 via-black/10 to-transparent" />
          <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/30 to-transparent md:hidden" />
        </div>

        {/* ==================== Mobile Content Overlay ==================== */}
        <div className="md:hidden absolute inset-0 z-10 flex flex-col justify-end text-white">
          <AnimatePresence mode="wait">
            <motion.div
              key={active.id}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.6, ease: "easeInOut" }}
              className="relative w-full p-6 pb-8 flex flex-col justify-end"
              style={{ minHeight: '60vh' }}
            >
              {/* Bottom Gradient */}
              <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/60 to-transparent pointer-events-none" />

              <div className="relative z-10 space-y-5">
                <h1 className="font-extrabold text-4xl tracking-tight leading-tight">
                  {active.title}
                </h1>

                <MobileDescription
                  description={active.description}
                  isExpanded={isDescriptionExpanded}
                  onToggle={() => setIsDescriptionExpanded(v => !v)}
                />

                <div className="pt-2 space-y-3">
                  {active.primary_cta_label && (
                    <button
                      onClick={() => go(active.primary_cta_link)}
                      className="w-full group relative inline-flex items-center justify-center gap-2 rounded-xl font-semibold text-base h-14 px-6 bg-primary text-white"
                    >
                      {active.primary_cta_label}
                    </button>
                  )}
                  {active.secondary_cta_label && (
                    <button
                      onClick={() => go(active.secondary_cta_link)}
                      className="w-full group relative inline-flex items-center justify-center gap-2 rounded-xl font-semibold text-base h-14 px-6 bg-white/10 border border-white/20 backdrop-blur-sm"
                    >
                      {active.secondary_cta_label}
                    </button>
                  )}
                </div>
              </div>

              {/* Swipe Indicator & Progress Dots */}
              <div className="relative z-10 flex flex-col items-center gap-4 mt-8">
                <ChevronsDown className="w-5 h-5 text-white/50 animate-bounce" />
                <div className="flex items-center justify-center gap-2">
                  {slides.map((_, i) => (
                    <button
                      key={i}
                      onClick={() => setIndex(i)}
                      className={`h-1.5 rounded-full transition-all duration-300 ${
                        i === index ? "w-6 bg-primary" : "w-1.5 bg-white/30"
                      }`}
                      aria-label={`Go to slide ${i + 1}`}
                    />
                  ))}
                </div>
              </div>
            </motion.div>
          </AnimatePresence>
        </div>
      </div>
    </>
  );
};

const MobileDescription = ({ description, isExpanded, onToggle }: { description: string | null, isExpanded: boolean, onToggle: () => void }) => {
  const needsTruncation = useMemo(() => (description?.length ?? 0) > 120, [description]);

  if (!description) return null;

  return (
    <div>
      <p className={`text-white/80 leading-relaxed transition-all duration-300 ${!isExpanded && needsTruncation ? 'line-clamp-3' : 'line-clamp-none'}`}>
        {description}
      </p>
      {needsTruncation && (
        <button onClick={onToggle} className="text-primary font-semibold text-sm mt-2">
          {isExpanded ? "Read Less" : "Read More"}
        </button>
      )}
    </div>
  );
};
