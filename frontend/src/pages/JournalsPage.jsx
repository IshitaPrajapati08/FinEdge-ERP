import { useState, useEffect } from 'react';
import { journalEntriesAPI, journalsAPI } from '../services/api';

export default function JournalsPage() {
  const [journals, setJournals] = useState([]);
  const [entries, setEntries] = useState([]);
  const [selectedJournal, setSelectedJournal] = useState(null);
  const [editingId, setEditingId] = useState(null);
  const [editForm, setEditForm] = useState({ date: '', reference: '' });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [journalsResponse, entriesResponse] = await Promise.all([
          journalsAPI.getAll(),
          journalEntriesAPI.getAll(),
        ]);
        setJournals(journalsResponse.data);
        setEntries(entriesResponse.data);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  const startEditing = (entry) => {
    setEditingId(entry.id);
    setEditForm({
      date: new Date(entry.date).toISOString().slice(0, 10),
      reference: entry.reference || '',
    });
  };

  const saveEntry = async (id) => {
    try {
      const response = await journalEntriesAPI.update(id, editForm);
      setEntries((current) => current.map((entry) => entry.id === id ? response.data : entry));
      setEditingId(null);
    } catch (err) {
      console.error(err);
    }
  };

  if (loading) return <div className="loading">Loading journals…</div>;

  return (
    <div className="page-root">

<<<<<<< Updated upstream
      {/* Header */}
      <div className="page-header">
        <div>
          <h1 className="page-title">Journals</h1>
          <p className="page-subtitle">{journals.length} journal{journals.length !== 1 ? 's' : ''} configured</p>
        </div>
      </div>

      {/* Table */}
=======
>>>>>>> Stashed changes
      <div className="page-card">
        <table>
          <thead>
            <tr>
              <th>#</th>
              <th>Journal Name</th>
              <th>Type</th>
              <th>Entries</th>
            </tr>
          </thead>
          <tbody>
            {journals.length === 0 ? (
              <tr><td colSpan={4} style={{ textAlign: 'center', color: '#bbb', padding: '40px 0' }}>No journals found</td></tr>
            ) : journals.map((journal, i) => (
              <tr key={journal.id} onClick={() => setSelectedJournal(journal)} style={{ cursor: 'pointer' }}>
                <td style={{ color: '#aaa', width: 40 }}>{i + 1}</td>
                <td style={{ fontWeight: 500 }}>{journal.name}</td>
                <td><span className={`status-badge ${journal.type.toLowerCase()}`}>{journal.type}</span></td>
                <td>{entries.filter((entry) => entry.journalId === journal.id).length}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {selectedJournal && (
        <div className="page-card" style={{ marginTop: 20 }}>
          <div className="page-header" style={{ marginBottom: 16 }}>
            <div>
              <h2 style={{ margin: 0 }}>{selectedJournal.name}</h2>
              <p className="page-subtitle">Real journal entries · click Edit to modify date or reference</p>
            </div>
            <button type="button" className="secondary" onClick={() => setSelectedJournal(null)}>Close</button>
          </div>
          <div style={{ overflowX: 'auto' }}>
            <table>
              <thead>
                <tr><th>Date</th><th>Reference</th><th>Status</th><th>Lines</th><th>Action</th></tr>
              </thead>
              <tbody>
                {entries.filter((entry) => entry.journalId === selectedJournal.id).map((entry) => (
                  <tr key={entry.id}>
                    {editingId === entry.id ? (
                      <>
                        <td><input type="date" value={editForm.date} onChange={(e) => setEditForm({ ...editForm, date: e.target.value })} /></td>
                        <td><input value={editForm.reference} onChange={(e) => setEditForm({ ...editForm, reference: e.target.value })} /></td>
                        <td>{entry.status}</td><td>{entry.items?.length || 0}</td>
                        <td><button type="button" onClick={() => saveEntry(entry.id)}>Save</button></td>
                      </>
                    ) : (
                      <>
                        <td>{new Date(entry.date).toLocaleDateString('en-IN')}</td>
                        <td>{entry.reference || '—'}</td>
                        <td><span className={`status-badge ${entry.status.toLowerCase()}`}>{entry.status}</span></td>
                        <td>{entry.items?.length || 0}</td>
                        <td><button type="button" className="secondary" onClick={() => startEditing(entry)}>Edit</button></td>
                      </>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
