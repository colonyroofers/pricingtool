import React, { useState, useRef } from 'react';
import { C, generateId } from '../utils/constants';
import { downloadCSV } from '../utils/helpers';
import DataTable from '../components/DataTable';
import { useFirestoreCollection } from '../hooks/index';

const DEFAULT_VENDORS = [
  { id: '1', name: 'SRS Distribution', contact: 'John Smith', phone: '(404) 555-1234', email: 'john@srs.com', services: 'Shingles, Underlayment, Flashing', states: 'FL, GA, TX, TN' },
  { id: '2', name: 'ABC Supply', contact: 'Sarah Johnson', phone: '(305) 555-5678', email: 'sarah@abc.com', services: 'All roofing materials', states: 'FL, GA, TX, TN' },
  { id: '3', name: 'Beacon Building Products', contact: 'Mike Davis', phone: '(770) 555-9012', email: 'mike@beacon.com', services: 'Full roof systems', states: 'FL, GA' },
];

export default function VendorCatalogModule() {
  const [vendors, setVendors] = useFirestoreCollection('vendors', DEFAULT_VENDORS);
  const fileInputRef = useRef(null);

  const columns = [
    { key: 'name', label: 'Vendor Name', editable: true },
    { key: 'contact', label: 'Contact', editable: true },
    { key: 'phone', label: 'Phone', editable: true },
    { key: 'email', label: 'Email', editable: true },
    { key: 'services', label: 'Services', editable: true },
    { key: 'states', label: 'States', editable: true },
  ];

  const handleAddVendor = () => {
    setVendors([...vendors, {
      id: generateId(), name: 'New Vendor', contact: '', phone: '', email: '', services: '', states: '',
    }]);
  };

  const handleExport = () => {
    const header = ['Name', 'Contact', 'Phone', 'Email', 'Services', 'States'];
    const rows = vendors.map(v => [v.name, v.contact, v.phone, v.email, v.services, v.states]);
    downloadCSV([header, ...rows], 'vendor_catalog.csv');
  };

  const handleImport = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    try {
      const text = await file.text();
      const lines = text.split('\n').filter(l => l.trim());
      const imported = [];
      for (let i = 1; i < lines.length; i++) {
        const cells = lines[i].split(',').map(c => c.trim().replace(/^"|"$/g, ''));
        if (cells[0]) {
          imported.push({
            id: generateId(), name: cells[0], contact: cells[1] || '', phone: cells[2] || '',
            email: cells[3] || '', services: cells[4] || '', states: cells[5] || '',
          });
        }
      }
      if (imported.length > 0) {
        setVendors([...vendors, ...imported]);
        alert(`Imported ${imported.length} vendors.`);
      }
    } catch (err) { alert('Error: ' + err.message); }
    e.target.value = '';
  };

  return (
    <div style={{ width: '100%', height: '100%', display: 'flex', flexDirection: 'column', backgroundColor: C.white }}>
      <div style={{ padding: '16px 24px', borderBottom: `1px solid ${C.gray200}`, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <h2 style={{ fontSize: 18, fontWeight: 600, color: C.navy }}>Vendor Catalog</h2>
        <div style={{ display: 'flex', gap: 8 }}>
          <span style={{ fontSize: 12, color: C.gray500, alignSelf: 'center' }}>{vendors.length} vendors</span>
          <button onClick={handleAddVendor}
            style={{ padding: '8px 16px', backgroundColor: C.red, color: C.white, border: 'none', borderRadius: 8, fontSize: 13, fontWeight: 600, cursor: 'pointer' }}>
            + Add Vendor
          </button>
        </div>
      </div>

      <div style={{ flex: 1, overflow: 'auto', padding: 24 }}>
        <DataTable columns={columns} data={vendors} onDataChange={setVendors} searchable />
      </div>

      <div style={{ padding: '12px 24px', borderTop: `1px solid ${C.gray200}`, backgroundColor: C.gray50, display: 'flex', gap: 10 }}>
        <input ref={fileInputRef} type="file" accept=".csv" onChange={handleImport} style={{ display: 'none' }} />
        <button onClick={() => fileInputRef.current?.click()}
          style={{ padding: '8px 16px', backgroundColor: C.white, color: C.navy, border: `1px solid ${C.gray300}`, borderRadius: 8, fontSize: 13, fontWeight: 600, cursor: 'pointer' }}>
          Import CSV
        </button>
        <button onClick={handleExport}
          style={{ padding: '8px 16px', backgroundColor: C.white, color: C.navy, border: `1px solid ${C.gray300}`, borderRadius: 8, fontSize: 13, fontWeight: 600, cursor: 'pointer' }}>
          Export CSV
        </button>
      </div>
    </div>
  );
}
