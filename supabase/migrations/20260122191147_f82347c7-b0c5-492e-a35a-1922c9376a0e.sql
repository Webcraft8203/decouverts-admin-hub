-- Make user_id nullable in employees table
ALTER TABLE public.employees ALTER COLUMN user_id DROP NOT NULL;

-- Drop the unique constraint and recreate it to allow multiple NULL values
ALTER TABLE public.employees DROP CONSTRAINT IF EXISTS employees_user_id_key;

-- Add unique constraint that allows nulls (partial unique index)
CREATE UNIQUE INDEX IF NOT EXISTS employees_user_id_unique 
ON public.employees (user_id) 
WHERE user_id IS NOT NULL;

-- Update RLS policy for employees viewing own record to handle null user_id
DROP POLICY IF EXISTS "Employees can view own record" ON public.employees;
CREATE POLICY "Employees can view own record" 
ON public.employees 
FOR SELECT 
USING (user_id IS NOT NULL AND user_id = auth.uid());