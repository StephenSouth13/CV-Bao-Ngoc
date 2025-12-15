-- Create settings table
create table if not exists public.settings (
  key text primary key,
  value text,
  created_at timestamptz default now(),
  updated_at timestamptz
);

-- Create social_links table
create table if not exists public.social_links (
  id uuid primary key default gen_random_uuid(),
  provider text not null,
  url text not null,
  sort_order int not null default 0,
  created_at timestamptz default now(),
  updated_at timestamptz
);

-- Create footer_links table
create table if not exists public.footer_links (
  id uuid primary key default gen_random_uuid(),
  section text not null,
  label text not null,
  url text not null,
  sort_order int not null default 0,
  created_at timestamptz default now(),
  updated_at timestamptz
);

-- Create contact_submissions table to store messages from /contact
create table if not exists public.contact_submissions (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  email text not null,
  phone text,
  message text,
  created_at timestamptz default now(),
  seen boolean default false
);


-- grant minimal select/insert/delete permissions to anon/public if required (skip if using Row Level Security and Supabase policies)
-- grant select on public.social_links to public;
-- grant select on public.footer_links to public;
-- grant insert on public.contact_submissions to public;

-- End of migration
