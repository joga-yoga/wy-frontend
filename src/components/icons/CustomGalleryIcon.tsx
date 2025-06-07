import React from "react";

interface CustomGalleryIconProps extends React.SVGProps<SVGSVGElement> {}

const CustomGalleryIcon: React.FC<CustomGalleryIconProps> = (props) => {
  return (
    <svg
      width="18"
      height="16"
      viewBox="0 0 18 16"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      {...props}
    >
      <path
        d="M4.66667 2.75H1.33333C0.8731 2.75 0.5 3.1231 0.5 3.58333V14.4167C0.5 14.8769 0.8731 15.25 1.33333 15.25H14.6667C15.1269 15.25 15.5 14.8769 15.5 14.4167V3.58333C15.5 3.1231 15.1269 2.75 14.6667 2.75H11.3333M4.66667 2.75H11.3333Z"
        stroke="#52525B"
      />
      <path
        d="M2.5 2.25V1.58333C2.5 1.1231 2.8731 0.75 3.33333 0.75H6.66667H13.3333H16.6667C17.1269 0.75 17.5 1.1231 17.5 1.58333V12.4167C17.5 12.8769 17.1269 13.25 16.6667 13.25H16"
        stroke="#52525B"
      />
      <path
        d="M2.16675 11.9166L6.83342 6.08331L9.66675 9.7954L10.9167 8.20456L13.8334 11.9166H8.00008H2.16675Z"
        fill="#D4D4D8"
      />
    </svg>
  );
};

export default CustomGalleryIcon;
