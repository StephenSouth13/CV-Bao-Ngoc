-- Create storage bucket for project images
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'project-images',
  'project-images',
  true,
  5242880,
  ARRAY['image/jpeg', 'image/png', 'image/webp', 'image/gif']
);

-- Storage policies for project images
CREATE POLICY "Anyone can view project images"
ON storage.objects FOR SELECT
USING (bucket_id = 'project-images');

CREATE POLICY "Admins can upload project images"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'project-images' 
  AND has_role(auth.uid(), 'admin'::app_role)
);

CREATE POLICY "Admins can update project images"
ON storage.objects FOR UPDATE
USING (
  bucket_id = 'project-images' 
  AND has_role(auth.uid(), 'admin'::app_role)
);

CREATE POLICY "Admins can delete project images"
ON storage.objects FOR DELETE
USING (
  bucket_id = 'project-images' 
  AND has_role(auth.uid(), 'admin'::app_role)
);

-- Add featured field to projects table
ALTER TABLE public.projects 
ADD COLUMN IF NOT EXISTS featured boolean DEFAULT false;

-- Add technologies field to projects table
ALTER TABLE public.projects 
ADD COLUMN IF NOT EXISTS technologies text[] DEFAULT '{}';

-- Add full_description field for detail page
ALTER TABLE public.projects 
ADD COLUMN IF NOT EXISTS full_description text;

-- Add challenge and solution fields for detail page
ALTER TABLE public.projects 
ADD COLUMN IF NOT EXISTS challenge text;
ALTER TABLE public.projects 
ADD COLUMN IF NOT EXISTS solution text;