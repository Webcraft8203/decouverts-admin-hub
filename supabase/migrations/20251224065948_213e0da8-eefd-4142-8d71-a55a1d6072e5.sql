-- Create admin_notes table for internal admin notes on products and orders
CREATE TABLE public.admin_notes (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  admin_id UUID NOT NULL,
  entity_type TEXT NOT NULL CHECK (entity_type IN ('product', 'order')),
  entity_id UUID NOT NULL,
  note_text TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create indexes for efficient queries
CREATE INDEX idx_admin_notes_entity ON public.admin_notes(entity_type, entity_id);
CREATE INDEX idx_admin_notes_admin ON public.admin_notes(admin_id);

-- Enable RLS
ALTER TABLE public.admin_notes ENABLE ROW LEVEL SECURITY;

-- Only admins can view notes
CREATE POLICY "Admins can view all notes"
ON public.admin_notes
FOR SELECT
USING (has_role(auth.uid(), 'admin'));

-- Only admins can create notes
CREATE POLICY "Admins can create notes"
ON public.admin_notes
FOR INSERT
WITH CHECK (has_role(auth.uid(), 'admin') AND auth.uid() = admin_id);

-- Only admins can update their own notes
CREATE POLICY "Admins can update own notes"
ON public.admin_notes
FOR UPDATE
USING (has_role(auth.uid(), 'admin') AND auth.uid() = admin_id);

-- Only admins can delete their own notes
CREATE POLICY "Admins can delete own notes"
ON public.admin_notes
FOR DELETE
USING (has_role(auth.uid(), 'admin') AND auth.uid() = admin_id);

-- Add trigger for updated_at
CREATE TRIGGER update_admin_notes_updated_at
BEFORE UPDATE ON public.admin_notes
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();