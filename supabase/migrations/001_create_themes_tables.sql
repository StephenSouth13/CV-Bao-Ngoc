-- Create themes table
CREATE TABLE IF NOT EXISTS public.themes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    slug TEXT NOT NULL UNIQUE,
    description TEXT,
    category TEXT NOT NULL DEFAULT 'custom',
    primary_color TEXT NOT NULL DEFAULT '#3B82F6',
    css_variables JSONB NOT NULL DEFAULT '{}',
    is_active BOOLEAN DEFAULT true,
    is_seasonal BOOLEAN DEFAULT false,
    sort_order INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

ALTER TABLE public.themes ENABLE ROW LEVEL SECURITY;

CREATE UNIQUE INDEX IF NOT EXISTS themes_slug_unique ON public.themes (slug);

-- Create user_themes table
CREATE TABLE IF NOT EXISTS public.user_themes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    theme_id UUID NOT NULL REFERENCES public.themes(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    UNIQUE(user_id)
);

ALTER TABLE public.user_themes ENABLE ROW LEVEL SECURITY;

CREATE INDEX IF NOT EXISTS idx_user_themes_user_id ON public.user_themes(user_id);

-- Themes RLS Policies
CREATE POLICY IF NOT EXISTS "Anyone can view active themes"
ON public.themes FOR SELECT
USING (is_active = true);

CREATE POLICY IF NOT EXISTS "Admins can view all themes"
ON public.themes FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = auth.uid() AND role = 'admin'
  )
);

CREATE POLICY IF NOT EXISTS "Admins can manage themes"
ON public.themes FOR ALL
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = auth.uid() AND role = 'admin'
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = auth.uid() AND role = 'admin'
  )
);

-- User Themes RLS Policies
CREATE POLICY IF NOT EXISTS "Users can view their own theme preference"
ON public.user_themes FOR SELECT
TO authenticated
USING (auth.uid() = user_id);

CREATE POLICY IF NOT EXISTS "Users can upsert their own theme preference"
ON public.user_themes FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = user_id);

CREATE POLICY IF NOT EXISTS "Users can update their theme preference"
ON public.user_themes FOR UPDATE
TO authenticated
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

CREATE POLICY IF NOT EXISTS "Users can delete their theme preference"
ON public.user_themes FOR DELETE
TO authenticated
USING (auth.uid() = user_id);

CREATE POLICY IF NOT EXISTS "Admins can manage all user themes"
ON public.user_themes FOR ALL
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = auth.uid() AND role = 'admin'
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = auth.uid() AND role = 'admin'
  )
);

-- Insert seasonal themes
INSERT INTO public.themes (name, slug, description, category, primary_color, css_variables, is_active, is_seasonal, sort_order)
VALUES
  (
    'Default Light',
    'default_light',
    'Theme sáng mặc định',
    'default',
    '#3B82F6',
    '{
      "--color-primary": "#3B82F6",
      "--color-secondary": "#10B981",
      "--color-background": "#FFFFFF",
      "--color-text-body": "#1F2937",
      "--font-family-base": "system-ui, -apple-system, sans-serif",
      "--border-radius-base": "0.5rem"
    }'::jsonb,
    true,
    false,
    0
  ),
  (
    'Tết Nguyên Đán',
    'tet_lunar_new_year',
    'Giao diện lễ Tết Nguyên Đán với màu đỏ và vàng',
    'seasonal',
    '#DC2626',
    '{
      "--color-primary": "#DC2626",
      "--color-secondary": "#FBBF24",
      "--color-background": "#FEF3C7",
      "--color-text-body": "#78350F",
      "--font-family-base": "system-ui, -apple-system, sans-serif",
      "--border-radius-base": "0.5rem"
    }'::jsonb,
    true,
    true,
    1
  ),
  (
    'Giáng Sinh',
    'noel_christmas',
    'Giao diện Giáng Sinh với màu đỏ và xanh lục',
    'seasonal',
    '#DC2626',
    '{
      "--color-primary": "#DC2626",
      "--color-secondary": "#15803D",
      "--color-background": "#F0F9FF",
      "--color-text-body": "#166534",
      "--font-family-base": "system-ui, -apple-system, sans-serif",
      "--border-radius-base": "0.5rem"
    }'::jsonb,
    true,
    true,
    2
  ),
  (
    'Mùa Xuân',
    'spring_season',
    'Giao diện Mùa Xuân tươi tắn',
    'seasonal',
    '#10B981',
    '{
      "--color-primary": "#10B981",
      "--color-secondary": "#EC4899",
      "--color-background": "#F0FDF4",
      "--color-text-body": "#065F46",
      "--font-family-base": "system-ui, -apple-system, sans-serif",
      "--border-radius-base": "0.5rem"
    }'::jsonb,
    true,
    true,
    3
  ),
  (
    'Mùa Hè',
    'summer_season',
    'Giao diện Mùa Hè sáng sủa',
    'seasonal',
    '#F59E0B',
    '{
      "--color-primary": "#F59E0B",
      "--color-secondary": "#06B6D4",
      "--color-background": "#FEFCE8",
      "--color-text-body": "#78350F",
      "--font-family-base": "system-ui, -apple-system, sans-serif",
      "--border-radius-base": "0.5rem"
    }'::jsonb,
    true,
    true,
    4
  ),
  (
    'Mùa Thu',
    'autumn_season',
    'Giao diện Mùa Thu ấm áp',
    'seasonal',
    '#EA580C',
    '{
      "--color-primary": "#EA580C",
      "--color-secondary": "#92400E",
      "--color-background": "#FEF3C7",
      "--color-text-body": "#78350F",
      "--font-family-base": "system-ui, -apple-system, sans-serif",
      "--border-radius-base": "0.5rem"
    }'::jsonb,
    true,
    true,
    5
  ),
  (
    'Mùa Đông',
    'winter_season',
    'Giao diện Mùa Đông lạnh lẽo',
    'seasonal',
    '#0369A1',
    '{
      "--color-primary": "#0369A1",
      "--color-secondary": "#6366F1",
      "--color-background": "#F0F9FF",
      "--color-text-body": "#0C2340",
      "--font-family-base": "system-ui, -apple-system, sans-serif",
      "--border-radius-base": "0.5rem"
    }'::jsonb,
    true,
    true,
    6
  ),
  (
    'Xanh lá - Trắng',
    'green_white',
    'Giao diện tinh tế với xanh lá cây và trắng',
    'custom',
    '#059669',
    '{
      "--color-primary": "#059669",
      "--color-secondary": "#10B981",
      "--color-background": "#F9FAFB",
      "--color-text-body": "#0F766E",
      "--font-family-base": "system-ui, -apple-system, sans-serif",
      "--border-radius-base": "0.5rem"
    }'::jsonb,
    true,
    false,
    7
  )
ON CONFLICT (slug) DO NOTHING;
