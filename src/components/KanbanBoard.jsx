import React, { useState } from 'react';
import { C, ESTIMATE_STATUSES } from '../utils/constants';
import Badge from './Badge';

export default function KanbanBoard({ estimates, onStatusChange, onNewEstimate }) {
  const [draggedItem, setDraggedItem] = useState(null);

  const handleDragStart = (e, estimate) => {
    setDraggedItem(estimate);
  };

  const handleDragOver = (e) => {
    e.preventDefault();
  };

  const handleDrop = (e, newStatus) => {
    e.preventDefault();
    if (draggedItem) {
      onStatusChange(draggedItem.id, newStatus);
      setDraggedItem(null);
    }
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
              <h3 style={{
                fontSize: 14,
                fontWeight: 600,
                color: C.navy,
              }}>
                {status.label}
              </h3>
              <span style={{
                fontSize: 12,
                fontWeight: 600,
                color: C.gray500,
              }}>
                {items.length}
              </span>
            </div>

            <div
              onDragOver={handleDragOver}
              onDrop={(e) => handleDrop(e, status.key)}
              style={{
                flex: 1,
                backgroundColor: C.white,
                borderRadius: 8,
                padding: 12,
                minHeight: 500,
                border: `2px dashed ${C.gray200}`,
              }}
            >
              {items.map(estimate => (
                <div
                  key={estimate.id}
                  draggable
                  onDragStart={(e) => handleDragStart(e, estimate)}
                  style={{
                    backgroundColor: C.gray50,
                    border: `1px solid ${C.gray200}`,
                    borderRadius: 8,
                    padding: 12,
                    marginBottom: 12,
                    cursor: 'move',
                    opacity: draggedItem?.id === estimate.id ? 0.5 : 1,
                  }}
                >
                  <h4 style={{
                    fontSize: 13,
                    fontWeight: 600,
                    color: C.navy,
                    marginBottom: 6,
                  }}>
                    {estimate.propertyName}
                  </h4>
                  <p style={{
                    fontSize: 12,
                    color: C.gray600,
                    marginBottom: 8,
                  }}>
                    {estimate.address}
                  </p>
                  <div style={{
                    display: 'flex',
                    gap: 6,
                    flexWrap: 'wrap',
                  }}>
                    <Badge label={estimate.type} color={C.blue} bg={C.blueBg} />
                    {estimate.estimator && (
                      <Badge label={estimate.estimator} color={C.gray600} bg={C.gray100} />
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        );
      })}
    </div>
  );
}
