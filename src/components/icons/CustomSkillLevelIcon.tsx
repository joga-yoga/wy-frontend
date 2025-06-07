import React from "react";

interface CustomSkillLevelIconProps extends React.SVGProps<SVGSVGElement> {}

const CustomSkillLevelIcon: React.FC<CustomSkillLevelIconProps> = (props) => {
  return (
    <svg
      width="32"
      height="33"
      viewBox="0 0 32 33"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      {...props}
    >
      <g clipPath="url(#clip0_654_773)">
        <path
          d="M17.3333 6.83736C17.3333 7.57374 16.7364 8.1707 16 8.1707C15.2636 8.1707 14.6667 7.57374 14.6667 6.83736C14.6667 6.10099 15.2636 5.50403 16 5.50403C16.7364 5.50403 17.3333 6.10099 17.3333 6.83736Z"
          fill="#334155"
        />
        <path
          d="M10 10.8374V20.1707M22 10.8374V20.1707M17.3333 6.83736C17.3333 7.57374 16.7364 8.1707 16 8.1707C15.2636 8.1707 14.6667 7.57374 14.6667 6.83736C14.6667 6.10099 15.2636 5.50403 16 5.50403C16.7364 5.50403 17.3333 6.10099 17.3333 6.83736Z"
          stroke="#334155"
          strokeWidth="2"
        />
        <path
          d="M14 29.504V12.1707H16M16 12.1707H18V29.504M16 12.1707V20.1707"
          stroke="#71717A"
          strokeWidth="2"
        />
      </g>
      <defs>
        <clipPath id="clip0_654_773">
          <rect y="0.170715" width="32" height="32" rx="6" fill="white" />
        </clipPath>
      </defs>
    </svg>
  );
};

export default CustomSkillLevelIcon;
