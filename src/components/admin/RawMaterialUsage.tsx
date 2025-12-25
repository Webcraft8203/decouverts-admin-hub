import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { Minus, AlertCircle } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";

interface RawMaterial {
  id: string;
  name: string;
  quantity: number;
  unit: string;
}

interface RawMaterialUsageProps {
  materials: RawMaterial[];
  onUsageRecorded: () => void;
}

const usageTypes = [
  { value: "product_manufacturing", label: "Product Manufacturing" },
  { value: "order_fulfillment", label: "Order Fulfillment" },
  { value: "manual_adjustment", label: "Manual Adjustment" },
  { value: "damaged", label: "Damaged/Expired" },
  { value: "sample", label: "Sample/Testing" },
];

export function RawMaterialUsage({ materials, onUsageRecorded }: RawMaterialUsageProps) {
  const [open, setOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [selectedMaterial, setSelectedMaterial] = useState<string>("");
  const [quantityUsed, setQuantityUsed] = useState("");
  const [usageType, setUsageType] = useState("manual_adjustment");
  const [referenceNote, setReferenceNote] = useState("");
  const { toast } = useToast();
  const { user } = useAuth();

  const selectedMaterialData = materials.find((m) => m.id === selectedMaterial);
  const isQuantityExceeded =
    selectedMaterialData && parseFloat(quantityUsed) > selectedMaterialData.quantity;

  const resetForm = () => {
    setSelectedMaterial("");
    setQuantityUsed("");
    setUsageType("manual_adjustment");
    setReferenceNote("");
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedMaterial || !quantityUsed || !user) return;

    const qty = parseFloat(quantityUsed);
    if (qty <= 0) {
      toast({
        title: "Invalid quantity",
        description: "Quantity must be greater than 0",
        variant: "destructive",
      });
      return;
    }

    if (isQuantityExceeded) {
      toast({
        title: "Insufficient stock",
        description: `Available: ${selectedMaterialData?.quantity} ${selectedMaterialData?.unit}`,
        variant: "destructive",
      });
      return;
    }

    setIsSubmitting(true);
    try {
      // Record the usage
      const { error: usageError } = await supabase.from("raw_material_usage").insert({
        raw_material_id: selectedMaterial,
        quantity_used: qty,
        usage_type: usageType,
        reference_note: referenceNote || null,
        admin_id: user.id,
      });

      if (usageError) throw usageError;

      // Update raw material quantity and log to ledger
      const newQuantity = (selectedMaterialData?.quantity || 0) - qty;
      
      // Create ledger entry
      const { error: ledgerError } = await supabase.from("raw_material_ledger").insert({
        raw_material_id: selectedMaterial,
        action_type: "use",
        quantity_change: -qty,
        previous_quantity: selectedMaterialData?.quantity || 0,
        new_quantity: newQuantity,
        admin_id: user.id,
        note: `${usageTypes.find((t) => t.value === usageType)?.label}: ${referenceNote || "No note"}`,
      });

      if (ledgerError) throw ledgerError;

      // Update the material quantity
      const { error: updateError } = await supabase
        .from("raw_materials")
        .update({
          quantity: newQuantity,
          availability_status:
            newQuantity <= 0
              ? "out_of_stock"
              : newQuantity <= (selectedMaterialData as any)?.min_quantity
              ? "low_stock"
              : "available",
        })
        .eq("id", selectedMaterial);

      if (updateError) throw updateError;

      toast({
        title: "Usage recorded",
        description: `Deducted ${qty} ${selectedMaterialData?.unit} from ${selectedMaterialData?.name}`,
      });

      setOpen(false);
      resetForm();
      onUsageRecorded();
    } catch (error: any) {
      toast({
        title: "Error recording usage",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog
      open={open}
      onOpenChange={(o) => {
        setOpen(o);
        if (!o) resetForm();
      }}
    >
      <DialogTrigger asChild>
        <Button variant="outline">
          <Minus className="mr-2 h-4 w-4" />
          Record Usage
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Record Material Usage</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label>Select Material *</Label>
            <Select value={selectedMaterial} onValueChange={setSelectedMaterial}>
              <SelectTrigger>
                <SelectValue placeholder="Choose a material" />
              </SelectTrigger>
              <SelectContent>
                {materials.map((m) => (
                  <SelectItem key={m.id} value={m.id}>
                    {m.name} ({m.quantity} {m.unit} available)
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label>Quantity Used *</Label>
            <Input
              type="number"
              step="0.01"
              min="0.01"
              value={quantityUsed}
              onChange={(e) => setQuantityUsed(e.target.value)}
              placeholder="Enter quantity"
              required
            />
            {isQuantityExceeded && (
              <p className="text-destructive text-sm mt-1 flex items-center gap-1">
                <AlertCircle className="h-3 w-3" />
                Exceeds available stock ({selectedMaterialData?.quantity}{" "}
                {selectedMaterialData?.unit})
              </p>
            )}
          </div>

          <div>
            <Label>Usage Type *</Label>
            <Select value={usageType} onValueChange={setUsageType}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {usageTypes.map((type) => (
                  <SelectItem key={type.value} value={type.value}>
                    {type.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label>Reference / Note</Label>
            <Textarea
              value={referenceNote}
              onChange={(e) => setReferenceNote(e.target.value)}
              placeholder="e.g., Order #DP-20241225-0001 or Product batch #123"
              rows={2}
            />
          </div>

          <Button
            type="submit"
            className="w-full"
            disabled={isSubmitting || isQuantityExceeded || !selectedMaterial}
          >
            {isSubmitting ? "Recording..." : "Confirm Usage"}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}
