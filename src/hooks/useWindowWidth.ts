import { useEffect, useState } from "react";

function useWindowWidth() {
  const [windowWidth, setWindowWidth] = useState<number>(0);

  useEffect(() => {
    function handleResize() {
      setWindowWidth(window.innerWidth);
    }

    if (typeof window !== "undefined") {
      handleResize();
      window.addEventListener("resize", handleResize);
      return () => window.removeEventListener("resize", handleResize);
    }
  }, []);

  return windowWidth;
}

export default useWindowWidth;
