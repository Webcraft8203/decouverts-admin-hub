import { useRef, useState } from "react";
import { motion } from "framer-motion";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Slider } from "@/components/ui/slider";
import { Search, Mic, Radar, Package, Gauge, Wallet, ArrowUpDown, X } from "lucide-react";
import { toast } from "sonner";

interface Category { id: string; name: string }

interface Props {
  searchQuery: string;
  setSearchQuery: (v: string) => void;
  categories: Category[];
  selectedCategory: string | null;
  setSelectedCategory: (v: string | null) => void;
  missionFilter: string;
  setMissionFilter: (v: string) => void;
  availability: string;
  setAvailability: (v: string) => void;
  sortBy: string;
  setSortBy: (v: string) => void;
  priceBounds: [number, number];
  priceRange: [number, number] | null;
  setPriceRange: (v: [number, number] | null) => void;
  missionTypes: string[];
  resultCount: number;
}

export function CommandCenterSearch(p: Props) {
  const activeRange = p.priceRange || p.priceBounds;
  const [voiceActive, setVoiceActive] = useState(false);
  const recognitionRef = useRef<any>(null);

  const startVoice = () => {
    const SR = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SR) {
      toast.info("Voice search not supported in this browser");
      return;
    }
    if (voiceActive) {
      recognitionRef.current?.stop();
      return;
    }
    const rec = new SR();
    rec.lang = "en-IN";
    rec.interimResults = false;
    rec.onresult = (e: any) => {
      const text = e.results[0][0].transcript;
      p.setSearchQuery(text);
      toast.success(`Searching: ${text}`);
    };
    rec.onend = () => setVoiceActive(false);
    rec.onerror = () => setVoiceActive(false);
    recognitionRef.current = rec;
    rec.start();
    setVoiceActive(true);
  };

  return (
    <section className="relative py-10 sm:py-14">
      <div className="max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
          className="relative rounded-3xl border border-border/60 bg-card/70 backdrop-blur-xl shadow-[0_20px_70px_-25px_rgba(0,0,0,0.25)] overflow-hidden"
        >
          {/* Ambient glow */}
          <div className="pointer-events-none absolute -top-24 -left-24 w-64 h-64 rounded-full bg-primary/10 blur-3xl" />
          <div className="pointer-events-none absolute -bottom-24 -right-24 w-64 h-64 rounded-full bg-primary/10 blur-3xl" />

          {/* Header strip */}
          <div className="relative flex items-center justify-between px-5 sm:px-6 py-3 border-b border-border/50 bg-gradient-to-r from-secondary/30 via-transparent to-secondary/30">
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-primary animate-pulse" />
              <span className="text-[10px] uppercase tracking-[0.22em] font-bold text-foreground">
                Command Center
              </span>
            </div>
            <span className="text-[10px] font-mono text-muted-foreground">
              {p.resultCount} platform{p.resultCount === 1 ? "" : "s"} online
            </span>
          </div>

          <div className="relative p-5 sm:p-6 space-y-5">
            {/* Search row */}
            <div className="flex items-stretch gap-2">
              <div className="relative flex-1">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  value={p.searchQuery}
                  onChange={(e) => p.setSearchQuery(e.target.value)}
                  placeholder="Search platforms, missions, specifications..."
                  className="pl-11 pr-10 h-12 rounded-xl bg-background/60 border-border/60 text-sm focus-visible:ring-2 focus-visible:ring-primary/40"
                />
                {p.searchQuery && (
                  <button
                    onClick={() => p.setSearchQuery("")}
                    className="absolute right-3 top-1/2 -translate-y-1/2 w-6 h-6 rounded-full hover:bg-secondary flex items-center justify-center"
                    aria-label="Clear search"
                  >
                    <X className="w-3.5 h-3.5 text-muted-foreground" />
                  </button>
                )}
              </div>
              <button
                onClick={startVoice}
                aria-label="Voice search"
                className={`relative w-12 h-12 rounded-xl border flex items-center justify-center transition-all ${
                  voiceActive
                    ? "bg-primary text-primary-foreground border-primary shadow-lg shadow-primary/30"
                    : "bg-background/60 border-border/60 text-foreground hover:border-primary/60"
                }`}
              >
                <Mic className="w-4 h-4" />
                {voiceActive && (
                  <span className="absolute inset-0 rounded-xl border-2 border-primary animate-ping" />
                )}
              </button>
            </div>

            {/* Filters row */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              <FilterSelect
                icon={Package}
                label="Category"
                value={p.selectedCategory ?? "all"}
                onChange={(v) => p.setSelectedCategory(v === "all" ? null : v)}
                options={[
                  { value: "all", label: "All Categories" },
                  ...p.categories.map((c) => ({ value: c.id, label: c.name })),
                ]}
              />
              <FilterSelect
                icon={Radar}
                label="Mission"
                value={p.missionFilter}
                onChange={p.setMissionFilter}
                options={[
                  { value: "all", label: "All Missions" },
                  ...p.missionTypes.map((m) => ({ value: m, label: m })),
                ]}
              />
              <FilterSelect
                icon={Gauge}
                label="Availability"
                value={p.availability}
                onChange={p.setAvailability}
                options={[
                  { value: "all", label: "All Status" },
                  { value: "in_stock", label: "Available" },
                  { value: "coming_soon", label: "Coming Soon" },
                  { value: "pre_order", label: "Pre-Order" },
                ]}
              />
              <FilterSelect
                icon={ArrowUpDown}
                label="Sort"
                value={p.sortBy}
                onChange={p.setSortBy}
                options={[
                  { value: "newest", label: "Newest" },
                  { value: "price-low", label: "Price ↑" },
                  { value: "price-high", label: "Price ↓" },
                  { value: "name", label: "Name" },
                ]}
              />
            </div>

            {/* Price slider */}
            {p.priceBounds[1] > p.priceBounds[0] && (
              <div className="pt-2">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <Wallet className="w-3.5 h-3.5 text-primary" />
                    <span className="text-[10px] uppercase tracking-[0.18em] font-bold text-foreground">
                      Investment Range
                    </span>
                  </div>
                  <div className="text-[11px] font-mono text-muted-foreground">
                    ₹{activeRange[0].toLocaleString("en-IN")} — ₹
                    {activeRange[1].toLocaleString("en-IN")}
                  </div>
                </div>
                <Slider
                  value={[activeRange[0], activeRange[1]]}
                  min={p.priceBounds[0]}
                  max={p.priceBounds[1]}
                  step={Math.max(100, Math.round((p.priceBounds[1] - p.priceBounds[0]) / 100))}
                  onValueChange={(v) => p.setPriceRange([v[0], v[1]] as [number, number])}
                />
              </div>
            )}
          </div>
        </motion.div>
      </div>
    </section>
  );
}

function FilterSelect({
  icon: Icon,
  label,
  value,
  onChange,
  options,
}: {
  icon: any;
  label: string;
  value: string;
  onChange: (v: string) => void;
  options: { value: string; label: string }[];
}) {
  return (
    <div>
      <label className="text-[9px] uppercase tracking-[0.18em] font-bold text-muted-foreground mb-1.5 flex items-center gap-1.5">
        <Icon className="w-3 h-3 text-primary" />
        {label}
      </label>
      <Select value={value} onValueChange={onChange}>
        <SelectTrigger className="h-10 rounded-lg bg-background/60 border-border/60 text-xs">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          {options.map((o) => (
            <SelectItem key={o.value} value={o.value} className="text-xs">
              {o.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}
