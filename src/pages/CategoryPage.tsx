import { Link, useParams, Navigate } from "react-router-dom";
import { motion } from "framer-motion";
import { ArrowRight, CheckCircle2, Sparkles, ShieldCheck, Cpu, Users } from "lucide-react";
import { PublicNavbar } from "@/components/PublicNavbar";
import { PublicFooter } from "@/components/PublicFooter";
import { Button } from "@/components/ui/button";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { getCategoryBySlug, CATEGORIES } from "@/data/categories";
import { usePageSEO } from "@/hooks/usePageSEO";

const CategoryPage = () => {
  const { slug } = useParams<{ slug: string }>();
  const category = slug ? getCategoryBySlug(slug) : undefined;

  usePageSEO({
    title: category
      ? `${category.title} Drones | Decouvertes`
      : "Category | Decouvertes",
    description: category?.description ?? "",
    path: `/categories/${slug ?? ""}`,
  });

  if (!category) return <Navigate to="/" replace />;

  const whyChoose = [
    { icon: ShieldCheck, title: "Made in India", desc: "Indigenously designed, built and supported." },
    { icon: Cpu, title: "R&D Driven", desc: "In-house avionics, autonomy and airframe design." },
    { icon: Sparkles, title: "Enterprise Grade", desc: "Engineered for mission-critical operations." },
    { icon: Users, title: "24/7 Support", desc: "Dedicated engineers on-call for your fleet." },
  ];

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <PublicNavbar />

      <main className="flex-1 pt-16 md:pt-20">
        {/* HERO */}
        <section className="relative h-[80vh] min-h-[560px] w-full overflow-hidden">
          <img
            src={category.image}
            alt={category.title}
            className="absolute inset-0 w-full h-full object-cover"
          />
          <div
            className="absolute inset-0"
            style={{
              background:
                "linear-gradient(90deg, rgba(8,12,20,0.82) 0%, rgba(8,12,20,0.55) 55%, rgba(8,12,20,0.25) 100%)",
            }}
          />
          <div className="relative h-full container mx-auto px-4 sm:px-6 lg:px-8 flex items-center">
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.9, ease: [0.16, 1, 0.3, 1] }}
              className="max-w-2xl"
            >
              <span className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full text-[10px] font-bold tracking-[0.24em] uppercase text-white border border-white/25 bg-white/10 backdrop-blur-md mb-6">
                <span className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse" />
                Capability
              </span>
              <h1
                className="text-5xl md:text-7xl font-bold text-white leading-[1.02] tracking-tight"
                style={{ fontFamily: "'Montserrat', sans-serif" }}
              >
                {category.title}
              </h1>
              <p className="mt-6 text-lg md:text-xl text-white/80 leading-relaxed max-w-xl">
                {category.intro}
              </p>
              <div className="mt-8 flex flex-wrap gap-3">
                <Button asChild size="lg" className="bg-primary hover:bg-primary/90 text-white rounded-full px-7 h-12">
                  <Link to="/shop">
                    Explore Products <ArrowRight className="w-4 h-4" />
                  </Link>
                </Button>
                <Button asChild size="lg" variant="outline" className="rounded-full px-7 h-12 border-white/30 bg-white/5 text-white hover:bg-white/15 hover:text-white">
                  <Link to="/#contact">Talk to Sales</Link>
                </Button>
              </div>
            </motion.div>
          </div>
        </section>

        {/* APPLICATIONS */}
        <section className="py-20 md:py-28 bg-white">
          <div className="container mx-auto px-4 sm:px-6 lg:px-8">
            <div className="max-w-2xl mb-14">
              <p className="text-[10px] font-bold tracking-[0.24em] uppercase text-primary mb-3">Applications</p>
              <h2 className="text-3xl md:text-5xl font-bold text-slate-900 tracking-tight" style={{ fontFamily: "'Montserrat', sans-serif" }}>
                Engineered for real missions.
              </h2>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
              {category.applications.map((a, i) => (
                <motion.div
                  key={a.title}
                  initial={{ opacity: 0, y: 24 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true, margin: "-60px" }}
                  transition={{ duration: 0.55, delay: i * 0.06 }}
                  className="group relative rounded-2xl border border-slate-200 bg-white p-6 hover:border-primary/40 hover:shadow-[0_30px_60px_-30px_rgba(255,107,0,0.35)] hover:-translate-y-1 transition-all duration-500"
                >
                  <div className="w-11 h-11 rounded-xl bg-primary/10 border border-primary/20 flex items-center justify-center mb-4">
                    <Sparkles className="w-5 h-5 text-primary" />
                  </div>
                  <h3 className="text-lg font-bold text-slate-900">{a.title}</h3>
                  <p className="mt-2 text-sm text-slate-600 leading-relaxed">{a.description}</p>
                </motion.div>
              ))}
            </div>
          </div>
        </section>

        {/* INDUSTRIES + SPECS */}
        <section className="py-20 md:py-28 bg-slate-50">
          <div className="container mx-auto px-4 sm:px-6 lg:px-8 grid lg:grid-cols-2 gap-12">
            <div>
              <p className="text-[10px] font-bold tracking-[0.24em] uppercase text-primary mb-3">Industries Served</p>
              <h2 className="text-3xl md:text-4xl font-bold text-slate-900 tracking-tight mb-6" style={{ fontFamily: "'Montserrat', sans-serif" }}>
                Trusted across sectors.
              </h2>
              <div className="flex flex-wrap gap-2.5">
                {category.industries.map((ind) => (
                  <span key={ind} className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white border border-slate-200 text-sm font-medium text-slate-700">
                    <CheckCircle2 className="w-4 h-4 text-primary" />
                    {ind}
                  </span>
                ))}
              </div>
            </div>
            <div className="rounded-2xl bg-slate-900 text-white p-8 md:p-10">
              <p className="text-[10px] font-bold tracking-[0.24em] uppercase text-primary mb-3">Specifications</p>
              <h3 className="text-2xl md:text-3xl font-bold mb-6" style={{ fontFamily: "'Montserrat', sans-serif" }}>
                Platform highlights.
              </h3>
              <dl className="divide-y divide-white/10">
                {category.specifications.map((s) => (
                  <div key={s.label} className="flex justify-between py-3 text-sm">
                    <dt className="text-white/60">{s.label}</dt>
                    <dd className="font-semibold text-white">{s.value}</dd>
                  </div>
                ))}
              </dl>
            </div>
          </div>
        </section>

        {/* WHY CHOOSE */}
        <section className="py-20 md:py-28 bg-white">
          <div className="container mx-auto px-4 sm:px-6 lg:px-8">
            <div className="max-w-2xl mb-14">
              <p className="text-[10px] font-bold tracking-[0.24em] uppercase text-primary mb-3">Why Decouvertes</p>
              <h2 className="text-3xl md:text-5xl font-bold text-slate-900 tracking-tight" style={{ fontFamily: "'Montserrat', sans-serif" }}>
                The indigenous drone advantage.
              </h2>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
              {whyChoose.map((w) => (
                <div key={w.title} className="rounded-2xl border border-slate-200 p-6 hover:border-primary/40 hover:-translate-y-1 transition-all duration-500">
                  <div className="w-11 h-11 rounded-xl bg-primary/10 border border-primary/20 flex items-center justify-center mb-4">
                    <w.icon className="w-5 h-5 text-primary" />
                  </div>
                  <h3 className="text-lg font-bold text-slate-900">{w.title}</h3>
                  <p className="mt-2 text-sm text-slate-600">{w.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* FAQ */}
        {category.faqs.length > 0 && (
          <section className="py-20 md:py-28 bg-slate-50">
            <div className="container mx-auto px-4 sm:px-6 lg:px-8 max-w-3xl">
              <p className="text-[10px] font-bold tracking-[0.24em] uppercase text-primary mb-3 text-center">FAQ</p>
              <h2 className="text-3xl md:text-5xl font-bold text-slate-900 tracking-tight text-center mb-10" style={{ fontFamily: "'Montserrat', sans-serif" }}>
                Frequently asked.
              </h2>
              <Accordion type="single" collapsible className="space-y-3">
                {category.faqs.map((f, i) => (
                  <AccordionItem key={i} value={`item-${i}`} className="rounded-2xl border border-slate-200 bg-white px-5">
                    <AccordionTrigger className="text-left font-semibold text-slate-900 hover:no-underline">
                      {f.q}
                    </AccordionTrigger>
                    <AccordionContent className="text-slate-600">{f.a}</AccordionContent>
                  </AccordionItem>
                ))}
              </Accordion>
            </div>
          </section>
        )}

        {/* CTA */}
        <section className="relative py-24 overflow-hidden bg-slate-900 text-white">
          <div className="absolute inset-0 opacity-40" style={{ background: "radial-gradient(ellipse at 30% 50%, rgba(255,107,0,0.25), transparent 60%)" }} />
          <div className="container mx-auto px-4 sm:px-6 lg:px-8 relative text-center max-w-3xl">
            <h2 className="text-3xl md:text-5xl font-bold tracking-tight" style={{ fontFamily: "'Montserrat', sans-serif" }}>
              Ready to deploy {category.title.toLowerCase()} drones?
            </h2>
            <p className="mt-4 text-white/70 text-lg">
              Talk to our engineers and get a tailored solution for your operations.
            </p>
            <div className="mt-8 flex flex-wrap gap-3 justify-center">
              <Button asChild size="lg" className="bg-primary hover:bg-primary/90 rounded-full px-7 h-12">
                <Link to="/shop">Explore Products <ArrowRight className="w-4 h-4" /></Link>
              </Button>
              <Button asChild size="lg" variant="outline" className="rounded-full px-7 h-12 border-white/30 bg-white/5 text-white hover:bg-white/15 hover:text-white">
                <Link to="/#contact">Contact Sales</Link>
              </Button>
            </div>

            {/* Related categories */}
            <div className="mt-14 flex flex-wrap gap-2 justify-center">
              {CATEGORIES.filter((c) => c.slug !== category.slug).slice(0, 5).map((c) => (
                <Link
                  key={c.slug}
                  to={`/categories/${c.slug}`}
                  className="px-3.5 py-1.5 rounded-full text-xs font-medium text-white/70 border border-white/15 bg-white/5 hover:bg-white/15 hover:text-white transition"
                >
                  {c.title}
                </Link>
              ))}
            </div>
          </div>
        </section>
      </main>

      <PublicFooter />
    </div>
  );
};

export default CategoryPage;
