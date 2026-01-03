import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { ShoppingBag, Wrench, Factory, Printer, Plane, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";

const sectionConfig = {
  ecommerce: {
    title: "E-Commerce",
    subtitle: "Shop Premium Products",
    description: "Browse our curated collection of engineering tools, components, and innovative products.",
    icon: ShoppingBag,
    route: "/shop",
    cta: "Shop Now",
    gradient: "from-orange-500 to-amber-500",
    bgColor: "bg-orange-50"
  },
  engineering: {
    title: "Engineering Services",
    subtitle: "Mechanical Engineering NPD",
    description: "From concept to production, we provide comprehensive engineering solutions for new product development.",
    icon: Wrench,
    route: "/engineering",
    cta: "Learn More",
    gradient: "from-blue-500 to-cyan-500",
    bgColor: "bg-blue-50"
  },
  manufacturing: {
    title: "Manufacturing",
    subtitle: "Industrial Solutions",
    description: "Custom industrial printers and drones designed for modern manufacturing needs.",
    icon: Factory,
    route: "/manufacturing",
    cta: "Explore",
    gradient: "from-purple-500 to-pink-500",
    bgColor: "bg-purple-50",
    subCards: [
      { title: "Custom Industrial Printers", icon: Printer },
      { title: "Industrial Custom Drones", icon: Plane }
    ]
  }
};

type SectionKey = keyof typeof sectionConfig;

export const BusinessSections = () => {
  const navigate = useNavigate();

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

  const visibleSections = sections?.filter((s) => s.is_visible) || [];
  
  if (visibleSections.length === 0) return null;

  const getGridClasses = () => {
    switch (visibleSections.length) {
      case 3:
        return "lg:grid-cols-3";
      case 2:
        return "lg:grid-cols-2 max-w-4xl mx-auto";
      case 1:
        return "max-w-xl mx-auto";
      default:
        return "";
    }
  };

  return (
    <section className="py-24 px-4 bg-gradient-to-b from-white to-secondary/20 relative overflow-hidden">
      <div className="max-w-7xl mx-auto relative z-10">
        <motion.div
          className="text-center mb-16"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
        >
          <span className="inline-block px-4 py-2 mb-4 text-sm font-semibold rounded-full bg-primary/10 text-primary">
            Our Business
          </span>
          <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold text-foreground">
            Explore Our <span className="text-primary">Divisions</span>
          </h2>
        </motion.div>

        <div className={`grid grid-cols-1 ${getGridClasses()} gap-6`}>
          {visibleSections.map((section, index) => {
            const config = sectionConfig[section.section_key as SectionKey];
            if (!config) return null;

            return (
              <motion.div
                key={section.id}
                className={`group relative rounded-3xl overflow-hidden border border-border ${config.bgColor} hover:shadow-2xl transition-all duration-500`}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: index * 0.1 }}
                whileHover={{ y: -8 }}
              >
                <div className="relative z-10 p-8">
                  {/* Icon */}
                  <div className={`w-16 h-16 rounded-2xl bg-gradient-to-br ${config.gradient} flex items-center justify-center mb-6 shadow-lg group-hover:scale-110 transition-transform duration-300`}>
                    <config.icon className="w-8 h-8 text-white" />
                  </div>

                  {/* Content */}
                  <h3 className="text-2xl font-bold text-foreground mb-2">{config.title}</h3>
                  <p className="text-primary font-medium mb-3">{config.subtitle}</p>
                  <p className="text-muted-foreground mb-6">{config.description}</p>

                  {/* Sub Cards for Manufacturing */}
                  {'subCards' in config && config.subCards && (
                    <div className="space-y-3 mb-6">
                      {config.subCards.map((subCard) => (
                        <div
                          key={subCard.title}
                          className="flex items-center gap-3 p-3 rounded-xl bg-white border border-border shadow-sm"
                        >
                          <subCard.icon className="w-5 h-5 text-primary" />
                          <span className="text-sm font-medium text-foreground">{subCard.title}</span>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* CTA */}
                  <Button
                    className={`w-full bg-gradient-to-r ${config.gradient} text-white hover:opacity-90 transition-opacity group/btn shadow-lg`}
                    onClick={() => navigate(config.route)}
                  >
                    {config.cta}
                    <ArrowRight className="w-4 h-4 ml-2 group-hover/btn:translate-x-1 transition-transform" />
                  </Button>
                </div>
              </motion.div>
            );
          })}
        </div>
      </div>
    </section>
  );
};
