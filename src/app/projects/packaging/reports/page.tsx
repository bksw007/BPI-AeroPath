"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import {
  ArrowUp,
  Boxes,
  Database,
  Download,
  Filter,
  Hash,
  Package,
  Pencil,
  PlusCircle,
  RefreshCw,
  Save,
  Trash2,
  X,
} from "lucide-react";
import { GlassCard } from "@/components/shared/GlassCard";
import { ModuleHeader } from "@/components/projects/material-control/ModuleHeader";
import { DataTable, Column } from "@/components/shared/DataTable";
import { Modal } from "@/components/shared/Modal";
import { db } from "@/lib/firebase/config";
import { collection, deleteDoc, doc, getDocs, setDoc, writeBatch } from "firebase/firestore";

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
  cartonTotal: number;
  warpTotal: number;
  returnableTotal: number;
  ratioStandard: number;
  ratioBoxes: number;
  ratioCarton: number;
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

type ShipmentDropdownFieldKey = "customerName" | "consigneeName" | "product" | "transportMode";
const REPORTS_COLLECTION = "packaging_reports";
const REPORTS_SOURCE_CSV = "/files/packing_export_2026-02-27_23_update.csv";

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
  { key: "consigneeName", label: "Consignee Name", type: "text" },
  { key: "product", label: "Product", type: "text" },
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

const STANDARD_KEYS: PackagingBreakdownKey[] = [
  "qty110x110x115",
  "qty110x110x90",
  "qty110x110x65",
  "qty80x120x115",
  "qty80x120x90",
  "qty80x120x65",
];

const BOXES_KEYS: PackagingBreakdownKey[] = [
  "qty42x46x68",
  "qty47x66x68",
  "qty53x53x58",
  "qty57x64x84",
  "qty68x74x86",
  "qty70x100x90",
];

const CARTON_KEYS: PackagingBreakdownKey[] = ["qty27x27x22", "qty53x53x19"];

const PACKAGING_GROUPS: Array<{ title: string; keys: PackagingBreakdownKey[] }> = [
  { title: "Standard", keys: STANDARD_KEYS },
  { title: "Boxes", keys: BOXES_KEYS },
  { title: "Carton", keys: CARTON_KEYS },
  { title: "Warp / Unit", keys: ["warpQty", "unitQty"] },
  { title: "Returnable", keys: ["returnableQty"] },
];

const PACKAGING_FIELD_BY_KEY: Record<PackagingBreakdownKey, { label: string }> = PACKAGING_BREAKDOWN_FIELDS.reduce(
  (acc, field) => {
    acc[field.key] = { label: field.label };
    return acc;
  },
  {} as Record<PackagingBreakdownKey, { label: string }>
);

const BATCH_PACKAGING_KEY_MAP: Record<string, PackagingBreakdownKey> = {
  "PALLET 42X46X68": "qty42x46x68",
  "PALLET 47X66X68": "qty47x66x68",
  "PALLET 57X64X84": "qty57x64x84",
  "PALLET 68X74X86": "qty68x74x86",
  "PALLET 70X100X90": "qty70x100x90",
  "PALLET 53X53X58": "qty53x53x58",
  "CARTON 27X27X22": "qty27x27x22",
  "CARTON 53X53X19": "qty53x53x19",
  "PALLET 110X110X65": "qty110x110x65",
  "PALLET 110X110X90": "qty110x110x90",
  "PALLET 110X110X115": "qty110x110x115",
  "PALLET 80X120X65": "qty80x120x65",
  "PALLET 80X120X90": "qty80x120x90",
  "PALLET 80X120X115": "qty80x120x115",
  "WOODEN CASE 96X219X83": "warpQty",
  "RETURNABLE P110X110X110": "returnableQty",
  PALLET: "warpQty",
};

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

const convertDateToIsoInput = (value: string): string => {
  const parsed = parseDateDDMMYYYY(value);
  if (!parsed) return "";
  const y = parsed.getFullYear();
  const m = String(parsed.getMonth() + 1).padStart(2, "0");
  const d = String(parsed.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
};

const convertIsoInputToDate = (value: string): string => {
  if (!value) return "";
  const [y, m, d] = value.split("-");
  if (!y || !m || !d) return "";
  return `${d}-${m}-${y}`;
};

const formatTimelineLabel = (date: Date): string =>
  date.toLocaleDateString("th-TH", { day: "numeric", month: "short" });

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

  const headerCols = splitCsvLine(lines[0]).map((col) => col.trim().toLowerCase());
  const findColIndex = (header: string, fallback: number) => {
    const idx = headerCols.indexOf(header.toLowerCase());
    return idx >= 0 ? idx : fallback;
  };
  const readCol = (cols: string[], idx: number) => (idx >= 0 && idx < cols.length ? cols[idx] : "");

  const columnIndex = {
    date: findColIndex("Date", 0),
    customerName: findColIndex("Customer Name", 1),
    consigneeName: findColIndex("Consignee Name", 2),
    mode: findColIndex("Mode", 3),
    product: findColIndex("Product", 4),
    siQty: findColIndex("SI QTY", 5),
    qty: findColIndex("QTY", 6),
    qty110x110x115: findColIndex("110x110x115 QTY", 16),
    qty110x110x90: findColIndex("110x110x90 QTY", 17),
    qty110x110x65: findColIndex("110x110x65 QTY", 18),
    qty80x120x115: findColIndex("80X120X115 QTY", 19),
    qty80x120x90: findColIndex("80X120X90 QTY", 20),
    qty80x120x65: findColIndex("80X120X65 QTY", 21),
    qty42x46x68: findColIndex("42X46X68 QTY", 22),
    qty47x66x68: findColIndex("47X66X68 QTY", 23),
    qty53x53x58: findColIndex("53X53X58 QTY", 24),
    qty57x64x84: findColIndex("57X64X84 QTY", 25),
    qty68x74x86: findColIndex("68X74X86 QTY", 26),
    qty70x100x90: findColIndex("70X100X90 QTY", 27),
    qty27x27x22: findColIndex("27X27X22 QTY", 28),
    qty53x53x19: findColIndex("53X53X19 QTY", 29),
    warpQty: findColIndex("WARP QTY", 30),
    unitQty: findColIndex("UNIT QTY", 31),
    returnableQty: findColIndex("RETURNABLE QTY", 32),
    remark: findColIndex("Remark", 33),
  };

  return lines.slice(1).map((line, index) => {
    const cols = splitCsvLine(line);
    const customerName = readCol(cols, columnIndex.customerName).trim();
    const consigneeName = readCol(cols, columnIndex.consigneeName).trim();
    const transportMode = readCol(cols, columnIndex.mode).trim();
    const packagingBreakdown: Record<PackagingBreakdownKey, number> = {
      qty110x110x115: Number(readCol(cols, columnIndex.qty110x110x115)) || 0,
      qty110x110x90: Number(readCol(cols, columnIndex.qty110x110x90)) || 0,
      qty110x110x65: Number(readCol(cols, columnIndex.qty110x110x65)) || 0,
      qty80x120x115: Number(readCol(cols, columnIndex.qty80x120x115)) || 0,
      qty80x120x90: Number(readCol(cols, columnIndex.qty80x120x90)) || 0,
      qty80x120x65: Number(readCol(cols, columnIndex.qty80x120x65)) || 0,
      returnableQty: Number(readCol(cols, columnIndex.returnableQty)) || 0,
      qty42x46x68: Number(readCol(cols, columnIndex.qty42x46x68)) || 0,
      qty47x66x68: Number(readCol(cols, columnIndex.qty47x66x68)) || 0,
      qty53x53x58: Number(readCol(cols, columnIndex.qty53x53x58)) || 0,
      qty57x64x84: Number(readCol(cols, columnIndex.qty57x64x84)) || 0,
      qty68x74x86: Number(readCol(cols, columnIndex.qty68x74x86)) || 0,
      qty70x100x90: Number(readCol(cols, columnIndex.qty70x100x90)) || 0,
      qty27x27x22: Number(readCol(cols, columnIndex.qty27x27x22)) || 0,
      qty53x53x19: Number(readCol(cols, columnIndex.qty53x53x19)) || 0,
      warpQty: Number(readCol(cols, columnIndex.warpQty)) || 0,
      unitQty: Number(readCol(cols, columnIndex.unitQty)) || 0,
    };
    const standardTotal = STANDARD_KEYS.reduce((sum, key) => sum + packagingBreakdown[key], 0);
    const boxesTotal = BOXES_KEYS.reduce((sum, key) => sum + packagingBreakdown[key], 0);
    const cartonTotal = CARTON_KEYS.reduce((sum, key) => sum + packagingBreakdown[key], 0);
    const warpTotal = packagingBreakdown.warpQty + packagingBreakdown.unitQty;
    const returnableTotal = packagingBreakdown.returnableQty;
    const totalPackages = Object.values(packagingBreakdown).reduce((sum, qty) => sum + qty, 0);

    return {
      id: `${index + 1}`,
      date: readCol(cols, columnIndex.date),
      shipment: consigneeName || "-",
      mode: transportMode || "-",
      product: readCol(cols, columnIndex.product) || "-",
      customerName: customerName || "-",
      transportMode: transportMode || "-",
      consigneeName: consigneeName || "-",
      siQty: Number(readCol(cols, columnIndex.siQty)) || 0,
      qty: Number(readCol(cols, columnIndex.qty)) || 0,
      totalPackages,
      standardTotal,
      boxesTotal,
      cartonTotal,
      warpTotal,
      returnableTotal,
      ratioStandard: standardTotal / 1,
      ratioBoxes: boxesTotal / 3,
      ratioCarton: cartonTotal / 30,
      ratioWarp: warpTotal / 10,
      ratioReturnable: returnableTotal / 2,
      packagingBreakdown,
      remark: readCol(cols, columnIndex.remark) || "",
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

  const standardTotal = STANDARD_KEYS.reduce((sum, key) => sum + packagingBreakdown[key], 0);
  const boxesTotal = BOXES_KEYS.reduce((sum, key) => sum + packagingBreakdown[key], 0);
  const cartonTotal = CARTON_KEYS.reduce((sum, key) => sum + packagingBreakdown[key], 0);
  const returnableTotal = packagingBreakdown.returnableQty;
  const warpTotal = packagingBreakdown.warpQty + packagingBreakdown.unitQty;
  const totalPackages = Object.values(packagingBreakdown).reduce((sum, qty) => sum + qty, 0);

  return {
    packagingBreakdown,
    standardTotal,
    boxesTotal,
    cartonTotal,
    returnableTotal,
    warpTotal,
    totalPackages,
    ratioStandard: standardTotal / 1,
    ratioBoxes: boxesTotal / 3,
    ratioCarton: cartonTotal / 30,
    ratioWarp: warpTotal / 10,
    ratioReturnable: returnableTotal / 2,
  };
};

const mapRowToAddForm = (row: PackingReportRow): AddRecordForm => {
  const breakdown = row.packagingBreakdown;
  return {
    date: row.date || "",
    customerName: row.customerName || "",
    product: row.product || "",
    consigneeName: row.shipment || row.consigneeName || "",
    transportMode: row.transportMode || row.mode || "",
    siQty: String(row.siQty || ""),
    totalProductQty: String(row.qty || ""),
    qty110x110x115: String(breakdown?.qty110x110x115 ?? ""),
    qty110x110x90: String(breakdown?.qty110x110x90 ?? ""),
    qty110x110x65: String(breakdown?.qty110x110x65 ?? ""),
    qty80x120x115: String(breakdown?.qty80x120x115 ?? ""),
    qty80x120x90: String(breakdown?.qty80x120x90 ?? ""),
    qty80x120x65: String(breakdown?.qty80x120x65 ?? ""),
    returnableQty: String(breakdown?.returnableQty ?? ""),
    qty42x46x68: String(breakdown?.qty42x46x68 ?? ""),
    qty47x66x68: String(breakdown?.qty47x66x68 ?? ""),
    qty53x53x58: String(breakdown?.qty53x53x58 ?? ""),
    qty57x64x84: String(breakdown?.qty57x64x84 ?? ""),
    qty68x74x86: String(breakdown?.qty68x74x86 ?? ""),
    qty70x100x90: String(breakdown?.qty70x100x90 ?? ""),
    qty27x27x22: String(breakdown?.qty27x27x22 ?? ""),
    qty53x53x19: String(breakdown?.qty53x53x19 ?? ""),
    warpQty: String(breakdown?.warpQty ?? ""),
    unitQty: String(breakdown?.unitQty ?? ""),
    remark: row.remark || "",
  };
};

const normalizePackagingBreakdown = (
  value: unknown
): Record<PackagingBreakdownKey, number> =>
  PACKAGING_BREAKDOWN_FIELDS.reduce((acc, field) => {
    const raw =
      value && typeof value === "object"
        ? (value as Partial<Record<PackagingBreakdownKey, unknown>>)[field.key]
        : undefined;
    acc[field.key] = Number(raw) || 0;
    return acc;
  }, {} as Record<PackagingBreakdownKey, number>);

const mapAnyToPackingReportRow = (id: string, source: unknown): PackingReportRow => {
  const data = (source && typeof source === "object" ? source : {}) as Partial<PackingReportRow>;
  const packagingBreakdown = normalizePackagingBreakdown(data.packagingBreakdown);
  const standardTotal = Number(data.standardTotal) || STANDARD_KEYS.reduce((sum, key) => sum + packagingBreakdown[key], 0);
  const boxesTotal = Number(data.boxesTotal) || BOXES_KEYS.reduce((sum, key) => sum + packagingBreakdown[key], 0);
  const cartonTotal = Number(data.cartonTotal) || CARTON_KEYS.reduce((sum, key) => sum + packagingBreakdown[key], 0);
  const returnableTotal = Number(data.returnableTotal) || packagingBreakdown.returnableQty;
  const warpTotal = Number(data.warpTotal) || packagingBreakdown.warpQty + packagingBreakdown.unitQty;
  const totalPackages =
    Number(data.totalPackages) || Object.values(packagingBreakdown).reduce((sum, qty) => sum + qty, 0);

  return {
    id,
    date: data.date || "",
    shipment: data.shipment || data.consigneeName || "-",
    mode: data.mode || data.transportMode || "-",
    product: data.product || "-",
    customerName: data.customerName || "-",
    consigneeName: data.consigneeName || data.shipment || "-",
    transportMode: data.transportMode || data.mode || "-",
    siQty: Number(data.siQty) || 0,
    qty: Number(data.qty) || 0,
    totalPackages,
    standardTotal,
    boxesTotal,
    cartonTotal,
    warpTotal,
    returnableTotal,
    ratioStandard: Number(data.ratioStandard) || standardTotal / 1,
    ratioBoxes: Number(data.ratioBoxes) || boxesTotal / 3,
    ratioCarton: Number(data.ratioCarton) || cartonTotal / 30,
    ratioWarp: Number(data.ratioWarp) || warpTotal / 10,
    ratioReturnable: Number(data.ratioReturnable) || returnableTotal / 2,
    packagingBreakdown,
    remark: data.remark || "",
  };
};

const toFirestoreReportPayload = (row: PackingReportRow) => ({
  date: row.date,
  shipment: row.shipment,
  mode: row.mode,
  product: row.product,
  customerName: row.customerName || "",
  consigneeName: row.consigneeName || row.shipment || "",
  transportMode: row.transportMode || row.mode || "",
  siQty: row.siQty,
  qty: row.qty,
  totalPackages: row.totalPackages,
  standardTotal: row.standardTotal,
  boxesTotal: row.boxesTotal,
  cartonTotal: row.cartonTotal,
  warpTotal: row.warpTotal,
  returnableTotal: row.returnableTotal,
  ratioStandard: row.ratioStandard,
  ratioBoxes: row.ratioBoxes,
  ratioCarton: row.ratioCarton,
  ratioWarp: row.ratioWarp,
  ratioReturnable: row.ratioReturnable,
  packagingBreakdown: normalizePackagingBreakdown(row.packagingBreakdown),
  remark: row.remark,
});

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
  const [editingRowId, setEditingRowId] = useState<string | null>(null);
  const [isReviewingAddRecord, setIsReviewingAddRecord] = useState(false);
  const [isBatchInputOpen, setIsBatchInputOpen] = useState(false);
  const [batchInputText, setBatchInputText] = useState("");
  const [batchInputError, setBatchInputError] = useState<string | null>(null);
  const [addError, setAddError] = useState<string | null>(null);
  const [selectedRow, setSelectedRow] = useState<PackingReportRow | null>(null);
  const [pendingDeleteRow, setPendingDeleteRow] = useState<PackingReportRow | null>(null);
  const [isSuccessModalOpen, setIsSuccessModalOpen] = useState(false);
  const [successMessage, setSuccessMessage] = useState("Saved successfully");
  const [showScrollTop, setShowScrollTop] = useState(false);
  const [manualShipmentOptions, setManualShipmentOptions] = useState<Record<ShipmentDropdownFieldKey, string[]>>({
    customerName: [],
    consigneeName: [],
    product: [],
    transportMode: [],
  });
  const [addForm, setAddForm] = useState<AddRecordForm>(buildInitialAddForm());
  const filterAreaRef = useRef<HTMLDivElement | null>(null);
  const dateInputRef = useRef<HTMLInputElement | null>(null);
  const addModalContentRef = useRef<HTMLDivElement | null>(null);
  const successTimerRef = useRef<number | null>(null);

  useEffect(() => {
    const loadFromFirestore = async () => {
      setIsLoading(true);
      setError(null);
      try {
        const colRef = collection(db, REPORTS_COLLECTION);
        let snapshot = await getDocs(colRef);

        if (snapshot.empty) {
          const res = await fetch(REPORTS_SOURCE_CSV);
          if (!res.ok) throw new Error(`CSV load failed (${res.status})`);
          const csvText = await res.text();
          const initialRows = parsePackingCsv(csvText);

          const chunkSize = 450;
          for (let i = 0; i < initialRows.length; i += chunkSize) {
            const batch = writeBatch(db);
            const chunk = initialRows.slice(i, i + chunkSize);
            chunk.forEach((row) => {
              const docRef = doc(colRef);
              batch.set(docRef, toFirestoreReportPayload({ ...row, id: docRef.id }));
            });
            await batch.commit();
          }
          snapshot = await getDocs(colRef);
        }

        setRows(snapshot.docs.map((item) => mapAnyToPackingReportRow(item.id, item.data())));
      } catch (err) {
        const message = err instanceof Error ? err.message : "Unknown error";
        setError(message);
      } finally {
        setIsLoading(false);
      }
    };

    loadFromFirestore();
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

  useEffect(() => {
    if (!isAddModalOpen || !isReviewingAddRecord) return;
    window.scrollTo({ top: 0, behavior: "smooth" });
    addModalContentRef.current?.scrollIntoView({ block: "start", behavior: "smooth" });
  }, [isAddModalOpen, isReviewingAddRecord]);

  useEffect(() => {
    return () => {
      if (successTimerRef.current) window.clearTimeout(successTimerRef.current);
    };
  }, []);

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

  const shipmentDropdownOptions = useMemo(() => {
    const uniqueSorted = (values: string[]) =>
      Array.from(
        new Set(
          values
            .map((value) => value.trim())
            .filter((value) => value !== "" && value !== "-")
        )
      ).sort((a, b) => a.localeCompare(b));

    return {
      customerName: uniqueSorted([
        ...rows.map((row) => row.customerName || ""),
        ...manualShipmentOptions.customerName,
      ]),
      consigneeName: uniqueSorted([
        ...rows.map((row) => row.consigneeName || row.shipment || ""),
        ...manualShipmentOptions.consigneeName,
      ]),
      product: uniqueSorted([...rows.map((row) => row.product || ""), ...manualShipmentOptions.product]),
      transportMode: uniqueSorted([
        ...rows.map((row) => row.transportMode || row.mode || ""),
        ...manualShipmentOptions.transportMode,
      ]),
    };
  }, [rows, manualShipmentOptions]);

  const filteredRows = useMemo(() => {
    return rows
      .filter((row) => {
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
      })
      .sort((a, b) => {
        const aDate = parseDateDDMMYYYY(a.date);
        const bDate = parseDateDDMMYYYY(b.date);
        if (aDate && bDate) return aDate.getTime() - bDate.getTime();
        if (aDate && !bDate) return -1;
        if (!aDate && bDate) return 1;
        return a.date.localeCompare(b.date);
      });
  }, [rows, searchValue, selectedYear, selectedMonth, selectedShipment, selectedProduct, selectedMode]);

  const stats = useMemo(() => {
    const totalRows = filteredRows.length;
    const sumSiQty = filteredRows.reduce((sum, row) => sum + row.siQty, 0);
    const sumQty = filteredRows.reduce((sum, row) => sum + row.qty, 0);
    const sumPackages = filteredRows.reduce((sum, row) => sum + row.totalPackages, 0);
    return { totalRows, sumSiQty, sumQty, sumPackages };
  }, [filteredRows]);

  const packagingUsageTotals = useMemo(
    () =>
      filteredRows.reduce<Record<PackagingBreakdownKey, number>>((acc, row) => {
        PACKAGING_BREAKDOWN_FIELDS.forEach((field) => {
          acc[field.key] = (acc[field.key] || 0) + (row.packagingBreakdown?.[field.key] ?? 0);
        });
        return acc;
      }, {} as Record<PackagingBreakdownKey, number>),
    [filteredRows]
  );

  const timelineChart = useMemo(() => {
    const dateMap = new Map<
      string,
      { label: string; sortValue: number; productQty: number; packagesUsed: number }
    >();

    filteredRows.forEach((row) => {
      const parsed = parseDateDDMMYYYY(row.date);
      const key = parsed ? parsed.toISOString().slice(0, 10) : row.date;
      const current = dateMap.get(key);

      if (current) {
        current.productQty += row.qty;
        current.packagesUsed += row.totalPackages;
        return;
      }

      dateMap.set(key, {
        label: parsed ? formatTimelineLabel(parsed) : row.date,
        sortValue: parsed ? parsed.getTime() : Number.MAX_SAFE_INTEGER,
        productQty: row.qty,
        packagesUsed: row.totalPackages,
      });
    });

    const ordered = Array.from(dateMap.values())
      .sort((a, b) => a.sortValue - b.sortValue)
      .slice(-14);

    const width = 920;
    const height = 260;
    const padding = { top: 14, right: 16, bottom: 34, left: 40 };
    const chartWidth = width - padding.left - padding.right;
    const chartHeight = height - padding.top - padding.bottom;
    const maxY = Math.max(...ordered.flatMap((item) => [item.productQty, item.packagesUsed]), 1);
    const stepX = ordered.length > 1 ? chartWidth / (ordered.length - 1) : chartWidth;

    const toY = (value: number) => padding.top + chartHeight - (value / maxY) * chartHeight;
    const toPath = (selector: "productQty" | "packagesUsed") =>
      ordered
        .map((item, index) => {
          const x = padding.left + (ordered.length === 1 ? chartWidth / 2 : stepX * index);
          const y = toY(item[selector]);
          return `${index === 0 ? "M" : "L"}${x.toFixed(2)} ${y.toFixed(2)}`;
        })
        .join(" ");

    const yTicks = [0, 1, 2, 3, 4].map((step) => Math.round((maxY / 4) * step));

    return {
      width,
      height,
      yTicks,
      points: ordered.map((item, index) => ({
        ...item,
        x: padding.left + (ordered.length === 1 ? chartWidth / 2 : stepX * index),
      })),
      productPath: toPath("productQty"),
      packagePath: toPath("packagesUsed"),
      hasData: ordered.length > 0,
    };
  }, [filteredRows]);

  const transportModeChart = useMemo(() => {
    const modeMap = new Map<string, number>();
    filteredRows.forEach((row) => {
      const modeLabel = (row.transportMode || row.mode || "-").trim();
      if (!modeLabel || modeLabel === "-") return;
      modeMap.set(modeLabel, (modeMap.get(modeLabel) || 0) + 1);
    });

    const items = Array.from(modeMap.entries())
      .map(([label, value]) => ({ label, value }))
      .sort((a, b) => b.value - a.value)
      .slice(0, 4);

    const total = items.reduce((sum, item) => sum + item.value, 0);
    const radius = 66;
    const circumference = 2 * Math.PI * radius;
    let offset = 0;
    const colors = ["#9A7656", "#D7B894", "#E9C46A", "#CDB79E"];

    return {
      total,
      circumference,
      segments: items.map((item, index) => {
        const length = total ? (item.value / total) * circumference : 0;
        const segment = {
          ...item,
          color: colors[index % colors.length],
          dashArray: `${length} ${circumference - length}`,
          dashOffset: -offset,
        };
        offset += length;
        return segment;
      }),
    };
  }, [filteredRows]);

  const topCustomersChart = useMemo(() => {
    const shipmentMap = new Map<string, number>();
    filteredRows.forEach((row) => {
      const label = (row.shipment || row.consigneeName || "-").trim();
      if (!label || label === "-") return;
      shipmentMap.set(label, (shipmentMap.get(label) || 0) + 1);
    });

    const items = Array.from(shipmentMap.entries())
      .map(([label, value]) => ({ label, value }))
      .sort((a, b) => b.value - a.value)
      .slice(0, 5);
    const maxValue = Math.max(...items.map((item) => item.value), 1);
    const colors = ["#9A7656", "#D7B894", "#E9C46A", "#CDB79E", "#B98E63"];

    return items.map((item, index) => ({
      ...item,
      widthPct: (item.value / maxValue) * 100,
      color: colors[index % colors.length],
    }));
  }, [filteredRows]);

  const packageTypeUsage = useMemo(() => {
    const toItems = (keys: PackagingBreakdownKey[]) =>
      keys
        .map((key) => ({
          label: PACKAGING_FIELD_BY_KEY[key].label.replace(" QTY", ""),
          value: packagingUsageTotals[key] || 0,
        }))
        .sort((a, b) => b.value - a.value)
        .filter((item) => item.value > 0);

    const standardItems = toItems(STANDARD_KEYS);
    const boxesItems = toItems(BOXES_KEYS);

    const standardTotal = standardItems.reduce((sum, item) => sum + item.value, 0);
    const boxesTotal = boxesItems.reduce((sum, item) => sum + item.value, 0);
    const returnableTotal = packagingUsageTotals.returnableQty || 0;
    const warpTotal = (packagingUsageTotals.warpQty || 0) + (packagingUsageTotals.unitQty || 0);

    return {
      standard: { total: standardTotal, items: standardItems.slice(0, 5), max: Math.max(standardTotal, 1) },
      boxes: { total: boxesTotal, items: boxesItems.slice(0, 5), max: Math.max(boxesTotal, 1) },
      returnable: { total: returnableTotal },
      warp: { total: warpTotal },
    };
  }, [packagingUsageTotals]);

  const ratioAnalysis = useMemo(() => {
    const cards = [
      {
        title: "STANDARD PACKAGE",
        capacity: packageTypeUsage.standard.total / 1,
        packagesUsed: packageTypeUsage.standard.total,
      },
      {
        title: "BOXES PACKAGE",
        capacity: packageTypeUsage.boxes.total / 3,
        packagesUsed: packageTypeUsage.boxes.total,
      },
      {
        title: "RETURNABLE PACKAGE",
        capacity: packageTypeUsage.returnable.total / 2,
        packagesUsed: packageTypeUsage.returnable.total,
      },
      {
        title: "WARP PACKAGE",
        capacity: packageTypeUsage.warp.total / 10,
        packagesUsed: packageTypeUsage.warp.total,
      },
    ];

    const maxUsed = Math.max(...cards.map((card) => card.packagesUsed), 1);
    return cards.map((card) => ({
      ...card,
      barWidth: (card.packagesUsed / maxUsed) * 100,
    }));
  }, [packageTypeUsage]);

  const claySurfaceClass =
    "bg-[#F0F4F8] border border-[#E7EDF5] shadow-[8px_8px_18px_rgba(166,180,200,0.35),-8px_-8px_18px_rgba(255,255,255,0.9)]";
  const clayChartCardClass = `p-5 ${claySurfaceClass}`;
  const clayBadgeCardClass = `group p-5 ${claySurfaceClass} transition-all duration-300 hover:-translate-y-1 hover:shadow-xl`;
  const clayChartInnerCardClass =
    "rounded-2xl border border-[#E7EDF5] bg-[#E8ECF1] p-3 shadow-[6px_6px_12px_rgba(166,180,200,0.28),-6px_-6px_12px_rgba(255,255,255,0.85)]";
  const clayChartMiniCardClass =
    "rounded-2xl border border-[#E7EDF5] bg-[#E8ECF1] p-4 space-y-2 shadow-[6px_6px_12px_rgba(166,180,200,0.28),-6px_-6px_12px_rgba(255,255,255,0.85)]";

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
      "Carton Total",
      "Warp Total",
      "Returnable Total",
      "Ratio Standard",
      "Ratio Boxes",
      "Ratio Carton",
      "Ratio Warp",
      "Ratio Returnable",
      "Remark",
      ...PACKAGING_BREAKDOWN_FIELDS.map((field) => field.label),
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
          row.cartonTotal,
          row.warpTotal,
          row.returnableTotal,
          row.ratioStandard.toFixed(2),
          row.ratioBoxes.toFixed(2),
          row.ratioCarton.toFixed(2),
          row.ratioWarp.toFixed(2),
          row.ratioReturnable.toFixed(2),
          row.remark,
          ...PACKAGING_BREAKDOWN_FIELDS.map(
            (field) => row.packagingBreakdown?.[field.key] ?? 0
          ),
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
    const yyyy = String(now.getFullYear());
    const MM = String(now.getMonth() + 1).padStart(2, "0");
    const dd = String(now.getDate()).padStart(2, "0");
    const HH = String(now.getHours()).padStart(2, "0");
    const mm = String(now.getMinutes()).padStart(2, "0");
    const ss = String(now.getSeconds()).padStart(2, "0");
    link.download = `packaging_report_${yyyy}${MM}${dd}${HH}${mm}${ss}.csv`;

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
    setEditingRowId(null);
    setIsReviewingAddRecord(false);
    setIsBatchInputOpen(false);
    setBatchInputText("");
    setBatchInputError(null);
    setAddError(null);
    setIsAddModalOpen(true);
  };

  const closeAddModal = () => {
    setIsAddModalOpen(false);
    setEditingRowId(null);
    setIsReviewingAddRecord(false);
    setIsBatchInputOpen(false);
    setBatchInputText("");
    setBatchInputError(null);
    setAddError(null);
  };

  const addShipmentDropdownOption = (fieldKey: ShipmentDropdownFieldKey, label: string) => {
    const inputValue = window.prompt(`Add ${label}`, "");
    const nextValue = inputValue?.trim() || "";
    if (!nextValue) return;

    setManualShipmentOptions((prev) => {
      if (prev[fieldKey].includes(nextValue)) return prev;
      return { ...prev, [fieldKey]: [...prev[fieldKey], nextValue] };
    });
    setAddForm((prev) => ({ ...prev, [fieldKey]: nextValue }));
  };

  const openSuccessModal = (message: string) => {
    if (successTimerRef.current) window.clearTimeout(successTimerRef.current);
    setSuccessMessage(message);
    setIsSuccessModalOpen(true);
    successTimerRef.current = window.setTimeout(() => setIsSuccessModalOpen(false), 1300);
  };

  const applyBatchPackagingInput = () => {
    const lines = batchInputText
      .split(/\r?\n/)
      .map((line) => line.trim())
      .filter(Boolean);

    if (lines.length === 0) {
      setBatchInputError("กรุณาวางข้อมูลก่อนกด Apply");
      return;
    }

    const nextValues = PACKAGING_BREAKDOWN_FIELDS.reduce<Record<PackagingBreakdownKey, number>>((acc, field) => {
      acc[field.key] = 0;
      return acc;
    }, {} as Record<PackagingBreakdownKey, number>);

    let matchedLines = 0;

    lines.forEach((line) => {
      const parsed = line.match(/^(.*?)[\t ]+(-?\d+(?:\.\d+)?)$/);
      if (!parsed) return;

      const rawKey = parsed[1].trim().replace(/\s+/g, " ").toUpperCase();
      const qty = Number(parsed[2]);
      if (!Number.isFinite(qty)) return;

      const mappedKey = BATCH_PACKAGING_KEY_MAP[rawKey];
      if (!mappedKey) return;

      matchedLines += 1;
      nextValues[mappedKey] += qty;
    });

    if (matchedLines === 0) {
      setBatchInputError("ไม่พบข้อมูลที่ map ได้ กรุณาตรวจรูปแบบชื่อและตัวเลข");
      return;
    }

    setAddForm((prev) => ({
      ...prev,
      ...Object.fromEntries(
        PACKAGING_BREAKDOWN_FIELDS.map((field) => [field.key, String(nextValues[field.key])])
      ),
    }));
    setBatchInputError(null);
    setIsBatchInputOpen(false);
    openSuccessModal("Applied batch data");
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

  const handleSaveRecord = async () => {
    if (!validateAddRecord()) return;

    const {
      packagingBreakdown,
      standardTotal,
      boxesTotal,
      cartonTotal,
      warpTotal,
      returnableTotal,
      totalPackages,
      ratioStandard,
      ratioBoxes,
      ratioCarton,
      ratioWarp,
      ratioReturnable,
    } = calculatePackagingTotals(addForm);

    const customerName = addForm.customerName.trim();
    const consigneeName = addForm.consigneeName.trim();
    const transportMode = addForm.transportMode.trim();

    const targetRowId = editingRowId || doc(collection(db, REPORTS_COLLECTION)).id;
    const newRow: PackingReportRow = {
      id: targetRowId,
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
      cartonTotal,
      warpTotal,
      returnableTotal,
      ratioStandard,
      ratioBoxes,
      ratioCarton,
      ratioWarp,
      ratioReturnable,
      packagingBreakdown,
      remark: addForm.remark.trim(),
    };

    try {
      await setDoc(doc(db, REPORTS_COLLECTION, targetRowId), toFirestoreReportPayload(newRow));
      setRows((prev) =>
        editingRowId ? prev.map((row) => (row.id === editingRowId ? newRow : row)) : [newRow, ...prev]
      );
      openSuccessModal(editingRowId ? "Record updated" : "Record saved");
      closeAddModal();
    } catch (err) {
      const message = err instanceof Error ? err.message : "Save failed";
      setAddError(`บันทึกข้อมูลไม่สำเร็จ: ${message}`);
    }
  };

  const openEditModalFromDetail = () => {
    if (!selectedRow) return;
    setEditingRowId(selectedRow.id);
    setAddForm(mapRowToAddForm(selectedRow));
    setIsReviewingAddRecord(false);
    setIsBatchInputOpen(false);
    setBatchInputText("");
    setBatchInputError(null);
    setAddError(null);
    setIsAddModalOpen(true);
    setSelectedRow(null);
  };

  const handleDeleteRecord = async () => {
    if (!pendingDeleteRow) return;
    try {
      await deleteDoc(doc(db, REPORTS_COLLECTION, pendingDeleteRow.id));
      setRows((prev) => prev.filter((row) => row.id !== pendingDeleteRow.id));
      setPendingDeleteRow(null);
      setSelectedRow(null);
      openSuccessModal("Record deleted");
    } catch (err) {
      const message = err instanceof Error ? err.message : "Delete failed";
      setAddError(`ลบข้อมูลไม่สำเร็จ: ${message}`);
    }
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
            description="Realtime packaging records with shipment details, package breakdown, and export-ready reporting."
            backHref="/projects/packaging"
            backLabel="Packaging Console"
            backLinkVariant="packaging"
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
                <GlassCard className={clayBadgeCardClass}>
                  <div className="flex items-center justify-between gap-3">
                    <div>
                      <p className="text-xs font-black uppercase tracking-wider text-[#7E5C4A]/75">Records</p>
                      <p className="text-3xl font-black text-[#272727] mt-1">
                        <CountingNumber value={stats.totalRows} />
                      </p>
                    </div>
                    <span className="inline-flex h-12 w-12 items-center justify-center rounded-xl border border-[#D4AA7D]/35 bg-white/80 text-[#7E5C4A] transition-colors duration-200 group-hover:bg-[#272727] group-hover:border-[#272727] group-hover:text-[#EFD09E]">
                      <Database className="h-6 w-6" />
                    </span>
                  </div>
                </GlassCard>
                <GlassCard className={clayBadgeCardClass}>
                  <div className="flex items-center justify-between gap-3">
                    <div>
                      <p className="text-xs font-black uppercase tracking-wider text-[#7E5C4A]/75">SI QTY</p>
                      <p className="text-3xl font-black text-[#272727] mt-1">
                        <CountingNumber value={stats.sumSiQty} />
                      </p>
                    </div>
                    <span className="inline-flex h-12 w-12 items-center justify-center rounded-xl border border-[#D4AA7D]/35 bg-white/80 text-[#7E5C4A] transition-colors duration-200 group-hover:bg-[#272727] group-hover:border-[#272727] group-hover:text-[#EFD09E]">
                      <Hash className="h-6 w-6" />
                    </span>
                  </div>
                </GlassCard>
                <GlassCard className={clayBadgeCardClass}>
                  <div className="flex items-center justify-between gap-3">
                    <div>
                      <p className="text-xs font-black uppercase tracking-wider text-[#7E5C4A]/75">QTY</p>
                      <p className="text-3xl font-black text-[#272727] mt-1">
                        <CountingNumber value={stats.sumQty} />
                      </p>
                    </div>
                    <span className="inline-flex h-12 w-12 items-center justify-center rounded-xl border border-[#D4AA7D]/35 bg-white/80 text-[#7E5C4A] transition-colors duration-200 group-hover:bg-[#272727] group-hover:border-[#272727] group-hover:text-[#EFD09E]">
                      <Boxes className="h-6 w-6" />
                    </span>
                  </div>
                </GlassCard>
                <GlassCard className={clayBadgeCardClass}>
                  <div className="flex items-center justify-between gap-3">
                    <div>
                      <p className="text-xs font-black uppercase tracking-wider text-[#7E5C4A]/75">Total Packages</p>
                      <p className="text-3xl font-black text-[#5a7a1a] mt-1">
                        <CountingNumber value={stats.sumPackages} />
                      </p>
                    </div>
                    <span className="inline-flex h-12 w-12 items-center justify-center rounded-xl border border-[#D4AA7D]/35 bg-white/80 text-[#7E5C4A] transition-colors duration-200 group-hover:bg-[#272727] group-hover:border-[#272727] group-hover:text-[#EFD09E]">
                      <Package className="h-6 w-6" />
                    </span>
                  </div>
                </GlassCard>
              </div>

              <div className="space-y-4">
                <div className="grid grid-cols-1 xl:grid-cols-[2fr_1fr] gap-4">
                  <GlassCard className={clayChartCardClass}>
                    <div className="flex items-center gap-2 mb-3">
                      <Database className="w-4 h-4 text-[#5D6D7E]" />
                      <h3 className="text-lg font-black text-[#34495E] tracking-tight">Packing Volume Timeline</h3>
                    </div>
                    {timelineChart.hasData ? (
                      <div className="overflow-x-auto">
                        <svg
                          viewBox={`0 0 ${timelineChart.width} ${timelineChart.height}`}
                          className="w-full min-w-[660px] h-[250px]"
                        >
                          {timelineChart.yTicks.map((tick) => {
                            const y = 14 + (212 - (tick / Math.max(...timelineChart.yTicks, 1)) * 212);
                            return (
                              <g key={tick}>
                                <line x1="40" x2="904" y1={y} y2={y} stroke="#D6DEE8" strokeDasharray="4 6" />
                                <text x="12" y={y + 4} fontSize="11" fill="#8C9AAA">
                                  {tick}
                                </text>
                              </g>
                            );
                          })}
                          <path d={timelineChart.packagePath} fill="none" stroke="#9A7656" strokeWidth="3" />
                          <path d={timelineChart.productPath} fill="none" stroke="#E9C46A" strokeWidth="3" />
                          {timelineChart.points.map((point) => (
                            <text
                              key={point.x}
                              x={point.x}
                              y={246}
                              textAnchor="middle"
                              fontSize="10"
                              fill="#8C9AAA"
                            >
                              {point.label}
                            </text>
                          ))}
                        </svg>
                      </div>
                    ) : (
                      <p className="text-sm text-[#5D6D7E]/70 py-6">No timeline data</p>
                    )}
                    <div className="flex flex-wrap items-center gap-4 text-sm font-bold pt-1">
                      <span className="inline-flex items-center gap-1.5 text-[#5D6D7E]">
                        <span className="h-2.5 w-2.5 rounded-full bg-[#9A7656]" />
                        Packages Used
                      </span>
                      <span className="inline-flex items-center gap-1.5 text-[#5D6D7E]">
                        <span className="h-2.5 w-2.5 rounded-full bg-[#E9C46A]" />
                        Products (QTY)
                      </span>
                    </div>
                  </GlassCard>

                  <GlassCard className={clayChartCardClass}>
                    <div className="flex items-center gap-2 mb-3">
                      <Package className="w-4 h-4 text-[#5D6D7E]" />
                      <h3 className="text-lg font-black text-[#34495E] tracking-tight">Transport Mode</h3>
                    </div>
                    <div className="flex items-center justify-center py-2">
                      <svg viewBox="0 0 180 180" className="w-[210px] h-[210px]">
                        <circle cx="90" cy="90" r="66" fill="none" stroke="#EEE2D2" strokeWidth="20" />
                        {transportModeChart.segments.map((segment) => (
                          <circle
                            key={segment.label}
                            cx="90"
                            cy="90"
                            r="66"
                            fill="none"
                            stroke={segment.color}
                            strokeWidth="20"
                            strokeDasharray={segment.dashArray}
                            strokeDashoffset={segment.dashOffset}
                            strokeLinecap="round"
                            transform="rotate(-90 90 90)"
                          />
                        ))}
                        <text x="90" y="88" textAnchor="middle" className="fill-[#34495E]" fontSize="26" fontWeight="700">
                          {transportModeChart.total}
                        </text>
                        <text x="90" y="106" textAnchor="middle" className="fill-[#8C9AAA]" fontSize="10" fontWeight="600">
                          records
                        </text>
                      </svg>
                    </div>
                    <div className="flex flex-wrap items-center justify-center gap-x-3 gap-y-1 text-sm font-bold">
                      {transportModeChart.segments.map((segment) => (
                        <span key={segment.label} className="inline-flex items-center gap-1.5 text-[#5D6D7E]">
                          <span className="h-2.5 w-2.5 rounded-[2px]" style={{ backgroundColor: segment.color }} />
                          {segment.label}
                        </span>
                      ))}
                    </div>
                  </GlassCard>
                </div>

                <div className="grid grid-cols-1 xl:grid-cols-[1fr_2fr] gap-4">
                  <GlassCard className={clayChartCardClass}>
                    <div className="flex items-center gap-2 mb-4">
                      <Boxes className="w-4 h-4 text-[#5D6D7E]" />
                      <h3 className="text-lg font-black text-[#34495E] tracking-tight">Top Customers</h3>
                    </div>
                    <div className="space-y-4">
                      {topCustomersChart.length > 0 ? (
                        topCustomersChart.map((customer) => (
                          <div key={customer.label} className="space-y-1.5">
                            <div className="flex items-center justify-between gap-2 text-xs font-bold text-[#5D6D7E]">
                              <span>{customer.label}</span>
                              <span>{customer.value.toLocaleString()}</span>
                            </div>
                            <div className="h-3 rounded-full bg-[#EFF3F8] border border-[#D6DEE8] overflow-hidden">
                              <div
                                className="h-full rounded-full transition-all duration-500"
                                style={{ width: `${Math.max(customer.widthPct, 8)}%`, backgroundColor: customer.color }}
                              />
                            </div>
                          </div>
                        ))
                      ) : (
                        <p className="text-sm text-[#5D6D7E]/70">No customer data</p>
                      )}
                    </div>
                  </GlassCard>

                  <GlassCard className={clayChartCardClass}>
                    <div className="flex items-center gap-2 mb-4">
                      <Package className="w-4 h-4 text-[#5D6D7E]" />
                      <h3 className="text-lg font-black text-[#34495E] tracking-tight">Package Type Usage</h3>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      <div className={clayChartInnerCardClass}>
                        <div className="flex items-center justify-between mb-2">
                          <p className="text-sm font-black text-[#34495E]">STANDARD PACKAGE</p>
                          <span className="text-xs font-black text-[#5D6D7E]">Total: {packageTypeUsage.standard.total.toLocaleString()}</span>
                        </div>
                        <div className="space-y-2">
                          {packageTypeUsage.standard.items.map((item) => (
                            <div key={item.label} className="grid grid-cols-[1fr_auto] items-center gap-2">
                              <p className="text-xs font-semibold text-[#5D6D7E]">{item.label}</p>
                              <p className="text-xs font-black text-[#34495E]">{item.value.toLocaleString()}</p>
                              <div className="col-span-2 h-2 rounded-full bg-[#DFE6EE] overflow-hidden">
                                <div className="h-full rounded-full bg-[#9A7656]" style={{ width: `${(item.value / packageTypeUsage.standard.max) * 100}%` }} />
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>

                      <div className={clayChartInnerCardClass}>
                        <div className="flex items-center justify-between mb-2">
                          <p className="text-sm font-black text-[#34495E]">BOXES PACKAGE</p>
                          <span className="text-xs font-black text-[#5D6D7E]">Total: {packageTypeUsage.boxes.total.toLocaleString()}</span>
                        </div>
                        <div className="space-y-2">
                          {packageTypeUsage.boxes.items.map((item) => (
                            <div key={item.label} className="grid grid-cols-[1fr_auto] items-center gap-2">
                              <p className="text-xs font-semibold text-[#5D6D7E]">{item.label}</p>
                              <p className="text-xs font-black text-[#34495E]">{item.value.toLocaleString()}</p>
                              <div className="col-span-2 h-2 rounded-full bg-[#DFE6EE] overflow-hidden">
                                <div className="h-full rounded-full bg-[#D7B894]" style={{ width: `${(item.value / packageTypeUsage.boxes.max) * 100}%` }} />
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>

                      <div className={clayChartInnerCardClass}>
                        <div className="flex items-center justify-between">
                          <p className="text-sm font-black text-[#34495E]">RETURNABLE PACKAGE</p>
                          <span className="text-xs font-black text-[#5D6D7E]">Total: {packageTypeUsage.returnable.total.toLocaleString()}</span>
                        </div>
                        <div className="mt-3 h-2 rounded-full bg-[#DFE6EE] overflow-hidden">
                          <div className="h-full rounded-full bg-[#E9C46A]" style={{ width: `${Math.min(packageTypeUsage.returnable.total, 100)}%` }} />
                        </div>
                      </div>

                      <div className={clayChartInnerCardClass}>
                        <div className="flex items-center justify-between">
                          <p className="text-sm font-black text-[#34495E]">WARP PACKAGE</p>
                          <span className="text-xs font-black text-[#5D6D7E]">Total: {packageTypeUsage.warp.total.toLocaleString()}</span>
                        </div>
                        <div className="mt-3 h-2 rounded-full bg-[#DFE6EE] overflow-hidden">
                          <div className="h-full rounded-full bg-[#CDB79E]" style={{ width: `${Math.min(packageTypeUsage.warp.total, 100)}%` }} />
                        </div>
                      </div>
                    </div>
                  </GlassCard>
                </div>

                <GlassCard className={clayChartCardClass}>
                  <div className="flex items-center gap-2 mb-4">
                    <Hash className="w-4 h-4 text-[#5D6D7E]" />
                    <h3 className="text-lg font-black text-[#34495E] tracking-tight">Ratio Analysis (Product Capacity)</h3>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-3">
                    {ratioAnalysis.map((card) => (
                      <div key={card.title} className={clayChartMiniCardClass}>
                        <p className="text-xs font-black text-[#5D6D7E]">{card.title}</p>
                        <p className="text-3xl font-black text-[#34495E] leading-none">
                          {card.capacity.toLocaleString(undefined, { maximumFractionDigits: 1 })}
                          <span className="text-sm font-bold text-[#8C9AAA] ml-1">units capacity</span>
                        </p>
                        <div className="flex items-center justify-between text-xs font-semibold text-[#5D6D7E]">
                          <span>Packages Used</span>
                          <span>{card.packagesUsed.toLocaleString()}</span>
                        </div>
                        <div className="h-2 rounded-full bg-[#DFE6EE] overflow-hidden">
                          <div className="h-full rounded-full bg-[#E9C46A]" style={{ width: `${Math.max(card.barWidth, 10)}%` }} />
                        </div>
                        <p className="text-[11px] italic text-[#8C9AAA]">Based on defined package ratios</p>
                      </div>
                    ))}
                  </div>
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
        title={editingRowId ? "Edit Packing Record" : "Add Packing Record"}
        className="max-w-5xl"
      >
        <div ref={addModalContentRef} className="space-y-4">
          {addError && (
            <div className="rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm font-medium text-rose-700">
              {addError}
            </div>
          )}

          {!isReviewingAddRecord ? (
            <>
              <div className="grid grid-cols-1 lg:grid-cols-[40%_60%] gap-4">
                <div className="rounded-2xl border border-[#D4AA7D]/35 bg-white/55 p-4 space-y-3">
                  <div className="pb-1 border-b border-[#D4AA7D]/30 flex items-center justify-between gap-2">
                    <p className="text-xs font-black uppercase tracking-wider text-[#7E5C4A]">
                      Shipment Details
                    </p>
                    <span className="px-2.5 py-1 text-[11px] font-bold invisible select-none">Batch Paste</span>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {SHIPMENT_DETAIL_FIELDS.map((field) => (
                      (() => {
                        const unitSuffix =
                          field.key === "siQty" ? "Si." : field.key === "totalProductQty" ? "Pcs." : null;
                        const dropdownFieldKey =
                          field.key === "customerName" ||
                          field.key === "consigneeName" ||
                          field.key === "product" ||
                          field.key === "transportMode"
                            ? (field.key as ShipmentDropdownFieldKey)
                            : null;
                        const dropdownOptions =
                          dropdownFieldKey
                            ? Array.from(
                                new Set(
                                  [
                                    ...shipmentDropdownOptions[dropdownFieldKey],
                                    (addForm[dropdownFieldKey] as string).trim(),
                                  ].filter(Boolean)
                                )
                              ).sort((a, b) => a.localeCompare(b))
                            : [];

                        return (
                          <div
                            key={field.key}
                            className={
                              field.key === "siQty" ||
                              field.key === "totalProductQty"
                                ? ""
                                : "md:col-span-2"
                            }
                          >
                            <label className="block text-[11px] font-bold text-[#7E5C4A] mb-1">
                              {field.label}
                              {field.key === "date" ? " (DD-MM-YYYY)" : ""}
                            </label>
                            {field.key === "date" ? (
                              <div className="relative">
                                <button
                                  type="button"
                                  onClick={() => {
                                    const target = dateInputRef.current as
                                      | (HTMLInputElement & { showPicker?: () => void })
                                      | null;
                                    target?.showPicker?.();
                                    target?.focus();
                                  }}
                                  className="w-full px-3 py-2 text-left rounded-lg border border-[#D4AA7D]/35 bg-white/85 text-sm text-[#272727] outline-none focus:ring-2 focus:ring-[#D4AA7D]/35"
                                >
                                  {addForm.date || "Select date"}
                                </button>
                                <input
                                  ref={dateInputRef}
                                  type="date"
                                  value={convertDateToIsoInput(addForm.date)}
                                  onChange={(event) =>
                                    setAddForm((prev) => ({
                                      ...prev,
                                      date: convertIsoInputToDate(event.target.value),
                                    }))
                                  }
                                  className="absolute inset-0 opacity-0 cursor-pointer"
                                />
                              </div>
                            ) : dropdownFieldKey ? (
                              <div className="flex items-center gap-2">
                                <select
                                  value={addForm[dropdownFieldKey]}
                                  onChange={(event) =>
                                    setAddForm((prev) => ({ ...prev, [dropdownFieldKey]: event.target.value }))
                                  }
                                  className="flex-1 px-3 py-2 rounded-lg border border-[#D4AA7D]/35 bg-white/85 text-sm text-[#272727] outline-none focus:ring-2 focus:ring-[#D4AA7D]/35"
                                >
                                  <option value="">Select {field.label}</option>
                                  {dropdownOptions.map((option) => (
                                    <option key={option} value={option}>
                                      {option}
                                    </option>
                                  ))}
                                </select>
                                <button
                                  type="button"
                                  onClick={() => addShipmentDropdownOption(dropdownFieldKey, field.label)}
                                  className="w-8 h-8 rounded-md border border-[#D4AA7D]/40 bg-[#EFD09E]/45 text-[#7E5C4A] text-base font-black leading-none hover:bg-[#272727] hover:text-[#EFD09E] hover:border-[#272727] transition-colors"
                                  aria-label={`Add ${field.label}`}
                                  title={`Add ${field.label}`}
                                >
                                  +
                                </button>
                              </div>
                            ) : unitSuffix ? (
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
                  <div className="pb-1 border-b border-[#D4AA7D]/30 flex items-center justify-between gap-2">
                    <p className="text-xs font-black uppercase tracking-wider text-[#7E5C4A]">
                      Packaging Breakdown
                    </p>
                    <button
                      onClick={() => {
                        setIsBatchInputOpen((prev) => !prev);
                        setBatchInputError(null);
                      }}
                      className="px-2.5 py-1 rounded-md border border-[#D4AA7D]/45 bg-[#EFD09E]/55 text-[11px] font-bold text-[#7E5C4A] hover:bg-[#272727] hover:text-[#EFD09E] hover:border-[#272727] transition-all"
                    >
                      Batch Paste
                    </button>
                  </div>
                  {isBatchInputOpen && (
                    <div className="space-y-2 rounded-xl border border-[#D4AA7D]/35 bg-white/80 p-3">
                      <p className="text-[11px] font-semibold text-[#7E5C4A]">
                        Paste from Excel (Label + QTY) แล้วกด Apply
                      </p>
                      <textarea
                        value={batchInputText}
                        onChange={(event) => setBatchInputText(event.target.value)}
                        rows={6}
                        placeholder={`PALLET\t2\nPALLET 110x110x115\t6\nPALLET 110x110x90\t20`}
                        className="w-full px-3 py-2 rounded-lg border border-[#D4AA7D]/35 bg-white text-xs text-[#272727] outline-none focus:ring-2 focus:ring-[#D4AA7D]/35 resize-y"
                      />
                      {batchInputError && (
                        <p className="text-[11px] font-semibold text-rose-700">{batchInputError}</p>
                      )}
                      <div className="flex justify-end gap-2">
                        <button
                          onClick={() => {
                            setBatchInputText("");
                            setBatchInputError(null);
                          }}
                          className="px-3 py-1.5 rounded-md border border-[#D4AA7D]/35 text-[#7E5C4A] text-xs font-semibold hover:bg-white transition-colors"
                        >
                          Clear
                        </button>
                        <button
                          onClick={applyBatchPackagingInput}
                          className="px-3 py-1.5 rounded-md bg-[#272727] text-[#EFD09E] text-xs font-semibold hover:bg-[#1f1f1f] transition-colors"
                        >
                          Apply to Fields
                        </button>
                      </div>
                    </div>
                  )}
                  <div className="space-y-3">
                    {PACKAGING_GROUPS.map((group) => (
                      <div key={group.title} className="rounded-xl border border-[#D4AA7D]/30 bg-white/55 p-3">
                        <p className="text-[11px] font-black uppercase tracking-wide text-[#7E5C4A] mb-2">
                          {group.title}
                        </p>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                          {group.keys.map((key) => (
                            <div key={key}>
                              <label className="block text-[11px] font-bold text-[#7E5C4A] mb-1">
                                {PACKAGING_FIELD_BY_KEY[key].label}
                              </label>
                              <div className="relative">
                                <input
                                  type="number"
                                  step="1"
                                  min="0"
                                  value={addForm[key]}
                                  onChange={(event) =>
                                    setAddForm((prev) => ({ ...prev, [key]: event.target.value }))
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
                  <div className="rounded-xl border border-[#D4AA7D]/25 bg-white/80 px-3 py-2 space-y-1 max-h-[460px] overflow-auto">
                    {PACKAGING_GROUPS.flatMap((group) => group.keys)
                      .filter((key) => reviewTotals.packagingBreakdown[key] > 0)
                      .map((key) => (
                        <div key={key} className="flex items-center justify-between gap-2 py-1 border-b border-[#D4AA7D]/15 last:border-b-0">
                          <span className="text-xs font-semibold text-[#7E5C4A]">{PACKAGING_FIELD_BY_KEY[key].label}</span>
                          <span className="text-sm font-bold text-[#272727] tabular-nums">
                            {reviewTotals.packagingBreakdown[key].toLocaleString()} Pkg.
                          </span>
                        </div>
                      ))}
                    <div className="pt-2 mt-2 border-t border-[#D4AA7D]/25">
                      <p className="text-[10px] font-black uppercase tracking-wide text-[#272727] mb-1.5">
                        Group Totals
                      </p>
                    </div>
                    {[
                      { label: "Standard Total", value: reviewTotals.standardTotal },
                      { label: "Boxes Total", value: reviewTotals.boxesTotal },
                      { label: "Carton Total", value: reviewTotals.cartonTotal },
                      { label: "Warp Total", value: reviewTotals.warpTotal },
                      { label: "Returnable Total", value: reviewTotals.returnableTotal },
                      { label: "Total Packages", value: reviewTotals.totalPackages },
                    ]
                      .filter((item) => item.value > 0)
                      .map((item) => (
                      <div key={item.label} className="flex items-center justify-between gap-2 py-1 border-b border-[#D4AA7D]/15 last:border-b-0">
                        <span className="text-xs font-black uppercase tracking-wide text-[#7E5C4A]">{item.label}</span>
                        <span className="text-sm font-black text-[#272727] tabular-nums">{item.value.toLocaleString()}</span>
                      </div>
                    ))}
                    {reviewTotals.totalPackages === 0 && (
                      <p className="text-xs font-medium text-[#7E5C4A]/70 py-1">No package quantity.</p>
                    )}
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
          <div className="space-y-3">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div className="rounded-xl border border-[#D4AA7D]/35 bg-white/75 px-3 py-2">
                <p className="text-[10px] font-black uppercase tracking-wide text-[#7E5C4A]/80 mb-2">Shipment Summary</p>
                {[
                  { label: "Date", value: selectedRow.date },
                  { label: "Customer", value: selectedRow.customerName || "-" },
                  { label: "Consignee", value: selectedRow.shipment || "-" },
                  { label: "Product", value: selectedRow.product || "-" },
                  { label: "Transport", value: selectedRow.transportMode || selectedRow.mode || "-" },
                ].map((field) => (
                  <div key={field.label} className="flex items-center justify-between gap-2 py-1 border-b border-[#D4AA7D]/15 last:border-b-0">
                    <span className="text-xs font-semibold text-[#7E5C4A]">{field.label}</span>
                    <span className="text-sm font-semibold text-[#272727]">{field.value}</span>
                  </div>
                ))}
              </div>

              <div className="rounded-xl border border-[#D4AA7D]/35 bg-white/75 px-3 py-2">
                <p className="text-[10px] font-black uppercase tracking-wide text-[#7E5C4A]/80 mb-2">Totals Snapshot</p>
                {[
                  { label: "SI QTY", value: selectedRow.siQty },
                  { label: "Total Product QTY", value: selectedRow.qty },
                  { label: "Total Packages", value: selectedRow.totalPackages },
                  { label: "Standard", value: selectedRow.standardTotal },
                  { label: "Boxes", value: selectedRow.boxesTotal },
                  { label: "Carton", value: selectedRow.cartonTotal },
                  { label: "Warp", value: selectedRow.warpTotal },
                  { label: "Returnable", value: selectedRow.returnableTotal },
                ].map((field) => (
                  <div key={field.label} className="flex items-center justify-between gap-2 py-1 border-b border-[#D4AA7D]/15 last:border-b-0">
                    <span className="text-xs font-semibold text-[#7E5C4A]">{field.label}</span>
                    <span className="text-sm font-bold text-[#272727] tabular-nums">{field.value.toLocaleString()}</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="rounded-xl border border-[#D4AA7D]/35 bg-white/75 px-3 py-2">
              <p className="text-[10px] font-black uppercase tracking-wide text-[#7E5C4A]/80 mb-2">Ratios</p>
              <div className="grid grid-cols-2 md:grid-cols-5 gap-2">
                {[
                  { label: "Standard", value: selectedRow.ratioStandard },
                  { label: "Boxes", value: selectedRow.ratioBoxes },
                  { label: "Carton", value: selectedRow.ratioCarton },
                  { label: "Warp", value: selectedRow.ratioWarp },
                  { label: "Returnable", value: selectedRow.ratioReturnable },
                ].map((ratio) => (
                  <div key={ratio.label} className="rounded-lg border border-[#D4AA7D]/25 bg-white/85 px-2.5 py-2 text-center">
                    <p className="text-[10px] font-black uppercase tracking-wide text-[#7E5C4A]/80">{ratio.label}</p>
                    <p className="text-sm font-bold text-[#272727] mt-1 tabular-nums">{ratio.value.toFixed(2)}</p>
                  </div>
                ))}
              </div>
            </div>

            {selectedRow.packagingBreakdown && (
              <div className="rounded-xl border border-[#D4AA7D]/35 bg-white/75 px-3 py-2">
                <p className="text-[10px] font-black uppercase tracking-wide text-[#7E5C4A]/80 mb-2">Packaging Breakdown</p>
                <div className="space-y-1 max-h-[260px] overflow-auto pr-1">
                  {PACKAGING_GROUPS.flatMap((group) => group.keys)
                    .filter((key) => (selectedRow.packagingBreakdown?.[key] || 0) > 0)
                    .map((key) => (
                      <div key={key} className="flex items-center justify-between gap-2 py-1 border-b border-[#D4AA7D]/15 last:border-b-0">
                        <span className="text-xs font-semibold text-[#7E5C4A]">{PACKAGING_FIELD_BY_KEY[key].label}</span>
                        <span className="text-sm font-bold text-[#272727] tabular-nums">
                          {(selectedRow.packagingBreakdown?.[key] || 0).toLocaleString()} Pkg.
                        </span>
                      </div>
                    ))}
                  {PACKAGING_GROUPS.flatMap((group) => group.keys).every(
                    (key) => (selectedRow.packagingBreakdown?.[key] || 0) === 0
                  ) && <p className="text-xs text-[#7E5C4A]/70">No package quantity.</p>}
                </div>
              </div>
            )}

            <div className="rounded-xl border border-[#D4AA7D]/35 bg-white/75 px-3 py-2">
              <p className="text-[10px] font-black uppercase tracking-wide text-[#7E5C4A]/80">Remark</p>
              <p className="text-sm font-medium text-[#272727] mt-1 whitespace-pre-wrap">{selectedRow.remark || "-"}</p>
            </div>

            <div className="flex justify-end gap-2">
              <button
                onClick={() => setPendingDeleteRow(selectedRow)}
                className="px-4 py-2 rounded-lg border border-rose-200 bg-rose-50 hover:bg-rose-100 text-rose-700 text-sm font-semibold transition-colors inline-flex items-center gap-2"
              >
                <Trash2 className="w-4 h-4" />
                Delete
              </button>
              <button
                onClick={openEditModalFromDetail}
                className="px-4 py-2 rounded-lg bg-[#272727] hover:bg-[#1f1f1f] text-[#EFD09E] text-sm font-semibold transition-colors inline-flex items-center gap-2"
              >
                <Pencil className="w-4 h-4" />
                Edit
              </button>
            </div>
          </div>
        )}
      </Modal>

      <Modal
        isOpen={!!pendingDeleteRow}
        onClose={() => setPendingDeleteRow(null)}
        title="Confirm Delete"
        className="max-w-md"
      >
        <div className="space-y-4">
          <p className="text-sm text-[#7E5C4A]">
            Delete this packing record for <span className="font-bold text-[#272727]">{pendingDeleteRow?.date}</span>?
          </p>
          <div className="flex justify-end gap-2">
            <button
              onClick={() => setPendingDeleteRow(null)}
              className="px-4 py-2 rounded-lg border border-[#D4AA7D]/35 text-[#7E5C4A] text-sm font-semibold hover:bg-white/70 transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={handleDeleteRecord}
              className="px-4 py-2 rounded-lg bg-rose-600 hover:bg-rose-700 text-white text-sm font-semibold transition-colors"
            >
              Confirm Delete
            </button>
          </div>
        </div>
      </Modal>

      <Modal
        isOpen={isSuccessModalOpen}
        onClose={() => setIsSuccessModalOpen(false)}
        title="Success"
        className="max-w-xs"
      >
        <div className="py-1">
          <p className="text-sm font-semibold text-[#272727]">{successMessage}</p>
        </div>
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
