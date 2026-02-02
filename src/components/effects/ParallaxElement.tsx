"use client";

import React from "react";
import { useParallax } from "@/contexts/ParallaxContext";

interface ParallaxElementProps {
  children: React.ReactNode;
  depth?: number; // Positive = moves opposite to mouse (far away feeling), Negative = moves with mouse
  className?: string;
}

export function ParallaxElement({ children, depth = 0.02, className = "" }: ParallaxElementProps) {
  const { mouseX, mouseY } = useParallax();

  // Calculate translate values
  // Inverted direction (-mouseX) to create "floating above" feel.
  // Multiplier 800: Strong visible movement.
  const moveX = -mouseX * depth * 800; 
  const moveY = -mouseY * depth * 800;

  // Debug (remove later if too noisy, but useful now)
  // if (depth > 0.03) console.log("Parallax Move:", moveX, moveY);

  return (
    <div 
      className={`transition-transform duration-100 ease-out will-change-transform ${className}`}
      style={{ 
        transform: `translate3d(${moveX}px, ${moveY}px, 0)` 
      }}
    >
      {children}
    </div>
  );
}
