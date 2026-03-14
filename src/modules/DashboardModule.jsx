import React, { useState } from 'react';
import { C, ESTIMATE_TYPES, ESTIMATE_STATUSES, generateId, fmt } from '../utils/constants';
import KanbanBoard from '../components/KanbanBoard';
import Modal from '../components/Modal';

const inputStyle = {
  padding: '10px 12px',
  border: `1px solid ${C.gray300}`,
  borderRadius: 8,
  fontSize: 14,
  width: '100%',
  boxSizing: 'border-box',
};

export default function DashboardModule({ estimates, onAddEstimate, onStatusChange, onOpenEstimate, onDeleteEstimate, onUpdateEstimate, team = [], currentUser = {}, onDuplicate }) {
  const ESTIMATORS = (team || []).filter(t => t.role === 'estimator' && t.active).map(t => ({ name: t.name, value: t.name }));
  const [showNewModal, setShowNewModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [editingEstimate, setEditingEstimate] = useState(null);
  const [viewMode, setViewMode] = useState('kanban'); // 'kanban' or 'list'
  const [searchQuery, setSearchQuery] = useState('');
  const [filterState, setFilterState] = useState('all');
  const [filterType, setFilterType] = useState('all');
  const [filterStatus, setFilterStatus] = useState('all');
  const [sortBy, setSortBy] = useState('newest');
  const [formData, setFormData] = useState({
    propertyName: '',
    address: '',
    city: '',
    state: 'FL',
    zip: '',
    contact: '',
    phone: '',
    type: 'shingle',
    estimator: '',
    notes: '',
    bidDueDate: '',
  });

  const resetForm = () => {
    setFormData({
      propertyName: '', address: '', city: '', state: 'FL', zip: '',
      contact: '', phone: '', type: 'shingle', estimator: '', notes: '', bidDueDate: '',
    });
  };

  const handleSubmit = () => {
    if (!formData.propertyName || !formData.address) {
      alert('Please fill in property name and address');
      return;
    }
    const status = formData.estimator ? 'assigned' : 'unassigned';
    onAddEstimate({
      id: generateId(),
      ...formData,
      status,
      buildings: [],
      createdAt: new Date().toISOString(),
    });
    resetForm();
    setShowNewModal(false);
  };

  const handleEdit = (estimate) => {
    setEditingEstimate(estimate);
    setFormData({
      propertyName: estimate.propertyName || '',
      address: estimate.address || '',
      city: estimate.city || '',
      state: estimate.state || 'FL',
      zip: estimate.zip || '',
      contact: estimate.contact || '',
      phone: estimate.phone || '',
      type: estimate.type || 'shingle',
      estimator: estimate.estimator || '',
      notes: estimate.notes || '',
      bidDueDate: estimate.bidDueDate || '',
    });
    setShowEditModal(true);
  };

  const handleEditSubmit = () => {
    if (!formData.propertyName || !formData.address) {
      alert('Please fill in property name and address');
      return;
    }
    const status = formData.estimator && editingEstimate.status === 'unassigned' ? 'assigned' : editingEstimate.status;
    onUpdateEstimate({ ...editingEstimate, ...formData, status });
    setShowEditModal(false);
    setEditingEstimate(null);
    resetForm();
  };

  const handleDelete = (estimateId) => {
    if (window.confirm('Delete this estimate? This cannot be undone.')) {
      onDeleteEstimate(estimateId);
    }
  };

  const handleDuplicate = (estimate) => {
    const duplicated = {
      id: generateId(),
      propertyName: estimate.propertyName + ' (Copy)',
      address: estimate.address,
      city: estimate.city,
      state: estimate.state,
      zip: estimate.zip,
      contact: estimate.contact,
      phone: estimate.phone,
      type: estimate.type,
      estimator: '',
      notes: estimate.notes,
      bidDueDate: estimate.bidDueDate,
      status: 'unassigned',
      buildings: estimate.buildings ? [...estimate.buildings] : [],
      createdAt: new Date().toISOString(),
    };
    if (onDuplicate) {
      onDuplicate(duplicated);
    } else {
      onAddEstimate(duplicated);
    }
  };

  // Computed filteredEstimates with search, filters, and sort
  const filteredEstimates = (() => {
    let result = [...estimates];

    // Apply search filter
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      result = result.filter(e => e.propertyName.toLowerCase().includes(q));
    }

    // Apply state filter
    if (filterState !== 'all') {
      result = result.filter(e => e.state === filterState);
    }

    // Apply type filter
    if (filterType !== 'all') {
      result = result.filter(e => e.type === filterType);
    }

    // Apply status filter
    if (filterStatus !== 'all') {
      result = result.filter(e => e.status === filterStatus);
    }

    // Apply sort
    result.sort((a, b) => {
      switch (sortBy) {
        case 'newest':
          return (b.createdAt || '').localeCompare(a.createdAt || '');
        case 'oldest':
          return (a.createdAt || '').localeCompare(b.createdAt || '');
        case 'name-asc':
          return a.propertyName.localeCompare(b.propertyName);
        case 'name-desc':
          return b.propertyName.localeCompare(a.propertyName);
        case 'duedate':
          {
            const aDate = a.bidDueDate ? new Date(a.bidDueDate) : new Date('9999-12-31');
            const bDate = b.bidDueDate ? new Date(b.bidDueDate) : new Date('9999-12-31');
            return aDate - bDate;
          }
        case 'cost-high-low':
          return (b.totalCost || 0) - (a.totalCost || 0);
        default:
          return 0;
      }
    });

    return result;
  })();

  // ==================== FILTER BAR ====================
  const renderFilterBar = () => (
    <div style={{
      backgroundColor: C.white,
      borderBottom: `1px solid ${C.gray200}`,
      padding: '12px 20px',
      display: 'flex',
      gap: 10,
      alignItems: 'center',
      flexWrap: 'wrap',
    }}>
      <input
        type="text"
        placeholder="Search estimates..."
        value={searchQuery}
        onChange={(e) => setSearchQuery(e.target.value)}
        style={{
          padding: '8px 10px',
          border: `1px solid ${C.gray200}`,
          borderRadius: 6,
          fontSize: 12,
          height: 34,
          width: 180,
          boxSizing: 'border-box',
        }}
      />
      <select
        value={filterState}
        onChange={(e) => setFilterState(e.target.value)}
        style={{
          padding: '8px 10px',
          border: `1px solid ${C.gray200}`,
          borderRadius: 6,
          fontSize: 12,
          height: 34,
          boxSizing: 'border-box',
          backgroundColor: C.white,
          cursor: 'pointer',
        }}
      >
        <option value="all">All States</option>
        <option value="FL">Florida</option>
        <option value="GA">Georgia</option>
        <option value="TX">Texas</option>
        <option value="TN">Tennessee</option>
      </select>
      <select
        value={filterType}
        onChange={(e) => setFilterType(e.target.value)}
        style={{
          padding: '8px 10px',
          border: `1px solid ${C.gray200}`,
          borderRadius: 6,
          fontSize: 12,
          height: 34,
          boxSizing: 'border-box',
          backgroundColor: C.white,
          cursor: 'pointer',
        }}
      >
        <option value="all">All Types</option>
        <option value="shingle">Shingle</option>
        <option value="tile">Tile</option>
        <option value="tpo">TPO</option>
      </select>
      <select
        value={filterStatus}
        onChange={(e) => setFilterStatus(e.target.value)}
        style={{
          padding: '8px 10px',
          border: `1px solid ${C.gray200}`,
          borderRadius: 6,
          fontSize: 12,
          height: 34,
          boxSizing: 'border-box',
          backgroundColor: C.white,
          cursor: 'pointer',
        }}
      >
        <option value="all">All Statuses</option>
        <option value="unassigned">Unassigned</option>
        <option value="assigned">Assigned</option>
        <option value="in_progress">In Progress</option>
        <option value="submitted">Submitted</option>
        <option value="approved">Approved</option>
      </select>
      <select
        value={sortBy}
        onChange={(e) => setSortBy(e.target.value)}
        style={{
          padding: '8px 10px',
          border: `1px solid ${C.gray200}`,
          borderRadius: 6,
          fontSize: 12,
          height: 34,
          boxSizing: 'border-box',
          backgroundColor: C.white,
          cursor: 'pointer',
        }}
      >
        <option value="newest">Newest</option>
        <option value="oldest">Oldest</option>
        <option value="name-asc">Name A-Z</option>
        <option value="name-desc">Name Z-A</option>
        <option value="duedate">Due Date</option>
        <option value="cost-high-low">Cost High-Low</option>
      </select>
    </div>
  );

  // ==================== BID DUE DATE TRACKER ====================
  const getDueDateItems = () => {
    const now = new Date();
    now.setHours(0, 0, 0, 0);
    return estimates
      .filter(e => e.bidDueDate && e.status !== 'approved')
      .map(e => {
        const d = new Date(e.bidDueDate + 'T00:00:00');
        const diff = Math.ceil((d - now) / (1000 * 60 * 60 * 24));
        let urgency = 'normal';
        if (diff < 0) urgency = 'overdue';
        else if (diff <= 3) urgency = 'urgent';
        else if (diff <= 7) urgency = 'soon';
        return { ...e, dueDate: d, daysDiff: diff, urgency };
      })
      .sort((a, b) => a.dueDate - b.dueDate);
  };

  const renderBidTracker = () => {
    const items = getDueDateItems();
    if (items.length === 0) return null;

    const urgencyColors = {
      overdue: { color: C.red, bg: C.redBg, label: 'Overdue' },
      urgent: { color: '#D97706', bg: C.yellowBg, label: 'Due Soon' },
      soon: { color: C.blue, bg: C.blueBg, label: 'This Week' },
      normal: { color: C.gray500, bg: C.gray100, label: 'Upcoming' },
    };

    return (
      <div style={{
        backgroundColor: C.white, border: `1px solid ${C.gray200}`, borderRadius: 8,
        padding: 16, marginBottom: 16,
      }}>
        <h3 style={{ fontSize: 14, fontWeight: 600, color: C.navy, marginBottom: 12 }}>
          Bid Due Dates
        </h3>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
          {items.map(item => {
            const uc = urgencyColors[item.urgency];
            const statusInfo = ESTIMATE_STATUSES.find(s => s.key === item.status);
            return (
              <div key={item.id}
                onClick={() => onOpenEstimate(item)}
                style={{
                  display: 'flex', alignItems: 'center', gap: 12,
                  padding: '8px 12px', borderRadius: 6,
                  backgroundColor: uc.bg, cursor: 'pointer',
                  transition: 'opacity 0.15s',
                }}
              >
                <div style={{
                  fontSize: 11, fontWeight: 700, color: uc.color,
                  minWidth: 72, textAlign: 'center',
                  padding: '2px 6px', borderRadius: 4,
                  backgroundColor: C.white, border: `1px solid ${uc.color}`,
                }}>
                  {item.dueDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: 13, fontWeight: 600, color: C.navy, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {item.propertyName}
                  </div>
                  <div style={{ fontSize: 11, color: C.gray500 }}>
                    {item.estimator || 'Unassigned'} · {statusInfo?.label || item.status}
                  </div>
                </div>
                <div style={{ fontSize: 11, fontWeight: 600, color: uc.color, whiteSpace: 'nowrap' }}>
                  {item.daysDiff < 0 ? `${Math.abs(item.daysDiff)}d overdue` :
                   item.daysDiff === 0 ? 'Today' :
                   item.daysDiff === 1 ? 'Tomorrow' :
                   `${item.daysDiff}d left`}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    );
  };

  // ==================== LIST VIEW ====================
  const renderListView = () => {
    const now = new Date();
    now.setHours(0, 0, 0, 0);

    return (
      <div style={{ padding: 20, backgroundColor: C.gray50, minHeight: '100%' }}>
        {renderBidTracker()}
        <div style={{ backgroundColor: C.white, borderRadius: 8, border: `1px solid ${C.gray200}`, overflow: 'hidden' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ backgroundColor: C.gray50 }}>
                <th style={thStyle}>Property</th>
                <th style={thStyle}>Type</th>
                <th style={thStyle}>State</th>
                <th style={thStyle}>Estimator</th>
                <th style={thStyle}>Bid Due</th>
                <th style={thStyle}>Status</th>
                <th style={{ ...thStyle, textAlign: 'right' }}>Total</th>
                <th style={{ ...thStyle, textAlign: 'center', width: 80 }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredEstimates.map((est, i) => {
                const typeInfo = ESTIMATE_TYPES.find(t => t.key === est.type) || {};
                const statusInfo = ESTIMATE_STATUSES.find(s => s.key === est.status) || {};
                let dueBadge = null;
                if (est.bidDueDate) {
                  const d = new Date(est.bidDueDate + 'T00:00:00');
                  const diff = Math.ceil((d - now) / (1000 * 60 * 60 * 24));
                  let dueColor = C.gray500;
                  let dueBg = C.gray100;
                  if (diff < 0) { dueColor = C.red; dueBg = C.redBg; }
                  else if (diff <= 3) { dueColor = '#D97706'; dueBg = C.yellowBg; }
                  else if (diff <= 7) { dueColor = C.blue; dueBg = C.blueBg; }
                  dueBadge = (
                    <span style={{ fontSize: 11, fontWeight: 600, color: dueColor, backgroundColor: dueBg, padding: '2px 8px', borderRadius: 4 }}>
                      {d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                    </span>
                  );
                }

                return (
                  <tr key={est.id}
                    onClick={() => onOpenEstimate(est)}
                    style={{
                      borderBottom: `1px solid ${C.gray200}`,
                      backgroundColor: C.white,
                      cursor: 'pointer',
                      transition: 'background-color 0.1s',
                    }}
                    onMouseOver={(e) => e.currentTarget.style.backgroundColor = C.blueBg}
                    onMouseOut={(e) => e.currentTarget.style.backgroundColor = C.white}
                  >
                    <td style={tdStyle}>
                      <div style={{ fontWeight: 600, color: C.navy, fontSize: 13 }}>{est.propertyName}</div>
                      <div style={{ fontSize: 11, color: C.gray500 }}>{est.address}{est.city ? `, ${est.city}` : ''}</div>
                    </td>
                    <td style={tdStyle}>
                      <span style={{ fontSize: 12 }}>{typeInfo.icon} {typeInfo.label}</span>
                    </td>
                    <td style={tdStyle}><span style={{ fontSize: 12 }}>{est.state}</span></td>
                    <td style={tdStyle}>
                      <select
                        value={est.estimator || ''}
                        onClick={(e) => e.stopPropagation()}
                        onChange={(e) => {
                          e.stopPropagation();
                          const val = e.target.value;
                          const newStatus = val && est.status === 'unassigned' ? 'assigned' : (!val && est.status === 'assigned' ? 'unassigned' : est.status);
                          onUpdateEstimate({ ...est, estimator: val, status: newStatus });
                        }}
                        style={{ padding: '4px 6px', fontSize: 12, border: `1px solid ${C.gray200}`, borderRadius: 4, backgroundColor: C.white, cursor: 'pointer' }}
                      >
                        <option value="">Unassigned</option>
                        {ESTIMATORS.map(e => (
                          <option key={e.value} value={e.value}>{e.name}</option>
                        ))}
                      </select>
                    </td>
                    <td style={tdStyle}>{dueBadge || <span style={{ fontSize: 11, color: C.gray400 }}>—</span>}</td>
                    <td style={tdStyle}>
                      <span style={{
                        fontSize: 11, fontWeight: 600, color: statusInfo.color,
                        backgroundColor: statusInfo.bg, padding: '2px 8px', borderRadius: 10,
                      }}>
                        {statusInfo.label}
                      </span>
                    </td>
                    <td style={{ ...tdStyle, textAlign: 'right', fontWeight: 600, color: C.green, fontSize: 13 }}>
                      {est.totalCost ? fmt(est.totalCost) : '—'}
                    </td>
                    <td style={{ ...tdStyle, textAlign: 'center' }}>
                      <div style={{ display: 'flex', gap: 4, justifyContent: 'center' }}>
                        <button onClick={(e) => { e.stopPropagation(); handleDuplicate(est); }}
                          style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: 14, color: C.gray400, padding: '2px 4px' }} title="Duplicate">📋</button>
                        <button onClick={(e) => { e.stopPropagation(); handleEdit(est); }}
                          style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: 14, color: C.gray400, padding: '2px 4px' }} title="Edit">✏️</button>
                        <button onClick={(e) => { e.stopPropagation(); handleDelete(est.id); }}
                          style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: 14, color: C.gray400, padding: '2px 4px' }} title="Delete">🗑️</button>
                      </div>
                    </td>
                  </tr>
                );
              })}
              {filteredEstimates.length === 0 && (
                <tr><td colSpan={9} style={{ ...tdStyle, textAlign: 'center', color: C.gray400, padding: 40 }}>
                  {estimates.length === 0 ? 'No estimates yet. Click "+ New Estimate" to get started.' : 'No estimates match your filters.'}
                </td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    );
  };

  // ==================== FORM ====================
  const renderForm = (submitFn, submitLabel) => (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
      <input type="text" placeholder="Property Name *" value={formData.propertyName}
        onChange={(e) => setFormData({ ...formData, propertyName: e.target.value })} style={inputStyle} />
      <input type="text" placeholder="Address *" value={formData.address}
        onChange={(e) => setFormData({ ...formData, address: e.target.value })} style={inputStyle} />
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 10 }}>
        <input type="text" placeholder="City" value={formData.city}
          onChange={(e) => setFormData({ ...formData, city: e.target.value })} style={inputStyle} />
        <select value={formData.state} onChange={(e) => setFormData({ ...formData, state: e.target.value })} style={inputStyle}>
          <option value="FL">Florida</option>
          <option value="GA">Georgia</option>
          <option value="TX">Texas</option>
          <option value="TN">Tennessee</option>
        </select>
        <input type="text" placeholder="Zip" value={formData.zip}
          onChange={(e) => setFormData({ ...formData, zip: e.target.value })} style={inputStyle} />
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
        <input type="text" placeholder="Contact Name" value={formData.contact}
          onChange={(e) => setFormData({ ...formData, contact: e.target.value })} style={inputStyle} />
        <input type="text" placeholder="Phone" value={formData.phone}
          onChange={(e) => setFormData({ ...formData, phone: e.target.value })} style={inputStyle} />
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
        <select value={formData.type} onChange={(e) => setFormData({ ...formData, type: e.target.value })} style={inputStyle}>
          {ESTIMATE_TYPES.map(t => (
            <option key={t.key} value={t.key}>{t.label}</option>
          ))}
        </select>
        <select value={formData.estimator} onChange={(e) => setFormData({ ...formData, estimator: e.target.value })} style={inputStyle}>
          <option value="">Assign Estimator...</option>
          {ESTIMATORS.map(e => (
            <option key={e.value} value={e.value}>{e.name}</option>
          ))}
        </select>
      </div>
      <div>
        <label style={{ fontSize: 12, fontWeight: 600, color: C.navy, display: 'block', marginBottom: 4 }}>Bid Due Date</label>
        <input type="date" value={formData.bidDueDate}
          onChange={(e) => setFormData({ ...formData, bidDueDate: e.target.value })} style={inputStyle} />
      </div>
      <textarea placeholder="Notes" value={formData.notes}
        onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
        style={{ ...inputStyle, minHeight: 80, fontFamily: 'inherit' }} />
      <div style={{ display: 'flex', gap: 12, justifyContent: 'flex-end' }}>
        <button onClick={() => { setShowNewModal(false); setShowEditModal(false); resetForm(); }}
          style={{ padding: '10px 16px', backgroundColor: C.gray200, color: C.navy, border: 'none', borderRadius: 8, fontSize: 13, fontWeight: 600, cursor: 'pointer' }}>
          Cancel
        </button>
        <button onClick={submitFn}
          style={{ padding: '10px 16px', backgroundColor: C.red, color: C.white, border: 'none', borderRadius: 8, fontSize: 13, fontWeight: 600, cursor: 'pointer' }}>
          {submitLabel}
        </button>
      </div>
    </div>
  );

  return (
    <div style={{ width: '100%', height: '100%', display: 'flex', flexDirection: 'column' }}>
      <div style={{
        padding: '16px 24px',
        borderBottom: `1px solid ${C.gray200}`,
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        backgroundColor: C.white,
      }}>
        <h2 style={{ fontSize: 18, fontWeight: 600, color: C.navy }}>Dashboard</h2>
        <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
          {/* View toggle */}
          <div style={{ display: 'flex', border: `1px solid ${C.gray300}`, borderRadius: 6, overflow: 'hidden' }}>
            <button
              onClick={() => setViewMode('kanban')}
              style={{
                padding: '6px 12px', border: 'none', fontSize: 12, fontWeight: 600, cursor: 'pointer',
                backgroundColor: viewMode === 'kanban' ? C.navy : C.white,
                color: viewMode === 'kanban' ? C.white : C.gray600,
              }}
            >
              Board
            </button>
            <button
              onClick={() => setViewMode('list')}
              style={{
                padding: '6px 12px', border: 'none', fontSize: 12, fontWeight: 600, cursor: 'pointer',
                backgroundColor: viewMode === 'list' ? C.navy : C.white,
                color: viewMode === 'list' ? C.white : C.gray600,
                borderLeft: `1px solid ${C.gray300}`,
              }}
            >
              List
            </button>
          </div>
          <button
            onClick={() => { resetForm(); setShowNewModal(true); }}
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
            + New Estimate
          </button>
        </div>
      </div>

      {renderFilterBar()}
      <div style={{ flex: 1, overflow: 'auto' }}>
        {viewMode === 'kanban' ? (
          <div>
            <div style={{ padding: '16px 20px 0 20px', backgroundColor: C.gray50 }}>
              {renderBidTracker()}
            </div>
            <KanbanBoard
              estimates={filteredEstimates}
              onStatusChange={onStatusChange}
              onCardClick={onOpenEstimate}
              onEditClick={handleEdit}
              onDeleteClick={handleDelete}
              onDuplicate={handleDuplicate}
              onUpdateEstimate={onUpdateEstimate}
              team={team}
            />
          </div>
        ) : (
          renderListView()
        )}
      </div>

      <Modal isOpen={showNewModal} title="New Estimate" onClose={() => { setShowNewModal(false); resetForm(); }} width={560}>
        {renderForm(handleSubmit, 'Create')}
      </Modal>

      <Modal isOpen={showEditModal} title="Edit Estimate" onClose={() => { setShowEditModal(false); resetForm(); }} width={560}>
        {renderForm(handleEditSubmit, 'Save Changes')}
      </Modal>
    </div>
  );
}

const thStyle = { padding: '10px 14px', textAlign: 'left', fontSize: 12, fontWeight: 600, color: C.gray600, borderBottom: `2px solid ${C.gray200}` };
const tdStyle = { padding: '10px 14px', fontSize: 13, color: C.gray700 };
