import { cn } from "@/lib/utils/cn";

/**
 * StatusBadge Component
 * 
 * Badge สำหรับแสดงสถานะต่างๆ พร้อมสีและ animation ที่เหมาะสม
 * - normal: สีฟ้า (ปกติ)
 * - success: สีเขียว (สำเร็จ)
 * - warning: สีเหลือง/ส้ม (คำเตือน)
 * - critical: สีแดง + pulse animation (เร่งด่วน)
 * - info: สีฟ้าอ่อน (ข้อมูล)
 */

type BadgeStatus = "normal" | "warning" | "critical" | "success" | "info";

interface StatusBadgeProps {
  status: BadgeStatus;
  label?: string;
  showDot?: boolean;
  className?: string;
}

export function StatusBadge({
  status,
  label,
  showDot = true,
  className,
}: StatusBadgeProps) {
  // กำหนดสีและ style สำหรับแต่ละ status (Light Theme)
  const styles: Record<BadgeStatus, string> = {
    normal: "bg-blue-100 text-blue-700 border-blue-300",
    success: "bg-green-100 text-green-700 border-green-300",
    warning: "bg-amber-100 text-amber-700 border-amber-300",
    critical: "bg-red-100 text-red-700 border-red-300 animate-pulse",
    info: "bg-cyan-100 text-cyan-700 border-cyan-300",
  };

  return (
    <span
      className={cn(
        "px-3 py-1 rounded-full border text-xs font-semibold backdrop-blur-sm flex items-center gap-2 w-fit whitespace-nowrap",
        styles[status],
        className
      )}
    >
      {showDot && (
        <span
          className={cn(
            "w-2 h-2 rounded-full bg-current",
            status === "critical" && "animate-ping"
          )}
        />
      )}
      {label || status.toUpperCase()}
    </span>
  );
}
