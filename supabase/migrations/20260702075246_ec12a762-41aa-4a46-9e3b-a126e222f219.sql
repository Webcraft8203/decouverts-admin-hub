ALTER TABLE public.products
  ADD COLUMN IF NOT EXISTS step_file_url text,
  ADD COLUMN IF NOT EXISTS stl_file_url text;