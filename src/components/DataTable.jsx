import React, { useState } from 'react';
import { C } from '../utils/constants';

export default function DataTable({ columns, data, onDataChange, searchable = true }) {
  const [search, setSearch] = useState('');
  const [editingCell, setEditingCell] = useState(null);

  const filteredData = searchable
    ? data.filter(row =>
        columns.some(col =>
          String(row[col.key]).toLowerCase().includes(search.toLowerCase())
        )
      )
    : data;

  const handleCellChange = (rowIndex, colKey, newValue) => {
    const newData = [...data];
    newData[rowIndex] = { ...newData[rowIndex], [colKey]: newValue };
    onDataChange(newData);
    setEditingCell(null);
  };

  return (
    <div style={{ width: '100%' }}>
      {searchable && (
        <input
          type="text"
          placeholder="Search..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          style={{
            width: '100%',
            padding: '10px 12px',
            marginBottom: 16,
            border: `1px solid ${C.gray300}`,
            borderRadius: 8,
            fontSize: 14,
          }}
        />
      )}

      <div style={{
        overflowX: 'auto',
        borderRadius: 8,
        border: `1px solid ${C.gray200}`,
      }}>
        <table style={{
          width: '100%',
          borderCollapse: 'collapse',
          backgroundColor: C.white,
        }}>
          <thead>
            <tr style={{ backgroundColor: C.gray50 }}>
              {columns.map(col => (
                <th
                  key={col.key}
                  style={{
                    padding: '12px 16px',
                    textAlign: 'left',
                    fontSize: 12,
                    fontWeight: 600,
                    color: C.gray700,
                    borderBottom: `1px solid ${C.gray200}`,
                  }}
                >
                  {col.label}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {filteredData.map((row, rowIndex) => (
              <tr
                key={rowIndex}
                style={{
                  backgroundColor: rowIndex % 2 === 0 ? C.white : C.gray50,
                  borderBottom: `1px solid ${C.gray200}`,
                }}
              >
                {columns.map(col => (
                  <td
                    key={col.key}
                    style={{
                      padding: '12px 16px',
                      fontSize: 13,
                      color: C.gray700,
                    }}
                    onClick={() => col.editable && setEditingCell({ row: rowIndex, col: col.key })}
                  >
                    {editingCell?.row === rowIndex && editingCell?.col === col.key ? (
                      <input
                        type={col.type || 'text'}
                        value={row[col.key]}
                        onChange={(e) =>
                          handleCellChange(rowIndex, col.key, e.target.value)
                        }
                        autoFocus
                        onBlur={() => setEditingCell(null)}
                        style={{
                          width: '100%',
                          padding: '6px 8px',
                          border: `1px solid ${C.blue}`,
                          borderRadius: 4,
                          fontSize: 13,
                        }}
                      />
                    ) : (
                      <span style={{ cursor: col.editable ? 'pointer' : 'default' }}>
                        {row[col.key]}
                      </span>
                    )}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
