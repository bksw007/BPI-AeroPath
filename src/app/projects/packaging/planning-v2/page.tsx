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
    <div className="min-h-screen bg-[#f4f6fb] pt-20 pb-16 relative overflow-hidden">
      <div className="pointer-events-none absolute -top-24 -left-20 h-80 w-80 rounded-full bg-cyan-300/40 blur-3xl" />
      <div className="pointer-events-none absolute top-20 right-0 h-96 w-96 rounded-full bg-orange-300/30 blur-3xl" />
      <div className="pointer-events-none absolute bottom-0 left-1/3 h-72 w-72 rounded-full bg-emerald-300/30 blur-3xl" />

      <section className="container-custom relative z-10 space-y-8">
        <ModuleHeader
          title="Packing Planning V2"
          description="Deterministic flow for warehouse-safe packing with strict unknown filtering."
          backHref="/projects/packaging"
          backLabel="Smart Packaging"
        />

        <div className="grid gap-6 xl:grid-cols-[360px_minmax(0,1fr)]">
          <GlassCard className="h-fit p-5 space-y-4 border-2 border-slate-900/5 bg-white/90">
            <div className="rounded-2xl bg-slate-900 text-white p-4">
              <div className="flex items-center justify-between">
                <p className="text-xs uppercase tracking-[0.2em] text-slate-300">Mode</p>
                <Sparkles className="h-4 w-4 text-cyan-300" />
              </div>
              <p className="mt-2 font-black text-xl">Deterministic Planner</p>
              <p className="text-sm text-slate-300 mt-1">A/E/R allowed package only</p>
            </div>

            <div className="space-y-3 text-sm">
              <div className="rounded-xl border border-slate-200 bg-white p-3">
                <p className="text-slate-500">Customer</p>
                <p className="font-semibold text-slate-900">{selectedCustomer?.code || "Not selected"}</p>
              </div>
              <div className="rounded-xl border border-slate-200 bg-white p-3">
                <p className="text-slate-500">Pack Type</p>
                <p className="font-semibold text-slate-900">{selectedCustomer?.packType || "-"}</p>
              </div>
              <div className="rounded-xl border border-slate-200 bg-white p-3">
                <p className="text-slate-500">PO in Result</p>
                <p className="font-semibold text-slate-900">{poCount}</p>
              </div>
            </div>

            <button
              onClick={handleExportPDF}
              disabled={!planResult.length || !selectedCustomer || isExporting}
              className="w-full inline-flex items-center justify-center gap-2 rounded-xl bg-slate-900 px-4 py-3 text-sm font-semibold text-white disabled:opacity-40"
            >
              {isExporting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Download className="h-4 w-4" />}
              Download Plan PDF
            </button>
          </GlassCard>

          <div className="space-y-6">
            <GlassCard className="p-6 border-2 border-slate-900/5 bg-white/90">
              <div className="flex items-center gap-2 text-slate-700 mb-4">
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
                          ? "border-cyan-500 bg-cyan-50 shadow-sm"
                          : "border-slate-200 bg-white hover:border-slate-400",
                      ].join(" ")}
                    >
                      <p className="font-semibold text-slate-900">{code}</p>
                      <p className="text-xs text-slate-500 mt-1">Type {packType}</p>
                    </button>
                  );
                })}
              </div>
            </GlassCard>

            <GlassCard className="p-6 border-2 border-slate-900/5 bg-white/90">
              <div className="flex items-center gap-2 text-slate-700 mb-4">
                <Radar className="h-4 w-4" />
                <p className="font-semibold">2. Input PO Data</p>
              </div>
              <textarea
                value={rawData}
                onChange={(e) => setRawData(e.target.value)}
                placeholder="PO<TAB>SKU<TAB>QTY"
                className="min-h-[220px] w-full rounded-2xl border border-slate-200 bg-slate-50 p-4 font-mono text-sm text-slate-800 outline-none focus:border-cyan-500"
              />
              <div className="mt-4 flex flex-wrap gap-3">
                <button
                  onClick={handleSampleData}
                  className="rounded-xl border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-slate-700"
                >
                  Fill Sample
                </button>
                <button
                  onClick={handleGeneratePlan}
                  disabled={!selectedCustomer || !rawData.trim() || isProcessing}
                  className="inline-flex items-center gap-2 rounded-xl bg-cyan-600 px-4 py-2 text-sm font-semibold text-white disabled:opacity-40"
                >
                  {isProcessing ? <Loader2 className="h-4 w-4 animate-spin" /> : <ArrowRight className="h-4 w-4" />}
                  Generate V2 Plan
                </button>
              </div>
            </GlassCard>

            <GlassCard className="p-6 border-2 border-slate-900/5 bg-white/90">
              <div className="flex items-center gap-2 text-slate-700 mb-4">
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
                <div className="rounded-2xl border border-dashed border-slate-300 bg-slate-50 p-8 text-center text-sm text-slate-500">
                  Generate plan to display PO, No, Item, Qty, Dimensions, Note
                </div>
              ) : null}

              <div className="space-y-5">
                {planResult.map((poCase) => (
                  <div key={poCase.po} className="overflow-hidden rounded-2xl border border-slate-200">
                    <div className="bg-slate-900 px-4 py-3 text-white flex items-center justify-between">
                      <p className="font-semibold">PO {poCase.po}</p>
                      <p className="text-xs text-slate-300">{poCase.cases.length} Cases Generated</p>
                    </div>
                    <div className="overflow-x-auto bg-white">
                      <table className="min-w-full text-sm">
                        <thead className="bg-slate-50 text-slate-700">
                          <tr>
                            <th className="px-3 py-2 text-left">No</th>
                            <th className="px-3 py-2 text-left">Type</th>
                            <th className="px-3 py-2 text-left">Item</th>
                            <th className="px-3 py-2 text-left">Qty</th>
                            <th className="px-3 py-2 text-left">Dimensions</th>
                            <th className="px-3 py-2 text-left">Note</th>
                          </tr>
                        </thead>
                        <tbody>
                          {poCase.cases.map((c) => {
                            const skuText = c.items.map((i) => i.sku).join(" / ");
                            const qtyText = c.items.map((i) => String(i.qty)).join(" + ");
                            return (
                              <tr key={`${poCase.po}-${c.caseNo}-${c.type}`} className="border-t border-slate-100">
                                <td className="px-3 py-2 font-semibold">#{c.caseNo}</td>
                                <td className="px-3 py-2">{c.type}</td>
                                <td className="px-3 py-2 font-mono text-xs">{skuText}</td>
                                <td className="px-3 py-2">{qtyText}</td>
                                <td className="px-3 py-2">{c.dims || "-"}</td>
                                <td className="px-3 py-2 text-slate-600">{c.note || "-"}</td>
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
    <div className="rounded-xl border border-slate-200 bg-white px-3 py-3">
      <div className="flex items-center justify-between text-slate-500 text-xs uppercase tracking-wide">
        <span>{label}</span>
        {icon}
      </div>
      <p className="mt-2 text-2xl font-black text-slate-900">{value}</p>
    </div>
  );
}
