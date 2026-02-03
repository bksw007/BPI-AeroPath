"use client";

import { ReactNode } from "react";
import Image from "next/image";
import Link from "next/link";
import { ParallaxElement } from "@/components/effects/ParallaxElement";
import { cn } from "@/lib/utils/cn";

interface AuthContainerProps {
  mode: "login" | "signup";
  children: ReactNode;
  onToggleMode: () => void;
}

export function AuthContainer({ mode, children, onToggleMode }: AuthContainerProps) {
  const isLogin = mode === "login";

  return (
    <div className="w-full max-w-5xl mx-auto px-4 py-4 md:py-8" style={{ perspective: "2000px" }}>
      <div className="relative bg-white/40 backdrop-blur-2xl border border-white/40 shadow-[0_32px_64px_-16px_rgba(0,0,0,0.1)] rounded-[3rem] overflow-hidden min-h-[500px] md:min-h-[580px] flex flex-col md:flex-row transform-gpu transition-all duration-700">
        
        {/* Animated Background Overlay for the "Swapping" feeling */}
        <div 
          className={cn(
            "absolute top-0 bottom-0 w-full md:w-1/2 bg-gradient-to-br from-indigo-600/90 to-purple-700/90 z-20 hidden md:block transition-all duration-[800ms] [transition-timing-function:cubic-bezier(0.4,0,0.2,1)]",
            isLogin 
              ? "translate-x-full rounded-l-[3rem]" 
              : "translate-x-0 rounded-r-[3rem]"
          )}
          style={{ 
            boxShadow: isLogin ? "-20px 0 50px rgba(0,0,0,0.15)" : "20px 0 50px rgba(0,0,0,0.15)",
            transformStyle: "preserve-3d",
          }}
        >
          {/* Content inside the overlay (Logo & Welcome) */}
          <div className="relative h-full flex flex-col items-center justify-center p-8 md:p-10 text-center text-white">
            <ParallaxElement depth={0.08} speed="fast" className="mb-6">
              <Image
                src="/images/Logo no bg.svg"
                alt="Logo"
                width={180}
                height={50}
                className="w-auto h-12 brightness-0 invert filter drop-shadow-xl"
              />
            </ParallaxElement>

            <ParallaxElement depth={0.04} speed="medium">
              <div className="transition-all duration-700 transform">
                <h2 className="text-3xl font-black mb-3 tracking-tight drop-shadow-sm">
                  {isLogin ? "Welcome Back!" : "Join the Path"}
                </h2>
                <p className="text-indigo-50/90 text-sm md:text-base font-medium leading-relaxed mb-8 max-w-[280px] mx-auto drop-shadow-sm">
                  {isLogin 
                    ? "Sign in to keep tracking your warehouse movements and stay synchronized with your team." 
                    : "Start your journey with BPI AeroPath. Real-time visibility and seamless logistics management."}
                </p>
              </div>
            </ParallaxElement>

            <button
              onClick={onToggleMode}
              className="px-10 py-3.5 bg-white/10 hover:bg-white/20 backdrop-blur-md border border-white/30 rounded-2xl font-bold transition-all hover:scale-105 active:scale-95 text-sm ring-1 ring-white/20 shadow-lg"
            >
              {isLogin ? "Create an Account" : "Sign In instead"}
            </button>
          </div>
        </div>

        {/* 1. Login Form Side */}
        <div 
          className={cn(
            "flex-1 flex flex-col justify-center p-6 md:p-12 transition-all duration-[800ms] [transition-timing-function:cubic-bezier(0.4,0,0.2,1)] order-2 md:order-1 relative",
            isLogin ? "opacity-100 translate-x-0" : "md:opacity-0 md:-translate-x-8 md:pointer-events-none"
          )}
        >
          <div className="flex-1 flex flex-col justify-center">
            {mode === "login" ? children : null}
          </div>
          
          {/* Bottom Link */}
          <div className="mt-6 md:mt-0 md:absolute md:bottom-8 md:left-12">
            <Link 
              href="/pending" 
              className="text-[10px] text-slate-400 hover:text-indigo-500 transition-colors font-medium flex items-center gap-1 group"
            >
              Learn more about BPI AeroPath <span className="group-hover:translate-x-0.5 transition-transform">→</span>
            </Link>
          </div>
        </div>

        {/* 2. Signup Form Side */}
        <div 
          className={cn(
            "flex-1 flex flex-col justify-center p-6 md:p-12 transition-all duration-[800ms] [transition-timing-function:cubic-bezier(0.4,0,0.2,1)] order-1 md:order-2 relative",
            !isLogin ? "opacity-100 translate-x-0" : "md:opacity-0 md:translate-x-8 md:pointer-events-none"
          )}
        >
          <div className="flex-1 flex flex-col justify-center">
            {mode === "signup" ? children : null}
          </div>

          {/* Bottom Link */}
          <div className="mt-6 md:mt-0 md:absolute md:bottom-8 md:left-12">
            <Link 
              href="/pending" 
              className="text-[10px] text-slate-400 hover:text-indigo-500 transition-colors font-medium flex items-center gap-1 group"
            >
              Learn more about BPI AeroPath <span className="group-hover:translate-x-0.5 transition-transform">→</span>
            </Link>
          </div>
        </div>

        {/* Mobile Toggle (Only visible on small screens since the big overlay is hidden) */}
        {!isLogin && (
          <div className="md:hidden p-8 text-center bg-slate-50/50">
             <p className="text-slate-500 text-sm mb-4">Already have an account?</p>
             <button onClick={onToggleMode} className="text-indigo-600 font-bold">Sign In</button>
          </div>
        )}
        {isLogin && (
          <div className="md:hidden p-8 text-center bg-slate-50/50">
             <p className="text-slate-500 text-sm mb-4">Don&apos;t have an account?</p>
             <button onClick={onToggleMode} className="text-indigo-600 font-bold">Create Account</button>
          </div>
        )}

      </div>
    </div>
  );
}
