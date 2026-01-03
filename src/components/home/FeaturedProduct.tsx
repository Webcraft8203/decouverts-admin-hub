import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Printer, Layers, Gauge, Ruler, ArrowRight } from "lucide-react";

const specs = [
  { icon: Layers, label: "Build Volume", value: "300 x 300 x 400mm" },
  { icon: Gauge, label: "Layer Resolution", value: "0.05 - 0.3mm" },
  { icon: Ruler, label: "Accuracy", value: "±0.1mm" },
  { icon: Printer, label: "Technology", value: "FDM/FFF" }
];

export const FeaturedProduct = () => {
  const navigate = useNavigate();

  return (
    <section className="py-24 px-4 bg-white relative overflow-hidden">
      {/* Background */}
      <div className="absolute inset-0 bg-gradient-to-br from-secondary/20 via-transparent to-primary/5" />
      
      <div className="max-w-7xl mx-auto relative z-10">
        <motion.div
          className="text-center mb-12"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
        >
          <Badge className="mb-4 bg-primary/10 text-primary hover:bg-primary/20 border-primary/20 font-semibold">
            Featured Product
          </Badge>
          <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold text-foreground">
            DFT Series <span className="text-primary">Industrial Printer</span>
          </h2>
        </motion.div>

        <div className="flex flex-col lg:flex-row items-center gap-12">
          {/* Product Image */}
          <motion.div
            className="w-full lg:w-1/2"
            initial={{ opacity: 0, x: -30 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
          >
            <div className="relative group">
              {/* Product Card */}
              <div className="relative bg-gradient-to-br from-secondary/50 to-white rounded-3xl p-8 border border-border overflow-hidden shadow-xl">
                <div className="absolute top-4 right-4">
                  <Badge className="bg-primary text-primary-foreground font-semibold">
                    Coming Soon
                  </Badge>
                </div>
                
                {/* Product Visual */}
                <div className="aspect-square relative flex items-center justify-center">
                  <motion.div
                    className="w-48 h-48 md:w-64 md:h-64 rounded-2xl bg-gradient-to-br from-primary/10 to-accent/10 flex items-center justify-center border border-primary/20"
                    animate={{
                      rotateY: [0, 5, 0, -5, 0],
                    }}
                    transition={{ duration: 8, repeat: Infinity, ease: "easeInOut" }}
                  >
                    <Printer className="w-24 h-24 md:w-32 md:h-32 text-primary" />
                  </motion.div>
                  
                  {/* Floating Elements */}
                  <motion.div
                    className="absolute top-8 right-8 w-12 h-12 rounded-lg bg-blue-100 flex items-center justify-center border border-blue-200"
                    animate={{ y: [-5, 5, -5] }}
                    transition={{ duration: 3, repeat: Infinity }}
                  >
                    <Layers className="w-6 h-6 text-blue-600" />
                  </motion.div>
                  <motion.div
                    className="absolute bottom-8 left-8 w-10 h-10 rounded-lg bg-amber-100 flex items-center justify-center border border-amber-200"
                    animate={{ y: [5, -5, 5] }}
                    transition={{ duration: 3.5, repeat: Infinity }}
                  >
                    <Gauge className="w-5 h-5 text-amber-600" />
                  </motion.div>
                </div>
              </div>
            </div>
          </motion.div>

          {/* Product Details */}
          <motion.div
            className="w-full lg:w-1/2"
            initial={{ opacity: 0, x: 30 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, delay: 0.2 }}
          >
            <h3 className="text-2xl font-bold text-foreground mb-4">
              Professional-Grade 3D Printing
            </h3>
            <p className="text-muted-foreground text-lg mb-8 leading-relaxed">
              The DFT Series represents the pinnacle of industrial 3D printing technology. 
              Designed for precision manufacturing and rapid prototyping, it delivers 
              exceptional quality with unmatched reliability.
            </p>

            {/* Specs Grid */}
            <div className="grid grid-cols-2 gap-4 mb-8">
              {specs.map((spec, index) => (
                <motion.div
                  key={spec.label}
                  className="p-4 rounded-xl bg-secondary/50 border border-border"
                  initial={{ opacity: 0, y: 10 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: 0.3 + index * 0.1 }}
                >
                  <spec.icon className="w-5 h-5 text-primary mb-2" />
                  <p className="text-xs text-muted-foreground">{spec.label}</p>
                  <p className="text-sm font-semibold text-foreground">{spec.value}</p>
                </motion.div>
              ))}
            </div>

            {/* CTA */}
            <div className="flex flex-col sm:flex-row gap-4">
              <Button
                size="lg"
                className="bg-gradient-to-r from-primary to-accent text-primary-foreground hover:opacity-90 shadow-lg shadow-primary/20"
                onClick={() => navigate("/shop")}
              >
                Pre-Order Now
                <ArrowRight className="w-5 h-5 ml-2" />
              </Button>
              <Button
                size="lg"
                variant="outline"
                className="border-foreground/20 hover:border-primary hover:bg-primary/5"
                onClick={() => navigate("/engineering")}
              >
                View Specifications
              </Button>
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
};
