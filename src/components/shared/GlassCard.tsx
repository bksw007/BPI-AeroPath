import { cn } from "@/lib/utils/cn";

/**
 * GlassCard Component
 * 
 * Reusable glassmorphism card component ที่ใช้ตลอดทั้งแอพ
 * มี glass effect (โปร่งแสง, เบลอหลัง, ขอบบางๆ)
 * 
 * @param hoverEffect - เปิด/ปิด hover animation (lift up + glow)
 * @param className - Additional Tailwind classes
 * @param children - Content inside the card
 */

interface GlassCardProps extends React.HTMLAttributes<HTMLDivElement> {
  hoverEffect?: boolean;
  children: React.ReactNode;
}

export function GlassCard({
  className,
  hoverEffect = false,
  children,
  ...props
}: GlassCardProps) {
  return (
    <div
      className={cn(
        // Base glass styles (Light Theme)
        "rounded-2xl border border-white/60 bg-white/50 backdrop-blur-lg shadow-lg p-6 text-slate-800",
        // Hover effect (optional)
        hoverEffect &&
          "transition-all duration-300 hover:-translate-y-1 hover:shadow-xl hover:bg-white/70 cursor-pointer",
        // Custom classes
        className
      )}
      {...props}
    >
      {children}
    </div>
  );
}
