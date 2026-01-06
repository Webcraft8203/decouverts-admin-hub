import { motion, useMotionValue, useTransform, useSpring, AnimatePresence } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { ArrowRight, Cog, ChevronDown, Layers } from "lucide-react";
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

// --- Card Illustrations ---

// 1. E-Commerce Illustration
const EcommerceIllustration = ({ isHovered }: { isHovered: boolean }) => (
  <div className="absolute inset-0 flex items-center justify-center overflow-hidden opacity-10">
    {/* Abstract Logistics Grid */}
    <div className="absolute inset-0 bg-[linear-gradient(to_right,#f9731610_1px,transparent_1px),linear-gradient(to_bottom,#f9731610_1px,transparent_1px)] bg-[size:24px_24px]" />
    
    {/* Flow Lines */}
    <svg className="absolute inset-0 w-full h-full pointer-events-none">
      <motion.path
        d="M -50 100 Q 150 50 350 100 T 750 100"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.5"
        className="text-orange-500/40"
        strokeDasharray="6 6"
        animate={{ strokeDashoffset: [0, -24] }}
        transition={{ duration: 3, repeat: Infinity, ease: "linear" }}
      />
      <motion.path
        d="M -50 150 Q 150 200 350 150 T 750 150"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.5"
        className="text-orange-500/20"
        strokeDasharray="6 6"
        animate={{ strokeDashoffset: [0, 24] }}
        transition={{ duration: 4, repeat: Infinity, ease: "linear" }}
      />
    </svg>
  </div>
);

// 2. Engineering Illustration
const EngineeringIllustration = ({ isHovered }: { isHovered: boolean }) => (
  <div className="absolute inset-0 flex items-center justify-center overflow-hidden opacity-10">
    {/* Technical Schematic Background */}
    <div className="absolute inset-0 bg-[linear-gradient(to_right,#00000008_1px,transparent_1px),linear-gradient(to_bottom,#00000008_1px,transparent_1px)] bg-[size:20px_20px]" />

    {/* Rotating Schematic Elements */}
    <motion.div
      className="absolute"
      animate={{ rotate: 360 }}
      transition={{ duration: 40, repeat: Infinity, ease: "linear" }}
    >
      <div className="w-48 h-48 rounded-full border border-dashed border-foreground/30" />
    </motion.div>
    <motion.div
      className="absolute"
      animate={{ rotate: -360 }}
      transition={{ duration: 30, repeat: Infinity, ease: "linear" }}
    >
      <Cog className="w-32 h-32 text-foreground/10 stroke-[0.5]" />
    </motion.div>
  </div>
);

// 3. Manufacturing Illustration
const ManufacturingIllustration = ({ isHovered }: { isHovered: boolean }) => (
  <div className="absolute inset-0 flex flex-col items-center justify-center opacity-10">
    {/* Layered Construction Animation */}
    <div className="flex flex-col-reverse gap-2 items-center">
       {[...Array(4)].map((_, i) => (
         <motion.div
           key={i}
           className="h-1 bg-foreground/20 rounded-sm"
           style={{ width: 80 + i * 20 }}
           initial={{ opacity: 0.2 }}
           animate={{ 
             opacity: [0.2, 0.6, 0.2],
             scaleX: [0.98, 1.02, 0.98]
           }}
           transition={{ 
             duration: 3, 
             delay: i * 0.4, 
             repeat: Infinity,
             ease: "easeInOut"
           }}
         />
       ))}
    </div>
  </div>
);

// Hero Card Component - Replaces DomainItem
const HeroCard = ({ 
  illustration: Illustration, 
  title, 
  subtitle,
  features,
  badge,
  onClick,
  delay = 0,
  variant = "manufacturing",
}: { 
  illustration: (props: { isHovered: boolean }) => JSX.Element;
  title: string;
  subtitle: string;
  features: string[];
  badge: string;
  onClick: () => void;
  delay?: number;
  variant?: "ecommerce" | "engineering" | "manufacturing";
}) => {
  const [isHovered, setIsHovered] = useState(false);

  const variantStyles = {
    ecommerce: {
      bg: "from-orange-50/50 to-white/5",
      accent: "bg-orange-500",
      text: "group-hover:text-orange-600",
      border: "group-hover:border-orange-500/20",
      bullet: "bg-orange-500/60",
      grid: "text-orange-900/10"
    },
    engineering: {
      bg: "from-blue-50/50 to-white/5",
      accent: "bg-blue-600",
      text: "group-hover:text-blue-700",
      border: "group-hover:border-blue-500/20",
      bullet: "bg-blue-500/60",
      grid: "text-blue-900/10"
    },
    manufacturing: {
      bg: "from-gray-50/50 to-white/5",
      accent: "bg-gray-600",
      text: "group-hover:text-gray-800",
      border: "group-hover:border-gray-500/20",
      bullet: "bg-gray-500/60",
      grid: "text-gray-900/10"
    }
  };

  const styles = variantStyles[variant];

  return (
    <motion.div
      className="relative h-full"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay, ease: "easeOut" }}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      onClick={onClick}
    >
      <motion.div
        className={`group relative h-full min-h-[280px] flex flex-col bg-white rounded-xl shadow-[0_2px_8px_-2px_rgba(0,0,0,0.05)] border border-border/60 overflow-hidden cursor-pointer transition-all duration-500 hover:shadow-[0_12px_24px_-8px_rgba(0,0,0,0.12)] hover:-translate-y-2 ${styles.border}`}
        whileTap={{ scale: 0.99 }}
      >
        {/* Accent Line */}
        <motion.div 
          className={`absolute top-0 left-0 right-0 h-1 ${styles.accent} origin-left z-20`}
          initial={{ scaleX: 0.3, opacity: 0.6 }}
          animate={{ 
            scaleX: isHovered ? 1 : 0.3,
            opacity: isHovered ? 1 : 0.6
          }}
          transition={{ duration: 0.4, ease: "easeInOut" }}
        />

        {/* 1. Background Grid & Tint */}
        <div className={`absolute inset-0 z-0 opacity-0 group-hover:opacity-100 transition-opacity duration-700 bg-gradient-to-br ${styles.bg}`} />
        
        <div className={`absolute inset-0 z-0 opacity-[0.03] group-hover:opacity-[0.06] transition-opacity duration-500 pointer-events-none ${styles.grid}`}>
             <div className="absolute inset-0 bg-[linear-gradient(to_right,currentColor_1px,transparent_1px),linear-gradient(to_bottom,currentColor_1px,transparent_1px)] bg-[size:24px_24px]" />
        </div>

        {/* 2. Animation Layer */}
        <div className="absolute inset-0 z-10 opacity-30 group-hover:opacity-50 transition-opacity duration-500 pointer-events-none overflow-hidden mix-blend-multiply">
          <Illustration isHovered={isHovered} />
        </div>

        {/* Badge */}
        <div className="absolute top-4 right-4 z-20">
          <span className="px-2 py-1 text-[10px] font-bold uppercase tracking-wider text-muted-foreground/70 bg-white/90 border border-border/40 rounded shadow-sm backdrop-blur-sm">
            {badge}
          </span>
        </div>

        {/* 3. Content Layer */}
        <div className="relative z-30 p-6 flex flex-col h-full">
          <div className="mt-auto flex flex-col gap-2">
            <h3 className={`text-xl font-bold text-foreground tracking-tight transition-colors duration-300 ${styles.text}`}>
              {title}
            </h3>
            <p className="text-sm text-muted-foreground/80 font-medium leading-relaxed">
              {subtitle}
            </p>
            
            <div className={`h-px w-12 ${styles.bullet} opacity-30 my-3`} />

            <ul className="space-y-2 mb-4">
              {features.map((feature, i) => (
                <li key={i} className="flex items-center text-xs text-muted-foreground font-medium">
                  <div className={`w-1.5 h-1.5 ${styles.bullet} rounded-full mr-2.5`} />
                  {feature}
                </li>
              ))}
            </ul>
            
            <div className={`flex items-center text-xs font-bold uppercase tracking-wider text-foreground/60 transition-colors mt-2 ${styles.text}`}>
              Explore <ArrowRight className="w-3.5 h-3.5 ml-2 group-hover:translate-x-1 transition-transform" />
            </div>
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
};

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
        className="relative min-h-[60vh] bg-background overflow-hidden flex flex-col pt-8 pb-16 justify-center"
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

        {/* Main Content */}
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 relative z-10 flex flex-col items-center">
          <div className="flex flex-col items-center w-full max-w-5xl mx-auto">
              <motion.div
                className="text-center w-full"
                initial={{ opacity: 0, y: 30 }}
                animate={contentReady ? { opacity: 1, y: 0 } : {}}
                transition={{ duration: 0.8, ease: "easeOut" }}
              >
            {/* Main Heading */}
            <motion.h1 
              className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-bold leading-tight tracking-tight mb-4"
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
              className="text-base md:text-lg lg:text-xl text-muted-foreground mb-6 max-w-2xl mx-auto"
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
              className="mt-8 w-full max-w-5xl px-4"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.7 }}
            >
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-6">
                {ecommerceVisible && (
                  <HeroCard
                    illustration={EcommerceIllustration}
                    title="E-Commerce"
                    subtitle="Industrial Component Sourcing"
                    features={["Global Logistics", "Bulk Procurement", "Verified Suppliers"]}
                    badge="Global Supply"
                    onClick={() => navigate("/shop")}
                    delay={0.8}
                    variant="ecommerce"
                  />
                )}
                {engineeringVisible && (
                  <HeroCard
                    illustration={EngineeringIllustration}
                    title="Engineering Services"
                    subtitle="End-to-End Product Development"
                    features={["CAD/CAM Design", "FEA Simulation", "Rapid Prototyping"]}
                    badge="R&D Driven"
                    onClick={() => navigate("/engineering")}
                    delay={0.9}
                    variant="engineering"
                  />
                )}
                {manufacturingVisible && (
                  <HeroCard
                    illustration={ManufacturingIllustration}
                    title="Manufacturing"
                    subtitle="Precision Production at Scale"
                    features={["Decoverts DFT Series 3D printers", "Drone Systems", "Quality Assurance"]}
                    badge="Industrial Grade"
                    onClick={() => navigate("/manufacturing")}
                    delay={1.0}
                    variant="manufacturing"
                  />
                )}
              </div>
            </motion.div>
          )}
          </div>
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
