import { motion, useMotionValue, useTransform, useSpring, AnimatePresence } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { ArrowRight, Truck, Printer, Cog, Box, ChevronDown, Layers } from "lucide-react";
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
  <div className="absolute inset-0 flex items-center justify-center">
    {/* Background Elements */}
    <div className="absolute inset-0 opacity-20">
       {[...Array(6)].map((_, i) => (
         <motion.div
           key={i}
           className="absolute h-0.5 bg-orange-400 rounded-full"
           style={{ 
             top: `${20 + i * 15}%`, 
             left: `${Math.random() * 20}%`,
             width: `${10 + Math.random() * 20}%`
           }}
           animate={{ x: [0, 100, 0], opacity: [0.3, 0.8, 0.3] }}
           transition={{ duration: 3 + i, repeat: Infinity }}
         />
       ))}
    </div>

    {/* Moving Truck */}
    <motion.div
      className="absolute"
      initial={{ x: -200 }}
      animate={{ x: 400 }}
      transition={{ 
        duration: isHovered ? 5 : 8, 
        repeat: Infinity, 
        ease: "linear" 
      }}
    >
      <Truck className="w-48 h-48 text-orange-500/40 stroke-[1.5]" />
      {/* Cargo */}
      <motion.div 
        className="absolute top-8 right-8"
        animate={{ y: [0, -2, 0] }}
        transition={{ duration: 0.5, repeat: Infinity }}
      >
         <Box className="w-12 h-12 text-orange-600/40 fill-orange-100/20" />
      </motion.div>
    </motion.div>
  </div>
);

// 2. Engineering Illustration
const EngineeringIllustration = ({ isHovered }: { isHovered: boolean }) => (
  <div className="absolute inset-0 flex items-center justify-center overflow-hidden">
    {/* Blueprint Grid */}
    <div className="absolute inset-0 bg-[linear-gradient(to_right,#3b82f620_1px,transparent_1px),linear-gradient(to_bottom,#3b82f620_1px,transparent_1px)] bg-[size:24px_24px] opacity-30" />

    {/* Large Gear */}
    <motion.div
      className="absolute"
      animate={{ rotate: 360 }}
      transition={{ duration: isHovered ? 10 : 20, repeat: Infinity, ease: "linear" }}
    >
      <Cog className="w-56 h-56 text-blue-500/30 stroke-[1]" />
    </motion.div>

    {/* Secondary Gear */}
    <motion.div
      className="absolute -right-12 -bottom-12"
      animate={{ rotate: -360 }}
      transition={{ duration: isHovered ? 8 : 15, repeat: Infinity, ease: "linear" }}
    >
      <Cog className="w-40 h-40 text-blue-400/30 stroke-[1]" />
    </motion.div>
    
    {/* Floating Blueprint Lines */}
    <svg className="absolute inset-0 w-full h-full pointer-events-none opacity-40">
      <motion.path
        d="M 20 100 L 100 20 L 200 100"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        className="text-blue-500"
        strokeDasharray="10 10"
        animate={{ strokeDashoffset: [0, 20] }}
        transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
      />
    </svg>
  </div>
);

// 3. Manufacturing Illustration
const ManufacturingIllustration = ({ isHovered }: { isHovered: boolean }) => (
  <div className="absolute inset-0 flex flex-col items-center justify-center">
    {/* Printer Head / Nozzle */}
    <motion.div
      className="relative z-10 mb-[-10px]"
      animate={{ 
        x: [-30, 30, -30],
      }}
      transition={{ 
        duration: isHovered ? 2 : 4, 
        repeat: Infinity, 
        ease: "easeInOut" 
      }}
    >
       <div className="flex flex-col items-center">
         <div className="w-2 h-12 bg-purple-400/30" />
         <Printer className="w-32 h-32 text-purple-500/30 stroke-[1]" />
       </div>
    </motion.div>

    {/* Printed Layers */}
    <div className="flex flex-col-reverse gap-1 items-center">
       {[...Array(5)].map((_, i) => (
         <motion.div
           key={i}
           className="h-2 bg-purple-500/20 rounded-full"
           style={{ width: 100 + i * 20 }}
           initial={{ opacity: 0.5 }}
           animate={{ 
             opacity: [0.3, 0.8, 0.3],
             scaleX: [0.95, 1.05, 0.95]
           }}
           transition={{ 
             duration: 2, 
             delay: i * 0.2, 
             repeat: Infinity,
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
  onClick,
  delay = 0,
}: { 
  illustration: (props: { isHovered: boolean }) => JSX.Element;
  title: string;
  subtitle: string;
  onClick: () => void;
  delay?: number;
}) => {
  const [isHovered, setIsHovered] = useState(false);

  return (
    <motion.div
      className="relative h-full min-h-[240px]"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay, ease: "easeOut" }}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      onClick={onClick}
    >
      <motion.div
        className="group relative h-full flex flex-col bg-white rounded-3xl shadow-sm border border-border/50 overflow-hidden cursor-pointer transition-all duration-300 hover:shadow-xl hover:border-primary/30 hover:-translate-y-2"
        whileTap={{ scale: 0.98 }}
      >
        {/* 1. Background Animation Layer - Z-10 */}
        <div className="absolute inset-0 z-10 opacity-40 group-hover:opacity-60 transition-opacity duration-500 pointer-events-none overflow-hidden">
          <Illustration isHovered={isHovered} />
        </div>

        {/* 2. Soft Gradient Overlay - Z-20 */}
        <div className="absolute inset-0 z-20 bg-gradient-to-t from-white/95 via-white/50 to-white/10 pointer-events-none" />

        {/* 3. Content Layer - Z-30 */}
        <div className="relative z-30 p-8 flex flex-col h-full justify-end">
          <div className="mt-auto">
            <h3 className="text-2xl font-bold text-foreground group-hover:text-primary transition-colors duration-300 mb-2">
              {title}
            </h3>
            <p className="text-base text-muted-foreground mb-6 font-medium leading-relaxed">
              {subtitle}
            </p>
            
            <div className="flex items-center text-sm font-bold text-primary/80 group-hover:text-primary transition-colors">
              Explore <ArrowRight className="w-4 h-4 ml-2 group-hover:translate-x-1 transition-transform" />
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
        className="relative min-h-[70vh] bg-background overflow-hidden flex flex-col pt-14 pb-20"
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
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 relative z-10 flex-grow flex flex-col items-center">
          <div className="flex flex-col items-center w-full max-w-5xl mx-auto">
              <motion.div
                className="text-center w-full"
                initial={{ opacity: 0, y: 30 }}
                animate={contentReady ? { opacity: 1, y: 0 } : {}}
                transition={{ duration: 0.8, ease: "easeOut" }}
              >
            {/* Main Heading */}
            <motion.h1 
              className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-bold leading-tight mb-6"
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
              className="text-lg md:text-xl lg:text-2xl text-muted-foreground mb-8"
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
              className="mt-12 w-full max-w-5xl px-4"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.7 }}
            >
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-6">
                {ecommerceVisible && (
                  <HeroCard
                    illustration={EcommerceIllustration}
                    title="E-Commerce"
                    subtitle="Premium Products"
                    onClick={() => navigate("/shop")}
                    delay={0.8}
                  />
                )}
                {engineeringVisible && (
                  <HeroCard
                    illustration={EngineeringIllustration}
                    title="Engineering Services"
                    subtitle="Mechanical NPD"
                    onClick={() => navigate("/engineering")}
                    delay={0.9}
                  />
                )}
                {manufacturingVisible && (
                  <HeroCard
                    illustration={ManufacturingIllustration}
                    title="Manufacturing"
                    subtitle="Industrial Solutions"
                    onClick={() => navigate("/manufacturing")}
                    delay={1.0}
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
