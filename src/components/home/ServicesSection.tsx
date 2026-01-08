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
    gradient: "from-orange-500 to-amber-500",
    lightGradient: "to-orange-50/40",
    dotColor: "bg-orange-500",
    shadowColor: "shadow-orange-500/20",
    badgeColor: "bg-orange-50 text-orange-700 border-orange-200",
    cta: "View Capabilities"
  },
  {
    icon: PenTool,
    category: "R&D DRIVEN",
    title: "Design & Product Development",
    description: "End-to-end product development from concept to production, including CAD design and engineering analysis.",
    features: ["CAD/CAM Design", "FEA Analysis", "Prototyping"],
    gradient: "from-blue-500 to-cyan-500",
    lightGradient: "to-blue-50/40",
    dotColor: "bg-blue-500",
    shadowColor: "shadow-blue-500/20",
    badgeColor: "bg-blue-50 text-blue-700 border-blue-200",
    cta: "Explore Process"
  },
  {
    icon: Plane,
    category: "AEROSPACE",
    title: "Drone Technology",
    description: "Custom industrial drone solutions for various applications including surveying, inspection, and delivery.",
    features: ["Custom Builds", "Payload Systems", "Autonomous Flight"],
    gradient: "from-purple-500 to-pink-500",
    lightGradient: "to-purple-50/40",
    dotColor: "bg-purple-500",
    shadowColor: "shadow-purple-500/20",
    badgeColor: "bg-purple-50 text-purple-700 border-purple-200",
    cta: "View Systems"
  }
];

export const ServicesSection = () => {
  const navigate = useNavigate();

  return (
    <section id="services-section" className="py-24 px-4 bg-slate-50 relative overflow-hidden">
      {/* Technical Grid Background */}
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#80808012_1px,transparent_1px),linear-gradient(to_bottom,#80808012_1px,transparent_1px)] bg-[size:24px_24px]" />
      <div className="absolute inset-0 bg-[radial-gradient(circle_800px_at_100%_200px,rgba(255,255,255,0.8),transparent)]" />
      
      <div className="max-w-7xl mx-auto relative z-10">
        <motion.div
          className="text-center mb-16"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
        >
          <span className="inline-block px-4 py-1.5 mb-4 text-xs font-bold tracking-wider uppercase rounded-full bg-primary/10 text-primary">
            Our Services
          </span>
          <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold text-slate-900 mb-4 tracking-tight">
            What We <span className="text-primary">Offer</span>
          </h2>
          <p className="text-slate-600 text-lg max-w-2xl mx-auto leading-relaxed">
            Comprehensive engineering and manufacturing solutions tailored to your needs
          </p>
        </motion.div>

        <div className="flex flex-col">
          {services.map((service, index) => (
            <motion.div
              key={service.title}
              className="group relative border-b border-slate-200 last:border-0"
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: index * 0.1 }}
            >
              {/* Hover Background Highlight */}
              <div className="absolute inset-0 bg-white/0 group-hover:bg-white/60 transition-colors duration-500 ease-out" />
              
              <div className="relative p-8 md:p-10 flex flex-col md:flex-row gap-8 items-start md:items-center">
                {/* Icon Section */}
                <div className="shrink-0">
                  <div className={`w-16 h-16 rounded-2xl bg-gradient-to-br ${service.gradient} flex items-center justify-center shadow-lg ${service.shadowColor} group-hover:scale-105 transition-transform duration-500`}>
                    <service.icon className="w-8 h-8 text-white" />
                  </div>
                </div>

                {/* Content Grid */}
                <div className="flex-grow grid grid-cols-1 lg:grid-cols-12 gap-6 items-center w-full">
                  
                  {/* Title & Description */}
                  <div className="lg:col-span-5 space-y-2">
                    <div className="flex items-center gap-3">
                      <h3 className="text-xl font-bold text-slate-900">{service.title}</h3>
                      <span className={`px-2.5 py-0.5 rounded text-[10px] font-bold tracking-widest border uppercase ${service.badgeColor} bg-opacity-50 hidden sm:inline-block`}>
                        {service.category}
                      </span>
                    </div>
                    <p className="text-slate-600 text-sm leading-relaxed max-w-lg">
                      {service.description}
                    </p>
                  </div>

                  {/* Capabilities List */}
                  <div className="lg:col-span-4">
                    <div className="flex flex-wrap gap-x-6 gap-y-2">
                      {service.features.map((feature) => (
                        <div key={feature} className="flex items-center gap-2 text-sm text-slate-700 font-medium whitespace-nowrap">
                          <div className={`w-1.5 h-1.5 rounded-full ${service.dotColor}`} />
                          {feature}
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* CTA */}
                  <div className="lg:col-span-3 flex justify-start lg:justify-end">
                    <Button
                      variant="ghost"
                      className="group/btn p-0 h-auto text-slate-900 hover:text-primary hover:bg-transparent font-semibold text-sm"
                      onClick={() => navigate("/engineering")}
                    >
                      {service.cta}
                      <ArrowRight className="w-4 h-4 ml-2 text-primary group-hover/btn:translate-x-1 transition-transform" />
                    </Button>
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
