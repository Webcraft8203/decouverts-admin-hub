import { useEffect, useRef, useState, ReactNode } from "react";

interface CinematicSectionProps {
  children: ReactNode;
  /** Reveal style: rise (default), scale, blur, pan */
  variant?: "rise" | "scale" | "blur" | "pan";
  /** Delay in ms before reveal transition starts */
  delay?: number;
  /** Add subtle vignette overlay on top of the section */
  vignette?: boolean;
  /** Add cinematic film-grain overlay */
  grain?: boolean;
  /** Add HUD-style corner brackets (defence UI) */
  hud?: boolean;
  /** Add faint tactical grid overlay */
  grid?: boolean;
  /** Play a horizontal scanline sweep on reveal */
  scan?: boolean;
  /** Tone for chrome overlays: dark sections vs light sections */
  tone?: "dark" | "light";
  className?: string;
}

/**
 * Purely presentational wrapper that fades/rises a homepage section into view
 * when it enters the viewport. Layers optional defence-HUD chrome on top —
 * corner brackets, tactical grid, scanline sweep, vignette and film grain.
 * No effect on child logic or data flow.
 */
export const CinematicSection = ({
  children,
  variant = "rise",
  delay = 0,
  vignette = false,
  grain = false,
  hud = false,
  grid = false,
  scan = false,
  tone = "dark",
  className = "",
}: CinematicSectionProps) => {
  const ref = useRef<HTMLDivElement | null>(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      setVisible(true);
      return;
    }

    const io = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            setVisible(true);
            io.disconnect();
          }
        });
      },
      { threshold: 0.12, rootMargin: "0px 0px -8% 0px" }
    );
    io.observe(el);
    return () => io.disconnect();
  }, []);

  const hidden: Record<string, string> = {
    rise: "opacity-0 translate-y-10",
    scale: "opacity-0 scale-[0.985]",
    blur: "opacity-0 blur-md",
    pan: "opacity-0 -translate-x-6",
  };

  const bracketColor = tone === "dark" ? "hsl(var(--primary) / 0.75)" : "hsl(var(--primary) / 0.55)";
  const gridColor = tone === "dark" ? "rgba(255,255,255,0.045)" : "rgba(15,23,42,0.05)";

  return (
    <div
      ref={ref}
      className={`relative isolate overflow-hidden transition-all duration-[1100ms] ease-[cubic-bezier(0.22,1,0.36,1)] will-change-transform ${
        visible ? "opacity-100 translate-y-0 translate-x-0 scale-100 blur-0" : hidden[variant]
      } ${className}`}
      style={{ transitionDelay: visible ? `${delay}ms` : "0ms" }}
    >
      {children}

      {grid && (
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0 z-[1]"
          style={{
            backgroundImage: `linear-gradient(${gridColor} 1px, transparent 1px), linear-gradient(90deg, ${gridColor} 1px, transparent 1px)`,
            backgroundSize: "56px 56px",
            maskImage:
              "radial-gradient(ellipse at center, black 30%, transparent 85%)",
            WebkitMaskImage:
              "radial-gradient(ellipse at center, black 30%, transparent 85%)",
          }}
        />
      )}

      {vignette && (
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0 z-[1]"
          style={{
            background:
              "radial-gradient(ellipse at center, transparent 55%, rgba(0,0,0,0.4) 100%)",
          }}
        />
      )}

      {grain && (
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0 z-[1] opacity-[0.06] mix-blend-overlay"
          style={{
            backgroundImage:
              "url(\"data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='160' height='160'><filter id='n'><feTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='2' stitchTiles='stitch'/></filter><rect width='100%' height='100%' filter='url(%23n)' opacity='0.6'/></svg>\")",
          }}
        />
      )}

      {hud && (
        <>
          {/* HUD corner brackets */}
          <span
            aria-hidden
            className="pointer-events-none absolute left-4 top-4 md:left-6 md:top-6 h-5 w-5 md:h-7 md:w-7 z-[2]"
            style={{ borderTop: `1.5px solid ${bracketColor}`, borderLeft: `1.5px solid ${bracketColor}` }}
          />
          <span
            aria-hidden
            className="pointer-events-none absolute right-4 top-4 md:right-6 md:top-6 h-5 w-5 md:h-7 md:w-7 z-[2]"
            style={{ borderTop: `1.5px solid ${bracketColor}`, borderRight: `1.5px solid ${bracketColor}` }}
          />
          <span
            aria-hidden
            className="pointer-events-none absolute left-4 bottom-4 md:left-6 md:bottom-6 h-5 w-5 md:h-7 md:w-7 z-[2]"
            style={{ borderBottom: `1.5px solid ${bracketColor}`, borderLeft: `1.5px solid ${bracketColor}` }}
          />
          <span
            aria-hidden
            className="pointer-events-none absolute right-4 bottom-4 md:right-6 md:bottom-6 h-5 w-5 md:h-7 md:w-7 z-[2]"
            style={{ borderBottom: `1.5px solid ${bracketColor}`, borderRight: `1.5px solid ${bracketColor}` }}
          />
        </>
      )}

      {scan && visible && (
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0 z-[2] cinematic-scan"
          style={{
            background: `linear-gradient(180deg, transparent 0%, ${bracketColor} 50%, transparent 100%)`,
            height: "140px",
            opacity: 0.35,
            mixBlendMode: "screen",
          }}
        />
      )}
    </div>
  );
};

/**
 * Tactical divider between sections — classification-style label with
 * animated ticks and hairline glow. Gives the homepage a defence-briefing
 * rhythm without touching the sections themselves.
 */
export const TacticalDivider = ({
  code,
  label,
  status = "OPERATIONAL",
  tone = "dark",
}: {
  code: string;
  label: string;
  status?: string;
  tone?: "dark" | "light";
}) => {
  const isDark = tone === "dark";
  return (
    <div
      className={`relative w-full ${isDark ? "bg-[#0F172A]" : "bg-background"} py-4 md:py-5`}
      aria-hidden
    >
      <div className="mx-auto flex max-w-7xl items-center gap-3 px-4 md:px-6">
        <span
          className="h-px flex-1"
          style={{
            background: `linear-gradient(90deg, transparent, hsl(var(--primary) / ${isDark ? 0.55 : 0.35}), hsl(var(--primary) / ${isDark ? 0.9 : 0.65}))`,
          }}
        />
        <div
          className={`flex items-center gap-2 font-mono text-[10px] md:text-[11px] tracking-[0.22em] uppercase ${
            isDark ? "text-white/70" : "text-slate-700"
          }`}
        >
          <span className="inline-flex items-center gap-1.5">
            <span className="relative inline-flex h-1.5 w-1.5">
              <span
                className="absolute inline-flex h-full w-full rounded-full opacity-75 animate-ping"
                style={{ background: "hsl(var(--primary))" }}
              />
              <span
                className="relative inline-flex h-1.5 w-1.5 rounded-full"
                style={{ background: "hsl(var(--primary))" }}
              />
            </span>
            {code}
          </span>
          <span className={isDark ? "text-white/30" : "text-slate-400"}>//</span>
          <span>{label}</span>
          <span className={isDark ? "text-white/30" : "text-slate-400"}>//</span>
          <span style={{ color: "hsl(var(--primary))" }}>{status}</span>
        </div>
        <span
          className="h-px flex-1"
          style={{
            background: `linear-gradient(90deg, hsl(var(--primary) / ${isDark ? 0.9 : 0.65}), hsl(var(--primary) / ${isDark ? 0.55 : 0.35}), transparent)`,
          }}
        />
      </div>
    </div>
  );
};

/** Legacy hairline divider — kept for backward compatibility. */
export const CinematicDivider = ({ tone = "dark" }: { tone?: "dark" | "light" }) => (
  <div
    aria-hidden
    className="relative h-px w-full overflow-hidden"
    style={{
      background:
        tone === "dark"
          ? "linear-gradient(90deg, transparent, hsl(var(--primary) / 0.55), transparent)"
          : "linear-gradient(90deg, transparent, hsl(var(--primary) / 0.35), transparent)",
    }}
  />
);
