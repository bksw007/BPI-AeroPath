"use client";

import { TrendingUp, FileText, Download } from "lucide-react";
import { GlassCard } from "@/components/shared/GlassCard";

export default function PackagingReportsPage() {
  return (
    <div className="min-h-screen pt-20">
      <section className="py-12">
        <div className="container-custom">
          
          <div className="mb-10">
            <h1 className="text-3xl font-bold text-slate-900 mb-2">Packing Reports</h1>
            <p className="text-slate-500">Operation reports, packing lists, and analytics export.</p>
          </div>

          <GlassCard className="p-8 flex flex-col items-center justify-center min-h-[400px] text-slate-400">
             <TrendingUp className="w-16 h-16 mb-4 opacity-10" />
             <p className="font-medium">Report data and analytics are being integrated.</p>
          </GlassCard>

        </div>
      </section>
    </div>
  );
}
