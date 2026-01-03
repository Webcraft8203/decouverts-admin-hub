import { motion } from "framer-motion";
import { FlaskConical, Boxes, Factory, ArrowRight } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";

const solutions = [
  {
    icon: FlaskConical,
    title: "New Product Development (R&D)",
    description: "From ideation to market-ready products, our R&D team brings your vision to life with cutting-edge research and development.",
    image: "https://images.unsplash.com/photo-1581091226825-a6a2a5aee158?w=600&q=80",
    features: ["Concept Development", "Technical Feasibility", "Market Analysis"]
  },
  {
    icon: Boxes,
    title: "Rapid Prototyping",
    description: "Transform concepts into physical prototypes quickly and efficiently with our advanced prototyping capabilities.",
    image: "https://images.unsplash.com/photo-1565934177182-48e4d06d5a37?w=600&q=80",
    features: ["3D Printed Models", "Functional Prototypes", "Iterative Design"]
  },
  {
    icon: Factory,
    title: "Manufacturing Support",
    description: "End-to-end manufacturing support from design optimization to production scaling and quality assurance.",
    image: "https://images.unsplash.com/photo-1504893524553-b855bce32c67?w=600&q=80",
    features: ["DFM Optimization", "Production Planning", "Quality Control"]
  }
];

export const IndustrySolutions = () => {
  const navigate = useNavigate();

  return (
    <section className="py-24 px-4 bg-background relative overflow-hidden">
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_left,hsl(var(--accent)/0.08)_0%,transparent_50%)]" />
      
      <div className="max-w-7xl mx-auto relative z-10">
        <motion.div
          className="text-center mb-16"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
        >
          <span className="inline-block px-4 py-2 mb-4 text-sm font-medium rounded-full bg-accent/10 text-accent">
            Industry Solutions
          </span>
          <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold text-foreground">
            Comprehensive <span className="text-accent">Solutions</span>
          </h2>
        </motion.div>

        <div className="space-y-8">
          {solutions.map((solution, index) => (
            <motion.div
              key={solution.title}
              className={`flex flex-col ${index % 2 === 1 ? 'lg:flex-row-reverse' : 'lg:flex-row'} gap-8 items-center`}
              initial={{ opacity: 0, x: index % 2 === 0 ? -30 : 30 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6 }}
            >
              {/* Image Side */}
              <div className="w-full lg:w-1/2">
                <div className="relative group overflow-hidden rounded-3xl">
                  <div className="absolute inset-0 bg-gradient-to-t from-background/80 to-transparent z-10" />
                  <img
                    src={solution.image}
                    alt={solution.title}
                    className="w-full h-64 lg:h-80 object-cover group-hover:scale-110 transition-transform duration-700"
                  />
                  <div className="absolute bottom-4 left-4 z-20">
                    <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-primary to-accent flex items-center justify-center">
                      <solution.icon className="w-7 h-7 text-white" />
                    </div>
                  </div>
                </div>
              </div>

              {/* Content Side */}
              <div className="w-full lg:w-1/2 p-6 lg:p-8">
                <h3 className="text-2xl lg:text-3xl font-bold text-foreground mb-4">
                  {solution.title}
                </h3>
                <p className="text-muted-foreground text-lg mb-6 leading-relaxed">
                  {solution.description}
                </p>
                
                <div className="flex flex-wrap gap-3 mb-6">
                  {solution.features.map((feature) => (
                    <span
                      key={feature}
                      className="px-4 py-2 rounded-full bg-primary/10 text-primary text-sm font-medium"
                    >
                      {feature}
                    </span>
                  ))}
                </div>

                <Button
                  variant="outline"
                  className="border-primary/30 hover:bg-primary/10 group"
                  onClick={() => navigate("/engineering")}
                >
                  Learn More
                  <ArrowRight className="w-4 h-4 ml-2 group-hover:translate-x-1 transition-transform" />
                </Button>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
};
