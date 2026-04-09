"use client";
import { CldImage, CldImageProps } from "next-cloudinary";

export const WyImage = (props: CldImageProps) => {
  return <CldImage {...props} />;
};
