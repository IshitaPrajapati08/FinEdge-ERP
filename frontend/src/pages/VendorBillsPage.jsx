import { useState, useEffect } from 'react';
import toast from 'react-hot-toast';
import { vendorBillsAPI } from '../services/api';
import { ChevronLeft, ScanLine } from 'lucide-react';

export default function VendorBillsPage({ onNavigate, currentUser }) {
  const [bills, setBills] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedBill, setSelectedBill] = useState(null);
  const [paymentData, setPaymentData] = useState({ amount: '', paymentType: 'bank' });

  const rawRole = typeof currentUser === 'object' ? currentUser?.role : currentUser;
  const role = String(rawRole || '').toLowerCase().trim();
  const isAuthorizedRole = role === 'admin' || role === 'accountant';

  useEffect(() => { loadBills(); }, []);

  const loadBills = async () => {
    try {
      const response = await vendorBillsAPI.getAll();
      setBills(response.data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handlePayment = async (billId) => {
    // Clear previous errors
    setError(null);
    
    try {
      if (!paymentData.amount || parseFloat(paymentData.amount) <= 0) {
<<<<<<< Updated upstream
        toast.warning('Please enter a valid payment amount.');
        return;
      }
      
      // Make the payment request
      const response = await vendorBillsAPI.pay(billId, {
=======
        setError('Enter a payment amount greater than 0');
        return;
      }
      await vendorBillsAPI.pay(billId, {
>>>>>>> Stashed changes
        amount: parseFloat(paymentData.amount),
        paymentType: paymentData.paymentType,
      });
      
      // If we reach here, payment was successful
      setPaymentData({ amount: '', paymentType: 'bank' });
      setSelectedBill(null);
      toast.success('Payment recorded successfully!');
      
      // Reload bills to show updated status
      await loadBills();
    } catch (err) {
<<<<<<< Updated upstream
      console.error('Payment error:', err);
      const msg = err.response?.data?.error || err.message || 'Payment failed';
      setError(msg);
      toast.error(msg);
=======
      setError(err.response?.data?.error || 'Unable to record payment');
>>>>>>> Stashed changes
    }
  };

  const openBill = (bill) => {
    setSelectedBill(bill.id);
    setPaymentData({ amount: bill.outstanding || bill.total || '', paymentType: 'bank' });
    setError(null);
  };

  if (loading) return <div className="loading">Loading vendor bills…</div>;

  const billData = bills.find(b => b.id === selectedBill);

  return (
    <div className="page-root">

      {/* Header */}
      <div className="page-header">
        <div>
          <h1 className="page-title">Vendor Bills</h1>
          <p className="page-subtitle">{bills.length} bill{bills.length !== 1 ? 's' : ''}</p>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          {!selectedBill && isAuthorizedRole && (
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
          {selectedBill && (
            <button className="action-btn" onClick={() => setSelectedBill(null)}
              style={{ background: 'transparent', color: '#555', border: '1.5px solid #d6d1c9', boxShadow: 'none' }}>
              <ChevronLeft size={14} />
              Back to list
            </button>
          )}
        </div>
      </div>

      {error && <div className="error">{error}</div>}

      {/* Detail view */}
      {billData && (
        <>
          <div className="page-card">
            <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 20 }}>
              <div>
                <h3 style={{ margin: '0 0 4px', fontSize: 16, fontWeight: 700 }}>Bill #{billData.id}</h3>
                <p style={{ margin: 0, color: '#888', fontSize: 13 }}>
                  Vendor: <strong style={{ color: '#333' }}>{billData.purchaseOrder.vendor.name}</strong>
                </p>
              </div>
              <span className={`status-badge ${billData.status.toLowerCase()}`}>{billData.status}</span>
            </div>

            <h4 style={{ marginTop: 0 }}>Items</h4>
            <table>
              <thead>
                <tr><th>Product</th><th>Qty</th><th>Unit Price</th><th>Total</th></tr>
              </thead>
              <tbody>
                {billData.purchaseOrder.lines.map(line => {
                  const total = line.qty * parseFloat(line.unitPrice);
                  return (
                    <tr key={line.id}>
                      <td style={{ fontWeight: 500 }}>{line.product.name}</td>
                      <td>{line.qty}</td>
                      <td>₹{parseFloat(line.unitPrice).toLocaleString('en-IN', { minimumFractionDigits: 2 })}</td>
                      <td style={{ fontWeight: 600 }}>₹{total.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>

            {billData.journalEntry && (
              <>
                <h4>Journal Entry</h4>
                <table>
                  <thead>
                    <tr><th>Account</th><th>Debit</th><th>Credit</th></tr>
                  </thead>
                  <tbody>
                    {billData.journalEntry.items.map(item => (
                      <tr key={item.id}>
                        <td>{item.account.name}</td>
                        <td style={{ color: item.debit > 0 ? '#0F6A4B' : '#bbb' }}>
                          {item.debit > 0 ? '₹' + parseFloat(item.debit).toLocaleString('en-IN', { minimumFractionDigits: 2 }) : '—'}
                        </td>
                        <td style={{ color: item.credit > 0 ? '#c0392b' : '#bbb' }}>
                          {item.credit > 0 ? '₹' + parseFloat(item.credit).toLocaleString('en-IN', { minimumFractionDigits: 2 }) : '—'}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </>
            )}
          </div>

          {billData.status !== 'PAID' && (
            <div className="page-card">
              <h3 className="card-section-title">Record Payment</h3>
              
              {/* Outstanding Amount Display */}
              {billData.outstanding && (
                <div style={{ 
                  padding: '10px 14px', 
                  background: '#f8f6f3', 
                  borderRadius: '8px', 
                  marginBottom: '14px',
                  border: '1px solid #e8e3d8'
                }}>
                  <span style={{ fontSize: '12px', color: '#888', fontWeight: 500 }}>
                    Outstanding Amount: 
                  </span>
                  <span style={{ fontSize: '15px', fontWeight: 700, color: '#0F6A4B', marginLeft: '8px' }}>
                    ₹{parseFloat(billData.outstanding).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                  </span>
                  <button
                    type="button"
                    onClick={() => setPaymentData({ ...paymentData, amount: billData.outstanding })}
                    style={{
                      marginLeft: '12px',
                      padding: '4px 10px',
                      fontSize: '11px',
                      background: '#0F6A4B',
                      color: '#fff',
                      border: 'none',
                      borderRadius: '6px',
                      cursor: 'pointer',
                      fontWeight: 500
                    }}
                  >
                    Pay Full Amount
                  </button>
                </div>
              )}
              
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
                <div className="form-group" style={{ marginBottom: 0 }}>
                  <label>Amount *</label>
                  <input type="number" step="0.01" value={paymentData.amount}
                    onChange={e => setPaymentData({ ...paymentData, amount: e.target.value })} 
                    placeholder="Enter payment amount" />
                </div>
                <div className="form-group" style={{ marginBottom: 0 }}>
                  <label>Payment Type *</label>
                  <select value={paymentData.paymentType}
                    onChange={e => setPaymentData({ ...paymentData, paymentType: e.target.value })}>
                    <option value="bank">Bank</option>
                    <option value="cash">Cash</option>
                  </select>
                </div>
              </div>
              <div className="button-group">
                <button onClick={() => handlePayment(billData.id)}>Record Payment</button>
              </div>
            </div>
          )}
        </>
      )}

      {/* List */}
      {!selectedBill && (
        <div className="page-card">
          <table>
            <thead>
              <tr>
                <th>Bill #</th>
                <th>Vendor</th>
                <th>Status</th>
                <th>Payments</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {bills.length === 0 ? (
                <tr><td colSpan={5} style={{ textAlign: 'center', color: '#bbb', padding: '40px 0' }}>No vendor bills</td></tr>
              ) : bills.map(bill => (
                <tr key={bill.id}>
                  <td style={{ fontWeight: 600, color: '#0F6A4B' }}>#{bill.id}</td>
                  <td style={{ fontWeight: 500 }}>{bill.purchaseOrder.vendor.name}</td>
                  <td><span className={`status-badge ${bill.status.toLowerCase()}`}>{bill.status}</span></td>
                  <td>
                    <span className="status-badge draft">{bill.payments.length} payment{bill.payments.length !== 1 ? 's' : ''}</span>
                  </td>
                  <td>
                    <button onClick={() => openBill(bill)}
                      style={{ padding: '5px 14px', fontSize: '12px' }}>
                      View
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
