"use client";

import Link from "next/link";
import { useState } from "react";
import { Menu, X, LogOut, User } from "lucide-react";
import { cn } from "@/lib/utils/cn";
import { useAuth } from "@/contexts/AuthContext";
import { useRouter } from "next/navigation";

import Image from "next/image";

/**
 * Navbar Component
 * 
 * Top navigation bar พร้อม:
 * - Logo และชื่อแอพ (ใช้ไฟล์ Image แทน Icon)
 * - Navigation links
 * - Glass effect background
 * - Responsive mobile menu
 */

const navLinks = [
  { href: "/", label: "Home" },
  { href: "/projects", label: "Projects" },
  { href: "/about", label: "About" },
];

export function Navbar() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const { user, signOut } = useAuth();
  const router = useRouter();

  const handleSignOut = async () => {
    await signOut();
    router.push("/pending");
  };

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 border-b border-white/20 bg-white/10 backdrop-blur-lg">
      <div className="container-custom">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-3 group">
            <Image
              src="/images/Logo no bg.svg"
              alt="BPI AeroPath Logo"
              width={140}
              height={140}
              className="h-10 w-auto object-contain group-hover:scale-105 transition-transform duration-300"
              priority
            />
          </Link>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center gap-6">
            {navLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className="text-slate-700 hover:text-indigo-600 transition-colors duration-200 font-bold"
              >
                {link.label}
              </Link>
            ))}

            <div className="h-6 w-px bg-slate-200 ml-2"></div>

            {user ? (
              <div className="flex items-center gap-4">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-600">
                    <User className="w-4 h-4" />
                  </div>
                  <span className="text-sm font-bold text-slate-700">{user.displayName}</span>
                </div>
                <button
                  onClick={handleSignOut}
                  className="p-2 text-slate-400 hover:text-red-500 transition-colors"
                  title="Sign Out"
                >
                  <LogOut className="w-5 h-5" />
                </button>
              </div>
            ) : (
              <Link
                href="/login"
                className="px-5 py-2 bg-indigo-600 text-white rounded-xl text-sm font-bold shadow-lg shadow-indigo-600/20 hover:bg-indigo-700 transition-all active:scale-95"
              >
                Sign In
              </Link>
            )}
          </div>

          {/* Mobile Menu Button */}
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="md:hidden p-2 text-white hover:bg-white/10 rounded-lg transition-colors"
            aria-label="Toggle menu"
          >
            {mobileMenuOpen ? (
              <X className="w-6 h-6" />
            ) : (
              <Menu className="w-6 h-6" />
            )}
          </button>
        </div>

        {/* Mobile Menu */}
        <div
          className={cn(
            "md:hidden overflow-hidden transition-all duration-300 ease-in-out",
            mobileMenuOpen ? "max-h-80 opacity-100" : "max-h-0 opacity-0"
          )}
        >
          <div className="py-4 space-y-3">
            {navLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                onClick={() => setMobileMenuOpen(false)}
                className="block px-4 py-2 text-slate-700 hover:bg-slate-50 rounded-lg transition-all duration-200 font-medium"
              >
                {link.label}
              </Link>
            ))}

            <div className="border-t border-slate-100 pt-3 px-4">
              {user ? (
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-indigo-50 flex items-center justify-center text-indigo-600">
                      <User className="w-5 h-5" />
                    </div>
                    <div>
                      <div className="text-sm font-bold text-slate-900">{user.displayName}</div>
                      <div className="text-xs text-slate-500 uppercase">{user.role}</div>
                    </div>
                  </div>
                  <button
                    onClick={handleSignOut}
                    className="p-2 text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                  >
                    <LogOut className="w-6 h-6" />
                  </button>
                </div>
              ) : (
                <Link
                  href="/login"
                  onClick={() => setMobileMenuOpen(false)}
                  className="block w-full text-center py-3 bg-indigo-600 text-white rounded-xl font-bold shadow-lg shadow-indigo-600/20"
                >
                  Sign In
                </Link>
              )}
            </div>
          </div>
        </div>
      </div>
    </nav>
  );
}
