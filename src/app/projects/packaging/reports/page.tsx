"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { ArrowUp, Download, Filter, PlusCircle, RefreshCw, Save, X } from "lucide-react";
import { GlassCard } from "@/components/shared/GlassCard";
import { ModuleHeader } from "@/components/projects/material-control/ModuleHeader";
import { DataTable, Column } from "@/components/shared/DataTable";
import { Modal } from "@/components/shared/Modal";

interface PackingReportRow {
  id: string;
  date: string;
  shipment: string;
  mode: string;
  product: string;
  customerName?: string;
  consigneeName?: string;
  transportMode?: string;
  siQty: number;
  qty: number;
  totalPackages: number;
  standardTotal: number;
  boxesTotal: number;
  warpTotal: number;
  returnableTotal: number;
  ratioStandard: number;
  ratioBoxes: number;
  ratioWarp: number;
  ratioReturnable: number;
  packagingBreakdown?: Record<PackagingBreakdownKey, number>;
  remark: string;
}

interface AddRecordForm {
  date: string;
  customerName: string;
  product: string;
  consigneeName: string;
  transportMode: string;
  siQty: string;
  totalProductQty: string;
  qty110x110x115: string;
  qty110x110x90: string;
  qty110x110x65: string;
  qty80x120x115: string;
  qty80x120x90: string;
  qty80x120x65: string;
  returnableQty: string;
  qty42x46x68: string;
  qty47x66x68: string;
  qty53x53x58: string;
  qty57x64x84: string;
  qty68x74x86: string;
  qty70x100x90: string;
  qty27x27x22: string;
  qty53x53x19: string;
  warpQty: string;
  unitQty: string;
  remark: string;
}

type PackagingBreakdownKey =
  | "qty110x110x115"
  | "qty110x110x90"
  | "qty110x110x65"
  | "qty80x120x115"
  | "qty80x120x90"
  | "qty80x120x65"
  | "returnableQty"
  | "qty42x46x68"
  | "qty47x66x68"
  | "qty53x53x58"
  | "qty57x64x84"
  | "qty68x74x86"
  | "qty70x100x90"
  | "qty27x27x22"
  | "qty53x53x19"
  | "warpQty"
  | "unitQty";

function CountingNumber({
  value,
  duration = 1000,
  className,
}: {
  value: number;
  duration?: number;
  className?: string;
}) {
  const [displayValue, setDisplayValue] = useState(0);
  const previousValueRef = useRef(0);

  useEffect(() => {
    const start = previousValueRef.current;
    const end = value;
    if (start === end) return;

    let frameId = 0;
    const startTime = performance.now();

    const animate = (now: number) => {
      const progress = Math.min((now - startTime) / duration, 1);
      const easedProgress = 1 - Math.pow(1 - progress, 3);
      const nextValue = Math.round(start + (end - start) * easedProgress);
      setDisplayValue(nextValue);

      if (progress < 1) {
        frameId = window.requestAnimationFrame(animate);
      } else {
        previousValueRef.current = end;
      }
    };

    frameId = window.requestAnimationFrame(animate);
    return () => window.cancelAnimationFrame(frameId);
  }, [value, duration]);

  return <span className={className}>{displayValue.toLocaleString()}</span>;
}

const MONTHS = [
  { value: "1", label: "January" },
  { value: "2", label: "February" },
  { value: "3", label: "March" },
  { value: "4", label: "April" },
  { value: "5", label: "May" },
  { value: "6", label: "June" },
  { value: "7", label: "July" },
  { value: "8", label: "August" },
  { value: "9", label: "September" },
  { value: "10", label: "October" },
  { value: "11", label: "November" },
  { value: "12", label: "December" },
];

const SHIPMENT_DETAIL_FIELDS: Array<{ key: keyof AddRecordForm; label: string; type: "text" | "number" }> = [
  { key: "date", label: "Date", type: "text" },
  { key: "customerName", label: "Customer Name", type: "text" },
  { key: "product", label: "Product", type: "text" },
  { key: "consigneeName", label: "Consignee Name", type: "text" },
  { key: "transportMode", label: "Transport Mode", type: "text" },
  { key: "siQty", label: "SI QTY", type: "number" },
  { key: "totalProductQty", label: "Total Product QTY", type: "number" },
];

const PACKAGING_BREAKDOWN_FIELDS: Array<{
  key: PackagingBreakdownKey;
  label: string;
  group: "standard" | "returnable" | "warp" | "unit";
}> = [
  { key: "qty110x110x115", label: "110x110x115 QTY", group: "standard" },
  { key: "qty110x110x90", label: "110x110x90 QTY", group: "standard" },
  { key: "qty110x110x65", label: "110x110x65 QTY", group: "standard" },
  { key: "qty80x120x115", label: "80X120X115 QTY", group: "standard" },
  { key: "qty80x120x90", label: "80X120X90 QTY", group: "standard" },
  { key: "qty80x120x65", label: "80X120X65 QTY", group: "standard" },
  { key: "returnableQty", label: "RETURNABLE QTY", group: "returnable" },
  { key: "qty42x46x68", label: "42X46X68 QTY", group: "standard" },
  { key: "qty47x66x68", label: "47X66X68 QTY", group: "standard" },
  { key: "qty53x53x58", label: "53X53X58 QTY", group: "standard" },
  { key: "qty57x64x84", label: "57X64X84 QTY", group: "standard" },
  { key: "qty68x74x86", label: "68X74X86 QTY", group: "standard" },
  { key: "qty70x100x90", label: "70X100X90 QTY", group: "standard" },
  { key: "qty27x27x22", label: "27X27X22 QTY", group: "standard" },
  { key: "qty53x53x19", label: "53X53X19 QTY", group: "standard" },
  { key: "warpQty", label: "WARP QTY", group: "warp" },
  { key: "unitQty", label: "UNIT QTY", group: "unit" },
];

const buildInitialAddForm = (date = ""): AddRecordForm => ({
  date,
  customerName: "",
  product: "",
  consigneeName: "",
  transportMode: "",
  siQty: "",
  totalProductQty: "",
  qty110x110x115: "",
  qty110x110x90: "",
  qty110x110x65: "",
  qty80x120x115: "",
  qty80x120x90: "",
  qty80x120x65: "",
  returnableQty: "",
  qty42x46x68: "",
  qty47x66x68: "",
  qty53x53x58: "",
  qty57x64x84: "",
  qty68x74x86: "",
  qty70x100x90: "",
  qty27x27x22: "",
  qty53x53x19: "",
  warpQty: "",
  unitQty: "",
  remark: "",
});

const parseNumberInput = (value: string): number => {
  const numberValue = Number(value);
  return Number.isFinite(numberValue) ? numberValue : 0;
};

const parseDateDDMMYYYY = (value: string): Date | null => {
  if (!value) return null;
  const [d, m, y] = value.split("-");
  const day = Number(d);
  const month = Number(m);
  const year = Number(y);
  if (!day || !month || !year) return null;
  const date = new Date(year, month - 1, day);
  return Number.isNaN(date.getTime()) ? null : date;
};

const splitCsvLine = (line: string): string[] => {
  const result: string[] = [];
  let current = "";
  let inQuotes = false;

  for (let i = 0; i < line.length; i += 1) {
    const ch = line[i];

    if (ch === '"') {
      if (inQuotes && line[i + 1] === '"') {
        current += '"';
        i += 1;
      } else {
        inQuotes = !inQuotes;
      }
      continue;
    }

    if (ch === "," && !inQuotes) {
      result.push(current);
      current = "";
      continue;
    }

    current += ch;
  }

  result.push(current);
  return result;
};

const parsePackingCsv = (csvText: string): PackingReportRow[] => {
  const lines = csvText.split(/\r?\n/).filter(Boolean);
  if (lines.length <= 1) return [];

  return lines.slice(1).map((line, index) => {
    const cols = splitCsvLine(line);

    return {
      id: `${index + 1}`,
      date: cols[0] || "",
      shipment: cols[1] || "-",
      mode: cols[2] || "-",
      product: cols[3] || "-",
      customerName: "FMT",
      transportMode: cols[2] || "-",
      consigneeName: cols[15] || "-",
      siQty: Number(cols[4]) || 0,
      qty: Number(cols[5]) || 0,
      totalPackages: Number(cols[6]) || 0,
      standardTotal: Number(cols[7]) || 0,
      boxesTotal: Number(cols[8]) || 0,
      warpTotal: Number(cols[9]) || 0,
      returnableTotal: Number(cols[10]) || 0,
      ratioStandard: Number(cols[11]) || 0,
      ratioBoxes: Number(cols[12]) || 0,
      ratioWarp: Number(cols[13]) || 0,
      ratioReturnable: Number(cols[14]) || 0,
      packagingBreakdown: undefined,
      remark: cols[32] || "",
    };
  });
};

const calculatePackagingTotals = (form: AddRecordForm) => {
  const packagingBreakdown = PACKAGING_BREAKDOWN_FIELDS.reduce<Record<PackagingBreakdownKey, number>>(
    (acc, field) => {
      acc[field.key] = parseNumberInput(form[field.key]);
      return acc;
    },
    {} as Record<PackagingBreakdownKey, number>
  );

  const standardTotal = PACKAGING_BREAKDOWN_FIELDS.filter((field) => field.group === "standard").reduce(
    (sum, field) => sum + packagingBreakdown[field.key],
    0
  );
  const returnableTotal = packagingBreakdown.returnableQty;
  const warpTotal = packagingBreakdown.warpQty;
  const boxesTotal = packagingBreakdown.unitQty;
  const totalPackages = standardTotal + returnableTotal + warpTotal + boxesTotal;

  return {
    packagingBreakdown,
    standardTotal,
    returnableTotal,
    warpTotal,
    boxesTotal,
    totalPackages,
  };
};

export default function PackagingReportsPage() {
  const [rows, setRows] = useState<PackingReportRow[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [searchValue, setSearchValue] = useState("");
  const [isFilterExpanded, setIsFilterExpanded] = useState(false);
  const [selectedYear, setSelectedYear] = useState("All");
  const [selectedMonth, setSelectedMonth] = useState("All");
  const [selectedShipment, setSelectedShipment] = useState("All");
  const [selectedProduct, setSelectedProduct] = useState("All");
  const [selectedMode, setSelectedMode] = useState("All");
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isReviewingAddRecord, setIsReviewingAddRecord] = useState(false);
  const [addError, setAddError] = useState<string | null>(null);
  const [selectedRow, setSelectedRow] = useState<PackingReportRow | null>(null);
  const [showScrollTop, setShowScrollTop] = useState(false);
  const [addForm, setAddForm] = useState<AddRecordForm>(buildInitialAddForm());
  const filterAreaRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const loadCsv = async () => {
      setIsLoading(true);
      setError(null);
      try {
        const res = await fetch("/files/packing_export_2026-02-27_23-23.csv");
        if (!res.ok) throw new Error(`CSV load failed (${res.status})`);
        const csvText = await res.text();
        setRows(parsePackingCsv(csvText));
      } catch (err) {
        const message = err instanceof Error ? err.message : "Unknown error";
        setError(message);
      } finally {
        setIsLoading(false);
      }
    };

    loadCsv();
  }, []);

  useEffect(() => {
    const onScroll = () => {
      setShowScrollTop(window.scrollY > 280);
    };
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    if (!isFilterExpanded) return;

    const onPointerDownOutside = (event: MouseEvent) => {
      const targetNode = event.target as Node | null;
      if (!targetNode) return;
      if (filterAreaRef.current?.contains(targetNode)) return;
      setIsFilterExpanded(false);
    };

    document.addEventListener("mousedown", onPointerDownOutside);
    return () => document.removeEventListener("mousedown", onPointerDownOutside);
  }, [isFilterExpanded]);

  const filterOptions = useMemo(() => {
    const years = new Set<string>();
    const shipments = new Set<string>();
    const products = new Set<string>();
    const modes = new Set<string>();

    rows.forEach((row) => {
      const parsed = parseDateDDMMYYYY(row.date);
      if (parsed) years.add(String(parsed.getFullYear()));
      if (row.shipment && row.shipment !== "-") shipments.add(row.shipment);
      if (row.product && row.product !== "-") products.add(row.product);
      if (row.mode && row.mode !== "-") modes.add(row.mode);
    });

    return {
      years: Array.from(years).sort((a, b) => Number(b) - Number(a)),
      shipments: Array.from(shipments).sort(),
      products: Array.from(products).sort(),
      modes: Array.from(modes).sort(),
    };
  }, [rows]);

  const filteredRows = useMemo(() => {
    return rows.filter((row) => {
      const parsed = parseDateDDMMYYYY(row.date);
      const year = parsed ? String(parsed.getFullYear()) : "";
      const month = parsed ? String(parsed.getMonth() + 1) : "";

      const matchSearch =
        row.shipment.toLowerCase().includes(searchValue.toLowerCase()) ||
        row.product.toLowerCase().includes(searchValue.toLowerCase()) ||
        row.mode.toLowerCase().includes(searchValue.toLowerCase());

      const matchYear = selectedYear === "All" || year === selectedYear;
      const matchMonth = selectedMonth === "All" || month === selectedMonth;
      const matchShipment = selectedShipment === "All" || row.shipment === selectedShipment;
      const matchProduct = selectedProduct === "All" || row.product === selectedProduct;
      const matchMode = selectedMode === "All" || row.mode === selectedMode;

      return (
        matchSearch &&
        matchYear &&
        matchMonth &&
        matchShipment &&
        matchProduct &&
        matchMode
      );
    });
  }, [rows, searchValue, selectedYear, selectedMonth, selectedShipment, selectedProduct, selectedMode]);

  const stats = useMemo(() => {
    const totalRows = filteredRows.length;
    const sumSiQty = filteredRows.reduce((sum, row) => sum + row.siQty, 0);
    const sumQty = filteredRows.reduce((sum, row) => sum + row.qty, 0);
    const sumPackages = filteredRows.reduce((sum, row) => sum + row.totalPackages, 0);
    return { totalRows, sumSiQty, sumQty, sumPackages };
  }, [filteredRows]);

  const reviewTotals = useMemo(() => calculatePackagingTotals(addForm), [addForm]);

  const columns: Column<PackingReportRow>[] = [
    { key: "date", header: "Date", align: "center" },
    { key: "shipment", header: "Consignee Name", align: "center" },
    { key: "mode", header: "Transport Mode", align: "center" },
    { key: "product", header: "Product", align: "center" },
    { key: "siQty", header: "SI QTY", align: "center" },
    { key: "qty", header: "Total Product QTY", align: "center" },
    { key: "totalPackages", header: "Total Pkg", align: "center" },
  ];

  const exportToCsv = () => {
    if (!filteredRows.length) return;

    const header = [
      "Date",
      "Consignee Name",
      "Transport Mode",
      "Product",
      "SI QTY",
      "Total Product QTY",
      "Total Packages",
      "Standard Total",
      "Boxes Total",
      "Warp Total",
      "Returnable Total",
      "Ratio Standard",
      "Ratio Boxes",
      "Ratio Warp",
      "Ratio Returnable",
      "Remark",
    ];

    const csvRows = [
      header.join(","),
      ...filteredRows.map((row) =>
        [
          row.date,
          row.shipment,
          row.mode,
          row.product,
          row.siQty,
          row.qty,
          row.totalPackages,
          row.standardTotal,
          row.boxesTotal,
          row.warpTotal,
          row.returnableTotal,
          row.ratioStandard.toFixed(2),
          row.ratioBoxes.toFixed(2),
          row.ratioWarp.toFixed(2),
          row.ratioReturnable.toFixed(2),
          row.remark,
        ]
          .map((value) => `"${String(value).replace(/"/g, '""')}"`)
          .join(",")
      ),
    ].join("\n");

    const blob = new Blob([csvRows], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;

    const now = new Date();
    const datePart = now.toISOString().split("T")[0];
    const timePart = `${String(now.getHours()).padStart(2, "0")}-${String(now.getMinutes()).padStart(2, "0")}`;
    link.download = `packaging_report_${datePart}_${timePart}.csv`;

    link.click();
    URL.revokeObjectURL(url);
  };

  const resetFilters = () => {
    setSelectedYear("All");
    setSelectedMonth("All");
    setSelectedShipment("All");
    setSelectedProduct("All");
    setSelectedMode("All");
    setSearchValue("");
  };

  const openAddModal = () => {
    const now = new Date();
    const date = `${String(now.getDate()).padStart(2, "0")}-${String(now.getMonth() + 1).padStart(2, "0")}-${now.getFullYear()}`;
    setAddForm(buildInitialAddForm(date));
    setIsReviewingAddRecord(false);
    setAddError(null);
    setIsAddModalOpen(true);
  };

  const closeAddModal = () => {
    setIsAddModalOpen(false);
    setIsReviewingAddRecord(false);
    setAddError(null);
  };

  const validateAddRecord = () => {
    if (!parseDateDDMMYYYY(addForm.date)) {
      setAddError("Date format ต้องเป็น DD-MM-YYYY");
      return false;
    }
    if (
      !addForm.customerName.trim() ||
      !addForm.product.trim() ||
      !addForm.consigneeName.trim() ||
      !addForm.transportMode.trim()
    ) {
      setAddError("กรอก Customer Name, Product, Consignee Name และ Transport Mode ให้ครบ");
      return false;
    }
    setAddError(null);
    return true;
  };

  const handleReviewRecord = () => {
    if (!validateAddRecord()) return;
    setIsReviewingAddRecord(true);
  };

  const handleSaveRecord = () => {
    if (!validateAddRecord()) return;

    const { packagingBreakdown, standardTotal, boxesTotal, warpTotal, returnableTotal, totalPackages } =
      calculatePackagingTotals(addForm);
    const ratioBase = totalPackages > 0 ? totalPackages : 1;

    const customerName = addForm.customerName.trim();
    const consigneeName = addForm.consigneeName.trim();
    const transportMode = addForm.transportMode.trim();

    const newRow: PackingReportRow = {
      id: `${Date.now()}`,
      date: addForm.date.trim(),
      shipment: consigneeName,
      mode: transportMode,
      product: addForm.product.trim(),
      customerName,
      consigneeName,
      transportMode,
      siQty: parseNumberInput(addForm.siQty),
      qty: parseNumberInput(addForm.totalProductQty),
      totalPackages,
      standardTotal,
      boxesTotal,
      warpTotal,
      returnableTotal,
      ratioStandard: (standardTotal / ratioBase) * 100,
      ratioBoxes: (boxesTotal / ratioBase) * 100,
      ratioWarp: (warpTotal / ratioBase) * 100,
      ratioReturnable: (returnableTotal / ratioBase) * 100,
      packagingBreakdown,
      remark: addForm.remark.trim(),
    };

    // Local insert now; this function can call Firebase create API in next step.
    setRows((prev) => [newRow, ...prev]);
    closeAddModal();
  };

  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  return (
    <div className="min-h-screen bg-[#F6EDDE] pt-20 pb-12">
      <section className="py-12 md:py-16">
        <div className="container-custom">
          <ModuleHeader
            title="Packing Reports"
            description="Report source: packing_export_2026-02-27_23-23.csv"
            backHref="/projects/packaging"
            backLabel="Packaging Console"
          >
            <div className="mt-8 space-y-6">
              <div ref={filterAreaRef}>
                <div className="flex flex-wrap items-center gap-2">
                  <button
                    onClick={() => setIsFilterExpanded((prev) => !prev)}
                    className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold transition-all ${
                      isFilterExpanded
                        ? "bg-[#272727] text-[#EFD09E]"
                        : "bg-white/70 text-[#7E5C4A] hover:bg-[#272727] hover:text-[#EFD09E] hover:border-[#272727] border border-white/60"
                    }`}
                  >
                    <Filter className="w-3.5 h-3.5" />
                    Filters
                  </button>

                  {selectedYear !== "All" && (
                    <span className="inline-flex items-center gap-1 px-2.5 py-1 bg-[#D4AA7D]/25 text-[#7E5C4A] rounded-full text-xs font-medium">
                      {selectedYear}
                      <button onClick={() => setSelectedYear("All")} className="hover:text-[#272727]">
                        <X className="w-3 h-3" />
                      </button>
                    </span>
                  )}

                  {selectedMonth !== "All" && (
                    <span className="inline-flex items-center gap-1 px-2.5 py-1 bg-[#EFD09E]/60 text-[#7E5C4A] rounded-full text-xs font-medium">
                      {MONTHS.find((month) => month.value === selectedMonth)?.label}
                      <button onClick={() => setSelectedMonth("All")} className="hover:text-[#272727]">
                        <X className="w-3 h-3" />
                      </button>
                    </span>
                  )}

                  {selectedShipment !== "All" && (
                    <span className="inline-flex items-center gap-1 px-2.5 py-1 bg-[#EEF2F6] text-[#7E5C4A] rounded-full text-xs font-medium border border-[#D4AA7D]/35">
                      {selectedShipment}
                      <button onClick={() => setSelectedShipment("All")} className="hover:text-[#272727]">
                        <X className="w-3 h-3" />
                      </button>
                    </span>
                  )}

                  {selectedProduct !== "All" && (
                    <span className="inline-flex items-center gap-1 px-2.5 py-1 bg-[#EEF2F6] text-[#7E5C4A] rounded-full text-xs font-medium border border-[#D4AA7D]/35">
                      {selectedProduct}
                      <button onClick={() => setSelectedProduct("All")} className="hover:text-[#272727]">
                        <X className="w-3 h-3" />
                      </button>
                    </span>
                  )}

                  {selectedMode !== "All" && (
                    <span className="inline-flex items-center gap-1 px-2.5 py-1 bg-[#EEF2F6] text-[#7E5C4A] rounded-full text-xs font-medium border border-[#D4AA7D]/35">
                      {selectedMode}
                      <button onClick={() => setSelectedMode("All")} className="hover:text-[#272727]">
                        <X className="w-3 h-3" />
                      </button>
                    </span>
                  )}

                  {(selectedYear !== "All" ||
                    selectedMonth !== "All" ||
                    selectedShipment !== "All" ||
                    selectedProduct !== "All" ||
                    selectedMode !== "All" ||
                    searchValue.trim() !== "") && (
                    <button
                      onClick={resetFilters}
                      className="text-xs text-[#7E5C4A]/80 hover:text-rose-700 transition-colors"
                    >
                      Clear all
                    </button>
                  )}

                  <div className="ml-auto flex items-center gap-2">
                    <button
                      onClick={openAddModal}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-white/70 text-[#7E5C4A] hover:bg-[#272727] hover:text-[#EFD09E] hover:border-[#272727] rounded-full text-xs font-semibold transition-all border border-white"
                    >
                      <PlusCircle className="w-3.5 h-3.5" />
                      Add Record
                    </button>
                    <button
                      onClick={() => window.location.reload()}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-white/70 text-[#7E5C4A] hover:bg-[#272727] hover:text-[#EFD09E] hover:border-[#272727] rounded-full text-xs font-semibold transition-all border border-white"
                    >
                      <RefreshCw className="w-3.5 h-3.5" />
                      Refresh
                    </button>
                    <button
                      onClick={exportToCsv}
                      disabled={filteredRows.length === 0}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-[#272727] text-[#EFD09E] hover:bg-[#1f1f1f] rounded-full text-xs font-semibold transition-all disabled:opacity-50"
                    >
                      <Download className="w-3.5 h-3.5" />
                      Export CSV
                    </button>
                  </div>
                </div>

                {isFilterExpanded && (
                  <GlassCard className="mt-3 p-4 bg-[#EEF2F6]/90 border border-white/80">
                    <div className="grid grid-cols-1 md:grid-cols-6 gap-3">
                      <div>
                        <label className="block text-[10px] font-black text-[#7E5C4A]/80 uppercase tracking-wide mb-1">
                          Search
                        </label>
                        <input
                          value={searchValue}
                          onChange={(event) => setSearchValue(event.target.value)}
                          placeholder="Shipment/Product/Mode"
                          className="w-full px-3 py-2 bg-white/70 border border-white rounded-lg text-sm text-[#272727] outline-none focus:ring-2 focus:ring-[#D4AA7D]/35"
                        />
                      </div>
                      <div>
                        <label className="block text-[10px] font-black text-[#7E5C4A]/80 uppercase tracking-wide mb-1">
                          Year
                        </label>
                        <select
                          value={selectedYear}
                          onChange={(event) => setSelectedYear(event.target.value)}
                          className="w-full px-3 py-2 bg-white/70 border border-white rounded-lg text-sm text-[#272727] outline-none focus:ring-2 focus:ring-[#D4AA7D]/35"
                        >
                          <option value="All">All Years</option>
                          {filterOptions.years.map((year) => (
                            <option key={year} value={year}>
                              {year}
                            </option>
                          ))}
                        </select>
                      </div>
                      <div>
                        <label className="block text-[10px] font-black text-[#7E5C4A]/80 uppercase tracking-wide mb-1">
                          Month
                        </label>
                        <select
                          value={selectedMonth}
                          onChange={(event) => setSelectedMonth(event.target.value)}
                          className="w-full px-3 py-2 bg-white/70 border border-white rounded-lg text-sm text-[#272727] outline-none focus:ring-2 focus:ring-[#D4AA7D]/35"
                        >
                          <option value="All">All Months</option>
                          {MONTHS.map((month) => (
                            <option key={month.value} value={month.value}>
                              {month.label}
                            </option>
                          ))}
                        </select>
                      </div>
                      <div>
                        <label className="block text-[10px] font-black text-[#7E5C4A]/80 uppercase tracking-wide mb-1">
                          Shipment
                        </label>
                        <select
                          value={selectedShipment}
                          onChange={(event) => setSelectedShipment(event.target.value)}
                          className="w-full px-3 py-2 bg-white/70 border border-white rounded-lg text-sm text-[#272727] outline-none focus:ring-2 focus:ring-[#D4AA7D]/35"
                        >
                          <option value="All">All Shipments</option>
                          {filterOptions.shipments.map((shipment) => (
                            <option key={shipment} value={shipment}>
                              {shipment}
                            </option>
                          ))}
                        </select>
                      </div>
                      <div>
                        <label className="block text-[10px] font-black text-[#7E5C4A]/80 uppercase tracking-wide mb-1">
                          Product
                        </label>
                        <select
                          value={selectedProduct}
                          onChange={(event) => setSelectedProduct(event.target.value)}
                          className="w-full px-3 py-2 bg-white/70 border border-white rounded-lg text-sm text-[#272727] outline-none focus:ring-2 focus:ring-[#D4AA7D]/35"
                        >
                          <option value="All">All Products</option>
                          {filterOptions.products.map((product) => (
                            <option key={product} value={product}>
                              {product}
                            </option>
                          ))}
                        </select>
                      </div>
                      <div>
                        <label className="block text-[10px] font-black text-[#7E5C4A]/80 uppercase tracking-wide mb-1">
                          Mode
                        </label>
                        <select
                          value={selectedMode}
                          onChange={(event) => setSelectedMode(event.target.value)}
                          className="w-full px-3 py-2 bg-white/70 border border-white rounded-lg text-sm text-[#272727] outline-none focus:ring-2 focus:ring-[#D4AA7D]/35"
                        >
                          <option value="All">All Modes</option>
                          {filterOptions.modes.map((mode) => (
                            <option key={mode} value={mode}>
                              {mode}
                            </option>
                          ))}
                        </select>
                      </div>
                    </div>
                  </GlassCard>
                )}
              </div>

              {error && (
                <GlassCard className="p-4 border border-rose-200 bg-rose-50/70 text-rose-700">
                  Failed to load source data: {error}
                </GlassCard>
              )}

              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <GlassCard className="p-5 bg-[#EEF2F6]/95 border border-white/80">
                  <p className="text-xs font-black uppercase tracking-wider text-[#7E5C4A]/75">Records</p>
                  <p className="text-3xl font-black text-[#272727] mt-1">
                    <CountingNumber value={stats.totalRows} />
                  </p>
                </GlassCard>
                <GlassCard className="p-5 bg-[#EEF2F6]/95 border border-white/80">
                  <p className="text-xs font-black uppercase tracking-wider text-[#7E5C4A]/75">SI QTY</p>
                  <p className="text-3xl font-black text-[#7E5C4A] mt-1">
                    <CountingNumber value={stats.sumSiQty} />
                  </p>
                </GlassCard>
                <GlassCard className="p-5 bg-[#EEF2F6]/95 border border-white/80">
                  <p className="text-xs font-black uppercase tracking-wider text-[#7E5C4A]/75">QTY</p>
                  <p className="text-3xl font-black text-[#272727] mt-1">
                    <CountingNumber value={stats.sumQty} />
                  </p>
                </GlassCard>
                <GlassCard className="p-5 bg-[#EEF2F6]/95 border border-white/80">
                  <p className="text-xs font-black uppercase tracking-wider text-[#7E5C4A]/75">Total Packages</p>
                  <p className="text-3xl font-black text-[#5a7a1a] mt-1">
                    <CountingNumber value={stats.sumPackages} />
                  </p>
                </GlassCard>
              </div>

              <DataTable
                columns={columns}
                data={filteredRows}
                keyField="id"
                onRowClick={(row) => setSelectedRow(row)}
                emptyMessage={isLoading ? "Loading report rows..." : "No report records found."}
              />
            </div>
          </ModuleHeader>
        </div>
      </section>

      <Modal
        isOpen={isAddModalOpen}
        onClose={closeAddModal}
        title="Add Packing Record"
        className="max-w-5xl"
      >
        <div className="space-y-4">
          {addError && (
            <div className="rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm font-medium text-rose-700">
              {addError}
            </div>
          )}

          {!isReviewingAddRecord ? (
            <>
              <div className="grid grid-cols-1 lg:grid-cols-[40%_60%] gap-4">
                <div className="rounded-2xl border border-[#D4AA7D]/35 bg-white/55 p-4 space-y-3">
                  <div className="pb-1 border-b border-[#D4AA7D]/30">
                    <p className="text-xs font-black uppercase tracking-wider text-[#7E5C4A]">
                      Shipment Details
                    </p>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {SHIPMENT_DETAIL_FIELDS.map((field) => (
                      (() => {
                        const unitSuffix =
                          field.key === "siQty" ? "Si." : field.key === "totalProductQty" ? "Pcs." : null;

                        return (
                          <div
                            key={field.key}
                            className={
                              field.key === "siQty" || field.key === "totalProductQty"
                                ? ""
                                : "md:col-span-2"
                            }
                          >
                            <label className="block text-[11px] font-bold text-[#7E5C4A] mb-1">
                              {field.label}
                              {field.key === "date" ? " (DD-MM-YYYY)" : ""}
                            </label>
                            {unitSuffix ? (
                              <div className="relative">
                                <input
                                  type={field.type}
                                  step={field.type === "number" ? "any" : undefined}
                                  value={addForm[field.key] as string}
                                  onChange={(event) =>
                                    setAddForm((prev) => ({ ...prev, [field.key]: event.target.value }))
                                  }
                                  className="w-full pl-3 pr-12 py-2 rounded-lg border border-[#D4AA7D]/35 bg-white/85 text-sm text-right outline-none focus:ring-2 focus:ring-[#D4AA7D]/35"
                                />
                                <span className="pointer-events-none absolute inset-y-0 right-3 flex items-center text-[11px] font-bold text-[#7E5C4A]/75">
                                  {unitSuffix}
                                </span>
                              </div>
                            ) : (
                              <input
                                type={field.type}
                                step={field.type === "number" ? "any" : undefined}
                                value={addForm[field.key] as string}
                                onChange={(event) =>
                                  setAddForm((prev) => ({ ...prev, [field.key]: event.target.value }))
                                }
                                className="w-full px-3 py-2 rounded-lg border border-[#D4AA7D]/35 bg-white/85 text-sm outline-none focus:ring-2 focus:ring-[#D4AA7D]/35"
                              />
                            )}
                          </div>
                        );
                      })()
                    ))}
                    <div className="md:col-span-2">
                      <label className="block text-[11px] font-bold text-[#7E5C4A] mb-1">Remark</label>
                      <textarea
                        value={addForm.remark}
                        onChange={(event) => setAddForm((prev) => ({ ...prev, remark: event.target.value }))}
                        rows={3}
                        className="w-full px-3 py-2 rounded-lg border border-[#D4AA7D]/35 bg-white/85 text-sm outline-none focus:ring-2 focus:ring-[#D4AA7D]/35 resize-none"
                      />
                    </div>
                  </div>
                </div>

                <div className="rounded-2xl border border-[#D4AA7D]/35 bg-white/55 p-4 space-y-3">
                  <div className="pb-1 border-b border-[#D4AA7D]/30">
                    <p className="text-xs font-black uppercase tracking-wider text-[#7E5C4A]">
                      Packaging Breakdown
                    </p>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                    {PACKAGING_BREAKDOWN_FIELDS.map((field) => (
                      <div key={field.key}>
                        <label className="block text-[11px] font-bold text-[#7E5C4A] mb-1">{field.label}</label>
                        <div className="relative">
                          <input
                            type="number"
                            step="1"
                            min="0"
                            value={addForm[field.key]}
                            onChange={(event) =>
                              setAddForm((prev) => ({ ...prev, [field.key]: event.target.value }))
                            }
                            className="w-full pl-3 pr-12 py-2 rounded-lg border border-[#D4AA7D]/35 bg-white/85 text-sm text-right outline-none focus:ring-2 focus:ring-[#D4AA7D]/35"
                          />
                          <span className="pointer-events-none absolute inset-y-0 right-3 flex items-center text-[11px] font-bold text-[#7E5C4A]/75">
                            Pkg.
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-1">
                <button
                  onClick={closeAddModal}
                  className="px-4 py-2 rounded-lg border border-[#D4AA7D]/35 text-[#7E5C4A] text-sm font-semibold hover:bg-white/70 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleReviewRecord}
                  className="px-4 py-2 rounded-lg bg-[#272727] hover:bg-[#1f1f1f] text-[#EFD09E] text-sm font-semibold transition-colors"
                >
                  Review Data
                </button>
              </div>
            </>
          ) : (
            <>
              <div className="grid grid-cols-1 lg:grid-cols-[40%_60%] gap-4">
                <div className="rounded-2xl border border-[#D4AA7D]/35 bg-white/65 p-4 space-y-2">
                  <p className="text-xs font-black uppercase tracking-wider text-[#7E5C4A]">
                    Shipment Details (Review)
                  </p>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                    {[
                      { label: "Date", value: addForm.date || "-", compact: false },
                      { label: "Customer Name", value: addForm.customerName || "-", compact: false },
                      { label: "Product", value: addForm.product || "-", compact: false },
                      { label: "Consignee Name", value: addForm.consigneeName || "-", compact: false },
                      { label: "Transport Mode", value: addForm.transportMode || "-", compact: false },
                      { label: "SI QTY", value: addForm.siQty || "-", compact: true },
                      { label: "Total Product QTY", value: addForm.totalProductQty || "-", compact: true },
                      { label: "Remark", value: addForm.remark || "-", compact: false },
                    ].map((field) => (
                      <div
                        key={field.label}
                        className={`rounded-lg border border-[#D4AA7D]/25 bg-white/80 px-3 py-2 ${
                          field.compact ? "" : "md:col-span-2"
                        }`}
                      >
                        <p className="text-[10px] font-black uppercase tracking-wide text-[#7E5C4A]/80">{field.label}</p>
                        <p className="text-sm font-medium text-[#272727] mt-1 break-words">{field.value}</p>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="rounded-2xl border border-[#D4AA7D]/35 bg-white/65 p-4 space-y-2">
                  <p className="text-xs font-black uppercase tracking-wider text-[#7E5C4A]">
                    Packaging Breakdown (Review)
                  </p>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2">
                    {PACKAGING_BREAKDOWN_FIELDS.map((field) => (
                      <div key={field.key} className="rounded-lg border border-[#D4AA7D]/25 bg-white/80 px-3 py-2">
                        <p className="text-[10px] font-black uppercase tracking-wide text-[#7E5C4A]/80">{field.label}</p>
                        <p className="text-sm font-semibold text-[#272727] mt-1">
                          {reviewTotals.packagingBreakdown[field.key].toLocaleString()}
                        </p>
                      </div>
                    ))}
                  </div>
                  <div className="grid grid-cols-2 gap-2 pt-1">
                    <div className="rounded-lg border border-[#D4AA7D]/25 bg-white/80 px-3 py-2">
                      <p className="text-[10px] font-black uppercase tracking-wide text-[#7E5C4A]/80">Standard Total</p>
                      <p className="text-sm font-semibold text-[#272727] mt-1">{reviewTotals.standardTotal.toLocaleString()}</p>
                    </div>
                    <div className="rounded-lg border border-[#D4AA7D]/25 bg-white/80 px-3 py-2">
                      <p className="text-[10px] font-black uppercase tracking-wide text-[#7E5C4A]/80">Total Packages</p>
                      <p className="text-sm font-semibold text-[#272727] mt-1">{reviewTotals.totalPackages.toLocaleString()}</p>
                    </div>
                  </div>
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-1">
                <button
                  onClick={() => setIsReviewingAddRecord(false)}
                  className="px-4 py-2 rounded-lg border border-[#D4AA7D]/35 text-[#7E5C4A] text-sm font-semibold hover:bg-white/70 transition-colors"
                >
                  Back to Edit
                </button>
                <button
                  onClick={handleSaveRecord}
                  className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-[#272727] hover:bg-[#1f1f1f] text-[#EFD09E] text-sm font-semibold transition-colors"
                >
                  <Save className="w-4 h-4" />
                  Confirm Save
                </button>
              </div>
            </>
          )}
        </div>
      </Modal>

      <Modal
        isOpen={!!selectedRow}
        onClose={() => setSelectedRow(null)}
        title="Packing Record Detail"
        className="max-w-2xl"
      >
        {selectedRow && (
          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {[
                { label: "Date", value: selectedRow.date },
                { label: "Customer Name", value: "FMT" },
                { label: "Consignee Name", value: selectedRow.shipment },
                { label: "Transport Mode", value: selectedRow.transportMode || selectedRow.mode },
                { label: "Product", value: selectedRow.product },
                { label: "SI QTY", value: selectedRow.siQty },
                { label: "Total Product QTY", value: selectedRow.qty },
                { label: "Total Packages", value: selectedRow.totalPackages },
                { label: "Standard Total", value: selectedRow.standardTotal },
                { label: "Boxes Total", value: selectedRow.boxesTotal },
                { label: "Warp Total", value: selectedRow.warpTotal },
                { label: "Returnable Total", value: selectedRow.returnableTotal },
                { label: "Ratio Standard", value: selectedRow.ratioStandard.toFixed(2) },
                { label: "Ratio Boxes", value: selectedRow.ratioBoxes.toFixed(2) },
                { label: "Ratio Warp", value: selectedRow.ratioWarp.toFixed(2) },
                { label: "Ratio Returnable", value: selectedRow.ratioReturnable.toFixed(2) },
              ].map((field) => (
                <div key={field.label} className="rounded-xl border border-[#D4AA7D]/35 bg-white/70 px-3 py-2">
                  <p className="text-[10px] font-black uppercase tracking-wide text-[#7E5C4A]/80">{field.label}</p>
                  <p className="text-sm font-semibold text-[#272727] mt-1">{field.value}</p>
                </div>
              ))}
            </div>

            {selectedRow.packagingBreakdown && (
              <div className="space-y-2">
                <p className="text-xs font-black uppercase tracking-wider text-[#7E5C4A]">Packaging Breakdown</p>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                  {PACKAGING_BREAKDOWN_FIELDS.map((field) => (
                    <div key={field.key} className="rounded-xl border border-[#D4AA7D]/35 bg-white/70 px-3 py-2">
                      <p className="text-[10px] font-black uppercase tracking-wide text-[#7E5C4A]/80">{field.label}</p>
                      <p className="text-sm font-semibold text-[#272727] mt-1">
                        {selectedRow.packagingBreakdown?.[field.key]?.toLocaleString() || 0}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div className="rounded-xl border border-[#D4AA7D]/35 bg-white/70 px-3 py-2">
              <p className="text-[10px] font-black uppercase tracking-wide text-[#7E5C4A]/80">Remark</p>
              <p className="text-sm font-medium text-[#272727] mt-1 whitespace-pre-wrap">
                {selectedRow.remark || "-"}
              </p>
            </div>

            <div className="flex justify-end">
              <button
                onClick={() => setSelectedRow(null)}
                className="px-4 py-2 rounded-lg bg-[#272727] hover:bg-[#1f1f1f] text-[#EFD09E] text-sm font-semibold transition-colors"
              >
                Close
              </button>
            </div>
          </div>
        )}
      </Modal>

      {showScrollTop && (
        <button
          onClick={scrollToTop}
          aria-label="Back to top"
          className="fixed bottom-6 right-6 z-40 inline-flex items-center justify-center w-12 h-12 rounded-full bg-[#272727] text-[#EFD09E] border border-[#EFD09E]/25 shadow-lg shadow-[#272727]/25 hover:bg-[#1f1f1f] transition-colors"
        >
          <ArrowUp className="w-5 h-5" />
        </button>
      )}
    </div>
  );
}
