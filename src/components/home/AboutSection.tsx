import { motion } from "framer-motion";
import { Target, Lightbulb, Users, Globe } from "lucide-react";

const values = [
  {
    icon: Target,
    title: "Our Mission",
    description: "To revolutionize manufacturing through cutting-edge technology and innovative engineering solutions."
  },
  {
    icon: Lightbulb,
    title: "Innovation First",
    description: "We believe in pushing boundaries and exploring new possibilities in every project we undertake."
  },
  {
    icon: Users,
    title: "Customer Focus",
    description: "Your success is our priority. We work closely with you to deliver solutions that exceed expectations."
  },
  {
    icon: Globe,
    title: "Made in India",
    description: "Proudly designed and manufactured in Pune, India, serving clients worldwide with excellence."
  }
];

export const AboutSection = () => {
  return (
    <section id="about" className="py-24 px-4 bg-card relative overflow-hidden">
      {/* Subtle Background Pattern */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,hsl(var(--primary)/0.05)_0%,transparent_50%)]" />
      
      <div className="max-w-7xl mx-auto relative z-10">
        <motion.div
          className="text-center mb-16"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
        >
          <span className="inline-block px-4 py-2 mb-4 text-sm font-medium rounded-full bg-primary/10 text-primary">
            About Us
          </span>
          <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold text-foreground mb-6">
            Where Imagination Meets{" "}
            <span className="text-primary">Innovation</span>
          </h2>
          <p className="text-muted-foreground text-lg max-w-3xl mx-auto leading-relaxed">
            Founded with a vision to transform ideas into reality, Decouverts is a Pune-based 
            engineering and manufacturing company specializing in advanced 3D printing systems, 
            drone technology, and new product development. Our founder's passion for innovation 
            drives us to deliver cutting-edge solutions that shape the future of manufacturing.
          </p>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {values.map((value, index) => (
            <motion.div
              key={value.title}
              className="group p-6 rounded-2xl bg-secondary/50 border border-border hover:border-primary/30 transition-all duration-300 hover:shadow-lg hover:shadow-primary/5"
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: index * 0.1 }}
              whileHover={{ y: -5 }}
            >
              <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-primary/20 to-accent/20 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform duration-300">
                <value.icon className="w-7 h-7 text-primary" />
              </div>
              <h3 className="text-xl font-semibold text-foreground mb-2">{value.title}</h3>
              <p className="text-muted-foreground text-sm leading-relaxed">{value.description}</p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
};
