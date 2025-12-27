
-- Create design_requests table
CREATE TABLE public.design_requests (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  file_url TEXT NOT NULL,
  file_name TEXT,
  description TEXT,
  size TEXT,
  quantity INTEGER NOT NULL DEFAULT 1,
  quoted_amount NUMERIC,
  final_amount NUMERIC,
  status TEXT NOT NULL DEFAULT 'pending_review',
  price_locked BOOLEAN NOT NULL DEFAULT false,
  admin_notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create quotation_negotiations table
CREATE TABLE public.quotation_negotiations (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  design_request_id UUID NOT NULL REFERENCES public.design_requests(id) ON DELETE CASCADE,
  sender_role TEXT NOT NULL CHECK (sender_role IN ('user', 'admin')),
  sender_id UUID NOT NULL,
  proposed_amount NUMERIC NOT NULL,
  message TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create quotation_messages table
CREATE TABLE public.quotation_messages (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  design_request_id UUID NOT NULL REFERENCES public.design_requests(id) ON DELETE CASCADE,
  sender_role TEXT NOT NULL CHECK (sender_role IN ('user', 'admin')),
  sender_id UUID NOT NULL,
  message_text TEXT NOT NULL,
  is_read BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create design_payments table
CREATE TABLE public.design_payments (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  design_request_id UUID NOT NULL REFERENCES public.design_requests(id) ON DELETE CASCADE,
  razorpay_order_id TEXT,
  razorpay_payment_id TEXT,
  amount NUMERIC NOT NULL,
  payment_status TEXT NOT NULL DEFAULT 'pending',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS on all tables
ALTER TABLE public.design_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.quotation_negotiations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.quotation_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.design_payments ENABLE ROW LEVEL SECURITY;

-- RLS for design_requests
CREATE POLICY "Users can view own design requests"
ON public.design_requests FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can create own design requests"
ON public.design_requests FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Admins can view all design requests"
ON public.design_requests FOR SELECT
USING (has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can update design requests"
ON public.design_requests FOR UPDATE
USING (has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can delete design requests"
ON public.design_requests FOR DELETE
USING (has_role(auth.uid(), 'admin'));

-- RLS for quotation_negotiations
CREATE POLICY "Users can view own negotiations"
ON public.quotation_negotiations FOR SELECT
USING (EXISTS (
  SELECT 1 FROM public.design_requests
  WHERE id = design_request_id AND user_id = auth.uid()
));

CREATE POLICY "Users can create negotiations"
ON public.quotation_negotiations FOR INSERT
WITH CHECK (
  sender_role = 'user' AND 
  sender_id = auth.uid() AND
  EXISTS (
    SELECT 1 FROM public.design_requests
    WHERE id = design_request_id AND user_id = auth.uid()
  )
);

CREATE POLICY "Admins can view all negotiations"
ON public.quotation_negotiations FOR SELECT
USING (has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can create negotiations"
ON public.quotation_negotiations FOR INSERT
WITH CHECK (
  sender_role = 'admin' AND 
  sender_id = auth.uid() AND
  has_role(auth.uid(), 'admin')
);

-- RLS for quotation_messages
CREATE POLICY "Users can view own messages"
ON public.quotation_messages FOR SELECT
USING (EXISTS (
  SELECT 1 FROM public.design_requests
  WHERE id = design_request_id AND user_id = auth.uid()
));

CREATE POLICY "Users can send messages"
ON public.quotation_messages FOR INSERT
WITH CHECK (
  sender_role = 'user' AND 
  sender_id = auth.uid() AND
  EXISTS (
    SELECT 1 FROM public.design_requests
    WHERE id = design_request_id AND user_id = auth.uid()
  )
);

CREATE POLICY "Users can mark messages as read"
ON public.quotation_messages FOR UPDATE
USING (EXISTS (
  SELECT 1 FROM public.design_requests
  WHERE id = design_request_id AND user_id = auth.uid()
));

CREATE POLICY "Admins can view all messages"
ON public.quotation_messages FOR SELECT
USING (has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can send messages"
ON public.quotation_messages FOR INSERT
WITH CHECK (
  sender_role = 'admin' AND 
  sender_id = auth.uid() AND
  has_role(auth.uid(), 'admin')
);

CREATE POLICY "Admins can update messages"
ON public.quotation_messages FOR UPDATE
USING (has_role(auth.uid(), 'admin'));

-- RLS for design_payments
CREATE POLICY "Users can view own payments"
ON public.design_payments FOR SELECT
USING (EXISTS (
  SELECT 1 FROM public.design_requests
  WHERE id = design_request_id AND user_id = auth.uid()
));

CREATE POLICY "Users can create payments"
ON public.design_payments FOR INSERT
WITH CHECK (EXISTS (
  SELECT 1 FROM public.design_requests
  WHERE id = design_request_id AND user_id = auth.uid()
));

CREATE POLICY "Admins can view all payments"
ON public.design_payments FOR SELECT
USING (has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can update payments"
ON public.design_payments FOR UPDATE
USING (has_role(auth.uid(), 'admin'));

-- Create indexes for performance
CREATE INDEX idx_design_requests_user_id ON public.design_requests(user_id);
CREATE INDEX idx_design_requests_status ON public.design_requests(status);
CREATE INDEX idx_quotation_negotiations_request ON public.quotation_negotiations(design_request_id);
CREATE INDEX idx_quotation_messages_request ON public.quotation_messages(design_request_id);
CREATE INDEX idx_quotation_messages_unread ON public.quotation_messages(is_read) WHERE is_read = false;
CREATE INDEX idx_design_payments_request ON public.design_payments(design_request_id);

-- Create storage bucket for design uploads
INSERT INTO storage.buckets (id, name, public) VALUES ('design-uploads', 'design-uploads', false);

-- Storage policies for design-uploads bucket
CREATE POLICY "Users can upload their own designs"
ON storage.objects FOR INSERT
WITH CHECK (bucket_id = 'design-uploads' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Users can view their own designs"
ON storage.objects FOR SELECT
USING (bucket_id = 'design-uploads' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Admins can view all designs"
ON storage.objects FOR SELECT
USING (bucket_id = 'design-uploads' AND has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can delete designs"
ON storage.objects FOR DELETE
USING (bucket_id = 'design-uploads' AND has_role(auth.uid(), 'admin'));

-- Trigger for updated_at
CREATE TRIGGER update_design_requests_updated_at
BEFORE UPDATE ON public.design_requests
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_design_payments_updated_at
BEFORE UPDATE ON public.design_payments
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();
