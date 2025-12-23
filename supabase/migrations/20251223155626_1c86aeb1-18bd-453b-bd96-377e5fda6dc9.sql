-- Add cost_per_unit column to raw_materials
ALTER TABLE public.raw_materials ADD COLUMN cost_per_unit NUMERIC DEFAULT 0;