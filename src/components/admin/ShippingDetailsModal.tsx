import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Truck, Calendar, Link as LinkIcon, FileText } from "lucide-react";

interface ShippingDetails {
  courier_name: string;
  tracking_id: string;
  tracking_url: string;
  expected_delivery_date: string;
  delivery_notes: string;
}

interface ShippingDetailsModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onConfirm: (details: ShippingDetails) => void;
  initialData?: Partial<ShippingDetails>;
  isLoading?: boolean;
}

export const ShippingDetailsModal = ({
  open,
  onOpenChange,
  onConfirm,
  initialData,
  isLoading,
}: ShippingDetailsModalProps) => {
  const [formData, setFormData] = useState<ShippingDetails>({
    courier_name: initialData?.courier_name || "",
    tracking_id: initialData?.tracking_id || "",
    tracking_url: initialData?.tracking_url || "",
    expected_delivery_date: initialData?.expected_delivery_date || "",
    delivery_notes: initialData?.delivery_notes || "",
  });
  const [errors, setErrors] = useState<Record<string, string>>({});

  const validate = () => {
    const newErrors: Record<string, string> = {};
    
    if (!formData.courier_name.trim()) {
      newErrors.courier_name = "Courier service name is required";
    }
    if (!formData.tracking_id.trim()) {
      newErrors.tracking_id = "Tracking ID / AWB number is required";
    }
    if (!formData.expected_delivery_date) {
      newErrors.expected_delivery_date = "Expected delivery date is required";
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = () => {
    if (validate()) {
      onConfirm(formData);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Truck className="h-5 w-5 text-primary" />
            Shipping Details
          </DialogTitle>
        </DialogHeader>
        
        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="courier_name" className="flex items-center gap-1">
              Courier Service Name <span className="text-destructive">*</span>
            </Label>
            <Input
              id="courier_name"
              placeholder="e.g., BlueDart, DTDC, Delhivery"
              value={formData.courier_name}
              onChange={(e) => setFormData({ ...formData, courier_name: e.target.value })}
              className={errors.courier_name ? "border-destructive" : ""}
            />
            {errors.courier_name && (
              <p className="text-sm text-destructive">{errors.courier_name}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="tracking_id" className="flex items-center gap-1">
              <FileText className="h-4 w-4" />
              Tracking ID / AWB Number <span className="text-destructive">*</span>
            </Label>
            <Input
              id="tracking_id"
              placeholder="Enter tracking ID"
              value={formData.tracking_id}
              onChange={(e) => setFormData({ ...formData, tracking_id: e.target.value })}
              className={errors.tracking_id ? "border-destructive" : ""}
            />
            {errors.tracking_id && (
              <p className="text-sm text-destructive">{errors.tracking_id}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="expected_delivery_date" className="flex items-center gap-1">
              <Calendar className="h-4 w-4" />
              Expected Delivery Date <span className="text-destructive">*</span>
            </Label>
            <Input
              id="expected_delivery_date"
              type="date"
              value={formData.expected_delivery_date}
              onChange={(e) => setFormData({ ...formData, expected_delivery_date: e.target.value })}
              className={errors.expected_delivery_date ? "border-destructive" : ""}
              min={new Date().toISOString().split('T')[0]}
            />
            {errors.expected_delivery_date && (
              <p className="text-sm text-destructive">{errors.expected_delivery_date}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="tracking_url" className="flex items-center gap-1">
              <LinkIcon className="h-4 w-4" />
              Tracking URL (Optional)
            </Label>
            <Input
              id="tracking_url"
              type="url"
              placeholder="https://..."
              value={formData.tracking_url}
              onChange={(e) => setFormData({ ...formData, tracking_url: e.target.value })}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="delivery_notes">Delivery Notes (Optional)</Label>
            <Textarea
              id="delivery_notes"
              placeholder="Any special instructions..."
              value={formData.delivery_notes}
              onChange={(e) => setFormData({ ...formData, delivery_notes: e.target.value })}
              rows={2}
            />
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={isLoading}>
            Cancel
          </Button>
          <Button onClick={handleSubmit} disabled={isLoading}>
            {isLoading ? "Saving..." : "Confirm & Ship"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
