"use client";

import { useState, useEffect } from "react";
import { RiArrowUpSLine } from 'react-icons/ri';

export function BackToTop() {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const toggleVisibility = () => {
      if (window.scrollY > 300) {
        setIsVisible(true);
      } else {
        setIsVisible(false);
      }
    };

    window.addEventListener("scroll", toggleVisibility);
    toggleVisibility(); // Check initial position

    return () => window.removeEventListener("scroll", toggleVisibility);
  }, []);

  const scrollToTop = () => {
    window.scrollTo({
      top: 0,
      behavior: "smooth"
    });
  };

  return (
    <button
      onClick={scrollToTop}
      className={`fixed bottom-6 right-6 z-40 h-12 w-12 rounded-full
        backdrop-blur-xl bg-white/70 dark:bg-[#333333]/90
        border border-white/20 shadow-lg
        hover:brightness-110 hover:scale-110
        transition-all duration-300
        ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-16 pointer-events-none'}`}
      aria-label="Voltar ao topo"
    >
      <RiArrowUpSLine className="h-6 w-6 mx-auto" />
    </button>
  );
}
