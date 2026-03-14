// Shingle calculation logic (matches Florida spreadsheet)
export const calculateShingleMaterials = (building, materials, state) => {
  const { totalArea, wastePercent, eaves, valleys, hips, ridges, rakes, wallFlashing, stepFlashing, pipes } = building;
  const adjustedArea = totalArea * (1 + wastePercent / 100);
  const squares = adjustedArea / 100;

  // Material quantities
  const shingleBundles = Math.ceil(squares * 3); // 3 bundles per square
  const starterLF = eaves + rakes;
  const starterBundles = Math.ceil(starterLF / 120); // 120 LF per bundle
  const hipRidgeLF = hips + ridges;
  const hipRidgeBundles = Math.ceil(hipRidgeLF / 33); // 33 LF per bundle
  const iceWaterLF = eaves + valleys + stepFlashing;
  const iceWaterRolls = Math.ceil(iceWaterLF / 66.7); // 66.7 LF per roll
  const syntheticRolls = Math.ceil(adjustedArea / 1000); // 1000 sqft per roll
  const ridgeVentCount = Math.ceil(ridges / 4); // 4 ft per piece
  const stepFlashingBoxes = Math.ceil(stepFlashing / 100); // 100 pcs per box
  const dripEdgeCount = Math.ceil((eaves + rakes) / 10); // 10 ft per piece
  const coilNailBoxes = Math.ceil(squares / 25); // 1 box per 25 sq
  const capNailBoxes = Math.ceil(syntheticRolls / 6); // 1 box per 6 rolls
  const pipeBoots = pipes || 0;

  return {
    shingleBundles,
    starterBundles,
    hipRidgeBundles,
    iceWaterRolls,
    syntheticRolls,
    ridgeVentCount,
    stepFlashingBoxes,
    dripEdgeCount,
    coilNailBoxes,
    capNailBoxes,
    pipeBoots,
    adjustedArea,
    squares
  };
};

export const calculateBuildingCost = (building, materials, labor, financials, state) => {
  const qty = calculateShingleMaterials(building, materials, state);
  const prices = {};
  materials.forEach(m => { prices[m.id] = m.prices[state] || 0; });

  const materialCost =
    qty.shingleBundles * (prices.m1 || 29.67) +
    qty.hipRidgeBundles * (prices.m2 || 65) +
    qty.starterBundles * (prices.m3 || 42) +
    qty.syntheticRolls * (prices.m4 || 60) +
    qty.iceWaterRolls * (prices.m5 || 60) +
    qty.ridgeVentCount * (prices.m6 || 7) +
    qty.stepFlashingBoxes * (prices.m8 || 55) +
    qty.dripEdgeCount * (prices.m9 || 9.75) +
    qty.coilNailBoxes * (prices.m10 || 36) +
    qty.capNailBoxes * (prices.m11 || 16) +
    qty.pipeBoots * (prices.m12 || 4.75) +
    1 * (prices.m13 || 8) +
    qty.pipeBoots * (prices.m14 || 7.25) +
    qty.pipeBoots * (prices.m15 || 8);

  const laborCost = qty.squares * labor.tearOffRate;
  const taxAmount = materialCost * financials.taxRate;
  const subtotal = materialCost + laborCost + taxAmount;
  const margin = subtotal / (1 - financials.margin) - subtotal;
  const total = subtotal + margin;

  return { materialCost, laborCost, taxAmount, margin, total, quantities: qty };
};

export const formatMeasurement = (str) => {
  if (!str) return 0;
  const match = str.match(/(\d+)ft\s*(\d+)?in?/);
  if (match) return parseInt(match[1]) + (parseInt(match[2] || 0) / 12);
  return parseFloat(str) || 0;
};

export const downloadCSV = (data, filename) => {
  const csv = data.map(row => row.map(cell => `"${cell}"`).join(",")).join("\n");
  const blob = new Blob([csv], { type: "text/csv" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
};

export const parsePDF = async (file) => {
  // Stub for PDF text extraction
  return "PDF parsing not yet implemented";
};

export const parseCSV = (text) => {
  const lines = text.split('\n');
  return lines.map(line => line.split(',').map(cell => cell.trim()));
};
