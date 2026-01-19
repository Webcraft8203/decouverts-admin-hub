import { motion, AnimatePresence } from "framer-motion";
import { Printer, PenTool, Plane, ArrowRight, X, CheckCircle2, Settings, Cpu, Search, FileText, Zap, BarChart3, ChevronRight } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { useState, useEffect } from "react";

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
    cta: "View Capabilities",
    details: {
      badge: "Industrial",
      subtitle: "Industrial-grade additive manufacturing solutions",
      overview: "Our industrial 3D printing capabilities bridge the gap between prototyping and mass production. We utilize advanced FDM and SLA technologies to deliver high-precision, durable parts suitable for functional testing and end-use applications.",
      capabilitiesTitle: "Capabilities",
      capabilities: [
        "FDM & SLA Technology",
        "Large Format Printing",
        "Multi-Material Support",
        "High-Precision Output",
        "Production-Ready Machines"
      ],
      processTitle: "Process Flow",
      processSteps: [
        "Requirement Analysis",
        "Material & Technology Selection",
        "Printing & Calibration",
        "Post-Processing",
        "Quality Validation"
      ],
      primaryCta: "Explore 3D Printers",
      primaryPath: "/printer-configuration",
      secondaryCta: "Talk to Manufacturing Expert"
    }
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
    cta: "Explore Process",
    details: {
      badge: "R&D Driven",
      subtitle: "From concept to production-ready design",
      overview: "We provide a comprehensive product development lifecycle, transforming abstract ideas into manufacturable realities through rigorous engineering, simulation, and iterative design optimization.",
      capabilitiesTitle: "Core Services",
      capabilities: [
        "CAD/CAM Design",
        "FEA Analysis",
        "Prototyping",
        "Design for Manufacturing (DFM)"
      ],
      processTitle: "Process Timeline",
      processSteps: [
        "Ideation & Requirement Definition",
        "CAD/CAM Design",
        "FEA & Simulation",
        "Prototype Development",
        "Design Optimization",
        "Manufacturing Readiness"
      ],
      primaryCta: "Start a Project",
      primaryPath: "/contact",
      secondaryCta: "Consult R&D Team"
    }
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
    cta: "View Systems",
    details: {
      badge: "Aerospace",
      subtitle: "Custom industrial drone solutions",
      overview: "Our drone technology division specializes in building custom aerial platforms tailored for specific industrial applications, from heavy-lift logistics to precision surveillance and mapping.",
      capabilitiesTitle: "Systems & Capabilities",
      capabilities: [
        "Custom Drone Builds",
        "Payload Integration",
        "Autonomous Flight Systems",
        "Surveillance & Inspection",
        "Delivery & Mapping"
      ],
      processTitle: "Development Workflow",
      processSteps: [
        "Use Case Analysis",
        "Airframe & Payload Design",
        "Electronics & Control Systems",
        "Flight Testing",
        "Deployment & Support"
      ],
      primaryCta: "Request Drone Solution",
      primaryPath: "/drone-configuration",
      secondaryCta: "View Drone Configurations"
    }
  }
];

const ServiceModal = ({ service, onClose }: { service: typeof services[0], onClose: () => void }) => {
  const navigate = useNavigate();

  useEffect(() => {
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", handleEsc);
    document.body.style.overflow = "hidden";
    return () => {
      window.removeEventListener("keydown", handleEsc);
      document.body.style.overflow = "unset";
    };
  }, [onClose]);

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-6">
      <motion.div 
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm" 
        onClick={onClose} 
      />
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 20 }}
        transition={{ duration: 0.3, ease: "easeOut" }}
        className="relative w-full max-w-4xl max-h-[90vh] bg-white rounded-3xl shadow-2xl overflow-hidden flex flex-col"
      >
        {/* Header */}
        <div className="p-6 md:p-8 border-b border-slate-100 flex justify-between items-start bg-slate-50/50 shrink-0">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <span className={`px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider border ${service.iconBg} ${service.iconColor} border-current opacity-80`}>
                {service.details.badge}
              </span>
            </div>
            <h2 className="text-2xl md:text-3xl font-bold text-slate-900">{service.title}</h2>
            <p className="text-slate-500 font-medium mt-1">{service.details.subtitle}</p>
          </div>
          <button 
            onClick={onClose}
            className="p-2 rounded-full hover:bg-slate-200/50 text-slate-400 hover:text-slate-600 transition-colors"
          >
            <X className="w-6 h-6" />
          </button>
        </div>
        
        {/* Scrollable Body */}
        <div className="overflow-y-auto p-6 md:p-8 space-y-10">
          {/* Overview */}
          <section>
            <h3 className="text-lg font-bold text-slate-900 mb-3 flex items-center gap-2">
              <FileText className={`w-5 h-5 ${service.iconColor}`} /> Overview
            </h3>
            <p className="text-slate-600 leading-relaxed text-lg">
              {service.details.overview}
            </p>
          </section>

          <div className="grid md:grid-cols-2 gap-8 md:gap-12">
            {/* Capabilities */}
            <section>
              <h3 className="text-lg font-bold text-slate-900 mb-4 flex items-center gap-2">
                <Settings className={`w-5 h-5 ${service.iconColor}`} /> {service.details.capabilitiesTitle}
              </h3>
              <div className="space-y-3">
                {service.details.capabilities.map((cap) => (
                  <div key={cap} className="flex items-start gap-3 p-3 rounded-xl bg-slate-50 border border-slate-100">
                    <CheckCircle2 className={`w-5 h-5 ${service.iconColor} shrink-0 mt-0.5`} />
                    <span className="text-slate-700 font-medium">{cap}</span>
                  </div>
                ))}
              </div>
            </section>

            {/* Process Flow */}
            <section>
              <h3 className="text-lg font-bold text-slate-900 mb-4 flex items-center gap-2">
                <BarChart3 className={`w-5 h-5 ${service.iconColor}`} /> {service.details.processTitle}
              </h3>
              <div className="relative border-l-2 border-slate-100 ml-3 space-y-6 pb-2">
                {service.details.processSteps.map((step, i) => (
                  <div key={i} className="relative pl-8">
                    <div className={`absolute -left-[9px] top-1 w-4 h-4 rounded-full bg-white border-2 ${service.iconColor.replace('text-', 'border-')}`} />
                    <h4 className="text-base font-semibold text-slate-800">{step}</h4>
                  </div>
                ))}
              </div>
            </section>
          </div>
        </div>

        {/* Footer */}
        <div className="p-6 border-t border-slate-100 bg-slate-50 flex flex-col sm:flex-row gap-4 justify-end shrink-0">
          <Button 
            variant="outline" 
            className="border-slate-200" 
            onClick={() => {
              const message = encodeURIComponent(`Hello, I would like to consult about ${service.title}.`);
              window.open(`https://wa.me/919561103435?text=${message}`, '_blank');
            }}
          >
            {service.details.secondaryCta}
          </Button>
          <Button 
            className={`text-white shadow-lg hover:opacity-90 bg-gradient-to-r ${service.gradient}`}
            onClick={() => {
              if (service.details.primaryPath.startsWith('/')) {
                navigate(service.details.primaryPath);
              } else {
                // Handle external links or other actions if needed
              }
              onClose();
            }}
          >
            {service.details.primaryCta}
            <ChevronRight className="w-4 h-4 ml-2" />
          </Button>
        </div>
      </motion.div>
    </div>
  );
};

export const ServicesSection = () => {
  const navigate = useNavigate();
  const [selectedService, setSelectedService] = useState<typeof services[0] | null>(null);

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
                        onClick={() => setSelectedService(service)}
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

      <AnimatePresence>
        {selectedService && (
          <ServiceModal service={selectedService} onClose={() => setSelectedService(null)} />
        )}
      </AnimatePresence>
    </section>
  );
};