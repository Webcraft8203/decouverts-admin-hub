import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { ArrowRight } from "lucide-react";

export const HeroSection = () => {
  const navigate = useNavigate();

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
    <section className="min-h-[80vh] bg-background">
      {/* Main Hero Canvas */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 lg:py-20">
        {/* Hero Headline */}
        <motion.div
          className="text-center mb-16"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
        >
          <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-bold leading-tight mb-4">
            <span className="text-foreground">Engineering the Future</span>
            <br />
            <span className="text-foreground">Through </span>
            <span className="text-primary">Innovation</span>
            <br />
            <span className="text-foreground">& </span>
            <span className="text-primary">Manufacturing</span>
          </h1>
          <p className="text-lg md:text-xl text-muted-foreground mt-6">
            Design • Build • Manufacture • Deliver
          </p>
        </motion.div>

        {/* Three Areas Layout */}
        {visibleCount > 0 && (
          <motion.div
            className={`grid gap-8 lg:gap-0 ${
              visibleCount === 3
                ? "lg:grid-cols-3"
                : visibleCount === 2
                ? "lg:grid-cols-2"
                : "lg:grid-cols-1 max-w-xl mx-auto"
            }`}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.6, delay: 0.2 }}
          >
            {/* E-Commerce Section */}
            {ecommerceVisible && (
              <motion.div
                className="group cursor-pointer lg:px-8 py-8 lg:py-12 text-center lg:text-left lg:border-r lg:border-border/30 last:border-r-0"
                onClick={() => navigate("/shop")}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.3 }}
                whileHover={{ backgroundColor: "hsl(var(--muted) / 0.3)" }}
              >
                <h2 className="text-2xl md:text-3xl lg:text-4xl font-bold text-foreground mb-3 group-hover:text-primary transition-colors duration-300">
                  E-Commerce
                </h2>
                <p className="text-lg text-muted-foreground mb-4">
                  Section
                </p>
                <div className="flex items-center justify-center lg:justify-start gap-2 text-primary opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                  <span className="text-sm font-medium">Shop Now</span>
                  <ArrowRight className="w-4 h-4" />
                </div>
              </motion.div>
            )}

            {/* Engineering Services Section */}
            {engineeringVisible && (
              <motion.div
                className="group cursor-pointer lg:px-8 py-8 lg:py-12 text-center lg:border-r lg:border-border/30 last:border-r-0"
                onClick={() => navigate("/engineering")}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.4 }}
                whileHover={{ backgroundColor: "hsl(var(--muted) / 0.3)" }}
              >
                <h2 className="text-2xl md:text-3xl lg:text-4xl font-bold text-foreground mb-3 group-hover:text-primary transition-colors duration-300">
                  Engineering Services
                </h2>
                <p className="text-lg text-muted-foreground mb-1">
                  Mechanical Engineering NPD
                </p>
                <div className="flex items-center justify-center gap-2 text-primary opacity-0 group-hover:opacity-100 transition-opacity duration-300 mt-4">
                  <span className="text-sm font-medium">Learn More</span>
                  <ArrowRight className="w-4 h-4" />
                </div>
              </motion.div>
            )}

            {/* Manufacturing Section */}
            {manufacturingVisible && (
              <motion.div
                className="group cursor-pointer lg:px-8 py-8 lg:py-12 text-center lg:text-right"
                onClick={() => navigate("/manufacturing")}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.5 }}
                whileHover={{ backgroundColor: "hsl(var(--muted) / 0.3)" }}
              >
                <h2 className="text-2xl md:text-3xl lg:text-4xl font-bold text-foreground mb-3 group-hover:text-primary transition-colors duration-300">
                  Manufacturing
                </h2>
                <p className="text-lg text-muted-foreground mb-1">
                  Custom Industrial Printers
                </p>
                <p className="text-lg text-muted-foreground mb-4">
                  Industrial Custom Drones
                </p>
                <div className="flex items-center justify-center lg:justify-end gap-2 text-primary opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                  <span className="text-sm font-medium">Explore</span>
                  <ArrowRight className="w-4 h-4" />
                </div>
              </motion.div>
            )}
          </motion.div>
        )}
      </div>
    </section>
  );
};
