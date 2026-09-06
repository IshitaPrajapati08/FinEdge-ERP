import { useState } from 'react';
import toast from 'react-hot-toast';
import {
  Lock, Mail, Eye, EyeOff, User, ShieldCheck, Calculator,
  Sparkles, TrendingUp, Landmark, ArrowRight, Sun, Moon,
  CheckCircle2, Shield, UserCircle, Check
} from 'lucide-react';
import { authUtils } from '../utils/auth';
import axios from 'axios';
import dayBg from '../assets/backgrounds/finedge-day.webp';
import nightBg from '../assets/backgrounds/finedge-night.webp';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000/api';

const DEMO_ACCOUNTS = [
  { label: 'Admin', email: 'admin@finedge.com', role: 'admin', desc: 'Full System Control' },
  { label: 'Accountant', email: 'accountant@finedge.com', role: 'accountant', desc: 'Ledger & Invoices' },
  { label: 'Sales', email: 'sales@finedge.com', role: 'accountant', desc: 'Sales & Billing' },
  { label: 'Purchase', email: 'purchase@finedge.com', role: 'accountant', desc: 'Procurement & Bills' },
];

export default function LoginPage({ onAuthSuccess, isNight = false, onBgToggle }) {
  const [activeTab, setActiveTab] = useState('login'); // 'login' | 'signup'

  // Login form state
  const [loginEmail, setLoginEmail] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  const [showLoginPassword, setShowLoginPassword] = useState(false);

  // Sign up form state
  const [name, setName] = useState('');
  const [signupEmail, setSignupEmail] = useState('');
  const [signupPassword, setSignupPassword] = useState('');
  const [signupRole, setSignupRole] = useState('accountant'); // 'admin' | 'accountant' | 'contact'
  const [showSignupPassword, setShowSignupPassword] = useState(false);

  const [loading, setLoading] = useState(false);

  // Handle Login
  const handleLoginSubmit = async (e) => {
    e?.preventDefault();
    if (!loginEmail || !loginPassword) {
      toast.error('Please fill in both email and password');
      return;
    }

    setLoading(true);
    try {
      const response = await axios.post(`${API_URL}/auth/login`, {
        email: loginEmail.trim().toLowerCase(),
        password: loginPassword,
      });

      const { token, user } = response.data;
      
      // Save authentication data
      authUtils.saveAuth(token, user);
      
      // Show success message
      toast.success(`Welcome back, ${user.name}!`);
      
      // Small delay to ensure localStorage is written
      await new Promise(resolve => setTimeout(resolve, 100));
      
      // Trigger callback
      if (onAuthSuccess) {
        onAuthSuccess(user);
      }
    } catch (err) {
      console.error('Login error:', err);
      const msg = err.response?.data?.error || err.message || 'Login failed';
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  };

  // Handle Sign Up
  const handleSignupSubmit = async (e) => {
    e.preventDefault();
    if (!name.trim()) {
      toast.error('Please enter your full name');
      return;
    }
    if (!signupEmail.trim()) {
      toast.error('Please enter a valid email');
      return;
    }
    if (!signupPassword || signupPassword.length < 6) {
      toast.error('Password must be at least 6 characters');
      return;
    }

    setLoading(true);
    try {
      const response = await axios.post(`${API_URL}/auth/register`, {
        name: name.trim(),
        email: signupEmail.trim().toLowerCase(),
        password: signupPassword,
        role: signupRole,
      });

      const { token, user } = response.data;
      
      // Save authentication data first
      authUtils.saveAuth(token, user);
      
      // Show success message
      toast.success(`Account created successfully! Welcome, ${user.name}!`);
      
      // Small delay to ensure localStorage is written
      await new Promise(resolve => setTimeout(resolve, 100));
      
      // Trigger auth success callback
      if (onAuthSuccess) {
        onAuthSuccess(user);
      }
    } catch (err) {
      console.error('Signup error:', err);
      const msg = err.response?.data?.error || err.response?.data?.errors?.[0]?.msg || err.message || 'Registration failed';
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  };

  // 1-Click Quick Demo Login
  const handleQuickLogin = (demo) => {
    setLoginEmail(demo.email);
    setLoginPassword('password123');
    setActiveTab('login');

    // Automatically trigger login
    setLoading(true);
    axios.post(`${API_URL}/auth/login`, {
      email: demo.email,
      password: 'password123',
    })
      .then((response) => {
        const { token, user } = response.data;
        authUtils.saveAuth(token, user);
        toast.success(`Logged in as ${user.name} (${user.role})!`);
        onAuthSuccess?.(user);
      })
      .catch((err) => {
        const msg = err.response?.data?.error || err.message || 'Demo login failed';
        toast.error(msg);
      })
      .finally(() => {
        setLoading(false);
      });
  };

  const activeBg = isNight ? nightBg : dayBg;

  return (
    <div
      className="min-h-screen flex flex-col justify-between"
      style={{
        backgroundImage: `url(${activeBg})`,
        backgroundColor: '#F6F3EC',
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        backgroundRepeat: 'no-repeat',
        backgroundAttachment: 'fixed',
        transition: 'background-image 0.3s ease',
        fontFamily: "-apple-system, BlinkMacSystemFont, 'Inter', 'Segoe UI', Roboto, sans-serif",
      }}
    >
      {/* ── Top Ambient Bar ────────────────────────────────────────── */}
      <header
        className="w-full px-6 py-4 flex items-center justify-between"
        style={{
          background: isNight ? 'rgba(18, 22, 28, 0.75)' : 'rgba(255, 255, 255, 0.65)',
          backdropFilter: 'blur(16px)',
          borderBottom: isNight ? '1px solid rgba(255,255,255,0.08)' : '1px solid rgba(0,0,0,0.06)',
        }}
      >
        <div className="flex items-center gap-3">
          <div
            style={{
              width: 38,
              height: 38,
              borderRadius: 12,
              background: 'linear-gradient(135deg, #0F6A4B 0%, #1a8a60 100%)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              boxShadow: '0 2px 10px rgba(15, 106, 75, 0.35)',
            }}
          >
            <Sparkles size={20} color="#fff" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span style={{ fontSize: 18, fontWeight: 800, color: isNight ? '#fff' : '#111', letterSpacing: '-0.3px' }}>
                FinEdge
              </span>
              <span
                style={{
                  fontSize: 11,
                  fontWeight: 700,
                  textTransform: 'uppercase',
                  background: '#e6f5ef',
                  color: '#0F6A4B',
                  padding: '2px 8px',
                  borderRadius: 6,
                  border: '1px solid #ccebdc',
                }}
              >
                ERP
              </span>
            </div>
            <p style={{ margin: 0, fontSize: 11, color: isNight ? '#aaa' : '#777' }}>
              Financial & Operations Suite
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          {/* Live system status pill */}
          <div
            className="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-medium"
            style={{
              background: isNight ? 'rgba(255,255,255,0.08)' : '#e6f5ef',
              border: isNight ? '1px solid rgba(255,255,255,0.12)' : '1px solid #ccebdc',
              color: isNight ? '#a8f0cc' : '#0F6A4B',
            }}
          >
            <span
              style={{
                width: 7,
                height: 7,
                borderRadius: '50%',
                background: '#10b981',
                boxShadow: '0 0 8px #10b981',
              }}
            />
            Live Network · Neon DB
          </div>

          {/* Theme Switcher Button */}
          {onBgToggle && (
            <button
              onClick={onBgToggle}
              title={isNight ? 'Switch to Day mode' : 'Switch to Night mode'}
              style={{
                width: 38,
                height: 38,
                borderRadius: 12,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                cursor: 'pointer',
                background: isNight ? '#262d3a' : '#f0ede6',
                border: isNight ? '1.5px solid #3b4455' : '1.5px solid #e2ddd4',
                color: isNight ? '#f59e0b' : '#0F6A4B',
                boxShadow: '0 1px 4px rgba(0,0,0,0.06)',
                transition: 'all 0.15s ease',
              }}
            >
              {isNight ? <Sun size={17} /> : <Moon size={17} />}
            </button>
          )}
        </div>
      </header>

      {/* ── Main Container: Split Hero + Auth Form ─────────────────── */}
      <main className="flex-1 flex items-center justify-center p-4 sm:p-6 lg:p-10">
        <div className="w-full max-w-5xl grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">

          {/* ── Left Hero / ERP Live Showcase (Same as Dashboard) ────── */}
          <div className="lg:col-span-6 flex flex-col gap-6 text-left">
            <div>
              <div
                className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-semibold mb-3"
                style={{
                  background: isNight ? 'rgba(15,106,75,0.3)' : 'rgba(15,106,75,0.12)',
                  color: isNight ? '#a8f0cc' : '#0F6A4B',
                  border: isNight ? '1px solid rgba(168,240,204,0.3)' : '1px solid rgba(15,106,75,0.25)',
                }}
              >
                <Sparkles size={13} />
                Next-Generation Financial ERP
              </div>
              <h1
                style={{
                  fontSize: 'clamp(28px, 4vw, 38px)',
                  fontWeight: 800,
                  lineHeight: 1.15,
                  color: isNight ? '#ffffff' : '#111827',
                  letterSpacing: '-0.8px',
                  margin: '0 0 12px',
                }}
              >
                Everything your business finances need.
              </h1>
              <p
                style={{
                  fontSize: 15,
                  color: isNight ? '#cbd5e1' : '#4b5563',
                  lineHeight: 1.6,
                  margin: 0,
                }}
              >
                Real-time double-entry accounting, automated OCR invoice scanning, 
                purchases, and sales management with complete audit precision.
              </p>
            </div>

            {/* Mini Dashboard KPI Cards (Identical to Dashboard page) */}
            <div className="grid grid-cols-2 gap-3.5">
              <div
                style={{
                  background: isNight ? 'rgba(28, 34, 44, 0.75)' : 'rgba(255, 255, 255, 0.82)',
                  backdropFilter: 'blur(16px)',
                  borderRadius: 16,
                  padding: '16px',
                  border: isNight ? '1px solid rgba(255,255,255,0.1)' : '1px solid rgba(0,0,0,0.06)',
                  boxShadow: '0 4px 16px rgba(0,0,0,0.05)',
                }}
              >
                <div className="flex items-center justify-between mb-2">
                  <span style={{ fontSize: 11, fontWeight: 700, color: isNight ? '#94a3b8' : '#6b7280', textTransform: 'uppercase' }}>
                    Total Assets
                  </span>
                  <div style={{ width: 28, height: 28, borderRadius: 8, background: '#e6f5ef', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <TrendingUp size={15} color="#0F6A4B" />
                  </div>
                </div>
                <div style={{ fontSize: 20, fontWeight: 800, color: isNight ? '#fff' : '#111827' }}>
                  ₹7.34 Cr
                </div>
                <div style={{ fontSize: 11, color: '#10b981', fontWeight: 600, marginTop: 2 }}>
                  ✓ 100% Balanced Ledger
                </div>
              </div>

              <div
                style={{
                  background: isNight ? 'rgba(28, 34, 44, 0.75)' : 'rgba(255, 255, 255, 0.82)',
                  backdropFilter: 'blur(16px)',
                  borderRadius: 16,
                  padding: '16px',
                  border: isNight ? '1px solid rgba(255,255,255,0.1)' : '1px solid rgba(0,0,0,0.06)',
                  boxShadow: '0 4px 16px rgba(0,0,0,0.05)',
                }}
              >
                <div className="flex items-center justify-between mb-2">
                  <span style={{ fontSize: 11, fontWeight: 700, color: isNight ? '#94a3b8' : '#6b7280', textTransform: 'uppercase' }}>
                    Orders & Invoices
                  </span>
                  <div style={{ width: 28, height: 28, borderRadius: 8, background: '#e8f0fe', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <Landmark size={15} color="#1a56db" />
                  </div>
                </div>
                <div style={{ fontSize: 20, fontWeight: 800, color: isNight ? '#fff' : '#111827' }}>
                  200+
                </div>
                <div style={{ fontSize: 11, color: '#1a56db', fontWeight: 600, marginTop: 2 }}>
                  Bills & Orders Active
                </div>
              </div>
            </div>

            {/* Quick Demo Logins Section */}
            <div
              style={{
                background: isNight ? 'rgba(28, 34, 44, 0.65)' : 'rgba(255, 255, 255, 0.7)',
                backdropFilter: 'blur(14px)',
                borderRadius: 18,
                padding: '16px 18px',
                border: isNight ? '1px solid rgba(255,255,255,0.08)' : '1px solid rgba(0,0,0,0.05)',
              }}
            >
              <div className="flex items-center justify-between mb-2.5">
                <span style={{ fontSize: 12, fontWeight: 700, color: isNight ? '#cbd5e1' : '#374151' }}>
                  ⚡ Quick Test Sign-In (1-Click)
                </span>
                <span style={{ fontSize: 11, color: isNight ? '#94a3b8' : '#6b7280' }}>
                  Password: <code style={{ background: isNight ? '#334155' : '#ede9e0', padding: '1px 5px', borderRadius: 4 }}>password123</code>
                </span>
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                {DEMO_ACCOUNTS.map((demo) => (
                  <button
                    key={demo.label}
                    type="button"
                    onClick={() => handleQuickLogin(demo)}
                    className="flex flex-col items-center justify-center p-2 rounded-xl text-center transition-all"
                    style={{
                      background: isNight ? '#1e293b' : '#f5f2eb',
                      border: isNight ? '1px solid #334155' : '1px solid #e5e0d6',
                      cursor: 'pointer',
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.borderColor = '#0F6A4B';
                      e.currentTarget.style.background = isNight ? '#0F6A4B22' : '#e6f5ef';
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.borderColor = isNight ? '#334155' : '#e5e0d6';
                      e.currentTarget.style.background = isNight ? '#1e293b' : '#f5f2eb';
                    }}
                  >
                    <span style={{ fontSize: 12, fontWeight: 700, color: isNight ? '#f1f5f9' : '#1f2937' }}>
                      {demo.label}
                    </span>
                    <span style={{ fontSize: 10, color: '#0F6A4B', fontWeight: 600 }}>
                      Log In →
                    </span>
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* ── Right Column: Glassmorphism Auth Card ───────────────── */}
          <div className="lg:col-span-6">
            <div
              style={{
                background: isNight ? 'rgba(24, 28, 36, 0.88)' : 'rgba(255, 255, 255, 0.90)',
                backdropFilter: 'blur(24px)',
                borderRadius: 24,
                padding: '32px 28px',
                border: isNight ? '1px solid rgba(255,255,255,0.12)' : '1px solid rgba(255,255,255,0.85)',
                boxShadow: isNight
                  ? '0 24px 60px rgba(0,0,0,0.5), 0 4px 16px rgba(15,106,75,0.15)'
                  : '0 24px 60px rgba(15,106,75,0.12), 0 4px 20px rgba(0,0,0,0.04)',
              }}
            >
              {/* Tab Switcher: [Sign In] vs [Create Account] */}
              <div
                className="flex items-center p-1 rounded-xl mb-6"
                style={{
                  background: isNight ? '#1e2530' : '#f0ede6',
                  border: isNight ? '1px solid #2d3748' : '1px solid #e5e0d6',
                }}
              >
                <button
                  type="button"
                  onClick={() => setActiveTab('login')}
                  className="flex-1 py-2.5 rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-2"
                  style={{
                    background: activeTab === 'login' ? (isNight ? '#0F6A4B' : '#ffffff') : 'transparent',
                    color: activeTab === 'login' ? (isNight ? '#ffffff' : '#0F6A4B') : (isNight ? '#94a3b8' : '#6b7280'),
                    boxShadow: activeTab === 'login' ? '0 2px 8px rgba(0,0,0,0.08)' : 'none',
                    cursor: 'pointer',
                  }}
                >
                  <Lock size={14} />
                  Sign In
                </button>
                <button
                  type="button"
                  onClick={() => setActiveTab('signup')}
                  className="flex-1 py-2.5 rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-2"
                  style={{
                    background: activeTab === 'signup' ? (isNight ? '#0F6A4B' : '#ffffff') : 'transparent',
                    color: activeTab === 'signup' ? (isNight ? '#ffffff' : '#0F6A4B') : (isNight ? '#94a3b8' : '#6b7280'),
                    boxShadow: activeTab === 'signup' ? '0 2px 8px rgba(0,0,0,0.08)' : 'none',
                    cursor: 'pointer',
                  }}
                >
                  <User size={14} />
                  Create Account
                </button>
              </div>

              {/* ────────────────────────────────────────────────────────── */}
              {/* TAB 1: SIGN IN FORM                                        */}
              {/* ────────────────────────────────────────────────────────── */}
              {activeTab === 'login' ? (
                <form onSubmit={handleLoginSubmit} className="space-y-4 text-left">
                  <div>
                    <label
                      htmlFor="login-email"
                      style={{ display: 'block', fontSize: 13, fontWeight: 700, color: isNight ? '#e2e8f0' : '#1f2937', marginBottom: 6 }}
                    >
                      Email Address
                    </label>
                    <div className="relative">
                      <Mail
<<<<<<< Updated upstream
                        size={17}
                        className="absolute left-3.5 top-1/2 transform -translate-y-1/2"
                        style={{ color: isNight ? '#64748b' : '#9ca3af' }}
=======
                        size={16}
                        className="absolute left-3.5 top-1/2 transform -translate-y-1/2 pointer-events-none"
                        style={{ color: isNight ? '#64748b' : '#9ca3af', zIndex: 1 }}
>>>>>>> Stashed changes
                      />
                      <input
                        id="login-email"
                        type="email"
                        value={loginEmail}
                        onChange={(e) => setLoginEmail(e.target.value)}
                        required
                        placeholder="admin@finedge.com"
<<<<<<< Updated upstream
                        className="w-full pl-10 pr-4 py-2.5 rounded-xl border-2 focus:outline-none transition-all text-sm font-medium"
                        style={{
=======
                        className="login-field-input w-full rounded-xl border-2 focus:outline-none transition-all text-sm font-medium"
                        style={{
                          paddingLeft: '42px',
                          paddingRight: '16px',
                          paddingTop: '10px',
                          paddingBottom: '10px',
>>>>>>> Stashed changes
                          background: isNight ? '#1e2430' : '#f9f8f5',
                          borderColor: isNight ? '#334155' : '#e5e0d6',
                          color: isNight ? '#f8fafc' : '#111827',
                        }}
                        onFocus={(e) => {
                          e.target.style.borderColor = '#0F6A4B';
                          e.target.style.background = isNight ? '#19202c' : '#ffffff';
                        }}
                        onBlur={(e) => {
                          e.target.style.borderColor = isNight ? '#334155' : '#e5e0d6';
                          e.target.style.background = isNight ? '#1e2430' : '#f9f8f5';
                        }}
                      />
                    </div>
                  </div>

                  <div>
                    <div className="flex items-center justify-between mb-1.5">
                      <label
                        htmlFor="login-password"
                        style={{ fontSize: 13, fontWeight: 700, color: isNight ? '#e2e8f0' : '#1f2937' }}
                      >
                        Password
                      </label>
                      <button
                        type="button"
                        onClick={() => {
                          setLoginPassword('password123');
                          toast('Demo password filled: password123', { icon: '🔑' });
                        }}
                        style={{ fontSize: 11, color: '#0F6A4B', background: 'none', border: 'none', cursor: 'pointer', fontWeight: 600 }}
                      >
                        Use Default?
                      </button>
                    </div>
                    <div className="relative">
                      <Lock
<<<<<<< Updated upstream
                        size={17}
                        className="absolute left-3.5 top-1/2 transform -translate-y-1/2"
                        style={{ color: isNight ? '#64748b' : '#9ca3af' }}
=======
                        size={16}
                        className="absolute left-3.5 top-1/2 transform -translate-y-1/2 pointer-events-none"
                        style={{ color: isNight ? '#64748b' : '#9ca3af', zIndex: 1 }}
>>>>>>> Stashed changes
                      />
                      <input
                        id="login-password"
                        type={showLoginPassword ? 'text' : 'password'}
                        value={loginPassword}
                        onChange={(e) => setLoginPassword(e.target.value)}
                        required
                        placeholder="Enter password"
<<<<<<< Updated upstream
                        className="w-full pl-10 pr-12 py-2.5 rounded-xl border-2 focus:outline-none transition-all text-sm font-medium"
                        style={{
=======
                        className="login-field-input login-field-input-with-toggle w-full rounded-xl border-2 focus:outline-none transition-all text-sm font-medium"
                        style={{
                          paddingLeft: '42px',
                          paddingRight: '42px',
                          paddingTop: '10px',
                          paddingBottom: '10px',
>>>>>>> Stashed changes
                          background: isNight ? '#1e2430' : '#f9f8f5',
                          borderColor: isNight ? '#334155' : '#e5e0d6',
                          color: isNight ? '#f8fafc' : '#111827',
                        }}
                        onFocus={(e) => {
                          e.target.style.borderColor = '#0F6A4B';
                          e.target.style.background = isNight ? '#19202c' : '#ffffff';
                        }}
                        onBlur={(e) => {
                          e.target.style.borderColor = isNight ? '#334155' : '#e5e0d6';
                          e.target.style.background = isNight ? '#1e2430' : '#f9f8f5';
                        }}
                      />
                      <button
                        type="button"
                        onClick={() => setShowLoginPassword(!showLoginPassword)}
<<<<<<< Updated upstream
                        className="absolute right-3.5 top-1/2 transform -translate-y-1/2"
=======
                        className="login-password-toggle absolute right-3.5 top-1/2 transform -translate-y-1/2"
>>>>>>> Stashed changes
                        style={{ background: 'none', border: 'none', cursor: 'pointer', color: isNight ? '#94a3b8' : '#9ca3af' }}
                      >
                        {showLoginPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                      </button>
                    </div>
                  </div>

                  {/* Submit Button */}
                  <button
                    type="submit"
                    disabled={loading}
                    className="w-full py-3 rounded-xl font-bold text-white transition-all flex items-center justify-center gap-2 mt-2"
                    style={{
                      background: loading ? '#9ca3af' : 'linear-gradient(135deg, #0F6A4B 0%, #168a62 100%)',
                      cursor: loading ? 'not-allowed' : 'pointer',
                      boxShadow: '0 4px 14px rgba(15, 106, 75, 0.35)',
                      fontSize: 14,
                    }}
                    onMouseEnter={(e) => {
                      if (!loading) {
                        e.currentTarget.style.transform = 'translateY(-1px)';
                        e.currentTarget.style.boxShadow = '0 6px 20px rgba(15, 106, 75, 0.45)';
                      }
                    }}
                    onMouseLeave={(e) => {
                      if (!loading) {
                        e.currentTarget.style.transform = 'translateY(0)';
                        e.currentTarget.style.boxShadow = '0 4px 14px rgba(15, 106, 75, 0.35)';
                      }
                    }}
                  >
                    {loading ? (
                      <span>Verifying credentials...</span>
                    ) : (
                      <>
                        <span>Sign In to Dashboard</span>
                        <ArrowRight size={16} />
                      </>
                    )}
                  </button>
                </form>
              ) : (
                /* ────────────────────────────────────────────────────────── */
                /* TAB 2: SIGN UP FORM                                        */
                /* ────────────────────────────────────────────────────────── */
                <form onSubmit={handleSignupSubmit} className="space-y-3.5 text-left">
                  <div>
                    <label
                      htmlFor="signup-name"
                      style={{ display: 'block', fontSize: 13, fontWeight: 700, color: isNight ? '#e2e8f0' : '#1f2937', marginBottom: 5 }}
                    >
                      Full Name
                    </label>
                    <div className="relative">
                      <User
<<<<<<< Updated upstream
                        size={17}
                        className="absolute left-3.5 top-1/2 transform -translate-y-1/2"
                        style={{ color: isNight ? '#64748b' : '#9ca3af' }}
=======
                        size={16}
                        className="absolute left-3.5 top-1/2 transform -translate-y-1/2 pointer-events-none"
                        style={{ color: isNight ? '#64748b' : '#9ca3af', zIndex: 1 }}
>>>>>>> Stashed changes
                      />
                      <input
                        id="signup-name"
                        type="text"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        required
                        placeholder="John Doe"
<<<<<<< Updated upstream
                        className="w-full pl-10 pr-4 py-2 rounded-xl border-2 focus:outline-none transition-all text-sm font-medium"
                        style={{
=======
                        className="login-field-input w-full rounded-xl border-2 focus:outline-none transition-all text-sm font-medium"
                        style={{
                          paddingLeft: '42px',
                          paddingRight: '16px',
                          paddingTop: '9px',
                          paddingBottom: '9px',
>>>>>>> Stashed changes
                          background: isNight ? '#1e2430' : '#f9f8f5',
                          borderColor: isNight ? '#334155' : '#e5e0d6',
                          color: isNight ? '#f8fafc' : '#111827',
                        }}
                        onFocus={(e) => {
                          e.target.style.borderColor = '#0F6A4B';
                          e.target.style.background = isNight ? '#19202c' : '#ffffff';
                        }}
                        onBlur={(e) => {
                          e.target.style.borderColor = isNight ? '#334155' : '#e5e0d6';
                          e.target.style.background = isNight ? '#1e2430' : '#f9f8f5';
                        }}
                      />
                    </div>
                  </div>

                  <div>
                    <label
                      htmlFor="signup-email"
                      style={{ display: 'block', fontSize: 13, fontWeight: 700, color: isNight ? '#e2e8f0' : '#1f2937', marginBottom: 5 }}
                    >
                      Email Address
                    </label>
                    <div className="relative">
                      <Mail
<<<<<<< Updated upstream
                        size={17}
                        className="absolute left-3.5 top-1/2 transform -translate-y-1/2"
                        style={{ color: isNight ? '#64748b' : '#9ca3af' }}
=======
                        size={16}
                        className="absolute left-3.5 top-1/2 transform -translate-y-1/2 pointer-events-none"
                        style={{ color: isNight ? '#64748b' : '#9ca3af', zIndex: 1 }}
>>>>>>> Stashed changes
                      />
                      <input
                        id="signup-email"
                        type="email"
                        value={signupEmail}
                        onChange={(e) => setSignupEmail(e.target.value)}
                        required
                        placeholder="john@example.com"
<<<<<<< Updated upstream
                        className="w-full pl-10 pr-4 py-2 rounded-xl border-2 focus:outline-none transition-all text-sm font-medium"
                        style={{
=======
                        className="login-field-input w-full rounded-xl border-2 focus:outline-none transition-all text-sm font-medium"
                        style={{
                          paddingLeft: '42px',
                          paddingRight: '16px',
                          paddingTop: '9px',
                          paddingBottom: '9px',
>>>>>>> Stashed changes
                          background: isNight ? '#1e2430' : '#f9f8f5',
                          borderColor: isNight ? '#334155' : '#e5e0d6',
                          color: isNight ? '#f8fafc' : '#111827',
                        }}
                        onFocus={(e) => {
                          e.target.style.borderColor = '#0F6A4B';
                          e.target.style.background = isNight ? '#19202c' : '#ffffff';
                        }}
                        onBlur={(e) => {
                          e.target.style.borderColor = isNight ? '#334155' : '#e5e0d6';
                          e.target.style.background = isNight ? '#1e2430' : '#f9f8f5';
                        }}
                      />
                    </div>
                  </div>

                  <div>
                    <label
                      htmlFor="signup-password"
                      style={{ display: 'block', fontSize: 13, fontWeight: 700, color: isNight ? '#e2e8f0' : '#1f2937', marginBottom: 5 }}
                    >
                      Password (min. 6 chars)
                    </label>
                    <div className="relative">
                      <Lock
<<<<<<< Updated upstream
                        size={17}
                        className="absolute left-3.5 top-1/2 transform -translate-y-1/2"
                        style={{ color: isNight ? '#64748b' : '#9ca3af' }}
=======
                        size={16}
                        className="absolute left-3.5 top-1/2 transform -translate-y-1/2 pointer-events-none"
                        style={{ color: isNight ? '#64748b' : '#9ca3af', zIndex: 1 }}
>>>>>>> Stashed changes
                      />
                      <input
                        id="signup-password"
                        type={showSignupPassword ? 'text' : 'password'}
                        value={signupPassword}
                        onChange={(e) => setSignupPassword(e.target.value)}
                        required
                        minLength={6}
                        placeholder="Create a strong password"
<<<<<<< Updated upstream
                        className="w-full pl-10 pr-12 py-2 rounded-xl border-2 focus:outline-none transition-all text-sm font-medium"
                        style={{
=======
                        className="login-field-input login-field-input-with-toggle w-full rounded-xl border-2 focus:outline-none transition-all text-sm font-medium"
                        style={{
                          paddingLeft: '42px',
                          paddingRight: '42px',
                          paddingTop: '9px',
                          paddingBottom: '9px',
>>>>>>> Stashed changes
                          background: isNight ? '#1e2430' : '#f9f8f5',
                          borderColor: isNight ? '#334155' : '#e5e0d6',
                          color: isNight ? '#f8fafc' : '#111827',
                        }}
                        onFocus={(e) => {
                          e.target.style.borderColor = '#0F6A4B';
                          e.target.style.background = isNight ? '#19202c' : '#ffffff';
                        }}
                        onBlur={(e) => {
                          e.target.style.borderColor = isNight ? '#334155' : '#e5e0d6';
                          e.target.style.background = isNight ? '#1e2430' : '#f9f8f5';
                        }}
                      />
                      <button
                        type="button"
                        onClick={() => setShowSignupPassword(!showSignupPassword)}
<<<<<<< Updated upstream
                        className="absolute right-3.5 top-1/2 transform -translate-y-1/2"
=======
                        className="login-password-toggle absolute right-3.5 top-1/2 transform -translate-y-1/2"
>>>>>>> Stashed changes
                        style={{ background: 'none', border: 'none', cursor: 'pointer', color: isNight ? '#94a3b8' : '#9ca3af' }}
                      >
                        {showSignupPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                      </button>
                    </div>
                  </div>

                  {/* Role Selector Grid */}
                  <div>
                    <label style={{ display: 'block', fontSize: 13, fontWeight: 700, color: isNight ? '#e2e8f0' : '#1f2937', marginBottom: 6 }}>
                      Select Your Role
                    </label>
                    <div className="grid grid-cols-3 gap-2">
                      {[
                        { id: 'admin', label: 'Admin', icon: ShieldCheck, desc: 'Full System' },
                        { id: 'accountant', label: 'Accountant', icon: Calculator, desc: 'Ledger & Bills' },
                        { id: 'contact', label: 'User/Client', icon: UserCircle, desc: 'Orders Portal' },
                      ].map((r) => {
                        const Icon = r.icon;
                        const isSelected = signupRole === r.id;
                        return (
                          <button
                            key={r.id}
                            type="button"
                            onClick={() => setSignupRole(r.id)}
                            className="p-2.5 rounded-xl text-left transition-all relative flex flex-col gap-1"
                            style={{
                              background: isSelected
                                ? (isNight ? 'rgba(15,106,75,0.3)' : '#e6f5ef')
                                : (isNight ? '#1e2430' : '#f5f2eb'),
                              border: isSelected
                                ? '2px solid #0F6A4B'
                                : (isNight ? '1.5px solid #334155' : '1.5px solid #e5e0d6'),
                              cursor: 'pointer',
                            }}
                          >
                            <div className="flex items-center justify-between">
                              <Icon size={16} color={isSelected ? '#0F6A4B' : (isNight ? '#94a3b8' : '#64748b')} />
                              {isSelected && <Check size={14} color="#0F6A4B" strokeWidth={3} />}
                            </div>
                            <span style={{ fontSize: 12, fontWeight: 700, color: isSelected ? '#0F6A4B' : (isNight ? '#f1f5f9' : '#1f2937') }}>
                              {r.label}
                            </span>
                            <span style={{ fontSize: 9.5, color: isNight ? '#94a3b8' : '#6b7280' }}>
                              {r.desc}
                            </span>
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  {/* Submit Button */}
                  <button
                    type="submit"
                    disabled={loading}
                    className="w-full py-3 rounded-xl font-bold text-white transition-all flex items-center justify-center gap-2 mt-3"
                    style={{
                      background: loading ? '#9ca3af' : 'linear-gradient(135deg, #0F6A4B 0%, #168a62 100%)',
                      cursor: loading ? 'not-allowed' : 'pointer',
                      boxShadow: '0 4px 14px rgba(15, 106, 75, 0.35)',
                      fontSize: 14,
                    }}
                  >
                    {loading ? (
                      <span>Registering account...</span>
                    ) : (
                      <>
                        <span>Create Account & Get Started</span>
                        <ArrowRight size={16} />
                      </>
                    )}
                  </button>
                </form>
              )}

              {/* Card Footer */}
              <div
                className="mt-5 pt-4 text-center"
                style={{
                  borderTop: isNight ? '1px solid rgba(255,255,255,0.08)' : '1px solid #f0ede6',
                }}
              >
                <p style={{ margin: 0, fontSize: 11, color: isNight ? '#94a3b8' : '#71717a' }}>
                  FinEdge Enterprise ERP · Protected by 256-bit SSL encryption
                </p>
              </div>
            </div>
          </div>

        </div>
      </main>

      {/* ── Footer ─────────────────────────────────────────────────── */}
      <footer
        className="w-full py-3 px-6 text-center text-xs"
        style={{
          color: isNight ? '#94a3b8' : '#71717a',
          background: isNight ? 'rgba(18, 22, 28, 0.6)' : 'rgba(255, 255, 255, 0.5)',
          backdropFilter: 'blur(10px)',
        }}
      >
        © 2026 FinEdge ERP Inc. All rights reserved · Double-entry accounting system
      </footer>
    </div>
  );
}
