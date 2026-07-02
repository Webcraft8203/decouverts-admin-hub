import { motion } from "framer-motion";
import { Shield, Sprout, Radar, Wrench, FlaskConical, Layers, Boxes } from "lucide-react";

export interface MissionPreset {
  id: string;
  label: string;
  match: string[]; // lowercased tokens to match against mission_type / category / name
  Icon: any;
}

export const MISSION_PRESETS: MissionPreset[] = [
  { id: "all", label: "All Missions", match: [], Icon: Layers },
  { id: "defence", label: "Defence & UAV", match: ["defence", "defense", "military", "uav", "tactical"], Icon: Shield },
  { id: "agriculture", label: "Agriculture", match: ["agri", "farm", "crop", "spray"], Icon: Sprout },
  { id: "surveillance", label: "Surveillance", match: ["surveill", "recon", "isr", "monitor"], Icon: Radar },
  { id: "inspection", label: "Industrial Inspection", match: ["inspect", "industrial", "asset"], Icon: Wrench },
  { id: "3d-printing", label: "3D Printing", match: ["3d print", "printer", "additive"], Icon: Boxes },
  { id: "rnd", label: "R&D", match: ["research", "r&d", "lab", "development"], Icon: FlaskConical },
];

interface Props {
  active: string;
  onChange: (id: string) => void;
  counts?: Record<string, number>;
}

export function MissionPresets({ active, onChange, counts }: Props) {
  return (
    <section className="relative border-y border-border/40 bg-gradient-to-b from-secondary/10 via-background to-background">
      <div className="max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8 py-5">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <div className="w-1 h-4 bg-primary rounded-full" />
            <div className="text-[10px] font-bold uppercase tracking-[0.22em] text-primary">
              Mission Presets
            </div>
          </div>
          <div className="text-[10px] text-muted-foreground font-mono uppercase tracking-[0.14em] hidden sm:block">
            Filter by operational profile
          </div>
        </div>

        <div className="flex items-center gap-2 overflow-x-auto scrollbar-none pb-1 -mx-1 px-1">
          {MISSION_PRESETS.map((p, i) => {
            const isActive = active === p.id;
            const count = counts?.[p.id];
            return (
              <motion.button
                key={p.id}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3, delay: i * 0.04 }}
                onClick={() => onChange(p.id)}
                className={`group relative flex-shrink-0 inline-flex items-center gap-2 pl-3 pr-3.5 py-2 rounded-xl border transition-all ${
                  isActive
                    ? "bg-primary text-primary-foreground border-primary shadow-md shadow-primary/25"
                    : "bg-card/70 border-border/50 text-foreground hover:border-primary/50 hover:bg-card"
                }`}
              >
                <div
                  className={`w-6 h-6 rounded-lg flex items-center justify-center transition-colors ${
                    isActive
                      ? "bg-primary-foreground/15"
                      : "bg-secondary/60 group-hover:bg-primary/10"
                  }`}
                >
                  <p.Icon
                    className={`w-3.5 h-3.5 ${
                      isActive ? "text-primary-foreground" : "text-primary"
                    }`}
                  />
                </div>
                <span className="text-[11px] font-bold uppercase tracking-[0.12em] whitespace-nowrap">
                  {p.label}
                </span>
                {typeof count === "number" && (
                  <span
                    className={`text-[10px] font-mono px-1.5 py-0.5 rounded ${
                      isActive
                        ? "bg-primary-foreground/15 text-primary-foreground"
                        : "bg-secondary text-muted-foreground"
                    }`}
                  >
                    {count}
                  </span>
                )}
                {isActive && (
                  <motion.span
                    layoutId="mission-pill-glow"
                    className="absolute inset-0 rounded-xl ring-2 ring-primary/40"
                  />
                )}
              </motion.button>
            );
          })}
        </div>
      </div>
    </section>
  );
}

// Helper: does a product match a preset?
export function matchesMissionPreset(preset: MissionPreset, product: any): boolean {
  if (preset.match.length === 0) return true;
  const haystack = [
    product.mission_type,
    product.categories?.name,
    product.name,
    ...(product.applications || []),
  ]
    .filter(Boolean)
    .join(" ")
    .toLowerCase();
  return preset.match.some((token) => haystack.includes(token));
}
