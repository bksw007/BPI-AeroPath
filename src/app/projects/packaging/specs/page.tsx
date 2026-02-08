"use client";

import Link from "next/link";
import { 
  ChevronRight, 
  Search,
  Zap,
  Battery,
  CircuitBoard,
  Cpu
} from "lucide-react";
import { GlassCard } from "@/components/shared/GlassCard";
import { ModuleHeader } from "@/components/projects/material-control/ModuleHeader";

const categories = [
  {
    id: "inverters",
    title: "Inverters",
    description: "Hybrid, String, and Micro inverters specifications.",
    icon: Zap,
    color: "from-amber-400 to-orange-500",
    count: 1842
  },
  {
    id: "batteries",
    title: "Battery Modules",
    description: "Lithium-ion packs, BMS, and capacity specs.",
    icon: Battery,
    color: "from-emerald-400 to-teal-500",
    count: 420
  },
  {
    id: "mounting",
    title: "Mounting Systems",
    description: "Rails, clamps, and structural components.",
    icon: CircuitBoard,
    color: "from-blue-400 to-indigo-500",
    count: 215
  },
  {
    id: "cables",
    title: "Cables & Connectors",
    description: "MC4, DC/AC cables, and distribution parts.",
    icon: Cpu,
    color: "from-slate-400 to-slate-600",
    count: 85
  }
];

export default function PackagingSpecsPage() {
  return (
    <div className="min-h-screen pt-20">
      <section className="py-12 md:py-16">
        <div className="container-custom">
          
          <ModuleHeader
            title="Data Specifications"
            description="Select a product category to manage dimensions, weights, and packing standards."
            backHref="/projects/packaging"
            backLabel="Smart Packaging"
          >
            <div className="mt-12">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {categories.map((cat) => {
                  const Icon = cat.icon;
                  return (
                    <Link key={cat.id} href={`/projects/packaging/specs/${cat.id}`} className="block group">
                      <GlassCard
                        className="h-full flex flex-col gap-5 p-6 relative overflow-hidden transition-all duration-300 hover:shadow-xl hover:-translate-y-1 border-white/40"
                      >
                        {/* Hover Gradient Background */}
                        <div className="absolute inset-0 bg-gradient-to-br from-white/40 to-white/10 opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none" />
                        
                        <div className="relative z-10 flex flex-col gap-4">
                          {/* Icon Container */}
                          <div className={`w-14 h-14 rounded-2xl bg-gradient-to-br ${cat.color} flex items-center justify-center text-white shadow-lg group-hover:scale-110 group-hover:rotate-3 transition-transform duration-300`}>
                            <Icon className="w-7 h-7" />
                          </div>
                          
                          <div className="space-y-2 text-left">
                            <h2 className="text-xl font-bold text-slate-800 group-hover:text-indigo-600 transition-colors">
                              {cat.title}
                            </h2>
                            <p className="text-slate-500 text-xs leading-relaxed">
                              {cat.description}
                            </p>
                            <div className="pt-2 flex items-center gap-2">
                              <span className="px-2.5 py-0.5 bg-indigo-50 text-indigo-600 rounded-full text-[10px] font-black uppercase tracking-wider block w-fit">
                                {cat.count} Items
                              </span>
                            </div>
                          </div>
                        </div>
                        
                        {/* Access Indicator */}
                        <div className="mt-auto pt-2 flex items-center text-indigo-600 text-[10px] font-black uppercase tracking-widest opacity-0 group-hover:opacity-100 transition-all duration-300 translate-y-2 group-hover:translate-y-0 relative z-10">
                          View Specs <ChevronRight className="ml-1 w-3 h-3" />
                        </div>
                      </GlassCard>
                    </Link>
                  );
                })}
              </div>
            </div>
          </ModuleHeader>

        </div>
      </section>
    </div>
  );
}
