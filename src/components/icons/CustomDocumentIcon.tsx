import React from "react";

interface CustomIconProps extends React.SVGProps<SVGSVGElement> {}

const CustomDocumentIcon: React.FC<CustomIconProps> = (props) => (
  <svg
    width="24"
    height="24"
    viewBox="0 0 50 50"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    {...props}
  >
    <path
      d="M44 19.695V11.4C44 10.2402 43.0797 9.3 41.9444 9.3H35.7778M44 19.695H7M44 19.695V42.9C44 44.0598 43.0797 45 41.9444 45H9.05556C7.92031 45 7 44.0598 7 42.9V19.695M35.7778 9.3H15.2222M35.7778 9.3V3M7 19.695V11.4C7 10.2402 7.92031 9.3 9.05556 9.3H15.2222M15.2222 9.3V3M37.8333 38.7H27.5556V30.3H37.8333V38.7Z"
      stroke="currentColor"
      strokeWidth="1.2"
    />
  </svg>
);

export default CustomDocumentIcon;
