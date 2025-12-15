-- Create blog_categories table
CREATE TABLE IF NOT EXISTS public.blog_categories (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL UNIQUE,
  slug TEXT NOT NULL UNIQUE,
  description TEXT,
  color TEXT DEFAULT '#3B82F6',
  sort_order INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Add category_id to blogs table
ALTER TABLE public.blogs 
ADD COLUMN IF NOT EXISTS category_id UUID REFERENCES public.blog_categories(id) ON DELETE SET NULL;

-- Enable RLS on blog_categories
ALTER TABLE public.blog_categories ENABLE ROW LEVEL SECURITY;

-- Create policies for blog_categories
CREATE POLICY "Anyone can view blog categories"
ON public.blog_categories FOR SELECT
USING (true);

CREATE POLICY "Admins can manage blog categories"
ON public.blog_categories FOR ALL
USING (has_role(auth.uid(), 'admin'::app_role))
WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

-- Create trigger for blog_categories updated_at
CREATE TRIGGER update_blog_categories_updated_at
BEFORE UPDATE ON public.blog_categories
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Insert some default categories
INSERT INTO public.blog_categories (name, slug, description, color, sort_order) VALUES
('Công nghệ', 'cong-nghe', 'Bài viết về công nghệ và lập trình', '#3B82F6', 1),
('Kinh doanh', 'kinh-doanh', 'Chia sẻ về kinh doanh và khởi nghiệp', '#10B981', 2),
('Marketing', 'marketing', 'Chiến lược marketing và bán hàng', '#F59E0B', 3),
('Phát triển bản thân', 'phat-trien-ban-than', 'Kỹ năng mềm và phát triển cá nhân', '#8B5CF6', 4)
ON CONFLICT (slug) DO NOTHING;