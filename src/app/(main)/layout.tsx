import type { Metadata } from "next";
import { Noto_Sans_Thai } from "next/font/google"; // Correct import
import "./globals.css";
import { Navbar } from "@/components/shared/Navbar";
import { AuthProvider } from "@/contexts/AuthContext"; // Moved to top level

const notoSansThai = Noto_Sans_Thai({
  subsets: ["thai", "latin"],
  weight: ["100", "200", "300", "400", "500", "600", "700", "800", "900"],
  variable: "--font-noto-sans-thai",
  display: "swap",
});

export const metadata: Metadata = {
  title: "BPI AeroPath - Centralized Work Hub",
  description:
    "Warehouse & Logistics Management System for Material Control, Warehouse, and Delivery",
  icons: {
    icon: "/favicon.ico",
    apple: "/apple-icon.png",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <AuthProvider>
      <Navbar />
      <div className={`${notoSansThai.variable} antialiased`}>{children}</div>
    </AuthProvider>
  );
}
