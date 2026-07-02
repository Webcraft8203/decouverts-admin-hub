import { motion } from "framer-motion";
import { Layers } from "lucide-react";

interface Props { applications: string[] | null | undefined }

export function ProductApplications({ applications }: Props) {
  if (!applications || applications.length === 0) return null;
  return (
    <section className="mt-12 lg:mt-16 border-t border-border/30 pt-8 lg:pt-10">
      <div className="flex items-center gap-2.5 mb-6">
        <Layers className="w-5 h-5 text-primary" />
        <h2 className="text-lg lg:text-xl font-bold text-foreground">Applications & Industries</h2>
      </div>
      <div className="flex flex-wrap gap-2">
        {applications.map((a, i) => (
          <motion.span
            key={a + i}
            initial={{ opacity: 0, scale: 0.9 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 0.25, delay: i * 0.025 }}
            className="px-3.5 py-1.5 rounded-full text-xs font-medium bg-primary/5 text-foreground border border-primary/15 hover:bg-primary/10 hover:border-primary/30 transition-all"
          >
            {a}
          </motion.span>
        ))}
      </div>
    </section>
  );
}
