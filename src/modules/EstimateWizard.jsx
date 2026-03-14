import React, { useState, useRef, useEffect } from 'react';
import { C, EMPTY_BUILDING, DEFAULT_SHINGLE_MATERIALS, DEFAULT_LABOR, DEFAULT_FINANCIALS,
  BUILDING_CODE_WARNINGS, SCOPE_ITEMS, UNIT_COSTS_TEXT, EXCLUSIONS, TPO_DEFAULT_LABOR,
  fmt, fmtInt, generateId } from '../utils/constants';
import { calculateBuildingCost, calculateTPOCost, calculateTileCost,
  parseRoofRPDF, parseBeamAIExcel, parseShingleExcel } from '../utils/helpers';
import DataTable from '../components/DataTable';

const DEMO_BUILDINGS = [
  { siteplanNum: "1", roofrNum: "1", phase: 1, totalArea: 12997, pitchedArea: 12997, predominantPitch: "4/12", wastePercent: 12, eaves: 494.4, valleys: 421.3, hips: 254.0, ridges: 265.4, rakes: 385.8, wallFlashing: 203.3, stepFlashing: 86.5, pipes: 6, dryerVents: 3 },
  { siteplanNum: "2", roofrNum: "2", phase: 1, totalArea: 16476, pitchedArea: 16476, predominantPitch: "4/12", wastePercent: 14, eaves: 756.3, valleys: 495.1, hips: 519.8, ridges: 298.6, rakes: 418.0, wallFlashing: 194.8, stepFlashing: 242.4, pipes: 8, dryerVents: 3 },
  { siteplanNum: "3", roofrNum: "3", phase: 1, totalArea: 16482, pitchedArea: 16482, predominantPitch: "4/12", wastePercent: 13, eaves: 761.9, valleys: 495.0, hips: 509.3, ridges: 303.0, rakes: 403.1, wallFlashing: 198.5, stepFlashing: 253.8, pipes: 8, dryerVents: 3 },
  { siteplanNum: "4", roofrNum: "4", phase: 1, totalArea: 12857, pitchedArea: 12857, predominantPitch: "4/12", wastePercent: 12, eaves: 506.3, valleys: 422.4, hips: 261.9, ridges: 265.9, rakes: 378.0, wallFlashing: 195.8, stepFlashing: 94.7, pipes: 6, dryerVents: 3 },
  { siteplanNum: "5", roofrNum: "5", phase: 1, totalArea: 14695, pitchedArea: 14695, predominantPitch: "4/12", wastePercent: 14, eaves: 545.3, valleys: 590.5, hips: 407.7, ridges: 298.3, rakes: 410.6, wallFlashing: 201.7, stepFlashing: 89.3, pipes: 7, dryerVents: 3 },
];

export default function EstimateWizard({ estimate, onSave, onClose }) {
  const [step, setStep] = useState(1);
  const [buildings, setBuildings] = useState(estimate?.buildings?.length > 0 ? estimate.buildings : []);
  const [tpoMaterials, setTpoMaterials] = useState(estimate?.tpoMaterials || []);
  const [marketState, setMarketState] = useState(estimate?.state || 'FL');
  const [estimateName, setEstimateName] = useState(estimate?.propertyName || '');
  const [estimateType, setEstimateType] = useState(estimate?.type || 'shingle');
  const [uploadStatus, setUploadStatus] = useState('');
  const [parsing, setParsing] = useState(false);
  const [proposalMode, setProposalMode] = useState('total'); // 'total' or 'itemized'
  const fileInputRef = useRef(null);

  useEffect(() => {
    if (estimate) {
      setEstimateName(estimate.propertyName || '');
      setMarketState(estimate.state || 'FL');
      setEstimateType(estimate.type || 'shingle');
      if (estimate.buildings?.length > 0) setBuildings(estimate.buildings);
      if (estimate.tpoMaterials?.length > 0) setTpoMaterials(estimate.tpoMaterials);
    }
  }, [estimate]);

  const handleFileUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    setParsing(true);
    setUploadStatus(`Parsing ${file.name}...`);

    try {
      const ext = file.name.toLowerCase().split('.').pop();

      if (ext === 'pdf') {
        const result = await parseRoofRPDF(file);
        if (result.buildings.length > 0) {
          setBuildings(result.buildings);
          setUploadStatus(`Parsed ${result.buildings.length} buildings from ${result.pageCount} pages`);
        } else {
          setUploadStatus(`PDF parsed (${result.pageCount} pages) — no building data auto-detected. Raw text extracted. You can add buildings manually.`);
        }
      } else if (ext === 'xlsx' || ext === 'xls' || ext === 'csv') {
        if (estimateType === 'tpo') {
          const result = await parseBeamAIExcel(file);
          setTpoMaterials(result.materials);
          setUploadStatus(`Imported ${result.materials.length} materials from ${file.name}`);
        } else {
          const result = await parseShingleExcel(file);
          if (result.buildings.length > 0) {
            setBuildings(result.buildings);
            setUploadStatus(`Imported ${result.buildings.length} buildings from ${file.name}`);
          } else {
            setUploadStatus(`Spreadsheet parsed — no measurement data found. Try uploading a Roof-R export or add buildings manually.`);
          }
        }
      } else {
        setUploadStatus('Unsupported file type. Please upload PDF or Excel files.');
      }
    } catch (err) {
      console.error('Parse error:', err);
      setUploadStatus(`Error parsing file: ${err.message}`);
    }

    setParsing(false);
  };

  const handleAddBuilding = () => {
    setBuildings([...buildings, {
      ...EMPTY_BUILDING,
      siteplanNum: String(buildings.length + 1),
      roofrNum: String(buildings.length + 1),
    }]);
  };

  const handleLoadDemo = () => {
    setBuildings(DEMO_BUILDINGS);
    setEstimateName('Willow Bridge');
    setUploadStatus('Loaded demo data (Willow Bridge — 5 buildings)');
  };

  const handleSave = () => {
    const totalCost = getTotalCost();
    const updated = {
      ...(estimate || { id: generateId(), status: 'unassigned', createdAt: new Date().toISOString() }),
      propertyName: estimateName,
      state: marketState,
      type: estimateType,
      buildings,
      tpoMaterials,
      totalCost,
      updatedAt: new Date().toISOString(),
    };
    onSave(updated);
  };

  // ==================== COST CALCULATIONS ====================

  const getShingleCosts = () => {
    let total = 0;
    const rows = buildings.map(b => {
      const cost = calculateBuildingCost(b, DEFAULT_SHINGLE_MATERIALS, DEFAULT_LABOR, DEFAULT_FINANCIALS, marketState);
      total += cost.total;
      return { building: b.siteplanNum, ...cost };
    });
    return { rows, total };
  };

  const getTPOCosts = () => {
    return calculateTPOCost(tpoMaterials, TPO_DEFAULT_LABOR, DEFAULT_FINANCIALS);
  };

  const getTileCosts = () => {
    let total = 0;
    const rows = buildings.map(b => {
      const cost = calculateTileCost(b, DEFAULT_LABOR, DEFAULT_FINANCIALS, marketState);
      total += cost.total;
      return { building: b.siteplanNum, ...cost };
    });
    return { rows, total };
  };

  const getTotalCost = () => {
    if (estimateType === 'tpo') return getTPOCosts().total;
    if (estimateType === 'tile') return getTileCosts().total;
    return getShingleCosts().total;
  };

  // ==================== COLUMN DEFS ====================

  const shingleColumns = [
    { key: 'siteplanNum', label: 'Bldg #', editable: true },
    { key: 'totalArea', label: 'Area (SF)', editable: true, type: 'number' },
    { key: 'predominantPitch', label: 'Pitch', editable: true },
    { key: 'wastePercent', label: 'Waste %', editable: true, type: 'number' },
    { key: 'eaves', label: 'Eaves (LF)', editable: true, type: 'number' },
    { key: 'valleys', label: 'Valleys (LF)', editable: true, type: 'number' },
    { key: 'hips', label: 'Hips (LF)', editable: true, type: 'number' },
    { key: 'ridges', label: 'Ridges (LF)', editable: true, type: 'number' },
    { key: 'rakes', label: 'Rakes (LF)', editable: true, type: 'number' },
    { key: 'stepFlashing', label: 'Step Flash (LF)', editable: true, type: 'number' },
    { key: 'pipes', label: 'Pipes', editable: true, type: 'number' },
  ];

  const tpoColumns = [
    { key: 'name', label: 'Material', editable: true },
    { key: 'quantity', label: 'Qty', editable: true, type: 'number' },
    { key: 'unit', label: 'Unit', editable: true },
    { key: 'unitCost', label: 'Unit Cost', editable: true, type: 'number' },
  ];

  // ==================== STEP RENDERERS ====================

  const renderStep1 = () => (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      <h3 style={{ fontSize: 16, fontWeight: 600, color: C.navy }}>Upload Project Data</h3>

      {/* File Upload Zone */}
      <div
        onClick={() => fileInputRef.current?.click()}
        style={{
          border: `2px dashed ${C.gray300}`,
          borderRadius: 8,
          padding: 32,
          textAlign: 'center',
          backgroundColor: C.gray50,
          cursor: 'pointer',
          transition: 'border-color 0.2s',
        }}
        onMouseOver={(e) => e.currentTarget.style.borderColor = C.blue}
        onMouseOut={(e) => e.currentTarget.style.borderColor = C.gray300}
      >
        <input
          ref={fileInputRef}
          type="file"
          accept=".pdf,.xlsx,.xls,.csv"
          onChange={handleFileUpload}
          style={{ display: 'none' }}
        />
        <p style={{ fontSize: 24, marginBottom: 8 }}>
          {estimateType === 'tpo' ? '📊' : '📄'}
        </p>
        <p style={{ fontSize: 14, fontWeight: 600, color: C.navy, marginBottom: 4 }}>
          {parsing ? 'Parsing...' : 'Click to upload or drag a file here'}
        </p>
        <p style={{ fontSize: 12, color: C.gray500 }}>
          {estimateType === 'tpo'
            ? 'Beam AI takeoff (Excel) or PDF'
            : 'Roof-R PDF report or measurement spreadsheet'}
        </p>
      </div>

      {uploadStatus && (
        <div style={{
          padding: 12,
          backgroundColor: uploadStatus.includes('Error') ? C.redBg : C.greenBg,
          borderRadius: 8,
          fontSize: 13,
          color: uploadStatus.includes('Error') ? C.red : C.green,
        }}>
          {uploadStatus}
        </div>
      )}

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
        <div>
          <label style={{ fontSize: 12, fontWeight: 600, color: C.navy, display: 'block', marginBottom: 6 }}>Estimate Name</label>
          <input type="text" value={estimateName} onChange={(e) => setEstimateName(e.target.value)}
            style={{ width: '100%', padding: '10px 12px', border: `1px solid ${C.gray300}`, borderRadius: 8, fontSize: 14, boxSizing: 'border-box' }} />
        </div>
        <div>
          <label style={{ fontSize: 12, fontWeight: 600, color: C.navy, display: 'block', marginBottom: 6 }}>Market/State</label>
          <select value={marketState} onChange={(e) => setMarketState(e.target.value)}
            style={{ width: '100%', padding: '10px 12px', border: `1px solid ${C.gray300}`, borderRadius: 8, fontSize: 14, boxSizing: 'border-box' }}>
            <option value="FL">Florida (TPA)</option>
            <option value="GA">Georgia (ATL)</option>
            <option value="TX">Texas (DFW)</option>
            <option value="TN">Tennessee (NSH)</option>
          </select>
        </div>
      </div>

      <div>
        <label style={{ fontSize: 12, fontWeight: 600, color: C.navy, display: 'block', marginBottom: 6 }}>Estimate Type</label>
        <div style={{ display: 'flex', gap: 10 }}>
          {[{ key: 'shingle', label: 'Shingle', icon: '🏠' }, { key: 'tile', label: 'Tile', icon: '🧱' }, { key: 'tpo', label: 'TPO', icon: '🏢' }].map(t => (
            <button key={t.key} onClick={() => setEstimateType(t.key)}
              style={{
                flex: 1, padding: '12px', border: `2px solid ${estimateType === t.key ? C.red : C.gray200}`,
                borderRadius: 8, backgroundColor: estimateType === t.key ? C.redBg : C.white,
                cursor: 'pointer', fontSize: 13, fontWeight: 600, color: estimateType === t.key ? C.red : C.gray600,
                transition: 'all 0.15s',
              }}>
              <span style={{ fontSize: 20, display: 'block', marginBottom: 4 }}>{t.icon}</span>
              {t.label}
            </button>
          ))}
        </div>
      </div>

      {buildings.length === 0 && tpoMaterials.length === 0 && (
        <button onClick={handleLoadDemo}
          style={{ padding: '10px', backgroundColor: C.blueBg, color: C.blue, border: `1px solid ${C.blue}`,
            borderRadius: 8, fontSize: 13, fontWeight: 500, cursor: 'pointer' }}>
          Load Demo Data (Willow Bridge)
        </button>
      )}
    </div>
  );

  const renderStep2 = () => {
    if (estimateType === 'tpo') {
      return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <h3 style={{ fontSize: 16, fontWeight: 600, color: C.navy }}>Materials ({tpoMaterials.length} items)</h3>
            <button onClick={() => setTpoMaterials([...tpoMaterials, { name: '', quantity: 0, unit: 'EA', unitCost: 0 }])}
              style={{ padding: '6px 12px', backgroundColor: C.blue, color: C.white, border: 'none', borderRadius: 6, fontSize: 12, fontWeight: 600, cursor: 'pointer' }}>
              + Add Material
            </button>
          </div>
          <DataTable columns={tpoColumns} data={tpoMaterials} onDataChange={setTpoMaterials} searchable={true} />
        </div>
      );
    }

    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <h3 style={{ fontSize: 16, fontWeight: 600, color: C.navy }}>Buildings ({buildings.length})</h3>
          <button onClick={handleAddBuilding}
            style={{ padding: '6px 12px', backgroundColor: C.blue, color: C.white, border: 'none', borderRadius: 6, fontSize: 12, fontWeight: 600, cursor: 'pointer' }}>
            + Add Building
          </button>
        </div>
        <DataTable columns={shingleColumns} data={buildings} onDataChange={setBuildings} searchable={false} />
      </div>
    );
  };

  const renderStep3 = () => {
    const warnings = BUILDING_CODE_WARNINGS[marketState] || [];

    if (estimateType === 'tpo') {
      const tpoCosts = getTPOCosts();
      return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
          <h3 style={{ fontSize: 16, fontWeight: 600, color: C.navy }}>TPO Pricing</h3>

          {warnings.length > 0 && (
            <div style={{ backgroundColor: C.blueBg, padding: 14, borderRadius: 8, borderLeft: `4px solid ${C.blue}` }}>
              <p style={{ fontSize: 12, fontWeight: 600, color: C.blue, marginBottom: 6 }}>Building Code Warnings — {marketState}</p>
              {warnings.slice(0, 2).map((w, i) => <p key={i} style={{ fontSize: 12, color: C.blue, marginBottom: 3 }}>• {w}</p>)}
            </div>
          )}

          <table style={{ width: '100%', borderCollapse: 'collapse', backgroundColor: C.white, border: `1px solid ${C.gray200}`, borderRadius: 8, overflow: 'hidden' }}>
            <thead>
              <tr style={{ backgroundColor: C.gray50 }}>
                <th style={thStyle}>Item</th>
                <th style={{ ...thStyle, textAlign: 'right' }}>Qty</th>
                <th style={{ ...thStyle, textAlign: 'right' }}>Unit Cost</th>
                <th style={{ ...thStyle, textAlign: 'right' }}>Total</th>
              </tr>
            </thead>
            <tbody>
              {tpoCosts.lineItems.filter(li => li.lineCost > 0).map((li, i) => (
                <tr key={i} style={{ backgroundColor: i % 2 === 0 ? C.white : C.gray50, borderBottom: `1px solid ${C.gray200}` }}>
                  <td style={tdStyle}>{li.name}</td>
                  <td style={{ ...tdStyle, textAlign: 'right' }}>{li.quantity} {li.unit}</td>
                  <td style={{ ...tdStyle, textAlign: 'right' }}>{fmt(li.unitCost)}</td>
                  <td style={{ ...tdStyle, textAlign: 'right', fontWeight: 600 }}>{fmt(li.lineCost)}</td>
                </tr>
              ))}
            </tbody>
          </table>

          {renderCostSummary(tpoCosts)}
        </div>
      );
    }

    // Shingle or Tile pricing
    const costData = estimateType === 'tile' ? getTileCosts() : getShingleCosts();

    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
        <h3 style={{ fontSize: 16, fontWeight: 600, color: C.navy }}>
          {estimateType === 'tile' ? 'Tile' : 'Shingle'} Pricing
        </h3>

        {warnings.length > 0 && (
          <div style={{ backgroundColor: C.blueBg, padding: 14, borderRadius: 8, borderLeft: `4px solid ${C.blue}` }}>
            <p style={{ fontSize: 12, fontWeight: 600, color: C.blue, marginBottom: 6 }}>Building Code Warnings — {marketState}</p>
            {warnings.slice(0, 3).map((w, i) => <p key={i} style={{ fontSize: 12, color: C.blue, marginBottom: 3 }}>• {w}</p>)}
          </div>
        )}

        <table style={{ width: '100%', borderCollapse: 'collapse', backgroundColor: C.white, border: `1px solid ${C.gray200}`, borderRadius: 8, overflow: 'hidden' }}>
          <thead>
            <tr style={{ backgroundColor: C.gray50 }}>
              <th style={thStyle}>Building</th>
              <th style={{ ...thStyle, textAlign: 'right' }}>Material</th>
              <th style={{ ...thStyle, textAlign: 'right' }}>Labor</th>
              <th style={{ ...thStyle, textAlign: 'right' }}>Equipment</th>
              <th style={{ ...thStyle, textAlign: 'right' }}>Total</th>
            </tr>
          </thead>
          <tbody>
            {costData.rows.map((row, i) => (
              <tr key={i} style={{ backgroundColor: i % 2 === 0 ? C.white : C.gray50, borderBottom: `1px solid ${C.gray200}` }}>
                <td style={tdStyle}>Building {row.building}</td>
                <td style={{ ...tdStyle, textAlign: 'right' }}>{fmt(row.materialCost)}</td>
                <td style={{ ...tdStyle, textAlign: 'right' }}>{fmt(row.laborCost)}</td>
                <td style={{ ...tdStyle, textAlign: 'right' }}>{fmt(row.equipmentCost || 0)}</td>
                <td style={{ ...tdStyle, textAlign: 'right', fontWeight: 600, color: C.navy }}>{fmt(row.total)}</td>
              </tr>
            ))}
          </tbody>
        </table>

        <div style={{
          backgroundColor: C.gray100, padding: 16, borderRadius: 8,
          display: 'flex', justifyContent: 'space-between', alignItems: 'center',
        }}>
          <span style={{ fontSize: 14, fontWeight: 600, color: C.navy }}>Total Project Cost (with margin & tax):</span>
          <span style={{ fontSize: 22, fontWeight: 700, color: C.red }}>{fmtInt(costData.total)}</span>
        </div>
      </div>
    );
  };

  const renderStep4 = () => {
    const totalCost = getTotalCost();

    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <h3 style={{ fontSize: 16, fontWeight: 600, color: C.navy }}>Proposal Preview</h3>
          <div style={{ display: 'flex', gap: 8 }}>
            <button onClick={() => setProposalMode('total')}
              style={{ padding: '6px 12px', backgroundColor: proposalMode === 'total' ? C.navy : C.gray200,
                color: proposalMode === 'total' ? C.white : C.gray600, border: 'none', borderRadius: 6, fontSize: 12, fontWeight: 600, cursor: 'pointer' }}>
              Total Only
            </button>
            <button onClick={() => setProposalMode('itemized')}
              style={{ padding: '6px 12px', backgroundColor: proposalMode === 'itemized' ? C.navy : C.gray200,
                color: proposalMode === 'itemized' ? C.white : C.gray600, border: 'none', borderRadius: 6, fontSize: 12, fontWeight: 600, cursor: 'pointer' }}>
              Itemized
            </button>
          </div>
        </div>

        <div style={{
          backgroundColor: C.white, border: `1px solid ${C.gray200}`, borderRadius: 8,
          padding: 28, fontSize: 13, lineHeight: 1.7, color: C.gray700,
        }}>
          {/* Header */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 24, paddingBottom: 16, borderBottom: `2px solid ${C.red}` }}>
            <div>
              <h2 style={{ fontSize: 20, fontWeight: 700, color: C.navy, margin: 0 }}>Colony Roofers</h2>
              <p style={{ fontSize: 12, color: C.gray500, margin: '4px 0 0' }}>Commercial Roofing Proposal</p>
            </div>
            <div style={{ textAlign: 'right' }}>
              <p style={{ fontSize: 12, color: C.gray500, margin: 0 }}>Date: {new Date().toLocaleDateString()}</p>
              <p style={{ fontSize: 12, color: C.gray500, margin: '2px 0 0' }}>Estimate #: {estimate?.id?.slice(0, 6).toUpperCase() || 'DRAFT'}</p>
            </div>
          </div>

          {/* Property Info */}
          <div style={{ marginBottom: 20 }}>
            <h4 style={{ fontSize: 14, fontWeight: 600, color: C.navy, marginBottom: 6 }}>Property</h4>
            <p style={{ margin: 0 }}>{estimateName}</p>
            {estimate?.address && <p style={{ margin: '2px 0', color: C.gray500 }}>{estimate.address}, {estimate.city} {marketState} {estimate.zip}</p>}
          </div>

          {/* Scope of Work */}
          <h4 style={{ fontSize: 14, fontWeight: 600, color: C.navy, marginBottom: 8 }}>Scope of Work</h4>
          <ul style={{ marginLeft: 20, marginBottom: 20 }}>
            {SCOPE_ITEMS.map((item, i) => (
              <li key={i} style={{ marginBottom: 6 }}>{item}</li>
            ))}
          </ul>

          {/* Pricing */}
          {proposalMode === 'itemized' && estimateType !== 'tpo' && (
            <div style={{ marginBottom: 20 }}>
              <h4 style={{ fontSize: 14, fontWeight: 600, color: C.navy, marginBottom: 8 }}>Pricing by Building</h4>
              {(estimateType === 'tile' ? getTileCosts() : getShingleCosts()).rows.map((row, i) => (
                <div key={i} style={{ display: 'flex', justifyContent: 'space-between', padding: '6px 0', borderBottom: `1px solid ${C.gray100}` }}>
                  <span>Building {row.building}</span>
                  <span style={{ fontWeight: 600 }}>{fmt(row.total)}</span>
                </div>
              ))}
            </div>
          )}

          <h4 style={{ fontSize: 14, fontWeight: 600, color: C.navy, marginBottom: 8 }}>Project Total</h4>
          <p style={{ fontSize: 20, fontWeight: 700, color: C.red, marginBottom: 20 }}>
            {fmtInt(totalCost)}
          </p>

          {/* Unit Cost Extras */}
          <h4 style={{ fontSize: 14, fontWeight: 600, color: C.navy, marginBottom: 8 }}>Additional Unit Costs</h4>
          <ul style={{ marginLeft: 20, marginBottom: 20 }}>
            {UNIT_COSTS_TEXT.map((item, i) => (
              <li key={i} style={{ marginBottom: 6 }}>{item}</li>
            ))}
          </ul>

          {/* Exclusions */}
          <h4 style={{ fontSize: 14, fontWeight: 600, color: C.navy, marginBottom: 8 }}>Exclusions</h4>
          <p style={{ marginBottom: 20 }}>{EXCLUSIONS}</p>

          {/* Terms */}
          <h4 style={{ fontSize: 14, fontWeight: 600, color: C.navy, marginBottom: 8 }}>Terms & Conditions</h4>
          <p style={{ marginBottom: 6 }}>50% deposit to schedule, remaining balance due upon completion.</p>
          <p style={{ marginBottom: 6 }}>This estimate is valid for 30 days from the date above.</p>
          <p>All work performed under this contract carries a manufacturer warranty and a two (2) year workmanship warranty.</p>
        </div>

        {/* Action Buttons */}
        <div style={{ display: 'flex', gap: 12 }}>
          <button onClick={handleExportPDF}
            style={{ flex: 1, padding: '12px', backgroundColor: C.blue, color: C.white, border: 'none', borderRadius: 8, fontSize: 13, fontWeight: 600, cursor: 'pointer' }}>
            Export as PDF
          </button>
          <button onClick={handleSave}
            style={{ flex: 1, padding: '12px', backgroundColor: C.green, color: C.white, border: 'none', borderRadius: 8, fontSize: 13, fontWeight: 600, cursor: 'pointer' }}>
            Save Estimate
          </button>
        </div>
      </div>
    );
  };

  const handleExportPDF = async () => {
    try {
      const { PDFDocument, rgb, StandardFonts } = await import('pdf-lib');
      const pdfDoc = await PDFDocument.create();
      const font = await pdfDoc.embedFont(StandardFonts.Helvetica);
      const boldFont = await pdfDoc.embedFont(StandardFonts.HelveticaBold);

      let page = pdfDoc.addPage([612, 792]);
      let y = 740;
      const lm = 50;
      const navy = rgb(0.106, 0.165, 0.290);
      const red = rgb(0.902, 0.224, 0.275);
      const gray = rgb(0.4, 0.4, 0.4);

      const addText = (text, x, size, fontType, color) => {
        if (y < 60) {
          page = pdfDoc.addPage([612, 792]);
          y = 740;
        }
        page.drawText(text, { x, y, size, font: fontType || font, color: color || gray });
      };

      // Header
      addText('Colony Roofers', lm, 22, boldFont, navy);
      y -= 20;
      addText('Commercial Roofing Proposal', lm, 11, font, gray);
      y -= 14;
      addText(`Date: ${new Date().toLocaleDateString()}`, lm, 10, font, gray);
      y -= 30;

      // Red line
      page.drawLine({ start: { x: lm, y }, end: { x: 562, y }, thickness: 2, color: red });
      y -= 25;

      // Property
      addText('Property:', lm, 12, boldFont, navy);
      y -= 16;
      addText(estimateName, lm, 11, font, gray);
      y -= 14;
      if (estimate?.address) {
        addText(`${estimate.address}, ${estimate.city || ''} ${marketState} ${estimate.zip || ''}`, lm, 10, font, gray);
        y -= 20;
      }
      y -= 10;

      // Scope
      addText('Scope of Work:', lm, 12, boldFont, navy);
      y -= 16;
      SCOPE_ITEMS.forEach(item => {
        const lines = wrapText(item, font, 10, 500);
        lines.forEach(line => {
          addText(`  •  ${line}`, lm, 10, font, gray);
          y -= 14;
        });
        y -= 2;
      });
      y -= 10;

      // Total
      addText('Project Total:', lm, 12, boldFont, navy);
      y -= 20;
      addText(fmtInt(getTotalCost()), lm, 18, boldFont, red);
      y -= 30;

      // Terms
      addText('Terms & Conditions:', lm, 12, boldFont, navy);
      y -= 16;
      addText('50% deposit to schedule, remaining balance due upon completion.', lm, 10, font, gray);
      y -= 14;
      addText('This estimate is valid for 30 days.', lm, 10, font, gray);
      y -= 14;
      addText('All work carries manufacturer warranty and 2-year workmanship warranty.', lm, 10, font, gray);

      const pdfBytes = await pdfDoc.save();
      const blob = new Blob([pdfBytes], { type: 'application/pdf' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${estimateName || 'Proposal'}_Colony_Roofers.pdf`;
      a.click();
      URL.revokeObjectURL(url);
    } catch (err) {
      console.error('PDF export error:', err);
      alert('Error generating PDF: ' + err.message);
    }
  };

  // ==================== RENDER ====================

  const steps = ['Upload', 'Measurements', 'Pricing', 'Proposal'];

  return (
    <div style={{ width: '100%', height: '100%', display: 'flex', flexDirection: 'column', backgroundColor: C.white }}>
      {/* Header */}
      <div style={{ padding: '16px 24px', borderBottom: `1px solid ${C.gray200}` }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
          <h2 style={{ fontSize: 18, fontWeight: 600, color: C.navy }}>
            {estimateName || 'New Estimate'}
          </h2>
          <button onClick={onClose}
            style={{ padding: '6px 12px', backgroundColor: C.gray200, color: C.gray600, border: 'none', borderRadius: 6, fontSize: 12, fontWeight: 600, cursor: 'pointer' }}>
            Back to Dashboard
          </button>
        </div>

        {/* Progress */}
        <div style={{ display: 'flex', gap: 8, marginBottom: 12 }}>
          {steps.map((s, i) => (
            <div key={i} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4 }}>
              <div style={{
                height: 4, width: '100%', borderRadius: 2,
                backgroundColor: i + 1 <= step ? C.red : C.gray200,
                cursor: 'pointer', transition: 'background-color 0.2s',
              }} onClick={() => setStep(i + 1)} />
              <span style={{ fontSize: 11, color: i + 1 === step ? C.red : C.gray400, fontWeight: i + 1 === step ? 600 : 400 }}>
                {s}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* Content */}
      <div style={{ flex: 1, overflow: 'auto', padding: 24 }}>
        {step === 1 && renderStep1()}
        {step === 2 && renderStep2()}
        {step === 3 && renderStep3()}
        {step === 4 && renderStep4()}
      </div>

      {/* Footer Nav */}
      <div style={{
        padding: '12px 24px', borderTop: `1px solid ${C.gray200}`,
        display: 'flex', justifyContent: 'space-between', backgroundColor: C.gray50,
      }}>
        <button onClick={() => step === 1 ? onClose() : setStep(step - 1)}
          style={{ padding: '10px 20px', backgroundColor: C.gray200, color: C.navy, border: 'none', borderRadius: 8, fontSize: 13, fontWeight: 600, cursor: 'pointer' }}>
          {step === 1 ? 'Cancel' : 'Back'}
        </button>
        <div style={{ display: 'flex', gap: 10 }}>
          <button onClick={handleSave}
            style={{ padding: '10px 20px', backgroundColor: C.navy, color: C.white, border: 'none', borderRadius: 8, fontSize: 13, fontWeight: 600, cursor: 'pointer' }}>
            Save
          </button>
          {step < 4 && (
            <button onClick={() => setStep(step + 1)}
              style={{ padding: '10px 20px', backgroundColor: C.red, color: C.white, border: 'none', borderRadius: 8, fontSize: 13, fontWeight: 600, cursor: 'pointer' }}>
              Next
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

// Style helpers
const thStyle = { padding: '12px 14px', textAlign: 'left', fontSize: 12, fontWeight: 600, color: '#334155', borderBottom: '1px solid #E2E8F0' };
const tdStyle = { padding: '10px 14px', fontSize: 13, color: '#475569' };

const renderCostSummary = (costs) => (
  <div style={{ backgroundColor: '#F1F5F9', padding: 16, borderRadius: 8, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
    <div>
      <div style={{ fontSize: 12, color: '#64748B', marginBottom: 4 }}>
        Material: {fmt(costs.materialCost)} | Labor: {fmt(costs.laborCost)} | Tax: {fmt(costs.taxAmount)} | Margin: {fmt(costs.margin)}
      </div>
    </div>
    <span style={{ fontSize: 22, fontWeight: 700, color: '#E63946' }}>{fmtInt(costs.total)}</span>
  </div>
);

function wrapText(text, font, size, maxWidth) {
  const words = text.split(' ');
  const lines = [];
  let currentLine = '';

  for (const word of words) {
    const testLine = currentLine ? `${currentLine} ${word}` : word;
    const width = font.widthOfTextAtSize(testLine, size);
    if (width > maxWidth && currentLine) {
      lines.push(currentLine);
      currentLine = word;
    } else {
      currentLine = testLine;
    }
  }
  if (currentLine) lines.push(currentLine);
  return lines;
}
