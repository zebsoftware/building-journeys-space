const STORAGE_HOST = "ygqonurswpnwwqxfbjpq.supabase.co";
const publicImagePath =
  "^/storage/v1/object/public/(post-covers|profile-avatars)/[0-9a-f-]{36}/[0-9a-f-]{36}\\.(jpg|jpeg|png|webp)$";

// Keep the optimizer limited to this project's public, immutable image files.
export const imageOptimization = {
  sizes: [96, 192, 256, 480, 768, 1200, 1600],
  domains: [],
  localPatterns: [],
  formats: ["image/webp" as const],
  qualities: [82],
  minimumCacheTTL: 86400,
  remotePatterns: [
    {
      protocol: "https" as const,
      hostname: "^" + STORAGE_HOST.replaceAll(".", "\\.") + "$",
      pathname: publicImagePath,
      search: "",
    },
  ],
};

export function canOptimizeImage(src: string) {
  try {
    const url = new URL(src);
    return (
      url.origin === `https://${STORAGE_HOST}` &&
      !url.username &&
      !url.password &&
      !url.search &&
      !url.hash &&
      new RegExp(publicImagePath).test(url.pathname)
    );
  } catch {
    return false;
  }
}

export function optimizedImageUrl(src: string, width: number) {
  return `/_vercel/image?${new URLSearchParams({ url: src, w: String(width), q: "82" })}`;
}
