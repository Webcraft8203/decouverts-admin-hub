import { Suspense, useMemo } from "react";
import { Canvas } from "@react-three/fiber";
import { OrbitControls, useGLTF, Stage, Html, Environment } from "@react-three/drei";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Loader2, Box, RotateCw, Maximize2, Move3d } from "lucide-react";
import { motion } from "framer-motion";

function Model({ url }: { url: string }) {
  const { scene } = useGLTF(url);
  const cloned = useMemo(() => scene.clone(true), [scene]);
  return <primitive object={cloned} />;
}

function LoadingFallback() {
  return (
    <Html center>
      <div className="flex items-center gap-2 text-xs text-muted-foreground bg-card/90 px-3 py-2 rounded-lg border border-border/50 backdrop-blur">
        <Loader2 className="w-3.5 h-3.5 animate-spin" />
        Loading 3D model…
      </div>
    </Html>
  );
}

interface Props {
  modelPath: string; // storage object path in product-3d-models bucket
  productName?: string;
}

export function Product3DViewer({ modelPath, productName }: Props) {
  // Signed URL (bucket is private)
  const { data: signedUrl, isLoading, error } = useQuery({
    queryKey: ["product-3d-signed", modelPath],
    queryFn: async () => {
      // Accept both full URLs and storage paths
      if (/^https?:\/\//i.test(modelPath)) return modelPath;
      const { data, error } = await supabase.storage
        .from("product-3d-models")
        .createSignedUrl(modelPath, 60 * 60);
      if (error) throw error;
      return data.signedUrl;
    },
    staleTime: 55 * 60 * 1000,
  });

  return (
    <section className="mt-12 lg:mt-16">
      <div className="flex items-end justify-between mb-4">
        <div>
          <div className="text-[10px] font-bold uppercase tracking-[0.22em] text-primary mb-1.5">
            Interactive Model
          </div>
          <h2 className="text-xl sm:text-2xl font-bold text-foreground tracking-tight">
            Explore in 3D
          </h2>
        </div>
        <div className="hidden sm:flex items-center gap-3 text-[10px] text-muted-foreground font-mono uppercase tracking-[0.14em]">
          <span className="flex items-center gap-1.5">
            <Move3d className="w-3.5 h-3.5" /> Drag
          </span>
          <span className="flex items-center gap-1.5">
            <RotateCw className="w-3.5 h-3.5" /> Rotate
          </span>
          <span className="flex items-center gap-1.5">
            <Maximize2 className="w-3.5 h-3.5" /> Zoom
          </span>
        </div>
      </div>

      <motion.div
        initial={{ opacity: 0, y: 24 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ duration: 0.5 }}
        className="relative aspect-[16/10] rounded-2xl overflow-hidden border border-border/50 bg-gradient-to-br from-secondary/40 via-background to-secondary/20"
      >
        {/* Blueprint grid */}
        <div
          aria-hidden
          className="absolute inset-0 opacity-25 [mask-image:radial-gradient(ellipse_at_center,black,transparent_75%)] pointer-events-none"
          style={{
            backgroundImage:
              "linear-gradient(hsl(var(--border)/0.6) 1px, transparent 1px), linear-gradient(90deg, hsl(var(--border)/0.6) 1px, transparent 1px)",
            backgroundSize: "36px 36px",
          }}
        />

        {/* Corner marks */}
        {["top-3 left-3", "top-3 right-3", "bottom-3 left-3", "bottom-3 right-3"].map(
          (pos) => (
            <div
              key={pos}
              className={`absolute ${pos} w-5 h-5 pointer-events-none z-10`}
              style={{
                borderTop: pos.includes("top") ? "2px solid hsl(var(--primary) / 0.7)" : undefined,
                borderBottom: pos.includes("bottom") ? "2px solid hsl(var(--primary) / 0.7)" : undefined,
                borderLeft: pos.includes("left") ? "2px solid hsl(var(--primary) / 0.7)" : undefined,
                borderRight: pos.includes("right") ? "2px solid hsl(var(--primary) / 0.7)" : undefined,
              }}
            />
          )
        )}

        <div className="absolute top-3 left-1/2 -translate-x-1/2 z-10 pointer-events-none">
          <span className="inline-flex items-center gap-1.5 text-[10px] font-bold px-2.5 py-1 rounded bg-primary/15 border border-primary/40 text-primary backdrop-blur">
            <Box className="w-3 h-3" /> 3D VIEW
          </span>
        </div>

        {isLoading ? (
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <Loader2 className="w-4 h-4 animate-spin" />
              Preparing model…
            </div>
          </div>
        ) : error || !signedUrl ? (
          <div className="absolute inset-0 flex items-center justify-center text-xs text-muted-foreground">
            3D model unavailable
          </div>
        ) : (
          <Canvas
            camera={{ position: [2.5, 1.5, 2.5], fov: 45 }}
            dpr={[1, 2]}
            gl={{ antialias: true, alpha: true }}
          >
            <Suspense fallback={<LoadingFallback />}>
              <Stage
                intensity={0.6}
                environment="city"
                adjustCamera={1.2}
                shadows={{ type: "contact", opacity: 0.35, blur: 2 }}
              >
                <Model url={signedUrl} />
              </Stage>
              <Environment preset="city" />
            </Suspense>
            <OrbitControls
              enablePan={false}
              autoRotate
              autoRotateSpeed={0.6}
              minPolarAngle={Math.PI / 6}
              maxPolarAngle={Math.PI / 1.8}
            />
          </Canvas>
        )}

        <div className="absolute bottom-3 right-3 z-10 text-[9px] font-mono text-muted-foreground/60 tracking-widest bg-card/70 border border-border/40 px-2 py-1 rounded backdrop-blur">
          {productName ? `MODEL // ${productName.toUpperCase()}` : "MODEL // GLB"}
        </div>
      </motion.div>
    </section>
  );
}
