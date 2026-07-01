import { motion } from "framer-motion";
import { Plane, Radio, ShieldCheck, Cpu } from "lucide-react";

const features = [
  { icon: Plane, title: "Custom UAV Design", desc: "Airframes tuned to your mission." },
  { icon: Radio, title: "Autonomous Flight", desc: "RTK GPS & obstacle-aware nav." },
  { icon: Cpu, title: "Payload Ready", desc: "Cameras, LiDAR & sensors." },
  { icon: ShieldCheck, title: "Defence-Grade", desc: "Rugged, made-in-India." },
];

export const HeroFeatureStrip = () => (
  <motion.div
    initial={{ opacity: 0, y: 20 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ duration: 0.7, delay: 0.6 }}
    className="relative mt-10 lg:mt-14"
  >
    <div className="rounded-2xl bg-white/70 backdrop-blur-xl border border-slate-200/70 shadow-[0_20px_50px_-24px_rgba(15,23,42,0.15)] overflow-hidden">
      <div className="absolute inset-x-8 -top-px h-px bg-gradient-to-r from-transparent via-primary/50 to-transparent" />
      <div className="grid grid-cols-2 md:grid-cols-4 divide-x divide-slate-200/60">
        {features.map((f, i) => (
          <motion.div
            key={f.title}
            className="group relative p-5 md:p-6 hover:-translate-y-0.5 transition-transform duration-300"
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.7 + i * 0.08 }}
          >
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary/15 to-primary/5 border border-primary/10 flex items-center justify-center flex-shrink-0 group-hover:scale-110 group-hover:from-primary/25 transition-all duration-300">
                <f.icon className="w-4.5 h-4.5 text-primary" />
              </div>
              <div className="min-w-0">
                <h4 className="text-[13px] font-bold text-slate-900 leading-tight">{f.title}</h4>
                <p className="text-[11px] text-slate-500 mt-0.5 leading-snug">{f.desc}</p>
              </div>
            </div>
            <div className="absolute inset-x-4 bottom-0 h-px bg-gradient-to-r from-transparent via-primary/40 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
          </motion.div>
        ))}
      </div>
    </div>
  </motion.div>
);
