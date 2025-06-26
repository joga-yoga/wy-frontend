import React from "react";

interface CustomCalendarIconProps extends React.SVGProps<SVGSVGElement> {}

const CustomCalendarIcon: React.FC<CustomCalendarIconProps> = (props) => {
  return (
    <svg
      width="33"
      height="33"
      viewBox="0 0 33 33"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      {...props}
    >
      <path
        d="M19.5303 20.582V18.2834H24.0757V20.582M19.5303 20.582V22.8805H24.0757V20.582M19.5303 20.582H24.0757"
        stroke="#52525B"
      />
      <path
        d="M1.5 10.5615H31.5V28.9016C31.5 29.8183 30.7538 30.5614 29.8333 30.5614H3.16667C2.2462 30.5614 1.5 29.8183 1.5 28.9016V10.5615Z"
        stroke="#52525B"
        strokeWidth="1.5"
      />
      <path
        d="M8.16667 2H3.16667C2.2462 2 1.5 2.77435 1.5 3.72955V10.5612H31.5V3.72955C31.5 2.77435 30.7538 2 29.8333 2H24.8333M8.16667 2H24.8333H8.16667Z"
        fill="#E4E4E7"
      />
      <path
        d="M8.16667 2H3.16667C2.2462 2 1.5 2.77435 1.5 3.72955V10.5612H31.5V3.72955C31.5 2.77435 30.7538 2 29.8333 2H24.8333H8.16667Z"
        stroke="#71717A"
        strokeWidth="1.5"
      />
    </svg>
  );
};

export default CustomCalendarIcon;
