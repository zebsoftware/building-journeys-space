import { supabase } from "@/integrations/supabase/client";
import { compressImage, type ImageProfile } from "@/lib/image-compression";

export async function uploadImage(
  file: File,
  userId: string,
  profile: ImageProfile,
): Promise<string> {
  const image = await compressImage(file, profile);
  const extensions: Record<string, string> = {
    "image/jpeg": "jpg",
    "image/png": "png",
    "image/webp": "webp",
    "image/gif": "gif",
  };
  const ext = extensions[image.type];
  if (!ext) throw new Error("Unsupported image format.");
  const path = `${userId}/${crypto.randomUUID()}.${ext}`;
  const bucket = supabase.storage.from(profile === "avatar" ? "profile-avatars" : "post-covers");
  const { error } = await bucket.upload(path, image, {
    cacheControl: "31536000",
    contentType: image.type,
    upsert: false,
  });
  if (error) throw error;
  return bucket.getPublicUrl(path).data.publicUrl;
}
