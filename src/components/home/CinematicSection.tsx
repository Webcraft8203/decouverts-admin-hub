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
  className?: string;
}

/**
 * Purely presentational wrapper that fades/rises a homepage section into view
 * when it enters the viewport. No effect on child logic or data flow.
 */
export const CinematicSection = ({
  children,
  variant = "rise",
  delay = 0,
  vignette = false,
  grain = false,
  className = "",
}: CinematicSectionProps) => {
  const ref = useRef<HTMLDivElement | null>(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    // Respect reduced motion
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

  return (
    <div
      ref={ref}
      className={`relative isolate transition-all duration-[1100ms] ease-[cubic-bezier(0.22,1,0.36,1)] will-change-transform ${
        visible ? "opacity-100 translate-y-0 translate-x-0 scale-100 blur-0" : hidden[variant]
      } ${className}`}
      style={{ transitionDelay: visible ? `${delay}ms` : "0ms" }}
    >
      {children}

      {vignette && (
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0 z-[1]"
          style={{
            background:
              "radial-gradient(ellipse at center, transparent 55%, rgba(0,0,0,0.35) 100%)",
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
    </div>
  );
};

/**
 * Thin cinematic divider — a hairline glow between sections, used to give
 * the alternating light/dark rhythm a "reel change" feel.
 */
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
