import React from "react";

interface CustomPriceIconProps extends React.SVGProps<SVGSVGElement> {}

const CustomPriceIcon: React.FC<CustomPriceIconProps> = (props) => {
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
        d="M43.5 77C61.4493 77 76 62.4493 76 44.5C76 26.5507 61.4493 12 43.5 12C25.5507 12 11 26.5507 11 44.5C11 62.4493 25.5507 77 43.5 77Z"
        stroke="#475569"
        strokeWidth="2"
      />
      <path
        d="M53.7394 36.5011C53.7394 32.0835 49.3544 28.5023 43.9449 28.5023M43.9449 28.5023C38.5354 28.5023 34.1504 32.0835 34.1504 36.5011C34.1504 40.9188 38.8289 43.3064 43.9449 44.5C48.8422 45.6427 53.7394 48.0812 53.7394 52.4989C53.7394 56.9165 49.3544 60.4977 43.9449 60.4977M43.9449 28.5023V21.6461M43.9449 60.4977C38.5354 60.4977 34.1504 56.9165 34.1504 52.4989M43.9449 60.4977V67.3539"
        stroke="#94A3B8"
        strokeWidth="2"
      />
    </svg>
  );
};

export default CustomPriceIcon;
