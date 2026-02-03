"use client";

import { useState } from "react";
import { 
  Users, 
  Archive, 
  Boxes, 
  ChevronRight, 
  Search,
  Plus
} from "lucide-react";
import { GlassCard } from "@/components/shared/GlassCard";

const steps = ["Select Customer", "Select Products", "Define Planning", "Review & Generate"];

export default function PackagingPlanningPage() {
  const [currentStep, setCurrentStep] = useState(0);

  return (
    <div className="min-h-screen pt-20">
      <section className="py-12">
        <div className="container-custom">
          
          <div className="mb-12">
            <h1 className="text-3xl font-bold text-slate-900 mb-2">Packing Planning</h1>
            <p className="text-slate-500">Create a new intelligent packing plan based on customer requirements.</p>
          </div>

          {/* Stepper */}
          <div className="flex items-center gap-4 mb-10 overflow-x-auto pb-4 px-2">
            {steps.map((step, idx) => (
              <div key={step} className="flex items-center gap-4 flex-shrink-0">
                <div className="flex items-center gap-3">
                  <div className={cn(
                    "w-10 h-10 rounded-xl flex items-center justify-center font-bold transition-all",
                    currentStep >= idx 
                      ? "bg-indigo-600 text-white shadow-lg shadow-indigo-200" 
                      : "bg-white/50 text-slate-400 border border-slate-200"
                  )}>
                    {idx + 1}
                  </div>
                  <span className={cn(
                    "text-sm font-bold whitespace-nowrap",
                    currentStep >= idx ? "text-indigo-600" : "text-slate-400"
                  )}>
                    {step}
                  </span>
                </div>
                {idx < steps.length - 1 && (
                  <ChevronRight className="w-4 h-4 text-slate-300" />
                )}
              </div>
            ))}
          </div>

          {/* Main Workspace */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
            <div className="lg:col-span-8">
              <GlassCard className="p-8 min-h-[400px]">
                {currentStep === 0 && (
                  <div className="animate-fade-in">
                    <div className="flex justify-between items-center mb-6">
                      <h3 className="text-xl font-bold text-slate-800">Select Customer</h3>
                      <button className="flex items-center gap-2 text-indigo-600 font-bold text-sm hover:underline">
                        <Plus className="w-4 h-4" /> Add New Customer
                      </button>
                    </div>
                    
                    <div className="relative mb-6">
                      <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                      <input 
                        type="text" 
                        placeholder="Search customer name or ID..."
                        className="w-full pl-12 pr-4 py-3 bg-white/50 border border-slate-200 rounded-2xl focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-400 outline-none transition-all placeholder:text-slate-400"
                      />
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      {/* Mock Customers */}
                      {[1, 2, 3, 4].map((c) => (
                        <div key={c} className="p-4 bg-white/40 border border-white hover:border-indigo-200 rounded-2xl cursor-pointer transition-all hover:shadow-md group">
                           <div className="flex items-center gap-4">
                             <div className="w-12 h-12 bg-indigo-50 rounded-xl flex items-center justify-center text-indigo-600 group-hover:bg-indigo-600 group-hover:text-white transition-colors">
                               <Users className="w-6 h-6" />
                             </div>
                             <div>
                               <h4 className="font-bold text-slate-800">Customer Alpha {c}</h4>
                               <p className="text-xs text-slate-500">ID: CUS-00{c}</p>
                             </div>
                           </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {currentStep > 0 && (
                  <div className="flex flex-col items-center justify-center h-[300px] text-slate-400">
                    <Boxes className="w-16 h-16 mb-4 opacity-20" />
                    <p>Workspace for Step {currentStep + 1} is under construction.</p>
                  </div>
                )}
              </GlassCard>
            </div>

            <div className="lg:col-span-4">
              <GlassCard className="p-6 sticky top-32">
                 <h3 className="text-lg font-bold text-slate-800 mb-4">Plan Summary</h3>
                 <div className="space-y-4 mb-8">
                   <div className="flex justify-between text-sm">
                     <span className="text-slate-500">Customer:</span>
                     <span className="font-bold text-slate-800">—</span>
                   </div>
                   <div className="flex justify-between text-sm">
                     <span className="text-slate-500">Products:</span>
                     <span className="font-bold text-slate-800">0 items</span>
                   </div>
                   <div className="flex justify-between text-sm">
                     <span className="text-slate-500">Pallet Req:</span>
                     <span className="font-bold text-slate-800">—</span>
                   </div>
                 </div>

                 <button 
                  onClick={() => setCurrentStep(prev => Math.min(prev + 1, steps.length - 1))}
                  className="w-full py-4 bg-indigo-600 text-white rounded-2xl font-bold shadow-lg shadow-indigo-600/20 hover:bg-indigo-700 transition-all flex items-center justify-center gap-2"
                 >
                   Continue to Next Step <ChevronRight className="w-4 h-4" />
                 </button>
              </GlassCard>
            </div>
          </div>

        </div>
      </section>
    </div>
  );
}

// ------------------------------------------------------------------
// 🛠️ Local Utility for className merging if cn is not exported properly
// ------------------------------------------------------------------
function cn(...inputs: any[]) {
  return inputs.filter(Boolean).join(" ");
}
