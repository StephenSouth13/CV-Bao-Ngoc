-- Create contacts table for contact information
CREATE TABLE public.contacts (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  email text NOT NULL,
  phone text,
  location text,
  map_embed_url text,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.contacts ENABLE ROW LEVEL SECURITY;

-- Anyone can view contacts
CREATE POLICY "Anyone can view contacts"
ON public.contacts
FOR SELECT
USING (true);

-- Admins can manage contacts
CREATE POLICY "Admins can manage contacts"
ON public.contacts
FOR ALL
USING (has_role(auth.uid(), 'admin'::app_role))
WITH CHECK (has_role(auth.uid(), 'admin'::app_role));
