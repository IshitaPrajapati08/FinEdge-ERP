import { useState, useEffect } from 'react';
import { contactsAPI } from '../services/api';
import { UserPlus, Trash2 } from 'lucide-react';

export default function ContactsPage() {
  const [contacts, setContacts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({ name: '', type: 'customer', email: '', mobile: '' });

  useEffect(() => { fetchContacts(); }, []);

  const fetchContacts = async () => {
    try {
      setLoading(true);
      const response = await contactsAPI.getAll();
      setContacts(response.data);
      setError(null);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await contactsAPI.create(formData);
      setFormData({ name: '', type: 'customer', email: '', mobile: '' });
      setShowForm(false);
      fetchContacts();
    } catch (err) {
      setError(err.message);
    }
  };

  const handleDelete = async (id) => {
    if (!confirm('Are you sure?')) return;
    try {
      await contactsAPI.delete(id);
      fetchContacts();
    } catch (err) {
      setError(err.message);
    }
  };

  if (loading) return <div className="loading">Loading contacts…</div>;

  return (
    <div className="page-root">

      {/* Header */}
      <div className="page-header">
        <div>
          <h1 className="page-title">Contacts</h1>
          <p className="page-subtitle">{contacts.length} contact{contacts.length !== 1 ? 's' : ''}</p>
        </div>
        {!showForm && (
          <button className="action-btn" onClick={() => setShowForm(true)}>
            <UserPlus size={14} />
            New Contact
          </button>
        )}
      </div>

      {error && <div className="error">{error}</div>}

      {/* Create form */}
      {showForm && (
        <div className="page-card">
          <h3 className="card-section-title">New Contact</h3>
          <form onSubmit={handleSubmit} style={{ background: 'none', padding: 0, boxShadow: 'none', border: 'none', marginBottom: 0 }}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
              <div className="form-group" style={{ marginBottom: 0 }}>
                <label>Name *</label>
                <input type="text" required value={formData.name}
                  onChange={e => setFormData({ ...formData, name: e.target.value })} />
              </div>
              <div className="form-group" style={{ marginBottom: 0 }}>
                <label>Type *</label>
                <select required value={formData.type}
                  onChange={e => setFormData({ ...formData, type: e.target.value })}>
                  <option value="customer">Customer</option>
                  <option value="vendor">Vendor</option>
                </select>
              </div>
              <div className="form-group" style={{ marginBottom: 0 }}>
                <label>Email</label>
                <input type="email" value={formData.email}
                  onChange={e => setFormData({ ...formData, email: e.target.value })} />
              </div>
              <div className="form-group" style={{ marginBottom: 0 }}>
                <label>Mobile</label>
                <input type="tel" value={formData.mobile}
                  onChange={e => setFormData({ ...formData, mobile: e.target.value })} />
              </div>
            </div>
            <div className="button-group">
              <button type="submit">Create Contact</button>
              <button type="button" className="secondary" onClick={() => setShowForm(false)}>Cancel</button>
            </div>
          </form>
        </div>
      )}

      {/* Table */}
      <div className="page-card">
        <table>
          <thead>
            <tr>
              <th>Name</th>
              <th>Type</th>
              <th>Email</th>
              <th>Mobile</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {contacts.length === 0 ? (
              <tr><td colSpan={5} style={{ textAlign: 'center', color: '#bbb', padding: '40px 0' }}>No contacts yet</td></tr>
            ) : contacts.map(contact => (
              <tr key={contact.id}>
                <td style={{ fontWeight: 500 }}>{contact.name}</td>
                <td><span className={`status-badge ${contact.type.toLowerCase()}`}>{contact.type}</span></td>
                <td>{contact.email || <span style={{ color: '#bbb' }}>—</span>}</td>
                <td>{contact.mobile || <span style={{ color: '#bbb' }}>—</span>}</td>
                <td>
                  <button className="danger" onClick={() => handleDelete(contact.id)}
                    style={{ padding: '5px 12px', fontSize: '12px', display: 'inline-flex', alignItems: 'center', gap: 4 }}>
                    <Trash2 size={12} /> Delete
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
