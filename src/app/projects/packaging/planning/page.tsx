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
import { generatePackingListPDF } from "@/lib/utils/pdfGenerator";
import { generatePackingDetailsPDF, generateLayoutGridPDF } from "@/lib/utils/pdfTemplateGenerator";

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
  const [isExportingPlan, setIsExportingPlan] = useState(false);
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

  const buildPackingPlanPdfData = (): PackingPlanResult[] => {
    return planResult.map(po => ({
      po: po.po,
      cases: po.cases,
      summary: {
        totalPallets: po.cases.filter(c => c.type.includes("Pallet")).length,
        totalBoxes: po.cases.filter(c => c.type.includes("Box")).length,
        totalItems: po.cases.reduce((sum, c) => sum + c.items.reduce((s, i) => s + i.qty, 0), 0)
      }
    }));
  };

  const handleExportPDF = async () => {
    if (!planResult.length || !selectedCustomer || isExportingPlan) return;

    setIsExportingPlan(true);
    const pdfData = buildPackingPlanPdfData();
    const poList = planResult.map(p => p.po);

    // Calculate Total Items Required from Raw Input
    let totalItemsRequired = 0;
    if (activeStep >= 3 && rawData) {
       // Re-parse raw data to get total required
       // Assuming rawData format: PO, SKU, QTY
       const lines = rawData.split("\n");
       lines.forEach(line => {
           const parts = line.trim().split(/[\t,]+/);
           if (parts.length >= 3) {
               const qty = parseInt(parts[2].replace(/,/g, "").trim());
               if (!isNaN(qty)) totalItemsRequired += qty;
           }
       });
    }

    try {
      await generatePackingListPDFMake(pdfData, selectedCustomer.code, poList, totalItemsRequired);
    } catch (error) {
      console.error("PDFMake export failed. Falling back to jsPDF.", error);
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      generatePackingListPDF(pdfData as any, selectedCustomer.code, poList);
    } finally {
      setIsExportingPlan(false);
    }
  };

  const handleExportPackingDetails = () => {
    if (!planResult.length || !selectedCustomer) return;

    const pdfData = buildPackingPlanPdfData();
    const poList = planResult.map(p => p.po);
    generatePackingDetailsPDF(pdfData, selectedCustomer.code, poList);
  };

  // --- 4. Steps Navigation ---
  const steps = [
    { id: 1, label: "Select Customer", icon: Users },
    { id: 2, label: "Input Data", icon: FileText },
    { id: 3, label: "Review Plan", icon: CheckCircle2 },
    { id: 4, label: "Save Plan", icon: Save },
  ];

  return (
    <div className="min-h-screen bg-[#F6EDDE] pt-20 pb-20">
      <section className="py-8">
        <div className="container-custom">
          
          <ModuleHeader
             title="Pack Planning"
             description="Generate packing plans from raw PO data."
             backHref="/projects/packaging"
             backLabel="Packaging Console"
             action={
                 activeStep === 3 && (
                      <button 
                         onClick={() => setActiveStep(4)}
                         className="flex items-center gap-2 px-4 py-2 bg-[#272727] text-[#EFD09E] font-bold rounded-xl hover:bg-[#1f1f1f] shadow-lg shadow-[#272727]/25 border border-[#EFD09E]/20 transition-all"
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
                                    ? 'border-[#D4AA7D]/50 bg-[#EFD09E]/70 text-[#272727]' 
                                    : activeStep > step.id 
                                        ? 'border-[#9ACD32]/50 bg-[#9ACD32]/15 text-[#5a7a1a]' 
                                        : 'border-[#D4AA7D]/35 text-[#7E5C4A]'
                                }
                            `}>
                                <div className={`
                                    w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold
                                    ${activeStep === step.id ? 'bg-[#272727] text-[#EFD09E]' : activeStep > step.id ? 'bg-[#9ACD32] text-[#272727]' : 'bg-[#D4AA7D]/35 text-[#7E5C4A]'}
                                `}>
                                    {step.id}
                                </div>
                                <span className="font-bold text-sm">{step.label}</span>
                            </div>
                            {idx < steps.length - 1 && (
                                <div className="w-8 h-0.5 bg-[#D4AA7D]/40 mx-2" />
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
                         <h3 className="text-xl font-bold text-[#272727] mb-6 flex items-center gap-2">
                             <Search className="w-5 h-5 text-[#7E5C4A]"/>
                             Select Customer
                         </h3>
                         <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                             {Object.keys(CUSTOMER_PACK_TYPE_MAPPING).map(code => (
                                 <button
                                     key={code}
                                     onClick={() => handleCustomerSelect(code)}
                                     className="p-6 rounded-xl border border-[#D4AA7D]/35 bg-[#EFD09E]/45 hover:border-[#9ACD32]/45 hover:bg-[#EFD09E]/70 transition-all group text-left"
                                >
                                    <div className="font-bold text-lg text-[#272727] group-hover:text-[#5a7a1a] mb-1">{code}</div>
                                    <div className="text-xs text-[#7E5C4A] font-medium bg-[#EFD09E]/75 border border-[#D4AA7D]/35 px-2 py-1 rounded w-fit group-hover:bg-[#F6EDDE]">
                                        {CUSTOMER_PACK_TYPE_MAPPING[code] === 'A' ? 'Asia Region' : 'US/EU Region'}
                                    </div>
                                </button>
                             ))}
                         </div>

                          {/* Recent History Section */}
                          <div className="pt-6 border-t border-[#D4AA7D]/30 mt-6">
                                <h4 className="text-sm font-bold text-[#7E5C4A] uppercase tracking-wider mb-4 flex items-center gap-2">
                                    <Clock className="w-4 h-4"/> Recent Calculations
                                </h4>
                                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                    {recentPlans.map(plan => (
                                        <button 
                                            key={plan.id}
                                            onClick={() => handleLoadPlan(plan)}
                                            className="p-4 bg-[#EFD09E]/50 border border-[#D4AA7D]/35 rounded-xl hover:border-[#9ACD32]/40 hover:bg-[#F6EDDE] text-left transition-all group shadow-sm hover:shadow-md"
                                        >
                                            <div className="flex justify-between items-start mb-2">
                                                <span className="font-bold text-[#272727] group-hover:text-[#5a7a1a]">{plan.customer.name}</span>
                                                <span className="text-[10px] bg-[#EFD09E]/70 border border-[#D4AA7D]/35 text-[#7E5C4A] px-1.5 py-0.5 rounded-md group-hover:bg-[#9ACD32]/20 group-hover:text-[#5a7a1a]">
                                                    {plan.createdAt?.seconds ? new Date(plan.createdAt?.seconds * 1000).toLocaleDateString() : 'Just now'}
                                                </span>
                                            </div>
                                            <div className="text-xs text-[#7E5C4A] space-y-1">
                                                <div className="flex justify-between">
                                                    <span>POs: {plan.poList.length}</span>
                                                    <span>Item: {plan.summary.totalItems}</span>
                                                </div>
                                                <div className="flex justify-between font-medium text-[#272727]">
                                                    <span>Pallets: {plan.summary.totalPallets}</span>
                                                    <span>Boxes: {plan.summary.totalBoxes}</span>
                                                </div>
                                            </div>
                                        </button>
                                    ))}
                                    {recentPlans.length === 0 && (
                                        <div className="col-span-3 text-center py-8 text-[#7E5C4A]/80 text-sm italic bg-[#EFD09E]/45 rounded-xl border border-dashed border-[#D4AA7D]/45">
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
                                     <h3 className="font-bold text-[#272727] flex items-center gap-2">
                                        <FileSpreadsheet className="w-5 h-5 text-[#7E5C4A]"/>
                                        Paste Raw Data
                                    </h3>
                                    <button onClick={handleSampleData} className="text-xs text-[#7E5C4A] font-bold hover:underline">
                                        Load Sample
                                    </button>
                                </div>
                                 <textarea
                                     value={rawData}
                                     onChange={handleRawInputChange}
                                     placeholder={`Paste form Excel (PO, SKU, QTY)\nExample:\nPO123  SKU001  100\nPO123  SKU002  50`}
                                     className="flex-1 w-full bg-[#EFD09E]/45 border border-[#D4AA7D]/40 rounded-xl p-4 font-mono text-sm text-[#272727] focus:ring-2 focus:ring-[#9ACD32]/30 outline-none resize-none min-h-[300px]"
                                />
                                <div className="mt-4 flex justify-between items-center">
                                    <button onClick={() => setActiveStep(1)} className="text-[#7E5C4A] hover:text-[#272727] font-bold text-sm">
                                        Back
                                    </button>
                                    <button 
                                        onClick={handleGeneratePlan}
                                        disabled={!rawData || isProcessing}
                                        className="px-6 py-3 bg-[#272727] text-[#EFD09E] font-bold rounded-xl hover:bg-[#1f1f1f] shadow-lg shadow-[#272727]/25 border border-[#EFD09E]/20 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
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
                             <GlassCard className="p-6 bg-[#EEF2F6]/95 border border-white/80 shadow-[8px_8px_18px_rgba(166,180,200,0.22),-8px_-8px_18px_rgba(255,255,255,0.9)]">
                                <h4 className="font-bold text-[#272727] mb-2">Selected Context</h4>
                                <div className="flex items-center justify-between bg-[#EFD09E]/55 p-3 rounded-lg border border-[#D4AA7D]/35 mb-3">
                                    <span className="text-sm text-[#7E5C4A]">Customer</span>
                                    <span className="font-bold text-[#272727] text-lg">{selectedCustomer?.code}</span>
                                </div>
                                <div className="flex items-center justify-between bg-[#EFD09E]/55 p-3 rounded-lg border border-[#D4AA7D]/35">
                                    <span className="text-sm text-[#7E5C4A]">Region</span>
                                    <span className="font-bold text-[#272727]">{selectedCustomer?.region}</span>
                                </div>
                            </GlassCard>

                            <GlassCard className="p-6">
                                <h4 className="font-bold text-[#272727] mb-4">Tips</h4>
                                <ul className="space-y-2 text-sm text-[#7E5C4A]">
                                    <li className="flex gap-2">
                                        <CheckCircle2 className="w-4 h-4 text-[#9ACD32] shrink-0" />
                                        <span>Copy directly from Excel/Sheets</span>
                                    </li>
                                    <li className="flex gap-2">
                                        <CheckCircle2 className="w-4 h-4 text-[#9ACD32] shrink-0" />
                                        <span>Ensure columns are PO, SKU, Qty</span>
                                    </li>
                                    <li className="flex gap-2">
                                        <CheckCircle2 className="w-4 h-4 text-[#9ACD32] shrink-0" />
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
                             <SummaryCard label="Total Pallets" value={planSummary.totalPallets} icon={Layers} color="sunset" />
                             <SummaryCard label="Total Boxes" value={planSummary.totalBoxes} icon={Box} color="raisin" />
                             <SummaryCard label="Warp Items" value={planSummary.totalWarps} icon={AlertTriangle} color="buff" />
                             <SummaryCard label="Total Items" value={planSummary.totalItems} icon={Package} color="green" />
                         </div>

                         {/* Results Table */}
                         <div className="space-y-8">
                             {planResult.map((poGroup) => (
                                 <GlassCard key={poGroup.po} className="overflow-hidden">
                                     <div className="bg-[#EEF2F6]/90 p-4 border-b border-[#D4AA7D]/30 flex justify-between items-center backdrop-blur-sm">
                                        <div className="flex items-center gap-3">
                                            <div className="w-10 h-10 rounded-lg bg-[#272727] text-[#EFD09E] flex items-center justify-center font-bold shadow-sm">
                                                PO
                                            </div>
                                            <div>
                                                <h3 className="font-bold text-lg text-[#272727]">{poGroup.po}</h3>
                                                <p className="text-xs text-[#7E5C4A] font-medium">{poGroup.cases.length} Cases Generated</p>
                                            </div>
                                        </div>
                                    </div>
                                    <div className="overflow-x-auto">
                                        <table className="w-full text-sm text-left">
                                            <thead className="bg-[#D4AA7D] text-xs font-bold text-[#272727] uppercase">
                                                 <tr>
                                                     <th className="px-6 py-3">Case #</th>
                                                     <th className="px-6 py-3">Type</th>
                                                     <th className="px-6 py-3">Contents (SKU / Qty)</th>
                                                     <th className="px-6 py-3">Dimensions</th>
                                                     <th className="px-6 py-3">Note</th>
                                                 </tr>
                                             </thead>
                                             <tbody className="divide-y divide-[#D4AA7D]/30 bg-[#EFD09E]">
                                                {poGroup.cases.map((c, idx) => (
                                                    <tr key={idx} className="hover:bg-[#F6EDDE] transition-colors">
                                                        <td className="px-6 py-4 font-mono text-[#7E5C4A]">#{c.caseNo}</td>
                                                        <td className="px-6 py-4">
                                                            <Badge type={c.type} />
                                                        </td>
                                                        <td className="px-6 py-4">
                                                            <div className="space-y-1">
                                                                {c.items.map((item, i) => (
                                                                    <div key={i} className="flex items-center justify-between text-xs max-w-[200px]">
                                                                        <span className="font-medium text-[#272727] truncate mr-2" title={item.name || item.sku}>{item.sku}</span>
                                                                        <span className="font-bold text-[#7E5C4A] bg-[#EFD09E]/70 border border-[#D4AA7D]/35 px-1.5 py-0.5 rounded">x{item.qty}</span>
                                                                    </div>
                                                                ))}
                                                            </div>
                                                        </td>
                                                        <td className="px-6 py-4 font-mono text-xs text-[#7E5C4A]">
                                                            {c.dims}
                                                        </td>
                                                        <td className="px-6 py-4 text-xs text-[#7E5C4A] italic">
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
                                  className="px-6 py-3 border-2 border-[#D4AA7D]/45 text-[#7E5C4A] font-bold rounded-xl hover:border-[#7E5C4A]/60 hover:text-[#272727] transition-all flex items-center gap-2"
                              >
                                  <RotateCcw className="w-4 h-4"/> Back to Input
                              </button>
                              <button 
                                 onClick={() => setActiveStep(4)}
                                 className="px-8 py-3 bg-[#272727] text-[#EFD09E] font-bold rounded-xl hover:bg-[#1f1f1f] shadow-lg shadow-[#272727]/25 border border-[#EFD09E]/20 transition-all flex items-center gap-2"
                            >
                                 Proceed to Save <Play className="w-4 h-4"/>
                             </button>
                         </div>
                     </div>
                 )}

                 {/* STEP 4: Save & Export */}
                 {activeStep === 4 && planSummary && (
                     <div className="animate-in fade-in slide-in-from-bottom-4 max-w-2xl mx-auto text-center space-y-8">
                          <GlassCard className="p-12 flex flex-col items-center justify-center gap-6 bg-[#EEF2F6]/95 border border-white/80">
                              <div className="w-20 h-20 bg-[#9ACD32]/20 rounded-full flex items-center justify-center text-[#5a7a1a] mb-2">
                                  <CheckCircle2 className="w-10 h-10" />
                              </div>
                              <h2 className="text-3xl font-black text-[#272727]">Plan Ready!</h2>
                              <p className="text-[#7E5C4A] max-w-md">
                                  Your packing plan has been generated successfully. You can now download the PDF report or save this plan to the database.
                              </p>
                              
                              <div className="grid grid-cols-2 gap-4 w-full max-w-md mt-4">
                                  <button 
                                      onClick={handleSavePlan}
                                      disabled={isHistoryMode || isSaving}
                                      className={`flex flex-col items-center justify-center gap-3 p-6 bg-white border-2 rounded-2xl transition-all group ${
                                          isHistoryMode || isSaving 
                                          ? 'border-[#D4AA7D]/40 opacity-50 cursor-not-allowed' 
                                          : 'border-[#D4AA7D]/35 hover:border-[#9ACD32] hover:bg-[#EFD09E]/55 cursor-pointer'
                                      }`}
                                  >
                                      {isHistoryMode ? (
                                          <>
                                            <CheckCircle2 className="w-8 h-8 text-[#9ACD32]"/>
                                            <span className="font-bold text-[#5a7a1a]">Saved to DB</span>
                                          </>
                                      ) : (
                                          <>
                                            <Save className={`w-8 h-8 text-[#7E5C4A] ${!isSaving && 'group-hover:text-[#5a7a1a]'} transition-colors`}/>
                                            <span className={`font-bold text-[#7E5C4A] ${!isSaving && 'group-hover:text-[#5a7a1a]'}`}>
                                                {isSaving ? 'Saving...' : 'Save to DB'}
                                            </span>
                                          </>
                                      )}
                                  </button>
                                  
                                  <button 
                                      onClick={handleExportPDF}
                                      disabled={isExportingPlan}
                                      className="flex flex-col items-center justify-center gap-3 p-6 bg-[#EFD09E]/40 border-2 border-[#D4AA7D]/35 rounded-2xl hover:border-[#7E5C4A]/55 hover:bg-[#EFD09E]/70 transition-all group"
                                  >
                                      <Download className="w-8 h-8 text-[#7E5C4A] group-hover:text-[#272727] transition-colors"/>
                                      <span className="font-bold text-[#7E5C4A] group-hover:text-[#272727]">
                                        {isExportingPlan ? "Preparing PDF..." : "Download Plan"}
                                      </span>
                                  </button>

                                  <button 
                                      onClick={handleExportPackingDetails}
                                      className="flex flex-col items-center justify-center gap-3 p-6 bg-[#EFD09E]/40 border-2 border-[#D4AA7D]/35 rounded-2xl hover:border-[#9ACD32]/55 hover:bg-[#EFD09E]/70 transition-all group "
                                  >
                                      <FileText className="w-8 h-8 text-[#7E5C4A] group-hover:text-[#5a7a1a] transition-colors"/>
                                      <span className="font-bold text-[#7E5C4A] group-hover:text-[#5a7a1a]">Download Packing Details</span>
                                  </button>
                                  
                                  <button 
                                      onClick={generateLayoutGridPDF}
                                      className="flex flex-col items-center justify-center gap-3 p-6 bg-[#EEF2F6] border-2 border-[#D4AA7D]/45 border-dashed rounded-2xl hover:border-[#7E5C4A]/55 hover:bg-[#EFD09E]/45 transition-all group"
                                  >
                                      <div className="w-8 h-8 border border-[#7E5C4A]/50 grid grid-cols-2 grid-rows-2 gap-px bg-[#D4AA7D]/60">
                                          <div className="bg-white"></div><div className="bg-white"></div>
                                          <div className="bg-white"></div><div className="bg-white"></div>
                                      </div>
                                      <span className="font-bold text-[#7E5C4A] group-hover:text-[#272727]">Download Grid (Dev)</span>
                                  </button>
                              </div>
                          </GlassCard>

                           <button 
                               onClick={() => { setActiveStep(1); setPlanResult([]); setIsHistoryMode(false); }}
                               className="px-8 py-3 bg-[#272727] text-[#EFD09E] font-bold rounded-xl hover:bg-[#1f1f1f] shadow-lg shadow-[#272727]/25 border border-[#EFD09E]/20 transition-all flex items-center justify-center gap-2 mx-auto w-full max-w-xs"
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
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#272727]/30 backdrop-blur-sm animate-in fade-in">
          <div className="bg-[#EEF2F6]/95 border border-white/80 rounded-2xl shadow-2xl p-8 max-w-sm w-full text-center space-y-6 animate-in zoom-in-95">
             <div className="w-16 h-16 bg-[#9ACD32]/20 rounded-full flex items-center justify-center mx-auto text-[#5a7a1a]">
                <CheckCircle2 className="w-8 h-8" />
             </div>
             <div>
                <h3 className="text-xl font-bold text-[#272727]">Saved Successfully!</h3>
                <p className="text-[#7E5C4A] text-sm mt-2">
                   The packing plan has been saved to the database.
                </p>
             </div>
             
             <button 
                onClick={handleExportPDF}
                disabled={isExportingPlan}
                className="w-full py-3 bg-[#272727] text-[#EFD09E] font-bold rounded-xl hover:bg-[#1f1f1f] shadow-lg shadow-[#272727]/25 border border-[#EFD09E]/20 transition-all flex items-center justify-center gap-2"
             >
                <Download className="w-5 h-5"/> {isExportingPlan ? "Preparing PDF..." : "Download PDF"}
             </button>

             <button 
                onClick={() => setShowSuccessModal(false)}
                className="text-[#7E5C4A] hover:text-[#272727] text-sm font-bold"
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
    color: 'sunset' | 'raisin' | 'buff' | 'green';
}

function SummaryCard({ label, value, icon: Icon, color }: SummaryCardProps) {
    const colors = {
        sunset: "bg-[#D4AA7D]/35 text-[#7E5C4A]",
        raisin: "bg-[#EEF2F6] text-[#272727]",
        buff: "bg-[#7E5C4A]/20 text-[#7E5C4A]",
        green: "bg-[#9ACD32]/20 text-[#5a7a1a]",
    };

    return (
        <GlassCard className="p-4 flex items-center gap-4">
            <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${colors[color]} shadow-sm`}>
                <Icon className="w-6 h-6" />
            </div>
            <div>
                <p className="text-xs font-bold text-[#7E5C4A] uppercase tracking-wider">{label}</p>
                <p className="text-2xl font-black text-[#272727]">{value}</p>
            </div>
        </GlassCard>
    );
}

function Badge({ type }: { type: string }) {
    let style = "bg-[#EEF2F6] text-[#7E5C4A] border border-[#D4AA7D]/35";
    if (type.includes("Full Pallet")) style = "bg-[#9ACD32]/20 text-[#5a7a1a] border border-[#9ACD32]/35";
    else if (type.includes("Partial")) style = "bg-[#D4AA7D]/30 text-[#7E5C4A] border border-[#D4AA7D]/45";
    else if (type.includes("Mixed")) style = "bg-[#272727]/10 text-[#272727] border border-[#272727]/20";
    else if (type.includes("Warp")) style = "bg-rose-50 text-rose-600 border border-rose-100";
    else if (type.includes("Unknown")) style = "bg-[#EFD09E] text-[#7E5C4A] border border-[#D4AA7D]/45";

    return (
        <span className={`px-2.5 py-1 rounded-md text-[10px] font-bold uppercase tracking-wide ${style}`}>
            {type}
        </span>
    );
}

function UsersIcon({ className }: { className?: string }) {
    return <Users className={className} />;
}
