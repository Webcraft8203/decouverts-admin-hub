import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import { ArrowRight } from "lucide-react";
import { CATEGORIES, type CategoryDef } from "@/data/categories";

const UAV_SOLUTIONS_DATA = [
  {
    slug: "defence",
    title: "Defence & Tactical UAVs",
    description: "Mission-ready drone platforms for surveillance, reconnaissance, border monitoring, and defence operations.",
  },
  {
    slug: "surveillance",
    title: "Surveillance & Security",
    description: "Real-time aerial intelligence for public safety, security, monitoring, and situational awareness.",
  },
  {
    slug: "survey",
    title: "Survey & Mapping",
    description: "High-accuracy aerial mapping, GIS, photogrammetry, LiDAR integration, and terrain analysis.",
  },
  {
    // Assuming 'mining' or a new category for industrial inspection
    slug: "mining",
    title: "Industrial Inspection",
    description: "Infrastructure inspection for power lines, solar plants, telecom towers, pipelines, and industrial assets.",
  },
  {
    slug: "research",
    title: "Research & Development",
    description: "Custom UAV platforms, embedded systems, AI integration, autonomous flight systems, and next-generation drone technologies.",
  },
  {
    // This is a new conceptual category, we can link it to a relevant existing one like 'surveillance' or a general page.
    slug: "surveillance",
    title: "Disaster Response",
    description: "Rapid aerial assessment, search and rescue support, disaster monitoring, and emergency response operations.",
  },
];

const EASE_OUT: [number, number, number, number] = [0.22, 1, 0.36, 1];

const fadeUp = {
  initial: { opacity: 0, y: 24 },
  whileInView: { opacity: 1, y: 0 },
  viewport: { once: true, margin: "-80px" },
  transition: { duration: 0.7, ease: EASE_OUT },
};


interface SolutionCardProps {
  solution: (typeof UAV_SOLUTIONS_DATA)[0];
  category: CategoryDef | undefined;
  isLarge?: boolean;
  delay: number;
}

const SolutionCard = ({ solution, category, isLarge = false, delay }: SolutionCardProps) => {
  const href = category ? `/categories/${category.slug}` : "/#contact-section";
  const image = category?.image;

  return (
    <motion.div {...fadeUp} transition={{ ...fadeUp.transition, delay }}>
      <Link
        to={href}
        className="group relative block rounded-2xl overflow-hidden bg-card border border-border transition-all duration-300 hover:-translate-y-1.5 hover:shadow-[0_30px_60px_-20px_hsl(var(--primary)/0.2)] hover:border-primary/30"
      >
        <div className={`relative ${isLarge ? "aspect-[16/9]" : "aspect-square"}`}>
          {image && (
            <img
              src={image}
              alt={solution.title}
              loading="lazy"
              className="absolute inset-0 w-full h-full object-cover transition-all duration-500 ease-out group-hover:scale-105"
            />
          )}
          <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent opacity-80 group-hover:opacity-60 transition-opacity duration-300" />
        </div>

        <div className="absolute inset-x-0 bottom-0 p-6 md:p-8">
          <div className="relative">
            <h3
              className={`font-bold text-white leading-tight ${
                isLarge ? "text-3xl md:text-5xl" : "text-2xl"
              }`}
            >
              {solution.title}
            </h3>
            <p
              className={`mt-3 text-white/65 leading-relaxed ${
                isLarge ? "text-base max-w-lg" : "text-sm"
              }`}
            >
              {solution.description}
            </p>
            <div className="mt-6 flex items-center gap-2 text-sm font-semibold text-primary">
              <span>Learn More</span>
              <ArrowRight className="w-4 h-4 transition-transform duration-300 group-hover:translate-x-1" />
            </div>
            <div className="absolute bottom-[-8px] left-0 h-px w-1/3 bg-primary/50 transition-all duration-300 group-hover:w-1/2 group-hover:bg-primary" />
          </div>
        </div>
      </Link>
    </motion.div>
  );
};

export const ProductCategories = () => {
  const solutionsWithData = UAV_SOLUTIONS_DATA.map((solution) => ({
    ...solution,
    category: CATEGORIES.find((c) => c.slug === solution.slug),
  }));

  return (
    <section className="relative bg-background py-24 md:py-32 overflow-hidden">
      {/* Ambient accent */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-1/4 -left-32 w-96 h-96 rounded-full bg-primary/[0.04] blur-[120px]" />
      </div>

      <div className="relative max-w-7xl mx-auto px-6 sm:px-8 lg:px-12">
        {/* Editorial header */}
        <motion.div
          {...fadeUp}
          className="mb-14 md:mb-20 grid grid-cols-1 md:grid-cols-12 gap-8 items-end"
        >
          <div className="md:col-span-8">
            <div className="flex items-center gap-3 mb-4">
              <span className="h-px w-10 bg-primary" />
              <p className="text-primary font-semibold tracking-[0.2em] text-xs uppercase">
                Our UAV Solutions
              </p>
            </div>
            <h2 className="text-4xl md:text-6xl text-foreground font-bold leading-tight tracking-tighter">
              Advanced Drone Solutions Engineered for Every Mission
            </h2>
          </div>
          <div className="md:col-span-4 pb-2">
            <p className="text-muted-foreground text-sm md:text-base leading-relaxed border-l border-primary/60 pl-6">
              Discover indigenous UAV platforms engineered for defence, surveillance, mapping,
              inspection, and industrial operations with precision, reliability, and advanced engineering.
            </p>
          </div>
        </motion.div>

        {/* Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 md:gap-8">
          {solutionsWithData.map((solution, i) => {
            const isLarge = i === 0;
            const colSpan = isLarge ? "lg:col-span-3" : "lg:col-span-1";
            return (
              <div key={i} className={`w-full ${colSpan}`}>
                <SolutionCard solution={solution} category={solution.category} isLarge={isLarge} delay={i * 0.05} />
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
};
