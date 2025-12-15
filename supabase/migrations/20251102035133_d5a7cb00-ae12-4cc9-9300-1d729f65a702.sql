-- Add phone column to contact_submissions
ALTER TABLE public.contact_submissions 
ADD COLUMN phone text;

-- Create footer_links table
CREATE TABLE public.footer_links (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  section text NOT NULL,
  label text NOT NULL,
  url text NOT NULL,
  sort_order integer DEFAULT 0,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now()
);

-- Enable RLS for footer_links
ALTER TABLE public.footer_links ENABLE ROW LEVEL SECURITY;

-- Create policies for footer_links
CREATE POLICY "Anyone can view footer links"
ON public.footer_links FOR SELECT
USING (true);

CREATE POLICY "Admins can manage footer links"
ON public.footer_links FOR ALL
USING (has_role(auth.uid(), 'admin'::app_role))
WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

-- Create education table
CREATE TABLE public.education (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  institution text NOT NULL,
  degree text NOT NULL,
  field text,
  year text NOT NULL,
  description text,
  achievements text[],
  sort_order integer DEFAULT 0,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now()
);

-- Enable RLS for education
ALTER TABLE public.education ENABLE ROW LEVEL SECURITY;

-- Create policies for education
CREATE POLICY "Anyone can view education"
ON public.education FOR SELECT
USING (true);

CREATE POLICY "Admins can manage education"
ON public.education FOR ALL
USING (has_role(auth.uid(), 'admin'::app_role))
WITH CHECK (has_role(auth.uid(), 'admin'::app_role));