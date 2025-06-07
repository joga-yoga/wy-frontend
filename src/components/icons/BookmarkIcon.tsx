import React from "react";

interface BookmarkIconProps extends React.SVGProps<SVGSVGElement> {
  // You can add any specific props you need for the icon here
  // For example, size, custom color, etc.
}

const BookmarkIcon: React.FC<BookmarkIconProps> = (props) => {
  return (
    <svg
      width="46"
      height="46"
      viewBox="0 0 46 46"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      {...props}
    >
      <path
        fillRule="evenodd"
        clipRule="evenodd"
        d="M22.8333 45.3571C34.9835 45.3571 44.8333 35.5074 44.8333 23.3571C44.8333 11.2069 34.9835 1.35712 22.8333 1.35712C10.683 1.35712 0.833252 11.2069 0.833252 23.3571C0.833252 35.5074 10.683 45.3571 22.8333 45.3571ZM26.1261 18.8249L22.8333 8.69045L19.5404 18.8249H8.88442L17.5053 25.0883L14.2124 35.2227L22.8333 28.9593L31.4541 35.2227L28.1612 25.0883L36.7821 18.8249H26.1261Z"
        fill="#52525B"
        stroke="white"
      />
    </svg>
  );
};

export default BookmarkIcon;
