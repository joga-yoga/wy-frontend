import React from "react";

interface JYHangerIconProps extends React.SVGProps<SVGSVGElement> {}

const JYHangerIcon: React.FC<JYHangerIconProps> = (props) => (
  <svg
    width="24"
    height="24"
    viewBox="0 0 24 24"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    {...props}
  >
    <path
      d="M12.0491 11.7793L3.2368 15.2514C2.51454 15.5724 2.04907 16.2887 2.04907 17.079V18.2793H22.0491V17.079C22.0491 16.2887 21.5836 15.5724 20.8613 15.2514L12.0491 11.7793ZM12.0491 11.7793V10.7793C12.0491 10.227 11.5745 9.80002 11.0901 9.53483C10.4697 9.19523 10.0491 8.53639 10.0491 7.7793C10.0491 6.67473 10.9445 5.7793 12.0491 5.7793C13.1536 5.7793 14.0491 6.67473 14.0491 7.7793"
      stroke="currentColor"
      strokeWidth="1.2"
    />
  </svg>
);

export default JYHangerIcon;
