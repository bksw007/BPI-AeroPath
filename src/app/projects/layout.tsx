import { Navbar } from "@/components/shared/Navbar";
import { AuthProvider } from "@/contexts/AuthContext";

export default function ProjectsLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <AuthProvider>
      <Navbar />
      {children}
    </AuthProvider>
  );
}
