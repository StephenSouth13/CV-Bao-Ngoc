import { createClient } from '@supabase/supabase-js';

// Usage:
// Set env variables SUPABASE_URL and SUPABASE_SERVICE_ROLE (or use existing VITE_SUPABASE_* vars)
// Run with: node -r dotenv/config scripts/backfill-slugs.ts

const SUPABASE_URL = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL;
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE || process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.VITE_SUPABASE_PUBLISHABLE_KEY;

if (!SUPABASE_URL || !SUPABASE_KEY) {
  console.error('Please set SUPABASE_URL and SUPABASE_SERVICE_ROLE (or VITE_SUPABASE_*) env vars');
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY as string);

const slugify = (s: string) =>
  s
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-');

async function ensureUnique(base: string) {
  let candidate = base;
  let i = 0;
  while (true) {
    const { data, error } = await supabase.from('projects').select('id').eq('slug', candidate).limit(1).maybeSingle();
    if (error) throw error;
    if (!data) return candidate;
    i += 1;
    candidate = `${base}-${i}`;
  }
}

async function main() {
  try {
    const { data: projects, error } = await supabase.from('projects').select('id, title, slug');
    if (error) throw error;
    if (!projects || projects.length === 0) {
      console.log('No projects found');
      return;
    }

    for (const p of projects) {
      if (p.slug) continue; // skip if already has slug
      const base = slugify(p.title || `project-${p.id}`);
      const unique = await ensureUnique(base);
      const { error: upErr } = await supabase.from('projects').update({ slug: unique }).eq('id', p.id);
      if (upErr) {
        console.error('Failed to update', p.id, upErr);
      } else {
        console.log('Updated', p.id, '->', unique);
      }
    }

    console.log('Backfill completed');
  } catch (e) {
    console.error('Error', e);
  }
}

main();
