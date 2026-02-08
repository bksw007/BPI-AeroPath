"use client";

import { useState, useEffect } from "react";
import { Modal } from "@/components/shared/Modal";
import { 
  Boxes, 
  ChevronRight, 
  Search, 
  Save, 
  FileText, 
  Table, 
  CheckCircle2, 
  Download, 
  AlertCircle,
  XCircle
} from 'lucide-react';
import { GlassCard } from "@/components/shared/GlassCard";
import { ModuleHeader } from "@/components/projects/material-control/ModuleHeader";
import { CUSTOMER_PACK_TYPE_MAPPING, getRegionByType } from "@/lib/config/packagingData";
import { cn } from "@/lib/utils";

// ------------------------------------------------------------------
// 🧠 Logic & Services
// ------------------------------------------------------------------
import { PackagingService, PackagingProductDTO } from "@/lib/firebase/services/packaging.service";
import { generatePackingPlan, PackingPlanResult, ProductSpec } from "@/lib/services/packingLogic";
import { generatePackingListPDF } from "@/lib/utils/pdfGenerator";

const steps = ["Select Customer", "Input Products", "Review Plan", "Generate"];

interface PlanningItem {
  id: string;
  po: string;
  sku: string;
  qty: number;
}

interface Customer {
  id: string;
  name: string;
  region: 'US/EU' | 'Asia';
  productPlan?: 'Inverter' | 'Material';
}

export default function PackagingPlanningPage() {
  const [currentStep, setCurrentStep] = useState(0);
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);
  const [rawInput, setRawInput] = useState("");
  const [parsedItems, setParsedItems] = useState<PlanningItem[]>([]);
  const [planningResults, setPlanningResults] = useState<PackingPlanResult[]>([]);
  const [isComputing, setIsComputing] = useState(false);

  // Modal States
  const [isSuccessModalOpen, setIsSuccessModalOpen] = useState(false);
  const [successConfig, setSuccessConfig] = useState({ title: "", description: "", type: "success" as "success" | "error" | "download" });
  
  const [isConfirmModalOpen, setIsConfirmModalOpen] = useState(false);
  const [confirmConfig, setConfirmConfig] = useState({ title: "", message: "", onConfirm: () => {} });

  // Auto-close Success Modal
  useEffect(() => {
    if (isSuccessModalOpen) {
      const timer = setTimeout(() => setIsSuccessModalOpen(false), 1500);
      return () => clearTimeout(timer);
    }
  }, [isSuccessModalOpen]);

  // Parser Logic
  const handleRawInputChange = (input: string) => {
    setRawInput(input);
    const lines = input.split('\n');
    const items: PlanningItem[] = [];

    lines.forEach(line => {
      const parts = line.trim().split(/[\t,]+/); // Split by Tab or Comma
      if (parts.length >= 3) {
        // Try to handle spaces if tab/comma parsing failed
        const po = parts[0].trim();
        const sku = parts[1].trim();
        const qtyStr = parts[2].replace(/,/g, '').trim();
        const qty = parseInt(qtyStr);

        if (po && sku && !isNaN(qty)) {
          items.push({
            id: Math.random().toString(36).substr(2, 9),
            po,
            sku,
            qty
          });
        }
      } else {
        // Fallback for space separation
        const spaceParts = line.trim().split(/\s+/);
        if (spaceParts.length >= 3) {
             const po = spaceParts[0].trim();
             const qtyStr = spaceParts[spaceParts.length - 1].replace(/,/g, '').trim();
             const qty = parseInt(qtyStr);
             const sku = spaceParts.slice(1, spaceParts.length - 1).join(" ");
             
             if (po && sku && !isNaN(qty)) {
                items.push({
                    id: Math.random().toString(36).substr(2, 9),
                    po,
                    sku,
                    qty
                });
             }
        }
      }
    });

    // ========== AGGREGATE & SORT ==========
    // 1. Merge items with same PO + SKU (sum quantities)
    const aggregated = new Map<string, PlanningItem>();
    
    for (const item of items) {
      const key = `${item.po}|${item.sku}`;
      if (aggregated.has(key)) {
        const existing = aggregated.get(key)!;
        existing.qty += item.qty;
      } else {
        aggregated.set(key, { ...item });
      }
    }
    
    // 2. Convert back to array and sort
    const sortedItems = Array.from(aggregated.values())
      .sort((a, b) => {
        // First sort by PO
        if (a.po !== b.po) return a.po.localeCompare(b.po);
        // Then by qty (descending)
        return b.qty - a.qty;
      });

    setParsedItems(sortedItems);
  };

  // 1. Fetch Specs & Compute
  const handleGeneratePlan = async () => {
    setIsComputing(true);
    try {
      // 0. Validation
      if (!selectedCustomer) throw new Error("No Customer Selected");
      if (parsedItems.length === 0) throw new Error("No Items to pack");

      // 1. Fetch Specs
      const allSpecs = await PackagingService.getByCategory("Inverters"); 
      const specMap: Record<string, ProductSpec> = {};
      
      allSpecs.forEach((s: PackagingProductDTO) => {
          // Map DTO to Logic Spec
          specMap[s.sku] = {
              sku: s.sku,
              name: s.name,
              width: s.width,
              length: s.length,
              height: s.height,
              m3: (s.width * s.length * s.height) / 1000000, // naive m3 calculation if not provided
              packingRules: s.packingRules
          };
      });

      // 2. Group by PO
      const poGroups: Record<string, PlanningItem[]> = {};
      parsedItems.forEach(item => {
        if (!poGroups[item.po]) poGroups[item.po] = [];
        poGroups[item.po].push(item);
      });

      // 3. Process each PO
      const results: PackingPlanResult[] = [];
      
      for (const po of Object.keys(poGroups)) {
          const items = poGroups[po].map(i => ({ sku: i.sku, qty: i.qty }));
          
          try {
              const plan = generatePackingPlan(
                  po,
                  items,
                  specMap,
                  selectedCustomer.name, // Customer Code
                  false // Quick Mode (true for full 3D check)
              );
              results.push(plan);
          } catch (poError) {
              console.error(`Error packing PO ${po}:`, poError);
              // Push error result or handle gracefully
          }
      }

      setPlanningResults(results);
      setCurrentStep(2); // Go to Review
    } catch (error) {
       console.error("Planning Error", error);
       alert("Error generating plan. Check console for details.");
    } finally {
       setIsComputing(false);
    }
  };

  // 2. Actions
  // A. Save to DB
  const handleSavePlan = async () => {
    if (!selectedCustomer || planningResults.length === 0) return;

    // Calculate Summary
    const totalPallets = planningResults.reduce((acc, r) => acc + r.summary.totalPallets, 0);
    const totalBoxes = planningResults.reduce((acc, r) => acc + r.summary.totalBoxes, 0);
    const totalWarps = planningResults.reduce((acc, r) => acc + r.summary.totalWarps, 0);
    const totalItems = planningResults.reduce((acc, r) => acc + r.summary.totalItems, 0);
    const poList = [...new Set(planningResults.map(r => r.po))];

    setConfirmConfig({
      title: "Save Packing Plan",
      message: `Do you want to save this plan to the database?\nTotal Pallets: ${totalPallets} | Boxes: ${totalBoxes} | Warps: ${totalWarps}`,
      onConfirm: async () => {
        setIsConfirmModalOpen(false);
        try {
            const saveResult = await PackagingService.savePackingPlan({
                customer: { id: selectedCustomer.id, name: selectedCustomer.name, region: selectedCustomer.region },
                summary: { totalPallets, totalBoxes, totalWarps, totalItems },
                poList: poList,
                data: JSON.stringify(planningResults)
            });

            if (saveResult.success) {
                setSuccessConfig({
                    title: "Saved!",
                    description: "Planning data synced to Firestore.",
                    type: "success"
                });
                setIsSuccessModalOpen(true);
            } else {
                setSuccessConfig({
                    title: "Error",
                    description: "Failed to save plan.",
                    type: "error"
                });
                setIsSuccessModalOpen(true);
            }
        } catch (error) {
            console.error("Save Error:", error);
            setSuccessConfig({
                title: "Error",
                description: "An unexpected error occurred.",
                type: "error"
            });
            setIsSuccessModalOpen(true);
        }
      }
    });
    setIsConfirmModalOpen(true);
  };

  // B. Export PDF
  const handleExportPDF = () => {
     if (!selectedCustomer || planningResults.length === 0) return;
     try {
         const poList = [...new Set(planningResults.map(r => r.po))];
         generatePackingListPDF(planningResults, selectedCustomer.name, poList);
         
         setSuccessConfig({
             title: "PDF Exported!",
             description: "Your packing list is downloading.",
             type: "download"
         });
         setIsSuccessModalOpen(true);
     } catch (error) {
         console.error("PDF Error:", error);
     }
  };

  // C. Export CSV
  const handleExportCSV = () => {
     if (!selectedCustomer || planningResults.length === 0) return;
     
     try {
         // Headers
         let csvContent = "data:text/csv;charset=utf-8,";
         csvContent += "PO,Case No,Type,SKU,Item Name,QTY,Dimensions,Note\n";

         // Rows
         planningResults.forEach(plan => {
            plan.cases.forEach(c => {
                c.items.forEach(item => {
                    const row = [
                        plan.po,
                        c.caseNo,
                        c.type,
                        item.sku,
                        `"${item.name}"`, 
                        item.qty,
                        c.dims || "",
                        c.note || ""
                    ];
                    csvContent += row.join(",") + "\n";
                });
            });
         });

         // Download
         const now = new Date();
         const timestamp = now.getFullYear().toString() +
           (now.getMonth() + 1).toString().padStart(2, '0') +
           now.getDate().toString().padStart(2, '0') +
           now.getHours().toString().padStart(2, '0') +
           now.getMinutes().toString().padStart(2, '0');

         const encodedUri = encodeURI(csvContent);
         const link = document.createElement("a");
         link.setAttribute("href", encodedUri);
         link.setAttribute("download", `PackingPlan_${selectedCustomer.name}_${timestamp}.csv`);
         document.body.appendChild(link);
         link.click();
         document.body.removeChild(link);

         setSuccessConfig({
             title: "CSV Exported!",
             description: "Excel compatible file downloaded.",
             type: "download"
         });
         setIsSuccessModalOpen(true);
     } catch (error) {
         console.error("CSV Error:", error);
     }
  };

  return (
    <div className="min-h-screen pt-20">
      <section className="py-12">
        <div className="container-custom">
          
          <ModuleHeader
             title="Packing Planning"
             description="Select Customer & Product to create intelligent packing plans and draft lists."
             backHref="/projects/packaging"
             backLabel="Smart Packaging"
          >
          
          <div className="mb-8 mt-8">
            <div className="flex justify-between items-center max-w-3xl mx-auto">
              {steps.map((step, idx) => (
                <div key={idx} className="flex items-center gap-4">
                  <div className="flex items-center gap-2">
                    <div className={cn(
                      "w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm transition-all",
                      currentStep === idx ? "bg-indigo-600 text-white shadow-lg shadow-indigo-600/30 ring-4 ring-indigo-50" :
                      currentStep > idx ? "bg-emerald-500 text-white" :
                      "bg-slate-100 text-slate-400"
                    )}>
                      {currentStep > idx ? "✓" : idx + 1}
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
          </div>

          {/* Main Workspace */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
            <div className="lg:col-span-8">
              <GlassCard className="p-8 min-h-[400px]">
                {currentStep === 0 && (
                  <div className="animate-fade-in">
                    <div className="flex justify-between items-center mb-6">
                      <h3 className="text-xl font-bold text-slate-800">Select Customer</h3>

                    </div>
                    
                    <div className="relative mb-6">
                      <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                      <input 
                        type="text" 
                        placeholder="Search customer name or ID..."
                        className="w-full pl-12 pr-4 py-3 bg-white/50 border border-slate-200 rounded-2xl focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-400 outline-none transition-all placeholder:text-slate-400"
                      />
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                      {/* Config-driven Customers */}
                      {Object.entries(CUSTOMER_PACK_TYPE_MAPPING).map(([code, type]) => (
                        <div 
                           key={code} 
                           onClick={() => {
                             const region = getRegionByType(type);
                             setSelectedCustomer({ id: code, name: code, region: region, productPlan: 'Inverter' });
                             setCurrentStep(1);
                           }}
                           className={`p-4 bg-white/40 border rounded-2xl cursor-pointer transition-all hover:shadow-md group ${selectedCustomer?.name === code ? 'border-indigo-500 bg-indigo-50/50' : 'border-white hover:border-indigo-200'}`}
                         >
                            <div className="flex items-center gap-3">
                              <div className="w-10 h-10 bg-indigo-50 rounded-xl flex items-center justify-center text-indigo-600 group-hover:bg-indigo-600 group-hover:text-white transition-colors">
                                <span className="font-black text-xs">{type}</span>
                              </div>
                              <div>
                                <h4 className="font-bold text-slate-800">{code}</h4>
                                <p className="text-xs text-slate-500">{getRegionByType(type)}</p>
                              </div>
                            </div>
                         </div>
                      ))}
                    </div>
                  </div>
                )}



                {currentStep === 1 && (
                  <div className="animate-fade-in">
                    <div className="flex justify-between items-center mb-6">
                      <div>
                        <h3 className="text-xl font-bold text-slate-800">Input Products</h3>
                        <p className="text-sm text-slate-500">Copy & Paste from Excel: <strong>PO | Item Code | QTY</strong></p>
                      </div>
                      <div className="flex gap-4">
                        <button 
                          onClick={() => setCurrentStep(0)}
                          className="px-4 py-1.5 text-slate-600 font-bold text-sm rounded-lg hover:bg-slate-50 transition-colors"
                        >
                          Back
                        </button>
                        <button 
                          onClick={() => {
                            setRawInput("");
                            setParsedItems([]);
                          }}
                          className="text-indigo-600 font-bold text-sm hover:underline"
                        >
                          Clear All
                        </button>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                      {/* Input Area */}
                      <div className="space-y-4">
                        <textarea
                          value={rawInput}
                          onChange={(e) => handleRawInputChange(e.target.value)}
                          placeholder={`PO123  Item-A  100\nPO123  Item-B  50\nPO456  Item-A  200`}
                          className="w-full h-[400px] p-4 bg-slate-50 border border-slate-200 rounded-2xl font-mono text-sm focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-400 outline-none transition-all resize-none"
                        />
                        <div className="flex justify-between items-center text-xs text-slate-400">
                          <span>Supported separators: Tab, Component, Space</span>
                          <span>{parsedItems.length} items detected</span>
                        </div>
                      </div>

                      {/* Preview Table */}
                      <div className="bg-white border border-slate-100 rounded-2xl overflow-hidden shadow-sm flex flex-col h-[400px]">
                         <div className="bg-slate-50 border-b border-slate-100 px-4 py-3 grid grid-cols-12 text-xs font-bold text-slate-500 uppercase tracking-wider">
                           <div className="col-span-4">PO Number</div>
                           <div className="col-span-5">Item Code (SKU)</div>
                           <div className="col-span-3 text-right">QTY</div>
                         </div>
                         <div className="overflow-y-auto flex-1 p-2 space-y-1">
                           {parsedItems.length === 0 ? (
                             <div className="h-full flex flex-col items-center justify-center text-slate-400">
                               <p>No data parsed</p>
                             </div>
                           ) : (
                             parsedItems.map((item, idx) => (
                               <div key={idx} className="bg-white hover:bg-indigo-50 px-4 py-2 rounded-lg grid grid-cols-12 text-sm border border-transparent hover:border-indigo-100 transition-colors">
                                 <div className="col-span-4 font-medium text-slate-700 truncate">{item.po}</div>
                                 <div className="col-span-5 text-slate-600 truncate">{item.sku}</div>
                                 <div className="col-span-3 text-right font-bold text-indigo-600">{item.qty}</div>
                               </div>
                             ))
                           )}
                         </div>
                      </div>
                    </div>
                    


                  </div>
                )}

                {currentStep > 2 && (
                  <div className="flex flex-col items-center justify-center h-[300px] text-slate-400">
                    <Boxes className="w-16 h-16 mb-4 opacity-20" />
                    <p>Workspace for Step {currentStep + 1} is under construction.</p>
                  </div>

                )}

                 {currentStep === 2 && (
                    <div className="animate-fade-in space-y-4">
                      <div className="flex justify-between items-center">
                         <h3 className="text-xl font-bold text-slate-800">Review Packing Plan</h3>
                         <div className="flex gap-2">
                           <button onClick={() => setCurrentStep(1)} className="px-4 py-2 text-slate-500 font-bold hover:text-indigo-600">Back</button>
                           
                           {/* Action Buttons */}
                           <div className="flex gap-2">
                               <button 
                                 onClick={handleExportCSV}
                                 className="flex items-center gap-2 px-4 py-2 bg-slate-100 text-slate-700 rounded-lg font-bold hover:bg-slate-200 transition-colors"
                                 title="Export CSV"
                               >
                                   <Table className="w-4 h-4" />
                                   <span className="hidden sm:inline">CSV</span>
                               </button>

                               <button 
                                 onClick={handleExportPDF}
                                 className="flex items-center gap-2 px-4 py-2 bg-rose-50 text-rose-600 border border-rose-100 rounded-lg font-bold hover:bg-rose-100 transition-colors"
                                 title="Download PDF"
                               >
                                   <FileText className="w-4 h-4" />
                                   <span className="hidden sm:inline">PDF</span>
                               </button>

                               <button 
                                 onClick={handleSavePlan}
                                 className="flex items-center gap-2 px-4 py-2 bg-emerald-500 text-white rounded-lg font-bold shadow-lg shadow-emerald-500/20 hover:bg-emerald-600 transition-colors"
                                 title="Save to Database"
                               >
                                   <Save className="w-4 h-4" />
                                   <span>Save</span>
                               </button>
                           </div>
                         </div>
                      </div>
 
                      <div className="grid grid-cols-1 gap-6">
                         {planningResults.map((poResult) => (
                           <div key={poResult.po} className="bg-slate-50 border border-slate-200 rounded-2xl overflow-hidden">
                              {/* PO Header */}
                              <div className="bg-slate-100 px-6 py-4 border-b border-slate-200 flex justify-between items-center">
                                 <div className="flex items-center gap-3">
                                   <div className="w-8 h-8 bg-indigo-600 rounded-lg flex items-center justify-center text-white font-bold text-xs">PO</div>
                                   <span className="font-bold text-lg text-slate-800">{poResult.po}</span>
                                 </div>
                                 <div className="flex gap-4 text-sm">
                                    <div><span className="text-slate-500">Total Cases:</span> <span className="font-bold text-indigo-600">{poResult.cases.length}</span></div>
                                    <div><span className="text-slate-500">Pallets:</span> <span className="font-bold text-slate-800">{poResult.summary.totalPallets}</span></div>
                                    <div><span className="text-slate-500">Boxes:</span> <span className="font-bold text-slate-800">{poResult.summary.totalBoxes}</span></div>
                                    <div><span className="text-slate-500">Warps:</span> <span className="font-bold text-rose-600">{poResult.summary.totalWarps}</span></div>
                                 </div>
                              </div>
 
                              {/* Case List Table */}
                              <table className="w-full text-sm text-left">
                                <thead className="text-xs font-bold text-slate-400 uppercase bg-white border-b border-slate-100">
                                  <tr>
                                    <th className="py-3 px-6 w-24">Case No.</th>
                                    <th className="py-3 px-4">Type</th>
                                    <th className="py-3 px-4">Items (SKU)</th>
                                    <th className="py-3 px-4 text-center">Qty.</th>
                                    <th className="py-3 px-4 text-right">Dimensions</th>
                                  </tr>
                               </thead>
                                <tbody className="divide-y divide-slate-100 bg-white">
                                   {poResult.cases.map((packagingCase) => (
                                     <tr key={packagingCase.caseNo} className="hover:bg-slate-50 transition-colors group">
                                       <td className="py-4 px-6 font-bold text-indigo-900">
                                         #{packagingCase.caseNo}
                                       </td>
                                       <td className="py-4 px-4">
                                                                                       <span className={`px-2 py-1 rounded text-xs font-bold border ${packagingCase.type === 'Full Pallet' ? 'bg-emerald-100 text-emerald-700 border-emerald-200' : packagingCase.type === 'Mixed Pallet' ? 'bg-sky-100 text-sky-700 border-sky-200' : packagingCase.type === 'Full Box' ? 'bg-violet-100 text-violet-700 border-violet-200' : packagingCase.type === 'Mixed Box' ? 'bg-amber-100 text-amber-700 border-amber-200' : packagingCase.type === 'Warp Pallet' ? 'bg-rose-100 text-rose-700 border-rose-200' : 'bg-slate-100 text-slate-600 border-slate-200'}`}>
                                               {packagingCase.type}
                                           </span>
                                       </td>
                                       <td className="py-4 px-4">
                                         <div className="space-y-1">
                                            {packagingCase.items.map((item, idx) => (
                                                <div key={idx} className="text-slate-700 font-medium">{item.sku}</div>
                                            ))}
                                         </div>
                                       </td>
                                       <td className="py-4 px-4 text-center">
                                            <div className="space-y-1">
                                                {packagingCase.items.map((item, idx) => (
                                                    <div key={idx} className="font-bold text-slate-800">{item.qty}</div>
                                                ))}
                                            </div>
                                       </td>
                                       <td className="py-4 px-4 text-right font-mono text-xs text-slate-500">
                                            {packagingCase.dims}
                                       </td>
                                     </tr>
                                   ))}
                                </tbody>
                              </table>
                           </div>
                         ))}
                      </div>
                    </div>
                 )}

              </GlassCard>
            </div>
            <div className="lg:col-span-4">
              <GlassCard className="p-6">
                 <h3 className="text-lg font-bold text-slate-800 mb-4">Plan Summary</h3>
                 <div className="space-y-4 mb-8">
                   <div className="flex justify-between text-sm">
                     <span className="text-slate-500">Customer:</span>
                     <span className="font-bold text-slate-800">{selectedCustomer?.name || "—"}</span>
                   </div>
                   <div className="flex justify-between text-sm">
                     <span className="text-slate-500">Region:</span>
                     <span className="font-bold text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded text-xs">{selectedCustomer?.region || "—"}</span>
                   </div>
                   <div className="flex justify-between text-sm">
                     <span className="text-slate-500">Total Lines:</span>
                     <span className="font-bold text-slate-800">{parsedItems.length} lines</span>
                   </div>
                   <div className="flex justify-between text-sm">
                     <span className="text-slate-500">Total QTY:</span>
                     <span className="font-bold text-slate-800">{parsedItems.reduce((acc, i) => acc + i.qty, 0).toLocaleString()}</span>
                   </div>
                 </div>

                  <button
                    onClick={() => {
                      if (currentStep === 0 && selectedCustomer) setCurrentStep(1);
                      if (currentStep === 1) handleGeneratePlan();
                      if (currentStep === 2) handleSavePlan();
                    }}
                    disabled={
                      (currentStep === 0 && !selectedCustomer) ||
                      (currentStep === 1 && (parsedItems.length === 0 || isComputing))
                    }
                    className={`w-full py-3 rounded-xl font-bold text-white transition-all shadow-lg flex items-center justify-center gap-2 ${
                      currentStep === 2 
                        ? 'bg-emerald-500 hover:bg-emerald-600 shadow-emerald-500/20' 
                        : 'bg-indigo-600 hover:bg-indigo-700 shadow-indigo-600/20'
                    } disabled:opacity-50 disabled:cursor-not-allowed`}
                  >
                    {currentStep === 0 && (
                      <>
                        <span>Next Step</span>
                        <ChevronRight className="w-4 h-4" />
                      </>
                    )}
                    {currentStep === 1 && (
                      isComputing ? (
                        <>
                          <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"/>
                          <span>Generating...</span>
                        </>
                      ) : (
                        <>
                          <Boxes className="w-4 h-4" />
                          <span>Generate Plan</span>
                        </>
                      )
                    )}
                    {currentStep === 2 && (
                      <>
                        <Save className="w-4 h-4" />
                        <span>Save Plan</span>
                      </>
                    )}
                  </button>
                 
              </GlassCard>
            </div>
            
          </div>

          </ModuleHeader>

          {/* --- MODALS --- */}

          {/* Success Notification Modal (Minimal & Auto-closing) */}
          <Modal
            isOpen={isSuccessModalOpen}
            onClose={() => setIsSuccessModalOpen(false)}
            title=""
            className="max-w-[300px] text-center !bg-transparent !border-none !shadow-none"
            hideHeader
          >
            <div className="bg-white/90 backdrop-blur-xl border border-white/20 p-8 rounded-[2.5rem] shadow-2xl shadow-indigo-500/20 flex flex-col items-center justify-center space-y-4 animate-in fade-in zoom-in duration-300">
              <div className={cn(
                "w-20 h-20 rounded-full flex items-center justify-center shadow-lg animate-bounce",
                successConfig.type === 'success' ? "bg-emerald-500 text-white shadow-emerald-500/40" :
                successConfig.type === 'download' ? "bg-indigo-600 text-white shadow-indigo-600/40" :
                "bg-rose-500 text-white shadow-rose-500/40"
              )}>
                {successConfig.type === 'success' && <CheckCircle2 className="w-10 h-10" />}
                {successConfig.type === 'download' && <Download className="w-10 h-10" />}
                {successConfig.type === 'error' && <XCircle className="w-10 h-10" />}
              </div>
              <div className="space-y-1">
                <h3 className="text-2xl font-black text-slate-800 leading-tight tracking-tight">
                  {successConfig.title}
                </h3>
                <p className="text-slate-500 text-sm font-bold opacity-70">
                  {successConfig.description}
                </p>
              </div>
            </div>
          </Modal>

          {/* Confirmation Modal */}
          <Modal
            isOpen={isConfirmModalOpen}
            onClose={() => setIsConfirmModalOpen(false)}
            title={confirmConfig.title}
          >
            <div className="p-6 space-y-6">
               <div className="flex gap-4 items-start">
                  <div className="w-12 h-12 bg-amber-50 text-amber-500 rounded-2xl flex items-center justify-center shrink-0">
                     <AlertCircle className="w-6 h-6" />
                  </div>
                  <div>
                     <p className="text-slate-600 font-medium leading-relaxed whitespace-pre-wrap">
                        {confirmConfig.message}
                     </p>
                  </div>
               </div>
               
               <div className="flex gap-3 pt-4">
                  <button 
                    onClick={() => setIsConfirmModalOpen(false)}
                    className="flex-1 py-3 bg-slate-100 text-slate-600 font-bold rounded-xl hover:bg-slate-200 transition-colors"
                  >
                    Cancel
                  </button>
                  <button 
                    onClick={confirmConfig.onConfirm}
                    className="flex-1 py-3 bg-indigo-600 text-white font-bold rounded-xl shadow-lg shadow-indigo-500/20 hover:bg-indigo-700 transition-colors"
                  >
                    Confirm
                  </button>
               </div>
            </div>
          </Modal>

        </div>
      </section>
    </div>
  );
}
