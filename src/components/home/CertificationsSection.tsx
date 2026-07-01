import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { motion } from "framer-motion";
import { Award, Download, Search, X, ZoomIn, ZoomOut, ExternalLink } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogTitle,
} from "@/components/ui/dialog";
import { cn } from "@/lib/utils";

interface Certification {
  id: string;
  title: string;
  issuing_authority: string;
  certificate_number: string | null;
  issue_date: string | null;
  expiry_date: string | null;
  description: string | null;
  category: string;
  status_label: string | null;
  image_url: string | null;
  pdf_url: string | null;
  is_featured: boolean;
  display_order: number;
}

const CATEGORIES = [
  { value: "all", label: "All" },
  { value: "registration", label: "Registration" },
  { value: "recognition", label: "Recognition" },
  { value: "certification", label: "Certification" },
  { value: "licence", label: "Licence" },
  { value: "patent", label: "Patent" },
  { value: "award", label: "Award" },
  { value: "compliance", label: "Compliance" },
];

const formatDate = (iso: string | null) => {
  if (!iso) return null;
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return null;
  return d.toLocaleDateString("en-IN", { year: "numeric", month: "short", day: "2-digit" });
};

export const CertificationsSection = () => {
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState<string>("all");
  const [active, setActive] = useState<Certification | null>(null);
  const [zoom, setZoom] = useState(1);

  const { data: certs = [] } = useQuery({
    queryKey: ["certifications-public"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("certifications")
        .select("*")
        .eq("is_active", true)
        .order("is_featured", { ascending: false })
        .order("display_order", { ascending: true });
      if (error) throw error;
      return (data ?? []) as Certification[];
    },
  });

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return certs.filter((c) => {
      const catOk = category === "all" || c.category === category;
      const sOk =
        !q ||
        c.title.toLowerCase().includes(q) ||
        c.issuing_authority.toLowerCase().includes(q) ||
        (c.certificate_number ?? "").toLowerCase().includes(q);
      return catOk && sOk;
    });
  }, [certs, search, category]);

  if (!certs.length) return null;

  return (
    <section className="relative bg-[hsl(210,20%,98%)] py-16 md:py-20 overflow-hidden">
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[900px] h-[900px] rounded-full pointer-events-none"
        style={{ background: "radial-gradient(circle, rgba(255,107,0,0.05) 0%, transparent 60%)" }}
      />

      <div className="relative container mx-auto px-4">
        {/* Header */}
        <div className="max-w-3xl mx-auto text-center mb-14">
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5 }}
            className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-orange-50 border border-orange-100 text-[11px] font-semibold tracking-[0.18em] text-orange-600 uppercase"
          >
            <Award className="w-3.5 h-3.5" /> Trust & Compliance
          </motion.div>
          <motion.h2
            initial={{ opacity: 0, y: 12 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.55, delay: 0.05 }}
            className="mt-5 text-4xl md:text-5xl lg:text-[56px] font-bold tracking-tight text-slate-900 leading-[1.05]"
          >
            Certified. Recognized. Trusted.
          </motion.h2>
          <motion.p
            initial={{ opacity: 0, y: 12 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.55, delay: 0.1 }}
            className="mt-5 text-lg md:text-xl text-slate-600 leading-relaxed"
          >
            Our certifications, registrations and government recognitions reflect our commitment to
            quality, innovation and regulatory compliance.
          </motion.p>
        </div>

        {/* Filters */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-10">
          <div className="relative w-full md:max-w-xs">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <Input
              placeholder="Search certificates…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9 h-11 bg-white border-slate-200"
            />
          </div>
          <div className="flex gap-2 overflow-x-auto pb-1 -mx-1 px-1">
            {CATEGORIES.map((c) => (
              <button
                key={c.value}
                onClick={() => setCategory(c.value)}
                className={cn(
                  "px-4 h-9 rounded-full text-sm font-medium whitespace-nowrap border transition-all",
                  category === c.value
                    ? "bg-slate-900 text-white border-slate-900"
                    : "bg-white text-slate-600 border-slate-200 hover:border-orange-300 hover:text-orange-600"
                )}
              >
                {c.label}
              </button>
            ))}
          </div>
        </div>

        {/* Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {filtered.map((cert, i) => (
            <motion.button
              key={cert.id}
              type="button"
              onClick={() => {
                setActive(cert);
                setZoom(1);
              }}
              initial={{ opacity: 0, y: 24 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-40px" }}
              transition={{ duration: 0.5, delay: Math.min(i, 6) * 0.05 }}
              className="group relative text-left bg-white rounded-2xl border border-slate-200 overflow-hidden transition-all duration-300 hover:-translate-y-1.5 hover:shadow-[0_24px_48px_-16px_rgba(255,107,0,0.25)] hover:border-orange-400/70"
            >
              {/* Image */}
              <div className="relative aspect-[4/3] bg-slate-50 overflow-hidden">
                {cert.image_url ? (
                  <img
                    src={cert.image_url}
                    alt={cert.title}
                    loading="lazy"
                    className="w-full h-full object-cover transition-transform duration-[600ms] group-hover:scale-[1.06]"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-slate-300">
                    <Award className="w-16 h-16" />
                  </div>
                )}
                <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />

                {/* Status badge */}
                {cert.status_label && (
                  <div className="absolute top-3 right-3 px-2.5 py-1 rounded-full text-[10px] font-semibold uppercase tracking-wider bg-white/90 backdrop-blur text-emerald-700 border border-emerald-200">
                    ✔ {cert.status_label}
                  </div>
                )}
                {/* Category badge */}
                <div className="absolute top-3 left-3 px-2.5 py-1 rounded-full text-[10px] font-semibold uppercase tracking-wider bg-slate-900/80 text-white backdrop-blur">
                  {cert.category}
                </div>

                {/* Hover CTA */}
                <div className="absolute inset-x-0 bottom-3 flex justify-center opacity-0 translate-y-2 group-hover:opacity-100 group-hover:translate-y-0 transition-all duration-300">
                  <span className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-orange-500 text-white text-xs font-semibold shadow-lg">
                    View Certificate <ExternalLink className="w-3 h-3" />
                  </span>
                </div>
              </div>

              {/* Body */}
              <div className="p-5">
                <h3 className="text-[22px] leading-tight font-semibold text-slate-900 line-clamp-2">
                  {cert.title}
                </h3>
                <p className="mt-1 text-[15px] text-slate-500">{cert.issuing_authority}</p>

                <div className="mt-4 pt-4 border-t border-slate-100 space-y-1 text-[13px] text-slate-500">
                  {cert.certificate_number && (
                    <div className="flex justify-between">
                      <span>No.</span>
                      <span className="font-medium text-slate-700 truncate ml-2">{cert.certificate_number}</span>
                    </div>
                  )}
                  {formatDate(cert.issue_date) && (
                    <div className="flex justify-between">
                      <span>Issued</span>
                      <span className="font-medium text-slate-700">{formatDate(cert.issue_date)}</span>
                    </div>
                  )}
                  {formatDate(cert.expiry_date) && (
                    <div className="flex justify-between">
                      <span>Valid till</span>
                      <span className="font-medium text-slate-700">{formatDate(cert.expiry_date)}</span>
                    </div>
                  )}
                </div>
              </div>
            </motion.button>
          ))}
        </div>

        {filtered.length === 0 && (
          <div className="text-center py-16 text-slate-500">No certificates match your filters.</div>
        )}
      </div>

      {/* Lightbox */}
      <Dialog open={!!active} onOpenChange={(o) => !o && setActive(null)}>
        <DialogContent className="max-w-5xl w-[95vw] p-0 bg-slate-950 border-slate-800 overflow-hidden">
          <DialogTitle className="sr-only">{active?.title ?? "Certificate"}</DialogTitle>
          {active && (
            <div className="flex flex-col max-h-[92vh]">
              <div className="flex items-center justify-between px-5 py-3 border-b border-slate-800 text-white">
                <div className="min-w-0">
                  <div className="text-sm text-slate-400 uppercase tracking-wider">{active.category}</div>
                  <div className="text-lg font-semibold truncate">{active.title}</div>
                </div>
                <div className="flex items-center gap-2">
                  <Button
                    size="icon"
                    variant="ghost"
                    className="text-white hover:bg-white/10"
                    onClick={() => setZoom((z) => Math.max(0.5, z - 0.25))}
                  >
                    <ZoomOut className="w-4 h-4" />
                  </Button>
                  <span className="text-xs text-slate-400 w-12 text-center">{Math.round(zoom * 100)}%</span>
                  <Button
                    size="icon"
                    variant="ghost"
                    className="text-white hover:bg-white/10"
                    onClick={() => setZoom((z) => Math.min(3, z + 0.25))}
                  >
                    <ZoomIn className="w-4 h-4" />
                  </Button>
                  <Button
                    size="icon"
                    variant="ghost"
                    className="text-white hover:bg-white/10"
                    onClick={() => setActive(null)}
                  >
                    <X className="w-4 h-4" />
                  </Button>
                </div>
              </div>

              <div className="flex-1 overflow-auto bg-slate-900 flex items-center justify-center p-4">
                {active.image_url ? (
                  <img
                    src={active.image_url}
                    alt={active.title}
                    style={{ transform: `scale(${zoom})`, transformOrigin: "center center" }}
                    className="max-w-full max-h-[70vh] object-contain transition-transform duration-200"
                  />
                ) : (
                  <div className="text-slate-400">No preview available</div>
                )}
              </div>

              <div className="px-5 py-4 border-t border-slate-800 bg-slate-950 flex flex-col md:flex-row md:items-center md:justify-between gap-3 text-sm text-slate-300">
                <div className="grid grid-cols-2 md:grid-cols-4 gap-x-6 gap-y-1">
                  <div><span className="text-slate-500">Authority:</span> {active.issuing_authority}</div>
                  {active.certificate_number && <div><span className="text-slate-500">No.:</span> {active.certificate_number}</div>}
                  {formatDate(active.issue_date) && <div><span className="text-slate-500">Issued:</span> {formatDate(active.issue_date)}</div>}
                  {formatDate(active.expiry_date) && <div><span className="text-slate-500">Expires:</span> {formatDate(active.expiry_date)}</div>}
                </div>
                {active.pdf_url && (
                  <Button asChild className="bg-orange-500 hover:bg-orange-600 text-white">
                    <a href={active.pdf_url} target="_blank" rel="noopener noreferrer">
                      <Download className="w-4 h-4 mr-2" /> Download Certificate
                    </a>
                  </Button>
                )}
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </section>
  );
};

export default CertificationsSection;
