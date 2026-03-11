import { PDFDocument, rgb, StandardFonts, type PDFFont, type PDFPage } from "pdf-lib";
import QRCode from "qrcode";
import type { PackingDetailSheetEntry, ProductOption, ShipByOption } from "@/lib/packing-details/export.types";
import { PACKING_DETAIL_FIELDS, type PackingDetailFieldKey, type RectField } from "@/lib/packing-details/templateFields";

const TEXT_COLOR = rgb(0, 0, 0);
const CIRCLE_COLOR = rgb(0.95, 0.55, 0.55);
const CHECK_COLOR = rgb(0.86, 0.12, 0.12);
const TOTAL_QTY_COLOR = rgb(0.1, 0.24, 0.72);

const toArrayBuffer = (bytes: Uint8Array): ArrayBuffer => {
  const buffer = new ArrayBuffer(bytes.byteLength);
  new Uint8Array(buffer).set(bytes);
  return buffer;
};

const getField = (key: PackingDetailFieldKey): RectField => PACKING_DETAIL_FIELDS[key];

const normalizeText = (value: string): string => value.trim().toLowerCase().replace(/\s+/g, "");

const drawTextInField = (
  page: PDFPage,
  text: string,
  field: RectField,
  font: PDFFont,
  size = 10,
  color = TEXT_COLOR
) => {
  page.drawText(text, {
    x: field.x + 1,
    y: field.y + Math.max(1, (field.height - size) / 2),
    size,
    font,
    color,
    maxWidth: field.width - 2,
    lineHeight: size + 1,
  });
};

const drawCenteredTextInField = (
  page: PDFPage,
  text: string,
  field: RectField,
  font: PDFFont,
  size = 10,
  color = TEXT_COLOR
) => {
  const textWidth = font.widthOfTextAtSize(text, size);
  const x = field.x + Math.max(1, (field.width - textWidth) / 2);
  const y = field.y + Math.max(1, (field.height - size) / 2);
  page.drawText(text, {
    x,
    y,
    size,
    font,
    color,
  });
};

const drawWordCircle = (page: PDFPage, field: RectField) => {
  page.drawEllipse({
    x: field.x + field.width / 2,
    y: field.y + field.height / 2,
    xScale: field.width / 2,
    yScale: field.height / 2,
    borderColor: CIRCLE_COLOR,
    borderWidth: 1.4,
  });
};

const drawCheckedBox = (page: PDFPage, field: RectField) => {
  const inset = 1.2;
  page.drawLine({
    start: { x: field.x + inset, y: field.y + inset },
    end: { x: field.x + field.width - inset, y: field.y + field.height - inset },
    thickness: 1.2,
    color: CHECK_COLOR,
  });
  page.drawLine({
    start: { x: field.x + inset, y: field.y + field.height - inset },
    end: { x: field.x + field.width - inset, y: field.y + inset },
    thickness: 1.2,
    color: CHECK_COLOR,
  });
};

const resolvePackageField = (dimsRaw: string): PackingDetailFieldKey | null => {
  const dims = normalizeText(dimsRaw).replace(/[×*]/g, "x");
  const map: Record<string, PackingDetailFieldKey> = {
    "110x110x115": "pkg_110x110x115",
    "110x110x90": "pkg_110x110x90",
    "110x110x65": "pkg_110x110x65",
    "80x120x115": "pkg_80x120x115",
    "80x120x90": "pkg_80x120x90",
    "80x120x65": "pkg_80x120x65",
    rtn: "pkg_rtn",
    wrap: "pkg_wrap_left",
    "27x27x22": "pkg_27x27x22",
    "53x53x19": "pkg_53x53x19",
    "42x46x68": "pkg_42x46x68",
    "47x66x68": "pkg_47x66x68",
    "53x53x58": "pkg_53x53x58",
    "57x64x84": "pkg_57x64x84",
    "68x74x86": "pkg_68x74x86",
    "70x100x90": "pkg_70x100x90",
  };
  return map[dims] ?? null;
};

const resolveTypeWordField = (typeRaw: string): PackingDetailFieldKey | null => {
  const type = normalizeText(typeRaw);
  if (type.includes("pallet")) return "type_word_pallet";
  if (type.includes("box")) return "type_word_box";
  if (type.includes("warp") || type.includes("wrap")) return "type_word_wrap";
  return null;
};

const resolveShipByWordField = (shipBy: ShipByOption): PackingDetailFieldKey => {
  if (shipBy === "Air") return "ship_by_word_air";
  if (shipBy === "Courier") return "ship_by_word_courier";
  return "ship_by_word_sea";
};

const resolveProductWordField = (product: ProductOption): PackingDetailFieldKey =>
  product === "TC" ? "product_word_tc" : "product_word_inverter";

const rowField = (prefix: "item_row_" | "qty_row_", index: number): RectField =>
  getField(`${prefix}${index}` as PackingDetailFieldKey);

const embedQr = async (pdfDoc: PDFDocument, palletNo: string) => {
  const qrDataUrl = await QRCode.toDataURL(palletNo, {
    margin: 1,
    width: 192,
    color: { dark: "#8A8A8A", light: "#FFFFFF" },
  });
  const pngBuffer = await fetch(qrDataUrl).then((res) => res.arrayBuffer());
  return pdfDoc.embedPng(pngBuffer);
};

export const generatePackingDetailsPDF = async (entries: PackingDetailSheetEntry[], customerName: string) => {
  try {
    if (entries.length === 0) {
      alert("No selected rows for Packing Details export.");
      return;
    }

    const existingPdfBytes = await fetch("/files/Packing Details - Original.pdf").then((res) => res.arrayBuffer());
    const templateDoc = await PDFDocument.load(existingPdfBytes);
    const pdfDoc = await PDFDocument.create();
    const helveticaFont = await pdfDoc.embedFont(StandardFonts.Helvetica);
    const helveticaBold = await pdfDoc.embedFont(StandardFonts.HelveticaBold);

    for (let i = 0; i < entries.length; i += 1) {
      const [page] = await pdfDoc.copyPages(templateDoc, [0]);
      pdfDoc.addPage(page);
      const entry = entries[i];

      drawTextInField(page, entry.shipment, getField("shipment_value"), helveticaBold, 14);
      drawCenteredTextInField(page, String(entry.mappedCaseNo), getField("pallet_no_value"), helveticaBold, 36);

      drawWordCircle(page, getField(resolveShipByWordField(entry.shipBy)));
      drawWordCircle(page, getField(resolveProductWordField(entry.product)));

      const typeWordField = resolveTypeWordField(entry.caseData.type);
      if (typeWordField) drawWordCircle(page, getField(typeWordField));

      const packageField = resolvePackageField(entry.caseData.dims);
      if (packageField) drawCheckedBox(page, getField(packageField));

      const items = entry.caseData.items.slice(0, 9);
      items.forEach((item, idx) => {
        const row = idx + 1;
        drawTextInField(page, item.sku, rowField("item_row_", row), helveticaFont, 10);
        drawCenteredTextInField(page, String(item.qty), rowField("qty_row_", row), helveticaFont, 10);
      });

      drawTextInField(
        page,
        String(entry.totalQty),
        getField("total_qty_main_value"),
        helveticaBold,
        12,
        TOTAL_QTY_COLOR
      );

      try {
        const qrPng = await embedQr(pdfDoc, entry.palletNo);
        const qrArea = getField("qr_area");
        page.drawImage(qrPng, {
          x: qrArea.x,
          y: qrArea.y,
          width: qrArea.width,
          height: qrArea.height,
        });
      } catch (qrError) {
        console.warn(`QR generation failed for pallet ${entry.palletNo}`, qrError);
      }
    }

    const pdfBytes = await pdfDoc.save();
    const blob = new Blob([toArrayBuffer(pdfBytes)], { type: "application/pdf" });
    const link = document.createElement("a");
    link.href = window.URL.createObjectURL(blob);
    link.download = `PackingDetails_${customerName}_${new Date().toISOString().split("T")[0]}_${entries.length}pages.pdf`;
    link.click();
  } catch (error) {
    console.error("Error generating Packing Details PDF:", error);
    alert("Failed to generate Packing Details PDF. Check console for details.");
  }
};

export const generateLayoutGridPDF = async () => {
  try {
    const existingPdfBytes = await fetch("/files/Packing Details - Original.pdf").then((res) => res.arrayBuffer());
    const pdfDoc = await PDFDocument.load(existingPdfBytes);
    const pages = pdfDoc.getPages();
    const firstPage = pages[0];
    const { width, height } = firstPage.getSize();

    const helveticaFont = await pdfDoc.embedFont(StandardFonts.Helvetica);
    const color = rgb(1, 0, 0);

    for (let x = 0; x < width; x += 50) {
      firstPage.drawLine({
        start: { x, y: 0 },
        end: { x, y: height },
        thickness: 0.5,
        color: rgb(0.8, 0.8, 0.8),
      });
      firstPage.drawText(`${x}`, { x: x + 2, y: 10, size: 6, font: helveticaFont, color });
    }

    for (let y = 0; y < height; y += 50) {
      firstPage.drawLine({
        start: { x: 0, y },
        end: { x: width, y },
        thickness: 0.5,
        color: rgb(0.8, 0.8, 0.8),
      });
      firstPage.drawText(`${y}`, { x: 5, y: y + 2, size: 6, font: helveticaFont, color });
    }

    firstPage.drawLine({ start: { x: width / 2, y: 0 }, end: { x: width / 2, y: height }, thickness: 1, color: rgb(0, 0, 1) });
    firstPage.drawLine({ start: { x: 0, y: height / 2 }, end: { x: width, y: height / 2 }, thickness: 1, color: rgb(0, 0, 1) });

    const pdfBytes = await pdfDoc.save();
    const blob = new Blob([toArrayBuffer(pdfBytes)], { type: "application/pdf" });
    const link = document.createElement("a");
    link.href = window.URL.createObjectURL(blob);
    link.download = "PackingDetails_LayoutGrid.pdf";
    link.click();
  } catch (e) {
    console.error(e);
    alert("Error generating grid");
  }
};
