import Image, { ImageProps } from "next/image";
import { useEffect, useState } from "react";

import { getImageBlurDataURL, getImageUrl } from "@/app/retreats/retreats/[slug]/helpers";
import { cn } from "@/lib/utils";

// https://image-component.nextjs.gallery/color
// https://github.com/vercel/next.js/blob/canary/examples/image-component/app/color/page.tsx
// Pixel GIF code adapted from https://stackoverflow.com/a/33919020/266535
const keyStr = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/=";

const triplet = (e1: number, e2: number, e3: number) =>
  keyStr.charAt(e1 >> 2) +
  keyStr.charAt(((e1 & 3) << 4) | (e2 >> 4)) +
  keyStr.charAt(((e2 & 15) << 2) | (e3 >> 6)) +
  keyStr.charAt(e3 & 63);

const rgbDataURL = (r: number, g: number, b: number) =>
  `data:image/gif;base64,R0lGODlhAQABAPAA${
    triplet(0, r, g) + triplet(b, 255, 255)
  }/yH5BAAAAAAALAAAAAABAAEAAAICRAEAOw==`;

export const DynamicCloudinaryImage = ({
  imageId,
  alt,
  containerClass,
  className,
  ...props
}: Omit<ImageProps, "src"> & {
  imageId: string;
  alt?: string;
  containerClass?: string;
}) => {
  // const [base64, setBase64] = useState<string | null>(null);
  // useEffect(() => {
  //   (async () => {
  //     const blurDataURL = await getImageBlurDataURL(imageId);
  //     setBase64(blurDataURL);
  //   })();
  // }, [imageId]);

  // if (!imageId || !base64) return null;
  if (!imageId) return null;
  return (
    <div className={cn("relative", containerClass)}>
      <Image
        alt={alt || ""}
        src={getImageUrl(imageId)}
        placeholder="blur"
        blurDataURL={rgbDataURL(235, 235, 235)}
        width={0}
        height={0}
        sizes="100vw"
        className={cn("w-full h-auto object-cover", className)}
        {...props}
      />
    </div>
  );
};
