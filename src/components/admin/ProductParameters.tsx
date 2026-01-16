import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { Plus, Trash2, GripVertical, ClipboardList } from "lucide-react";

interface Parameter {
  id?: string;
  parameter_name: string;
  parameter_value: string;
  display_order: number;
  isNew?: boolean;
}

interface ProductParametersProps {
  productId: string;
  onClose?: () => void;
}

export function ProductParameters({ productId, onClose }: ProductParametersProps) {
  const [parameters, setParameters] = useState<Parameter[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    fetchParameters();
  }, [productId]);

  const fetchParameters = async () => {
    const { data, error } = await supabase
      .from("product_parameters")
      .select("*")
      .eq("product_id", productId)
      .order("display_order", { ascending: true });

    if (error) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
      return;
    }

    setParameters(data || []);
    setIsLoading(false);
  };

  const addParameter = () => {
    const maxOrder = parameters.length > 0 
      ? Math.max(...parameters.map(p => p.display_order)) 
      : -1;
    
    setParameters([
      ...parameters,
      {
        parameter_name: "",
        parameter_value: "",
        display_order: maxOrder + 1,
        isNew: true,
      },
    ]);
  };

  const updateParameter = (index: number, field: 'parameter_name' | 'parameter_value', value: string) => {
    const updated = [...parameters];
    updated[index] = { ...updated[index], [field]: value };
    setParameters(updated);
  };

  const removeParameter = async (index: number) => {
    const param = parameters[index];
    
    if (param.id) {
      const { error } = await supabase
        .from("product_parameters")
        .delete()
        .eq("id", param.id);
      
      if (error) {
        toast({ title: "Error", description: error.message, variant: "destructive" });
        return;
      }
    }

    setParameters(parameters.filter((_, i) => i !== index));
    toast({ title: "Parameter removed" });
  };

  const moveParameter = (index: number, direction: 'up' | 'down') => {
    const newIndex = direction === 'up' ? index - 1 : index + 1;
    if (newIndex < 0 || newIndex >= parameters.length) return;

    const updated = [...parameters];
    const temp = updated[index].display_order;
    updated[index].display_order = updated[newIndex].display_order;
    updated[newIndex].display_order = temp;
    
    [updated[index], updated[newIndex]] = [updated[newIndex], updated[index]];
    setParameters(updated);
  };

  const saveParameters = async () => {
    // Validate
    const hasEmpty = parameters.some(p => !p.parameter_name.trim() || !p.parameter_value.trim());
    if (hasEmpty) {
      toast({ title: "Error", description: "Please fill in all parameter names and values", variant: "destructive" });
      return;
    }

    setIsSaving(true);

    try {
      // Separate new and existing parameters
      const newParams = parameters.filter(p => p.isNew);
      const existingParams = parameters.filter(p => !p.isNew);

      // Update existing parameters
      for (const param of existingParams) {
        const { error } = await supabase
          .from("product_parameters")
          .update({
            parameter_name: param.parameter_name,
            parameter_value: param.parameter_value,
            display_order: param.display_order,
          })
          .eq("id", param.id!);
        
        if (error) throw error;
      }

      // Insert new parameters
      if (newParams.length > 0) {
        const { error } = await supabase
          .from("product_parameters")
          .insert(newParams.map(p => ({
            product_id: productId,
            parameter_name: p.parameter_name,
            parameter_value: p.parameter_value,
            display_order: p.display_order,
          })));
        
        if (error) throw error;
      }

      toast({ title: "Parameters saved successfully" });
      fetchParameters(); // Refresh to get IDs for new parameters
    } catch (error: any) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return <div className="py-8 text-center text-muted-foreground">Loading parameters...</div>;
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <ClipboardList className="h-5 w-5 text-primary" />
          <Label className="text-base font-semibold">Product Specifications</Label>
        </div>
        <Button type="button" variant="outline" size="sm" onClick={addParameter}>
          <Plus className="h-4 w-4 mr-2" />
          Add Parameter
        </Button>
      </div>

      <p className="text-sm text-muted-foreground">
        Add custom specifications like Warranty, Material, Color, Certification, etc.
      </p>

      {parameters.length === 0 ? (
        <div className="border-2 border-dashed border-border rounded-lg p-6 text-center">
          <ClipboardList className="h-8 w-8 text-muted-foreground mx-auto mb-2" />
          <p className="text-muted-foreground text-sm">No specifications added yet</p>
          <Button type="button" variant="outline" size="sm" className="mt-3" onClick={addParameter}>
            <Plus className="h-4 w-4 mr-2" />
            Add First Parameter
          </Button>
        </div>
      ) : (
        <div className="space-y-3">
          {parameters.map((param, index) => (
            <div 
              key={param.id || `new-${index}`} 
              className="flex items-center gap-3 p-3 border rounded-lg bg-muted/30"
            >
              <div className="flex flex-col gap-1">
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="h-6 w-6"
                  onClick={() => moveParameter(index, 'up')}
                  disabled={index === 0}
                >
                  ↑
                </Button>
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="h-6 w-6"
                  onClick={() => moveParameter(index, 'down')}
                  disabled={index === parameters.length - 1}
                >
                  ↓
                </Button>
              </div>
              
              <div className="flex-1 grid grid-cols-2 gap-3">
                <Input
                  placeholder="Parameter name (e.g., Warranty)"
                  value={param.parameter_name}
                  onChange={(e) => updateParameter(index, 'parameter_name', e.target.value)}
                />
                <Input
                  placeholder="Value (e.g., 2 Years)"
                  value={param.parameter_value}
                  onChange={(e) => updateParameter(index, 'parameter_value', e.target.value)}
                />
              </div>
              
              <Button
                type="button"
                variant="ghost"
                size="icon"
                className="text-destructive hover:text-destructive"
                onClick={() => removeParameter(index)}
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
          ))}
        </div>
      )}

      {parameters.length > 0 && (
        <Button 
          type="button" 
          onClick={saveParameters} 
          disabled={isSaving}
          className="w-full"
        >
          {isSaving ? "Saving..." : "Save Parameters"}
        </Button>
      )}
    </div>
  );
}
