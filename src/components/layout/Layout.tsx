import React from "react";

interface LayoutProps {
  children: React.ReactNode;
}

const Layout: React.FC<LayoutProps> = ({ children }) => {
  return (
    <div className="flex flex-col">
      <main className="flex-grow">{children}</main>
      {/* <Footer /> */} {/* Uncomment when Footer is ready */}
    </div>
  );
};

export default Layout;
