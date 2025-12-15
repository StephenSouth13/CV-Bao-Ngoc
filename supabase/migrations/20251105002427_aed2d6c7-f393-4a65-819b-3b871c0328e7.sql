-- Create hero_section table for managing hero banner content
CREATE TABLE public.hero_section (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  name TEXT NOT NULL DEFAULT '',
  title TEXT NOT NULL DEFAULT '',
  quote TEXT NOT NULL DEFAULT '',
  profile_image_url TEXT,
  background_image_url TEXT
);

-- Enable RLS
ALTER TABLE public.hero_section ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Anyone can view hero section" 
ON public.hero_section 
FOR SELECT 
USING (true);

CREATE POLICY "Admins can insert hero section" 
ON public.hero_section 
FOR INSERT 
WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can update hero section" 
ON public.hero_section 
FOR UPDATE 
USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can delete hero section" 
ON public.hero_section 
FOR DELETE 
USING (has_role(auth.uid(), 'admin'::app_role));

-- Create trigger for updated_at
CREATE TRIGGER update_hero_section_updated_at
BEFORE UPDATE ON public.hero_section
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();
