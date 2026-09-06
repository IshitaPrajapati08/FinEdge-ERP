import { useState } from 'react';
import {
  LayoutDashboard,
  Users,
  Package,
  BookText,
  BookOpen,
  ShoppingBag,
  FileText,
  ShoppingCart,
  Receipt,
  CreditCard,
  Pencil,
  BarChart2,
  Menu,
  X,
  TrendingUp,
  Sparkles,
  ScanLine,
  LogOut,
} from 'lucide-react';

/* ── Navigation definition ─────────────────────────────────────────
   Grouped so the sidebar can render section separators naturally.
─────────────────────────────────────────────────────────────────── */
const NAV_GROUPS = [
  {
    label: null, // top-level immediate visibility
    items: [
      { id: 'dashboard',   label: 'Dashboard',          icon: LayoutDashboard },
      { id: 'ocr-scanner', label: 'AI Invoice Scanner', icon: ScanLine, minRole: 'accountant' },
    ],
  },
  {
    label: 'Master Data',
    items: [
      { id: 'contacts',  label: 'Contacts',  icon: Users    },
      { id: 'products',  label: 'Products',  icon: Package  },
      { id: 'accounts',  label: 'Accounts',  icon: BookText },
      { id: 'journals',  label: 'Journals',  icon: BookOpen },
    ],
  },
  {
    label: 'Purchasing',
    items: [
      { id: 'purchase-orders', label: 'Purchase Orders', icon: ShoppingBag },
      { id: 'vendor-bills',    label: 'Vendor Bills',    icon: FileText   },
    ],
  },
  {
    label: 'Sales',
    items: [
      { id: 'sales-orders',       label: 'Sales Orders',       icon: ShoppingCart },
      { id: 'customer-invoices',  label: 'Customer Invoices',  icon: Receipt      },
    ],
  },
  {
    label: 'Finance & Reports',
    items: [
      { id: 'payments',        label: 'Payments',           icon: CreditCard },
      { id: 'journal-entries', label: 'Journal Entries',    icon: Pencil     },
      { id: 'reports',         label: 'Reports',            icon: BarChart2  },
    ],
  },
  {
    label: 'System',
    items: [
      { id: 'users', label: 'User Management', icon: Users, minRole: 'admin' },
    ],
  },
];

<<<<<<< Updated upstream
/* ── Inner content — shared between desktop aside & mobile drawer ── */
function SidebarContent({ currentPage, onNavigate, onClose, aiOpen, onAiToggle, currentUser, onLogout }) {
=======
/* ── Theme hook — syncs with the existing localStorage toggle ──── */
function useIsNight() {
  const [isNight, setIsNight] = useState(
    () => typeof window !== 'undefined' && localStorage.getItem('finedge-bg') === 'night'
  );

  useEffect(() => {
    const sync = () => {
      const night = localStorage.getItem('finedge-bg') === 'night';
      setIsNight(prev => prev !== night ? night : prev);
    };
    const interval = setInterval(sync, 250);
    window.addEventListener('storage', sync);
    return () => { clearInterval(interval); window.removeEventListener('storage', sync); };
  }, []);

  return isNight;
}

/* ── Design tokens derived from theme ─────────────────────────── */
function useTokens(isNight) {
  return {
    /* Floating panel surface */
    panelBg:        isNight ? 'rgba(18, 22, 26, 0.58)' : 'rgba(246, 241, 234, 0.58)',
    panelBorder:    isNight ? 'rgba(245, 242, 236, 0.10)' : 'rgba(220, 210, 195, 0.55)',
    panelShadow:    isNight
      ? '0 8px 40px rgba(0,0,0,0.55), 0 2px 8px rgba(0,0,0,0.30)'
      : '0 8px 40px rgba(40,30,20,0.12), 0 2px 8px rgba(40,30,20,0.06)',

    /* Dividers */
    divider:        isNight ? 'rgba(245,242,236,0.08)' : 'rgba(210,200,185,0.45)',

    /* Text */
    textBrand:      isNight ? '#E8E4DC' : '#1a1714',
    textSub:        isNight ? '#7A7570' : '#9a9080',
    textSection:    isNight ? '#5A5550' : '#b0a898',
    textNav:        isNight ? '#C8C4BC' : '#4a4540',
    textNavMuted:   isNight ? '#6A6560' : '#9a9080',
    textQuote:      isNight ? '#C8C4BC' : '#4a4540',

    /* Nav item states */
    navHoverBg:     isNight ? 'rgba(255,255,255,0.07)' : 'rgba(15,106,75,0.08)',
    navActiveBg:    '#0F6A4B',
    navActiveText:  '#fff',
    navActiveGlow:  '0 2px 10px rgba(15,106,75,0.38)',

    /* AI button */
    aiBtnBg:        isNight ? 'rgba(255,255,255,0.06)' : 'rgba(15,106,75,0.08)',
    aiBtnBorder:    isNight ? 'rgba(255,255,255,0.10)' : 'rgba(15,106,75,0.20)',
    aiBtnHoverBg:   isNight ? 'rgba(52,211,153,0.10)' : 'rgba(15,106,75,0.14)',
    aiBtnOpenBg:    'linear-gradient(135deg,#0F6A4B,#1a8a60)',

    /* Scrollbar */
    scrollThumb:    isNight ? 'rgba(255,255,255,0.12)' : 'rgba(15,106,75,0.18)',

    /* Mobile hamburger */
    hamburgerBg:    isNight ? 'rgba(18,22,26,0.72)' : 'rgba(246,241,234,0.80)',
  };
}

/* ═══════════════════════════════════════════════════════════════
   SidebarContent — inner layout, shared by desktop & mobile
═══════════════════════════════════════════════════════════════ */
function SidebarContent({ currentPage, onNavigate, onClose, aiOpen, onAiToggle, currentUser, isNight, t, onLogout }) {
>>>>>>> Stashed changes
  const rawRole = typeof currentUser === 'object' ? currentUser?.role : currentUser;
  const role = String(rawRole || '').toLowerCase().trim();
  const isAuthorizedRole = role === 'admin' || role === 'accountant';

  return (
    <div className="flex flex-col h-full overflow-hidden">

      {/* Brand -------------------------------------------------------- */}
      <div className="flex-shrink-0 px-5 pt-6 pb-5"
           style={{ borderBottom: '1px solid #e8e3d8' }}>
        <div className="flex items-center gap-3">
          {/* Logo mark */}
          <div className="w-9 h-9 rounded-2xl flex items-center justify-center flex-shrink-0"
               style={{ background: 'linear-gradient(135deg,#0F6A4B,#1a8a60)',
                        boxShadow: '0 3px 10px rgba(15,106,75,0.35)' }}>
            <TrendingUp size={17} color="white" strokeWidth={2.5} />
          </div>
          <div>
            <p className="text-[15px] font-bold text-stone-900 leading-tight tracking-tight">
              FinEdge ERP
            </p>
            <p className="text-[10.5px] text-stone-400 leading-tight mt-0.5 font-medium">
              AI-Powered Accounting
            </p>
          </div>
        </div>
      </div>

      {/* Nav ---------------------------------------------------------- */}
      <nav className="flex-1 overflow-y-auto py-4 px-3"
           style={{ scrollbarWidth: 'thin', scrollbarColor: '#d6d1c9 transparent' }}>
        {NAV_GROUPS.map((group, gi) => {
          const visibleItems = group.items.filter(item => {
            if (item.minRole === 'accountant') {
              return isAuthorizedRole;
            }
            return true;
          });

          if (visibleItems.length === 0) return null;

          return (
            <div key={gi} className={gi > 0 ? 'mt-4' : ''}>
              {/* Section label */}
              {group.label && (
                <p className="px-3 mb-1.5 text-[10px] font-bold text-stone-400 uppercase tracking-widest select-none">
                  {group.label}
                </p>
              )}

              <div className="space-y-0.5">
                {visibleItems.map(({ id, label, icon: Icon }) => {
                  const active = currentPage === id;
                  return (
                    <button
                      key={id}
                      onClick={() => { onNavigate(id); onClose?.(); }}
                      className="w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl
                                 text-left text-[13px] font-medium outline-none transition-all duration-150"
                      style={active ? {
                        background: '#0F6A4B',
                        color: '#fff',
                        boxShadow: '0 2px 8px rgba(15,106,75,0.30)',
                      } : {
                        color: '#555',
                        background: 'transparent',
                      }}
                      onMouseEnter={e => { if (!active) e.currentTarget.style.background = '#ede9e0'; }}
                      onMouseLeave={e => { if (!active) e.currentTarget.style.background = 'transparent'; }}
                    >
                      <Icon
                        size={15}
                        style={{ color: active ? '#fff' : '#999', flexShrink: 0 }}
                      />
                      <span style={{ color: active ? '#fff' : '#444' }}>{label}</span>

                      {/* Active indicator dot */}
                      {active && (
                        <span className="ml-auto w-1.5 h-1.5 rounded-full bg-emerald-300 flex-shrink-0" />
                      )}
                    </button>
                  );
                })}
              </div>
            </div>
          );
        })}
      </nav>

      {/* Bottom quote ------------------------------------------------- */}
      <div className="flex-shrink-0 px-5 py-5"
           style={{ borderTop: '1px solid #e8e3d8' }}>

        {/* AI Assistant toggle — pinned just above the quote */}
        <button
          onClick={() => { onAiToggle(); onClose?.(); }}
          className="w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl
                     text-left text-[13px] font-medium outline-none transition-all duration-150 mb-3"
          style={aiOpen ? {
            background: 'linear-gradient(135deg,#0F6A4B,#1a8a60)',
            color: '#fff',
            boxShadow: '0 2px 10px rgba(15,106,75,0.35)',
          } : {
            background: '#f0ede6',
            color: '#444',
            border: '1px solid #e5e0d6',
          }}
          onMouseEnter={e => {
            if (!aiOpen) e.currentTarget.style.background = '#e6f5ef';
          }}
          onMouseLeave={e => {
            if (!aiOpen) e.currentTarget.style.background = '#f0ede6';
          }}
        >
          <Sparkles
            size={15}
            style={{
              flexShrink: 0,
              color: aiOpen ? '#a8f0cc' : '#0F6A4B',
            }}
          />
          <span style={{ color: aiOpen ? '#fff' : '#333', flex: 1 }}>AI Assistant</span>
          {/* Pulsing dot when open */}
          {aiOpen && (
            <span
              style={{
                width: 7, height: 7, borderRadius: '50%',
                background: '#a8f0cc',
                animation: 'aiBounce 1.5s ease-in-out infinite',
                flexShrink: 0,
              }}
            />
          )}
        </button>

<<<<<<< Updated upstream
        {onLogout && (
          <button
            onClick={() => { onLogout(); onClose?.(); }}
            className="w-full flex items-center gap-2.5 px-3.5 py-2 rounded-xl text-left text-xs font-semibold outline-none transition-all duration-150 mb-3"
            style={{
              background: 'transparent',
              color: '#dc2626',
              border: '1px solid rgba(220, 38, 38, 0.25)',
              cursor: 'pointer',
            }}
            onMouseEnter={e => e.currentTarget.style.background = '#fef2f2'}
            onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
          >
            <LogOut size={13} />
=======
        {/* Sign Out button */}
        {onLogout && (
          <button
            type="button"
            onClick={() => { onLogout(); onClose?.(); }}
            style={{
              width: '100%',
              display: 'flex', alignItems: 'center', gap: 10,
              padding: '8px 12px',
              borderRadius: 12,
              border: isNight ? '1px solid rgba(220,38,38,0.30)' : '1px solid rgba(220,38,38,0.22)',
              cursor: 'pointer', textAlign: 'left', fontFamily: 'inherit',
              fontSize: 12.5, fontWeight: 600, outline: 'none',
              marginBottom: 12,
              background: 'transparent',
              color: '#dc2626',
              transition: 'background 0.15s ease',
            }}
            onMouseEnter={e => e.currentTarget.style.background = isNight ? 'rgba(220,38,38,0.12)' : '#fef2f2'}
            onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
          >
            <LogOut size={14} />
>>>>>>> Stashed changes
            <span>Sign Out</span>
          </button>
        )}

<<<<<<< Updated upstream
        <p className="text-[11px] italic leading-relaxed"
           style={{ color: '#b0a898' }}>
=======
        {/* Quote */}
        <p style={{
          margin: '0 0 8px',
          padding: '0 4px',
          fontSize: 10.5, fontStyle: 'italic',
          lineHeight: 1.6, color: t.textQuote,
        }}>
>>>>>>> Stashed changes
          "Numbers move futures.<br />Every entry counts."
        </p>
        <div className="mt-3 flex items-center gap-2">
          <div className="w-5 h-0.5 rounded-full" style={{ background: '#0F6A4B', opacity: 0.5 }} />
          <p className="text-[10px] font-semibold" style={{ color: '#0F6A4B', opacity: 0.7 }}>
            Phase 1
          </p>
        </div>
      </div>
    </div>
  );
}

<<<<<<< Updated upstream
/* ── Main export ───────────────────────────────────────────────── */
=======
/* ═══════════════════════════════════════════════════════════════
   Sidebar — floating matte glass panel, 16px margin from edges
═══════════════════════════════════════════════════════════════ */
>>>>>>> Stashed changes
export default function Sidebar({ currentPage, onNavigate, aiOpen, onAiToggle, currentUser, onLogout }) {
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <>
      {/* ── Desktop sidebar ──────────────────────────────────────── */}
      <aside
        className="hidden md:flex flex-col fixed top-0 left-0 h-screen w-[252px] z-40"
        style={{ background: '#F6F3EC', borderRight: '1px solid #e8e3d8' }}
      >
        <SidebarContent
          currentPage={currentPage}
          onNavigate={onNavigate}
          aiOpen={aiOpen}
          onAiToggle={onAiToggle}
          currentUser={currentUser}
<<<<<<< Updated upstream
=======
          isNight={isNight}
          t={t}
>>>>>>> Stashed changes
          onLogout={onLogout}
        />
      </aside>

      {/* ── Mobile: hamburger trigger ─────────────────────────────── */}
      <button
        onClick={() => setMobileOpen(true)}
        className="md:hidden fixed top-3.5 left-4 z-50 w-9 h-9 flex items-center
                   justify-center rounded-xl border border-stone-200 bg-white
                   text-stone-600 shadow-sm"
        aria-label="Open menu"
      >
        <Menu size={18} />
      </button>

      {/* ── Mobile: backdrop ─────────────────────────────────────── */}
      {mobileOpen && (
        <div
          className="md:hidden fixed inset-0 z-40 bg-black/25 backdrop-blur-sm"
          onClick={() => setMobileOpen(false)}
        />
      )}

      {/* ── Mobile: drawer ───────────────────────────────────────── */}
      {mobileOpen && (
        <aside
          className="md:hidden fixed top-0 left-0 h-screen w-[252px] z-50 flex flex-col"
          style={{ background: '#F6F3EC', borderRight: '1px solid #e8e3d8' }}
        >
          <button
            onClick={() => setMobileOpen(false)}
            className="absolute top-4 right-4 w-8 h-8 flex items-center justify-center
                       rounded-xl text-stone-500 hover:bg-stone-200 transition-colors"
            aria-label="Close menu"
          >
            <X size={16} />
          </button>
          <SidebarContent
            currentPage={currentPage}
            onNavigate={onNavigate}
            onClose={() => setMobileOpen(false)}
            aiOpen={aiOpen}
            onAiToggle={onAiToggle}
            currentUser={currentUser}
<<<<<<< Updated upstream
=======
            isNight={isNight}
            t={t}
>>>>>>> Stashed changes
            onLogout={onLogout}
          />
        </aside>
      )}
    </>
  );
}
