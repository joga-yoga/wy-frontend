import React from "react";

interface CustomLangIconProps extends React.SVGProps<SVGSVGElement> {}

const CustomLangIcon: React.FC<CustomLangIconProps> = (props) => {
  return (
    <svg
      width="32"
      height="33"
      viewBox="0 0 32 33"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      {...props}
    >
      <mask
        id="mask0_654_781"
        style={{ maskType: "alpha" }}
        maskUnits="userSpaceOnUse"
        x="3"
        y="4"
        width="27"
        height="24"
      >
        <path
          d="M3.19995 12.0345H12.1872V10.3494H3.19995V4.17065H29.6V27.7621H16.1191L21.1744 14.2813H20.051L15.5574 25.5153H3.19995V12.0345Z"
          fill="white"
        />
      </mask>
      <g mask="url(#mask0_654_781)">
        <path
          d="M13.3107 5.29407V8.66428M13.3107 8.66428H4.32349M13.3107 8.66428H18.366M18.366 8.66428H22.298M18.366 8.66428C17.6171 11.2856 14.2094 17.8762 6.57029 23.2685M9.37881 11.4728C10.315 13.3451 13.3107 17.9885 17.8043 21.5834"
          stroke="#71717A"
          strokeWidth="2"
        />
        <path
          d="M28.4767 28.8855L26.3703 23.2685M26.3703 23.2685L23.4214 15.4047H22.298L19.3491 23.2685M26.3703 23.2685H19.3491M17.2427 28.8855L19.3491 23.2685"
          stroke="#3F3F46"
          strokeWidth="2"
        />
      </g>
    </svg>
  );
};

export default CustomLangIcon;
