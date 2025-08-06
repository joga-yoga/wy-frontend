import React from "react";

interface LayoutProps {
  children: React.ReactNode;
}

const Layout: React.FC<LayoutProps> = ({ children }) => {
  return (
    <>
      {children}
      {/* <Footer /> */} {/* Uncomment when Footer is ready */}
    </>
  );
};

export default Layout;
