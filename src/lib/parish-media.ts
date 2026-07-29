import { supabase } from "@/integrations/supabase/client";

export const MEDIA_BUCKET = "parish-media";

export async function uploadMedia(file: File, folder: string): Promise<string> {
  const ext = file.name.split(".").pop() ?? "jpg";
  const path = `${folder}/${crypto.randomUUID()}.${ext}`;
  const { error } = await supabase.storage
    .from(MEDIA_BUCKET)
    .upload(path, file, { contentType: file.type, upsert: false });
  if (error) throw error;
  return path;
}

export async function signedMediaUrl(path: string | null): Promise<string | null> {
  if (!path) return null;
  if (path.startsWith("http")) return path;
  const { data } = await supabase.storage.from(MEDIA_BUCKET).createSignedUrl(path, 3600);
  return data?.signedUrl ?? null;
}