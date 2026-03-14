import React, { useState } from 'react';
import { C, generateId } from '../utils/constants';
import DataTable from '../components/DataTable';

const DEFAULT_VENDORS = [
  { id: '1', name: 'SRS Distribution', contact: 'John Smith', phone: '(404) 555-1234', email: 'john@srs.com', services: 'Shingles, Underlayment, Flashing', states: 'FL, GA, TX, TN' },
  { id: '2', name: 'ABC Supply', contact: 'Sarah Johnson', phone: '(305) 555-5678', email: 'sarah@abc.com', services: 'All roofing materials', states: 'FL, GA, TX, TN' },
  { id: '3', name: 'Beacon Building Products', contact: 'Mike Davis', phone: '(770) 555-9012', email: 'mike@beacon.com', services: 'Full roof systems', states: 'FL, GA' },
];

export default function VendorCatalogModule() {
  const [vendors, setVendors] = useState(DEFAULT_VENDORS);

  const columns = [
    { key: 'name', label: 'Vendor Name', editable: true },
    { key: 'contact', label: 'Contact Name', editable: true },
    { key: 'phone', label: 'Phone', editable: true },
    { key: 'email', label: 'Email', editable: true },
    { key: 'services', label: 'Services', editable: true },
    { key: 'states', label: 'States', editable: true },
  ];

  const handleAddVendor = () => {
    setVendors([...vendors, {
      id: generateId(),
      name: 'New Vendor',
      contact: '',
      phone: '',
      email: '',
      services: '',
      states: '',
    }]);
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
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
      }}>
        <h2 style={{ fontSize: 18, fontWeight: 600, color: C.navy }}>Vendor Catalog</h2>
        <button
          onClick={handleAddVendor}
          style={{
            padding: '8px 16px',
            backgroundColor: C.red,
            color: C.white,
            border: 'none',
            borderRadius: 8,
            fontSize: 13,
            fontWeight: 600,
            cursor: 'pointer',
          }}
        >
          + Add Vendor
        </button>
      </div>

      <div style={{
        flex: 1,
        overflow: 'auto',
        padding: '24px',
      }}>
        <DataTable
          columns={columns}
          data={vendors}
          onDataChange={setVendors}
          searchable
        />
      </div>

      <div style={{
        padding: '16px 24px',
        borderTop: `1px solid ${C.gray200}`,
        backgroundColor: C.gray50,
        display: 'flex',
        gap: 12,
      }}>
        <button
          onClick={() => alert('Import coming soon')}
          style={{
            padding: '10px 16px',
            backgroundColor: C.white,
            color: C.navy,
            border: `1px solid ${C.gray300}`,
            borderRadius: 8,
            fontSize: 13,
            fontWeight: 600,
            cursor: 'pointer',
          }}
        >
          Import
        </button>
        <button
          onClick={() => alert('Export coming soon')}
          style={{
            padding: '10px 16px',
            backgroundColor: C.white,
            color: C.navy,
            border: `1px solid ${C.gray300}`,
            borderRadius: 8,
            fontSize: 13,
            fontWeight: 600,
            cursor: 'pointer',
          }}
        >
          Export
        </button>
      </div>
    </div>
  );
}
