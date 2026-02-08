"use client";

import { useState, useRef, useEffect } from "react";
import {
  Play,
  ChevronRight,
  RotateCcw,
  Package,
  Layers,
  Filter,
  Box,
  CheckCircle2,
  Database,
  Ruler,
  GitBranch,
  SplitSquareHorizontal,
  Eye,
} from "lucide-react";
import { GlassCard } from "@/components/shared/GlassCard";
import { PackagingService } from "@/lib/firebase/services/packaging.service";
import { PACKAGE_MASTER_DATA } from "@/lib/config/packagingData";

// Types
interface ProcessedItem {
  po: string;
  sku: string;
  qty: number;
  spec?: {
    name: string;
    width: number;
    length: number;
    height: number;
    m3: number;
    packingRules?: {
      warp?: boolean;
      boxes?: Record<string, number>;
      pallets?: Record<string, number>;
    };
  };
  m3Total?: number;
  maxPackage?: string;
  dimsKey?: string;
}

interface PackedCase {
  caseNo: number;
  type: string;
  items: { sku: string; name: string; qty: number }[];
  dims: string;
  note?: string;
}

interface POData {
  po: string;
  items: ProcessedItem[];
  uniqueDims: string[];
  packingType: "same" | "mixed" | "pending";
  sameItems: ProcessedItem[];
  mixedItems: ProcessedItem[];
  remainder: ProcessedItem[];
}

interface POResult {
  po: string;
  warpCases: PackedCase[];
  monoCases: PackedCase[];  // Mono Alone POs
  sameCases: PackedCase[];  // Overflow / Same dimension
  mixedCases: PackedCase[];
  status: "processing" | "complete";
}

// Step definitions - New Flow
const STEP_FLOW = [
  { id: "input", title: "📥 Input", icon: Package },
  { id: "aggregate", title: "📊 Aggregate", icon: Layers },
  { id: "fetch_specs", title: "🔍 Fetch Specs", icon: Database },
  { id: "separate_warp", title: "🔧 Warp", icon: Filter },
  { id: "split_po", title: "📋 Split PO", icon: SplitSquareHorizontal },
  { id: "check_mono", title: "🎯 Mono", icon: Box },
  { id: "check_overflow", title: "📊 Overflow", icon: Ruler },
  { id: "pack_same", title: "📦 SamePack", icon: Box },
  { id: "pack_mixed", title: "📦 BinPack", icon: GitBranch },
  { id: "check_choose", title: "✅ Completed", icon: CheckCircle2 },
];

export default function LogicProcessPage() {
  const [rawInput, setRawInput] = useState("");
  const [currentStepIndex, setCurrentStepIndex] = useState(-1);
  const [isProcessing, setIsProcessing] = useState(false);

  // Working data
  const [workingItems, setWorkingItems] = useState<ProcessedItem[]>([]);
  const [stepDescription, setStepDescription] = useState("");

  // PO-based processing
  const [poDataMap, setPODataMap] = useState<Map<string, POData>>(new Map());
  const poDataMapRef = useRef(poDataMap);
  
  // Keep ref in sync with state
  useEffect(() => {
    poDataMapRef.current = poDataMap;
  }, [poDataMap]);

  // Completed results (left panel)
  const [poResults, setPOResults] = useState<Map<string, POResult>>(new Map());
  const poResultsRef = useRef(poResults);
  
  // Keep ref in sync with state
  useEffect(() => {
    poResultsRef.current = poResults;
  }, [poResults]);

  // Region Selection (A/E/R)
  const [selectedRegion, setSelectedRegion] = useState<"A" | "E" | "R">("E");

  // Parse input
  const parseInput = (input: string): ProcessedItem[] => {
    const lines = input.split("\n");
    const items: ProcessedItem[] = [];
    lines.forEach((line) => {
      const parts = line.trim().split(/[\t,]+/);
      if (parts.length >= 3) {
        const po = parts[0].trim();
        const sku = parts[1].trim();
        const qty = parseInt(parts[2].replace(/,/g, "").trim());
        if (po && sku && !isNaN(qty)) {
          items.push({ po, sku, qty });
        }
      }
    });
    return items;
  };

  // Aggregate and sort
  const aggregateAndSort = (items: ProcessedItem[]): ProcessedItem[] => {
    const aggregated = new Map<string, ProcessedItem>();
    for (const item of items) {
      const key = `${item.po}|${item.sku}`;
      if (aggregated.has(key)) {
        aggregated.get(key)!.qty += item.qty;
      } else {
        aggregated.set(key, { ...item });
      }
    }
    return Array.from(aggregated.values()).sort((a, b) => {
      if (a.po !== b.po) return a.po.localeCompare(b.po);
      return b.qty - a.qty;
    });
  };

  // Fetch specs
  const fetchSpecs = async (
    items: ProcessedItem[],
  ): Promise<ProcessedItem[]> => {
    const uniqueSkus = [...new Set(items.map((i) => i.sku))];
    const specsMap = new Map<string, ProcessedItem["spec"]>();

    for (const sku of uniqueSkus) {
      try {
        const spec = await PackagingService.getProductSpec(sku);
        if (spec) {
          // DEBUG LOG
          console.log(`[DEBUG] SKU: ${sku}, packingRules:`, spec.packingRules);
          
          specsMap.set(sku, {
            name: spec.name,
            width: spec.width,
            length: spec.length,
            height: spec.height,
            m3: spec.cbm,
            packingRules: spec.packingRules as {
              warp?: boolean;
              boxes?: Record<string, number>;
              pallets?: Record<string, number>;
            },
          });
        } else {
          console.log(`[DEBUG] SKU: ${sku}, NOT FOUND in database`);
        }
      } catch (error) {
        console.error(`Error fetching spec for ${sku}:`, error);
      }
    }

    return items.map((item) => ({ ...item, spec: specsMap.get(item.sku) }));
  };

  // Separate warp items
  const separateWarp = (items: ProcessedItem[]) => {
    const warpItems = items.filter((i) => i.spec?.packingRules?.warp === true);
    const normalItems = items.filter(
      (i) => i.spec?.packingRules?.warp !== true,
    );

    // Group warp by PO
    const warpByPO = new Map<string, ProcessedItem[]>();
    for (const item of warpItems) {
      if (!warpByPO.has(item.po)) warpByPO.set(item.po, []);
      warpByPO.get(item.po)!.push(item);
    }

    // Update results
    const newResults = new Map(poResults);
    for (const [po, items] of warpByPO.entries()) {
      if (!newResults.has(po)) {
        newResults.set(po, {
          po,
          warpCases: [],
          monoCases: [],
          sameCases: [],
          mixedCases: [],
          status: "processing",
        });
      }
      const result = newResults.get(po)!;
      let caseNo = result.warpCases.length + 1;

      // Create 1:1 Cases for each unit
      for (const item of items) {
        const dims = item.spec
          ? `${item.spec.width}x${item.spec.length}x${item.spec.height}`
          : "Warp";

        for (let q = 0; q < item.qty; q++) {
          result.warpCases.push({
            caseNo: caseNo++,
            type: "Warp Pallet",
            items: [
              {
                sku: item.sku,
                name: item.spec?.name || "",
                qty: 1,
              },
            ],
            dims,
          });
        }
      }
    }

    setPOResults(newResults);
    return normalItems;
  };

  // Split by PO
  const splitByPO = (items: ProcessedItem[]) => {
    const byPO = new Map<string, ProcessedItem[]>();
    for (const item of items) {
      if (!byPO.has(item.po)) byPO.set(item.po, []);
      byPO.get(item.po)!.push(item);
    }

    const newPOData = new Map<string, POData>();
    for (const [po, poItems] of byPO.entries()) {
      // Calculate dims key for each item
      const itemsWithDims = poItems.map((item) => ({
        ...item,
        dimsKey: item.spec
          ? `${item.spec.width}x${item.spec.length}x${item.spec.height}`
          : "unknown",
        m3Total: (item.spec?.m3 || 0) * item.qty,
      }));

      const uniqueDims = [...new Set(itemsWithDims.map((i) => i.dimsKey))];

      newPOData.set(po, {
        po,
        items: itemsWithDims,
        uniqueDims,
        packingType: "pending",
        sameItems: [],
        mixedItems: [],
        remainder: [],
      });
    }

    // Also create POResult entries for all POs
    const newResults = new Map(poResults);
    for (const po of newPOData.keys()) {
      if (!newResults.has(po)) {
        newResults.set(po, {
          po,
          warpCases: [],
          monoCases: [],
          sameCases: [],
          mixedCases: [],
          status: "processing",
        });
      }
    }

    // Update both state AND refs for immediate access
    setPODataMap(newPOData);
    setPOResults(newResults);
    poDataMapRef.current = newPOData;
    poResultsRef.current = newResults;
    return items;
  };

  // Find max package for item (respecting selectedRegion)
  const findMaxPackage = (
    item: ProcessedItem,
  ): { pkg: string; capacity: number } => {
    const packages = getAllPackages(item);
    if (packages.length === 0) return { pkg: "NO_RULES", capacity: 0 };
    
    // The list is sorted by capacity ascending, so the last one is the max
    const max = packages[packages.length - 1];
    return { pkg: max.pkg, capacity: max.capacity };
  };

  // Get ALL available packages for the selected region (sorted by capacity ascending)
  const getAllPackages = (item: ProcessedItem): Array<{ pkg: string; capacity: number; type: 'pallet' | 'box' }> => {
    // 1. Get packages allowed for the selected region from MASTER DATA
    const allowedPackages = PACKAGE_MASTER_DATA.filter(pkg => pkg.types.includes(selectedRegion));
    
    const results: Array<{ pkg: string; capacity: number; type: 'pallet' | 'box' }> = [];
    const rules = item.spec?.packingRules;

    if (!rules) return [];

    allowedPackages.forEach(p => {
      let capacity = 0;
      if (p.category === 'Pallet' && rules.pallets) {
        const pkgData = rules.pallets[p.name];
        capacity = typeof pkgData === 'object' && pkgData !== null 
          ? (pkgData as { totalQty?: number }).totalQty || 0
          : (typeof pkgData === 'number' ? pkgData : 0);
      } else if (p.category === 'Box' && rules.boxes) {
        const pkgData = rules.boxes[p.name];
        capacity = typeof pkgData === 'object' && pkgData !== null 
          ? (pkgData as { totalQty?: number }).totalQty || 0
          : (typeof pkgData === 'number' ? pkgData : 0);
      }

      if (capacity > 0) {
        results.push({
          pkg: p.name,
          capacity,
          type: p.category === 'Pallet' ? 'pallet' : 'box'
        });
      }
    });

    // Sort by capacity ascending (smallest first)
    return results.sort((a, b) => a.capacity - b.capacity);
  };

  // Find BEST FIT package for given quantity
  // Strategy: Find smallest package that can hold qty OR largest package if qty exceeds all
  const findBestFitPackage = (item: ProcessedItem, qty: number): { pkg: string; capacity: number; type: 'pallet' | 'box' } | null => {
    const packages = getAllPackages(item);
    if (packages.length === 0) return null;
    
    // Find smallest package that can hold the qty
    for (const p of packages) {
      if (p.capacity >= qty) {
        return p;
      }
    }
    
    // If qty exceeds all packages, return the largest one
    return packages[packages.length - 1];
  };

  // ========== STEP: Process Mono Alone ==========
  // ถ้าทั้ง PO มีขนาดเดียว → หา Best Fit Package → จบ PO นี้
  const processMonoAlone = () => {
    const updatedPOData = new Map(poDataMap);
    const newResults = new Map(poResults);
    
    for (const [po, data] of updatedPOData.entries()) {
      if (data.items.length === 0) continue;
      if (data.uniqueDims.length !== 1 || data.uniqueDims[0] === 'unknown') continue;
      
      // This is Mono Alone PO
      if (!newResults.has(po)) {
        newResults.set(po, { po, warpCases: [], monoCases: [], sameCases: [], mixedCases: [], status: 'processing' });
      }
      const result = newResults.get(po)!;
      let caseNo = result.monoCases.length + 1;
      
      const allItems = [...data.items];
      const packages = getAllPackages(allItems[0]);
      
      if (packages.length === 0) {
        // No packing rules → สร้าง case แบบ "No Rules"
        result.monoCases.push({
          caseNo: caseNo++,
          type: 'Mono (No Rules)',
          items: allItems.map(i => ({ sku: i.sku, name: i.spec?.name || '', qty: i.qty })),
          dims: data.uniqueDims[0],
          note: 'ต้องกำหนด Packing Rules'
        });
      } else {
        let remainingQty = allItems.reduce((sum, i) => sum + i.qty, 0);
        
        // Pack using best fit strategy
        while (remainingQty > 0) {
          const bestPkg = findBestFitPackage(allItems[0], remainingQty);
          if (!bestPkg) break;
          
          if (remainingQty >= bestPkg.capacity) {
            // Create full package
            const type = bestPkg.type === 'pallet' ? 'Full Pallet' : 'Full Box';
            result.monoCases.push({
              caseNo: caseNo++,
              type,
              items: allItems.map(i => ({ sku: i.sku, name: i.spec?.name || '', qty: bestPkg.capacity })),
              dims: bestPkg.pkg,
              note: `Mono (${bestPkg.capacity} ชิ้น)`
            });
            remainingQty -= bestPkg.capacity;
          } else {
            // Partial - find best fit for remaining
            const partialPkg = findBestFitPackage(allItems[0], remainingQty);
            if (partialPkg) {
              const type = partialPkg.type === 'pallet' ? 'Partial Pallet' : 'Partial Box';
              result.monoCases.push({
                caseNo: caseNo++,
                type,
                items: allItems.map(i => ({ sku: i.sku, name: i.spec?.name || '', qty: remainingQty })),
                dims: partialPkg.pkg,
                note: `เศษ ${remainingQty}/${partialPkg.capacity} ชิ้น`
              });
            }
            remainingQty = 0;
          }
        }
      }
      
      // จบ PO นี้ - ลบ items และไม่ส่งไป Mixed
      data.items = [];
      data.packingType = 'same';
      result.status = 'complete';
    }
    
    // Update both state AND refs for immediate access
    setPODataMap(updatedPOData);
    setPOResults(newResults);
    poDataMapRef.current = updatedPOData;
    poResultsRef.current = newResults;
  };

  // ========== STEP: Process Overflow ==========
  // Items ที่มี qty >= capacity → ตัด Full → เศษไป Same Dimension Pool
  const processOverflow = () => {
    const updatedPOData = new Map(poDataMap);
    const newResults = new Map(poResults);
    
    for (const [po, data] of updatedPOData.entries()) {
      if (data.items.length === 0) continue;
      
      if (!newResults.has(po)) {
        newResults.set(po, { po, warpCases: [], monoCases: [], sameCases: [], mixedCases: [], status: 'processing' });
      }
      const result = newResults.get(po)!;
      let caseNo = result.sameCases.length + 1;
      const pool: ProcessedItem[] = [];
      
      for (const item of data.items) {
        const { pkg, capacity } = findMaxPackage(item);
        
        if (capacity > 0 && item.qty >= capacity) {
          // Overflow: ตัด Full cases
          let remainingQty = item.qty;
          const type = pkg.includes('110') || pkg.includes('120') ? 'Full Pallet' : 'Full Box';
          
          while (remainingQty >= capacity) {
            result.sameCases.push({
              caseNo: caseNo++,
              type,
              items: [{ sku: item.sku, name: item.spec?.name || '', qty: capacity }],
              dims: pkg,
              note: 'Overflow'
            });
            remainingQty -= capacity;
          }
          
          if (remainingQty > 0) {
            pool.push({ ...item, qty: remainingQty });
          }
        } else {
          pool.push({ ...item });
        }
      }
      
      // Handover: ส่งต่อให้ sameItems เพื่อรอจัดกลุ่มในขั้นตอนถัดไป
      data.items = [];
      data.sameItems = [...data.sameItems, ...pool];
    }
    
    // Update both state AND refs for immediate access
    setPODataMap(updatedPOData);
    setPOResults(newResults);
    poDataMapRef.current = updatedPOData;
    poResultsRef.current = newResults;
  };

  // ========== STEP: Pack Same Items ==========
  // Process items with same dimensions within each PO (items that weren't Mono/Overflow)
  // Returns updated data for chaining with packMixedItems
  const packSameItems = (): { updatedPOData: Map<string, POData>; newResults: Map<string, POResult> } => {
    const updatedPOData = new Map(poDataMap);
    const newResults = new Map(poResults);
    
    for (const [po, data] of updatedPOData.entries()) {
      // Skip POs that are already complete (Mono)
      const existingResult = newResults.get(po);
      if (existingResult?.status === 'complete') continue;
      
      // Get items remaining in sameItems (from Split PO)
      if (data.sameItems.length === 0) continue;
      
      if (!newResults.has(po)) {
        newResults.set(po, { po, warpCases: [], monoCases: [], sameCases: [], mixedCases: [], status: 'processing' });
      }
      const result = newResults.get(po)!;
      let caseNo = result.sameCases.length + 1;
      
      // Group by dimensions
      const dimGroups = new Map<string, ProcessedItem[]>();
      for (const item of data.sameItems) {
        const dim = item.dimsKey || 'unknown';
        if (!dimGroups.has(dim)) dimGroups.set(dim, []);
        dimGroups.get(dim)!.push(item);
      }
      
      // Pack each dimension group
      for (const [dim, items] of dimGroups.entries()) {
        if (items.length === 0 || dim === 'unknown') continue;
        
        const { pkg, capacity } = findMaxPackage(items[0]);
        if (capacity > 0) {
          let totalQty = items.reduce((sum, i) => sum + i.qty, 0);
          const type = pkg.includes('110') || pkg.includes('120') ? 'Full Pallet' : 'Full Box';
          
          while (totalQty >= capacity) {
            // Calculate how much each SKU contributes to this full case
            let remainingInCase = capacity;
            const itemsInCase: Array<{ sku: string; name: string; qty: number }> = [];
            
            for (const item of items) {
              if (item.qty > 0 && remainingInCase > 0) {
                const take = Math.min(item.qty, remainingInCase);
                itemsInCase.push({ sku: item.sku, name: item.spec?.name || '', qty: take });
                item.qty -= take;
                remainingInCase -= take;
              }
            }

            result.sameCases.push({
              caseNo: caseNo++,
              type,
              items: itemsInCase,
              dims: pkg,
              note: 'Same Dim Group'
            });
            totalQty -= capacity;
          }
          
          // เศษ → Mixed (เก็บทุก SKU ที่ยังเหลืออยู่)
          const remainingItems = items.filter(i => i.qty > 0);
          data.mixedItems.push(...remainingItems);
        } else {
          // No rules → ส่งไป Mixed
          data.mixedItems.push(...items);
        }
      }
      
      data.sameItems = [];
    }
    
    // Update both state AND refs for immediate access
    setPODataMap(updatedPOData);
    setPOResults(newResults);
    poDataMapRef.current = updatedPOData;
    poResultsRef.current = newResults;
    
    return { updatedPOData, newResults };
  };

  // --- Binary Packing Helper (Generic 3D Fit with Rotation) ---
  const calculateBestFit3D = (container: {w: number, l: number, h: number}, item: {w: number, l: number, h: number}) => {
    if (item.w <= 0 || item.l <= 0 || item.h <= 0) return 0;
    
    const fits = [
      Math.floor(container.w / item.w) * Math.floor(container.l / item.l) * Math.floor(container.h / item.h),
      Math.floor(container.w / item.l) * Math.floor(container.l / item.w) * Math.floor(container.h / item.h),
      Math.floor(container.w / item.l) * Math.floor(container.l / item.h) * Math.floor(container.h / item.w),
      Math.floor(container.w / item.h) * Math.floor(container.l / item.w) * Math.floor(container.h / item.l),
      Math.floor(container.w / item.w) * Math.floor(container.l / item.h) * Math.floor(container.h / item.l),
      Math.floor(container.w / item.h) * Math.floor(container.l / item.l) * Math.floor(container.h / item.w),
    ];
    return Math.max(0, ...fits.filter(v => !isNaN(v) && isFinite(v)));
  };

  // Pack Mixed Items (Refined Logic)
  // Accepts optional data parameters for chaining after packSameItems
  const packMixedItems = (
    inputPOData?: Map<string, POData>,
    inputResults?: Map<string, POResult>
  ) => {
    // Use refs by default for latest data
    const updatedPOData = new Map(inputPOData || poDataMapRef.current);
    const newResults = new Map(inputResults || poResultsRef.current);

    console.log("=== packMixedItems START ===");
    console.log("POs in updatedPOData:", Array.from(updatedPOData.keys()));

    for (const [po, data] of updatedPOData.entries()) {
      console.log(`PO ${po}: mixedItems.length = ${data.mixedItems.length}`);
      if (data.mixedItems.length === 0) continue;

      if (!newResults.has(po)) {
        newResults.set(po, {
          po,
          warpCases: [],
          monoCases: [],
          sameCases: [],
          mixedCases: [],
          status: "processing",
        });
      }
      const result = newResults.get(po)!;
      let caseNo = result.mixedCases.length + 1;

      // Group items by their Max Package type
      const pkgGroups = new Map<string, ProcessedItem[]>();
      for (const item of data.mixedItems) {
        const { pkg } = findMaxPackage(item);
        if (!pkgGroups.has(pkg)) pkgGroups.set(pkg, []);
        pkgGroups.get(pkg)!.push(item);
      }

      // Process ONE case for each Max Package group found in this PO
      for (const [pkgName, groupItems] of pkgGroups.entries()) {
        if (groupItems.length === 0) continue;

        // 1. Calculate % Density for each item in this group and sort
        const itemsWithDensity = groupItems.map(item => {
          const { capacity } = findMaxPackage(item);
          return {
            ...item,
            density: capacity > 0 ? (item.qty / capacity) * 100 : 0,
            maxCapacity: capacity
          };
        }).sort((a, b) => b.density - a.density);

        if (itemsWithDensity.length === 0) continue;

        // 2. Select Primary (Top 1) and Secondary (Top 2) from this group
        const primary = itemsWithDensity[0];
        const secondary = itemsWithDensity.length > 1 ? itemsWithDensity[1] : null;

        // 3. Get Package Dims (Max Package of the group)
        const pkgDef = PACKAGE_MASTER_DATA.find(p => p.name === pkgName);
        if (!pkgDef) continue;
        
        const container = pkgDef.inner;
        const mainDim = primary.spec || { width: 0, length: 0, height: 0 };
        const smallDim = secondary?.spec || { width: 0, length: 0, height: 0 };

        // 4. Bin Packing Calculation
        const maxPossibleLayers = mainDim.height > 0 ? Math.floor(container.h / mainDim.height) : 0;
        const impliedItemsPerLayer = maxPossibleLayers > 0 ? Math.ceil(primary.maxCapacity / maxPossibleLayers) : 0;
        const currentLayersUsed = impliedItemsPerLayer > 0 ? Math.ceil(primary.qty / impliedItemsPerLayer) : 0;
        const currentStackHeight = Math.min(container.h, currentLayersUsed * mainDim.height);

        let totalInsertable = 0;
        let fromMissing = 0;
        let fromTop = 0;
        let fromSide = 0;
        let volRatio = 1;

        if (secondary && secondary.spec) {
          const volPrimary = (mainDim.width * mainDim.length * mainDim.height) / 1000000;
          const volSecondary = (smallDim.width * smallDim.length * smallDim.height) / 1000000;
          volRatio = volPrimary > 0 && volSecondary > 0 
            ? Math.max(volPrimary / volSecondary, volSecondary / volPrimary) 
            : 1;

          // A: Missing Slots
          const totalSlotsInStack = currentLayersUsed * impliedItemsPerLayer;
          const emptySlots = Math.max(0, totalSlotsInStack - primary.qty);
          const smallInMainRatio = calculateBestFit3D(
            { w: mainDim.width, l: mainDim.length, h: mainDim.height },
            { w: smallDim.width, l: smallDim.length, h: smallDim.height }
          );
          fromMissing = emptySlots * smallInMainRatio;

          // B: Top Gap
          const remainingHeight = Math.max(0, container.h - currentStackHeight);
          fromTop = calculateBestFit3D(
            { w: container.w, l: container.l, h: remainingHeight },
            { w: smallDim.width, l: smallDim.length, h: smallDim.height }
          );

          // C: Side Gaps (Only if sizes are close enough)
          if (volRatio <= 3) {
            const totalArea = container.w * container.l;
            const usedArea = impliedItemsPerLayer * (mainDim.width * mainDim.length);
            const freeArea = Math.max(0, (totalArea - usedArea) * 0.95);
            const smallArea = smallDim.width * smallDim.length;
            if (smallArea > 0) {
              const sideItemsPerLayer = Math.floor(freeArea / smallArea);
              fromSide = sideItemsPerLayer * currentLayersUsed;
            }
          }
          totalInsertable = Math.min(secondary.qty, fromMissing + fromTop + fromSide);
        }

        let note = `Primary: ${primary.sku}`;
        const itemsInCase: Array<{ sku: string; name: string; qty: number }> = [
          { sku: primary.sku, name: primary.spec?.name || "", qty: primary.qty }
        ];

        if (secondary && totalInsertable > 0) {
          itemsInCase.push({ sku: secondary.sku, name: secondary.spec?.name || "", qty: totalInsertable });
          note += ` | Insert: ${secondary.sku} (+${totalInsertable})`;
          if (volRatio > 3) note += ` (Side Gap Skip)`;

          // --- Substitution Logic (Item #3) ---
          const totalCapacityForSecondary = fromMissing + fromTop + fromSide;
          if (secondary.qty < totalCapacityForSecondary) {
            const missingCount = totalCapacityForSecondary - secondary.qty;
            const volSecondary = (smallDim.width * smallDim.length * smallDim.height) / 1000000;

            // Look for candidate #3 onwards
            const substituteCandidate = itemsWithDensity.slice(2).find(cand => {
              const candDim = cand.spec || { width: 0, length: 0, height: 0 };
              const volCand = (candDim.width * candDim.length * candDim.height) / 1000000;
              const ratio = volSecondary > 0 ? volCand / volSecondary : 0;
              return ratio >= 0.5 && ratio <= 1.5;
            });

            if (substituteCandidate) {
              const candDim = substituteCandidate.spec || { width: 0, length: 0, height: 0 };
              const volCand = (candDim.width * candDim.length * candDim.height) / 1000000;
              const ratio = volSecondary > 0 ? volCand / volSecondary : 0;

              let take = 0;
              if (ratio > 1.0) {
                // Larger (up to 1.5x): 1-to-1 replacement
                take = Math.min(substituteCandidate.qty, missingCount);
              } else {
                // Smaller (down to 0.5x): 1.5x replacement
                const targetQty = Math.ceil(missingCount * 1.5);
                take = Math.min(substituteCandidate.qty, targetQty);
              }

              if (take > 0) {
                itemsInCase.push({
                  sku: substituteCandidate.sku,
                  name: substituteCandidate.spec?.name || "",
                  qty: take
                });
                note += ` | Sub: ${substituteCandidate.sku} (+${take})`;
                
                // Update pool for substitute
                const subInPool = data.mixedItems.find(i => i.sku === substituteCandidate.sku);
                if (subInPool) subInPool.qty -= take;
              }
            }
          }
        }

        result.mixedCases.push({
          caseNo: caseNo++,
          type: pkgName.includes("110") || pkgName.includes("120") ? "Mixed Pallet" : "Mixed Box",
          items: itemsInCase,
          dims: pkgName,
          note: note
        });

        // 6. Update Pool (Deduct only what was used in THIS case)
        const primaryInPool = data.mixedItems.find(i => i.sku === primary.sku);
        if (primaryInPool) primaryInPool.qty = 0; // Primary is finished in this case
        
        if (secondary && totalInsertable > 0) {
          const secondaryInPool = data.mixedItems.find(i => i.sku === secondary.sku);
          if (secondaryInPool) secondaryInPool.qty -= totalInsertable;
        }
      }

      // Final cleanup of the pool for this PO
      const remainingAfterComplex = data.mixedItems.filter(i => i.qty > 0);
      
      // FALLBACK: If complex logic didn't pack all items, create a simple Mixed Case for remaining
      if (remainingAfterComplex.length > 0) {
        const fallbackItems = remainingAfterComplex.map(item => ({
          sku: item.sku,
          name: item.spec?.name || "",
          qty: item.qty
        }));
        
        const firstItem = remainingAfterComplex.find(i => i.spec);
        const { pkg: fallbackPkg } = firstItem ? findMaxPackage(firstItem) : { pkg: "42x46x68" };
        
        result.mixedCases.push({
          caseNo: result.mixedCases.length + 1,
          type: fallbackPkg.includes("110") || fallbackPkg.includes("120") ? "Mixed Pallet" : "Mixed Box",
          items: fallbackItems,
          dims: fallbackPkg || "42x46x68",
          note: `Remainder: ${fallbackItems.length} SKUs`
        });
        
        console.log(`FALLBACK: Created Mixed Case for PO ${po} with ${fallbackItems.length} remaining items`);
      }
      
      data.mixedItems = [];
    }

    console.log("=== packMixedItems END ===");
    console.log("Results:", Array.from(newResults.values()).map(r => ({ po: r.po, mixed: r.mixedCases.length })));

    // Update both state AND refs for immediate access
    setPODataMap(updatedPOData);
    setPOResults(newResults);
    poDataMapRef.current = updatedPOData;
    poResultsRef.current = newResults;
  };

  const handleStart = () => {
    if (!rawInput.trim()) return;
    setIsProcessing(true);

    const parsed = parseInput(rawInput);
    setWorkingItems(parsed);
    setStepDescription(`รับข้อมูล ${parsed.length} รายการ (ยังไม่รวม)`);
    setPOResults(new Map());
    setPODataMap(new Map());
    setCurrentStepIndex(0);
    setIsProcessing(false);
  };

  const handleNext = async () => {
    if (currentStepIndex >= STEP_FLOW.length - 1) return;
    setIsProcessing(true);

    const nextStep = STEP_FLOW[currentStepIndex + 1]?.id;
    let newItems = workingItems;

    try {
      switch (nextStep) {
        case "aggregate":
          newItems = aggregateAndSort(workingItems);
          setStepDescription(`รวมเหลือ ${newItems.length} รายการ`);
          break;

        case "fetch_specs":
          newItems = await fetchSpecs(workingItems);
          const foundCount = newItems.filter((i) => i.spec).length;
          setStepDescription(`พบ Spec ${foundCount}/${newItems.length}`);
          break;

        case "separate_warp":
          newItems = separateWarp(workingItems);
          const warpCount = workingItems.length - newItems.length;
          setStepDescription(
            `แยก Warp ${warpCount} | เหลือ ${newItems.length}`,
          );
          break;

        case "split_po":
          splitByPO(workingItems);
          const poCount = [...new Set(workingItems.map((i) => i.po))].length;
          setStepDescription(`แยก ${poCount} POs`);
          break;

        case "check_mono":
          processMonoAlone();
          const monoCount = Array.from(poDataMap.values()).filter(d => d.uniqueDims.length === 1).length;
          setStepDescription(`Mono Alone: ${monoCount} POs → Full Pallet/Box`);
          break;

        case "check_overflow":
          processOverflow();
          setStepDescription(`Overflow items → ตัด Full + เศษไป Pool`);
          break;

        case "pack_same":
          packSameItems();
          const sameCount = Array.from(poResults.values()).reduce((sum, r) => sum + r.sameCases.length, 0);
          setStepDescription(`Pack Same Items: ${sameCount} cases`);
          break;

        case "pack_mixed":
          // Read from refs which were updated by packSameItems in the previous step
          // This ensures mixedItems from Same step are available immediately
          packMixedItems(poDataMapRef.current, poResultsRef.current);
          const mixedCount = Array.from(poResultsRef.current.values()).reduce((sum, r) => sum + r.mixedCases.length, 0);
          setStepDescription(`Bin EP1: ${mixedCount} Mixed Cases สร้าง!`);
          break;

        case "check_choose":
          // Summary of all packed cases
          const totalWarp = Array.from(poResults.values()).reduce((sum, r) => sum + r.warpCases.length, 0);
          const totalMono = Array.from(poResults.values()).reduce((sum, r) => sum + r.monoCases.length, 0);
          const totalSame = Array.from(poResults.values()).reduce((sum, r) => sum + r.sameCases.length, 0);
          const totalMixed = Array.from(poResults.values()).reduce((sum, r) => sum + r.mixedCases.length, 0);
          setStepDescription(`สรุป: Warp=${totalWarp}, Mono=${totalMono}, Same=${totalSame}, Mixed=${totalMixed}`);
          break;

        case "final":
          // Finalization: Clear remaining items and set status to complete
          const finalizedData = new Map(poDataMap);
          for (const data of finalizedData.values()) {
            data.items = [];
            data.sameItems = [];
            data.mixedItems = [];
          }
          const finalizedResults = new Map(poResults);
          for (const res of finalizedResults.values()) {
            res.status = "complete";
          }
          setPODataMap(finalizedData);
          setPOResults(finalizedResults);
          setStepDescription(`✅ เสร็จสิ้นการประมวลผลทั้งหมด!`);
          break;
      }

      setWorkingItems(newItems);
      setCurrentStepIndex(currentStepIndex + 1);
    } catch (error) {
      console.error("Error:", error);
    }

    setIsProcessing(false);
  };

  const handleReset = () => {
    setCurrentStepIndex(-1);
    setWorkingItems([]);
    setStepDescription("");
    setPOResults(new Map());
    setPODataMap(new Map());
  };

  return (
    <div className="min-h-screen pt-20 pb-12">
      <div className="container-custom">
        {/* Header */}
        <div className="text-center mb-4">
          <h1 className="text-2xl font-bold">
            <span className="bg-clip-text text-transparent bg-gradient-to-r from-emerald-600 to-teal-600">
              🧪 Logic Process Visualizer
            </span>
          </h1>
        </div>

        {/* Progress Steps */}
        <div className="mb-4 overflow-x-auto">
          <div className="flex items-center gap-1 min-w-max justify-center">
            {STEP_FLOW.map((step, idx) => {
              const isActive = idx === currentStepIndex;
              const isComplete = idx < currentStepIndex;
              const Icon = step.icon;

              return (
                <div key={step.id} className="flex items-center">
                  <div
                    className={`
                    flex items-center gap-1 px-2 py-1 rounded text-xs font-medium
                    ${isActive ? "bg-emerald-500 text-white shadow" : ""}
                    ${isComplete ? "bg-emerald-100 text-emerald-700" : ""}
                    ${!isActive && !isComplete ? "bg-slate-100 text-slate-400" : ""}
                  `}
                  >
                    <Icon className="w-3 h-3" />
                    <span className="hidden sm:inline">{step.title}</span>
                  </div>
                  {idx < STEP_FLOW.length - 1 && (
                    <ChevronRight
                      className={`w-3 h-3 ${isComplete ? "text-emerald-500" : "text-slate-300"}`}
                    />
                  )}
                </div>
              );
            })}
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {/* LEFT: Working + PO Data */}
          <div className="space-y-4">
            {/* Input / Status */}
            <GlassCard className="p-4">
              <h2 className="text-base font-bold text-slate-800 mb-2 flex items-center gap-2">
                <Package className="w-4 h-4 text-indigo-600" />
                {currentStepIndex < 0 ? "Input Data" : "Processing"}
              </h2>

              {currentStepIndex < 0 ? (
                <>
                  <div className="mb-3">
                    <label className="text-xs font-semibold text-slate-500 mb-1 block">
                      🌍 Select Region (Pack Type)
                    </label>
                    <div className="flex gap-2">
                      {["A", "E", "R"].map((r) => (
                        <button
                          key={r}
                          onClick={() => setSelectedRegion(r as "A" | "E" | "R")}
                          className={`
                            flex-1 py-1.5 rounded-md text-sm font-bold border transition-all
                            ${selectedRegion === r 
                              ? "bg-indigo-600 border-indigo-600 text-white shadow-md" 
                              : "bg-white border-slate-200 text-slate-600 hover:border-indigo-300"
                            }
                          `}
                        >
                          {r} {r === "A" ? "(Asia)" : r === "E" ? "(US/EU)" : "(RTN)"}
                        </button>
                      ))}
                    </div>
                  </div>
                  <textarea
                    className="w-full h-32 p-3 border border-slate-200 rounded-lg text-xs font-mono resize-none focus:ring-2 focus:ring-emerald-500"
                    placeholder="วางข้อมูล PO + SKU + Qty"
                    value={rawInput}
                    onChange={(e) => setRawInput(e.target.value)}
                  />
                </>
              ) : (
                <div className="p-2 bg-indigo-50 rounded border border-indigo-200">
                  <p className="text-indigo-700 text-sm font-medium">
                    {stepDescription}
                  </p>
                </div>
              )}

              <div className="flex gap-2 mt-3">
                {currentStepIndex < 0 ? (
                  <button
                    onClick={handleStart}
                    disabled={!rawInput.trim()}
                    className="flex-1 flex items-center justify-center gap-2 px-3 py-2 bg-gradient-to-r from-emerald-500 to-teal-500 text-white font-semibold rounded-lg text-sm disabled:opacity-50"
                  >
                    <Play className="w-4 h-4" /> Start
                  </button>
                ) : (
                  <>
                    <button
                      onClick={handleNext}
                      disabled={
                        currentStepIndex >= STEP_FLOW.length - 1 || isProcessing
                      }
                      className="flex-1 flex items-center justify-center gap-1 px-3 py-2 bg-gradient-to-r from-emerald-500 to-teal-500 text-white font-semibold rounded-lg text-sm disabled:opacity-50"
                    >
                      {isProcessing ? "Processing..." : "Next"}{" "}
                      <ChevronRight className="w-4 h-4" />
                    </button>
                    <button
                      onClick={handleReset}
                      className="px-3 py-2 bg-rose-100 text-rose-700 rounded-lg"
                    >
                      <RotateCcw className="w-4 h-4" />
                    </button>
                  </>
                )}
              </div>
            </GlassCard>

            {/* PO Data Status */}
            {poDataMap.size > 0 && (
              <GlassCard className="p-4">
                <h3 className="text-sm font-bold text-slate-700 mb-2">
                  📋 PO Status (Remaining)
                </h3>
                <div className="space-y-3 max-h-[400px] overflow-y-auto">
                  {Array.from(poDataMap.values())
                    .filter((data) => 
                      data.items.length > 0 || 
                      data.sameItems.length > 0 || 
                      data.mixedItems.length > 0
                    )
                    .map((data) => (
                    <div
                      key={data.po}
                      className="p-3 bg-slate-50 rounded-lg border border-slate-200 text-xs"
                    >
                      <div className="flex justify-between items-center mb-2">
                        <span className="font-bold text-indigo-700 text-sm">{data.po}</span>
                        <span
                          className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                            data.packingType === "same"
                              ? "bg-blue-100 text-blue-700"
                              : data.packingType === "mixed"
                                ? "bg-amber-100 text-amber-700"
                                : "bg-slate-200 text-slate-600"
                          }`}
                        >
                          {data.packingType.toUpperCase()}
                        </span>
                      </div>
                      
                      <div className="space-y-4 mt-2 border-t pt-2 border-slate-200">
                        {(() => {
                          const allPending = [...data.items, ...data.sameItems, ...data.mixedItems];
                          const pkgGroups = new Map<string, ProcessedItem[]>();
                          
                          let poTotalM3 = 0;
                          allPending.forEach(item => {
                            const { pkg } = findMaxPackage(item);
                            if (!pkgGroups.has(pkg)) pkgGroups.set(pkg, []);
                            pkgGroups.get(pkg)!.push(item);

                            if (item.spec) {
                              const itemM3 = (item.spec.width * item.spec.length * item.spec.height) / 1000000;
                              poTotalM3 += itemM3 * item.qty;
                            }
                          });

                          // PO Consolidation Recommendation (70% Rule)
                          // Find SMALLEST package where poTotalM3 <= 0.7 * pkg.m3
                          const recommendation = PACKAGE_MASTER_DATA
                            .filter(p => (poTotalM3 / p.m3) <= 0.7)
                            .sort((a, b) => a.m3 - b.m3)[0];

                          return (
                            <>
                              {recommendation && STEP_FLOW[currentStepIndex].id === "check_choose" && (
                                <div className="mb-3 p-2 bg-orange-50 border border-orange-100 rounded-md">
                                  <div className="flex justify-between items-center text-[10px] mb-1">
                                    <span className="font-bold text-orange-600 uppercase">✨ PO Recommendation</span>
                                    <span className="text-orange-400">Total: {poTotalM3.toFixed(3)} m³</span>
                                  </div>
                                  <div className="flex justify-between items-center">
                                    <span className="text-xs font-bold text-orange-900">{recommendation.name}</span>
                                    <span className="text-xs font-black text-orange-700">{(poTotalM3 / recommendation.m3 * 100).toFixed(1)}% Full</span>
                                  </div>
                                </div>
                              )}

                              <div className="space-y-2">
                                {Array.from(pkgGroups.entries()).map(([pkg, groupItems], gIdx) => {
                                  const pkgDef = PACKAGE_MASTER_DATA.find(p => p.name === pkg);
                                  const containerM3 = pkgDef ? pkgDef.m3 : 0;
                                  let groupM3 = 0;
                                  groupItems.forEach(item => {
                                    if (item.spec) {
                                      const itemM3 = (item.spec.width * item.spec.length * item.spec.height) / 1000000;
                                      groupM3 += itemM3 * item.qty;
                                    }
                                  });
                                  const efficiency = containerM3 > 0 ? (groupM3 / containerM3) * 100 : 0;

                                  return (
                                    <div key={gIdx} className="bg-white/50 p-2 rounded-md border border-slate-100">
                                      <div className="flex justify-between items-center mb-1">
                                        <p className="text-[10px] uppercase font-bold text-slate-400 flex items-center gap-1">
                                          <Package className="w-3 h-3" /> {pkg}
                                        </p>
                                        <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${
                                          efficiency >= 90 ? "bg-emerald-100 text-emerald-700" :
                                          efficiency >= 70 ? "bg-blue-100 text-blue-700" :
                                          "bg-slate-100 text-slate-500"
                                        }`}>
                                          {efficiency.toFixed(1)}% Full
                                        </span>
                                      </div>
                                      <div className="space-y-1">
                                        {groupItems.map((item, idx) => (
                                          <div key={idx} className="flex justify-between items-start gap-2 text-[10px]">
                                            <span className="text-slate-700 font-medium truncate flex-1">{item.sku}</span>
                                            <span className="text-slate-400">({item.spec ? `${item.spec.width}x${item.spec.length}x${item.spec.height}` : '-'})</span>
                                            <span className="text-indigo-600 font-bold min-w-[30px] text-right">x{item.qty}</span>
                                          </div>
                                        ))}
                                      </div>
                                    </div>
                                  );
                                })}
                              </div>
                            </>
                          );
                        })()}
                      </div>
                    </div>
                  ))}
                  {Array.from(poDataMap.values()).every(d => d.items.length === 0 && d.sameItems.length === 0 && d.mixedItems.length === 0) && (
                    <div className="text-center py-4 text-slate-400 italic">
                      All POs processed.
                    </div>
                  )}
                </div>
              </GlassCard>
            )}

            {/* Working Items Table */}
            {workingItems.length > 0 &&
              currentStepIndex >= 0 &&
              currentStepIndex < 4 && (
                <GlassCard className="p-4">
                  <h3 className="text-sm font-bold text-slate-700 mb-2">
                    Working ({workingItems.length})
                  </h3>
                  <div className="max-h-[200px] overflow-auto">
                    <table className="w-full text-xs">
                      <thead className="bg-slate-100 sticky top-0">
                        <tr>
                          <th className="py-1 px-2 text-left">PO</th>
                          <th className="py-1 px-2 text-left">SKU</th>
                          <th className="py-1 px-2 text-right">Qty</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y">
                        {workingItems.slice(0, 15).map((item, idx) => (
                          <tr key={idx}>
                            <td className="py-1 px-2 font-mono text-slate-600">
                              {item.po}
                            </td>
                            <td className="py-1 px-2">{item.sku}</td>
                            <td className="py-1 px-2 text-right font-bold text-indigo-600">
                              {item.qty}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                    {workingItems.length > 15 && (
                      <p className="text-center text-slate-400 text-xs py-1">
                        +{workingItems.length - 15} more
                      </p>
                    )}
                  </div>
                </GlassCard>
              )}
          </div>

          {/* RIGHT: Completed Results by PO */}
          <GlassCard className="p-4 h-fit">
            <h2 className="text-base font-bold text-slate-800 mb-3 flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-600" />
              ผลลัพธ์ (แยกตาม PO)
            </h2>

            {poResults.size > 0 ? (
              <div className="space-y-3 max-h-[700px] overflow-y-auto">
                {Array.from(poResults.entries()).map(([po, result]) => (
                  <div
                    key={po}
                    className="border border-slate-200 rounded-lg overflow-hidden"
                  >
                    <div
                      className={`px-3 py-2 font-bold text-sm ${
                        result.status === "complete"
                          ? "bg-emerald-500 text-white"
                          : "bg-amber-100 text-amber-800"
                      }`}
                    >
                      📋 PO: {po} {result.status === "complete" ? "✓" : "⏳"}
                    </div>




                    {/* Same - แสดงก่อน */}
                    {result.sameCases.length > 0 && (
                      <div className="p-2 bg-blue-50 border-b">
                        <p className="text-xs font-semibold text-blue-700 mb-2">
                          📦 Same Cases ({result.sameCases.length})
                        </p>
                        <div className="space-y-1">
                          {result.sameCases.map((c, idx) => (
                            <div key={idx} className="bg-white rounded p-2 border border-blue-200">
                              <div className="flex items-center gap-2 mb-1">
                                <span className="bg-blue-500 text-white text-xs font-bold px-2 py-0.5 rounded">
                                  Case #{c.caseNo}
                                </span>
                                <span className="text-xs text-blue-600">{c.type}</span>
                                <span className="text-xs text-slate-500">({c.dims})</span>
                              </div>
                              {c.note && <div className="text-xs text-blue-500 mb-1">[{c.note}]</div>}
                              <div className="text-xs text-slate-600">
                                {c.items.map((i, iIdx) => (
                                  <div key={iIdx}>• {i.sku} x{i.qty}</div>
                                ))}
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Mixed - แสดงที่สอง */}
                    {result.mixedCases.length > 0 && (
                      <div className="p-2 bg-emerald-50 border-b">
                        <p className="text-xs font-semibold text-emerald-700 mb-2">
                          🔀 Mixed Cases ({result.mixedCases.length})
                        </p>
                        <div className="space-y-1">
                          {result.mixedCases.map((c, idx) => (
                            <div key={idx} className="bg-white rounded p-2 border border-emerald-200">
                              <div className="flex items-center gap-2 mb-1">
                                <span className="bg-emerald-500 text-white text-xs font-bold px-2 py-0.5 rounded">
                                  Case #{c.caseNo}
                                </span>
                                <span className="text-xs text-emerald-600">{c.type}</span>
                                <span className="text-xs text-slate-500">({c.dims})</span>
                              </div>
                              {c.note && <div className="text-xs text-emerald-500 mb-1">[{c.note}]</div>}
                              <div className="text-xs text-slate-600">
                                {c.items.map((i, iIdx) => (
                                  <div key={iIdx}>• {i.sku} x{i.qty}</div>
                                ))}
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Warp - แสดงที่สาม */}
                    {result.warpCases.length > 0 && (
                      <div className="p-2 bg-rose-50 border-b">
                        <p className="text-xs font-semibold text-rose-700 mb-2">
                          🔴 Warp Cases ({result.warpCases.length})
                        </p>
                        <div className="space-y-1">
                          {result.warpCases.map((c, idx) => (
                            <div key={idx} className="bg-white rounded p-2 border border-rose-200">
                              <div className="flex items-center gap-2 mb-1">
                                <span className="bg-rose-500 text-white text-xs font-bold px-2 py-0.5 rounded">
                                  Case #{c.caseNo}
                                </span>
                                <span className="text-xs text-rose-600">{c.type}</span>
                                <span className="text-xs text-slate-500">({c.dims})</span>
                              </div>
                              <div className="text-xs text-slate-600">
                                {c.items.map((i, iIdx) => (
                                  <div key={iIdx}>• {i.sku} x{i.qty}</div>
                                ))}
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Mono - แสดงสุดท้าย */}
                    {result.monoCases.length > 0 && (
                      <div className="p-2 bg-purple-50">
                        <p className="text-xs font-semibold text-purple-700 mb-2">
                          🎯 Mono Cases ({result.monoCases.length})
                        </p>
                        <div className="space-y-1">
                          {result.monoCases.map((c, idx) => (
                            <div key={idx} className="bg-white rounded p-2 border border-purple-200">
                              <div className="flex items-center gap-2 mb-1">
                                <span className="bg-purple-500 text-white text-xs font-bold px-2 py-0.5 rounded">
                                  Case #{c.caseNo}
                                </span>
                                <span className="text-xs text-purple-600">{c.type}</span>
                                <span className="text-xs text-slate-500">({c.dims})</span>
                              </div>
                              {c.note && <div className="text-xs text-purple-500 mb-1">[{c.note}]</div>}
                              <div className="text-xs text-slate-600">
                                {c.items.map((i, iIdx) => (
                                  <div key={iIdx}>• {i.sku} x{i.qty}</div>
                                ))}
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <div className="h-40 flex items-center justify-center text-slate-400 text-sm">
                ผลลัพธ์จะแสดงเมื่อ process เสร็จ
              </div>
            )}
          </GlassCard>
        </div>
      </div>
    </div>
  );
}
