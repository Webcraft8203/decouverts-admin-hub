-- Reposition as drone-only company: drop unused 3D printer configuration table and hide engineering/manufacturing homepage sections.
DROP TABLE IF EXISTS public.printer_configurations CASCADE;

DELETE FROM public.homepage_sections
 WHERE section_key IN ('engineering','manufacturing');

UPDATE public.homepage_images
   SET category = NULL
 WHERE category IN ('manufacturing','3d-printing');