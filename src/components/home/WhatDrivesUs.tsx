import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronLeft, ChevronRight, Zap, Rocket, Shield, Award, Leaf, Heart } from "lucide-react";
import { Button } from "@/components/ui/button";

const drives = [
  {
    icon: Zap,
    title: "Speed & Efficiency",
    description: "Rapid prototyping and quick turnaround times without compromising quality.",
    color: "from-amber-500 to-orange-500"
  },
  {
    icon: Rocket,
    title: "Innovation",
    description: "Constantly pushing the boundaries of what's possible in engineering and manufacturing.",
    color: "from-orange-500 to-red-500"
  },
  {
    icon: Shield,
    title: "Quality Assurance",
    description: "Rigorous testing and quality control at every stage of production.",
    color: "from-blue-500 to-cyan-500"
  },
  {
    icon: Award,
    title: "Excellence",
    description: "Committed to delivering world-class products and services that exceed expectations.",
    color: "from-purple-500 to-pink-500"
  },
  {
    icon: Leaf,
    title: "Sustainability",
    description: "Eco-friendly practices and sustainable manufacturing solutions for a better tomorrow.",
    color: "from-green-500 to-emerald-500"
  },
  {
    icon: Heart,
    title: "Passion",
    description: "Driven by a deep love for engineering and creating solutions that make a difference.",
    color: "from-rose-500 to-pink-500"
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
    <section className="py-24 px-4 bg-gradient-to-b from-white to-secondary/30 relative overflow-hidden">
      <div className="max-w-7xl mx-auto relative z-10">
        <motion.div
          className="text-center mb-16"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
        >
          <span className="inline-block px-4 py-2 mb-4 text-sm font-semibold rounded-full bg-primary/10 text-primary">
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
              className="hidden md:flex rounded-full border-border hover:border-primary hover:bg-primary/5 shadow-sm"
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
                  className="p-8 md:p-12 rounded-3xl bg-white border border-border shadow-xl"
                >
                  <div className="flex flex-col md:flex-row items-center gap-8">
                    <div className={`w-24 h-24 rounded-2xl bg-gradient-to-br ${drives[currentIndex].color} flex items-center justify-center shrink-0 shadow-lg`}>
                      {(() => {
                        const Icon = drives[currentIndex].icon;
                        return <Icon className="w-12 h-12 text-white" />;
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
              className="hidden md:flex rounded-full border-border hover:border-primary hover:bg-primary/5 shadow-sm"
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
                className={`h-2.5 rounded-full transition-all duration-300 ${
                  index === currentIndex
                    ? "bg-primary w-8"
                    : "bg-foreground/20 w-2.5 hover:bg-foreground/40"
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
              className="rounded-full border-border hover:border-primary"
              onClick={prev}
            >
              <ChevronLeft className="w-5 h-5" />
            </Button>
            <Button
              variant="outline"
              size="icon"
              className="rounded-full border-border hover:border-primary"
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
