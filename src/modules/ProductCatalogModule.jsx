import React, { useState } from 'react';
import { C, DEFAULT_SHINGLE_MATERIALS, generateId } from '../utils/constants';
import DataTable from '../components/DataTable';

export default function ProductCatalogModule() {
  const [products, setProducts] = useState(DEFAULT_SHINGLE_MATERIALS);
  const [category, setCategory] = useState('all');

  const categories = ['all', 'shingles', 'underlayment', 'flashing', 'fasteners', 'accessories'];

  const filteredProducts = category === 'all'
    ? products
    : products.filter(p => p.category === category);

  const columns = [
    { key: 'name', label: 'Item Name', editable: true },
    { key: 'spec', label: 'Specification', editable: true },
    { key: 'unit', label: 'Unit', editable: true },
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
    const newProduct = {
      id: generateId(),
      name: 'New Product',
      spec: '',
      unit: 'EA',
      category: category === 'all' ? 'accessories' : category,
      prices: { FL: 0, GA: 0, TX: 0, TN: 0 },
    };
    setProducts([...products, newProduct]);
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
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: 16,
        }}>
          <h2 style={{ fontSize: 18, fontWeight: 600, color: C.navy }}>Product Catalog</h2>
          <button
            onClick={handleAddProduct}
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
            + Add Product
          </button>
        </div>

        <div style={{
          display: 'flex',
          gap: 12,
          overflowX: 'auto',
        }}>
          {categories.map(cat => (
            <button
              key={cat}
              onClick={() => setCategory(cat)}
              style={{
                padding: '8px 12px',
                backgroundColor: category === cat ? C.navy : C.gray100,
                color: category === cat ? C.white : C.navy,
                border: 'none',
                borderRadius: 6,
                fontSize: 12,
                fontWeight: 600,
                cursor: 'pointer',
                whiteSpace: 'nowrap',
              }}
            >
              {cat.charAt(0).toUpperCase() + cat.slice(1).replace(/([A-Z])/g, ' $1')}
            </button>
          ))}
        </div>
      </div>

      <div style={{
        flex: 1,
        overflow: 'auto',
        padding: '24px',
      }}>
        <DataTable
          columns={columns}
          data={displayData}
          onDataChange={handleDataChange}
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
          onClick={() => alert('Import CSV coming soon')}
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
          Import CSV
        </button>
        <button
          onClick={() => alert('Export CSV coming soon')}
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
          Export CSV
        </button>
      </div>
    </div>
  );
}
