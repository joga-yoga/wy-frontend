import React from "react";

interface CustomIconProps extends React.SVGProps<SVGSVGElement> {}

const CustomChatIcon: React.FC<CustomIconProps> = (props) => (
  <svg
    width="24"
    height="24"
    viewBox="0 0 50 50"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    {...props}
  >
    <path
      d="M41.9444 8.33334H9.05556C7.92031 8.33334 7 9.26609 7 10.4167V33.3333V41.2331C7 41.4079 7.19937 41.505 7.33397 41.3958L14.7083 35.4167H41.9444C43.0797 35.4167 44 34.484 44 33.3333V10.4167C44 9.26609 43.0797 8.33334 41.9444 8.33334Z"
      stroke="currentColor"
      strokeWidth="1.2"
    />
    <path
      d="M15.2217 14.5833L21.3883 21.875L15.2217 28.125"
      stroke="currentColor"
      strokeWidth="1.2"
    />
    <path d="M25.5 28.125H35.7778" stroke="currentColor" />
  </svg>
);

export default CustomChatIcon;
