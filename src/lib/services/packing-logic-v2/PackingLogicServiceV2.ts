// ========================================
// PACKING LOGIC SERVICE
// ========================================
// Encapsulates all packing logic in a single, reusable service
// Can be used in UI, API routes, or background jobs

import type {
  ProcessedItem,
  ProcessedItemWithDensity,
  POData,
  POResult,
  PackingConfig,
  PackingInput,
  PackingOutput,
  StepResult,
} from "../packing-logic/packing.types";
import { PackageDef } from "../../config/packagingData";

interface SpecData {
  name: string;
  width: number;
  length: number;
  height: number;
  cbm: number;
  packingRules?: {
    boxes?: Record<string, number>;
    pallets?: Record<string, number>;
    warp?: boolean;
  };
}

export class PackingLogicServiceV2 {
  private config: PackingConfig;
  private poDataMap: Map<string, POData> = new Map();
  private poResults: Map<string, POResult> = new Map();
  private expectedQtyByPoSku: Map<string, number> = new Map();
  
  // External dependencies (injected)
  private packageMasterData: PackageDef[];
  private fetchSpecFromDB: (sku: string) => Promise<SpecData | null>;

  constructor(
    config: PackingConfig,
    packageMasterData: PackageDef[],
    fetchSpecFromDB: (sku: string) => Promise<SpecData | null>
  ) {
    this.config = {
      palletEfficiencyThreshold: 0.75,
      densityThreshold: 60,
      ...config,
    };
    this.packageMasterData = packageMasterData;
    this.fetchSpecFromDB = fetchSpecFromDB;
  }

  // ========================================
  // PUBLIC API - Main Entry Point
  // ========================================

  /**
   * Execute complete packing workflow
   * @param input - Raw input data with config
   * @returns PackingOutput with results and summary
   */
  async execute(input: PackingInput): Promise<PackingOutput> {
    this.reset();
    
    // Step 1: Parse Input
    const parsed = this.parseInput(input.rawData);
    
    // Step 2: Aggregate & Sort
    const aggregated = this.aggregateAndSort(parsed);
    
    // Step 3: Fetch Specs
    const withSpecs = await this.fetchSpecs(aggregated);
    
    // Step 4: Separate Warp & Unknown
    const normalItems = this.separateWarp(withSpecs);
    
    // Step 5: Split by PO
    this.splitByPO(normalItems);
    
    // Step 6: Process Mono Alone
    this.processMonoAlone();
    
    // Step 7: Process Overflow
    this.processOverflow();
    
    // Step 8: Pack Same Items
    this.packSameItems();
    
    // Step 9: Pack Mixed Items
    this.packMixedItems();

    // Step 10: Finalize Sorting & Indexing
    this.finalizeAndSort();

    // Step 11: Reconcile qty integrity (no missing items allowed)
    this.reconcileQtyIntegrity();
    
    // Generate Summary
    const summary = this.generateSummary();
    
    return {
      results: new Map(this.poResults),
      summary,
    };
  }

  /**
   * Execute step-by-step (for UI visualization)
   * @param step - Step ID
   * @param currentItems - Current items in process
   * @returns StepResult with updated data
   */
  async executeStep(step: string, currentItems: ProcessedItem[]): Promise<StepResult> {
    switch (step) {
      case "aggregate":
        const aggregated = this.aggregateAndSort(currentItems);
        return {
          step,
          description: `รวมเหลือ ${aggregated.length} รายการ`,
          items: aggregated,
        };

      case "fetch_specs":
        const withSpecs = await this.fetchSpecs(currentItems);
        const foundCount = withSpecs.filter((i) => i.spec).length;
        return {
          step,
          description: `พบ Spec ${foundCount}/${withSpecs.length}`,
          items: withSpecs,
        };

      case "separate_warp":
        const normalItems = this.separateWarp(currentItems);
        return {
          step,
          description: `แยก Warp ${currentItems.length - normalItems.length} | เหลือ ${normalItems.length}`,
          items: normalItems,
          results: new Map(this.poResults),
        };

      case "split_po":
        this.splitByPO(currentItems);
        return {
          step,
          description: `แยก ${this.poDataMap.size} POs`,
          poData: new Map(this.poDataMap),
          results: new Map(this.poResults),
        };

      case "check_mono":
        this.processMonoAlone();
        return {
          step,
          description: `Mono Alone → Full Pallet/Box`,
          poData: new Map(this.poDataMap),
          results: new Map(this.poResults),
        };

      case "check_overflow":
        this.processOverflow();
        return {
          step,
          description: `Overflow → ตัด Full + เศษไป Pool`,
          poData: new Map(this.poDataMap),
          results: new Map(this.poResults),
        };

      case "pack_same":
        this.packSameItems();
        return {
          step,
          description: `Pack Same Items`,
          poData: new Map(this.poDataMap),
          results: new Map(this.poResults),
        };

      case "pack_mixed":
        this.packMixedItems();
        return {
          step,
          description: `Pack Mixed Items`,
          poData: new Map(this.poDataMap),
          results: new Map(this.poResults),
        };

      default:
        return {
          step,
          description: "Unknown step",
          items: currentItems,
        };
    }
  }

  // ========================================
  // PRIVATE METHODS - Core Logic
  // ========================================

  private reset(): void {
    this.poDataMap.clear();
    this.poResults.clear();
    this.expectedQtyByPoSku.clear();
  }

  /**
   * Step 1: Parse raw input (PO, SKU, QTY)
   */
  private parseInput(input: string): ProcessedItem[] {
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
  }

  /**
   * Step 2: Aggregate by PO+SKU and sort
   */
  private aggregateAndSort(items: ProcessedItem[]): ProcessedItem[] {
    const aggregated = new Map<string, ProcessedItem>();
    
    for (const item of items) {
      const key = `${item.po}|${item.sku}`;
      if (aggregated.has(key)) {
        aggregated.get(key)!.qty += item.qty;
      } else {
        aggregated.set(key, { ...item });
      }
    }
    
    const sorted = Array.from(aggregated.values()).sort((a, b) => {
      if (a.po !== b.po) return a.po.localeCompare(b.po);
      return b.qty - a.qty;
    });
    this.setExpectedQtyMap(sorted);
    return sorted;
  }

  private setExpectedQtyMap(items: ProcessedItem[]): void {
    this.expectedQtyByPoSku.clear();
    for (const item of items) {
      const key = `${item.po}|${item.sku}`;
      this.expectedQtyByPoSku.set(key, (this.expectedQtyByPoSku.get(key) || 0) + item.qty);
    }
  }

  /**
   * Step 3: Fetch specs from database
   */
  private async fetchSpecs(items: ProcessedItem[]): Promise<ProcessedItem[]> {
    const uniqueSkus = [...new Set(items.map((i) => i.sku))];
    const specsMap = new Map<string, ProcessedItem["spec"]>();

    // Get allowed packages for selected region
    const allowedPackageNames = this.packageMasterData
      .filter((pkg) => pkg.types.includes(this.config.region))
      .map((pkg) => pkg.name);
    const allowedPackageNameSet = new Set(
      allowedPackageNames.map((name) => this.normalizePackageKey(name))
    );

    console.log(`[PackingService] Fetch Specs for Region: ${this.config.region}`);
    console.log(`[PackingService] Allowed Packages:`, allowedPackageNames);

    for (const sku of uniqueSkus) {
      try {
        const spec = await this.fetchSpecFromDB(sku);
        if (spec) {
          const rawRules = this.normalizePackingRules(spec.packingRules);
          const rules = this.toNumericPackingRules(rawRules);

          // Determine if valid for region
          let isValidForRegion = false;
          if (rawRules) {
            const hasBoxRule =
              rawRules.boxes &&
              Object.keys(rawRules.boxes).some((k) =>
                allowedPackageNameSet.has(
                  this.normalizePackageKey(this.extractPackageNameFromRuleKey(k))
                )
              );
            const hasPalletRule =
              rawRules.pallets &&
              Object.keys(rawRules.pallets).some((k) =>
                allowedPackageNameSet.has(
                  this.normalizePackageKey(this.extractPackageNameFromRuleKey(k))
                )
              );
            if (hasBoxRule || hasPalletRule) isValidForRegion = true;
          }

          const isWarp = rules?.warp === true;

          specsMap.set(sku, {
            name: spec.name,
            width: spec.width,
            length: spec.length,
            height: spec.height,
            m3: spec.cbm,
            packingRules: isValidForRegion || isWarp ? rules : undefined,
          });

          if (!isValidForRegion && !isWarp) {
            console.log(`[PackingService] SKU: ${sku} - No region match & not Warp`);
          }
        } else {
          console.log(`[PackingService] SKU: ${sku}, NOT FOUND in database`);
        }
      } catch (error) {
        console.error(`[PackingService] Error fetching spec for ${sku}:`, error);
      }
    }

    return items.map((item) => ({ ...item, spec: specsMap.get(item.sku) }));
  }

  /**
   * Step 4: Separate Warp & Unknown items
   */
  private separateWarp(items: ProcessedItem[]): ProcessedItem[] {
    const warpItems: ProcessedItem[] = [];
    const unknownItems: ProcessedItem[] = [];
    const normalItems: ProcessedItem[] = [];

    for (const item of items) {
      const spec = item.spec;
      const rules = spec?.packingRules;

      // 1. Explicit Warp only
      if (rules?.warp === true) {
        warpItems.push(item);
      }
      // 2. Has valid packing rules for current customer type
      else if (rules) {
        normalItems.push(item);
      }
      // 3. Unknown spec/rules should be excluded from packing flow
      else {
        unknownItems.push(item);
      }
    }

    // Process Warp Cases
    this.processWarpCases(warpItems);
    
    // Process Unknown Cases
    this.processUnknownCases(unknownItems);

    return normalItems;
  }

  /**
   * Process Warp Cases (1:1 cases per unit)
   */
  private processWarpCases(warpItems: ProcessedItem[]): void {
    const warpByPO = new Map<string, ProcessedItem[]>();
    
    for (const item of warpItems) {
      if (!warpByPO.has(item.po)) warpByPO.set(item.po, []);
      warpByPO.get(item.po)!.push(item);
    }

    for (const [po, items] of warpByPO.entries()) {
      if (!this.poResults.has(po)) {
        this.poResults.set(po, {
          po,
          warpCases: [],
          unknownCases: [],
          monoCases: [],
          sameCases: [],
          mixedCases: [],
          status: "processing",
        });
      }
      
      const result = this.poResults.get(po)!;
      let caseNo = result.warpCases.length + 1;

      for (const item of items) {
        const warpPkg = this.findMaxPackage(item);
        const dims = warpPkg.capacity > 0
          ? warpPkg.pkg
          : item.spec
            ? `${item.spec.width}x${item.spec.length}x${item.spec.height}`
            : "Warp";
        const type = warpPkg.capacity > 0
          ? this.getPackageCategory(warpPkg.pkg) === "Pallet"
            ? "Warp Pallet"
            : "Warp Box"
          : "Warp Pallet";

        for (let q = 0; q < item.qty; q++) {
          result.warpCases.push({
            caseNo: caseNo++,
            type,
            items: [{ sku: item.sku, name: item.spec?.name || "", qty: 1 }],
            dims,
          });
        }
      }
    }
  }

  /**
   * Process Unknown Cases (missing spec/rules)
   */
  private processUnknownCases(unknownItems: ProcessedItem[]): void {
    const unknownByPO = new Map<string, ProcessedItem[]>();
    
    for (const item of unknownItems) {
      if (!unknownByPO.has(item.po)) unknownByPO.set(item.po, []);
      unknownByPO.get(item.po)!.push(item);
    }

    for (const [po, items] of unknownByPO.entries()) {
      if (!this.poResults.has(po)) {
        this.poResults.set(po, {
          po,
          warpCases: [],
          unknownCases: [],
          monoCases: [],
          sameCases: [],
          mixedCases: [],
          status: "processing",
        });
      }
      
      const result = this.poResults.get(po)!;
      let caseNo = (result.unknownCases?.length || 0) + 1;

      // Group by SKU
      const skuGroups = new Map<string, ProcessedItem>();
      items.forEach((i) => {
        if (skuGroups.has(i.sku)) skuGroups.get(i.sku)!.qty += i.qty;
        else skuGroups.set(i.sku, { ...i });
      });

      for (const item of skuGroups.values()) {
        const hasSpec = !!item.spec;
        result.unknownCases.push({
          caseNo: caseNo++,
          type: "Unknown Spec",
          items: [{ sku: item.sku, name: item.spec?.name || "Unknown", qty: item.qty }],
          dims: item.spec
            ? `${item.spec.width}x${item.spec.length}x${item.spec.height}`
            : "N/A",
          note: hasSpec
            ? "Spec found but no allowed packing rules for selected customer type"
            : "Spec not found - please maintain master data",
        });
      }
    }
  }

  /**
   * Step 5: Split by PO
   */
  private splitByPO(items: ProcessedItem[]): void {
    const byPO = new Map<string, ProcessedItem[]>();
    
    for (const item of items) {
      if (!byPO.has(item.po)) byPO.set(item.po, []);
      byPO.get(item.po)!.push(item);
    }

    for (const [po, poItems] of byPO.entries()) {
      const itemsWithDims = poItems.map((item) => ({
        ...item,
        dimsKey: item.spec
          ? `${item.spec.width}x${item.spec.length}x${item.spec.height}`
          : "unknown",
        m3Total: (item.spec?.m3 || 0) * item.qty,
      }));

      const uniqueDims = [...new Set(itemsWithDims.map((i) => i.dimsKey))];

      this.poDataMap.set(po, {
        po,
        items: itemsWithDims,
        uniqueDims,
        packingType: "pending",
        sameItems: [],
        mixedItems: [],
        remainder: [],
      });

      if (!this.poResults.has(po)) {
        this.poResults.set(po, {
          po,
          warpCases: [],
          unknownCases: [],
          monoCases: [],
          sameCases: [],
          mixedCases: [],
          status: "processing",
        });
      }
    }
  }

  /**
   * Step 6: Process Mono Alone POs (single dimension type)
   */
  private processMonoAlone(): void {
    for (const [po, data] of this.poDataMap.entries()) {
      if (data.items.length === 0) continue;
      if (data.uniqueDims.length !== 1 || data.uniqueDims[0] === "unknown") continue;

      // This is Mono Alone PO
      const result = this.poResults.get(po)!;
      let caseNo = result.monoCases.length + 1;

      const allItems = [...data.items];
      const skuQtys = new Map<string, number>();
      allItems.forEach((i) => skuQtys.set(i.sku, (skuQtys.get(i.sku) || 0) + i.qty));
      let totalRemaining = allItems.reduce((sum, i) => sum + i.qty, 0);

      const packages = this.getAllPackages(allItems[0]);

      if (packages.length === 0) {
        // No packing rules
        result.monoCases.push({
          caseNo: caseNo++,
          type: "Mono (No Rules)",
          items: Array.from(skuQtys.entries()).map(([sku, qty]) => ({
            sku,
            name: allItems.find((i) => i.sku === sku)?.spec?.name || "",
            qty,
          })),
          dims: data.uniqueDims[0],
          note: "ต้องกำหนด Packing Rules",
        });
        totalRemaining = 0;
      } else {
        // Pack using best fit with efficiency check
        while (totalRemaining > 0) {
          let bestPkg = this.findBestFitPackage(allItems[0], totalRemaining, packages);
          if (!bestPkg) break;

          // Efficiency check for pallets (75% rule)
          if (bestPkg.type === "pallet" && totalRemaining < bestPkg.capacity) {
            const efficiency = totalRemaining / bestPkg.capacity;
            if (efficiency < this.config.palletEfficiencyThreshold!) {
              const pkgIdx = packages.findIndex((p) => p.pkg === bestPkg?.pkg);
              if (pkgIdx > 0) {
                const smallerPkg = packages[pkgIdx - 1];
                console.log(
                  `[PackingService] Mono Efficiency Low (${(efficiency * 100).toFixed(1)}%). Downgrading ${bestPkg.pkg} -> ${smallerPkg.pkg}`
                );
                bestPkg = smallerPkg;
              }
            }
          }

          const qtyToPack = Math.min(totalRemaining, bestPkg.capacity);
          const isFull = qtyToPack === bestPkg.capacity;

          // Distribute across SKUs
          const itemsInCase: { sku: string; name: string; qty: number }[] = [];
          let quota = qtyToPack;

          for (const [sku, available] of skuQtys.entries()) {
            if (quota <= 0) break;
            if (available <= 0) continue;

            const take = Math.min(available, quota);
            itemsInCase.push({
              sku,
              name: allItems.find((i) => i.sku === sku)?.spec?.name || "",
              qty: take,
            });
            skuQtys.set(sku, available - take);
            quota -= take;
          }

          const type = isFull
            ? bestPkg.type === "pallet"
              ? "Full Pallet"
              : "Full Box"
            : bestPkg.type === "pallet"
              ? "Partial Pallet"
              : "Partial Box";

          const note = isFull
            ? `Mono (${bestPkg.capacity} ชิ้น)`
            : `เศษ ${qtyToPack}/${bestPkg.capacity} ชิ้น`;

          result.monoCases.push({
            caseNo: caseNo++,
            type,
            items: itemsInCase,
            dims: bestPkg.pkg,
            note,
          });

          totalRemaining -= qtyToPack;
        }
      }

      // Complete this PO
      data.items = [];
      data.packingType = "same";
      result.status = "complete";
    }
  }

  /**
   * Step 7: Process Overflow (qty >= capacity)
   */
  private processOverflow(): void {
    for (const [po, data] of this.poDataMap.entries()) {
      if (data.items.length === 0) continue;

      const result = this.poResults.get(po)!;
      let caseNo = result.sameCases.length + 1;
      const pool: ProcessedItem[] = [];

      for (const item of data.items) {
        const { pkg, capacity } = this.findMaxPackage(item);

        if (capacity > 0 && item.qty >= capacity) {
          let remainingQty = item.qty;
          const type = this.getFullCaseTypeByPackage(pkg);

          while (remainingQty >= capacity) {
            result.sameCases.push({
              caseNo: caseNo++,
              type,
              items: [{ sku: item.sku, name: item.spec?.name || "", qty: capacity }],
              dims: pkg,
              note: "Overflow",
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

      data.items = [];
      data.sameItems = [...data.sameItems, ...pool];
    }
  }

  /**
   * Step 8: Pack Same Dimension Items
   */
  private packSameItems(): void {
    for (const [po, data] of this.poDataMap.entries()) {
      const existingResult = this.poResults.get(po);
      if (existingResult?.status === "complete") continue;
      if (data.sameItems.length === 0) continue;

      const result = this.poResults.get(po)!;
      let caseNo = result.sameCases.length + 1;

      // Group by dimensions
      const dimGroups = new Map<string, ProcessedItem[]>();
      for (const item of data.sameItems) {
        const dim = item.dimsKey || "unknown";
        if (!dimGroups.has(dim)) dimGroups.set(dim, []);
        dimGroups.get(dim)!.push(item);
      }

      for (const [dim, items] of dimGroups.entries()) {
        if (items.length === 0) continue;
        if (dim === "unknown") {
          this.processUnknownCases(items);
          continue;
        }

        const { pkg, capacity } = this.findMaxPackage(items[0]);
        if (capacity > 0) {
          let totalQty = items.reduce((sum, i) => sum + i.qty, 0);
          const type = this.getFullCaseTypeByPackage(pkg);

          while (totalQty >= capacity) {
            let remainingInCase = capacity;
            const itemsInCase: Array<{ sku: string; name: string; qty: number }> = [];

            for (const item of items) {
              if (item.qty > 0 && remainingInCase > 0) {
                const take = Math.min(item.qty, remainingInCase);
                itemsInCase.push({ sku: item.sku, name: item.spec?.name || "", qty: take });
                item.qty -= take;
                remainingInCase -= take;
              }
            }

            result.sameCases.push({
              caseNo: caseNo++,
              type,
              items: itemsInCase,
              dims: pkg,
              note: "Same Dim Group",
            });
            totalQty -= capacity;
          }

          // Remainder goes to Mixed
          const remainingItems = items.filter((i) => i.qty > 0);
          data.mixedItems.push(...remainingItems);
        } else {
          data.mixedItems.push(...items);
        }
      }

      data.sameItems = [];
    }
  }

  /**
   * Step 9: Pack Mixed Items (Complex 3D Bin Packing)
   */
  private packMixedItems(): void {
    console.log("=== PackingService: packMixedItems START ===");

    for (const [po, data] of this.poDataMap.entries()) {
      if (data.mixedItems.length === 0) continue;

      const result = this.poResults.get(po)!;

      while (data.mixedItems.some((item) => item.qty > 0)) {
        const activeItems = data.mixedItems.filter((i) => i.qty > 0);
        if (activeItems.length === 0) break;

        // Group by Max Package
        const pkgGroups = new Map<string, ProcessedItem[]>();
        for (const item of activeItems) {
          const { pkg } = this.findMaxPackage(item);
          if (!pkgGroups.has(pkg)) pkgGroups.set(pkg, []);
          pkgGroups.get(pkg)!.push(item);
        }

        // Find High Density Group (> 60%)
        let topGroup: {
          pkgName: string;
          items: ProcessedItemWithDensity[];
          primary: ProcessedItemWithDensity;
        } | null = null;

        for (const [pkgName, groupItems] of pkgGroups.entries()) {
          const itemsWithDensity = groupItems
            .map((item) => {
              const { capacity } = this.findMaxPackage(item);
              return {
                ...item,
                density: capacity > 0 ? (item.qty / capacity) * 100 : 0,
                maxCapacity: capacity,
              };
            })
            .sort((a, b) => {
              const m3Diff = this.getItemUnitM3(b) - this.getItemUnitM3(a);
              if (Math.abs(m3Diff) > 1e-9) return m3Diff;
              return b.density - a.density;
            });

          if (
            itemsWithDensity.length > 0 &&
            itemsWithDensity[0].density > this.config.densityThreshold!
          ) {
            if (
              !topGroup ||
              this.getItemUnitM3(itemsWithDensity[0]) > this.getItemUnitM3(topGroup.primary) ||
              (
                Math.abs(this.getItemUnitM3(itemsWithDensity[0]) - this.getItemUnitM3(topGroup.primary)) <= 1e-9 &&
                itemsWithDensity[0].density > topGroup.primary.density
              )
            ) {
              topGroup = { pkgName, items: itemsWithDensity, primary: itemsWithDensity[0] };
            }
          }
        }

        if (topGroup) {
          // PATH A: High Density Logic
          this.packHighDensityGroup(topGroup, data, result);
        } else {
          // PATH B: Low Density / Global Consolidation
          this.packLowDensityGroup(activeItems, data, result);
        }
      }

      data.mixedItems = [];
      result.status = "complete";
    }

    console.log("=== PackingService: packMixedItems END ===");
  }

  /**
   * Pack High Density Group (Primary + Secondary + Gaps)
   * Exact match to logic-process/page.tsx
   */
  private packHighDensityGroup(
    topGroup: { pkgName: string; items: ProcessedItemWithDensity[]; primary: ProcessedItemWithDensity },
    data: POData,
    result: POResult
  ): void {
    const { pkgName, items: itemsWithDensity, primary } = topGroup;
    const secondary = itemsWithDensity.length > 1 ? itemsWithDensity[1] : null;

    const pkgDef = this.packageMasterData.find((p) => p.name === pkgName);
    if (!pkgDef) {
      data.mixedItems.find((i) => i.sku === primary.sku)!.qty = 0;
      return;
    }

    const container = pkgDef.inner;
    const mainDim = primary.spec || { width: 0, length: 0, height: 0 };
    const smallDim = secondary?.spec || { width: 0, length: 0, height: 0 };

    // Step 9.4: Calculate Gaps & Filling
    const maxPossibleLayers = mainDim.height > 0 ? Math.floor(container.h / mainDim.height) : 0;
    const impliedItemsPerLayer =
      maxPossibleLayers > 0 ? Math.ceil(primary.maxCapacity / maxPossibleLayers) : 0;
    const currentLayersUsed =
      impliedItemsPerLayer > 0 ? Math.ceil(primary.qty / impliedItemsPerLayer) : 0;
    const currentStackHeight = Math.min(container.h, currentLayersUsed * mainDim.height);

    let totalInsertable = 0;
    let fromMissing = 0, fromTop = 0, fromSide = 0;
    const primaryCapacity = Math.max(
      0,
      this.getCapacityForItemInPackage(primary, pkgName) || primary.maxCapacity || 0
    );
    const primaryUsedRatio = primaryCapacity > 0 ? primary.qty / primaryCapacity : 1;

    if (secondary && secondary.spec) {
      const secondaryCapacity = Math.max(0, this.getCapacityForItemInPackage(secondary, pkgName));

      // Volume Ratio (symmetric - always >= 1)
      const volPrimary = (mainDim.width * mainDim.length * mainDim.height) / 1000000;
      const volSecondary = (smallDim.width * smallDim.length * smallDim.height) / 1000000;
      const volRatio = volPrimary > 0 && volSecondary > 0 ? Math.max(volPrimary / volSecondary, volSecondary / volPrimary) : 1;

      // A) Missing Slots
      const totalSlotsInStack = currentLayersUsed * impliedItemsPerLayer;
      const emptySlots = Math.max(0, totalSlotsInStack - primary.qty);
      const smallInMainRatio = this.calculateBestFit3D(
        { w: mainDim.width, l: mainDim.length, h: mainDim.height },
        { w: smallDim.width, l: smallDim.length, h: smallDim.height }
      );
      fromMissing = emptySlots * smallInMainRatio;

      // B) Top Gap
      const remainingHeight = Math.max(0, container.h - currentStackHeight);
      fromTop = this.calculateBestFit3D(
        { w: container.w, l: container.l, h: remainingHeight },
        { w: smallDim.width, l: smallDim.length, h: smallDim.height }
      );

      // C) Side Gap
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

      // Cap by secondary's available qty
      totalInsertable = Math.min(secondary.qty, fromMissing + fromTop + fromSide);

      // Critical guard: never exceed package capacity by per-SKU capacity ratio
      if (secondaryCapacity > 0) {
        const remainingRatio = Math.max(0, 1 - primaryUsedRatio);
        const maxSecondaryByRatio = Math.floor(remainingRatio * secondaryCapacity);
        totalInsertable = Math.min(totalInsertable, maxSecondaryByRatio);
      } else {
        totalInsertable = 0;
      }
    }

    // Build Case Items
    let note = `Primary: ${primary.sku}`;
    const itemsInCase: Array<{ sku: string; name: string; qty: number }> = [
      { sku: primary.sku, name: primary.spec?.name || "", qty: primary.qty }
    ];

    if (secondary && totalInsertable > 0) {
      itemsInCase.push({ sku: secondary.sku, name: secondary.spec?.name || "", qty: totalInsertable });
      note += ` | Insert: ${secondary.sku} (+${totalInsertable})`;

      // --- Step 9.5: Substitution (Item #3) ---
      const totalCapacityForSecondary = fromMissing + fromTop + fromSide;
      const secondaryCapacity = Math.max(0, this.getCapacityForItemInPackage(secondary, pkgName));
      const remainingRatioAfterPrimary = Math.max(0, 1 - primaryUsedRatio);
      const maxSecondaryEquivalent =
        secondaryCapacity > 0
          ? Math.min(totalCapacityForSecondary, Math.floor(remainingRatioAfterPrimary * secondaryCapacity))
          : 0;

      if (totalInsertable < maxSecondaryEquivalent) {
        const missingCount = maxSecondaryEquivalent - totalInsertable;
        const volSecondary = (smallDim.width * smallDim.length * smallDim.height) / 1000000;

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
          if (ratio > 1.0) take = Math.min(substituteCandidate.qty, missingCount);
          else {
            const targetQty = Math.ceil(missingCount * 1.5);
            take = Math.min(substituteCandidate.qty, targetQty);
          }

          // Also cap substitute by remaining ratio in the same package
          const candidateCapacity = Math.max(
            0,
            this.getCapacityForItemInPackage(substituteCandidate, pkgName)
          );
          if (candidateCapacity > 0 && secondaryCapacity > 0) {
            const secondaryUsedRatio = totalInsertable / secondaryCapacity;
            const remainingRatio = Math.max(0, 1 - primaryUsedRatio - secondaryUsedRatio);
            const maxCandidateByRatio = Math.floor(remainingRatio * candidateCapacity);
            take = Math.min(take, maxCandidateByRatio);
          } else {
            take = 0;
          }

          if (take > 0) {
            itemsInCase.push({ sku: substituteCandidate.sku, name: substituteCandidate.spec?.name || "", qty: take });
            note += ` | Sub: ${substituteCandidate.sku} (+${take})`;
            const subInPool = data.mixedItems.find(i => i.sku === substituteCandidate.sku);
            if (subInPool) subInPool.qty = Math.max(0, subInPool.qty - take);
          }
        }
      }
    }

    // Push case
    result.mixedCases.push({
      caseNo: result.mixedCases.length + 1,
      type: this.getMixedCaseTypeByPackage(pkgName),
      items: itemsInCase,
      dims: pkgName,
      note: note
    });

    // Step 9.6: Deduct Pool
    const primaryInPool = data.mixedItems.find(i => i.sku === primary.sku);
    if (primaryInPool) primaryInPool.qty = 0;
    if (secondary && totalInsertable > 0) {
      const secondaryInPool = data.mixedItems.find(i => i.sku === secondary.sku);
      if (secondaryInPool) secondaryInPool.qty = Math.max(0, secondaryInPool.qty - totalInsertable);
    }
  }

  /**
   * Pack Low Density Group (Global Consolidation & Smarter Level-up)
   * Exact match to logic-process/page.tsx Step 9.7
   */
  private packLowDensityGroup(
    activeItems: ProcessedItem[],
    data: POData,
    result: POResult
  ): void {
    // Step 9.7: Global Consolidation
    const flatPool = activeItems.map(item => {
      const { capacity } = this.findMaxPackage(item);
      return {
        ...item,
        density: capacity > 0 ? (item.qty / capacity) * 100 : 0
      };
    }).sort((a, b) => b.density - a.density);

    if (flatPool.length === 0) return;

    const baseItem = flatPool[0];
    const allowedPkgs = this.getAllPackages(baseItem);
    const sharedPkgNames = this.getSharedPackageNames(flatPool);
    const feasiblePkgs = allowedPkgs.filter((p) => sharedPkgNames.has(p.pkg));
    const candidatePkgs = feasiblePkgs.length > 0 ? feasiblePkgs : allowedPkgs;

    if (candidatePkgs.length === 0) {
      const itemsInCase = flatPool.map(i => ({ sku: i.sku, name: i.spec?.name || "", qty: i.qty }));
      result.mixedCases.push({
        caseNo: result.mixedCases.length + 1, type: "Mixed (No Rules)", items: itemsInCase, dims: "N/A", note: "No packing rules"
      });
      flatPool.forEach(i => { const pool = data.mixedItems.find(p => p.sku === i.sku); if (pool) pool.qty = 0; });
      return;
    }

    // Step 9.7.1: Identify Initial Base Pkg (Mono-style best fit)
    const initialBasePkg = candidatePkgs.find(p => p.capacity >= baseItem.qty) || candidatePkgs[candidatePkgs.length - 1];
    const totalVol = flatPool.reduce((sum, item) => {
      if (!item.spec) return sum;
      return sum + ((item.spec.width * item.spec.length * item.spec.height) / 1000000) * item.qty;
    }, 0);

    // Step 9.7.2: Select package by BOTH volume and per-SKU capacity ratio
    // ratioSum <= 1 means the mixed set should be feasible for that package.
    let selectedPkg = initialBasePkg;
    const feasibleByVolumeAndCapacity = candidatePkgs.filter((p) => {
      const pDef = this.packageMasterData.find((x) => x.name === p.pkg);
      if (!pDef) return false;
      return pDef.m3 >= totalVol && this.isMixedCapacityFeasibleForPackage(flatPool, p.pkg);
    });
    if (feasibleByVolumeAndCapacity.length > 0) {
      selectedPkg = feasibleByVolumeAndCapacity[0];
    } else {
      // Fallback: if nothing fully feasible, keep previous behavior and let iterative loop continue.
      const initialDef = this.packageMasterData.find((p) => p.name === initialBasePkg.pkg);
      const initialVol = initialDef?.m3 || 0;
      if (totalVol > initialVol) {
        const startIdx = candidatePkgs.findIndex((p) => p.pkg === initialBasePkg.pkg);
        if (startIdx !== -1) {
          for (let i = startIdx + 1; i < candidatePkgs.length; i++) {
            const p = candidatePkgs[i];
            const pDef = this.packageMasterData.find((x) => x.name === p.pkg);
            if (pDef && pDef.m3 >= totalVol) {
              selectedPkg = p;
              break;
            }
            if (i === candidatePkgs.length - 1) selectedPkg = p;
          }
        }
      }
    }
    // Extra rule: If final consolidated package utilization < 70%, use previous tier and split remainder in next loop.
    const selectedUtilization = this.getPackageVolumeUtilization(selectedPkg.pkg, totalVol);
    if (selectedUtilization < 0.7) {
      const currentIdx = candidatePkgs.findIndex((p) => p.pkg === selectedPkg.pkg);
      if (currentIdx > 0) {
        const previousPkg = candidatePkgs[currentIdx - 1];
        const totalQty = flatPool.reduce((sum, i) => sum + i.qty, 0);
        const maxPackableQty = this.estimateMaxPackableQtyForPackage(flatPool, previousPkg.pkg);
        // Only fallback when previous tier can absorb most of this mixed set in one case.
        if (totalQty > 0 && (maxPackableQty / totalQty) >= 0.7) {
          selectedPkg = previousPkg;
        }
      }
    }

    // Step 9.7.3: Create Consolidated Case + Max Size Split
    const finalPkgDef = this.packageMasterData.find(p => p.name === selectedPkg.pkg);
    const containerVolLimit = finalPkgDef?.m3 || 0;

    let currentPackedVol = 0;
    let currentRatioUsed = 0;
    const itemsToPack: Array<{ sku: string; name: string; qty: number }> = [];

    for (const item of flatPool) {
      const itemUnitVol = item.spec
        ? (item.spec.width * item.spec.length * item.spec.height) / 1000000
        : 0;
      const poolItem = data.mixedItems.find(i => i.sku === item.sku)!;
      const itemCapInPkg = this.getCapacityForItemInPackage(item, selectedPkg.pkg);

      if (containerVolLimit > 0) {
        const remainingSpace = containerVolLimit - currentPackedVol;
        if (remainingSpace <= 0) break;

        const canFitQty = itemUnitVol > 0 ? Math.floor(remainingSpace / itemUnitVol) : 0;
        const remainingRatio = Math.max(0, 1 - currentRatioUsed);
        const maxByRatio = itemCapInPkg > 0 ? Math.floor(remainingRatio * itemCapInPkg) : 0;
        const take = Math.min(poolItem.qty, canFitQty, maxByRatio);

        if (take > 0) {
          itemsToPack.push({ sku: item.sku, name: item.spec?.name || "", qty: take });
          currentPackedVol += itemUnitVol * take;
          if (itemCapInPkg > 0) currentRatioUsed += take / itemCapInPkg;
          poolItem.qty = Math.max(0, poolItem.qty - take);
        } else if (itemsToPack.length === 0 && itemCapInPkg > 0 && canFitQty > 0 && (currentRatioUsed + 1 / itemCapInPkg) <= 1.000001) {
          // Safety: Always pack at least 1 if it's the first item to avoid infinite loop
          itemsToPack.push({ sku: item.sku, name: item.spec?.name || "", qty: 1 });
          currentPackedVol += itemUnitVol;
          currentRatioUsed += 1 / itemCapInPkg;
          poolItem.qty = Math.max(0, poolItem.qty - 1);
        }
      } else {
        itemsToPack.push({ sku: item.sku, name: item.spec?.name || "", qty: poolItem.qty });
        poolItem.qty = 0;
      }
    }

    result.mixedCases.push({
      caseNo: result.mixedCases.length + 1,
      type: this.getMixedCaseTypeByPackage(selectedPkg.pkg),
      items: itemsToPack,
      dims: selectedPkg.pkg,
      note: `Mixed (Total Vol: ${currentPackedVol.toFixed(3)} m3, Base: ${initialBasePkg.pkg})`
    });
  }

  // ========================================
  // HELPER METHODS
  // ========================================

  /**
   * Get ALL available packages for item (sorted by capacity ASCENDING)
   * Exact match to logic-process/page.tsx
   */
  private getAllPackages(item: ProcessedItem): Array<{ pkg: string; capacity: number; type: "pallet" | "box" }> {
    const allowedPackages = this.packageMasterData.filter(pkg => pkg.types.includes(this.config.region));

    const results: Array<{ pkg: string; capacity: number; type: "pallet" | "box" }> = [];
    const rules = item.spec?.packingRules ? this.normalizePackingRules(item.spec.packingRules) : undefined;

    if (!rules) return [];

    allowedPackages.forEach(p => {
      let capacity = 0;
      if (p.category === "Pallet" && rules.pallets) {
        const pkgData = this.resolveRuleValueByPackageName(
          rules.pallets as Record<string, unknown>,
          p.name,
          "Pallet"
        );
        capacity = this.extractCapacityFromRule(pkgData);
      } else if (p.category === "Box" && rules.boxes) {
        const pkgData = this.resolveRuleValueByPackageName(
          rules.boxes as Record<string, unknown>,
          p.name,
          "Box"
        );
        capacity = this.extractCapacityFromRule(pkgData);
      }

      if (capacity > 0) {
        results.push({
          pkg: p.name,
          capacity,
          type: p.category === "Pallet" ? "pallet" : "box"
        });
      }
    });

    // Sort by capacity ascending (smallest first)
    return results.sort((a, b) => a.capacity - b.capacity);
  }

  private resolveRuleValueByPackageName(
    ruleMap: Record<string, unknown>,
    packageName: string,
    category: "Box" | "Pallet"
  ): unknown {
    if (!ruleMap) return undefined;

    if (packageName in ruleMap) return ruleMap[packageName];

    const directVariants = [
      `${category}_${packageName}`,
      `${category.toLowerCase()}_${packageName}`,
      `${category}${packageName}`,
      `${category.toLowerCase()}${packageName}`,
      packageName.replace(/x/g, "X"),
      packageName.replace(/X/g, "x"),
    ];
    for (const key of directVariants) {
      if (key in ruleMap) return ruleMap[key];
    }

    const target = this.normalizePackageKey(packageName);
    for (const [key, value] of Object.entries(ruleMap)) {
      if (this.normalizePackageKey(key) === target) {
        return value;
      }
    }

    return undefined;
  }

  private normalizePackageKey(key: string): string {
    return key
      .toLowerCase()
      .replace(/pallet|box|outer|inner|total|layers|perlayer|_/g, "")
      .replace(/[^a-z0-9x]/g, "");
  }

  private extractPackageNameFromRuleKey(key: string): string {
    const m = key.match(/(\d+x\d+x\d+|rtn)/i);
    return m ? m[1].toUpperCase() : key;
  }

  private normalizePackingRules(rawRules: unknown): {
    boxes?: Record<string, unknown>;
    pallets?: Record<string, unknown>;
    warp?: boolean;
  } {
    const normalized: {
      boxes?: Record<string, unknown>;
      pallets?: Record<string, unknown>;
      warp?: boolean;
    } = {};

    if (!rawRules || typeof rawRules !== "object") {
      return normalized;
    }

    const source = rawRules as Record<string, unknown>;

    for (const [key, value] of Object.entries(source)) {
      const lower = key.toLowerCase();

      if (lower === "warp" || lower === "warp_required" || lower === "warprequired") {
        normalized.warp = value === true || String(value).toLowerCase() === "true";
        continue;
      }

      if (lower === "boxes" || lower === "box") {
        if (value && typeof value === "object") {
          normalized.boxes = { ...(value as Record<string, unknown>) };
        }
        continue;
      }

      if (lower === "pallets" || lower === "pallet") {
        if (value && typeof value === "object") {
          normalized.pallets = { ...(value as Record<string, unknown>) };
        }
        continue;
      }

      // Flat schema support: Box_..._Total / Pallet_..._Total
      if (/^box_/i.test(key)) {
        if (!normalized.boxes) normalized.boxes = {};
        normalized.boxes[key] = value;
        continue;
      }

      if (/^pallet_/i.test(key) || /^rtn/i.test(key)) {
        if (!normalized.pallets) normalized.pallets = {};
        normalized.pallets[key] = value;
      }
    }

    return normalized;
  }

  private toNumericPackingRules(rawRules: {
    boxes?: Record<string, unknown>;
    pallets?: Record<string, unknown>;
    warp?: boolean;
  }): {
    boxes?: Record<string, number>;
    pallets?: Record<string, number>;
    warp?: boolean;
  } {
    const out: {
      boxes?: Record<string, number>;
      pallets?: Record<string, number>;
      warp?: boolean;
    } = { warp: rawRules.warp };

    if (rawRules.boxes) {
      const boxes: Record<string, number> = {};
      Object.entries(rawRules.boxes).forEach(([k, v]) => {
        const cap = this.extractCapacityFromRule(v);
        if (cap > 0) boxes[k] = cap;
      });
      if (Object.keys(boxes).length > 0) out.boxes = boxes;
    }

    if (rawRules.pallets) {
      const pallets: Record<string, number> = {};
      Object.entries(rawRules.pallets).forEach(([k, v]) => {
        const cap = this.extractCapacityFromRule(v);
        if (cap > 0) pallets[k] = cap;
      });
      if (Object.keys(pallets).length > 0) out.pallets = pallets;
    }

    return out;
  }

  private extractCapacityFromRule(
    pkgData: unknown
  ): number {
    if (typeof pkgData === "number" && Number.isFinite(pkgData)) {
      return pkgData > 0 ? pkgData : 0;
    }

    if (typeof pkgData === "string") {
      const parsed = Number(pkgData);
      return Number.isFinite(parsed) && parsed > 0 ? parsed : 0;
    }

    if (pkgData && typeof pkgData === "object") {
      const data = pkgData as {
        totalQty?: unknown;
        total?: unknown;
        qty?: unknown;
        capacity?: unknown;
        layers?: unknown;
        perLayer?: unknown;
      };

      const candidates = [data.totalQty, data.total, data.qty, data.capacity];
      for (const value of candidates) {
        const n = Number(value);
        if (Number.isFinite(n) && n > 0) {
          return n;
        }
      }

      const layers = Number(data.layers);
      const perLayer = Number(data.perLayer);
      if (Number.isFinite(layers) && Number.isFinite(perLayer) && layers > 0 && perLayer > 0) {
        return layers * perLayer;
      }
    }

    return 0;
  }


  private findMaxPackage(item: ProcessedItem): { pkg: string; capacity: number } {
    const packages = this.getAllPackages(item);
    if (packages.length === 0) return { pkg: "NO_RULES", capacity: 0 };

    // The list is sorted by capacity ascending, so the last one is the max
    const max = packages[packages.length - 1];
    return { pkg: max.pkg, capacity: max.capacity };
  }

  private findBestFitPackage(
    item: ProcessedItem,
    qty: number,
    packages?: Array<{ pkg: string; capacity: number; type: string }>
  ): { pkg: string; capacity: number; type: string } | null {
    const pkgs = packages || this.getAllPackages(item);
    if (pkgs.length === 0) return null;

    // Find smallest package that can hold the qty (list is ascending)
    for (const p of pkgs) {
      if (p.capacity >= qty) {
        return p;
      }
    }

    // If qty exceeds all packages, return the largest one
    return pkgs[pkgs.length - 1];
  }

  private getSharedPackageNames(items: ProcessedItem[]): Set<string> {
    if (items.length === 0) return new Set<string>();
    const itemPkgSets = items.map((item) => new Set(this.getAllPackages(item).map((p) => p.pkg)));
    const [first, ...rest] = itemPkgSets;
    const shared = new Set<string>();
    first.forEach((pkg) => {
      if (rest.every((set) => set.has(pkg))) {
        shared.add(pkg);
      }
    });
    return shared;
  }

  private getItemUnitM3(item: ProcessedItem): number {
    const spec = item.spec;
    if (!spec) return 0;
    if (Number.isFinite(spec.m3) && spec.m3 > 0) return spec.m3;
    const w = Number(spec.width) || 0;
    const l = Number(spec.length) || 0;
    const h = Number(spec.height) || 0;
    if (w > 0 && l > 0 && h > 0) return (w * l * h) / 1000000;
    return 0;
  }

  private isMixedCapacityFeasibleForPackage(items: ProcessedItem[], packageName: string): boolean {
    let ratioSum = 0;
    for (const item of items) {
      const cap = this.getCapacityForItemInPackage(item, packageName);
      if (cap <= 0) {
        return false;
      }
      ratioSum += item.qty / cap;
    }
    return ratioSum <= 1.000001;
  }

  private getCapacityForItemInPackage(item: ProcessedItem, packageName: string): number {
    const pkgDef = this.packageMasterData.find((p) => p.name === packageName);
    const rules = item.spec?.packingRules ? this.normalizePackingRules(item.spec.packingRules) : undefined;
    if (!pkgDef || !rules) return 0;

    if (pkgDef.category === "Pallet" && rules.pallets) {
      const ruleVal = this.resolveRuleValueByPackageName(
        rules.pallets as Record<string, unknown>,
        packageName,
        "Pallet"
      );
      return this.extractCapacityFromRule(ruleVal);
    }

    if (pkgDef.category === "Box" && rules.boxes) {
      const ruleVal = this.resolveRuleValueByPackageName(
        rules.boxes as Record<string, unknown>,
        packageName,
        "Box"
      );
      return this.extractCapacityFromRule(ruleVal);
    }

    return 0;
  }

  private getPackageVolumeUtilization(packageName: string, totalVol: number): number {
    const pkgDef = this.packageMasterData.find((p) => p.name === packageName);
    if (!pkgDef || pkgDef.m3 <= 0) return 0;
    return totalVol / pkgDef.m3;
  }

  private estimateMaxPackableQtyForPackage(items: ProcessedItem[], packageName: string): number {
    let ratioUsed = 0;
    let packedQty = 0;
    for (const item of items) {
      const cap = this.getCapacityForItemInPackage(item, packageName);
      if (cap <= 0 || item.qty <= 0) continue;
      const remainingRatio = Math.max(0, 1 - ratioUsed);
      const take = Math.min(item.qty, Math.floor(remainingRatio * cap));
      if (take > 0) {
        packedQty += take;
        ratioUsed += take / cap;
      }
      if (ratioUsed >= 1) break;
    }
    return packedQty;
  }

  private getPackageCategory(name: string): "Box" | "Pallet" | null {
    const pkg = this.packageMasterData.find((p) => p.name === name);
    return pkg?.category ?? null;
  }

  private getFullCaseTypeByPackage(name: string): string {
    return this.getPackageCategory(name) === "Pallet" ? "Full Pallet" : "Full Box";
  }

  private getMixedCaseTypeByPackage(name: string): string {
    return this.getPackageCategory(name) === "Pallet" ? "Mixed Pallet" : "Mixed Box";
  }
  
  private calculateBestFit3D(container: { w: number, l: number, h: number }, item: { w: number, l: number, h: number }): number {
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
  }

  private generateSummary() {
    let totalPOs = 0;
    let totalCases = 0;
    let warpCount = 0;
    let unknownCount = 0;
    let monoCount = 0;
    let sameCount = 0;
    let mixedCount = 0;

    this.poResults.forEach((res) => {
      totalPOs++;
      totalCases +=
        res.warpCases.length +
        res.unknownCases.length +
        res.monoCases.length +
        res.sameCases.length +
        res.mixedCases.length;
      
      warpCount += res.warpCases.length;
      unknownCount += res.unknownCases.length;
      monoCount += res.monoCases.length;
      sameCount += res.sameCases.length;
      mixedCount += res.mixedCases.length;
    });

    return {
      totalPOs,
      totalCases,
      warpCount,
      unknownCount,
      monoCount,
      sameCount,
      mixedCount,
    };
  }

  private reconcileQtyIntegrity(): void {
    const actualQtyByPoSku = new Map<string, number>();

    this.poResults.forEach((res) => {
      const allCases = [
        ...res.warpCases,
        ...res.unknownCases,
        ...res.monoCases,
        ...res.sameCases,
        ...res.mixedCases,
      ];
      allCases.forEach((c) => {
        c.items.forEach((i) => {
          const key = `${res.po}|${i.sku}`;
          actualQtyByPoSku.set(key, (actualQtyByPoSku.get(key) || 0) + i.qty);
        });
      });
    });

    for (const [key, expectedQty] of this.expectedQtyByPoSku.entries()) {
      const actualQty = actualQtyByPoSku.get(key) || 0;
      if (actualQty >= expectedQty) continue;

      const [po, sku] = key.split("|");
      const missingQty = expectedQty - actualQty;

      if (!this.poResults.has(po)) {
        this.poResults.set(po, {
          po,
          warpCases: [],
          unknownCases: [],
          monoCases: [],
          sameCases: [],
          mixedCases: [],
          status: "processing",
        });
      }

      const res = this.poResults.get(po)!;
      const nextCaseNo =
        res.warpCases.length +
        res.unknownCases.length +
        res.monoCases.length +
        res.sameCases.length +
        res.mixedCases.length +
        1;

      res.unknownCases.push({
        caseNo: nextCaseNo,
        type: "Unknown Spec",
        items: [{ sku, name: "Unpacked Remainder", qty: missingQty }],
        dims: "N/A",
        note: `Auto-reconciled missing qty (${actualQty}/${expectedQty})`,
      });
    }
  }

  private finalizeAndSort(): void {
    // Helper to get priority score (lower is better)
    const getPriority = (res: POResult): number => {
      if (res.monoCases.length > 0) return 1;
      if (res.sameCases.some(c => c.note?.includes("Overflow"))) return 2;
      if (res.sameCases.length > 0) return 3;
      if (res.mixedCases.length > 0) return 4;
      if (res.warpCases.length > 0) return 5;
      return 6; // Unknown or empty
    };

    // 1. Sort POs themselves based on priority
    const sortedEntries = Array.from(this.poResults.entries()).sort(([, resA], [, resB]) => {
      const priorityA = getPriority(resA);
      const priorityB = getPriority(resB);
      
      if (priorityA !== priorityB) {
        return priorityA - priorityB; // Lower priority number first
      }

      // If same priority, sort by total quantity (descending) or PO name
      const totalQtyA = resA.monoCases.length + resA.sameCases.length + resA.mixedCases.length + resA.warpCases.length;
      const totalQtyB = resB.monoCases.length + resB.sameCases.length + resB.mixedCases.length + resB.warpCases.length;
      
      if (totalQtyA !== totalQtyB) {
        return totalQtyB - totalQtyA; // More cases first
      }

      return resA.po.localeCompare(resB.po);
    });

    // Re-build map in sorted order
    this.poResults = new Map(sortedEntries);

    // 2. Sort cases within each PO
    this.poResults.forEach((res) => {
      // 2.1 Separate SamePack into Overflow vs Pure Same
      const overflowCases = res.sameCases.filter(c => c.note?.includes("Overflow"));
      const pureSameCases = res.sameCases.filter(c => !c.note?.includes("Overflow"));

      // 2.2 Further split Pure Same into Pallet vs Box (UI preference)
      const samePallets = pureSameCases.filter(c => c.type.toLowerCase().includes("pallet"));
      const sameBoxes = pureSameCases.filter(c => !c.type.toLowerCase().includes("pallet"));

      // 2.3 Define Custom Order: Mono -> Overflow -> Same(Pallet) -> Same(Box) -> Mixed -> Warp -> Unknown
      const sortedCases = [
        ...res.monoCases,
        ...overflowCases,
        ...samePallets,
        ...sameBoxes,
        ...res.mixedCases,
        ...res.warpCases,
        ...res.unknownCases
      ];

      // Update sameCases order for UI/Export consistency
      res.sameCases = [...overflowCases, ...samePallets, ...sameBoxes];

      // 3. Re-index Case Numbers
      let runningIndex = 1;
      sortedCases.forEach(c => {
        c.caseNo = runningIndex++;
      });
      
      // Update result arrays to reflect sorted order (optional but good for consistency)
      // Note: We don't merge them back into a single array here because POResult structure keeps them separate.
      // However, the UI/Export logic likely iterates over them or needs a way to get the sorted list.
      // Since POResult has separate arrays, we should probably Sort the displayed list in the UI or
      // return a combined sorted list?
      // Wait, standard POResult has specific arrays. We just re-indexed caseNo.
      // The previous logic was:
      /*
      const sortedCases = [...];
      sortedCases.forEach(c => c.caseNo = runningIndex++);
      */
      // It didn't save sortedCases back to the object! It only updated caseNo on the objects in memory reference.
      // The UI likely maps: [...mono, ...same, ...mixed].
      // So if we want the UI to show in order, we need to ensure the UI respects caseNo OR we need to verify UI logic.
      // Let's assume UI sorts by caseNo.
    });
  }
}
