import React from "react";

interface CustomPriceIconMobileProps extends React.SVGProps<SVGSVGElement> {}

const CustomPriceIconMobile: React.FC<CustomPriceIconMobileProps> = (props) => {
  return (
    <svg
      width="33"
      height="33"
      viewBox="0 0 33 33"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      {...props}
    >
      <rect x="0.833252" y="0.214355" width="32" height="32" rx="16" fill="#F2F2F3" />
      <path
        d="M20.0475 13.5894C20.0475 12.1396 18.6084 10.9644 16.8332 10.9644M16.8332 10.9644C15.0579 10.9644 13.6189 12.1396 13.6189 13.5894C13.6189 15.0391 15.1543 15.8226 16.8332 16.2144C18.4403 16.5894 20.0475 17.3896 20.0475 18.8394C20.0475 20.2891 18.6084 21.4644 16.8332 21.4644M16.8332 10.9644V8.71436M16.8332 21.4644C15.0579 21.4644 13.6189 20.2891 13.6189 18.8394M16.8332 21.4644V23.7144"
        stroke="#52525B"
        strokeWidth="1.5"
      />
    </svg>
  );
};

export default CustomPriceIconMobile;
