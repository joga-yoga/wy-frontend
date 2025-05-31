import React from "react";

interface FlagIconProps extends React.SVGProps<SVGSVGElement> {
  // Props for consistency if other flags are added later
}

const PolandFlagIcon: React.FC<FlagIconProps> = (props) => {
  return (
    <svg
      width="44"
      height="44"
      viewBox="0 0 44 44"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      {...props} // Spread props for className, etc.
    >
      <g clipPath="url(#clip0_772_4547)">
        <path fillRule="evenodd" clipRule="evenodd" d="M44 44H0V0H44V44Z" fill="white" />
        <path fillRule="evenodd" clipRule="evenodd" d="M44 44H0V22H44V44Z" fill="#DC143C" />
      </g>
      <defs>
        <clipPath id="clip0_772_4547">
          <rect width="44" height="44" fill="white" />
        </clipPath>
      </defs>
    </svg>
  );
};

export default PolandFlagIcon;
