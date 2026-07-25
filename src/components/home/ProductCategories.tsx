import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import { ArrowRight, ArrowUpRight, Plus } from "lucide-react";
import { CATEGORIES, type CategoryDef } from "@/data/categories";

/**
 * Bento layout config — indices match CATEGORIES order.
 * Locked structural composition from selected "Kinetic Editorial" direction.
 */
type TileVariant =
  | "hero-image-light" // 01 big image tile, light bg
  | "compact-light"    // small card, light
  | "compact-dark"     // small card, dark
  | "tall-image-light" // tall image tile, light
  | "compact-white"    // white with border, orange underline link
  | "compact-plus"     // light, plus icon CTA
  | "wide-dark-cta"    // wide dark banner with pill CTA
  | "half-light"       // wider light tile
  | "half-white";      // wider white tile

interface TileConfig {
  colSpan: string;
  rowSpan?: string;
  variant: TileVariant;
  ctaLabel?: string;
}

const LAYOUT: TileConfig[] = [
  { colSpan: "md:col-span-8", rowSpan: "md:row-span-2", variant: "hero-image-light" },     // Agriculture
  { colSpan: "md:col-span-4", variant: "compact-light" },                                   // Survey
  { colSpan: "md:col-span-4", variant: "compact-dark" },                                    // Surveillance
  { colSpan: "md:col-span-4", rowSpan: "md:row-span-2", variant: "tall-image-light" },     // Defence
  { colSpan: "md:col-span-4", variant: "compact-white" },                                   // Mining
  { colSpan: "md:col-span-4", variant: "compact-plus" },                                    // Research & Development
  { colSpan: "md:col-span-8", variant: "wide-dark-cta", ctaLabel: "Book Course" },          // Drone Training
  { colSpan: "md:col-span-6", variant: "half-light" },                                      // Educational
  { colSpan: "md:col-span-6", variant: "half-white" },                                      // 3D Printers
];

const idx2 = (n: number) => String(n + 1).padStart(2, "0");

const fadeUp = {
  initial: { opacity: 0, y: 24 },
  whileInView: { opacity: 1, y: 0 },
  viewport: { once: true, margin: "-60px" },
};

function Tile({
  cat,
  i,
  cfg,
}: {
  cat: CategoryDef;
  i: number;
  cfg: TileConfig;
}) {
  const href = `/categories/${cat.slug}`;
  const num = idx2(i);
  const base = `group relative overflow-hidden rounded-sm ${cfg.colSpan} ${cfg.rowSpan ?? ""}`;

  const arrowIcon = (
    <ArrowRight className="w-5 h-5 transition-transform duration-300 group-hover:translate-x-1" />
  );

  switch (cfg.variant) {
    case "hero-image-light":
      return (
        <motion.div {...fadeUp} transition={{ duration: 0.6, delay: i * 0.04, ease: [0.16, 1, 0.3, 1] }} className={base}>
          <Link to={href} className="block h-full bg-[#f0ebe3] p-8 md:p-10 flex flex-col justify-between relative">
            <div className="absolute inset-0 z-0">
              <img
                src={cat.image}
                alt={cat.title}
                loading="lazy"
                className="w-full h-full object-cover opacity-25 grayscale group-hover:grayscale-0 group-hover:scale-[1.04] transition-all duration-[900ms] ease-out"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-[#f0ebe3] via-[#f0ebe3]/40 to-transparent" />
            </div>
            <div className="relative z-10">
              <span className="text-[#ff6b00] text-xs font-medium italic font-['Instrument_Serif']">{num}.</span>
              <h3 className="text-4xl md:text-6xl font-['Instrument_Serif'] text-zinc-900 mt-2 leading-[0.95]">
                {cat.title}
              </h3>
              <p className="text-zinc-600 text-sm md:text-base mt-4 max-w-md leading-relaxed">
                {cat.description}
              </p>
            </div>
            <div className="relative z-10 flex items-center gap-3 text-[11px] font-bold uppercase tracking-[0.2em] text-[#ff6b00] mt-6">
              Explore Category
              <div className="w-8 h-[1px] bg-[#ff6b00] transition-all duration-500 group-hover:w-14" />
            </div>
          </Link>
        </motion.div>
      );

    case "tall-image-light":
      return (
        <motion.div {...fadeUp} transition={{ duration: 0.6, delay: i * 0.04, ease: [0.16, 1, 0.3, 1] }} className={base}>
          <Link to={href} className="block h-full bg-[#f0ebe3] p-8 flex flex-col justify-between relative min-h-[300px]">
            <div className="absolute inset-0 z-0">
              <img
                src={cat.image}
                alt={cat.title}
                loading="lazy"
                className="w-full h-full object-cover opacity-15 mix-blend-multiply group-hover:scale-[1.08] transition-transform duration-[900ms] ease-out"
              />
              <div className="absolute inset-0 bg-gradient-to-b from-transparent via-[#f0ebe3]/30 to-[#f0ebe3]/70" />
            </div>
            <div className="relative z-10">
              <span className="text-[#ff6b00] text-xs font-['Instrument_Serif'] italic">{num}.</span>
              <h3 className="text-3xl md:text-4xl font-['Instrument_Serif'] text-zinc-900 mt-2 leading-tight">
                {cat.title}
              </h3>
              <p className="text-sm text-zinc-600 mt-4 max-w-[240px] leading-relaxed">{cat.description}</p>
            </div>
            <div className="relative z-10 w-12 h-12 rounded-full border border-zinc-300 flex items-center justify-center text-zinc-900 group-hover:bg-[#ff6b00] group-hover:border-[#ff6b00] group-hover:text-white transition-all duration-300">
              <ArrowUpRight className="w-5 h-5" />
            </div>
          </Link>
        </motion.div>
      );

    case "compact-light":
      return (
        <motion.div {...fadeUp} transition={{ duration: 0.55, delay: i * 0.04, ease: [0.16, 1, 0.3, 1] }} className={base}>
          <Link to={href} className="block h-full bg-[#f0ebe3] p-8 border border-transparent hover:border-[#c9b99a] transition-colors duration-300 flex flex-col min-h-[220px]">
            <span className="text-[#ff6b00] text-xs font-['Instrument_Serif'] italic">{num}.</span>
            <h3 className="text-2xl font-['Instrument_Serif'] mt-2 text-zinc-900 leading-tight">{cat.title}</h3>
            <p className="text-xs text-zinc-500 mt-2 leading-relaxed">{cat.description}</p>
            <div className="mt-auto pt-6 text-[#ff6b00]">{arrowIcon}</div>
          </Link>
        </motion.div>
      );

    case "compact-dark":
      return (
        <motion.div {...fadeUp} transition={{ duration: 0.55, delay: i * 0.04, ease: [0.16, 1, 0.3, 1] }} className={base}>
          <Link to={href} className="block h-full bg-zinc-900 p-8 flex flex-col min-h-[220px]">
            <span className="text-white/40 text-xs font-['Instrument_Serif'] italic">{num}.</span>
            <h3 className="text-2xl font-['Instrument_Serif'] mt-2 text-white leading-tight">{cat.title}</h3>
            <p className="text-xs text-zinc-400 mt-2 leading-relaxed">{cat.description}</p>
            <div className="mt-auto pt-6 text-[#ff6b00]">{arrowIcon}</div>
          </Link>
        </motion.div>
      );

    case "compact-white":
      return (
        <motion.div {...fadeUp} transition={{ duration: 0.55, delay: i * 0.04, ease: [0.16, 1, 0.3, 1] }} className={base}>
          <Link to={href} className="block h-full bg-white p-8 border border-[#f0ebe3] hover:border-[#c9b99a] transition-colors duration-300 flex flex-col min-h-[220px]">
            <span className="text-[#c9b99a] text-xs font-['Instrument_Serif'] italic">{num}.</span>
            <h3 className="text-2xl font-['Instrument_Serif'] mt-2 text-zinc-900 leading-tight">{cat.title}</h3>
            <p className="text-xs text-zinc-500 mt-2 leading-relaxed">{cat.description}</p>
            <span className="mt-auto pt-6 inline-flex items-center gap-2 text-[11px] font-bold uppercase tracking-[0.2em] text-[#ff6b00] w-fit border-b border-[#ff6b00] pb-1">
              View Details
            </span>
          </Link>
        </motion.div>
      );

    case "compact-plus":
      return (
        <motion.div {...fadeUp} transition={{ duration: 0.55, delay: i * 0.04, ease: [0.16, 1, 0.3, 1] }} className={base}>
          <Link to={href} className="block h-full bg-[#f0ebe3] p-8 border border-transparent hover:border-[#c9b99a] transition-colors duration-300 relative min-h-[220px]">
            <span className="text-[#c9b99a] text-xs font-['Instrument_Serif'] italic">{num}.</span>
            <h3 className="text-2xl font-['Instrument_Serif'] mt-2 text-zinc-900 leading-tight">{cat.title}</h3>
            <p className="text-xs text-zinc-500 mt-2 leading-relaxed max-w-[240px]">{cat.description}</p>
            <div className="absolute bottom-8 right-8 text-[#c9b99a] group-hover:text-[#ff6b00] transition-colors duration-300">
              <Plus className="w-6 h-6" strokeWidth={1.5} />
            </div>
          </Link>
        </motion.div>
      );

    case "wide-dark-cta":
      return (
        <motion.div {...fadeUp} transition={{ duration: 0.6, delay: i * 0.04, ease: [0.16, 1, 0.3, 1] }} className={base}>
          <Link to={href} className="block h-full bg-zinc-900 p-8 md:p-10 flex flex-col md:flex-row items-start md:items-center justify-between gap-6 relative overflow-hidden min-h-[220px]">
            <div className="absolute inset-0 z-0">
              <img
                src={cat.image}
                alt={cat.title}
                loading="lazy"
                className="w-full h-full object-cover opacity-30 group-hover:opacity-40 group-hover:scale-[1.04] transition-all duration-[900ms] ease-out"
              />
              <div className="absolute inset-0 bg-gradient-to-r from-zinc-900 via-zinc-900/70 to-transparent" />
            </div>
            <div className="relative z-10 max-w-md">
              <span className="text-[#ff6b00] text-[10px] font-semibold tracking-[0.24em] uppercase mb-2 block">
                {cat.tagline}
              </span>
              <h3 className="text-3xl md:text-4xl font-['Instrument_Serif'] text-white leading-tight">{cat.title}</h3>
              <p className="text-xs md:text-sm text-zinc-400 mt-3 leading-relaxed">{cat.description}</p>
            </div>
            <span className="relative z-10 px-6 py-3 bg-white text-black text-[10px] font-bold uppercase tracking-[0.2em] group-hover:bg-[#ff6b00] group-hover:text-white transition-colors duration-300 whitespace-nowrap">
              {cfg.ctaLabel ?? "Explore"}
            </span>
          </Link>
        </motion.div>
      );

    case "half-light":
      return (
        <motion.div {...fadeUp} transition={{ duration: 0.55, delay: i * 0.04, ease: [0.16, 1, 0.3, 1] }} className={base}>
          <Link to={href} className="block h-full bg-[#f0ebe3] p-8 md:p-10 border border-transparent hover:border-[#c9b99a] transition-colors duration-300 flex flex-col justify-between min-h-[220px]">
            <div>
              <span className="text-[#ff6b00] text-xs font-['Instrument_Serif'] italic">{num}.</span>
              <h3 className="text-3xl font-['Instrument_Serif'] mt-2 text-zinc-900 leading-tight">{cat.title}</h3>
            </div>
            <div className="flex justify-between items-end gap-4 mt-6">
              <p className="text-xs text-zinc-500 max-w-[240px] leading-relaxed">{cat.description}</p>
              <div className="text-[#ff6b00] shrink-0">{arrowIcon}</div>
            </div>
          </Link>
        </motion.div>
      );

    case "half-white":
      return (
        <motion.div {...fadeUp} transition={{ duration: 0.55, delay: i * 0.04, ease: [0.16, 1, 0.3, 1] }} className={base}>
          <Link to={href} className="block h-full bg-white p-8 md:p-10 border border-[#f0ebe3] hover:bg-[#faf8f5] transition-colors duration-300 flex flex-col justify-between min-h-[220px]">
            <div>
              <span className="text-[#c9b99a] text-xs font-['Instrument_Serif'] italic">{num}.</span>
              <h3 className="text-3xl font-['Instrument_Serif'] mt-2 text-zinc-900 leading-tight">{cat.title}</h3>
            </div>
            <div className="flex justify-between items-end gap-4 mt-6">
              <p className="text-xs text-zinc-500 max-w-[240px] leading-relaxed">{cat.description}</p>
              <div className="text-[#ff6b00] shrink-0">{arrowIcon}</div>
            </div>
          </Link>
        </motion.div>
      );
  }
}

export const ProductCategories = () => {
  return (
    <section className="relative bg-[#faf8f5] py-20 md:py-28 overflow-hidden">
      <div className="max-w-7xl mx-auto px-6 sm:px-8 lg:px-12">
        {/* Editorial Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-80px" }}
          transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
          className="mb-16 md:mb-20 grid grid-cols-1 md:grid-cols-12 gap-8 items-end"
        >
          <div className="md:col-span-8">
            <p className="text-[#ff6b00] font-semibold tracking-[0.24em] text-[10px] uppercase mb-4">
              Core Verticals
            </p>
            <h2 className="text-5xl md:text-7xl lg:text-8xl font-['Instrument_Serif'] text-zinc-900 leading-[0.9]">
              Industry{" "}
              <span className="italic font-light text-[#c9b99a]">Capabilities</span>
            </h2>
          </div>
          <div className="md:col-span-4 pb-2">
            <p className="text-zinc-500 text-sm md:text-base leading-relaxed border-l border-[#c9b99a] pl-6">
              Bridging the gap between raw hardware and actionable intelligence
              through sector-specific drone and additive manufacturing platforms.
            </p>
          </div>
        </motion.div>

        {/* Bento Grid */}
        <div className="grid grid-cols-1 md:grid-cols-12 gap-4 md:auto-rows-[240px]">
          {CATEGORIES.map((cat, i) => (
            <Tile key={cat.slug} cat={cat} i={i} cfg={LAYOUT[i] ?? { colSpan: "md:col-span-4", variant: "compact-light" }} />
          ))}
        </div>
      </div>
    </section>
  );
};
