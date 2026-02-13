import Link from "next/link";
import { ArrowUpRight, LucideIcon } from "lucide-react";
import { GlassCard } from "./GlassCard";
import { StatusBadge } from "./StatusBadge";

/**
 * ProjectCard Component
 * 
 * Card สำหรับแสดงแต่ละโปรเจค/โมดูล
 * - Icon และชื่อโปรเจค
 * - คำอธิบาย
 * - Status badge (optional)
 * - Hover effect พร้อม bg-linear-to-r glow
 */

interface ProjectCardProps {
  title: string;
  description: string;
  icon: LucideIcon;
  href: string;
  status?: "active" | "coming-soon" | "beta";
  iconColor?: string;
}

export function ProjectCard({
  title,
  description,
  icon: Icon,
  href,
  status,
  iconColor = "from-blue-500 to-purple-600",
}: ProjectCardProps) {
  const statusMap = {
    active: { label: "Active", type: "success" as const },
    "coming-soon": { label: "Coming Soon", type: "info" as const },
    beta: { label: "Beta", type: "warning" as const },
  };

  return (
    <Link href={href}>
      <GlassCard
        hoverEffect
        className="h-full flex flex-col gap-4 group relative overflow-hidden border-white/70 bg-white/62"
      >
        {/* Gradient Glow Effect (แสดงเมื่อ hover) */}
        <div className="absolute inset-0 bg-linear-to-br from-blue-500/0 to-purple-600/0 group-hover:from-blue-500/10 group-hover:to-purple-600/10 transition-all duration-500 rounded-2xl" />

        {/* Content */}
        <div className="relative z-10 flex h-full flex-col gap-4">
          {/* Icon */}
          <div
            className={`w-14 h-14 rounded-xl bg-linear-to-br ${iconColor} flex items-center justify-center group-hover:scale-110 transition-transform duration-300 shadow-lg`}
          >
            <Icon className="w-8 h-8 text-white" />
          </div>

          {/* Title & Status */}
          <div className="flex items-start justify-between gap-2">
            <h3 className="text-xl font-bold text-slate-800 group-hover:text-indigo-600 transition-colors">
              {title}
            </h3>
            {status && (
              <StatusBadge
                status={statusMap[status].type}
                label={statusMap[status].label}
                showDot={false}
              />
            )}
          </div>

          {/* Description */}
          <p className="text-slate-600 text-sm leading-relaxed">
            {description}
          </p>

          <div className="mt-auto pt-2">
            <span className="inline-flex items-center gap-2 rounded-full border border-slate-700/12 bg-white/80 px-4 py-2 text-xs font-bold uppercase tracking-[0.18em] text-slate-700 shadow-[0_8px_18px_rgba(39,39,39,0.12)] transition-all duration-300 group-hover:bg-slate-800 group-hover:text-[#EFD09E]">
              Open Module
              <ArrowUpRight className="h-4 w-4 transition-transform duration-300 group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
            </span>
          </div>
        </div>
      </GlassCard>
    </Link>
  );
}
