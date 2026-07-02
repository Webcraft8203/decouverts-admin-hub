import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Card } from "@/components/ui/card";
import { Plus, Trash2, ArrowUp, ArrowDown } from "lucide-react";

export interface RepeaterField {
  key: string;
  label: string;
  type?: "text" | "textarea";
  placeholder?: string;
}

interface RepeaterListProps<T extends Record<string, any>> {
  title: string;
  items: T[];
  fields: RepeaterField[];
  onChange: (items: T[]) => void;
  emptyItem: T;
  emptyMessage?: string;
}

export function RepeaterList<T extends Record<string, any>>({
  title,
  items,
  fields,
  onChange,
  emptyItem,
  emptyMessage,
}: RepeaterListProps<T>) {
  const update = (index: number, key: string, value: any) => {
    const next = [...items];
    next[index] = { ...next[index], [key]: value };
    onChange(next);
  };

  const add = () => onChange([...items, { ...emptyItem }]);
  const remove = (index: number) => onChange(items.filter((_, i) => i !== index));
  const move = (index: number, delta: number) => {
    const target = index + delta;
    if (target < 0 || target >= items.length) return;
    const next = [...items];
    [next[index], next[target]] = [next[target], next[index]];
    onChange(next);
  };

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <Label className="text-base">{title}</Label>
        <Button type="button" variant="outline" size="sm" onClick={add}>
          <Plus className="h-4 w-4 mr-1" /> Add
        </Button>
      </div>

      {items.length === 0 && (
        <p className="text-sm text-muted-foreground italic">
          {emptyMessage || "No items yet — click Add to create one."}
        </p>
      )}

      {items.map((item, index) => (
        <Card key={index} className="p-4 space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-mono text-muted-foreground">#{index + 1}</span>
            <div className="flex items-center gap-1">
              <Button type="button" variant="ghost" size="icon" onClick={() => move(index, -1)} disabled={index === 0}>
                <ArrowUp className="h-4 w-4" />
              </Button>
              <Button type="button" variant="ghost" size="icon" onClick={() => move(index, 1)} disabled={index === items.length - 1}>
                <ArrowDown className="h-4 w-4" />
              </Button>
              <Button type="button" variant="ghost" size="icon" onClick={() => remove(index)}>
                <Trash2 className="h-4 w-4 text-destructive" />
              </Button>
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {fields.map((f) => (
              <div
                key={f.key}
                className={f.type === "textarea" ? "md:col-span-2" : ""}
              >
                <Label className="text-xs">{f.label}</Label>
                {f.type === "textarea" ? (
                  <Textarea
                    value={item[f.key] ?? ""}
                    onChange={(e) => update(index, f.key, e.target.value)}
                    placeholder={f.placeholder}
                    rows={2}
                  />
                ) : (
                  <Input
                    value={item[f.key] ?? ""}
                    onChange={(e) => update(index, f.key, e.target.value)}
                    placeholder={f.placeholder}
                  />
                )}
              </div>
            ))}
          </div>
        </Card>
      ))}
    </div>
  );
}
