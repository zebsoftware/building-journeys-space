
import { supabase } from "@/integrations/supabase/client";

export async function uploadCoverImage(
  file: File,
  userId: string
): Promise<string> {
  const allowed = [
    "image/jpeg",
    "image/png",
    "image/webp",
    "image/gif",
  ];

  if (
    !allowed.includes(file.type) ||
    file.size > 5 * 1024 * 1024
  ) {
    throw new Error(
      "Choose a JPG, PNG, WebP, or GIF image under 5 MB."
    );
  }

  const extensions: Record<string, string> = {
    "image/jpeg": "jpg",
    "image/png": "png",
    "image/webp": "webp",
    "image/gif": "gif",
  };

  const path = `${userId}/${crypto.randomUUID()}.${extensions[file.type]}`;

  const { error } = await supabase.storage
    .from("post-covers")
    .upload(path, file, {
      cacheControl: "3600",
      contentType: file.type,
      upsert: false,
    });

  if (error) throw error;

  const { data } = supabase.storage
    .from("post-covers")
    .getPublicUrl(path);

  return data.publicUrl;
}
