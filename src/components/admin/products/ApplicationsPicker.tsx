import { useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { X, Plus } from "lucide-react";

const PRESETS = [
  "Agriculture", "Survey & Mapping", "Surveillance", "Defence", "Mining",
  "Research & Development", "Training", "Education", "3D Printing",
  "Inspection", "Powerline", "Construction", "Police", "Disaster Response",
  "Forest", "Oil & Gas", "Wildlife", "Media & Film", "Delivery",
];

interface Props {
  value: string[];
  onChange: (next: string[]) => void;
}

export function ApplicationsPicker({ value, onChange }: Props) {
  const [custom, setCustom] = useState("");

  const toggle = (tag: string) => {
    if (value.includes(tag)) onChange(value.filter((v) => v !== tag));
    else onChange([...value, tag]);
  };

  const addCustom = () => {
    const t = custom.trim();
    if (t && !value.includes(t)) onChange([...value, t]);
    setCustom("");
  };

  return (
    <div className="space-y-3">
      <div>
        <Label className="text-base">Applications / Industries</Label>
        <p className="text-xs text-muted-foreground">Pick presets or add custom industries.</p>
      </div>

      <div className="flex flex-wrap gap-2">
        {PRESETS.map((p) => (
          <button
            key={p}
            type="button"
            onClick={() => toggle(p)}
            className={`px-3 py-1.5 rounded-full text-xs font-medium border transition-colors ${
              value.includes(p)
                ? "bg-primary text-primary-foreground border-primary"
                : "bg-background border-border hover:border-primary"
            }`}
          >
            {p}
          </button>
        ))}
      </div>

      {value.length > 0 && (
        <div className="pt-2 border-t">
          <p className="text-xs text-muted-foreground mb-2">Selected ({value.length})</p>
          <div className="flex flex-wrap gap-2">
            {value.map((v) => (
              <Badge key={v} variant="secondary" className="gap-1">
                {v}
                <button type="button" onClick={() => toggle(v)}>
                  <X className="h-3 w-3" />
                </button>
              </Badge>
            ))}
          </div>
        </div>
      )}

      <div className="flex gap-2 pt-2">
        <Input
          value={custom}
          onChange={(e) => setCustom(e.target.value)}
          placeholder="Add custom application..."
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              e.preventDefault();
              addCustom();
            }
          }}
        />
        <Button type="button" variant="outline" onClick={addCustom}>
          <Plus className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}
