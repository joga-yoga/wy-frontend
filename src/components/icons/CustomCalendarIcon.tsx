import React from "react";

interface CustomCalendarIconProps extends React.SVGProps<SVGSVGElement> {}

const CustomCalendarIcon: React.FC<CustomCalendarIconProps> = (props) => {
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
        d="M50.3486 53.375V48.5H59.9891V53.375M50.3486 53.375V58.25H59.9891V53.375M50.3486 53.375H59.9891"
        stroke="#94A3B8"
        strokeWidth="2"
      />
      <path
        d="M15 32.0876H72.8427V68.0001C72.8427 69.7951 71.404 71.2501 69.6292 71.2501H18.2135C16.4387 71.2501 15 69.7951 15 68.0001V32.0876Z"
        stroke="#1E293B"
        strokeWidth="2"
      />
      <path
        d="M27.8539 16H18.2135C16.4387 16 15 17.4551 15 19.25V32.0875H72.8427V19.25C72.8427 17.4551 71.404 16 69.6292 16H59.9888M27.8539 16H59.9888H27.8539Z"
        fill="#F2F2F3"
      />
      <path
        d="M27.8539 16H18.2135C16.4387 16 15 17.4551 15 19.25V32.0875H72.8427V19.25C72.8427 17.4551 71.404 16 69.6292 16H59.9888H27.8539Z"
        stroke="#52525B"
        strokeWidth="2"
      />
    </svg>
  );
};

export default CustomCalendarIcon;
