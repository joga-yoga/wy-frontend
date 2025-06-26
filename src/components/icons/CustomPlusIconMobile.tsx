import React from "react";

interface CustomPlusIconMobileProps extends React.SVGProps<SVGSVGElement> {}

const CustomPlusIconMobile: React.FC<CustomPlusIconMobileProps> = (props) => {
  return (
    <svg
      width="33"
      height="33"
      viewBox="0 0 33 33"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      {...props}
    >
      <rect
        x="32.3333"
        y="32.1429"
        width="31"
        height="31"
        rx="15.5"
        transform="rotate(180 32.3333 32.1429)"
        fill="#F2F2F3"
      />
      <rect
        x="32.3333"
        y="32.1429"
        width="31"
        height="31"
        rx="15.5"
        transform="rotate(180 32.3333 32.1429)"
        stroke="#F2F2F3"
      />
      <path d="M16.8333 22.1429V11.1429" stroke="#52525B" strokeWidth="1.5" strokeLinecap="round" />
      <path d="M22.3333 16.6429H11.3333" stroke="#52525B" strokeWidth="1.5" strokeLinecap="round" />
    </svg>
  );
};

export default CustomPlusIconMobile;
