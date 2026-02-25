import Link from "next/link";
import { LucideIcon } from "lucide-react";
import { GlassCard } from "./GlassCard";
import { StatusBadge } from "./StatusBadge";

/**
 * ProjectCard Component
 * 
 * Card สำหรับแสดงแต่ละโปรเจค/โมดูล
 * - Icon และชื่อโปรเจค
 * - คำอธิบาย
 * - Status badge (optional)
 * - Hover effect พร้อมการเปลี่ยนสี
 */

interface ProjectCardProps {
  title: string;
  description: string;
  icon: LucideIcon;
  href: string;
  status?: "active" | "coming-soon" | "beta";
  iconColor?: string;
  tone?: "raisin" | "buff" | "sunset" | "creamy";
}

export function ProjectCard({
  title,
  description,
  icon: Icon,
  href,
  status,
  iconColor = "from-[#9ACD32] to-[#84B62B]",
  tone = "creamy",
}: ProjectCardProps) {
  const statusMap = {
    active: { label: "Active", type: "success" as const },
    "coming-soon": { label: "Coming Soon", type: "info" as const },
    beta: { label: "Beta", type: "warning" as const },
  };

  const toneMap = {
    raisin: {
      card: "bg-[#EFD09E] shadow-[0_8px_24px_rgba(39,39,39,0.15)] hover:bg-[#272727] hover:shadow-[0_16px_40px_rgba(39,39,39,0.25)] border-0 hover:border-0 !border-0",
      title: "!text-[#272727] group-hover:!text-[#EFD09E]",
      description: "!text-[#272727] group-hover:!text-[#EFD09E]",
      badge:
        "!bg-[#9ACD32] !text-[#272727] !border-[#EFD09E]",
    },
    buff: {
      card: "bg-[#EFD09E] shadow-[0_8px_24px_rgba(39,39,39,0.15)] hover:bg-[#272727] hover:shadow-[0_16px_40px_rgba(39,39,39,0.25)] border-0 hover:border-0 !border-0",
      title: "!text-[#272727] group-hover:!text-[#EFD09E]",
      description: "!text-[#272727] group-hover:!text-[#EFD09E]",
      badge:
        "!bg-[#9ACD32] !text-[#272727] !border-[#EFD09E]",
    },
    sunset: {
      card: "bg-[#EFD09E] shadow-[0_8px_24px_rgba(39,39,39,0.15)] hover:bg-[#272727] hover:shadow-[0_16px_40px_rgba(39,39,39,0.25)] border-0 hover:border-0 !border-0",
      title: "!text-[#272727] group-hover:!text-[#EFD09E]",
      description: "!text-[#272727] group-hover:!text-[#EFD09E]",
      badge:
        "!bg-[#9ACD32] !text-[#272727] !border-[#EFD09E]",
    },
    creamy: {
      card: "bg-[#EFD09E] shadow-[0_8px_24px_rgba(39,39,39,0.15)] hover:bg-[#272727] hover:shadow-[0_16px_40px_rgba(39,39,39,0.25)] border-0 hover:border-0 !border-0",
      title: "!text-[#272727] group-hover:!text-[#EFD09E]",
      description: "!text-[#272727] group-hover:!text-[#EFD09E]",
      badge:
        "!bg-[#9ACD32] !text-[#272727] !border-[#EFD09E]",
    },
  };

  const cardTone = toneMap[tone];

  return (
    <Link href={href}>
      <GlassCard
        hoverEffect
        className={`h-auto py-4 px-5 group relative overflow-hidden border-0 bg-opacity-100 hover:border-0 ${cardTone.card} !border-0 !outline-none`}
      >
        <div className="absolute inset-0 bg-linear-to-br from-white/0 to-white/0 group-hover:from-white/8 group-hover:to-black/8 transition-all duration-500" />

        {/* Content */}
        <div className="relative z-10 flex items-center gap-4">
          {/* Icon */}
          <div
            className={`w-16 h-16 rounded-xl bg-[#9ACD32] border-2 border-[#EFD09E] flex items-center justify-center group-hover:scale-110 transition-transform duration-300 shadow-lg flex-shrink-0`}
          >
            <Icon className="w-10 h-10 text-[#272727]" />
          </div>

          {/* Text Content */}
          <div className="flex flex-col gap-2 flex-1 min-w-0">
            {/* Title & Status */}
            <div className="flex items-start justify-between gap-2">
              <h3 className={`text-xl font-bold transition-colors ${cardTone.title}`}>
                {title}
              </h3>
              {status && (
                <StatusBadge
                  status={statusMap[status].type}
                  label={statusMap[status].label}
                  showDot={false}
                  className={cardTone.badge}
                />
              )}
            </div>

            {/* Description */}
            <p className={`text-sm leading-relaxed ${cardTone.description}`}>
              {description}
            </p>
          </div>
        </div>
      </GlassCard>
    </Link>
  );
}
