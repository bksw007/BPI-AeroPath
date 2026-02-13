"use client";

import { useState, useEffect } from "react";
import { 
  FileSpreadsheet, 
  RotateCcw, 
  Play, 
  Box, 
  Layers, 
  AlertTriangle,
  Download,
  CheckCircle2,
  Package,
  FileText,
  Search,
  Users,
  Save,
  Clock // Add Clock Icon
} from "lucide-react";
import { GlassCard } from "@/components/shared/GlassCard";
import { ModuleHeader } from "@/components/projects/material-control/ModuleHeader";
import { CUSTOMER_PACK_TYPE_MAPPING, PACKAGE_MASTER_DATA } from "@/lib/config/packagingData";
import { PackagingService } from "@/lib/firebase/services/packaging.service";
import { PackingLogicService } from "@/lib/services/packing-logic/PackingLogicService";
import type { PackingInput, PackingOutput, PackedCase, PackingPlanResult } from "@/lib/services/packing-logic/packing.types";
import { generatePackingListPDFMake } from "@/lib/utils/pdfMakeGenerator";

// UI Types
interface POCase {
  po: string;
  cases: PackedCase[];
}

interface PlanSummary {
  totalPallets: number;
  totalBoxes: number;
  totalWarps: number;
  totalM3: number;
  totalItems: number;
}

interface RecentPlan {
  id: string;
  customer: { name: string; region: string };
  summary: PlanSummary;
  createdAt: { seconds: number; nanoseconds: number };
  data: string; // JSON string
  poList: string[];
}

export default function PackagingBookingPage() {
  const [activeStep, setActiveStep] = useState(1);
  const [selectedCustomer, setSelectedCustomer] = useState<{code: string; region: string} | null>(null);
  const [rawData, setRawData] = useState("");
  const [isProcessing, setIsProcessing] = useState(false);
  const [planResult, setPlanResult] = useState<POCase[]>([]);
  const [planSummary, setPlanSummary] = useState<PlanSummary | null>(null);
  const [recentPlans, setRecentPlans] = useState<RecentPlan[]>([]);
  const [isHistoryMode, setIsHistoryMode] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [showSuccessModal, setShowSuccessModal] = useState(false);

  // --- Load History on Mount ---
  useEffect(() => {
      loadHistory();
  }, []);

  const loadHistory = async () => {
      const history = await PackagingService.getRecentPackingPlans(3);
      setRecentPlans(history as unknown as RecentPlan[]);
  };

  const handleLoadPlan = (plan: RecentPlan) => {
      try {
          const parsedData = JSON.parse(plan.data);
          setPlanResult(parsedData);
          setPlanSummary(plan.summary);
          setSelectedCustomer({ code: plan.customer.name, region: plan.customer.region });
          setActiveStep(3); // Go to Review
          setIsHistoryMode(true);
      } catch (e) {
          console.error("Failed to load plan", e);
      }
  };

  // --- Save Plan ---
  const handleSavePlan = async () => {
      if (!planResult.length || !selectedCustomer || isHistoryMode) return;
      setIsSaving(true);
      
      try {
          const dataToSave = {
              customer: { id: selectedCustomer.code, name: selectedCustomer.code, region: selectedCustomer.region },
              summary: planSummary!,
              poList: planResult.map(p => p.po),
              data: JSON.stringify(planResult)
          };
          
          const result = await PackagingService.savePackingPlan(dataToSave);
          if (result.success) {
              // alert("Plan saved successfully!"); // Removed alert
              setShowSuccessModal(true); // Show Modal
              setIsHistoryMode(true); // Disable save button
              loadHistory(); // Refresh history
          } else {
              alert("Failed to save plan.");
          }
      } catch (e) {
          console.error("Save error", e);
          alert("Error saving plan.");
      } finally {
          setIsSaving(false);
      }
  };

  // --- 1. Customer Selection ---
  const handleCustomerSelect = (code: string) => {
    const type = CUSTOMER_PACK_TYPE_MAPPING[code] || "E";
    const region = type === "A" ? "Asia" : "US/EU";
    setSelectedCustomer({ code, region });
    setActiveStep(2);
  };

  // --- 2. Data Input ---
  const handleRawInputChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setRawData(e.target.value);
  };

  const handleSampleData = () => {
    const sample = `PO1001\tSKU-INV-001\t500\nPO1001\tSKU-BAT-X1\t20\nPO1002\tSKU-INV-002\t1200`;
    setRawData(sample);
  };

  // --- 3. Generate Plan (Using PackingLogicService) ---
  const handleGeneratePlan = async () => {
    if (!rawData || !selectedCustomer) return;
    setIsProcessing(true);
    setPlanResult([]);
    setPlanSummary(null);

    try {
      // 1. Initialize Service
      const regionCode = selectedCustomer.region === 'US/EU' ? 'E' : 'A';
      
      const service = new PackingLogicService(
        { region: regionCode as 'E' | 'A' | 'R' },
        PACKAGE_MASTER_DATA,
        async (sku: string) => {
           // Fetch from Firebase
           const spec = await PackagingService.getProductSpec(sku);
           if (!spec) return null;
           // Map DTO to internal format if needed 
           // (PackingLogicService handles DTO structure internally now if names match, otherwise mapping needed)
           return spec;
        }
      );
      
      // 2. Prepare Input
      const input: PackingInput = {
        rawData,
        config: { region: regionCode as 'E' | 'A' | 'R' }
      };

      // 3. Execute
      const output: PackingOutput = await service.execute(input);

      // 4. Map Output to UI State
      const mappedResults: POCase[] = [];
      let totalPallets = 0;
      let totalBoxes = 0;
      let totalWarps = 0;
      let totalItems = 0;

      output.results.forEach((res) => {
         const allCases = [
             ...res.warpCases,
             ...res.unknownCases,
             ...res.monoCases,
             ...res.sameCases,
             ...res.mixedCases
         ].sort((a, b) => a.caseNo - b.caseNo);

         if (allCases.length > 0) {
             mappedResults.push({
                 po: res.po,
                 cases: allCases
             });
         }

         // Calc counts
         allCases.forEach(c => {
             if (c.type.includes("Warp")) totalWarps++;
             else if (c.type.includes("Pallet")) totalPallets++;
             else if (c.type.includes("Box")) totalBoxes++;
             
             totalItems += c.items.reduce((sum, i) => sum + i.qty, 0);
         });
      });

      setPlanResult(mappedResults);
      setPlanSummary({
          totalPallets,
          totalBoxes,
          totalWarps,
          totalItems,
          totalM3: 0 // Service doesn't calc total M3 yet
      });
      
      setActiveStep(3);

    } catch (error) {
      console.error("Planning Error:", error);
      alert("Failed to generate plan. Please check input data.");
    } finally {
      setIsProcessing(false);
    }
  };

  const handleExportPDF = () => {
      if (!planResult.length || !selectedCustomer) return;
      
      // Convert POCase back to structure needed by PDF generator if necessary
      // But wait, the generator calls for PackingPlanResult[] which is roughly POCase[] with summary
      // Let's quickly remap or adjust the generator type. 
      // Actually, planResult is POCase[], but generatePackingListPDFMake expects PackingPlanResult[]
      // We need to construct the right object.
      
      const pdfData: PackingPlanResult[] = planResult.map(po => ({
          po: po.po,
          cases: po.cases,
          summary: {
              totalPallets: po.cases.filter(c => c.type.includes("Pallet")).length,
              totalBoxes: po.cases.filter(c => c.type.includes("Box")).length,
              totalItems: po.cases.reduce((sum, c) => sum + c.items.reduce((s, i) => s + i.qty, 0), 0)
          }
      }));

      const poList = planResult.map(p => p.po);
      generatePackingListPDFMake(pdfData, selectedCustomer.code, poList);
  };

  // --- 4. Steps Navigation ---
  const steps = [
    { id: 1, label: "Select Customer", icon: UsersIcon },
    { id: 2, label: "Input Data", icon: FileText },
    { id: 3, label: "Review Plan", icon: CheckCircle2 },
    { id: 4, label: "Save Plan", icon: Save },
  ];

  return (
    <div className="min-h-screen pt-20 pb-20">
      <section className="py-8">
        <div className="container-custom">
          
          <ModuleHeader
             title="Pack Planning"
             description="Generate packing plans from raw PO data."
             backHref="/projects/packaging"
             backLabel="Smart Packaging"
             action={
                 activeStep === 3 && (
                      <button 
                          onClick={() => setActiveStep(4)}
                          className="flex items-center gap-2 px-4 py-2 bg-emerald-600 text-white font-bold rounded-xl hover:bg-emerald-700 shadow-lg shadow-emerald-200 transition-all"
                      >
                          Proceed to Save <Play className="w-4 h-4"/>
                      </button>
                 )
             }
          >
             {/* Stepper */}
             <div className="mt-8 flex items-center justify-center mb-12">
                <div className="flex items-center gap-4">
                    {steps.map((step, idx) => (
                        <div key={step.id} className="flex items-center">
                            <div className={`
                                flex items-center gap-2 px-4 py-2 rounded-full border-2 transition-all
                                ${activeStep === step.id 
                                    ? 'border-indigo-500 bg-indigo-50 text-indigo-700' 
                                    : activeStep > step.id 
                                        ? 'border-emerald-500 bg-emerald-50 text-emerald-700' 
                                        : 'border-slate-200 text-slate-400'
                                }
                            `}>
                                <div className={`
                                    w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold
                                    ${activeStep === step.id ? 'bg-indigo-600 text-white' : activeStep > step.id ? 'bg-emerald-600 text-white' : 'bg-slate-200 text-slate-500'}
                                `}>
                                    {step.id}
                                </div>
                                <span className="font-bold text-sm">{step.label}</span>
                            </div>
                            {idx < steps.length - 1 && (
                                <div className="w-8 h-0.5 bg-slate-200 mx-2" />
                            )}
                        </div>
                    ))}
                </div>
             </div>

             {/* Content Area */}
             <div className="max-w-5xl mx-auto">
                 
                 {/* STEP 1: Customer Selection */}
                 {activeStep === 1 && (
                     <GlassCard className="p-8 animate-in fade-in slide-in-from-bottom-4">
                         <h3 className="text-xl font-bold text-slate-800 mb-6 flex items-center gap-2">
                             <Search className="w-5 h-5 text-indigo-500"/>
                             Select Customer
                         </h3>
                         <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                             {Object.keys(CUSTOMER_PACK_TYPE_MAPPING).map(code => (
                                 <button
                                     key={code}
                                     onClick={() => handleCustomerSelect(code)}
                                     className="p-6 rounded-xl border border-slate-200 hover:border-indigo-500 hover:bg-indigo-50/50 transition-all group text-left"
                                 >
                                     <div className="font-bold text-lg text-slate-700 group-hover:text-indigo-700 mb-1">{code}</div>
                                     <div className="text-xs text-slate-500 font-medium bg-slate-100 px-2 py-1 rounded w-fit group-hover:bg-white">
                                         {CUSTOMER_PACK_TYPE_MAPPING[code] === 'A' ? 'Asia Region' : 'US/EU Region'}
                                     </div>
                                 </button>
                             ))}
                         </div>

                          {/* Recent History Section */}
                          <div className="pt-6 border-t border-slate-100 mt-6">
                                <h4 className="text-sm font-bold text-slate-400 uppercase tracking-wider mb-4 flex items-center gap-2">
                                    <Clock className="w-4 h-4"/> Recent Calculations
                                </h4>
                                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                    {recentPlans.map(plan => (
                                        <button 
                                            key={plan.id}
                                            onClick={() => handleLoadPlan(plan)}
                                            className="p-4 bg-white/50 border border-slate-200 rounded-xl hover:border-indigo-400 hover:bg-white text-left transition-all group shadow-sm hover:shadow-md"
                                        >
                                            <div className="flex justify-between items-start mb-2">
                                                <span className="font-bold text-slate-700 group-hover:text-indigo-700">{plan.customer.name}</span>
                                                <span className="text-[10px] bg-slate-100 text-slate-500 px-1.5 py-0.5 rounded-md group-hover:bg-indigo-50 group-hover:text-indigo-600">
                                                    {plan.createdAt?.seconds ? new Date(plan.createdAt?.seconds * 1000).toLocaleDateString() : 'Just now'}
                                                </span>
                                            </div>
                                            <div className="text-xs text-slate-500 space-y-1">
                                                <div className="flex justify-between">
                                                    <span>POs: {plan.poList.length}</span>
                                                    <span>Item: {plan.summary.totalItems}</span>
                                                </div>
                                                <div className="flex justify-between font-medium text-slate-600">
                                                    <span>Pallets: {plan.summary.totalPallets}</span>
                                                    <span>Boxes: {plan.summary.totalBoxes}</span>
                                                </div>
                                            </div>
                                        </button>
                                    ))}
                                    {recentPlans.length === 0 && (
                                        <div className="col-span-3 text-center py-8 text-slate-400 text-sm italic bg-slate-50/50 rounded-xl border border-dashed border-slate-200">
                                            No recent history found.
                                        </div>
                                    )}
                                </div>
                          </div>
                     </GlassCard>
                 )}

                 {/* STEP 2: Input Data */}
                 {activeStep === 2 && (
                     <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 animate-in fade-in slide-in-from-bottom-4">
                         <div className="lg:col-span-2">
                             <GlassCard className="p-6 h-full flex flex-col">
                                 <div className="flex justify-between items-center mb-4">
                                     <h3 className="font-bold text-slate-800 flex items-center gap-2">
                                         <FileSpreadsheet className="w-5 h-5 text-emerald-500"/>
                                         Paste Raw Data
                                     </h3>
                                     <button onClick={handleSampleData} className="text-xs text-indigo-600 font-bold hover:underline">
                                         Load Sample
                                     </button>
                                 </div>
                                 <textarea
                                     value={rawData}
                                     onChange={handleRawInputChange}
                                     placeholder={`Paste form Excel (PO, SKU, QTY)\nExample:\nPO123  SKU001  100\nPO123  SKU002  50`}
                                     className="flex-1 w-full bg-slate-50 border border-slate-200 rounded-xl p-4 font-mono text-sm focus:ring-2 focus:ring-indigo-500 outline-none resize-none min-h-[300px]"
                                 />
                                 <div className="mt-4 flex justify-between items-center">
                                     <button onClick={() => setActiveStep(1)} className="text-slate-500 hover:text-slate-700 font-bold text-sm">
                                         Back
                                     </button>
                                     <button 
                                         onClick={handleGeneratePlan}
                                         disabled={!rawData || isProcessing}
                                         className="px-6 py-3 bg-indigo-600 text-white font-bold rounded-xl hover:bg-indigo-700 shadow-lg shadow-indigo-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                                     >
                                         {isProcessing ? (
                                             <>Processing...</>
                                         ) : (
                                             <>Generate Plan <Play className="w-4 h-4 fill-current"/></>
                                         )}
                                     </button>
                                 </div>
                             </GlassCard>
                         </div>
                         
                         <div className="space-y-6">
                             <GlassCard className="p-6 bg-indigo-900/5 border-indigo-100">
                                 <h4 className="font-bold text-indigo-900 mb-2">Selected Context</h4>
                                 <div className="flex items-center justify-between bg-white p-3 rounded-lg border border-indigo-100 mb-3">
                                     <span className="text-sm text-slate-500">Customer</span>
                                     <span className="font-bold text-indigo-700 text-lg">{selectedCustomer?.code}</span>
                                 </div>
                                 <div className="flex items-center justify-between bg-white p-3 rounded-lg border border-indigo-100">
                                     <span className="text-sm text-slate-500">Region</span>
                                     <span className="font-bold text-indigo-700">{selectedCustomer?.region}</span>
                                 </div>
                             </GlassCard>

                             <GlassCard className="p-6">
                                 <h4 className="font-bold text-slate-800 mb-4">Tips</h4>
                                 <ul className="space-y-2 text-sm text-slate-600">
                                     <li className="flex gap-2">
                                         <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
                                         <span>Copy directly from Excel/Sheets</span>
                                     </li>
                                     <li className="flex gap-2">
                                         <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
                                         <span>Ensure columns are PO, SKU, Qty</span>
                                     </li>
                                     <li className="flex gap-2">
                                         <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
                                         <span>System auto-fetches specs</span>
                                     </li>
                                 </ul>
                             </GlassCard>
                         </div>
                     </div>
                 )}

                 {/* STEP 3: Results */}
                 {activeStep === 3 && planSummary && (
                     <div className="animate-in fade-in slide-in-from-bottom-4 space-y-6">
                         {/* Summary Cards */}
                         <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                             <SummaryCard label="Total Pallets" value={planSummary.totalPallets} icon={Layers} color="amber" />
                             <SummaryCard label="Total Boxes" value={planSummary.totalBoxes} icon={Box} color="blue" />
                             <SummaryCard label="Warp Items" value={planSummary.totalWarps} icon={AlertTriangle} color="red" />
                             <SummaryCard label="Total Items" value={planSummary.totalItems} icon={Package} color="emerald" />
                         </div>

                         {/* Results Table */}
                         <div className="space-y-8">
                             {planResult.map((poGroup) => (
                                 <GlassCard key={poGroup.po} className="overflow-hidden">
                                     <div className="bg-slate-50/50 p-4 border-b border-white/10 flex justify-between items-center backdrop-blur-sm">
                                         <div className="flex items-center gap-3">
                                             <div className="w-10 h-10 rounded-lg bg-indigo-100 text-indigo-600 flex items-center justify-center font-bold shadow-sm">
                                                 PO
                                             </div>
                                             <div>
                                                 <h3 className="font-bold text-lg text-slate-800">{poGroup.po}</h3>
                                                 <p className="text-xs text-slate-500 font-medium">{poGroup.cases.length} Cases Generated</p>
                                             </div>
                                         </div>
                                     </div>
                                     <div className="overflow-x-auto">
                                         <table className="w-full text-sm text-left">
                                             <thead className="bg-slate-50 text-xs font-bold text-slate-500 uppercase">
                                                 <tr>
                                                     <th className="px-6 py-3">Case #</th>
                                                     <th className="px-6 py-3">Type</th>
                                                     <th className="px-6 py-3">Contents (SKU / Qty)</th>
                                                     <th className="px-6 py-3">Dimensions</th>
                                                     <th className="px-6 py-3">Note</th>
                                                 </tr>
                                             </thead>
                                             <tbody className="divide-y divide-slate-100">
                                                 {poGroup.cases.map((c, idx) => (
                                                     <tr key={idx} className="hover:bg-slate-50/50 transition-colors">
                                                         <td className="px-6 py-4 font-mono text-slate-500">#{c.caseNo}</td>
                                                         <td className="px-6 py-4">
                                                             <Badge type={c.type} />
                                                         </td>
                                                         <td className="px-6 py-4">
                                                             <div className="space-y-1">
                                                                 {c.items.map((item, i) => (
                                                                     <div key={i} className="flex items-center justify-between text-xs max-w-[200px]">
                                                                         <span className="font-medium text-slate-700 truncate mr-2" title={item.name || item.sku}>{item.sku}</span>
                                                                         <span className="font-bold text-slate-400 bg-slate-100 px-1.5 py-0.5 rounded">x{item.qty}</span>
                                                                     </div>
                                                                 ))}
                                                             </div>
                                                         </td>
                                                         <td className="px-6 py-4 font-mono text-xs text-slate-500">
                                                             {c.dims}
                                                         </td>
                                                         <td className="px-6 py-4 text-xs text-slate-500 italic">
                                                             {c.note || "-"}
                                                         </td>
                                                     </tr>
                                                 ))}
                                             </tbody>
                                         </table>
                                     </div>
                                 </GlassCard>
                             ))}
                         </div>

                         <div className="flex justify-center pt-8 gap-4">
                              <button 
                                  onClick={() => { setActiveStep(2); setPlanResult([]); setIsHistoryMode(false); }}
                                  className="px-6 py-3 border-2 border-slate-200 text-slate-500 font-bold rounded-xl hover:border-slate-400 hover:text-slate-700 transition-all flex items-center gap-2"
                              >
                                  <RotateCcw className="w-4 h-4"/> Back to Input
                              </button>
                              <button 
                                 onClick={() => setActiveStep(4)}
                                 className="px-8 py-3 bg-emerald-600 text-white font-bold rounded-xl hover:bg-emerald-700 shadow-lg shadow-emerald-200 transition-all flex items-center gap-2"
                             >
                                 Proceed to Save <Play className="w-4 h-4"/>
                             </button>
                         </div>
                     </div>
                 )}

                 {/* STEP 4: Save & Export */}
                 {activeStep === 4 && planSummary && (
                     <div className="animate-in fade-in slide-in-from-bottom-4 max-w-2xl mx-auto text-center space-y-8">
                          <GlassCard className="p-12 flex flex-col items-center justify-center gap-6 border-emerald-100 bg-emerald-50/30">
                              <div className="w-20 h-20 bg-emerald-100 rounded-full flex items-center justify-center text-emerald-600 mb-2">
                                  <CheckCircle2 className="w-10 h-10" />
                              </div>
                              <h2 className="text-3xl font-black text-slate-800">Plan Ready!</h2>
                              <p className="text-slate-500 max-w-md">
                                  Your packing plan has been generated successfully. You can now download the PDF report or save this plan to the database.
                              </p>
                              
                              <div className="grid grid-cols-2 gap-4 w-full max-w-md mt-4">
                                  <button 
                                      onClick={handleSavePlan}
                                      disabled={isHistoryMode || isSaving}
                                      className={`flex flex-col items-center justify-center gap-3 p-6 bg-white border-2 rounded-2xl transition-all group ${
                                          isHistoryMode || isSaving 
                                          ? 'border-slate-100 opacity-50 cursor-not-allowed' 
                                          : 'border-slate-100 hover:border-emerald-500 hover:bg-emerald-50 cursor-pointer'
                                      }`}
                                  >
                                      {isHistoryMode ? (
                                          <>
                                            <CheckCircle2 className="w-8 h-8 text-emerald-500"/>
                                            <span className="font-bold text-emerald-600">Saved to DB</span>
                                          </>
                                      ) : (
                                          <>
                                            <Save className={`w-8 h-8 text-slate-400 ${!isSaving && 'group-hover:text-emerald-600'} transition-colors`}/>
                                            <span className={`font-bold text-slate-600 ${!isSaving && 'group-hover:text-emerald-800'}`}>
                                                {isSaving ? 'Saving...' : 'Save to DB'}
                                            </span>
                                          </>
                                      )}
                                  </button>
                                  
                                  <button 
                                      onClick={handleExportPDF}
                                      className="flex flex-col items-center justify-center gap-3 p-6 bg-white border-2 border-slate-100 rounded-2xl hover:border-indigo-500 hover:bg-indigo-50 transition-all group"
                                  >
                                      <Download className="w-8 h-8 text-slate-400 group-hover:text-indigo-600 transition-colors"/>
                                      <span className="font-bold text-slate-600 group-hover:text-indigo-800">Download PDF</span>
                                  </button>
                              </div>
                          </GlassCard>

                           <button 
                               onClick={() => { setActiveStep(1); setPlanResult([]); setIsHistoryMode(false); }}
                               className="px-8 py-3 bg-slate-800 text-white font-bold rounded-xl hover:bg-slate-700 shadow-lg shadow-slate-200 transition-all flex items-center justify-center gap-2 mx-auto w-full max-w-xs"
                           >
                               <RotateCcw className="w-4 h-4"/> Start New Plan
                           </button>
                     </div>
                 )}
             </div>
          </ModuleHeader>

        </div>
      </section>

      {/* Success Modal */}
      {showSuccessModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/20 backdrop-blur-sm animate-in fade-in">
          <div className="bg-white rounded-2xl shadow-2xl p-8 max-w-sm w-full text-center space-y-6 animate-in zoom-in-95">
             <div className="w-16 h-16 bg-emerald-100 rounded-full flex items-center justify-center mx-auto text-emerald-600">
                <CheckCircle2 className="w-8 h-8" />
             </div>
             <div>
                <h3 className="text-xl font-bold text-slate-800">Saved Successfully!</h3>
                <p className="text-slate-500 text-sm mt-2">
                   The packing plan has been saved to the database.
                </p>
             </div>
             
             <button 
                onClick={handleExportPDF}
                className="w-full py-3 bg-indigo-600 text-white font-bold rounded-xl hover:bg-indigo-700 shadow-lg shadow-indigo-200 transition-all flex items-center justify-center gap-2"
             >
                <Download className="w-5 h-5"/> Download PDF
             </button>

             <button 
                onClick={() => setShowSuccessModal(false)}
                className="text-slate-400 hover:text-slate-600 text-sm font-bold"
             >
                Close
             </button>
          </div>
        </div>
      )}
    </div>
  );
}

// --- Subcomponents ---

interface SummaryCardProps {
    label: string;
    value: number;
    icon: React.ElementType;
    color: 'amber' | 'blue' | 'red' | 'emerald';
}

function SummaryCard({ label, value, icon: Icon, color }: SummaryCardProps) {
    const colors = {
        amber: "bg-amber-100 text-amber-600",
        blue: "bg-blue-100 text-blue-600",
        red: "bg-red-100 text-red-600",
        emerald: "bg-emerald-100 text-emerald-600",
    };

    return (
        <GlassCard className="p-4 flex items-center gap-4">
            <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${colors[color]} shadow-sm`}>
                <Icon className="w-6 h-6" />
            </div>
            <div>
                <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">{label}</p>
                <p className="text-2xl font-black text-slate-800">{value}</p>
            </div>
        </GlassCard>
    );
}

function Badge({ type }: { type: string }) {
    let style = "bg-slate-100 text-slate-600";
    if (type.includes("Full Pallet")) style = "bg-emerald-100 text-emerald-700 border border-emerald-200";
    else if (type.includes("Partial")) style = "bg-blue-50 text-blue-600 border border-blue-100";
    else if (type.includes("Mixed")) style = "bg-indigo-50 text-indigo-600 border border-indigo-100";
    else if (type.includes("Warp")) style = "bg-red-50 text-red-600 border border-red-100";
    else if (type.includes("Unknown")) style = "bg-amber-50 text-amber-600 border border-amber-100";

    return (
        <span className={`px-2.5 py-1 rounded-md text-[10px] font-bold uppercase tracking-wide ${style}`}>
            {type}
        </span>
    );
}

function UsersIcon({ className }: { className?: string }) {
    return <Users className={className} />;
}
