# Supabase Setup Documentation

## 📋 Mục lục
1. [Cấu hình ban đầu](#cấu-hình-ban-đầu)
2. [Database Schema](#database-schema)
3. [Row Level Security (RLS)](#row-level-security-rls)
4. [Database Functions](#database-functions)
5. [Storage Setup](#storage-setup)
6. [Authentication](#authentication)
7. [Kết nối Frontend](#kết-nối-frontend)
8. [Queries mẫu](#queries-mẫu)

---

## Cấu hình ban đầu

### Environment Variables
Tạo file `.env.local` (hoặc `.env`) với các biến sau từ Supabase project settings:
```env
VITE_SUPABASE_URL=https://your-project-id.supabase.co
VITE_SUPABASE_PUBLISHABLE_KEY=your-anon-key-here
```

**Cách lấy giá trị:**
1. Đăng nhập vào [Supabase Dashboard](https://app.supabase.com)
2. Chọn project của bạn
3. Vào **Settings** → **API**
4. Copy `Project URL` vào `VITE_SUPABASE_URL`
5. Copy `anon` public key vào `VITE_SUPABASE_PUBLISHABLE_KEY`

### Supabase Client Setup
File: `src/integrations/supabase/client.ts`
```typescript
import { createClient } from '@supabase/supabase-js';
import type { Database } from './types';

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL || '';
const SUPABASE_PUBLISHABLE_KEY = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY || '';

if (!SUPABASE_URL || !SUPABASE_PUBLISHABLE_KEY) {
  throw new Error(
    'Missing Supabase environment variables. Please check your .env.local file.'
  );
}

export const supabase = createClient<Database>(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY, {
  auth: {
    storage: localStorage,
    persistSession: true,
    autoRefreshToken: true,
  }
});
```

### Thiết lập Database Schema
1. Tạo project trên [Supabase](https://supabase.com)
2. Vào **SQL Editor** trong Supabase Dashboard
3. Chạy các SQL migrations từ folder `supabase/migrations/`
4. Hoặc sử dụng Supabase CLI: `supabase db push`

---

## Database Schema

### 1. Enum Types

#### App Role Enum
```sql
CREATE TYPE public.app_role AS ENUM ('admin', 'user');
```

### 2. Tables

#### User Roles Table
```sql
CREATE TABLE public.user_roles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    role app_role NOT NULL,
    UNIQUE(user_id, role)
);

ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;
```

#### Hero Section
```sql
CREATE TABLE public.hero_section (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL DEFAULT '',
    title TEXT NOT NULL DEFAULT '',
    quote TEXT NOT NULL DEFAULT '',
    profile_image_url TEXT,
    background_image_url TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

ALTER TABLE public.hero_section ENABLE ROW LEVEL SECURITY;
```

#### About Section
```sql
CREATE TABLE public.about_section (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    headline TEXT NOT NULL DEFAULT '',
    description TEXT NOT NULL,
    image_url TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

ALTER TABLE public.about_section ENABLE ROW LEVEL SECURITY;
```

#### Skills
```sql
CREATE TABLE public.skills (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    sort_order INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

ALTER TABLE public.skills ENABLE ROW LEVEL SECURITY;
```

#### Experiences
```sql
CREATE TABLE public.experiences (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    year TEXT NOT NULL,
    title TEXT NOT NULL,
    company TEXT NOT NULL,
    location TEXT,
    description TEXT,
    achievements TEXT[] DEFAULT '{}',
    sort_order INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

ALTER TABLE public.experiences ENABLE ROW LEVEL SECURITY;
```

#### Certificates (Chứng chỉ)
```sql
CREATE TABLE public.certificates (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    issuer TEXT NOT NULL,
    issue_date TEXT,
    expiry_date TEXT,
    credential_id TEXT,
    credential_url TEXT,
    description TEXT,
    image_url TEXT,
    sort_order INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

ALTER TABLE public.certificates ENABLE ROW LEVEL SECURITY;

-- Trigger cho updated_at
CREATE TRIGGER update_certificates_updated_at
BEFORE UPDATE ON public.certificates
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();
```

#### Education
```sql
CREATE TABLE public.education (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    year TEXT NOT NULL,
    institution TEXT NOT NULL,
    degree TEXT NOT NULL,
    field TEXT,
    description TEXT,
    achievements TEXT[],
    sort_order INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

ALTER TABLE public.education ENABLE ROW LEVEL SECURITY;
```

#### Projects
```sql
CREATE TABLE public.projects (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title TEXT NOT NULL,
    description TEXT NOT NULL,
    full_description TEXT,
    category TEXT NOT NULL,
    technologies TEXT[] DEFAULT '{}',
    image_url TEXT,
    link TEXT,
    slug TEXT UNIQUE,
    challenge TEXT,
    solution TEXT,
    metrics JSONB DEFAULT '[]'::jsonb,
    featured BOOLEAN DEFAULT false,
    sort_order INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

ALTER TABLE public.projects ENABLE ROW LEVEL SECURITY;

CREATE UNIQUE INDEX IF NOT EXISTS projects_slug_unique ON public.projects (slug);
```

#### Blog Categories
```sql
CREATE TABLE public.blog_categories (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    slug TEXT NOT NULL UNIQUE,
    description TEXT,
    color TEXT DEFAULT '#3B82F6',
    sort_order INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

ALTER TABLE public.blog_categories ENABLE ROW LEVEL SECURITY;
```

#### Blogs
```sql
CREATE TABLE public.blogs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title TEXT NOT NULL,
    slug TEXT UNIQUE,
    excerpt TEXT,
    content TEXT NOT NULL,
    image_url TEXT,
    category_id UUID REFERENCES public.blog_categories(id),
    view_count INTEGER DEFAULT 0, -- Lượt xem bài viết
    featured BOOLEAN DEFAULT false,
    published BOOLEAN DEFAULT false,
    sort_order INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

ALTER TABLE public.blogs ENABLE ROW LEVEL SECURITY;

-- Index cho view count
CREATE INDEX IF NOT EXISTS idx_blogs_view_count ON public.blogs(view_count DESC);
```

#### Blog Tags (Nhãn bài viết)
```sql
CREATE TABLE public.blog_tags (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL UNIQUE,
    slug TEXT NOT NULL UNIQUE,
    color TEXT DEFAULT '#6366F1',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

ALTER TABLE public.blog_tags ENABLE ROW LEVEL SECURITY;

-- Index cho slug
CREATE INDEX IF NOT EXISTS idx_blog_tags_slug ON public.blog_tags(slug);
```

#### Blog Post Tags (Liên kết bài viết và tag - Many to Many)
```sql
CREATE TABLE public.blog_post_tags (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    blog_id UUID NOT NULL REFERENCES public.blogs(id) ON DELETE CASCADE,
    tag_id UUID NOT NULL REFERENCES public.blog_tags(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    UNIQUE(blog_id, tag_id)
);

ALTER TABLE public.blog_post_tags ENABLE ROW LEVEL SECURITY;

-- Indexes cho performance
CREATE INDEX IF NOT EXISTS idx_blog_post_tags_blog_id ON public.blog_post_tags(blog_id);
CREATE INDEX IF NOT EXISTS idx_blog_post_tags_tag_id ON public.blog_post_tags(tag_id);
```

#### Product Categories
```sql
CREATE TABLE public.product_categories (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    slug TEXT NOT NULL UNIQUE,
    description TEXT,
    sort_order INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

ALTER TABLE public.product_categories ENABLE ROW LEVEL SECURITY;
```

#### Products
```sql
CREATE TABLE public.products (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    slug TEXT UNIQUE,
    description TEXT,
    full_description TEXT,
    brand TEXT,
    price NUMERIC NOT NULL,
    discount_percent INTEGER DEFAULT 0,
    stock_quantity INTEGER NOT NULL DEFAULT 0,
    image_url TEXT,
    images TEXT[],
    colors TEXT[],
    sizes TEXT[],
    category_id UUID REFERENCES public.product_categories(id),
    product_type TEXT NOT NULL DEFAULT 'product', -- 'product' hoặc 'course'
    featured BOOLEAN DEFAULT false,
    published BOOLEAN DEFAULT true,
    sort_order INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;

-- Index cho lọc theo loại sản phẩm
CREATE INDEX idx_products_product_type ON public.products(product_type);

COMMENT ON COLUMN public.products.product_type IS 'Type of product: product or course';
```

#### Cart Items
```sql
CREATE TABLE public.cart_items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    product_id UUID NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
    quantity INTEGER NOT NULL DEFAULT 1,
    selected_size TEXT,
    selected_color TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

ALTER TABLE public.cart_items ENABLE ROW LEVEL SECURITY;
```

#### Orders
```sql
CREATE TABLE public.orders (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    customer_name TEXT NOT NULL,
    customer_phone TEXT NOT NULL,
    customer_address TEXT NOT NULL,
    delivery_time TEXT,
    customer_message TEXT,
    total_amount NUMERIC NOT NULL,
    status TEXT NOT NULL DEFAULT 'pending',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;
```

#### Order Items
```sql
CREATE TABLE public.order_items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    order_id UUID NOT NULL REFERENCES public.orders(id) ON DELETE CASCADE,
    product_id UUID NOT NULL REFERENCES public.products(id),
    product_name TEXT NOT NULL,
    product_price NUMERIC NOT NULL,
    quantity INTEGER NOT NULL,
    selected_size TEXT,
    selected_color TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

ALTER TABLE public.order_items ENABLE ROW LEVEL SECURITY;
```

#### Contacts
```sql
CREATE TABLE public.contacts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email TEXT NOT NULL,
    phone TEXT,
    location TEXT,
    map_embed_url TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

ALTER TABLE public.contacts ENABLE ROW LEVEL SECURITY;
```

#### Contact Submissions
```sql
CREATE TABLE public.contact_submissions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    email TEXT NOT NULL,
    phone TEXT,
    message TEXT NOT NULL,
    seen BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

ALTER TABLE public.contact_submissions ENABLE ROW LEVEL SECURITY;
```

#### Social Links
```sql
CREATE TABLE public.social_links (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    provider TEXT NOT NULL,
    url TEXT NOT NULL,
    sort_order INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

ALTER TABLE public.social_links ENABLE ROW LEVEL SECURITY;
```

#### Footer Links
```sql
CREATE TABLE public.footer_links (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    section TEXT NOT NULL,
    label TEXT NOT NULL,
    url TEXT NOT NULL,
    sort_order INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

ALTER TABLE public.footer_links ENABLE ROW LEVEL SECURITY;
```

#### Chatbot Training
```sql
CREATE TABLE public.chatbot_training (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    question TEXT NOT NULL,
    answer TEXT NOT NULL,
    keywords TEXT[] NOT NULL,
    language TEXT NOT NULL DEFAULT 'vi',
    priority INTEGER DEFAULT 0,
    active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

ALTER TABLE public.chatbot_training ENABLE ROW LEVEL SECURITY;
```

#### Settings
```sql
CREATE TABLE public.settings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    key TEXT NOT NULL,
    value TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

ALTER TABLE public.settings ENABLE ROW LEVEL SECURITY;
```

#### Themes (Chủ đề theo mùa)
```sql
CREATE TABLE public.themes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    slug TEXT NOT NULL UNIQUE,
    description TEXT,
    category TEXT NOT NULL DEFAULT 'custom', -- 'default', 'seasonal', 'minimal', 'corporate', 'custom'
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
```

#### User Themes (Ghi nhớ lựa chọn theme của user)
```sql
CREATE TABLE public.user_themes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    theme_id UUID NOT NULL REFERENCES public.themes(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    UNIQUE(user_id)
);

ALTER TABLE public.user_themes ENABLE ROW LEVEL SECURITY;

CREATE INDEX IF NOT EXISTS idx_user_themes_user_id ON public.user_themes(user_id);
```

---

## Pre-configured Seasonal Themes

Hệ thống cung cấp các theme theo mùa được cấu hình sẵn mà admin có thể sử dụng:

### 1. Default Theme (Mặc định)
- **Slug**: `default_light`
- **Category**: `default`
- **Seasonal**: No
- **Description**: Theme sáng mặc định dùng khi không có theme nào được chọn

### 2. Tết Theme (Lễ Tết Nguyên Đán)
- **Slug**: `tet_lunar_new_year`
- **Category**: `seasonal`
- **Seasonal**: Yes
- **Colors**: Đỏ, vàng (màu truyền thống Tết)
- **Description**: Giao diện Tết Nguyên Đán với các màu sắc truyền thống

### 3. Noel Theme (Giáng Sinh)
- **Slug**: `noel_christmas`
- **Category**: `seasonal`
- **Seasonal**: Yes
- **Colors**: Đỏ, xanh lục (Lễ Giáng Sinh)
- **Description**: Giao diện Giáng Sinh với màu sắc lễ hội

### 4. Spring Theme (Mùa Xuân)
- **Slug**: `spring_season`
- **Category**: `seasonal`
- **Seasonal**: Yes
- **Colors**: Xanh lá cây, hồng, vàng
- **Description**: Giao diện Mùa Xuân tươi tắn

### 5. Summer Theme (Mùa Hè)
- **Slug**: `summer_season`
- **Category**: `seasonal`
- **Seasonal**: Yes
- **Colors**: Vàng, cam, xanh nước biển
- **Description**: Giao diện Mùa Hè sáng sủa

### 6. Autumn Theme (Mùa Thu)
- **Slug**: `autumn_season`
- **Category**: `seasonal`
- **Seasonal**: Yes
- **Colors**: Cam, nâu, vàng
- **Description**: Giao diện Mùa Thu ấm áp

### 7. Winter Theme (Mùa Đông)
- **Slug**: `winter_season`
- **Category**: `seasonal`
- **Seasonal**: Yes
- **Colors**: Xanh lạnh, trắng, xám
- **Description**: Giao diện Mùa Đông lạnh lẽo

### 8. Green-White Theme (Xanh lá - Trắng)
- **Slug**: `green_white`
- **Category**: `custom`
- **Seasonal**: No
- **Colors**: Xanh lá cây, trắng
- **Description**: Giao diện tinh tế với xanh lá cây và trắng

---

## Database Functions

### 1. Has Role Function
```sql
CREATE OR REPLACE FUNCTION public.has_role(_user_id uuid, _role app_role)
RETURNS boolean
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_id = _user_id
      AND role = _role
  )
$$;
```

### 2. Update Updated_at Trigger Function
```sql
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = 'public'
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;
```

### 3. Handle Blogs Updated_at Function
```sql
CREATE OR REPLACE FUNCTION public.handle_blogs_updated_at()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = 'public'
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;
```

### 4. Increment Blog View Count Function
```sql
-- Function để tăng lượt xem bài viết
CREATE OR REPLACE FUNCTION public.increment_blog_view(blog_slug TEXT)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
    UPDATE public.blogs 
    SET view_count = COALESCE(view_count, 0) + 1 
    WHERE slug = blog_slug AND published = true;
END;
$$;
```

---

## Row Level Security (RLS)

### User Roles Policies
```sql
-- Users can view their own roles
CREATE POLICY "Users can view their own roles"
ON public.user_roles FOR SELECT
TO authenticated
USING (auth.uid() = user_id);

-- Service role can manage roles
CREATE POLICY "Service role can manage roles"
ON public.user_roles FOR ALL
TO authenticated
USING ((auth.jwt() ->> 'role'::text) = 'service_role'::text)
WITH CHECK ((auth.jwt() ->> 'role'::text) = 'service_role'::text);
```

### Hero Section Policies
```sql
CREATE POLICY "Anyone can view hero section"
ON public.hero_section FOR SELECT
USING (true);

CREATE POLICY "Admins can insert hero section"
ON public.hero_section FOR INSERT
TO authenticated
WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can update hero section"
ON public.hero_section FOR UPDATE
TO authenticated
USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can delete hero section"
ON public.hero_section FOR DELETE
TO authenticated
USING (has_role(auth.uid(), 'admin'::app_role));
```

### About Section Policies
```sql
CREATE POLICY "Anyone can view about section"
ON public.about_section FOR SELECT
USING (true);

CREATE POLICY "Admins can insert about section"
ON public.about_section FOR INSERT
TO authenticated
WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can update about section"
ON public.about_section FOR UPDATE
TO authenticated
USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can delete about section"
ON public.about_section FOR DELETE
TO authenticated
USING (has_role(auth.uid(), 'admin'::app_role));
```

### Skills Policies
```sql
CREATE POLICY "Anyone can view skills"
ON public.skills FOR SELECT
USING (true);

CREATE POLICY "Admins can manage skills"
ON public.skills FOR ALL
TO authenticated
USING (has_role(auth.uid(), 'admin'::app_role))
WITH CHECK (has_role(auth.uid(), 'admin'::app_role));
```

### Experiences Policies
```sql
CREATE POLICY "Anyone can view experiences"
ON public.experiences FOR SELECT
USING (true);

CREATE POLICY "Admins can manage experiences"
ON public.experiences FOR ALL
TO authenticated
USING (has_role(auth.uid(), 'admin'::app_role))
WITH CHECK (has_role(auth.uid(), 'admin'::app_role));
```

### Education Policies
```sql
CREATE POLICY "Anyone can view education"
ON public.education FOR SELECT
USING (true);

CREATE POLICY "Admins can manage education"
ON public.education FOR ALL
TO authenticated
USING (has_role(auth.uid(), 'admin'::app_role))
WITH CHECK (has_role(auth.uid(), 'admin'::app_role));
```

### Projects Policies
```sql
CREATE POLICY "Anyone can view projects"
ON public.projects FOR SELECT
USING (true);

CREATE POLICY "Admins can manage projects"
ON public.projects FOR ALL
TO authenticated
USING (has_role(auth.uid(), 'admin'::app_role))
WITH CHECK (has_role(auth.uid(), 'admin'::app_role));
```

### Blog Categories Policies
```sql
CREATE POLICY "Anyone can view blog categories"
ON public.blog_categories FOR SELECT
USING (true);

CREATE POLICY "Admins can manage blog categories"
ON public.blog_categories FOR ALL
TO authenticated
USING (has_role(auth.uid(), 'admin'::app_role))
WITH CHECK (has_role(auth.uid(), 'admin'::app_role));
```

### Blogs Policies
```sql
CREATE POLICY "Anyone can view published blogs"
ON public.blogs FOR SELECT
USING (published = true);

CREATE POLICY "Admins can manage blogs"
ON public.blogs FOR ALL
TO authenticated
USING (has_role(auth.uid(), 'admin'::app_role))
WITH CHECK (has_role(auth.uid(), 'admin'::app_role));
```

### Blog Tags Policies
```sql
CREATE POLICY "Anyone can view tags"
ON public.blog_tags FOR SELECT
USING (true);

CREATE POLICY "Admins can manage tags"
ON public.blog_tags FOR ALL
TO authenticated
USING (has_role(auth.uid(), 'admin'::app_role))
WITH CHECK (has_role(auth.uid(), 'admin'::app_role));
```

### Blog Post Tags Policies
```sql
CREATE POLICY "Anyone can view post tags"
ON public.blog_post_tags FOR SELECT
USING (true);

CREATE POLICY "Admins can manage post tags"
ON public.blog_post_tags FOR ALL
TO authenticated
USING (has_role(auth.uid(), 'admin'::app_role))
WITH CHECK (has_role(auth.uid(), 'admin'::app_role));
```

### Product Categories Policies
```sql
CREATE POLICY "Anyone can view categories"
ON public.product_categories FOR SELECT
USING (true);

CREATE POLICY "Admins can manage categories"
ON public.product_categories FOR ALL
TO authenticated
USING (has_role(auth.uid(), 'admin'::app_role));
```

### Products Policies
```sql
CREATE POLICY "Anyone can view published products"
ON public.products FOR SELECT
USING (published = true);

CREATE POLICY "Admins can manage products"
ON public.products FOR ALL
TO authenticated
USING (has_role(auth.uid(), 'admin'::app_role));
```

### Cart Items Policies
```sql
CREATE POLICY "Users can manage their own cart"
ON public.cart_items FOR ALL
TO authenticated
USING (auth.uid() = user_id);
```

### Orders Policies
```sql
CREATE POLICY "Users can view their own orders"
ON public.orders FOR SELECT
TO authenticated
USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own orders"
ON public.orders FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Admins can view all orders"
ON public.orders FOR SELECT
TO authenticated
USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can update orders"
ON public.orders FOR UPDATE
TO authenticated
USING (has_role(auth.uid(), 'admin'::app_role));
```

### Order Items Policies
```sql
CREATE POLICY "Users can view their order items"
ON public.order_items FOR SELECT
TO authenticated
USING (EXISTS (
  SELECT 1 FROM orders
  WHERE orders.id = order_items.order_id
  AND orders.user_id = auth.uid()
));

CREATE POLICY "Users can create order items"
ON public.order_items FOR INSERT
TO authenticated
WITH CHECK (EXISTS (
  SELECT 1 FROM orders
  WHERE orders.id = order_items.order_id
  AND orders.user_id = auth.uid()
));

CREATE POLICY "Admins can manage order items"
ON public.order_items FOR ALL
TO authenticated
USING (has_role(auth.uid(), 'admin'::app_role));
```

### Contacts Policies
```sql
CREATE POLICY "Anyone can view contacts"
ON public.contacts FOR SELECT
USING (true);

CREATE POLICY "Admins can manage contacts"
ON public.contacts FOR ALL
TO authenticated
USING (has_role(auth.uid(), 'admin'::app_role))
WITH CHECK (has_role(auth.uid(), 'admin'::app_role));
```

### Contact Submissions Policies
```sql
CREATE POLICY "Anyone can create submissions"
ON public.contact_submissions FOR INSERT
WITH CHECK (true);

CREATE POLICY "Admins can view submissions"
ON public.contact_submissions FOR SELECT
TO authenticated
USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can update submissions"
ON public.contact_submissions FOR UPDATE
TO authenticated
USING (has_role(auth.uid(), 'admin'::app_role))
WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can delete submissions"
ON public.contact_submissions FOR DELETE
TO authenticated
USING (has_role(auth.uid(), 'admin'::app_role));
```

### Social Links Policies
```sql
CREATE POLICY "Anyone can view social links"
ON public.social_links FOR SELECT
USING (true);

CREATE POLICY "Admins can manage social links"
ON public.social_links FOR ALL
TO authenticated
USING (has_role(auth.uid(), 'admin'::app_role))
WITH CHECK (has_role(auth.uid(), 'admin'::app_role));
```

### Footer Links Policies
```sql
CREATE POLICY "Anyone can view footer links"
ON public.footer_links FOR SELECT
USING (true);

CREATE POLICY "Admins can manage footer links"
ON public.footer_links FOR ALL
TO authenticated
USING (has_role(auth.uid(), 'admin'::app_role))
WITH CHECK (has_role(auth.uid(), 'admin'::app_role));
```

### Chatbot Training Policies
```sql
CREATE POLICY "Anyone can view active chatbot training"
ON public.chatbot_training FOR SELECT
USING (active = true);

CREATE POLICY "Admins can manage chatbot training"
ON public.chatbot_training FOR ALL
TO authenticated
USING (has_role(auth.uid(), 'admin'::app_role))
WITH CHECK (has_role(auth.uid(), 'admin'::app_role));
```

### Settings Policies
```sql
CREATE POLICY "Anyone can view settings"
ON public.settings FOR SELECT
USING (true);

CREATE POLICY "Admins can manage settings"
ON public.settings FOR ALL
TO authenticated
USING (has_role(auth.uid(), 'admin'::app_role))
WITH CHECK (has_role(auth.uid(), 'admin'::app_role));
```

### Themes Policies
```sql
CREATE POLICY "Anyone can view active themes"
ON public.themes FOR SELECT
USING (is_active = true);

CREATE POLICY "Admins can view all themes"
ON public.themes FOR SELECT
TO authenticated
USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can manage themes"
ON public.themes FOR ALL
TO authenticated
USING (has_role(auth.uid(), 'admin'::app_role))
WITH CHECK (has_role(auth.uid(), 'admin'::app_role));
```

### User Themes Policies
```sql
CREATE POLICY "Users can view their own theme preference"
ON public.user_themes FOR SELECT
TO authenticated
USING (auth.uid() = user_id);

CREATE POLICY "Users can update their own theme preference"
ON public.user_themes FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their theme preference"
ON public.user_themes FOR UPDATE
TO authenticated
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their theme preference"
ON public.user_themes FOR DELETE
TO authenticated
USING (auth.uid() = user_id);

CREATE POLICY "Admins can manage user themes"
ON public.user_themes FOR ALL
TO authenticated
USING (has_role(auth.uid(), 'admin'::app_role))
WITH CHECK (has_role(auth.uid(), 'admin'::app_role));
```

---

## Storage Setup

### Project Images Bucket
```sql
-- Create storage bucket
INSERT INTO storage.buckets (id, name, public)
VALUES ('project-images', 'project-images', true);

-- Allow public access to view images
CREATE POLICY "Public Access"
ON storage.objects FOR SELECT
USING (bucket_id = 'project-images');

-- Allow authenticated users to upload
CREATE POLICY "Authenticated users can upload"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'project-images');

-- Allow admins to delete
CREATE POLICY "Admins can delete"
ON storage.objects FOR DELETE
TO authenticated
USING (
  bucket_id = 'project-images' 
  AND has_role(auth.uid(), 'admin'::app_role)
);
```

---

## Authentication

### Setup Admin User
1. Tạo tài khoản user trong Supabase Auth
2. Lấy `user_id` từ Supabase Auth users table
3. Thêm role admin vào `user_roles` table:

```sql
-- Thay 'user-uuid-here' bằng user_id thực tế
INSERT INTO public.user_roles (user_id, role)
VALUES ('user-uuid-here', 'admin')
ON CONFLICT (user_id, role) DO NOTHING;
```

**Lấy User ID từ Supabase UI:**
1. Vào **Authentication** → **Users** trong Supabase Dashboard
2. Chọn user muốn làm admin
3. Copy giá trị `UID` từ phần thông tin user
4. Chạy SQL query ở trên với `UID` vừa copy

### Cách sử dụng trong Frontend

#### Login
```typescript
import { supabase } from '@/integrations/supabase/client';

const { data, error } = await supabase.auth.signInWithPassword({
  email: 'admin@trinhbalam.com',
  password: 'password'
});
```

#### Signup
```typescript
const { data, error } = await supabase.auth.signUp({
  email: 'user@example.com',
  password: 'password'
});
```

#### Check Auth Status
```typescript
const { data: { user } } = await supabase.auth.getUser();
```

#### Check Admin Role
```typescript
const { data, error } = await supabase
  .from('user_roles')
  .select('role')
  .eq('user_id', user.id)
  .eq('role', 'admin')
  .single();

const isAdmin = !!data;
```

#### Logout
```typescript
await supabase.auth.signOut();
```

---

## Kết nối Frontend

### 1. Fetch Data
```typescript
// Example: Fetch projects
import { supabase } from '@/integrations/supabase/client';

const { data: projects, error } = await supabase
  .from('projects')
  .select('*')
  .order('sort_order', { ascending: true });
```

### 2. Insert Data
```typescript
const { data, error } = await supabase
  .from('projects')
  .insert({
    title: 'New Project',
    description: 'Description',
    category: 'Web Development'
  })
  .select()
  .single();
```

### 3. Update Data
```typescript
const { error } = await supabase
  .from('projects')
  .update({ title: 'Updated Title' })
  .eq('id', projectId);
```

### 4. Delete Data
```typescript
const { error } = await supabase
  .from('projects')
  .delete()
  .eq('id', projectId);
```

### 5. Upload File
```typescript
const file = event.target.files[0];
const fileExt = file.name.split('.').pop();
const fileName = `${Math.random()}.${fileExt}`;
const filePath = `${fileName}`;

const { error: uploadError } = await supabase.storage
  .from('project-images')
  .upload(filePath, file);

const { data } = supabase.storage
  .from('project-images')
  .getPublicUrl(filePath);

const imageUrl = data.publicUrl;
```

---

## Queries mẫu

### 1. Lấy Projects với Category filter
```typescript
const { data } = await supabase
  .from('projects')
  .select('*')
  .eq('category', selectedCategory)
  .order('sort_order', { ascending: true });
```

### 2. Lấy Featured Projects
```typescript
const { data } = await supabase
  .from('projects')
  .select('*')
  .eq('featured', true)
  .limit(3);
```

### 3. Lấy Blogs với Categories
```typescript
const { data } = await supabase
  .from('blogs')
  .select(`
    *,
    blog_categories (
      id,
      name,
      slug,
      color
    )
  `)
  .eq('published', true)
  .order('created_at', { ascending: false });
```

### 4. Lấy Products với Filtering
```typescript
const { data } = await supabase
  .from('products')
  .select(`
    *,
    product_categories (
      id,
      name,
      slug
    )
  `)
  .eq('published', true)
  .gte('price', minPrice)
  .lte('price', maxPrice)
  .order('created_at', { ascending: false });
```

### 5. Lấy Cart Items của User
```typescript
const { data } = await supabase
  .from('cart_items')
  .select(`
    *,
    products (
      id,
      name,
      price,
      image_url,
      stock_quantity
    )
  `)
  .eq('user_id', userId);
```

### 6. Tạo Order với Order Items
```typescript
// Create order
const { data: order, error: orderError } = await supabase
  .from('orders')
  .insert({
    user_id: userId,
    customer_name: name,
    customer_phone: phone,
    customer_address: address,
    total_amount: total
  })
  .select()
  .single();

// Create order items
const orderItems = cartItems.map(item => ({
  order_id: order.id,
  product_id: item.product_id,
  product_name: item.products.name,
  product_price: item.products.price,
  quantity: item.quantity,
  selected_size: item.selected_size,
  selected_color: item.selected_color
}));

const { error: itemsError } = await supabase
  .from('order_items')
  .insert(orderItems);

// Clear cart
await supabase
  .from('cart_items')
  .delete()
  .eq('user_id', userId);
```

### 7. Search Products
```typescript
const { data } = await supabase
  .from('products')
  .select('*')
  .ilike('name', `%${searchQuery}%`)
  .eq('published', true);
```

### 8. Count Contact Submissions
```typescript
const { count } = await supabase
  .from('contact_submissions')
  .select('*', { count: 'exact', head: true })
  .eq('seen', false);
```

---

## Thiết lập cho các môi trường khác nhau

### Local Development
```env
VITE_SUPABASE_URL=https://your-dev-project.supabase.co
VITE_SUPABASE_PUBLISHABLE_KEY=your-dev-anon-key
```

### Development Server (Preview)
Sử dụng biến môi trường từ Supabase project development
```bash
npm run dev
```
Ứng dụng sẽ tự động load từ `.env.local`

### Production
Trên hosting platform (Netlify, Vercel, etc.):
1. Thêm `VITE_SUPABASE_URL` và `VITE_SUPABASE_PUBLISHABLE_KEY` trong environment variables
2. Giá trị từ Supabase production project
3. Deploy ứng dụng

**Ví dụ Netlify:**
```
Build command: npm run build
Environment: Add VITE_SUPABASE_URL and VITE_SUPABASE_PUBLISHABLE_KEY
```

---

## Lưu ý quan trọng

### Security
- Luôn sử dụng RLS policies
- Không bao giờ disable RLS trên production
- Kiểm tra quyền admin qua database function `has_role()`
- Không lưu role hoặc sensitive data trong localStorage
- **Không bao giờ** commit `.env.local` hoặc environment variables chứa secrets vào git
- `VITE_SUPABASE_PUBLISHABLE_KEY` là public key, có thể expose (không phải secret)

### Performance
- Sử dụng indexes cho các cột thường xuyên query
- Limit số lượng records khi fetch
- Sử dụng pagination cho danh sách dài
- Cache kết quả queries khi có thể

### File Upload
- Validate file type và size trước khi upload
- Tạo unique filename để tránh conflict
- Compress images trước khi upload
- Sử dụng storage buckets với proper permissions

### Data Validation
- Validate input ở cả frontend và backend (RLS)
- Sử dụng TypeScript types từ `src/integrations/supabase/types.ts`
- Handle errors properly
- Luôn kiểm tra error codes, đặc biệt `PGRST116` (not found)

### Environment Setup Checklist
- [ ] Tạo Supabase project
- [ ] Copy `VITE_SUPABASE_URL` từ API settings
- [ ] Copy `VITE_SUPABASE_PUBLISHABLE_KEY` từ anon key
- [ ] Tạo `.env.local` file với 2 biến trên
- [ ] Chạy database migrations
- [ ] Tạo admin user và set role
- [ ] Test login trên `/admin`

---

## Khởi tạo Theme Tables và Seasonal Themes

### Bước 1: Tạo Tables (Chỉ chạy một lần)
1. Vào **SQL Editor** trong Supabase Dashboard
2. Chạy các SQL commands sau để tạo tables:

```sql
-- Tạo themes table
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

-- Tạo user_themes table
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
```

### Bước 2: Thêm RLS Policies cho Themes
```sql
-- Themes Policies
CREATE POLICY "Anyone can view active themes"
ON public.themes FOR SELECT
USING (is_active = true);

CREATE POLICY "Admins can view all themes"
ON public.themes FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = auth.uid() AND role = 'admin'
  )
);

CREATE POLICY "Admins can manage themes"
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

-- User Themes Policies
CREATE POLICY "Users can view their own theme preference"
ON public.user_themes FOR SELECT
TO authenticated
USING (auth.uid() = user_id);

CREATE POLICY "Users can upsert their own theme preference"
ON public.user_themes FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their theme preference"
ON public.user_themes FOR UPDATE
TO authenticated
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their theme preference"
ON public.user_themes FOR DELETE
TO authenticated
USING (auth.uid() = user_id);

CREATE POLICY "Admins can manage all user themes"
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
```

### Bước 3: Khởi tạo Seasonal Themes
```sql
-- Chèn các theme theo mùa mặc định
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
    '#FBBF24',
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
    '#F97316',
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
  );
ON CONFLICT (slug) DO NOTHING;
```

**Lưu ý**: Chỉ chạy những SQL commands này khi lần đầu tiên thiết lập theme system. Sau đó, sử dụng /admin panel để tạo hoặc cập nhật themes.

---

## Tài liệu tham khảo
- Supabase Docs: https://supabase.com/docs
- Supabase JS Client: https://supabase.com/docs/reference/javascript
- Row Level Security: https://supabase.com/docs/guides/auth/row-level-security
