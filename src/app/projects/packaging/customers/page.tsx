"use client";

import { Users, Plus, Search, Filter } from "lucide-react";
import { GlassCard } from "@/components/shared/GlassCard";

export default function PackagingCustomersPage() {
  return (
    <div className="min-h-screen pt-20">
      <section className="py-12">
        <div className="container-custom">
          
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-10">
            <div>
              <h1 className="text-3xl font-bold text-slate-900 mb-2">Customer Config</h1>
              <p className="text-slate-500">Manage packing preferences and automated rules per customer.</p>
            </div>
            <button className="px-6 py-3 bg-indigo-600 text-white rounded-2xl font-bold shadow-lg shadow-indigo-600/20 hover:bg-indigo-700 transition-all flex items-center gap-2">
              <Plus className="w-5 h-5" /> New Configuration
            </button>
          </div>

          <GlassCard className="p-4 mb-8">
            <div className="flex flex-col md:flex-row gap-4">
              <div className="flex-1 relative">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                <input 
                  type="text" 
                  placeholder="Search customers..." 
                  className="w-full pl-12 pr-4 py-3 bg-white/50 border border-slate-200 rounded-xl outline-none focus:border-indigo-400 transition-all"
                />
              </div>
              <button className="px-6 py-3 bg-white border border-slate-200 text-slate-600 rounded-xl font-bold flex items-center gap-2 hover:bg-slate-50 transition-all">
                <Filter className="w-5 h-5" /> Filters
              </button>
            </div>
          </GlassCard>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <GlassCard key={i} hoverEffect className="p-6 group">
                <div className="flex items-center gap-4 mb-6">
                  <div className="w-14 h-14 bg-indigo-50 rounded-2xl flex items-center justify-center text-indigo-600 group-hover:bg-indigo-600 group-hover:text-white transition-all duration-300">
                    <Users className="w-7 h-7" />
                  </div>
                  <div>
                    <h3 className="font-bold text-slate-800">Customer Name {i}</h3>
                    <p className="text-xs text-slate-400">Since: 12-01-2026</p>
                  </div>
                </div>

                <div className="space-y-3 mb-6">
                  <div className="flex justify-between text-sm">
                    <span className="text-slate-500">Pallet Standard:</span>
                    <span className="font-bold text-slate-700">Plastic 110x110</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-slate-500">Pack Style:</span>
                    <span className="font-bold text-slate-700">Stacked</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-slate-500">Active Plans:</span>
                    <span className="px-2 py-0.5 bg-emerald-50 text-emerald-600 rounded-lg text-[10px] font-bold">4 Active</span>
                  </div>
                </div>

                <button className="w-full py-2.5 bg-slate-100 hover:bg-indigo-600 hover:text-white text-slate-600 rounded-xl font-bold text-sm transition-all">
                  Edit Preferences
                </button>
              </GlassCard>
            ))}
          </div>

        </div>
      </section>
    </div>
  );
}
