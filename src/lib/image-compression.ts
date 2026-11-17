const MB = 1024 * 1024;
const rasterTypes = ["image/jpeg", "image/png", "image/webp"];

export const imageProfiles = {
  cover: { maxSide: 1600, target: 260 * 1024, uploadLimit: 5 * MB },
  inline: { maxSide: 1200, target: 200 * 1024, uploadLimit: 5 * MB },
  avatar: { maxSide: 384, target: 55 * 1024, uploadLimit: 2 * MB },
} as const;

export type ImageProfile = keyof typeof imageProfiles;

export function validateImage(file: File, profile: ImageProfile) {
  const gif = file.type === "image/gif" && profile !== "avatar";
  if (!rasterTypes.includes(file.type) && !gif) {
    throw new Error(
      profile === "avatar"
        ? "Choose a JPG, PNG, or WebP image."
        : "Choose a JPG, PNG, WebP, or GIF image.",
    );
  }
  if (!file.size || file.size > (gif ? 5 : 15) * MB) {
    throw new Error(
      gif ? "GIFs must be 5 MB or smaller." : "Choose a non-empty image no larger than 15 MB.",
    );
  }
}

// Preserve animated WebP and PNG instead of silently reducing them to one frame.
async function isAnimated(file: File) {
  if (file.type !== "image/png" && file.type !== "image/webp") return false;
  const view = new DataView(await file.arrayBuffer());
  const webp = file.type === "image/webp";
  for (let offset = webp ? 12 : 8; offset + 8 <= view.byteLength;) {
    const type = view.getUint32(offset + (webp ? 0 : 4));
    if (type === 0x6163544c || type === 0x414e494d) return true; // acTL / ANIM
    if (type === 0x49444154) return false; // PNG image data follows its animation control.
    const bytes = view.getUint32(offset + (webp ? 4 : 0), webp);
    offset += 8 + bytes + (webp ? bytes % 2 : 4);
  }
  return false;
}

async function loadImage(
  file: File,
): Promise<{ image: CanvasImageSource; width: number; height: number; close: () => void }> {
  if (typeof createImageBitmap === "function") {
    try {
      const bitmap = await createImageBitmap(file);
      return {
        image: bitmap,
        width: bitmap.width,
        height: bitmap.height,
        close: () => bitmap.close(),
      };
    } catch {
      // Try the browser's image decoder if the bitmap decoder cannot load it.
    }
  }
  const url = URL.createObjectURL(file);
  const image = new Image();
  try {
    image.src = url;
    await image.decode();
    return {
      image,
      width: image.naturalWidth,
      height: image.naturalHeight,
      close: () => URL.revokeObjectURL(url),
    };
  } catch {
    URL.revokeObjectURL(url);
    throw new Error("This image could not be opened. Try exporting it again.");
  }
}

export async function compressImage(file: File, profile: ImageProfile): Promise<Blob> {
  validateImage(file, profile);
  const { maxSide, target, uploadLimit } = imageProfiles[profile];
  if (file.type === "image/gif" || (await isAnimated(file))) {
    if (file.size > uploadLimit) throw new Error("This animated image exceeds the upload limit.");
    return file;
  }
  const source = await loadImage(file);
  const canvas = document.createElement("canvas");
  try {
    const ratio = Math.min(1, maxSide / Math.max(source.width, source.height));
    if (ratio === 1 && file.size <= target) return file;
    const context = canvas.getContext("2d");
    if (!context) throw new Error("Image resizing isn't available in this browser.");
    let best: Blob | undefined;
    for (const [scale, quality] of [
      [1, 0.82],
      [1, 0.68],
      [0.8, 0.68],
      [0.65, 0.64],
    ] as const) {
      canvas.width = Math.max(1, Math.round(source.width * ratio * scale));
      canvas.height = Math.max(1, Math.round(source.height * ratio * scale));
      context.imageSmoothingQuality = "high";
      context.drawImage(source.image, 0, 0, canvas.width, canvas.height);
      const output = await new Promise<Blob | null>((resolve) =>
        canvas.toBlob(resolve, "image/webp", quality),
      );
      // Browsers without WebP encoding may return PNG. Prefer an original
      // that's already suitably sized over an output that makes it larger.
      if (output && rasterTypes.includes(output.type)) {
        if (!best || output.size < best.size) best = output;
        if (output.size <= target) break;
      }
    }
    if (ratio === 1 && file.size <= uploadLimit && (!best || best.size >= file.size)) return file;
    if (best && best.size <= uploadLimit) return best;
    if (file.size <= uploadLimit && !best) return file;
    throw new Error("This image is still too large after compression. Try a smaller image.");
  } finally {
    source.close();
    canvas.width = canvas.height = 1;
  }
}
