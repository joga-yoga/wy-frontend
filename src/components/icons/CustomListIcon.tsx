import React from "react";

interface CustomIconProps extends React.SVGProps<SVGSVGElement> {}

const CustomListIcon: React.FC<CustomIconProps> = (props) => (
  <svg
    width="24"
    height="24"
    viewBox="0 0 50 50"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    {...props}
  >
    <path
      d="M10.4688 10H44M7 16H44M7 22H44M7 28H44M7 34H44M7 40H44"
      stroke="currentColor"
      strokeWidth="1.2"
    />
  </svg>
);

export default CustomListIcon;
