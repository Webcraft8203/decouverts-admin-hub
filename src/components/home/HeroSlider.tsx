import { useEffect, useRef, useState } from "react";
import { motion, AnimatePresence, useMotionValue, useSpring, useTransform } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { ArrowRight, ArrowUpRight, ChevronLeft, ChevronRight } from "lucide-react";

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

export const HeroSlider = ({ slides }: Props) => {
  const [index, setIndex] = useState(0);
  const [paused, setPaused] = useState(false);
  const navigate = useNavigate();

  // Mouse parallax
  const mx = useMotionValue(0);
  const my = useMotionValue(0);
  const sx = useSpring(mx, { stiffness: 60, damping: 15 });
  const sy = useSpring(my, { stiffness: 60, damping: 15 });
  const tx = useTransform(sx, (v) => v * 18);
  const ty = useTransform(sy, (v) => v * 18);
  const rotY = useTransform(sx, (v) => v * 6);
  const rotX = useTransform(sy, (v) => -v * 4);

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
  const glow = active.glow_color || "#f97316";

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

  return (
    <div
      className="relative w-full"
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => { setPaused(false); resetMove(); }}
      onMouseMove={handleMove}
    >
      {/* Radar rings + glow */}
      <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
        <div
          className="absolute w-[90%] aspect-square rounded-full blur-3xl opacity-40 transition-colors duration-700"
          style={{ background: `radial-gradient(circle, ${glow}55, transparent 65%)` }}
        />
        <svg viewBox="0 0 400 400" className="absolute w-[80%] max-w-[560px] aspect-square opacity-60">
          {[100, 150, 200].map((r, i) => (
            <motion.circle
              key={r} cx="200" cy="200" r={r} fill="none"
              stroke={glow} strokeOpacity="0.15" strokeWidth="1" strokeDasharray="3 8"
              animate={{ rotate: 360 }} style={{ transformOrigin: "200px 200px" }}
              transition={{ duration: 40 + i * 10, repeat: Infinity, ease: "linear" }}
            />
          ))}
          <motion.g style={{ transformOrigin: "200px 200px" }} animate={{ rotate: 360 }} transition={{ duration: 9, repeat: Infinity, ease: "linear" }}>
            <defs>
              <linearGradient id="hs-sweep" x1="200" y1="200" x2="400" y2="200" gradientUnits="userSpaceOnUse">
                <stop offset="0%" stopColor={glow} stopOpacity="0.28" />
                <stop offset="100%" stopColor={glow} stopOpacity="0" />
              </linearGradient>
            </defs>
            <path d="M200 200 L400 175 A200 200 0 0 1 400 225 Z" fill="url(#hs-sweep)" />
          </motion.g>
        </svg>
      </div>

      {/* Slide stack */}
      <div className="relative h-[420px] sm:h-[480px] md:h-[540px] lg:h-[600px] flex items-center justify-center">
        <AnimatePresence mode="wait">
          <motion.div
            key={active.id}
            className="absolute inset-0 flex items-center justify-center"
            initial={{ opacity: 0, scale: 0.92, filter: "blur(8px)" }}
            animate={{ opacity: 1, scale: 1, filter: "blur(0px)" }}
            exit={{ opacity: 0, scale: 0.96, filter: "blur(6px)" }}
            transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
            drag="x"
            dragConstraints={{ left: 0, right: 0 }}
            dragElastic={0.2}
            onDragEnd={(_, info) => {
              if (info.offset.x < -60) setIndex((i) => (i + 1) % slides.length);
              if (info.offset.x > 60) setIndex((i) => (i - 1 + slides.length) % slides.length);
            }}
          >
            <motion.div
              className="relative w-full max-w-[520px] aspect-square"
              style={{ x: tx, y: ty, rotateY: rotY, rotateX: rotX, transformPerspective: 1200 }}
              animate={{ y: [0, -14, 0] }}
              transition={{ y: { duration: 6, repeat: Infinity, ease: "easeInOut" } }}
            >
              {active.image_url ? (
                <img
                  src={active.image_url}
                  alt={active.title}
                  loading={index === 0 ? "eager" : "lazy"}
                  className="w-full h-full object-contain drop-shadow-[0_40px_50px_rgba(15,23,42,0.25)]"
                />
              ) : (
                <div className="w-full h-full rounded-3xl bg-gradient-to-br from-slate-100 to-slate-200 flex items-center justify-center text-slate-400 text-sm">
                  No image
                </div>
              )}
              {/* Soft floor shadow */}
              <div className="absolute left-1/2 -translate-x-1/2 bottom-[6%] w-[55%] h-4 rounded-[50%] bg-slate-900/30 blur-2xl" />
            </motion.div>
          </motion.div>
        </AnimatePresence>

        {/* Peek prev/next */}
        {slides.length > 1 && (
          <>
            <motion.button
              onClick={() => setIndex((i) => (i - 1 + slides.length) % slides.length)}
              className="absolute left-2 md:left-4 top-1/2 -translate-y-1/2 z-10 w-11 h-11 rounded-full bg-white/70 backdrop-blur border border-slate-200 text-slate-700 hover:border-primary/40 hover:text-primary hover:bg-white transition-all flex items-center justify-center shadow-sm"
              whileTap={{ scale: 0.94 }}
              aria-label="Previous slide"
            >
              <ChevronLeft className="w-5 h-5" />
            </motion.button>
            <motion.button
              onClick={() => setIndex((i) => (i + 1) % slides.length)}
              className="absolute right-2 md:right-4 top-1/2 -translate-y-1/2 z-10 w-11 h-11 rounded-full bg-white/70 backdrop-blur border border-slate-200 text-slate-700 hover:border-primary/40 hover:text-primary hover:bg-white transition-all flex items-center justify-center shadow-sm"
              whileTap={{ scale: 0.94 }}
              aria-label="Next slide"
            >
              <ChevronRight className="w-5 h-5" />
            </motion.button>
          </>
        )}
      </div>

      {/* Slide info + CTAs */}
      <AnimatePresence mode="wait">
        <motion.div
          key={active.id + "-info"}
          className="mt-4 px-2 md:px-4 flex flex-col items-center text-center"
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -8 }}
          transition={{ duration: 0.5, ease: "easeOut" }}
        >
          {active.badge_label && (
            <span className="inline-flex items-center gap-2 py-1 px-3 rounded-full bg-primary/8 text-primary text-[10px] font-bold tracking-[0.22em] uppercase mb-3 border border-primary/20">
              <span className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse" />
              {active.badge_label}
            </span>
          )}
          <h3 className="text-2xl md:text-3xl font-bold text-slate-900 leading-tight">{active.title}</h3>
          {active.subtitle && <p className="mt-1 text-sm md:text-base text-primary font-semibold">{active.subtitle}</p>}
          {active.description && (
            <p className="mt-2 text-sm text-slate-600 max-w-md line-clamp-2">{active.description}</p>
          )}
          <div className="mt-4 flex flex-wrap items-center justify-center gap-3">
            {active.primary_cta_label && active.primary_cta_link && (
              <button
                onClick={() => go(active.primary_cta_link)}
                className="group inline-flex items-center gap-2 h-10 px-5 rounded-full bg-primary text-primary-foreground text-xs font-bold tracking-wide uppercase shadow-[0_10px_25px_-8px_hsl(var(--primary)/0.55)] hover:shadow-[0_14px_35px_-8px_hsl(var(--primary)/0.7)] transition-shadow"
              >
                {active.primary_cta_label}
                <ArrowRight className="w-3.5 h-3.5 transition-transform group-hover:translate-x-0.5" />
              </button>
            )}
            {active.secondary_cta_label && active.secondary_cta_link && (
              <button
                onClick={() => go(active.secondary_cta_link)}
                className="group inline-flex items-center gap-2 h-10 px-5 rounded-full bg-white/70 backdrop-blur border border-slate-200 text-slate-800 text-xs font-bold tracking-wide uppercase hover:border-primary/40 hover:text-primary transition-colors"
              >
                {active.secondary_cta_label}
                <ArrowUpRight className="w-3.5 h-3.5 transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
              </button>
            )}
          </div>

          {/* Counter */}
          <div className="mt-5 flex items-center gap-3 text-[11px] tracking-[0.3em] uppercase text-slate-500">
            <span className="text-slate-900 font-bold tabular-nums">{String(index + 1).padStart(2, "0")}</span>
            <span className="w-16 h-px bg-slate-300 relative overflow-hidden">
              <motion.span
                key={active.id + "-bar"}
                className="absolute inset-y-0 left-0 bg-primary"
                initial={{ width: 0 }}
                animate={{ width: paused ? 0 : "100%" }}
                transition={{ duration: paused ? 0 : AUTO_MS / 1000, ease: "linear" }}
              />
            </span>
            <span className="tabular-nums">{String(slides.length).padStart(2, "0")}</span>
          </div>
        </motion.div>
      </AnimatePresence>

      {/* Side thumbnails */}
      {slides.length > 1 && (
        <div className="hidden lg:flex absolute -right-4 xl:-right-2 top-1/2 -translate-y-1/2 flex-col gap-2 z-20">
          {slides.map((s, i) => (
            <button
              key={s.id}
              onClick={() => setIndex(i)}
              className={`group relative w-16 h-16 rounded-xl overflow-hidden border transition-all ${
                i === index
                  ? "border-primary scale-110 shadow-[0_8px_20px_-6px_hsl(var(--primary)/0.5)]"
                  : "border-slate-200 opacity-70 hover:opacity-100 hover:border-slate-300"
              }`}
              aria-label={`Go to ${s.title}`}
            >
              {s.image_url ? (
                <img src={s.image_url} alt={s.title} className="w-full h-full object-cover bg-slate-50" loading="lazy" />
              ) : (
                <div className="w-full h-full bg-slate-100" />
              )}
              <span className="absolute inset-x-0 bottom-0 py-0.5 text-[8px] font-bold text-white bg-black/50 backdrop-blur-sm truncate px-1">
                {s.title}
              </span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
};
