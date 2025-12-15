-- Add slug column to projects
ALTER TABLE public.projects
ADD COLUMN IF NOT EXISTS slug TEXT;

-- Optional: add unique constraint
-- ALTER TABLE public.projects
-- ADD CONSTRAINT projects_slug_unique UNIQUE (slug);

-- Note: If you add UNIQUE constraint and any existing duplicate slugs exist, this will fail.
