import Link from "next/link";
import { ClipboardList, Package, ReceiptText, Settings, TrendingUp, History } from "lucide-react";

import { GlassCard } from "@/components/shared/GlassCard";

const sections = [
  {
    title: "Inventory",
    description: "View stock levels, materials, and movements.",
    href: "/projects/material-control/inventory",
    icon: Package,
    iconColor: "from-blue-500 to-cyan-500",
  },
  {
    title: "Requisition",
    description: "Create and track requisitions.",
    href: "/projects/material-control/requisition",
    icon: ClipboardList,
    iconColor: "from-purple-500 to-pink-500",
  },
  {
    title: "Receiving",
    description: "Receive materials and record documents.",
    href: "/projects/material-control/receiving",
    icon: ReceiptText,
    iconColor: "from-green-500 to-emerald-500",
  },
  {
    title: "Activity",
    description: "Track all actions and changes history.",
    href: "/projects/material-control/activity",
    icon: History,
    iconColor: "from-rose-500 to-pink-500",
  },
  {
    title: "Reports",
    description: "Operational reports and exports.",
    href: "/projects/material-control/reports",
    icon: TrendingUp,
    iconColor: "from-amber-500 to-orange-500",
  },
  {
    title: "Settings",
    description: "Module configurations and master data.",
    href: "/projects/material-control/settings",
    icon: Settings,
    iconColor: "from-slate-500 to-slate-600",
  },
] as const;

export default function MaterialControlPage() {
  return (
    <div className="min-h-screen pt-20">
      <section className="py-12 md:py-16">
        <div className="container-custom">


          <div className="text-center mb-12">
            <h1 className="text-3xl md:text-5xl font-bold mb-4">
              <span className="bg-clip-text text-transparent bg-gradient-to-r from-slate-800 via-slate-600 to-slate-800 bg-[length:200%_100%] animate-shimmer">
                Material Control
              </span>
            </h1>
            <p className="text-slate-600 text-lg md:text-xl max-w-2xl mx-auto leading-relaxed">
              Inventory, requisitions, and receiving in one unified module.
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
                    <div className="absolute inset-0 bg-gradient-to-br from-white/40 to-white/10 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                    
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
                    <div className="mt-auto pt-2 flex items-center text-indigo-600 text-sm font-semibold opacity-0 group-hover:opacity-100 transition-all duration-300 translate-y-2 group-hover:translate-y-0">
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
