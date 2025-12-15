-- Create themes table
CREATE TABLE IF NOT EXISTS public.themes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL UNIQUE,
  slug TEXT NOT NULL UNIQUE,
  description TEXT,
  category TEXT DEFAULT 'custom',
  primary_color TEXT DEFAULT '#3B82F6',
  css_variables JSONB NOT NULL DEFAULT '{
    "--color-primary": "#3B82F6",
    "--color-secondary": "#10B981",
    "--color-background": "#FFFFFF",
    "--color-text-body": "#000000",
    "--font-family-base": "system-ui, -apple-system, sans-serif",
    "--border-radius-base": "0.5rem"
  }',
  is_active BOOLEAN DEFAULT true,
  is_seasonal BOOLEAN DEFAULT false,
  seasonal_end_date DATE DEFAULT NULL,
  sort_order INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Create user_themes table
CREATE TABLE IF NOT EXISTS public.user_themes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  theme_id UUID NOT NULL REFERENCES public.themes(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  UNIQUE(user_id)
);

-- Enable RLS
ALTER TABLE public.themes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_themes ENABLE ROW LEVEL SECURITY;

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_themes_slug ON public.themes(slug);
CREATE INDEX IF NOT EXISTS idx_themes_is_active ON public.themes(is_active);
CREATE INDEX IF NOT EXISTS idx_themes_category ON public.themes(category);
CREATE INDEX IF NOT EXISTS idx_user_themes_user_id ON public.user_themes(user_id);

-- RLS Policies for themes
CREATE POLICY "Anyone can view active themes"
ON public.themes FOR SELECT
USING (is_active = true OR has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can manage themes"
ON public.themes FOR ALL
TO authenticated
USING (has_role(auth.uid(), 'admin'::app_role))
WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

-- RLS Policies for user_themes
CREATE POLICY "Users can view their own selected theme"
ON public.user_themes FOR SELECT
TO authenticated
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own theme choice"
ON public.user_themes FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own theme choice"
ON public.user_themes FOR UPDATE
TO authenticated
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own theme choice"
ON public.user_themes FOR DELETE
TO authenticated
USING (auth.uid() = user_id);

CREATE POLICY "Admins can manage all user themes"
ON public.user_themes FOR ALL
TO authenticated
USING (has_role(auth.uid(), 'admin'::app_role))
WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

-- Create trigger for updated_at
CREATE TRIGGER update_themes_updated_at
BEFORE UPDATE ON public.themes
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_user_themes_updated_at
BEFORE UPDATE ON public.user_themes
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Insert default themes
INSERT INTO public.themes (name, slug, description, category, primary_color, css_variables, is_active, sort_order)
VALUES 
  (
    'Light Default',
    'light',
    'Default light theme',
    'default',
    '#3B82F6',
    '{
      "--color-primary": "#3B82F6",
      "--color-secondary": "#10B981",
      "--color-background": "#FFFFFF",
      "--color-text-body": "#000000",
      "--font-family-base": "system-ui, -apple-system, sans-serif",
      "--border-radius-base": "0.5rem"
    }',
    true,
    1
  ),
  (
    'Dark Default',
    'dark',
    'Default dark theme',
    'default',
    '#60A5FA',
    '{
      "--color-primary": "#60A5FA",
      "--color-secondary": "#34D399",
      "--color-background": "#0F172A",
      "--color-text-body": "#F8FAFC",
      "--font-family-base": "system-ui, -apple-system, sans-serif",
      "--border-radius-base": "0.5rem"
    }',
    true,
    2
  ),
  (
    'Green Minimal',
    'green_minimal',
    'Minimal theme with green accent',
    'minimal',
    '#4CAF50',
    '{
      "--color-primary": "#4CAF50",
      "--color-secondary": "#2E7D32",
      "--color-background": "#FFFFFF",
      "--color-text-body": "#212121",
      "--font-family-base": "''Segoe UI'', Tahoma, Geneva, Verdana, sans-serif",
      "--border-radius-base": "0.25rem"
    }',
    true,
    3
  ),
  (
    'Dark Premium',
    'dark_premium',
    'Premium dark theme with gold accents',
    'corporate',
    '#D4AF37',
    '{
      "--color-primary": "#D4AF37",
      "--color-secondary": "#1E3A8A",
      "--color-background": "#1A1A1A",
      "--color-text-body": "#F5F5F5",
      "--font-family-base": "''Georgia'', ''Times New Roman'', serif",
      "--border-radius-base": "0.75rem"
    }',
    true,
    4
  ),
  (
    'Pink Pastel',
    'pink_pastel',
    'Soft pastel theme with pink tones',
    'minimal',
    '#EC407A',
    '{
      "--color-primary": "#EC407A",
      "--color-secondary": "#AB47BC",
      "--color-background": "#FFF5F7",
      "--color-text-body": "#424242",
      "--font-family-base": "''Trebuchet MS'', sans-serif",
      "--border-radius-base": "1rem"
    }',
    true,
    5
  )
ON CONFLICT (slug) DO NOTHING;

-- Insert default_website_theme setting if not exists
INSERT INTO public.settings (key, value)
VALUES ('default_website_theme', 'dark')
ON CONFLICT (key) DO NOTHING;
