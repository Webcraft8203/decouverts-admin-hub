-- =============================================
-- IP-BASED LOGIN THROTTLING SYSTEM
-- =============================================

-- Table to track login attempts by IP
CREATE TABLE public.login_attempts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  ip_address TEXT NOT NULL,
  email TEXT,
  portal_type TEXT NOT NULL CHECK (portal_type IN ('admin', 'employee', 'customer')),
  attempt_type TEXT NOT NULL CHECK (attempt_type IN ('success', 'failure')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL
);

-- Index for fast IP lookups
CREATE INDEX idx_login_attempts_ip_created ON public.login_attempts (ip_address, created_at DESC);
CREATE INDEX idx_login_attempts_cleanup ON public.login_attempts (created_at);

-- Enable RLS
ALTER TABLE public.login_attempts ENABLE ROW LEVEL SECURITY;

-- Only service role can access this table (edge functions)
CREATE POLICY "Service role only" ON public.login_attempts
  FOR ALL USING (false);

-- Function to check if IP is blocked (called from edge functions)
CREATE OR REPLACE FUNCTION public.check_ip_throttle(
  _ip_address TEXT,
  _portal_type TEXT,
  _max_attempts INT DEFAULT 5,
  _window_minutes INT DEFAULT 15
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  recent_failures INT;
  blocked_until TIMESTAMP WITH TIME ZONE;
  last_attempt TIMESTAMP WITH TIME ZONE;
BEGIN
  -- Count failed attempts in the time window
  SELECT COUNT(*), MAX(created_at) INTO recent_failures, last_attempt
  FROM public.login_attempts
  WHERE ip_address = _ip_address
    AND portal_type = _portal_type
    AND attempt_type = 'failure'
    AND created_at > NOW() - (_window_minutes || ' minutes')::INTERVAL;
  
  IF recent_failures >= _max_attempts THEN
    blocked_until := last_attempt + (_window_minutes || ' minutes')::INTERVAL;
    RETURN jsonb_build_object(
      'blocked', true,
      'attempts', recent_failures,
      'blocked_until', blocked_until,
      'wait_seconds', EXTRACT(EPOCH FROM (blocked_until - NOW()))::INT
    );
  END IF;
  
  RETURN jsonb_build_object(
    'blocked', false,
    'attempts', recent_failures,
    'remaining', _max_attempts - recent_failures
  );
END;
$$;

-- Function to record a login attempt (called from edge functions)
CREATE OR REPLACE FUNCTION public.record_login_attempt(
  _ip_address TEXT,
  _email TEXT,
  _portal_type TEXT,
  _success BOOLEAN
)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.login_attempts (ip_address, email, portal_type, attempt_type)
  VALUES (
    _ip_address,
    _email,
    _portal_type,
    CASE WHEN _success THEN 'success' ELSE 'failure' END
  );
  
  -- Cleanup old records (older than 24 hours) with 1% probability
  IF random() < 0.01 THEN
    DELETE FROM public.login_attempts WHERE created_at < NOW() - INTERVAL '24 hours';
  END IF;
END;
$$;

-- Function to clear failed attempts after successful login
CREATE OR REPLACE FUNCTION public.clear_login_attempts(
  _ip_address TEXT,
  _portal_type TEXT
)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  DELETE FROM public.login_attempts 
  WHERE ip_address = _ip_address 
    AND portal_type = _portal_type
    AND attempt_type = 'failure';
END;
$$;