interface SectionDividerProps {
  variant?: "wave" | "angle" | "curve";
  from?: string;
  to?: string;
  flip?: boolean;
}

export const SectionDivider = ({ 
  variant = "wave", 
  from = "fill-background", 
  to = "fill-slate-50",
  flip = false 
}: SectionDividerProps) => {
  const transform = flip ? "rotate(180deg)" : undefined;

  if (variant === "wave") {
    return (
      <div className="relative -mt-px -mb-px" style={{ transform }}>
        <svg viewBox="0 0 1440 60" preserveAspectRatio="none" className={`w-full h-[30px] md:h-[50px] block ${to}`}>
          <path
            d="M0,30 C360,60 720,0 1080,30 C1260,45 1380,20 1440,30 L1440,60 L0,60 Z"
            className={from}
          />
        </svg>
      </div>
    );
  }

  if (variant === "angle") {
    return (
      <div className="relative -mt-px -mb-px" style={{ transform }}>
        <svg viewBox="0 0 1440 40" preserveAspectRatio="none" className={`w-full h-[20px] md:h-[40px] block ${to}`}>
          <polygon points="0,0 1440,40 0,40" className={from} />
        </svg>
      </div>
    );
  }

  // curve
  return (
    <div className="relative -mt-px -mb-px" style={{ transform }}>
      <svg viewBox="0 0 1440 60" preserveAspectRatio="none" className={`w-full h-[30px] md:h-[50px] block ${to}`}>
        <path
          d="M0,60 Q720,0 1440,60 L1440,60 L0,60 Z"
          className={from}
        />
      </svg>
    </div>
  );
};
