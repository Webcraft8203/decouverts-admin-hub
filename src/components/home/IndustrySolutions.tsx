import { motion, useScroll, useTransform, AnimatePresence } from "framer-motion";
import { useRef, useState, useEffect } from "react";
import { FlaskConical, Boxes, Factory, ArrowRight, X, CheckCircle2, Calendar, Users, Lightbulb, Settings } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";

const solutions = [
  {
    id: "01",
    icon: FlaskConical,
    label: "R&D FOCUSED",
    title: "New Product Development",
    description: "From ideation to market-ready products, our R&D team brings your vision to life with cutting-edge research and development.",
    image: "https://framerusercontent.com/images/mjTBBl4MXIhWJFtJ2TNcrninwY.jpg?width=1024&height=676",
    features: ["Concept Development", "Technical Feasibility", "Market Analysis"],
    details: {
      subtitle: "From Idea to Market-Ready Product",
      overview: "Our end-to-end product development service transforms abstract concepts into viable, market-ready products. We bridge the gap between innovation and manufacturability, ensuring your product is not only functional but also optimized for mass production.",
      timeline: [
        { step: "01", title: "Ideation & Concept Design", description: "Brainstorming and initial sketching of concepts." },
        { step: "02", title: "Market & User Research", description: "Analyzing market needs and user behaviors." },
        { step: "03", title: "Technical Feasibility Analysis", description: "Assessing engineering viability and cost." },
        { step: "04", title: "CAD / Engineering Design", description: "Detailed 3D modeling and engineering specifications." },
        { step: "05", title: "Rapid Prototyping", description: "Creating physical models for testing." },
        { step: "06", title: "Testing & Validation", description: "Rigorous functional and stress testing." },
        { step: "07", title: "Design for Manufacturing (DFM)", description: "Optimizing design for efficient production." },
        { step: "08", title: "Production Readiness", description: "Finalizing tooling and supply chain setup." }
      ],
      capabilities: [
        "Concept Development", "Technical Feasibility", "Market Analysis", "Rapid Prototyping", "Testing & QA", "Industrial Manufacturing Support"
      ],
      targetAudience: ["Startups", "Enterprises", "R&D Teams", "Industrial Clients"]
    }
  },
  {
    id: "02",
    icon: Boxes,
    label: "INDUSTRIAL GRADE",
    title: "Rapid Prototyping",
    description: "Transform concepts into physical prototypes quickly and efficiently with our advanced prototyping capabilities.",
    image: "https://images.squarespace-cdn.com/content/v1/5d36bce499578e0001357c6c/1629732095111-GBRC1M34WQSN8AAG6TSR/rapid+prototyping+and+3d+printing",
    features: ["3D Printed Models", "Functional Prototypes", "Iterative Design"],
    details: {
      subtitle: "Accelerate Innovation with Physical Models",
      overview: "Our rapid prototyping services allow you to visualize, test, and iterate on your designs quickly. We use advanced 3D printing and machining technologies to turn digital concepts into tangible models, reducing development time and cost.",
      timeline: [
        { step: "01", title: "File Preparation", description: "Optimizing 3D CAD models for manufacturing." },
        { step: "02", title: "Material Selection", description: "Choosing the right polymers or metals for the application." },
        { step: "03", title: "Fabrication", description: "High-speed 3D printing or CNC machining." },
        { step: "04", title: "Post-Processing", description: "Cleaning, curing, and support removal." },
        { step: "05", title: "Surface Finishing", description: "Sanding, painting, or polishing for aesthetic quality." },
        { step: "06", title: "Quality Inspection", description: "Dimensional verification and fit check." }
      ],
      capabilities: [
        "SLA / FDM / SLS Printing", "CNC Machining", "Vacuum Casting", "Functional Testing", "Surface Finishing", "Low-Volume Production"
      ],
      targetAudience: ["Product Designers", "Engineering Teams", "Startups", "Manufacturing Firms"]
    }
  },
  {
    id: "03",
    icon: Factory,
    label: "PRODUCTION READY",
    title: "Manufacturing Support",
    description: "End-to-end manufacturing support from design optimization to production scaling and quality assurance.",
    image: "https://kdmfab.com/wp-content/uploads/2024/12/What-Materials-are-Used-in-Drone-Manufacturing.jpg",
    features: ["DFM Optimization", "Production Planning", "Quality Control"],
    details: {
      subtitle: "Scalable Production & Quality Assurance",
      overview: "We provide comprehensive manufacturing support to transition your product from prototype to mass production. Our services include design for manufacturing (DFM), supply chain management, and rigorous quality control to ensure consistency and reliability.",
      timeline: [
        { step: "01", title: "DFM Review", description: "Analyzing design for efficient production." },
        { step: "02", title: "Tooling Design", description: "Creating molds, fixtures, and jigs." },
        { step: "03", title: "Pilot Run", description: "Low-volume production to validate process." },
        { step: "04", title: "Quality Planning", description: "Establishing QC standards and checkpoints." },
        { step: "05", title: "Mass Production", description: "Scaling up manufacturing." },
        { step: "06", title: "Assembly & Packaging", description: "Final assembly and packaging." },
        { step: "07", title: "Logistics", description: "Shipping and distribution." }
      ],
      capabilities: [
        "Injection Molding", "CNC Machining", "Sheet Metal Fabrication", "Assembly", "Quality Control", "Supply Chain Management"
      ],
      targetAudience: ["Hardware Startups", "Industrial Enterprises", "Consumer Electronics", "Automotive"]
    }
  }
];

const SolutionModal = ({ solution, onClose }: { solution: typeof solutions[0], onClose: () => void }) => {
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

  if (!solution.details) return null;

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
              <span className="px-3 py-1 rounded-full bg-primary/10 text-primary text-xs font-bold uppercase tracking-wider border border-primary/20">
                {solution.label}
              </span>
            </div>
            <h2 className="text-2xl md:text-3xl font-bold text-slate-900">{solution.title}</h2>
            <p className="text-slate-500 font-medium mt-1">{solution.details.subtitle}</p>
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
              <Lightbulb className="w-5 h-5 text-primary" /> Overview
            </h3>
            <p className="text-slate-600 leading-relaxed text-lg">
              {solution.details.overview}
            </p>
          </section>

          {/* Timeline */}
          <section>
            <h3 className="text-lg font-bold text-slate-900 mb-6 flex items-center gap-2">
              <Calendar className="w-5 h-5 text-primary" /> Process Timeline
            </h3>
            <div className="relative border-l-2 border-slate-100 ml-3 space-y-8 pb-2">
              {solution.details.timeline.map((step, i) => (
                <div key={i} className="relative pl-8">
                  <div className="absolute -left-[9px] top-0 w-4 h-4 rounded-full bg-white border-2 border-primary" />
                  <span className="text-xs font-bold text-primary uppercase tracking-wider mb-1 block">
                    Step {step.step}
                  </span>
                  <h4 className="text-base font-bold text-slate-900 mb-1">{step.title}</h4>
                  <p className="text-slate-500 text-sm">{step.description}</p>
                </div>
              ))}
            </div>
          </section>

          <div className="grid md:grid-cols-2 gap-8">
            {/* Capabilities */}
            <section>
              <h3 className="text-lg font-bold text-slate-900 mb-4 flex items-center gap-2">
                <Settings className="w-5 h-5 text-primary" /> Key Capabilities
              </h3>
              <div className="flex flex-wrap gap-2">
                {solution.details.capabilities.map((cap) => (
                  <span key={cap} className="px-3 py-1.5 rounded-lg bg-slate-50 text-slate-700 text-sm font-medium border border-slate-200">
                    {cap}
                  </span>
                ))}
              </div>
            </section>

            {/* Target Audience */}
            <section>
              <h3 className="text-lg font-bold text-slate-900 mb-4 flex items-center gap-2">
                <Users className="w-5 h-5 text-primary" /> Who It's For
              </h3>
              <ul className="space-y-2">
                {solution.details.targetAudience.map((audience) => (
                  <li key={audience} className="flex items-center gap-2 text-slate-600 text-sm">
                    <CheckCircle2 className="w-4 h-4 text-primary/60" />
                    {audience}
                  </li>
                ))}
              </ul>
            </section>
          </div>
        </div>

        {/* Footer */}
        <div className="p-6 border-t border-slate-100 bg-slate-50 flex flex-col sm:flex-row gap-4 justify-end shrink-0">
          <Button variant="outline" className="border-slate-200" onClick={onClose}>
            Close
          </Button>
          <Button 
            className="bg-primary text-primary-foreground hover:bg-primary/90"
            onClick={() => {
              const message = encodeURIComponent(`Hello, I am interested in your ${solution.title} services.`);
              window.open(`https://wa.me/919561103435?text=${message}`, '_blank');
            }}
          >
            Contact Our R&D Team
          </Button>
        </div>
      </motion.div>
    </div>
  );
};

const SolutionCard = ({ solution, index, onLearnMore }: { solution: typeof solutions[number], index: number, onLearnMore: (s: typeof solutions[number]) => void }) => {
  const navigate = useNavigate();
  const ref = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ["start end", "end start"]
  });
  
  const y = useTransform(scrollYProgress, [0, 1], ["-10%", "10%"]);

  return (
    <motion.div
      ref={ref}
      className="group relative bg-white border border-slate-200 rounded-3xl p-6 lg:p-10 overflow-hidden hover:shadow-2xl transition-all duration-500"
      initial={{ opacity: 0, y: 30 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-100px" }}
      transition={{ duration: 0.7, delay: index * 0.1 }}
    >
      <div className={`flex flex-col ${index % 2 === 1 ? 'lg:flex-row-reverse' : 'lg:flex-row'} gap-10 lg:gap-16 items-center`}>
        
        {/* Image Side */}
        <div className="w-full lg:w-1/2">
          <div className="relative overflow-hidden rounded-2xl shadow-lg aspect-[16/10] bg-slate-100">
            <div className="absolute inset-0 bg-gradient-to-t from-slate-900/50 to-transparent z-10" />
            
            {/* Parallax Image Container */}
            <motion.div 
              style={{ y }} 
              className="absolute inset-0 h-[120%] -top-[10%] w-full"
            >
              <img
                src={solution.image}
                alt={solution.title}
                className="w-full h-full object-cover transform scale-105 group-hover:scale-110 transition-transform duration-1000 ease-out"
              />
            </motion.div>

            {/* Integrated Icon Badge */}
            <div className="absolute bottom-4 left-4 z-20 bg-white/95 backdrop-blur-md p-3 rounded-xl shadow-lg border border-white/20">
              <solution.icon className="w-6 h-6 text-primary" />
            </div>
          </div>
        </div>

        {/* Content Side */}
        <div className="w-full lg:w-1/2">
          <div className="flex items-center gap-4 mb-6">
            <span className="text-5xl font-bold text-slate-100 select-none tracking-tighter">
              {solution.id}
            </span>
            <div className="h-px bg-slate-200 flex-grow max-w-[60px]" />
            <span className="text-xs font-bold tracking-[0.2em] uppercase text-primary">
              {solution.label}
            </span>
          </div>

          <h3 className="text-3xl font-bold text-slate-900 mb-4 tracking-tight">
            {solution.title}
          </h3>
          <p className="text-slate-600 text-lg mb-8 leading-relaxed font-light">
            {solution.description}
          </p>
          
          <div className="flex flex-wrap gap-3 mb-8">
            {solution.features.map((feature) => (
              <span
                key={feature}
                className="px-4 py-1.5 rounded-full bg-slate-50 text-slate-700 text-sm font-medium border border-slate-200"
              >
                {feature}
              </span>
            ))}
          </div>

          <Button
            variant="outline"
            className="border-slate-300 text-slate-700 hover:border-primary hover:text-primary hover:bg-transparent group/btn rounded-full px-6"
            onClick={() => {
              if (solution.details) {
                onLearnMore(solution);
              } else {
                navigate("/engineering");
              }
            }}
          >
            Learn More
            <ArrowRight className="w-4 h-4 ml-2 group-hover/btn:translate-x-1 transition-transform" />
          </Button>
        </div>
      </div>
    </motion.div>
  );
};

export const IndustrySolutions = () => {
  const [selectedSolution, setSelectedSolution] = useState<typeof solutions[number] | null>(null);

  return (
    <section id="industry-solutions" className="pt-32 pb-24 px-4 bg-slate-50 relative overflow-hidden">
      {/* Technical Grid Background */}
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#80808012_1px,transparent_1px),linear-gradient(to_bottom,#80808012_1px,transparent_1px)] bg-[size:24px_24px]" />
      <div className="absolute inset-0 bg-[radial-gradient(circle_800px_at_100%_200px,rgba(255,255,255,0.8),transparent)]" />

      <div className="max-w-7xl mx-auto relative z-10">
        <motion.div
          className="text-center mb-24"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
        >
          <span className="inline-block px-3 py-1 mb-6 text-xs font-bold tracking-[0.2em] uppercase text-primary/80 border border-primary/20 rounded-full bg-primary/5">
            Industry Solutions
          </span>
          <h2 className="text-4xl md:text-5xl font-bold text-slate-900 tracking-tight mb-6">
            Comprehensive <span className="text-primary">Solutions</span>
          </h2>
          <p className="text-slate-600 text-lg max-w-2xl mx-auto leading-relaxed">
            End-to-end engineering capabilities designed for enterprise scale and precision.
          </p>
        </motion.div>

        <div className="space-y-16">
          {solutions.map((solution, index) => (
            <SolutionCard key={solution.title} solution={solution} index={index} onLearnMore={setSelectedSolution} />
          ))}
        </div>
      </div>

      <AnimatePresence>
        {selectedSolution && (
          <SolutionModal solution={selectedSolution} onClose={() => setSelectedSolution(null)} />
        )}
      </AnimatePresence>
    </section>
  );
};
