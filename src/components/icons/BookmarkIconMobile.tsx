import React from "react";

interface BookmarkIconMobileProps extends React.SVGProps<SVGSVGElement> {}

const BookmarkIconMobile: React.FC<BookmarkIconMobileProps> = (props) => {
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
        fillRule="evenodd"
        clipRule="evenodd"
        d="M16.8333 32.5C25.6698 32.5 32.8333 25.3366 32.8333 16.5C32.8333 7.66344 25.6698 0.5 16.8333 0.5C7.9967 0.5 0.833252 7.66344 0.833252 16.5C0.833252 25.3366 7.9967 32.5 16.8333 32.5ZM19.2281 13.2038L16.8333 5.83333L14.4384 13.2038H6.68865L12.9584 17.759L10.5635 25.1295L16.8333 20.5743L23.103 25.1295L20.7081 17.759L26.9779 13.2038H19.2281Z"
        fill="#F2F2F3"
      />
      <mask
        id="mask0_1_575"
        style={{ maskType: "alpha" }}
        maskUnits="userSpaceOnUse"
        x="1"
        y="1"
        width="31"
        height="31"
      >
        <circle cx="16.8333" cy="16.5" r="15" fill="#D9D9D9" />
      </mask>
      <g mask="url(#mask0_1_575)">
        <path
          d="M16.8333 -0.25C26.084 -0.25 33.5833 7.24923 33.5833 16.5C33.5833 25.7508 26.084 33.25 16.8333 33.25C7.58248 33.25 0.083252 25.7508 0.083252 16.5C0.083252 7.24923 7.58248 -0.25 16.8333 -0.25ZM15.1516 13.4355L14.9836 13.9541H8.99731L13.3997 17.1523L13.8401 17.4727L13.6721 17.9912L11.9895 23.165L16.3928 19.9678L16.8333 19.6475L17.2737 19.9678L21.676 23.165L19.9944 17.9912L19.8264 17.4727L20.2668 17.1523L24.6692 13.9541H18.6829L18.5149 13.4355L16.8333 8.25879L15.1516 13.4355Z"
          fill="#F2F2F3"
          stroke="#52525B"
          strokeWidth="1.5"
        />
      </g>
    </svg>
  );
};

export default BookmarkIconMobile;
