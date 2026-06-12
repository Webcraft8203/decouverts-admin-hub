import { useEffect, useRef, useState } from "react";
import { Input } from "@/components/ui/input";
import { supabase } from "@/integrations/supabase/client";
import { Loader2, User, Building2 } from "lucide-react";

export interface CustomerMasterLite {
  id: string;
  customer_name: string;
  company_name: string | null;
  email: string | null;
  mobile_number: string | null;
  gst_number: string | null;
  billing_address: string | null;
  state: string | null;
  city: string | null;
  customer_type: string | null;
}

interface Props {
  value: string;
  onChange: (val: string) => void;
  onSelect: (c: CustomerMasterLite) => void;
  placeholder?: string;
  required?: boolean;
  disabled?: boolean;
  id?: string;
}

export function CustomerAutocomplete({
  value,
  onChange,
  onSelect,
  placeholder = "Type name, company, email, mobile or GST…",
  required,
  disabled,
  id,
}: Props) {
  const [results, setResults] = useState<CustomerMasterLite[]>([]);
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const wrapperRef = useRef<HTMLDivElement>(null);
  const tRef = useRef<number | null>(null);

  useEffect(() => {
    const onDoc = (e: MouseEvent) => {
      if (!wrapperRef.current?.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", onDoc);
    return () => document.removeEventListener("mousedown", onDoc);
  }, []);

  useEffect(() => {
    if (tRef.current) window.clearTimeout(tRef.current);
    const q = value.trim();
    if (q.length < 1) {
      setResults([]);
      return;
    }
    tRef.current = window.setTimeout(async () => {
      setLoading(true);
      const like = `%${q}%`;
      const { data } = await (supabase as any)
        .from("customer_master")
        .select("id, customer_name, company_name, email, mobile_number, gst_number, billing_address, state, city, customer_type")
        .or(
          `customer_name.ilike.${like},company_name.ilike.${like},email.ilike.${like},mobile_number.ilike.${like},gst_number.ilike.${like}`
        )
        .limit(10);
      setResults((data as CustomerMasterLite[]) || []);
      setLoading(false);
    }, 180);
  }, [value]);

  return (
    <div ref={wrapperRef} className="relative">
      <Input
        id={id}
        value={value}
        onChange={(e) => {
          onChange(e.target.value);
          setOpen(true);
        }}
        onFocus={() => value && setOpen(true)}
        placeholder={placeholder}
        required={required}
        disabled={disabled}
        autoComplete="off"
      />
      {open && (results.length > 0 || loading) && (
        <div className="absolute z-50 mt-1 w-full max-h-72 overflow-y-auto rounded-md border bg-popover text-popover-foreground shadow-md">
          {loading && (
            <div className="flex items-center gap-2 px-3 py-2 text-xs text-muted-foreground">
              <Loader2 className="h-3 w-3 animate-spin" /> Searching…
            </div>
          )}
          {results.map((r) => (
            <button
              type="button"
              key={r.id}
              onClick={() => {
                onSelect(r);
                setOpen(false);
              }}
              className="flex w-full items-start gap-2 px-3 py-2 text-left text-sm hover:bg-accent border-b last:border-b-0"
            >
              {r.customer_type === "business" ? (
                <Building2 className="h-4 w-4 mt-0.5 text-primary shrink-0" />
              ) : (
                <User className="h-4 w-4 mt-0.5 text-muted-foreground shrink-0" />
              )}
              <div className="min-w-0 flex-1">
                <div className="font-medium truncate">
                  {r.customer_name}
                  {r.company_name && r.company_name !== r.customer_name && (
                    <span className="text-muted-foreground"> · {r.company_name}</span>
                  )}
                </div>
                <div className="text-xs text-muted-foreground truncate">
                  {[r.email, r.mobile_number, r.gst_number].filter(Boolean).join(" · ")}
                </div>
              </div>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
