import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function resolvePublicImageUrl(src: string | null | undefined, bucket = 'project-images') {
  if (!src) return null;
  const trimmed = String(src).trim();
  if (!trimmed) return null;
  // already an absolute url
  if (/^https?:\/\//i.test(trimmed) || /^\/\//.test(trimmed)) return trimmed;

  // if it's already a storage path starting with /storage, prepend SUPABASE_URL
  const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL as string;
  if (trimmed.startsWith('/storage')) return `${SUPABASE_URL}${trimmed}`;

  // otherwise assume it's a file path within a public bucket
  return `${SUPABASE_URL}/storage/v1/object/public/${bucket}/${trimmed}`;
}
