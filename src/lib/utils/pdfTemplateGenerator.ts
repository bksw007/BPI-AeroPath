
import { PDFDocument, rgb, StandardFonts } from 'pdf-lib';
import { PackingPlanResult } from '@/lib/services/packing-logic/packing.types';

export const generatePackingDetailsPDF = async (
  results: PackingPlanResult[],
  customerName: string,
  poList: string[]
) => {
  try {
    // 1. Load the existing PDF template
    const existingPdfBytes = await fetch('/files/Packing Details - Original.pdf').then(res => res.arrayBuffer());

    // 2. Load a PDFDocument from the existing PDF bytes
    const pdfDoc = await PDFDocument.load(existingPdfBytes);

    // 3. Embed the Helvetica font
    const helveticaFont = await pdfDoc.embedFont(StandardFonts.Helvetica);

    // 4. Get the first page of the document
    const pages = pdfDoc.getPages();
    const firstPage = pages[0];
    const { width, height } = firstPage.getSize();

    const color = rgb(0, 0, 0);

    // Customer Name (Assume top left)
    firstPage.drawText(customerName, {
      x: 50,
      y: height - 50,
      size: 12,
      font: helveticaFont,
      color,
    });

    // PO List (Assume nearby)
    firstPage.drawText(`PO: ${poList.join(', ')}`, {
      x: 50,
      y: height - 70,
      size: 10,
      font: helveticaFont,
      color,
    });
    
    // Date
    const now = new Date().toLocaleDateString();
    firstPage.drawText(`Date: ${now}`, {
        x: width - 150,
        y: height - 50,
        size: 10,
        font: helveticaFont,
        color
    });


    // --- Draw Table Data (Iterate through results) ---
    // This is tricky without knowing the exact layout. 
    // I'll start drawing from a fixed Y position and increment.
    // If the template has a grid, we might need a more complex mapping.
    
    let yPos = height - 120;
    const lineHeight = 15;

    // Table Header (If not present in template, draw it)
    // firstPage.drawText("Case # | Type | SKU | Qty | Dims", { x: 50, y: yPos, size: 10, font: helveticaFont, color });
    // yPos -= lineHeight;

    results.forEach(plan => {
        // PO Section Header
        if (yPos < 50) { 
            // Add new page if needed (Not implementing multi-page yet for template complexity)
             // simplified: stop drawing
             return; 
        }

        firstPage.drawText(`PO: ${plan.po}`, { x: 50, y: yPos, size: 10, font: helveticaFont, color: rgb(0, 0, 1) });
        yPos -= lineHeight;

        plan.cases.forEach(c => {
            if (yPos < 50) return;

            const text = `#${c.caseNo} | ${c.type} | ${c.items.map(i => `${i.sku} (x${i.qty})`).join(', ')} | ${c.dims}`;
            firstPage.drawText(text, {
                x: 50,
                y: yPos,
                size: 9,
                font: helveticaFont,
                color
            });
            yPos -= lineHeight;
        });
        
        yPos -= lineHeight; // Extra space between POs
    });

    // 5. Serialize the PDFDocument to bytes (a Uint8Array)
    const pdfBytes = await pdfDoc.save();

    // 6. Trigger Download
    const blob = new Blob([pdfBytes], { type: "application/pdf" });
    const link = document.createElement("a");
    link.href = window.URL.createObjectURL(blob);
    link.download = `PackingDetails_${customerName}_${new Date().toISOString().split('T')[0]}.pdf`;
    link.click();

  } catch (error) {
    console.error("Error generating PDF:", error);
    alert("Failed to generate PDF. check console for details.");
  }
};

export const generateLayoutGridPDF = async () => {
  try {
    const existingPdfBytes = await fetch('/files/Packing Details - Original.pdf').then(res => res.arrayBuffer());
    const pdfDoc = await PDFDocument.load(existingPdfBytes);
    const pages = pdfDoc.getPages();
    const firstPage = pages[0];
    const { width, height } = firstPage.getSize();
    
    const helveticaFont = await pdfDoc.embedFont(StandardFonts.Helvetica);
    const fontSize = 8;
    const color = rgb(1, 0, 0); // Red

    // Draw Grid Lines (every 50 units)
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
    
    // Draw Center lines
    firstPage.drawLine({ start: { x: width/2, y: 0 }, end: { x: width/2, y: height }, thickness: 1, color: rgb(0, 0, 1) });
    firstPage.drawLine({ start: { x: 0, y: height/2 }, end: { x: width, y: height/2 }, thickness: 1, color: rgb(0, 0, 1) });

    const pdfBytes = await pdfDoc.save();
    const blob = new Blob([pdfBytes], { type: "application/pdf" });
    const link = document.createElement("a");
    link.href = window.URL.createObjectURL(blob);
    link.download = `PackingDetails_LayoutGrid.pdf`;
    link.click();
  } catch (e) {
      console.error(e);
      alert("Error generating grid");
  }
};
