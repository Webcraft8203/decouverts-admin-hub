import { motion, useMotionValue, useTransform, useSpring } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { ArrowRight, ShoppingBag, Package, Printer, Plane } from "lucide-react";
import { useRef, useEffect } from "react";

// Floating Engineering Icon Component
const FloatingIcon = ({ 
  icon: Icon, 
  className, 
  delay = 0,
  direction = "vertical"
}: { 
  icon: React.ElementType; 
  className: string; 
  delay?: number;
  direction?: "vertical" | "horizontal";
}) => (
  <motion.div
    className={`absolute ${className} hidden lg:block pointer-events-none`}
    initial={{ opacity: 0 }}
    animate={{ 
      opacity: [0.4, 0.6, 0.4],
      y: direction === "vertical" ? [0, -8, 0] : 0,
      x: direction === "horizontal" ? [0, 6, 0] : 0,
    }}
    transition={{
      duration: 4,
      delay,
      repeat: Infinity,
      ease: "easeInOut"
    }}
  >
    <div className="p-3 rounded-xl bg-white/60 backdrop-blur-sm shadow-sm border border-border/30">
      <Icon className="w-5 h-5 text-primary/50" />
    </div>
  </motion.div>
);

// 3D Engineering Core Element
const EngineeringCore = ({ mouseX, mouseY }: { mouseX: any; mouseY: any }) => {
  const rotateX = useTransform(mouseY, [0, 1], [8, -8]);
  const rotateY = useTransform(mouseX, [0, 1], [-8, 8]);
  const springRotateX = useSpring(rotateX, { stiffness: 50, damping: 25 });
  const springRotateY = useSpring(rotateY, { stiffness: 50, damping: 25 });

  return (
    <motion.div
      className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-64 h-64 md:w-80 md:h-80 pointer-events-none hidden md:block"
      style={{
        rotateX: springRotateX,
        rotateY: springRotateY,
        transformStyle: "preserve-3d",
        perspective: 1000,
      }}
    >
      {/* Outer ring */}
      <motion.div
        className="absolute inset-0 rounded-full border border-primary/10"
        animate={{ rotate: 360 }}
        transition={{ duration: 40, repeat: Infinity, ease: "linear" }}
      />
      
      {/* Middle ring */}
      <motion.div
        className="absolute inset-8 rounded-full border border-accent/15"
        animate={{ rotate: -360 }}
        transition={{ duration: 30, repeat: Infinity, ease: "linear" }}
      />
      
      {/* Inner glow */}
      <motion.div
        className="absolute inset-16 rounded-full bg-gradient-to-br from-primary/5 via-accent/5 to-transparent"
        animate={{ 
          scale: [1, 1.08, 1],
          opacity: [0.4, 0.6, 0.4]
        }}
        transition={{ duration: 5, repeat: Infinity, ease: "easeInOut" }}
      />
      
      {/* Center cube shape */}
      <motion.div
        className="absolute inset-0 flex items-center justify-center"
        animate={{ rotate: 360 }}
        transition={{ duration: 60, repeat: Infinity, ease: "linear" }}
      >
        <motion.div
          className="w-16 h-16 md:w-20 md:h-20 bg-gradient-to-br from-primary/20 via-accent/15 to-primary/10 rounded-2xl shadow-lg shadow-primary/5"
          style={{ transform: "rotate(45deg)" }}
          animate={{ 
            scale: [1, 1.05, 1],
          }}
          transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
        />
      </motion.div>

      {/* Orbiting dots */}
      {[0, 1, 2].map((i) => (
        <motion.div
          key={i}
          className="absolute w-2 h-2 rounded-full bg-primary/30"
          style={{
            top: "50%",
            left: "50%",
            marginTop: "-4px",
            marginLeft: "-4px",
          }}
          animate={{
            x: [0, Math.cos((i * 2 * Math.PI) / 3) * 100, 0],
            y: [0, Math.sin((i * 2 * Math.PI) / 3) * 100, 0],
            opacity: [0.3, 0.6, 0.3],
          }}
          transition={{
            duration: 10,
            delay: i * 0.8,
            repeat: Infinity,
            ease: "easeInOut",
          }}
        />
      ))}
    </motion.div>
  );
};

// Background particles
const BackgroundParticles = () => (
  <div className="absolute inset-0 overflow-hidden pointer-events-none">
    {[...Array(20)].map((_, i) => (
      <motion.div
        key={i}
        className="absolute w-1 h-1 rounded-full bg-primary/20"
        style={{
          left: `${Math.random() * 100}%`,
          top: `${Math.random() * 100}%`,
        }}
        animate={{
          y: [0, -30, 0],
          opacity: [0.2, 0.5, 0.2],
        }}
        transition={{
          duration: 6 + Math.random() * 4,
          delay: Math.random() * 3,
          repeat: Infinity,
          ease: "easeInOut",
        }}
      />
    ))}
  </div>
);

export const HeroSection = () => {
  const navigate = useNavigate();
  const containerRef = useRef<HTMLDivElement>(null);
  const mouseX = useMotionValue(0.5);
  const mouseY = useMotionValue(0.5);

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
      className="relative min-h-[80vh] bg-background overflow-hidden"
    >
      {/* Blueprint Grid Pattern */}
      <div className="absolute inset-0">
        <div className="absolute inset-0 bg-[linear-gradient(to_right,hsl(var(--primary)/0.03)_1px,transparent_1px),linear-gradient(to_bottom,hsl(var(--primary)/0.03)_1px,transparent_1px)] bg-[size:40px_40px]" />
      </div>

      {/* Radial Light Behind Center */}
      <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
        <div className="w-[600px] h-[600px] bg-gradient-radial from-primary/5 via-transparent to-transparent rounded-full blur-3xl" />
      </div>

      {/* Background Particles */}
      <BackgroundParticles />

      {/* 3D Engineering Core */}
      <EngineeringCore mouseX={mouseX} mouseY={mouseY} />

      {/* Main Content */}
      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 lg:py-20">
        {/* Hero Headline */}
        <motion.div
          className="text-center mb-16"
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, ease: "easeOut" }}
        >
          <motion.h1 
            className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-bold leading-tight mb-4"
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
              <span className="text-primary relative group cursor-default">
                Innovation
                <motion.span 
                  className="absolute inset-0 bg-gradient-to-r from-primary/0 via-white/30 to-primary/0"
                  animate={{ x: ["-100%", "100%"] }}
                  transition={{ duration: 3, repeat: Infinity, repeatDelay: 2 }}
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
              <span className="text-primary relative group cursor-default">
                Manufacturing
                <motion.span 
                  className="absolute inset-0 bg-gradient-to-r from-primary/0 via-white/30 to-primary/0"
                  animate={{ x: ["-100%", "100%"] }}
                  transition={{ duration: 3, delay: 1.5, repeat: Infinity, repeatDelay: 2 }}
                />
              </span>
            </motion.span>
          </motion.h1>
          <motion.p 
            className="text-lg md:text-xl text-muted-foreground mt-6"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.5 }}
          >
            Design • Build • Manufacture • Deliver
          </motion.p>
        </motion.div>

        {/* Three Areas Layout */}
        {visibleCount > 0 && (
          <motion.div
            className={`relative grid gap-8 lg:gap-0 ${
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
                className="group relative cursor-pointer lg:px-8 py-8 lg:py-12 text-center lg:text-left lg:border-r lg:border-border/20 last:border-r-0 rounded-xl transition-colors duration-300 hover:bg-muted/20"
                onClick={() => navigate("/shop")}
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.7 }}
                whileHover={{ scale: 1.01 }}
              >
                {/* Floating Icons */}
                <FloatingIcon icon={ShoppingBag} className="top-2 right-8" delay={0} />
                <FloatingIcon icon={Package} className="bottom-4 left-4" delay={0.5} direction="horizontal" />
                
                <motion.h2 
                  className="text-2xl md:text-3xl lg:text-4xl font-bold text-foreground mb-3 group-hover:text-primary transition-colors duration-300"
                  whileHover={{ scale: 1.02 }}
                >
                  E-Commerce
                </motion.h2>
                <p className="text-lg text-muted-foreground mb-4">
                  Section
                </p>
                <motion.div 
                  className="flex items-center justify-center lg:justify-start gap-2 text-primary"
                  initial={{ opacity: 0, x: -10 }}
                  whileHover={{ x: 5 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.3 }}
                >
                  <span className="text-sm font-medium opacity-0 group-hover:opacity-100 transition-opacity duration-300">Shop Now</span>
                  <ArrowRight className="w-4 h-4 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                </motion.div>
              </motion.div>
            )}

            {/* Engineering Services Section */}
            {engineeringVisible && (
              <motion.div
                className="group relative cursor-pointer lg:px-8 py-8 lg:py-12 text-center lg:border-r lg:border-border/20 last:border-r-0 rounded-xl transition-colors duration-300 hover:bg-muted/20"
                onClick={() => navigate("/engineering")}
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.8 }}
                whileHover={{ scale: 1.01 }}
              >
                <motion.h2 
                  className="text-2xl md:text-3xl lg:text-4xl font-bold text-foreground mb-3 group-hover:text-primary transition-colors duration-300"
                  whileHover={{ scale: 1.02 }}
                >
                  Engineering Services
                </motion.h2>
                <p className="text-lg text-muted-foreground mb-1">
                  Mechanical Engineering NPD
                </p>
                <motion.div 
                  className="flex items-center justify-center gap-2 text-primary mt-4"
                  initial={{ opacity: 0, x: -10 }}
                  whileHover={{ x: 5 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.3 }}
                >
                  <span className="text-sm font-medium opacity-0 group-hover:opacity-100 transition-opacity duration-300">Learn More</span>
                  <ArrowRight className="w-4 h-4 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                </motion.div>
              </motion.div>
            )}

            {/* Manufacturing Section */}
            {manufacturingVisible && (
              <motion.div
                className="group relative cursor-pointer lg:px-8 py-8 lg:py-12 text-center lg:text-right rounded-xl transition-colors duration-300 hover:bg-muted/20"
                onClick={() => navigate("/manufacturing")}
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.9 }}
                whileHover={{ scale: 1.01 }}
              >
                {/* Floating Icons */}
                <FloatingIcon icon={Printer} className="top-2 left-8" delay={0.3} direction="horizontal" />
                <FloatingIcon icon={Plane} className="bottom-4 right-4" delay={0.8} />
                
                <motion.h2 
                  className="text-2xl md:text-3xl lg:text-4xl font-bold text-foreground mb-3 group-hover:text-primary transition-colors duration-300"
                  whileHover={{ scale: 1.02 }}
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
                  initial={{ opacity: 0, x: -10 }}
                  whileHover={{ x: 5 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.3 }}
                >
                  <span className="text-sm font-medium opacity-0 group-hover:opacity-100 transition-opacity duration-300">Explore</span>
                  <ArrowRight className="w-4 h-4 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                </motion.div>
              </motion.div>
            )}
          </motion.div>
        )}
      </div>

      {/* Scroll Indicator */}
      <motion.div
        className="absolute bottom-6 left-1/2 -translate-x-1/2 hidden md:flex"
        animate={{ y: [0, 8, 0] }}
        transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
      >
        <div className="w-5 h-9 rounded-full border-2 border-foreground/15 flex items-start justify-center p-1.5">
          <motion.div
            className="w-1 h-1 bg-primary/60 rounded-full"
            animate={{ y: [0, 12, 0] }}
            transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
          />
        </div>
      </motion.div>
    </section>
  );
};
