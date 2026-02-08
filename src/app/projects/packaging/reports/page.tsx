"use client";

import { TrendingUp } from "lucide-react";
import { GlassCard } from "@/components/shared/GlassCard";
import { ModuleHeader } from "@/components/projects/material-control/ModuleHeader";

export default function PackagingReportsPage() {
  return (
    <div className="min-h-screen pt-20">
      <section className="py-12">
        <div className="container-custom">
          
          <ModuleHeader
             title="Packing Reports"
             description="Operation reports, packing lists, and analytics export."
             backHref="/projects/packaging"
             backLabel="Smart Packaging"
          >
            <GlassCard className="p-8 flex flex-col items-center justify-center min-h-[400px] text-slate-400 mt-8">
               <TrendingUp className="w-16 h-16 mb-4 opacity-10" />
               <p className="font-medium">Report data and analytics are being integrated.</p>
            </GlassCard>
          </ModuleHeader>

        </div>
      </section>
    </div>
  );
}
