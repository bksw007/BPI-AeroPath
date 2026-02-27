import type { PackedCase } from "@/lib/services/packing-logic/packing.types";
import type { POCase, PlanAdjustmentOp, PlanAdjustmentRecord } from "./adjustments.types";

function describeOp(op: PlanAdjustmentOp): string {
  switch (op.type) {
    case "update_item_qty":
      return `Adjust qty ${op.po} #${op.caseNo} ${op.sku} -> ${op.qty}`;
    case "update_case_note":
      return `Update note ${op.po} #${op.caseNo}`;
    case "change_case_package":
      return `Change package ${op.po} #${op.caseNo} -> ${op.packageName}`;
    case "split_case":
      return `Split case ${op.po} #${op.caseNo} (${op.sku} ${op.qty})`;
    case "merge_cases":
      return `Merge cases ${op.po} [${op.caseNos.join(", ")}]`;
    case "add_case":
      return `Add case ${op.po} (${op.packageName})`;
    case "delete_case":
      return `Delete case ${op.po} #${op.caseNo}`;
    default:
      return "Manual adjustment";
  }
}

export function cloneCase(input: PackedCase): PackedCase {
  return {
    ...input,
    items: input.items.map((item) => ({ ...item })),
  };
}

export function clonePlanResult(planResult: POCase[]): POCase[] {
  return planResult.map((poGroup) => ({
    po: poGroup.po,
    cases: poGroup.cases.map(cloneCase),
  }));
}

export function createAdjustmentRecord(op: PlanAdjustmentOp, actor = "Planner"): PlanAdjustmentRecord {
  return {
    id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    at: new Date().toISOString(),
    actor,
    label: describeOp(op),
    op,
  };
}

export function normalizeCaseNumbers(planResult: POCase[]): POCase[] {
  return planResult.map((poGroup) => {
    const sorted = [...poGroup.cases].sort((a, b) => a.caseNo - b.caseNo);
    return {
      po: poGroup.po,
      cases: sorted.map((c, idx) => ({ ...cloneCase(c), caseNo: idx + 1 })),
    };
  });
}

export function getNextCaseNo(cases: PackedCase[]): number {
  if (cases.length === 0) return 1;
  return Math.max(...cases.map((c) => c.caseNo)) + 1;
}

export function summarizePlan(planResult: POCase[]): {
  totalPallets: number;
  totalBoxes: number;
  totalWarps: number;
  totalM3: number;
  totalItems: number;
} {
  let totalPallets = 0;
  let totalBoxes = 0;
  let totalWarps = 0;
  let totalItems = 0;

  planResult.forEach((poGroup) => {
    poGroup.cases.forEach((c) => {
      if (c.type.includes("Warp")) totalWarps += 1;
      else if (c.type.includes("Pallet")) totalPallets += 1;
      else if (c.type.includes("Box")) totalBoxes += 1;

      totalItems += c.items.reduce((sum, item) => sum + item.qty, 0);
    });
  });

  return {
    totalPallets,
    totalBoxes,
    totalWarps,
    totalItems,
    totalM3: 0,
  };
}
