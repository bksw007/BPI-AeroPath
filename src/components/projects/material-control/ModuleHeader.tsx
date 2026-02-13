import Link from "next/link";
import { ArrowLeft } from "lucide-react";

import { GlassCard } from "@/components/shared/GlassCard";

interface ModuleHeaderProps {
  title: string;
  description?: string;
  backHref?: string;
  backLabel?: string;
  action?: React.ReactNode;
  children?: React.ReactNode;
}

export function ModuleHeader({
  title,
  description,
  backHref = "/projects/material-control",
  backLabel = "Material Control",
  action,
  children,
}: ModuleHeaderProps) {
  return (
    <div className="space-y-6">
      <div className="relative flex items-center justify-center pt-2">
        {/* Back Link - Positioned Absolute Left */}
        <Link
          href={backHref}
          className="absolute left-0 inline-flex items-center gap-2 text-slate-500 hover:text-indigo-600 transition-colors text-sm md:text-base"
        >
          <ArrowLeft className="w-4 h-4 md:w-5 md:h-5" />
          <span className="hidden sm:inline">{backLabel}</span>
        </Link>
        
        {/* Title */}
        <h1 className="text-3xl md:text-5xl font-bold">
          <span className="bg-clip-text text-transparent bg-linear-to-br from-blue-600 to-indigo-700 bg-size-[200%_100%] animate-shimmer">
            {title}
          </span>
        </h1>

        {/* Action Button - Positioned Absolute Right */}
        {action && (
          <div className="absolute right-0">
            {action}
          </div>
        )}
      </div>

      {description ? (
        <p className="text-slate-600 text-lg md:text-xl max-w-2xl mx-auto leading-relaxed text-center -mt-2">
          {description}
        </p>
      ) : null}

      {children ? children : (
        <GlassCard className="text-center py-10">
          <p className="text-slate-500 text-base">Module is under construction</p>
        </GlassCard>
      )}
    </div>
  );
}
