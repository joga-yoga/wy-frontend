import Image from "next/image";

import { WyImage } from "@/components/custom/WyImage";

/** Catalogue artwork is served locally; studio uploads are Cloudinary IDs. */
export function SportCardImage({
  src,
  alt,
  width,
  height,
  className,
}: {
  src: string;
  alt: string;
  width: number;
  height: number;
  className?: string;
}) {
  const props = { src, alt, width, height, className };
  return src.startsWith("/images/cards/") ? <Image {...props} /> : <WyImage {...props} />;
}
