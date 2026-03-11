import type {
  BuildSheetEntriesResult,
  FlattenedPlanCase,
  PackingDetailSheetEntry,
  PackingDetailsExportOptions,
  PlanResultForExport,
} from "@/lib/packing-details/export.types";

interface ParsedNoSelection {
  selectedNos: number[];
  errors: string[];
}

export const flattenPlanCases = (planResult: PlanResultForExport): FlattenedPlanCase[] => {
  let runningNo = 1;
  const rows: FlattenedPlanCase[] = [];

  planResult.forEach((poGroup) => {
    poGroup.cases.forEach((caseData) => {
      rows.push({
        no: runningNo,
        po: poGroup.po,
        originalCaseNo: caseData.caseNo,
        caseData,
      });
      runningNo += 1;
    });
  });

  return rows;
};

const toInt = (value: string): number | null => {
  if (!/^\d+$/.test(value)) return null;
  const parsed = Number(value);
  if (!Number.isFinite(parsed)) return null;
  return parsed;
};

export const parseNoSelection = (input: string): ParsedNoSelection => {
  const cleaned = input.replace(/\s+/g, "");
  if (!cleaned) {
    return { selectedNos: [], errors: ["No. range is required for Custom mode."] };
  }

  const tokens = cleaned.split(",");
  const picked = new Set<number>();
  const errors: string[] = [];

  tokens.forEach((token) => {
    if (!token) {
      errors.push("No. range contains an empty token.");
      return;
    }

    if (token.includes("-")) {
      const [startRaw, endRaw, ...rest] = token.split("-");
      if (rest.length > 0 || !startRaw || !endRaw) {
        errors.push(`Invalid range token: "${token}"`);
        return;
      }
      const start = toInt(startRaw);
      const end = toInt(endRaw);
      if (start === null || end === null) {
        errors.push(`Invalid range token: "${token}"`);
        return;
      }
      if (start > end) {
        errors.push(`Invalid range "${token}" (start must be <= end).`);
        return;
      }
      for (let i = start; i <= end; i += 1) picked.add(i);
      return;
    }

    const single = toInt(token);
    if (single === null) {
      errors.push(`Invalid No. token: "${token}"`);
      return;
    }
    picked.add(single);
  });

  return {
    selectedNos: Array.from(picked).sort((a, b) => a - b),
    errors,
  };
};

const buildSelectedNos = (
  totalNoCount: number,
  options: PackingDetailsExportOptions
): { selectedNos: number[]; errors: string[] } => {
  if (options.selectionMode === "all") {
    return {
      selectedNos: Array.from({ length: totalNoCount }, (_, i) => i + 1),
      errors: [],
    };
  }

  const parsed = parseNoSelection(options.noRangeInput);
  const rangeErrors = parsed.selectedNos
    .filter((no) => no < 1 || no > totalNoCount)
    .map((no) => `Range includes No. ${no} but plan has only ${totalNoCount}.`);

  return {
    selectedNos: parsed.selectedNos.filter((no) => no >= 1 && no <= totalNoCount),
    errors: [...parsed.errors, ...rangeErrors],
  };
};

export const buildPackingDetailSheetEntries = (
  planResult: PlanResultForExport,
  options: PackingDetailsExportOptions
): BuildSheetEntriesResult => {
  const flattened = flattenPlanCases(planResult);
  const totalNoCount = flattened.length;

  if (totalNoCount === 0) {
    return {
      entries: [],
      errors: ["No plan rows available for export."],
      totalNoCount,
    };
  }

  if (!Number.isFinite(options.startCaseNo) || options.startCaseNo <= 0) {
    return {
      entries: [],
      errors: ["Start Case no. must be a positive number."],
      totalNoCount,
    };
  }

  const shipment = options.shipment.trim();
  if (!shipment) {
    return {
      entries: [],
      errors: ["Shipment is required."],
      totalNoCount,
    };
  }

  const selected = buildSelectedNos(totalNoCount, options);
  if (selected.errors.length > 0) {
    return { entries: [], errors: selected.errors, totalNoCount };
  }
  if (selected.selectedNos.length === 0) {
    return { entries: [], errors: ["No. selection is empty."], totalNoCount };
  }

  const noToCase = new Map<number, FlattenedPlanCase>();
  flattened.forEach((row) => noToCase.set(row.no, row));

  const entries: PackingDetailSheetEntry[] = selected.selectedNos.map((sourceNo, idx) => {
    const row = noToCase.get(sourceNo);
    if (!row) {
      throw new Error(`Unexpected missing No. ${sourceNo}`);
    }
    const mappedCaseNo = options.startCaseNo + idx;
    const totalQty = row.caseData.items.reduce((sum, item) => sum + item.qty, 0);

    return {
      sourceNo,
      po: row.po,
      originalCaseNo: row.originalCaseNo,
      mappedCaseNo,
      palletNo: String(mappedCaseNo),
      shipment,
      shipBy: options.shipBy,
      product: options.product,
      caseData: row.caseData,
      totalQty,
    };
  });

  return { entries, errors: [], totalNoCount };
};
