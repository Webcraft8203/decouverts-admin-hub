import { useEffect, useState } from "react";
import { motion, AnimatePresence, useMotionValue, useSpring, useTransform } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { ArrowRight, ChevronLeft, ChevronRight, Radio, Satellite, Camera, BatteryFull, MapPin } from "lucide-react";

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
    {/* Blueprint grid */}
    <div className="absolute inset-0 opacity-[0.35] bg-[linear-gradient(to_right,rgba(255,255,255,0.08)_1px,transparent_1px),linear-gradient(to_bottom,rgba(255,255,255,0.08)_1px,transparent_1px)] bg-[size:48px_48px] [mask-image:radial-gradient(ellipse_at_center,black_55%,transparent_100%)]" />
    {/* Radar */}
    <svg viewBox="0 0 400 400" className="absolute -right-20 -bottom-20 w-[420px] h-[420px] opacity-70">
      <defs>
        <radialGradient id="rg-fade" cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor={glow} stopOpacity="0.25" />
          <stop offset="100%" stopColor={glow} stopOpacity="0" />
        </radialGradient>
        <linearGradient id="rg-sweep" x1="200" y1="200" x2="400" y2="200" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor={glow} stopOpacity="0.4" />
          <stop offset="100%" stopColor={glow} stopOpacity="0" />
        </linearGradient>
      </defs>
      <circle cx="200" cy="200" r="180" fill="url(#rg-fade)" />
      {[80, 130, 180].map((r, i) => (
        <motion.circle
          key={r} cx="200" cy="200" r={r} fill="none"
          stroke={glow} strokeOpacity="0.28" strokeWidth="0.7" strokeDasharray="2 6"
          animate={{ rotate: 360 }} style={{ transformOrigin: "200px 200px" }}
          transition={{ duration: 30 + i * 8, repeat: Infinity, ease: "linear" }}
        />
      ))}
      <motion.g style={{ transformOrigin: "200px 200px" }} animate={{ rotate: 360 }} transition={{ duration: 7, repeat: Infinity, ease: "linear" }}>
        <path d="M200 200 L400 175 A200 200 0 0 1 400 225 Z" fill="url(#rg-sweep)" />
      </motion.g>
      <line x1="200" y1="20" x2="200" y2="380" stroke={glow} strokeOpacity="0.15" strokeWidth="0.5" />
      <line x1="20" y1="200" x2="380" y2="200" stroke={glow} strokeOpacity="0.15" strokeWidth="0.5" />
    </svg>

    {/* Corner brackets */}
    {["top-4 left-4", "top-4 right-4", "bottom-4 left-4", "bottom-4 right-4"].map((pos, i) => (
      <div key={i} className={`absolute ${pos} w-8 h-8`}>
        <div className="absolute inset-0 border-t border-l border-white/40" style={{
          borderTopWidth: pos.includes("top") ? 1 : 0,
          borderLeftWidth: pos.includes("left") ? 1 : 0,
          borderBottomWidth: pos.includes("bottom") ? 1 : 0,
          borderRightWidth: pos.includes("right") ? 1 : 0,
          borderColor: "rgba(255,255,255,0.5)",
        }} />
      </div>
    ))}

    {/* Scanning line */}
    <motion.div
      className="absolute inset-x-0 h-px"
      style={{ background: `linear-gradient(90deg, transparent, ${glow}, transparent)` }}
      animate={{ y: ["-10%", "110%"] }}
      transition={{ duration: 5, repeat: Infinity, ease: "easeInOut" }}
    />

    {/* Floating particles */}
    {Array.from({ length: 10 }).map((_, i) => (
      <motion.span
        key={i}
        className="absolute w-1 h-1 rounded-full"
        style={{ background: glow, left: `${(i * 79) % 100}%`, top: `${(i * 37) % 100}%` }}
        animate={{ y: [0, -20, 0], opacity: [0.15, 0.7, 0.15] }}
        transition={{ duration: 4 + (i % 3), repeat: Infinity, ease: "easeInOut", delay: i * 0.4 }}
      />
    ))}
  </div>
);

/* ---------- Live HUD card ---------- */
const LiveHud = ({ title }: { title: string }) => (
  <motion.div
    key={title + "-hud"}
    initial={{ opacity: 0, y: 20 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ duration: 0.6, delay: 0.3 }}
    className="absolute bottom-5 right-5 z-20 hidden sm:block w-[240px] rounded-2xl border border-white/15 bg-white/10 backdrop-blur-xl p-4 shadow-[0_20px_50px_-15px_rgba(0,0,0,0.6)]"
  >
    <div className="flex items-center justify-between mb-3">
      <span className="inline-flex items-center gap-1.5 text-[10px] font-bold tracking-[0.2em] uppercase text-white">
        <span className="relative flex h-2 w-2">
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-500 opacity-75" />
          <span className="relative inline-flex rounded-full h-2 w-2 bg-red-500" />
        </span>
        Live
      </span>
      <span className="text-[9px] tracking-widest uppercase text-white/60">Telemetry</span>
    </div>
    <p className="text-white font-bold text-sm mb-3 truncate">{title}</p>
    <div className="space-y-2 text-[11px] text-white/90">
      {[
        { icon: Satellite, label: "GPS Locked", val: "8 SATS" },
        { icon: Camera, label: "Camera", val: "ONLINE" },
        { icon: BatteryFull, label: "Battery", val: "96%" },
        { icon: MapPin, label: "Altitude", val: "320m" },
      ].map((r, i) => (
        <div key={i} className="flex items-center justify-between">
          <span className="inline-flex items-center gap-1.5 text-white/70">
            <r.icon className="w-3 h-3" />
            {r.label}
          </span>
          <span className="tabular-nums font-semibold flex items-center gap-1.5">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
            {r.val}
          </span>
        </div>
      ))}
    </div>
  </motion.div>
);

export const HeroSlider = ({ slides }: Props) => {
  const [index, setIndex] = useState(0);
  const [paused, setPaused] = useState(false);
  const navigate = useNavigate();

  const mx = useMotionValue(0);
  const my = useMotionValue(0);
  const sx = useSpring(mx, { stiffness: 60, damping: 15 });
  const sy = useSpring(my, { stiffness: 60, damping: 15 });
  const px = useTransform(sx, (v) => v * -14);
  const py = useTransform(sy, (v) => v * -14);

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

  return (
    <div
      className="relative w-full h-[520px] sm:h-[580px] md:h-[640px] lg:h-[680px] rounded-[28px] overflow-hidden bg-slate-950 border border-slate-200/50 shadow-[0_40px_80px_-30px_rgba(15,23,42,0.35)]"
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => { setPaused(false); resetMove(); }}
      onMouseMove={handleMove}
    >
      {/* Media layer with ken-burns + parallax */}
      <AnimatePresence mode="sync">
        <motion.div
          key={active.id + "-media"}
          className="absolute inset-0"
          initial={{ opacity: 0, scale: 1.08, filter: "blur(12px)" }}
          animate={{ opacity: 1, scale: 1, filter: "blur(0px)" }}
          exit={{ opacity: 0, scale: 1.04, filter: "blur(8px)" }}
          transition={{ duration: 1.1, ease: [0.22, 1, 0.36, 1] }}
          drag="x"
          dragConstraints={{ left: 0, right: 0 }}
          dragElastic={0.15}
          onDragEnd={(_, info) => {
            if (info.offset.x < -60) setIndex((i) => (i + 1) % slides.length);
            if (info.offset.x > 60) setIndex((i) => (i - 1 + slides.length) % slides.length);
          }}
        >
          <motion.div
            className="absolute inset-0"
            style={{ x: px, y: py }}
            animate={{ scale: [1.05, 1.15] }}
            transition={{ duration: AUTO_MS / 1000 + 2, ease: "linear" }}
          >
            {active.video_url ? (
              <video
                src={active.video_url}
                autoPlay muted loop playsInline
                className="absolute inset-0 w-full h-full object-cover"
              />
            ) : bgMedia ? (
              <img
                src={bgMedia}
                alt={active.title}
                loading={index === 0 ? "eager" : "lazy"}
                className="absolute inset-0 w-full h-full object-cover"
              />
            ) : (
              <div className="absolute inset-0 bg-gradient-to-br from-slate-800 to-slate-950" />
            )}
          </motion.div>
        </motion.div>
      </AnimatePresence>

      {/* Dark gradient wash for legibility */}
      <div className="absolute inset-0 bg-gradient-to-t from-slate-950/85 via-slate-950/30 to-slate-950/40" />
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_20%,rgba(0,0,0,0.5),transparent_60%)]" />

      {/* HUD backdrop */}
      <HudBackdrop glow={glow} />

      {/* Top strip */}
      <div className="absolute top-4 left-4 right-4 flex items-center justify-between z-20">
        <span className="inline-flex items-center gap-2 py-1 px-2.5 rounded-full bg-black/40 backdrop-blur border border-white/15 text-white/90 text-[10px] font-bold tracking-[0.22em] uppercase">
          <Radio className="w-3 h-3 text-emerald-400 animate-pulse" />
          Fleet Live · {String(index + 1).padStart(2, "0")}/{String(slides.length).padStart(2, "0")}
        </span>
        {active.badge_label && (
          <span
            className="hidden sm:inline-flex items-center gap-2 py-1 px-2.5 rounded-full backdrop-blur border text-[10px] font-bold tracking-[0.22em] uppercase"
            style={{ background: `${glow}22`, borderColor: `${glow}55`, color: "#fff" }}
          >
            <span className="w-1.5 h-1.5 rounded-full" style={{ background: glow }} />
            {active.badge_label}
          </span>
        )}
      </div>

      {/* Vertical numbered navigation */}
      {slides.length > 1 && (
        <div className="hidden md:flex absolute left-4 top-1/2 -translate-y-1/2 flex-col gap-1 z-20">
          {slides.map((s, i) => {
            const isActive = i === index;
            return (
              <button
                key={s.id}
                onClick={() => setIndex(i)}
                className="group relative flex items-center gap-3 py-2.5 pl-3 pr-4 rounded-r-lg text-left transition-colors"
              >
                <span className="relative w-[3px] h-8 rounded-full bg-white/15 overflow-hidden">
                  {isActive && (
                    <motion.span
                      key={s.id + "-bar"}
                      className="absolute inset-x-0 top-0"
                      style={{ background: glow }}
                      initial={{ height: 0 }}
                      animate={{ height: paused ? "100%" : "100%" }}
                      transition={{ duration: paused ? 0.3 : AUTO_MS / 1000, ease: paused ? "easeOut" : "linear" }}
                    />
                  )}
                </span>
                <div className="flex flex-col leading-tight">
                  <span className={`text-[10px] tabular-nums tracking-widest transition-colors ${isActive ? "text-white" : "text-white/40 group-hover:text-white/70"}`}>
                    {String(i + 1).padStart(2, "0")}
                  </span>
                  <span className={`text-xs font-bold uppercase tracking-wider transition-colors ${isActive ? "text-white" : "text-white/50 group-hover:text-white/80"}`}>
                    {s.title.length > 16 ? s.title.slice(0, 16) + "…" : s.title}
                  </span>
                </div>
              </button>
            );
          })}
        </div>
      )}

      {/* Prev/Next arrows */}
      {slides.length > 1 && (
        <>
          <button
            onClick={() => setIndex((i) => (i - 1 + slides.length) % slides.length)}
            className="md:hidden absolute left-3 top-1/2 -translate-y-1/2 z-20 w-10 h-10 rounded-full bg-white/10 backdrop-blur border border-white/20 text-white flex items-center justify-center"
            aria-label="Previous"
          >
            <ChevronLeft className="w-5 h-5" />
          </button>
          <button
            onClick={() => setIndex((i) => (i + 1) % slides.length)}
            className="absolute right-3 top-1/2 -translate-y-1/2 z-20 w-10 h-10 rounded-full bg-white/10 backdrop-blur border border-white/20 text-white hover:border-white/50 transition-colors flex items-center justify-center md:right-4"
            aria-label="Next"
          >
            <ChevronRight className="w-5 h-5" />
          </button>
        </>
      )}

      {/* Slide info bottom-left */}
      <div className="absolute left-4 md:left-32 right-4 bottom-4 md:bottom-5 z-20 max-w-lg">
        <AnimatePresence mode="wait">
          <motion.div
            key={active.id + "-info"}
            initial={{ opacity: 0, y: 20, filter: "blur(4px)" }}
            animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
            exit={{ opacity: 0, y: -10, filter: "blur(2px)" }}
            transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
          >
            <h3 className="text-white text-2xl md:text-4xl font-bold leading-tight drop-shadow" style={{ fontFamily: "'Montserrat', sans-serif" }}>
              {active.title}
            </h3>
            {active.subtitle && (
              <p className="mt-1 text-sm md:text-base font-semibold" style={{ color: glow }}>
                {active.subtitle}
              </p>
            )}
            {active.description && (
              <p className="mt-2 text-xs md:text-sm text-white/80 line-clamp-2 max-w-md">
                {active.description}
              </p>
            )}
            {active.primary_cta_label && active.primary_cta_link && (
              <button
                onClick={() => go(active.primary_cta_link)}
                className="group mt-4 inline-flex items-center gap-2 h-10 px-5 rounded-full text-xs font-bold tracking-wide uppercase text-white shadow-[0_10px_25px_-8px_rgba(255,107,0,0.6)] transition-transform hover:-translate-y-0.5"
                style={{ background: glow }}
              >
                {active.primary_cta_label}
                <ArrowRight className="w-3.5 h-3.5 transition-transform group-hover:translate-x-0.5" />
              </button>
            )}
          </motion.div>
        </AnimatePresence>
      </div>

      {/* Live HUD card bottom-right */}
      <AnimatePresence mode="wait">
        <LiveHud key={active.id + "-livecard"} title={active.title} />
      </AnimatePresence>
    </div>
  );
};
