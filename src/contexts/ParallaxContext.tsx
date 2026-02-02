"use client";

import React, { createContext, useContext, useEffect, useState } from "react";

interface ParallaxContextType {
  mouseX: number;
  mouseY: number;
}

const ParallaxContext = createContext<ParallaxContextType>({ mouseX: 0, mouseY: 0 });

export function ParallaxProvider({ children }: { children: React.ReactNode }) {
  const [offset, setOffset] = useState({ x: 0, y: 0 });

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      // Calculate normalized position (-1 to 1) from center
      const x = (e.clientX - window.innerWidth / 2) / (window.innerWidth / 2);
      const y = (e.clientY - window.innerHeight / 2) / (window.innerHeight / 2);
      
      // Use requestAnimationFrame for smoother performance if needed, 
      // but state update is usually fast enough for this simple logic.
      // For ultra-smooth, we might use useRef and logical updates, but React State is simpler for now.
      setOffset({ x, y });
    };

    window.addEventListener("mousemove", handleMouseMove);
    return () => window.removeEventListener("mousemove", handleMouseMove);
  }, []);

  return (
    <ParallaxContext.Provider value={{ mouseX: offset.x, mouseY: offset.y }}>
      {children}
    </ParallaxContext.Provider>
  );
}

export const useParallax = () => useContext(ParallaxContext);
