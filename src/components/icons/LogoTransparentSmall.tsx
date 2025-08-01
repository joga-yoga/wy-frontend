import React from "react";

interface LogoSmallProps extends React.SVGProps<SVGSVGElement> {}

const LogoSmall: React.FC<LogoSmallProps> = (props) => (
  <svg
    width="64"
    height="64"
    viewBox="0 0 64 64"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    {...props}
  >
    <g clipPath="url(#clip0_2006_1027)">
      <path
        d="M26.3784 16.8122C27.028 17.5732 28.3978 20.2322 29.5378 22.8379C31.7527 27.9516 32.6321 29.2219 33.9675 29.2219C35.2052 29.2219 36.3126 27.919 37.7783 24.727C40.7423 18.2779 41.2309 17.3008 42.0452 16.4214C42.9898 15.4442 44.1298 15.2488 44.4229 16.0305C44.9766 17.4311 42.5338 23.8476 37.4852 34.4333C33.2501 43.5858 30.5801 47.4618 28.9841 47.4618C27.9501 47.3808 27.7071 46.3278 28.7235 44.6281C31.5247 39.091 31.1664 35.899 26.639 25.183C24.2242 19.6791 23.4795 16.9425 23.8053 16.0631C24.1635 15.1837 25.2384 15.4768 26.3784 16.8122Z"
        fill="currentColor"
      />
      <path
        d="M25.2344 45.6328C25.2344 47.2163 23.9507 48.5 22.3672 48.5C20.7837 48.5 19.5 47.2163 19.5 45.6328C19.5 44.0493 20.7837 42.7656 22.3672 42.7656C23.9507 42.7656 25.2344 44.0493 25.2344 45.6328Z"
        fill="currentColor"
      />
    </g>
    <defs>
      <clipPath id="clip0_2006_1027">
        <rect width="25" height="33" fill="white" transform="translate(19.5 15.5)" />
      </clipPath>
    </defs>
  </svg>
);

export default LogoSmall;
