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
    features: ["Concept Development", "Technical Feasibility", "Market Analysis"],
    color: "from-blue-500 to-cyan-500"
  },
  {
    icon: Boxes,
    title: "Rapid Prototyping",
    description: "Transform concepts into physical prototypes quickly and efficiently with our advanced prototyping capabilities.",
    image: "https://images.unsplash.com/photo-1565934177182-48e4d06d5a37?w=600&q=80",
    features: ["3D Printed Models", "Functional Prototypes", "Iterative Design"],
    color: "from-purple-500 to-pink-500"
  },
  {
    icon: Factory,
    title: "Manufacturing Support",
    description: "End-to-end manufacturing support from design optimization to production scaling and quality assurance.",
    image: "https://images.unsplash.com/photo-1504893524553-b855bce32c67?w=600&q=80",
    features: ["DFM Optimization", "Production Planning", "Quality Control"],
    color: "from-orange-500 to-amber-500"
  }
];

export const IndustrySolutions = () => {
  const navigate = useNavigate();

  return (
    <section className="py-24 px-4 bg-gradient-to-b from-secondary/30 to-white relative overflow-hidden">
      <div className="max-w-7xl mx-auto relative z-10">
        <motion.div
          className="text-center mb-16"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
        >
          <span className="inline-block px-4 py-2 mb-4 text-sm font-semibold rounded-full bg-accent/10 text-accent">
            Industry Solutions
          </span>
          <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold text-foreground">
            Comprehensive <span className="text-primary">Solutions</span>
          </h2>
        </motion.div>

        <div className="space-y-12">
          {solutions.map((solution, index) => (
            <motion.div
              key={solution.title}
              className={`flex flex-col ${index % 2 === 1 ? 'lg:flex-row-reverse' : 'lg:flex-row'} gap-8 items-center bg-white rounded-3xl p-6 lg:p-8 border border-border shadow-sm hover:shadow-xl transition-shadow duration-300`}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6 }}
            >
              {/* Image Side */}
              <div className="w-full lg:w-1/2">
                <div className="relative group overflow-hidden rounded-2xl">
                  <img
                    src={solution.image}
                    alt={solution.title}
                    className="w-full h-64 lg:h-80 object-cover group-hover:scale-105 transition-transform duration-700"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-foreground/60 to-transparent" />
                  <div className="absolute bottom-4 left-4 z-20">
                    <div className={`w-14 h-14 rounded-xl bg-gradient-to-br ${solution.color} flex items-center justify-center shadow-lg`}>
                      <solution.icon className="w-7 h-7 text-white" />
                    </div>
                  </div>
                </div>
              </div>

              {/* Content Side */}
              <div className="w-full lg:w-1/2 p-4">
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
                      className="px-4 py-2 rounded-full bg-secondary text-foreground text-sm font-medium border border-border"
                    >
                      {feature}
                    </span>
                  ))}
                </div>

                <Button
                  variant="outline"
                  className="border-primary text-primary hover:bg-primary hover:text-primary-foreground group"
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
