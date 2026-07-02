import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useNavigate } from "react-router-dom";
import { PublicNavbar } from "@/components/PublicNavbar";
import { PublicFooter } from "@/components/PublicFooter";
import { usePageSEO } from "@/hooks/usePageSEO";
import { Input } from "@/components/ui/input";
import { motion } from "framer-motion";
import {
  Download,
  FileText,
  FileBox,
  FileCode,
  Award,
  File,
  Search,
  ExternalLink,
} from "lucide-react";

const typeMeta: Record<string, { icon: any; label: string; color: string }> = {
  brochure: { icon: FileText, label: "Brochure", color: "text-primary" },
  manual: { icon: FileBox, label: "Manual", color: "text-emerald-600" },
  cad: { icon: FileCode, label: "CAD File", color: "text-violet-600" },
  firmware: { icon: FileCode, label: "Firmware", color: "text-amber-600" },
  certificate: { icon: Award, label: "Certificate", color: "text-sky-600" },
  other: { icon: File, label: "Document", color: "text-muted-foreground" },
};

const TYPE_ORDER = ["brochure", "manual", "cad", "firmware", "certificate", "other"];

const Downloads = () => {
  const navigate = useNavigate();
  const [q, setQ] = useState("");
  const [type, setType] = useState<string>("all");

  usePageSEO({
    title: "Downloads Hub | Brochures, Manuals & CAD Files | Decouvertes",
    description:
      "Download product brochures, user manuals, CAD files, firmware and certifications for the full Decouvertes catalog.",
    path: "/downloads",
  });

  const { data, isLoading } = useQuery({
    queryKey: ["downloads-hub"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("product_downloads")
        .select("*, products(id, name, slug, brand, categories(name))")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data as any[];
    },
  });

  const filtered = useMemo(() => {
    const query = q.trim().toLowerCase();
    return (data || []).filter((d) => {
      const matchesType = type === "all" || d.download_type === type;
      const matchesQ =
        !query ||
        d.title?.toLowerCase().includes(query) ||
        d.products?.name?.toLowerCase().includes(query) ||
        d.products?.brand?.toLowerCase().includes(query) ||
        d.products?.categories?.name?.toLowerCase().includes(query);
      return matchesType && matchesQ;
    });
  }, [data, q, type]);

  const grouped = useMemo(() => {
    const g: Record<string, any[]> = {};
    for (const d of filtered) {
      const k = d.download_type || "other";
      (g[k] ||= []).push(d);
    }
    return g;
  }, [filtered]);

  const typeCounts = useMemo(() => {
    const c: Record<string, number> = { all: (data || []).length };
    for (const d of data || []) {
      c[d.download_type] = (c[d.download_type] || 0) + 1;
    }
    return c;
  }, [data]);

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <PublicNavbar />

      <main className="flex-1 pt-20 pb-16">
        {/* Hero */}
        <section className="border-b border-border/30 bg-gradient-to-b from-secondary/20 to-transparent">
          <div className="max-w-[1200px] mx-auto px-4 sm:px-6 lg:px-8 py-10 sm:py-14">
            <div className="flex items-center gap-2 mb-3">
              <div className="w-9 h-9 rounded-xl bg-primary/10 flex items-center justify-center">
                <Download className="w-4.5 h-4.5 text-primary" />
              </div>
              <span className="text-primary font-bold text-[11px] uppercase tracking-[0.2em]">
                Resource Center
              </span>
            </div>
            <h1 className="text-3xl sm:text-4xl font-bold text-foreground tracking-tight mb-2">
              Downloads Hub
            </h1>
            <p className="text-sm sm:text-base text-muted-foreground max-w-2xl">
              All product brochures, user manuals, CAD files, firmware, and certifications in one place.
            </p>
          </div>
        </section>

        {/* Toolbar */}
        <section className="sticky top-16 z-30 bg-background/95 backdrop-blur-lg border-b border-border/30">
          <div className="max-w-[1200px] mx-auto px-4 sm:px-6 lg:px-8 py-3 flex flex-col sm:flex-row gap-3 items-stretch sm:items-center">
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground/60" />
              <Input
                placeholder="Search files or products..."
                value={q}
                onChange={(e) => setQ(e.target.value)}
                className="pl-9 h-9 bg-secondary/30 border-border/30 text-sm rounded-lg"
              />
            </div>
            <div className="flex items-center gap-1.5 overflow-x-auto scrollbar-none">
              <button
                onClick={() => setType("all")}
                className={`flex-shrink-0 px-3 py-1.5 rounded-full text-xs font-semibold border transition-all ${
                  type === "all"
                    ? "bg-foreground text-background border-foreground"
                    : "bg-card border-border/40 text-muted-foreground hover:border-primary/40"
                }`}
              >
                All ({typeCounts.all || 0})
              </button>
              {TYPE_ORDER.map((t) => {
                const meta = typeMeta[t];
                const count = typeCounts[t] || 0;
                if (count === 0) return null;
                return (
                  <button
                    key={t}
                    onClick={() => setType(t)}
                    className={`flex-shrink-0 inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold border transition-all ${
                      type === t
                        ? "bg-foreground text-background border-foreground"
                        : "bg-card border-border/40 text-muted-foreground hover:border-primary/40"
                    }`}
                  >
                    <meta.icon className="w-3.5 h-3.5" />
                    {meta.label} ({count})
                  </button>
                );
              })}
            </div>
          </div>
        </section>

        {/* Content */}
        <section className="py-8 sm:py-10">
          <div className="max-w-[1200px] mx-auto px-4 sm:px-6 lg:px-8">
            {isLoading ? (
              <div className="text-center py-24 text-sm text-muted-foreground">Loading resources...</div>
            ) : filtered.length === 0 ? (
              <div className="text-center py-24">
                <div className="w-16 h-16 bg-secondary/40 rounded-2xl flex items-center justify-center mx-auto mb-4">
                  <File className="w-8 h-8 text-muted-foreground/30" />
                </div>
                <h2 className="text-lg font-bold text-foreground mb-1.5">No resources found</h2>
                <p className="text-sm text-muted-foreground">Try adjusting your search or filters.</p>
              </div>
            ) : (
              <div className="space-y-10">
                {TYPE_ORDER.filter((t) => grouped[t]?.length).map((t) => {
                  const meta = typeMeta[t];
                  const items = grouped[t];
                  return (
                    <div key={t}>
                      <div className="flex items-center gap-2.5 mb-4">
                        <div className={`w-8 h-8 rounded-lg bg-secondary/50 flex items-center justify-center ${meta.color}`}>
                          <meta.icon className="w-4 h-4" />
                        </div>
                        <h2 className="text-sm font-bold text-foreground uppercase tracking-[0.14em]">
                          {meta.label}s
                        </h2>
                        <span className="text-xs text-muted-foreground">({items.length})</span>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                        {items.map((d, i) => (
                          <motion.a
                            key={d.id}
                            href={d.file_url}
                            target="_blank"
                            rel="noopener noreferrer"
                            initial={{ opacity: 0, y: 8 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            viewport={{ once: true }}
                            transition={{ duration: 0.25, delay: (i % 6) * 0.03 }}
                            className="group flex items-start gap-3 p-4 rounded-xl border border-border/30 bg-card/60 hover:border-primary/40 hover:bg-card hover:shadow-md transition-all"
                          >
                            <div className={`w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0 ${meta.color}`}>
                              <meta.icon className="w-5 h-5" />
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="text-sm font-semibold text-foreground truncate">{d.title}</div>
                              {d.products && (
                                <button
                                  onClick={(e) => {
                                    e.preventDefault();
                                    navigate(`/product/${d.products.slug || d.products.id}`);
                                  }}
                                  className="mt-0.5 flex items-center gap-1 text-[11px] text-muted-foreground hover:text-primary transition-colors"
                                >
                                  <span className="truncate">{d.products.name}</span>
                                  <ExternalLink className="w-3 h-3 flex-shrink-0" />
                                </button>
                              )}
                              {d.file_size && (
                                <div className="text-[10px] text-muted-foreground/70 mt-0.5">{d.file_size}</div>
                              )}
                            </div>
                            <Download className="w-4 h-4 text-muted-foreground group-hover:text-primary transition-colors flex-shrink-0 mt-1" />
                          </motion.a>
                        ))}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </section>
      </main>

      <PublicFooter />
    </div>
  );
};

export default Downloads;
