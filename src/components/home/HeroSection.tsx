import { motion, useMotionValue, useTransform, useSpring, AnimatePresence } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { ArrowRight, ShoppingBag, Package, Printer, Cog, Box, ChevronDown } from "lucide-react";
import { useRef, useEffect, useState } from "react";
import logo from "@/assets/logo.png";

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

// Brand Logo with effects
const BrandLogo = ({ mouseX, mouseY }: { mouseX: any; mouseY: any }) => {
  const translateX = useTransform(mouseX, [0, 1], [-10, 10]);
  const translateY = useTransform(mouseY, [0, 1], [-10, 10]);
  const springX = useSpring(translateX, { stiffness: 50, damping: 30 });
  const springY = useSpring(translateY, { stiffness: 50, damping: 30 });

  return (
    <motion.div
      className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 pointer-events-none z-0"
      style={{ x: springX, y: springY }}
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
          className="absolute inset-0 blur-3xl"
          animate={{
            opacity: [0.15, 0.25, 0.15],
          }}
          transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
        >
          <div className="w-48 h-48 md:w-64 md:h-64 bg-gradient-radial from-primary/30 via-accent/20 to-transparent rounded-full" />
        </motion.div>
        
        {/* Logo */}
        <img 
          src={logo} 
          alt="Decouverts" 
          className="w-48 h-48 md:w-64 md:h-64 object-contain opacity-[0.08]"
        />
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
  const [hoveredSection, setHoveredSection] = useState<string | null>(null);
  const [ripples, setRipples] = useState<{ id: number; x: number; y: number }[]>([]);

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
          animate={{ scale: [1, 1.05, 1], opacity: [0.6, 0.8, 0.6] }}
          transition={{ duration: 6, repeat: Infinity }}
        />
      </div>

      {/* Background Particles */}
      <BackgroundParticles />

      {/* Brand Logo */}
      <BrandLogo mouseX={mouseX} mouseY={mouseY} />

      {/* 3D Engineering Core */}
      <EngineeringCore mouseX={mouseX} mouseY={mouseY} />

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
      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 lg:py-24">
        {/* Hero Headline */}
        <motion.div
          className="text-center mb-12 lg:mb-20"
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, ease: "easeOut" }}
        >
          <motion.h1 
            className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl xl:text-7xl font-bold leading-tight mb-4"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.1 }}
          >
            <motion.span 
              className="text-foreground inline-block"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.2 }}
            >
              Engineering the Future
            </motion.span>
            <br />
            <motion.span
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.3 }}
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
              transition={{ duration: 0.5, delay: 0.4 }}
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
          
          <motion.p 
            className="text-lg md:text-xl lg:text-2xl text-muted-foreground mt-6"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.5 }}
          >
            Design • Build • Manufacture • Deliver
          </motion.p>

          {/* Micro CTA */}
          <motion.p
            className="text-sm text-primary/70 mt-8 font-medium hidden md:block"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 1 }}
          >
            Explore Our Capabilities ↓
          </motion.p>

          {/* Mobile Tap Hint */}
          <MobileTapHint />
        </motion.div>

        {/* Three Areas Layout */}
        {visibleCount > 0 && (
          <motion.div
            className={`relative grid gap-6 lg:gap-0 ${
              visibleCount === 3
                ? "lg:grid-cols-3"
                : visibleCount === 2
                ? "lg:grid-cols-2"
                : "lg:grid-cols-1 max-w-xl mx-auto"
            }`}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.6, delay: 0.6 }}
          >
            {/* E-Commerce Section */}
            {ecommerceVisible && (
              <motion.div
                className="group relative cursor-pointer lg:px-8 py-8 lg:py-16 text-center lg:text-left lg:border-r lg:border-border/20 last:border-r-0 rounded-2xl transition-all duration-300 hover:bg-gradient-to-br hover:from-muted/30 hover:to-transparent"
                onClick={(e) => {
                  e.stopPropagation();
                  navigate("/shop");
                }}
                onMouseEnter={() => setHoveredSection("ecommerce")}
                onMouseLeave={() => setHoveredSection(null)}
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.7 }}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
              >
                <HoverLabel text="Shop Premium Products" isVisible={hoveredSection === "ecommerce"} />
                
                {/* 3D Icons */}
                <Interactive3DIcon icon={ShoppingBag} className="top-0 right-4 lg:right-8 hidden lg:block" delay={0} rotateOnHover />
                <Interactive3DIcon icon={Package} className="bottom-2 left-2 lg:left-4 hidden lg:block" delay={0.3} />
                <Interactive3DIcon icon={Box} className="top-1/2 right-2 hidden lg:block" delay={0.6} />
                
                <motion.h2 
                  className="text-2xl md:text-3xl lg:text-4xl font-bold text-foreground mb-3 group-hover:text-primary transition-colors duration-300"
                >
                  E-Commerce
                </motion.h2>
                <p className="text-lg text-muted-foreground mb-4">
                  Section
                </p>
                <motion.div 
                  className="flex items-center justify-center lg:justify-start gap-2 text-primary"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: hoveredSection === "ecommerce" ? 1 : 0 }}
                  transition={{ duration: 0.2 }}
                >
                  <span className="text-sm font-medium">Shop Now</span>
                  <ArrowRight className="w-4 h-4" />
                </motion.div>
              </motion.div>
            )}

            {/* Engineering Services Section */}
            {engineeringVisible && (
              <motion.div
                className="group relative cursor-pointer lg:px-8 py-8 lg:py-16 text-center lg:border-r lg:border-border/20 last:border-r-0 rounded-2xl transition-all duration-300 hover:bg-gradient-to-br hover:from-muted/30 hover:to-transparent"
                onClick={(e) => {
                  e.stopPropagation();
                  navigate("/engineering");
                }}
                onMouseEnter={() => setHoveredSection("engineering")}
                onMouseLeave={() => setHoveredSection(null)}
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.8 }}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
              >
                <HoverLabel text="Custom Engineering Solutions" isVisible={hoveredSection === "engineering"} />
                
                <motion.h2 
                  className="text-2xl md:text-3xl lg:text-4xl font-bold text-foreground mb-3 group-hover:text-primary transition-colors duration-300"
                >
                  Engineering Services
                </motion.h2>
                <p className="text-lg text-muted-foreground mb-1">
                  Mechanical Engineering NPD
                </p>
                <motion.div 
                  className="flex items-center justify-center gap-2 text-primary mt-4"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: hoveredSection === "engineering" ? 1 : 0 }}
                  transition={{ duration: 0.2 }}
                >
                  <span className="text-sm font-medium">Learn More</span>
                  <ArrowRight className="w-4 h-4" />
                </motion.div>
              </motion.div>
            )}

            {/* Manufacturing Section */}
            {manufacturingVisible && (
              <motion.div
                className="group relative cursor-pointer lg:px-8 py-8 lg:py-16 text-center lg:text-right rounded-2xl transition-all duration-300 hover:bg-gradient-to-br hover:from-muted/30 hover:to-transparent"
                onClick={(e) => {
                  e.stopPropagation();
                  navigate("/manufacturing");
                }}
                onMouseEnter={() => setHoveredSection("manufacturing")}
                onMouseLeave={() => setHoveredSection(null)}
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.9 }}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
              >
                <HoverLabel text="Advanced Manufacturing" isVisible={hoveredSection === "manufacturing"} />
                
                {/* 3D Icons */}
                <Interactive3DIcon icon={Printer} className="top-0 left-4 lg:left-8 hidden lg:block" delay={0.2} />
                <motion.div
                  className="absolute bottom-2 right-2 lg:right-4 pointer-events-none hidden lg:block"
                  animate={{ x: [0, 5, 0] }}
                  transition={{ duration: 3, repeat: Infinity }}
                >
                  <div className="p-4 rounded-2xl bg-white/80 backdrop-blur-md shadow-lg border border-border/40">
                    <svg className="w-6 h-6 text-primary/70" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                      <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5" />
                    </svg>
                  </div>
                </motion.div>
                
                <motion.h2 
                  className="text-2xl md:text-3xl lg:text-4xl font-bold text-foreground mb-3 group-hover:text-primary transition-colors duration-300"
                >
                  Manufacturing
                </motion.h2>
                <p className="text-lg text-muted-foreground mb-1">
                  Custom Industrial Printers
                </p>
                <p className="text-lg text-muted-foreground mb-4">
                  Industrial Custom Drones
                </p>
                <motion.div 
                  className="flex items-center justify-center lg:justify-end gap-2 text-primary"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: hoveredSection === "manufacturing" ? 1 : 0 }}
                  transition={{ duration: 0.2 }}
                >
                  <span className="text-sm font-medium">Explore</span>
                  <ArrowRight className="w-4 h-4" />
                </motion.div>
              </motion.div>
            )}
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
  );
};
