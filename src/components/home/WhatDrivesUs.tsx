import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronLeft, ChevronRight, Cog, Target, ShieldCheck, Cpu, Layers, Zap } from "lucide-react";
import { Button } from "@/components/ui/button";

const drives = [
  {
    icon: Cog,
    title: "Precision Engineering",
    description: "Delivering micron-level accuracy through advanced manufacturing protocols and rigorous quality control standards.",
    tag: "Industrial Grade"
  },
  {
    icon: Cpu,
    title: "Indigenous Innovation",
    description: "Pioneering self-reliant technology solutions that enhance national strategic autonomy and technological sovereignty.",
    tag: "R&D Driven"
  },
  {
    icon: ShieldCheck,
    title: "Mission Critical Reliability",
    description: "Systems engineered to perform flawlessly in the most demanding operational environments and strategic scenarios.",
    tag: "Defense Ready"
  },
  {
    icon: Target,
    title: "Strategic R&D",
    description: "Continuous investment in fundamental research to push the boundaries of applied science and engineering capabilities.",
    tag: "Future Proof"
  },
  {
    icon: Layers,
    title: "Scalable Architecture",
    description: "Modular design philosophies ensuring seamless industrial scaling and long-term operational viability.",
    tag: "Enterprise Scale"
  },
  {
    icon: Zap,
    title: "Operational Efficiency",
    description: "Optimized workflows and rapid deployment capabilities without compromising on structural integrity or performance.",
    tag: "High Performance"
  }
];

export const WhatDrivesUs = () => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isAutoPlaying, setIsAutoPlaying] = useState(true);

  useEffect(() => {
    if (!isAutoPlaying) return;
    const interval = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % drives.length);
    }, 5000);
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
    <section className="py-16 md:py-24 px-4 section-dark relative overflow-hidden">
      {/* Technical Background Grid */}
      <div className="absolute inset-0 bg-grid-dark opacity-40" />
      
      {/* Gradient accents */}
      <div className="absolute top-0 right-0 w-1/2 h-1/2 bg-gradient-to-bl from-primary/10 to-transparent" />
      <div className="absolute bottom-0 left-0 w-1/3 h-1/3 bg-gradient-to-tr from-primary/5 to-transparent" />

      <div className="max-w-6xl mx-auto relative z-10">
        <div className="flex flex-col md:flex-row justify-between items-end mb-10 md:mb-14 gap-6">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="max-w-2xl"
          >
            <div className="flex items-center gap-3 mb-4">
              <div className="h-1 w-10 bg-primary rounded-full"></div>
              <span className="text-xs font-bold tracking-[0.2em] uppercase text-primary">Core Philosophy</span>
            </div>
            <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold text-white tracking-tight mb-4">
              Engineering the <span className="text-primary">Future</span>
            </h2>
            <p className="text-dark-muted text-base md:text-lg leading-relaxed max-w-xl">
              Driven by a commitment to technological sovereignty and industrial excellence. We build systems that define the next generation of engineering.
            </p>
          </motion.div>

          {/* Navigation Controls */}
          <div className="hidden md:flex items-center gap-3">
            <Button
              variant="outline"
              size="icon"
              className="rounded-lg border-dark-border bg-dark-elevated hover:bg-dark-accent hover:border-primary/30 text-dark-muted hover:text-primary transition-all"
              onClick={prev}
            >
              <ChevronLeft className="w-5 h-5" />
            </Button>
            <Button
              variant="outline"
              size="icon"
              className="rounded-lg border-dark-border bg-dark-elevated hover:bg-dark-accent hover:border-primary/30 text-dark-muted hover:text-primary transition-all"
              onClick={next}
            >
              <ChevronRight className="w-5 h-5" />
            </Button>
          </div>
        </div>

        <div className="relative">
          <div className="overflow-hidden">
            <AnimatePresence mode="wait">
              <motion.div
                key={currentIndex}
                initial={{ opacity: 0, x: 30 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -30 }}
                transition={{ duration: 0.4, ease: "easeOut" }}
                className="grid grid-cols-1 md:grid-cols-12 gap-0 bg-dark-elevated border border-dark-border rounded-2xl overflow-hidden shadow-2xl"
              >
                {/* Icon Section (Primary Accent) */}
                <div className="md:col-span-4 bg-gradient-to-br from-dark-accent to-dark p-8 md:p-12 flex flex-col justify-between relative overflow-hidden min-h-[240px] md:min-h-[320px]">
                  {/* Background decoration */}
                  <motion.div 
                    className="absolute -top-10 -right-10 opacity-5"
                    animate={{ rotate: 360 }}
                    transition={{ duration: 30, repeat: Infinity, ease: "linear" }}
                  >
                    <Cog className="w-40 h-40 text-white" />
                  </motion.div>
                  
                  <div className="relative z-10">
                    <div className="w-14 h-14 md:w-16 md:h-16 bg-primary/10 border border-primary/30 flex items-center justify-center mb-6 rounded-xl">
                      {(() => {
                        const Icon = drives[currentIndex].icon;
                        return <Icon className="w-7 h-7 md:w-8 md:h-8 text-primary" />;
                      })()}
                    </div>
                  </div>

                  <div className="relative z-10">
                    <span className="text-dark-muted text-xs font-mono mb-3 block">
                      0{currentIndex + 1} / 0{drives.length}
                    </span>
                    <div className="w-full bg-dark-border h-1 rounded-full overflow-hidden">
                      <motion.div 
                        className="bg-primary h-full rounded-full"
                        initial={{ width: 0 }}
                        animate={{ width: "100%" }}
                        transition={{ duration: 5, ease: "linear" }}
                        key={currentIndex}
                      />
                    </div>
                  </div>
                </div>

                {/* Content Section */}
                <div className="md:col-span-8 p-8 md:p-12 flex flex-col justify-center relative bg-dark-elevated">
                  <div className="mb-4 md:absolute md:top-8 md:right-8">
                    <span className="inline-block px-3 py-1.5 bg-primary/10 text-primary text-xs font-bold uppercase tracking-wider border border-primary/20 rounded-lg">
                      {drives[currentIndex].tag}
                    </span>
                  </div>
                  
                  <h3 className="text-2xl sm:text-3xl md:text-4xl font-bold text-white mb-4 pr-0 md:pr-32">
                    {drives[currentIndex].title}
                  </h3>
                  <p className="text-dark-muted text-base md:text-lg leading-relaxed mb-8">
                    {drives[currentIndex].description}
                  </p>
                  
                  <button 
                    className="flex items-center text-sm font-semibold text-primary uppercase tracking-wider group w-max" 
                    onClick={next}
                  >
                    Next Initiative 
                    <ChevronRight className="w-4 h-4 ml-1.5 group-hover:translate-x-1 transition-transform" />
                  </button>
                </div>
              </motion.div>
            </AnimatePresence>
          </div>

          {/* Mobile Navigation */}
          <div className="flex md:hidden justify-between items-center mt-6">
            <div className="flex gap-1.5">
              {drives.map((_, index) => (
                <button
                  key={index}
                  className={`h-2 rounded-full transition-all duration-300 ${
                    index === currentIndex
                      ? "bg-primary w-8"
                      : "bg-dark-border w-4 hover:bg-dark-muted"
                  }`}
                  onClick={() => {
                    setIsAutoPlaying(false);
                    setCurrentIndex(index);
                  }}
                />
              ))}
            </div>
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="icon"
                className="rounded-lg border-dark-border bg-dark-elevated h-10 w-10"
                onClick={prev}
              >
                <ChevronLeft className="w-5 h-5" />
              </Button>
              <Button
                variant="outline"
                size="icon"
                className="rounded-lg border-dark-border bg-dark-elevated h-10 w-10"
                onClick={next}
              >
                <ChevronRight className="w-5 h-5" />
              </Button>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};