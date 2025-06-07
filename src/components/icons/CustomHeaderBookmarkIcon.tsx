import React from "react";

interface CustomHeaderBookmarkIconProps extends React.SVGProps<SVGSVGElement> {}

const CustomHeaderBookmarkIcon: React.FC<CustomHeaderBookmarkIconProps> = (props) => {
  return (
    <svg
      width="88"
      height="88"
      viewBox="0 0 88 88"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      {...props}
    >
      <path
        d="M43.5 13C60.897 13 75 27.103 75 44.5C75 61.897 60.897 76 43.5 76C26.103 76 12 61.897 12 44.5C12 27.103 26.103 13 43.5 13ZM42.5488 22.5244L37.9092 36.8047H19.8164L22.3057 38.6133L34.4531 47.4385L29.8135 61.7197L28.8623 64.6465L31.3525 62.8379L43.5 54.0117L55.6475 62.8379L58.1377 64.6465L57.1865 61.7197L52.5459 47.4385L64.6943 38.6133L67.1836 36.8047H49.0908L44.4512 22.5244L43.5 19.5977L42.5488 22.5244Z"
        fill="#F2F2F3"
        stroke="#F2F2F3"
        strokeWidth="2"
      />
    </svg>
  );
};

export default CustomHeaderBookmarkIcon;
