-- Add visibility columns to hero_section table
ALTER TABLE public.hero_section
ADD COLUMN IF NOT EXISTS show_buttons BOOLEAN DEFAULT true,
ADD COLUMN IF NOT EXISTS show_quote BOOLEAN DEFAULT true;

-- Update existing records to have visibility enabled by default
UPDATE public.hero_section
SET show_buttons = true, show_quote = true
WHERE show_buttons IS NULL OR show_quote IS NULL;
