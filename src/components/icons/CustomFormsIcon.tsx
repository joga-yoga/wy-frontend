import React from "react";

interface CustomIconProps extends React.SVGProps<SVGSVGElement> {}

const CustomFormsIcon: React.FC<CustomIconProps> = (props) => (
  <svg
    width="24"
    height="24"
    viewBox="0 0 50 50"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    {...props}
  >
    <mask
      id="mask0_728_1123"
      style={{ maskType: "alpha" }}
      maskUnits="userSpaceOnUse"
      x="7"
      y="13"
      width="30"
      height="30"
    >
      <path d="M7.25 42.25V13.4722H11.0871V38.4129H36.0278V42.25H7.25Z" fill="white" />
    </mask>
    <g mask="url(#mask0_728_1123)">
      <path
        d="M31.9168 14.7056H11.3612C9.77183 14.7056 8.4834 15.994 8.4834 17.5833V38.1389C8.4834 39.7282 9.77183 41.0167 11.3612 41.0167H31.9168C33.5061 41.0167 34.7946 39.7282 34.7946 38.1389V17.5833C34.7946 15.994 33.5061 14.7056 31.9168 14.7056Z"
        stroke="currentColor"
        strokeWidth="1.2"
      />
    </g>
    <mask
      id="mask1_728_1123"
      style={{ maskType: "luminance" }}
      maskUnits="userSpaceOnUse"
      x="16"
      y="6"
      width="28"
      height="28"
    >
      <path
        d="M16.2227 9.89682C16.2227 7.74467 17.9673 6 20.1195 6H39.6037C41.7559 6 43.5005 7.74467 43.5005 9.89682V29.3809C43.5005 31.5332 41.7559 33.2778 39.6037 33.2778H20.1195C17.9673 33.2778 16.2227 31.5332 16.2227 29.3809V9.89682Z"
        fill="white"
      />
    </mask>
    <g mask="url(#mask1_728_1123)">
      <path
        d="M19.5837 7.71666H40.1393V2.78333H19.5837V7.71666ZM41.7837 9.3611V29.9167H46.7171V9.3611H41.7837ZM40.1393 31.5611H19.5837V36.4944H40.1393V31.5611ZM17.9392 29.9167V9.3611H13.0059V29.9167H17.9392ZM19.5837 31.5611C18.6754 31.5611 17.9392 30.8248 17.9392 29.9167H13.0059C13.0059 33.5494 15.9508 36.4944 19.5837 36.4944V31.5611ZM41.7837 29.9167C41.7837 30.8248 41.0474 31.5611 40.1393 31.5611V36.4944C43.772 36.4944 46.7171 33.5494 46.7171 29.9167H41.7837ZM40.1393 7.71666C41.0474 7.71666 41.7837 8.4529 41.7837 9.3611H46.7171C46.7171 5.7283 43.772 2.78333 40.1393 2.78333V7.71666ZM19.5837 2.78333C15.9508 2.78333 13.0059 5.7283 13.0059 9.3611H17.9392C17.9392 8.4529 18.6754 7.71666 19.5837 7.71666V2.78333Z"
        fill="currentColor"
      />
      <path d="M24 19.35H35M29.65 14V25" stroke="currentColor" strokeWidth="1.3" />
    </g>
  </svg>
);

export default CustomFormsIcon;
