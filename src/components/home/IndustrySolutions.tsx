import { motion } from "framer-motion";
import { FlaskConical, Boxes, Factory, ArrowRight } from "lucide-react";
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
    features: ["Concept Development", "Technical Feasibility", "Market Analysis"]
  },
  {
    id: "02",
    icon: Boxes,
    label: "INDUSTRIAL GRADE",
    title: "Rapid Prototyping",
    description: "Transform concepts into physical prototypes quickly and efficiently with our advanced prototyping capabilities.",
    image: "https://images.squarespace-cdn.com/content/v1/5d36bce499578e0001357c6c/1629732095111-GBRC1M34WQSN8AAG6TSR/rapid+prototyping+and+3d+printing",
    features: ["3D Printed Models", "Functional Prototypes", "Iterative Design"]
  },
  {
    id: "03",
    icon: Factory,
    label: "PRODUCTION READY",
    title: "Manufacturing Support",
    description: "End-to-end manufacturing support from design optimization to production scaling and quality assurance.",
    image: "https://kdmfab.com/wp-content/uploads/2024/12/What-Materials-are-Used-in-Drone-Manufacturing.jpg",
    features: ["DFM Optimization", "Production Planning", "Quality Control"]
  }
];

export const IndustrySolutions = () => {
  const navigate = useNavigate();

  return (
    <section className="pt-32 pb-24 px-4 bg-slate-50 relative overflow-hidden">
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
            <motion.div
              key={solution.title}
              className="group relative bg-white/60 backdrop-blur-sm border border-slate-200/60 rounded-3xl p-6 lg:p-10 overflow-hidden hover:shadow-xl transition-all duration-500"
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6, delay: index * 0.1 }}
            >
              <div className={`flex flex-col ${index % 2 === 1 ? 'lg:flex-row-reverse' : 'lg:flex-row'} gap-10 lg:gap-16 items-center`}>
                
                {/* Image Side */}
                <div className="w-full lg:w-1/2">
                  <div className="relative overflow-hidden rounded-2xl shadow-lg aspect-[16/10]">
                    <div className="absolute inset-0 bg-gradient-to-t from-slate-900/40 to-transparent z-10" />
                    <img
                      src={solution.image}
                      alt={solution.title}
                      className="w-full h-full object-cover transform group-hover:scale-105 transition-transform duration-700 ease-out"
                    />
                    {/* Integrated Icon Badge */}
                    <div className="absolute bottom-4 left-4 z-20 bg-white/90 backdrop-blur p-3 rounded-xl shadow-lg border border-white/20">
                      <solution.icon className="w-6 h-6 text-primary" />
                    </div>
                  </div>
                </div>

                {/* Content Side */}
                <div className="w-full lg:w-1/2">
                  <div className="flex items-center gap-4 mb-6">
                    <span className="text-4xl font-bold text-slate-200 select-none">
                      {solution.id}
                    </span>
                    <div className="h-px bg-slate-200 flex-grow max-w-[100px]" />
                    <span className="text-xs font-bold tracking-widest uppercase text-primary">
                      {solution.label}
                    </span>
                  </div>

                  <h3 className="text-2xl lg:text-3xl font-bold text-slate-900 mb-4">
                    {solution.title}
                  </h3>
                  <p className="text-slate-600 text-lg mb-8 leading-relaxed">
                    {solution.description}
                  </p>
                  
                  <div className="flex flex-wrap gap-3 mb-8">
                    {solution.features.map((feature) => (
                      <span
                        key={feature}
                        className="px-4 py-1.5 rounded-full bg-slate-100 text-slate-700 text-sm font-medium border border-slate-200/60"
                      >
                        {feature}
                      </span>
                    ))}
                  </div>

                  <Button
                    variant="outline"
                    className="border-slate-300 text-slate-700 hover:border-primary hover:text-primary hover:bg-transparent group"
                    onClick={() => navigate("/engineering")}
                  >
                    Learn More
                    <ArrowRight className="w-4 h-4 ml-2 group-hover:translate-x-1 transition-transform" />
                  </Button>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
};
