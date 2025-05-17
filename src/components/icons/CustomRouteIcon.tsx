import React from "react";

interface CustomIconProps extends React.SVGProps<SVGSVGElement> {}

const CustomRouteIcon: React.FC<CustomIconProps> = (props) => (
  <svg
    width="24"
    height="24"
    viewBox="0 0 50 50"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    {...props}
  >
    <path
      d="M7 11V31.5333M7 31.5333V39M7 31.5333H25.5M25.5 31.5333V16.6H38.45C41.5153 16.6 44 19.1072 44 22.2V31.5333M25.5 31.5333H44M44 31.5333V39M19.95 22.2C19.95 20.1381 18.2935 18.4667 16.25 18.4667C14.2065 18.4667 12.55 20.1381 12.55 22.2C12.55 24.2619 14.2065 25.9333 16.25 25.9333C18.2935 25.9333 19.95 24.2619 19.95 22.2Z"
      stroke="currentColor"
      strokeWidth="1.2"
    />
  </svg>
);

export default CustomRouteIcon;
