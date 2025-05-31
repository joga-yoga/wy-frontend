import React from "react";

interface ActiveBookmarkIconProps extends React.SVGProps<SVGSVGElement> {}

const ActiveBookmarkIcon: React.FC<ActiveBookmarkIconProps> = (props) => {
  return (
    <svg
      width="46"
      height="46"
      viewBox="0 0 46 46"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      {...props}
    >
      <path
        fillRule="evenodd"
        clipRule="evenodd"
        d="M23 45C35.1503 45 45 35.1503 45 23C45 10.8497 35.1503 1 23 1C10.8497 1 1 10.8497 1 23C1 35.1503 10.8497 45 23 45ZM26.2929 18.4678L23 8.33333L19.7071 18.4678H9.05117L17.672 24.7312L14.3792 34.8656L23 28.6022L31.6209 34.8656L28.328 24.7312L36.9488 18.4678H26.2929Z"
        fill="#313C42"
      />
      <path
        d="M23 8.33333L26.2929 18.4678H36.9488L28.328 24.7312L31.6209 34.8656L23 28.6022L14.3792 34.8656L17.672 24.7312L9.05117 18.4678H19.7071L23 8.33333Z"
        fill="#11C932"
      />
      <path
        fillRule="evenodd"
        clipRule="evenodd"
        d="M23 45C35.1503 45 45 35.1503 45 23C45 10.8497 35.1503 1 23 1C10.8497 1 1 10.8497 1 23C1 35.1503 10.8497 45 23 45ZM26.2929 18.4678L23 8.33333L19.7071 18.4678H9.05117L17.672 24.7312L14.3792 34.8656L23 28.6022L31.6209 34.8656L28.328 24.7312L36.9488 18.4678H26.2929Z"
        stroke="white"
      />
      <path
        d="M23 8.33333L26.2929 18.4678H36.9488L28.328 24.7312L31.6209 34.8656L23 28.6022L14.3792 34.8656L17.672 24.7312L9.05117 18.4678H19.7071L23 8.33333Z"
        stroke="white"
      />
    </svg>
  );
};

export default ActiveBookmarkIcon;
