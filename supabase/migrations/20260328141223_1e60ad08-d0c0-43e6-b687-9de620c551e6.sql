
-- Newsletter subscribers table
CREATE TABLE public.newsletter_subscribers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email TEXT NOT NULL UNIQUE,
  subscribed_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  is_active BOOLEAN NOT NULL DEFAULT true,
  unsubscribed_at TIMESTAMP WITH TIME ZONE
);

-- Newsletter sends table (tracks sent newsletters)
CREATE TABLE public.newsletter_sends (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  subject TEXT NOT NULL,
  content TEXT NOT NULL,
  sent_by TEXT NOT NULL,
  recipient_count INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.newsletter_subscribers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.newsletter_sends ENABLE ROW LEVEL SECURITY;

-- Public can insert (subscribe)
CREATE POLICY "Anyone can subscribe" ON public.newsletter_subscribers
  FOR INSERT TO anon, authenticated WITH CHECK (true);

-- Only admins can view subscribers
CREATE POLICY "Admins can view subscribers" ON public.newsletter_subscribers
  FOR SELECT TO authenticated USING (public.is_super_admin(auth.uid()));

-- Only admins can update subscribers
CREATE POLICY "Admins can update subscribers" ON public.newsletter_subscribers
  FOR UPDATE TO authenticated USING (public.is_super_admin(auth.uid()));

-- Only admins can delete subscribers
CREATE POLICY "Admins can delete subscribers" ON public.newsletter_subscribers
  FOR DELETE TO authenticated USING (public.is_super_admin(auth.uid()));

-- Newsletter sends - only admins
CREATE POLICY "Admins can view sends" ON public.newsletter_sends
  FOR SELECT TO authenticated USING (public.is_super_admin(auth.uid()));

CREATE POLICY "Admins can insert sends" ON public.newsletter_sends
  FOR INSERT TO authenticated WITH CHECK (public.is_super_admin(auth.uid()));
