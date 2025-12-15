-- Add unique index on slug column (allows multiple NULLs)
CREATE UNIQUE INDEX IF NOT EXISTS projects_slug_unique ON public.projects (slug);

-- Note: ensure slug values are unique before running this, otherwise index creation will fail.
