"use client";

import { useEffect } from "react";

export default function LoginLayout({ children }: { children: React.ReactNode }) {
  useEffect(() => {
    const prev = document.documentElement.getAttribute("data-theme");
    document.documentElement.setAttribute("data-theme", "light");
    return () => {
      if (prev) document.documentElement.setAttribute("data-theme", prev);
    };
  }, []);
  return <>{children}</>;
}
