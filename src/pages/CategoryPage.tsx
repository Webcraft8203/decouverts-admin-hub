import { useMemo, useState } from "react";
import { Link, useParams, Navigate } from "react-router-dom";
import { motion } from "framer-motion";
import {
  ArrowRight,
  CheckCircle2,
  Sparkles,
  ShieldCheck,
  Cpu,
  Users,
  Mail,
  Phone,
  Send,
} from "lucide-react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { PublicNavbar } from "@/components/PublicNavbar";
import { PublicFooter } from "@/components/PublicFooter";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
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
      ? `${category.title} | Decouvertes`
      : "Category | Decouvertes",
    description: category?.description ?? "",
    path: `/categories/${slug ?? ""}`,
  });

  const whyChoose = [
    { icon: ShieldCheck, title: "Made in India", desc: "Indigenously designed, built and supported." },
    { icon: Cpu, title: "R&D Driven", desc: "In-house avionics, autonomy and airframe design." },
    { icon: Sparkles, title: "Enterprise Grade", desc: "Engineered for mission-critical operations." },
    { icon: Users, title: "24/7 Support", desc: "Dedicated engineers on-call for your fleet." },
  ];

  /* ---------- Related products from DB (matched by category name) ---------- */
  const { data: relatedProducts = [] } = useQuery({
    queryKey: ["category-products", category?.matchKey],
    enabled: !!category,
    queryFn: async () => {
      if (!category) return [];
      // find category rows whose name loosely matches
      const { data: cats } = await supabase
        .from("categories")
        .select("id,name")
        .ilike("name", `%${category.matchKey}%`);
      const ids = (cats ?? []).map((c: { id: string }) => c.id);
      if (ids.length === 0) return [];
      const { data: products } = await supabase
        .from("products")
        .select("id, name, slug, price, images, description")
        .in("category_id", ids)
        .limit(6);
      return products ?? [];
    },
  });

  /* ---------- Related blogs from DB (matched by tag) ---------- */
  const { data: relatedBlogs = [] } = useQuery({
    queryKey: ["category-blogs", category?.matchKey],
    enabled: !!category,
    queryFn: async () => {
      if (!category) return [];
      const { data } = await supabase
        .from("blog_posts")
        .select("id, slug, title, excerpt, feature_image, publish_date")
        .eq("status", "published")
        .contains("tags", [category.matchKey])
        .order("publish_date", { ascending: false })
        .limit(3);
      return data ?? [];
    },
  });

  /* ---------- Inquiry form ---------- */
  const [form, setForm] = useState({ name: "", email: "", phone: "", message: "" });
  const inquiryMutation = useMutation({
    mutationFn: async () => {
      if (!category) throw new Error("No category");
      const { error } = await supabase.from("contact_requests").insert({
        name: form.name,
        email: form.email,
        phone: form.phone,
        message: `[${category.title}] ${form.message}`,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Inquiry sent — our team will reach out shortly.");
      setForm({ name: "", email: "", phone: "", message: "" });
    },
    onError: (e: Error) => toast.error(e.message || "Failed to submit inquiry"),
  });

  /* ---------- Gallery (uses hero image + related product images) ---------- */
  const gallery = useMemo(() => {
    if (!category) return [];
    const base = category.gallery ?? [];
    const fromProducts = relatedProducts
      .flatMap((p: { images: string[] | null }) => p.images ?? [])
      .filter(Boolean)
      .slice(0, 8);
    const combined = [...base, ...fromProducts];
    return combined.length > 0
      ? combined.slice(0, 8)
      : [category.image, category.image, category.image, category.image];
  }, [category, relatedProducts]);

  if (!category) return <Navigate to="/" replace />;
  const accent = category.accent;

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <PublicNavbar />

      <main className="flex-1 pt-16 md:pt-20">
        {/* HERO */}
        <section className="relative h-[86vh] min-h-[600px] w-full overflow-hidden">
          <img
            src={category.image}
            alt={category.title}
            className="absolute inset-0 w-full h-full object-cover"
          />
          <div
            className="absolute inset-0"
            style={{
              background:
                "linear-gradient(90deg, rgba(8,12,20,0.88) 0%, rgba(8,12,20,0.55) 55%, rgba(8,12,20,0.15) 100%)",
            }}
          />
          <div
            className="absolute inset-0 pointer-events-none opacity-70"
            style={{
              background: `radial-gradient(ellipse at 15% 60%, ${accent}33, transparent 55%)`,
            }}
          />
          <div className="relative h-full container mx-auto px-4 sm:px-6 lg:px-8 flex items-center">
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.9, ease: [0.16, 1, 0.3, 1] }}
              className="max-w-2xl"
            >
              <span
                className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full text-[10px] font-bold tracking-[0.24em] uppercase text-white border bg-white/10 backdrop-blur-md mb-6"
                style={{ borderColor: `${accent}66` }}
              >
                <span
                  className="w-1.5 h-1.5 rounded-full animate-pulse"
                  style={{ backgroundColor: accent }}
                />
                {category.tagline}
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
                <Button
                  asChild
                  size="lg"
                  className="text-white rounded-full px-7 h-12 hover:brightness-110"
                  style={{ backgroundColor: accent }}
                >
                  <a href="#inquiry">
                    Request a Quote <ArrowRight className="w-4 h-4" />
                  </a>
                </Button>
                <Button
                  asChild
                  size="lg"
                  variant="outline"
                  className="rounded-full px-7 h-12 border-white/30 bg-white/5 text-white hover:bg-white/15 hover:text-white"
                >
                  <a href="#products">Explore Products</a>
                </Button>
              </div>
            </motion.div>
          </div>
        </section>

        {/* APPLICATIONS */}
        <section className="py-20 md:py-28 bg-white">
          <div className="container mx-auto px-4 sm:px-6 lg:px-8">
            <div className="max-w-2xl mb-14">
              <p
                className="text-[10px] font-bold tracking-[0.24em] uppercase mb-3"
                style={{ color: accent }}
              >
                Applications & Use Cases
              </p>
              <h2
                className="text-3xl md:text-5xl font-bold text-slate-900 tracking-tight"
                style={{ fontFamily: "'Montserrat', sans-serif" }}
              >
                Engineered for real missions.
              </h2>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
              {category.applications.map((a, i) => (
                <motion.div
                  key={a.title}
                  initial={{ opacity: 0, y: 24 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true, margin: "-60px" }}
                  transition={{ duration: 0.55, delay: i * 0.05 }}
                  className="group relative rounded-2xl border border-slate-200 bg-white p-6 hover:-translate-y-1 transition-all duration-500 hover:shadow-[0_30px_60px_-30px_rgba(0,0,0,0.35)]"
                  style={{
                    borderTop: `2px solid transparent`,
                  }}
                  onMouseEnter={(e) => (e.currentTarget.style.borderTopColor = accent)}
                  onMouseLeave={(e) => (e.currentTarget.style.borderTopColor = "transparent")}
                >
                  <div
                    className="w-11 h-11 rounded-xl flex items-center justify-center mb-4"
                    style={{ backgroundColor: `${accent}18`, border: `1px solid ${accent}44` }}
                  >
                    <Sparkles className="w-5 h-5" style={{ color: accent }} />
                  </div>
                  <h3 className="text-lg font-bold text-slate-900">{a.title}</h3>
                  <p className="mt-2 text-sm text-slate-600 leading-relaxed">{a.description}</p>
                </motion.div>
              ))}
            </div>
          </div>
        </section>

        {/* KEY FEATURES */}
        <section className="py-20 md:py-28 bg-slate-50">
          <div className="container mx-auto px-4 sm:px-6 lg:px-8">
            <div className="max-w-2xl mb-14">
              <p
                className="text-[10px] font-bold tracking-[0.24em] uppercase mb-3"
                style={{ color: accent }}
              >
                Key Features
              </p>
              <h2
                className="text-3xl md:text-5xl font-bold text-slate-900 tracking-tight"
                style={{ fontFamily: "'Montserrat', sans-serif" }}
              >
                Purpose-built engineering.
              </h2>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
              {category.keyFeatures.map((k) => (
                <div
                  key={k.title}
                  className="rounded-2xl bg-white border border-slate-200 p-6 hover:-translate-y-1 transition-all duration-500"
                >
                  <div
                    className="w-11 h-11 rounded-xl flex items-center justify-center mb-4"
                    style={{ backgroundColor: `${accent}18`, border: `1px solid ${accent}44` }}
                  >
                    <CheckCircle2 className="w-5 h-5" style={{ color: accent }} />
                  </div>
                  <h3 className="text-lg font-bold text-slate-900">{k.title}</h3>
                  <p className="mt-2 text-sm text-slate-600 leading-relaxed">{k.description}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* INDUSTRIES + SPECS */}
        <section className="py-20 md:py-28 bg-white">
          <div className="container mx-auto px-4 sm:px-6 lg:px-8 grid lg:grid-cols-2 gap-12">
            <div>
              <p
                className="text-[10px] font-bold tracking-[0.24em] uppercase mb-3"
                style={{ color: accent }}
              >
                Industries Served
              </p>
              <h2
                className="text-3xl md:text-4xl font-bold text-slate-900 tracking-tight mb-6"
                style={{ fontFamily: "'Montserrat', sans-serif" }}
              >
                Trusted across sectors.
              </h2>
              <div className="flex flex-wrap gap-2.5">
                {category.industries.map((ind) => (
                  <span
                    key={ind}
                    className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white border border-slate-200 text-sm font-medium text-slate-700"
                  >
                    <CheckCircle2 className="w-4 h-4" style={{ color: accent }} />
                    {ind}
                  </span>
                ))}
              </div>
            </div>
            <div className="rounded-2xl bg-slate-900 text-white p-8 md:p-10 relative overflow-hidden">
              <div
                className="absolute -top-24 -right-24 w-72 h-72 rounded-full opacity-30"
                style={{ background: `radial-gradient(circle, ${accent}, transparent 70%)` }}
              />
              <p
                className="text-[10px] font-bold tracking-[0.24em] uppercase mb-3 relative"
                style={{ color: accent }}
              >
                Specifications
              </p>
              <h3
                className="text-2xl md:text-3xl font-bold mb-6 relative"
                style={{ fontFamily: "'Montserrat', sans-serif" }}
              >
                Platform highlights.
              </h3>
              <dl className="divide-y divide-white/10 relative">
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

        {/* GALLERY */}
        <section className="py-20 md:py-28 bg-slate-50">
          <div className="container mx-auto px-4 sm:px-6 lg:px-8">
            <div className="max-w-2xl mb-14">
              <p
                className="text-[10px] font-bold tracking-[0.24em] uppercase mb-3"
                style={{ color: accent }}
              >
                Gallery
              </p>
              <h2
                className="text-3xl md:text-5xl font-bold text-slate-900 tracking-tight"
                style={{ fontFamily: "'Montserrat', sans-serif" }}
              >
                In the field.
              </h2>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4">
              {gallery.map((src, i) => (
                <motion.div
                  key={`${src}-${i}`}
                  initial={{ opacity: 0, scale: 0.96 }}
                  whileInView={{ opacity: 1, scale: 1 }}
                  viewport={{ once: true, margin: "-60px" }}
                  transition={{ duration: 0.5, delay: i * 0.04 }}
                  className={`relative overflow-hidden rounded-2xl bg-slate-200 ${
                    i === 0 ? "col-span-2 row-span-2 aspect-square md:aspect-auto md:min-h-full" : "aspect-square"
                  }`}
                >
                  <img
                    src={src}
                    alt={`${category.title} ${i + 1}`}
                    loading="lazy"
                    className="w-full h-full object-cover transition-transform duration-700 hover:scale-105"
                  />
                </motion.div>
              ))}
            </div>
          </div>
        </section>

        {/* RELATED PRODUCTS */}
        {relatedProducts.length > 0 && (
          <section id="products" className="py-20 md:py-28 bg-white">
            <div className="container mx-auto px-4 sm:px-6 lg:px-8">
              <div className="flex flex-wrap items-end justify-between gap-4 mb-12">
                <div className="max-w-2xl">
                  <p
                    className="text-[10px] font-bold tracking-[0.24em] uppercase mb-3"
                    style={{ color: accent }}
                  >
                    Related Products
                  </p>
                  <h2
                    className="text-3xl md:text-5xl font-bold text-slate-900 tracking-tight"
                    style={{ fontFamily: "'Montserrat', sans-serif" }}
                  >
                    Shop {category.title.toLowerCase()}.
                  </h2>
                </div>
                <Button asChild variant="outline" className="rounded-full">
                  <Link to="/shop">
                    View all <ArrowRight className="w-4 h-4" />
                  </Link>
                </Button>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                {relatedProducts.map(
                  (p: {
                    id: string;
                    name: string;
                    slug: string | null;
                    price: number;
                    images: string[] | null;
                    description: string | null;
                  }) => (
                    <Link
                      key={p.id}
                      to={`/product/${p.slug || p.id}`}
                      className="group rounded-2xl bg-white border border-slate-200 overflow-hidden hover:-translate-y-1 hover:shadow-[0_30px_60px_-30px_rgba(0,0,0,0.35)] transition-all duration-500"
                    >
                      <div className="aspect-[4/3] overflow-hidden bg-slate-100">
                        <img
                          src={p.images?.[0] ?? category.image}
                          alt={p.name}
                          loading="lazy"
                          className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                        />
                      </div>
                      <div className="p-5">
                        <h3 className="font-bold text-slate-900 line-clamp-1">{p.name}</h3>
                        {p.description && (
                          <p className="mt-1 text-sm text-slate-600 line-clamp-2">{p.description}</p>
                        )}
                        <div className="mt-3 flex items-center justify-between">
                          <span className="font-bold text-slate-900">
                            ₹{p.price?.toLocaleString("en-IN") ?? "—"}
                          </span>
                          <ArrowRight
                            className="w-4 h-4 transition-transform group-hover:translate-x-1"
                            style={{ color: accent }}
                          />
                        </div>
                      </div>
                    </Link>
                  )
                )}
              </div>
            </div>
          </section>
        )}

        {/* WHY CHOOSE */}
        <section className="py-20 md:py-28 bg-slate-50">
          <div className="container mx-auto px-4 sm:px-6 lg:px-8">
            <div className="max-w-2xl mb-14">
              <p
                className="text-[10px] font-bold tracking-[0.24em] uppercase mb-3"
                style={{ color: accent }}
              >
                Why Decouvertes
              </p>
              <h2
                className="text-3xl md:text-5xl font-bold text-slate-900 tracking-tight"
                style={{ fontFamily: "'Montserrat', sans-serif" }}
              >
                The indigenous advantage.
              </h2>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
              {whyChoose.map((w) => (
                <div
                  key={w.title}
                  className="rounded-2xl border border-slate-200 bg-white p-6 hover:-translate-y-1 transition-all duration-500"
                >
                  <div
                    className="w-11 h-11 rounded-xl flex items-center justify-center mb-4"
                    style={{ backgroundColor: `${accent}18`, border: `1px solid ${accent}44` }}
                  >
                    <w.icon className="w-5 h-5" style={{ color: accent }} />
                  </div>
                  <h3 className="text-lg font-bold text-slate-900">{w.title}</h3>
                  <p className="mt-2 text-sm text-slate-600">{w.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* RELATED BLOGS */}
        {relatedBlogs.length > 0 && (
          <section className="py-20 md:py-28 bg-white">
            <div className="container mx-auto px-4 sm:px-6 lg:px-8">
              <div className="flex flex-wrap items-end justify-between gap-4 mb-12">
                <div className="max-w-2xl">
                  <p
                    className="text-[10px] font-bold tracking-[0.24em] uppercase mb-3"
                    style={{ color: accent }}
                  >
                    Insights
                  </p>
                  <h2
                    className="text-3xl md:text-5xl font-bold text-slate-900 tracking-tight"
                    style={{ fontFamily: "'Montserrat', sans-serif" }}
                  >
                    Related reading.
                  </h2>
                </div>
                <Button asChild variant="outline" className="rounded-full">
                  <Link to="/blogs">
                    View all <ArrowRight className="w-4 h-4" />
                  </Link>
                </Button>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {relatedBlogs.map(
                  (b: {
                    id: string;
                    slug: string;
                    title: string;
                    excerpt: string | null;
                    feature_image: string | null;
                    publish_date: string | null;
                  }) => (
                    <Link
                      key={b.id}
                      to={`/blogs/${b.slug}`}
                      className="group rounded-2xl bg-white border border-slate-200 overflow-hidden hover:-translate-y-1 hover:shadow-[0_30px_60px_-30px_rgba(0,0,0,0.35)] transition-all duration-500"
                    >
                      {b.feature_image && (
                        <div className="aspect-video overflow-hidden bg-slate-100">
                          <img
                            src={b.feature_image}
                            alt={b.title}
                            loading="lazy"
                            className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                          />
                        </div>
                      )}
                      <div className="p-5">
                        <h3 className="font-bold text-slate-900 line-clamp-2">{b.title}</h3>
                        {b.excerpt && (
                          <p className="mt-2 text-sm text-slate-600 line-clamp-3">{b.excerpt}</p>
                        )}
                      </div>
                    </Link>
                  )
                )}
              </div>
            </div>
          </section>
        )}

        {/* FAQ */}
        {category.faqs.length > 0 && (
          <section className="py-20 md:py-28 bg-slate-50">
            <div className="container mx-auto px-4 sm:px-6 lg:px-8 max-w-3xl">
              <p
                className="text-[10px] font-bold tracking-[0.24em] uppercase mb-3 text-center"
                style={{ color: accent }}
              >
                FAQ
              </p>
              <h2
                className="text-3xl md:text-5xl font-bold text-slate-900 tracking-tight text-center mb-10"
                style={{ fontFamily: "'Montserrat', sans-serif" }}
              >
                Frequently asked.
              </h2>
              <Accordion type="single" collapsible className="space-y-3">
                {category.faqs.map((f, i) => (
                  <AccordionItem
                    key={i}
                    value={`item-${i}`}
                    className="rounded-2xl border border-slate-200 bg-white px-5"
                  >
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

        {/* CONTACT CTA + INQUIRY FORM */}
        <section
          id="inquiry"
          className="relative py-24 md:py-28 overflow-hidden bg-slate-900 text-white"
        >
          <div
            className="absolute inset-0 opacity-40"
            style={{
              background: `radial-gradient(ellipse at 30% 50%, ${accent}55, transparent 60%)`,
            }}
          />
          <div className="container mx-auto px-4 sm:px-6 lg:px-8 relative grid lg:grid-cols-2 gap-12">
            <div>
              <p
                className="text-[10px] font-bold tracking-[0.24em] uppercase mb-3"
                style={{ color: accent }}
              >
                Contact
              </p>
              <h2
                className="text-3xl md:text-5xl font-bold tracking-tight"
                style={{ fontFamily: "'Montserrat', sans-serif" }}
              >
                Ready to deploy {category.title.toLowerCase()}?
              </h2>
              <p className="mt-4 text-white/70 text-lg max-w-lg">
                Talk to our engineers and get a tailored solution for your operations.
              </p>
              <div className="mt-8 space-y-3 text-white/80">
                <div className="flex items-center gap-3">
                  <Mail className="w-5 h-5" style={{ color: accent }} />
                  <span>sales@decouvertes.in</span>
                </div>
                <div className="flex items-center gap-3">
                  <Phone className="w-5 h-5" style={{ color: accent }} />
                  <span>+91 90000 00000</span>
                </div>
              </div>

              <div className="mt-10 flex flex-wrap gap-2">
                {CATEGORIES.filter((c) => c.slug !== category.slug)
                  .slice(0, 6)
                  .map((c) => (
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

            <form
              onSubmit={(e) => {
                e.preventDefault();
                if (!form.name || !form.email || !form.message) {
                  toast.error("Please fill name, email and message");
                  return;
                }
                inquiryMutation.mutate();
              }}
              className="rounded-3xl bg-white/5 border border-white/15 backdrop-blur-md p-6 md:p-8 space-y-4"
            >
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <Input
                  placeholder="Full name*"
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  className="bg-white/10 border-white/20 text-white placeholder:text-white/50 h-12"
                />
                <Input
                  placeholder="Phone"
                  value={form.phone}
                  onChange={(e) => setForm({ ...form, phone: e.target.value })}
                  className="bg-white/10 border-white/20 text-white placeholder:text-white/50 h-12"
                />
              </div>
              <Input
                type="email"
                placeholder="Work email*"
                value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
                className="bg-white/10 border-white/20 text-white placeholder:text-white/50 h-12"
              />
              <Textarea
                placeholder={`Tell us about your ${category.title.toLowerCase()} requirement*`}
                rows={5}
                value={form.message}
                onChange={(e) => setForm({ ...form, message: e.target.value })}
                className="bg-white/10 border-white/20 text-white placeholder:text-white/50"
              />
              <Button
                type="submit"
                disabled={inquiryMutation.isPending}
                size="lg"
                className="w-full rounded-full h-12 text-white hover:brightness-110"
                style={{ backgroundColor: accent }}
              >
                {inquiryMutation.isPending ? "Sending..." : (
                  <>
                    Submit Inquiry <Send className="w-4 h-4" />
                  </>
                )}
              </Button>
              <p className="text-xs text-white/50 text-center">
                We usually respond within 1 business day.
              </p>
            </form>
          </div>
        </section>
      </main>

      <PublicFooter />
    </div>
  );
};

export default CategoryPage;
