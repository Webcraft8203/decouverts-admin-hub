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
    <section className="py-12 md:py-20 px-4 bg-slate-50 border-y border-slate-200 relative overflow-hidden">
      {/* Technical Background Grid */}
      <div className="absolute inset-0 pointer-events-none opacity-[0.03]" 
           style={{ backgroundImage: 'linear-gradient(#0f172a 1px, transparent 1px), linear-gradient(90deg, #0f172a 1px, transparent 1px)', backgroundSize: '40px 40px' }}>
      </div>

      <div className="max-w-6xl mx-auto relative z-10">
        <div className="flex flex-col md:flex-row justify-between items-end mb-8 md:mb-12 gap-6">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="max-w-2xl"
          >
            <div className="flex items-center gap-2 mb-3">
              <div className="h-1 w-8 bg-orange-500"></div>
              <span className="text-xs font-bold tracking-widest uppercase text-slate-500">Core Philosophy</span>
            </div>
            <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold text-slate-900 tracking-tight">
              Engineering the <span className="text-orange-600">Future</span>
            </h2>
            <p className="mt-4 text-slate-600 text-base md:text-lg leading-relaxed max-w-xl">
              Driven by a commitment to technological sovereignty and industrial excellence. We build systems that define the next generation of engineering.
            </p>
          </motion.div>

          {/* Navigation Controls */}
          <div className="flex items-center gap-2 hidden md:flex">
            <Button
              variant="outline"
              size="icon"
              className="rounded-none border-slate-300 hover:bg-slate-100 hover:text-orange-600 transition-colors"
              onClick={prev}
            >
              <ChevronLeft className="w-5 h-5" />
            </Button>
            <Button
              variant="outline"
              size="icon"
              className="rounded-none border-slate-300 hover:bg-slate-100 hover:text-orange-600 transition-colors"
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
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                transition={{ duration: 0.4, ease: "easeOut" }}
                className="grid grid-cols-1 md:grid-cols-12 gap-0 bg-white border border-slate-200 shadow-lg"
              >
                {/* Icon Section (Dark Navy) */}
                <div className="md:col-span-4 bg-slate-900 p-6 md:p-10 flex flex-col justify-between relative overflow-hidden group min-h-[220px] md:min-h-[300px]">
                  <motion.div 
                    className="absolute top-0 right-0 p-4 opacity-10"
                    animate={{ rotate: 360 }}
                    transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
                  >
                    <Cog className="w-24 h-24 md:w-32 md:h-32 text-white" />
                  </motion.div>
                  
                  <div className="relative z-10">
                    <div className="w-12 h-12 md:w-16 md:h-16 bg-orange-500/10 border border-orange-500/30 flex items-center justify-center mb-4 md:mb-6 rounded-sm">
                      {(() => {
                        const Icon = drives[currentIndex].icon;
                        return <Icon className="w-6 h-6 md:w-8 md:h-8 text-orange-500" />;
                      })()}
                    </div>
                    <div className="h-px w-8 md:w-12 bg-slate-700 mb-4 md:mb-6"></div>
                  </div>

                  <div className="relative z-10">
                    <span className="text-slate-400 text-[10px] md:text-xs font-mono mb-2 block">
                      0{currentIndex + 1} / 0{drives.length}
                    </span>
                    <div className="w-full bg-slate-800 h-0.5 md:h-1">
                      <motion.div 
                        className="bg-orange-500 h-full"
                        initial={{ width: 0 }}
                        animate={{ width: "100%" }}
                        transition={{ duration: 5, ease: "linear" }}
                        key={currentIndex} // Reset animation on change
                      />
                    </div>
                  </div>
                </div>

                {/* Content Section (White) */}
                <div className="md:col-span-8 p-6 md:p-12 flex flex-col justify-center relative">
                  <div className="mb-3 md:mb-0 md:absolute md:top-6 md:right-6 self-start md:self-auto">
                    <span className="inline-block px-2 py-0.5 md:px-3 md:py-1 bg-slate-100 text-slate-600 text-[10px] md:text-xs font-bold uppercase tracking-wider border border-slate-200 rounded-sm whitespace-nowrap">
                      {drives[currentIndex].tag}
                    </span>
                  </div>
                  
                  <h3 className="text-xl sm:text-2xl md:text-3xl font-bold text-slate-900 mb-3 md:mb-4 pr-0 md:pr-24">
                    {drives[currentIndex].title}
                  </h3>
                  <p className="text-slate-600 text-base md:text-lg leading-relaxed">
                    {drives[currentIndex].description}
                  </p>
                  
                  <div className="mt-6 md:mt-8 flex items-center text-sm font-semibold text-orange-600 uppercase tracking-wider cursor-pointer group w-max" onClick={next}>
                    Next Initiative <ChevronRight className="w-4 h-4 ml-1 group-hover:translate-x-1 transition-transform" />
                  </div>
                </div>
              </motion.div>
            </AnimatePresence>
          </div>

          {/* Mobile Navigation */}
          <div className="flex md:hidden justify-between items-center mt-6">
            <div className="flex gap-1">
              {drives.map((_, index) => (
                <button
                  key={index}
                  className={`h-1.5 transition-all duration-300 ${
                    index === currentIndex
                      ? "bg-orange-500 w-8"
                      : "bg-slate-300 w-4"
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
                className="rounded-none border-slate-300 h-10 w-10"
                onClick={prev}
              >
                <ChevronLeft className="w-5 h-5" />
              </Button>
              <Button
                variant="outline"
                size="icon"
                className="rounded-none border-slate-300 h-10 w-10"
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
