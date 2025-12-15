-- Insert seasonal themes
INSERT INTO public.themes (name, slug, description, category, primary_color, css_variables, is_active, is_seasonal, sort_order)
VALUES 
  (
    'Theme Tết Nguyên Đán',
    'tet_holiday',
    'Vietnamese Lunar New Year theme with red and gold',
    'seasonal',
    '#DC2626',
    '{
      "--color-primary": "#DC2626",
      "--color-secondary": "#FBBF24",
      "--color-background": "#FEF3C7",
      "--color-text-body": "#7C2D12",
      "--font-family-base": "''SimSun'', ''Heiti TC'', serif",
      "--border-radius-base": "0.75rem"
    }',
    true,
    true,
    10
  ),
  (
    'Christmas Theme',
    'christmas',
    'Christmas theme with red, green and gold colors',
    'seasonal',
    '#DC2626',
    '{
      "--color-primary": "#DC2626",
      "--color-secondary": "#16A34A",
      "--color-background": "#F0FDF4",
      "--color-text-body": "#1F2937",
      "--font-family-base": "''Georgia'', serif",
      "--border-radius-base": "1rem"
    }',
    true,
    true,
    11
  ),
  (
    'Summer Bright',
    'summer_bright',
    'Bright summer theme with cyan, yellow and orange',
    'seasonal',
    '#0891B2',
    '{
      "--color-primary": "#0891B2",
      "--color-secondary": "#FBBF24",
      "--color-background": "#ECFDF5",
      "--color-text-body": "#0C4A6E",
      "--font-family-base": "''Segoe UI'', sans-serif",
      "--border-radius-base": "0.5rem"
    }',
    true,
    true,
    12
  ),
  (
    'Autumn Warm',
    'autumn_warm',
    'Warm autumn theme with orange and brown tones',
    'seasonal',
    '#EA580C',
    '{
      "--color-primary": "#EA580C",
      "--color-secondary": "#92400E",
      "--color-background": "#FEF3C7",
      "--color-text-body": "#78350F",
      "--font-family-base": "''Trebuchet MS'', sans-serif",
      "--border-radius-base": "0.75rem"
    }',
    true,
    true,
    13
  )
ON CONFLICT (slug) DO NOTHING;
