import React, { useState, useEffect } from 'react';
import api from '../../utils/api';

const adminHeaders = () => ({ headers: { Authorization: `Bearer ${localStorage.getItem('qi_admin_token')}` } });

const AdminUsers = () => {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState(null);
  const [newPlan, setNewPlan] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => { fetchUsers(); }, []);

  const fetchUsers = async () => {
    try {
      const res = await api.get('/admin/users', adminHeaders());
      setUsers(res.data);
    } catch (err) {}
    finally { setLoading(false); }
  };

  const handlePlanChange = async () => {
    if (!newPlan || !selected) return;
    setSaving(true);
    try {
      await api.put(`/admin/users/${selected.id}/plan`, { plan: newPlan, note: 'Admin manual change' }, adminHeaders());
      setSelected(null);
      fetchUsers();
    } catch (err) { alert('Failed to update plan.'); }
    finally { setSaving(false); }
  };

  if (loading) return <div style={{ padding: '20px', color: 'var(--text-secondary)' }}>Loading...</div>;

  return (
    <div>
      <h1 style={{ fontSize: '26px', fontWeight: '700', marginBottom: '8px' }}>Users</h1>
      <p style={{ color: 'var(--text-secondary)', fontSize: '14px', marginBottom: '28px' }}>{users.length} registered users</p>

      <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '14px' }}>
          <thead style={{ background: 'var(--page-bg)' }}>
            <tr style={{ color: 'var(--text-secondary)', fontSize: '12px', fontWeight: '600' }}>
              <th style={{ padding: '14px 20px', textAlign: 'left' }}>User</th>
              <th style={{ padding: '14px 12px', textAlign: 'left' }}>Plan</th>
              <th style={{ padding: '14px 12px', textAlign: 'left' }}>Sub Status</th>
              <th style={{ padding: '14px 12px', textAlign: 'left' }}>Invoices</th>
              <th style={{ padding: '14px 12px', textAlign: 'left' }}>Gateway</th>
              <th style={{ padding: '14px 12px', textAlign: 'left' }}>Joined</th>
              <th style={{ padding: '14px 20px', textAlign: 'left' }}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {users.map(u => (
              <tr key={u.id} style={{ borderTop: '1px solid var(--border)' }}>
                <td style={{ padding: '14px 20px' }}>
                  <div style={{ fontWeight: '600' }}>{u.name}</div>
                  <div style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>{u.email}</div>
                </td>
                <td style={{ padding: '14px 12px' }}>
                  <span style={{ background: u.plan === 'pro' ? 'var(--brand-light)' : 'var(--border)', color: u.plan === 'pro' ? 'var(--brand-dark)' : 'var(--text-secondary)', fontSize: '12px', fontWeight: '700', padding: '3px 10px', borderRadius: '20px', textTransform: 'uppercase' }}>
                    {u.plan}
                  </span>
                </td>
                <td style={{ padding: '14px 12px', fontSize: '13px' }}>
                  {u.subscription_status
                    ? <span style={{ color: u.subscription_status === 'active' ? 'var(--brand)' : 'var(--danger)', fontWeight: '600' }}>{u.subscription_status}</span>
                    : <span style={{ color: 'var(--text-hint)' }}>—</span>}
                </td>
                <td style={{ padding: '14px 12px', color: 'var(--text-secondary)' }}>{u.invoice_count}</td>
                <td style={{ padding: '14px 12px', color: 'var(--text-secondary)', textTransform: 'capitalize', fontSize: '13px' }}>{u.payment_gateway || '—'}</td>
                <td style={{ padding: '14px 12px', color: 'var(--text-secondary)', fontSize: '13px' }}>{new Date(u.created_at).toLocaleDateString()}</td>
                <td style={{ padding: '14px 20px' }}>
                  <button
                    onClick={() => { setSelected(u); setNewPlan(u.plan); }}
                    style={{ background: 'var(--brand-light)', color: 'var(--brand-dark)', border: 'none', borderRadius: '8px', padding: '6px 14px', fontSize: '12px', fontWeight: '600', cursor: 'pointer' }}
                  >
                    Change Plan
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Plan Change Modal */}
      {selected && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.4)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}>
          <div className="card" style={{ width: '400px', padding: '28px' }}>
            <h3 style={{ margin: '0 0 4px', fontSize: '18px' }}>Change Plan</h3>
            <p style={{ color: 'var(--text-secondary)', fontSize: '14px', margin: '0 0 20px' }}>{selected.name} · {selected.email}</p>

            <div style={{ marginBottom: '20px' }}>
              <label style={{ display: 'block', fontSize: '13px', fontWeight: '600', marginBottom: '8px' }}>New Plan</label>
              <select
                className="input"
                value={newPlan}
                onChange={e => setNewPlan(e.target.value)}
              >
                <option value="free">Free — $0/mo</option>
                <option value="pro">Pro — $29.99/mo</option>
              </select>
            </div>

            <div style={{ display: 'flex', gap: '12px' }}>
              <button onClick={handlePlanChange} disabled={saving} className="btn-primary" style={{ flex: 1 }}>
                {saving ? 'Saving...' : 'Confirm Change'}
              </button>
              <button onClick={() => setSelected(null)} className="btn-ghost" style={{ flex: 1 }}>
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminUsers;
