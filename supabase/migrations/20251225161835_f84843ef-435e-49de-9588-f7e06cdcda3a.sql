
-- Add min_quantity to raw_materials table
ALTER TABLE public.raw_materials ADD COLUMN IF NOT EXISTS min_quantity numeric NOT NULL DEFAULT 10;

-- Create raw_material_usage table for consumption tracking
CREATE TABLE public.raw_material_usage (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  raw_material_id UUID NOT NULL REFERENCES public.raw_materials(id) ON DELETE CASCADE,
  quantity_used numeric NOT NULL,
  usage_type text NOT NULL DEFAULT 'manual_adjustment',
  reference_id text,
  reference_note text,
  admin_id UUID NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create raw_material_ledger table for audit trail
CREATE TABLE public.raw_material_ledger (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  raw_material_id UUID NOT NULL REFERENCES public.raw_materials(id) ON DELETE CASCADE,
  action_type text NOT NULL,
  quantity_change numeric NOT NULL,
  previous_quantity numeric NOT NULL,
  new_quantity numeric NOT NULL,
  admin_id UUID NOT NULL,
  note text,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create indexes for better query performance
CREATE INDEX idx_raw_material_usage_material_id ON public.raw_material_usage(raw_material_id);
CREATE INDEX idx_raw_material_usage_created_at ON public.raw_material_usage(created_at DESC);
CREATE INDEX idx_raw_material_ledger_material_id ON public.raw_material_ledger(raw_material_id);
CREATE INDEX idx_raw_material_ledger_created_at ON public.raw_material_ledger(created_at DESC);
CREATE INDEX idx_raw_material_ledger_action_type ON public.raw_material_ledger(action_type);

-- Enable RLS on new tables
ALTER TABLE public.raw_material_usage ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.raw_material_ledger ENABLE ROW LEVEL SECURITY;

-- RLS policies for raw_material_usage
CREATE POLICY "Admins can view all usage records"
ON public.raw_material_usage
FOR SELECT
USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can create usage records"
ON public.raw_material_usage
FOR INSERT
WITH CHECK (has_role(auth.uid(), 'admin'::app_role) AND auth.uid() = admin_id);

CREATE POLICY "Admins can delete usage records"
ON public.raw_material_usage
FOR DELETE
USING (has_role(auth.uid(), 'admin'::app_role));

-- RLS policies for raw_material_ledger (read-only for admins, insert only via triggers/functions)
CREATE POLICY "Admins can view all ledger entries"
ON public.raw_material_ledger
FOR SELECT
USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can create ledger entries"
ON public.raw_material_ledger
FOR INSERT
WITH CHECK (has_role(auth.uid(), 'admin'::app_role) AND auth.uid() = admin_id);

-- Function to automatically log raw material changes
CREATE OR REPLACE FUNCTION public.log_raw_material_change()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF TG_OP = 'UPDATE' AND OLD.quantity IS DISTINCT FROM NEW.quantity THEN
    INSERT INTO public.raw_material_ledger (
      raw_material_id,
      action_type,
      quantity_change,
      previous_quantity,
      new_quantity,
      admin_id,
      note
    ) VALUES (
      NEW.id,
      CASE 
        WHEN NEW.quantity > OLD.quantity THEN 'add'
        WHEN NEW.quantity < OLD.quantity THEN 'adjust'
        ELSE 'update'
      END,
      NEW.quantity - OLD.quantity,
      OLD.quantity,
      NEW.quantity,
      auth.uid(),
      'Stock quantity updated'
    );
  END IF;
  RETURN NEW;
END;
$$;

-- Create trigger for automatic logging
CREATE TRIGGER trigger_log_raw_material_change
AFTER UPDATE ON public.raw_materials
FOR EACH ROW
EXECUTE FUNCTION public.log_raw_material_change();
