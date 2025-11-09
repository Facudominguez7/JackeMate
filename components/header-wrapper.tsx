"use client";

import { useEffect, useState } from "react";

interface HeaderWrapperProps {
  isTransparent: boolean;
  children: React.ReactNode;
}

/**
 * Wrapper del header que detecta el scroll y hover para agregar blur
 */
export function HeaderWrapper({ isTransparent, children }: HeaderWrapperProps) {
  const [hasScrolled, setHasScrolled] = useState(false);
  const [isHovered, setIsHovered] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setHasScrolled(window.scrollY > 10);
    };

    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const shouldBlur = hasScrolled || isHovered;

  return (
    <header
      className={`${
        isTransparent
          ? `border-b border-b-white/10 bg-transparent  ${shouldBlur ? "backdrop-blur-sm" : ""}`
          : "border-b-4 border-b-primary bg-card/50 backdrop-blur-sm shadow-md"
      } sticky top-0 z-50 transition-all duration-300`}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {children}
    </header>
  );
}
