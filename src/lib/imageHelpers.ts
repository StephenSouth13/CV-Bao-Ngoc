import { supabase } from "@/integrations/supabase/client";
import { resolvePublicImageUrl } from "./utils";

export async function getSignedUrlForValue(src: string | null | undefined, bucket = "project-images", expires = 60): Promise<string | null> {
  if (!src) return null;
  const trimmed = String(src).trim();
  if (!trimmed) return null;

  // If it's already an absolute URL that is not a Supabase storage public path, just return it
  if (/^https?:\/\//i.test(trimmed) && !trimmed.includes(`/storage/v1/object/public/${bucket}/`)) return trimmed;

  // If it's a Supabase storage public URL, extract file path
  const marker = `/storage/v1/object/public/${bucket}/`;
  let filePath: string | null = null;

  if (trimmed.includes(marker)) {
    filePath = trimmed.substring(trimmed.indexOf(marker) + marker.length);
  } else if (!/^https?:\/\//i.test(trimmed) && trimmed.length > 0) {
    // It's probably a raw file path within the bucket
    filePath = trimmed;
  }

  if (!filePath) return null;

  try {
    const { data, error } = await supabase.storage.from(bucket).createSignedUrl(filePath, expires);
    if (error || !data?.signedUrl) return null;
    return data.signedUrl;
  } catch (err) {
    return null;
  }
}

export function getPublicUrlForValue(src: string | null | undefined, bucket = "project-images") {
  return resolvePublicImageUrl(src as any, bucket);
}
