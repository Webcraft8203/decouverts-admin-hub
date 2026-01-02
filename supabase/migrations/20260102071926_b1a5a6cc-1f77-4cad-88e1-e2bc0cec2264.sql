-- Create homepage_sections table
CREATE TABLE public.homepage_sections (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  section_key TEXT NOT NULL UNIQUE,
  section_name TEXT NOT NULL,
  is_visible BOOLEAN NOT NULL DEFAULT true,
  display_order INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create homepage_notifications table
CREATE TABLE public.homepage_notifications (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  message TEXT NOT NULL,
  is_active BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.homepage_sections ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.homepage_notifications ENABLE ROW LEVEL SECURITY;

-- RLS Policies for homepage_sections
CREATE POLICY "Public can view visible sections"
ON public.homepage_sections
FOR SELECT
USING (true);

CREATE POLICY "Admins can manage sections"
ON public.homepage_sections
FOR ALL
USING (has_role(auth.uid(), 'admin'))
WITH CHECK (has_role(auth.uid(), 'admin'));

-- RLS Policies for homepage_notifications
CREATE POLICY "Public can view active notifications"
ON public.homepage_notifications
FOR SELECT
USING (true);

CREATE POLICY "Admins can manage notifications"
ON public.homepage_notifications
FOR ALL
USING (has_role(auth.uid(), 'admin'))
WITH CHECK (has_role(auth.uid(), 'admin'));

-- Create triggers for updated_at
CREATE TRIGGER update_homepage_sections_updated_at
BEFORE UPDATE ON public.homepage_sections
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_homepage_notifications_updated_at
BEFORE UPDATE ON public.homepage_notifications
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Insert default sections
INSERT INTO public.homepage_sections (section_key, section_name, is_visible, display_order) VALUES
('ecommerce', 'E-Commerce', true, 1),
('engineering', 'Engineering Services', true, 2),
('manufacturing', 'Manufacturing', true, 3);

-- Insert default notification (inactive)
INSERT INTO public.homepage_notifications (message, is_active) VALUES
('🚀 New services launching soon | 📦 Orders dispatching daily | 🛠️ Engineering services coming shortly', false);