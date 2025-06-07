import React from "react";

interface CustomLocationIconProps extends React.SVGProps<SVGSVGElement> {}

const CustomLocationIcon: React.FC<CustomLocationIconProps> = (props) => {
  return (
    <svg
      width="32"
      height="33"
      viewBox="0 0 32 33"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      {...props}
    >
      <g clipPath="url(#clip0_87_482)">
        <g clipPath="url(#clip1_87_482)">
          <path
            d="M15.5117 10.0723V15.119M15.5117 23.5303V38.6707M9.91176 11.0819V2.67065H26.3824L30.5 6.8763L26.3824 11.0819H9.91176ZM23.0882 24.5397V16.1284H6.61765L2.5 20.334L6.61765 24.5397H23.0882Z"
            stroke="#71717A"
            strokeWidth="2"
          />
          <mask
            id="mask0_87_482"
            style={{ maskType: "alpha" }}
            maskUnits="userSpaceOnUse"
            x="0"
            y="12"
            width="26"
            height="25"
          >
            <rect x="0.5" y="12.6707" width="25" height="24" fill="#D9D9D9" />
          </mask>
          <g mask="url(#mask0_87_482)">
            <path
              d="M15.5117 10.0723V15.119M15.5117 23.5303V38.6707M9.91176 11.0819V2.67065H26.3824L30.5 6.8763L26.3824 11.0819H9.91176ZM23.0882 24.5397V16.1284H6.61765L2.5 20.334L6.61765 24.5397H23.0882Z"
              stroke="#3F3F46"
              strokeWidth="2"
            />
          </g>
        </g>
      </g>
      <defs>
        <clipPath id="clip0_87_482">
          <rect y="0.170654" width="32" height="32" rx="6" fill="white" />
        </clipPath>
        <clipPath id="clip1_87_482">
          <rect x="0.5" y="0.670654" width="32" height="32" rx="6" fill="white" />
        </clipPath>
      </defs>
    </svg>
  );
};

export default CustomLocationIcon;
