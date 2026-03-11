"use client";

import { useMemo, useState } from "react";
import type {
  NoSelectionMode,
  PackingDetailsExportOptions,
  ProductOption,
  ShipByOption,
} from "@/lib/packing-details/export.types";

interface PackingDetailsExportDialogProps {
  open: boolean;
  maxNo: number;
  shipmentOptions: string[];
  defaultShipment?: string;
  onClose: () => void;
  onSubmit: (options: PackingDetailsExportOptions) => Promise<void> | void;
  isSubmitting?: boolean;
}

const DEFAULT_OPTIONS: PackingDetailsExportOptions = {
  selectionMode: "all",
  noRangeInput: "",
  startCaseNo: 4427,
  shipment: "",
  shipBy: "Sea",
  product: "Inverter",
};

export function PackingDetailsExportDialog({
  open,
  maxNo,
  shipmentOptions,
  defaultShipment,
  onClose,
  onSubmit,
  isSubmitting = false,
}: PackingDetailsExportDialogProps) {
  const initialShipment = defaultShipment?.trim() || shipmentOptions[0] || "";
  const [selectionMode, setSelectionMode] = useState<NoSelectionMode>(DEFAULT_OPTIONS.selectionMode);
  const [noRangeInput, setNoRangeInput] = useState(DEFAULT_OPTIONS.noRangeInput);
  const [startCaseNoInput, setStartCaseNoInput] = useState(String(DEFAULT_OPTIONS.startCaseNo));
  const [shipment, setShipment] = useState(initialShipment);
  const [shipBy, setShipBy] = useState<ShipByOption>(DEFAULT_OPTIONS.shipBy);
  const [product, setProduct] = useState<ProductOption>(DEFAULT_OPTIONS.product);

  const selectedCountPreview = useMemo(() => {
    if (selectionMode === "all") return maxNo;
    const compact = noRangeInput.replace(/\s+/g, "");
    if (!compact) return 0;
    const tokens = compact.split(",").filter(Boolean);
    let count = 0;
    tokens.forEach((token) => {
      if (token.includes("-")) {
        const [s, e] = token.split("-");
        const sv = Number(s);
        const ev = Number(e);
        if (Number.isFinite(sv) && Number.isFinite(ev) && sv <= ev) {
          count += ev - sv + 1;
        }
        return;
      }
      if (/^\d+$/.test(token)) count += 1;
    });
    return count;
  }, [maxNo, noRangeInput, selectionMode]);

  if (!open) return null;

  const handleSubmit = async () => {
    const startCaseNo = Number(startCaseNoInput);
    if (!Number.isFinite(startCaseNo) || startCaseNo <= 0) {
      alert("Start Case no. must be a positive number.");
      return;
    }

    if (selectionMode === "custom" && !noRangeInput.trim()) {
      alert("No. range is required for Custom mode.");
      return;
    }

    await onSubmit({
      selectionMode,
      noRangeInput,
      startCaseNo: Math.floor(startCaseNo),
      shipment,
      shipBy,
      product,
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#272727]/45 backdrop-blur-sm">
      <div className="w-full max-w-xl rounded-2xl border border-white/80 bg-[#EEF2F6]/95 p-6 shadow-2xl">
        <h3 className="text-xl font-black text-[#272727]">Export Packing Details</h3>
        <p className="mt-1 text-sm text-[#7E5C4A]">1 No. = 1 sheet, with mapped Case no.</p>

        <div className="mt-5 space-y-4">
          <div>
            <label className="block text-xs font-bold text-[#7E5C4A] mb-2">No. Selection</label>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => setSelectionMode("all")}
                className={`px-3 py-2 rounded-lg border text-sm font-bold ${
                  selectionMode === "all"
                    ? "border-[#9ACD32] bg-[#9ACD32]/15 text-[#5a7a1a]"
                    : "border-[#D4AA7D]/40 text-[#7E5C4A]"
                }`}
              >
                All ({maxNo})
              </button>
              <button
                type="button"
                onClick={() => setSelectionMode("custom")}
                className={`px-3 py-2 rounded-lg border text-sm font-bold ${
                  selectionMode === "custom"
                    ? "border-[#9ACD32] bg-[#9ACD32]/15 text-[#5a7a1a]"
                    : "border-[#D4AA7D]/40 text-[#7E5C4A]"
                }`}
              >
                Custom Range
              </button>
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-[#7E5C4A] mb-1">No. Range</label>
            <input
              value={noRangeInput}
              onChange={(e) => setNoRangeInput(e.target.value)}
              disabled={selectionMode !== "custom"}
              placeholder="1-4,7-12,15"
              className="w-full rounded-lg border border-[#D4AA7D]/45 px-3 py-2 text-sm text-[#272727] disabled:opacity-50"
            />
            <p className="mt-1 text-xs text-[#7E5C4A]">
              Preview selected: {selectedCountPreview} / {maxNo}
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
            <div>
              <label className="block text-xs font-bold text-[#7E5C4A] mb-1">Shipment</label>
              <select
                value={shipment}
                onChange={(e) => setShipment(e.target.value)}
                className="w-full rounded-lg border border-[#D4AA7D]/45 px-3 py-2 text-sm text-[#272727] bg-white"
              >
                {shipmentOptions.map((option) => (
                  <option key={option} value={option}>
                    {option}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-[#7E5C4A] mb-1">Start Case no.</label>
              <input
                type="number"
                min={1}
                value={startCaseNoInput}
                onChange={(e) => setStartCaseNoInput(e.target.value)}
                className="w-full rounded-lg border border-[#D4AA7D]/45 px-3 py-2 text-sm text-[#272727]"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-[#7E5C4A] mb-1">Ship by</label>
              <select
                value={shipBy}
                onChange={(e) => setShipBy(e.target.value as ShipByOption)}
                className="w-full rounded-lg border border-[#D4AA7D]/45 px-3 py-2 text-sm text-[#272727] bg-white"
              >
                <option value="Air">Air</option>
                <option value="Sea">Sea</option>
                <option value="Courier">Courier</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-[#7E5C4A] mb-1">Product</label>
              <select
                value={product}
                onChange={(e) => setProduct(e.target.value as ProductOption)}
                className="w-full rounded-lg border border-[#D4AA7D]/45 px-3 py-2 text-sm text-[#272727] bg-white"
              >
                <option value="Inverter">Inverter</option>
                <option value="TC">TC</option>
              </select>
            </div>
          </div>
        </div>

        <div className="mt-6 flex justify-end gap-2">
          <button
            type="button"
            onClick={onClose}
            disabled={isSubmitting}
            className="px-4 py-2 rounded-lg border border-[#D4AA7D]/45 text-[#7E5C4A] font-bold text-sm"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleSubmit}
            disabled={isSubmitting}
            className="px-4 py-2 rounded-lg border border-[#9ACD32]/60 bg-[#9ACD32]/15 text-[#5a7a1a] font-bold text-sm disabled:opacity-50"
          >
            {isSubmitting ? "Generating..." : "Generate PDF"}
          </button>
        </div>
      </div>
    </div>
  );
}
