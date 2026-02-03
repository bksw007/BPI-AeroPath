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
            <div className="space-y-10 mt-12">
              <div className="relative group max-w-3xl mx-auto">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400 group-focus-within:text-indigo-500 transition-colors" />
                <input 
                  type="text" 
                  placeholder="Search category or product type..." 
                  className="w-full pl-12 pr-4 py-4 bg-white/40 backdrop-blur-md border border-white/40 rounded-2xl outline-none focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-400 transition-all text-slate-700 placeholder:text-slate-400 shadow-sm"
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {categories.map((cat) => {
                  const Icon = cat.icon;
                  return (
                    <Link key={cat.id} href={`/projects/packaging/specs/${cat.id}`} className="block group">
                      <GlassCard
                        className="p-8 flex items-center justify-between group-hover:bg-white/30 transition-all duration-300 border-white/40"
                        hoverEffect
                      >
                        <div className="flex items-center gap-6">
                          <div className={`w-16 h-16 rounded-2xl bg-gradient-to-br ${cat.color} flex items-center justify-center text-white shadow-lg group-hover:scale-110 group-hover:rotate-3 transition-transform duration-300`}>
                            <Icon className="w-8 h-8" />
                          </div>
                          <div className="space-y-1 text-left">
                            <h2 className="text-2xl font-bold text-slate-800 group-hover:text-indigo-600 transition-colors">
                              {cat.title}
                            </h2>
                            <p className="text-slate-500 text-sm leading-relaxed max-w-xs">
                              {cat.description}
                            </p>
                            <div className="pt-2 flex items-center gap-2">
                              <span className="px-2.5 py-0.5 bg-indigo-50 text-indigo-600 rounded-full text-[10px] font-black uppercase tracking-wider">
                                {cat.count} Items
                              </span>
                            </div>
                          </div>
                        </div>
                        <div className="p-3 bg-slate-50 rounded-xl group-hover:bg-indigo-600 group-hover:text-white transition-all duration-300 translate-x-1 group-hover:translate-x-0">
                          <ChevronRight className="w-5 h-5" />
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
