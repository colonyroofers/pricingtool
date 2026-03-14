import React, { useState } from 'react';
import { C, ESTIMATE_TYPES, ESTIMATE_STATUSES, generateId, fmt, STATUS_CONFIG, KANBAN_COLUMNS, TERMINAL_STATUSES, DEADLINE_TYPES, LOSS_REASONS } from '../utils/constants';
import KanbanBoard from '../components/KanbanBoard';
import Modal from '../components/Modal';
import ConfirmDialog from '../components/ConfirmDialog';
import { useToast } from '../components/Toast';

const inputStyle = {
  padding: '10px 12px',
  border: `1px solid ${C.gray300}`,
  borderRadius: 8,
  fontSize: 14,
  width: '100%',
  boxSizing: 'border-box',
};

export default function DashboardModule({ estimates, onAddEstimate, onStatusChange, onOpenEstimate, onDeleteEstimate, onUpdateEstimate, team = [], currentUser = {}, onDuplicate, canViewMargin = false }) {
  const ESTIMATORS = (team || []).filter(t => t.role === 'estimator' && t.active).map(t => ({ name: t.name, value: t.name }));
  const { showToast } = useToast();
  const [showNewModal, setShowNewModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [editingEstimate, setEditingEstimate] = useState(null);
  const [viewMode, setViewMode] = useState('kanban'); // 'kanban' or 'list'
  const [searchQuery, setSearchQuery] = useState('');
  const [filterState, setFilterState] = useState('all');
  const [filterType, setFilterType] = useState('all');
  const [filterStatus, setFilterStatus] = useState('all');
  const [filterDeadline, setFilterDeadline] = useState('');
  const [sortBy, setSortBy] = useState('newest');
  const [confirmDialog, setConfirmDialog] = useState({ open: false, title: '', message: '', onConfirm: null });
  const [showLossDialog, setShowLossDialog] = useState(false);
  const [lossTarget, setLossTarget] = useState(null);
  const [lossReason, setLossReason] = useState('');
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
    setConfirmDialog({
      open: true,
      title: 'Delete Estimate',
      message: 'Delete this estimate? This cannot be undone.',
      onConfirm: () => {
        onDeleteEstimate(estimateId);
        setConfirmDialog({ ...confirmDialog, open: false });
      },
    });
  };

  const trackStatusChange = (estimate, newStatus) => {
    const now = new Date().toISOString();
    const statusHistory = estimate.statusHistory || [];
    statusHistory.push({
      status: newStatus,
      timestamp: now,
      changedBy: currentUser?.name || 'Unknown',
    });
    return { ...estimate, status: newStatus, statusHistory, lastStatusChange: now };
  };

  const handleDuplicate = (estimate) => {
    const duplicated = {
      id: generateId(),
      propertyName: estimate.propertyName + ' (Copy)',
      address: '',
      city: '',
      state: estimate.state,
      zip: '',
      contact: '',
      phone: '',
      type: estimate.type,
      estimator: '',
      notes: '',
      bidDueDate: '',
      status: 'unassigned',
      buildings: estimate.buildings ? JSON.parse(JSON.stringify(estimate.buildings)) : [],
      materialList: estimate.materialList ? JSON.parse(JSON.stringify(estimate.materialList)) : [],
      customLineItems: estimate.customLineItems ? JSON.parse(JSON.stringify(estimate.customLineItems)) : [],
      totalCost: estimate.totalCost,
      marginPercent: estimate.marginPercent,
      createdAt: new Date().toISOString(),
      duplicatedFrom: estimate.id,
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

    // Apply deadline filter
    if (filterDeadline !== '') {
      result = result.filter(e => (e.deadlineType || 'none') === filterDeadline);
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
        className="pressable"
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
        className="pressable"
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
        className="pressable"
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
        {ESTIMATE_STATUSES.map(s => (
          <option key={s} value={s}>{STATUS_CONFIG[s]?.label || s}</option>
        ))}
      </select>
      <select
        className="pressable"
        value={filterDeadline}
        onChange={(e) => setFilterDeadline(e.target.value)}
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
        <option value="">All Deadlines</option>
        <option value="hard">Hard Deadline</option>
        <option value="flexible">Flexible</option>
        <option value="none">No Deadline</option>
      </select>
      <select
        className="pressable"
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
      .filter(e => e.bidDueDate && !TERMINAL_STATUSES.includes(e.status))
      .map(e => {
        const d = new Date(e.bidDueDate + 'T00:00:00');
        const diff = Math.ceil((d - now) / (1000 * 60 * 60 * 24));
        let urgency = 'normal';
        if (diff < 0) urgency = 'overdue';
        else if (diff <= 3) urgency = 'urgent';
        else if (diff <= 7) urgency = 'soon';
        return { ...e, dueDate: d, daysDiff: diff, urgency };
      })
      .sort((a, b) => {
        // Hard deadlines first
        const aHard = a.deadlineType === 'hard' ? 0 : 1;
        const bHard = b.deadlineType === 'hard' ? 0 : 1;
        if (aHard !== bHard) return aHard - bHard;
        return a.dueDate - b.dueDate;
      });
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
            const statusConfig = STATUS_CONFIG[item.status];
            const deadlineTypeColor = item.deadlineType === 'hard' ? '#DC2626' : item.deadlineType === 'flexible' ? '#F59E0B' : C.gray500;
            return (
              <div key={item.id}
                onClick={() => onOpenEstimate(item)}
                style={{
                  display: 'flex', alignItems: 'center', gap: 12,
                  padding: '8px 12px', borderRadius: 6,
                  backgroundColor: uc.bg, cursor: 'pointer',
                  transition: 'opacity 0.15s',
                  borderLeft: `3px solid ${deadlineTypeColor}`,
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
                    {item.estimator || 'Unassigned'} · {statusConfig?.label || item.status}
                  </div>
                </div>
                {item.deadlineType && (
                  <span style={{ fontSize: 10, fontWeight: 600, color: deadlineTypeColor, textTransform: 'uppercase' }}>
                    {item.deadlineType}
                  </span>
                )}
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
                {canViewMargin && <th style={{ ...thStyle, textAlign: 'right' }}>Margin</th>}
                <th style={{ ...thStyle, textAlign: 'right' }}>Total</th>
                <th style={{ ...thStyle, textAlign: 'center', width: 80 }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredEstimates.map((est, i) => {
                const typeInfo = ESTIMATE_TYPES.find(t => t.key === est.type) || {};
                const statusInfo = STATUS_CONFIG[est.status] || {};
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
                    {canViewMargin && (
                      <td style={{ ...tdStyle, textAlign: 'right', fontWeight: 600, color: (est.marginPercent || 0) < 25 ? C.red : C.green, fontSize: 13 }}>
                        {est.marginPercent ? `${est.marginPercent}%` : '—'}
                        {(est.marginPercent || 0) < 25 && <span style={{ marginLeft: 4, color: C.red }}>!</span>}
                      </td>
                    )}
                    <td style={{ ...tdStyle, textAlign: 'right', fontWeight: 600, color: C.green, fontSize: 13 }}>
                      {est.totalCost ? fmt(est.totalCost) : '—'}
                    </td>
                    <td style={{ ...tdStyle, textAlign: 'center' }}>
                      <div style={{ display: 'flex', gap: 4, justifyContent: 'center' }}>
                        <button className="pressable" onClick={(e) => { e.stopPropagation(); handleDuplicate(est); }}
                          style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: 14, color: C.gray400, padding: '2px 4px' }} title="Duplicate"><span style={{ pointerEvents: 'none' }}>📋</span></button>
                        <button className="pressable" onClick={(e) => { e.stopPropagation(); handleEdit(est); }}
                          style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: 14, color: C.gray400, padding: '2px 4px' }} title="Edit"><span style={{ pointerEvents: 'none' }}>✏️</span></button>
                        <button className="pressable" onClick={(e) => { e.stopPropagation(); handleDelete(est.id); }}
                          style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: 14, color: C.gray400, padding: '2px 4px' }} title="Delete"><span style={{ pointerEvents: 'none' }}>🗑️</span></button>
                      </div>
                    </td>
                  </tr>
                );
              })}
              {filteredEstimates.length === 0 && (
                <tr><td colSpan={canViewMargin ? 10 : 9} style={{ ...tdStyle, textAlign: 'center', padding: 0 }}>
                  <div style={{
                    display: 'flex', flexDirection: 'column', alignItems: 'center',
                    justifyContent: 'center', padding: 48, textAlign: 'center'
                  }}>
                    <div style={{
                      width: 64, height: 64, borderRadius: '50%', background: '#F5F5F7',
                      display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 16
                    }}>
                      <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#9CA3AF" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                        <polyline points="14 2 14 8 20 8" />
                      </svg>
                    </div>
                    <p style={{ fontSize: 16, fontWeight: 600, color: '#252842', marginBottom: 4 }}>
                      {estimates.length === 0 ? 'No estimates yet' : 'No matching estimates'}
                    </p>
                    <p style={{ fontSize: 14, color: '#9CA3AF', marginBottom: 16 }}>
                      {estimates.length === 0 ? 'Click "+ New Estimate" above to create your first estimate.' : 'Try adjusting your filters to find what you\'re looking for.'}
                    </p>
                  </div>
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
    <div style={{ width: '100%', height: '100%', display: 'flex', flexDirection: 'column', maxWidth: 1280, margin: '0 auto' }}>
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
              className="pressable"
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
              className="pressable"
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
            className="pressable"
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
            <span style={{ pointerEvents: 'none' }}>+ New Estimate</span>
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
              onStatusChange={(id, newStatus) => {
                const est = estimates.find(e => e.id === id);
                if (est) {
                  const updated = trackStatusChange(est, newStatus);
                  onStatusChange(id, newStatus);
                  onUpdateEstimate(updated);
                }
              }}
              onCardClick={onOpenEstimate}
              onEditClick={handleEdit}
              onDeleteClick={handleDelete}
              onDuplicate={handleDuplicate}
              onUpdateEstimate={onUpdateEstimate}
              onWon={(est) => {
                const updated = trackStatusChange(est, 'awarded');
                onUpdateEstimate(updated);
              }}
              onLost={(est) => {
                setLossTarget(est);
                setShowLossDialog(true);
              }}
              onNoResponse={(est) => {
                const updated = trackStatusChange(est, 'no_response');
                onUpdateEstimate(updated);
              }}
              team={team}
              canViewMargin={canViewMargin}
              currentUser={currentUser}
            />
            <div style={{
              padding: '20px',
              backgroundColor: C.gray50,
              display: 'flex',
              gap: 16,
              flexWrap: 'wrap',
            }}>
              {TERMINAL_STATUSES.map(status => {
                const items = filteredEstimates.filter(e => e.status === status);
                const statusConfig = STATUS_CONFIG[status];
                return (
                  <div key={status} style={{
                    flex: '1 1 auto',
                    minWidth: 200,
                    padding: 12,
                    backgroundColor: C.white,
                    borderRadius: 8,
                    border: `1px solid ${C.gray200}`,
                  }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
                      <div style={{
                        width: 10, height: 10, borderRadius: '50%',
                        backgroundColor: statusConfig.color,
                      }} />
                      <h4 style={{ fontSize: 13, fontWeight: 600, color: C.navy, margin: 0 }}>
                        {statusConfig.label}
                      </h4>
                    </div>
                    <p style={{ fontSize: 24, fontWeight: 700, color: statusConfig.color, margin: '8px 0 0 0' }}>
                      {items.length}
                    </p>
                    {items.length > 0 && (
                      <div style={{ fontSize: 11, color: C.gray500, marginTop: 8, maxHeight: 60, overflow: 'auto' }}>
                        {items.slice(0, 3).map(item => (
                          <div key={item.id} style={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                            {item.propertyName}
                          </div>
                        ))}
                        {items.length > 3 && <div style={{ fontWeight: 600 }}>+{items.length - 3} more</div>}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
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

      <Modal isOpen={showLossDialog} title="Mark as Lost" onClose={() => { setShowLossDialog(false); setLossTarget(null); setLossReason(''); }} width={400}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {lossTarget && (
            <>
              <div>
                <label style={{ fontSize: 12, fontWeight: 600, color: C.navy, display: 'block', marginBottom: 4 }}>
                  Estimate: {lossTarget.propertyName}
                </label>
              </div>
              <div>
                <label style={{ fontSize: 12, fontWeight: 600, color: C.navy, display: 'block', marginBottom: 4 }}>
                  Loss Reason
                </label>
                <select
                  value={lossReason}
                  onChange={(e) => setLossReason(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '10px 12px',
                    border: `1px solid ${C.gray300}`,
                    borderRadius: 8,
                    fontSize: 14,
                    boxSizing: 'border-box',
                  }}
                >
                  <option value="">Select a reason...</option>
                  {LOSS_REASONS.map(reason => (
                    <option key={reason} value={reason}>{reason}</option>
                  ))}
                </select>
              </div>
              <div style={{ display: 'flex', gap: 12, justifyContent: 'flex-end', marginTop: 8 }}>
                <button
                  onClick={() => { setShowLossDialog(false); setLossTarget(null); setLossReason(''); }}
                  style={{ padding: '10px 16px', backgroundColor: C.gray200, color: C.navy, border: 'none', borderRadius: 8, fontSize: 13, fontWeight: 600, cursor: 'pointer' }}
                >
                  Cancel
                </button>
                <button
                  onClick={() => {
                    if (lossTarget && lossReason) {
                      const updated = trackStatusChange(lossTarget, 'lost');
                      updated.lossReason = lossReason;
                      onUpdateEstimate(updated);
                      setShowLossDialog(false);
                      setLossTarget(null);
                      setLossReason('');
                    }
                  }}
                  style={{ padding: '10px 16px', backgroundColor: C.red, color: C.white, border: 'none', borderRadius: 8, fontSize: 13, fontWeight: 600, cursor: 'pointer' }}
                >
                  Mark as Lost
                </button>
              </div>
            </>
          )}
        </div>
      </Modal>

      <ConfirmDialog
        open={confirmDialog.open}
        title={confirmDialog.title}
        message={confirmDialog.message}
        onConfirm={confirmDialog.onConfirm}
        onCancel={() => setConfirmDialog({ ...confirmDialog, open: false })}
      />
    </div>
  );
}

const thStyle = { padding: '10px 14px', textAlign: 'left', fontSize: 12, fontWeight: 600, color: C.gray600, borderBottom: `2px solid ${C.gray200}` };
const tdStyle = { padding: '10px 14px', fontSize: 13, color: C.gray700 };
