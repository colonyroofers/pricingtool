import { TPO_UNIT_COSTS, TPO_DEFAULT_LABOR, STATE_LABOR, STATE_FINANCIALS } from './constants';

// ==================== SHINGLE CALCULATIONS ====================
// Formulas extracted directly from FL & GA "Total Cost Calc" spreadsheets.
// FL and GA have different quantity formulas for some items.

export const calculateShingleMaterials = (building, materials, state) => {
  const {
    totalArea = 0, pitchedArea = 0, wastePercent = 12,
    eaves = 0, valleys = 0, hips = 0, ridges = 0, rakes = 0,
    wallFlashing = 0, stepFlashing = 0, pipes = 0,
  } = building;

  const waste = (wastePercent || 12) / 100;
  const adjustedArea = totalArea * (1 + waste);
  const squares = adjustedArea / 100;

  // --- Quantity formulas matching spreadsheets exactly ---

  // m1: Shingles — ROUNDUP((totalArea * (1 + waste%)) / 100 * 3, 0) bundles
  const shingleBundles = Math.ceil(squares * 3);

  // m2: Hip & Ridge — ROUNDUP((ridges + hips) / 25, 0) bundles
  const hipRidgeBundles = Math.ceil((ridges + hips) / 25);

  // m3: Starter Strip — ROUNDUP((rakes + eaves) / 116, 0) bundles
  const starterBundles = Math.ceil((rakes + eaves) / 116);

  // m4: Synthetic Underlayment — differs by state
  // FL: ROUNDUP(totalArea / 950, 0) * 2 rolls (doubled)
  // GA: ROUNDUP(totalArea / 950, 0) rolls (single layer)
  const syntheticRolls = state !== 'FL'
    ? Math.ceil(totalArea / 950)
    : Math.ceil(totalArea / 950) * 2;

  // m5: Ice & Water Shield — ROUNDUP((valleys + stepFlashing) / 62, 0) rolls
  const iceWaterRolls = Math.ceil((valleys + stepFlashing) / 62);

  // m6: Ridge Vent — ROUNDUP(ridges / 4, 0) each
  const ridgeVentCount = Math.ceil(ridges / 4);

  // m7: Off-Ridge Vents — FL only (count from measurement data); GA excludes this
  const offRidgeVents = (state !== 'FL') ? 0 : (building.offRidgeVents || 0);

  // m8: Step Flashing — ROUNDUP(stepFlashing / 60, 0) boxes
  const stepFlashingBoxes = Math.ceil(stepFlashing / 60);

  // m9: Drip Edge — ROUNDUP((eaves + rakes) / 9.5, 0) each
  const dripEdgeCount = Math.ceil((eaves + rakes) / 9.5);

  // m10: Coil Nails — ROUND(((totalArea * (1+waste%)) / 100) * 400 / 7200, 0) boxes
  const coilNailBoxes = Math.round(squares * 400 / 7200);

  // m11: Cap Nails — ROUND(totalArea * (1+waste%) / 2000, 0) boxes
  const capNailBoxes = Math.round(adjustedArea / 2000);

  // m12: Pipe Boots — pipe count
  const pipeBoots = pipes;

  // m13: Roof Cement — FL only: ROUNDUP((eaves + rakes) / 100, 0) buckets; GA excludes this
  const roofCement = (state !== 'FL') ? 0 : Math.ceil((eaves + rakes) / 100);

  // m14: Touch Paint — pipe count
  const touchPaint = pipes;

  // m15: NP1 — pipe count
  const np1 = pipes;

  return {
    shingleBundles, hipRidgeBundles, starterBundles, syntheticRolls,
    iceWaterRolls, ridgeVentCount, offRidgeVents, stepFlashingBoxes,
    dripEdgeCount, coilNailBoxes, capNailBoxes, pipeBoots,
    roofCement, touchPaint, np1,
    adjustedArea, squares,
  };
};

/**
 * Calculate total cost for one building using state-specific formulas.
 * Equipment costs (forklift, dumpster, permit) are NOT included per-building —
 * they are split evenly across all buildings at the estimate level.
 */
export const calculateBuildingCost = (building, materials, labor, financials, state) => {
  // Use state-specific config, falling back to passed-in values
  const stLabor = STATE_LABOR[state] || labor;
  const stFin = STATE_FINANCIALS[state] || financials;

  const qty = calculateShingleMaterials(building, materials, state);

  // Build price lookup from materials array
  const prices = {};
  materials.forEach(m => { prices[m.id] = m.prices[state] || 0; });

  // Material line items
  const lineItems = [
    { id: 'm1', name: 'Architectural Shingles', qty: qty.shingleBundles, price: prices.m1 || 29.67 },
    { id: 'm2', name: 'Hip and Ridge', qty: qty.hipRidgeBundles, price: prices.m2 || 65 },
    { id: 'm3', name: 'Starter Strip', qty: qty.starterBundles, price: prices.m3 || 42 },
    { id: 'm4', name: 'Synthetic Underlayment', qty: qty.syntheticRolls, price: prices.m4 || 60 },
    { id: 'm5', name: 'Ice and Water Shield', qty: qty.iceWaterRolls, price: prices.m5 || 60 },
    { id: 'm6', name: 'Ridge Vent', qty: qty.ridgeVentCount, price: prices.m6 || 7 },
  ];

  // Off-Ridge Vents — FL only
  if (state === 'FL') {
    lineItems.push({ id: 'm7', name: 'Off-Ridge Vents', qty: qty.offRidgeVents, price: prices.m7 || 80 });
  }

  lineItems.push(
    { id: 'm8', name: 'Step Flashing', qty: qty.stepFlashingBoxes, price: prices.m8 || 55 },
    { id: 'm9', name: 'Drip Edge', qty: qty.dripEdgeCount, price: prices.m9 || 9.75 },
    { id: 'm10', name: 'Coil Nails', qty: qty.coilNailBoxes, price: prices.m10 || 36 },
    { id: 'm11', name: 'Cap Nails', qty: qty.capNailBoxes, price: prices.m11 || 16 },
    { id: 'm12', name: 'Pipe Boots', qty: qty.pipeBoots, price: prices.m12 || 4.75 },
  );

  // Roof Cement — FL only (GA/TX/TN exclude this)
  if (state === 'FL') {
    lineItems.push({ id: 'm13', name: 'Roof Cement', qty: qty.roofCement, price: prices.m13 || 8 });
  }

  lineItems.push(
    { id: 'm14', name: 'Touch Paint', qty: qty.touchPaint, price: prices.m14 || 7.25 },
    { id: 'm15', name: 'NP1', qty: qty.np1, price: prices.m15 || 8 },
  );

  const materialCost = lineItems.reduce((sum, li) => sum + (li.qty * li.price), 0);

  // Labor — state-specific basis
  // FL: ROUNDUP(pitchedArea_with_waste / 100, 0) * laborPerSquare
  // GA: ROUNDUP(totalArea / 100, 0) * laborPerSquare
  const { totalArea = 0, pitchedArea = 0, wastePercent = 12 } = building;
  const waste = (wastePercent || 12) / 100;
  let laborSquares;
  if (stLabor.laborBasis === 'total') {
    laborSquares = Math.ceil(totalArea / 100);
  } else {
    // 'pitched' — use pitched area with waste
    const pitchedWithWaste = (pitchedArea || totalArea) * (1 + waste);
    laborSquares = Math.ceil(pitchedWithWaste / 100);
  }
  const laborCost = laborSquares * stLabor.laborPerSquare;

  // Tax on materials only
  const taxAmount = materialCost * stFin.taxRate;

  // Subtotal (equipment split at estimate level, not per-building)
  const subtotal = materialCost + laborCost + taxAmount;

  // Margin: total = subtotal / (1 - margin%)
  const margin = subtotal / (1 - stFin.margin) - subtotal;
  const total = subtotal + margin;

  return {
    materialCost, laborCost, taxAmount, margin, total,
    quantities: qty, lineItems, laborSquares,
  };
};

/**
 * Calculate full estimate cost across all buildings with equipment split.
 * Equipment (forklift, dumpster, permit) is split evenly across buildings.
 */
export const calculateEstimateCost = (buildings, materials, state) => {
  const stLabor = STATE_LABOR[state] || STATE_LABOR.FL;
  const stFin = STATE_FINANCIALS[state] || STATE_FINANCIALS.FL;
  const numBuildings = buildings.length || 1;

  // Equipment cost split evenly
  const totalEquipment = stLabor.forkliftCost + stLabor.dumpsterCost + stLabor.permitCost;
  const equipmentPerBuilding = totalEquipment / numBuildings;

  let grandMaterialCost = 0;
  let grandLaborCost = 0;
  let grandTaxAmount = 0;

  const buildingResults = buildings.map(bldg => {
    const result = calculateBuildingCost(bldg, materials, stLabor, stFin, state);
    grandMaterialCost += result.materialCost;
    grandLaborCost += result.laborCost;
    grandTaxAmount += result.taxAmount;
    return { ...result, equipmentCost: equipmentPerBuilding };
  });

  const grandSubtotal = grandMaterialCost + grandLaborCost + totalEquipment + grandTaxAmount;
  const grandMargin = grandSubtotal / (1 - stFin.margin) - grandSubtotal;
  const grandTotal = grandSubtotal + grandMargin;

  return {
    buildings: buildingResults,
    totalMaterial: grandMaterialCost,
    totalLabor: grandLaborCost,
    totalEquipment,
    totalTax: grandTaxAmount,
    totalMargin: grandMargin,
    grandTotal,
    state,
    financials: stFin,
    labor: stLabor,
  };
};

// ==================== TPO CALCULATIONS ====================

export const calculateTPOCost = (materials, labor, financials) => {
  let materialCost = 0;
  const lineItems = [];

  materials.forEach(item => {
    const key = (item.name || '').toUpperCase();
    let unitCost = item.unitCost || 0;

    if (unitCost === 0) {
      for (const [costKey, costData] of Object.entries(TPO_UNIT_COSTS)) {
        if (key.includes(costKey) || costKey.includes(key)) {
          unitCost = costData.cost;
          break;
        }
      }
    }

    const lineCost = unitCost * (item.quantity || 0);
    materialCost += lineCost;
    lineItems.push({ name: item.name, quantity: item.quantity, unit: item.unit, unitCost, lineCost });
  });

  const totalSF = materials
    .filter(m => (m.name || '').toUpperCase().includes('MEMBRANE') || (m.name || '').toUpperCase().includes('ROOF ASSEMBLY'))
    .reduce((sum, m) => sum + (m.quantity || 0), 0);
  const laborCost = totalSF * (labor?.installPerSf || TPO_DEFAULT_LABOR.installPerSf);
  const tearOffCost = totalSF * (labor?.tearOffPerSf || TPO_DEFAULT_LABOR.tearOffPerSf);
  const cleanupCost = totalSF * (labor?.cleanupPerSf || TPO_DEFAULT_LABOR.cleanupPerSf);
  const totalLabor = laborCost + tearOffCost + cleanupCost;

  const taxAmount = materialCost * financials.taxRate;
  const subtotal = materialCost + totalLabor + taxAmount;
  const margin = subtotal / (1 - financials.margin) - subtotal;
  const total = subtotal + margin;

  return { materialCost, laborCost: totalLabor, taxAmount, margin, total, lineItems };
};

// ==================== TILE CALCULATIONS ====================

export const calculateTileCost = (building, labor, financials, state) => {
  const { totalArea, wastePercent = 15, ridges = 0, hips = 0, eaves = 0, valleys = 0 } = building;
  const adjustedArea = totalArea * (1 + wastePercent / 100);
  const squares = adjustedArea / 100;

  const tilePerSq = 90;
  const totalTiles = Math.ceil(squares * tilePerSq);
  const ridgeTileLF = (ridges || 0) + (hips || 0);
  const ridgeTileCount = Math.ceil(ridgeTileLF);
  const underlaymentRolls = Math.ceil(adjustedArea / 1000);

  const tileCostPerPiece = 2.85;
  const ridgeTileCostEach = 4.50;
  const underlaymentCostPerRoll = 60;
  const battensPerSq = 18;
  const battenCost = 1.25;

  const materialCost =
    totalTiles * tileCostPerPiece +
    ridgeTileCount * ridgeTileCostEach +
    underlaymentRolls * underlaymentCostPerRoll +
    squares * battensPerSq * battenCost;

  const laborCost = squares * 185;
  const taxAmount = materialCost * financials.taxRate;
  const subtotal = materialCost + laborCost + taxAmount;
  const margin = subtotal / (1 - financials.margin) - subtotal;
  const total = subtotal + margin;

  return { materialCost, laborCost, taxAmount, margin, total, quantities: { totalTiles, ridgeTileCount, underlaymentRolls, adjustedArea, squares } };
};

// ==================== FILE PARSING ====================

/**
 * Parse Roof-R PDF report.
 * Format: Each building section starts with "Summary of all structures from report #N"
 * Measurements use labels like "Total roof area", "Total eaves", etc.
 * Linear measurements are in "Xft Yin" format.
 */
export const parseRoofRPDF = async (file) => {
  const pdfjsLib = await import('pdfjs-dist');
  pdfjsLib.GlobalWorkerOptions.workerSrc = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js';

  const arrayBuffer = await file.arrayBuffer();
  const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
  let allText = '';

  for (let i = 1; i <= pdf.numPages; i++) {
    const page = await pdf.getPage(i);
    const textContent = await page.getTextContent();
    const pageText = textContent.items.map(item => item.str).join(' ');
    allText += pageText + '\n---PAGE_BREAK---\n';
  }

  const buildings = [];

  // Helper: parse "756ft 4in" -> 756.33
  const parseFtIn = (str) => {
    if (!str) return 0;
    const m = str.match(/(\d[\d,]*)ft\s*(\d+)?in/);
    if (m) return parseFloat(m[1].replace(/,/g, '')) + (parseInt(m[2] || 0) / 12);
    const m2 = str.match(/([\d,]+(?:\.\d+)?)/);
    return m2 ? parseFloat(m2[1].replace(/,/g, '')) : 0;
  };

  // Helper: parse "12997 sqft" or just "12997"
  const parseSqft = (str) => {
    if (!str) return 0;
    const m = str.match(/([\d,]+(?:\.\d+)?)/);
    return m ? parseFloat(m[1].replace(/,/g, '')) : 0;
  };

  // Split by report sections — look for "report #N" pattern
  const reportPattern = /report\s*#?\s*(\d+)/gi;
  let match;
  const reportPositions = [];
  while ((match = reportPattern.exec(allText)) !== null) {
    reportPositions.push({ num: parseInt(match[1]), pos: match.index });
  }

  if (reportPositions.length > 0) {
    for (let i = 0; i < reportPositions.length; i++) {
      const start = reportPositions[i].pos;
      const end = i + 1 < reportPositions.length ? reportPositions[i + 1].pos : allText.length;
      const section = allText.substring(start, end);
      const num = reportPositions[i].num;

      // Extract measurements from this section
      const getVal = (pattern) => {
        const m = section.match(pattern);
        return m ? m[1] : '';
      };

      const totalArea = parseSqft(getVal(/Total\s*roof\s*area\s*[:\s]*([\d,]+(?:\.\d+)?)\s*(?:sqft|sq\s*ft|SF)?/i));
      const pitchedArea = parseSqft(getVal(/Total\s*pitched\s*area\s*[:\s]*([\d,]+(?:\.\d+)?)/i));
      const flatArea = parseSqft(getVal(/Total\s*flat\s*area\s*[:\s]*([\d,]+(?:\.\d+)?)/i));
      const pitch = getVal(/(?:Predominant\s*)?[Pp]itch\s*[:\s]*(\d+\/\d+)/) || '4/12';

      // Linear measurements in ft/in format
      const eaves = parseFtIn(getVal(/Total\s*eaves?\s*[:\s]*([\d,]+ft\s*\d*in)/i));
      const valleys = parseFtIn(getVal(/Total\s*valleys?\s*[:\s]*([\d,]+ft\s*\d*in)/i));
      const hips = parseFtIn(getVal(/Total\s*hips?\s*[:\s]*([\d,]+ft\s*\d*in)/i));
      const ridges = parseFtIn(getVal(/Total\s*ridges?\s*[:\s]*([\d,]+ft\s*\d*in)/i));
      const rakes = parseFtIn(getVal(/Total\s*rakes?\s*[:\s]*([\d,]+ft\s*\d*in)/i));
      const wallFlashing = parseFtIn(getVal(/Total\s*wall\s*flashing\s*[:\s]*([\d,]+ft\s*\d*in)/i));
      const stepFlashing = parseFtIn(getVal(/Total\s*step\s*flashing\s*[:\s]*([\d,]+ft\s*\d*in)/i));

      // If we got a valid area, this is a real building
      if (totalArea > 0) {
        buildings.push({
          siteplanNum: String(num),
          roofrNum: String(num),
          phase: 1,
          totalArea,
          pitchedArea: pitchedArea || totalArea,
          flatArea,
          predominantPitch: pitch,
          wastePercent: 12,
          eaves, valleys, hips, ridges, rakes,
          wallFlashing, stepFlashing,
          pipes: 0,
          dryerVents: 0,
        });
      }
    }
  }

  // If regex didn't find buildings, try alternate approach — look for area values near measurement labels
  if (buildings.length === 0) {
    // Try to find any building-like data patterns
    const areaMatches = [...allText.matchAll(/(?:Total\s*roof\s*area|Area)[:\s]*([\d,]+(?:\.\d+)?)\s*(?:sqft|sq\s*ft|SF)/gi)];
    areaMatches.forEach((m, idx) => {
      buildings.push({
        siteplanNum: String(idx + 1),
        roofrNum: String(idx + 1),
        phase: 1,
        totalArea: parseFloat(m[1].replace(/,/g, '')),
        pitchedArea: parseFloat(m[1].replace(/,/g, '')),
        flatArea: 0,
        predominantPitch: '4/12',
        wastePercent: 12,
        eaves: 0, valleys: 0, hips: 0, ridges: 0, rakes: 0,
        wallFlashing: 0, stepFlashing: 0, pipes: 0, dryerVents: 0,
      });
    });
  }

  return { buildings, rawText: allText, pageCount: pdf.numPages };
};

/**
 * Parse Beam AI Material Import Excel.
 * Format: TAKEOFF sheet, header in row 2, Item in col B, Qty in col C, Unit in col D, Description in col G.
 * Grouped by Roof Assembly sections separated by blank rows.
 */
export const parseBeamAIExcel = async (file) => {
  const XLSX = await import('xlsx');
  const arrayBuffer = await file.arrayBuffer();
  const workbook = XLSX.read(arrayBuffer, { type: 'array' });

  const materials = [];
  // Use TAKEOFF sheet if available, otherwise first sheet
  const sheetName = workbook.SheetNames.find(s => s.toUpperCase().includes('TAKEOFF')) || workbook.SheetNames[0];
  const sheet = workbook.Sheets[sheetName];
  const data = XLSX.utils.sheet_to_json(sheet, { header: 1 });

  // Find header row — look for "Item" in col B (index 1)
  let headerRow = 0;
  for (let i = 0; i < Math.min(data.length, 10); i++) {
    const row = data[i] || [];
    if (row.some(cell => typeof cell === 'string' && cell.trim().toLowerCase() === 'item')) {
      headerRow = i;
      break;
    }
  }

  // Beam AI format: col B=Item, col C=Qty1, col D=Unit1, col E=Qty2, col F=Unit2, col G=Description
  for (let i = headerRow + 1; i < data.length; i++) {
    const row = data[i];
    if (!row || row.length < 3) continue;

    // Item is in col B (index 1)
    const name = row[1] ? String(row[1]).trim() : '';
    if (!name) continue;

    const qty = parseFloat(row[2]) || 0;
    const unit = row[3] ? String(row[3]).trim() : 'EA';
    const qty2 = parseFloat(row[4]) || 0;
    const unit2 = row[5] ? String(row[5]).trim() : '';
    const description = row[6] ? String(row[6]).trim() : '';

    // Auto-match unit cost from TPO_UNIT_COSTS
    let unitCost = 0;
    const nameUpper = name.toUpperCase();
    for (const [costKey, costData] of Object.entries(TPO_UNIT_COSTS)) {
      if (nameUpper.includes(costKey) || costKey.includes(nameUpper)) {
        unitCost = costData.cost;
        break;
      }
    }

    materials.push({ name, quantity: qty, unit, qty2, unit2, description, unitCost });
  }

  return { materials, sheetNames: workbook.SheetNames };
};

/**
 * Parse Colony Roofers shingle spreadsheet (FL/GA format).
 * Format: "1) Measurement Import" sheet has buildings starting row 2.
 * Cols: Address, Total roof area, Total flat area, Total pitched area,
 *       Two Story, Two Layer, Eaves, Valleys, Hips, Ridges, Rakes,
 *       Wall Flashing, Step Flashing, Transitions, Parapet Wall, Unspecified
 * Then pitch distribution columns follow.
 */
export const parseShingleExcel = async (file) => {
  const XLSX = await import('xlsx');
  const arrayBuffer = await file.arrayBuffer();
  const workbook = XLSX.read(arrayBuffer, { type: 'array' });

  const result = { buildings: [], sheetNames: workbook.SheetNames, jobName: '', companyName: '' };

  // Find measurement sheet
  const measureSheetName = workbook.SheetNames.find(s =>
    s.toLowerCase().includes('measurement') || s.toLowerCase().includes('import')
  );

  if (measureSheetName) {
    const sheet = workbook.Sheets[measureSheetName];
    const data = XLSX.utils.sheet_to_json(sheet, { header: 1 });

    // Row 1 is header, data starts row 2
    // Known column indices (0-based):
    // 0=Address, 1=Total roof area, 2=Total flat area, 3=Total pitched area,
    // 4=Two Story, 5=Two Layer, 6=Eaves, 7=Valleys, 8=Hips, 9=Ridges,
    // 10=Rakes, 11=Wall Flashing, 12=Step Flashing, 13=Transitions,
    // 14=Parapet Wall, 15=Unspecified
    // Columns 16+ contain pitch distribution data

    for (let i = 1; i < data.length; i++) {
      const row = data[i];
      if (!row || row.length < 7) continue;
      const totalArea = parseFloat(row[1]) || 0;
      if (totalArea === 0) continue;

      // Extract building number from address (e.g., "... - Bldg 1 Roofr")
      const address = String(row[0] || '');
      const bldgMatch = address.match(/Bldg\s*(\d+)/i);
      const bldgNum = bldgMatch ? bldgMatch[1] : String(result.buildings.length + 1);

      // Find predominant pitch from pitch distribution columns (col 16+)
      // These columns are labeled as pitch values like "0/12", then dates, then "1/12", "2/12", etc.
      let predominantPitch = '4/12';
      let maxPitchArea = 0;

      // Check headers for pitch columns
      const headers = data[0] || [];
      for (let c = 16; c < headers.length; c++) {
        const hdr = String(headers[c] || '');
        const pitchMatch = hdr.match(/^(\d+)\/12$/);
        if (pitchMatch && row[c]) {
          const pitchArea = parseFloat(row[c]) || 0;
          if (pitchArea > maxPitchArea) {
            maxPitchArea = pitchArea;
            predominantPitch = hdr;
          }
        }
      }

      result.buildings.push({
        siteplanNum: bldgNum,
        roofrNum: bldgNum,
        phase: 1,
        totalArea,
        pitchedArea: parseFloat(row[3]) || totalArea,
        flatArea: parseFloat(row[2]) || 0,
        twoStory: row[4] ? true : false,
        twoLayer: row[5] ? true : false,
        predominantPitch,
        wastePercent: 12,
        eaves: parseFloat(row[6]) || 0,
        valleys: parseFloat(row[7]) || 0,
        hips: parseFloat(row[8]) || 0,
        ridges: parseFloat(row[9]) || 0,
        rakes: parseFloat(row[10]) || 0,
        wallFlashing: parseFloat(row[11]) || 0,
        stepFlashing: parseFloat(row[12]) || 0,
        pipes: 0,
        dryerVents: 0,
      });
    }
  }

  // Try to get job info from Manual Inputs sheet
  const manualSheet = workbook.SheetNames.find(s => s.toLowerCase().includes('manual'));
  if (manualSheet) {
    const sheet = workbook.Sheets[manualSheet];
    const data = XLSX.utils.sheet_to_json(sheet, { header: 1 });
    for (let i = 0; i < Math.min(data.length, 15); i++) {
      const row = data[i] || [];
      if (String(row[0] || '').toLowerCase().includes('company name')) result.companyName = String(row[1] || '');
      if (String(row[0] || '').toLowerCase().includes('job name')) result.jobName = String(row[1] || '');
    }
  }

  return result;
};

// ==================== UTILITIES ====================

export const formatMeasurement = (str) => {
  if (!str) return 0;
  const match = str.match(/(\d+)ft\s*(\d+)?in?/);
  if (match) return parseInt(match[1]) + (parseInt(match[2] || 0) / 12);
  return parseFloat(str) || 0;
};

export const downloadCSV = (data, filename) => {
  const csv = data.map(row => row.map(cell => `"${cell}"`).join(',')).join('\n');
  const blob = new Blob([csv], { type: 'text/csv' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
};

export const parseCSV = (text) => {
  const lines = text.split('\n');
  return lines.map(line => line.split(',').map(cell => cell.trim().replace(/^"|"$/g, '')));
};
