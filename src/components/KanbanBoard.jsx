import React, { useState } from 'react';
import { C, ESTIMATE_STATUSES, ESTIMATE_TYPES, fmt } from '../utils/constants';
import Badge from './Badge';

export default function KanbanBoard({ estimates, onStatusChange, onCardClick, onEditClick, onDeleteClick, onUpdateEstimate, team = [] }) {
  const [draggedItem, setDraggedItem] = useState(null);
  const [dragOverCol, setDragOverCol] = useState(null);

  const estimators = (team || []).filter(t => t.role === 'estimator' && t.active);

  const handleDragStart = (e, estimate) => {
    setDraggedItem(estimate);
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleDragOver = (e, statusKey) => {
    e.preventDefault();
    setDragOverCol(statusKey);
  };

  const handleDragLeave = () => {
    setDragOverCol(null);
  };

  const handleDrop = (e, newStatus) => {
    e.preventDefault();
    setDragOverCol(null);
    if (draggedItem && draggedItem.status !== newStatus) {
      onStatusChange(draggedItem.id, newStatus);
    }
    setDraggedItem(null);
  };

  const handleAssignEstimator = (e, estimate) => {
    e.stopPropagation();
    const newEstimator = e.target.value;
    const newStatus = newEstimator && estimate.status === 'unassigned' ? 'assigned' : estimate.status;
    if (!newEstimator && estimate.status === 'assigned') {
      // Unassigning — go back to unassigned
      onUpdateEstimate({ ...estimate, estimator: '', status: 'unassigned' });
    } else {
      onUpdateEstimate({ ...estimate, estimator: newEstimator, status: newStatus });
    }
  };

  const getTypeInfo = (type) => ESTIMATE_TYPES.find(t => t.key === type) || { label: type, icon: '' };

  const formatDueDate = (dateStr) => {
    if (!dateStr) return null;
    const d = new Date(dateStr + 'T00:00:00');
    const now = new Date();
    now.setHours(0, 0, 0, 0);
    const diff = Math.ceil((d - now) / (1000 * 60 * 60 * 24));
    const label = d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    let color = C.gray500;
    let bg = C.gray100;
    if (diff < 0) { color = C.red; bg = C.redBg; }
    else if (diff <= 3) { color = C.yellow; bg = C.yellowBg; }
    else if (diff <= 7) { color = C.blue; bg = C.blueBg; }
    return { label, color, bg, diff };
  };

  return (
    <div style={{
      display: 'flex',
      gap: 16,
      overflow: 'auto',
      padding: 20,
      backgroundColor: C.gray50,
      minHeight: '100%',
    }}>
      {ESTIMATE_STATUSES.map(status => {
        const items = estimates.filter(e => e.status === status.key);
        const isOver = dragOverCol === status.key;
        return (
          <div
            key={status.key}
            style={{
              flex: '0 0 280px',
              display: 'flex',
              flexDirection: 'column',
            }}
          >
            <div style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              marginBottom: 12,
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <div style={{
                  width: 10, height: 10, borderRadius: '50%',
                  backgroundColor: status.color,
                }} />
                <h3 style={{ fontSize: 13, fontWeight: 600, color: C.navy }}>
                  {status.label}
                </h3>
              </div>
              <span style={{
                fontSize: 11, fontWeight: 700, color: status.color,
                backgroundColor: status.bg, padding: '2px 8px', borderRadius: 10,
              }}>
                {items.length}
              </span>
            </div>

            <div
              onDragOver={(e) => handleDragOver(e, status.key)}
              onDragLeave={handleDragLeave}
              onDrop={(e) => handleDrop(e, status.key)}
              style={{
                flex: 1,
                backgroundColor: isOver ? status.bg : C.white,
                borderRadius: 8,
                padding: 10,
                minHeight: 400,
                border: `2px dashed ${isOver ? status.color : C.gray200}`,
                transition: 'all 0.2s',
              }}
            >
              {items.length === 0 && (
                <p style={{ fontSize: 12, color: C.gray400, textAlign: 'center', marginTop: 40 }}>
                  Drop estimates here
                </p>
              )}
              {items.map(estimate => {
                const typeInfo = getTypeInfo(estimate.type);
                const due = formatDueDate(estimate.bidDueDate);
                return (
                  <div
                    key={estimate.id}
                    draggable
                    onDragStart={(e) => handleDragStart(e, estimate)}
                    style={{
                      backgroundColor: C.gray50,
                      border: `1px solid ${C.gray200}`,
                      borderRadius: 8,
                      padding: 12,
                      marginBottom: 10,
                      cursor: 'grab',
                      opacity: draggedItem?.id === estimate.id ? 0.4 : 1,
                      transition: 'opacity 0.15s',
                    }}
                  >
                    <div
                      onClick={() => onCardClick(estimate)}
                      style={{ cursor: 'pointer' }}
                    >
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 6 }}>
                        <h4 style={{ fontSize: 13, fontWeight: 600, color: C.navy, margin: 0, flex: 1 }}>
                          {estimate.propertyName}
                        </h4>
                        <span style={{ fontSize: 14 }}>{typeInfo.icon}</span>
                      </div>
                      <p style={{ fontSize: 11, color: C.gray500, marginBottom: 4 }}>
                        {estimate.address}{estimate.city ? `, ${estimate.city}` : ''} {estimate.state}
                      </p>
                      {estimate.totalCost && (
                        <p style={{ fontSize: 12, fontWeight: 600, color: C.green, marginBottom: 4 }}>
                          {fmt(estimate.totalCost)}
                        </p>
                      )}
                      {due && (
                        <div style={{
                          display: 'inline-flex', alignItems: 'center', gap: 4,
                          fontSize: 11, fontWeight: 600, color: due.color,
                          backgroundColor: due.bg, padding: '2px 8px', borderRadius: 4,
                          marginBottom: 4,
                        }}>
                          📅 Due {due.label}
                          {due.diff < 0 && ' (overdue)'}
                          {due.diff === 0 && ' (today)'}
                          {due.diff === 1 && ' (tomorrow)'}
                        </div>
                      )}
                    </div>

                    {/* Estimator assignment dropdown */}
                    <div style={{ marginTop: 8 }}>
                      <select
                        value={estimate.estimator || ''}
                        onClick={(e) => e.stopPropagation()}
                        onChange={(e) => handleAssignEstimator(e, estimate)}
                        style={{
                          width: '100%',
                          padding: '5px 8px',
                          fontSize: 11,
                          border: `1px solid ${C.gray200}`,
                          borderRadius: 6,
                          backgroundColor: C.white,
                          color: estimate.estimator ? C.navy : C.gray400,
                          cursor: 'pointer',
                          appearance: 'auto',
                        }}
                      >
                        <option value="">Assign Estimator...</option>
                        {estimators.map(est => (
                          <option key={est.id} value={est.name}>{est.name}</option>
                        ))}
                      </select>
                    </div>

                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 6 }}>
                      <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap' }}>
                        <Badge label={typeInfo.label} color={C.blue} bg={C.blueBg} />
                      </div>
                      <div style={{ display: 'flex', gap: 4 }}>
                        <button
                          onClick={(e) => { e.stopPropagation(); onEditClick(estimate); }}
                          style={{
                            background: 'none', border: 'none', cursor: 'pointer',
                            fontSize: 14, color: C.gray400, padding: '2px 4px',
                          }}
                          title="Edit"
                        >
                          ✏️
                        </button>
                        <button
                          onClick={(e) => { e.stopPropagation(); onDeleteClick(estimate.id); }}
                          style={{
                            background: 'none', border: 'none', cursor: 'pointer',
                            fontSize: 14, color: C.gray400, padding: '2px 4px',
                          }}
                          title="Delete"
                        >
                          🗑️
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        );
      })}
    </div>
  );
}
