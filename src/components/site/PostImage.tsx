import { useState, type ComponentProps } from "react";
import { canOptimizeCover, imageOptimization, optimizedImageUrl } from "@/lib/image-delivery";

type Props = Omit<ComponentProps<"img">, "src" | "srcSet" | "onError"> & {
  src: string;
  variant?: "thumbnail" | "card" | "article";
};

declare const __VERCEL_IMAGE_OPTIMIZATION__: boolean;

export function PostImage({ src, variant = "card", sizes, ...props }: Props) {
  const [failedSource, setFailedSource] = useState<string>();
  const candidates = imageOptimization.sizes.slice(
    0,
    variant === "article" ? 4 : variant === "thumbnail" ? 1 : 3,
  );
  const optimized = __VERCEL_IMAGE_OPTIMIZATION__ && failedSource !== src && canOptimizeCover(src);

  return (
    <img
      decoding="async"
      {...props}
      src={optimized ? optimizedImageUrl(src, candidates.at(-1)!) : src}
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
