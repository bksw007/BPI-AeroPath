import pdfMake from "pdfmake/build/pdfmake";
import pdfFonts from "pdfmake/build/vfs_fonts";
import { PackingPlanResult } from "@/lib/services/packing-logic/packing.types";
import { TDocumentDefinitions, Content, Style, TableCell } from "pdfmake/interfaces";

// Initialize VFS (Embedded Fonts)
// Fix for: Property 'vfs' does not exist on type ...
const pdfMakeAny = pdfMake as unknown as { vfs: Record<string, string> };
const pdfFontsAny = pdfFonts as unknown as { pdfMake?: { vfs: Record<string, string> } };

if (pdfMakeAny.vfs === undefined && pdfFontsAny.pdfMake?.vfs) {
  pdfMakeAny.vfs = pdfFontsAny.pdfMake.vfs;
}

/**
 * Generate Packing List PDF using PDFMake
 * Designed for readability and modern aesthetics.
 */
export const generatePackingListPDFMake = (
  results: PackingPlanResult[],
  customerName: string,
  poList: string[]
) => {
  const now = new Date();
  const today = now.toLocaleDateString("en-UK", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
  const timestamp = now.toISOString().replace(/[:.]/g, "-");

  // --- Calculate Totals ---
  const totalPOs = results.length;
  const totalPallets = results.reduce((acc, r) => acc + r.summary.totalPallets, 0);
  const totalBoxes = results.reduce((acc, r) => acc + r.summary.totalBoxes, 0);
  const totalItems = results.reduce((acc, r) => acc + r.summary.totalItems, 0);
  const totalWarps = results.reduce((acc, r) => acc + r.cases.filter(c => c.type.includes("Warp")).length, 0);
  const totalPackages = totalPallets + totalBoxes + totalWarps; // Sum of all containers

  // --- Styles & Colors (Soft Pastel Theme) ---
  const styleHeader: Style = { fontSize: 24, bold: true, color: "#6366f1", margin: [0, 0, 0, 5] }; // Indigo 500
  const styleSubHeader: Style = { fontSize: 10, color: "#94a3b8", margin: [0, 0, 0, 20] }; // Slate 400
  const styleSectionTitle: Style = { fontSize: 14, bold: true, color: "#334155", margin: [0, 15, 0, 5] }; // Slate 700
  const styleTableHeader: Style = { bold: true, fontSize: 10, color: "#475569", fillColor: "#f1f5f9", alignment: "center" }; // Slate 600 on Slate 100
  const styleBadge: Style = { fontSize: 8, bold: true, color: "#ffffff", alignment: "center" };

  // --- Content Builder ---
  const content: Content[] = [];

  // 1. Header Section
  content.push({
    columns: [
      {
        width: "*",
        stack: [
          { text: "PACKING PLAN", style: "header" },
          { text: `Generated: ${today}`, style: "subheader" },
        ],
      },
      {
        width: "auto",
        stack: [
          { text: "CUSTOMER", style: { fontSize: 9, bold: true, color: "#cbd5e1" } }, // Slate 300
          { text: customerName.toUpperCase(), style: { fontSize: 14, bold: true, color: "#1e293b" } }, // Slate 800
        ],
        alignment: "right",
      },
    ],
    margin: [0, 0, 0, 20],
  });

  // 2. Summary Cards (6 Badges)
  // Row 1
  content.push({
    columns: [
      createSummaryCard("TOTAL PO", totalPOs.toString(), "#f8fafc", "#64748b"), // Slate 50 (Text Slate 500)
      createSummaryCard("TOTAL ITEMS", totalItems.toString(), "#fdf2f8", "#db2777"), // Pink 50 (Text Pink 600)
      createSummaryCard("TOTAL PACKAGES", totalPackages.toString(), "#f0f9ff", "#0284c7"), // Sky 50 (Text Sky 600)
    ],
    columnGap: 10,
    margin: [0, 0, 0, 10], // Gap between rows
  });

  // Row 2
  content.push({
    columns: [
      createSummaryCard("TOTAL PALLETS", totalPallets.toString(), "#ecfdf5", "#059669"), // Emerald 50 (Text Emerald 600)
      createSummaryCard("TOTAL BOXES", totalBoxes.toString(), "#eff6ff", "#2563eb"), // Blue 50 (Text Blue 600)
      createSummaryCard("TOTAL WARP", totalWarps.toString(), "#faf5ff", "#9333ea"), // Purple 50 (Text Purple 600)
    ],
    columnGap: 10,
    margin: [0, 0, 0, 20],
  });

  // PO List Summary (Small)
  content.push({
      text: `Orders Included: ${poList.join(', ')}`,
      style: { fontSize: 8, color: "#94a3b8", italics: true },
      margin: [0, 0, 0, 20]
  });

  // 3. PO Details
  content.push({ text: "Detailed Packing List", style: "sectionTitle" });

  results.forEach((plan, index) => {
    // Spacer between POs
    if (index > 0) content.push({ text: "", margin: [0, 15, 0, 0] });

    // PO Header
    content.push({
      text: `PO: ${plan.po}`,
      style: { fontSize: 12, bold: true, color: "#475569", background: "#f8fafc" },
      margin: [0, 5, 0, 5],
      padding: 5, // Note: padding is not standard in Content, but works in some contexts or ignored. 
                  // In pdfmake native, 'padding' on text is not valid, it's valid on columns/tables.
                  // I'll keep it as it doesn't break, but strictly it might be 'any'.
    } as Content); // Cast to Content to allow non-standard props if needed, but safe to verify.

    // Table Body
    const tableBody: TableCell[][] = [
      [
        { text: "#", style: "tableHeader", border: [false, false, false, false] },
        { text: "Type", style: "tableHeader", border: [false, false, false, false] },
        { text: "Contents (SKU x Qty)", style: "tableHeader", border: [false, false, false, false] },
        { text: "Dimensions", style: "tableHeader", border: [false, false, false, false] },
        { text: "Note", style: "tableHeader", border: [false, false, false, false] },
      ],
    ];

    plan.cases.forEach((c, i) => {
      const isEven = i % 2 === 0;
      const rowColor = isEven ? "#ffffff" : "#fbfcfd"; // Very subtle stripe

      // Soft Badge Logic (Pastel Backgrounds)
      let badgeColor = "#e2e8f0"; // Default Slate 200
      let badgeTextColor = "#475569"; // Slate 600
      
      if (c.type.includes("Full Pallet")) { badgeColor = "#dcfce7"; badgeTextColor = "#166534"; } // Emerald 100/800
      else if (c.type.includes("Mixed Pallet")) { badgeColor = "#ffedd5"; badgeTextColor = "#9a3412"; } // Orange 100/800
      else if (c.type.includes("Full Box")) { badgeColor = "#dbeafe"; badgeTextColor = "#1e40af"; } // Blue 100/800
      else if (c.type.includes("Mixed Box")) { badgeColor = "#fef9c3"; badgeTextColor = "#854d0e"; } // Yellow 100/800
      else if (c.type.includes("Warp")) { badgeColor = "#f3e8ff"; badgeTextColor = "#6b21a8"; } // Purple 100/800

      tableBody.push([
        { text: c.caseNo.toString(), alignment: "center", fillColor: rowColor, border: [false, false, false, true], borderColor: ["#f1f5f9", "#f1f5f9", "#f1f5f9", "#f1f5f9"], color: "#64748b" },
        {
          stack: [
            {
              text: c.type,
              style: "badge",
              background: badgeColor,
              color: badgeTextColor,
              margin: [0, 2, 0, 2],
              // display: "inline-block" is not valid pdfmake style, removing it as it does nothing.
            },
          ],
          alignment: "center",
          fillColor: rowColor,
          border: [false, false, false, true],
          borderColor: ["#f1f5f9", "#f1f5f9", "#f1f5f9", "#f1f5f9"],
        },
        {
          text: c.items.map((it) => `${it.sku} (x${it.qty})`).join("\n"),
          fillColor: rowColor,
          fontSize: 9,
          color: "#334155",
          border: [false, false, false, true],
          borderColor: ["#f1f5f9", "#f1f5f9", "#f1f5f9", "#f1f5f9"],
        },
        { text: c.dims || "-", alignment: "center", fillColor: rowColor, fontSize: 9, color: "#64748b", border: [false, false, false, true], borderColor: ["#f1f5f9", "#f1f5f9", "#f1f5f9", "#f1f5f9"] },
        { text: c.note || "-", fillColor: rowColor, fontSize: 8, color: "#94a3b8", border: [false, false, false, true], borderColor: ["#f1f5f9", "#f1f5f9", "#f1f5f9", "#f1f5f9"] },
      ]);
    });

    content.push({
      table: {
        headerRows: 1,
        dontBreakRows: true, // Fix jumpy rows
        widths: [30, 80, "*", 70, 80],
        body: tableBody,
      },
      layout: {
        hLineWidth: (i: number) => (i === 1 ? 1 : 0), // Only header line
        vLineWidth: () => 0,
        hLineColor: () => "#f1f5f9",
        paddingLeft: () => 8,
        paddingRight: () => 8,
        paddingTop: () => 8, // More padding for breathability
        paddingBottom: () => 8,
      },
      margin: [0, 0, 0, 20],
    });
  });

  // --- Document Definition ---
  const docDefinition: TDocumentDefinitions = {
    content: content,
    pageSize: "A4",
    pageMargins: [30, 30, 30, 30],
    styles: {
      header: styleHeader,
      subheader: styleSubHeader,
      sectionTitle: styleSectionTitle,
      tableHeader: styleTableHeader,
      badge: styleBadge,
    },
    defaultStyle: {
      font: "Roboto",
      fontSize: 10,
      color: "#475569", // Slate 600 default
    },
    footer: (currentPage: number, pageCount: number) => {
      return {
        text: `${currentPage} / ${pageCount}`,
        alignment: "center",
        fontSize: 8,
        color: "#e2e8f0", // Very light footer
        margin: [0, 10, 0, 0],
      };
    },
  };

  // Generate & Download
  pdfMake.createPdf(docDefinition).download(`PackingPlan_${customerName}_${timestamp}_Soft.pdf`);
};

// --- Helper Components ---

function createSummaryCard(title: string, value: string, bgColor: string, accentColor: string): Content {
  return {
    // BUT, for now, let's keep it simple and cast if necessary, or better: use a table for the card.
    
    // Better Approach for Card with Background & Padding: A 1x1 Table.
    table: {
        widths: ['*'],
        body: [[
            {
                stack: [
                    { text: title, fontSize: 8, bold: true, color: accentColor, margin: [0, 0, 0, 2] },
                    { text: value, fontSize: 18, bold: true, color: "#1e293b" },
                ],
                fillColor: bgColor,
                border: [false, false, false, false],
                alignment: 'center',
                margin: [5, 5, 5, 5] // Inner padding simulated by margin on contect
            }
        ]]
    },
    layout: 'noBorders',
    // margin: [0, 5, 0, 5] // External margin
  };
}
