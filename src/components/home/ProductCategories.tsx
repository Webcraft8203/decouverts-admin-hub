import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import { ArrowUpRight } from "lucide-react";
import { CATEGORIES } from "@/data/categories";

export const ProductCategories = () => {
  return (
    <section className="relative py-24 md:py-32 bg-white overflow-hidden">
      {/* Ambient background */}
      <div className="absolute inset-0 pointer-events-none bg-[linear-gradient(to_right,rgba(15,23,42,0.035)_1px,transparent_1px),linear-gradient(to_bottom,rgba(15,23,42,0.035)_1px,transparent_1px)] bg-[size:72px_72px] [mask-image:radial-gradient(ellipse_at_center,black_40%,transparent_100%)]" />
      <div className="absolute -bottom-40 left-1/2 -translate-x-1/2 w-[820px] h-[440px] rounded-full bg-[radial-gradient(ellipse,rgba(255,107,0,0.08),transparent_70%)]" />

      <div className="container mx-auto px-4 sm:px-6 lg:px-8 relative">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-80px" }}
          transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
          className="mx-auto text-center mb-16 md:mb-20"
          style={{ maxWidth: 700 }}
        >
          <span className="inline-flex items-center gap-2 py-1.5 px-3.5 rounded-full bg-primary/8 text-primary text-[10px] font-bold tracking-[0.24em] uppercase mb-5 border border-primary/20">
            <span className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse" />
            Capabilities
          </span>
          <h2
            className="text-4xl md:text-5xl lg:text-6xl font-bold text-slate-900 leading-[1.05] tracking-tight"
            style={{ fontFamily: "'Montserrat', sans-serif" }}
          >
            Built for Every Mission.
          </h2>
          <p className="mt-5 text-base md:text-lg text-slate-600 leading-relaxed">
            From precision agriculture to defence operations, discover purpose-built drone platforms engineered for every industry.
          </p>
        </motion.div>

        {/* Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 md:gap-8">
          {CATEGORIES.map((c, i) => (
            <motion.div
              key={c.slug}
              initial={{ opacity: 0, y: 40 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-60px" }}
              transition={{ duration: 0.7, delay: (i % 4) * 0.08, ease: [0.16, 1, 0.3, 1] }}
            >
              <Link
                to={`/categories/${c.slug}`}
                className="group relative block overflow-hidden rounded-[28px] bg-slate-900 transition-all duration-500 hover:-translate-y-2 hover:shadow-[0_40px_80px_-20px_rgba(255,107,0,0.35)]"
                style={{ height: 480 }}
              >
                {/* Background image */}
                <div className="absolute inset-0 overflow-hidden">
                  <img
                    src={c.image}
                    alt={c.title}
                    loading="lazy"
                    width={1024}
                    height={1024}
                    className="w-full h-full object-cover transition-transform duration-[700ms] ease-out group-hover:scale-[1.08]"
                  />
                </div>

                {/* Overlay */}
                <div
                  className="absolute inset-0"
                  style={{
                    background:
                      "linear-gradient(to bottom, rgba(0,0,0,0.15) 0%, rgba(0,0,0,0.35) 45%, rgba(0,0,0,0.72) 100%)",
                  }}
                />

                {/* Orange glow on hover */}
                <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none"
                  style={{ background: "radial-gradient(ellipse at bottom right, rgba(255,107,0,0.28), transparent 60%)" }}
                />

                {/* Content */}
                <div className="relative h-full flex flex-col p-6 md:p-7">
                  {/* Glass badge */}
                  <div className="flex">
                    <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[10px] font-bold tracking-[0.2em] uppercase text-white border border-white/25 bg-white/10 backdrop-blur-md">
                      <span className="w-1 h-1 rounded-full bg-primary" />
                      Category
                    </span>
                  </div>

                  {/* Title + description at bottom */}
                  <div className="mt-auto">
                    <h3
                      className="text-2xl md:text-[26px] font-bold text-white leading-tight tracking-tight"
                      style={{ fontFamily: "'Montserrat', sans-serif" }}
                    >
                      {c.title}
                    </h3>
                    <p className="mt-2 text-sm text-white/75 leading-relaxed line-clamp-2 pr-14">
                      {c.description}
                    </p>

                    {/* Circular arrow */}
                    <div className="absolute bottom-6 right-6 md:bottom-7 md:right-7">
                      <div className="w-12 h-12 rounded-full flex items-center justify-center border border-white/25 bg-white/10 backdrop-blur-md text-white transition-all duration-500 group-hover:bg-primary group-hover:border-primary group-hover:shadow-[0_0_30px_rgba(255,107,0,0.6)] group-hover:rotate-45">
                        <ArrowUpRight className="w-5 h-5" />
                      </div>
                    </div>
                  </div>
                </div>

                {/* Corner brackets */}
                <div className="absolute top-5 right-5 w-5 h-5 border-t border-r border-white/30 opacity-60" />
                <div className="absolute bottom-5 left-5 w-5 h-5 border-b border-l border-white/30 opacity-60" />
              </Link>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
};
