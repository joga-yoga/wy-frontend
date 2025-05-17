import React from "react";

interface CustomIconProps extends React.SVGProps<SVGSVGElement> {}

const IncludedCustomIcon: React.FC<CustomIconProps> = (props) => (
  <svg
    width="24"
    height="24"
    viewBox="0 0 50 50"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    {...props}
  >
    <path
      fillRule="evenodd"
      clipRule="evenodd"
      d="M42 6C43.1046 6 44 6.89543 44 8V41C44 42.1046 43.1046 43 42 43H9C7.89543 43 7 42.1046 7 41V8C7 6.89543 7.89543 6 9 6H42ZM7.94871 6.94871H43.0513V42.0513H7.94871V6.94871Z"
      fill="currentColor"
    />
    <path
      fillRule="evenodd"
      clipRule="evenodd"
      d="M43 42.1951L7.80488 7H43V42.1951ZM32.0731 20.5367H33.0731V16.9268H36.6829V15.9268H33.0731V12.4146H32.0731V15.9268H28.5608V16.9268H32.0731V20.5367Z"
      fill="currentColor"
    />
    <line
      y1="-0.5"
      x2="8.12195"
      y2="-0.5"
      transform="matrix(-1 0 0 1 22.3418 33.0732)"
      stroke="currentColor"
    />
  </svg>
);

export default IncludedCustomIcon;
