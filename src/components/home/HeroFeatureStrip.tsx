import { Plane, Radio, ShieldCheck, Cpu } from "lucide-react";

const features = [
  { icon: Plane, title: "Custom UAV Design", desc: "Airframes tuned to your mission." },
  { icon: Radio, title: "Autonomous Flight", desc: "RTK GPS & obstacle-aware nav." },
  { icon: Cpu, title: "Payload Ready", desc: "Cameras, LiDAR & sensors." },
  { icon: ShieldCheck, title: "Defence-Grade", desc: "Rugged, made-in-India." },
];

export const HeroFeatureStrip = () => (
  <div className="relative mt-10 lg:mt-14">
    <div className="rounded-lg bg-white border border-border overflow-hidden">
      <div className="grid grid-cols-2 md:grid-cols-4 divide-x divide-border">
        {features.map((f) => (
          <div key={f.title} className="p-5 md:p-6">
            <div className="flex items-start gap-3">
              <div className="w-9 h-9 rounded-md bg-primary/10 flex items-center justify-center flex-shrink-0">
                <f.icon className="w-4 h-4 text-primary" />
              </div>
              <div className="min-w-0">
                <h4 className="text-[13px] font-semibold text-foreground leading-tight">{f.title}</h4>
                <p className="text-[11px] text-muted-foreground mt-0.5 leading-snug">{f.desc}</p>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  </div>
);
