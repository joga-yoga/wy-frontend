import React from "react";

interface CustomIconProps extends React.SVGProps<SVGSVGElement> {}

const CustomLinkIcon: React.FC<CustomIconProps> = (props) => (
  <svg
    width="24"
    height="24"
    viewBox="0 0 50 50"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    {...props}
  >
    <path
      d="M33.8392 27.9463L39.7317 22.0535C42.9861 18.7993 42.9861 13.5229 39.7317 10.2685C36.4773 7.01415 31.2008 7.01415 27.9465 10.2685L22.054 16.1611M27.9465 33.8388L22.054 39.7312C18.7996 42.9856 13.5233 42.9856 10.2689 39.7312C7.01453 36.4769 7.01453 31.2006 10.2689 27.9463L16.1614 22.0535M32.3661 17.6342L17.6346 32.3656"
      stroke="currentColor"
      strokeWidth="1.2"
    />
  </svg>
);

export default CustomLinkIcon;
