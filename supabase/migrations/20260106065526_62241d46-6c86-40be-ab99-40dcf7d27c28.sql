-- Create drone_configurations table
CREATE TABLE public.drone_configurations (
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
  
  -- Drone Variant Classification
  drone_category TEXT NOT NULL,
  
  -- FPV Series (if applicable)
  fpv_model TEXT,
  
  -- Surveillance Series (if applicable)
  surv_model TEXT,
  
  -- Industrial Series (if applicable)
  ind_model TEXT,
  
  -- Custom Mission (if applicable)
  custom_frame TEXT,
  custom_payload_camera BOOLEAN DEFAULT false,
  custom_payload_sensor BOOLEAN DEFAULT false,
  custom_payload_communication BOOLEAN DEFAULT false,
  custom_flight_time TEXT,
  custom_range TEXT,
  custom_control TEXT,
  custom_encryption BOOLEAN DEFAULT false,
  
  -- Customization Matrix
  custom_frame_size_type BOOLEAN DEFAULT false,
  custom_endurance_payload BOOLEAN DEFAULT false,
  custom_camera_type BOOLEAN DEFAULT false,
  custom_communication_range BOOLEAN DEFAULT false,
  custom_encryption_level BOOLEAN DEFAULT false,
  custom_environmental_resistance BOOLEAN DEFAULT false,
  custom_autonomy_level BOOLEAN DEFAULT false,
  
  -- Admin Fields
  status TEXT NOT NULL DEFAULT 'new',
  admin_notes TEXT
);

-- Enable Row Level Security
ALTER TABLE public.drone_configurations ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Anyone can submit drone configuration"
ON public.drone_configurations
FOR INSERT
WITH CHECK (true);

CREATE POLICY "Admins can view all drone configurations"
ON public.drone_configurations
FOR SELECT
USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can update drone configurations"
ON public.drone_configurations
FOR UPDATE
USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can delete drone configurations"
ON public.drone_configurations
FOR DELETE
USING (has_role(auth.uid(), 'admin'::app_role));

-- Create trigger for updated_at
CREATE TRIGGER update_drone_configurations_updated_at
BEFORE UPDATE ON public.drone_configurations
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();