import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import { ArrowRight, ArrowUpRight, Plus } from "lucide-react";
import { CATEGORIES, type CategoryDef } from "@/data/categories";

/**
 * Curated verticals — Defence-led. Excludes agriculture, drone training, 3D printers.
 * Order dictates bento composition.
 */
const FEATURED_SLUGS = [
  "defence",       // 01 — hero
  "surveillance",  // 02 — dark compact
  "survey",        // 03 — light compact
  "mining",        // 04 — tall image
  "research",      // 05 — half dark
  "educational",   // 06 — half compact
] as const;

type TileVariant =
  | "hero-defence"
  | "compact-dark"
  | "compact-glass"
  | "tall-image"
  | "half-dark-cta"
  | "half-glass";

interface TileConfig {
  colSpan: string;
  rowSpan?: string;
  variant: TileVariant;
  ctaLabel?: string;
}

const LAYOUT: TileConfig[] = [
  { colSpan: "md:col-span-8", rowSpan: "md:row-span-2", variant: "hero-defence" },
  { colSpan: "md:col-span-4", variant: "compact-dark" },
  { colSpan: "md:col-span-4", variant: "compact-glass" },
  { colSpan: "md:col-span-4", rowSpan: "md:row-span-2", variant: "tall-image" },
  { colSpan: "md:col-span-4", variant: "half-dark-cta", ctaLabel: "Explore R&D" },
  { colSpan: "md:col-span-4", variant: "half-glass" },
];

const idx2 = (n: number) => String(n + 1).padStart(2, "0");

const fadeUp = {
  initial: { opacity: 0, y: 24 },
  whileInView: { opacity: 1, y: 0 },
  viewport: { once: true, margin: "-60px" },
};

function Tile({ cat, i, cfg }: { cat: CategoryDef; i: number; cfg: TileConfig }) {
  const href = `/categories/${cat.slug}`;
  const num = idx2(i);
  const base = `group relative overflow-hidden rounded-sm ${cfg.colSpan} ${cfg.rowSpan ?? ""}`;
  const arrow = (
    <ArrowRight className="w-5 h-5 transition-transform duration-300 group-hover:translate-x-1" />
  );

  switch (cfg.variant) {
    case "hero-defence":
      return (
        <motion.div {...fadeUp} transition={{ duration: 0.7, delay: i * 0.05, ease: [0.16, 1, 0.3, 1] }} className={base}>
          <Link
            to={href}
            className="block h-full bg-[#0b1220] p-8 md:p-12 flex flex-col justify-between relative min-h-[420px]"
          >
            <div className="absolute inset-0 z-0">
              <img
                src={cat.image}
                alt={cat.title}
                loading="lazy"
                className="w-full h-full object-cover opacity-40 group-hover:opacity-55 group-hover:scale-[1.05] transition-all duration-[900ms] ease-out"
              />
              <div className="absolute inset-0 bg-gradient-to-tr from-[#0b1220] via-[#0b1220]/85 to-transparent" />
              <div className="absolute inset-0 bg-gradient-to-t from-[#0b1220] via-transparent to-transparent" />
            </div>
            <div className="relative z-10 flex items-center gap-3">
              <span className="text-[#ff6b00] text-xs italic">{num}.</span>
              <span className="h-px w-8 bg-[#ff6b00]/60" />
              <span className="text-[10px] font-semibold tracking-[0.28em] uppercase text-[#ff6b00]">
                {cat.tagline}
              </span>
            </div>
            <div className="relative z-10">
              <h3 className="text-5xl md:text-7xl text-white leading-[0.95]">
                {cat.title}
              </h3>
              <p className="text-slate-300 text-sm md:text-base mt-5 max-w-lg leading-relaxed">
                {cat.description}
              </p>
              <div className="mt-8 flex items-center gap-4">
                <span className="px-6 py-3 bg-[#ff6b00] text-white text-[10px] font-bold uppercase tracking-[0.22em] group-hover:bg-white group-hover:text-[#0b1220] transition-colors duration-300">
                  Deploy Fleet
                </span>
                <span className="inline-flex items-center gap-2 text-[10px] font-bold uppercase tracking-[0.22em] text-white/70">
                  Mission Brief
                  <ArrowUpRight className="w-3.5 h-3.5" />
                </span>
              </div>
            </div>
          </Link>
        </motion.div>
      );

    case "compact-dark":
      return (
        <motion.div {...fadeUp} transition={{ duration: 0.55, delay: i * 0.05, ease: [0.16, 1, 0.3, 1] }} className={base}>
          <Link
            to={href}
            className="relative block h-full bg-[#111a2e] p-8 flex flex-col min-h-[200px] border border-white/5 hover:border-[#ff6b00]/40 transition-colors duration-300 overflow-hidden"
          >
            <div className="absolute inset-0 z-0">
              <img
                src={cat.image}
                alt={cat.title}
                loading="lazy"
                className="w-full h-full object-cover opacity-25 group-hover:opacity-40 group-hover:scale-[1.05] transition-all duration-[900ms] ease-out"
              />
              <div className="absolute inset-0 bg-gradient-to-r from-[#111a2e] via-[#111a2e]/85 to-[#111a2e]/40" />
            </div>
            <div className="relative z-10 flex flex-col h-full">
              <span className="text-white/30 text-xs italic">{num}.</span>
              <h3 className="text-2xl md:text-3xl mt-2 text-white leading-tight">
                {cat.title}
              </h3>
              <p className="text-xs text-slate-400 mt-2 leading-relaxed">{cat.description}</p>
              <div className="mt-auto pt-6 text-[#ff6b00]">{arrow}</div>
            </div>
          </Link>
        </motion.div>
      );

    case "compact-glass":
      return (
        <motion.div {...fadeUp} transition={{ duration: 0.55, delay: i * 0.05, ease: [0.16, 1, 0.3, 1] }} className={base}>
          <Link
            to={href}
            className="relative block h-full bg-white/[0.03] backdrop-blur p-8 flex flex-col min-h-[200px] border border-white/10 hover:bg-white/[0.06] hover:border-[#ff6b00]/40 transition-all duration-300 overflow-hidden"
          >
            <div className="absolute inset-0 z-0">
              <img
                src={cat.image}
                alt={cat.title}
                loading="lazy"
                className="w-full h-full object-cover opacity-20 group-hover:opacity-35 group-hover:scale-[1.05] transition-all duration-[900ms] ease-out"
              />
              <div className="absolute inset-0 bg-gradient-to-br from-[#0F172A]/90 via-[#0F172A]/70 to-transparent" />
            </div>
            <div className="relative z-10 flex flex-col h-full">
              <span className="text-[#ff6b00]/80 text-xs italic">{num}.</span>
              <h3 className="text-2xl md:text-3xl mt-2 text-white leading-tight">
                {cat.title}
              </h3>
              <p className="text-xs text-slate-400 mt-2 leading-relaxed">{cat.description}</p>
              <span className="mt-auto pt-6 inline-flex items-center gap-2 text-[10px] font-bold uppercase tracking-[0.22em] text-[#ff6b00] w-fit border-b border-[#ff6b00]/60 pb-1">
                Recon Details
              </span>
            </div>
          </Link>
        </motion.div>
      );

    case "tall-image":
      return (
        <motion.div {...fadeUp} transition={{ duration: 0.6, delay: i * 0.05, ease: [0.16, 1, 0.3, 1] }} className={base}>
          <Link
            to={href}
            className="block h-full bg-[#0b1220] p-8 flex flex-col justify-between relative min-h-[300px] border border-white/5"
          >
            <div className="absolute inset-0 z-0">
              <img
                src={cat.image}
                alt={cat.title}
                loading="lazy"
                className="w-full h-full object-cover opacity-35 group-hover:opacity-50 group-hover:scale-[1.06] transition-all duration-[900ms] ease-out"
              />
              <div className="absolute inset-0 bg-gradient-to-b from-transparent via-[#0b1220]/50 to-[#0b1220]" />
            </div>
            <div className="relative z-10">
              <span className="text-[#ff6b00] text-xs italic">{num}.</span>
              <h3 className="text-3xl md:text-4xl text-white mt-2 leading-tight">
                {cat.title}
              </h3>
              <p className="text-sm text-slate-300 mt-4 max-w-[240px] leading-relaxed">
                {cat.description}
              </p>
            </div>
            <div className="relative z-10 w-12 h-12 rounded-full border border-white/20 flex items-center justify-center text-white group-hover:bg-[#ff6b00] group-hover:border-[#ff6b00] transition-all duration-300">
              <ArrowUpRight className="w-5 h-5" />
            </div>
          </Link>
        </motion.div>
      );

    case "half-dark-cta":
      return (
        <motion.div {...fadeUp} transition={{ duration: 0.55, delay: i * 0.05, ease: [0.16, 1, 0.3, 1] }} className={base}>
          <Link
            to={href}
            className="relative block h-full bg-[#111a2e] p-8 flex flex-col justify-between min-h-[200px] border border-white/5 hover:border-[#ff6b00]/40 transition-colors duration-300 overflow-hidden"
          >
            <div className="absolute inset-0 z-0">
              <img
                src={cat.image}
                alt={cat.title}
                loading="lazy"
                className="w-full h-full object-cover opacity-25 group-hover:opacity-40 group-hover:scale-[1.05] transition-all duration-[900ms] ease-out"
              />
              <div className="absolute inset-0 bg-gradient-to-l from-[#111a2e] via-[#111a2e]/85 to-[#111a2e]/40" />
            </div>
            <div className="absolute -right-6 -top-6 w-32 h-32 rounded-full bg-[#ff6b00]/10 blur-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
            <div className="relative z-10">
              <span className="text-white/30 text-xs italic">{num}.</span>
              <h3 className="text-2xl md:text-3xl mt-2 text-white leading-tight">
                {cat.title}
              </h3>
              <p className="text-xs text-slate-400 mt-2 leading-relaxed">{cat.description}</p>
            </div>
            <div className="relative z-10 mt-6 flex items-center justify-between">
              <span className="text-[10px] font-bold uppercase tracking-[0.22em] text-[#ff6b00]">
                {cfg.ctaLabel ?? "Explore"}
              </span>
              <div className="text-[#ff6b00]">{arrow}</div>
            </div>
          </Link>
        </motion.div>
      );

    case "half-glass":
      return (
        <motion.div {...fadeUp} transition={{ duration: 0.55, delay: i * 0.05, ease: [0.16, 1, 0.3, 1] }} className={base}>
          <Link
            to={href}
            className="relative block h-full bg-white/[0.03] p-8 flex flex-col justify-between min-h-[200px] border border-white/10 hover:bg-white/[0.06] hover:border-[#ff6b00]/40 transition-all duration-300 overflow-hidden"
          >
            <div className="absolute inset-0 z-0">
              <img
                src={cat.image}
                alt={cat.title}
                loading="lazy"
                className="w-full h-full object-cover opacity-20 group-hover:opacity-35 group-hover:scale-[1.05] transition-all duration-[900ms] ease-out"
              />
              <div className="absolute inset-0 bg-gradient-to-tr from-[#0F172A]/90 via-[#0F172A]/70 to-transparent" />
            </div>
            <div className="relative z-10">
              <span className="text-[#ff6b00]/80 text-xs italic">{num}.</span>
              <h3 className="text-2xl md:text-3xl mt-2 text-white leading-tight">
                {cat.title}
              </h3>
            </div>
            <div className="relative z-10 mt-4 flex items-end justify-between gap-4">
              <p className="text-xs text-slate-400 max-w-[240px] leading-relaxed">{cat.description}</p>
              <div className="text-[#ff6b00] shrink-0">
                <Plus className="w-6 h-6" strokeWidth={1.5} />
              </div>
            </div>
          </Link>
        </motion.div>
      );
  }
}

export const ProductCategories = () => {
  const featured = FEATURED_SLUGS
    .map((slug) => CATEGORIES.find((c) => c.slug === slug))
    .filter((c): c is CategoryDef => Boolean(c));

  return (
    <section className="relative bg-[#0F172A] py-20 md:py-28 overflow-hidden">
      {/* Ambient accents */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-1/3 -left-24 w-96 h-96 rounded-full bg-[#ff6b00]/[0.06] blur-[120px]" />
        <div className="absolute bottom-0 right-0 w-[500px] h-[500px] rounded-full bg-[#ff6b00]/[0.04] blur-[140px]" />
        <div
          className="absolute inset-0 opacity-[0.03]"
          style={{
            backgroundImage:
              "linear-gradient(rgba(255,255,255,0.6) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.6) 1px, transparent 1px)",
            backgroundSize: "80px 80px",
          }}
        />
      </div>

      <div className="relative max-w-7xl mx-auto px-6 sm:px-8 lg:px-12">
        {/* Editorial header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-80px" }}
          transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
          className="mb-14 md:mb-20 grid grid-cols-1 md:grid-cols-12 gap-8 items-end"
        >
          <div className="md:col-span-8">
            <div className="flex items-center gap-3 mb-4">
              <span className="h-px w-10 bg-[#ff6b00]" />
              <p className="text-[#ff6b00] font-semibold tracking-[0.28em] text-[10px] uppercase">
                Mission Verticals
              </p>
            </div>
            <h2 className="text-5xl md:text-7xl lg:text-8xl text-white leading-[0.9]">
              Defence-Grade{" "}
              <span className="italic font-light text-[#ff6b00]">Capabilities</span>
            </h2>
          </div>
          <div className="md:col-span-4 pb-2">
            <p className="text-slate-400 text-sm md:text-base leading-relaxed border-l border-[#ff6b00]/60 pl-6">
              Mission-ready UAV platforms engineered in India for defence, homeland
              security and critical intelligence operations across land, sea and sky.
            </p>
          </div>
        </motion.div>

        {/* Bento */}
        <div className="grid grid-cols-1 md:grid-cols-12 gap-4 md:auto-rows-[210px]">
          {featured.map((cat, i) => (
            <Tile
              key={cat.slug}
              cat={cat}
              i={i}
              cfg={LAYOUT[i] ?? { colSpan: "md:col-span-4", variant: "compact-dark" }}
            />
          ))}
        </div>
      </div>
    </section>
  );
};
