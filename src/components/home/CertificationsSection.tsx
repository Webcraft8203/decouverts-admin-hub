import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { motion } from "framer-motion";
import { Award, Download, Search, X, ZoomIn, ZoomOut, ExternalLink, ShieldCheck, FileText, Hash, Calendar, CheckCircle, Building2, Lightbulb, Scale, Trophy, FlaskConical } from "lucide-react";
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
  { value: "all", label: "All", icon: Award },
  { value: "registration", label: "Registration", icon: FileText },
  { value: "recognition", label: "Recognition", icon: ShieldCheck },
  { value: "certification", label: "Certification", icon: CheckCircle },
  { value: "licence", label: "Licence", icon: Scale },
  { value: "patent", label: "Patent", icon: Lightbulb },
  { value: "award", label: "Award", icon: Trophy },
  { value: "compliance", label: "Compliance", icon: FlaskConical },
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
    <section className="relative bg-white py-16 md:py-24 overflow-hidden">
      {/* Subtle background patterns */}
      <div aria-hidden className="absolute inset-0 pointer-events-none opacity-[0.015]">
        {/* Technical grid */}
        <div
          className="absolute inset-0"
          style={{
            backgroundImage:
              "linear-gradient(to right, rgba(15,23,42,0.05) 1px, transparent 1px), linear-gradient(to bottom, rgba(15,23,42,0.05) 1px, transparent 1px)",
            backgroundSize: "40px 40px",
          }}
        />
      </div>

      <div className="relative container mx-auto px-4">
        {/* Header */}
        <div className="max-w-4xl mx-auto text-center mb-16 md:mb-24">
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5 }}
            className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-primary/10 border border-primary/20 text-[11px] font-semibold tracking-[0.18em] text-primary uppercase"
          >
            <Award className="w-3.5 h-3.5" /> Trust & Compliance
          </motion.div>
          <motion.h2
            initial={{ opacity: 0, y: 12 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-80px" }}
            transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1], delay: 0.05 }}
            className="mt-5 text-5xl md:text-6xl lg:text-[60px] font-extrabold tracking-tight text-slate-900 leading-[1.05]"
          >
            Certified. <span className="text-primary">Recognized.</span> Trusted.
          </motion.h2>
          <motion.p
            initial={{ opacity: 0, y: 12 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-80px" }}
            transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1], delay: 0.1 }}
            className="mt-4 text-lg md:text-xl leading-relaxed text-slate-600 max-w-3xl mx-auto"
          >
            Our certifications, registrations and government recognitions reflect our commitment to
            quality, innovation and regulatory compliance.
          </motion.p>
        </div>

        {/* Filters */}
        <div className="flex flex-col items-center gap-6 mb-12">
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-80px" }}
            transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1], delay: 0.15 }}
            className="relative w-full max-w-xl"
          >
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <Input
              placeholder="Search certificates…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9 h-14 rounded-xl bg-white border-slate-200 shadow-lg shadow-slate-100/50 focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all duration-300"
            />
          </motion.div>
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-80px" }}
            transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1], delay: 0.2 }}
            className="flex gap-3 overflow-x-auto pb-1 -mx-4 px-4 md:px-0 scrollbar-hide justify-center"
          >
            {CATEGORIES.map((c) => (
              <button
                key={c.value}
                onClick={() => setCategory(c.value)}
                className={cn(
                  "group inline-flex items-center gap-2 px-5 h-12 rounded-full text-sm font-medium whitespace-nowrap border transition-all duration-300 hover:scale-[1.02]",
                  category === c.value
                    ? "bg-gradient-to-br from-primary to-orange-400 text-white border-primary/60 shadow-md shadow-primary/30"
                    : "bg-white text-slate-600 border-slate-200 hover:border-primary/40 hover:text-primary hover:shadow-sm hover:shadow-slate-100/50"
                )}
              >
                <c.icon
                  className={cn("w-4 h-4 transition-colors duration-300", category === c.value ? "text-white" : "text-slate-400 group-hover:text-primary")}
                />
                {c.label}
              </button>
            ))}
          </motion.div>
        </div>

        {/* Grid */}
        <div
          className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8 justify-center"
          style={{
            gridTemplateColumns: "repeat(auto-fit, minmax(360px, 400px))",
          }}
        >
          {filtered.map((cert, i) => (
            <motion.button
              key={cert.id}
              type="button"
              onClick={() => {
                setActive(cert);
                setZoom(1);
              }}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-100px" }}
              transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1], delay: Math.min(i, 6) * 0.08 }}
              className="group relative text-left bg-white rounded-[22px] border border-slate-200/70 overflow-hidden shadow-[0_12px_30px_-10px_rgba(15,23,42,0.08)] transition-all duration-500 ease-out hover:-translate-y-2 hover:border-primary/40 hover:shadow-[0_40px_80px_-30px_hsl(var(--primary)/0.45)]"
            >
              {/* Top accent line */}
              <div className="absolute inset-x-6 -top-px h-px bg-gradient-to-r from-transparent via-primary/60 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />

              {/* Image */}
              <div className="relative aspect-[4/3] bg-slate-100 overflow-hidden">
                {cert.image_url ? (
                  <img
                    src={cert.image_url}
                    alt={cert.title}
                    loading="eager" // Changed to eager for better LCP on initial load
                    className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-[700ms] ease-out"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-slate-300">
                    <Award className="w-16 h-16" />
                  </div>
                )}
                {/* Category badge */}
                <div className="absolute top-3 left-3 px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider bg-slate-900/85 text-white backdrop-blur border border-white/20">
                  {cert.category}
                </div>

                {/* Hover CTA */}
                <div className="absolute inset-x-0 bottom-0 z-10 p-4 opacity-0 translate-y-2 group-hover:opacity-100 group-hover:translate-y-0 transition-all duration-300">
                  <Button
                    size="sm"
                    className="w-full rounded-full bg-primary hover:bg-primary/90 text-white text-xs font-bold uppercase tracking-wider shadow-lg shadow-primary/20"
                  >
                    View Certificate <ExternalLink className="w-3 h-3 ml-2" />
                  </Button>
                </div>
              </div>

              {/* Body */}
              <div className="p-5">
                <h3 className="text-2xl leading-snug font-bold text-slate-900 line-clamp-2 group-hover:text-primary transition-colors min-h-[60px]">
                  {cert.title}
                </h3>
                <p className="mt-1 text-base text-slate-500">{cert.issuing_authority}</p>

                <div className="mt-5 pt-5 border-t border-slate-100 grid grid-cols-2 gap-x-4 gap-y-2 text-sm text-slate-500">
                  <div className="flex items-center gap-2">
                    <Building2 className="w-4 h-4 text-slate-400" />
                    <span className="font-medium text-slate-700">Issued By</span>
                  </div>
                  <span className="font-semibold text-slate-900 truncate">{cert.issuing_authority}</span>
                  {cert.certificate_number && (
                    <>
                      <div className="flex items-center gap-2">
                        <Hash className="w-4 h-4 text-slate-400" />
                        <span className="font-medium text-slate-700">Certificate No</span>
                      </div>
                      <span className="font-semibold text-slate-900 truncate">{cert.certificate_number}</span>
                    </>
                  )}
                  {formatDate(cert.issue_date) && (
                    <>
                      <div className="flex items-center gap-2">
                        <Calendar className="w-4 h-4 text-slate-400" />
                        <span className="font-medium text-slate-700">Issued Date</span>
                      </div>
                      <span className="font-semibold text-slate-900">{formatDate(cert.issue_date)}</span>
                    </>
                  )}
                </div>
              </div>

              {/* Orange accent line */}
              <span
                aria-hidden
                className="absolute bottom-0 left-0 h-[3px] w-0 transition-all duration-500 ease-out group-hover:w-full"
                style={{ background: "var(--primary)" }}
              />
            </motion.button>
          ))}
        </div>

        {filtered.length === 0 && ( // Empty state
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
            className="text-center py-20 flex flex-col items-center justify-center text-slate-500"
          >
            <ShieldCheck className="w-20 h-20 text-slate-300 mb-6" />
            <p className="text-xl font-semibold text-slate-700">No certifications found.</p>
            <p className="mt-2 text-base text-slate-500">Adjust your search or filters to see results.</p>
          </motion.div>
        )}
      </div>

      {/* Lightbox */}
      <Dialog open={!!active} onOpenChange={(o) => !o && setActive(null)}>
        <DialogContent className="max-w-5xl w-[95vw] p-0 bg-slate-950 border-slate-800 overflow-hidden">
          <DialogTitle className="sr-only">{active?.title ?? "Certificate"}</DialogTitle>
          {active && ( // Dialog content
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
