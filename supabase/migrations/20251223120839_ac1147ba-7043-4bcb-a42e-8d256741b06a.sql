-- Add is_highlighted column to products table
ALTER TABLE public.products 
ADD COLUMN is_highlighted BOOLEAN NOT NULL DEFAULT false;