"use client";

import { useMemo, useState, type ReactNode } from "react";
import {
  ArrowRight,
  Box,
  Download,
  Layers,
  Loader2,
  Package,
  Radar,
  Sparkles,
  UserRound,
} from "lucide-react";

import { GlassCard } from "@/components/shared/GlassCard";
import { ModuleHeader } from "@/components/projects/material-control/ModuleHeader";
import { CUSTOMER_PACK_TYPE_MAPPING, PACKAGE_MASTER_DATA } from "@/lib/config/packagingData";
import { PackagingService } from "@/lib/firebase/services/packaging.service";
import { PackingLogicServiceV2 } from "@/lib/services/packing-logic-v2/PackingLogicServiceV2";
import type { PackedCase, PackingInput, PackingOutput, PackingPlanResult } from "@/lib/services/packing-logic/packing.types";
import { generatePackingListPDFMake } from "@/lib/utils/pdfMakeGenerator";
import { generatePackingListPDF } from "@/lib/utils/pdfGenerator";

interface POCase {
  po: string;
  cases: PackedCase[];
}

interface PlanSummary {
  totalPallets: number;
  totalBoxes: number;
  totalWarps: number;
  totalItems: number;
}

interface SelectedCustomer {
  code: string;
  region: "US/EU" | "Asia";
  packType: "A" | "E" | "R";
}

const CUSTOMER_CODES = Object.keys(CUSTOMER_PACK_TYPE_MAPPING).sort();

function toRegion(packType: "A" | "E" | "R"): "US/EU" | "Asia" {
  return packType === "E" ? "US/EU" : "Asia";
}

function sumInputQty(rawData: string): number {
  return rawData
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean)
    .reduce((sum, line) => {
      const parts = line.split(/[\t,]+/);
      if (parts.length < 3) return sum;
      const qty = Number(parts[2].replace(/,/g, "").trim());
      return Number.isFinite(qty) ? sum + qty : sum;
    }, 0);
}

export default function PackagingPlanningV2Page() {
  const [selectedCustomer, setSelectedCustomer] = useState<SelectedCustomer | null>(null);
  const [rawData, setRawData] = useState("");
  const [planResult, setPlanResult] = useState<POCase[]>([]);
  const [planSummary, setPlanSummary] = useState<PlanSummary | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [isExporting, setIsExporting] = useState(false);

  const poCount = useMemo(() => planResult.length, [planResult]);

  const handleSelectCustomer = (code: string) => {
    const packType = (CUSTOMER_PACK_TYPE_MAPPING[code] || "E") as "A" | "E" | "R";
    setSelectedCustomer({ code, packType, region: toRegion(packType) });
  };

  const handleGeneratePlan = async () => {
    if (!selectedCustomer || !rawData.trim()) return;

    setIsProcessing(true);
    setPlanResult([]);
    setPlanSummary(null);

    try {
      const service = new PackingLogicServiceV2(
        { region: selectedCustomer.packType },
        PACKAGE_MASTER_DATA,
        async (sku: string) => {
          const spec = await PackagingService.getProductSpec(sku);
          return spec;
        }
      );

      const input: PackingInput = {
        rawData,
        config: { region: selectedCustomer.packType },
      };

      const output: PackingOutput = await service.execute(input);

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
          ...res.mixedCases,
        ].sort((a, b) => a.caseNo - b.caseNo);

        if (allCases.length > 0) {
          mappedResults.push({ po: res.po, cases: allCases });
        }

        allCases.forEach((c) => {
          if (c.type.includes("Warp")) totalWarps += 1;
          else if (c.type.includes("Pallet")) totalPallets += 1;
          else if (c.type.includes("Box")) totalBoxes += 1;

          totalItems += c.items.reduce((sum, i) => sum + i.qty, 0);
        });
      });

      setPlanResult(mappedResults);
      setPlanSummary({ totalPallets, totalBoxes, totalWarps, totalItems });
    } catch (error) {
      console.error("Planning V2 Error:", error);
      alert("Failed to generate plan. Please verify input and product specs.");
    } finally {
      setIsProcessing(false);
    }
  };

  const buildPackingPlanPdfData = (): PackingPlanResult[] => {
    return planResult.map((po) => ({
      po: po.po,
      cases: po.cases,
      summary: {
        totalPallets: po.cases.filter((c) => c.type.includes("Pallet")).length,
        totalBoxes: po.cases.filter((c) => c.type.includes("Box")).length,
        totalItems: po.cases.reduce((sum, c) => sum + c.items.reduce((s, i) => s + i.qty, 0), 0),
      },
    }));
  };

  const handleExportPDF = async () => {
    if (!selectedCustomer || !planResult.length || isExporting) return;

    setIsExporting(true);
    try {
      const pdfData = buildPackingPlanPdfData();
      const poList = planResult.map((p) => p.po);
      const totalItemsRequired = sumInputQty(rawData);
      await generatePackingListPDFMake(pdfData, selectedCustomer.code, poList, totalItemsRequired);
    } catch (error) {
      console.error("PDFMake export failed. Fallback to jsPDF.", error);
      generatePackingListPDF(buildPackingPlanPdfData() as never, selectedCustomer.code, planResult.map((p) => p.po));
    } finally {
      setIsExporting(false);
    }
  };

  const handleSampleData = () => {
    setRawData([
      "11053473\tFRN0003E2S-7GB\t20",
      "11073336\tFRN0018C2S-4A\t1",
      "11073336\tFRN0018C2S-4A\t50",
      "11074920\tFRN30LM1S-4AA\t2",
    ].join("\n"));
  };

  return (
    <div className="min-h-screen bg-[#F6EDDE] pt-20 pb-16 relative overflow-hidden">
      <div className="pointer-events-none absolute -top-24 -left-20 h-80 w-80 rounded-full bg-[#D4AA7D]/35 blur-3xl" />
      <div className="pointer-events-none absolute top-20 right-0 h-96 w-96 rounded-full bg-[#9ACD32]/20 blur-3xl" />
      <div className="pointer-events-none absolute bottom-0 left-1/3 h-72 w-72 rounded-full bg-[#7E5C4A]/15 blur-3xl" />

      <section className="container-custom relative z-10 space-y-8">
        <ModuleHeader
          title="Packing Planning V2"
          description="Deterministic flow for warehouse-safe packing with strict unknown filtering."
          backHref="/projects/packaging"
          backLabel="Packaging Console"
        />

        <div className="grid gap-6 xl:grid-cols-[360px_minmax(0,1fr)]">
          <GlassCard className="h-fit p-5 space-y-4 bg-[#EEF2F6]/95 border border-white/80 shadow-[8px_8px_18px_rgba(166,180,200,0.25),-8px_-8px_18px_rgba(255,255,255,0.9)]">
            <div className="rounded-2xl bg-[#272727] text-[#EFD09E] p-4">
              <div className="flex items-center justify-between">
                <p className="text-xs uppercase tracking-[0.2em] text-[#EFD09E]/70">Mode</p>
                <Sparkles className="h-4 w-4 text-[#9ACD32]" />
              </div>
              <p className="mt-2 font-black text-xl">Deterministic Planner</p>
              <p className="text-sm text-[#EFD09E]/70 mt-1">A/E/R allowed package only</p>
            </div>

            <div className="space-y-3 text-sm">
              <div className="rounded-xl border border-white/80 bg-[#EFD09E]/50 p-3">
                <p className="text-[#7E5C4A]">Customer</p>
                <p className="font-semibold text-[#272727]">{selectedCustomer?.code || "Not selected"}</p>
              </div>
              <div className="rounded-xl border border-white/80 bg-[#EFD09E]/50 p-3">
                <p className="text-[#7E5C4A]">Pack Type</p>
                <p className="font-semibold text-[#272727]">{selectedCustomer?.packType || "-"}</p>
              </div>
              <div className="rounded-xl border border-white/80 bg-[#EFD09E]/50 p-3">
                <p className="text-[#7E5C4A]">PO in Result</p>
                <p className="font-semibold text-[#272727]">{poCount}</p>
              </div>
            </div>

            <button
              onClick={handleExportPDF}
              disabled={!planResult.length || !selectedCustomer || isExporting}
              className="w-full inline-flex items-center justify-center gap-2 rounded-xl bg-[#272727] px-4 py-3 text-sm font-semibold text-[#EFD09E] border border-[#EFD09E]/20 disabled:opacity-40"
            >
              {isExporting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Download className="h-4 w-4" />}
              Download Plan PDF
            </button>
          </GlassCard>

          <div className="space-y-6">
            <GlassCard className="p-6 bg-[#EEF2F6]/95 border border-white/80 shadow-[8px_8px_18px_rgba(166,180,200,0.25),-8px_-8px_18px_rgba(255,255,255,0.9)]">
              <div className="flex items-center gap-2 text-[#272727] mb-4">
                <UserRound className="h-4 w-4" />
                <p className="font-semibold">1. Select Customer</p>
              </div>
              <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-3">
                {CUSTOMER_CODES.map((code) => {
                  const packType = (CUSTOMER_PACK_TYPE_MAPPING[code] || "E") as "A" | "E" | "R";
                  const active = selectedCustomer?.code === code;
                  return (
                    <button
                      key={code}
                      onClick={() => handleSelectCustomer(code)}
                      className={[
                        "rounded-xl border px-3 py-3 text-left transition",
                        active
                          ? "border-[#9ACD32] bg-[#9ACD32]/15 shadow-sm"
                          : "border-[#D4AA7D]/35 bg-[#EFD09E]/50 hover:border-[#7E5C4A]/45",
                      ].join(" ")}
                    >
                      <p className="font-semibold text-[#272727]">{code}</p>
                      <p className="text-xs text-[#7E5C4A] mt-1">Type {packType}</p>
                    </button>
                  );
                })}
              </div>
            </GlassCard>

            <GlassCard className="p-6 bg-[#EEF2F6]/95 border border-white/80 shadow-[8px_8px_18px_rgba(166,180,200,0.25),-8px_-8px_18px_rgba(255,255,255,0.9)]">
              <div className="flex items-center gap-2 text-[#272727] mb-4">
                <Radar className="h-4 w-4" />
                <p className="font-semibold">2. Input PO Data</p>
              </div>
              <textarea
                value={rawData}
                onChange={(e) => setRawData(e.target.value)}
                placeholder="PO<TAB>SKU<TAB>QTY"
                className="min-h-[220px] w-full rounded-2xl border border-[#D4AA7D]/40 bg-[#EFD09E]/45 p-4 font-mono text-sm text-[#272727] outline-none focus:border-[#9ACD32]"
              />
              <div className="mt-4 flex flex-wrap gap-3">
                <button
                  onClick={handleSampleData}
                  className="rounded-xl border border-[#D4AA7D]/50 bg-[#EFD09E]/50 px-4 py-2 text-sm font-semibold text-[#7E5C4A]"
                >
                  Fill Sample
                </button>
                <button
                  onClick={handleGeneratePlan}
                  disabled={!selectedCustomer || !rawData.trim() || isProcessing}
                  className="inline-flex items-center gap-2 rounded-xl bg-[#272727] px-4 py-2 text-sm font-semibold text-[#EFD09E] border border-[#EFD09E]/20 disabled:opacity-40"
                >
                  {isProcessing ? <Loader2 className="h-4 w-4 animate-spin" /> : <ArrowRight className="h-4 w-4" />}
                  Generate V2 Plan
                </button>
              </div>
            </GlassCard>

            <GlassCard className="p-6 bg-[#EEF2F6]/95 border border-white/80 shadow-[8px_8px_18px_rgba(166,180,200,0.25),-8px_-8px_18px_rgba(255,255,255,0.9)]">
              <div className="flex items-center gap-2 text-[#272727] mb-4">
                <Layers className="h-4 w-4" />
                <p className="font-semibold">3. Result</p>
              </div>

              {planSummary ? (
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-6">
                  <Stat label="Pallets" value={planSummary.totalPallets} icon={<Package className="h-4 w-4" />} />
                  <Stat label="Boxes" value={planSummary.totalBoxes} icon={<Box className="h-4 w-4" />} />
                  <Stat label="Warps" value={planSummary.totalWarps} icon={<Sparkles className="h-4 w-4" />} />
                  <Stat label="Items" value={planSummary.totalItems} icon={<Layers className="h-4 w-4" />} />
                </div>
              ) : null}

              {!planResult.length && !isProcessing ? (
                <div className="rounded-2xl border border-dashed border-[#D4AA7D]/55 bg-[#EFD09E]/40 p-8 text-center text-sm text-[#7E5C4A]">
                  Generate plan to display PO, No, Item, Qty, Dimensions, Note
                </div>
              ) : null}

              <div className="space-y-5">
                {planResult.map((poCase) => (
                  <div key={poCase.po} className="overflow-hidden rounded-2xl border border-[#D4AA7D]/40">
                    <div className="bg-[#272727] px-4 py-3 text-[#EFD09E] flex items-center justify-between">
                      <p className="font-semibold">PO {poCase.po}</p>
                      <p className="text-xs text-[#EFD09E]/70">{poCase.cases.length} Cases Generated</p>
                    </div>
                    <div className="overflow-x-auto bg-transparent rounded-b-2xl shadow-[8px_8px_20px_rgba(166,180,200,0.30),-8px_-8px_20px_rgba(255,255,255,0.95)]">
                      <table className="min-w-full text-sm">
                        <thead className="bg-[#D4AA7D] text-[#272727] uppercase text-xs font-black tracking-wider">
                          <tr>
                            <th className="px-3 py-2 text-left">No</th>
                            <th className="px-3 py-2 text-left">Type</th>
                            <th className="px-3 py-2 text-left">Item</th>
                            <th className="px-3 py-2 text-left">Qty</th>
                            <th className="px-3 py-2 text-left">Dimensions</th>
                            <th className="px-3 py-2 text-left">Note</th>
                          </tr>
                        </thead>
                        <tbody className="bg-transparent">
                          {poCase.cases.map((c) => {
                            const skuText = c.items.map((i) => i.sku).join(" / ");
                            const qtyText = c.items.map((i) => String(i.qty)).join(" + ");
                            return (
                              <tr key={`${poCase.po}-${c.caseNo}-${c.type}`} className="border-t border-[#D4AA7D]/35 hover:bg-[#272727] group transition-colors">
                                <td className="px-3 py-2 font-semibold group-hover:text-[#EFD09E]">#{c.caseNo}</td>
                                <td className="px-3 py-2 group-hover:text-[#EFD09E]">{c.type}</td>
                                <td className="px-3 py-2 font-mono text-xs group-hover:text-[#EFD09E]">{skuText}</td>
                                <td className="px-3 py-2 group-hover:text-[#EFD09E]">{qtyText}</td>
                                <td className="px-3 py-2 group-hover:text-[#EFD09E]">{c.dims || "-"}</td>
                                <td className="px-3 py-2 text-[#7E5C4A] group-hover:text-[#EFD09E]/80">{c.note || "-"}</td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>
                  </div>
                ))}
              </div>
            </GlassCard>
          </div>
        </div>
      </section>
    </div>
  );
}

function Stat({ label, value, icon }: { label: string; value: number; icon: ReactNode }) {
  return (
    <div className="rounded-xl border border-[#D4AA7D]/40 bg-[#EFD09E]/55 px-3 py-3">
      <div className="flex items-center justify-between text-[#7E5C4A] text-xs uppercase tracking-wide">
        <span>{label}</span>
        {icon}
      </div>
      <p className="mt-2 text-2xl font-black text-[#272727]">{value}</p>
    </div>
  );
}
