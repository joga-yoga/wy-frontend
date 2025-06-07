import React from "react";

interface CustomBurgerIconProps extends React.SVGProps<SVGSVGElement> {}

const CustomBurgerIcon: React.FC<CustomBurgerIconProps> = (props) => {
  return (
    <svg
      width="64"
      height="65"
      viewBox="0 0 64 65"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      {...props}
    >
      <rect y="0.5" width="64" height="64" rx="32" fill="#F2F2F3" />
      <path d="M21 24.5H43" stroke="black" strokeWidth="2" strokeLinecap="round" />
      <path d="M21 32.5H43" stroke="black" strokeWidth="2" strokeLinecap="round" />
      <path d="M21 40.5H43" stroke="black" strokeWidth="2" strokeLinecap="round" />
    </svg>
  );
};

export default CustomBurgerIcon;
