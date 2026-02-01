import type { Metadata } from "next";
import { Noto_Sans_Thai, Montserrat_Alternates } from "next/font/google";

import "./(main)/globals.css";

const notoSansThai = Noto_Sans_Thai({
  subsets: ["thai", "latin"],
  weight: ["100", "200", "300", "400", "500", "600", "700", "800", "900"],
  variable: "--font-noto-sans-thai",
  display: "swap",
});

const montserratAlt = Montserrat_Alternates({
  subsets: ["latin"],
  weight: ["400", "600"],
  style: "italic",
  variable: "--font-montserrat-alt",
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

import { AuthProvider } from "@/contexts/AuthContext";

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${notoSansThai.variable} ${montserratAlt.variable} antialiased bg-app-gradient`}
        suppressHydrationWarning={true}
      >
        <AuthProvider>
          {children}
        </AuthProvider>
      </body>
    </html>
  );
}
