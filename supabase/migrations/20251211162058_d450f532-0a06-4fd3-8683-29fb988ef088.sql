-- Thêm cột view_count vào blogs
ALTER TABLE public.blogs ADD COLUMN IF NOT EXISTS view_count INTEGER DEFAULT 0;

-- Tạo bảng tags cho blog
CREATE TABLE IF NOT EXISTS public.blog_tags (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL UNIQUE,
    slug TEXT NOT NULL UNIQUE,
    color TEXT DEFAULT '#6366F1',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

ALTER TABLE public.blog_tags ENABLE ROW LEVEL SECURITY;

-- Bảng liên kết blog và tags (many-to-many)
CREATE TABLE IF NOT EXISTS public.blog_post_tags (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    blog_id UUID NOT NULL REFERENCES public.blogs(id) ON DELETE CASCADE,
    tag_id UUID NOT NULL REFERENCES public.blog_tags(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    UNIQUE(blog_id, tag_id)
);

ALTER TABLE public.blog_post_tags ENABLE ROW LEVEL SECURITY;

-- RLS cho blog_tags
CREATE POLICY "Anyone can view tags" ON public.blog_tags FOR SELECT USING (true);
CREATE POLICY "Admins can manage tags" ON public.blog_tags FOR ALL USING (has_role(auth.uid(), 'admin'::app_role)) WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

-- RLS cho blog_post_tags
CREATE POLICY "Anyone can view post tags" ON public.blog_post_tags FOR SELECT USING (true);
CREATE POLICY "Admins can manage post tags" ON public.blog_post_tags FOR ALL USING (has_role(auth.uid(), 'admin'::app_role)) WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

-- Function để tăng view count
CREATE OR REPLACE FUNCTION public.increment_blog_view(blog_slug TEXT)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
    UPDATE public.blogs SET view_count = COALESCE(view_count, 0) + 1 WHERE slug = blog_slug AND published = true;
END;
$$;

-- Index cho performance
CREATE INDEX IF NOT EXISTS idx_blogs_view_count ON public.blogs(view_count DESC);
CREATE INDEX IF NOT EXISTS idx_blog_tags_slug ON public.blog_tags(slug);
CREATE INDEX IF NOT EXISTS idx_blog_post_tags_blog_id ON public.blog_post_tags(blog_id);
CREATE INDEX IF NOT EXISTS idx_blog_post_tags_tag_id ON public.blog_post_tags(tag_id);