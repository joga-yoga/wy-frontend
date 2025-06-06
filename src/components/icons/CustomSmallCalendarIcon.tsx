import React from "react";

interface CustomSmallCalendarIconProps extends React.SVGProps<SVGSVGElement> {}

const CustomSmallCalendarIcon: React.FC<CustomSmallCalendarIconProps> = (props) => {
  return (
    <svg
      width="29"
      height="29"
      viewBox="0 0 29 29"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      {...props}
    >
      <path
        d="M16.6211 17.5109V15.9019H19.8029V17.5109M16.6211 17.5109V19.1199H19.8029V17.5109M16.6211 17.5109H19.8029"
        stroke="#3F3F46"
      />
      <path
        d="M4 10.4965H25V23.3346C25 23.9763 24.4777 24.4965 23.8333 24.4965H5.16667C4.52234 24.4965 4 23.9763 4 23.3346V10.4965Z"
        stroke="#3F3F46"
        strokeWidth="2"
      />
      <path
        d="M8.66667 4.50354H5.16667C4.52234 4.50354 4 5.04559 4 5.71423V10.4965H25V5.71423C25 5.04559 24.4777 4.50354 23.8333 4.50354H20.3333M8.66667 4.50354H20.3333H8.66667Z"
        fill="#E4E4E7"
      />
      <path
        d="M8.66667 4.50354H5.16667C4.52234 4.50354 4 5.04559 4 5.71423V10.4965H25V5.71423C25 5.04559 24.4777 4.50354 23.8333 4.50354H20.3333H8.66667Z"
        stroke="#71717A"
        strokeWidth="2"
      />
    </svg>
  );
};

export default CustomSmallCalendarIcon;
