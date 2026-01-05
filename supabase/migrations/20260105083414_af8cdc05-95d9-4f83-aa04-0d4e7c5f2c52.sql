-- Create table for 3D printer configuration requests
CREATE TABLE public.printer_configurations (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  
  -- User Details
  full_name TEXT NOT NULL,
  phone_number TEXT NOT NULL,
  email TEXT NOT NULL,
  belongs_to_organization BOOLEAN NOT NULL DEFAULT false,
  organization_name TEXT,
  designation TEXT,
  organization_type TEXT,
  
  -- Base Model
  base_model TEXT NOT NULL,
  
  -- Motion System
  motion_tier TEXT NOT NULL,
  
  -- Extruder & Toolhead
  extruder_count TEXT NOT NULL,
  max_nozzle_temp TEXT NOT NULL,
  hardened_nozzle BOOLEAN DEFAULT false,
  high_flow_setup BOOLEAN DEFAULT false,
  pellet_extruder BOOLEAN DEFAULT false,
  
  -- AMS Configuration
  ams_type TEXT NOT NULL,
  supported_colors TEXT NOT NULL,
  ams_4_color BOOLEAN DEFAULT false,
  ams_8_color BOOLEAN DEFAULT false,
  multi_material BOOLEAN DEFAULT false,
  ams_filament_dryer BOOLEAN DEFAULT false,
  spool_capacity TEXT,
  
  -- Build Platform
  bed_surface TEXT NOT NULL,
  bed_heating TEXT NOT NULL,
  large_bed_reinforcement BOOLEAN DEFAULT false,
  
  -- Enclosure
  panel_material TEXT NOT NULL,
  active_chamber_heating BOOLEAN DEFAULT false,
  hepa_carbon_filter BOOLEAN DEFAULT false,
  noise_reduction_panels BOOLEAN DEFAULT false,
  
  -- Material Options
  tpu_flexible BOOLEAN DEFAULT false,
  nylon_pa BOOLEAN DEFAULT false,
  cf_gf_filled BOOLEAN DEFAULT false,
  engineering_polymers BOOLEAN DEFAULT false,
  
  -- Electronics
  electronics_tier TEXT NOT NULL,
  
  -- Accuracy
  accuracy_tier TEXT NOT NULL,
  
  -- Safety Options
  emergency_stop BOOLEAN DEFAULT false,
  
  -- Accessories
  filament_dryer BOOLEAN DEFAULT false,
  multi_chamber_dryer BOOLEAN DEFAULT false,
  printer_stand BOOLEAN DEFAULT false,
  tool_storage BOOLEAN DEFAULT false,
  spare_nozzle_kit BOOLEAN DEFAULT false,
  calibration_kit BOOLEAN DEFAULT false,
  
  -- Training & Support
  cad_slicer_training BOOLEAN DEFAULT false,
  advanced_material_training BOOLEAN DEFAULT false,
  amc_plan TEXT,
  
  -- Admin fields
  status TEXT NOT NULL DEFAULT 'new',
  admin_notes TEXT
);

-- Enable RLS
ALTER TABLE public.printer_configurations ENABLE ROW LEVEL SECURITY;

-- Policy for public insert (anyone can submit a configuration request)
CREATE POLICY "Anyone can submit printer configuration"
ON public.printer_configurations
FOR INSERT
WITH CHECK (true);

-- Policy for admins to view all configurations
CREATE POLICY "Admins can view all configurations"
ON public.printer_configurations
FOR SELECT
USING (has_role(auth.uid(), 'admin'::app_role));

-- Policy for admins to update configurations
CREATE POLICY "Admins can update configurations"
ON public.printer_configurations
FOR UPDATE
USING (has_role(auth.uid(), 'admin'::app_role));

-- Policy for admins to delete configurations
CREATE POLICY "Admins can delete configurations"
ON public.printer_configurations
FOR DELETE
USING (has_role(auth.uid(), 'admin'::app_role));

-- Add trigger for updated_at
CREATE TRIGGER update_printer_configurations_updated_at
BEFORE UPDATE ON public.printer_configurations
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();