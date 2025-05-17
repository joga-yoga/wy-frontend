import React from "react";

interface CustomIconProps extends React.SVGProps<SVGSVGElement> {}

const CustomAnalyticsIcon: React.FC<CustomIconProps> = (props) => (
  <svg
    width="24"
    height="24"
    viewBox="0 0 50 50"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    {...props}
  >
    <path
      d="M26.0002 6.25H42.6669C43.8175 6.25 44.7502 7.18275 44.7502 8.33333V41.6667C44.7502 42.8173 43.8175 43.75 42.6669 43.75H9.33358C8.18299 43.75 7.25024 42.8173 7.25024 41.6667V25M13.5003 4.16669V20.8334M21.8337 12.5H5.16699M11.417 35.4166L23.0837 20.8333L30.167 30.1135L33.292 26.1364L40.5837 35.4166H11.417Z"
      stroke="currentColor"
      strokeWidth="1.2"
    />
  </svg>
);

export default CustomAnalyticsIcon;
