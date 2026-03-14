import { TPO_UNIT_COSTS, TPO_DEFAULT_LABOR } from './constants';

// ==================== SHINGLE CALCULATIONS ====================

export const calculateShingleMaterials = (building, materials, state) => {
  const { totalArea, wastePercent, eaves = 0, valleys = 0, hips = 0, ridges = 0, rakes = 0, wallFlashing = 0, stepFlashing = 0, pipes = 0 } = building;
  const adjustedArea = totalArea * (1 + (wastePercent || 12) / 100);
  const squares = adjustedArea / 100;

  const shingleBundles = Math.ceil(squares * 3);
  const starterLF = (eaves || 0) + (rakes || 0);
  const starterBundles = Math.ceil(starterLF / 120);
  const hipRidgeLF = (hips || 0) + (ridges || 0);
  const hipRidgeBundles = Math.ceil(hipRidgeLF / 33);
  const iceWaterLF = (eaves || 0) + (valleys || 0) + (stepFlashing || 0);
  const iceWaterRolls = Math.ceil(iceWaterLF / 66.7);
  const syntheticRolls = Math.ceil(adjustedArea / 1000);
  const ridgeVentCount = Math.ceil((ridges || 0) / 4);
  const stepFlashingBoxes = Math.ceil((stepFlashing || 0) / 100);
  const dripEdgeCount = Math.ceil(starterLF / 10);
  const coilNailBoxes = Math.ceil(squares / 25);
  const capNailBoxes = Math.ceil(syntheticRolls / 6);
  const pipeBoots = pipes || 0;

  return {
    shingleBundles, starterBundles, hipRidgeBundles, iceWaterRolls,
    syntheticRolls, ridgeVentCount, stepFlashingBoxes, dripEdgeCount,
    coilNailBoxes, capNailBoxes, pipeBoots, adjustedArea, squares,
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
  const equipmentCost = (labor.forkliftCost || 0) + (labor.dumpsterCost || 0) + (labor.permitCost || 0);
  const taxAmount = materialCost * financials.taxRate;
  const subtotal = materialCost + laborCost + equipmentCost + taxAmount;
  const margin = subtotal / (1 - financials.margin) - subtotal;
  const total = subtotal + margin;

  return { materialCost, laborCost, equipmentCost, taxAmount, margin, total, quantities: qty };
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

  const totalSF = materials.find(m => (m.name || '').toUpperCase().includes('MEMBRANE'))?.quantity || 0;
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

export const parseRoofRPDF = async (file) => {
  const pdfjsLib = await import('pdfjs-dist');
  pdfjsLib.GlobalWorkerOptions.workerSrc = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js';

  const arrayBuffer = await file.arrayBuffer();
  const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
  const buildings = [];
  let allText = '';

  for (let i = 1; i <= pdf.numPages; i++) {
    const page = await pdf.getPage(i);
    const textContent = await page.getTextContent();
    const pageText = textContent.items.map(item => item.str).join(' ');
    allText += pageText + '\n';
  }

  // Parse building sections from Roof-R format
  const sections = allText.split(/Building\s*#?\s*(\d+)/gi);

  if (sections.length > 1) {
    for (let i = 1; i < sections.length; i += 2) {
      const num = sections[i];
      const content = sections[i + 1] || '';

      const getNum = (pattern) => {
        const m = content.match(pattern);
        return m ? parseFloat(m[1].replace(/,/g, '')) : 0;
      };

      buildings.push({
        siteplanNum: num,
        roofrNum: num,
        phase: 1,
        totalArea: getNum(/(?:Total\s*(?:Roof\s*)?Area|Area)[:\s]*([0-9,]+(?:\.\d+)?)/i),
        pitchedArea: getNum(/Pitched\s*Area[:\s]*([0-9,]+(?:\.\d+)?)/i),
        predominantPitch: (content.match(/Pitch[:\s]*([\d]+\/[\d]+)/i) || [])[1] || '4/12',
        wastePercent: getNum(/Waste[:\s]*([0-9]+)/i) || 12,
        eaves: getNum(/Eaves?[:\s]*([0-9,]+(?:\.\d+)?)/i),
        valleys: getNum(/Valley[s]?[:\s]*([0-9,]+(?:\.\d+)?)/i),
        hips: getNum(/Hips?[:\s]*([0-9,]+(?:\.\d+)?)/i),
        ridges: getNum(/Ridge[s]?[:\s]*([0-9,]+(?:\.\d+)?)/i),
        rakes: getNum(/Rake[s]?[:\s]*([0-9,]+(?:\.\d+)?)/i),
        wallFlashing: getNum(/Wall\s*Flash[:\s]*([0-9,]+(?:\.\d+)?)/i),
        stepFlashing: getNum(/Step\s*Flash[:\s]*([0-9,]+(?:\.\d+)?)/i),
        pipes: getNum(/Pipe[s]?[:\s]*(\d+)/i),
        dryerVents: getNum(/(?:Dryer\s*)?Vent[s]?[:\s]*(\d+)/i),
      });
    }
  }

  return { buildings, rawText: allText, pageCount: pdf.numPages };
};

export const parseBeamAIExcel = async (file) => {
  const XLSX = await import('xlsx');
  const arrayBuffer = await file.arrayBuffer();
  const workbook = XLSX.read(arrayBuffer, { type: 'array' });

  const materials = [];
  const sheet = workbook.Sheets[workbook.SheetNames[0]];
  const data = XLSX.utils.sheet_to_json(sheet, { header: 1 });

  let headerRow = 0;
  for (let i = 0; i < Math.min(data.length, 10); i++) {
    const row = data[i];
    if (row && row.some(cell => typeof cell === 'string' && (
      cell.toLowerCase().includes('description') ||
      cell.toLowerCase().includes('material') ||
      cell.toLowerCase().includes('item') ||
      cell.toLowerCase().includes('name')
    ))) {
      headerRow = i;
      break;
    }
  }

  const headers = (data[headerRow] || []).map(h => String(h || '').toLowerCase().trim());
  const nameIdx = headers.findIndex(h => h.includes('description') || h.includes('material') || h.includes('item') || h.includes('name'));
  const qtyIdx = headers.findIndex(h => h.includes('qty') || h.includes('quantity') || h.includes('count') || h.includes('amount'));
  const unitIdx = headers.findIndex(h => h.includes('unit') || h.includes('uom'));
  const costIdx = headers.findIndex(h => h.includes('cost') || h.includes('price') || h.includes('rate'));

  for (let i = headerRow + 1; i < data.length; i++) {
    const row = data[i];
    if (!row || row.length === 0) continue;
    const name = nameIdx >= 0 ? String(row[nameIdx] || '') : '';
    if (!name || name.trim() === '') continue;

    materials.push({
      name: name.trim(),
      quantity: qtyIdx >= 0 ? parseFloat(row[qtyIdx]) || 0 : 0,
      unit: unitIdx >= 0 ? String(row[unitIdx] || '') : 'EA',
      unitCost: costIdx >= 0 ? parseFloat(row[costIdx]) || 0 : 0,
    });
  }

  return { materials, sheetNames: workbook.SheetNames };
};

export const parseShingleExcel = async (file) => {
  const XLSX = await import('xlsx');
  const arrayBuffer = await file.arrayBuffer();
  const workbook = XLSX.read(arrayBuffer, { type: 'array' });

  const result = { buildings: [], sheetNames: workbook.SheetNames };

  const measureSheet = workbook.SheetNames.find(s =>
    s.toLowerCase().includes('measurement') || s.toLowerCase().includes('import')
  );

  if (measureSheet) {
    const sheet = workbook.Sheets[measureSheet];
    const data = XLSX.utils.sheet_to_json(sheet, { header: 1 });

    let headerRow = 0;
    for (let i = 0; i < Math.min(data.length, 10); i++) {
      const row = data[i];
      if (row && row.some(cell => typeof cell === 'string' && (
        cell.toLowerCase().includes('building') || cell.toLowerCase().includes('area')
      ))) {
        headerRow = i;
        break;
      }
    }

    const headers = (data[headerRow] || []).map(h => String(h || '').toLowerCase().trim());

    for (let i = headerRow + 1; i < data.length; i++) {
      const row = data[i];
      if (!row || row.length < 2) continue;

      const getCol = (keywords) => {
        const idx = headers.findIndex(h => keywords.some(k => h.includes(k)));
        return idx >= 0 ? parseFloat(row[idx]) || 0 : 0;
      };

      const building = {
        siteplanNum: String(row[0] || i - headerRow),
        roofrNum: String(row[0] || i - headerRow),
        phase: 1,
        totalArea: getCol(['total area', 'area', 'sqft', 'sq ft']),
        pitchedArea: getCol(['pitched', 'area']),
        predominantPitch: '4/12',
        wastePercent: getCol(['waste']) || 12,
        eaves: getCol(['eave']),
        valleys: getCol(['valley']),
        hips: getCol(['hip']),
        ridges: getCol(['ridge']),
        rakes: getCol(['rake']),
        wallFlashing: getCol(['wall flash']),
        stepFlashing: getCol(['step flash']),
        pipes: getCol(['pipe']),
        dryerVents: getCol(['dryer', 'vent']),
      };

      if (building.totalArea > 0) {
        result.buildings.push(building);
      }
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
