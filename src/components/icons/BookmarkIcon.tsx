import React from "react";

interface BookmarkIconProps extends React.SVGProps<SVGSVGElement> {
  // You can add any specific props you need for the icon here
  // For example, size, custom color, etc.
}

const BookmarkIcon: React.FC<BookmarkIconProps> = (props) => {
  return (
    <svg
      width="44"
      height="45"
      viewBox="0 0 44 45"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      {...props} // Spread any additional props (like className)
    >
      <path
        fillRule="evenodd"
        clipRule="evenodd"
        d="M22 44.5C34.1503 44.5 44 34.6503 44 22.5C44 10.3497 34.1503 0.5 22 0.5C9.84974 0.5 0 10.3497 0 22.5C0 34.6503 9.84974 44.5 22 44.5ZM25.2929 17.9678L22 7.83333L18.7071 17.9678H8.05117L16.672 24.2312L13.3792 34.3656L22 28.1022L30.6209 34.3656L27.328 24.2312L35.9488 17.9678H25.2929Z"
        fill="#52525B" // Default fill from your SVG, can be overridden by props.className if Tailwind is used
      />
    </svg>
  );
};

export default BookmarkIcon;
