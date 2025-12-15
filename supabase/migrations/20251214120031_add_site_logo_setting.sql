-- Insert default site logo setting if not exists
INSERT INTO public.settings (key, value)
VALUES ('site_logo', 'TBL')
ON CONFLICT (key) DO NOTHING;
