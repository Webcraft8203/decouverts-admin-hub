import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import {
  ArrowRight,
  Plane,
  Sprout,
  Map,
  Eye,
  Shield,
  Cpu,
  Zap,
  Layers,
  FlaskConical,
  Printer,
  Wrench,
  Package,
  Boxes,
  GraduationCap,
  Bot,
  Hammer,
  Briefcase,
  type LucideIcon,
} from "lucide-react";

import uavImg from "@/assets/capabilities/uav-solutions.jpg";
import engineeringImg from "@/assets/capabilities/engineering-rd.jpg";
import manufacturingImg from "@/assets/capabilities/manufacturing.jpg";
import stemImg from "@/assets/capabilities/stem-education.jpg";

interface Feature {
  icon: LucideIcon;
  label: string;
}

interface Division {
  title: string;
  description: string;
  image: string;
  href: string;
  features: Feature[];
}

const DIVISIONS: Division[] = [
  {
    title: "UAV Solutions",
    description:
      "Made-in-India drone platforms for industrial and mission-critical applications.",
    image: uavImg,
    href: "/shop",
    features: [
      { icon: Sprout, label: "Agriculture" },
      { icon: Map, label: "Survey & Mapping" },
      { icon: Eye, label: "Surveillance" },
      { icon: Shield, label: "Defence" },
    ],
  },
  {
    title: "Engineering & R&D",
    description:
      "End-to-end product engineering, from concept to certified hardware.",
    image: engineeringImg,
    href: "/about",
    features: [
      { icon: Cpu, label: "Product Design" },
      { icon: Zap, label: "Rapid Prototyping" },
      { icon: Layers, label: "Embedded Systems" },
      { icon: FlaskConical, label: "Research & Development" },
    ],
  },
  {
    title: "Advanced Manufacturing",
    description:
      "Industrial-grade additive manufacturing and precision small-batch production.",
    image: manufacturingImg,
    href: "/shop",
    features: [
      { icon: Printer, label: "Industrial 3D Printing" },
      { icon: Wrench, label: "Reverse Engineering" },
      { icon: Package, label: "Functional Prototypes" },
      { icon: Boxes, label: "Small Batch Production" },
    ],
  },
  {
    title: "STEM Education & Training",
    description:
      "Hands-on programs that build the next generation of aerospace engineers.",
    image: stemImg,
    href: "/about",
    features: [
      { icon: GraduationCap, label: "Drone Training" },
      { icon: Bot, label: "Robotics" },
      { icon: Hammer, label: "Engineering Workshops" },
      { icon: Briefcase, label: "Industrial Training" },
    ],
  },
];

export const ProductCategories = () => {
  return (
    <section className="relative py-24 md:py-[120px] overflow-hidden bg-[#0a0f1a]">
      {/* Base gradient */}
      <div
        aria-hidden
        className="absolute inset-0"
        style={{
          background:
            "linear-gradient(180deg, #0a0f1a 0%, #0d1524 45%, #0a0f1a 100%)",
        }}
      />
      {/* Blueprint grid */}
      <div
        aria-hidden
        className="absolute inset-0 opacity-[0.06] [mask-image:radial-gradient(ellipse_at_center,black,transparent_75%)]"
        style={{
          backgroundImage:
            "linear-gradient(rgba(255,255,255,0.9) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.9) 1px, transparent 1px)",
          backgroundSize: "56px 56px",
        }}
      />
      {/* Ambient orange glows */}
      <div
        aria-hidden
        className="absolute top-1/3 -left-40 w-[520px] h-[520px] rounded-full blur-3xl opacity-40 pointer-events-none"
        style={{ background: "radial-gradient(circle, rgba(255,107,0,0.18), transparent 70%)" }}
      />
      <div
        aria-hidden
        className="absolute bottom-0 -right-40 w-[600px] h-[600px] rounded-full blur-3xl opacity-40 pointer-events-none"
        style={{ background: "radial-gradient(circle, rgba(255,107,0,0.14), transparent 70%)" }}
      />

      <div className="relative mx-auto px-4 sm:px-6 lg:px-8" style={{ maxWidth: 1300 }}>
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-80px" }}
          transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
          className="mx-auto text-center mb-16 md:mb-20 max-w-3xl"
        >
          <span className="inline-flex items-center gap-2 py-1.5 px-3.5 rounded-full bg-[#ff6b00]/10 text-[#ff8534] text-[10px] font-bold tracking-[0.28em] uppercase mb-6 border border-[#ff6b00]/25">
            <span className="w-1.5 h-1.5 rounded-full bg-[#ff6b00]" />
            Our Capabilities
          </span>
          <h2
            className="text-4xl md:text-5xl lg:text-[56px] font-bold text-white leading-[1.05] tracking-tight"
            style={{ fontFamily: "'Montserrat', sans-serif" }}
          >
            Engineering Solutions for Every Mission
          </h2>
          <p className="mt-6 text-base md:text-lg text-slate-400 leading-relaxed">
            From advanced UAV platforms to engineering services, STEM education, industrial
            manufacturing, and research, Decouvertes delivers complete technology solutions
            built for industry and innovation.
          </p>
        </motion.div>

        {/* 2x2 Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 md:gap-10">
          {DIVISIONS.map((d, i) => (
            <motion.div
              key={d.title}
              initial={{ opacity: 0, y: 40 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-80px" }}
              transition={{ duration: 0.7, delay: (i % 2) * 0.1, ease: [0.16, 1, 0.3, 1] }}
            >
              <Link
                to={d.href}
                className="group relative block overflow-hidden rounded-[24px] border border-white/10 bg-white/[0.02] backdrop-blur-sm transition-all duration-[400ms] ease-out hover:-translate-y-2 hover:border-[#ff6b00]/40 hover:shadow-[0_30px_80px_-20px_rgba(255,107,0,0.35)]"
              >
                {/* Landscape image */}
                <div className="relative aspect-[16/9] overflow-hidden">
                  <img
                    src={d.image}
                    alt={d.title}
                    loading="lazy"
                    width={1600}
                    height={900}
                    className="w-full h-full object-cover transition-transform duration-[900ms] ease-out group-hover:scale-[1.06]"
                  />
                  {/* Dark gradient */}
                  <div
                    aria-hidden
                    className="absolute inset-0"
                    style={{
                      background:
                        "linear-gradient(to bottom, rgba(10,15,26,0.1) 0%, rgba(10,15,26,0.55) 60%, rgba(10,15,26,0.95) 100%)",
                    }}
                  />
                  {/* Orange hover glow */}
                  <div
                    aria-hidden
                    className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500"
                    style={{
                      background:
                        "linear-gradient(135deg, rgba(255,107,0,0.0) 0%, rgba(255,107,0,0.18) 100%)",
                    }}
                  />
                </div>

                {/* Content */}
                <div className="relative p-7 md:p-9 -mt-16 md:-mt-20">
                  <h3
                    className="text-[26px] md:text-[32px] font-bold text-white leading-tight tracking-tight"
                    style={{ fontFamily: "'Montserrat', sans-serif" }}
                  >
                    {d.title}
                  </h3>
                  <p className="mt-3 text-[15px] md:text-base text-slate-300/90 leading-relaxed max-w-[52ch]">
                    {d.description}
                  </p>

                  {/* Feature bullets */}
                  <ul className="mt-6 grid grid-cols-2 gap-x-4 gap-y-3">
                    {d.features.map((f) => {
                      const Icon = f.icon;
                      return (
                        <li
                          key={f.label}
                          className="flex items-center gap-2.5 text-[13.5px] md:text-sm text-white/90"
                        >
                          <span className="flex items-center justify-center w-7 h-7 rounded-md bg-[#ff6b00]/10 border border-[#ff6b00]/25 text-[#ff8534] transition-all duration-300 group-hover:bg-[#ff6b00]/20 group-hover:border-[#ff6b00]/50 group-hover:scale-110">
                            <Icon className="w-3.5 h-3.5" strokeWidth={2.4} />
                          </span>
                          <span className="font-medium tracking-tight">{f.label}</span>
                        </li>
                      );
                    })}
                  </ul>

                  {/* CTA */}
                  <div className="mt-8 flex items-center gap-2 text-[#ff8534] text-sm font-semibold tracking-wide">
                    <span className="transition-transform duration-300 group-hover:translate-x-0">
                      Explore Solutions
                    </span>
                    <ArrowRight className="w-4 h-4 transition-transform duration-300 group-hover:translate-x-1.5" />
                    <span
                      aria-hidden
                      className="ml-1 h-px w-8 bg-gradient-to-r from-[#ff6b00]/60 to-transparent transition-all duration-300 group-hover:w-14"
                    />
                  </div>
                </div>

                {/* Corner accents */}
                <div className="pointer-events-none absolute top-4 right-4 w-6 h-6 border-t border-r border-white/25 opacity-60 rounded-tr-md" />
                <div className="pointer-events-none absolute bottom-4 left-4 w-6 h-6 border-b border-l border-white/15 opacity-50 rounded-bl-md" />
              </Link>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
};
