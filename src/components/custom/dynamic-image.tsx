import Image, { ImageProps } from "next/image";
import { useEffect, useState } from "react";

import { getImageBlurDataURL, getImageUrl } from "@/app/(events)/events/[eventId]/helpers";
import { cn } from "@/lib/utils";

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
  const [base64, setBase64] = useState<string | null>(null);
  useEffect(() => {
    (async () => {
      const blurDataURL = await getImageBlurDataURL(imageId);
      setBase64(blurDataURL);
    })();
  }, [imageId]);

  if (!imageId || !base64) return null;
  return (
    <div className={cn("relative", containerClass)}>
      <Image
        alt={alt || ""}
        src={getImageUrl(imageId)}
        placeholder="blur"
        blurDataURL={base64}
        width={0}
        height={0}
        sizes="100vw"
        objectFit="cover"
        className={cn("w-full h-auto object-cover", className)}
        {...props}
      />
    </div>
  );
};
