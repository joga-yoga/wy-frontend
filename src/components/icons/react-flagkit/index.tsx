/* eslint-disable @next/next/no-img-element */
// https://github.com/stephenway/react-flagkit

import React, { HTMLAttributes, JSX } from "react";

import countryCodes from "./countryCodes";

export { countryCodes };

export type CountryCode = (typeof countryCodes)[number];

export type Variants = undefined | "rounded" | "square" | "circle";

export interface FlagIconProps extends HTMLAttributes<HTMLImageElement> {
  country?: CountryCode | Omit<string, CountryCode>;
  role?: string;
  size?: number;
  alt?: string;
  className?: string;
  containerClassName?: string;
}

export const FlagIcon = ({
  country = "US",
  size = 48,
  alt,
  className,
  containerClassName,
  ...props
}: FlagIconProps): JSX.Element | null => {
  if (!country) return null;

  const countryCode = country.toUpperCase();
  if (countryCodes.find((el) => el === country) !== undefined) {
    const jsDelivr = "https://cdn.jsdelivr.net/gh/madebybowtie/FlagKit@2.4/Assets/SVG";
    const flagSrc = `${jsDelivr}/${countryCode}.svg`;
    return (
      <img
        src={flagSrc}
        role="img"
        alt={alt || `${countryCode} Flag`}
        height={size}
        width={size}
        {...props}
      />
    );
  }
  return <span>{countryCode}</span>;
};
