import { useEffect, useState } from 'react';
import { AnimatePresence } from 'framer-motion';
import { Toaster } from 'react-hot-toast';
import Sidebar from './components/layout/Sidebar';
import Topbar from './components/layout/Topbar';
import AiPanel from './components/layout/AiPanel';
import { setCurrentUserId, usersAPI } from './services/api';
import Dashboard from './pages/Dashboard';
import ContactsPage from './pages/ContactsPage';
import ProductsPage from './pages/ProductsPage';
import AccountsPage from './pages/AccountsPage';
import JournalsPage from './pages/JournalsPage';
import PurchaseOrdersPage from './pages/PurchaseOrdersPage';
import VendorBillsPage from './pages/VendorBillsPage';
import SalesOrdersPage from './pages/SalesOrdersPage';
import CustomerInvoicesPage from './pages/CustomerInvoicesPage';
import PaymentsPage from './pages/PaymentsPage';
import JournalEntriesPage from './pages/JournalEntriesPage';
import ReportsPage from './pages/ReportsPage';
import AiInvoiceScannerPage from './pages/AiInvoiceScannerPage';
<<<<<<< Updated upstream
import UsersPage from './pages/UsersPage';
=======
>>>>>>> Stashed changes
import LoginPage from './pages/LoginPage';
import { authUtils } from './utils/auth';
import dayBg from './assets/backgrounds/finedge-day.webp';
import nightBg from './assets/backgrounds/finedge-night.webp';

// ── Page IDs ─────────────────────────────────────────────────────────────────
const PAGES = {
  LOGIN:              'login',
  DASHBOARD:          'dashboard',
  CONTACTS:           'contacts',
  PRODUCTS:           'products',
  ACCOUNTS:           'accounts',
  JOURNALS:           'journals',
  PURCHASE_ORDERS:    'purchase-orders',
  VENDOR_BILLS:       'vendor-bills',
  SALES_ORDERS:       'sales-orders',
  CUSTOMER_INVOICES:  'customer-invoices',
  OCR_SCANNER:        'ocr-scanner',
  PAYMENTS:           'payments',
  JOURNAL_ENTRIES:    'journal-entries',
  REPORTS:            'reports',
  USERS:              'users',
};

function App() {
  // Initialize state from localStorage safely
  const [sessionUser, setSessionUser] = useState(() => {
    try {
      return authUtils.getUser();
    } catch (_) {
      return null;
    }
  });
  const [isAuthenticated, setIsAuthenticated] = useState(() => {
    try {
      return authUtils.isAuthenticated();
    } catch (_) {
      return false;
    }
  });
  const [currentPage, setCurrentPage] = useState(() => {
    try {
      return authUtils.isAuthenticated() ? PAGES.DASHBOARD : PAGES.LOGIN;
    } catch (_) {
      return PAGES.LOGIN;
    }
  });
  const [currentUser, setCurrentUser] = useState(() => {
    try {
      const saved = authUtils.getUser();
      return saved?.role ? String(saved.role).toLowerCase() : 'admin';
    } catch (_) {
      return 'admin';
    }
  });
  const [aiOpen, setAiOpen] = useState(false);
  const [isNight, setIsNight] = useState(() => {
    try {
      return localStorage.getItem('finedge-bg') === 'night';
    } catch (_) {
      return false;
    }
  });

  const toggleBg = () => {
    setIsNight(prev => {
      const next = !prev;
      localStorage.setItem('finedge-bg', next ? 'night' : 'day');
      return next;
    });
  };

  const handleAuthSuccess = (user) => {
    const role = String(user?.role || 'admin').toLowerCase();
<<<<<<< Updated upstream
    
    // Update all state synchronously
=======
>>>>>>> Stashed changes
    setIsAuthenticated(true);
    setSessionUser(user);
    setCurrentUser(role);
    setCurrentUserId(user?.id ?? null);
<<<<<<< Updated upstream
    
    // Navigate to dashboard
=======
>>>>>>> Stashed changes
    setCurrentPage(PAGES.DASHBOARD);
  };

  const handleLogout = () => {
    authUtils.clearAuth();
    setIsAuthenticated(false);
    setSessionUser(null);
    setCurrentUserId(null);
    setCurrentPage(PAGES.LOGIN);
  };

  useEffect(() => {
    let cancelled = false;

<<<<<<< Updated upstream
    // If sessionUser is already stored, ensure currentUserId is in sync
    if (sessionUser?.id) {
      setCurrentUserId(sessionUser.id);
=======
    if (sessionUser?.id) {
      setCurrentUserId(sessionUser.id);
      return () => {
        cancelled = true;
      };
>>>>>>> Stashed changes
    }

    usersAPI
      .getAll()
      .then((response) => {
        if (cancelled) return;
        const users = Array.isArray(response.data) ? response.data : [];
        const match = users.find((user) => {
          const role = String(user.role || '').toLowerCase();
          if (currentUser === 'contact') {
            return role === 'contact' || role === 'user';
          }
          return role === currentUser;
        });
        if (match) {
          setSessionUser(prev => prev || match);
          setCurrentUserId(match.id);
        }
      })
      .catch(() => {
        // Fallback gracefully
      });

    return () => {
      cancelled = true;
    };
  }, [currentUser, sessionUser?.id]);

  // ── Page renderer ─────────────────────────────────────────────────────────
  const renderPage = () => {
    switch (currentPage) {
      case PAGES.DASHBOARD:          return <Dashboard onNavigate={setCurrentPage} currentUser={currentUser} />;
      case PAGES.CONTACTS:           return <ContactsPage />;
      case PAGES.PRODUCTS:           return <ProductsPage />;
      case PAGES.ACCOUNTS:           return <AccountsPage />;
      case PAGES.JOURNALS:           return <JournalsPage />;
      case PAGES.PURCHASE_ORDERS:    return <PurchaseOrdersPage />;
      case PAGES.VENDOR_BILLS:       return <VendorBillsPage onNavigate={setCurrentPage} currentUser={currentUser} />;
      case PAGES.SALES_ORDERS:       return <SalesOrdersPage />;
      case PAGES.CUSTOMER_INVOICES:  return <CustomerInvoicesPage onNavigate={setCurrentPage} currentUser={currentUser} />;
      case PAGES.OCR_SCANNER:        return <AiInvoiceScannerPage currentUser={currentUser} onNavigate={setCurrentPage} />;
      case PAGES.PAYMENTS:           return <PaymentsPage />;
      case PAGES.JOURNAL_ENTRIES:    return <JournalEntriesPage />;
      case PAGES.REPORTS:            return <ReportsPage />;
      case PAGES.USERS:              return <UsersPage />;
      default:                       return <Dashboard onNavigate={setCurrentPage} currentUser={currentUser} />;
    }
  };

  // Background image is global — applies on every page.
  // isNight toggles between day and night environment.
  const activeBg = isNight ? nightBg : dayBg;

  // If not logged in or explicitly on login page, show LoginPage
  if (!isAuthenticated || currentPage === PAGES.LOGIN) {
    return (
      <div className="relative min-h-screen">
        <Toaster position="top-center" />
        <LoginPage
          onAuthSuccess={handleAuthSuccess}
          isNight={isNight}
          onBgToggle={toggleBg}
        />
      </div>
    );
  }

  return (
    <div
      className="flex min-h-screen"
      style={{
        backgroundImage:      `url(${activeBg})`,
        backgroundColor:      '#F6F3EC',
        backgroundSize:       'cover',
        backgroundPosition:   'center',
        backgroundRepeat:     'no-repeat',
        backgroundAttachment: 'fixed',
        transition:           'background-image 0.3s ease',
      }}
    >
      {/* Fixed left sidebar — floats above the background */}
      <Sidebar
        currentPage={currentPage}
        onNavigate={setCurrentPage}
        aiOpen={aiOpen}
        onAiToggle={() => setAiOpen(v => !v)}
        currentUser={currentUser}
        onLogout={handleLogout}
      />

      {/* Right column: topbar + scrollable content */}
      <div
        className="flex flex-col flex-1 md:ml-[252px]"
        style={{
          marginRight: aiOpen ? 420 : 0,
          transition: 'margin-right 0.3s ease',
        }}
      >
        {/* Fixed topbar — floats above the background */}
        <Topbar
          currentPage={currentPage}
          currentUser={currentUser}
          onUserChange={setCurrentUser}
          onNavigate={setCurrentPage}
          isNight={isNight}
          onBgToggle={toggleBg}
          sessionUser={sessionUser}
          onLogout={handleLogout}
        />

        {/* Scrollable page area — offset for topbar height */}
        <main className="flex-1 overflow-y-auto pt-14">
          <div className="container" style={{ padding: '20px' }}>
            {renderPage()}
          </div>
        </main>
      </div>

      {/* AI Copilot panel — slides in from the right */}
      <AnimatePresence>
        {aiOpen && (
          <AiPanel
            onClose={() => setAiOpen(false)}
            userName={sessionUser?.name || (currentUser === 'admin' ? 'Arjun' : currentUser)}
            role={currentUser}
          />
        )}
      </AnimatePresence>

      {/* Global Toast Notifications positioned at top-center */}
      <Toaster
        position="top-center"
        containerStyle={{
          top: 24,
          zIndex: 99999,
        }}
        toastOptions={{
          duration: 3500,
          style: {
            background: '#ffffff',
            color: '#1c1c1e',
            border: '1px solid #e8e3d8',
            boxShadow: '0 4px 16px rgba(0,0,0,0.08), 0 1px 4px rgba(0,0,0,0.04)',
            borderRadius: '12px',
            fontSize: '13.5px',
            fontWeight: '500',
            fontFamily: 'inherit',
            padding: '10px 14px',
          },
          success: {
            iconTheme: {
              primary: '#0F6A4B',
              secondary: '#ffffff',
            },
            style: {
              borderLeft: '4px solid #0F6A4B',
            },
          },
          error: {
            iconTheme: {
              primary: '#c0392b',
              secondary: '#ffffff',
            },
            style: {
              borderLeft: '4px solid #c0392b',
            },
          },
        }}
      />
    </div>
  );
}

export default App;
