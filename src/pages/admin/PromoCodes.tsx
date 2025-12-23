import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Switch } from "@/components/ui/switch";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";
import { Plus, Ticket, Trash2, Pencil, Copy } from "lucide-react";
import { format } from "date-fns";

interface PromoCode {
  id: string;
  code: string;
  discount_type: "fixed" | "percentage";
  discount_value: number;
  max_uses: number;
  used_count: number;
  min_order_amount: number | null;
  max_discount_amount: number | null;
  is_active: boolean;
  expires_at: string | null;
  created_at: string;
}

const PromoCodes = () => {
  const queryClient = useQueryClient();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingCode, setEditingCode] = useState<PromoCode | null>(null);
  
  // Form state
  const [code, setCode] = useState("");
  const [discountType, setDiscountType] = useState<"fixed" | "percentage">("fixed");
  const [discountValue, setDiscountValue] = useState("");
  const [maxUses, setMaxUses] = useState("");
  const [minOrderAmount, setMinOrderAmount] = useState("");
  const [maxDiscountAmount, setMaxDiscountAmount] = useState("");
  const [expiresAt, setExpiresAt] = useState("");
  const [isActive, setIsActive] = useState(true);

  const { data: promoCodes, isLoading } = useQuery({
    queryKey: ["admin-promo-codes"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("promo_codes")
        .select("*")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data as PromoCode[];
    },
  });

  const createMutation = useMutation({
    mutationFn: async (newCode: {
      code: string;
      discount_type: string;
      discount_value: number;
      max_uses: number;
      min_order_amount: number;
      max_discount_amount: number | null;
      expires_at: string | null;
      is_active: boolean;
    }) => {
      const { error } = await supabase.from("promo_codes").insert([newCode]);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-promo-codes"] });
      toast.success("Promo code created successfully");
      resetForm();
      setIsDialogOpen(false);
    },
    onError: (error: any) => {
      if (error.message?.includes("duplicate")) {
        toast.error("A promo code with this code already exists");
      } else {
        toast.error("Failed to create promo code");
      }
    },
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, ...updates }: Partial<PromoCode> & { id: string }) => {
      const { error } = await supabase
        .from("promo_codes")
        .update(updates)
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-promo-codes"] });
      toast.success("Promo code updated successfully");
      resetForm();
      setIsDialogOpen(false);
      setEditingCode(null);
    },
    onError: () => toast.error("Failed to update promo code"),
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("promo_codes").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-promo-codes"] });
      toast.success("Promo code deleted successfully");
    },
    onError: () => toast.error("Failed to delete promo code"),
  });

  const toggleActiveMutation = useMutation({
    mutationFn: async ({ id, is_active }: { id: string; is_active: boolean }) => {
      const { error } = await supabase
        .from("promo_codes")
        .update({ is_active })
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-promo-codes"] });
      toast.success("Promo code status updated");
    },
    onError: () => toast.error("Failed to update status"),
  });

  const resetForm = () => {
    setCode("");
    setDiscountType("fixed");
    setDiscountValue("");
    setMaxUses("");
    setMinOrderAmount("");
    setMaxDiscountAmount("");
    setExpiresAt("");
    setIsActive(true);
    setEditingCode(null);
  };

  const openEditDialog = (promoCode: PromoCode) => {
    setEditingCode(promoCode);
    setCode(promoCode.code);
    setDiscountType(promoCode.discount_type);
    setDiscountValue(promoCode.discount_value.toString());
    setMaxUses(promoCode.max_uses.toString());
    setMinOrderAmount(promoCode.min_order_amount?.toString() || "");
    setMaxDiscountAmount(promoCode.max_discount_amount?.toString() || "");
    setExpiresAt(promoCode.expires_at ? promoCode.expires_at.split("T")[0] : "");
    setIsActive(promoCode.is_active);
    setIsDialogOpen(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!code.trim() || !discountValue || !maxUses) {
      toast.error("Please fill in all required fields");
      return;
    }

    const payload = {
      code: code.trim().toUpperCase(),
      discount_type: discountType,
      discount_value: parseFloat(discountValue),
      max_uses: parseInt(maxUses),
      min_order_amount: minOrderAmount ? parseFloat(minOrderAmount) : 0,
      max_discount_amount: maxDiscountAmount ? parseFloat(maxDiscountAmount) : null,
      expires_at: expiresAt ? new Date(expiresAt).toISOString() : null,
      is_active: isActive,
    };

    if (editingCode) {
      updateMutation.mutate({ id: editingCode.id, ...payload });
    } else {
      createMutation.mutate(payload);
    }
  };

  const copyCode = (codeText: string) => {
    navigator.clipboard.writeText(codeText);
    toast.success("Code copied to clipboard");
  };

  const generateRandomCode = () => {
    const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
    let result = "";
    for (let i = 0; i < 8; i++) {
      result += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    setCode(result);
  };

  const isExpired = (expiresAt: string | null) => {
    if (!expiresAt) return false;
    return new Date(expiresAt) < new Date();
  };

  const isExhausted = (promoCode: PromoCode) => {
    return promoCode.used_count >= promoCode.max_uses;
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Promo Codes</h1>
          <p className="text-muted-foreground mt-1">Create and manage discount codes</p>
        </div>
        <Dialog open={isDialogOpen} onOpenChange={(open) => {
          setIsDialogOpen(open);
          if (!open) resetForm();
        }}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="w-4 h-4 mr-2" />
              Create Code
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-lg">
            <DialogHeader>
              <DialogTitle>{editingCode ? "Edit Promo Code" : "Create Promo Code"}</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <Label htmlFor="code">Promo Code *</Label>
                <div className="flex gap-2 mt-1">
                  <Input
                    id="code"
                    value={code}
                    onChange={(e) => setCode(e.target.value.toUpperCase())}
                    placeholder="e.g., SAVE20"
                    className="flex-1"
                  />
                  <Button type="button" variant="outline" onClick={generateRandomCode}>
                    Generate
                  </Button>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="discountType">Discount Type *</Label>
                  <Select value={discountType} onValueChange={(v) => setDiscountType(v as "fixed" | "percentage")}>
                    <SelectTrigger className="mt-1">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="fixed">Fixed Amount (₹)</SelectItem>
                      <SelectItem value="percentage">Percentage (%)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="discountValue">
                    Discount Value * {discountType === "percentage" ? "(%)" : "(₹)"}
                  </Label>
                  <Input
                    id="discountValue"
                    type="number"
                    min="0"
                    max={discountType === "percentage" ? 100 : undefined}
                    step="0.01"
                    value={discountValue}
                    onChange={(e) => setDiscountValue(e.target.value)}
                    placeholder={discountType === "percentage" ? "e.g., 20" : "e.g., 100"}
                    className="mt-1"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="maxUses">Max Uses *</Label>
                  <Input
                    id="maxUses"
                    type="number"
                    min="1"
                    value={maxUses}
                    onChange={(e) => setMaxUses(e.target.value)}
                    placeholder="e.g., 100"
                    className="mt-1"
                  />
                </div>
                <div>
                  <Label htmlFor="minOrderAmount">Min Order Amount (₹)</Label>
                  <Input
                    id="minOrderAmount"
                    type="number"
                    min="0"
                    step="0.01"
                    value={minOrderAmount}
                    onChange={(e) => setMinOrderAmount(e.target.value)}
                    placeholder="e.g., 500"
                    className="mt-1"
                  />
                </div>
              </div>

              {discountType === "percentage" && (
                <div>
                  <Label htmlFor="maxDiscountAmount">Max Discount Amount (₹)</Label>
                  <Input
                    id="maxDiscountAmount"
                    type="number"
                    min="0"
                    step="0.01"
                    value={maxDiscountAmount}
                    onChange={(e) => setMaxDiscountAmount(e.target.value)}
                    placeholder="e.g., 200 (optional cap)"
                    className="mt-1"
                  />
                  <p className="text-xs text-muted-foreground mt-1">
                    Optional: Limit maximum discount for percentage codes
                  </p>
                </div>
              )}

              <div>
                <Label htmlFor="expiresAt">Expiry Date</Label>
                <Input
                  id="expiresAt"
                  type="date"
                  value={expiresAt}
                  onChange={(e) => setExpiresAt(e.target.value)}
                  className="mt-1"
                  min={new Date().toISOString().split("T")[0]}
                />
              </div>

              <div className="flex items-center justify-between">
                <Label htmlFor="isActive">Active</Label>
                <Switch
                  id="isActive"
                  checked={isActive}
                  onCheckedChange={setIsActive}
                />
              </div>

              <Button
                type="submit"
                className="w-full"
                disabled={createMutation.isPending || updateMutation.isPending}
              >
                {editingCode ? "Update Promo Code" : "Create Promo Code"}
              </Button>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Ticket className="w-5 h-5 text-primary" />
            All Promo Codes
          </CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="space-y-3">
              {[1, 2, 3].map((i) => (
                <Skeleton key={i} className="h-16" />
              ))}
            </div>
          ) : promoCodes && promoCodes.length > 0 ? (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Code</TableHead>
                    <TableHead>Discount</TableHead>
                    <TableHead>Usage</TableHead>
                    <TableHead>Min Order</TableHead>
                    <TableHead>Expires</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {promoCodes.map((promo) => (
                    <TableRow key={promo.id}>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <code className="bg-muted px-2 py-1 rounded text-sm font-mono font-bold">
                            {promo.code}
                          </code>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-7 w-7"
                            onClick={() => copyCode(promo.code)}
                          >
                            <Copy className="w-3.5 h-3.5" />
                          </Button>
                        </div>
                      </TableCell>
                      <TableCell>
                        <span className="font-medium text-primary">
                          {promo.discount_type === "percentage"
                            ? `${promo.discount_value}%`
                            : `₹${promo.discount_value}`}
                        </span>
                        {promo.discount_type === "percentage" && promo.max_discount_amount && (
                          <span className="text-xs text-muted-foreground block">
                            Max: ₹{promo.max_discount_amount}
                          </span>
                        )}
                      </TableCell>
                      <TableCell>
                        <span className={isExhausted(promo) ? "text-destructive" : ""}>
                          {promo.used_count} / {promo.max_uses}
                        </span>
                      </TableCell>
                      <TableCell>
                        {promo.min_order_amount ? `₹${promo.min_order_amount}` : "None"}
                      </TableCell>
                      <TableCell>
                        {promo.expires_at ? (
                          <span className={isExpired(promo.expires_at) ? "text-destructive" : ""}>
                            {format(new Date(promo.expires_at), "dd MMM yyyy")}
                          </span>
                        ) : (
                          <span className="text-muted-foreground">Never</span>
                        )}
                      </TableCell>
                      <TableCell>
                        {isExpired(promo.expires_at) ? (
                          <Badge variant="destructive">Expired</Badge>
                        ) : isExhausted(promo) ? (
                          <Badge variant="secondary">Exhausted</Badge>
                        ) : promo.is_active ? (
                          <Badge className="bg-green-500/10 text-green-600 hover:bg-green-500/20">
                            Active
                          </Badge>
                        ) : (
                          <Badge variant="secondary">Inactive</Badge>
                        )}
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end gap-1">
                          <Switch
                            checked={promo.is_active}
                            onCheckedChange={(checked) =>
                              toggleActiveMutation.mutate({ id: promo.id, is_active: checked })
                            }
                            disabled={toggleActiveMutation.isPending}
                          />
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => openEditDialog(promo)}
                          >
                            <Pencil className="w-4 h-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="text-destructive hover:text-destructive"
                            onClick={() => {
                              if (confirm("Are you sure you want to delete this promo code?")) {
                                deleteMutation.mutate(promo.id);
                              }
                            }}
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          ) : (
            <div className="text-center py-12">
              <Ticket className="w-16 h-16 text-muted-foreground/30 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-foreground mb-2">No promo codes yet</h3>
              <p className="text-muted-foreground mb-4">
                Create your first promo code to offer discounts to customers.
              </p>
              <Button onClick={() => setIsDialogOpen(true)}>
                <Plus className="w-4 h-4 mr-2" />
                Create First Code
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default PromoCodes;
