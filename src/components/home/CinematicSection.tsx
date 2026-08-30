import { useEffect, useRef, useState, ReactNode } from "react";

interface CinematicSectionProps {
  children: ReactNode;
  /** Kept for backward compatibility — all variants now resolve to one calm fade+rise reveal. */
  variant?: "rise" | "scale" | "blur" | "pan";
  /** Delay in ms before reveal transition starts */
  delay?: number;
  /** @deprecated no longer rendered — kept so existing call sites don't need to change immediately */
  vignette?: boolean;
  /** @deprecated no longer rendered */
  grain?: boolean;
  /** @deprecated no longer rendered */
  hud?: boolean;
  /** @deprecated no longer rendered */
  grid?: boolean;
  /** @deprecated no longer rendered */
  scan?: boolean;
  tone?: "dark" | "light";
  className?: string;
}

/**
 * Purely presentational wrapper that fades a homepage section gently into
 * view as it enters the viewport — one subtle, consistent reveal used
 * everywhere instead of a grab-bag of cinematic effects. Respects
 * prefers-reduced-motion. No effect on child logic or data flow.
 */
export const CinematicSection = ({
  children,
  delay = 0,
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

  return (
    <div
      ref={ref}
      className={`reveal ${visible ? "is-visible" : ""} ${className}`}
      style={{ transitionDelay: visible ? `${delay}ms` : "0ms" }}
    >
      {children}
    </div>
  );
};

/**
 * Understated section label — a small eyebrow rule used to introduce a
 * homepage section. Replaces the old blinking-dot "tactical divider".
 */
export const TacticalDivider = ({
  label,
  tone = "dark",
}: {
  code?: string;
  label: string;
  status?: string;
  tone?: "dark" | "light";
}) => {
  const isDark = tone === "dark";
  return (
    <div className={`relative w-full ${isDark ? "bg-[hsl(217,45%,9%)]" : "bg-background"} py-4`} aria-hidden>
      <div className="mx-auto flex max-w-7xl items-center gap-4 px-6 md:px-10 lg:px-16">
        <span className={`h-px flex-1 ${isDark ? "bg-white/10" : "bg-border"}`} />
        <span
          className={`font-display text-[11px] tracking-[0.22em] uppercase ${
            isDark ? "text-white/50" : "text-muted-foreground"
          }`}
        >
          {label}
        </span>
        <span className={`h-px flex-1 ${isDark ? "bg-white/10" : "bg-border"}`} />
      </div>
    </div>
  );
};

/** Hairline divider between sections. */
export const CinematicDivider = ({ tone = "dark" }: { tone?: "dark" | "light" }) => (
  <div
    aria-hidden
    className={`h-px w-full ${tone === "dark" ? "bg-white/10" : "bg-border"}`}
  />
);
