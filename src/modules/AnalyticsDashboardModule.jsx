import React, { useState, useMemo } from 'react';
import { C, STATUS_CONFIG, ESTIMATE_STATUSES, fmt, TERMINAL_STATUSES } from '../utils/constants';

export default function AnalyticsDashboardModule({ estimates = [], team = [], currentUser = {}, canViewMargin = false }) {
  // ==================== STATE ====================
  const [filterMarket, setFilterMarket] = useState('all'); // all, FL, GA, TX, TN
  const [filterDateRange, setFilterDateRange] = useState('30days'); // 7days, 30days, 90days, 12months, alltime
  const [filterJobType, setFilterJobType] = useState('all'); // all, shingle, tile, tpo, metal, new_construction
  const [filterEstimator, setFilterEstimator] = useState('all');
  const [isLoading, setIsLoading] = useState(false);

  // ==================== HELPERS ====================
  const ESTIMATORS = useMemo(
    () => (team || []).filter(t => t.role === 'estimator' && t.active).map(t => ({ name: t.name, value: t.name })),
    [team]
  );

  const getDateRangeFilter = () => {
    const now = new Date();
    const start = new Date();
    switch (filterDateRange) {
      case '7days':
        start.setDate(now.getDate() - 7);
        break;
      case '30days':
        start.setDate(now.getDate() - 30);
        break;
      case '90days':
        start.setDate(now.getDate() - 90);
        break;
      case '12months':
        start.setFullYear(now.getFullYear() - 1);
        break;
      case 'alltime':
        start.setFullYear(1970);
        break;
      default:
        start.setDate(now.getDate() - 30);
    }
    return start;
  };

  const filteredEstimates = useMemo(() => {
    let result = [...estimates];
    const dateStart = getDateRangeFilter();

    // Apply market filter (maps state to market)
    if (filterMarket !== 'all') {
      result = result.filter(e => e.state === filterMarket);
    }

    // Apply date range filter
    result = result.filter(e => {
      const createdAt = e.createdAt ? new Date(e.createdAt) : null;
      return createdAt && createdAt >= dateStart;
    });

    // Apply job type filter
    if (filterJobType !== 'all') {
      result = result.filter(e => e.type === filterJobType);
    }

    // Apply estimator filter
    if (filterEstimator !== 'all') {
      result = result.filter(e => e.estimator === filterEstimator);
    }

    return result;
  }, [estimates, filterMarket, filterDateRange, filterJobType, filterEstimator]);

  // ==================== CALCULATIONS ====================
  const calculateTurnaroundTime = (estimate) => {
    if (!estimate.statusHistory || estimate.statusHistory.length === 0) return null;
    const assigned = estimate.statusHistory.find(h => h.status === 'assigned');
    const approved = estimate.statusHistory.find(h => h.status === 'approved');
    if (assigned && approved) {
      const diff = new Date(approved.timestamp) - new Date(assigned.timestamp);
      return Math.ceil(diff / (1000 * 60 * 60 * 24));
    }
    return null;
  };

  const avgTurnaroundTime = useMemo(() => {
    const times = filteredEstimates
      .map(e => calculateTurnaroundTime(e))
      .filter(t => t !== null && !isNaN(t));
    if (times.length === 0) return 0;
    return Math.round(times.reduce((a, b) => a + b, 0) / times.length);
  }, [filteredEstimates]);

  const winRate = useMemo(() => {
    const sent = filteredEstimates.filter(e => e.status === 'proposal_sent').length;
    if (sent === 0) return 0;
    const won = filteredEstimates.filter(e => e.status === 'awarded').length;
    return Math.round((won / sent) * 100);
  }, [filteredEstimates]);

  const revenuePipeline = useMemo(() => {
    return filteredEstimates
      .filter(e => !TERMINAL_STATUSES.includes(e.status))
      .reduce((sum, e) => sum + (e.totalCost || 0), 0);
  }, [filteredEstimates]);

  // ==================== ESTIMATE VOLUME BY STATUS ====================
  const statusCounts = useMemo(() => {
    const counts = {};
    ESTIMATE_STATUSES.forEach(status => {
      counts[status] = filteredEstimates.filter(e => e.status === status).length;
    });
    return counts;
  }, [filteredEstimates]);

  const maxStatusCount = useMemo(() => {
    return Math.max(...Object.values(statusCounts), 1);
  }, [statusCounts]);

  // ==================== ESTIMATOR WORKLOAD ====================
  const estimatorWorkload = useMemo(() => {
    const workload = {};
    ESTIMATORS.forEach(est => {
      const estEstimates = filteredEstimates.filter(e => e.estimator === est.name);
      const active = estEstimates.filter(e => !TERMINAL_STATUSES.includes(e.status)).length;
      const completed = estEstimates.filter(e => TERMINAL_STATUSES.includes(e.status)).length;

      const revisions = estEstimates.reduce((sum, e) => {
        return sum + (e.statusHistory ? e.statusHistory.filter(h => h.status === 'rejected').length : 0);
      }, 0);
      const avgRevisions = estEstimates.length > 0 ? (revisions / estEstimates.length).toFixed(2) : 0;

      const turnaroundTimes = estEstimates
        .map(e => calculateTurnaroundTime(e))
        .filter(t => t !== null && !isNaN(t));
      const avgTurnaround = turnaroundTimes.length > 0
        ? Math.round(turnaroundTimes.reduce((a, b) => a + b, 0) / turnaroundTimes.length)
        : 0;

      workload[est.name] = {
        name: est.name,
        active,
        completed,
        avgRevisions,
        avgTurnaround,
      };
    });
    return workload;
  }, [filteredEstimates, ESTIMATORS]);

  // ==================== WIN/LOSS BREAKDOWN ====================
  const winLossData = useMemo(() => {
    const sent = filteredEstimates.filter(e => e.status === 'proposal_sent').length;
    const won = filteredEstimates.filter(e => e.status === 'awarded').length;
    const lost = filteredEstimates.filter(e => e.status === 'lost').length;
    const noResponse = filteredEstimates.filter(e => e.status === 'no_response').length;

    const wonPct = sent > 0 ? Math.round((won / sent) * 100) : 0;
    const lostPct = sent > 0 ? Math.round((lost / sent) * 100) : 0;
    const noResponsePct = sent > 0 ? Math.round((noResponse / sent) * 100) : 0;

    let avgMarginWon = 0;
    let avgMarginLost = 0;
    if (canViewMargin) {
      const wonEsts = filteredEstimates.filter(e => e.status === 'awarded');
      const lostEsts = filteredEstimates.filter(e => e.status === 'lost');
      if (wonEsts.length > 0) {
        avgMarginWon = Math.round(
          wonEsts.reduce((sum, e) => sum + (e.marginPercent || 0), 0) / wonEsts.length
        );
      }
      if (lostEsts.length > 0) {
        avgMarginLost = Math.round(
          lostEsts.reduce((sum, e) => sum + (e.marginPercent || 0), 0) / lostEsts.length
        );
      }
    }

    return { sent, won, wonPct, lost, lostPct, noResponse, noResponsePct, avgMarginWon, avgMarginLost };
  }, [filteredEstimates, canViewMargin]);

  // ==================== REVISION RATES ====================
  const revisionRates = useMemo(() => {
    const rates = [];
    ESTIMATORS.forEach(est => {
      const estEstimates = filteredEstimates.filter(e => e.estimator === est.name);
      const totalRevisions = estEstimates.reduce((sum, e) => {
        return sum + (e.statusHistory ? e.statusHistory.filter(h => h.status === 'rejected').length : 0);
      }, 0);
      const avgRevisions = estEstimates.length > 0 ? (totalRevisions / estEstimates.length).toFixed(2) : 0;
      rates.push({
        name: est.name,
        total: estEstimates.length,
        avgRevisions: parseFloat(avgRevisions),
      });
    });
    return rates.sort((a, b) => b.avgRevisions - a.avgRevisions);
  }, [filteredEstimates, ESTIMATORS]);

  // ==================== BID DEADLINE COMPLIANCE ====================
  const bidComplianceData = useMemo(() => {
    const hardDeadline = filteredEstimates.filter(e => e.bidDueDate && e.deadlineType === 'hard');
    if (hardDeadline.length === 0) {
      return { onTime: 0, percentage: 0, total: 0 };
    }
    const onTime = hardDeadline.filter(e => {
      if (e.status !== 'approved' && e.status !== 'proposal_sent' && e.status !== 'awarded') return false;
      const dueDate = new Date(e.bidDueDate + 'T23:59:59');
      const statusHistory = e.statusHistory || [];
      const approvedEntry = statusHistory.find(h => h.status === 'approved');
      if (!approvedEntry) return false;
      return new Date(approvedEntry.timestamp) <= dueDate;
    }).length;
    return {
      onTime,
      total: hardDeadline.length,
      percentage: Math.round((onTime / hardDeadline.length) * 100),
    };
  }, [filteredEstimates]);

  // ==================== REVENUE PIPELINE BY STATUS ====================
  const revenuePipelineByStatus = useMemo(() => {
    const data = {};
    ESTIMATE_STATUSES.forEach(status => {
      if (!TERMINAL_STATUSES.includes(status)) {
        data[status] = filteredEstimates
          .filter(e => e.status === status)
          .reduce((sum, e) => sum + (e.totalCost || 0), 0);
      }
    });
    return data;
  }, [filteredEstimates]);

  const maxRevenue = useMemo(() => {
    return Math.max(...Object.values(revenuePipelineByStatus), 1);
  }, [revenuePipelineByStatus]);

  // ==================== EXPORT TO CSV ====================
  const handleExportCSV = () => {
    const headers = ['Property Name', 'Address', 'Type', 'State', 'Estimator', 'Status', 'Created Date'];
    if (canViewMargin) {
      headers.push('Total Cost', 'Margin %');
    } else {
      headers.push('Total Cost');
    }

    const rows = [headers];
    filteredEstimates.forEach(e => {
      const row = [
        e.propertyName || '',
        e.address || '',
        e.type || '',
        e.state || '',
        e.estimator || 'Unassigned',
        STATUS_CONFIG[e.status]?.label || e.status,
        e.createdAt ? new Date(e.createdAt).toLocaleDateString() : '',
      ];
      if (canViewMargin) {
        row.push(fmt(e.totalCost || 0));
        row.push((e.marginPercent || 0) + '%');
      } else {
        row.push(fmt(e.totalCost || 0));
      }
      rows.push(row);
    });

    const csv = rows.map(row => row.map(cell => `"${cell}"`).join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `analytics-export-${new Date().toISOString().split('T')[0]}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  // ==================== RENDER FILTER BAR ====================
  const renderFilterBar = () => (
    <div style={{
      backgroundColor: C.white,
      borderBottom: `1px solid ${C.gray200}`,
      padding: '14px 20px',
      display: 'flex',
      gap: 12,
      alignItems: 'center',
      flexWrap: 'wrap',
    }}>
      <select
        className="pressable"
        value={filterMarket}
        onChange={(e) => setFilterMarket(e.target.value)}
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
        <option value="all">Market: All</option>
        <option value="FL">Market: FL</option>
        <option value="GA">Market: GA</option>
        <option value="TX">Market: TX</option>
        <option value="TN">Market: TN</option>
      </select>

      <select
        className="pressable"
        value={filterDateRange}
        onChange={(e) => setFilterDateRange(e.target.value)}
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
        <option value="7days">Last 7 days</option>
        <option value="30days">Last 30 days</option>
        <option value="90days">Last 90 days</option>
        <option value="12months">Last 12 months</option>
        <option value="alltime">All Time</option>
      </select>

      <select
        className="pressable"
        value={filterJobType}
        onChange={(e) => setFilterJobType(e.target.value)}
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
        <option value="all">Job Type: All</option>
        <option value="shingle">Shingle</option>
        <option value="tile">Tile</option>
        <option value="tpo">TPO</option>
        <option value="metal">Metal</option>
        <option value="new_construction">New Construction</option>
      </select>

      <select
        className="pressable"
        value={filterEstimator}
        onChange={(e) => setFilterEstimator(e.target.value)}
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
        <option value="all">Estimator: All</option>
        {ESTIMATORS.map(est => (
          <option key={est.value} value={est.value}>Estimator: {est.name}</option>
        ))}
      </select>

      <button
        className="pressable"
        onClick={handleExportCSV}
        style={{
          padding: '8px 14px',
          backgroundColor: C.navy,
          color: C.white,
          border: 'none',
          borderRadius: 6,
          fontSize: 12,
          fontWeight: 600,
          cursor: 'pointer',
          marginLeft: 'auto',
        }}
      >
        <span style={{ pointerEvents: 'none' }}>Export to CSV</span>
      </button>
    </div>
  );

  // ==================== RENDER KPI CARDS ====================
  const renderKpiCards = () => (
    <div style={{
      display: 'grid',
      gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
      gap: 16,
      padding: '20px',
    }}>
      {/* Total Estimates */}
      <div style={{
        backgroundColor: C.white,
        border: `1px solid ${C.gray200}`,
        borderRadius: 8,
        padding: 16,
        boxShadow: '0 1px 3px rgba(0,0,0,0.08)',
      }}>
        <div style={{ fontSize: 12, fontWeight: 600, color: C.gray500, marginBottom: 8, textTransform: 'uppercase' }}>
          Total Estimates
        </div>
        <div style={{ fontSize: 32, fontWeight: 700, color: C.navy }}>
          {filteredEstimates.length}
        </div>
      </div>

      {/* Avg Turnaround Time */}
      <div style={{
        backgroundColor: C.white,
        border: `1px solid ${C.gray200}`,
        borderRadius: 8,
        padding: 16,
        boxShadow: '0 1px 3px rgba(0,0,0,0.08)',
      }}>
        <div style={{ fontSize: 12, fontWeight: 600, color: C.gray500, marginBottom: 8, textTransform: 'uppercase' }}>
          Avg Turnaround
        </div>
        <div style={{ fontSize: 32, fontWeight: 700, color: C.blue }}>
          {avgTurnaroundTime}
        </div>
        <div style={{ fontSize: 11, color: C.gray500, marginTop: 4 }}>days</div>
      </div>

      {/* Win Rate */}
      <div style={{
        backgroundColor: C.white,
        border: `1px solid ${C.gray200}`,
        borderRadius: 8,
        padding: 16,
        boxShadow: '0 1px 3px rgba(0,0,0,0.08)',
      }}>
        <div style={{ fontSize: 12, fontWeight: 600, color: C.gray500, marginBottom: 8, textTransform: 'uppercase' }}>
          Win Rate
        </div>
        <div style={{ fontSize: 32, fontWeight: 700, color: C.green }}>
          {winRate}%
        </div>
        {winLossData.sent > 0 && (
          <div style={{ fontSize: 11, color: C.gray500, marginTop: 4 }}>
            {winLossData.won} of {winLossData.sent} proposals
          </div>
        )}
      </div>

      {/* Revenue Pipeline */}
      {canViewMargin && (
        <div style={{
          backgroundColor: C.white,
          border: `1px solid ${C.gray200}`,
          borderRadius: 8,
          padding: 16,
          boxShadow: '0 1px 3px rgba(0,0,0,0.08)',
        }}>
          <div style={{ fontSize: 12, fontWeight: 600, color: C.gray500, marginBottom: 8, textTransform: 'uppercase' }}>
            Revenue Pipeline
          </div>
          <div style={{ fontSize: 28, fontWeight: 700, color: C.red }}>
            {fmt(revenuePipeline)}
          </div>
        </div>
      )}
    </div>
  );

  // ==================== RENDER ESTIMATE VOLUME BY STATUS ====================
  const renderEstimateVolume = () => (
    <div style={{
      backgroundColor: C.white,
      border: `1px solid ${C.gray200}`,
      borderRadius: 8,
      padding: 20,
      margin: '0 20px 20px 20px',
    }}>
      <h3 style={{ fontSize: 14, fontWeight: 600, color: C.navy, margin: '0 0 16px 0' }}>
        Estimate Volume by Status
      </h3>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        {ESTIMATE_STATUSES.map(status => {
          const count = statusCounts[status];
          const config = STATUS_CONFIG[status];
          const percentage = maxStatusCount > 0 ? (count / maxStatusCount) * 100 : 0;
          return (
            <div key={status} style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <div style={{ width: 120, fontSize: 12, fontWeight: 600, color: C.gray700 }}>
                {config.label}
              </div>
              <div style={{
                flex: 1,
                height: 24,
                backgroundColor: C.gray100,
                borderRadius: 4,
                overflow: 'hidden',
              }}>
                {percentage > 0 && (
                  <div style={{
                    height: '100%',
                    width: `${percentage}%`,
                    backgroundColor: config.color,
                    transition: 'width 0.2s',
                  }} />
                )}
              </div>
              <div style={{ width: 30, fontSize: 12, fontWeight: 600, color: config.color, textAlign: 'right' }}>
                {count}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );

  // ==================== RENDER ESTIMATOR WORKLOAD ====================
  const renderEstimatorWorkload = () => (
    <div style={{
      backgroundColor: C.white,
      border: `1px solid ${C.gray200}`,
      borderRadius: 8,
      padding: 20,
      margin: '0 20px 20px 20px',
      overflow: 'auto',
    }}>
      <h3 style={{ fontSize: 14, fontWeight: 600, color: C.navy, margin: '0 0 16px 0' }}>
        Estimator Workload
      </h3>
      <table style={{ width: '100%', borderCollapse: 'collapse' }}>
        <thead>
          <tr style={{ backgroundColor: C.gray50, borderBottom: `2px solid ${C.gray200}` }}>
            <th style={{ padding: '10px 12px', textAlign: 'left', fontSize: 12, fontWeight: 600, color: C.gray600 }}>
              Name
            </th>
            <th style={{ padding: '10px 12px', textAlign: 'center', fontSize: 12, fontWeight: 600, color: C.gray600 }}>
              Active
            </th>
            <th style={{ padding: '10px 12px', textAlign: 'center', fontSize: 12, fontWeight: 600, color: C.gray600 }}>
              Completed
            </th>
            <th style={{ padding: '10px 12px', textAlign: 'center', fontSize: 12, fontWeight: 600, color: C.gray600 }}>
              Avg Revisions
            </th>
            <th style={{ padding: '10px 12px', textAlign: 'center', fontSize: 12, fontWeight: 600, color: C.gray600 }}>
              Avg Turnaround (days)
            </th>
          </tr>
        </thead>
        <tbody>
          {Object.values(estimatorWorkload).map((row, i) => (
            <tr key={row.name} style={{
              backgroundColor: i % 2 === 0 ? C.white : C.gray50,
              borderBottom: `1px solid ${C.gray200}`,
            }}>
              <td style={{ padding: '10px 12px', fontSize: 12, color: C.gray700, fontWeight: 600 }}>
                {row.name}
              </td>
              <td style={{ padding: '10px 12px', fontSize: 12, color: C.gray700, textAlign: 'center' }}>
                {row.active}
              </td>
              <td style={{ padding: '10px 12px', fontSize: 12, color: C.gray700, textAlign: 'center' }}>
                {row.completed}
              </td>
              <td style={{ padding: '10px 12px', fontSize: 12, color: C.gray700, textAlign: 'center' }}>
                {row.avgRevisions}
              </td>
              <td style={{ padding: '10px 12px', fontSize: 12, color: C.gray700, textAlign: 'center' }}>
                {row.avgTurnaround}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      {Object.keys(estimatorWorkload).length === 0 && (
        <div style={{ textAlign: 'center', padding: 20, color: C.gray400, fontSize: 12 }}>
          No estimators found for selected filters
        </div>
      )}
    </div>
  );

  // ==================== RENDER WIN/LOSS BREAKDOWN ====================
  const renderWinLoss = () => (
    <div style={{
      backgroundColor: C.white,
      border: `1px solid ${C.gray200}`,
      borderRadius: 8,
      padding: 20,
      margin: '0 20px 20px 20px',
    }}>
      <h3 style={{ fontSize: 14, fontWeight: 600, color: C.navy, margin: '0 0 16px 0' }}>
        Win/Loss Breakdown
      </h3>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: 16 }}>
        <div style={{
          backgroundColor: C.gray50,
          borderRadius: 8,
          padding: 14,
          textAlign: 'center',
          border: `1px solid ${C.gray200}`,
        }}>
          <div style={{ fontSize: 11, fontWeight: 600, color: C.gray600, textTransform: 'uppercase', marginBottom: 6 }}>
            Proposals Sent
          </div>
          <div style={{ fontSize: 28, fontWeight: 700, color: C.navy }}>
            {winLossData.sent}
          </div>
        </div>

        <div style={{
          backgroundColor: C.gray50,
          borderRadius: 8,
          padding: 14,
          textAlign: 'center',
          border: `1px solid ${C.gray200}`,
        }}>
          <div style={{ fontSize: 11, fontWeight: 600, color: C.green, textTransform: 'uppercase', marginBottom: 6 }}>
            Won
          </div>
          <div style={{ fontSize: 28, fontWeight: 700, color: C.green }}>
            {winLossData.won}
          </div>
          <div style={{ fontSize: 11, color: C.gray600, marginTop: 4 }}>
            {winLossData.wonPct}%
          </div>
        </div>

        <div style={{
          backgroundColor: C.gray50,
          borderRadius: 8,
          padding: 14,
          textAlign: 'center',
          border: `1px solid ${C.gray200}`,
        }}>
          <div style={{ fontSize: 11, fontWeight: 600, color: C.red, textTransform: 'uppercase', marginBottom: 6 }}>
            Lost
          </div>
          <div style={{ fontSize: 28, fontWeight: 700, color: C.red }}>
            {winLossData.lost}
          </div>
          <div style={{ fontSize: 11, color: C.gray600, marginTop: 4 }}>
            {winLossData.lostPct}%
          </div>
        </div>

        <div style={{
          backgroundColor: C.gray50,
          borderRadius: 8,
          padding: 14,
          textAlign: 'center',
          border: `1px solid ${C.gray200}`,
        }}>
          <div style={{ fontSize: 11, fontWeight: 600, color: C.gray600, textTransform: 'uppercase', marginBottom: 6 }}>
            No Response
          </div>
          <div style={{ fontSize: 28, fontWeight: 700, color: C.gray500 }}>
            {winLossData.noResponse}
          </div>
          <div style={{ fontSize: 11, color: C.gray600, marginTop: 4 }}>
            {winLossData.noResponsePct}%
          </div>
        </div>
      </div>

      {canViewMargin && (
        <div style={{
          marginTop: 16,
          paddingTop: 16,
          borderTop: `1px solid ${C.gray200}`,
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))',
          gap: 16,
        }}>
          <div style={{
            backgroundColor: C.greenBg,
            borderRadius: 8,
            padding: 14,
            textAlign: 'center',
            border: `1px solid ${C.green}`,
          }}>
            <div style={{ fontSize: 11, fontWeight: 600, color: C.green, textTransform: 'uppercase', marginBottom: 6 }}>
              Avg Margin (Won)
            </div>
            <div style={{ fontSize: 24, fontWeight: 700, color: C.green }}>
              {winLossData.avgMarginWon}%
            </div>
          </div>

          <div style={{
            backgroundColor: C.redBg,
            borderRadius: 8,
            padding: 14,
            textAlign: 'center',
            border: `1px solid ${C.red}`,
          }}>
            <div style={{ fontSize: 11, fontWeight: 600, color: C.red, textTransform: 'uppercase', marginBottom: 6 }}>
              Avg Margin (Lost)
            </div>
            <div style={{ fontSize: 24, fontWeight: 700, color: C.red }}>
              {winLossData.avgMarginLost}%
            </div>
          </div>
        </div>
      )}
    </div>
  );

  // ==================== RENDER REVISION RATES ====================
  const renderRevisionRates = () => (
    <div style={{
      backgroundColor: C.white,
      border: `1px solid ${C.gray200}`,
      borderRadius: 8,
      padding: 20,
      margin: '0 20px 20px 20px',
      overflow: 'auto',
    }}>
      <h3 style={{ fontSize: 14, fontWeight: 600, color: C.navy, margin: '0 0 16px 0' }}>
        Revision Rates
      </h3>
      <table style={{ width: '100%', borderCollapse: 'collapse' }}>
        <thead>
          <tr style={{ backgroundColor: C.gray50, borderBottom: `2px solid ${C.gray200}` }}>
            <th style={{ padding: '10px 12px', textAlign: 'left', fontSize: 12, fontWeight: 600, color: C.gray600 }}>
              Estimator
            </th>
            <th style={{ padding: '10px 12px', textAlign: 'center', fontSize: 12, fontWeight: 600, color: C.gray600 }}>
              Total Estimates
            </th>
            <th style={{ padding: '10px 12px', textAlign: 'center', fontSize: 12, fontWeight: 600, color: C.gray600 }}>
              Avg Revisions per Estimate
            </th>
          </tr>
        </thead>
        <tbody>
          {revisionRates.map((row, i) => {
            const isHighRevision = row.avgRevisions > 2;
            return (
              <tr key={row.name} style={{
                backgroundColor: isHighRevision ? '#FEF3C7' : (i % 2 === 0 ? C.white : C.gray50),
                borderBottom: `1px solid ${C.gray200}`,
              }}>
                <td style={{ padding: '10px 12px', fontSize: 12, color: C.gray700, fontWeight: 600 }}>
                  {row.name}
                </td>
                <td style={{ padding: '10px 12px', fontSize: 12, color: C.gray700, textAlign: 'center' }}>
                  {row.total}
                </td>
                <td style={{
                  padding: '10px 12px',
                  fontSize: 12,
                  color: isHighRevision ? '#D97706' : C.gray700,
                  fontWeight: isHighRevision ? 600 : 'normal',
                  textAlign: 'center',
                }}>
                  {row.avgRevisions}
                  {isHighRevision && <span style={{ marginLeft: 4 }}>⚠️</span>}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
      {revisionRates.length === 0 && (
        <div style={{ textAlign: 'center', padding: 20, color: C.gray400, fontSize: 12 }}>
          No data available for selected filters
        </div>
      )}
    </div>
  );

  // ==================== RENDER BID DEADLINE COMPLIANCE ====================
  const renderBidCompliance = () => {
    const percentage = bidComplianceData.percentage;
    const radius = 35;
    const circumference = 2 * Math.PI * radius;
    const offset = circumference - (percentage / 100) * circumference;

    return (
      <div style={{
        backgroundColor: C.white,
        border: `1px solid ${C.gray200}`,
        borderRadius: 8,
        padding: 20,
        margin: '0 20px 20px 20px',
        textAlign: 'center',
      }}>
        <h3 style={{ fontSize: 14, fontWeight: 600, color: C.navy, marginBottom: 16 }}>
          Bid Deadline Compliance
        </h3>
        {bidComplianceData.total === 0 ? (
          <div style={{ color: C.gray400, fontSize: 12, padding: 20 }}>
            No hard deadline estimates in this period
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 16 }}>
            <svg width="120" height="120" style={{ display: 'inline-block' }}>
              <circle
                cx="60"
                cy="60"
                r={radius}
                fill="none"
                stroke={C.gray200}
                strokeWidth="6"
              />
              <circle
                cx="60"
                cy="60"
                r={radius}
                fill="none"
                stroke={percentage >= 75 ? C.green : percentage >= 50 ? '#F59E0B' : C.red}
                strokeWidth="6"
                strokeDasharray={circumference}
                strokeDashoffset={offset}
                strokeLinecap="round"
                style={{
                  transform: 'rotate(-90deg)',
                  transformOrigin: '60px 60px',
                  transition: 'stroke-dashoffset 0.3s',
                }}
              />
              <text
                x="60"
                y="60"
                textAnchor="middle"
                dominantBaseline="middle"
                style={{
                  fontSize: 28,
                  fontWeight: 700,
                  fill: percentage >= 75 ? C.green : percentage >= 50 ? '#F59E0B' : C.red,
                }}
              >
                {percentage}%
              </text>
            </svg>
            <div style={{
              fontSize: 12,
              color: C.gray600,
            }}>
              {bidComplianceData.onTime} of {bidComplianceData.total} completed on time
            </div>
          </div>
        )}
      </div>
    );
  };

  // ==================== RENDER REVENUE PIPELINE BY STATUS ====================
  const renderRevenuePipeline = () => {
    const activeStatuses = ESTIMATE_STATUSES.filter(s => !TERMINAL_STATUSES.includes(s));
    const totalRevenue = Object.values(revenuePipelineByStatus).reduce((a, b) => a + b, 0);

    return (
      <div style={{
        backgroundColor: C.white,
        border: `1px solid ${C.gray200}`,
        borderRadius: 8,
        padding: 20,
        margin: '0 20px 20px 20px',
      }}>
        <h3 style={{ fontSize: 14, fontWeight: 600, color: C.navy, margin: '0 0 16px 0' }}>
          Revenue Pipeline by Status
        </h3>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {activeStatuses.map(status => {
            const revenue = revenuePipelineByStatus[status] || 0;
            const config = STATUS_CONFIG[status];
            const percentage = totalRevenue > 0 ? (revenue / totalRevenue) * 100 : 0;
            return (
              <div key={status} style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                <div style={{ width: 140, fontSize: 12, fontWeight: 600, color: C.gray700 }}>
                  {config.label}
                </div>
                <div style={{
                  flex: 1,
                  height: 20,
                  backgroundColor: C.gray100,
                  borderRadius: 4,
                  overflow: 'hidden',
                }}>
                  {percentage > 0 && (
                    <div style={{
                      height: '100%',
                      width: `${percentage}%`,
                      backgroundColor: config.color,
                      transition: 'width 0.2s',
                    }} />
                  )}
                </div>
                <div style={{ width: 100, fontSize: 11, fontWeight: 600, color: config.color, textAlign: 'right' }}>
                  {fmt(revenue)}
                </div>
              </div>
            );
          })}
          <div style={{
            marginTop: 12,
            paddingTop: 12,
            borderTop: `1px solid ${C.gray200}`,
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
          }}>
            <div style={{ fontSize: 12, fontWeight: 600, color: C.navy }}>
              Total Pipeline
            </div>
            <div style={{ fontSize: 16, fontWeight: 700, color: C.red }}>
              {fmt(totalRevenue)}
            </div>
          </div>
        </div>
      </div>
    );
  };

  // ==================== MAIN RENDER ====================
  return (
    <div style={{ width: '100%', height: '100%', display: 'flex', flexDirection: 'column', maxWidth: 1280, margin: '0 auto' }}>
      <div style={{
        padding: '16px 24px',
        borderBottom: `1px solid ${C.gray200}`,
        backgroundColor: C.white,
      }}>
        <h2 style={{ fontSize: 18, fontWeight: 600, color: C.navy, margin: 0 }}>
          Analytics Dashboard
        </h2>
      </div>

      {renderFilterBar()}

      {!estimates || estimates.length === 0 ? (
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', backgroundColor: C.gray50 }}>
          <div style={{ width: 64, height: 64, borderRadius: '50%', background: '#F5F5F7', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 16 }}>
            <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#9CA3AF" strokeWidth="2">
              <path d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              <path d="M9 12l2 2 4-4" />
            </svg>
          </div>
          <p style={{ fontSize: 16, fontWeight: 600, color: '#252842', marginBottom: 4 }}>No analytics data yet</p>
          <p style={{ fontSize: 14, color: '#9CA3AF' }}>Analytics will appear here once estimates are created.</p>
        </div>
      ) : (
      <div style={{ flex: 1, overflow: 'auto', backgroundColor: C.gray50 }}>
        {renderKpiCards()}
        {renderEstimateVolume()}
        {renderEstimatorWorkload()}
        {renderWinLoss()}
        {renderRevisionRates()}
        {renderBidCompliance()}
        {canViewMargin && renderRevenuePipeline()}

        {filteredEstimates.length === 0 && (
          <div style={{
            textAlign: 'center',
            padding: 40,
            color: C.gray400,
            fontSize: 14,
          }}>
            No data for selected filters
          </div>
        )}

        <div style={{ height: 20 }} />
      </div>
      )}
    </div>
  );
}
