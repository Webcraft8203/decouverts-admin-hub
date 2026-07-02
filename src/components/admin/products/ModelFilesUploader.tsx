import { useRef, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Card } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Upload, Trash2, Loader2, CheckCircle2, Box, FileCode, FileBox } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface Props {
  productId?: string; // used for folder path; falls back to "unassigned"
  glbUrl: string;
  stepUrl: string;
  stlUrl: string;
  onChange: (patch: { glb_model_url?: string; step_file_url?: string; stl_file_url?: string }) => void;
}

type Kind = "glb" | "step" | "stl";

const KINDS: Record<Kind, { label: string; icon: any; accept: string; exts: string[]; hint: string }> = {
  glb: {
    label: "Interactive 3D Model (GLB)",
    icon: Box,
    accept: ".glb,model/gltf-binary",
    exts: ["glb"],
    hint: "Used for the in-page 3D viewer. Recommended <10 MB.",
  },
  step: {
    label: "STEP / STP (CAD)",
    icon: FileCode,
    accept: ".step,.stp",
    exts: ["step", "stp"],
    hint: "Optional. Offered as a download only.",
  },
  stl: {
    label: "STL (Mesh)",
    icon: FileBox,
    accept: ".stl",
    exts: ["stl"],
    hint: "Optional. Offered as a download only.",
  },
};

export function ModelFilesUploader({ productId, glbUrl, stepUrl, stlUrl, onChange }: Props) {
  const { toast } = useToast();
  const [progress, setProgress] = useState<Record<Kind, number>>({ glb: 0, step: 0, stl: 0 });
  const [busy, setBusy] = useState<Kind | null>(null);
  const refs: Record<Kind, React.RefObject<HTMLInputElement>> = {
    glb: useRef<HTMLInputElement>(null),
    step: useRef<HTMLInputElement>(null),
    stl: useRef<HTMLInputElement>(null),
  };

  const currentUrl = (k: Kind) => (k === "glb" ? glbUrl : k === "step" ? stepUrl : stlUrl);
  const field = (k: Kind) =>
    k === "glb" ? "glb_model_url" : k === "step" ? "step_file_url" : "stl_file_url";

  const upload = async (k: Kind, file: File) => {
    const ext = (file.name.split(".").pop() || "").toLowerCase();
    if (!KINDS[k].exts.includes(ext)) {
      toast({ title: "Unsupported file type", description: `Expected .${KINDS[k].exts.join(" / .")}`, variant: "destructive" });
      return;
    }
    setBusy(k);
    setProgress((p) => ({ ...p, [k]: 5 }));
    const folder = productId || "unassigned";
    const path = `${folder}/${k}-${Date.now()}.${ext}`;

    // Simulated progress (Supabase JS doesn't expose upload progress)
    const tick = setInterval(() => {
      setProgress((p) => ({ ...p, [k]: Math.min(90, (p[k] || 5) + 8) }));
    }, 200);

    const { error } = await supabase.storage
      .from("product-3d-models")
      .upload(path, file, { upsert: true, contentType: file.type || "application/octet-stream" });

    clearInterval(tick);
    if (error) {
      setProgress((p) => ({ ...p, [k]: 0 }));
      setBusy(null);
      toast({ title: "Upload failed", description: error.message, variant: "destructive" });
      return;
    }
    setProgress((p) => ({ ...p, [k]: 100 }));
    onChange({ [field(k)]: path } as any);
    toast({ title: `${KINDS[k].label} uploaded` });
    setTimeout(() => setProgress((p) => ({ ...p, [k]: 0 })), 800);
    setBusy(null);
  };

  const remove = async (k: Kind) => {
    const url = currentUrl(k);
    if (!url) return;
    // Only delete storage object if it's a stored path (not an external URL)
    if (!/^https?:\/\//i.test(url)) {
      await supabase.storage.from("product-3d-models").remove([url]);
    }
    onChange({ [field(k)]: null } as any);
    toast({ title: `${KINDS[k].label} removed` });
  };

  return (
    <div className="space-y-3">
      <div>
        <Label className="text-base">3D Model & Engineering Files</Label>
        <p className="text-xs text-muted-foreground">
          GLB powers the interactive viewer. STEP/STL are offered as downloads only.
        </p>
      </div>

      {(Object.keys(KINDS) as Kind[]).map((k) => {
        const meta = KINDS[k];
        const Icon = meta.icon;
        const url = currentUrl(k);
        const uploaded = !!url;
        return (
          <Card key={k} className="p-4 bg-muted/30 border-border/60">
            <div className="flex items-start gap-3">
              <div className={`w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0 ${uploaded ? "bg-success/15 text-success" : "bg-muted text-muted-foreground"}`}>
                <Icon className="h-5 w-5" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="font-medium text-sm">{meta.label}</span>
                  {uploaded && (
                    <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-success uppercase tracking-wider">
                      <CheckCircle2 className="h-3 w-3" /> Uploaded
                    </span>
                  )}
                </div>
                <p className="text-xs text-muted-foreground mt-0.5">{meta.hint}</p>
                {uploaded && (
                  <p className="text-[11px] font-mono text-muted-foreground/80 mt-1 truncate">{url}</p>
                )}
                {busy === k && progress[k] > 0 && (
                  <Progress value={progress[k]} className="h-1.5 mt-2" />
                )}
              </div>
              <div className="flex items-center gap-1 flex-shrink-0">
                <input
                  ref={refs[k]}
                  type="file"
                  accept={meta.accept}
                  className="hidden"
                  onChange={(e) => {
                    const f = e.target.files?.[0];
                    if (f) upload(k, f);
                    if (refs[k].current) refs[k].current!.value = "";
                  }}
                />
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => refs[k].current?.click()}
                  disabled={busy !== null}
                >
                  {busy === k ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Upload className="h-3.5 w-3.5" />}
                  <span className="ml-1.5">{uploaded ? "Replace" : "Upload"}</span>
                </Button>
                {uploaded && (
                  <Button type="button" variant="ghost" size="icon" onClick={() => remove(k)} disabled={busy !== null}>
                    <Trash2 className="h-4 w-4 text-destructive" />
                  </Button>
                )}
              </div>
            </div>
          </Card>
        );
      })}
    </div>
  );
}
