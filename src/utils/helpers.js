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

  // m16: OSB Decking — 5% replacement estimate, 32 SF per sheet
  const osbSheets = Math.ceil(totalArea * 0.05 / 32);

  return {
    shingleBundles, hipRidgeBundles, starterBundles, syntheticRolls,
    iceWaterRolls, ridgeVentCount, offRidgeVents, stepFlashingBoxes,
    dripEdgeCount, coilNailBoxes, capNailBoxes, pipeBoots,
    roofCement, touchPaint, np1, osbSheets,
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
    { id: 'osb', name: 'OSB Decking (5% est.)', qty: qty.osbSheets, price: stLabor.osbPerSheet },
  );

  const materialCost = lineItems.reduce((sum, li) => sum + (li.qty * li.price), 0);

  // Labor — pitched area with NO waste for all states
  const { totalArea = 0, pitchedArea = 0 } = building;
  const laborSquares = Math.ceil((pitchedArea || totalArea) / 100);
  const laborCost = laborSquares * stLabor.laborPerSquare;
  const tearOffCost = laborSquares * stLabor.tearOffPerSquare;
  const warrantyCost = laborSquares * stLabor.warrantyPerSq;

  // Tax on materials only
  const taxAmount = materialCost * stFin.taxRate;

  // Subtotal (equipment split at estimate level, not per-building)
  const subtotal = materialCost + laborCost + tearOffCost + warrantyCost + taxAmount;

  // Margin: total = subtotal / (1 - margin%)
  const margin = subtotal / (1 - stFin.margin) - subtotal;
  const total = subtotal + margin;

  return {
    materialCost, laborCost, tearOffCost, warrantyCost, taxAmount, margin, total,
    quantities: qty, lineItems, laborSquares,
  };
};

/**
 * Calculate full estimate cost across all buildings with equipment split.
 * Equipment (forklift, dumpster, permit) is split evenly across buildings.
 */
export const calculateEstimateCost = (buildings, materials, state, equipmentOverride, marginOverride) => {
  const stLabor = STATE_LABOR[state] || STATE_LABOR.FL;
  const stFin = STATE_FINANCIALS[state] || STATE_FINANCIALS.FL;
  const numBuildings = buildings.length || 1;

  // Equipment cost: use job-specific values if provided, otherwise 0
  const totalEquipment = equipmentOverride != null
    ? (equipmentOverride.forklift || 0) + (equipmentOverride.dumpster || 0) + (equipmentOverride.permit || 0)
    : 0;
  const equipmentPerBuilding = totalEquipment / numBuildings;

  // Margin: use job-specific override if provided (as decimal, e.g. 0.30), else state default
  const marginRate = marginOverride != null ? marginOverride : stFin.margin;

  let grandMaterialCost = 0;
  let grandLaborCost = 0;
  let grandTearOffCost = 0;
  let grandWarrantyCost = 0;
  let grandTaxAmount = 0;

  const buildingResults = buildings.map(bldg => {
    const result = calculateBuildingCost(bldg, materials, stLabor, stFin, state);
    grandMaterialCost += result.materialCost;
    grandLaborCost += result.laborCost;
    grandTearOffCost += result.tearOffCost;
    grandWarrantyCost += result.warrantyCost;
    grandTaxAmount += result.taxAmount;
    return { ...result, equipmentCost: equipmentPerBuilding };
  });

  const grandSubtotal = grandMaterialCost + grandLaborCost + grandTearOffCost + grandWarrantyCost + totalEquipment + grandTaxAmount;
  const grandMargin = grandSubtotal / (1 - marginRate) - grandSubtotal;
  const grandTotal = grandSubtotal + grandMargin;

  return {
    buildings: buildingResults,
    totalMaterial: grandMaterialCost,
    totalLabor: grandLaborCost,
    totalTearOff: grandTearOffCost,
    totalWarranty: grandWarrantyCost,
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
  const stFin = STATE_FINANCIALS[state] || financials;
  const { totalArea, wastePercent = 20, ridges = 0, hips = 0, eaves = 0, valleys = 0 } = building;
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
  const taxAmount = materialCost * stFin.taxRate;
  const subtotal = materialCost + laborCost + taxAmount;
  const margin = subtotal / (1 - stFin.margin) - subtotal;
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
        const bldgData = {
          siteplanNum: String(num),
          roofrNum: String(num),
          phase: 1,
          totalArea,
          pitchedArea: pitchedArea || totalArea,
          flatArea,
          predominantPitch: pitch,
          wastePercent: 12, // placeholder, calculated below
          eaves, valleys, hips, ridges, rakes,
          wallFlashing, stepFlashing,
          pipes: 0,
          dryerVents: 0,
        };
        bldgData.wastePercent = calculateWastePercent(bldgData);
        buildings.push(bldgData);
      }
    }
  }

  // If regex didn't find buildings, try alternate approach — look for area values near measurement labels
  if (buildings.length === 0) {
    // Try to find any building-like data patterns
    const areaMatches = [...allText.matchAll(/(?:Total\s*roof\s*area|Area)[:\s]*([\d,]+(?:\.\d+)?)\s*(?:sqft|sq\s*ft|SF)/gi)];
    areaMatches.forEach((m, idx) => {
      const bldgData = {
        siteplanNum: String(idx + 1),
        roofrNum: String(idx + 1),
        phase: 1,
        totalArea: parseFloat(m[1].replace(/,/g, '')),
        pitchedArea: parseFloat(m[1].replace(/,/g, '')),
        flatArea: 0,
        predominantPitch: '4/12',
        wastePercent: 10,
        eaves: 0, valleys: 0, hips: 0, ridges: 0, rakes: 0,
        wallFlashing: 0, stepFlashing: 0, pipes: 0, dryerVents: 0,
      };
      bldgData.wastePercent = calculateWastePercent(bldgData);
      buildings.push(bldgData);
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

      const bldgData = {
        siteplanNum: bldgNum,
        roofrNum: bldgNum,
        phase: 1,
        totalArea,
        pitchedArea: parseFloat(row[3]) || totalArea,
        flatArea: parseFloat(row[2]) || 0,
        twoStory: row[4] ? true : false,
        twoLayer: row[5] ? true : false,
        predominantPitch,
        wastePercent: 12, // placeholder
        eaves: parseFloat(row[6]) || 0,
        valleys: parseFloat(row[7]) || 0,
        hips: parseFloat(row[8]) || 0,
        ridges: parseFloat(row[9]) || 0,
        rakes: parseFloat(row[10]) || 0,
        wallFlashing: parseFloat(row[11]) || 0,
        stepFlashing: parseFloat(row[12]) || 0,
        pipes: 0,
        dryerVents: 0,
      };
      bldgData.wastePercent = calculateWastePercent(bldgData);
      result.buildings.push(bldgData);
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

// ==================== WASTE CALCULATION ====================

/**
 * Calculate waste percentage per building based on pitch and roof complexity.
 * Matches the Colony Roofers spreadsheet approach:
 *   - Base waste determined by predominant pitch
 *   - Complexity adjustment from valleys, hips, and cuts relative to roof area
 * Still editable in the Measurements table — this is the auto-calc default.
 */
export const calculateWastePercent = (building) => {
  const { totalArea = 0, predominantPitch = '4/12', valleys = 0, hips = 0, rakes = 0 } = building;

  // Parse pitch string "X/12" → number
  const pitchNum = parseInt(predominantPitch) || 4;

  // Base waste from pitch
  let base;
  if (pitchNum <= 2) base = 7;
  else if (pitchNum <= 4) base = 10;
  else if (pitchNum <= 6) base = 12;
  else if (pitchNum <= 8) base = 15;
  else if (pitchNum <= 10) base = 18;
  else base = 20;

  // Complexity factor: valleys + hips relative to area increase waste
  // More cuts = more scrap
  if (totalArea > 0) {
    const cutLF = valleys + hips;
    const complexityRatio = cutLF / totalArea;
    // Every 0.01 ratio ≈ 1% additional waste, capped at +5%
    const complexityAdj = Math.min(5, Math.round(complexityRatio * 100));
    base += complexityAdj;
  }

  return Math.max(5, Math.min(25, base));
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

// ==================== PDF GENERATION ====================

/**
 * Generate a professional estimate PDF with company branding, project details, scope, and pricing.
 * Supports multi-tier pricing and custom line items.
 * @param {Object} estimate - Estimate data
 * @param {Array} buildings - Building data
 * @param {Object} stateConfig - State configuration
 * @param {Object} options - Optional parameters
 * @param {Object} options.termsAndConditions - T&C text content and version
 * @param {boolean} options.canViewMargin - Whether to include margin data (default: true)
 */
export const generateEstimatePDF = async (estimate, buildings, stateConfig, options = {}) => {
  const { termsAndConditions, canViewMargin = true } = options;

  try {
    const { PDFDocument, rgb, StandardFonts } = await import('pdf-lib');
    const pdfDoc = await PDFDocument.create();
    const font = await pdfDoc.embedFont(StandardFonts.Helvetica);
    const fontBold = await pdfDoc.embedFont(StandardFonts.HelveticaBold);

    const NAVY = rgb(0.145, 0.157, 0.259); // #252842
    const RED = rgb(0.890, 0.024, 0.075);   // #E30613
    const DARK = rgb(0.2, 0.2, 0.2);
    const GRAY = rgb(0.4, 0.4, 0.4);
    const LIGHT = rgb(0.88, 0.88, 0.88);

    const PAGE_W = 612; // Letter width
    const PAGE_H = 792; // Letter height
    const M = 50; // Margin
    const CW = PAGE_W - 2 * M; // Content width

    const fmt = (n) => `$${(n || 0).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

    let page = pdfDoc.addPage([PAGE_W, PAGE_H]);
    let y = PAGE_H - M;
    let pageNum = 1;

    const checkNewPage = (needed = 60) => {
      if (y < M + needed) {
        page = pdfDoc.addPage([PAGE_W, PAGE_H]);
        y = PAGE_H - M;
        pageNum++;
      }
    };

    const drawText = (text, x, yPos, { size = 10, bold = false, color = DARK } = {}) => {
      const f = bold ? fontBold : font;
      page.drawText(String(text || ''), { x, y: yPos, size, font: f, color });
    };

    const drawLine = (x1, y1, x2, y2, { thickness = 0.5, color = LIGHT } = {}) => {
      page.drawLine({ start: { x: x1, y: y1 }, end: { x: x2, y: y2 }, thickness, color });
    };

    // ===== HEADER =====
    drawText('Colony Roofers', M, y, { size: 24, bold: true, color: NAVY });
    y -= 18;
    drawText('Atlanta | Tampa | Dallas', M, y, { size: 10, color: GRAY });
    y -= 8;
    drawLine(M, y, PAGE_W - M, y, { thickness: 2, color: RED });
    y -= 24;

    // ===== PROJECT DETAILS =====
    drawText('Project Details', M, y, { size: 13, bold: true, color: NAVY });
    y -= 18;

    const details = [
      ['Property:', estimate.propertyName || 'N/A'],
      ['Address:', `${estimate.address || ''} ${estimate.city || ''} ${estimate.state || ''} ${estimate.zip || ''}`.trim() || 'N/A'],
      ['Contact:', estimate.contact || estimate.contactName || 'N/A'],
      ['Phone:', estimate.phone || estimate.contactPhone || 'N/A'],
      ['Estimator:', estimate.estimatorName || 'N/A'],
      ['Date:', new Date().toLocaleDateString()],
      ['Estimate ID:', estimate.id || 'N/A'],
    ];

    details.forEach(([label, value]) => {
      drawText(label, M, y, { size: 9, bold: true, color: NAVY });
      drawText(value, M + 80, y, { size: 9, color: DARK });
      y -= 14;
    });
    y -= 10;

    // ===== SCOPE OF WORK =====
    if (estimate.type || estimate.jobType) {
      checkNewPage(100);
      drawText('Scope of Work', M, y, { size: 13, bold: true, color: NAVY });
      y -= 16;

      const scopeItems = getScopeItemsForJobType(estimate.type || estimate.jobType);
      scopeItems.forEach((item) => {
        checkNewPage();
        drawText(`•  ${item}`, M + 8, y, { size: 9, color: DARK });
        y -= 13;
      });
      y -= 10;
    }

    // ===== MATERIALS / PRICING =====
    checkNewPage(80);
    drawText('Pricing', M, y, { size: 13, bold: true, color: NAVY });
    y -= 18;

    const drawMaterialsSection = (materials = [], label) => {
      if (label) {
        drawText(label, M, y, { size: 11, bold: true, color: NAVY });
        y -= 14;
      }
      // Table header
      drawText('Item', M, y, { size: 8, bold: true, color: NAVY });
      drawText('Qty', M + 220, y, { size: 8, bold: true, color: NAVY });
      drawText('Unit Cost', M + 280, y, { size: 8, bold: true, color: NAVY });
      drawText('Amount', M + 370, y, { size: 8, bold: true, color: NAVY });
      if (canViewMargin) drawText('Margin', M + 440, y, { size: 8, bold: true, color: NAVY });
      y -= 4;
      drawLine(M, y, PAGE_W - M, y, { color: NAVY, thickness: 0.5 });
      y -= 12;

      (materials || []).forEach((item) => {
        checkNewPage();
        const lineCost = (item.qty || 0) * (item.price || 0);
        const name = String(item.name || '').substring(0, 40);
        drawText(name, M, y, { size: 8 });
        drawText(String(item.qty || 0), M + 220, y, { size: 8 });
        drawText(fmt(item.price || 0), M + 280, y, { size: 8 });
        drawText(fmt(lineCost), M + 370, y, { size: 8 });
        if (canViewMargin && item.marginPercent) {
          drawText(`${item.marginPercent.toFixed(1)}%`, M + 440, y, { size: 8 });
        }
        y -= 12;
      });
      y -= 6;
    };

    const hasMultiTier = estimate.pricingTiers && estimate.tiersEnabled;
    if (hasMultiTier) {
      const tiers = estimate.pricingTiers || [];
      tiers.forEach((tier) => {
        checkNewPage(80);
        drawMaterialsSection(tier.materials, `${tier.name || 'Option'}`);
        drawText('Tier Total:', M + 280, y, { size: 10, bold: true, color: NAVY });
        drawText(fmt(tier.total || 0), M + 370, y, { size: 10, bold: true, color: NAVY });
        y -= 20;
      });
    } else {
      drawMaterialsSection(estimate.materials);
    }

    // ===== CUSTOM LINE ITEMS =====
    if (estimate.customLineItems && estimate.customLineItems.length > 0) {
      checkNewPage(60);
      drawText('Additional Line Items', M, y, { size: 13, bold: true, color: NAVY });
      y -= 16;

      estimate.customLineItems.forEach((item) => {
        checkNewPage();
        const lineCost = (item.quantity || 0) * (item.unitCost || 0);
        drawText(item.description || '', M, y, { size: 8 });
        drawText(String(item.quantity || 0), M + 220, y, { size: 8 });
        drawText(fmt(item.unitCost || 0), M + 280, y, { size: 8 });
        drawText(fmt(lineCost), M + 370, y, { size: 8 });
        y -= 12;
      });
      y -= 10;
    }

    // ===== TOTALS =====
    checkNewPage(40);
    drawLine(M + 280, y, PAGE_W - M, y, { thickness: 1, color: NAVY });
    y -= 14;
    drawText('Total:', M + 280, y, { size: 12, bold: true, color: NAVY });
    drawText(fmt(estimate.totalCost || estimate.total || 0), M + 370, y, { size: 12, bold: true, color: NAVY });
    y -= 20;

    // ===== TERMS & CONDITIONS =====
    if (termsAndConditions && termsAndConditions.text) {
      checkNewPage(80);
      drawText('Terms and Conditions', M, y, { size: 13, bold: true, color: NAVY });
      y -= 16;

      // Split T&C into lines
      const words = termsAndConditions.text.split(' ');
      let line = '';
      words.forEach((word) => {
        const testLine = line ? `${line} ${word}` : word;
        if (font.widthOfTextAtSize(testLine, 8) > CW) {
          checkNewPage();
          drawText(line, M, y, { size: 8, color: GRAY });
          y -= 11;
          line = word;
        } else {
          line = testLine;
        }
      });
      if (line) {
        checkNewPage();
        drawText(line, M, y, { size: 8, color: GRAY });
        y -= 11;
      }

      if (termsAndConditions.version) {
        y -= 4;
        drawText(`Terms version: ${termsAndConditions.version}`, M, y, { size: 7, color: GRAY });
      }
    }

    // ===== FOOTER ON ALL PAGES =====
    const pages = pdfDoc.getPages();
    const totalPages = pages.length;
    pages.forEach((p, i) => {
      p.drawText('Colony Roofers — Atlanta | Tampa | Dallas', { x: M, y: 20, size: 8, font, color: GRAY });
      p.drawText(`Page ${i + 1} of ${totalPages}`, { x: PAGE_W - M - 60, y: 20, size: 8, font, color: GRAY });
    });

    const pdfBytes = await pdfDoc.save();
    return new Blob([pdfBytes], { type: 'application/pdf' });
  } catch (error) {
    console.error('Error generating PDF:', error);
    throw error;
  }
};

/**
 * Helper: Get scope items based on job type
 */
function getScopeItemsForJobType(jobType) {
  const scopes = {
    shingle: [
      'Remove existing roof covering and debris',
      'Inspect and repair roof deck as needed',
      'Install synthetic underlayment',
      'Install ice and water shield in critical areas',
      'Install architectural shingles with proper fastening',
      'Install hip and ridge shingles',
      'Install drip edge and flashing',
      'Clean up and haul away all debris',
      '10-year workmanship warranty',
    ],
    tpo: [
      'Remove existing roof membrane and debris',
      'Inspect and repair roof deck',
      'Install underlayment and insulation as needed',
      'Install TPO membrane with seam welding',
      'Install flashing and perimeter trim',
      'Perform final walkthrough and pressure test',
      '5-year seam warranty',
    ],
    tile: [
      'Remove existing roof covering',
      'Inspect and repair/reinforce roof structure',
      'Install underlayment and battens',
      'Install tile with proper fastening and mortar',
      'Install ridge and hip tiles',
      'Install flashing and perimeter trim',
      'Clean and seal tiles as needed',
    ],
  };
  return scopes[jobType] || scopes.shingle;
}

// ==================== CSV EXPORT ====================

/**
 * Export estimate to CSV format
 * @param {Object} estimate - Estimate data
 * @param {Array} buildings - Building data
 * @param {boolean} canViewMargin - Whether to include margin data
 * @returns {Blob} CSV blob for download
 */
export const exportEstimateToCSV = (estimate, buildings, canViewMargin = true) => {
  const rows = [];

  // Header
  rows.push(['Colony Roofers - Estimate Export']);
  rows.push(['Estimate ID', estimate.id || 'N/A']);
  rows.push(['Property', estimate.propertyName || 'N/A']);
  rows.push(['Date', new Date().toLocaleDateString()]);
  rows.push([]);

  // Line items header
  const headers = ['Item', 'Qty', 'Unit Cost', 'Total'];
  if (canViewMargin) {
    headers.push('Margin %', 'Margin Amount');
  }
  rows.push(headers);

  // Materials
  if (estimate.materials) {
    estimate.materials.forEach((item) => {
      const lineCost = (item.qty || 0) * (item.price || 0);
      const row = [
        item.name || '',
        item.qty || 0,
        item.price || 0,
        lineCost,
      ];
      if (canViewMargin) {
        const marginPct = item.marginPercent || 0;
        const marginAmount = lineCost * (marginPct / 100);
        row.push(marginPct.toFixed(2), marginAmount.toFixed(2));
      }
      rows.push(row);
    });
  }

  rows.push([]);

  // Custom line items
  if (estimate.customLineItems && estimate.customLineItems.length > 0) {
    rows.push(['Custom Line Items']);
    estimate.customLineItems.forEach((item) => {
      const lineCost = (item.quantity || 0) * (item.unitCost || 0);
      rows.push([
        item.description || '',
        item.quantity || 0,
        item.unitCost || 0,
        lineCost,
      ]);
    });
    rows.push([]);
  }

  // Summary
  rows.push(['Summary']);
  rows.push(['Subtotal', estimate.subtotal ? `$${estimate.subtotal.toFixed(2)}` : '$0.00']);
  if (canViewMargin) {
    rows.push(['Margin', estimate.margin ? `$${estimate.margin.toFixed(2)}` : '$0.00']);
  }
  rows.push(['Total', estimate.total ? `$${estimate.total.toFixed(2)}` : '$0.00']);

  // Convert to CSV
  const csv = rows.map(row => row.map(cell => `"${String(cell).replace(/"/g, '""')}"`).join(',')).join('\n');
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });

  return blob;
};

/**
 * Export pipeline overview to CSV
 * @param {Array} estimates - Array of estimates
 * @param {boolean} canViewMargin - Whether to include margin data
 * @returns {Blob} CSV blob for download
 */
export const exportPipelineToCSV = (estimates, canViewMargin = true) => {
  const rows = [];

  rows.push(['Colony Roofers - Pipeline Overview']);
  rows.push(['Export Date', new Date().toLocaleDateString()]);
  rows.push([]);

  const headers = ['ID', 'Property', 'Address', 'Status', 'Type', 'Estimator', 'Total', 'Bid Due Date'];
  if (canViewMargin) {
    headers.push('Margin %', 'Margin $');
  }
  rows.push(headers);

  estimates.forEach((est) => {
    const row = [
      est.id || '',
      est.propertyName || '',
      `${est.address || ''} ${est.city || ''} ${est.state || ''}`.trim(),
      est.status || '',
      est.jobType || '',
      est.estimatorName || '',
      est.total ? `$${est.total.toFixed(2)}` : '$0.00',
      est.bidDueDate || '',
    ];
    if (canViewMargin) {
      const marginPct = est.marginPercent || 0;
      const marginAmount = est.total * (marginPct / 100);
      row.push(marginPct.toFixed(2), `$${marginAmount.toFixed(2)}`);
    }
    rows.push(row);
  });

  const csv = rows.map(row => row.map(cell => `"${String(cell).replace(/"/g, '""')}"`).join(',')).join('\n');
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });

  return blob;
};

// ==================== DOWNLOAD HELPERS ====================

/**
 * Trigger download of a blob as a file
 * @param {Blob} blob - Blob to download
 * @param {string} filename - Filename for the download
 */
export const downloadBlob = (blob, filename) => {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
};
