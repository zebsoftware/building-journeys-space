import { useEffect, useRef, useState, type ComponentProps } from "react";
import { canOptimizeImage, optimizedImageUrl } from "@/lib/image-delivery";

type Props = Omit<ComponentProps<"img">, "src" | "srcSet" | "onError"> & {
  src: string;
  variant?: "thumbnail" | "card" | "article" | "avatar";
};

declare const __VERCEL_IMAGE_OPTIMIZATION__: boolean;

const widths = {
  avatar: [96, 192, 256],
  thumbnail: [256],
  card: [256, 480, 768, 1200],
  article: [480, 768, 1200, 1600],
} as const;

export function PostImage({ src, variant = "card", sizes, ...props }: Props) {
  const [failedSource, setFailedSource] = useState<string>();
  const imageRef = useRef<HTMLImageElement>(null);
  const candidates = widths[variant];
  const optimized = __VERCEL_IMAGE_OPTIMIZATION__ && failedSource !== src && canOptimizeImage(src);

  // An eager server-rendered image can fail before React attaches onError.
  useEffect(() => {
    const image = imageRef.current;
    if (optimized && image?.complete && image.currentSrc && !image.naturalWidth) {
      setFailedSource(src);
    }
  }, [optimized, src]);

  return (
    <img
      decoding="async"
      {...props}
      ref={imageRef}
      src={src}
      srcSet={
        optimized
          ? candidates.map((w) => `${optimizedImageUrl(src, w)} ${w}w`).join(", ")
          : undefined
      }
      sizes={optimized ? sizes : undefined}
      onError={optimized ? () => setFailedSource(src) : undefined}
    />
  );
}
