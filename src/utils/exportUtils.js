import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
import { calculateCostBreakdown } from '../services/designGenerator.js';

/**
 * Export design as PDF
 */
export function exportDesignAsPDF(design) {
  const doc = new jsPDF();

  // Validate design data
  if (!design || !design.parts || !design.dimensions) {
    throw new Error('Invalid design data');
  }

  // Calculate cost breakdown for parts
  const partsWithCost = calculateCostBreakdown(design.parts, design.material);

  // Header
  doc.setFontSize(24);
  doc.setTextColor(0, 88, 163); // IKEA Blue
  doc.text('AI-KEA Design', 20, 20);

  // Design Title
  doc.setFontSize(18);
  doc.setTextColor(0, 0, 0);
  doc.text(design.furnitureType.toUpperCase(), 20, 35);

  // Design Info
  doc.setFontSize(11);
  doc.text(`Material: ${design.material}`, 20, 45);
  doc.text(`Color: ${design.materialColor}`, 20, 52);
  doc.text(`Total Cost: ₹${design.totalCost.toFixed(2)}`, 20, 59);

  // Dimensions
  doc.setFontSize(14);
  doc.setTextColor(0, 88, 163);
  doc.text('Dimensions', 20, 72);
  doc.setFontSize(11);
  doc.setTextColor(0, 0, 0);
  doc.text(`Length: ${design.dimensions.length} cm`, 20, 80);
  doc.text(`Width: ${design.dimensions.width} cm`, 20, 87);
  doc.text(`Height: ${design.dimensions.height} cm`, 20, 94);

  // Parts List
  doc.setFontSize(14);
  doc.setTextColor(0, 88, 163);
  doc.text('Parts List', 20, 110);

  const partsData = partsWithCost.map(part => [
    part.name || part.partName || 'Unknown Part',
    (part.quantity || 0).toString(),
    `₹${(part.unitCost || 0).toFixed(2)}`,
    `₹${(part.totalPartCost || 0).toFixed(2)}`
  ]);

  autoTable(doc, {
    startY: 115,
    head: [['Part Name', 'Quantity', 'Unit Cost', 'Total']],
    body: partsData,
    theme: 'grid',
    headStyles: { fillColor: [0, 88, 163] },
    styles: { fontSize: 10 },
  });

  // Assembly Instructions
  const finalY = doc.lastAutoTable.finalY || 115;
  doc.setFontSize(14);
  doc.setTextColor(0, 88, 163);
  doc.text('Assembly Instructions', 20, finalY + 15);

  doc.setFontSize(10);
  doc.setTextColor(0, 0, 0);
  const instructions = design.instructions || design.assemblyInstructions || [];
  let yPos = finalY + 23;

  instructions.forEach((instruction, index) => {
    if (yPos > 270) {
      doc.addPage();
      yPos = 20;
    }
    const text = `${index + 1}. ${instruction}`;
    const lines = doc.splitTextToSize(text, 170);
    doc.text(lines, 20, yPos);
    yPos += lines.length * 7;
  });

  // Footer
  const pageCount = doc.internal.pages.length - 1;
  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i);
    doc.setFontSize(8);
    doc.setTextColor(128, 128, 128);
    doc.text(
      `AI-KEA © 2025 - Page ${i} of ${pageCount}`,
      doc.internal.pageSize.width / 2,
      doc.internal.pageSize.height - 10,
      { align: 'center' }
    );
  }

  // Save
  doc.save(`AI-KEA-${design.furnitureType}-Design.pdf`);
}

/**
 * Export parts list as CSV
 */
export function exportPartsAsCSV(design) {
  // Validate design data
  if (!design || !design.parts) {
    throw new Error('Invalid design data');
  }

  // Calculate cost breakdown for parts
  const partsWithCost = calculateCostBreakdown(design.parts, design.material);

  const headers = ['Part Name', 'Quantity', 'Unit Cost (₹)', 'Total Cost (₹)'];
  const rows = partsWithCost.map(part => [
    part.name || part.partName || 'Unknown Part',
    part.quantity || 0,
    (part.unitCost || 0).toFixed(2),
    (part.totalPartCost || 0).toFixed(2)
  ]);

  // Add total row
  rows.push([
    'TOTAL',
    '',
    '',
    (design.totalCost || 0).toFixed(2)
  ]);

  // Create CSV content
  let csvContent = headers.join(',') + '\n';
  rows.forEach(row => {
    csvContent += row.map(cell => `"${cell}"`).join(',') + '\n';
  });

  // Create download
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const link = document.createElement('a');
  const url = URL.createObjectURL(blob);

  link.setAttribute('href', url);
  link.setAttribute('download', `AI-KEA-${design.furnitureType}-Parts.csv`);
  link.style.visibility = 'hidden';

  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}

/**
 * Export assembly instructions as PDF
 */
export function exportAssemblyInstructionsAsPDF(design) {
  const doc = new jsPDF();

  // Validate design data
  if (!design || !design.parts || !design.dimensions) {
    throw new Error('Invalid design data');
  }

  // Calculate cost breakdown for parts
  const partsWithCost = calculateCostBreakdown(design.parts, design.material);

  // Header
  doc.setFontSize(24);
  doc.setTextColor(0, 88, 163);
  doc.text('Assembly Instructions', 20, 20);

  // Design Title
  doc.setFontSize(16);
  doc.setTextColor(0, 0, 0);
  doc.text(design.furnitureType.toUpperCase(), 20, 35);

  // Basic Info
  doc.setFontSize(11);
  doc.text(`Dimensions: ${design.dimensions.length} × ${design.dimensions.width} × ${design.dimensions.height} cm`, 20, 45);
  doc.text(`Estimated Assembly Time: ${design.assemblyTime} minutes`, 20, 52);
  doc.text(`Total Parts: ${design.parts.length} types`, 20, 59);

  // Parts Required
  doc.setFontSize(14);
  doc.setTextColor(0, 88, 163);
  doc.text('Parts Required', 20, 72);

  const partsData = partsWithCost.map(part => [
    part.name || part.partName || 'Unknown Part',
    (part.quantity || 0).toString()
  ]);

  autoTable(doc, {
    startY: 77,
    head: [['Part Name', 'Quantity']],
    body: partsData,
    theme: 'grid',
    headStyles: { fillColor: [0, 88, 163] },
    styles: { fontSize: 10 },
  });

  // Instructions
  const finalY = doc.lastAutoTable.finalY || 77;
  doc.setFontSize(14);
  doc.setTextColor(0, 88, 163);
  doc.text('Step-by-Step Instructions', 20, finalY + 15);

  doc.setFontSize(11);
  doc.setTextColor(0, 0, 0);
  const instructions = design.instructions || design.assemblyInstructions || [];
  let yPos = finalY + 25;

  instructions.forEach((instruction, index) => {
    if (yPos > 260) {
      doc.addPage();
      yPos = 20;
    }

    // Step number in circle
    doc.setFillColor(0, 88, 163);
    doc.circle(25, yPos - 2, 4, 'F');
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(10);
    doc.text((index + 1).toString(), 25, yPos + 1, { align: 'center' });

    // Instruction text
    doc.setTextColor(0, 0, 0);
    doc.setFontSize(11);
    const lines = doc.splitTextToSize(instruction, 160);
    doc.text(lines, 35, yPos);
    yPos += Math.max(lines.length * 7, 10) + 5;
  });

  // Footer
  const pageCount = doc.internal.pages.length - 1;
  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i);
    doc.setFontSize(8);
    doc.setTextColor(128, 128, 128);
    doc.text(
      `AI-KEA © 2025 - Assembly Instructions - Page ${i} of ${pageCount}`,
      doc.internal.pageSize.width / 2,
      doc.internal.pageSize.height - 10,
      { align: 'center' }
    );
  }

  // Save
  doc.save(`AI-KEA-${design.furnitureType}-Assembly-Instructions.pdf`);
}
