import { useEffect, useState } from "react";

export default function useWindowWidth() {
  const isClient = typeof window !== "undefined";
  const [width, setWidth] = useState(isClient ? window.innerWidth : 1024);

  useEffect(() => {
    if (!isClient) return;
    const handleResize = () => setWidth(window.innerWidth);
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, [isClient]);

  return width;
}
