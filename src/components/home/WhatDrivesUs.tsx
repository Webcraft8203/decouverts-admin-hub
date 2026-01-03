import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronLeft, ChevronRight, Zap, Rocket, Shield, Award, Leaf, Heart } from "lucide-react";
import { Button } from "@/components/ui/button";

const drives = [
  {
    icon: Zap,
    title: "Speed & Efficiency",
    description: "Rapid prototyping and quick turnaround times without compromising quality.",
    gradient: "from-yellow-500/20 to-orange-500/20"
  },
  {
    icon: Rocket,
    title: "Innovation",
    description: "Constantly pushing the boundaries of what's possible in engineering and manufacturing.",
    gradient: "from-orange-500/20 to-red-500/20"
  },
  {
    icon: Shield,
    title: "Quality Assurance",
    description: "Rigorous testing and quality control at every stage of production.",
    gradient: "from-blue-500/20 to-cyan-500/20"
  },
  {
    icon: Award,
    title: "Excellence",
    description: "Committed to delivering world-class products and services that exceed expectations.",
    gradient: "from-purple-500/20 to-pink-500/20"
  },
  {
    icon: Leaf,
    title: "Sustainability",
    description: "Eco-friendly practices and sustainable manufacturing solutions for a better tomorrow.",
    gradient: "from-green-500/20 to-emerald-500/20"
  },
  {
    icon: Heart,
    title: "Passion",
    description: "Driven by a deep love for engineering and creating solutions that make a difference.",
    gradient: "from-red-500/20 to-rose-500/20"
  }
];

export const WhatDrivesUs = () => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isAutoPlaying, setIsAutoPlaying] = useState(true);

  useEffect(() => {
    if (!isAutoPlaying) return;
    const interval = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % drives.length);
    }, 4000);
    return () => clearInterval(interval);
  }, [isAutoPlaying]);

  const next = () => {
    setIsAutoPlaying(false);
    setCurrentIndex((prev) => (prev + 1) % drives.length);
  };

  const prev = () => {
    setIsAutoPlaying(false);
    setCurrentIndex((prev) => (prev - 1 + drives.length) % drives.length);
  };

  return (
    <section className="py-24 px-4 bg-background relative overflow-hidden">
      {/* Background Elements */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_bottom_left,hsl(var(--primary)/0.08)_0%,transparent_60%)]" />
      
      <div className="max-w-7xl mx-auto relative z-10">
        <motion.div
          className="text-center mb-16"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
        >
          <span className="inline-block px-4 py-2 mb-4 text-sm font-medium rounded-full bg-primary/10 text-primary">
            Our Core Values
          </span>
          <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold text-foreground">
            What <span className="text-primary">Drives Us</span>
          </h2>
        </motion.div>

        <div className="relative">
          {/* Main Slider */}
          <div className="flex items-center justify-center gap-4">
            <Button
              variant="outline"
              size="icon"
              className="hidden md:flex rounded-full border-primary/30 hover:bg-primary/10"
              onClick={prev}
            >
              <ChevronLeft className="w-5 h-5" />
            </Button>

            <div className="flex-1 max-w-4xl overflow-hidden">
              <AnimatePresence mode="wait">
                <motion.div
                  key={currentIndex}
                  initial={{ opacity: 0, x: 100 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -100 }}
                  transition={{ duration: 0.5 }}
                  className={`p-8 md:p-12 rounded-3xl bg-gradient-to-br ${drives[currentIndex].gradient} border border-border backdrop-blur-sm`}
                >
                  <div className="flex flex-col md:flex-row items-center gap-8">
                    <div className="w-24 h-24 rounded-2xl bg-gradient-to-br from-primary/30 to-accent/30 flex items-center justify-center shrink-0">
                      {(() => {
                        const Icon = drives[currentIndex].icon;
                        return <Icon className="w-12 h-12 text-primary" />;
                      })()}
                    </div>
                    <div className="text-center md:text-left">
                      <h3 className="text-2xl md:text-3xl font-bold text-foreground mb-4">
                        {drives[currentIndex].title}
                      </h3>
                      <p className="text-muted-foreground text-lg">
                        {drives[currentIndex].description}
                      </p>
                    </div>
                  </div>
                </motion.div>
              </AnimatePresence>
            </div>

            <Button
              variant="outline"
              size="icon"
              className="hidden md:flex rounded-full border-primary/30 hover:bg-primary/10"
              onClick={next}
            >
              <ChevronRight className="w-5 h-5" />
            </Button>
          </div>

          {/* Dots Navigation */}
          <div className="flex justify-center gap-2 mt-8">
            {drives.map((_, index) => (
              <button
                key={index}
                className={`w-3 h-3 rounded-full transition-all duration-300 ${
                  index === currentIndex
                    ? "bg-primary w-8"
                    : "bg-primary/30 hover:bg-primary/50"
                }`}
                onClick={() => {
                  setIsAutoPlaying(false);
                  setCurrentIndex(index);
                }}
              />
            ))}
          </div>

          {/* Mobile Navigation */}
          <div className="flex md:hidden justify-center gap-4 mt-6">
            <Button
              variant="outline"
              size="icon"
              className="rounded-full border-primary/30 hover:bg-primary/10"
              onClick={prev}
            >
              <ChevronLeft className="w-5 h-5" />
            </Button>
            <Button
              variant="outline"
              size="icon"
              className="rounded-full border-primary/30 hover:bg-primary/10"
              onClick={next}
            >
              <ChevronRight className="w-5 h-5" />
            </Button>
          </div>
        </div>
      </div>
    </section>
  );
};
