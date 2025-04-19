import React from "react";

import Header from "./Header";
// Import Footer component here if/when you create it

interface LayoutProps {
  children: React.ReactNode;
}

const Layout: React.FC<LayoutProps> = ({ children }) => {
  return (
    <div className="flex flex-col min-h-screen">
      <Header />
      <main className="flex-grow">{children}</main>
      {/* <Footer /> */} {/* Uncomment when Footer is ready */}
    </div>
  );
};

export default Layout;
