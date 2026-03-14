import React, { useState, useRef } from 'react';
import { C, DEFAULT_SHINGLE_MATERIALS, STATE_LABOR, STATE_FINANCIALS, STATES, generateId, fmt } from '../utils/constants';
import { downloadCSV } from '../utils/helpers';
import { useFirestoreCollection } from '../hooks/index';
import DataTable from '../components/DataTable';

export default function ProductCatalogModule() {
  const [products, setProducts] = useFirestoreCollection('products', DEFAULT_SHINGLE_MATERIALS);
  const [category, setCategory] = useState('all');
  const fileInputRef = useRef(null);

  const categories = ['all', 'shingles', 'underlayment', 'flashing', 'fasteners', 'accessories'];

  const filteredProducts = category === 'all'
    ? products
    : products.filter(p => p.category === category);

  const columns = [
    { key: 'name', label: 'Item Name', editable: true },
    { key: 'spec', label: 'Specification', editable: true },
    { key: 'unit', label: 'Unit', editable: true },
    { key: 'category', label: 'Category', editable: true },
    { key: 'prices.FL', label: 'FL Price', editable: true, type: 'number' },
    { key: 'prices.GA', label: 'GA Price', editable: true, type: 'number' },
    { key: 'prices.TX', label: 'TX Price', editable: true, type: 'number' },
    { key: 'prices.TN', label: 'TN Price', editable: true, type: 'number' },
  ];

  const displayData = filteredProducts.map(p => ({
    ...p,
    'prices.FL': p.prices.FL,
    'prices.GA': p.prices.GA,
    'prices.TX': p.prices.TX,
    'prices.TN': p.prices.TN,
  }));

  const handleAddProduct = () => {
    setProducts([...products, {
      id: generateId(),
      name: 'New Product',
      spec: '',
      unit: 'EA',
      category: category === 'all' ? 'accessories' : category,
      prices: { FL: 0, GA: 0, TX: 0, TN: 0 },
    }]);
  };

  const handleDataChange = (newData) => {
    const updated = newData.map(row => ({
      ...row,
      prices: {
        FL: parseFloat(row['prices.FL']) || 0,
        GA: parseFloat(row['prices.GA']) || 0,
        TX: parseFloat(row['prices.TX']) || 0,
        TN: parseFloat(row['prices.TN']) || 0,
      },
    }));
    setProducts(
      products.map(p => {
        const match = updated.find(u => u.id === p.id);
        return match ? { ...p, ...match } : p;
      })
    );
  };

  const handleExportCSV = () => {
    const header = ['Name', 'Specification', 'Unit', 'Category', 'FL Price', 'GA Price', 'TX Price', 'TN Price'];
    const rows = products.map(p => [p.name, p.spec, p.unit, p.category, p.prices.FL, p.prices.GA, p.prices.TX, p.prices.TN]);
    downloadCSV([header, ...rows], 'product_catalog.csv');
  };

  const handleImportCSV = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    try {
      const text = await file.text();
      const lines = text.split('\n').filter(l => l.trim());
      if (lines.length < 2) { alert('CSV must have a header row and at least one data row.'); return; }

      const imported = [];
      for (let i = 1; i < lines.length; i++) {
        const cells = lines[i].split(',').map(c => c.trim().replace(/^"|"$/g, ''));
        if (cells.length >= 5 && cells[0]) {
          imported.push({
            id: generateId(),
            name: cells[0],
            spec: cells[1] || '',
            unit: cells[2] || 'EA',
            category: cells[3] || 'accessories',
            prices: {
              FL: parseFloat(cells[4]) || 0,
              GA: parseFloat(cells[5]) || 0,
              TX: parseFloat(cells[6]) || 0,
              TN: parseFloat(cells[7]) || 0,
            },
          });
        }
      }

      if (imported.length > 0) {
        setProducts([...products, ...imported]);
        alert(`Imported ${imported.length} products.`);
      } else {
        alert('No valid product rows found in CSV.');
      }
    } catch (err) {
      alert('Error reading CSV: ' + err.message);
    }

    e.target.value = '';
  };

  return (
    <div style={{ width: '100%', height: '100%', display: 'flex', flexDirection: 'column', backgroundColor: C.gray50, overflow: 'auto' }}>
      <div style={{ padding: '16px 24px', borderBottom: `1px solid ${C.gray200}`, backgroundColor: C.white }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
          <h2 style={{ fontSize: 18, fontWeight: 600, color: C.navy }}>Product Catalog</h2>
          <div style={{ display: 'flex', gap: 8 }}>
            <span style={{ fontSize: 12, color: C.gray500, alignSelf: 'center' }}>{products.length} products</span>
            <button onClick={handleAddProduct}
              style={{ padding: '8px 16px', backgroundColor: C.red, color: C.white, border: 'none', borderRadius: 8, fontSize: 13, fontWeight: 600, cursor: 'pointer' }}>
              + Add Product
            </button>
          </div>
        </div>
        <div style={{ display: 'flex', gap: 8, overflowX: 'auto' }}>
          {categories.map(cat => (
            <button key={cat} onClick={() => setCategory(cat)}
              style={{
                padding: '6px 12px', backgroundColor: category === cat ? C.navy : C.gray100,
                color: category === cat ? C.white : C.navy, border: 'none', borderRadius: 6,
                fontSize: 12, fontWeight: 600, cursor: 'pointer', whiteSpace: 'nowrap',
              }}>
              {cat.charAt(0).toUpperCase() + cat.slice(1)}
            </button>
          ))}
        </div>
      </div>

      <div style={{ flex: 1, overflow: 'auto', padding: 24 }}>
        {/* Materials Section */}
        <div style={{ backgroundColor: C.white, borderRadius: 8, marginBottom: 24, padding: 24, boxShadow: '0 1px 3px rgba(0,0,0,0.05)' }}>
          <h3 style={{ fontSize: 16, fontWeight: 600, color: C.navy, marginTop: 0, marginBottom: 16 }}>Material Pricing</h3>
          <DataTable columns={columns} data={displayData} onDataChange={handleDataChange} searchable />
        </div>

        {/* Labor Rates Section */}
        <div style={{ backgroundColor: C.white, borderRadius: 8, marginBottom: 24, padding: 24, boxShadow: '0 1px 3px rgba(0,0,0,0.05)' }}>
          <h3 style={{ fontSize: 16, fontWeight: 600, color: C.navy, marginTop: 0, marginBottom: 16 }}>State Labor Rates</h3>
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
              <thead>
                <tr style={{ borderBottom: `2px solid ${C.gray200}` }}>
                  <th style={{ textAlign: 'left', padding: '12px 8px', fontWeight: 600, color: C.navy }}>State</th>
                  <th style={{ textAlign: 'right', padding: '12px 8px', fontWeight: 600, color: C.navy }}>Labor/Sq</th>
                  <th style={{ textAlign: 'right', padding: '12px 8px', fontWeight: 600, color: C.navy }}>Forklift</th>
                  <th style={{ textAlign: 'right', padding: '12px 8px', fontWeight: 600, color: C.navy }}>Dumpster</th>
                  <th style={{ textAlign: 'right', padding: '12px 8px', fontWeight: 600, color: C.navy }}>Permit</th>
                  <th style={{ textAlign: 'right', padding: '12px 8px', fontWeight: 600, color: C.navy }}>OSB/Sheet</th>
                  <th style={{ textAlign: 'right', padding: '12px 8px', fontWeight: 600, color: C.navy }}>Warranty/Sq</th>
                  <th style={{ textAlign: 'left', padding: '12px 8px', fontWeight: 600, color: C.navy }}>Basis</th>
                </tr>
              </thead>
              <tbody>
                {STATES.map(state => {
                  const labor = STATE_LABOR[state.code];
                  return (
                    <tr key={state.code} style={{ borderBottom: `1px solid ${C.gray200}` }}>
                      <td style={{ padding: '12px 8px', fontWeight: 500, color: C.navy }}>{state.name}</td>
                      <td style={{ textAlign: 'right', padding: '12px 8px', color: C.gray700 }}>{fmt(labor.laborPerSquare)}</td>
                      <td style={{ textAlign: 'right', padding: '12px 8px', color: C.gray700 }}>{fmt(labor.forkliftCost)}</td>
                      <td style={{ textAlign: 'right', padding: '12px 8px', color: C.gray700 }}>{fmt(labor.dumpsterCost)}</td>
                      <td style={{ textAlign: 'right', padding: '12px 8px', color: C.gray700 }}>{fmt(labor.permitCost)}</td>
                      <td style={{ textAlign: 'right', padding: '12px 8px', color: C.gray700 }}>{fmt(labor.osbPerSheet)}</td>
                      <td style={{ textAlign: 'right', padding: '12px 8px', color: C.gray700 }}>{fmt(labor.warrantyPerSq)}</td>
                      <td style={{ padding: '12px 8px', color: C.gray700 }}>{labor.laborBasis}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>

        {/* Financial Rates Section */}
        <div style={{ backgroundColor: C.white, borderRadius: 8, marginBottom: 24, padding: 24, boxShadow: '0 1px 3px rgba(0,0,0,0.05)' }}>
          <h3 style={{ fontSize: 16, fontWeight: 600, color: C.navy, marginTop: 0, marginBottom: 16 }}>State Financial Rates</h3>
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
              <thead>
                <tr style={{ borderBottom: `2px solid ${C.gray200}` }}>
                  <th style={{ textAlign: 'left', padding: '12px 8px', fontWeight: 600, color: C.navy }}>State</th>
                  <th style={{ textAlign: 'right', padding: '12px 8px', fontWeight: 600, color: C.navy }}>Margin</th>
                  <th style={{ textAlign: 'right', padding: '12px 8px', fontWeight: 600, color: C.navy }}>Tax Rate</th>
                </tr>
              </thead>
              <tbody>
                {STATES.map(state => {
                  const fin = STATE_FINANCIALS[state.code];
                  return (
                    <tr key={state.code} style={{ borderBottom: `1px solid ${C.gray200}` }}>
                      <td style={{ padding: '12px 8px', fontWeight: 500, color: C.navy }}>{state.name}</td>
                      <td style={{ textAlign: 'right', padding: '12px 8px', color: C.gray700 }}>{(fin.margin * 100).toFixed(1)}%</td>
                      <td style={{ textAlign: 'right', padding: '12px 8px', color: C.gray700 }}>{(fin.taxRate * 100).toFixed(2)}%</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      <div style={{ padding: '12px 24px', borderTop: `1px solid ${C.gray200}`, backgroundColor: C.white, display: 'flex', gap: 10 }}>
        <input ref={fileInputRef} type="file" accept=".csv" onChange={handleImportCSV} style={{ display: 'none' }} />
        <button onClick={() => fileInputRef.current?.click()}
          style={{ padding: '8px 16px', backgroundColor: C.white, color: C.navy, border: `1px solid ${C.gray300}`, borderRadius: 8, fontSize: 13, fontWeight: 600, cursor: 'pointer' }}>
          Import CSV
        </button>
        <button onClick={handleExportCSV}
          style={{ padding: '8px 16px', backgroundColor: C.white, color: C.navy, border: `1px solid ${C.gray300}`, borderRadius: 8, fontSize: 13, fontWeight: 600, cursor: 'pointer' }}>
          Export CSV
        </button>
      </div>
    </div>
  );
}
