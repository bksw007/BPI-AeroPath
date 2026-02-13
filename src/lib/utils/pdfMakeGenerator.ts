import pdfMake from "pdfmake/build/pdfmake";
import pdfFonts from "pdfmake/build/vfs_fonts";
import { PackingPlanResult } from "@/lib/services/packing-logic/packing.types";
import { TDocumentDefinitions, Content, Style, TableCell } from "pdfmake/interfaces";
import { sarabunFonts } from "@/lib/utils/sarabunFonts";

type PdfFontFamily = {
  normal: string;
  bold: string;
  italics: string;
  bolditalics: string;
};

type PdfMakeRuntime = {
  addVirtualFileSystem?: (vfs: Record<string, string>) => void;
  addFonts?: (fonts: Record<string, PdfFontFamily>) => void;
  createPdf: (
    docDefinition: TDocumentDefinitions,
    tableLayouts?: unknown,
    fonts?: Record<string, PdfFontFamily>,
    vfs?: Record<string, string>
  ) => { download: (fileName?: string) => void };
};

function getDefaultVfs(): Record<string, string> {
  const withPdfMake = pdfFonts as { pdfMake?: { vfs?: Record<string, string> } };
  return withPdfMake.pdfMake?.vfs ?? (pdfFonts as unknown as Record<string, string>);
}

function buildVfs(): Record<string, string> {
  return {
    ...getDefaultVfs(),
    ...sarabunFonts,
  };
}

function buildFonts(): Record<string, PdfFontFamily> {
  return {
    Roboto: {
      normal: "Roboto-Regular.ttf",
      bold: "Roboto-Medium.ttf",
      italics: "Roboto-Italic.ttf",
      bolditalics: "Roboto-MediumItalic.ttf",
    },
    Sarabun: {
      normal: "Sarabun-Regular.ttf",
      bold: "Sarabun-Regular.ttf",
      italics: "Sarabun-Regular.ttf",
      bolditalics: "Sarabun-Regular.ttf",
    },
  };
}

/**
 * Generate Packing List PDF using PDFMake
 * Designed for readability and modern aesthetics.
 */
export const generatePackingListPDFMake = async (
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
  // Custom format: yyyyMMddHHmmss
  const yyyy = now.getFullYear();
  const MM = String(now.getMonth() + 1).padStart(2, '0');
  const dd = String(now.getDate()).padStart(2, '0');
  const HH = String(now.getHours()).padStart(2, '0');
  const mm = String(now.getMinutes()).padStart(2, '0');
  const ss = String(now.getSeconds()).padStart(2, '0');
  const filenameTimestamp = `${yyyy}${MM}${dd}${HH}${mm}${ss}`;
  const vfs = buildVfs();
  const fonts = buildFonts();
  const defaultFontFamily = "Sarabun";

  // --- Calculate Totals ---
  const totalPOs = results.length;
  const totalPallets = results.reduce((acc, r) => acc + r.summary.totalPallets, 0);
  const totalBoxes = results.reduce((acc, r) => acc + r.summary.totalBoxes, 0);
  const totalItems = results.reduce((acc, r) => acc + r.summary.totalItems, 0);
  const totalWarps = results.reduce((acc, r) => acc + r.cases.filter(c => c.type.includes("Warp")).length, 0);
  const totalPackages = totalPallets + totalBoxes + totalWarps; // Sum of all containers

  // --- Styles & Colors (Soft Pastel Theme) ---
  const styleHeader: Style = { fontSize: 24, bold: true, color: "#6366f1", margin: [0, 0, 0, 2] }; // Indigo 500
  const styleSubHeader: Style = { fontSize: 10, color: "#94a3b8", margin: [0, 0, 0, 10] }; // Reduced bottom margin
  const styleSectionTitle: Style = { fontSize: 14, bold: true, color: "#334155", margin: [0, 10, 0, 2] }; // Reduced margins
  const styleTableHeader: Style = { bold: true, fontSize: 10, color: "#475569", fillColor: "#f1f5f9", alignment: "center" }; // Slate 600 on Slate 100
  const styleBadge: Style = { fontSize: 8, bold: true, color: "#ffffff", alignment: "center" };

  // --- Content Builder ---
  const content: Content[] = [];

  // Import logo
  const logoUrl = "/images/Logo h no bg.svg"; 
  let logoSvg: string | undefined;
  try {
     const response = await fetch(logoUrl);
     if (response.ok) {
        logoSvg = await response.text();
     }
  } catch (e) {
      console.warn("Logo fetch failed", e);
  }

  // 1. Header Section
  // Logo height = Header (24+2=26) + Subheader (10+10=20) = 46. Let's use 45.
  const logoHeight = 45;

  content.push({
    columns: [
      {
         width: "auto",
         stack: [
             logoSvg ? { svg: logoSvg, height: logoHeight, width: 100, margin: [0, 0, 20, 0] } : { text: "LOGO", fontSize: 20 }
         ]
      },
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
    margin: [0, 0, 0, 10], // Reduced margin
  });

  // 2. Summary Cards
  content.push({
    columns: [
      createSummaryCard("TOTAL PO", totalPOs.toString(), "#f8fafc", "#64748b"), 
      createSummaryCard("TOTAL ITEMS", totalItems.toString(), "#fdf2f8", "#db2777"), 
      createSummaryCard("TOTAL PACKAGES", totalPackages.toString(), "#f0f9ff", "#0284c7"), 
    ],
    columnGap: 10,
    margin: [0, 0, 0, 5], 
  });

  content.push({
    columns: [
      createSummaryCard("TOTAL PALLETS", totalPallets.toString(), "#ecfdf5", "#059669"), 
      createSummaryCard("TOTAL BOXES", totalBoxes.toString(), "#eff6ff", "#2563eb"), 
      createSummaryCard("TOTAL WARP", totalWarps.toString(), "#faf5ff", "#9333ea"), 
    ],
    columnGap: 10,
    margin: [0, 0, 0, 10], 
  });

  // PO List Summary
  content.push({
      text: `Orders Included: ${poList.join(', ')}`,
      style: { fontSize: 8, color: "#94a3b8", italics: true },
      margin: [0, 0, 0, 10] 
  });

  // 3. PO Details
  content.push({ text: "Detailed Packing List", style: "sectionTitle" });

  results.forEach((plan, index) => {
    // Spacer between POs
    if (index > 0) content.push({ text: "", margin: [0, 10, 0, 0] }); 

    // Group PO Header and Table to prevent Page Break split
    // Using a 'stack' with 'unbreakable: true' is the standard way, 
    // but unbreakable only works if the whole stack fits on one page. 
    // If the table is long, it WILL break the page, and the whole stack moves to next page.
    // If the table is LONGER than a page, unbreakable might cause issues or just be ignored for the body.
    // However, we want the HEADER to stick to the TABLE.
    // pdfmake 'unbreakable' on a stack keeps the whole stack together. 
    // If we just want the PO Header + First Row to ideally stay together, 'dontBreakRows' in table helps the table itself.
    // But to glue PO Header to Table, we can put the PO Header IN the table header? 
    // OR use 'unbreakable: true' on a stack containing PO Header and the Table.
    // Let's try the stack approach. If the table is super long, it might force a break early.
    // Better approach for "Heading + Table Start" is to use `pageBreak: 'after'` logic or `keepWithHeaderRows` but pdfmake doesn't have `keepWithNext`.
    // Actually, `unbreakable: true` is for the whole block.
    // A safer way is to put the PO Header as the FIRST ROW of the table (spanning all columns).
    // Then `headerRows: 2` (PO Header + Col Header) and `dontBreakRows: true`.
    // This ensures they stay together and repeat headers if configured (or just stick).
    
    // Let's modify to put PO Header INSIDE the table as a header row.
    
    const poHeaderRow: TableCell[] = [
        {
            text: `PO: ${plan.po}`,
            style: { fontSize: 12, bold: true, color: "#475569" }, // Background handled by fill
            fillColor: "#f8fafc",
            colSpan: 6,
            border: [false, false, false, false], 
            margin: [0, 5, 0, 5]
        },
        {}, {}, {}, {}, {} // Empty cells for colSpan
    ];

    // Table Body
    const tableBody: TableCell[][] = [
      poHeaderRow, // Row 0: PO Header
      [            // Row 1: Column Headers
        { text: "#", style: "tableHeader", border: [false, false, false, false] },
        { text: "Type", style: "tableHeader", border: [false, false, false, false] },
        { text: "Item", style: "tableHeader", border: [false, false, false, false] },
        { text: "Qty", style: "tableHeader", border: [false, false, false, false] },
        { text: "Dimensions", style: "tableHeader", border: [false, false, false, false] },
        { text: "Note", style: "tableHeader", border: [false, false, false, false] },
      ],
    ];

    plan.cases.forEach((c, i) => {
      const isEven = i % 2 === 0;
      const rowColor = isEven ? "#ffffff" : "#fbfcfd"; 

      tableBody.push([
        { text: c.caseNo.toString(), alignment: "center", fillColor: rowColor, border: [false, false, false, true], borderColor: ["#e2e8f0", "#e2e8f0", "#e2e8f0", "#e2e8f0"], color: "#64748b" },
        { 
          text: c.type, 
          color: "#475569", 
          alignment: "center", 
          bold: false, 
          fillColor: rowColor, 
          border: [false, false, false, true], 
          borderColor: ["#e2e8f0", "#e2e8f0", "#e2e8f0", "#e2e8f0"],
          fontSize: 8 
        },
        {
          text: c.items.map((it) => it.sku).join("\n"),
          alignment: "left",
          fillColor: rowColor,
          fontSize: 9,
          color: "#334155",
          border: [false, false, false, true],
          borderColor: ["#e2e8f0", "#e2e8f0", "#e2e8f0", "#e2e8f0"],
        },
        {
          text: c.items.map((it) => it.qty.toString()).join("\n"), 
          alignment: "center",
          fillColor: rowColor,
          fontSize: 9,
          color: "#475569",
          border: [false, false, false, true],
          borderColor: ["#e2e8f0", "#e2e8f0", "#e2e8f0", "#e2e8f0"],
        },
        { 
            text: c.dims || "-", 
            alignment: "center", 
            fillColor: rowColor, 
            fontSize: 9, 
            color: "#1e293b", 
            bold: true, 
            border: [false, false, false, true], 
            borderColor: ["#e2e8f0", "#e2e8f0", "#e2e8f0", "#e2e8f0"] 
        },
        { text: c.note || "-", fillColor: rowColor, fontSize: 8, color: "#94a3b8", border: [false, false, false, true], borderColor: ["#e2e8f0", "#e2e8f0", "#e2e8f0", "#e2e8f0"] },
      ]);
    });

    content.push({
      table: {
        headerRows: 2, // Header includes PO Row and Column Titles
        dontBreakRows: true, 
        widths: [20, 70, 110, 30, 90, "*"], 
        body: tableBody,
      },
      layout: {
        hLineWidth: (i: number, node: { table: { body: unknown[][] } }) => {
            // Updated logic: i=2 is the line under Column Titles (Index 1)
            // i=0 is top (above PO) -> 0
            // i=1 is middle (above Columns) -> 0 (or 1 if we want line between PO and Cols, let's say 0 for cleaner look)
            // i=2 is line under Columns -> 1 
            // i=length is bottom -> 1
            if (i === 2 || i === node.table.body.length) return 1;
            return 0; 
        },
        vLineWidth: () => 0,
        hLineColor: () => "#e2e8f0", 
        paddingLeft: () => 4, 
        paddingRight: () => 4,
        paddingTop: () => 3, 
        paddingBottom: () => 3, 
      },
      margin: [0, 0, 0, 0], 
    });
  });

  // --- Document Definition ---
  const docDefinition: TDocumentDefinitions = {
    content: content,
    pageSize: "A4",
    pageMargins: [30, 20, 30, 20], 
    styles: {
      header: styleHeader,
      subheader: styleSubHeader,
      sectionTitle: styleSectionTitle,
      tableHeader: styleTableHeader,
      badge: styleBadge,
    },
    defaultStyle: {
      font: defaultFontFamily,
      fontSize: 9, 
      color: "#475569", 
    },
    footer: (currentPage: number, pageCount: number) => {
      return {
        text: `${currentPage} / ${pageCount}`,
        alignment: "center",
        fontSize: 8,
        color: "#cbd5e1", 
        margin: [0, 10, 0, 0],
      };
    },
  };

  const pdfMakeRuntime = pdfMake as unknown as PdfMakeRuntime;
  pdfMakeRuntime.addVirtualFileSystem?.(vfs);
  pdfMakeRuntime.addFonts?.(fonts);
  pdfMakeRuntime
    .createPdf(docDefinition)
    .download(`PackingPlan_${customerName}_${totalItems}_${filenameTimestamp}.pdf`);
};

// --- Helper Components ---

function createSummaryCard(title: string, value: string, bgColor: string, accentColor: string): Content {
  return {
    table: {
        widths: ['*'],
        body: [[
            {
                stack: [
                    { text: title, fontSize: 7, bold: true, color: "#94a3b8", margin: [0, 0, 0, 2] },
                    { text: value, fontSize: 16, bold: true, color: accentColor },
                ],
                border: [false, false, false, true], 
                borderColor: ["#e2e8f0", "#e2e8f0", "#e2e8f0", "#e2e8f0"],
                alignment: 'center',
                margin: [0, 2, 0, 2]
            }
        ]]
    },
    layout: 'noBorders'
  };
}
