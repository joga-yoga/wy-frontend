import React from "react";

interface LogoBlackIconProps extends React.SVGProps<SVGSVGElement> {}

const LogoBlackIcon: React.FC<LogoBlackIconProps> = (props) => (
  <svg
    width="32"
    height="33"
    viewBox="0 0 32 33"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    {...props}
  >
    <rect y="0.985718" width="32" height="32" rx="16" fill="#52525B" />
    <g clipPath="url(#clip0_683_466)">
      <path
        d="M13.2745 9.62191C13.5894 9.99084 14.2536 11.2801 14.8063 12.5435C15.8802 15.0228 16.3066 15.6387 16.954 15.6387C17.5542 15.6387 18.0911 15.007 18.8017 13.4594C20.2388 10.3326 20.4757 9.85879 20.8705 9.4324C21.3285 8.95864 21.8812 8.86389 22.0233 9.2429C22.2918 9.92196 21.1074 13.033 18.6596 18.1654C16.6062 22.603 15.3117 24.4823 14.5379 24.4823C14.0365 24.443 13.9187 23.9325 14.4115 23.1084C15.7696 20.4237 15.5959 18.8761 13.4008 13.6805C12.23 11.0119 11.869 9.68508 12.0269 9.25869C12.2006 8.8323 12.7218 8.97443 13.2745 9.62191Z"
        fill="#FAFAFA"
      />
      <path
        d="M12.7197 23.5956C12.7197 24.3633 12.0974 24.9857 11.3296 24.9857C10.5618 24.9857 9.93945 24.3633 9.93945 23.5956C9.93945 22.8278 10.5618 22.2054 11.3296 22.2054C12.0974 22.2054 12.7197 22.8278 12.7197 23.5956Z"
        fill="#FAFAFA"
      />
    </g>
    <defs>
      <clipPath id="clip0_683_466">
        <rect width="12.1212" height="16" fill="white" transform="translate(9.93945 8.98572)" />
      </clipPath>
    </defs>
  </svg>
);

export default LogoBlackIcon;
