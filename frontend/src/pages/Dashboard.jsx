import { useState, useEffect } from 'react';
import { reportsAPI } from '../services/api';
import {
  TrendingUp, TrendingDown, DollarSign,
  Landmark, Wallet, Users, ArrowDownCircle,
  RefreshCw, Calendar, ScanLine,
} from 'lucide-react';

/* ── KPI meta — pairs each field with an icon and colour ─────────── */
const KPI_META = [
  { key: 'revenue',     label: 'Total Revenue',   icon: TrendingUp,      color: '#0F6A4B', bg: '#e6f5ef' },
  { key: 'expenses',    label: 'Total Expenses',   icon: TrendingDown,    color: '#c0392b', bg: '#fef0ee' },
  { key: 'netProfit',   label: 'Net Profit',       icon: DollarSign,      color: '#1a56db', bg: '#e8f0fe' },
  { key: 'cashBalance', label: 'Cash Balance',     icon: Wallet,          color: '#0F6A4B', bg: '#e6f5ef' },
  { key: 'bankBalance', label: 'Bank Balance',     icon: Landmark,        color: '#7c3aed', bg: '#f3e8ff' },
  { key: 'receivables', label: 'Receivables',      icon: Users,           color: '#c47a1a', bg: '#fef3e2' },
  { key: 'payables',    label: 'Payables',         icon: ArrowDownCircle, color: '#c0392b', bg: '#fef0ee' },
];

/* ── All logic preserved exactly ────────────────────────────────── */
export default function Dashboard({ onNavigate, currentUser }) {
  const [summary, setSummary] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const rawRole = typeof currentUser === 'object' ? currentUser?.role : currentUser;
  const role = String(rawRole || '').toLowerCase().trim();
  const isAuthorizedRole = role === 'admin' || role === 'accountant';

  useEffect(() => { 
    fetchDashboard(); 
  }, []);

  const fetchDashboard = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await reportsAPI.getDashboardSummary();
      setSummary(response.data);
    } catch (err) {
      console.error('Dashboard fetch error:', err);
      const errorMessage = err.response?.data?.error || err.message || 'Failed to load dashboard';
      setError(errorMessage);
      // Set default empty summary to prevent crashes
      setSummary({
        revenue: '0.00',
        expenses: '0.00',
        netProfit: '0.00',
        cashBalance: '0.00',
        bankBalance: '0.00',
        receivables: '0.00',
        payables: '0.00',
        recentTransactions: []
      });
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <div className="loading">Loading dashboard…</div>;
  if (!summary) return <div className="error">Failed to load dashboard</div>;

  return (
    <div className="page-root">

      {/* ── Page header ─────────────────────────────────────────── */}
      <div className="page-header">
        <div>
          <h1 className="page-title">Dashboard</h1>
          <p className="page-subtitle">Financial overview · live data</p>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          {isAuthorizedRole && (
            <button
              className="action-btn"
              onClick={() => onNavigate?.('ocr-scanner')}
              style={{
                background: 'linear-gradient(135deg, #0F6A4B, #168a62)',
                color: '#fff',
                border: 'none',
                boxShadow: '0 2px 8px rgba(15,106,75,0.25)',
              }}
            >
              <ScanLine size={14} />
              AI Invoice Scanner
            </button>
          )}
          <button className="action-btn" onClick={fetchDashboard}>
            <RefreshCw size={14} />
            Refresh
          </button>
        </div>
      </div>

<<<<<<< Updated upstream
      {/* ── Quick Action for Accountant/Admin ───────────────────── */}
      {isAuthorizedRole && (
        <div
          className="page-card"
          style={{
            marginBottom: 20,
            background: 'linear-gradient(135deg, #f0faf5, #e6f5ef)',
            border: '1px solid #bbf0d8',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            flexWrap: 'wrap',
            gap: 16,
            padding: '16px 20px',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
            <div
              style={{
                width: 40,
                height: 40,
                borderRadius: 12,
                background: '#0F6A4B',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#fff',
                flexShrink: 0,
              }}
            >
              <ScanLine size={20} />
            </div>
=======
      {/* ── Hero spacer — showroom is the landing visual ─────── */}
      {/* The spacer pushes KPI cards to ~40vh from the top of the viewport.
          The topbar is fixed at 56px (pt-14) and the container padding is 20px,
          so 40vh minus those offsets gives the right visual landing position.   */}
      <div style={{ paddingTop: 'calc(40vh - 76px)' }}>

        {error && (
          <div
            className="error"
            style={{
              borderRadius: 16,
              backdropFilter: 'blur(22px)',
              background: isNight ? 'rgba(239, 68, 68, 0.15)' : 'rgba(192, 57, 43, 0.12)',
              border: `1px solid ${isNight ? 'rgba(239, 68, 68, 0.30)' : 'rgba(192, 57, 43, 0.25)'}`,
              color: isNight ? '#f87171' : '#c0392b',
              marginBottom: 20,
            }}
          >
            {error}
          </div>
        )}

        {/* ── KPI cards (Matte Frosted with Hover Lift) ──────── */}
        <div className="dashboard-grid">
          {KPI_META.map(({ key, label, icon: Icon, color, bg }) => {
            const activeColor = isNight && (key === 'revenue' || key === 'cashBalance') ? '#34d399' :
                                isNight && (key === 'bankBalance' || key === 'receivables') ? '#fbbf24' :
                                isNight && (key === 'expenses' || key === 'payables') ? '#f87171' :
                                isNight && key === 'netProfit' ? '#60a5fa' : color;

            const activeBg = isNight ? 'rgba(255, 255, 255, 0.08)' : bg;

            return (
              <div className="card matte-kpi-card" key={key} style={{ ...matteCard, padding: '22px 24px', cursor: 'default' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 9, marginBottom: 14 }}>
                  <div style={{
                    width: 28, height: 28, borderRadius: 8,
                    background: activeBg, display: 'flex', alignItems: 'center', justifyContent: 'center',
                    flexShrink: 0,
                    border: `1px solid ${isNight ? 'rgba(255, 255, 255, 0.07)' : 'rgba(0, 0, 0, 0.04)'}`,
                  }}>
                    <Icon size={14} style={{ color: activeColor }} />
                  </div>
                  <span className="card-title" style={{
                    margin: 0,
                    fontSize: '11px',
                    fontWeight: 700,
                    letterSpacing: '0.65px',
                    color: isNight ? '#F5F2EC' : '#111827',
                    textTransform: 'uppercase',
                  }}>
                    {label}
                  </span>
                </div>
                <div className="card-value dashboard-kpi-value" style={{
                  fontWeight: 800,
                  color: activeColor,
                  lineHeight: 1.15,
                }}>
                  ₹{parseFloat(summary[key] ?? 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                </div>
              </div>
            );
          })}
        </div>

        {/* ── Recent Transactions ────────────────────────────── */}
        <div className="page-card" style={{ ...matteCard, padding: '26px 28px', marginTop: 20 }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 18, flexWrap: 'wrap', gap: 8 }}>
>>>>>>> Stashed changes
            <div>
              <h3 style={{ margin: 0, fontSize: 14.5, fontWeight: 700, color: '#0F6A4B' }}>
                AI Invoice Scanner
              </h3>
              <p style={{ margin: 0, fontSize: 12, color: '#4a5568', marginTop: 2 }}>
                Scan PDF or image invoices to extract items, match vendors/products, and record ERP transactions.
              </p>
            </div>
          </div>
          <button
            className="action-btn"
            onClick={() => onNavigate?.('ocr-scanner')}
            style={{
              background: '#0F6A4B',
              color: '#fff',
              border: 'none',
              padding: '8px 16px',
              fontSize: 12.5,
              fontWeight: 600,
            }}
          >
            Open Scanner
          </button>
        </div>
      )}

      {error && <div className="error">{error}</div>}

      {/* ── KPI cards ───────────────────────────────────────────── */}
      <div className="dashboard-grid">
        {KPI_META.map(({ key, label, icon: Icon, color, bg }) => (
          <div className="card" key={key}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 10 }}>
              <div style={{
                width: 32, height: 32, borderRadius: 10,
                background: bg, display: 'flex', alignItems: 'center', justifyContent: 'center',
                flexShrink: 0,
              }}>
                <Icon size={15} style={{ color }} />
              </div>
              <span className="card-title" style={{ margin: 0 }}>{label}</span>
            </div>
            <div className="card-value" style={{ color }}>
              ₹{parseFloat(summary[key] ?? 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
            </div>
          </div>
        ))}
      </div>

      {/* ── Recent Transactions ─────────────────────────────────── */}
      <div className="page-card">
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
          <h2 className="card-section-title" style={{ margin: 0, borderBottom: 'none', paddingBottom: 0 }}>
            Recent Transactions
          </h2>
          <span style={{
            display: 'inline-flex', alignItems: 'center', gap: 4,
            background: '#e6f5ef', color: '#0F6A4B',
            padding: '3px 10px', borderRadius: 20,
            fontSize: 11, fontWeight: 700,
          }}>
            <span style={{
              width: 6, height: 6, borderRadius: '50%',
              background: '#0F6A4B', animation: 'pulse 1.5s infinite',
            }} />
            Live
          </span>
        </div>

        {summary.recentTransactions && summary.recentTransactions.length > 0 ? (
          <table>
            <thead>
              <tr>
                <th>Date</th>
                <th>Journal</th>
                <th>Reference</th>
                <th>Items</th>
              </tr>
            </thead>
            <tbody>
              {summary.recentTransactions.map((txn) => (
                <tr key={txn.id}>
                  <td>
                    <span style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                      <Calendar size={12} style={{ color: '#aaa', flexShrink: 0 }} />
                      {new Date(txn.date).toLocaleDateString('en-IN')}
                    </span>
                  </td>
                  <td>{txn.journal}</td>
                  <td>{txn.reference || <span style={{ color: '#bbb' }}>—</span>}</td>
                  <td>
                    <span className="status-badge confirmed">
                      {txn.items.length} {txn.items.length === 1 ? 'item' : 'items'}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        ) : (
          <div style={{ textAlign: 'center', padding: '40px 0', color: '#bbb' }}>
            <p style={{ marginTop: 8 }}>No transactions yet</p>
          </div>
        )}
      </div>
    </div>
  );
}
