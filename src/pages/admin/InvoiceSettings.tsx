import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Separator } from "@/components/ui/separator";
import { toast } from "sonner";
import { Save, Building2, Percent, FileText, Settings2 } from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

const INDIAN_STATES = [
  "Andhra Pradesh", "Arunachal Pradesh", "Assam", "Bihar", "Chhattisgarh",
  "Goa", "Gujarat", "Haryana", "Himachal Pradesh", "Jharkhand", "Karnataka",
  "Kerala", "Madhya Pradesh", "Maharashtra", "Manipur", "Meghalaya", "Mizoram",
  "Nagaland", "Odisha", "Punjab", "Rajasthan", "Sikkim", "Tamil Nadu",
  "Telangana", "Tripura", "Uttar Pradesh", "Uttarakhand", "West Bengal",
  "Andaman and Nicobar Islands", "Chandigarh", "Dadra and Nagar Haveli and Daman and Diu",
  "Delhi", "Jammu and Kashmir", "Ladakh", "Lakshadweep", "Puducherry"
];

interface InvoiceSettings {
  id: string;
  business_name: string;
  business_address: string;
  business_city: string;
  business_state: string;
  business_pincode: string;
  business_country: string;
  business_phone: string;
  business_email: string;
  business_gstin: string;
  business_logo_url: string | null;
  platform_fee_percentage: number;
  platform_fee_taxable: boolean;
  invoice_prefix: string;
  terms_and_conditions: string;
  default_gst_rate: number;
}

export default function InvoiceSettings() {
  const [settings, setSettings] = useState<InvoiceSettings | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    fetchSettings();
  }, []);

  const fetchSettings = async () => {
    const { data, error } = await supabase
      .from("invoice_settings")
      .select("*")
      .limit(1)
      .single();

    if (error && error.code !== "PGRST116") {
      toast.error("Failed to load settings");
      console.error(error);
    }

    if (data) {
      setSettings(data as InvoiceSettings);
    } else {
      // Create default settings if none exist
      const defaultSettings: Omit<InvoiceSettings, 'id'> = {
        business_name: "Decouverts",
        business_address: "",
        business_city: "",
        business_state: "Maharashtra",
        business_pincode: "",
        business_country: "India",
        business_phone: "",
        business_email: "",
        business_gstin: "",
        business_logo_url: null,
        platform_fee_percentage: 2,
        platform_fee_taxable: false,
        invoice_prefix: "INV",
        terms_and_conditions: "Goods once sold are non-refundable. Payment due within 30 days. Warranty as per product terms.",
        default_gst_rate: 18,
      };
      
      const { data: newSettings, error: insertError } = await supabase
        .from("invoice_settings")
        .insert(defaultSettings)
        .select()
        .single();

      if (!insertError && newSettings) {
        setSettings(newSettings as InvoiceSettings);
      }
    }

    setIsLoading(false);
  };

  const handleSave = async () => {
    if (!settings) return;

    setIsSaving(true);

    const { error } = await supabase
      .from("invoice_settings")
      .update({
        business_name: settings.business_name,
        business_address: settings.business_address,
        business_city: settings.business_city,
        business_state: settings.business_state,
        business_pincode: settings.business_pincode,
        business_country: settings.business_country,
        business_phone: settings.business_phone,
        business_email: settings.business_email,
        business_gstin: settings.business_gstin,
        business_logo_url: settings.business_logo_url,
        platform_fee_percentage: settings.platform_fee_percentage,
        platform_fee_taxable: settings.platform_fee_taxable,
        invoice_prefix: settings.invoice_prefix,
        terms_and_conditions: settings.terms_and_conditions,
        default_gst_rate: settings.default_gst_rate,
      })
      .eq("id", settings.id);

    setIsSaving(false);

    if (error) {
      toast.error("Failed to save settings");
      console.error(error);
    } else {
      toast.success("Invoice settings saved successfully");
    }
  };

  const updateField = (field: keyof InvoiceSettings, value: any) => {
    if (settings) {
      setSettings({ ...settings, [field]: value });
    }
  };

  if (isLoading) {
    return (
      <div className="space-y-6 animate-fade-in">
        <div className="h-8 w-48 bg-muted animate-pulse rounded" />
        <div className="grid gap-6">
          <div className="h-64 bg-muted animate-pulse rounded-lg" />
          <div className="h-48 bg-muted animate-pulse rounded-lg" />
        </div>
      </div>
    );
  }

  if (!settings) {
    return (
      <div className="text-center py-12">
        <p className="text-muted-foreground">Failed to load settings</p>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Invoice Settings</h1>
          <p className="text-muted-foreground">Configure GST-compliant invoice generation</p>
        </div>
        <Button onClick={handleSave} disabled={isSaving}>
          <Save className="mr-2 h-4 w-4" />
          {isSaving ? "Saving..." : "Save Settings"}
        </Button>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Business Details */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Building2 className="h-5 w-5 text-primary" />
              Business Details
            </CardTitle>
            <CardDescription>Your company information for invoices</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="sm:col-span-2">
                <Label>Business Name</Label>
                <Input
                  value={settings.business_name}
                  onChange={(e) => updateField("business_name", e.target.value)}
                  placeholder="Your business name"
                />
              </div>
              <div className="sm:col-span-2">
                <Label>Address</Label>
                <Textarea
                  value={settings.business_address}
                  onChange={(e) => updateField("business_address", e.target.value)}
                  placeholder="Street address"
                  rows={2}
                />
              </div>
              <div>
                <Label>City</Label>
                <Input
                  value={settings.business_city}
                  onChange={(e) => updateField("business_city", e.target.value)}
                  placeholder="City"
                />
              </div>
              <div>
                <Label>State</Label>
                <Select
                  value={settings.business_state}
                  onValueChange={(value) => updateField("business_state", value)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select state" />
                  </SelectTrigger>
                  <SelectContent>
                    {INDIAN_STATES.map((state) => (
                      <SelectItem key={state} value={state}>
                        {state}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Pincode</Label>
                <Input
                  value={settings.business_pincode}
                  onChange={(e) => updateField("business_pincode", e.target.value)}
                  placeholder="Pincode"
                />
              </div>
              <div>
                <Label>Country</Label>
                <Input
                  value={settings.business_country}
                  onChange={(e) => updateField("business_country", e.target.value)}
                  placeholder="Country"
                />
              </div>
              <div>
                <Label>Phone</Label>
                <Input
                  value={settings.business_phone}
                  onChange={(e) => updateField("business_phone", e.target.value)}
                  placeholder="+91 98765 43210"
                />
              </div>
              <div>
                <Label>Email</Label>
                <Input
                  type="email"
                  value={settings.business_email}
                  onChange={(e) => updateField("business_email", e.target.value)}
                  placeholder="business@example.com"
                />
              </div>
              <div className="sm:col-span-2">
                <Label>GSTIN</Label>
                <Input
                  value={settings.business_gstin}
                  onChange={(e) => updateField("business_gstin", e.target.value.toUpperCase())}
                  placeholder="22AAAAA0000A1Z5"
                  className="font-mono"
                />
                <p className="text-xs text-muted-foreground mt-1">
                  15-character GST Identification Number
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* GST & Fee Settings */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Percent className="h-5 w-5 text-primary" />
              GST & Platform Fee
            </CardTitle>
            <CardDescription>Configure tax rates and platform charges</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div>
              <Label>Default GST Rate (%)</Label>
              <Select
                value={String(settings.default_gst_rate)}
                onValueChange={(value) => updateField("default_gst_rate", Number(value))}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="0">0% (Exempt)</SelectItem>
                  <SelectItem value="5">5%</SelectItem>
                  <SelectItem value="12">12%</SelectItem>
                  <SelectItem value="18">18%</SelectItem>
                  <SelectItem value="28">28%</SelectItem>
                </SelectContent>
              </Select>
              <p className="text-xs text-muted-foreground mt-1">
                Applied to products without specific GST rate
              </p>
            </div>

            <Separator />

            <div>
              <Label>Platform Fee (%)</Label>
              <Input
                type="number"
                min="0"
                max="100"
                step="0.1"
                value={settings.platform_fee_percentage}
                onChange={(e) => updateField("platform_fee_percentage", Number(e.target.value))}
              />
              <p className="text-xs text-muted-foreground mt-1">
                Added to subtotal as "Platform Service Fee"
              </p>
            </div>

            <div className="flex items-center justify-between rounded-lg border p-4">
              <div className="space-y-0.5">
                <Label>Platform Fee Taxable</Label>
                <p className="text-xs text-muted-foreground">
                  Apply GST on platform fee
                </p>
              </div>
              <Switch
                checked={settings.platform_fee_taxable}
                onCheckedChange={(checked) => updateField("platform_fee_taxable", checked)}
              />
            </div>

            <div className="rounded-lg bg-muted/50 p-4 space-y-2">
              <p className="text-sm font-medium">GST Calculation Logic</p>
              <ul className="text-xs text-muted-foreground space-y-1">
                <li>• <strong>Same State:</strong> Split into CGST + SGST (each 50%)</li>
                <li>• <strong>Different State:</strong> Apply full IGST</li>
                <li>• State comparison based on seller vs buyer address</li>
              </ul>
            </div>
          </CardContent>
        </Card>

        {/* Invoice Format */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5 text-primary" />
              Invoice Format
            </CardTitle>
            <CardDescription>Customize invoice numbering and appearance</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label>Invoice Number Prefix</Label>
              <Input
                value={settings.invoice_prefix}
                onChange={(e) => updateField("invoice_prefix", e.target.value.toUpperCase())}
                placeholder="INV"
                maxLength={10}
              />
              <p className="text-xs text-muted-foreground mt-1">
                Example: {settings.invoice_prefix}-20260111-0001
              </p>
            </div>

            <div>
              <Label>Logo URL (Optional)</Label>
              <Input
                value={settings.business_logo_url || ""}
                onChange={(e) => updateField("business_logo_url", e.target.value || null)}
                placeholder="https://example.com/logo.png"
              />
            </div>
          </CardContent>
        </Card>

        {/* Terms & Conditions */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Settings2 className="h-5 w-5 text-primary" />
              Terms & Conditions
            </CardTitle>
            <CardDescription>Default terms shown on all invoices</CardDescription>
          </CardHeader>
          <CardContent>
            <Textarea
              value={settings.terms_and_conditions}
              onChange={(e) => updateField("terms_and_conditions", e.target.value)}
              placeholder="Enter terms and conditions..."
              rows={6}
            />
            <p className="text-xs text-muted-foreground mt-2">
              Separate multiple terms with periods. First 3 terms will be shown on PDF.
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
