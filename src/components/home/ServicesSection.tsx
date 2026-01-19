import { motion } from "framer-motion";
import { Printer, PenTool, Plane, ArrowRight } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";

const services = [
  {
    icon: Printer,
    category: "INDUSTRIAL",
    title: "Advanced 3D Printing Systems",
    description: "State-of-the-art industrial 3D printing solutions for rapid prototyping and production manufacturing.",
    features: ["FDM & SLA Technology", "Large Format Printing", "Multi-Material Support"],
    gradient: "from-primary to-accent",
    iconBg: "bg-primary/10",
    iconColor: "text-primary",
    cta: "View Capabilities"
  },
  {
    icon: PenTool,
    category: "R&D DRIVEN",
    title: "Design & Product Development",
    description: "End-to-end product development from concept to production, including CAD design and engineering analysis.",
    features: ["CAD/CAM Design", "FEA Analysis", "Prototyping"],
    gradient: "from-blue-500 to-cyan-500",
    iconBg: "bg-blue-500/10",
    iconColor: "text-blue-500",
    cta: "Explore Process"
  },
  {
    icon: Plane,
    category: "AEROSPACE",
    title: "Drone Technology",
    description: "Custom industrial drone solutions for various applications including surveying, inspection, and delivery.",
    features: ["Custom Builds", "Payload Systems", "Autonomous Flight"],
    gradient: "from-purple-500 to-pink-500",
    iconBg: "bg-purple-500/10",
    iconColor: "text-purple-500",
    cta: "View Systems"
  }
];

export const ServicesSection = () => {
  const navigate = useNavigate();

  return (
    <section id="services-section" className="py-20 md:py-28 px-4 bg-background relative overflow-hidden">
      {/* Subtle grid background */}
      <div className="absolute inset-0 bg-grid-light opacity-50" />
      <div className="absolute inset-0 bg-gradient-to-b from-background via-transparent to-background" />
      
      <div className="max-w-7xl mx-auto relative z-10">
        <motion.div
          className="text-center mb-16"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
        >
          <span className="inline-block px-4 py-2 mb-4 text-xs font-bold tracking-[0.2em] uppercase rounded-full bg-primary/10 text-primary border border-primary/20">
            Our Services
          </span>
          <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold text-foreground mb-4">
            What We <span className="text-primary">Offer</span>
          </h2>
          <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
            Comprehensive engineering and manufacturing solutions tailored to your needs
          </p>
        </motion.div>

        <div className="space-y-4">
          {services.map((service, index) => (
            <motion.div
              key={service.title}
              className="group"
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: index * 0.1 }}
            >
              <div className="relative bg-card border border-border rounded-2xl overflow-hidden hover:border-primary/30 hover:shadow-xl transition-all duration-500">
                {/* Hover gradient background */}
                <div className="absolute inset-0 bg-gradient-to-r from-primary/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                
                <div className="relative p-6 md:p-8 flex flex-col md:flex-row gap-6 items-start md:items-center">
                  {/* Icon Section */}
                  <div className="shrink-0">
                    <div className={`w-14 h-14 md:w-16 md:h-16 rounded-2xl bg-gradient-to-br ${service.gradient} flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform duration-500`}>
                      <service.icon className="w-7 h-7 md:w-8 md:h-8 text-white" />
                    </div>
                  </div>

                  {/* Content Grid */}
                  <div className="flex-grow grid grid-cols-1 lg:grid-cols-12 gap-4 md:gap-6 items-center w-full">
                    
                    {/* Title & Description */}
                    <div className="lg:col-span-5 space-y-2">
                      <div className="flex items-center gap-3 flex-wrap">
                        <h3 className="text-lg md:text-xl font-bold text-foreground group-hover:text-primary transition-colors">
                          {service.title}
                        </h3>
                        <span className={`px-2.5 py-1 rounded-md text-[10px] font-bold tracking-widest border ${service.iconBg} ${service.iconColor} hidden sm:inline-block`}>
                          {service.category}
                        </span>
                      </div>
                      <p className="text-muted-foreground text-sm leading-relaxed max-w-lg">
                        {service.description}
                      </p>
                    </div>

                    {/* Capabilities List */}
                    <div className="lg:col-span-4">
                      <div className="flex flex-wrap gap-2">
                        {service.features.map((feature) => (
                          <span 
                            key={feature} 
                            className="px-3 py-1.5 rounded-lg bg-secondary text-foreground text-xs font-medium"
                          >
                            {feature}
                          </span>
                        ))}
                      </div>
                    </div>

                    {/* CTA */}
                    <div className="lg:col-span-3 flex justify-start lg:justify-end">
                      <Button
                        variant="ghost"
                        className="group/btn p-0 h-auto text-foreground hover:text-primary hover:bg-transparent font-semibold text-sm"
                        onClick={() => navigate("/engineering")}
                      >
                        {service.cta}
                        <ArrowRight className="w-4 h-4 ml-2 group-hover/btn:translate-x-1 transition-transform" />
                      </Button>
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
};