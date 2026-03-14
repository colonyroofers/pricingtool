import React, { useState } from 'react';
import { C, EMPTY_BUILDING, DEFAULT_SHINGLE_MATERIALS, DEFAULT_LABOR, DEFAULT_FINANCIALS, BUILDING_CODE_WARNINGS, SCOPE_ITEMS, fmt, fmtInt } from '../utils/constants';
import { calculateBuildingCost } from '../utils/helpers';
import DataTable from '../components/DataTable';

const DEMO_BUILDINGS = [
  { siteplanNum: "1", roofrNum: "1", phase: 1, totalArea: 12997, pitchedArea: 12997, predominantPitch: "4/12", wastePercent: 12, eaves: 494.4, valleys: 421.3, hips: 254.0, ridges: 265.4, rakes: 385.8, wallFlashing: 203.3, stepFlashing: 86.5, pipes: 6, dryerVents: 3 },
  { siteplanNum: "2", roofrNum: "2", phase: 1, totalArea: 16476, pitchedArea: 16476, predominantPitch: "4/12", wastePercent: 14, eaves: 756.3, valleys: 495.1, hips: 519.8, ridges: 298.6, rakes: 418.0, wallFlashing: 194.8, stepFlashing: 242.4, pipes: 8, dryerVents: 3 },
  { siteplanNum: "3", roofrNum: "3", phase: 1, totalArea: 16482, pitchedArea: 16482, predominantPitch: "4/12", wastePercent: 13, eaves: 761.9, valleys: 495.0, hips: 509.3, ridges: 303.0, rakes: 403.1, wallFlashing: 198.5, stepFlashing: 253.8, pipes: 8, dryerVents: 3 },
  { siteplanNum: "4", roofrNum: "4", phase: 1, totalArea: 12857, pitchedArea: 12857, predominantPitch: "4/12", wastePercent: 12, eaves: 506.3, valleys: 422.4, hips: 261.9, ridges: 265.9, rakes: 378.0, wallFlashing: 195.8, stepFlashing: 94.7, pipes: 6, dryerVents: 3 },
  { siteplanNum: "5", roofrNum: "5", phase: 1, totalArea: 14695, pitchedArea: 14695, predominantPitch: "4/12", wastePercent: 14, eaves: 545.3, valleys: 590.5, hips: 407.7, ridges: 298.3, rakes: 410.6, wallFlashing: 201.7, stepFlashing: 89.3, pipes: 7, dryerVents: 3 },
];

export default function EstimateWizard() {
  const [step, setStep] = useState(1);
  const [buildings, setBuildings] = useState(DEMO_BUILDINGS);
  const [state, setState] = useState('FL');
  const [estimateName, setEstimateName] = useState('Willow Bridge');

  const buildingColumns = [
    { key: 'siteplanNum', label: 'Site Plan #', editable: true },
    { key: 'totalArea', label: 'Total Area (SF)', editable: true, type: 'number' },
    { key: 'predominantPitch', label: 'Pitch', editable: true },
    { key: 'wastePercent', label: 'Waste %', editable: true, type: 'number' },
    { key: 'eaves', label: 'Eaves (LF)', editable: true, type: 'number' },
    { key: 'ridges', label: 'Ridges (LF)', editable: true, type: 'number' },
  ];

  let totalCost = 0;
  const costs = buildings.map(b => {
    const cost = calculateBuildingCost(b, DEFAULT_SHINGLE_MATERIALS, DEFAULT_LABOR, DEFAULT_FINANCIALS, state);
    totalCost += cost.total;
    return { building: b.siteplanNum, materialCost: fmt(cost.materialCost), laborCost: fmt(cost.laborCost), total: fmt(cost.total) };
  });

  const renderStep = () => {
    switch (step) {
      case 1:
        return (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
            <h3 style={{ fontSize: 16, fontWeight: 600, color: C.navy }}>Upload Project Data</h3>
            <div style={{
              border: `2px dashed ${C.gray300}`,
              borderRadius: 8,
              padding: 40,
              textAlign: 'center',
              backgroundColor: C.gray50,
            }}>
              <p style={{ fontSize: 14, color: C.gray600 }}>
                Drag and drop a CSV or PDF file, or click to browse
              </p>
            </div>
            <div>
              <label style={{ fontSize: 12, fontWeight: 600, color: C.navy }}>Estimate Name</label>
              <input
                type="text"
                value={estimateName}
                onChange={(e) => setEstimateName(e.target.value)}
                style={{
                  width: '100%',
                  padding: '10px 12px',
                  marginTop: 8,
                  border: `1px solid ${C.gray300}`,
                  borderRadius: 8,
                  fontSize: 14,
                }}
              />
            </div>
            <div>
              <label style={{ fontSize: 12, fontWeight: 600, color: C.navy }}>Market/State</label>
              <select
                value={state}
                onChange={(e) => setState(e.target.value)}
                style={{
                  width: '100%',
                  padding: '10px 12px',
                  marginTop: 8,
                  border: `1px solid ${C.gray300}`,
                  borderRadius: 8,
                  fontSize: 14,
                }}
              >
                <option value="FL">Florida (TPA)</option>
                <option value="GA">Georgia (ATL)</option>
                <option value="TX">Texas (DFW)</option>
                <option value="TN">Tennessee (NSH)</option>
              </select>
            </div>
          </div>
        );

      case 2:
        return (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
            <h3 style={{ fontSize: 16, fontWeight: 600, color: C.navy }}>Measurements</h3>
            <DataTable
              columns={buildingColumns}
              data={buildings}
              onDataChange={setBuildings}
              searchable={false}
            />
          </div>
        );

      case 3:
        return (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
            <h3 style={{ fontSize: 16, fontWeight: 600, color: C.navy }}>Pricing</h3>

            <div style={{
              backgroundColor: C.blueBg,
              padding: 16,
              borderRadius: 8,
              borderLeft: `4px solid ${C.blue}`,
            }}>
              <p style={{ fontSize: 12, color: C.blue, marginBottom: 8 }}>Market: {state}</p>
              {BUILDING_CODE_WARNINGS[state]?.slice(0, 2).map((warning, i) => (
                <p key={i} style={{ fontSize: 12, color: C.blue, marginBottom: 4 }}>
                  • {warning}
                </p>
              ))}
            </div>

            <table style={{
              width: '100%',
              borderCollapse: 'collapse',
              backgroundColor: C.white,
              border: `1px solid ${C.gray200}`,
              borderRadius: 8,
              overflow: 'hidden',
            }}>
              <thead>
                <tr style={{ backgroundColor: C.gray50 }}>
                  <th style={{ padding: 12, textAlign: 'left', fontSize: 12, fontWeight: 600, borderBottom: `1px solid ${C.gray200}` }}>Building</th>
                  <th style={{ padding: 12, textAlign: 'right', fontSize: 12, fontWeight: 600, borderBottom: `1px solid ${C.gray200}` }}>Material</th>
                  <th style={{ padding: 12, textAlign: 'right', fontSize: 12, fontWeight: 600, borderBottom: `1px solid ${C.gray200}` }}>Labor</th>
                  <th style={{ padding: 12, textAlign: 'right', fontSize: 12, fontWeight: 600, borderBottom: `1px solid ${C.gray200}` }}>Total</th>
                </tr>
              </thead>
              <tbody>
                {costs.map((row, i) => (
                  <tr key={i} style={{ backgroundColor: i % 2 === 0 ? C.white : C.gray50, borderBottom: `1px solid ${C.gray200}` }}>
                    <td style={{ padding: 12, fontSize: 13, color: C.gray700 }}>Building {row.building}</td>
                    <td style={{ padding: 12, fontSize: 13, color: C.gray700, textAlign: 'right' }}>{row.materialCost}</td>
                    <td style={{ padding: 12, fontSize: 13, color: C.gray700, textAlign: 'right' }}>{row.laborCost}</td>
                    <td style={{ padding: 12, fontSize: 13, fontWeight: 600, color: C.navy, textAlign: 'right' }}>{row.total}</td>
                  </tr>
                ))}
              </tbody>
            </table>

            <div style={{
              backgroundColor: C.gray100,
              padding: 16,
              borderRadius: 8,
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
            }}>
              <span style={{ fontSize: 14, fontWeight: 600, color: C.navy }}>Total Project Cost (with margin & tax):</span>
              <span style={{ fontSize: 20, fontWeight: 700, color: C.red }}>{fmtInt(totalCost)}</span>
            </div>
          </div>
        );

      case 4:
        return (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
            <h3 style={{ fontSize: 16, fontWeight: 600, color: C.navy }}>Proposal</h3>

            <div style={{
              backgroundColor: C.white,
              border: `1px solid ${C.gray200}`,
              borderRadius: 8,
              padding: 24,
              fontSize: 13,
              lineHeight: 1.6,
              color: C.gray700,
            }}>
              <h4 style={{ fontSize: 14, fontWeight: 600, color: C.navy, marginBottom: 12 }}>Scope of Work</h4>
              <ul style={{ marginLeft: 24, marginBottom: 16 }}>
                {SCOPE_ITEMS.map((item, i) => (
                  <li key={i} style={{ marginBottom: 8 }}>
                    {item}
                  </li>
                ))}
              </ul>

              <h4 style={{ fontSize: 14, fontWeight: 600, color: C.navy, marginBottom: 8 }}>Project Total</h4>
              <p style={{ fontSize: 16, fontWeight: 700, color: C.red, marginBottom: 16 }}>
                {fmtInt(totalCost)}
              </p>

              <h4 style={{ fontSize: 14, fontWeight: 600, color: C.navy, marginBottom: 8 }}>Terms & Conditions</h4>
              <p style={{ marginBottom: 8 }}>50% deposit to schedule, remaining balance due upon completion.</p>
              <p>This estimate is valid for 30 days.</p>
            </div>

            <div style={{ display: 'flex', gap: 12 }}>
              <button
                onClick={() => alert('PDF export coming soon')}
                style={{
                  flex: 1,
                  padding: '12px 16px',
                  backgroundColor: C.blue,
                  color: C.white,
                  border: 'none',
                  borderRadius: 8,
                  fontSize: 13,
                  fontWeight: 600,
                  cursor: 'pointer',
                }}
              >
                Export as PDF
              </button>
              <button
                onClick={() => alert('Email coming soon')}
                style={{
                  flex: 1,
                  padding: '12px 16px',
                  backgroundColor: C.green,
                  color: C.white,
                  border: 'none',
                  borderRadius: 8,
                  fontSize: 13,
                  fontWeight: 600,
                  cursor: 'pointer',
                }}
              >
                Send via Email
              </button>
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div style={{
      width: '100%',
      height: '100%',
      display: 'flex',
      flexDirection: 'column',
      backgroundColor: C.white,
    }}>
      <div style={{
        padding: '16px 24px',
        borderBottom: `1px solid ${C.gray200}`,
      }}>
        <h2 style={{ fontSize: 18, fontWeight: 600, color: C.navy, marginBottom: 16 }}>
          Estimate Wizard
        </h2>

        <div style={{
          display: 'flex',
          gap: 12,
        }}>
          {[1, 2, 3, 4].map(s => (
            <div
              key={s}
              style={{
                flex: 1,
                height: 4,
                backgroundColor: s <= step ? C.red : C.gray200,
                borderRadius: 2,
                cursor: 'pointer',
              }}
              onClick={() => setStep(s)}
            />
          ))}
        </div>

        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          marginTop: 12,
          fontSize: 12,
          color: C.gray600,
        }}>
          <span>Step {step}: {['Upload', 'Measurements', 'Pricing', 'Proposal'][step - 1]}</span>
        </div>
      </div>

      <div style={{
        flex: 1,
        overflow: 'auto',
        padding: '24px',
      }}>
        {renderStep()}
      </div>

      <div style={{
        padding: '16px 24px',
        borderTop: `1px solid ${C.gray200}`,
        display: 'flex',
        justifyContent: 'space-between',
        backgroundColor: C.gray50,
      }}>
        <button
          onClick={() => setStep(Math.max(1, step - 1))}
          disabled={step === 1}
          style={{
            padding: '10px 16px',
            backgroundColor: step === 1 ? C.gray300 : C.gray200,
            color: C.navy,
            border: 'none',
            borderRadius: 8,
            fontSize: 13,
            fontWeight: 600,
            cursor: step === 1 ? 'default' : 'pointer',
          }}
        >
          Back
        </button>

        <button
          onClick={() => setStep(Math.min(4, step + 1))}
          disabled={step === 4}
          style={{
            padding: '10px 16px',
            backgroundColor: step === 4 ? C.gray300 : C.red,
            color: C.white,
            border: 'none',
            borderRadius: 8,
            fontSize: 13,
            fontWeight: 600,
            cursor: step === 4 ? 'default' : 'pointer',
          }}
        >
          {step === 4 ? 'Complete' : 'Next'}
        </button>
      </div>
    </div>
  );
}
