import { useEffect, useRef, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Card } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Upload, Trash2, FileText, Loader2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface Props { productId: string; }

interface D {
  id: string;
  download_type: string;
  title: string;
  file_url: string;
  file_size: number | null;
  display_order: number;
}

const TYPES = [
  { value: "brochure", label: "Brochure" },
  { value: "manual", label: "User Manual" },
  { value: "cad", label: "CAD File" },
  { value: "firmware", label: "Firmware" },
  { value: "certificate", label: "Certificate" },
  { value: "other", label: "Other" },
];

export function DownloadsManager({ productId }: Props) {
  const [items, setItems] = useState<D[]>([]);
  const [title, setTitle] = useState("");
  const [type, setType] = useState("brochure");
  const [uploading, setUploading] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();

  const load = async () => {
    const { data } = await supabase
      .from("product_downloads")
      .select("*")
      .eq("product_id", productId)
      .order("display_order");
    setItems((data as D[]) || []);
  };

  useEffect(() => { if (productId) load(); }, [productId]);

  const upload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!title.trim()) {
      toast({ title: "Enter a title first", variant: "destructive" });
      return;
    }
    setUploading(true);
    const ext = file.name.split(".").pop();
    const path = `downloads/${productId}/${Date.now()}-${Math.random().toString(36).substring(7)}.${ext}`;
    const { error: upErr } = await supabase.storage.from("product-images").upload(path, file);
    if (upErr) {
      toast({ title: "Upload failed", description: upErr.message, variant: "destructive" });
      setUploading(false);
      return;
    }
    const { data: { publicUrl } } = supabase.storage.from("product-images").getPublicUrl(path);
    await supabase.from("product_downloads").insert({
      product_id: productId,
      download_type: type,
      title: title.trim(),
      file_url: publicUrl,
      file_size: file.size,
      display_order: items.length,
    });
    toast({ title: "Download added" });
    setTitle("");
    setUploading(false);
    if (fileRef.current) fileRef.current.value = "";
    load();
  };

  const remove = async (id: string) => {
    await supabase.from("product_downloads").delete().eq("id", id);
    load();
  };

  const formatSize = (bytes: number | null) => {
    if (!bytes) return "";
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  return (
    <div className="space-y-4">
      <div>
        <Label className="text-base">Downloads</Label>
        <p className="text-xs text-muted-foreground">
          Brochures, manuals, CAD files, firmware, certificates.
        </p>
      </div>

      <Card className="p-4 space-y-3 bg-muted/30">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <div>
            <Label className="text-xs">Title</Label>
            <Input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="e.g. Complete Brochure" />
          </div>
          <div>
            <Label className="text-xs">Type</Label>
            <Select value={type} onValueChange={setType}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                {TYPES.map((t) => <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
        </div>
        <input type="file" ref={fileRef} onChange={upload} className="hidden" accept=".pdf,.zip,.step,.stp,.igs,.iges,.stl,.obj,.docx,.xlsx" />
        <Button type="button" variant="outline" onClick={() => fileRef.current?.click()} disabled={uploading || !title.trim()}>
          {uploading ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" />Uploading...</> : <><Upload className="mr-2 h-4 w-4" />Upload File</>}
        </Button>
      </Card>

      <div className="space-y-2">
        {items.length === 0 && (
          <p className="text-sm text-muted-foreground italic">No downloads yet.</p>
        )}
        {items.map((d) => (
          <Card key={d.id} className="p-3 flex items-center justify-between">
            <div className="flex items-center gap-3 min-w-0">
              <FileText className="h-5 w-5 text-primary shrink-0" />
              <div className="min-w-0">
                <div className="font-medium truncate">{d.title}</div>
                <div className="text-xs text-muted-foreground">
                  {TYPES.find((t) => t.value === d.download_type)?.label} · {formatSize(d.file_size)}
                </div>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <a href={d.file_url} target="_blank" rel="noreferrer" className="text-xs text-primary hover:underline">Open</a>
              <Button type="button" variant="ghost" size="icon" onClick={() => remove(d.id)}>
                <Trash2 className="h-4 w-4 text-destructive" />
              </Button>
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
}
