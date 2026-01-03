import { motion, useMotionValue, useTransform, useSpring } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { ShoppingBag, Wrench, Factory, ArrowRight, Sparkles, Cpu, Cog, CircuitBoard } from "lucide-react";
import { useRef, useEffect, useState } from "react";

// Configuration for interactive hotspots
const hotspotConfig = {
  ecommerce: {
    title: "E-Commerce",
    subtitle: "Premium Products",
    icon: ShoppingBag,
    route: "/shop",
    position: { desktop: "left-[8%] top-1/3", mobile: "left-1/2 -translate-x-1/2 top-[60%]" },
    color: "from-orange-500 to-amber-500",
    bgColor: "bg-orange-50",
    borderColor: "border-orange-200",
  },
  engineering: {
    title: "Engineering",
    subtitle: "NPD Services",
    icon: Wrench,
    route: "/engineering",
    position: { desktop: "right-[8%] top-1/4", mobile: "left-1/2 -translate-x-1/2 top-[72%]" },
    color: "from-blue-500 to-cyan-500",
    bgColor: "bg-blue-50",
    borderColor: "border-blue-200",
  },
  manufacturing: {
    title: "Manufacturing",
    subtitle: "Industrial Solutions",
    icon: Factory,
    route: "/manufacturing",
    position: { desktop: "right-[12%] bottom-1/4", mobile: "left-1/2 -translate-x-1/2 top-[84%]" },
    color: "from-purple-500 to-pink-500",
    bgColor: "bg-purple-50",
    borderColor: "border-purple-200",
  },
};

type HotspotKey = keyof typeof hotspotConfig;

// Floating decorative icon component
const FloatingIcon = ({ 
  icon: Icon, 
  className, 
  delay = 0 
}: { 
  icon: React.ElementType; 
  className: string; 
  delay?: number;
}) => (
  <motion.div
    className={`absolute ${className} hidden lg:block`}
    initial={{ opacity: 0, y: 20 }}
    animate={{ 
      opacity: [0.3, 0.5, 0.3],
      y: [0, -8, 0],
    }}
    transition={{
      duration: 5,
      delay,
      repeat: Infinity,
      ease: "easeInOut"
    }}
  >
    <div className="p-3 rounded-2xl bg-white/80 backdrop-blur-sm shadow-lg border border-border/50">
      <Icon className="w-5 h-5 text-primary/60" />
    </div>
  </motion.div>
);

// Interactive Hotspot Component
const InteractiveHotspot = ({
  config,
  index,
  onNavigate,
  mouseX,
  mouseY,
}: {
  config: typeof hotspotConfig[HotspotKey];
  index: number;
  onNavigate: (route: string) => void;
  mouseX: any;
  mouseY: any;
}) => {
  const offsetX = useTransform(mouseX, [0, 1], [-5, 5]);
  const offsetY = useTransform(mouseY, [0, 1], [-5, 5]);
  const springX = useSpring(offsetX, { stiffness: 100, damping: 20 });
  const springY = useSpring(offsetY, { stiffness: 100, damping: 20 });

  return (
    <motion.div
      className={`absolute z-20 ${config.position.desktop} hidden md:block`}
      initial={{ opacity: 0, scale: 0.8 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.6, delay: 0.8 + index * 0.15 }}
      style={{ x: springX, y: springY }}
    >
      <motion.button
        onClick={() => onNavigate(config.route)}
        className={`group relative flex items-center gap-3 px-5 py-4 rounded-2xl ${config.bgColor} border ${config.borderColor} shadow-lg hover:shadow-xl transition-all duration-300 cursor-pointer`}
        whileHover={{ scale: 1.05, y: -4 }}
        whileTap={{ scale: 0.98 }}
      >
        {/* Glow effect on hover */}
        <div className={`absolute inset-0 rounded-2xl bg-gradient-to-r ${config.color} opacity-0 group-hover:opacity-10 transition-opacity duration-300`} />
        
        {/* Icon */}
        <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${config.color} flex items-center justify-center shadow-md group-hover:scale-110 transition-transform duration-300`}>
          <config.icon className="w-6 h-6 text-white" />
        </div>
        
        {/* Text */}
        <div className="text-left">
          <h4 className="font-bold text-foreground text-sm">{config.title}</h4>
          <p className="text-xs text-muted-foreground">{config.subtitle}</p>
        </div>
        
        {/* Arrow */}
        <ArrowRight className="w-4 h-4 text-muted-foreground group-hover:text-primary group-hover:translate-x-1 transition-all duration-300 ml-1" />
      </motion.button>
    </motion.div>
  );
};

// Mobile Hotspot Button
const MobileHotspotButton = ({
  config,
  index,
  onNavigate,
}: {
  config: typeof hotspotConfig[HotspotKey];
  index: number;
  onNavigate: (route: string) => void;
}) => (
  <motion.button
    onClick={() => onNavigate(config.route)}
    className={`flex items-center gap-3 w-full px-4 py-3 rounded-xl ${config.bgColor} border ${config.borderColor} shadow-sm hover:shadow-md transition-all duration-300`}
    initial={{ opacity: 0, x: -20 }}
    animate={{ opacity: 1, x: 0 }}
    transition={{ duration: 0.4, delay: 0.6 + index * 0.1 }}
    whileTap={{ scale: 0.98 }}
  >
    <div className={`w-10 h-10 rounded-lg bg-gradient-to-br ${config.color} flex items-center justify-center shadow-sm`}>
      <config.icon className="w-5 h-5 text-white" />
    </div>
    <div className="text-left flex-1">
      <h4 className="font-semibold text-foreground text-sm">{config.title}</h4>
      <p className="text-xs text-muted-foreground">{config.subtitle}</p>
    </div>
    <ArrowRight className="w-4 h-4 text-muted-foreground" />
  </motion.button>
);

// 3D Core Element
const Core3DElement = ({ mouseX, mouseY }: { mouseX: any; mouseY: any }) => {
  const rotateX = useTransform(mouseY, [0, 1], [10, -10]);
  const rotateY = useTransform(mouseX, [0, 1], [-10, 10]);
  const springRotateX = useSpring(rotateX, { stiffness: 50, damping: 20 });
  const springRotateY = useSpring(rotateY, { stiffness: 50, damping: 20 });

  return (
    <motion.div
      className="relative w-64 h-64 md:w-80 md:h-80 lg:w-96 lg:h-96"
      style={{
        rotateX: springRotateX,
        rotateY: springRotateY,
        transformStyle: "preserve-3d",
        perspective: 1000,
      }}
    >
      {/* Outer ring */}
      <motion.div
        className="absolute inset-0 rounded-full border-2 border-primary/20"
        animate={{ rotate: 360 }}
        transition={{ duration: 30, repeat: Infinity, ease: "linear" }}
      />
      
      {/* Middle ring */}
      <motion.div
        className="absolute inset-6 md:inset-8 rounded-full border-2 border-accent/30"
        animate={{ rotate: -360 }}
        transition={{ duration: 25, repeat: Infinity, ease: "linear" }}
      />
      
      {/* Inner glow core */}
      <motion.div
        className="absolute inset-12 md:inset-16 rounded-full bg-gradient-to-br from-primary/10 via-accent/10 to-primary/5 backdrop-blur-sm"
        animate={{ 
          scale: [1, 1.05, 1],
          opacity: [0.6, 0.8, 0.6]
        }}
        transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
      />
      
      {/* Center element */}
      <motion.div
        className="absolute inset-0 flex items-center justify-center"
        animate={{ rotate: 360 }}
        transition={{ duration: 60, repeat: Infinity, ease: "linear" }}
      >
        <div className="relative">
          {/* Hexagon-like shape with gradients */}
          <motion.div
            className="w-24 h-24 md:w-32 md:h-32 bg-gradient-to-br from-primary via-accent to-primary rounded-3xl shadow-2xl shadow-primary/20"
            style={{ transform: "rotate(45deg)" }}
            animate={{ 
              boxShadow: [
                "0 25px 50px -12px hsl(var(--primary) / 0.2)",
                "0 25px 50px -12px hsl(var(--primary) / 0.4)",
                "0 25px 50px -12px hsl(var(--primary) / 0.2)",
              ]
            }}
            transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
          />
          
          {/* Icon overlay */}
          <div className="absolute inset-0 flex items-center justify-center">
            <Sparkles className="w-10 h-10 md:w-12 md:h-12 text-white drop-shadow-lg" style={{ transform: "rotate(-45deg)" }} />
          </div>
        </div>
      </motion.div>

      {/* Orbiting elements */}
      {[0, 1, 2].map((i) => (
        <motion.div
          key={i}
          className="absolute w-3 h-3 md:w-4 md:h-4 rounded-full bg-gradient-to-r from-primary to-accent shadow-lg"
          style={{
            top: "50%",
            left: "50%",
            marginTop: "-6px",
            marginLeft: "-6px",
          }}
          animate={{
            rotate: 360,
            x: [0, Math.cos((i * 2 * Math.PI) / 3) * 120, 0],
            y: [0, Math.sin((i * 2 * Math.PI) / 3) * 120, 0],
          }}
          transition={{
            duration: 8,
            delay: i * 0.5,
            repeat: Infinity,
            ease: "linear",
          }}
        />
      ))}
    </motion.div>
  );
};

export const HeroSection = () => {
  const navigate = useNavigate();
  const containerRef = useRef<HTMLDivElement>(null);
  const mouseX = useMotionValue(0.5);
  const mouseY = useMotionValue(0.5);

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

  // Get visible hotspots based on admin settings
  const visibleHotspots = (sections || [])
    .filter((s) => s.is_visible && hotspotConfig[s.section_key as HotspotKey])
    .map((s) => ({
      key: s.section_key as HotspotKey,
      config: hotspotConfig[s.section_key as HotspotKey],
    }));

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

  const handleNavigate = (route: string) => {
    navigate(route);
  };

  return (
    <section
      ref={containerRef}
      className="relative min-h-[100vh] md:min-h-[90vh] flex items-center justify-center overflow-hidden bg-gradient-to-br from-background via-white to-secondary/30"
    >
      {/* Subtle Grid Pattern */}
      <div className="absolute inset-0">
        <div className="absolute inset-0 bg-[linear-gradient(to_right,hsl(var(--border))_1px,transparent_1px),linear-gradient(to_bottom,hsl(var(--border))_1px,transparent_1px)] bg-[size:60px_60px] opacity-30" />
      </div>

      {/* Soft Gradient Orbs */}
      <motion.div
        className="absolute top-1/4 left-1/4 w-96 h-96 bg-gradient-to-br from-primary/8 to-accent/5 rounded-full blur-3xl"
        animate={{
          scale: [1, 1.1, 1],
          opacity: [0.4, 0.6, 0.4],
        }}
        transition={{ duration: 8, repeat: Infinity }}
      />
      <motion.div
        className="absolute bottom-1/4 right-1/4 w-80 h-80 bg-gradient-to-br from-blue-200/20 to-purple-200/15 rounded-full blur-3xl"
        animate={{
          scale: [1.1, 1, 1.1],
          opacity: [0.3, 0.5, 0.3],
        }}
        transition={{ duration: 10, repeat: Infinity }}
      />

      {/* Floating Decorative Icons */}
      <FloatingIcon icon={Cpu} className="top-24 left-[5%]" delay={0} />
      <FloatingIcon icon={Cog} className="top-32 right-[6%]" delay={0.5} />
      <FloatingIcon icon={CircuitBoard} className="bottom-32 left-[8%]" delay={1} />

      {/* Interactive Hotspots (Desktop) */}
      {visibleHotspots.map((hotspot, index) => (
        <InteractiveHotspot
          key={hotspot.key}
          config={hotspot.config}
          index={index}
          onNavigate={handleNavigate}
          mouseX={mouseX}
          mouseY={mouseY}
        />
      ))}

      {/* Main Content */}
      <div className="relative z-10 max-w-7xl mx-auto px-4 w-full">
        <div className="flex flex-col lg:flex-row items-center justify-between gap-12 lg:gap-8">
          {/* Left - Brand Message */}
          <motion.div
            className="flex-1 text-center lg:text-left max-w-xl lg:max-w-lg"
            initial={{ opacity: 0, x: -30 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.8 }}
          >
            <motion.span
              className="inline-block px-4 py-2 mb-6 text-sm font-semibold rounded-full bg-primary/10 text-primary border border-primary/20"
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.2 }}
            >
              🚀 Engineering the Future
            </motion.span>

            <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-bold leading-tight mb-6">
              <span className="text-foreground">Engineering the Future</span>
              <br />
              <span className="bg-gradient-to-r from-primary via-accent to-primary bg-clip-text text-transparent">
                Through Innovation
              </span>
              <br />
              <span className="text-foreground">& Manufacturing</span>
            </h1>

            <motion.p
              className="text-lg sm:text-xl text-muted-foreground mb-8"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.4 }}
            >
              Design • Build • Manufacture • Deliver
            </motion.p>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.6 }}
            >
              <Button
                size="lg"
                className="text-lg px-8 py-6 bg-gradient-to-r from-primary to-accent text-primary-foreground hover:opacity-90 shadow-xl shadow-primary/20 transition-all duration-300 hover:shadow-2xl hover:shadow-primary/30 hover:scale-105"
                onClick={() => document.getElementById('about')?.scrollIntoView({ behavior: 'smooth' })}
              >
                Explore Solutions
                <ArrowRight className="w-5 h-5 ml-2" />
              </Button>
            </motion.div>
          </motion.div>

          {/* Center/Right - 3D Core Element */}
          <motion.div
            className="flex-1 flex items-center justify-center"
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.8, delay: 0.3 }}
          >
            <Core3DElement mouseX={mouseX} mouseY={mouseY} />
          </motion.div>
        </div>

        {/* Mobile Hotspots */}
        {visibleHotspots.length > 0 && (
          <motion.div
            className="mt-12 md:hidden space-y-3"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.8 }}
          >
            <p className="text-sm text-muted-foreground text-center mb-4 font-medium">
              Explore Our Divisions
            </p>
            {visibleHotspots.map((hotspot, index) => (
              <MobileHotspotButton
                key={hotspot.key}
                config={hotspot.config}
                index={index}
                onNavigate={handleNavigate}
              />
            ))}
          </motion.div>
        )}
      </div>

      {/* Scroll Indicator */}
      <motion.div
        className="absolute bottom-8 left-1/2 -translate-x-1/2 hidden md:flex"
        animate={{ y: [0, 10, 0] }}
        transition={{ duration: 2, repeat: Infinity }}
      >
        <div className="w-6 h-10 rounded-full border-2 border-foreground/20 flex items-start justify-center p-2">
          <motion.div
            className="w-1.5 h-1.5 bg-primary rounded-full"
            animate={{ y: [0, 12, 0] }}
            transition={{ duration: 2, repeat: Infinity }}
          />
        </div>
      </motion.div>
    </section>
  );
};
