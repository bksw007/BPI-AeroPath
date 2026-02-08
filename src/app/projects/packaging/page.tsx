"use client";

import Link from "next/link";
import {
  Users,
  Archive,
  History,
  TrendingUp,
  Database,
  LayoutGrid,
  FlaskConical
} from "lucide-react";

import { GlassCard } from "@/components/shared/GlassCard";

const sections = [
  {
    title: "Packing Planning",
    description: "Select Customer & Product to create intelligent packing plans and draft lists.",
    href: "/projects/packaging/planning",
    icon: LayoutGrid,
    iconColor: "from-blue-500 to-cyan-500",
  },
  {
    title: "Customer Config",
    description: "Manage specific packing preferences and rules for each customer.",
    href: "/projects/packaging/customers",
    icon: Users,
    iconColor: "from-purple-500 to-pink-500",
  },
  {
    title: "Product Specs",
    description: "Database of items and their packing requirements/dimensions.",
    href: "/projects/packaging/specs",
    icon: Archive,
    iconColor: "from-blue-500 to-blue-600",
  },
  {
    title: "Activity Log",
    description: "Audit trail and history of all packaging operations.",
    href: "/projects/packaging/activity",
    icon: History,
    iconColor: "from-rose-500 to-pink-500",
  },
  {
    title: "Packing Reports",
    description: "Generate packing lists, historical data, and performance reports.",
    href: "/projects/packaging/reports",
    icon: TrendingUp,
    iconColor: "from-amber-500 to-orange-500",
  },
  {
    title: "Global Database",
    description: "Master database integration for pallets, boxes, and BOM planning.",
    href: "/projects/packaging/database",
    icon: Database,
    iconColor: "from-slate-500 to-slate-600",
  },
  {
    title: "Logic Process",
    description: "Step-by-step visualization and debugging of packing algorithm.",
    href: "/projects/packaging/logic-process",
    icon: FlaskConical,
    iconColor: "from-emerald-500 to-teal-500",
  },
] as const;

export default function PackagingDashboard() {
  return (
    <div className="min-h-screen pt-20">
      <section className="py-12 md:py-16">
        <div className="container-custom">
          
          <div className="text-center mb-12">
            <h1 className="text-3xl md:text-5xl font-bold mb-4">
              <span className="bg-clip-text text-transparent bg-gradient-to-r from-slate-900 via-indigo-700 to-slate-900 bg-[length:200%_100%] animate-shimmer">
                Smart Packaging
              </span>
            </h1>
            <p className="text-slate-600 text-lg md:text-xl max-w-2xl mx-auto leading-relaxed">
              Intelligent packing orchestration and automated list generation.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {sections.map((s) => {
              const Icon = s.icon;
              return (
                <Link key={s.href} href={s.href} className="block group">
                  <GlassCard
                    className="h-full flex flex-col gap-5 p-6 relative overflow-hidden transition-all duration-300 hover:shadow-xl hover:-translate-y-1"
                  >
                    {/* Hover Gradient Background */}
                    <div className="absolute inset-0 bg-gradient-to-br from-white/40 to-white/10 opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none" />
                    
                    <div className="relative z-10 flex flex-col gap-4">
                      {/* Icon Container */}
                      <div
                        className={`w-14 h-14 rounded-2xl bg-gradient-to-br ${s.iconColor} flex items-center justify-center group-hover:scale-110 group-hover:rotate-3 transition-transform duration-300 shadow-lg`}
                      >
                        <Icon className="w-7 h-7 text-white" />
                      </div>

                      <div className="space-y-2">
                        <h2 className="text-xl font-bold text-slate-800 group-hover:text-indigo-600 transition-colors">
                          {s.title}
                        </h2>
                        <p className="text-slate-600 text-sm leading-relaxed">
                          {s.description}
                        </p>
                      </div>
                    </div>
                    
                    {/* Learn More Indicator */}
                    <div className="mt-auto pt-2 flex items-center text-indigo-600 text-sm font-semibold opacity-0 group-hover:opacity-100 transition-all duration-300 translate-y-2 group-hover:translate-y-0 relative z-10">
                      Access Module <span className="ml-1">→</span>
                    </div>
                  </GlassCard>
                </Link>
              );
            })}
          </div>
        </div>
      </section>
    </div>
  );
}
