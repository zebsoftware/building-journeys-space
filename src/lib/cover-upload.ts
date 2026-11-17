import { supabase } from "@/integrations/supabase/client";
type ImageProfile = "cover" | "inline" | "avatar";

export function validateImage(file: File, profile: ImageProfile) {
  const avatar = profile === "avatar";
  const allowed = ["image/jpeg", "image/png", "image/webp"];
  if (!avatar) allowed.push("image/gif");
  const limit = avatar ? 2 : 5;
  if (!allowed.includes(file.type) || !file.size || file.size > limit * 1024 * 1024) {
    throw new Error(`Choose a JPG, PNG, WebP${avatar ? "" : ", or GIF"} image up to ${limit} MB.`);
  }
}

export async function uploadImage(
  file: File,
  userId: string,
  profile: ImageProfile,
): Promise<string> {
  validateImage(file, profile);
  const extensions: Record<string, string> = {
    "image/jpeg": "jpg",
    "image/png": "png",
    "image/webp": "webp",
    "image/gif": "gif",
  };
  const ext = extensions[file.type];
  if (!ext) throw new Error("Unsupported image format.");
  const path = `${userId}/${crypto.randomUUID()}.${ext}`;
  const bucket = supabase.storage.from(profile === "avatar" ? "profile-avatars" : "post-covers");
  const { error } = await bucket.upload(path, file, {
    cacheControl: "31536000",
    contentType: file.type,
    upsert: false,
  });
  if (error) throw error;
  return bucket.getPublicUrl(path).data.publicUrl;
}

export function uploadCoverImage(file: File, userId: string) {
  return uploadImage(file, userId, "cover");
}
