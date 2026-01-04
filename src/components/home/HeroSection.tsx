import { motion, useMotionValue, useTransform, useSpring, AnimatePresence } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { ArrowRight, ShoppingBag, Package, Printer, Cog, Box, ChevronDown } from "lucide-react";
import { useRef, useEffect, useState } from "react";
import logo from "@/assets/logo.png";

// Intro Animation Overlay
const IntroAnimation = ({ onComplete }: { onComplete: () => void }) => {
  const [phase, setPhase] = useState<"logo" | "expand" | "done">("logo");

  useEffect(() => {
    // Logo reveal phase
    const expandTimer = setTimeout(() => setPhase("expand"), 1500);
    // Complete and hide overlay
    const doneTimer = setTimeout(() => {
      setPhase("done");
      onComplete();
    }, 2200);

    return () => {
      clearTimeout(expandTimer);
      clearTimeout(doneTimer);
    };
  }, [onComplete]);

  if (phase === "done") return null;

  return (
    <motion.div
      className="fixed inset-0 z-[100] flex items-center justify-center bg-background"
      initial={{ opacity: 1 }}
      animate={{ opacity: phase === "expand" ? 0 : 1 }}
      transition={{ duration: 0.6, ease: "easeInOut" }}
    >
      {/* Background glow */}
      <motion.div
        className="absolute w-96 h-96 bg-gradient-radial from-primary/20 via-accent/10 to-transparent rounded-full blur-3xl"
        initial={{ scale: 0, opacity: 0 }}
        animate={{ 
          scale: phase === "expand" ? 3 : 1.5, 
          opacity: phase === "expand" ? 0 : 0.6 
        }}
        transition={{ duration: 0.8, ease: "easeOut" }}
      />

      {/* Logo container */}
      <motion.div
        className="relative z-10 flex flex-col items-center"
        initial={{ scale: 0.5, opacity: 0 }}
        animate={{ 
          scale: phase === "expand" ? 1.5 : 1, 
          opacity: phase === "expand" ? 0 : 1,
          y: phase === "expand" ? -50 : 0
        }}
        transition={{ 
          duration: phase === "expand" ? 0.5 : 0.8, 
          ease: "easeOut",
          delay: phase === "logo" ? 0.2 : 0
        }}
      >
        {/* Rotating ring */}
        <motion.div
          className="absolute w-40 h-40 md:w-52 md:h-52 rounded-full border-2 border-primary/30"
          initial={{ scale: 0, rotate: 0 }}
          animate={{ 
            scale: phase === "expand" ? 2 : 1, 
            rotate: 360,
            opacity: phase === "expand" ? 0 : 1
          }}
          transition={{ 
            scale: { duration: 0.6, ease: "easeOut" },
            rotate: { duration: 3, repeat: Infinity, ease: "linear" },
            opacity: { duration: 0.3 }
          }}
        />
        
        {/* Second ring */}
        <motion.div
          className="absolute w-32 h-32 md:w-44 md:h-44 rounded-full border border-accent/20"
          initial={{ scale: 0, rotate: 0 }}
          animate={{ 
            scale: phase === "expand" ? 2.5 : 1, 
            rotate: -360,
            opacity: phase === "expand" ? 0 : 1
          }}
          transition={{ 
            scale: { duration: 0.5, ease: "easeOut", delay: 0.1 },
            rotate: { duration: 4, repeat: Infinity, ease: "linear" },
            opacity: { duration: 0.3 }
          }}
        />

        {/* Logo */}
        <motion.img
          src={logo}
          alt="Decouverts"
          className="w-24 h-24 md:w-32 md:h-32 object-contain relative z-10"
          initial={{ scale: 0, rotate: -180 }}
          animate={{ 
            scale: 1, 
            rotate: 0,
          }}
          transition={{ 
            duration: 0.8, 
            ease: [0.34, 1.56, 0.64, 1], // Spring-like bounce
            delay: 0.3
          }}
        />

        {/* Brand name */}
        <motion.h2
          className="mt-6 text-2xl md:text-3xl font-bold text-foreground tracking-wider"
          initial={{ opacity: 0, y: 20 }}
          animate={{ 
            opacity: phase === "expand" ? 0 : 1, 
            y: 0 
          }}
          transition={{ duration: 0.5, delay: 0.8 }}
        >
          DECOUVERTS
        </motion.h2>

        {/* Tagline */}
        <motion.p
          className="mt-2 text-sm md:text-base text-muted-foreground"
          initial={{ opacity: 0 }}
          animate={{ opacity: phase === "expand" ? 0 : 1 }}
          transition={{ duration: 0.5, delay: 1 }}
        >
          Engineering Excellence
        </motion.p>
      </motion.div>

      {/* Particles burst on expand */}
      <AnimatePresence>
        {phase === "expand" && (
          <>
            {[...Array(12)].map((_, i) => (
              <motion.div
                key={i}
                className="absolute w-2 h-2 rounded-full bg-primary/50"
                initial={{ x: 0, y: 0, opacity: 1 }}
                animate={{
                  x: Math.cos((i * Math.PI * 2) / 12) * 200,
                  y: Math.sin((i * Math.PI * 2) / 12) * 200,
                  opacity: 0,
                  scale: 0,
                }}
                transition={{ duration: 0.6, ease: "easeOut" }}
              />
            ))}
          </>
        )}
      </AnimatePresence>
    </motion.div>
  );
};

// Interactive 3D Icon Component
const Interactive3DIcon = ({ 
  icon: Icon, 
  className, 
  delay = 0,
  rotateOnHover = false,
  glowColor = "primary"
}: { 
  icon: React.ElementType; 
  className: string; 
  delay?: number;
  rotateOnHover?: boolean;
  glowColor?: string;
}) => {
  const [isHovered, setIsHovered] = useState(false);
  
  return (
    <motion.div
      className={`absolute ${className} pointer-events-auto cursor-pointer z-20`}
      initial={{ opacity: 0, scale: 0.8 }}
      animate={{ 
        opacity: 1,
        scale: 1,
        y: [0, -6, 0],
        rotateY: rotateOnHover && isHovered ? 180 : 0,
      }}
      transition={{
        opacity: { duration: 0.5, delay },
        scale: { duration: 0.5, delay },
        y: { duration: 3, delay: delay * 0.5, repeat: Infinity, ease: "easeInOut" },
        rotateY: { duration: 0.6 }
      }}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      style={{ transformStyle: "preserve-3d" }}
    >
      <motion.div 
        className={`p-4 rounded-2xl bg-white/80 backdrop-blur-md shadow-lg border border-border/40 transition-all duration-300 ${isHovered ? 'shadow-xl shadow-primary/20' : ''}`}
        whileHover={{ scale: 1.1 }}
      >
        <Icon className={`w-6 h-6 text-${glowColor}/70 transition-colors duration-300 ${isHovered ? `text-${glowColor}` : ''}`} />
      </motion.div>
      
      {/* Glow effect on hover */}
      <AnimatePresence>
        {isHovered && (
          <motion.div
            className="absolute inset-0 rounded-2xl bg-primary/20 blur-xl -z-10"
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1.2 }}
            exit={{ opacity: 0, scale: 0.8 }}
          />
        )}
      </AnimatePresence>
    </motion.div>
  );
};

// Brand Logo with effects - Right Side (Desktop/Tablet only)
const HeroLogo = ({ mouseX, mouseY }: { mouseX: any; mouseY: any }) => {
  const translateX = useTransform(mouseX, [0, 1], [-15, 15]);
  const translateY = useTransform(mouseY, [0, 1], [-15, 15]);
  const springX = useSpring(translateX, { stiffness: 50, damping: 30 });
  const springY = useSpring(translateY, { stiffness: 50, damping: 30 });

  return (
    <motion.div
      className="hidden md:flex absolute right-8 lg:right-16 xl:right-24 top-1/2 -translate-y-1/2 pointer-events-none z-0"
      style={{ x: springX, y: springY }}
      initial={{ opacity: 0, scale: 0.8 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.8, delay: 0.3 }}
    >
      <motion.div
        className="relative"
        animate={{ 
          scale: [0.98, 1.02, 0.98],
        }}
        transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
      >
        {/* Glow effect behind logo */}
        <motion.div
          className="absolute inset-0 blur-3xl -z-10"
          animate={{
            opacity: [0.2, 0.35, 0.2],
          }}
          transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
        >
          <div className="w-64 h-64 lg:w-80 lg:h-80 xl:w-96 xl:h-96 bg-gradient-radial from-primary/25 via-accent/15 to-transparent rounded-full" />
        </motion.div>
        
        {/* Outer ring */}
        <motion.div
          className="absolute inset-0 rounded-full border border-primary/10"
          style={{ margin: "-20px" }}
          animate={{ rotate: 360 }}
          transition={{ duration: 60, repeat: Infinity, ease: "linear" }}
        />
        
        {/* Logo */}
        <img 
          src={logo} 
          alt="Decouverts" 
          className="w-56 h-56 lg:w-72 lg:h-72 xl:w-80 xl:h-80 object-contain opacity-40"
        />
      </motion.div>
    </motion.div>
  );
};

// Domain Item Component
const DomainItem = ({ 
  icon: Icon, 
  title, 
  subtitle,
  onClick,
  isHovered,
  onHover,
  delay = 0 
}: { 
  icon: React.ElementType;
  title: string;
  subtitle?: string;
  onClick: () => void;
  isHovered: boolean;
  onHover: (hovered: boolean) => void;
  delay?: number;
}) => (
  <motion.div
    className="group flex items-center gap-3 cursor-pointer px-4 py-3 rounded-xl transition-all duration-300 hover:bg-muted/40"
    onClick={(e) => {
      e.stopPropagation();
      onClick();
    }}
    onMouseEnter={() => onHover(true)}
    onMouseLeave={() => onHover(false)}
    initial={{ opacity: 0, y: 20 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ duration: 0.5, delay }}
    whileHover={{ scale: 1.02 }}
    whileTap={{ scale: 0.98 }}
  >
    <motion.div 
      className={`p-3 rounded-xl bg-white/80 backdrop-blur-sm shadow-md border border-border/30 transition-all duration-300 ${isHovered ? 'shadow-lg shadow-primary/20 border-primary/30' : ''}`}
      animate={isHovered ? { rotate: [0, -5, 5, 0] } : {}}
      transition={{ duration: 0.4 }}
    >
      <Icon className={`w-5 h-5 transition-colors duration-300 ${isHovered ? 'text-primary' : 'text-foreground/60'}`} />
    </motion.div>
    <div className="flex flex-col">
      <span className={`font-semibold transition-colors duration-300 ${isHovered ? 'text-primary' : 'text-foreground'}`}>
        {title}
      </span>
      {subtitle && (
        <span className="text-xs text-muted-foreground">{subtitle}</span>
      )}
    </div>
    <motion.div
      className="ml-auto"
      initial={{ opacity: 0, x: -10 }}
      animate={{ opacity: isHovered ? 1 : 0, x: isHovered ? 0 : -10 }}
      transition={{ duration: 0.2 }}
    >
      <ArrowRight className="w-4 h-4 text-primary" />
    </motion.div>
  </motion.div>
);

// 3D Engineering Core Element
const EngineeringCore = ({ mouseX, mouseY }: { mouseX: any; mouseY: any }) => {
  const rotateX = useTransform(mouseY, [0, 1], [12, -12]);
  const rotateY = useTransform(mouseX, [0, 1], [-12, 12]);
  const springRotateX = useSpring(rotateX, { stiffness: 40, damping: 20 });
  const springRotateY = useSpring(rotateY, { stiffness: 40, damping: 20 });

  return (
    <motion.div
      className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-72 h-72 md:w-96 md:h-96 pointer-events-none hidden md:block"
      style={{
        rotateX: springRotateX,
        rotateY: springRotateY,
        transformStyle: "preserve-3d",
        perspective: 1200,
      }}
    >
      {/* Outer ring */}
      <motion.div
        className="absolute inset-0 rounded-full border-2 border-primary/15"
        animate={{ rotate: 360 }}
        transition={{ duration: 50, repeat: Infinity, ease: "linear" }}
      />
      
      {/* Middle ring with dashes */}
      <motion.div
        className="absolute inset-10 rounded-full border-2 border-dashed border-accent/20"
        animate={{ rotate: -360 }}
        transition={{ duration: 35, repeat: Infinity, ease: "linear" }}
      />
      
      {/* Inner ring */}
      <motion.div
        className="absolute inset-20 rounded-full border border-primary/10"
        animate={{ rotate: 360 }}
        transition={{ duration: 25, repeat: Infinity, ease: "linear" }}
      />
      
      {/* Pulse ring effect */}
      <motion.div
        className="absolute inset-16 rounded-full border-2 border-primary/30"
        animate={{ 
          scale: [1, 1.2, 1],
          opacity: [0.3, 0, 0.3]
        }}
        transition={{ duration: 3, repeat: Infinity, ease: "easeOut" }}
      />
      
      {/* Center mechanical core */}
      <motion.div
        className="absolute inset-0 flex items-center justify-center"
        animate={{ rotate: 360 }}
        transition={{ duration: 80, repeat: Infinity, ease: "linear" }}
      >
        <motion.div
          className="relative w-20 h-20 md:w-28 md:h-28"
          animate={{ scale: [1, 1.05, 1] }}
          transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
        >
          <div 
            className="absolute inset-0 bg-gradient-to-br from-primary/25 via-accent/20 to-primary/15 rounded-3xl shadow-2xl shadow-primary/10"
            style={{ transform: "rotate(45deg)" }}
          />
          <motion.div
            className="absolute inset-2 bg-gradient-to-br from-white/90 to-white/70 rounded-2xl"
            style={{ transform: "rotate(45deg)" }}
          />
          <div className="absolute inset-0 flex items-center justify-center">
            <Cog className="w-8 h-8 md:w-10 md:h-10 text-primary/40" />
          </div>
        </motion.div>
      </motion.div>

      {/* Orbiting elements */}
      {[0, 1, 2, 3].map((i) => (
        <motion.div
          key={i}
          className="absolute w-3 h-3 rounded-full bg-gradient-to-br from-primary/50 to-accent/40 shadow-lg shadow-primary/20"
          style={{
            top: "50%",
            left: "50%",
            marginTop: "-6px",
            marginLeft: "-6px",
          }}
          animate={{
            rotate: 360,
          }}
          transition={{
            duration: 12 + i * 2,
            delay: i * 0.5,
            repeat: Infinity,
            ease: "linear",
          }}
        >
          <motion.div
            style={{
              position: "absolute",
              left: `${80 + i * 25}px`,
            }}
            className="w-2 h-2 rounded-full bg-primary/40"
          />
        </motion.div>
      ))}
    </motion.div>
  );
};

// Animated engineering lines
const EngineeringLines = () => (
  <div className="absolute inset-0 overflow-hidden pointer-events-none">
    {/* Horizontal lines */}
    {[...Array(5)].map((_, i) => (
      <motion.div
        key={`h-${i}`}
        className="absolute h-px bg-gradient-to-r from-transparent via-primary/10 to-transparent"
        style={{
          top: `${20 + i * 15}%`,
          left: 0,
          right: 0,
        }}
        animate={{ opacity: [0.3, 0.6, 0.3] }}
        transition={{ duration: 4, delay: i * 0.5, repeat: Infinity }}
      />
    ))}
    {/* Vertical lines */}
    {[...Array(5)].map((_, i) => (
      <motion.div
        key={`v-${i}`}
        className="absolute w-px bg-gradient-to-b from-transparent via-primary/8 to-transparent"
        style={{
          left: `${20 + i * 15}%`,
          top: 0,
          bottom: 0,
        }}
        animate={{ opacity: [0.2, 0.5, 0.2] }}
        transition={{ duration: 5, delay: i * 0.3, repeat: Infinity }}
      />
    ))}
  </div>
);

// Background particles with varied sizes
const BackgroundParticles = () => (
  <div className="absolute inset-0 overflow-hidden pointer-events-none">
    {[...Array(30)].map((_, i) => (
      <motion.div
        key={i}
        className="absolute rounded-full bg-primary/25"
        style={{
          width: `${2 + Math.random() * 4}px`,
          height: `${2 + Math.random() * 4}px`,
          left: `${Math.random() * 100}%`,
          top: `${Math.random() * 100}%`,
        }}
        animate={{
          y: [0, -40 - Math.random() * 20, 0],
          x: [0, (Math.random() - 0.5) * 20, 0],
          opacity: [0.1, 0.4, 0.1],
        }}
        transition={{
          duration: 5 + Math.random() * 5,
          delay: Math.random() * 4,
          repeat: Infinity,
          ease: "easeInOut",
        }}
      />
    ))}
  </div>
);

// Hover Label Component
const HoverLabel = ({ text, isVisible }: { text: string; isVisible: boolean }) => (
  <AnimatePresence>
    {isVisible && (
      <motion.div
        className="absolute -top-10 left-1/2 -translate-x-1/2 px-4 py-2 bg-foreground/90 text-background text-sm font-medium rounded-lg shadow-lg whitespace-nowrap z-30"
        initial={{ opacity: 0, y: 10, scale: 0.9 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: 10, scale: 0.9 }}
        transition={{ duration: 0.2 }}
      >
        {text}
        <div className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-2 h-2 bg-foreground/90 rotate-45" />
      </motion.div>
    )}
  </AnimatePresence>
);

// Mobile tap hint
const MobileTapHint = () => (
  <motion.div
    className="md:hidden flex items-center justify-center gap-2 text-muted-foreground text-sm mt-4"
    initial={{ opacity: 0 }}
    animate={{ opacity: 1 }}
    transition={{ delay: 1.2 }}
  >
    <motion.div
      animate={{ scale: [1, 1.2, 1] }}
      transition={{ duration: 1.5, repeat: Infinity }}
    >
      <div className="w-6 h-6 rounded-full border-2 border-primary/40 flex items-center justify-center">
        <div className="w-2 h-2 rounded-full bg-primary/60" />
      </div>
    </motion.div>
    <span>Tap to explore</span>
  </motion.div>
);

// Ripple effect component
const RippleEffect = ({ x, y, onComplete }: { x: number; y: number; onComplete: () => void }) => (
  <motion.div
    className="absolute pointer-events-none z-50"
    style={{ left: x - 50, top: y - 50 }}
    initial={{ scale: 0, opacity: 0.5 }}
    animate={{ scale: 2, opacity: 0 }}
    transition={{ duration: 0.6 }}
    onAnimationComplete={onComplete}
  >
    <div className="w-24 h-24 rounded-full border-2 border-primary/40" />
  </motion.div>
);

export const HeroSection = () => {
  const navigate = useNavigate();
  const containerRef = useRef<HTMLDivElement>(null);
  const mouseX = useMotionValue(0.5);
  const mouseY = useMotionValue(0.5);
  const [hoveredSection, setHoveredSection] = useState<string | null>(null);
  const [ripples, setRipples] = useState<{ id: number; x: number; y: number }[]>([]);
  const [showIntro, setShowIntro] = useState(true);
  const [contentReady, setContentReady] = useState(false);

  // Handle intro animation completion
  const handleIntroComplete = () => {
    setShowIntro(false);
    // Small delay before showing content for smooth transition
    setTimeout(() => setContentReady(true), 100);
  };

  // Track mouse position for parallax
  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (!containerRef.current) return;
      const rect = containerRef.current.getBoundingClientRect();
      mouseX.set((e.clientX - rect.left) / rect.width);
      mouseY.set((e.clientY - rect.top) / rect.height);
    };

    const container = containerRef.current;
    if (container) {
      container.addEventListener("mousemove", handleMouseMove);
    }

    return () => {
      if (container) {
        container.removeEventListener("mousemove", handleMouseMove);
      }
    };
  }, [mouseX, mouseY]);

  // Handle ripple effect on click
  const handleRipple = (e: React.MouseEvent) => {
    const rect = containerRef.current?.getBoundingClientRect();
    if (!rect) return;
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    const id = Date.now();
    setRipples(prev => [...prev, { id, x, y }]);
  };

  const removeRipple = (id: number) => {
    setRipples(prev => prev.filter(r => r.id !== id));
  };

  // Fetch section visibility from database
  const { data: sections } = useQuery({
    queryKey: ["homepage-sections"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("homepage_sections")
        .select("*")
        .order("display_order");
      if (error) throw error;
      return data;
    },
  });

  // Check visibility for each section
  const isVisible = (key: string) => {
    const section = sections?.find((s) => s.section_key === key);
    return section?.is_visible ?? true;
  };

  const ecommerceVisible = isVisible("ecommerce");
  const engineeringVisible = isVisible("engineering");
  const manufacturingVisible = isVisible("manufacturing");

  const visibleCount = [ecommerceVisible, engineeringVisible, manufacturingVisible].filter(Boolean).length;

  return (
    <>
      {/* Intro Animation */}
      <AnimatePresence>
        {showIntro && <IntroAnimation onComplete={handleIntroComplete} />}
      </AnimatePresence>

      <section
        ref={containerRef}
        className="relative min-h-[90vh] bg-background overflow-hidden"
        onClick={handleRipple}
      >
        {/* Blueprint Grid Pattern - Enhanced */}
        <div className="absolute inset-0">
          <div className="absolute inset-0 bg-[linear-gradient(to_right,hsl(var(--primary)/0.05)_1px,transparent_1px),linear-gradient(to_bottom,hsl(var(--primary)/0.05)_1px,transparent_1px)] bg-[size:50px_50px]" />
        </div>

        {/* Engineering Lines */}
        <EngineeringLines />

        {/* Radial Light Behind Center */}
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
          <motion.div 
            className="w-[700px] h-[700px] bg-gradient-radial from-primary/8 via-accent/3 to-transparent rounded-full blur-3xl"
            initial={{ scale: 0.8, opacity: 0 }}
            animate={contentReady ? { scale: [1, 1.05, 1], opacity: [0.6, 0.8, 0.6] } : {}}
            transition={{ duration: 6, repeat: Infinity }}
          />
        </div>

        {/* Background Particles */}
        {contentReady && <BackgroundParticles />}

        {/* Hero Logo - Right Side (Desktop/Tablet only) */}
        {contentReady && <HeroLogo mouseX={mouseX} mouseY={mouseY} />}

        {/* 3D Engineering Core - subtle background element */}
        {contentReady && <EngineeringCore mouseX={mouseX} mouseY={mouseY} />}

        {/* Ripple Effects */}
        {ripples.map(ripple => (
          <RippleEffect
            key={ripple.id}
            x={ripple.x}
            y={ripple.y}
            onComplete={() => removeRipple(ripple.id)}
          />
        ))}

        {/* Main Content - Left Aligned on Desktop */}
        <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 lg:py-24 min-h-[70vh] flex flex-col justify-center">
          <motion.div
            className="text-center md:text-left max-w-2xl"
            initial={{ opacity: 0, y: 30 }}
            animate={contentReady ? { opacity: 1, y: 0 } : {}}
            transition={{ duration: 0.8, ease: "easeOut" }}
          >
            {/* Brand Name & Tagline */}
            <motion.div
              className="mb-6"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.1 }}
            >
              <motion.h2 
                className="text-xl md:text-2xl lg:text-3xl font-bold text-foreground tracking-widest mb-1"
                initial={{ opacity: 0, letterSpacing: "0.1em" }}
                animate={{ opacity: 1, letterSpacing: "0.2em" }}
                transition={{ duration: 0.6, delay: 0.15 }}
              >
                DECOUVERTS
              </motion.h2>
              <motion.p
                className="text-sm md:text-base text-accent font-medium italic"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.5, delay: 0.25 }}
              >
                The Art of India
              </motion.p>
            </motion.div>

            {/* Main Heading */}
            <motion.h1 
              className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-bold leading-tight mb-6"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.2 }}
            >
              <motion.span 
                className="text-foreground inline-block"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.3 }}
              >
                Engineering the Future
              </motion.span>
              <br />
              <motion.span
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.4 }}
              >
                <span className="text-foreground">Through </span>
                <span className="text-primary relative inline-block cursor-default">
                  Innovation
                  <motion.span 
                    className="absolute inset-0 bg-gradient-to-r from-transparent via-white/40 to-transparent"
                    animate={{ x: ["-100%", "100%"] }}
                    transition={{ duration: 2.5, repeat: Infinity, repeatDelay: 3 }}
                  />
                </span>
              </motion.span>
              <br />
              <motion.span
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.5 }}
              >
                <span className="text-foreground">& </span>
                <span className="text-primary relative inline-block cursor-default">
                  Manufacturing
                  <motion.span 
                    className="absolute inset-0 bg-gradient-to-r from-transparent via-white/40 to-transparent"
                    animate={{ x: ["-100%", "100%"] }}
                    transition={{ duration: 2.5, delay: 1.5, repeat: Infinity, repeatDelay: 3 }}
                  />
                </span>
              </motion.span>
            </motion.h1>
            
            {/* Subline */}
            <motion.p 
              className="text-base md:text-lg lg:text-xl text-muted-foreground"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.6 }}
            >
              Design • Build • Manufacture • Deliver
            </motion.p>

            {/* Mobile Tap Hint */}
            <MobileTapHint />
          </motion.div>

          {/* Three Domains - Below Hero Text */}
          {visibleCount > 0 && (
            <motion.div
              className="mt-10 md:mt-14"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.7 }}
            >
              {/* Desktop: Inline horizontal layout */}
              <div className="hidden md:flex flex-wrap items-center gap-2 lg:gap-4">
                {ecommerceVisible && (
                  <DomainItem
                    icon={ShoppingBag}
                    title="E-Commerce"
                    subtitle="Premium Products"
                    onClick={() => navigate("/shop")}
                    isHovered={hoveredSection === "ecommerce"}
                    onHover={(h) => setHoveredSection(h ? "ecommerce" : null)}
                    delay={0.8}
                  />
                )}
                {ecommerceVisible && engineeringVisible && (
                  <span className="text-border/60 text-2xl font-light">|</span>
                )}
                {engineeringVisible && (
                  <DomainItem
                    icon={Cog}
                    title="Engineering Services"
                    subtitle="Mechanical NPD"
                    onClick={() => navigate("/engineering")}
                    isHovered={hoveredSection === "engineering"}
                    onHover={(h) => setHoveredSection(h ? "engineering" : null)}
                    delay={0.9}
                  />
                )}
                {engineeringVisible && manufacturingVisible && (
                  <span className="text-border/60 text-2xl font-light">|</span>
                )}
                {manufacturingVisible && (
                  <DomainItem
                    icon={Printer}
                    title="Manufacturing"
                    subtitle="Industrial Solutions"
                    onClick={() => navigate("/manufacturing")}
                    isHovered={hoveredSection === "manufacturing"}
                    onHover={(h) => setHoveredSection(h ? "manufacturing" : null)}
                    delay={1.0}
                  />
                )}
              </div>

              {/* Mobile: Stacked layout */}
              <div className="md:hidden flex flex-col gap-2">
                {ecommerceVisible && (
                  <DomainItem
                    icon={ShoppingBag}
                    title="E-Commerce"
                    subtitle="Premium Products"
                    onClick={() => navigate("/shop")}
                    isHovered={hoveredSection === "ecommerce"}
                    onHover={(h) => setHoveredSection(h ? "ecommerce" : null)}
                    delay={0.8}
                  />
                )}
                {engineeringVisible && (
                  <DomainItem
                    icon={Cog}
                    title="Engineering Services"
                    subtitle="Mechanical NPD"
                    onClick={() => navigate("/engineering")}
                    isHovered={hoveredSection === "engineering"}
                    onHover={(h) => setHoveredSection(h ? "engineering" : null)}
                    delay={0.9}
                  />
                )}
                {manufacturingVisible && (
                  <DomainItem
                    icon={Printer}
                    title="Manufacturing"
                    subtitle="Industrial Solutions"
                    onClick={() => navigate("/manufacturing")}
                    isHovered={hoveredSection === "manufacturing"}
                    onHover={(h) => setHoveredSection(h ? "manufacturing" : null)}
                    delay={1.0}
                  />
                )}
              </div>
            </motion.div>
          )}
        </div>

      {/* Scroll Indicator - Enhanced */}
      <motion.div
        className="absolute bottom-8 left-1/2 -translate-x-1/2 flex flex-col items-center gap-2"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 1.5 }}
      >
        <motion.span
          className="text-xs text-muted-foreground hidden md:block"
          animate={{ opacity: [0.5, 1, 0.5] }}
          transition={{ duration: 2, repeat: Infinity }}
        >
          Scroll to explore
        </motion.span>
        <motion.div
          animate={{ y: [0, 8, 0] }}
          transition={{ duration: 1.5, repeat: Infinity, ease: "easeInOut" }}
        >
          <div className="w-8 h-12 rounded-full border-2 border-foreground/20 flex items-start justify-center p-2">
            <motion.div
              className="w-1.5 h-1.5 bg-primary rounded-full"
              animate={{ y: [0, 16, 0] }}
              transition={{ duration: 1.5, repeat: Infinity, ease: "easeInOut" }}
            />
          </div>
        </motion.div>
        <motion.div
          animate={{ y: [0, 4, 0], opacity: [0.3, 0.7, 0.3] }}
          transition={{ duration: 1.5, repeat: Infinity }}
        >
          <ChevronDown className="w-5 h-5 text-muted-foreground" />
        </motion.div>
      </motion.div>
      </section>
    </>
  );
};
