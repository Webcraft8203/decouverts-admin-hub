import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Award, Download, X, ZoomIn, ZoomOut, ExternalLink, ShieldCheck, FileText, CheckCircle, Lightbulb, Scale, Trophy, FlaskConical } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
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
    return certs.filter((c) => category === "all" || c.category === category);
  }, [certs, category]);

  if (!certs.length) return null;

  return (
    <section className="relative bg-white py-10 md:py-14 overflow-hidden">
      <div className="relative container mx-auto px-4">
        {/* Header */}
        <div className="max-w-3xl mx-auto text-center mb-8 md:mb-10">
          <div className="flex items-center justify-center gap-2.5 mb-3">
            <span className="h-px w-7 bg-primary" />
            <p className="text-primary font-semibold tracking-[0.18em] text-[11px] uppercase">Trust &amp; Compliance</p>
            <span className="h-px w-7 bg-primary" />
          </div>
          <h2 className="text-2xl md:text-3xl font-bold tracking-tight text-foreground leading-tight">
            Certifications &amp; Recognition
          </h2>
          <p className="mt-2 text-sm md:text-base leading-relaxed text-muted-foreground max-w-2xl mx-auto">
            Registrations, licences and government recognitions that reflect our commitment to quality and compliance.
          </p>
        </div>

        {/* Filters */}
        <div className="flex flex-col items-center gap-3 mb-7">
          <div className="flex gap-1.5 overflow-x-auto pb-1 -mx-4 px-4 md:px-0 scrollbar-hide justify-center">
            {CATEGORIES.map((c) => (
              <button
                key={c.value}
                onClick={() => setCategory(c.value)}
                className={cn(
                  "group inline-flex items-center gap-1.5 px-3 h-8 rounded-md text-xs font-medium whitespace-nowrap border transition-colors duration-200",
                  category === c.value
                    ? "bg-foreground text-background border-foreground"
                    : "bg-card text-muted-foreground border-border hover:border-primary/40 hover:text-primary"
                )}
              >
                <c.icon
                  className={cn("w-3.5 h-3.5 transition-colors duration-200", category === c.value ? "text-background" : "text-muted-foreground group-hover:text-primary")}
                />
                {c.label}
              </button>
            ))}
          </div>
        </div>

        {/* Grid */}
        <div className="flex flex-wrap justify-center gap-4">
          {filtered.map((cert) => (
            <button
              key={cert.id}
              type="button"
              onClick={() => {
                setActive(cert);
                setZoom(1);
              }}
              className="group relative text-left bg-card rounded-lg border border-border overflow-hidden transition-all duration-300 ease-out hover:-translate-y-0.5 hover:border-primary/40 w-[calc(50%-0.5rem)] sm:w-[220px] lg:w-[230px] xl:w-[240px]"
            >
              {/* Image */}
              <div className="relative aspect-[4/3] bg-secondary overflow-hidden">
                {cert.image_url ? (
                  <img
                    src={cert.image_url}
                    alt={cert.title}
                    loading="eager"
                    className="w-full h-full object-cover group-hover:scale-[1.04] transition-transform duration-500 ease-out"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-muted-foreground/40">
                    <Award className="w-9 h-9" />
                  </div>
                )}
                {/* Category badge */}
                <div className="absolute top-2 left-2 px-1.5 py-0.5 rounded text-[9px] font-bold uppercase tracking-wider bg-foreground/85 text-background">
                  {cert.category}
                </div>

                {/* Hover CTA — compact corner icon */}
                <div className="absolute top-2 right-2 z-10 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                  <span className="flex items-center justify-center w-6 h-6 rounded-full bg-white/95 text-foreground shadow-sm">
                    <ExternalLink className="w-3 h-3" />
                  </span>
                </div>
              </div>

              {/* Body */}
              <div className="p-3">
                <h3 className="text-sm font-semibold leading-snug text-foreground line-clamp-1 group-hover:text-primary transition-colors">
                  {cert.title}
                </h3>
                <p className="mt-0.5 text-xs text-muted-foreground line-clamp-1">{cert.issuing_authority}</p>

                {formatDate(cert.issue_date) && (
                  <div className="mt-2 pt-2 border-t border-border flex items-center justify-end gap-2 text-[10px] text-muted-foreground">
                    <span className="shrink-0 tabular-nums">{formatDate(cert.issue_date)}</span>
                  </div>
                )}
              </div>
            </button>
          ))}
        </div>

        {filtered.length === 0 && (
          <div className="text-center py-12 flex flex-col items-center justify-center text-muted-foreground">
            <ShieldCheck className="w-10 h-10 text-muted-foreground/30 mb-3" />
            <p className="text-base font-semibold text-foreground">No certifications found.</p>
            <p className="mt-1 text-sm text-muted-foreground">Try a different category to see results.</p>
          </div>
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
                  {formatDate(active.issue_date) && <div><span className="text-slate-500">Issued:</span> {formatDate(active.issue_date)}</div>}
                  {formatDate(active.expiry_date) && <div><span className="text-slate-500">Expires:</span> {formatDate(active.expiry_date)}</div>}
                </div>
                {active.pdf_url && (
                  <Button asChild className="bg-primary hover:bg-primary/90 text-white rounded-md">
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
