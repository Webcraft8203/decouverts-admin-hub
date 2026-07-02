import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useEffect, useRef, useState } from "react";
import { RotateCw, MousePointer } from "lucide-react";
import { motion } from "framer-motion";

interface Props {
  productId: string;
  fallbackFrames?: string[] | null;
}

export function Product360Spin({ productId, fallbackFrames }: Props) {
  const { data: framesFromTable } = useQuery({
    queryKey: ["product-360", productId],
    queryFn: async () => {
      const { data } = await supabase
        .from("product_360_images")
        .select("image_url, frame_order")
        .eq("product_id", productId)
        .order("frame_order", { ascending: true });
      return (data || []).map((r: any) => r.image_url as string);
    },
    enabled: !!productId,
  });

  const frames =
    framesFromTable && framesFromTable.length > 0
      ? framesFromTable
      : fallbackFrames || [];

  const [idx, setIdx] = useState(0);
  const dragRef = useRef<{ x: number; startIdx: number } | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  // Preload frames
  useEffect(() => {
    (frames || []).forEach((src) => {
      const img = new Image();
      img.src = src;
    });
  }, [frames]);

  if (!frames || frames.length < 4) return null;

  const totalFrames = frames.length;

  const onPointerDown = (e: React.PointerEvent) => {
    (e.currentTarget as Element).setPointerCapture(e.pointerId);
    dragRef.current = { x: e.clientX, startIdx: idx };
  };
  const onPointerMove = (e: React.PointerEvent) => {
    if (!dragRef.current || !containerRef.current) return;
    const width = containerRef.current.offsetWidth;
    const dx = e.clientX - dragRef.current.x;
    const framesMoved = Math.round((dx / width) * totalFrames * 1.5);
    let next = (dragRef.current.startIdx - framesMoved) % totalFrames;
    if (next < 0) next += totalFrames;
    setIdx(next);
  };
  const onPointerUp = (e: React.PointerEvent) => {
    (e.currentTarget as Element).releasePointerCapture(e.pointerId);
    dragRef.current = null;
  };

  return (
    <section className="mt-12 lg:mt-16">
      <div className="flex items-end justify-between mb-4">
        <div>
          <div className="text-[10px] font-bold uppercase tracking-[0.22em] text-primary mb-1.5">
            360° Inspection
          </div>
          <h2 className="text-xl sm:text-2xl font-bold text-foreground tracking-tight">
            Drag to Rotate
          </h2>
        </div>
        <div className="hidden sm:flex items-center gap-3 text-[10px] text-muted-foreground font-mono uppercase tracking-[0.14em]">
          <span className="flex items-center gap-1.5">
            <MousePointer className="w-3.5 h-3.5" /> Click & Drag
          </span>
        </div>
      </div>

      <motion.div
        initial={{ opacity: 0, y: 24 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ duration: 0.5 }}
        ref={containerRef}
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerUp}
        onPointerCancel={onPointerUp}
        className="relative aspect-[16/10] rounded-2xl overflow-hidden border border-border/50 bg-gradient-to-br from-secondary/40 via-background to-secondary/20 cursor-grab active:cursor-grabbing select-none touch-none"
      >
        <div
          aria-hidden
          className="absolute inset-0 opacity-25 [mask-image:radial-gradient(ellipse_at_center,black,transparent_75%)] pointer-events-none"
          style={{
            backgroundImage:
              "linear-gradient(hsl(var(--border)/0.6) 1px, transparent 1px), linear-gradient(90deg, hsl(var(--border)/0.6) 1px, transparent 1px)",
            backgroundSize: "36px 36px",
          }}
        />

        <img
          src={frames[idx]}
          alt={`Frame ${idx + 1}`}
          draggable={false}
          className="relative w-full h-full object-contain p-10 pointer-events-none"
        />

        <div className="absolute top-3 left-1/2 -translate-x-1/2 pointer-events-none">
          <span className="inline-flex items-center gap-1.5 text-[10px] font-bold px-2.5 py-1 rounded bg-primary/15 border border-primary/40 text-primary backdrop-blur">
            <RotateCw className="w-3 h-3" /> 360° SPIN
          </span>
        </div>

        {/* Frame indicator */}
        <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex items-center gap-2 pointer-events-none">
          <div className="text-[10px] font-mono text-muted-foreground bg-card/80 border border-border/40 px-2 py-1 rounded backdrop-blur">
            {String(idx + 1).padStart(2, "0")} / {String(totalFrames).padStart(2, "0")}
          </div>
        </div>

        {/* Progress bar */}
        <div className="absolute bottom-0 inset-x-0 h-1 bg-border/30">
          <div
            className="h-full bg-primary transition-[width] duration-100"
            style={{ width: `${((idx + 1) / totalFrames) * 100}%` }}
          />
        </div>
      </motion.div>
    </section>
  );
}
