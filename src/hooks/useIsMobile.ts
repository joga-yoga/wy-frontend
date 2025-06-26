import { useEffect, useState } from "react";

const useIsMobile = (breakpoint = 768): boolean => {
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const checkScreenSize = () => {
      setIsMobile(window.innerWidth < breakpoint);
    };

    if (typeof window !== "undefined") {
      checkScreenSize();
      window.addEventListener("resize", checkScreenSize);
      return () => {
        window.removeEventListener("resize", checkScreenSize);
      };
    }
  }, [breakpoint]);

  return isMobile;
};

export default useIsMobile;
