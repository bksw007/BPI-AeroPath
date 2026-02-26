"use client";

import { TrendingUp } from "lucide-react";
import { GlassCard } from "@/components/shared/GlassCard";
import { ModuleHeader } from "@/components/projects/material-control/ModuleHeader";

export default function PackagingReportsPage() {
  return (
    <div className="min-h-screen bg-[#F6EDDE] pt-20">
      <section className="py-12">
        <div className="container-custom">
          
          <ModuleHeader
             title="Packing Reports"
             description="Operation reports, packing lists, and analytics export."
             backHref="/projects/packaging"
             backLabel="Packaging Console"
          >
            <GlassCard className="p-8 flex flex-col items-center justify-center min-h-[400px] mt-8 bg-[#EEF2F6]/95 border border-white/80 shadow-[10px_10px_22px_rgba(166,180,200,0.28),-10px_-10px_22px_rgba(255,255,255,0.92)] text-[#7E5C4A]">
               <TrendingUp className="w-16 h-16 mb-4 opacity-10" />
               <p className="font-medium">Report data and analytics are being integrated.</p>
            </GlassCard>
          </ModuleHeader>

        </div>
      </section>
    </div>
  );
}
